# Deployment

> Last verified: 2026-02-22

## Current State

| Component | Status | Location |
|-----------|--------|----------|
| **Doughy Mobile App** | Active, iOS-first | `apps/doughy/`, Expo Dev Client |
| **Bouncer App** | UI complete, wiring to OpenClaw API | `apps/bouncer/`, local dev |
| **CallPilot App** | UI complete, mock data | `apps/callpilot/`, local dev |
| **Custom OpenClaw Server** | **Deployed** on DO droplet (legacy) | `openclaw-server/` + `legacy/custom-claw/` |
| **OpenClaw Platform** | Migration in progress | `server/openclaw/` |
| **Webhook Bridge** | Scaffold created | `server/webhook-bridge/` |
| **Supabase MCP Server** | Scaffold created | `server/tools/` |
| **Supabase (Staging)** | Active, 9 schemas, 170 tables, 62 edge functions | `us-east-1` |
| **Supabase (Production)** | Active, public schema only, ~42 tables | `us-west-2` |
| **DigitalOcean Droplet** | **Active** | `openclaw.doughy.app` (`157.245.218.123`) |

---

## Supabase Projects

### Staging (Development)

| Property | Value |
|----------|-------|
| Project ID | `lqmbyobweeaigrwmvizo` |
| Name | Doughy App (Dev/Stage) |
| Region | `us-east-1` |
| Status | ACTIVE_HEALTHY |
| URL | `https://lqmbyobweeaigrwmvizo.supabase.co` |
| DB Host | `db.lqmbyobweeaigrwmvizo.supabase.co` |
| Postgres | 17.6.1.063 |
| Created | 2025-04-13 |
| Schemas | 9 (claw, callpilot, ai, investor, landlord, crm, integrations, callpilot, public) |
| Tables | 170 |
| RLS | Enabled on all tables |
| Edge Functions | 62 deployed, all ACTIVE |
| Organization | `zcldhvcjdmrqhqqezjsq` |

### Production

| Property | Value |
|----------|-------|
| Project ID | `vpqglbaedcpeprnlnfxd` |
| Name | Doughy App (Prod) |
| Region | `us-west-2` |
| Status | ACTIVE_HEALTHY |
| URL | `https://vpqglbaedcpeprnlnfxd.supabase.co` |
| DB Host | `db.vpqglbaedcpeprnlnfxd.supabase.co` |
| Postgres | 17.6.1.063 |
| Created | 2025-12-31 |
| Schemas | public only (~42 tables, legacy structure) |
| Organization | `zcldhvcjdmrqhqqezjsq` |

### Secondly Homes (separate project)

| Property | Value |
|----------|-------|
| Project ID | `qpkiwqabfuvavunimxbr` |
| Region | `us-east-2` |
| Purpose | Rental blog, newsletter, separate from Doughy |

---

## Edge Functions (Staging)

62 functions deployed, all ACTIVE. See `docs/EDGE_FUNCTIONS.md` for full catalog.

**JWT verification:** 58/62 require JWT. 4 exceptions: `api-health-check`, `openstreetmap-api`, `document-search`, `gmail-oauth-callback`, `google-calendar`.

**Most-iterated functions** (highest version numbers):
| Function | Version | Category |
|----------|---------|----------|
| `integration-health` | v66 | System |
| `openai` | v50 | AI |
| `recalculate_lead_score` | v49 | AI |
| `import-leads` | v46 | Data Import |
| `perplexity-api` | v42 | AI |

**Recently deployed** (latest `updated_at`):
- `openclaw-bridge` (v1) — newest function, replacement for `moltbot-bridge`
- `google-calendar` (v1) — newly deployed
- `memory-manager` (v9)
- `gmail-oauth-callback` (v6)

---

## DigitalOcean Droplet (ACTIVE)

### Configuration

