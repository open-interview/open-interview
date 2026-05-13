#!/usr/bin/env bash
set -e

ROOTFS="$HOME/ubuntu-rootfs"
ROOTFS_TAR="$ROOTFS/rootfs.tar.xz"
WORKSPACE="/home/runner/workspace"
VNC_PORT=5901
WEB_PORT=16080
DISPLAY_NUM=99
KIRO_DIR="/home/runner/.local/share/kiro"

echo "=== Ubuntu GUI via proot ==="

# 0. Full cleanup
echo "Cleaning up..."
for p in $(ps aux | grep -E "Xvfb|x11vnc|x0vnc|fluxbox|websockify|rfbproxy" | grep -v grep | awk '{print $2}'); do
  kill -9 "$p" 2>/dev/null || true
done
pkill -f "proot.*start-gui.sh" 2>/dev/null || true
sleep 2
rm -f /tmp/.X${DISPLAY_NUM}-lock /tmp/.X11-unix/X${DISPLAY_NUM}

# 1. Install proot if needed
if ! command -v proot &>/dev/null; then
  nix shell nixpkgs#proot --command true
fi

# 2. Setup rootfs
if [ ! -d "$ROOTFS/bin" ]; then
  echo "Downloading Ubuntu 24.04..."
  mkdir -p "$ROOTFS"
  curl -sL "https://cloud-images.ubuntu.com/noble/current/noble-server-cloudimg-amd64-root.tar.xz" -o "$ROOTFS_TAR"
  tar xf "$ROOTFS_TAR" -C "$ROOTFS" 2>/dev/null || true
  mkdir -p "$ROOTFS/dev"
fi

# 3. Write startup script inside rootfs (Xvfb + fluxbox + kiro only, no x11vnc)
cat > "$ROOTFS/root/start-gui.sh" << 'SCRIPT'
#!/bin/sh
export PATH=/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export DISPLAY=:99

rm -f /tmp/.X99-lock /tmp/.X11-unix/X99
Xvfb :99 -screen 0 1280x720x24 &
sleep 2
fluxbox &
sleep 1
websockify --web /usr/share/novnc 16080 localhost:5901 &
sleep 1

if [ -x /usr/local/bin/kiro ]; then
  export LD_LIBRARY_PATH=/opt/kiro-ide
  export GDK_PIXBUF_MODULE_FILE=/usr/lib/x86_64-linux-gnu/gdk-pixbuf-2.0/2.10.0/loaders.cache
  export GDK_PIXBUF_MODULEDIR=/usr/lib/x86_64-linux-gnu/gdk-pixbuf-2.0/2.10.0/loaders
  nohup /usr/local/bin/kiro --no-sandbox --disable-gpu > /tmp/kiro-ide.log 2>&1 &
fi

echo "READY"
tail -f /dev/null
SCRIPT
chmod +x "$ROOTFS/root/start-gui.sh"

# 4. Install GUI packages (once)
echo "Checking/installing packages..."
nix shell nixpkgs#proot --command \
  proot -S "$ROOTFS" -b /nix:/nix -b "$WORKSPACE:/workspace" -w /root \
  /bin/sh -c "unset PORT; export PATH=/usr/sbin:/usr/bin:/sbin:/bin; \
    dpkg -l xvfb &>/dev/null || { \
      apt-get update -qq && \
      apt-get install -y -qq xvfb x11vnc fluxbox xterm novnc x11-apps 2>&1 | tail -3; \
    }"

# 5. Start GUI services in background
echo "Starting GUI services..."
nix shell nixpkgs#proot --command \
  proot -S "$ROOTFS" -b /nix:/nix -b "$WORKSPACE:/workspace" -b "$KIRO_DIR:/opt/kiro-ide" -w /root \
  /bin/sh /root/start-gui.sh &
PROOT_PID=$!

# 6. Wait for Xvfb to be ready
sleep 6

# 6a. Start x0vncserver on host (connects to Xvfb :99, no port conflict)
echo "Starting x0vncserver..."
pkill -f "x0vncserver" 2>/dev/null || true
sleep 1
x0vncserver -display :99 -rfbport 5901 -localhost -SecurityTypes=None &
sleep 1

# 6b. Start rfbproxy for Replit VNC tab
echo "Starting rfbproxy for Replit VNC tab..."
pkill -f "rfbproxy" 2>/dev/null || true
sleep 1
rfbproxy --rfb-server 127.0.0.1:5901 --address 0.0.0.0:5900 &
sleep 1

echo ""
echo "=== Health checks ==="

VNC_OK=0
python3 -c "
import socket
try:
  s = socket.socket()
  s.settimeout(5)
  s.connect(('127.0.0.1', $VNC_PORT))
  data = s.recv(12)
  print(f'[VNC] port $VNC_PORT: OK ({data.decode().strip()})')
  s.close()
except Exception as e:
  print(f'[VNC] port $VNC_PORT: FAIL ({e})')
  exit(1)
" && VNC_OK=1 || VNC_OK=0

WEB_OK=0
if curl -sL http://127.0.0.1:$WEB_PORT/vnc.html 2>/dev/null | head -1 | grep -q DOCTYPE; then
  echo "[WEB] port $WEB_PORT: OK"
  WEB_OK=1
else
  echo "[WEB] port $WEB_PORT: FAIL"
fi

ss -tlnp 2>/dev/null | grep -E "$VNC_PORT|$WEB_PORT|5900" | while read line; do
  echo "  $line"
done

echo ""
echo "============================================"
echo "  Ubuntu GUI is RUNNING"
echo "============================================"
echo ""
echo "  noVNC Web UI: http://localhost:$WEB_PORT/vnc.html"
echo "  VNC direct:   localhost:$VNC_PORT"
echo "  Replit VNC:   Use the 'VNC' tab (rfbproxy :5900 -> :5901)"
echo "  Display:      :$DISPLAY_NUM"
echo ""
echo "  Run GUI apps:"
echo "    nix shell nixpkgs#proot --command \\"
echo "      proot -S $ROOTFS -b /nix:/nix -b $WORKSPACE:/workspace -b $KIRO_DIR:/opt/kiro-ide -w /root \\"
echo '      /bin/sh -c "unset PORT; export PATH=/usr/sbin:/usr/bin:/sbin:/bin; export DISPLAY=:99; cd /workspace; xeyes &"'
echo ""
echo "  Install apps:"
echo "    nix shell nixpkgs#proot --command \\"
echo "      proot -S $ROOTFS -b /nix:/nix -b $WORKSPACE:/workspace -w /root \\"
echo '      /bin/sh -c "unset PORT; export PATH=/usr/sbin:/usr/bin:/sbin:/bin; apt install firefox"'
echo ""
echo "  Workspace mounted at /workspace"
echo "============================================"
echo ""

if [ "$VNC_OK" = 1 ] && [ "$WEB_OK" = 1 ]; then
  echo "✓ All services healthy. Press Ctrl+C to stop."
else
  echo "✗ WARNING: Some services failed health check!"
  kill "$PROOT_PID" 2>/dev/null || true
  exit 1
fi

wait "$PROOT_PID"
