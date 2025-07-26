#!/bin/bash
set -e
cd /home/ec2-user/app

# Install nvm if not present
if [ ! -d "$HOME/.nvm" ]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi
. "$HOME/.nvm/nvm.sh"

nvm install 22
nvm use 22

# Install global tools and dependencies
npm install -g pnpm@8 pm2
sudo rm -f pnpm-lock.yaml
pnpm install