| Property | Value |
|----------|-------|
| OS | Ubuntu 24.04 LTS |
| Specs | 4GB RAM / 2 vCPU |
| IP | `157.245.218.123` |
| SSH | `ssh claw` (alias in `~/.ssh/config`, key: `~/.ssh/do_claw`) |
| Domain | `openclaw.doughy.app` |
| App Path | `/var/www/openclaw/` |
| Log Path | `/var/log/openclaw/` |
| Node | >= 20.x |
| Process Manager | PM2 |
| Reverse Proxy | Nginx |
| SSL | Let's Encrypt via Certbot |
| Port | 3000 (custom server), 443 (public) |

### Services Running During Migration

| Service | Port | RAM (est.) | Status |
|---------|------|------------|--------|
| Custom Express server | 3000 | ~104MB | Active (legacy) |
| OpenClaw gateway | 18789 | ~200-400MB | Pending deployment |
| Webhook bridge | 3001 | ~50MB | Pending |
| LiteLLM proxy | 4000 | ~100-200MB | Pending |
| Squid proxy | 3128 | ~50MB | Pending |
| Queue processor | -- | ~30MB | Pending |

Total estimated: ~600-800MB. The 4GB droplet handles this comfortably.

### Tailscale VPN (Required for OpenClaw)

OpenClaw gateway binds to `127.0.0.1:18789` only -- NOT accessible from public internet. All API access goes through Tailscale VPN.

- Install: `curl -fsSL https://tailscale.com/install.sh | sh && tailscale up`
- UFW: `ufw default deny incoming && ufw allow in on tailscale0 && ufw enable`
- SSH remains available via Tailscale (disable direct SSH after migration)

### Deploy Scripts

Scripts in `openclaw-server/deploy/`:

| Script | Purpose |
|--------|---------|
| `setup.sh` | Ubuntu droplet bootstrap (Node, PM2, Nginx, Certbot) |
| `nginx.conf` | Nginx reverse proxy config |
| `gcloud-setup.sh` | Google Cloud Pub/Sub for Gmail |

---

## SMS Flow (Deployed & Working)

The end-to-end SMS → Briefing flow is operational. Key configuration (on the droplet at `/var/www/openclaw/.env`):

- `SUPABASE_URL`, `SUPABASE_SECRET_KEY` — staging Supabase
- `ANTHROPIC_API_KEY` — Claude API for The Claw
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` — SMS
- `CLAW_PHONE_USER_MAP` — JSON mapping E.164 phone → Supabase user UUID
- `CLAW_ENABLED=true`
- `SERVER_URL=https://openclaw.doughy.app`

**Twilio webhook:** `https://openclaw.doughy.app/webhooks/sms` (HTTP POST)

---

## Initial Setup Steps (already completed)

### Step 1: Provision DigitalOcean Droplet

1. Create Ubuntu 24.04 droplet (Basic, $12/month is fine)
2. SSH into droplet as root

### Step 2: DNS

Create DNS A record:
```
openclaw.doughy.app → <droplet IP>
```
Wait for propagation (~5 minutes for most DNS providers).

### Step 3: Run Setup Script

```bash
# Upload setup script
scp openclaw-server/deploy/setup.sh root@<droplet-ip>:/tmp/

# SSH and run (after updating moltbot→openclaw references)
ssh root@<droplet-ip>
chmod +x /tmp/setup.sh
/tmp/setup.sh
```

This installs Node 20, PM2, Nginx, Certbot, creates `/var/www/openclaw/`.

### Step 4: Deploy Application

```bash
# From local machine
cd openclaw-server
npm run build
scp -r dist/ package.json package-lock.json ecosystem.config.cjs root@<droplet-ip>:/var/www/openclaw/

# On server
cd /var/www/openclaw
npm install --production
```

### Step 5: Configure Environment

```bash
# On server
nano /var/www/openclaw/.env
# (paste all env vars from Blocker #1 above)
```

### Step 6: Nginx + SSL

