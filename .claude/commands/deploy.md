---
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, WebSearch
description: Deploy the mobile application. Runs checks, bumps version, builds, and submits to app stores.
---

## When to Use This Skill

Use `/deploy` when:
- Ready to ship a new version to TestFlight/Play Store
- Need to create a production build
- Want to run the full pre-deploy checklist

## Deployment Protocol

### 1. Pre-Deployment Checks

Run comprehensive checks:

```bash
npm run pre-deploy:check
```

**Checks performed:**
- ✅ Version bumped since last release
- ✅ All tests passing
- ✅ TypeScript compiles
- ✅ No hardcoded secrets
- ✅ CHANGELOG updated
- ✅ Git working directory clean
- ✅ On main/master branch
- ✅ No console.log in production
- ✅ Dependencies secure
- ✅ Environment configured

**If checks fail:** Fix issues before proceeding

### 2. Analyze Commits

Review commits since last release:

```bash
git log $(git describe --tags --abbrev=0)..HEAD --oneline
```

Identify commit types:
- `feat:` → Minor version bump
- `fix:` → Patch version bump
- `BREAKING CHANGE:` → Major version bump

### 3. Version Bump

**Auto-detect (recommended):**
```bash
npm run version:bump
```

**Manual override:**
```bash
npm run version:bump major  # x.0.0
npm run version:bump minor  # 0.x.0
npm run version:bump patch  # 0.0.x
```

**What it does:**
- Analyzes conventional commits
- Determines bump type
- Updates `package.json` version
- Updates `app.json` version + build numbers
- Creates git tag (`v1.2.3`)

### 4. Generate Changelog

```bash
npm run changelog:generate
```

**What it does:**
- Reads commits since last tag
- Groups by type (features, fixes, breaking)
- Updates `CHANGELOG.md`
- Formats with markdown

**Review changelog** before continuing

### 5. Commit Changes

```bash
# Stage release files
git add package.json app.json CHANGELOG.md

# Create release commit
git commit -m "chore: release v1.2.3"
```

### 6. Push to Remote

```bash
# Push commits
git push origin main

# Push tags
git push origin v1.2.3
```

### 7. Build with EAS (Optional)

**iOS:**
```bash
eas build --platform ios --profile production
```

**Android:**
```bash
eas build --platform android --profile production
```

**Monitor build:**
- Check EAS dashboard: https://expo.dev
- Wait for build to complete

### 8. Submit to Stores (Optional)

**TestFlight (iOS):**
```bash
eas submit --platform ios --latest
```

**Play Store Internal Testing (Android):**
```bash
eas submit --platform android --track internal --latest
```

## Interactive Mode

For guided deployment:

```bash
npm run deploy
```

**This runs all steps interactively:**
1. Prompts for version bump type
2. Shows changes for review
3. Asks to commit and push
4. Optionally builds and submits

## Manual Step-by-Step

If you prefer manual control:

**1. Check readiness:**
```bash
npm run pre-deploy:check
```

**2. Bump version:**
```bash
npm run version:bump
```

**3. Generate changelog:**
```bash
npm run changelog:generate
```

**4. Review changes:**
```bash
git diff package.json app.json CHANGELOG.md
```

**5. Commit:**
```bash
git add package.json app.json CHANGELOG.md
git commit -m "chore: release v$(node -p 'require(\"./package.json\").version')"
```

**6. Push:**
```bash
git push origin main
git push origin --tags
```

## Rollback

If deployment fails and you need to rollback:

**Before pushing:**
```bash
# Revert changes
git checkout package.json app.json CHANGELOG.md

# Remove tag
git tag -d v1.2.3
```

**After pushing:**
```bash
# Create hotfix
git revert HEAD

# Or delete remote tag (careful!)
git push origin :refs/tags/v1.2.3
```

## Best Practices

1. **Always run checks first** - Catch issues early
2. **Review changelog** - Ensure it's accurate and complete
3. **Test builds locally** - Run `npm start` before building
4. **Use staging builds first** - Test with beta testers
5. **Monitor after deploy** - Watch for crashes and errors

## Troubleshooting

### "Version not bumped"

**Solution:** Run `npm run version:bump`

### "Tests failing"

**Solution:** Fix tests before deploying:
```bash
npm test
```

### "TypeScript errors"

**Solution:** Fix type errors:
```bash
npx tsc --noEmit
```

### "Hardcoded secrets found"

**Solution:** Remove secrets and use environment variables:
```bash
grep -r "sk-" src/  # Find secrets
# Move to .env or Supabase Vault
```

### "CHANGELOG not updated"

**Solution:** Run changelog generator:
```bash
npm run changelog:generate
```

### "EAS build failed"

**Solutions:**
- Check EAS dashboard for errors
- Verify `eas.json` configuration
- Ensure credentials are valid
- Check Expo version compatibility

## Release Notes Template

After deployment, create GitHub release:

```markdown
## What's New

- Feature 1
- Feature 2

## Bug Fixes

- Fix 1
- Fix 2

## Breaking Changes

- Change 1 (migration guide)

## Installation

iOS: [TestFlight Link]
Android: [Play Store Internal Testing Link]
```

## Versioning Guide

**Major (1.0.0 → 2.0.0):**
- Breaking changes
- Major feature overhauls
- API changes

**Minor (1.0.0 → 1.1.0):**
- New features
- Non-breaking enhancements
- New screens/functionality

**Patch (1.0.0 → 1.0.1):**
- Bug fixes
- Small improvements
- Security patches

## Related

- **Version Bump:** `scripts/version-bump.js`
- **Changelog:** `scripts/generate-changelog.js`
- **Pre-Deploy Checks:** `scripts/pre-deployment-check.js`
- **Deploy Script:** `scripts/deploy.js`
- **EAS Docs:** https://docs.expo.dev/build/introduction/
