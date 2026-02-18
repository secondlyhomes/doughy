# Visual Regression Testing Feature (BackstopJS)

**Status:** Optional (Low Priority)
**Cost:** FREE
**Dependencies:** BackstopJS (npm package)

## What It Does

Automatically detect visual changes in your UI by comparing screenshots.

**Best for:** Teams with frequent UI bugs or large component libraries

## When to Enable

✅ **Enable if:**
- UI bugs > 5/month
- Large team (5+ developers)
- Design system with many components

❌ **Skip if:**
- Small team (< 3 developers)
- UI changes infrequent
- Budget for paid tools (Chromatic)

## Quick Setup (Manual for Now)

```bash
# Install BackstopJS
npm install --save-dev backstopjs

# Initialize
npx backstop init

# Take reference screenshots
npx backstop reference

# Run tests
npx backstop test
```

## Alternative: Paid Tools (Better but $$$)

- **Chromatic:** $149/mo - Best for Storybook
- **Percy:** $299/mo - Best for E2E tests

## Further Reading

- [BackstopJS GitHub](https://github.com/garris/BackstopJS)
- [BackstopJS Guide](https://visual-regression.davidneedham.me/)
- [Visual Testing Comparison](https://www.browserstack.com/guide/visual-regression-testing-open-source)

---

**Note:** Full template implementation coming soon. For now, follow BackstopJS docs for manual setup.
