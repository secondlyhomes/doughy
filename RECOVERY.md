# Recovery & State Assessment Guide

## If Something Goes Wrong

This document helps any Claude instance (or human) assess the current migration state and continue from where work was interrupted.

---

## Quick Recovery Command

**Paste this to a new Claude instance to resume work:**

```
I'm recovering from an interrupted Expo Universal migration.

Please read these files in order:
1. /Users/dinosaur/Documents/doughy-ai-mobile/RECOVERY.md
2. /Users/dinosaur/Documents/doughy-ai-mobile/EXPO_UNIVERSAL_MASTER_PLAN.md
3. /Users/dinosaur/Documents/doughy-ai-mobile/MIGRATION_STATUS.md

Then run the status assessment to see what's been completed and what needs to be done next.
```

---

## How to Assess Current State

### Step 1: Check Git Status

```bash
cd /Users/dinosaur/Documents/doughy-ai-mobile
git status
git log --oneline -20
```

Look for:
- Uncommitted changes (work in progress)
- Recent commits (completed work)
- Current branch

### Step 2: Check Migration Status File

Read `/Users/dinosaur/Documents/doughy-ai-mobile/MIGRATION_STATUS.md` for the latest recorded progress.

### Step 3: Verify File Existence

Run the status check script or manually verify key files exist.

---

## Recovery Checklist

### Zone A (UI Components)
Check if these files exist and are complete:

```
src/components/ui/
├── Button.tsx          - Check for all variants
├── Input.tsx           - Check for all types
├── Select.tsx          - Should have modal picker
├── Dialog.tsx          - Should have sub-components
├── Sheet.tsx           - Bottom sheet
├── Form.tsx            - React Hook Form wrapper
├── Tabs.tsx            - With TabsList, TabsTrigger, TabsContent
├── Toast.tsx           - With toast function
├── index.ts            - Exports all components
```

### Zone B (Auth/Admin)
Check if these screens exist:

```
src/features/auth/screens/
├── LoginScreen.tsx
├── SignupScreen.tsx
├── ForgotPasswordScreen.tsx
├── VerifyEmailScreen.tsx
├── OnboardingScreen.tsx
├── ResetPasswordScreen.tsx

src/features/admin/screens/
├── AdminDashboardScreen.tsx
├── UserManagementScreen.tsx
├── SystemLogsScreen.tsx

src/features/settings/screens/
├── SettingsScreen.tsx
├── ProfileScreen.tsx
├── EditProfileScreen.tsx
```

### Zone C (Real Estate)
Check if these exist:

```
src/features/real-estate/screens/
├── PropertyListScreen.tsx
├── PropertyDetailScreen.tsx
├── AddPropertyScreen.tsx
├── EditPropertyScreen.tsx
├── CompsScreen.tsx
├── DealAnalysisScreen.tsx

src/features/real-estate/hooks/
├── useProperties.ts
├── useProperty.ts
├── useComps.ts
├── useDealAnalysis.ts
```

### Zone D (Dashboard/Leads)
Check if these exist:

```
src/features/dashboard/screens/
├── DashboardScreen.tsx

src/features/leads/screens/
├── LeadsListScreen.tsx
├── LeadDetailScreen.tsx
├── AddLeadScreen.tsx

src/features/conversations/screens/
├── ConversationsListScreen.tsx
├── ChatScreen.tsx
```

---

## Git Commit Protocol

**CRITICAL: Commit after every completed phase or significant work.**

### Commit Message Format

```
[Zone X] Phase Y: Brief description

- Completed item 1
- Completed item 2
- TODO: remaining items
```

### Example Commits

```bash
# After completing Zone A Phase 1
git add .
git commit -m "[Zone A] Phase 1: Core form components

- Button with all variants
- Input with all types
- Select with modal picker
- Textarea, Checkbox, RadioGroup, Switch, Label
- Form with react-hook-form integration

TODO: Phase 2 layout components"

# After completing Zone B auth flow
git add .
git commit -m "[Zone B] Phase 1: Complete auth flow

- Email verification screen
- Onboarding survey
- Password reset flow
- Auth guards

TODO: Phase 2 profile/settings"
```

### When to Commit

1. After completing any phase
2. After completing a significant component
3. Before stopping work for any reason
4. Every 30-60 minutes of active work

---

## If Work Was Interrupted Mid-Phase

