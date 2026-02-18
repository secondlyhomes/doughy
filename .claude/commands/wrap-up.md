---
allowed-tools: Bash(gh:*), Read, Write, Edit, Glob
description: End session - update notes, close issues, sync memory. Use before closing Claude.
---

## When to Use This Skill

Use `/wrap-up` when:
- Done coding for the day/night
- About to close Claude or the terminal
- Switching to a different project
- Context getting long and need to `/clear`
- Taking a long break and closing Claude

**Don't bother** for quick breaks (lunch, bathroom) if leaving Claude open.

**Same-day sessions:** If you wrap-up and start again the same day, notes append to the same day's file.

## Context

- Today's date: !`date +%Y-%m-%d`
- Current branch: !`git branch --show-current`
- Git status: !`git status --short`
- Recent commits today: !`git log --oneline --since="midnight" 2>/dev/null || echo "No commits today"`

## Your Task: Session Wrap-Up

Perform these steps to close out the session properly:

### 1. Create/Update Today's Session Notes

Create or update the session file at:
`~/.claude/projects/<project-path>/memory/sessions/[TODAY'S DATE].md`

(The exact project-path is auto-generated from your project location — check `~/.claude/projects/` for the matching directory.)

Use the template from `_TEMPLATE.md` and fill in:
- Summary of what was accomplished
- Key decisions made (if any)
- Blockers or open questions
- What next session should focus on
- Any future improvements identified (from code reviews, discussions, etc.)

### 2. Update MEMORY.md

Update the "Current Focus" section in:
`~/.claude/projects/<project-path>/memory/MEMORY.md`

Keep it concise - just the current state and immediate next steps.

### 3. GitHub Sync (if applicable)

Check CLAUDE.md for GitHub integration status. If enabled:

a. **Close completed issues:**
   - Ask user which issues (if any) were completed
   - Close them with: `gh issue close [NUMBER] --comment "Completed in this session"`

b. **Create backlog issues:**
   - For any "Future Improvements" items identified, ask user if they want GitHub issues created
   - Use: `gh issue create --title "..." --body "..." --label "enhancement"`

c. **Search for duplicates** before creating new issues:
   - `gh issue list --search "keyword"`

### 4. Final Summary

Output a brief summary:
- What was done
- What's next
- Any issues created/closed

Keep it short - the user is ending their session.
