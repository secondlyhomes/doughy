#!/bin/bash
# ============================================================================
# DATABASE REFERENCE STANDARDIZATION SCRIPT - PHASE 2
# ============================================================================
# Updates all code references to renamed database tables (Phase 2)
# Run AFTER Phase 2 migration is deployed to staging/production
# ============================================================================

set -e

echo "🔧 Standardizing Phase 2 database references..."
echo ""

# ============================================================================
# NOTE: Compatibility views allow old code to work during transition
# These updates are OPTIONAL but RECOMMENDED for code clarity
# ============================================================================

# ============================================================================
# BATCH 1: CRITICAL USER-FACING TABLES
# ============================================================================

echo "👤 Updating profiles → user_profiles references..."

find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('profiles')/.from('user_profiles')/g" \
  -e "s/\.from(\"profiles\")/.from(\"user_profiles\")/g" \
  -e "s/\.from(\`profiles\`)/.from('user_profiles')/g" \
  {} \;

git add -A
git commit -m "refactor(db): rename profiles → user_profiles (Phase 2)"

echo "🏢 Updating CRM domain references..."

# leads → crm_leads
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('leads')/.from('crm_leads')/g" \
  -e "s/\.from(\"leads\")/.from(\"crm_leads\")/g" \
  -e "s/\.from(\`leads\`)/.from('crm_leads')/g" \
  {} \;

# contacts → crm_contacts
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('contacts')/.from('crm_contacts')/g" \
  -e "s/\.from(\"contacts\")/.from(\"crm_contacts\")/g" \
  -e "s/\.from(\`contacts\`)/.from('crm_contacts')/g" \
  {} \;

# lead_contacts → crm_lead_contacts
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('lead_contacts')/.from('crm_lead_contacts')/g" \
  -e "s/\.from(\"lead_contacts\")/.from(\"crm_lead_contacts\")/g" \
  -e "s/\.from(\`lead_contacts\`)/.from('crm_lead_contacts')/g" \
  {} \;

# lead_notes → crm_lead_notes
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('lead_notes')/.from('crm_lead_notes')/g" \
  -e "s/\.from(\"lead_notes\")/.from(\"crm_lead_notes\")/g" \
  -e "s/\.from(\`lead_notes\`)/.from('crm_lead_notes')/g" \
  {} \;

git add -A
git commit -m "refactor(db): rename CRM tables (leads, contacts, etc) → crm_* (Phase 2)"

# ============================================================================
# BATCH 2: SECURITY & EMAIL DOMAIN
# ============================================================================

echo "🔒 Updating security domain references..."

# oauth_tokens → security_oauth_tokens
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('oauth_tokens')/.from('security_oauth_tokens')/g" \
  -e "s/\.from(\"oauth_tokens\")/.from(\"security_oauth_tokens\")/g" \
  -e "s/\.from(\`oauth_tokens\`)/.from('security_oauth_tokens')/g" \
  {} \;

# api_keys → security_api_keys
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('api_keys')/.from('security_api_keys')/g" \
  -e "s/\.from(\"api_keys\")/.from(\"security_api_keys\")/g" \
  -e "s/\.from(\`api_keys\`)/.from('security_api_keys')/g" \
  {} \;

# user_mfa → user_mfa_settings
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('user_mfa')/.from('user_mfa_settings')/g" \
  -e "s/\.from(\"user_mfa\")/.from(\"user_mfa_settings\")/g" \
  -e "s/\.from(\`user_mfa\`)/.from('user_mfa_settings')/g" \
  {} \;

git add -A
git commit -m "refactor(db): rename security tables → security_* (Phase 2)"

echo "📧 Updating email domain references..."

# email_logs → comms_email_logs
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('email_logs')/.from('comms_email_logs')/g" \
  -e "s/\.from(\"email_logs\")/.from(\"comms_email_logs\")/g" \
  -e "s/\.from(\`email_logs\`)/.from('comms_email_logs')/g" \
  {} \;

# email_preferences → user_email_preferences
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('email_preferences')/.from('user_email_preferences')/g" \
  -e "s/\.from(\"email_preferences\")/.from(\"user_email_preferences\")/g" \
  -e "s/\.from(\`email_preferences\`)/.from('user_email_preferences')/g" \
  {} \;

# email_change_history → security_email_change_history
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('email_change_history')/.from('security_email_change_history')/g" \
  -e "s/\.from(\"email_change_history\")/.from(\"security_email_change_history\")/g" \
  -e "s/\.from(\`email_change_history\`)/.from('security_email_change_history')/g" \
  {} \;

git add -A
git commit -m "refactor(db): rename email tables (Phase 2)"

# ============================================================================
# BATCH 3: BILLING & REMINDERS
# ============================================================================

echo "💳 Updating billing domain references..."

# stripe_customers → billing_stripe_customers
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('stripe_customers')/.from('billing_stripe_customers')/g" \
  -e "s/\.from(\"stripe_customers\")/.from(\"billing_stripe_customers\")/g" \
  -e "s/\.from(\`stripe_customers\`)/.from('billing_stripe_customers')/g" \
  {} \;

# stripe_products → billing_stripe_products
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('stripe_products')/.from('billing_stripe_products')/g" \
  -e "s/\.from(\"stripe_products\")/.from(\"billing_stripe_products\")/g" \
  -e "s/\.from(\`stripe_products\`)/.from('billing_stripe_products')/g" \
  {} \;

# subscription_notifications → billing_subscription_notifications
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('subscription_notifications')/.from('billing_subscription_notifications')/g" \
  -e "s/\.from(\"subscription_notifications\")/.from(\"billing_subscription_notifications\")/g" \
  -e "s/\.from(\`subscription_notifications\`)/.from('billing_subscription_notifications')/g" \
  {} \;

# subscription_events → billing_subscription_events
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('subscription_events')/.from('billing_subscription_events')/g" \
  -e "s/\.from(\"subscription_events\")/.from(\"billing_subscription_events\")/g" \
  -e "s/\.from(\`subscription_events\`)/.from('billing_subscription_events')/g" \
  {} \;

# reminder_logs → user_reminder_logs
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('reminder_logs')/.from('user_reminder_logs')/g" \
  -e "s/\.from(\"reminder_logs\")/.from(\"user_reminder_logs\")/g" \
  -e "s/\.from(\`reminder_logs\`)/.from('user_reminder_logs')/g" \
  {} \;

git add -A
git commit -m "refactor(db): rename billing & reminder tables (Phase 2)"

# ============================================================================
# REGENERATE TYPES
# ============================================================================

echo "📝 Regenerating TypeScript types..."
npx supabase gen types typescript --project-id lqmbyobweeaigrwmvizo > src/integrations/supabase/types.ts

git add src/integrations/supabase/types.ts
git commit -m "chore(types): regenerate after Phase 2 database standardization"

# ============================================================================
# DONE
# ============================================================================

echo ""
echo "✅ Phase 2 database standardization complete!"
echo ""
echo "Summary:"
echo "- 16 tables renamed in database (Phase 2)"
echo "- 16 compatibility views created for zero-downtime"
echo "- Code references updated:"
echo "  - profiles → user_profiles"
echo "  - CRM domain: leads, contacts, lead_contacts, lead_notes → crm_*"
echo "  - Security: oauth_tokens, api_keys, user_mfa → security_* / user_mfa_settings"
echo "  - Email: email_* → comms_email_logs / user_email_preferences / security_email_change_history"
echo "  - Billing: stripe_*, subscription_* → billing_*"
echo "  - Reminders: reminder_logs → user_reminder_logs"
echo "- TypeScript types regenerated"
echo ""
echo "Next steps:"
echo "1. npm run type-check (or npx tsc --noEmit)"
echo "2. npm test"
echo "3. Test app manually (especially auth/profiles/CRM features)"
echo "4. Review commits: git log --oneline -6"
echo "5. Deploy compatibility view cleanup after 24-48 hours"
