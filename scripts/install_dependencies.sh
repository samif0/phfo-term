#!/bin/bash
set -e
APP_DIR=/home/ec2-user/app
# Ensure the deployment directory is owned by ec2-user
sudo chown -R ec2-user:ec2-user "$APP_DIR"
cd "$APP_DIR"

# Install nvm if not present
if [ ! -d "$HOME/.nvm" ]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi
. "$HOME/.nvm/nvm.sh"

nvm install 22
nvm use 22


# Install global tools and dependencies
npm install -g pnpm@8 pm2
rm -f pnpm-lock.yaml
pnpm install

# Build the application to ensure there are no compile-time errors before
# starting the server. This mirrors the build step used in development and
# prevents broken deployments from reaching production.
pnpm build

