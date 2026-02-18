# Zone A Scripts

Automation scripts for Zone A backend operations.

---

## Scripts Overview

### 🚀 setup-zone-a.sh

**Complete Zone A deployment script**

Performs full backend setup including:
- All database migrations (Phases 1-5, Sprints 1-4)
- All edge function deployments
- pgTAP test execution
- TypeScript type generation

**Usage:**
```bash
./scripts/setup-zone-a.sh production
```

**When to use:**
- Initial project setup
- Complete rebuild after reset
- Deploying to new environment

**Time:** ~5-10 minutes

---

### 📦 deploy-edge-functions.sh

**Deploy edge functions only**

Deploys all 5 edge functions with proper environment configuration.

**Usage:**
```bash
./scripts/deploy-edge-functions.sh production
```

**When to use:**
- After updating function code
- Deploying to staging environment
- Fixing function bugs without migrating database

**Time:** ~2-3 minutes

**Functions deployed:**
- integration-health
- stripe-api
- openai
- sms-webhook
- scheduled-reminders

---

### 🧪 test-edge-functions.sh

**Test deployed edge functions**

Tests all edge functions against live Supabase project.

**Usage:**
```bash
./scripts/test-edge-functions.sh <project-id> <anon-key>
```

**Example:**
```bash
./scripts/test-edge-functions.sh vpqglbaedcpeprnlnfxd eyJhbGc...
```

**When to use:**
- After deployment
- Verifying production functions
- Debugging function issues

**Tests performed:**
1. Integration Health (OpenAI)
2. Integration Health (Stripe)
3. SMS Webhook
4. OpenAI Function
5. Scheduled Reminders (requires service role key)
6. CORS Validation

**Time:** ~30 seconds

---

### 🔧 test-functions-local.sh

**Test functions on local Supabase**

Tests edge functions running on local development instance.

**Usage:**
```bash
# Start local Supabase first
supabase start

# Run tests
./scripts/test-functions-local.sh
```

**When to use:**
- During development
- Before deploying to production
- Testing function changes locally

**Prerequisites:**
- Supabase CLI installed
- Local Supabase running (`supabase start`)

**Time:** ~20 seconds

---

## Quick Start

### First Time Setup

```bash
# 1. Login to Supabase
supabase login

# 2. Link your project
supabase link --project-ref <your-project-id>

# 3. Run complete setup
./scripts/setup-zone-a.sh production
```

### Development Workflow

```bash
# 1. Start local instance
supabase start

# 2. Make changes to functions
# Edit files in supabase/functions/

# 3. Test locally
./scripts/test-functions-local.sh

# 4. Deploy to staging
./scripts/deploy-edge-functions.sh staging

# 5. Test staging
./scripts/test-edge-functions.sh <staging-project-id> <staging-anon-key>

# 6. Deploy to production
./scripts/deploy-edge-functions.sh production

# 7. Test production
./scripts/test-edge-functions.sh <prod-project-id> <prod-anon-key>
```

---

## Environment Variables

Scripts use these environment variables (optional):

```bash
# Supabase Secret Key (for testing scheduled-reminders)
export SUPABASE_SECRET_KEY="sb_secret_..."

# Default project ID (avoids passing as argument)
export SUPABASE_PROJECT_ID="vpqglbaedcpeprnlnfxd"

# Default anon key (avoids passing as argument)
export SUPABASE_ANON_KEY="eyJhbGc..."
```

---

## Troubleshooting

### Scripts won't execute

```bash
# Make scripts executable
chmod +x scripts/*.sh
```

### "supabase: command not found"

```bash
# Install Supabase CLI
npm install -g supabase

# Or with Homebrew
brew install supabase/tap/supabase
```

### "Not logged in to Supabase"

```bash
supabase login
```

### "jq: command not found"

```bash
# Install jq (optional, for JSON parsing)
brew install jq  # macOS
apt install jq   # Linux
```

### Local tests fail

```bash
# Ensure local Supabase is running
supabase status

# If not running
supabase start

# Check logs
supabase functions logs <function-name>
```

### Deployment fails

```bash
# Check you're linked to correct project
supabase projects list

# Re-link if needed
supabase link --project-ref <project-id>

# View detailed error
supabase functions deploy <function-name> --debug
```

---

## Adding New Scripts

When creating new scripts:

1. **Name**: Use kebab-case (e.g., `deploy-new-feature.sh`)
2. **Shebang**: Start with `#!/bin/bash`
3. **Set options**: Use `set -e` (exit on error)
4. **Colors**: Use color variables for output
5. **Usage**: Include usage message
6. **Executable**: Make executable with `chmod +x`
7. **Document**: Add to this README

**Template:**
```bash
#!/bin/bash
# Script Name
# Description: What this script does
# Usage: ./scripts/script-name.sh [args]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Your script here
echo -e "${GREEN}Success!${NC}"
```

---

## Related Documentation

- **Deployment Guide**: `../EDGE_FUNCTION_DEPLOYMENT.md`
- **Quick Reference**: `../ZONE_A_QUICK_REFERENCE.md`
- **Final Summary**: `../ZONE_A_FINAL_SUMMARY.md`
