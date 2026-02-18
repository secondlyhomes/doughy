# CI/CD Pipeline Guide

Complete guide to the CI/CD infrastructure for automated testing, building, and deployment.

## Overview

This project uses GitHub Actions for continuous integration and deployment with Expo Application Services (EAS) for building and distributing mobile apps.

### Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Code Push / PR                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  CI Pipeline (ci.yml)                       │
│  • Lint & Type Check                                        │
│  • Unit Tests                                               │
│  • Integration Tests                                        │
│  • Security Scanning                                        │
│  • Code Quality Analysis                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  Merge to Dev   │     │  Tag Release    │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ Staging Deploy  │     │ Production      │
│ (auto)          │     │ Deploy (manual) │
└─────────────────┘     └─────────────────┘
```

## Workflows

### 1. CI Workflow (ci.yml)

Runs on every PR and push to main branches.

**Triggers:**
- Push to `main`, `master`, or `develop`
- Pull requests to these branches
- Manual dispatch

**Jobs:**

#### Lint
- ESLint checks
- Code style validation
- Uploads lint report

#### Type Check
- TypeScript compilation
- Type safety validation

#### Unit Tests
- Runs on Node 20 and 22
- Generates coverage reports
- Uploads to Codecov
- Comments coverage on PR

#### Integration Tests
- Tests with Supabase backend
- Validates API integration

#### Security Audit
- npm audit for vulnerabilities
- Fails on critical vulnerabilities
- Secrets scanning with TruffleHog

#### Code Quality
- Component size analysis
- Bundle size reporting

#### Expo Doctor
- Validates Expo configuration
- Checks app.json structure

#### PR Automation
- Size analysis
- PR validation
- Summary comments

**Usage:**
```bash
# Automatically runs on PR/push
# View results in GitHub Actions tab
```

### 2. Staging Deployment (deploy-staging.yml)

Automated deployment to staging environment.

**Triggers:**
- Push to `develop` branch
- Manual dispatch

**Jobs:**

#### Pre-deployment Checks
- Environment validation
- Linting and type checking
- Full test suite

#### Build Staging
- iOS and Android builds
- Internal distribution
- Staging configuration

#### Deploy Backend
- Database migrations
- Edge function deployment
- Backend verification

#### E2E Tests
- iOS simulator tests
- Full user flow validation

#### OTA Update
- Publish to staging channel
- Update verification

#### Smoke Tests
- Critical path testing
- API health checks

#### Notifications
- Slack/Discord alerts
- Deployment status
- Rollback on failure

**Environment Variables:**
```bash
SUPABASE_STAGING_URL=https://xxx.supabase.co
SUPABASE_STAGING_ANON_KEY=xxx
SUPABASE_STAGING_SECRET_KEY=xxx
EXPO_TOKEN=xxx
SLACK_WEBHOOK_URL=xxx
```

### 3. Production Deployment (deploy-production.yml)

Production deployment with approval gates.

**Triggers:**
- Version tags (v1.0.0, v1.2.3, etc.)
- Manual dispatch

**Jobs:**

#### Pre-deployment Validation
- Version tag validation
- Comprehensive testing
- Security audit
- Configuration validation
- Database migration check

#### Manual Approval Gate
- Requires human approval
- 24-hour timeout
- Production environment protection

#### Database Migration
- Backup creation
- Migration execution
- Verification

#### Build Production
- iOS App Store build
- Android Play Store build (AAB + APK)
- Production configuration
- Auto-increment version codes

#### Submit to Stores
- App Store submission
- Play Store submission (internal track)
- Submission status tracking

#### OTA Update
- Production channel update
- Update verification

#### Smoke Tests
- Production endpoint validation
- Critical functionality check

#### Create Release
- GitHub release creation
- Changelog generation
- Artifact upload

#### Monitoring Setup
- Sentry release creation
- Alert configuration

**Version Tag Format:**
```bash
# Tag format: v{major}.{minor}.{patch}
git tag v1.0.0
git push origin v1.0.0
```

### 4. Nightly Build (nightly.yml)

Automated nightly maintenance tasks.

**Triggers:**
- Daily at 2 AM UTC
- Manual dispatch

**Jobs:**

#### Code Health
- Full test suite
- Complexity analysis
- Code duplication check

#### Dependency Updates
- Check for outdated packages
- Security audit
- Auto-create update PR

#### Performance Tests
- Bundle size analysis
- Startup time measurement
- Memory profiling

#### Nightly Builds
- iOS and Android preview builds
- Latest code validation

#### Documentation Check
- Broken link detection
- Structure validation
- Outdated file check

#### Database Health
- Migration status
- RLS policy validation
- Size monitoring

#### Cleanup
- Remove old builds
- Archive old workflow runs

## EAS Configuration

### Build Profiles

**Development:**
```json
{
  "developmentClient": true,
  "distribution": "internal",
  "simulator": true
}
```

**Preview:**
```json
{
  "distribution": "internal",
  "simulator": false
}
```

**Staging:**
```json
{
  "distribution": "internal",
  "bundleIdentifier": "com.yourcompany.yourapp.staging",
  "autoIncrement": "buildNumber"
}
```

**Production:**
```json
{
  "distribution": "store",
  "autoIncrement": "buildNumber"
}
```

### Submit Profiles

**Production:**
```json
{
  "ios": {
    "appleId": "your-apple-id@example.com",
    "ascAppId": "1234567890"
  },
  "android": {
    "track": "production",
    "releaseStatus": "completed"
  }
}
```

## CI Scripts

### validate-pr.js

Validates pull requests:
- Title format (conventional commits)
- Description quality
- Size limits
- Required files
- Commit messages

**Usage:**
```bash
export GITHUB_TOKEN=xxx
export PR_NUMBER=123
node scripts/ci/validate-pr.js
```

### notify.js

Sends deployment notifications:
- Slack
- Discord
- MS Teams
- Email

**Configuration:**
```bash
export SLACK_WEBHOOK_URL=xxx
export DISCORD_WEBHOOK_URL=xxx
export DEPLOYMENT_STATUS=success
export ENVIRONMENT=production
node scripts/ci/notify.js
```

### pre-deploy-check.js

Pre-deployment validation:
- Environment variables
- Configuration files
- API connectivity
- Dependencies

**Usage:**
```bash
export ENVIRONMENT=staging
node scripts/ci/pre-deploy-check.js
```

### smoke-tests.js

Quick functionality validation:
- API health
- Authentication
- Database connectivity
- Response times

**Usage:**
```bash
export API_URL=https://xxx.supabase.co
export API_KEY=xxx
export ENVIRONMENT=staging
node scripts/ci/smoke-tests.js
```

## GitHub Secrets

### Required Secrets

**Expo:**
- `EXPO_TOKEN` - Expo authentication token
- Get from: https://expo.dev/accounts/[account]/settings/access-tokens

**Supabase Staging:**
- `SUPABASE_STAGING_URL`
- `SUPABASE_STAGING_ANON_KEY`
- `SUPABASE_STAGING_SECRET_KEY`
- `SUPABASE_STAGING_PROJECT_REF`

**Supabase Production:**
- `SUPABASE_PRODUCTION_URL`
- `SUPABASE_PRODUCTION_ANON_KEY`
- `SUPABASE_PRODUCTION_SECRET_KEY`
- `SUPABASE_PRODUCTION_PROJECT_REF`

**iOS:**
- `APPLE_ID` - Apple developer email
- `APPLE_TEAM_ID` - Team identifier
- `APPLE_APP_SPECIFIC_PASSWORD` - App-specific password

**Android:**
- `GOOGLE_SERVICE_ACCOUNT_KEY` - Service account JSON

**Monitoring:**
- `SENTRY_AUTH_TOKEN`
- `SENTRY_DSN_STAGING`
- `SENTRY_DSN_PRODUCTION`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

**Notifications:**
- `SLACK_WEBHOOK_URL`
- `DISCORD_WEBHOOK_URL`
- `TEAMS_WEBHOOK_URL`
- `EMAIL_USERNAME`
- `EMAIL_PASSWORD`

**Coverage:**
- `CODECOV_TOKEN`

### Setting Secrets

```bash
# Via GitHub CLI
gh secret set EXPO_TOKEN

