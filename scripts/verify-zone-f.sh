#!/bin/bash
# Zone F Verification - Check for lingering Phase 2 old table references

set -e

echo "🔍 Zone F Verification Script"
echo "==============================="
echo ""

# Phase 2 renamed tables (these are OLD names that should NOT exist in code)
OLD_TABLES=(
  "profiles"
  "leads"
  "contacts"
  "lead_contacts"
  "lead_notes"
  "oauth_tokens"
  "api_keys"
  "user_mfa"
  "email_logs"
  "email_preferences"
  "email_change_history"
  "stripe_customers"
  "stripe_products"
  "subscription_notifications"
  "subscription_events"
  "reminder_logs"
)

# New table names (should exist in code)
NEW_TABLES=(
  "user_profiles"
  "crm_leads"
  "crm_contacts"
  "crm_lead_contacts"
  "crm_lead_notes"
  "security_oauth_tokens"
  "security_api_keys"
  "user_mfa_settings"
  "comms_email_logs"
  "user_email_preferences"
  "security_email_change_history"
  "billing_stripe_customers"
  "billing_stripe_products"
  "billing_subscription_notifications"
  "billing_subscription_events"
  "user_reminder_logs"
  "deals"  # Kept as-is, not renamed
  "deal_events"  # Kept as-is, not renamed
)

ERRORS=0

echo "📋 Checking for OLD table references (should be 0)..."
echo ""

for table in "${OLD_TABLES[@]}"; do
  count=$(grep -r "\.from('$table')" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')

  if [ "$count" -gt 0 ]; then
    echo "❌ FAIL: Found $count references to OLD table: $table"
    echo "   Files:"
    grep -r "\.from('$table')" src --include="*.ts" --include="*.tsx" -l 2>/dev/null | sed 's/^/     - /'
    ERRORS=$((ERRORS + 1))
  else
    echo "✅ PASS: No references to old table: $table"
  fi
done

echo ""
echo "📋 Verifying NEW table references exist..."
echo ""

for table in "${NEW_TABLES[@]}"; do
  count=$(grep -r "\.from('$table')" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')

  if [ "$count" -eq 0 ]; then
    echo "⚠️  WARN: No references to new table: $table (might be unused)"
  else
    echo "✅ PASS: Found $count references to: $table"
  fi
done

echo ""
echo "📋 Checking TypeScript types file..."
echo ""

# Check for legacy view types
legacy_count=$(grep -E "^  (profiles|leads|contacts|api_keys|oauth_tokens):" src/integrations/supabase/types.ts 2>/dev/null | wc -l | tr -d ' ')

if [ "$legacy_count" -gt 0 ]; then
  echo "❌ FAIL: Found $legacy_count legacy view types in types.ts"
  echo "   Legacy types found:"
  grep -E "^  (profiles|leads|contacts|api_keys|oauth_tokens):" src/integrations/supabase/types.ts | sed 's/^/     /'
  ERRORS=$((ERRORS + 1))
else
  echo "✅ PASS: No legacy view types in types.ts"
fi

# Check for new types
new_types_count=$(grep -E "^  (user_profiles|crm_leads|deals):" src/integrations/supabase/types.ts 2>/dev/null | wc -l | tr -d ' ')

if [ "$new_types_count" -eq 3 ]; then
  echo "✅ PASS: Found all expected new types in types.ts"
else
  echo "⚠️  WARN: Expected 3 key types, found $new_types_count"
fi

echo ""
echo "==============================="

if [ $ERRORS -eq 0 ]; then
  echo "✅ All checks PASSED!"
  echo "Zone F verification complete."
  exit 0
else
  echo "❌ $ERRORS check(s) FAILED!"
  echo "Please fix issues before proceeding."
  exit 1
fi
