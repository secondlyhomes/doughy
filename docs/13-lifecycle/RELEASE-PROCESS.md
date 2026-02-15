# Release Process

## Overview

A structured release process ensures quality, reduces risk, and keeps stakeholders informed.

## Release Types

| Type | Cadence | Review Level | Rollout |
|------|---------|--------------|---------|
| Patch | As needed | Code review | Fast |
| Minor | Bi-weekly | QA + Code review | Staged |
| Major | Monthly+ | Full QA + UAT | Slow |

## Pre-Release Checklist

### 1. Code Freeze

- [ ] Feature branch merged to `develop`
- [ ] No new features after freeze
- [ ] Only bug fixes allowed

### 2. Quality Assurance

- [ ] All tests passing (unit, integration, E2E)
- [ ] Manual test checklist complete
- [ ] No P0/P1 bugs open
- [ ] Performance benchmarks met
- [ ] Security scan passed

### 3. Documentation

- [ ] CHANGELOG.md updated
- [ ] API documentation current
- [ ] User-facing docs updated
- [ ] Internal docs updated

### 4. Version Bump

```bash
# Patch release (1.2.3 → 1.2.4)
npm version patch

# Minor release (1.2.3 → 1.3.0)
npm version minor

# Major release (1.2.3 → 2.0.0)
npm version major
```

## Release Workflow

### Step 1: Create Release Branch

```bash
# From develop branch
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0
```

### Step 2: Version and Tag

```bash
# Update version
npm version 1.2.0 --no-git-tag-version

# Update app.json
# - version: "1.2.0"
# - ios.buildNumber: increment
# - android.versionCode: increment

# Commit
git add .
git commit -m "chore: bump version to 1.2.0"
```

### Step 3: Build

```bash
# Build for TestFlight/Internal Testing
eas build --platform all --profile preview

# For production
eas build --platform all --profile production
```

### Step 4: Test Build

- [ ] Install on physical device
- [ ] Run through critical paths
- [ ] Check analytics tracking
- [ ] Verify crash reporting

### Step 5: Submit

```bash
# Submit to App Store Connect
eas submit --platform ios --profile production

# Submit to Google Play
eas submit --platform android --profile production
```

### Step 6: Merge and Tag

```bash
# Merge to main
git checkout main
git merge release/v1.2.0
git tag v1.2.0
git push origin main --tags

# Merge back to develop
git checkout develop
git merge main
git push origin develop
```

## Staged Rollout

### iOS (TestFlight → App Store)

1. **Internal Testing** (Team)
   - Build available immediately
   - 1-2 days testing

2. **External Testing** (Beta users)
   - Submit for beta review (~24 hours)
   - 2-5 days testing

3. **App Store Release**
   - Submit for review (1-3 days)
   - Phased release: 1% → 5% → 10% → 25% → 50% → 100%

### Android (Internal → Production)

1. **Internal Testing** (Team)
   - Build available immediately
   - 1-2 days testing

2. **Closed Testing** (Beta users)
   - No review required
   - 2-5 days testing

3. **Production Release**
   - Review (~24 hours)
   - Staged rollout: 5% → 25% → 50% → 100%

## Monitoring Post-Release

### First Hour

- [ ] Check crash rates in Sentry
- [ ] Monitor error logs
- [ ] Check key metrics in analytics
- [ ] Watch for user reports

### First Day

- [ ] Compare metrics to previous version
- [ ] Check app store reviews
- [ ] Monitor support tickets
- [ ] Review crash-free rate (target: 99%+)

### First Week

- [ ] Full metrics comparison
- [ ] User feedback analysis
- [ ] Performance regression check
- [ ] Decision: continue rollout or halt

## Rollback Plan

### If Issues Detected

1. **Pause Rollout** (if staged)
   - App Store Connect → Pause phased release
   - Google Play → Halt staged rollout

2. **Assess Severity**
   - P0: Crashes, data loss → Immediate rollback
   - P1: Major bugs → Hotfix or rollback
   - P2: Minor bugs → Hotfix in next release

3. **Rollback Options**

   **Option A: Halt and Fix**
   - Pause rollout
   - Release hotfix
   - Resume rollout

   **Option B: Full Rollback**
   ```bash
   # Rebuild previous version
   git checkout v1.1.0
   eas build --platform all --profile production
   eas submit --platform all
   ```

## CHANGELOG Template

```markdown
# Changelog

## [1.2.0] - 2024-01-15

### Added
- Dark mode support (#123)
- Push notification preferences (#124)

### Changed
- Improved task list performance (#125)
- Updated onboarding flow (#126)

### Fixed
- Fixed crash when deleting tasks (#127)
- Fixed incorrect date display (#128)

### Security
- Updated dependencies with security patches
```

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH

MAJOR: Breaking changes
MINOR: New features (backwards compatible)
PATCH: Bug fixes (backwards compatible)
```

### Build Numbers

- **iOS buildNumber**: Increment for every build
- **Android versionCode**: Increment for every build

```javascript
// Example
{
  "version": "1.2.0",
  "ios": { "buildNumber": "45" },
  "android": { "versionCode": 45 }
}
```

## Communication

### Internal

- Slack/Teams announcement
- Release notes in team wiki
- Demo in team meeting

### External

- App store release notes
- Blog post (major releases)
- Email to users (significant changes)
- Social media (major features)

## Checklist Summary

### Before Release
- [ ] All tests passing
- [ ] Manual testing complete
- [ ] Changelog updated
- [ ] Version bumped
- [ ] Build successful

### During Release
- [ ] TestFlight/Internal build tested
- [ ] Beta testing complete
- [ ] Submitted for review
- [ ] Release notes written

### After Release
- [ ] Monitoring dashboards checked
- [ ] Rollout proceeding normally
- [ ] Team notified
- [ ] Git tags created
- [ ] Branches merged