# Via GitHub UI
# Settings > Secrets and variables > Actions > New repository secret
```

## Environment Protection

### Production Environment

Configure in GitHub:
1. Settings > Environments > New environment
2. Name: `production-approval`
3. Required reviewers: Add team members
4. Deployment branches: `main` or tags matching `v*.*.*`

## Local Testing

### Test CI Locally

Use `act` to test GitHub Actions locally:

```bash
# Install act
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run CI workflow
act pull_request

# Run specific job
act -j lint

# With secrets
act -s GITHUB_TOKEN=xxx
```

### Test Scripts Locally

```bash
# PR validation
export GITHUB_TOKEN=xxx PR_NUMBER=123
node scripts/ci/validate-pr.js

# Pre-deployment check
export ENVIRONMENT=staging
node scripts/ci/pre-deploy-check.js

# Smoke tests
export API_URL=xxx API_KEY=xxx
node scripts/ci/smoke-tests.js
```

## Build Management

### EAS Build Commands

```bash
# Development build
eas build --profile development --platform ios

# Preview build (both platforms)
eas build --profile preview --platform all

# Production build
eas build --profile production --platform ios --non-interactive

# Check build status
eas build:list --limit 10

# View specific build
eas build:view [build-id]

# Cancel build
eas build:cancel [build-id]
```

### Submit to Stores

```bash
# Submit to App Store
eas submit --platform ios --latest

