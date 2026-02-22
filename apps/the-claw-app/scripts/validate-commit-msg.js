#!/usr/bin/env node

/**
 * Conventional Commit Message Validator
 * Ensures commit messages follow the conventional commits specification
 */

const fs = require('fs')

const COMMIT_MSG_FILE = process.argv[2]

if (!COMMIT_MSG_FILE) {
  console.error('Error: No commit message file provided')
  process.exit(1)
}

const commitMsg = fs.readFileSync(COMMIT_MSG_FILE, 'utf-8').trim()

// Skip validation for merge commits, revert commits, and initial commits
if (
  commitMsg.startsWith('Merge') ||
  commitMsg.startsWith('Revert') ||
  commitMsg.startsWith('Initial commit')
) {
  process.exit(0)
}

// Conventional commit pattern
const PATTERN = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?(!)?: .{1,72}/

// Valid types
const VALID_TYPES = [
  'feat',     // New feature
  'fix',      // Bug fix
  'docs',     // Documentation changes
  'style',    // Code style (formatting, missing semicolons, etc.)
  'refactor', // Code refactoring (no feature/fix)
  'test',     // Add or update tests
  'chore',    // Maintenance tasks
  'perf',     // Performance improvements
  'ci',       // CI/CD changes
  'build',    // Build system changes
  'revert',   // Revert previous commit
]

function validateCommitMessage(message) {
  const errors = []

  // Check basic format
  if (!PATTERN.test(message)) {
    errors.push('Message does not follow conventional commit format')
    errors.push('\nExpected format:')
    errors.push('  <type>(<scope>): <subject>')
    errors.push('\nExamples:')
    errors.push('  feat(auth): add OAuth login support')
    errors.push('  fix(tasks): resolve duplicate entries')
    errors.push('  docs(readme): update installation steps')
    return errors
  }

  // Extract type
  const typeMatch = message.match(/^([a-z]+)/)
  if (typeMatch) {
    const type = typeMatch[1]
    if (!VALID_TYPES.includes(type)) {
      errors.push(`Invalid type "${type}"`)
      errors.push(`\nValid types: ${VALID_TYPES.join(', ')}`)
    }
  }

  // Check subject length (first line)
  const firstLine = message.split('\n')[0]
  if (firstLine.length > 100) {
    errors.push(`Subject line too long (${firstLine.length} chars, max 100)`)
    errors.push('Keep it concise and under 100 characters')
  }

  // Check subject starts with lowercase
  const subjectMatch = message.match(/:\s+(.+)/)
  if (subjectMatch) {
    const subject = subjectMatch[1]
    if (subject[0] !== subject[0].toLowerCase()) {
      errors.push('Subject should start with lowercase')
      errors.push(`Found: "${subject[0]}" (should be "${subject[0].toLowerCase()}")`)
    }
  }

  // Check for imperative mood (simple heuristic)
  if (subjectMatch) {
    const subject = subjectMatch[1]
    const badPatterns = [
      { pattern: /^added/, replacement: 'add' },
      { pattern: /^fixed/, replacement: 'fix' },
      { pattern: /^updated/, replacement: 'update' },
      { pattern: /^removed/, replacement: 'remove' },
      { pattern: /^changed/, replacement: 'change' },
    ]

    badPatterns.forEach(({ pattern, replacement }) => {
      if (pattern.test(subject)) {
        errors.push(`Use imperative mood: "${replacement}" instead of past tense`)
      }
    })
  }

  return errors
}

const errors = validateCommitMessage(commitMsg)

if (errors.length > 0) {
  console.error('\n❌ Invalid commit message:\n')
  console.error(`"${commitMsg}"\n`)
  console.error('Errors:')
  errors.forEach(error => console.error(`  • ${error}`))
  console.error('\n📚 Commit Message Guidelines:')
  console.error('  • Use conventional commits format')
  console.error('  • Start with type: feat, fix, docs, style, refactor, test, chore, perf, ci, build')
  console.error('  • Add optional scope in parentheses: feat(auth):')
  console.error('  • Use imperative mood (add, not added)')
  console.error('  • Keep subject under 100 characters')
  console.error('  • Start subject with lowercase\n')
  console.error('See CONTRIBUTING.md for examples\n')
  console.error('⚠️  To bypass validation (not recommended):')
  console.error('   git commit --no-verify\n')
  process.exit(1)
}

console.log('✅ Commit message is valid')
process.exit(0)
