# AGENTS.md Feature

**Status:** Essential (Recommended for all projects)
**Cost:** FREE
**Dependencies:** None

## What It Does

Creates a universal AI context file that works with **all AI coding assistants**:
- ✅ Claude Code
- ✅ Cursor IDE
- ✅ GitHub Copilot
- ✅ Windsurf
- ✅ Cline
- ✅ Any future AI tools

**Result:** One file (`AGENTS.md`) instead of multiple tool-specific files. Better than maintaining `.cursorrules`, `.clinerules`, etc. separately.

## When to Enable

✅ **Enable if:**
- Using any AI coding assistant
- Team uses different AI tools
- Want tool-agnostic documentation

❌ **Skip if:**
- Not using AI assistants (rare these days)

## Installation

When you enable this feature, the setup script will:
1. Create `AGENTS.md` from your existing `CLAUDE.md`
2. Create symlinks for tool compatibility:
   - `.cursorrules` → `AGENTS.md`
   - `.windsurfrules` → `AGENTS.md`
   - `.clinerules` → `AGENTS.md`
   - `.github/copilot-instructions.md` → `AGENTS.md`
3. Update `CLAUDE.md` to reference `AGENTS.md`

**Time to enable:** 30 seconds

## What Is AGENTS.md?

AGENTS.md is an industry-standard format (adopted by 40,000+ projects) for AI context files.

**Key advantages:**
- **Universal:** One file, all tools
- **Standardized:** Tools know to look for it
- **Maintainable:** Update once, affects all tools
- **Forward-compatible:** New AI tools will support it

## File Structure

```
AGENTS.md                           # Universal AI context (all tools read this)
CLAUDE.md                           # Claude-specific features (extends AGENTS.md)
.cursorrules -> AGENTS.md           # Symlink for Cursor
.windsurfrules -> AGENTS.md         # Symlink for Windsurf
.clinerules -> AGENTS.md            # Symlink for Cline
.github/
  └── copilot-instructions.md -> AGENTS.md  # Symlink for Copilot
```

## What Goes in AGENTS.md?

**Universal context** (applies to all AI tools):
- Project stack & architecture
- Naming conventions
- File structure
- Common commands
- Anti-patterns to avoid
- Testing requirements

**Example:**
```markdown
# AGENTS.md

## Project Context
React Native + Expo + Supabase mobile app

## Naming Conventions
- Components: PascalCase (Button.tsx)
- Hooks: camelCase with use prefix (useAuth.ts)

## Anti-Patterns
- Never use `any` type
- Never skip RLS policies
```

## What Goes in CLAUDE.md?

**Claude-specific features** that other tools don't have:
- Extended thinking mode (Tab key)
- Task tool for parallel agents
- Memory system (.claude/memory/)
- MCP servers

**Example:**
```markdown
# CLAUDE.md

> Extends AGENTS.md with Claude-specific features

**Base Instructions:** See AGENTS.md

## Claude-Specific Features
- Use extended thinking for complex problems (Tab key)
- Launch parallel agents with Task tool
```

## Usage

### After Enabling

**All AI tools automatically read AGENTS.md** - no action needed!

Your AI assistants will:
- Understand your project structure
- Follow your naming conventions
- Avoid anti-patterns
- Know common commands

### Updating Context

**To update universal context:**
Edit `AGENTS.md` - changes apply to all tools immediately

**To add Claude-specific instructions:**
Edit `CLAUDE.md` - only affects Claude

### Verifying Symlinks

```bash
# Windows (PowerShell)
Get-ChildItem -Force | Where-Object {$_.LinkType}

# Linux/Mac
ls -la | grep '\->'
```

Should show symlinks pointing to `AGENTS.md`.

## Customizing AGENTS.md

**Add project-specific guidelines:**

```markdown
## Our Specific Conventions

### Component Structure
All components follow this pattern:
\`\`\`tsx
export function ComponentName() {
  // 1. Hooks first
  // 2. Event handlers
  // 3. Render logic
}
\`\`\`

### Error Handling
Always use try-catch with proper error boundaries:
\`\`\`tsx
try {
  await riskyOperation();
} catch (error) {
  logError(error);
  showUserFriendlyMessage();
}
\`\`\`
```

**Add team-specific workflows:**

```markdown
## PR Process
1. Run `npm test` locally
2. Create PR with template
3. Request review from @team-mobile
4. Merge after 1 approval
```

## Troubleshooting

### Symlinks Not Working (Windows)

```powershell
# Run PowerShell as Administrator
cd your-project
.\.blueprint\features\agents-md\enable.js
```

Windows requires admin for symlinks (or Developer Mode enabled).

### AI Tool Not Reading AGENTS.md

Some tools need explicit configuration:

**Cursor:**
1. Open Settings (Ctrl+,)
2. Search "Rules for AI"
3. Verify `.cursorrules` is enabled

**GitHub Copilot:**
May need to restart VS Code after creating symlink.

### AGENTS.md vs CLAUDE.md Conflicts

**Rule:** Universal → AGENTS.md, Claude-specific → CLAUDE.md

If unsure, put it in AGENTS.md (more tools benefit).

## Why AGENTS.md Over Tool-Specific Files?

**Before:**
```
.cursorrules          # Maintain separately
.windsurfrules        # Maintain separately
.clinerules           # Maintain separately
.github/copilot-instructions.md  # Maintain separately
CLAUDE.md             # Maintain separately
```
Result: 5 files to keep in sync! 😱

**After:**
```
AGENTS.md             # Single source of truth
.cursorrules -> AGENTS.md     # Symlink
.windsurfrules -> AGENTS.md   # Symlink
.clinerules -> AGENTS.md      # Symlink
.github/copilot-instructions.md -> AGENTS.md  # Symlink
CLAUDE.md             # Only Claude-specific stuff
```
Result: Update one file! 🎉

## Further Reading

- [AGENTS.md Specification](https://layer5.io/blog/ai/agentsmd-one-file-to-guide-them-all)
- [AI Context Files Guide](https://eclipsesource.com/blogs/2025/11/20/mastering-project-context-files-for-ai-coding-agents/)
- [Context File Best Practices](https://gist.github.com/0xdevalias/f40bc5a6f84c4c5ad862e314894b2fa6)
