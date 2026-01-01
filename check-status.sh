#!/bin/bash

# Migration Status Check Script
# Run this to quickly assess the current state of the migration

echo "=============================================="
echo "  EXPO UNIVERSAL MIGRATION - STATUS CHECK"
echo "=============================================="
echo ""

cd /Users/dinosaur/Documents/doughy-ai-mobile

# Git Status
echo "📦 GIT STATUS"
echo "----------------------------------------------"
UNCOMMITTED=$(git status --porcelain | wc -l | tr -d ' ')
if [ "$UNCOMMITTED" -gt 0 ]; then
    echo "⚠️  $UNCOMMITTED uncommitted changes"
    git status --short | head -10
    if [ "$UNCOMMITTED" -gt 10 ]; then
        echo "   ... and $(($UNCOMMITTED - 10)) more"
    fi
else
    echo "✅ Working directory clean"
fi
echo ""

# Recent Commits
echo "📜 RECENT COMMITS"
echo "----------------------------------------------"
git log --oneline -5
echo ""

# Zone A - UI Components
echo "🎨 ZONE A: UI COMPONENTS"
echo "----------------------------------------------"
UI_COUNT=$(ls -1 src/components/ui/*.tsx 2>/dev/null | wc -l | tr -d ' ')
echo "   Components: $UI_COUNT files"
if [ -f "src/components/ui/index.ts" ]; then
    EXPORTS=$(grep -c "export" src/components/ui/index.ts 2>/dev/null || echo "0")
    echo "   Exports: $EXPORTS in index.ts"
else
    echo "   ⚠️  No index.ts yet"
fi

# Check for key components
KEY_COMPONENTS=("Button" "Input" "Select" "Dialog" "Sheet" "Form" "Tabs" "Toast")
FOUND=0
for comp in "${KEY_COMPONENTS[@]}"; do
    if [ -f "src/components/ui/${comp}.tsx" ]; then
        ((FOUND++))
    fi
done
echo "   Key components: $FOUND/${#KEY_COMPONENTS[@]}"
echo ""

# Zone B - Auth/Admin
echo "🔐 ZONE B: AUTH/ADMIN"
echo "----------------------------------------------"
AUTH_SCREENS=$(ls -1 src/features/auth/screens/*.tsx 2>/dev/null | wc -l | tr -d ' ')
ADMIN_SCREENS=$(ls -1 src/features/admin/screens/*.tsx 2>/dev/null | wc -l | tr -d ' ')
SETTINGS_SCREENS=$(ls -1 src/features/settings/screens/*.tsx 2>/dev/null | wc -l | tr -d ' ')
echo "   Auth screens: $AUTH_SCREENS"
echo "   Admin screens: $ADMIN_SCREENS"
echo "   Settings screens: $SETTINGS_SCREENS"
echo ""

# Zone C - Real Estate
echo "🏠 ZONE C: REAL ESTATE"
echo "----------------------------------------------"
RE_SCREENS=$(ls -1 src/features/real-estate/screens/*.tsx 2>/dev/null | wc -l | tr -d ' ')
RE_COMPONENTS=$(ls -1 src/features/real-estate/components/*.tsx 2>/dev/null | wc -l | tr -d ' ')
RE_HOOKS=$(ls -1 src/features/real-estate/hooks/*.ts 2>/dev/null | wc -l | tr -d ' ')
echo "   Screens: $RE_SCREENS"
echo "   Components: $RE_COMPONENTS"
echo "   Hooks: $RE_HOOKS"
echo ""

# Zone D - Dashboard/Leads
echo "📊 ZONE D: DASHBOARD/LEADS/CONVERSATIONS"
echo "----------------------------------------------"
DASH_SCREENS=$(ls -1 src/features/dashboard/screens/*.tsx 2>/dev/null | wc -l | tr -d ' ')
LEADS_SCREENS=$(ls -1 src/features/leads/screens/*.tsx 2>/dev/null | wc -l | tr -d ' ')
CONV_SCREENS=$(ls -1 src/features/conversations/screens/*.tsx 2>/dev/null | wc -l | tr -d ' ')
echo "   Dashboard screens: $DASH_SCREENS"
echo "   Leads screens: $LEADS_SCREENS"
echo "   Conversation screens: $CONV_SCREENS"
echo ""

# TypeScript Check
echo "🔍 TYPESCRIPT CHECK"
echo "----------------------------------------------"
TS_ERRORS=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0")
if [ "$TS_ERRORS" -eq 0 ]; then
    echo "✅ No TypeScript errors"
else
    echo "⚠️  $TS_ERRORS TypeScript errors"
    echo "   Run 'npx tsc --noEmit' for details"
fi
echo ""

# Package.json dependencies
echo "📦 KEY DEPENDENCIES"
echo "----------------------------------------------"
DEPS=("@gorhom/bottom-sheet" "react-native-chart-kit" "@stripe/stripe-react-native" "react-native-calendars")
for dep in "${DEPS[@]}"; do
    if grep -q "\"$dep\"" package.json 2>/dev/null; then
        echo "   ✅ $dep"
    else
        echo "   ❌ $dep (not installed)"
    fi
done
echo ""

# Migration Status File
echo "📋 MIGRATION STATUS FILE"
echo "----------------------------------------------"
if [ -f "MIGRATION_STATUS.md" ]; then
    LAST_UPDATED=$(grep "Last Updated:" MIGRATION_STATUS.md | head -1)
    echo "   $LAST_UPDATED"
else
    echo "   ⚠️  MIGRATION_STATUS.md not found"
fi
echo ""

echo "=============================================="
echo "  END OF STATUS CHECK"
echo "=============================================="
echo ""
echo "For full details, read:"
echo "  - MIGRATION_STATUS.md"
echo "  - RECOVERY.md"
echo ""
