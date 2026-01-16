#!/bin/bash
# Test Edge Functions Script
# Usage: ./scripts/test-edge-functions.sh [project-id] [anon-key]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${1:-"YOUR_PROJECT_ID"}
ANON_KEY=${2:-"YOUR_ANON_KEY"}
BASE_URL="https://${PROJECT_ID}.supabase.co/functions/v1"

echo -e "${YELLOW}=== Testing Supabase Edge Functions ===${NC}\n"

if [ "$PROJECT_ID" == "YOUR_PROJECT_ID" ]; then
  echo -e "${RED}Error: Please provide your Supabase project ID${NC}"
  echo "Usage: ./scripts/test-edge-functions.sh <project-id> <anon-key>"
  exit 1
fi

# Test 1: Integration Health - OpenAI
echo -e "${YELLOW}Test 1: Integration Health (OpenAI)${NC}"
response=$(curl -s -X POST "${BASE_URL}/integration-health" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"service": "openai"}')

if echo "$response" | grep -q "success"; then
  echo -e "${GREEN}✓ Integration health check passed${NC}"
  echo "$response" | jq '.'
else
  echo -e "${RED}✗ Integration health check failed${NC}"
  echo "$response"
fi
echo ""

# Test 2: Integration Health - Stripe
echo -e "${YELLOW}Test 2: Integration Health (Stripe)${NC}"
response=$(curl -s -X POST "${BASE_URL}/integration-health" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"service": "stripe"}')

if echo "$response" | grep -q "success"; then
  echo -e "${GREEN}✓ Stripe health check passed${NC}"
  echo "$response" | jq '.'
else
  echo -e "${RED}✗ Stripe health check failed${NC}"
  echo "$response"
fi
echo ""

# Test 3: SMS Webhook (Simulated Twilio)
echo -e "${YELLOW}Test 3: SMS Webhook${NC}"
response=$(curl -s -X POST "${BASE_URL}/sms-webhook" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "From=+15555551234" \
  --data-urlencode "Body=Hi, I have a 3/2 house at 123 Main St, Springfield. Needs some work but has good bones. Asking 150k. Call me at 555-1234 - John Doe" \
  --data-urlencode "MessageSid=SM$(date +%s)")

if echo "$response" | grep -q "Response"; then
  echo -e "${GREEN}✓ SMS webhook processed${NC}"
  echo "$response"
else
  echo -e "${RED}✗ SMS webhook failed${NC}"
  echo "$response"
fi
echo ""

# Test 4: OpenAI Function
echo -e "${YELLOW}Test 4: OpenAI Function${NC}"
response=$(curl -s -X POST "${BASE_URL}/openai" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Write a brief professional email template for a real estate follow-up"}
    ],
    "model": "gpt-4o-mini",
    "temperature": 0.7,
    "max_tokens": 200
  }')

if echo "$response" | grep -q "choices"; then
  echo -e "${GREEN}✓ OpenAI function returned response${NC}"
  echo "$response" | jq '.choices[0].message.content'
else
  echo -e "${RED}✗ OpenAI function failed${NC}"
  echo "$response"
fi
echo ""

# Test 5: Scheduled Reminders (Manual Trigger)
echo -e "${YELLOW}Test 5: Scheduled Reminders (requires service role key)${NC}"
echo "Note: This test requires SUPABASE_SERVICE_ROLE_KEY environment variable"
if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  response=$(curl -s -X POST "${BASE_URL}/scheduled-reminders" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json")

  if echo "$response" | grep -q "success"; then
    echo -e "${GREEN}✓ Scheduled reminders executed${NC}"
    echo "$response" | jq '.'
  else
    echo -e "${RED}✗ Scheduled reminders failed${NC}"
    echo "$response"
  fi
else
  echo -e "${YELLOW}⊘ Skipped - set SUPABASE_SERVICE_ROLE_KEY to test${NC}"
fi
echo ""

# Test 6: CORS Validation
echo -e "${YELLOW}Test 6: CORS Validation${NC}"
response=$(curl -s -i -X OPTIONS "${BASE_URL}/integration-health" \
  -H "Origin: http://localhost:8081" \
  -H "Access-Control-Request-Method: POST")

if echo "$response" | grep -q "Access-Control-Allow-Origin"; then
  echo -e "${GREEN}✓ CORS headers present${NC}"
else
  echo -e "${RED}✗ CORS headers missing${NC}"
fi
echo ""

echo -e "${GREEN}=== All tests complete ===${NC}"
