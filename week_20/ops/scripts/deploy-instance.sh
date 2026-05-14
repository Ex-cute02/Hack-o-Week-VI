#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/campus-pulse}"
BRANCH="${BRANCH:-main}"

cd "$APP_DIR"

git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

npm ci --workspaces --include-workspace-root=false
npm run build --workspace frontend

pm2 reload ecosystem.config.js --update-env

for i in {1..20}; do
  if curl -fsS "http://localhost:4000/api/healthz" >/dev/null; then
    echo "Health check passed"
    exit 0
  fi
  sleep 1
done

echo "Health check failed"
exit 1
