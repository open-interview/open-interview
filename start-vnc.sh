#!/bin/sh
# Minimal VNC launcher - starts and exits quickly
ROOTFS="$HOME/ubuntu-rootfs"
nix shell nixpkgs#proot --command proot -S "$ROOTFS" -b /nix:/nix /bin/sh << 'EOF'
unset PORT
export PATH=/usr/sbin:/usr/bin:/sbin:/bin
export DISPLAY=:99

rm -f /tmp/.X99-lock /tmp/.X11-unix/X99
Xvfb :99 -screen 0 1280x720x24 &
sleep 2
fluxbox &
sleep 1
x11vnc -display :99 -forever -nopw -noxdamage -localhost -rfbport 15900 &
sleep 1
websockify --web /usr/share/novnc 16080 localhost:15900
EOF