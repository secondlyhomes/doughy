#!/bin/bash
# Deploy Edge Functions Script
# Deploys all edge functions to Supabase with proper environment variables
# Usage: ./scripts/deploy-edge-functions.sh [environment]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENVIRONMENT=${1:-"production"}

echo -e "${BLUE}=== Deploying Edge Functions to ${ENVIRONMENT} ===${NC}\n"

# Verify Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo -e "${RED}Error: Supabase CLI not installed${NC}"
  echo "Install with: npm install -g supabase"
  exit 1
fi

# Verify project is linked
if ! supabase projects list &> /dev/null; then
  echo -e "${RED}Error: Not logged in to Supabase${NC}"
  echo "Run: supabase login"
  exit 1
fi

# Set environment variables
echo -e "${YELLOW}Setting environment variables...${NC}"
supabase secrets set ENVIRONMENT=${ENVIRONMENT}
echo -e "${GREEN}✓ Environment set to ${ENVIRONMENT}${NC}\n"

# Deploy functions
echo -e "${YELLOW}Deploying functions...${NC}\n"

functions=(
  "integration-health"
  "stripe-api"
  "openai"
  "sms-webhook"
  "scheduled-reminders"
)

for func in "${functions[@]}"; do
  echo -e "${BLUE}Deploying ${func}...${NC}"

  if supabase functions deploy "$func" --no-verify-jwt; then
    echo -e "${GREEN}✓ ${func} deployed successfully${NC}\n"
  else
    echo -e "${RED}✗ ${func} deployment failed${NC}\n"
    exit 1
  fi
done

echo -e "${GREEN}=== All functions deployed successfully ===${NC}\n"

# List deployed functions
echo -e "${YELLOW}Deployed functions:${NC}"
supabase functions list

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Test functions with: ./scripts/test-edge-functions.sh <project-id> <anon-key>"
echo "2. Configure cron job for scheduled-reminders"
echo "3. Set up webhook endpoints in Twilio and Stripe dashboards"
echo "4. Monitor function logs: supabase functions logs <function-name>"
