# Maintenance Scripts

Automated tools for detecting staleness, checking versions, validating documentation, analyzing coverage, and maintaining project health.

## Quick Start

```bash
# Run full maintenance dashboard
npm run maintenance:dashboard

# Run individual checks
npm run maintenance:staleness
npm run maintenance:versions
npm run maintenance:docs
npm run maintenance:coverage
npm run maintenance:navigation
```

## Scripts

### 1. `check-staleness.js`

Detects files that haven't been updated in a long time.

**Usage:**
```bash
node scripts/maintenance/check-staleness.js [options]

Options:
  --config <path>     Path to maintenance config (default: .maintenance-config.json)
  --format <type>     Output format: json|html|markdown (default: markdown)
  --output <path>     Output file path (default: console)
  --threshold <days>  Override warning threshold in days
  --critical-only     Only report critical staleness issues
  --create-issue      Create GitHub issue for findings
  --help              Show help message
```

**Examples:**
```bash
# Basic check
node scripts/maintenance/check-staleness.js

# Generate HTML report
node scripts/maintenance/check-staleness.js --format html --output .maintenance/staleness.html

# Only critical files (>1 year old)
node scripts/maintenance/check-staleness.js --critical-only

# Create GitHub issue
node scripts/maintenance/check-staleness.js --create-issue
```

**What it checks:**
- File modification dates
- Version references in docs
- Critical paths (security, patterns, deployment)
- TODO/FIXME/OUTDATED markers

**Thresholds:**
- Warning: 180 days (6 months)
- Critical: 365 days (1 year)
- Deprecated: 730 days (2 years)

### 2. `check-versions.js`

Checks all dependencies for available updates and security issues.

**Usage:**
```bash
node scripts/maintenance/check-versions.js [options]

Options:
  --config <path>       Path to maintenance config
  --format <type>       Output format: json|markdown|html
  --output <path>       Output file path
  --check-breaking      Check for breaking changes in updates
  --update-minor        Create PR for minor updates
  --create-issue        Create GitHub issue
  --help                Show help message
```

**Examples:**
```bash
# Check all dependencies
node scripts/maintenance/check-versions.js

# Check with breaking change detection
node scripts/maintenance/check-versions.js --check-breaking

# Generate JSON report
node scripts/maintenance/check-versions.js --format json --output .maintenance/versions.json
```

**What it checks:**
- NPM package versions vs latest
- Major, minor, patch updates
- Package age and maintenance status
- Security vulnerabilities
- Breaking changes (with --check-breaking)

### 3. `check-docs.js`

Validates documentation health (links, examples, references).

**Usage:**
```bash
node scripts/maintenance/check-docs.js [options]

Options:
  --config <path>     Path to maintenance config
  --format <type>     Output format: json|markdown|html
  --output <path>     Output file path
  --fix-links         Attempt to fix broken links automatically
  --check-examples    Validate code examples compile
  --create-issue      Create GitHub issue for findings
  --help              Show help message
```

**Examples:**
```bash
# Basic documentation check
node scripts/maintenance/check-docs.js

# Check code examples
node scripts/maintenance/check-docs.js --check-examples

# Fix broken links automatically
node scripts/maintenance/check-docs.js --fix-links
```

**What it checks:**
- Broken internal and external links
- Invalid code examples (syntax errors)
- Missing file references
- TODO/FIXME/OUTDATED markers
- Outdated screenshots

### 4. `analyze-coverage.js`

Analyzes test coverage and provides improvement recommendations.

**Usage:**
```bash
node scripts/maintenance/analyze-coverage.js [options]

Options:
  --config <path>     Path to maintenance config
  --format <type>     Output format: json|markdown
  --output <path>     Output file path
  --create-issue      Create GitHub issue for low coverage areas
  --help              Show help message
```

**Examples:**
```bash
# Analyze coverage (runs tests first if needed)
node scripts/maintenance/analyze-coverage.js

# Generate JSON report
node scripts/maintenance/analyze-coverage.js --format json --output .maintenance/coverage.json
```

**What it analyzes:**
- Overall coverage by metric
- Coverage by category (critical, high, standard)
- Files below threshold
- Critical paths without sufficient coverage

**Coverage targets:**
- Critical (services, hooks, utils): 90%+ statements, 85%+ branches
- High (components, contexts): 80%+ statements, 75%+ branches
- Standard (all src): 70%+ statements, 60%+ branches

### 5. `check-navigation.js`

Ensures documentation is well-organized and discoverable.

**Usage:**
```bash
node scripts/maintenance/check-navigation.js [options]

Options:
  --config <path>     Path to maintenance config
  --format <type>     Output format: json|markdown
  --output <path>     Output file path
  --help              Show help message
```

**Examples:**
```bash
# Check navigation
node scripts/maintenance/check-navigation.js

# Generate report
node scripts/maintenance/check-navigation.js --output .maintenance/navigation.md
```

**What it checks:**
- Orphaned documentation (not linked)
- Missing category indexes
- Required links in main docs
- Documentation structure

### 6. `dashboard.js`

Runs all checks and generates a comprehensive report.

**Usage:**
```bash
node scripts/maintenance/dashboard.js [options]

Options:
  --config <path>       Path to maintenance config
  --format <type>       Output format: json|markdown|html
  --output <path>       Output directory (default: .maintenance)
  --create-issues       Create GitHub issues for findings
  --skip-staleness      Skip staleness check
  --skip-versions       Skip version check
  --skip-docs           Skip documentation check
  --skip-coverage       Skip coverage check
  --skip-navigation     Skip navigation check
  --help                Show help message
```