# Submit to Play Store (internal track)
eas submit --platform android --latest --track internal

# Submit specific build
eas submit --platform ios --id [build-id]

# Check submission status
eas submit:list
```

## OTA Updates

### Publish Updates

```bash
# Publish to staging
eas update --branch staging --message "Bug fix"

# Publish to production
eas update --branch production --message "Feature update"

# View updates
eas update:list --branch production

# Rollback update
eas update:rollback --branch production
```

### Update Strategies

**Automatic (Default):**
- Updates downloaded on app launch
- Applied on next restart

**Manual:**
```typescript
import * as Updates from 'expo-updates';

async function checkForUpdates() {
  const update = await Updates.checkForUpdateAsync();
  if (update.isAvailable) {
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
  }
}
```

## Monitoring and Debugging

### View Workflow Runs

```bash
# List workflow runs
gh run list

# View specific run
gh run view [run-id]

# Watch live run
gh run watch

# Download artifacts
gh run download [run-id]

# Re-run failed jobs
gh run rerun [run-id] --failed
```

### Debug Failed Builds

1. **Check workflow logs:**
   - GitHub Actions tab
   - Click on failed workflow
   - View job logs

2. **Check EAS build logs:**
   ```bash
   eas build:view [build-id]
   # Click on "View logs" link
   ```

3. **Test locally:**
   ```bash
   npm run validate
   npm test
   npx tsc --noEmit
   ```

4. **Check artifacts:**
   - Download from workflow run
   - Review error reports

### Common Issues

**Build Failures:**
```bash
# Clear cache and retry
npm run clean:deep
npm ci
eas build --clear-cache --profile production
```

**Test Failures:**
```bash
# Update snapshots
npm run test:update-snapshots

# Run specific test
npm test -- path/to/test.test.ts
```

**Deployment Failures:**
```bash
# Check environment variables
node scripts/ci/pre-deploy-check.js

# Verify configuration
node scripts/ci/validate-production-config.js

# Test API connectivity
node scripts/ci/smoke-tests.js
```

## Best Practices

### 1. Version Management

**Semantic Versioning:**
- `v1.0.0` - Major version (breaking changes)
- `v1.1.0` - Minor version (new features)
- `v1.0.1` - Patch version (bug fixes)

**Version Bumping:**
```bash
# Use version-bump script
npm run version:bump -- patch
npm run version:bump -- minor
npm run version:bump -- major
```

### 2. Commit Messages

Follow conventional commits:
```
feat(auth): add biometric login
fix(api): handle network timeout
docs(readme): update installation steps
chore(deps): update dependencies
```

### 3. Pull Requests

- Keep PRs small (<1000 lines)
- Write descriptive titles and descriptions
- Link related issues
- Add screenshots for UI changes
- Ensure all checks pass

### 4. Testing

- Write tests for new features
- Maintain >80% coverage
- Test on physical devices
- Verify on both iOS and Android

### 5. Secrets Management

- Never commit secrets
- Use environment variables
- Rotate secrets regularly
- Use different keys per environment

### 6. Build Optimization

- Use caching in workflows
- Run jobs in parallel when possible
- Cancel in-progress builds for PRs
- Clean up old builds regularly

### 7. Deployment Safety

- Always use staging first
- Require manual approval for production
- Have rollback plan ready
- Monitor deployments closely

## Troubleshooting

### Workflow Not Triggering

**Check:**
- Branch name matches trigger pattern
- Workflow file syntax is valid
- Repository has Actions enabled

**Fix:**
```bash
# Validate workflow file
npx yaml-lint .github/workflows/ci.yml