```bash
# Copy nginx config (after updating domain references)
cp /var/www/openclaw/deploy/nginx.conf /etc/nginx/sites-available/openclaw
ln -s /etc/nginx/sites-available/openclaw /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# SSL cert (requires DNS to be propagated)
certbot --nginx -d openclaw.doughy.app
```

### Step 7: Start Application

```bash
cd /var/www/openclaw
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### Step 8: Verify

```bash
curl https://openclaw.doughy.app/health
# Expected: {"status":"ok","timestamp":"...","version":"1.0.0","environment":"production"}

curl https://openclaw.doughy.app/status
# Expected: Supabase connected, channels listed
```

### Step 9: Configure Twilio

1. Go to Twilio Console → Phone Numbers → Active Numbers
2. Select The Claw phone number
3. Under Messaging → "A MESSAGE COMES IN":
   - Webhook URL: `https://openclaw.doughy.app/webhooks/sms`
   - Method: HTTP POST

### Step 10: Google OAuth (if needed)

1. Go to GCP Console → APIs & Credentials → OAuth 2.0 Client
2. Update Authorized redirect URI: `https://openclaw.doughy.app/oauth/callback`

### Step 11: Gmail Watch Cron

```bash
crontab -e
# Add:
0 0 * * * curl -X POST -H "x-cron-secret: YOUR_SECRET" https://openclaw.doughy.app/cron/renew-watches
```

---

## Doughy Mobile App Deployment

### Local Development

```bash
cd doughy-app-mobile
npm install
npx expo start
# Scan QR with Expo Go or Dev Client
```

### EAS Build (iOS)

```bash
eas build --platform ios --profile development
# or
eas build --platform ios --profile preview
```

### Environment Variables

The mobile app reads Supabase config from `src/lib/supabase.ts` where `SUPABASE_URL` is hardcoded (not from env vars). The generated types are in `src/integrations/supabase/types/generated.ts`.

To switch between staging and production, update `src/lib/supabase.ts` URL and key values.

---

## How to Deploy Updates

### Edge Functions (Supabase)

Deploy via MCP `deploy_edge_function` tool or Supabase CLI:
```bash
supabase functions deploy <function-name> --project-ref lqmbyobweeaigrwmvizo
```

### Database Migrations (Supabase)

Apply via MCP `apply_migration` tool or Supabase CLI:
```bash
supabase db push --project-ref lqmbyobweeaigrwmvizo
```

### OpenClaw Server (DO Droplet)

```bash
# Local: build & upload (code only, not .env)
cd openclaw-server
npm run build
rsync -avz --exclude='node_modules' --exclude='.env' dist/ claw:/var/www/openclaw/dist/

# If package.json changed (new deps):
scp package.json package-lock.json claw:/var/www/openclaw/
ssh claw "cd /var/www/openclaw && npm install --production"

# IMPORTANT: Always use --update-env so PM2 picks up any .env changes
ssh claw "pm2 restart openclaw --update-env"

# Verify:
ssh claw "curl -s http://localhost:3000/health"
```

> **SSH alias:** `claw` → `root@157.245.218.123` (key: `~/.ssh/do_claw`)
> **Troubleshooting:** See `docs/TROUBLESHOOTING.md` "OpenClaw Server — Production Issues" section

### Mobile App (EAS)

```bash
eas build --platform ios --profile preview
eas submit --platform ios
```

---

## Monitoring

### Health Checks

| Endpoint | What It Checks |
|----------|---------------|
| `GET /health` | Server alive, version, environment |
| `GET /status` | Supabase connectivity, configured channels |
| `api-health-check` edge function | Public health check (no auth) |
| `integration-health` edge function | All integration statuses (v66) |

### Logs

- **PM2 logs:** `/var/log/openclaw/out.log`, `/var/log/openclaw/error.log`
- **Nginx logs:** `/var/log/nginx/openclaw.access.log`, `/var/log/nginx/openclaw.error.log`
- **Supabase logs:** `get_logs` MCP tool (last 24 hours, by service type)
- **Security events:** `ai.openclaw_security_events` table (logged by `logSecurityEvent()`)
