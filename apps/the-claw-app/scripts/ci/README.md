# CI/CD Scripts

Automation scripts for continuous integration and deployment pipelines.

## Scripts Overview

### validate-pr.js

Validates pull requests against project standards.

**Checks:**
- Conventional commit format in PR title
- Description quality and length
- PR size (files and lines changed)
- File validation (no sensitive files)
- Required changes (tests for source changes)
- Commit message format
- Merge conflicts

**Usage:**
```bash
export GITHUB_TOKEN=your_token
export PR_NUMBER=123
export GITHUB_REPOSITORY=owner/repo
node scripts/ci/validate-pr.js
```

**Example Output:**
```
🔍 Starting PR validation...

✅ Title Format: PASS
✅ Description Quality: PASS
⚠️  PR Size: WARNING (800 changes)
✅ File Validation: PASS
✅ Required Changes: PASS
✅ Commit Messages: PASS
✅ Merge Conflicts: PASS

Results: 7/7 checks passed
```

---

### notify.js

Sends deployment notifications to various channels.

**Supports:**
- Slack
- Discord
- Microsoft Teams
- Email

**Usage:**
```bash
export SLACK_WEBHOOK_URL=https://hooks.slack.com/...
export DEPLOYMENT_STATUS=success
export ENVIRONMENT=production
export VERSION=v1.0.0
export GITHUB_RUN_URL=https://github.com/...
node scripts/ci/notify.js
```

**Notification Types:**
- `deployment` - Deployment status
- `nightly_summary` - Nightly build summary

---

### pre-deploy-check.js

Comprehensive pre-deployment validation.

**Checks:**
- Required environment variables
- package.json validity
- app.json configuration
- eas.json structure
- Build dependencies
- API connectivity
- Security checks

**Usage:**
```bash
export ENVIRONMENT=staging
export SUPABASE_STAGING_URL=https://xxx.supabase.co
export SUPABASE_STAGING_ANON_KEY=xxx
export EXPO_TOKEN=xxx
node scripts/ci/pre-deploy-check.js
```

**Example Output:**
```
🔍 Running pre-deployment checks...

✅ Environment Variables: PASS
✅ package.json: PASS (v1.0.0)
✅ app.json: PASS (YourApp v1.0.0)
✅ eas.json: PASS
✅ Build Dependencies: PASS
✅ Security Checks: PASS
✅ API Connectivity: PASS

Results: 7/7 checks passed
🎉 All pre-deployment checks passed!
```

---

### smoke-tests.js

Quick validation tests for deployed environments.

**Tests:**
- API health check
- Authentication endpoint accessibility
- Database connectivity
- RLS policy validation
- Response time measurement

**Usage:**
```bash
export ENVIRONMENT=staging
export API_URL=https://xxx.supabase.co
export API_KEY=xxx
node scripts/ci/smoke-tests.js
```

**Example Output:**
```
🧪 Running smoke tests...

✅ API Health: PASS
✅ Authentication: PASS
✅ Database Connectivity: PASS
✅ RLS Policies: PASS
✅ Response Times: PASS (234ms)

Results: 5/5 tests passed
🎉 All smoke tests passed!
```

---

### prepare-staging-config.js

Generates staging-specific configuration files.

**Features:**
- Modifies app.json for staging
- Updates bundle identifiers
- Sets environment variables
- Configures staging channels

**Usage:**
```bash
export ENVIRONMENT=staging
export SUPABASE_URL=https://xxx.supabase.co
export SUPABASE_ANON_KEY=xxx
export SENTRY_DSN=xxx
node scripts/ci/prepare-staging-config.js
```

---

### prepare-production-config.js

Generates production-specific configuration files.

**Usage:**
```bash
export ENVIRONMENT=production
export SUPABASE_URL=https://xxx.supabase.co
export SUPABASE_ANON_KEY=xxx
node scripts/ci/prepare-production-config.js
```

---

### rollback.js

Handles deployment rollbacks.

**Usage:**
```bash
export ENVIRONMENT=staging
node scripts/ci/rollback.js
```

---

### verify-backend.js

Verifies backend deployment success.

**Checks:**
- API endpoint accessibility
- Response status codes

