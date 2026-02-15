#!/bin/bash
# MoltBot Server Setup Script for Digital Ocean Droplet
# Run this script after SSH'ing into a fresh Ubuntu 24.04 droplet
#
# Usage: ./setup.sh
#
# Prerequisites:
# 1. Ubuntu 24.04 LTS droplet
# 2. DNS A record pointing moltbot.doughy.app to droplet IP
# 3. .env file with all required variables

set -e  # Exit on any error

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           MoltBot Server Setup Script                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (sudo ./setup.sh)"
  exit 1
fi

# ============================================================================
# Step 1: System Update
# ============================================================================
echo "📦 Step 1: Updating system packages..."
apt update && apt upgrade -y

# ============================================================================
# Step 2: Install Node.js 20
# ============================================================================
echo "📦 Step 2: Installing Node.js 20..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# ============================================================================
# Step 3: Install PM2
# ============================================================================
echo "📦 Step 3: Installing PM2..."
npm install -g pm2

# ============================================================================
# Step 4: Install Nginx and Certbot
# ============================================================================
echo "📦 Step 4: Installing Nginx and Certbot..."
apt install -y nginx certbot python3-certbot-nginx

# ============================================================================
# Step 5: Create App Directory
# ============================================================================
echo "📁 Step 5: Creating app directory..."
mkdir -p /var/www/moltbot
mkdir -p /var/log/moltbot
chown -R www-data:www-data /var/www/moltbot
chown -R www-data:www-data /var/log/moltbot

# ============================================================================
# Step 6: Setup Instructions
# ============================================================================
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           Manual Steps Required                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "1. Upload application files:"
echo "   From your local machine, run:"
echo "   scp -r moltbot-server/* root@YOUR_DROPLET_IP:/var/www/moltbot/"
echo ""
echo "2. Create .env file:"
echo "   cp /var/www/moltbot/.env.example /var/www/moltbot/.env"
echo "   nano /var/www/moltbot/.env"
echo "   (fill in all values)"
echo ""
echo "3. Install dependencies and build:"
echo "   cd /var/www/moltbot"
echo "   npm install"
echo "   npm run build"
echo ""
echo "4. Setup Nginx:"
echo "   cp /var/www/moltbot/deploy/nginx.conf /etc/nginx/sites-available/moltbot"
echo "   ln -s /etc/nginx/sites-available/moltbot /etc/nginx/sites-enabled/"
echo "   rm /etc/nginx/sites-enabled/default  # Remove default site"
echo "   nginx -t"
echo ""
echo "5. Get SSL certificate (wait for DNS to propagate first!):"
echo "   certbot --nginx -d moltbot.doughy.app"
echo ""
echo "6. Start the application:"
echo "   cd /var/www/moltbot"
echo "   pm2 start ecosystem.config.cjs"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "7. Set up cron for watch renewal:"
echo "   crontab -e"
echo "   Add: 0 0 * * * curl -X POST -H \"x-cron-secret: YOUR_SECRET\" https://moltbot.doughy.app/cron/renew-watches"
echo ""
echo "8. Test the setup:"
echo "   curl https://moltbot.doughy.app/health"
echo ""
echo "✅ Base setup complete!"
