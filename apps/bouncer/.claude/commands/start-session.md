---
allowed-tools: Bash(gh:*), Read, Glob
description: Start session - load context, check issues, show priorities. Use at session start.
---

## When to Use This Skill

Use `/start-session` when:
- Starting a new Claude conversation/session
- Beginning coding for the day
- Returning after a break where Claude was closed
- Starting fresh after `/clear`

**Don't bother** if:
- Claude is still open from earlier (you already have context)
- Just continuing where you left off in the same session

## Context

- Today's date: !`date +%Y-%m-%d`
- Current branch: !`git branch --show-current`
- Git status: !`git status --short`

## Your Task: Session Start-Up

Help the user get oriented and ready to work.

### 1. Load Memory Context

Read and summarize (the exact project-path is auto-generated from your project location — check `~/.claude/projects/` for the matching directory):
- `~/.claude/projects/<project-path>/memory/MEMORY.md` (current focus)
- Most recent session file in `~/.claude/projects/<project-path>/memory/sessions/` (what happened last time)

### 2. Check Recent Activity

Show:
- Recent commits: `git log --oneline -5`
- Any uncommitted changes: `git status`

### 3. GitHub Check (if applicable)

Check CLAUDE.md for GitHub integration status. If enabled:

a. **Open issues assigned or relevant:**
   ```bash
   gh issue list --limit 10
   ```

b. **Check for any new issues since last session:**
   ```bash
   gh issue list --state open --limit 5
   ```

c. **Project board priorities (if using):**
   ```bash
   gh project list
   ```

### 4. Present Session Briefing

Output a concise briefing:

```
## Session Briefing - [DATE]

### Last Session
- [1-2 sentences from last session notes]

### Current Focus
- [From MEMORY.md]

### Open Items
- [ ] [From GitHub issues or last session's "next steps"]

### Ready to Work
What would you like to focus on today?
```

Keep it brief and actionable. The user wants to get to work quickly.
