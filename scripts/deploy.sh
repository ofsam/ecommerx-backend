#!/usr/bin/env bash
set -euo pipefail

# Deploy ecommerx-backend to your VPS.
#
# First time on server:
#   sudo apt update && sudo apt install -y nodejs npm nginx git
#   sudo npm install -g pm2
#   mkdir -p /var/www/ecommerx-backend
#   scp .env user@server:/var/www/ecommerx-backend/.env
#
# From your Mac:
#   export DEPLOY_HOST="user@your-server-ip"
#   export DEPLOY_PATH="/var/www/ecommerx-backend"
#   ./scripts/deploy.sh

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_HOST="${DEPLOY_HOST:?Set DEPLOY_HOST, e.g. ubuntu@203.0.113.10}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/ecommerx-backend}"

echo "Deploying to ${DEPLOY_HOST}:${DEPLOY_PATH}"

rsync -avz --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude .env \
  --exclude .DS_Store \
  "${ROOT}/" "${DEPLOY_HOST}:${DEPLOY_PATH}/"

ssh "${DEPLOY_HOST}" bash -s <<EOF
set -euo pipefail
cd "${DEPLOY_PATH}"

if [ ! -f .env ]; then
  echo "ERROR: .env missing on server. Copy it first:"
  echo "  scp .env ${DEPLOY_HOST}:${DEPLOY_PATH}/.env"
  exit 1
fi

export NODE_ENV=production
npm ci --omit=dev

if pm2 describe ecommerx-api >/dev/null 2>&1; then
  pm2 restart ecosystem.config.cjs --update-env
else
  pm2 start ecosystem.config.cjs
fi

pm2 save
echo "Deploy complete. API should be on port \$(grep -E '^PORT=' .env | cut -d= -f2 || echo 5000)"
EOF

echo "Done. Test: curl http://YOUR_SERVER_IP:5000/api-docs/ (or via nginx domain)"