### Option 1: Check Git Diff

```bash
git diff
git diff --staged
```

This shows what was being worked on but not committed.

### Option 2: Check Zone Documents

Each zone document has progress tracking tables. Check if they were updated:

- `ZONE_A_STAGE3.md` → Progress Tracking section
- `ZONE_B_STAGE3.md` → Progress Tracking section
- `ZONE_C_STAGE3.md` → Progress Tracking section
- `ZONE_D_STAGE3.md` → Progress Tracking section

### Option 3: TypeScript Check

```bash
npx tsc --noEmit
```

This will show:
- Missing imports (files referenced but not created)
- Type errors (incomplete implementations)

---

## Status Assessment Script

Run this to get a quick status:

```bash
cd /Users/dinosaur/Documents/doughy-ai-mobile

echo "=== Git Status ==="
git status --short

echo ""
echo "=== Recent Commits ==="
git log --oneline -10

echo ""
echo "=== Zone A Components ==="
ls -la src/components/ui/ 2>/dev/null | wc -l
echo "files in src/components/ui/"

echo ""
echo "=== Zone B Auth ==="
ls -la src/features/auth/screens/ 2>/dev/null | wc -l
echo "files in src/features/auth/screens/"

echo ""
echo "=== Zone C Real Estate ==="
ls -la src/features/real-estate/screens/ 2>/dev/null | wc -l
echo "files in src/features/real-estate/screens/"

echo ""
echo "=== Zone D Dashboard/Leads ==="
ls -la src/features/dashboard/screens/ 2>/dev/null | wc -l
echo "files in src/features/dashboard/screens/"
ls -la src/features/leads/screens/ 2>/dev/null | wc -l
echo "files in src/features/leads/screens/"

echo ""
echo "=== TypeScript Errors ==="
npx tsc --noEmit 2>&1 | tail -20
```

---

## Recovery Scenarios

### Scenario 1: VS Code Crashed

1. Reopen VS Code
2. Check `git status` for unsaved changes
3. If changes were saved but not committed, review and commit
4. Continue from last checkpoint

### Scenario 2: Computer Crashed / Blue Screen

1. After reboot, check `git status`
2. Some work may be lost if not saved
3. Check zone documents for progress tracking
4. Re-run status assessment
5. Continue from last confirmed state

### Scenario 3: Claude Session Ended Mid-Work

1. Start new Claude session
2. Paste the Quick Recovery Command (above)
3. Claude will assess state and continue

### Scenario 4: Multiple Claude Instances Lost Sync

1. Check `git log` to see what was committed
2. Check for merge conflicts
3. Each zone should work on separate directories, so conflicts are rare
4. If conflicts exist, resolve by keeping the more complete version

---

## Zone Independence

The zones are designed to work independently:

| Zone | Directories (exclusive) |
|------|------------------------|
| A | `src/components/ui/` |
| B | `src/features/auth/`, `src/features/admin/`, `src/features/settings/`, `src/features/billing/`, `src/features/teams/` |
| C | `src/features/real-estate/` |
| D | `src/features/dashboard/`, `src/features/leads/`, `src/features/conversations/`, `src/features/analytics/`, `src/features/layout/` |

**Shared files** (coordinate changes):
- `src/routes/` - Navigation
- `src/types/` - Type definitions
- `src/lib/` - Utilities
- `src/store/` - Global stores
- `tailwind.config.js` - Theme
- `package.json` - Dependencies

---

## Emergency Recovery

If everything is broken and you need to start fresh on a zone:

```bash
# See what the zone looked like before
git log --oneline -- src/features/[zone-dir]/

# Revert a specific zone to a previous state
git checkout [commit-hash] -- src/features/[zone-dir]/

# Or revert uncommitted changes in a zone
git checkout -- src/features/[zone-dir]/
```

---

## Contact Points

- **Master Plan:** `EXPO_UNIVERSAL_MASTER_PLAN.md`
- **Zone A Details:** `ZONE_A_STAGE3.md`
- **Zone B Details:** `ZONE_B_STAGE3.md`
- **Zone C Details:** `ZONE_C_STAGE3.md`
- **Zone D Details:** `ZONE_D_STAGE3.md`
- **This Recovery Guide:** `RECOVERY.md`
- **Live Status:** `MIGRATION_STATUS.md`

---

*This document should be read by any Claude instance resuming interrupted work.*
