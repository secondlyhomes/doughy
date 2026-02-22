#!/usr/bin/env bash
# Deploy OpenClaw platform components to the DigitalOcean droplet.
# Usage: ./deploy.sh [component]
#   component: all | bridge | tools | queue | config
#
# Prerequisites: SSH key configured as `ssh claw`, Tailscale connected

set -euo pipefail

DROPLET="claw"
REMOTE_DIR="/var/www/openclaw"

case "${1:-all}" in
  bridge)
    echo "==> Building webhook bridge..."
    cd ../webhook-bridge && npm run build
    echo "==> Deploying webhook bridge..."
    rsync -avz --exclude='node_modules' --exclude='.env' \
      ../webhook-bridge/ "$DROPLET:$REMOTE_DIR/webhook-bridge/"
    ssh "$DROPLET" "cd $REMOTE_DIR/webhook-bridge && npm install --production && pm2 restart webhook-bridge --update-env"
    ;;

  tools)
    echo "==> Building Supabase MCP server..."
    cd ../tools && npm run build
    echo "==> Deploying MCP server..."
    rsync -avz --exclude='node_modules' --exclude='.env' \
      ../tools/ "$DROPLET:$REMOTE_DIR/tools/"
    ssh "$DROPLET" "cd $REMOTE_DIR/tools && npm install --production"
    echo "MCP server deployed. Restart OpenClaw gateway to pick up changes."
    ;;

  queue)
    echo "==> Building queue processor..."
    cd ../queue-processor && npm run build
    echo "==> Deploying queue processor..."
    rsync -avz --exclude='node_modules' --exclude='.env' \
      ../queue-processor/ "$DROPLET:$REMOTE_DIR/queue-processor/"
    ssh "$DROPLET" "cd $REMOTE_DIR/queue-processor && npm install --production && pm2 restart queue-processor --update-env"
    ;;

  config)
    echo "==> Deploying OpenClaw config + workspaces..."
    rsync -avz --exclude='.env' --exclude='deploy.sh' \
      ./ "$DROPLET:$REMOTE_DIR/config/"
    echo "Config deployed. Restart OpenClaw gateway to apply."
    ;;

  all)
    echo "==> Full deployment..."
    "$0" tools
    "$0" bridge
    "$0" queue
    "$0" config
    echo "==> All components deployed."
    ;;

  *)
    echo "Usage: $0 [all|bridge|tools|queue|config]"
    exit 1
    ;;
esac
