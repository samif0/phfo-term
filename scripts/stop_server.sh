#!/bin/bash
set -e
if [ -f "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
  nvm use 22
fi
pm2 stop app-443 || true
pm2 stop app-80 || true
pm2 stop app || true
