# Automated Maintenance System

**Last Updated:** 2026-02-07
**Purpose:** Comprehensive guide to the automated staleness detection and maintenance system

---

## Table of Contents

1. [Overview](#overview)
2. [System Components](#system-components)
3. [Configuration](#configuration)
4. [Running Checks](#running-checks)
5. [Understanding Reports](#understanding-reports)
6. [GitHub Actions Automation](#github-actions-automation)
7. [Maintenance Workflows](#maintenance-workflows)
8. [Coverage Recommendations](#coverage-recommendations)
9. [Version Update Strategy](#version-update-strategy)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The automated maintenance system ensures your project stays current by:

- ✅ Detecting stale files and documentation
- ✅ Checking for outdated dependencies
- ✅ Validating documentation health (links, examples, references)
- ✅ Analyzing test coverage
- ✅ Reviewing documentation navigation
- ✅ Generating actionable reports
- ✅ Creating GitHub issues for critical findings
- ✅ Running automatically on a schedule

### Why Automated Maintenance?

Manual maintenance is:
- Time-consuming and error-prone
- Easy to forget or postpone
- Inconsistent across team members
- Difficult to track over time

Automated maintenance ensures:
- Consistent quality checks
- Early detection of issues
- Actionable insights
- Historical tracking
- Reduced technical debt

---

## System Components

### 1. **Staleness Checker** (`check-staleness.js`)

**Purpose:** Detects files that haven't been updated in a long time

**What it checks:**
- File modification dates
- Version references in documentation
- Critical path files (security, deployment, patterns)
- Documentation markers (TODO, FIXME, OUTDATED)

**Thresholds:**
- Warning: 180 days (6 months)
- Critical: 365 days (1 year)
- Deprecated: 730 days (2 years)

**Example usage:**
```bash
# Run staleness check
node scripts/maintenance/check-staleness.js

# Generate HTML report
node scripts/maintenance/check-staleness.js \
  --format html \
  --output .maintenance/staleness.html

# Only show critical issues
node scripts/maintenance/check-staleness.js --critical-only

# Create GitHub issue
node scripts/maintenance/check-staleness.js --create-issue
```

**Critical paths monitored:**
- `docs/patterns/**` - Pattern documentation
- `docs/09-security/**` - Security guides
- `docs/11-deployment/**` - Deployment configs
- `CLAUDE.md` - AI agent instructions
- `QUICKSTART.md` - Getting started guide
- `README.md` - Project overview

### 2. **Version Checker** (`check-versions.js`)

**Purpose:** Checks all dependencies for available updates

**What it checks:**
- NPM package versions vs latest stable
- Major, minor, patch update availability
- Package age and maintenance status
- Security vulnerabilities (via npm audit data)
- Breaking changes in major updates

**Critical dependencies monitored:**
- `expo` - Expo SDK
- `react-native` - React Native framework
- `react` - React library
- `@supabase/supabase-js` - Supabase client
- `typescript` - TypeScript compiler
- `jest` - Testing framework

**Example usage:**
```bash
# Check all dependencies
node scripts/maintenance/check-versions.js

# Check for breaking changes
node scripts/maintenance/check-versions.js --check-breaking

# Generate JSON report
node scripts/maintenance/check-versions.js \
  --format json \
  --output .maintenance/versions.json

# Create GitHub issue
node scripts/maintenance/check-versions.js --create-issue
```

**Age thresholds:**
- Expo, React Native, Supabase:
  - Warning: 90 days
  - Critical: 180 days
- TypeScript, Jest, ESLint:
  - Warning: 90 days
  - Critical: 180 days

### 3. **Documentation Checker** (`check-docs.js`)

**Purpose:** Validates documentation health and accuracy

**What it checks:**
- ✅ Broken internal and external links
- ✅ Invalid code examples (syntax errors)
- ✅ Missing file references
- ✅ TODO/FIXME/OUTDATED markers
- ✅ Outdated screenshots (by file date)

**Example usage:**
```bash
# Run documentation check
node scripts/maintenance/check-docs.js

# Check code examples
node scripts/maintenance/check-docs.js --check-examples

# Attempt to fix broken links
node scripts/maintenance/check-docs.js --fix-links

# Create issue
node scripts/maintenance/check-docs.js --create-issue
```

**Link checking:**
- Timeout: 5 seconds per link
- Retries: 2 attempts
- Excluded domains: localhost, 127.0.0.1, example.com
- Valid status codes: 200-204, 301, 302, 307, 308

### 4. **Coverage Analyzer** (`analyze-coverage.js`)

**Purpose:** Analyzes test coverage and suggests improvements

**What it checks:**
- Overall coverage (statements, branches, functions, lines)
- Coverage by category (critical, high, standard)
- Files below threshold
- Critical paths without sufficient coverage

**Coverage targets:**

| Category | Statements | Branches | Functions | Lines | Paths |
|----------|-----------|----------|-----------|-------|-------|
| **Critical** | 90% | 85% | 90% | 90% | services, hooks, utils |
| **High** | 80% | 75% | 80% | 80% | components, contexts, screens |
| **Standard** | 70% | 60% | 70% | 70% | all src files |

**Example usage:**
```bash
# Analyze coverage (runs tests first if needed)
node scripts/maintenance/analyze-coverage.js

# Generate JSON report
node scripts/maintenance/analyze-coverage.js \
  --format json \
  --output .maintenance/coverage.json

# Create issue for low coverage
node scripts/maintenance/analyze-coverage.js --create-issue
```

### 5. **Navigation Analyzer** (`check-navigation.js`)

**Purpose:** Ensures documentation is well-organized and discoverable

**What it checks:**
- Orphaned documentation (not linked from anywhere)
- Missing category index files (README.md)
- Required links in main docs
- Documentation structure

**Example usage:**
```bash
# Check navigation
node scripts/maintenance/check-navigation.js

# Generate report
node scripts/maintenance/check-navigation.js \
  --format markdown \
  --output .maintenance/navigation.md
```

### 6. **Maintenance Dashboard** (`dashboard.js`)

**Purpose:** Runs all checks and generates comprehensive report

**What it does:**
- Runs all maintenance checks in parallel
- Aggregates results
- Generates HTML/Markdown/JSON reports
- Creates GitHub issues for critical findings
- Provides actionable recommendations

**Example usage:**
```bash
# Run full dashboard
node scripts/maintenance/dashboard.js

# Custom output directory
node scripts/maintenance/dashboard.js --output .maintenance

# Skip specific checks
node scripts/maintenance/dashboard.js \
  --skip-coverage \
  --skip-navigation

# Create GitHub issues
node scripts/maintenance/dashboard.js --create-issues
```

**Output files:**
- `dashboard.html` - Interactive HTML dashboard
- `dashboard.md` - Markdown summary
- `dashboard.json` - Machine-readable data
- `staleness.json` - Staleness details
- `versions.json` - Version check details
- `documentation.json` - Doc check details
- `coverage.json` - Coverage details
- `navigation.json` - Navigation details

---

## Configuration

All configuration is centralized in `.maintenance-config.json`:

### Staleness Configuration

```json
{
  "staleness": {
    "thresholds": {
      "warning": { "days": 180 },
      "critical": { "days": 365 },
      "deprecated": { "days": 730 }
    },
    "criticalPaths": [
      "docs/patterns/**",
      "docs/09-security/**",
      "CLAUDE.md"
    ]
  }
}
```

### Version Configuration

```json
{
  "versions": {
    "dependencies": {
      "expo": {
        "warningAge": 90,
        "criticalAge": 180
      }
    },
    "ignoredPackages": ["husky", "chalk"]
  }
}
```

### Coverage Configuration

```json
{
  "coverage": {
    "targets": {
      "critical": {
        "statements": 90,
        "branches": 85,
        "functions": 90,
        "lines": 90,
        "paths": ["src/services/**", "src/hooks/**"]
      }
    }
  }
}
```

### GitHub Integration

```json
{
  "github": {
    "issues": {
      "staleness": {
        "title": "[Maintenance] Stale files detected",
        "labels": ["maintenance", "documentation"]
      }
    }
  }
}
```

---

## Running Checks

### Manual Runs

```bash
# Run individual checks
npm run maintenance:staleness
npm run maintenance:versions
npm run maintenance:docs
npm run maintenance:coverage
npm run maintenance:navigation

# Run full dashboard
npm run maintenance:dashboard

# Run with custom config
node scripts/maintenance/dashboard.js --config .maintenance-config.custom.json
```

### Scheduled Runs

Checks run automatically via GitHub Actions:

- **Weekly:** Every Monday at 9 AM UTC
- **On-demand:** Manual workflow trigger
- **PR comments:** Optional PR analysis

### Local Development

```bash
# Quick check before committing
node scripts/maintenance/check-staleness.js --critical-only

# Full check before PR
node scripts/maintenance/dashboard.js --output .maintenance
```

---

## Understanding Reports

### Report Sections

#### 1. Summary
High-level metrics:
- Total files/dependencies checked
- Issues found by severity
- Pass/fail status

#### 2. Recommendations
Prioritized action items:
- **Critical (🔴):** Immediate attention required
- **High (🟡):** Address soon (within 1 week)
- **Medium (🔵):** Address in next sprint
- **Low (⚪):** Nice to have

#### 3. Detailed Findings
File-by-file or package-by-package breakdown with:
- Current state
- Required state
- Gap analysis
- Specific recommendations

### Priority Levels

| Priority | Action Timeline | Examples |
|----------|----------------|----------|
| **Critical** | Immediate (24-48 hours) | Security docs >1 year old, vulnerable dependencies |
| **High** | This week | Pattern docs >6 months old, major version updates |
| **Medium** | This sprint | Minor updates, orphaned docs |
| **Low** | Next sprint | Patch updates, optional improvements |

### Reading HTML Dashboard

The HTML dashboard provides:

1. **Stats Cards:** Quick overview of all metrics
2. **Check Results:** Status of each maintenance check
3. **Top Recommendations:** Most important action items
4. **Detailed Reports:** Drill-down into specific issues

**Color coding:**
- 🟢 Green: Excellent (>80%)
- ✅ Blue: Good (meets threshold)
- 🟡 Yellow: Fair (within 10% of threshold)
- 🔴 Red: Needs improvement (<threshold)

---

## GitHub Actions Automation

### Workflow: `.github/workflows/maintenance.yml`

**Triggers:**
- Schedule: Every Monday at 9 AM UTC
- Manual: `workflow_dispatch` event
- Optional: On pull requests

**Jobs:**

1. **maintenance-dashboard**
   - Runs all checks
   - Generates reports
   - Uploads artifacts
   - Posts summary

2. **create-maintenance-pr**
   - Creates PR with reports (if critical/high issues)
   - Updates timestamp in config
   - Labels as automated maintenance

3. **notify-on-critical**
   - Creates GitHub issue for critical findings
   - Sends notifications (if configured)

4. **cleanup-old-reports**
   - Removes reports older than 30 days
   - Keeps repo clean

### Customizing the Workflow

```yaml
# Run only specific checks
on:
  schedule:
    - cron: '0 9 * * 1'  # Weekly
  workflow_dispatch:
    inputs:
      skip_checks:
        description: 'Checks to skip'
        default: 'coverage,navigation'
```

### Viewing Results

1. **GitHub Actions UI:**
   - Go to Actions tab
   - Click on latest "Automated Maintenance" run
   - View job summaries and logs

2. **Artifacts:**
   - Download `maintenance-reports` artifact
   - Extract and view HTML reports locally

3. **GitHub Pages (if enabled):**
   - Visit `https://[your-org].github.io/[repo]/maintenance/`

4. **Pull Requests:**
   - Automated PRs contain reports
   - Review and merge to track maintenance

---

## Maintenance Workflows

### Weekly Maintenance Routine

**Monday (Automated):**
1. GitHub Actions runs full dashboard
2. Report is generated and uploaded
3. PR is created (if needed)
4. Issue is created (if critical)

**Monday-Friday (Manual):**
1. Review automated PR/issue
2. Address critical items immediately
3. Plan high-priority items for the week
4. Schedule medium items for sprint

**Friday (Review):**
1. Check progress on weekly items
2. Update any stale documentation
3. Merge maintenance PR

### Quarterly Deep Dive

**Every 3 months:**

1. **Full dependency audit**
   ```bash
   npm outdated
   npm audit
   node scripts/maintenance/check-versions.js --check-breaking
   ```

2. **Documentation review**
   - Review all pattern docs
   - Update version references
   - Verify all code examples work
   - Check screenshots are current

3. **Coverage improvement**
   - Identify low-coverage critical paths
   - Add tests to reach 90% in services/hooks/utils
   - Update coverage thresholds if needed

4. **Navigation optimization**
   - Review documentation structure
   - Remove obsolete docs
   - Add new category indexes
   - Update CLAUDE.md with new patterns

### Version Update Workflow

**For minor/patch updates:**

1. Review version check report
2. Update package.json:
   ```bash
   npm install package-name@latest
   ```
3. Run tests:
   ```bash
   npm test && npm run type-check
   ```
4. Update docs if needed
5. Commit and push

**For major updates:**

1. Read changelog and breaking changes
2. Create feature branch:
   ```bash
   git checkout -b upgrade/expo-55
   ```
3. Update dependencies
4. Fix breaking changes
5. Update documentation
6. Run full test suite
7. Test on physical devices
8. Create PR with migration notes
9. Review and merge

---

## Coverage Recommendations

### Current Thresholds

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    statements: 70,
    branches: 60,
    functions: 70,
    lines: 70
  }
}
```

### Recommended Targets

| File Type | Statements | Branches | Functions | Lines | Rationale |
|-----------|-----------|----------|-----------|-------|-----------|
| **Services** | 90%+ | 85%+ | 90%+ | 90%+ | Critical business logic |
| **Hooks** | 85%+ | 80%+ | 85%+ | 85%+ | Reusable stateful logic |
| **Utils** | 90%+ | 85%+ | 90%+ | 90%+ | Pure functions, easy to test |
| **Components** | 75%+ | 70%+ | 75%+ | 75%+ | UI logic, snapshot tests |
| **Contexts** | 80%+ | 75%+ | 80%+ | 80%+ | State management |
| **Screens** | 70%+ | 60%+ | 70%+ | 70%+ | Integration tests preferred |

### Improving Coverage

**1. Start with critical paths:**
```bash
# Identify untested critical files
node scripts/maintenance/analyze-coverage.js

# Focus on services, hooks, utils first
npm run test:unit -- src/services
```

**2. Use coverage gaps to guide testing:**
```bash
# Generate detailed coverage report
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html
```

**3. Test strategies by file type:**

**Services (90%+ target):**
- Test all public methods
- Test error handling
- Test edge cases
- Mock external dependencies

**Hooks (85%+ target):**
- Test initial state
- Test state updates
- Test side effects
- Test cleanup

**Components (75%+ target):**
- Snapshot tests for UI
- Interaction tests
- Prop variation tests
- Error boundary tests

**4. Incremental improvement:**
```bash
# Set realistic goals
# Week 1: Get services to 85%
# Week 2: Get hooks to 80%
# Week 3: Get utils to 90%
# Week 4: Review and adjust thresholds
```

**5. Make coverage a PR requirement:**
```yaml
# .github/workflows/ci.yml
- name: Check coverage
  run: npm run test:coverage
  # Fails if below threshold
```

### Coverage Exemptions

Exempt these files from coverage requirements:

```javascript
// jest.config.js
collectCoverageFrom: [
  'src/**/*.{ts,tsx}',
  '!src/**/*.d.ts',           // Type definitions
  '!src/**/*.stories.tsx',     // Storybook stories
  '!src/**/__tests__/**',      // Test files
  '!src/**/index.{ts,tsx}',   // Re-export files
  '!src/**/*.types.{ts,tsx}'  // Type-only files
]
```

### Coverage Best Practices

1. **Test behavior, not implementation**
   - Focus on what the code does, not how
   - Test public APIs, not private details

2. **Aim for meaningful coverage**
   - 100% coverage doesn't mean bug-free
   - Focus on critical paths and edge cases

3. **Use coverage as a guide**
   - Identify untested areas
   - Don't write tests just for coverage

4. **Balance unit and integration tests**
   - Unit tests: Fast, focused, 80% of tests
   - Integration tests: Realistic, slower, 20% of tests

5. **Review coverage in PR reviews**
   - Check if new code has tests
   - Ensure coverage doesn't decrease

---

## Version Update Strategy

### Update Frequency

| Type | Frequency | Examples |
|------|-----------|----------|
| **Patch** | Weekly | Bug fixes, security patches |
| **Minor** | Monthly | New features (backwards compatible) |
| **Major** | Quarterly | Breaking changes |

### Dependency Categories

**1. Critical (Update weekly):**
- Security-related packages
- Expo SDK
- React Native
- Supabase client

**2. Important (Update monthly):**
- TypeScript
- Jest
- ESLint
- Testing libraries

**3. Development (Update as needed):**
- Prettier
- Husky
- CLI tools

### Update Process

#### Automated Checks

```bash
# Check for updates
npm outdated

# Check for security issues
npm audit

# Run version checker
node scripts/maintenance/check-versions.js
```

#### Manual Review

1. **Read changelogs:**
   - Expo: https://docs.expo.dev/versions/latest/
   - React Native: https://reactnative.dev/blog
   - Supabase: https://github.com/supabase/supabase-js/releases

2. **Check for breaking changes:**
   - Look for BREAKING CHANGE tags
   - Review migration guides
   - Check GitHub issues

3. **Plan migration:**
   - Estimate effort
   - Identify affected areas
   - Schedule update

#### Testing Updates

```bash
# Update in test environment
npm install package-name@latest

# Run full test suite
npm run validate:full

# Test on devices
npm run ios
npm run android

# Check for deprecation warnings
npm run start
```

#### Rollback Plan

```bash
# If update causes issues, rollback:
git checkout package.json package-lock.json
npm install

# Or revert specific package:
npm install package-name@previous-version
```

### Handling Breaking Changes

**1. Expo SDK major update:**

```bash
# Example: Expo 54 → 55
npx expo-doctor  # Check compatibility

# Update SDK
npx expo install --fix

# Update dependencies
npm install

# Fix breaking changes (see migration guide)
# Test thoroughly
npm run validate:full

# Update docs
# Update CLAUDE.md with new SDK version
```

**2. React Native major update:**

```bash
# Use upgrade helper
npx react-native upgrade

# Or use Expo upgrade
npx expo install react-native@version

# Fix platform-specific issues
# Test on both iOS and Android
```

**3. Supabase client major update:**

```bash
# Read migration guide
# Update client
npm install @supabase/supabase-js@latest

# Update type definitions
npm run gen:types

# Fix breaking changes in services
# Update auth flow if needed
# Test all Supabase integrations
```

### Version Pinning

**When to pin versions:**
- Production dependencies
- Critical packages (Expo, React Native)
- After major updates (let them stabilize)

**How to pin:**
```json
{
  "dependencies": {
    "expo": "54.0.0",          // Exact version
    "react-native": "~0.76.5", // Patch updates only
    "react": "^18.3.1"         // Minor updates allowed
  }
}
```

**Version range symbols:**
- `54.0.0` - Exact version only
- `~54.0.0` - Patch updates (54.0.x)
- `^54.0.0` - Minor updates (54.x.x)

---

## Best Practices

### 1. Regular Maintenance Schedule

**Daily:**
- Monitor CI/CD failures
- Review Dependabot PRs

**Weekly:**
- Review automated maintenance report
- Address critical issues
- Update stale docs (if any)

**Monthly:**
- Review and update minor dependencies
- Update documentation for new features
- Check coverage trends

**Quarterly:**
- Deep dive on documentation
- Major dependency updates
- Coverage improvement sprint

### 2. Documentation Freshness

**Add timestamps to docs:**
```markdown
<!-- Last Updated: 2026-02-07 -->
<!-- Verified with: Expo SDK 54, React Native 0.76 -->
```

**Use version markers:**
```markdown
## Setup (Expo SDK 54+)

> **Note:** This guide is for Expo SDK 54 and later.
> For older versions, see [legacy-setup.md](./legacy-setup.md)
```

**Include sources:**
```markdown
## Sources

- [Expo Docs](https://docs.expo.dev/...)
- [Production Example](https://github.com/...)
- Updated: 2026-02-07
```

### 3. Proactive Maintenance

**Before issues arise:**
- Set up automated checks (done ✅)
- Review reports weekly
- Act on critical items immediately

**After issues found:**
- Prioritize by impact
- Fix root causes, not symptoms
- Update processes to prevent recurrence

### 4. Team Communication

**Share maintenance insights:**
- Post weekly summaries in Slack/Discord
- Discuss in sprint planning
- Assign ownership for specific areas

**Document decisions:**
- Why certain versions are pinned
- Why specific thresholds are set
- Why some packages are ignored

### 5. Continuous Improvement

**Track metrics:**
- Staleness over time
- Coverage trends
- Update frequency

**Adjust thresholds:**
- Make them stricter as project matures
- Relax for less critical areas
- Align with team capacity

---

## Troubleshooting

### Common Issues

#### 1. Staleness check fails with permission error

**Problem:** Can't read certain files

**Solution:**
```bash
# Check file permissions
ls -la problematic-file

# Fix permissions
chmod 644 problematic-file
```

#### 2. Version checker can't fetch package info

**Problem:** Network timeouts or rate limiting

**Solution:**
```bash
# Use local cache
npm outdated

# Or increase timeout
node scripts/maintenance/check-versions.js --timeout 10000
```

#### 3. Documentation checker finds too many broken links

**Problem:** External sites are down or blocking

**Solution:**
```json
// .maintenance-config.json
{
  "documentation": {
    "linkCheck": {
      "excludeDomains": ["problematic-domain.com"],
      "timeout": 10000
    }
  }
}
```

#### 4. Coverage check fails in CI

**Problem:** Tests timeout or run out of memory

**Solution:**
```yaml
# .github/workflows/maintenance.yml
- name: Run test coverage
  run: npm run test:coverage
  env:
    NODE_OPTIONS: --max_old_space_size=4096
  timeout-minutes: 20
```

#### 5. GitHub Actions workflow fails

**Problem:** Missing permissions

**Solution:**
```yaml
permissions:
  contents: write    # For creating commits
  issues: write      # For creating issues
  pull-requests: write  # For creating PRs
```

#### 6. Dashboard generates empty reports

**Problem:** Checks fail silently

**Solution:**
```bash
# Run checks individually to debug
node scripts/maintenance/check-staleness.js
node scripts/maintenance/check-versions.js
node scripts/maintenance/check-docs.js

# Check for errors in output
```

### Getting Help

**1. Check logs:**
```bash
# Local runs
node scripts/maintenance/dashboard.js 2>&1 | tee maintenance.log

# GitHub Actions
# View workflow run logs in Actions tab
```

**2. Enable debug mode:**
```bash
DEBUG=* node scripts/maintenance/dashboard.js
```

**3. File an issue:**
```bash
gh issue create \
  --title "Maintenance system issue" \
  --body "Describe the problem" \
  --label maintenance,bug
```

---

## Summary

The automated maintenance system helps you:

✅ **Stay current** - Automatically detect stale content
✅ **Stay secure** - Monitor for outdated dependencies
✅ **Stay reliable** - Maintain test coverage
✅ **Stay organized** - Keep documentation navigable
✅ **Save time** - Automate repetitive checks
✅ **Reduce risk** - Catch issues early

**Key takeaways:**

1. **Run weekly** - Maintenance is most effective when regular
2. **Act on critical items** - Don't let them pile up
3. **Adjust thresholds** - Match your team's capacity
4. **Track trends** - Improvement takes time
5. **Communicate** - Share insights with your team

**Next steps:**

1. Review the generated reports in `.maintenance/`
2. Address critical and high-priority items
3. Set up weekly review routine
4. Customize thresholds in `.maintenance-config.json`
5. Enable GitHub Actions automation

---

**Questions?** Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) or file an issue.