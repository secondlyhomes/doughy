# Component Documentation Feature (Ladle)

**Status:** Optional
**Cost:** FREE
**Dependencies:** Ladle (npm package)

## What It Does

Isolate and develop components outside your main app using **Ladle** - a lightweight, 10x faster alternative to Storybook.

**Used by:** 335+ Uber projects

## When to Enable

✅ **Enable if:**
- Component library > 10 components
- Need to test components in isolation
- Want faster iteration than full app reload

❌ **Skip if:**
- Small project (< 10 components)
- Prefer testing in actual app

## Quick Setup (Manual for Now)

```bash
# Install Ladle
npm install --save-dev @ladle/react vite

# Add script
# package.json
{
  "scripts": {
    "ladle": "ladle serve"
  }
}

# Create a story
# src/components/Button/Button.stories.tsx
export const Primary = () => <Button>Click me</Button>;
```

## Further Reading

- [Ladle Official Docs](https://ladle.dev/)
- [Ladle vs Storybook](https://ladle.dev/blog/ladle-v3/)
- [Used at Uber](https://ladle.dev/blog/introducing-ladle/)

---

**Note:** Full template implementation coming soon. For now, follow Ladle docs for manual setup.
