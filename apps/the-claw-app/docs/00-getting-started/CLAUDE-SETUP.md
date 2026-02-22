# Claude Code Setup Checklist

This guide helps you set up Claude Code integrations for this project.

## Prerequisites

- [ ] Claude Code CLI installed
- [ ] Git repository initialized
- [ ] Node.js and npm installed

## 1. GitHub CLI Setup (Optional)

GitHub integration allows Claude to manage issues, PRs, and project boards.

### Install

```bash
# Windows
winget install GitHub.cli

# Mac
brew install gh

# Linux
sudo apt install gh
```

### Authenticate

```bash
gh auth login
```

Follow the prompts to authenticate with your GitHub account.

### Add Project Board Scopes

If you want Claude to manage GitHub Project boards:

```powershell
# PowerShell (Windows) - note the & prefix for paths with spaces
& "C:\Program Files\GitHub CLI\gh.exe" auth refresh -s read:project -s project

# Bash (Mac/Linux)
gh auth refresh -s read:project -s project
```

### Verify

```bash
gh repo list YOUR-ORG-OR-USERNAME
gh project list --owner YOUR-ORG
```

## 2. Memory Directory Setup

Claude's memory system persists context across sessions.

### Structure

The memory directory is automatically created at:
```
~/.claude/projects/[project-hash]/memory/
├── MEMORY.md          # Auto-loaded every session (keep under 200 lines)
├── sessions/          # Daily session summaries
│   └── _TEMPLATE.md
└── decisions/         # Key architectural decisions
    └── _TEMPLATE.md
```

### First-Time Setup

If starting fresh, create the structure:

```bash
# The directories should be created automatically, but if not:
mkdir -p ~/.claude/projects/YOUR-PROJECT-HASH/memory/sessions
mkdir -p ~/.claude/projects/YOUR-PROJECT-HASH/memory/decisions
```

Copy templates from this project's memory directory if available.

## 3. Configure CLAUDE.md

Update these sections in `CLAUDE.md` for your project:

### GitHub Integration

```markdown
## GitHub Integration (Project-Dependent)

### Current Project Setup

- **Enabled:** Yes  # or No to disable
- **Org/Repo:** `your-org/your-repo`
- **Project Board:** Check with `gh project list --owner your-org`
```

### Session Skills

The following skills should be available:
- `/start-session` - Run at beginning of work
- `/wrap-up` - Run before ending session

## 4. Verify Setup

Run these commands to verify everything works:

```bash
# GitHub CLI
gh issue list --repo YOUR-ORG/YOUR-REPO

# Project boards (if using)
gh project list --owner YOUR-ORG

# Check skills are available
# In Claude Code, type: /start-session
```

## 5. Daily Workflow

### Starting Work

1. Open Claude Code in your project directory
2. Run `/start-session`
3. Claude will show you:
   - Last session summary
   - Current focus
   - Open GitHub issues
   - Suggested next steps

### Ending Work

1. Before closing, run `/wrap-up`
2. Claude will:
   - Create/update today's session notes
   - Ask about GitHub issues to close/create
   - Update MEMORY.md with current state

## Troubleshooting

### "gh: command not found"

The GitHub CLI isn't in your PATH. Either:
- Restart your terminal after installing
- Use the full path: `"C:\Program Files\GitHub CLI\gh.exe"` (Windows)
- Add to PATH manually

### "authentication token is missing required scopes"

Run the auth refresh command with needed scopes:
```bash
gh auth refresh -s read:project -s project -s repo
```

### Skills not appearing

Skills in `.claude/commands/` are project-specific. Make sure:
- The files exist in `.claude/commands/`
- Files have `.md` extension
- Files have valid YAML frontmatter

### Memory not persisting

Check that the memory directory path matches your project. The path includes a hash of your project directory.

## Disabling Features

### Disable GitHub Integration

In `CLAUDE.md`, change:
```markdown
- **Enabled:** No
```

### Disable Session Tracking

Simply don't use `/start-session` and `/wrap-up`. The memory directory will remain but won't be updated.
