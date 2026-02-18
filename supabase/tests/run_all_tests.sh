#!/bin/bash

# Test Runner: Zone A Backend & Database
# Description: Runs all database and edge function tests
# Phase: 5 - Testing & Documentation

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SUPABASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="$SUPABASE_DIR/tests"

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Zone A: Backend & Database Test Suite        ║${NC}"
echo -e "${BLUE}║  Phase 5: Comprehensive Testing                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo -e "${YELLOW}⚠  DATABASE_URL not set. Defaulting to local Supabase.${NC}"
  DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
fi

# Check if SUPABASE_URL is set for edge function tests
if [ -z "$SUPABASE_URL" ]; then
  echo -e "${YELLOW}⚠  SUPABASE_URL not set. Defaulting to localhost.${NC}"
  export SUPABASE_URL="http://localhost:54321"
fi

# Check if SUPABASE_ANON_KEY is set
if [ -z "$SUPABASE_ANON_KEY" ]; then
  echo -e "${YELLOW}⚠  SUPABASE_ANON_KEY not set. Some tests may fail.${NC}"
fi

echo ""

# ============================================================================
# DATABASE TESTS (pgTAP)
# ============================================================================

echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}Running Database Tests (pgTAP)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""

DB_TESTS=(
  "01_rls_policies_test.sql"
  "02_foreign_keys_test.sql"
  "03_constraints_test.sql"
  "04_indexes_test.sql"
)

DB_PASS=0
DB_FAIL=0

for test_file in "${DB_TESTS[@]}"; do
  test_path="$TEST_DIR/database/$test_file"

  if [ ! -f "$test_path" ]; then
    echo -e "${YELLOW}⚠  Skipping $test_file (not found)${NC}"
    continue
  fi

  echo -e "${BLUE}▶  Running: $test_file${NC}"

  if psql "$DATABASE_URL" -f "$test_path" > /dev/null 2>&1; then
    echo -e "${GREEN}✓  PASSED: $test_file${NC}"
    ((DB_PASS++))
  else
    echo -e "${RED}✗  FAILED: $test_file${NC}"
    echo -e "${YELLOW}   Re-running with output...${NC}"
    psql "$DATABASE_URL" -f "$test_path"
    ((DB_FAIL++))
  fi

  echo ""
done

echo -e "${BLUE}Database Tests Summary:${NC}"
echo -e "  ${GREEN}Passed: $DB_PASS${NC}"
if [ $DB_FAIL -gt 0 ]; then
  echo -e "  ${RED}Failed: $DB_FAIL${NC}"
fi
echo ""

# ============================================================================
# EDGE FUNCTION TESTS (Deno)
# ============================================================================

echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}Running Edge Function Tests (Deno)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
  echo -e "${RED}✗  Deno not found. Skipping edge function tests.${NC}"
  echo -e "${YELLOW}   Install Deno: curl -fsSL https://deno.land/install.sh | sh${NC}"
  echo ""
else
  EDGE_TESTS=(
    "stripe-api.test.ts"
    "openai.test.ts"
    "integration-health.test.ts"
  )

  EDGE_PASS=0
  EDGE_FAIL=0

  for test_file in "${EDGE_TESTS[@]}"; do
    test_path="$TEST_DIR/edge-functions/$test_file"

    if [ ! -f "$test_path" ]; then
      echo -e "${YELLOW}⚠  Skipping $test_file (not found)${NC}"
      continue
    fi

    echo -e "${BLUE}▶  Running: $test_file${NC}"

    if deno test --allow-all --quiet "$test_path"; then
      echo -e "${GREEN}✓  PASSED: $test_file${NC}"
      ((EDGE_PASS++))
    else
      echo -e "${RED}✗  FAILED: $test_file${NC}"
      ((EDGE_FAIL++))
    fi

    echo ""
  done

  echo -e "${BLUE}Edge Function Tests Summary:${NC}"
  echo -e "  ${GREEN}Passed: $EDGE_PASS${NC}"
  if [ $EDGE_FAIL -gt 0 ]; then
    echo -e "  ${RED}Failed: $EDGE_FAIL${NC}"
  fi
  echo ""
fi

# ============================================================================
# INTEGRATION TESTS (Deno)
# ============================================================================

echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}Running Integration Tests (Deno)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""

if ! command -v deno &> /dev/null; then
  echo -e "${RED}✗  Deno not found. Skipping integration tests.${NC}"
  echo ""
else
  INTEGRATION_TESTS=(
    "auth-flow.test.ts"
    "document-upload.test.ts"
  )

  INT_PASS=0
  INT_FAIL=0

  for test_file in "${INTEGRATION_TESTS[@]}"; do
    test_path="$TEST_DIR/integration/$test_file"

    if [ ! -f "$test_path" ]; then
      echo -e "${YELLOW}⚠  Skipping $test_file (not found)${NC}"
      continue
    fi

    echo -e "${BLUE}▶  Running: $test_file${NC}"

    if deno test --allow-all --quiet "$test_path"; then
      echo -e "${GREEN}✓  PASSED: $test_file${NC}"
      ((INT_PASS++))
    else
      echo -e "${RED}✗  FAILED: $test_file${NC}"
      ((INT_FAIL++))
    fi

    echo ""
  done

  echo -e "${BLUE}Integration Tests Summary:${NC}"
  echo -e "  ${GREEN}Passed: $INT_PASS${NC}"
  if [ $INT_FAIL -gt 0 ]; then
    echo -e "  ${RED}Failed: $INT_FAIL${NC}"
  fi
  echo ""
fi

# ============================================================================
# FINAL SUMMARY
# ============================================================================

TOTAL_PASS=$((DB_PASS + EDGE_PASS + INT_PASS))
TOTAL_FAIL=$((DB_FAIL + EDGE_FAIL + INT_FAIL))
TOTAL_TESTS=$((TOTAL_PASS + TOTAL_FAIL))

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  FINAL TEST RESULTS                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Total Tests:    $TOTAL_TESTS"
echo -e "  ${GREEN}✓ Passed:       $TOTAL_PASS${NC}"

if [ $TOTAL_FAIL -gt 0 ]; then
  echo -e "  ${RED}✗ Failed:       $TOTAL_FAIL${NC}"
  echo ""
  echo -e "${RED}╔════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║  TESTS FAILED - Review errors above            ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════╝${NC}"
  exit 1
else
  echo ""
  echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ALL TESTS PASSED ✓                            ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
  exit 0
fi
