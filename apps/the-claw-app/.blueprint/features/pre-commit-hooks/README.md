# Pre-commit Hooks Feature

**Status:** Essential (Recommended for all projects)
**Cost:** FREE
**Dependencies:** Husky + lint-staged

## What It Does

Automatically runs code quality checks before every commit:
- ✅ ESLint (with auto-fix)
- ✅ Prettier formatting
- ✅ TypeScript type checking
- ✅ Tests for changed files

**Result:** Bad code never reaches CI/CD or your team.

## When to Enable

✅ **Enable if:**
- Working on a team (ensures code quality)
- Want to catch bugs early
- Need consistent code formatting

❌ **Skip if:**
- Solo prototyping (can slow you down)
- Working on non-critical experiments

## Installation

When you enable this feature, the setup script will:
1. Install `husky` and `lint-staged` as dev dependencies
2. Create `.husky/pre-commit` hook
3. Add `lint-staged` configuration to `package.json`
4. Test the hooks work

**Time to enable:** 1-2 minutes

## Usage

### After Enabling

Hooks run automatically on every `git commit`. No action needed!

**Example:**
```bash
git add .
git commit -m "feat: add new feature"

# Hooks run automatically:
# ✓ Running ESLint...
# ✓ Running Prettier...
# ✓ Running TypeScript check...
# ✓ Running tests...
# ✓ Commit successful!
```

### Bypass Hooks (Emergency Only)

```bash
git commit --no-verify -m "emergency fix"
```

**Warning:** Only use `--no-verify` for genuine emergencies. Bad code will reach CI/CD.

## What Files Are Created

```
.husky/
├── _/                          # Husky runtime
├── pre-commit                  # Pre-commit hook script
└── commit-msg                  # Commit message validation

package.json                    # Updated with lint-staged config
```

## Configuration

### Default Configuration

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

### Customize

Edit the `lint-staged` section in `package.json` to add/remove checks.

**Examples:**

**Skip tests in pre-commit:**
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
      // Removed: npm test -- --bail --findRelatedTests
    ]
  }
}
```

**Add spell checking:**
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "cspell"
    ]
  }
}
```

## Troubleshooting

### Hooks Not Running

```bash
# Reinstall hooks
npx husky install
```

### Hooks Too Slow

```bash
# Remove test running from pre-commit
# Edit package.json lint-staged config
# Tests will still run in CI/CD
```

### False Positives

```bash
# Temporarily disable for one commit
git commit --no-verify -m "message"

# Fix the linting rule instead (preferred)
# Edit .eslintrc.js
```

## Performance

**Typical run time:** 2-10 seconds (depending on number of files changed)

**Optimizations:**
- Only runs on staged files (not entire codebase)
- Skips tests if no test files changed
- Runs in parallel where possible

## Further Reading

- [Husky documentation](https://typicode.github.io/husky/)
- [lint-staged documentation](https://github.com/okonet/lint-staged)
- [Conventional Commits](https://www.conventionalcommits.org/)
