#!/bin/bash
set -e

LOG_DIR="/var/log/deploys"
LOG_FILE="$LOG_DIR/securegate-sandbox.log"
sudo mkdir -p "$LOG_DIR"
sudo chown "$(whoami):$(whoami)" "$LOG_DIR"

REF="$1"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

exec > >(tee -a "$LOG_FILE") 2>&1

echo ""
echo "===================================================="
echo "[$TIMESTAMP] Deploy started — ref: $REF"
echo "===================================================="

trap 'echo "[$(date "+%Y-%m-%d %H:%M:%S")] DEPLOY FAILED — ref: $REF"; exit 1' ERR

cd /var/www/securegate-sandbox/app

echo "Checking out ref: $REF"
git fetch origin
git checkout "$REF"
git pull origin "$REF" || true

echo "Installing dependencies..."
npm ci

echo "Syncing DB schema..."
npx prisma generate
npx prisma db push

echo "Building app..."
npm run build

echo "Restarting app..."
pm2 restart securegate-sandbox --update-env

echo "Verifying health..."
sleep 2
if curl -sf -o /dev/null https://sandbox.securegate.my.id; then
  echo "Health check passed."
else
  echo "WARNING: health check failed after deploy — check pm2 logs manually."
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deploy SUCCEEDED — ref: $REF"
