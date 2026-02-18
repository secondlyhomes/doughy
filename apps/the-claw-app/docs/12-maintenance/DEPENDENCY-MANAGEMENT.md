# Dependency Management

## Overview

Keep dependencies up to date to:
- Get security fixes
- Avoid breaking changes piling up
- Access new features

## Automated Updates with Renovate

[Renovate](https://docs.renovatebot.com/) automatically creates PRs for dependency updates.

### Setup

1. Install Renovate GitHub App on your repo
2. Add `renovate.json` to repo root:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:base",
    ":preserveSemverRanges"
  ],
  "schedule": ["every weekend"],
  "timezone": "America/Los_Angeles",
  "labels": ["dependencies"],
  "packageRules": [
    {
      "description": "Auto-merge patch updates",
      "matchUpdateTypes": ["patch"],
      "automerge": true
    },
    {
      "description": "Group Expo packages",
      "matchPackagePatterns": ["^expo", "^@expo"],
      "groupName": "expo packages"
    },
    {
      "description": "Group React Native packages",
      "matchPackagePatterns": ["^react-native", "^@react-native"],
      "groupName": "react-native packages"
    },
    {
      "description": "Group Supabase packages",
      "matchPackagePatterns": ["^@supabase"],
      "groupName": "supabase packages"
    }
  ]
}
```

### Key Features

- **Auto-merge patches**: Small updates merge automatically if tests pass
- **Grouped updates**: Related packages updated together
- **Schedule**: Weekly updates to avoid constant PRs

## Manual Updates

### Check for Updates

```bash
# List outdated packages
npm outdated

# Check for issues
npx expo-doctor
```

### Update Process

1. **Read changelog** before updating major versions
2. **Update one group at a time**
3. **Run tests** after each update
4. **Test on device** for native changes

```bash
# Update specific package
npm install package@latest

# Update all (careful!)
npm update
```

## Expo SDK Upgrades

Major Expo SDK updates require special attention.

### Upgrade Steps

1. **Read release notes** on expo.dev/changelog
2. **Update incrementally** (don't skip versions)
3. **Run upgrade command**:

```bash
# Upgrade to latest SDK
npx expo install expo@latest

# Let Expo fix peer dependencies
npx expo install --fix
```

4. **Check for breaking changes** in:
   - `app.json` config
   - Native modules
   - Build configuration

5. **Test thoroughly**:
   - Run `npx expo-doctor`
   - Test on real devices
   - Check all native features

### Common Issues

| Issue | Solution |
|-------|----------|
| Metro cache | `npx expo start --clear` |
| Pod issues | `cd ios && pod install --repo-update` |
| Peer deps | `npx expo install --fix` |

## Security Audits

### npm audit

Run regularly:

```bash
# Check for vulnerabilities
npm audit

# Auto-fix where possible
npm audit fix

# Force fix (may break things)
npm audit fix --force
```

### CI Integration

```yaml
# Add to GitHub Actions
- name: Security audit
  run: npm audit --audit-level=high
```

## Lock File Management

### package-lock.json

- **Always commit** lock file
- **Never manually edit** it
- **Regenerate** if corrupted: `rm package-lock.json && npm install`

### Sync Team Dependencies

```bash
# Clean install from lock file
npm ci

# Don't use `npm install` in CI
```

## Checklist

- [ ] Renovate or Dependabot configured
- [ ] Auto-merge for patches enabled
- [ ] Weekly security audits
- [ ] Lock file committed
- [ ] CI uses `npm ci` not `npm install`
