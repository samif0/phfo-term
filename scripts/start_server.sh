#!/bin/bash
set -e
cd /home/ec2-user/app

. "$HOME/.nvm/nvm.sh"
nvm use 22

pnpm build

sudo setcap 'cap_net_bind_service=+ep' $(command -v node)

pm2 restart app-443 || pm2 start pnpm --name "app-443" -- start -p 443
pm2 restart app-80 || pm2 start pnpm --name "app-80" -- start -p 80
