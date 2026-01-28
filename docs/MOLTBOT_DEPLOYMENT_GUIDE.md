# MoltBot Deployment Guide

Complete guide for deploying MoltBot Gateway to DigitalOcean with Google Cloud Pub/Sub integration.

**Last Updated:** January 28, 2026
**Server:** https://moltbot.doughy.app
**IP:** 157.245.218.123

---

## Table of Contents

1. [DigitalOcean Setup](#1-digitalocean-setup)
2. [DNS Configuration](#2-dns-configuration)
3. [Server Setup](#3-server-setup)
4. [Application Deployment](#4-application-deployment)
5. [Nginx & SSL](#5-nginx--ssl)
6. [Google Cloud Pub/Sub Setup](#6-google-cloud-pubsub-setup)
7. [Environment Variables](#7-environment-variables)
8. [Troubleshooting](#8-troubleshooting)
9. [Maintenance Commands](#9-maintenance-commands)

---

## 1. DigitalOcean Setup

### Create Droplet

| Setting | Value |
|---------|-------|
| **Region** | SFO3 (San Francisco) |
| **OS** | Ubuntu 24.04 (LTS) x64 |
| **Size** | $6/mo - 1 vCPU, 1GB RAM, 25GB SSD |
| **Backups** | Usage-based Daily (~$0.15-0.30/mo) |
| **Auth** | SSH Key |
| **Hostname** | `doughy-moltbot-prod` |
| **Tags** | `doughy`, `moltbot`, `prod` |

### Hostname Naming Convention

```
Pattern: {project}-{service}-{environment}

Production:  doughy-moltbot-prod
Staging:     doughy-moltbot-stage
```

### SSH Key Setup

If using Bitwarden-generated SSH key:

1. Generate SSH key in Bitwarden
2. Add public key to DigitalOcean during droplet creation
3. Export private key from Bitwarden
4. Save to local machine:

```bash
# Create the key file
nano ~/.ssh/do_moltbot
# Paste private key, save

# Set permissions
chmod 600 ~/.ssh/do_moltbot

# Test connection
ssh -i ~/.ssh/do_moltbot root@YOUR_DROPLET_IP
```

---

## 2. DNS Configuration

Add A record in your DNS provider:

| Type | Name | Value |
|------|------|-------|
| A | `moltbot` | `157.245.218.123` |

Creates: `moltbot.doughy.app`

Verify propagation:
```bash
dig moltbot.doughy.app +short
```

---

## 3. Server Setup

### Connect to Server

```bash
ssh -i ~/.ssh/do_moltbot root@157.245.218.123
```

### Install Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify
node --version  # Should be v20.x
npm --version

# Install PM2
npm install -g pm2

# Install Nginx, Certbot, tools
apt install -y nginx certbot python3-certbot-nginx git htop ufw
```

### Configure Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status
```

### Create Directories

```bash
mkdir -p /var/www/moltbot
mkdir -p /var/log/moltbot
```

### Add Swap Space (Required for TypeScript builds)

The 1GB droplet runs out of memory during TypeScript compilation. Add swap:

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h  # Verify swap is active
```

---

## 4. Application Deployment

### Option A: Build Locally, Upload Compiled Files (Recommended)

On your local machine:

```bash
cd /path/to/doughy-ai/moltbot-server

# Install dependencies
npm install

# Build TypeScript
npm run build

# Upload to server (excluding node_modules and .env)
rsync -avz --exclude 'node_modules' --exclude '.env' \
  -e "ssh -i ~/.ssh/do_moltbot" \
  ./ root@157.245.218.123:/var/www/moltbot/
```

### Option B: Build on Server (Requires Swap)

```bash
# On server
cd /var/www/moltbot
npm install
npm run build
```

### Install Production Dependencies on Server

```bash
ssh -i ~/.ssh/do_moltbot root@157.245.218.123
cd /var/www/moltbot
npm install --production
```

---

## 5. Nginx & SSL

### Create Nginx Config

```bash
cat > /etc/nginx/sites-available/moltbot << 'EOF'
server {
    listen 80;
    server_name moltbot.doughy.app;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }
}
EOF
```

### Enable Site

```bash
ln -sf /etc/nginx/sites-available/moltbot /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

### Get SSL Certificate

```bash
certbot --nginx -d moltbot.doughy.app --non-interactive --agree-tos --email admin@doughy.app --redirect
```

### Verify Auto-Renewal

```bash
certbot renew --dry-run
systemctl status certbot.timer
```

---

## 6. Google Cloud Pub/Sub Setup

### Prerequisites

- Google Cloud project (e.g., `doughy-458407`)
- Gmail API enabled
- Cloud Pub/Sub API enabled

### Enable APIs

1. Go to Google Cloud Console → APIs & Services → Library
2. Search and enable:
   - **Gmail API**
   - **Cloud Pub/Sub API**

### Create Pub/Sub Topic

1. Go to Pub/Sub (search in console)
2. Click **Create Topic**
3. Topic ID: `gmail-notifications`
4. Click Create

### Grant Gmail Permission to Publish

1. Click on `gmail-notifications` topic
2. Click **Permissions** tab
3. Click **Add Principal**
4. Principal: `gmail-api-push@system.gserviceaccount.com`
5. Role: **Pub/Sub Publisher**
6. Click Save

### Create Push Subscription

1. On the topic page, click **Create Subscription**
2. Subscription ID: `gmail-push`
3. Delivery type: **Push**
4. Endpoint URL: `https://moltbot.doughy.app/webhooks/gmail`
5. Acknowledgement deadline: **30** seconds
6. Click Create

---

## 7. Environment Variables

### Create .env File

```bash
cat > /var/www/moltbot/.env << 'EOF'
# Server Configuration
PORT=3000
NODE_ENV=production
SERVER_URL=https://moltbot.doughy.app

# Supabase Configuration
SUPABASE_URL=https://lqmbyobweeaigrwmvizo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Google OAuth Configuration (for Gmail)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://moltbot.doughy.app/oauth/gmail/callback

# Google Cloud Project (for Pub/Sub)
GOOGLE_CLOUD_PROJECT_ID=doughy-458407
GMAIL_PUBSUB_TOPIC=gmail-notifications

# Anthropic API (for AI responses)
ANTHROPIC_API_KEY=your-anthropic-key

# WhatsApp (optional)
WHATSAPP_VERIFY_TOKEN=moltbot-whatsapp-verify

# Cron Security
CRON_SECRET=generate-with-openssl-rand-hex-32
EOF

chmod 600 /var/www/moltbot/.env
```

### Generate Cron Secret

```bash
openssl rand -hex 32
```

---

## 8. Troubleshooting

### Command Line Whitespace Issues

When copying multi-line commands from documentation, line breaks can cause issues in terminals. Solutions:

**Problem:** Command splits across lines and fails
```bash
# BAD - line breaks cause issues
gcloud organizations \
  add-iam-policy-binding ORG_ID \
  --member="user:email" \
  --role="roles/orgpolicy.policyAdmin"
```

**Solution 1:** Use single-line commands
```bash
# GOOD - all on one line
gcloud organizations add-iam-policy-binding 110093459941 --member="user:dino@secondlyhomes.com" --role="roles/orgpolicy.policyAdmin"
```

**Solution 2:** Use printf for multi-line content
```bash
# GOOD - printf handles newlines properly
printf 'line1\nline2\nline3\n' > /tmp/file.yaml
```

**Solution 3:** Use heredoc with single quotes to prevent expansion
```bash
cat > /tmp/file.yaml << 'EOF'
content here
more content
EOF
```

### YAML Formatting Issues

YAML is whitespace-sensitive. Common mistakes:

```yaml
# BAD - missing space after dash
rules:
-allowAll: true

# GOOD - space after dash
rules:
  - allowAll: true
```

---

### Google Cloud Organization Policy Error

**Error:** `The 'Domain Restricted Sharing' organization policy (constraints/iam.allowedPolicyMemberDomains) is enforced`

This happens when trying to add `gmail-api-push@system.gserviceaccount.com` to Pub/Sub permissions when your Google Cloud is part of an organization (e.g., Google Workspace) that restricts external service accounts.

**Why this happens:**
- Your Google Cloud project is under a Google Workspace organization
- The organization has a policy restricting who can be added to IAM
- `gmail-api-push@system.gserviceaccount.com` is a Google service account, not in your org

**Solution (via Cloud Shell):**

1. Open Cloud Shell (click terminal icon `>_` in top-right of Google Cloud Console)

2. Get your organization ID:
```bash
gcloud organizations list
```
Output example:
```
DISPLAY_NAME: secondlyhomes.com
ID: 110093459941
DIRECTORY_CUSTOMER_ID: C02ulfj8u
```

3. Grant yourself Organization Policy Administrator role:
```bash
gcloud organizations add-iam-policy-binding 110093459941 --member="user:dino@secondlyhomes.com" --role="roles/orgpolicy.policyAdmin"
```

**Note:** Even if you're "Owner" of the Workspace, you may not have this Cloud role by default. Being Owner in Workspace != having all Cloud IAM roles.

4. Create the policy file (MUST be single-line printf to avoid whitespace issues):
```bash
printf 'name: organizations/110093459941/policies/iam.allowedPolicyMemberDomains\nspec:\n  rules:\n    - allowAll: true\n' > /tmp/policy.yaml
```

5. Verify the file looks correct:
```bash
cat /tmp/policy.yaml
```
Should output:
```yaml
name: organizations/110093459941/policies/iam.allowedPolicyMemberDomains
spec:
  rules:
    - allowAll: true
```

6. Apply the policy (will prompt to enable orgpolicy API if needed):
```bash
gcloud org-policies set-policy /tmp/policy.yaml
```

7. Now go back to Pub/Sub → Topics → gmail-notifications → Permissions → Add Principal:
   - Principal: `gmail-api-push@system.gserviceaccount.com`
   - Role: Pub/Sub Publisher
   - Should work now!

**Common errors during this process:**

| Error | Solution |
|-------|----------|
| `unrecognized arguments: --organization=` | Don't use `--organization` flag with `set-policy`, the org is in the YAML file |
| `Permission denied` when running gcloud org commands | Run the `add-iam-policy-binding` command first to give yourself the role |
| `-allowAll: true` parse error | Missing space after dash. Must be `- allowAll: true` (space after `-`) |
| `Must be specified` error | Command got split across lines. Copy as single line. |

**Our org details:**
- Org ID: `110093459941`
- Domain: `secondlyhomes.com`
- Project: `doughy-458407`

### TypeScript Build Out of Memory

**Error:** `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory`

**Solution:** Add swap space (see Server Setup section) or build locally and upload compiled files.

### 502 Bad Gateway After Restart

**Cause:** Brief moment when app is restarting.

**Solution:** Wait 3-5 seconds and try again. If persistent:

```bash
# Check if app is running
pm2 status

# Check local health
curl http://localhost:3000/health

# Check logs
pm2 logs moltbot --lines 50
```

### SSH Permission Denied

**Error:** `Permission denied (publickey)`

**Solution:**

1. Verify key file permissions:
```bash
chmod 600 ~/.ssh/do_moltbot
```

2. Specify key explicitly:
```bash
ssh -i ~/.ssh/do_moltbot root@157.245.218.123
```

3. If key doesn't match, use DigitalOcean console to add correct key:
   - Go to Droplets → Access → Launch Droplet Console
   - Run:
   ```bash
   echo 'your-public-key-here' >> ~/.ssh/authorized_keys
   ```

### PM2 Not Finding .env Variables

After editing `.env`, restart with:

```bash
pm2 restart moltbot --update-env
```

Or delete and restart:

```bash
pm2 delete moltbot
cd /var/www/moltbot
pm2 start ecosystem.config.cjs
pm2 save
```

---

## 9. Maintenance Commands

### Quick Reference

| Task | Command |
|------|---------|
| SSH in | `ssh -i ~/.ssh/do_moltbot root@157.245.218.123` |
| View logs | `pm2 logs moltbot` |
| View last 100 lines | `pm2 logs moltbot --lines 100 --nostream` |
| Restart app | `pm2 restart moltbot` |
| Stop app | `pm2 stop moltbot` |
| Check status | `pm2 status` |
| Health check | `curl https://moltbot.doughy.app/health` |
| Edit .env | `nano /var/www/moltbot/.env` |
| Restart nginx | `systemctl reload nginx` |
| Check nginx config | `nginx -t` |
| View nginx logs | `tail -f /var/log/nginx/error.log` |

### PM2 Setup for Auto-Restart

```bash
pm2 startup systemd -u root --hp /root
pm2 save
```

### Cron Job for Gmail Watch Renewal

```bash
# View current cron
crontab -l

# Edit cron
crontab -e

# Add this line (runs daily at midnight):
0 0 * * * curl -s -X POST -H "x-cron-secret: YOUR_CRON_SECRET" https://moltbot.doughy.app/cron/renew-watches >> /var/log/moltbot/cron.log 2>&1
```

### Deploy Updates

From local machine:

```bash
cd /path/to/doughy-ai/moltbot-server

# Build locally
npm run build

# Upload changes
rsync -avz --exclude 'node_modules' --exclude '.env' \
  -e "ssh -i ~/.ssh/do_moltbot" \
  ./ root@157.245.218.123:/var/www/moltbot/

# Restart on server
ssh -i ~/.ssh/do_moltbot root@157.245.218.123 "pm2 restart moltbot"
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    MOLTBOT GATEWAY                              │
│                    (DigitalOcean Droplet)                       │
│                    157.245.218.123                              │
├─────────────────────────────────────────────────────────────────┤
│  Nginx (port 80/443) → Node.js (port 3000) via PM2             │
│                                                                 │
│  Endpoints:                                                     │
│  ├─ GET  /health                 Health check                   │
│  ├─ POST /webhooks/gmail         Gmail Pub/Sub webhook          │
│  ├─ POST /webhooks/whatsapp      WhatsApp webhook               │
│  ├─ POST /webhooks/telegram      Telegram webhook               │
│  ├─ POST /webhooks/sms           SMS/Twilio webhook             │
│  ├─ GET  /oauth/gmail/start      Start Gmail OAuth              │
│  ├─ GET  /oauth/gmail/callback   Gmail OAuth callback           │
│  └─ POST /cron/renew-watches     Renew Gmail watches            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GOOGLE CLOUD                                 │
│                    Project: doughy-458407                       │
├─────────────────────────────────────────────────────────────────┤
│  Pub/Sub Topic: gmail-notifications                             │
│  Subscription: gmail-push → https://moltbot.doughy.app/webhooks/gmail
│                                                                 │
│  Gmail watches publish to topic when new emails arrive          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE                                     │
│                    lqmbyobweeaigrwmvizo.supabase.co             │
├─────────────────────────────────────────────────────────────────┤
│  Tables: user_gmail_tokens, crm_contacts, rental_*              │
│  Edge Functions: moltbot-bridge, ai-responder, lead-scorer      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Complete Command Reference

All commands from our January 28, 2026 deployment, in order:

### Server Setup Commands

```bash
# SSH into server
ssh -i ~/.ssh/do_moltbot root@157.245.218.123

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify Node
node --version
npm --version

# Install PM2 globally
npm install -g pm2

# Install Nginx, Certbot, and tools
apt install -y nginx certbot python3-certbot-nginx git htop ufw

# Configure firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status

# Create directories
mkdir -p /var/www/moltbot
mkdir -p /var/log/moltbot

# Add swap (IMPORTANT for TypeScript builds)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h
```

### Local Build & Upload Commands

```bash
# On local machine
cd /path/to/doughy-ai/moltbot-server

# Install dependencies
npm install

# Build TypeScript
npm run build

# Upload to server (excluding node_modules and .env)
rsync -avz --exclude 'node_modules' --exclude '.env' -e "ssh -i /Users/dinosaur/.ssh/do_moltbot" /Users/dinosaur/Developer/doughy-ai/moltbot-server/ root@157.245.218.123:/var/www/moltbot/

# Upload just the dist folder
rsync -avz -e "ssh -i /Users/dinosaur/.ssh/do_moltbot" /Users/dinosaur/Developer/doughy-ai/moltbot-server/dist/ root@157.245.218.123:/var/www/moltbot/dist/
```

### Nginx Setup Commands

```bash
# Create nginx config (run on server)
cat > /etc/nginx/sites-available/moltbot << 'EOF'
server {
    listen 80;
    server_name moltbot.doughy.app;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/moltbot /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# Get SSL certificate
certbot --nginx -d moltbot.doughy.app --non-interactive --agree-tos --email admin@doughy.app --redirect
```

### PM2 Commands

```bash
# Start application
cd /var/www/moltbot
pm2 start ecosystem.config.cjs
pm2 save

# Setup auto-restart on reboot
pm2 startup systemd -u root --hp /root
pm2 save

# View status
pm2 status

# View logs
pm2 logs moltbot
pm2 logs moltbot --lines 100 --nostream

# Restart
pm2 restart moltbot

# Restart with env refresh
pm2 restart moltbot --update-env
```

### Google Cloud Commands (Cloud Shell)

```bash
# List organizations
gcloud organizations list

# Grant yourself Organization Policy Administrator
gcloud organizations add-iam-policy-binding 110093459941 --member="user:dino@secondlyhomes.com" --role="roles/orgpolicy.policyAdmin"

# Create policy file to allow all domains (fixes "Domain Restricted Sharing" error)
printf 'name: organizations/110093459941/policies/iam.allowedPolicyMemberDomains\nspec:\n  rules:\n    - allowAll: true\n' > /tmp/policy.yaml

# Verify file content
cat /tmp/policy.yaml

# Apply the policy
gcloud org-policies set-policy /tmp/policy.yaml
```

### Environment Variable Commands

```bash
# Generate cron secret
openssl rand -hex 32

# Edit .env file
nano /var/www/moltbot/.env

# Update specific value with sed
sed -i 's/OLD_VALUE/NEW_VALUE/' /var/www/moltbot/.env

# Verify a value (partial, for security)
grep SOME_KEY /var/www/moltbot/.env | cut -c1-30
```

### Cron Setup

```bash
# View current cron
crontab -l

# Add cron job for Gmail watch renewal
(crontab -l 2>/dev/null | grep -v 'renew-watches'; echo '0 0 * * * curl -s -X POST -H "x-cron-secret: YOUR_CRON_SECRET" https://moltbot.doughy.app/cron/renew-watches >> /var/log/moltbot/cron.log 2>&1') | crontab -

# Verify
crontab -l
```

### Testing Commands

```bash
# Test health endpoint
curl https://moltbot.doughy.app/health

# Test locally on server
curl http://localhost:3000/health

# Check DNS propagation
dig moltbot.doughy.app +short

# Test SSH connection
ssh -i ~/.ssh/do_moltbot -o ConnectTimeout=10 root@157.245.218.123 "echo 'Connected'"
```

---

## Cost Summary

| Item | Cost |
|------|------|
| DigitalOcean Droplet | $6.00/mo |
| Backups (usage-based) | ~$0.15-0.30/mo |
| Google Cloud Pub/Sub | Free tier |
| SSL Certificate | Free (Let's Encrypt) |
| **Total** | ~$6.15-6.30/mo |

---

## Staging Environment (Future)

When needed:

| Setting | Staging |
|---------|---------|
| Hostname | `doughy-moltbot-stage` |
| Domain | `moltbot-stage.doughy.app` |
| Size | $4/mo (512MB) |
| Backups | None |

Or use snapshots for on-demand staging:
1. Create snapshot of prod
2. Spin up droplet from snapshot
3. Test
4. Destroy when done

---

## Current Environment State & TODO

### Current Configuration (January 2026)

**IMPORTANT: Environment mismatch exists - needs consolidation**

| Component | Environment | Project/Resource |
|-----------|-------------|------------------|
| DigitalOcean Droplet | **Production** | `doughy-moltbot-prod` (157.245.218.123) |
| Supabase (server points to) | **Dev/Stage** | `lqmbyobweeaigrwmvizo` |
| Supabase Prod | Unused by MoltBot | `vpqglbaedcpeprnlnfxd` |
| Domain | Production | `moltbot.doughy.app` |

### Supabase Projects Reference

| Project | ID | Purpose |
|---------|-----|---------|
| Doughy App (Dev/Stage) | `lqmbyobweeaigrwmvizo` | Currently used by MoltBot prod server |
| Doughy App (Prod) | `vpqglbaedcpeprnlnfxd` | Production Supabase (not used by MoltBot yet) |

### TODO: Environment Consolidation

When setting up proper staging/dev environments, need to:

1. **Decide on architecture:**
   - Option A: MoltBot prod uses Supabase Prod (`vpqglbaedcpeprnlnfxd`)
   - Option B: Keep current setup if Dev/Stage Supabase is sufficient

2. **If switching MoltBot to Supabase Prod:**
   - Update server `.env` with Prod Supabase URL and keys
   - Migrate any necessary data (user_gmail_tokens, etc.)
   - Update edge functions on Prod project
   - Test thoroughly before switching

3. **When adding DigitalOcean staging:**
   - Create `doughy-moltbot-stage` droplet
   - Point stage to Dev/Stage Supabase (`lqmbyobweeaigrwmvizo`)
   - Point prod to Prod Supabase (`vpqglbaedcpeprnlnfxd`)

4. **Document final architecture in this guide**

### Secret Keys Reference

Both Supabase projects have `MOLTBOT_SECRET_KEY` set for edge function authentication:
- Format: `sb_secret_...` (new Supabase key format)
- Used for server-to-server authentication with edge functions

---

## 11. Pre-Launch Hardening Checklist

### Already Implemented (January 2026)

| Item | Status | Notes |
|------|--------|-------|
| fail2ban | ✅ | SSH protection, 5 failed attempts = 10 min ban |
| UFW firewall | ✅ | Only SSH, HTTP/HTTPS open |
| Auto security updates | ✅ | `unattended-upgrades` enabled |
| PM2 log rotation | ✅ | 10MB max, 7 days retention, compressed |
| Nginx security headers | ✅ | X-Frame-Options, X-Content-Type-Options, XSS-Protection, Referrer-Policy |
| SSL/TLS | ✅ | Let's Encrypt with auto-renewal |

### Before Going Live

**1. SSH Hardening (High Priority)**

Disable password authentication and optionally disable root login:

```bash
# Edit SSH config
nano /etc/ssh/sshd_config

# Change these values:
PasswordAuthentication no
PermitRootLogin prohibit-password  # or 'no' if using non-root user

# Restart SSH
systemctl restart sshd
```

**WARNING:** Test SSH key access in a separate terminal BEFORE closing your session!

**2. Create Non-Root Deploy User (Optional but Recommended)**

```bash
# Create user
adduser deploy
usermod -aG sudo deploy

# Copy SSH keys
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Update app ownership
chown -R deploy:deploy /var/www/moltbot
chown -R deploy:deploy /var/log/moltbot

# Reconfigure PM2 for deploy user
su - deploy
pm2 startup
pm2 start /var/www/moltbot/ecosystem.config.cjs
pm2 save
```

**3. Nginx Rate Limiting**

Add to `/etc/nginx/nginx.conf` in the `http` block:

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=webhooks:10m rate=30r/s;
```

Then in site config, add to locations:

```nginx
location /webhooks/ {
    limit_req zone=webhooks burst=50 nodelay;
    # ... existing proxy config
}

location / {
    limit_req zone=api burst=20 nodelay;
    # ... existing proxy config
}
```

**4. External Uptime Monitoring**

Options:
- **DigitalOcean Uptime** (free with droplet): Droplet → Monitoring → Create Alert
- **UptimeRobot** (free tier): Monitor `https://moltbot.doughy.app/health`
- **Better Uptime** / **Pingdom** (paid, more features)

**5. Backup Verification**

DigitalOcean backups are enabled. Periodically test restore:

1. Create a snapshot
2. Spin up test droplet from snapshot
3. Verify app works
4. Destroy test droplet

### Monitoring Commands

```bash
# Check fail2ban status and banned IPs
fail2ban-client status sshd

# Unban an IP if needed
fail2ban-client set sshd unbanip <IP>

# Check for brute force attempts
grep "Failed password" /var/log/auth.log | tail -20

# Check nginx rate limit rejections
grep "limiting requests" /var/log/nginx/error.log
```
