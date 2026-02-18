#!/usr/bin/env node

/**
 * Test Runner
 *
 * Enhanced test runner with multiple modes and reporting
 *
 * Usage:
 *   npm test                    # Run all tests
 *   npm run test:watch          # Watch mode
 *   npm run test:coverage       # With coverage
 *   npm run test:unit           # Unit tests only
 *   npm run test:integration    # Integration tests only
 *   npm run test:ci             # CI mode
 */

const { execSync } = require('child_process')
const chalk = require('chalk')
const fs = require('fs-extra')
const path = require('path')

// Project root
const PROJECT_ROOT = path.resolve(__dirname, '../..')

/**
 * Main CLI
 */
async function main() {
  try {
    const args = process.argv.slice(2)
    const mode = args[0] || 'test'

    console.log(chalk.blue.bold('\n🧪 Test Runner\n'))

    switch (mode) {
      case 'test':
      case 'run':
        await runTests()
        break

      case 'watch':
        await runWatch()
        break

      case 'coverage':
        await runCoverage()
        break

      case 'unit':
        await runUnit()
        break

      case 'integration':
        await runIntegration()
        break

      case 'visual':
        await runVisual()
        break

      case 'performance':
        await runPerformance()
        break

      case 'ci':
        await runCI()
        break

      case 'update-snapshots':
        await updateSnapshots()
        break

      case 'debug':
        await debugTests()
        break

      case 'help':
        showHelp()
        break

      default:
        console.error(chalk.red(`❌ Unknown mode: ${mode}`))
        showHelp()
        process.exit(1)
    }
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message)
    process.exit(1)
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log(chalk.blue('Running all tests...\n'))

  try {
    execSync('jest --passWithNoTests', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    })

    console.log(chalk.green('\n✅ All tests passed!'))
  } catch (error) {
    console.log(chalk.red('\n❌ Tests failed'))
    process.exit(1)
  }
}

/**
 * Run tests in watch mode
 */
async function runWatch() {
  console.log(chalk.blue('Running tests in watch mode...\n'))
  console.log(chalk.gray('Press q to quit, p to filter by pattern\n'))

  try {
    execSync('jest --watch', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    })
  } catch (error) {
    // User quit watch mode
  }
}

/**
 * Run tests with coverage
 */
async function runCoverage() {
  console.log(chalk.blue('Running tests with coverage...\n'))

  try {
    execSync('jest --coverage --passWithNoTests', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    })

    // Check coverage thresholds
    await checkCoverageThresholds()

    console.log(chalk.green('\n✅ Coverage report generated!'))
    console.log(chalk.gray('\nView report: coverage/lcov-report/index.html'))
  } catch (error) {
    console.log(chalk.red('\n❌ Coverage check failed'))
    process.exit(1)
  }
}

/**
 * Run unit tests only
 */
async function runUnit() {
  console.log(chalk.blue('Running unit tests...\n'))

  try {
    execSync('jest --testPathPattern=src', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    })

    console.log(chalk.green('\n✅ Unit tests passed!'))
  } catch (error) {
    console.log(chalk.red('\n❌ Unit tests failed'))
    process.exit(1)
  }
}

/**
 * Run integration tests only
 */
async function runIntegration() {
  console.log(chalk.blue('Running integration tests...\n'))

  try {
    execSync('jest --testPathPattern=integration', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    })

    console.log(chalk.green('\n✅ Integration tests passed!'))
  } catch (error) {
    console.log(chalk.red('\n❌ Integration tests failed'))
    process.exit(1)
  }
}

/**
 * Run visual regression tests
 */
async function runVisual() {
  console.log(chalk.blue('Running visual regression tests...\n'))

  try {
    execSync('jest --testPathPattern=visual', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    })

    console.log(chalk.green('\n✅ Visual tests passed!'))
  } catch (error) {
    console.log(chalk.red('\n❌ Visual tests failed'))
    process.exit(1)
  }
}

/**
 * Run performance tests
 */
async function runPerformance() {
  console.log(chalk.blue('Running performance tests...\n'))

  try {
    execSync('jest --testPathPattern=performance', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    })

    console.log(chalk.green('\n✅ Performance tests passed!'))
  } catch (error) {
    console.log(chalk.red('\n❌ Performance tests failed'))
    process.exit(1)
  }
}

