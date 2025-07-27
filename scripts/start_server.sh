#!/bin/bash
set -e
cd /home/ec2-user/app

. "$HOME/.nvm/nvm.sh"
nvm use 22

pnpm build

pm2 restart app || pm2 start pnpm --name "app" -- start
