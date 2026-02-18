#!/usr/bin/env node

/**
 * Pre-commit Checks
 *
 * Run quality checks before committing code
 *
 * Usage:
 *   npm run check              # Run all checks
 *   npm run check:lint         # Lint only
 *   npm run check:types        # Type check only
 *   npm run check:tests        # Tests only
 */

const { execSync } = require('child_process')
const chalk = require('chalk')
const path = require('path')

// Project root
const PROJECT_ROOT = path.resolve(__dirname, '../..')

// Check configurations
const CHECKS = {
  lint: {
    name: 'ESLint',
    command: 'npm run lint',
    description: 'Check code style and quality',
  },
  types: {
    name: 'TypeScript',
    command: 'npx tsc --noEmit',
    description: 'Check type errors',
  },
  tests: {
    name: 'Tests',
    command: 'npm test -- --passWithNoTests',
    description: 'Run test suite',
  },
  format: {
    name: 'Prettier',
    command: 'npx prettier --check "src/**/*.{ts,tsx}"',
    description: 'Check code formatting',
    optional: true,
  },
  secrets: {
    name: 'Secrets',
    command: 'node scripts/check-secrets.js',
    description: 'Check for hardcoded secrets',
  },
  componentSize: {
    name: 'Component Size',
    command: 'node scripts/check-component-sizes.js',
    description: 'Check component file sizes',
  },
}

/**
 * Main CLI
 */
async function main() {
  try {
    const args = process.argv.slice(2)
    const mode = args[0] || 'all'

    console.log(chalk.blue.bold('\n✓ Pre-commit Checks\n'))

    switch (mode) {
      case 'all':
        await runAllChecks()
        break

      case 'lint':
        await runCheck('lint')
        break

      case 'types':
        await runCheck('types')
        break

      case 'tests':
        await runCheck('tests')
        break

      case 'format':
        await runCheck('format')
        break

      case 'secrets':
        await runCheck('secrets')
        break

      case 'size':
        await runCheck('componentSize')
        break

      case 'help':
        showHelp()
        break

      default:
        console.error(chalk.red(`❌ Unknown mode: ${mode}`))
        showHelp()
        process.exit(1)
    }

    console.log(chalk.green.bold('\n✅ All checks passed!\n'))
  } catch (error) {
    console.error(chalk.red.bold('\n❌ Checks failed\n'))
    process.exit(1)
  }
}

/**
 * Run all checks
 */
async function runAllChecks() {
  const checks = Object.entries(CHECKS).filter(
    ([_, check]) => !check.optional
  )

  console.log(chalk.gray(`Running ${checks.length} checks...\n`))

  let passed = 0
  let failed = 0

  for (const [key, check] of checks) {
    try {
      await runCheck(key, false)
      passed++
    } catch (error) {
      failed++
    }
  }

  console.log(chalk.blue('\n📊 Summary:\n'))
  console.log(chalk.green(`  ✓ Passed: ${passed}`))
  if (failed > 0) {
    console.log(chalk.red(`  ✗ Failed: ${failed}`))
    throw new Error('Some checks failed')
  }
}

/**
 * Run single check
 */
async function runCheck(checkKey, exitOnError = true) {
  const check = CHECKS[checkKey]

  if (!check) {
    console.error(chalk.red(`❌ Unknown check: ${checkKey}`))
    process.exit(1)
  }

  console.log(chalk.blue(`Running ${check.name}...`))
  console.log(chalk.gray(`  ${check.description}`))

  const startTime = Date.now()

  try {
    execSync(check.command, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    })

    const duration = Date.now() - startTime
    console.log(chalk.green(`✓ ${check.name} passed`), chalk.gray(`(${duration}ms)`))
  } catch (error) {
    const duration = Date.now() - startTime
    console.log(chalk.red(`✗ ${check.name} failed`), chalk.gray(`(${duration}ms)`))

    if (exitOnError) {
      process.exit(1)
    } else {
      throw error
    }
  }
}

/**
 * Show help
 */
function showHelp() {
  console.log(chalk.blue.bold('Pre-commit Checks\n'))
  console.log(chalk.gray('Modes:\n'))
  console.log(chalk.cyan('  all') + chalk.gray('      Run all checks'))
  console.log(chalk.cyan('  lint') + chalk.gray('     Run ESLint'))
  console.log(chalk.cyan('  types') + chalk.gray('    Run TypeScript check'))
  console.log(chalk.cyan('  tests') + chalk.gray('    Run tests'))
  console.log(chalk.cyan('  format') + chalk.gray('   Check formatting'))
  console.log(chalk.cyan('  secrets') + chalk.gray('  Check for secrets'))
  console.log(chalk.cyan('  size') + chalk.gray('     Check component sizes'))
  console.log(chalk.cyan('  help') + chalk.gray('     Show this help'))
  console.log(chalk.gray('\nExamples:\n'))
  console.log(chalk.gray('  npm run check'))
  console.log(chalk.gray('  npm run check:lint'))
  console.log(chalk.gray('  npm run check:types'))
  console.log()
}

// Run CLI
main()
