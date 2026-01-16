#!/bin/bash
# ============================================================================
# DATABASE REFERENCE STANDARDIZATION SCRIPT
# ============================================================================
# Updates all code references to renamed database tables
# Run AFTER migration is deployed to staging/production
# ============================================================================

set -e

echo "🔧 Standardizing database references..."
echo ""

# ============================================================================
# NOTE: Compatibility views allow old code to work during transition
# These updates are OPTIONAL if using compatibility views
# Recommended: Update code anyway for clarity
# ============================================================================

# ============================================================================
# GROUP 4: COMMUNICATIONS (3 references in 1 file)
# ============================================================================

echo "💬 Updating messages → comms_messages references..."

find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('messages')/.from('comms_messages')/g" \
  -e "s/\.from(\"messages\")/.from(\"comms_messages\")/g" \
  -e "s/\.from(\`messages\`)/.from('comms_messages')/g" \
  {} \;

git add -A
git commit -m "refactor(db): rename messages → comms_messages"

# ============================================================================
# GROUP 7: AI/ASSISTANT (10 references across 3 files)
# ============================================================================

echo "🤖 Updating ai_jobs → assistant_jobs references..."

find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('ai_jobs')/.from('assistant_jobs')/g" \
  -e "s/\.from(\"ai_jobs\")/.from(\"assistant_jobs\")/g" \
  {} \;

git add -A
git commit -m "refactor(db): rename ai_jobs → assistant_jobs"

# ============================================================================
# REGENERATE TYPES
# ============================================================================

echo "📝 Regenerating TypeScript types..."
npx supabase gen types typescript --project-id lqmbyobweeaigrwmvizo > src/integrations/supabase/types.ts

git add src/integrations/supabase/types.ts
git commit -m "chore(types): regenerate after database standardization"

# ============================================================================
# DONE
# ============================================================================

echo ""
echo "✅ Database standardization complete!"
echo ""
echo "Summary:"
echo "- 19 tables renamed in database (Phase 1)"
echo "- 6 compatibility views created for zero-downtime"
echo "- 13 code references updated across 4 files"
echo "  - messages → comms_messages (3 refs)"
echo "  - ai_jobs → assistant_jobs (10 refs)"
echo "- TypeScript types regenerated"
echo ""
echo "Next steps:"
echo "1. npm run type-check"
echo "2. npm test"
echo "3. Test app manually"
echo "4. Review commits: git log --oneline -3"
echo "5. Deploy compatibility view cleanup after 24-48 hours"
