#!/bin/bash
mkdir -p ~/.kiro/sessions
rm -rf ~/.kiro/sessions/cli
ln -s /home/runner/workspace/.kiro/sessions ~/.kiro/sessions/cli
echo "Symlink restored: ~/.kiro/sessions/cli -> /home/runner/workspace/.kiro/sessions"

# Restore .local: move contents to workspace, then symlink
if [ ! -L ~/.local ]; then
  cp -a ~/.local/. /home/runner/workspace/.local/
  rm -rf ~/.local
fi
ln -sf /home/runner/workspace/.local ~/.local
echo "Symlink restored: ~/.local -> /home/runner/workspace/.local"