# Re-push trigger
git commit --allow-empty -m "Trigger workflow"
git push
```

### Build Hanging

**Causes:**
- Resource timeout
- Network issues
- Dependency installation hanging

**Fix:**
```bash
# Increase timeout in workflow
timeout-minutes: 60

# Use faster resource class in eas.json
"resourceClass": "m-large"
```

### Secrets Not Available

**Check:**
- Secret is defined in repository settings
- Secret name matches exactly (case-sensitive)
- Environment is configured correctly

**Fix:**
```bash
# List secrets (names only)
gh secret list

# Set secret
gh secret set SECRET_NAME
```

### Test Failures in CI

**Debug:**
```bash
# Run tests with same Node version
nvm use 20
npm test

# Check for environment-specific issues
CI=true npm test

# Increase test timeout
jest.setTimeout(30000);
```

## Performance Optimization

### Workflow Optimization

1. **Cache Dependencies:**
   ```yaml
   - uses: actions/setup-node@v4
     with:
       cache: 'npm'
   ```

2. **Parallel Jobs:**
   ```yaml
   strategy:
     matrix:
       platform: [ios, android]
     fail-fast: false
   ```

3. **Conditional Jobs:**
   ```yaml
   if: github.event_name == 'pull_request'
   ```

### Build Optimization

1. **Resource Classes:**
   - Development: `m-medium`
   - Preview: `m-medium`
   - Production: `m-large`

2. **Caching:**
   ```bash
   eas build --clear-cache  # Only when needed
   ```

3. **Incremental Builds:**
   - Use development builds for testing
   - Full builds only for releases

## Metrics and Reporting

### Key Metrics

**Build Times:**
- Development: <10 min
- Preview: <20 min
- Production: <30 min

**Test Coverage:**
- Target: >80%
- Critical paths: 100%

**Deployment Frequency:**
- Staging: Daily
- Production: Weekly

**Success Rate:**
- CI: >95%
- Deployments: >98%

### Reports

**Generated Reports:**
- Test coverage (coverage/)
- Lint results (eslint-report.json)
- Bundle size (bundle-report.md)
- Dependency audit (security-audit.json)

**Access:**
```bash
# Download from workflow artifacts
gh run download [run-id]

# View in CI job output
# Actions tab > Select run > Artifacts
```

## Cost Management

### GitHub Actions

**Free tier:**
- Public repos: Unlimited
- Private repos: 2,000 minutes/month

**Optimization:**
- Use caching
- Cancel redundant runs
- Schedule non-critical jobs

### EAS Builds

**Free tier:**
- 30 builds/month (iOS + Android combined)

**Optimization:**
- Use development builds locally
- Preview builds for testing
- Production builds for releases only

### Monitoring

```bash
# Check Action usage
gh api /repos/{owner}/{repo}/actions/runs \
  --jq '.workflow_runs[] | {name, status, conclusion}'

# View billing
# Settings > Billing > Usage this month
```

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)

## Next Steps

1. **Configure Secrets** - Set up all required secrets
2. **Test Workflows** - Run through each workflow
3. **Configure Environments** - Set up production approval
4. **Set Up Notifications** - Configure Slack/Discord webhooks
5. **Monitor First Deployments** - Watch closely and adjust

## Related Documentation

- [iOS Build Practices](./IOS-BUILD-PRACTICES.md)
- [Android Build Practices](./ANDROID-BUILD-PRACTICES.md)
- [Security Checklist](../09-security/SECURITY-CHECKLIST.md)
- [Environment Variables](../../ENVIRONMENT-VARIABLES.md)
