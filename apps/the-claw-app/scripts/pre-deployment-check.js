#!/usr/bin/env node

/**
 * Pre-Deployment Check Script
 *
 * Runs comprehensive checks before deploying to production
 */

const { execSync } = require('child_process')
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')

// Paths
const ROOT_DIR = path.join(__dirname, '..')
const PACKAGE_JSON = path.join(ROOT_DIR, 'package.json')
const CHANGELOG_PATH = path.join(ROOT_DIR, 'CHANGELOG.md')

// Track failures
const failures = []
const warnings = []

/**
 * Run a check
 */
async function runCheck(name, checkFn) {
  process.stdout.write(chalk.gray(`Checking ${name}... `))

  try {
    const result = await checkFn()

    if (result === true) {
      console.log(chalk.green('✓'))
      return true
    } else if (result === 'warn') {
      console.log(chalk.yellow('⚠'))
      warnings.push(name)
      return true
    } else {
      console.log(chalk.red('✗'))
      failures.push(name)
      return false
    }
  } catch (error) {
    console.log(chalk.red('✗'))
    console.log(chalk.red(`  Error: ${error.message}`))
    failures.push(name)
    return false
  }
}

/**
 * Check: Version bumped since last release
 */
async function checkVersionBumped() {
  try {
    const lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim()
    const pkg = await fs.readJson(PACKAGE_JSON)
    const currentVersion = `v${pkg.version}`

    if (currentVersion === lastTag) {
      throw new Error('Version not bumped since last release')
    }

    return true
  } catch (error) {
    // No tags yet - OK
    if (error.message.includes('No names found')) {
      return true
    }
    throw error
  }
}

/**
 * Check: All tests pass
 */
function checkTests() {
  try {
    execSync('npm test -- --passWithNoTests', { stdio: 'pipe' })
    return true
  } catch (error) {
    throw new Error('Tests failed')
  }
}

/**
 * Check: TypeScript compiles
 */
function checkTypeScript() {
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' })
    return true
  } catch (error) {
    throw new Error('TypeScript compilation failed')
  }
}

/**
 * Check: No hardcoded secrets
 */
function checkSecrets() {
  try {
    // Search for common secret patterns
    const patterns = [
      'sk-[a-zA-Z0-9]{48}', // OpenAI keys
      'AKIA[0-9A-Z]{16}', // AWS access keys
      'AIza[0-9A-Za-z-_]{35}', // Google API keys
    ]

    const srcDir = path.join(ROOT_DIR, 'src')

    for (const pattern of patterns) {
      try {
        const result = execSync(`grep -r "${pattern}" "${srcDir}" || true`, {
          encoding: 'utf-8',
        })

        if (result.trim()) {
          throw new Error(`Found potential hardcoded secret: ${pattern}`)
        }
      } catch (error) {
        // grep not found on Windows - skip
        if (error.message.includes('command not found')) {
          return 'warn'
        }
        throw error
      }
    }

    return true
  } catch (error) {
    throw error
  }
}

/**
 * Check: CHANGELOG updated
 */
async function checkChangelog() {
  if (!(await fs.pathExists(CHANGELOG_PATH))) {
    throw new Error('CHANGELOG.md not found')
  }

  const pkg = await fs.readJson(PACKAGE_JSON)
  const changelog = await fs.readFile(CHANGELOG_PATH, 'utf-8')

  if (!changelog.includes(pkg.version)) {
    throw new Error('CHANGELOG.md not updated for current version')
  }

  return true
}

/**
 * Check: Git working directory clean
 */
function checkGitClean() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' })

    if (status.trim()) {
      throw new Error('Uncommitted changes detected')
    }

    return true
  } catch (error) {
    throw error
  }
}

/**
 * Check: On main/master branch
 */
function checkBranch() {
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim()

    if (!['main', 'master'].includes(branch)) {
      console.log(chalk.yellow(`\n  Warning: Not on main/master branch (current: ${branch})`))
      return 'warn'
    }

    return true
  } catch (error) {
    throw error
  }
}

/**
 * Check: No console.log in source
 */
function checkConsoleLogs() {
  try {
    const srcDir = path.join(ROOT_DIR, 'src')

    try {
      const result = execSync(`grep -r "console\\.log" "${srcDir}" || true`, {
        encoding: 'utf-8',
      })

      if (result.trim()) {
        console.log(chalk.yellow('\n  Warning: console.log found in source code'))
        return 'warn'
      }
    } catch (error) {
      // grep not found on Windows - skip
      if (error.message.includes('command not found')) {
        return 'warn'
      }
      throw error
    }

    return true
  } catch (error) {
    throw error
  }
}

/**
 * Check: Dependencies up to date
 */
function checkDependencies() {
  try {
    execSync('npm audit --audit-level=high', { stdio: 'pipe' })
    return true
  } catch (error) {
    console.log(chalk.yellow('\n  Warning: npm audit found vulnerabilities'))
    return 'warn'
  }
}

/**
 * Check: Environment variables configured
 */
async function checkEnvironment() {
  const envPath = path.join(ROOT_DIR, '.env')

  if (!(await fs.pathExists(envPath))) {
    console.log(chalk.yellow('\n  Warning: .env file not found'))
    return 'warn'
  }

  return true
}

/**
 * Main function
 */
async function main() {
  console.log(chalk.bold.cyan('\n🔍 Pre-Deployment Checks\n'))

  // Run all checks
  await runCheck('Version bumped', checkVersionBumped)
  await runCheck('Tests passing', checkTests)
  await runCheck('TypeScript compiles', checkTypeScript)
  await runCheck('No hardcoded secrets', checkSecrets)
  await runCheck('CHANGELOG updated', checkChangelog)
  await runCheck('Git working directory clean', checkGitClean)
  await runCheck('On main/master branch', checkBranch)
  await runCheck('No console.log in production', checkConsoleLogs)
  await runCheck('Dependencies secure', checkDependencies)
  await runCheck('Environment configured', checkEnvironment)

  // Summary
  console.log()

  if (failures.length > 0) {
    console.log(chalk.red.bold(`❌ ${failures.length} check(s) failed:`))
    failures.forEach(f => console.log(chalk.red(`  - ${f}`)))
    console.log()
    console.log(chalk.yellow('Fix the issues above before deploying.'))
    process.exit(1)
  }

  if (warnings.length > 0) {
    console.log(chalk.yellow.bold(`⚠️  ${warnings.length} warning(s):`))
    warnings.forEach(w => console.log(chalk.yellow(`  - ${w}`)))
    console.log()
  }

  console.log(chalk.green.bold('✅ All pre-deployment checks passed!'))
  console.log()
  console.log(chalk.bold('Ready to deploy! 🚀'))
  console.log()
}

main()
