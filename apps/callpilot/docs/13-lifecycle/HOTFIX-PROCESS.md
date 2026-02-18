# Hotfix Process

## Overview

Hotfixes are emergency patches for critical production issues. Speed is important, but not at the expense of quality.

## When to Hotfix

### Hotfix Required (P0)
- App crashes on launch
- Data loss or corruption
- Security vulnerability
- Payment processing broken
- Authentication broken

### Consider Hotfix (P1)
- Major feature completely broken
- Significant user impact (>10% affected)
- Data integrity issues

### Can Wait for Next Release (P2+)
- Minor bugs
- UI issues
- Performance degradation
- Edge cases

## Hotfix Workflow

### Step 1: Create Hotfix Branch

```bash
# Branch from main (production)
git checkout main
git pull origin main
git checkout -b hotfix/v1.2.1
```

### Step 2: Fix the Issue

```bash
# Make minimal changes
# Write tests for the fix
# Verify fix locally

git add .
git commit -m "fix: resolve crash on task deletion (#129)"
```

### Step 3: Version Bump

```bash
# Patch version only
npm version patch --no-git-tag-version

# Update app.json
# Increment buildNumber/versionCode

git add .
git commit -m "chore: bump version to 1.2.1"
```

### Step 4: Fast-Track Testing

```bash
# Build immediately
eas build --platform all --profile production
```

**Minimum Testing:**
- [ ] Bug is fixed
- [ ] App launches
- [ ] Core features work
- [ ] No new crashes

### Step 5: Emergency Submit

```bash
# Request expedited review (if critical)
eas submit --platform all --profile production

# For App Store: Request expedited review in App Store Connect
# For Google Play: Select "Expedited review" if available
```

### Step 6: Merge Back

```bash
# Merge to main
git checkout main
git merge hotfix/v1.2.1
git tag v1.2.1
git push origin main --tags

# Merge to develop (don't lose the fix!)
git checkout develop
git merge main
git push origin develop

# Delete hotfix branch
git branch -d hotfix/v1.2.1
```

## Expedited Review Requests

### Apple App Store

1. Go to App Store Connect
2. Select your app
3. Click "Request Expedited Review"
4. Explain the critical issue
5. Typical response: 24-48 hours

**Valid Reasons:**
- Critical bug fix
- Security fix
- Time-sensitive content

**Not Valid:**
- New features
- Minor bugs
- Business deadlines

### Google Play

1. Go to Google Play Console
2. Production release → "Request expedited review"
3. Explain the issue
4. Typical response: 24 hours

## Communication

### Internal

```markdown
## 🚨 Hotfix in Progress

**Issue:** App crashes when deleting tasks
**Severity:** P0 - Critical
**Status:** Fix deployed, awaiting review

**Timeline:**
- 10:00 AM: Issue reported
- 10:30 AM: Root cause identified
- 11:00 AM: Fix implemented and tested
- 11:30 AM: Build submitted
- ETA: ~24 hours for review

**Affected Users:** ~500 (5% of daily active)
**Workaround:** Avoid deleting tasks until fix is live
```

### External (If Needed)

```markdown
## Service Update

We've identified an issue affecting task deletion and have
deployed a fix. The update will be available shortly.

In the meantime, you can continue using all other features
normally. We apologize for any inconvenience.
```

## Post-Hotfix

### Incident Review

Within 48 hours of hotfix:

1. **What happened?**
   - Root cause
   - Timeline
   - Impact

2. **Why did it happen?**
   - Was it caught in testing?
   - Was there a code review gap?

3. **How do we prevent it?**
   - Add test coverage
   - Improve review process
   - Add monitoring

### Document the Incident

```markdown
# Incident Report: Task Deletion Crash

**Date:** 2024-01-15
**Duration:** 4 hours
**Severity:** P0
**Affected Users:** ~500

## Summary
Users experienced crashes when attempting to delete tasks
due to a null pointer exception in the deletion handler.

## Root Cause
A recent refactor removed a null check that was needed
when tasks had associated subtasks.

## Resolution
Added null check and unit tests for the edge case.
Hotfix v1.2.1 deployed.

## Action Items
- [ ] Add integration tests for task deletion with subtasks
- [ ] Review all recent refactors for similar issues
- [ ] Add crash alerting threshold (>1% crash rate)
```

## Hotfix vs. Regular Release

| Aspect | Hotfix | Regular Release |
|--------|--------|-----------------|
| Branch from | main | develop |
| Testing | Minimal, focused | Full QA |
| Review | Fast-tracked | Standard |
| Rollout | Immediate | Staged |
| Communication | Urgent | Planned |
| Post-release | Incident review | Retrospective |

## Checklist

### Before Hotfix
- [ ] Issue confirmed in production
- [ ] Severity assessed (P0/P1)
- [ ] Root cause identified
- [ ] Fix verified locally

### During Hotfix
- [ ] Hotfix branch created from main
- [ ] Minimal changes only
- [ ] Tests added for fix
- [ ] Version bumped (patch)
- [ ] Build successful
- [ ] Core functionality tested

### After Hotfix
- [ ] Submitted for review
- [ ] Expedited review requested (if needed)
- [ ] Team notified
- [ ] Monitoring in place
- [ ] Merged to main and develop
- [ ] Incident documented
