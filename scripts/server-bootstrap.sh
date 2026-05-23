#!/usr/bin/env bash
# Run ONCE on a fresh Ubuntu/Debian VPS (as root or with sudo).
set -euo pipefail

apt-get update
apt-get install -y curl git nginx

# Node.js 20 LTS
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

npm install -g pm2

APP_DIR="${APP_DIR:-/var/www/ecommerx-backend}"
mkdir -p "${APP_DIR}"
chown -R "${SUDO_USER:-$USER}:${SUDO_USER:-$USER}" "${APP_DIR}" 2>/dev/null || true

echo "Bootstrap done."
echo "Next: copy .env to ${APP_DIR}/.env, run deploy.sh from your laptop."