**Examples:**
```bash
# Run full dashboard
node scripts/maintenance/dashboard.js

# Skip specific checks
node scripts/maintenance/dashboard.js --skip-coverage --skip-navigation

# Create GitHub issues for critical findings
node scripts/maintenance/dashboard.js --create-issues
```

**Output:**
- `dashboard.html` - Interactive HTML dashboard
- `dashboard.md` - Markdown summary
- `dashboard.json` - Machine-readable data
- Individual check reports (JSON format)

## Configuration

All scripts use `.maintenance-config.json` in the project root.

**Key sections:**

```json
{
  "staleness": {
    "thresholds": {
      "warning": { "days": 180 },
      "critical": { "days": 365 }
    }
  },
  "versions": {
    "dependencies": {
      "expo": {
        "warningAge": 90,
        "criticalAge": 180
      }
    }
  },
  "coverage": {
    "targets": {
      "critical": {
        "statements": 90,
        "branches": 85
      }
    }
  }
}
```

See `.maintenance-config.json` for full configuration options.

## NPM Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "maintenance:staleness": "node scripts/maintenance/check-staleness.js",
    "maintenance:versions": "node scripts/maintenance/check-versions.js",
    "maintenance:docs": "node scripts/maintenance/check-docs.js --check-examples",
    "maintenance:coverage": "node scripts/maintenance/analyze-coverage.js",
    "maintenance:navigation": "node scripts/maintenance/check-navigation.js",
    "maintenance:dashboard": "node scripts/maintenance/dashboard.js --output .maintenance",
    "maintenance:report": "node scripts/maintenance/dashboard.js --output .maintenance --create-issues"
  }
}
```

## GitHub Actions

Automated checks run weekly via `.github/workflows/maintenance.yml`.

**Schedule:** Every Monday at 9 AM UTC

**What it does:**
1. Runs all maintenance checks
2. Generates reports
3. Creates PR with findings (if critical/high issues)
4. Creates GitHub issue (if critical issues)
5. Uploads artifacts

**Manual trigger:**
```bash
gh workflow run maintenance.yml
```

## Output Files

All reports are saved to `.maintenance/` directory:

```
.maintenance/
├── dashboard.html          # Interactive HTML dashboard
├── dashboard.md            # Markdown summary
├── dashboard.json          # Machine-readable data
├── staleness.json          # Staleness check details
├── versions.json           # Version check details
├── documentation.json      # Documentation check details
├── coverage.json           # Coverage analysis details
└── navigation.json         # Navigation check details
```

**Viewing reports:**

```bash
# Open HTML dashboard in browser
open .maintenance/dashboard.html

# View markdown summary
cat .maintenance/dashboard.md

# Parse JSON data
jq '.summary' .maintenance/dashboard.json
```

## Interpreting Results

### Priority Levels

| Priority | Icon | Action Timeline | Examples |
|----------|------|----------------|----------|
| Critical | 🔴 | Immediate (24-48h) | Security docs >1 year old, vulnerable deps |
| High | 🟡 | This week | Pattern docs >6 months old, major updates |
| Medium | 🔵 | This sprint | Minor updates, orphaned docs |
| Low | ⚪ | Next sprint | Patch updates, optional improvements |

### Status Indicators

- ✅ **Pass:** No issues found
- ⚠️ **Warning:** Issues found but not critical
- ❌ **Fail:** Critical issues found

### Recommendations

Each report includes:
1. **What:** Description of the issue
2. **Why:** Impact and importance
3. **How:** Specific action to take
4. **Where:** Affected files/packages

## Best Practices

1. **Run weekly:** Set up automated checks via GitHub Actions
2. **Act on critical items:** Don't let them accumulate
3. **Review trends:** Track improvement over time
4. **Customize thresholds:** Adjust based on team capacity
5. **Document decisions:** Why certain versions are pinned, etc.

## Troubleshooting

### Script fails with permission error

```bash
# Check file permissions
ls -la scripts/maintenance/

# Make executable
chmod +x scripts/maintenance/*.js
```

### Can't create GitHub issues

```bash
# Authenticate with GitHub CLI
gh auth login

# Test issue creation
gh issue create --title "Test" --body "Test issue"
```

### Coverage report not found

```bash
# Run tests first
npm run test:coverage

# Then run analyzer
node scripts/maintenance/analyze-coverage.js
```

### Network timeouts (version/docs check)

```json
// Increase timeout in .maintenance-config.json
{
  "documentation": {
    "linkCheck": {
      "timeout": 10000
    }
  }
}
```

## Documentation

Full documentation: [docs/12-maintenance/AUTOMATED-MAINTENANCE.md](../../docs/12-maintenance/AUTOMATED-MAINTENANCE.md)

Topics covered:
- System overview
- Configuration guide
- Running checks
- Understanding reports
- GitHub Actions automation
- Coverage recommendations
- Version update strategy
- Best practices
- Troubleshooting

## Support

- **Documentation issues:** File issue with `documentation` label
- **Script bugs:** File issue with `maintenance` label
- **Feature requests:** File issue with `enhancement` label

## License

MIT - Same as project license
