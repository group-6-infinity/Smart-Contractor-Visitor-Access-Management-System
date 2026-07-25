#!/bin/bash
set -e

# Auto-detect environment dari current directory
CURRENT_DIR=$(pwd)
if [[ "$CURRENT_DIR" == *"production"* ]]; then
  ENV="production"
  APP_NAME="securegate-production"
  HEALTH_URL="https://securegate.my.id"
else
  ENV="sandbox"
  APP_NAME="securegate-sandbox"
  HEALTH_URL="https://sandbox.securegate.my.id"
fi

LOG_DIR="/var/log/deploys"
LOG_FILE="$LOG_DIR/securegate-$ENV.log"
sudo mkdir -p "$LOG_DIR"
sudo chown "$(whoami):$(whoami)" "$LOG_DIR"

REF="${1:-$(git rev-parse --abbrev-ref HEAD)}"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

exec > >(tee -a "$LOG_FILE") 2>&1

echo ""
echo "===================================================="
echo "[$TIMESTAMP] Deploy started — env: $ENV — ref: $REF"
echo "===================================================="

trap 'echo "[$(date "+%Y-%m-%d %H:%M:%S")] DEPLOY FAILED — ref: $REF"; exit 1' ERR

git fetch origin
git checkout "$REF"
git reset --hard "origin/$REF"

echo "Installing dependencies..."
npm ci

echo "Syncing DB schema..."
npx prisma generate
npx prisma db push

echo "Building app..."
npm run build

echo "Restarting app ($APP_NAME)..."
pm2 restart "$APP_NAME" --update-env

echo "Verifying health..."
sleep 2
if curl -sf -o /dev/null "$HEALTH_URL"; then
  echo "Health check passed."
else
  echo "WARNING: health check failed — check pm2 logs manually."
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deploy SUCCEEDED — env: $ENV — ref: $REF"
