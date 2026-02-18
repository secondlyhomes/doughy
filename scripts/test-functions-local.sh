#!/bin/bash
# Local Edge Function Testing Script
# Tests functions running on local Supabase instance
# Usage: ./scripts/test-functions-local.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Local Supabase configuration
LOCAL_URL="http://localhost:54321/functions/v1"
LOCAL_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

echo -e "${YELLOW}=== Testing Local Edge Functions ===${NC}\n"

# Check if Supabase is running locally
if ! curl -s "${LOCAL_URL%/functions/v1}/health" > /dev/null 2>&1; then
  echo -e "${RED}Error: Local Supabase is not running${NC}"
  echo "Start it with: supabase start"
  exit 1
fi

echo -e "${GREEN}✓ Local Supabase is running${NC}\n"

# Test 1: Integration Health
echo -e "${YELLOW}Test 1: Integration Health${NC}"
curl -s -X POST "${LOCAL_URL}/integration-health" \
  -H "Authorization: Bearer ${LOCAL_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"service": "openai"}' | jq '.'
echo ""

# Test 2: SMS Webhook
echo -e "${YELLOW}Test 2: SMS Webhook${NC}"
curl -s -X POST "${LOCAL_URL}/sms-webhook" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "From=+15555551234" \
  --data-urlencode "Body=3/2 house, 1200 sqft, needs work. 123 Oak St. Asking 200k. John 555-1234" \
  --data-urlencode "MessageSid=SM$(date +%s)"
echo -e "\n"

# Test 3: OpenAI
echo -e "${YELLOW}Test 3: OpenAI Function${NC}"
curl -s -X POST "${LOCAL_URL}/openai" \
  -H "Authorization: Bearer ${LOCAL_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Say hello in 5 words"}
    ],
    "model": "gpt-4o-mini",
    "max_tokens": 50
  }' | jq '.choices[0].message.content'
echo ""

echo -e "${GREEN}=== Local tests complete ===${NC}"
echo -e "${YELLOW}View logs with: supabase functions logs <function-name>${NC}"
