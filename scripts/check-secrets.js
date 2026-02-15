#!/usr/bin/env node

/**
 * Secret Scanner
 * Scans staged files for common secret patterns before allowing commit.
 * Adapted from mobile-app-blueprint for doughy-ai-mobile.
 */

const { execSync } = require('child_process')
const fs = require('fs')

// Patterns for common secrets
const SECRET_PATTERNS = [
  // API Keys
  { pattern: /sk-[a-zA-Z0-9]{20,}/, name: 'OpenAI API Key' },
  { pattern: /sk_live_[a-zA-Z0-9]{24,}/, name: 'Stripe Live Secret Key' },
  { pattern: /sk_test_[a-zA-Z0-9]{24,}/, name: 'Stripe Test Secret Key' },
  { pattern: /AKIA[0-9A-Z]{16}/, name: 'AWS Access Key' },
  { pattern: /AIza[0-9A-Za-z\-_]{35}/, name: 'Google API Key' },
  { pattern: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/, name: 'SendGrid API Key' },

  // Supabase service role (should never be in client code)
  { pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]{50,}/, name: 'Supabase Service Role / JWT Token' },

  // Generic patterns
  { pattern: /[a-zA-Z0-9_-]*api[_-]?key[a-zA-Z0-9_-]*\s*[=:]\s*['"][a-zA-Z0-9_-]{20,}['"]/, name: 'Generic API Key' },
  { pattern: /[a-zA-Z0-9_-]*secret[_-]?key[a-zA-Z0-9_-]*\s*[=:]\s*['"][a-zA-Z0-9_-]{20,}['"]/, name: 'Generic Secret Key' },
  { pattern: /password\s*[=:]\s*['"][^'"]{8,}['"]/, name: 'Hardcoded Password' },
  { pattern: /token\s*[=:]\s*['"][a-zA-Z0-9_-]{20,}['"]/, name: 'Generic Token' },

  // Database URLs
  { pattern: /postgres:\/\/[^:]+:[^@]+@[^\/]+/, name: 'PostgreSQL Connection String' },
  { pattern: /mongodb(\+srv)?:\/\/[^:]+:[^@]+@[^\/]+/, name: 'MongoDB Connection String' },

  // Private Keys
  { pattern: /-----BEGIN (RSA |DSA |EC )?PRIVATE KEY-----/, name: 'Private Key' },

  // JWT Secrets
  { pattern: /jwt[_-]?secret\s*[=:]\s*['"][^'"]{20,}['"]/, name: 'JWT Secret' },
]

// Files to exclude from scanning
const EXCLUDED_PATTERNS = [
  '.env.example',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '.husky/',
  'scripts/check-secrets.js',
  'docs/',
  '.md',
  'generated.ts',
  '__mocks__/',
  'jest.setup.js',
]

function shouldScanFile(filename) {
  return !EXCLUDED_PATTERNS.some(pattern => filename.includes(pattern))
}

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
    })
    return output.split('\n').filter(Boolean).filter(shouldScanFile)
  } catch (error) {
    return []
  }
}

function scanFile(filepath) {
  const findings = []

  if (!fs.existsSync(filepath)) {
    return findings
  }

  const content = fs.readFileSync(filepath, 'utf-8')
  const lines = content.split('\n')

  lines.forEach((line, index) => {
    SECRET_PATTERNS.forEach(({ pattern, name }) => {
      if (pattern.test(line)) {
        findings.push({
          file: filepath,
          line: index + 1,
          type: name,
          snippet: line.trim().substring(0, 80),
        })
      }
    })
  })

  return findings
}

function main() {
  console.log('Scanning staged files for secrets...\n')

  const stagedFiles = getStagedFiles()

  if (stagedFiles.length === 0) {
    console.log('No files to scan.')
    return
  }

  let foundSecrets = false

  stagedFiles.forEach(file => {
    const findings = scanFile(file)

    if (findings.length > 0) {
      foundSecrets = true
      console.error(`\nFound potential secrets in: ${file}`)
      findings.forEach(finding => {
        console.error(`   Line ${finding.line}: ${finding.type}`)
        console.error(`   > ${finding.snippet}...`)
      })
    }
  })

  if (foundSecrets) {
    console.error('\nCOMMIT BLOCKED: Secrets detected in staged files!')
    console.error('\nActions to take:')
    console.error('   1. Remove hardcoded secrets from your code')
    console.error('   2. Store secrets in .env file (gitignored)')
    console.error('   3. For server-side secrets, use Supabase Vault or env vars')
    console.error('   4. If this is a false positive, update scripts/check-secrets.js\n')
    console.error('To bypass this check (NOT recommended):')
    console.error('   git commit --no-verify\n')
    process.exit(1)
  }

  console.log(`Scanned ${stagedFiles.length} file(s) - No secrets detected\n`)
}

main()
