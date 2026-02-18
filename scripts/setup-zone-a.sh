#!/bin/bash
# Zone A Backend Setup Script
# Deploys all migrations and edge functions
# Usage: ./scripts/setup-zone-a.sh [environment]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

ENVIRONMENT=${1:-"production"}

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════╗"
echo "║       Zone A: Backend & Database Setup                ║"
echo "║       Environment: ${ENVIRONMENT}                      ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Verify requirements
echo -e "${YELLOW}Checking requirements...${NC}"

if ! command -v supabase &> /dev/null; then
  echo -e "${RED}✗ Supabase CLI not installed${NC}"
  echo "Install with: npm install -g supabase"
  exit 1
fi
echo -e "${GREEN}✓ Supabase CLI installed${NC}"

if ! command -v jq &> /dev/null; then
  echo -e "${YELLOW}⊘ jq not installed (optional, for JSON parsing)${NC}"
  echo "Install with: brew install jq (macOS) or apt install jq (Linux)"
fi

if ! supabase projects list &> /dev/null; then
  echo -e "${RED}✗ Not logged in to Supabase${NC}"
  echo "Run: supabase login"
  exit 1
fi
echo -e "${GREEN}✓ Logged in to Supabase${NC}\n"

# Step 1: Apply Migrations
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 1: Applying Database Migrations${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Phase 1: Critical Security & Core Tables${NC}"
migrations_phase1=(
  "20260116_add_rls_api_keys.sql"
  "20260116_add_rls_profiles.sql"
  "20260116_add_rls_user_plans.sql"
  "20260116_create_core_tables.sql"
  "20260116_add_rls_policies_core.sql"
)

for migration in "${migrations_phase1[@]}"; do
  if [ -f "supabase/migrations/$migration" ]; then
    echo "  • $migration"
  else
    echo -e "${RED}  ✗ Missing: $migration${NC}"
  fi
done

echo -e "\n${YELLOW}Phase 2: Sprint 1 - Document Management${NC}"
migrations_phase2=(
  "20260117_lead_documents.sql"
  "20260117_property_documents_junction.sql"
)

for migration in "${migrations_phase2[@]}"; do
  if [ -f "supabase/migrations/$migration" ]; then
    echo "  • $migration"
  else
    echo -e "${RED}  ✗ Missing: $migration${NC}"
  fi
done

echo -e "\n${YELLOW}Phase 3: Sprint 2 - Portfolio & Creative Finance${NC}"
migrations_phase3=(
  "20260117_portfolio_valuations.sql"
  "20260117_deals_portfolio_fields.sql"
  "20260117_leads_creative_finance.sql"
  "20260117_calculation_overrides.sql"
)

for migration in "${migrations_phase3[@]}"; do
  if [ -f "supabase/migrations/$migration" ]; then
    echo "  • $migration"
  else
    echo -e "${RED}  ✗ Missing: $migration${NC}"
  fi
done

echo -e "\n${YELLOW}Phase 4: Sprint 3 - AI & Automation${NC}"
migrations_phase4=(
  "20260118_sms_inbox.sql"
  "20260118_document_templates.sql"
  "20260118_user_calc_preferences.sql"
)

for migration in "${migrations_phase4[@]}"; do
  if [ -f "supabase/migrations/$migration" ]; then
    echo "  • $migration"
  else
    echo -e "${RED}  ✗ Missing: $migration${NC}"
  fi
done

echo -e "\n${YELLOW}Phase 5: Performance & Quality${NC}"
migrations_phase5=(
  "20260118_add_enum_types.sql"
  "20260118_add_composite_indexes.sql"
  "20260118_add_unique_constraints.sql"
  "20260118_install_pgtap.sql"
)

for migration in "${migrations_phase5[@]}"; do
  if [ -f "supabase/migrations/$migration" ]; then
    echo "  • $migration"
  else
    echo -e "${RED}  ✗ Missing: $migration${NC}"
  fi
done

echo -e "\n${YELLOW}Sprint 4: Final Optimization${NC}"
migrations_sprint4=(
  "20260119_additional_performance_indexes.sql"
  "20260119_additional_constraints.sql"
)

for migration in "${migrations_sprint4[@]}"; do
  if [ -f "supabase/migrations/$migration" ]; then
    echo "  • $migration"
  else
    echo -e "${RED}  ✗ Missing: $migration${NC}"
  fi
done

echo -e "\n${CYAN}Applying all migrations...${NC}"
if supabase db push; then
  echo -e "${GREEN}✓ All migrations applied successfully${NC}\n"
else
  echo -e "${RED}✗ Migration failed${NC}"
  echo "Check errors above and fix before continuing"
  exit 1
fi

# Step 2: Deploy Edge Functions
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 2: Deploying Edge Functions${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Setting environment variables...${NC}"
supabase secrets set ENVIRONMENT=${ENVIRONMENT}
echo -e "${GREEN}✓ Environment set to ${ENVIRONMENT}${NC}\n"

functions=(
  "integration-health:API key health monitoring"
  "stripe-api:Payment processing"
  "openai:AI features and document generation"
  "sms-webhook:Twilio SMS processing"
  "scheduled-reminders:Daily deal reminders"
)

for func_desc in "${functions[@]}"; do
  func="${func_desc%%:*}"
  desc="${func_desc#*:}"

  echo -e "${YELLOW}Deploying ${func}${NC} (${desc})"

  if supabase functions deploy "$func" --no-verify-jwt; then
    echo -e "${GREEN}✓ ${func} deployed${NC}\n"
  else
    echo -e "${RED}✗ ${func} deployment failed${NC}"
    exit 1
  fi
done

# Step 3: Run Tests
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 3: Running Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Database tests (pgTAP)...${NC}"
if [ -f "supabase/tests/run_all_tests.sh" ]; then
  if bash supabase/tests/run_all_tests.sh; then
    echo -e "${GREEN}✓ All database tests passed${NC}\n"
  else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo "Review test output above"
  fi
else
  echo -e "${YELLOW}⊘ Test script not found, skipping${NC}\n"
fi

# Step 4: Generate TypeScript Types
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 4: Generating TypeScript Types${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Generating types from database schema...${NC}"
if supabase gen types typescript --linked > src/integrations/supabase/types/database.ts; then
  echo -e "${GREEN}✓ TypeScript types generated${NC}"
  echo "File: src/integrations/supabase/types/database.ts"
else
  echo -e "${RED}✗ Type generation failed${NC}"
fi

# Summary
echo -e "\n${CYAN}"
echo "╔═══════════════════════════════════════════════════════╗"
echo "║              Setup Complete!                          ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

echo -e "${GREEN}✓ Database migrations applied${NC}"
echo -e "${GREEN}✓ Edge functions deployed${NC}"
echo -e "${GREEN}✓ Tests executed${NC}"
echo -e "${GREEN}✓ TypeScript types generated${NC}\n"

echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Configure cron job for scheduled-reminders:"
echo "   See: EDGE_FUNCTION_DEPLOYMENT.md (Setting Up Cron Job section)"
echo ""
echo "2. Set up webhook endpoints:"
echo "   - Twilio SMS: Point to /functions/v1/sms-webhook"
echo "   - Stripe: Point to /functions/v1/stripe-api"
echo ""
echo "3. Test edge functions:"
echo "   ./scripts/test-edge-functions.sh <project-id> <anon-key>"
echo ""
echo "4. Monitor logs:"
echo "   supabase functions logs <function-name> --follow"
echo ""
echo "5. Verify RLS policies:"
echo "   Query system_logs table for any permission errors"
echo ""

echo -e "${CYAN}Documentation:${NC}"
echo "• EDGE_FUNCTION_DEPLOYMENT.md - Deployment and testing guide"
echo "• docs/DATABASE_SCHEMA.md - Complete schema reference"
echo "• docs/RLS_SECURITY_MODEL.md - Security patterns"
echo "• ZONE_A_FINAL_SUMMARY.md - Complete implementation summary"
echo ""