/**
 * Run tests in CI mode
 */
async function runCI() {
  console.log(chalk.blue('Running tests in CI mode...\n'))

  try {
    execSync('jest --ci --coverage --maxWorkers=2 --passWithNoTests', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    })

    // Check coverage thresholds
    await checkCoverageThresholds()

    console.log(chalk.green('\n✅ CI tests passed!'))
  } catch (error) {
    console.log(chalk.red('\n❌ CI tests failed'))
    process.exit(1)
  }
}

/**
 * Update snapshots
 */
async function updateSnapshots() {
  console.log(chalk.yellow('⚠️  Update Snapshots\n'))
  console.log(chalk.gray('This will update all test snapshots\n'))

  try {
    execSync('jest --updateSnapshot', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    })

    console.log(chalk.green('\n✅ Snapshots updated!'))
  } catch (error) {
    console.log(chalk.red('\n❌ Snapshot update failed'))
    process.exit(1)
  }
}

/**
 * Debug tests
 */
async function debugTests() {
  console.log(chalk.blue('Running tests in debug mode...\n'))
  console.log(chalk.gray('Debugger listening on port 9229\n'))

  try {
    execSync('node --inspect-brk node_modules/.bin/jest --runInBand', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    })
  } catch (error) {
    // Debug session ended
  }
}

/**
 * Check coverage thresholds
 */
async function checkCoverageThresholds() {
  const coveragePath = path.join(PROJECT_ROOT, 'coverage', 'coverage-summary.json')

  if (!await fs.pathExists(coveragePath)) {
    console.log(chalk.yellow('⚠️  Coverage summary not found'))
    return
  }

  const coverage = await fs.readJson(coveragePath)
  const total = coverage.total

  // Thresholds
  const thresholds = {
    statements: 80,
    branches: 80,
    functions: 80,
    lines: 80,
  }

  console.log(chalk.blue('\n📊 Coverage Summary:\n'))

  const metrics = ['statements', 'branches', 'functions', 'lines']
  let passed = true

  for (const metric of metrics) {
    const pct = total[metric].pct
    const threshold = thresholds[metric]
    const status = pct >= threshold ? chalk.green('✓') : chalk.red('✗')
    const color = pct >= threshold ? chalk.green : chalk.red

    console.log(
      `  ${status} ${metric.padEnd(12)} ${color(
        `${pct.toFixed(2)}%`
      )} (threshold: ${threshold}%)`
    )

    if (pct < threshold) {
      passed = false
    }
  }

  if (!passed) {
    console.log(chalk.red('\n❌ Coverage below thresholds'))
    process.exit(1)
  }
}

/**
 * Show help
 */
function showHelp() {
  console.log(chalk.blue.bold('Test Runner\n'))
  console.log(chalk.gray('Modes:\n'))
  console.log(chalk.cyan('  test, run') + chalk.gray('        Run all tests'))
  console.log(chalk.cyan('  watch') + chalk.gray('             Run tests in watch mode'))
  console.log(chalk.cyan('  coverage') + chalk.gray('          Run tests with coverage'))
  console.log(chalk.cyan('  unit') + chalk.gray('              Run unit tests only'))
  console.log(chalk.cyan('  integration') + chalk.gray('       Run integration tests only'))
  console.log(chalk.cyan('  visual') + chalk.gray('            Run visual regression tests'))
  console.log(chalk.cyan('  performance') + chalk.gray('       Run performance tests'))
  console.log(chalk.cyan('  ci') + chalk.gray('                Run tests in CI mode'))
  console.log(chalk.cyan('  update-snapshots') + chalk.gray('  Update test snapshots'))
  console.log(chalk.cyan('  debug') + chalk.gray('             Run tests in debug mode'))
  console.log(chalk.cyan('  help') + chalk.gray('              Show this help'))
  console.log(chalk.gray('\nExamples:\n'))
  console.log(chalk.gray('  npm test'))
  console.log(chalk.gray('  npm run test:watch'))
  console.log(chalk.gray('  npm run test:coverage'))
  console.log(chalk.gray('  npm run test:ci'))
  console.log()
}

// Run CLI
main()
