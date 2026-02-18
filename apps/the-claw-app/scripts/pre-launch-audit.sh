#!/bin/bash

#############################################
# Pre-Launch Security & Quality Audit
#
# Run this before deploying to production
# Checks for security issues, code quality,
# and common mistakes
#############################################

set -e  # Exit on first error

echo "🚀 Pre-Launch Audit - Mobile App Blueprint"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to print success
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
error() {
    echo -e "${RED}❌ $1${NC}"
    ERRORS=$((ERRORS + 1))
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

#############################################
# 1. Check for Hardcoded Secrets
#############################################
echo "1️⃣  Checking for hardcoded secrets..."

# Common secret patterns
SECRET_PATTERNS=(
    "sk-[a-zA-Z0-9]{20,}"                    # OpenAI keys
    "sk_live_[a-zA-Z0-9]{24,}"               # Stripe live keys
    "AKIA[0-9A-Z]{16}"                       # AWS access keys
    "AIza[0-9A-Za-z\-_]{35}"                 # Google API keys
    "SG\.[a-zA-Z0-9_-]{22}"                  # SendGrid keys
)

SECRETS_FOUND=false

for pattern in "${SECRET_PATTERNS[@]}"; do
    # Search in src/ and app/ directories, excluding node_modules and .env.example
    if grep -rE "$pattern" src/ app/ 2>/dev/null | grep -v ".env.example" | grep -v "node_modules"; then
        SECRETS_FOUND=true
    fi
done

if [ "$SECRETS_FOUND" = true ]; then
    error "Hardcoded secrets detected in codebase!"
    echo "   → Remove secrets and use environment variables or Supabase Vault"
    echo "   → See docs/09-security/API-KEY-MANAGEMENT.md"
else
    success "No hardcoded secrets detected"
fi

echo ""

#############################################
# 2. npm audit (High/Critical Vulnerabilities)
#############################################
echo "2️⃣  Running npm audit for vulnerabilities..."

if npm audit --audit-level=high --production 2>/dev/null; then
    success "No high/critical vulnerabilities found"
else
    error "High or critical vulnerabilities detected!"
    echo "   → Run: npm audit"
    echo "   → Run: npm audit fix (to auto-fix)"
    echo "   → Review: npm audit fix --dry-run"
fi

echo ""

#############################################
# 3. TypeScript Type Checking
#############################################
echo "3️⃣  Running TypeScript type check..."

if npx tsc --noEmit; then
    success "TypeScript type check passed"
else
    error "TypeScript type errors detected!"
    echo "   → Fix type errors before deploying"
fi

echo ""

#############################################
# 4. Linting
#############################################
echo "4️⃣  Running ESLint..."

if npm run lint; then
    success "ESLint passed"
else
    error "ESLint errors detected!"
    echo "   → Run: npm run lint:fix (to auto-fix)"
fi

echo ""

#############################################
# 5. Tests
#############################################
echo "5️⃣  Running tests..."

if npm test -- --passWithNoTests --ci --silent; then
    success "All tests passed"
else
    error "Test failures detected!"
    echo "   → Fix failing tests before deploying"
fi

echo ""

#############################################
# 6. Component Size Check
#############################################
echo "6️⃣  Checking component sizes (>200 lines)..."

OVERSIZED_COMPONENTS=$(find src/ app/ -name "*.tsx" -o -name "*.jsx" 2>/dev/null | while read file; do
    lines=$(grep -cve '^\s*$' -ve '^\s*//' "$file" 2>/dev/null || echo 0)
    if [ "$lines" -gt 200 ]; then
        echo "$file: $lines lines"
    fi
done)

if [ -z "$OVERSIZED_COMPONENTS" ]; then
    success "All components under 200 lines"
else
    warning "Some components exceed 200 lines (target 150):"
    echo "$OVERSIZED_COMPONENTS" | while read line; do
        echo "   → $line"
    done
    echo "   → Consider splitting large components"
fi

echo ""

#############################################
# 7. Environment Variables Check
#############################################
echo "7️⃣  Checking environment configuration..."

# Check if .env exists
if [ ! -f ".env" ]; then
    warning ".env file not found"
    echo "   → Create .env from .env.example"
else
    success ".env file exists"

    # Check for required variables
    if ! grep -q "EXPO_PUBLIC_APP_ENV" .env; then
        warning "EXPO_PUBLIC_APP_ENV not set in .env"
    fi
fi

echo ""

#############################################
# 8. Git Status Check
#############################################
echo "8️⃣  Checking git status..."

if [ -n "$(git status --porcelain)" ]; then
    warning "Uncommitted changes detected"
    echo "   → Commit all changes before deploying"
else
    success "Git working directory clean"
fi

echo ""

#############################################
# 9. Build Test (Dry Run)
#############################################
echo "9️⃣  Testing build configuration..."

# Check if eas.json exists
if [ -f "eas.json" ]; then
    success "eas.json configuration found"
else
    warning "eas.json not found"
    echo "   → Run: eas build:configure"
fi

# Check if app.json exists and has required fields
if [ -f "app.json" ]; then
    if ! grep -q "\"version\":" app.json; then
        warning "Version not set in app.json"
    else
        success "app.json configured"
    fi
else
    error "app.json not found!"
fi

echo ""

#############################################
# 10. Database Security Check (RLS)
#############################################
echo "🔟  Checking database security patterns..."

# Check if any table creation SQL doesn't enable RLS
RLS_ISSUES=$(grep -r "CREATE TABLE" supabase/migrations/ 2>/dev/null | grep -v "ENABLE ROW LEVEL SECURITY" || true)

if [ -n "$RLS_ISSUES" ]; then
    warning "Some SQL migrations might be missing RLS"
    echo "   → Verify all tables have RLS enabled"
    echo "   → See docs/03-database/SUPABASE-SETUP.md"
else
    success "SQL migrations look secure"
fi

echo ""

#############################################
# Summary
#############################################
echo "=========================================="
echo "📊 Audit Summary"
echo "=========================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! Ready for deployment.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found. Review before deploying.${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS error(s) and $WARNINGS warning(s) found.${NC}"
    echo ""
    echo "Fix all errors before deploying to production."
    echo ""
    echo "Documentation:"
    echo "  • Security: docs/09-security/SECURITY-CHECKLIST.md"
    echo "  • Testing: docs/06-testing/"
    echo "  • Deployment: docs/11-deployment/"
    exit 1
fi