**Usage:**
```bash
export SUPABASE_URL=https://xxx.supabase.co
export SUPABASE_ANON_KEY=xxx
node scripts/ci/verify-backend.js
```

---

### validate-production-config.js

Validates production configuration before deployment.

**Usage:**
```bash
export SUPABASE_URL=https://xxx.supabase.co
export SUPABASE_ANON_KEY=xxx
node scripts/ci/validate-production-config.js
```

---

### setup-monitoring.js

Configures monitoring and alerting.

**Usage:**
```bash
export ENVIRONMENT=production
export SENTRY_DSN=xxx
node scripts/ci/setup-monitoring.js
```

## Common Environment Variables

### Required for All Scripts

```bash
# Node version
NODE_VERSION=20

# Environment
ENVIRONMENT=staging  # or production
```

### Supabase

```bash
# Staging
SUPABASE_STAGING_URL=https://xxx.supabase.co
SUPABASE_STAGING_ANON_KEY=xxx
SUPABASE_STAGING_SERVICE_ROLE_KEY=xxx
SUPABASE_STAGING_PROJECT_REF=xxx

# Production
SUPABASE_PRODUCTION_URL=https://xxx.supabase.co
SUPABASE_PRODUCTION_ANON_KEY=xxx
SUPABASE_PRODUCTION_SERVICE_ROLE_KEY=xxx
SUPABASE_PRODUCTION_PROJECT_REF=xxx
```

### Expo & EAS

```bash
EXPO_TOKEN=xxx
```

### GitHub

```bash
GITHUB_TOKEN=xxx
GITHUB_REPOSITORY=owner/repo
PR_NUMBER=123
```

### Notifications

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...
```

### Monitoring

```bash
SENTRY_AUTH_TOKEN=xxx
SENTRY_DSN_STAGING=xxx
SENTRY_DSN_PRODUCTION=xxx
SENTRY_ORG=xxx
SENTRY_PROJECT=xxx
```

## Integration with GitHub Actions

These scripts are designed to be used in GitHub Actions workflows:

```yaml
# Example: Pre-deployment check
- name: Run pre-deployment check
  run: node scripts/ci/pre-deploy-check.js
  env:
    ENVIRONMENT: staging
    SUPABASE_STAGING_URL: ${{ secrets.SUPABASE_STAGING_URL }}
    SUPABASE_STAGING_ANON_KEY: ${{ secrets.SUPABASE_STAGING_ANON_KEY }}

# Example: Smoke tests
- name: Run smoke tests
  run: node scripts/ci/smoke-tests.js
  env:
    API_URL: ${{ secrets.SUPABASE_STAGING_URL }}
    API_KEY: ${{ secrets.SUPABASE_STAGING_ANON_KEY }}
    ENVIRONMENT: staging

# Example: Send notification
- name: Send notification
  if: always()
  run: node scripts/ci/notify.js
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
    DEPLOYMENT_STATUS: ${{ job.status }}
    ENVIRONMENT: staging
```

## Local Testing

All scripts can be run locally for testing:

```bash
# Set up environment
export ENVIRONMENT=staging
export SUPABASE_STAGING_URL=https://xxx.supabase.co
export SUPABASE_STAGING_ANON_KEY=xxx

# Run individual script
node scripts/ci/pre-deploy-check.js

# Or use npm scripts (if configured)
npm run ci:pre-deploy-check
```

## Error Handling

All scripts follow consistent error handling:

- Exit code 0: Success
- Exit code 1: Failure
- Colored console output for readability
- Detailed error messages
- Validation reports

## Contributing

When adding new CI scripts:

1. Follow naming convention: `kebab-case.js`
2. Add comprehensive comments
3. Include usage examples in this README
4. Use consistent error handling
5. Add colored console output
6. Make scripts executable: `chmod +x script.js`
7. Add shebang: `#!/usr/bin/env node`

## Related Documentation

- [CI/CD Guide](../../docs/11-deployment/CI-CD.md)
- [GitHub Actions Workflows](../../.github/workflows/)
- [Environment Variables](../../ENVIRONMENT-VARIABLES.md)
- [Security Checklist](../../docs/09-security/SECURITY-CHECKLIST.md)
