#!/usr/bin/env node

/**
 * Clean Build Artifacts
 *
 * Remove build files, caches, and temporary files
 *
 * Usage:
 *   npm run clean              # Clean all
 *   npm run clean:cache        # Cache only
 *   npm run clean:build        # Build files only
 */

const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const inquirer = require('inquirer')

// Project root
const PROJECT_ROOT = path.resolve(__dirname, '../..')

// Directories to clean
const CLEAN_TARGETS = {
  cache: {
    name: 'Cache',
    paths: [
      'node_modules/.cache',
      '.expo',
      '.metro',
      'metro-cache',
      '.jest-cache',
    ],
  },
  build: {
    name: 'Build Files',
    paths: ['dist', 'build', 'android/app/build', 'ios/build'],
  },
  coverage: {
    name: 'Coverage Reports',
    paths: ['coverage', '.nyc_output'],
  },
  temp: {
    name: 'Temporary Files',
    paths: [
      '*.log',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      '.DS_Store',
      'Thumbs.db',
    ],
  },
  nodeModules: {
    name: 'Node Modules',
    paths: ['node_modules'],
    warning: 'Will require npm install',
  },
  lockFiles: {
    name: 'Lock Files',
    paths: ['package-lock.json', 'yarn.lock'],
    warning: 'Will be regenerated on npm install',
  },
}

/**
 * Main CLI
 */
async function main() {
  try {
    const args = process.argv.slice(2)
    const mode = args[0] || 'all'

    console.log(chalk.blue.bold('\n🧹 Clean Build Artifacts\n'))

    switch (mode) {
      case 'all':
        await cleanAll()
        break

      case 'cache':
        await cleanTarget('cache')
        break

      case 'build':
        await cleanTarget('build')
        break

      case 'coverage':
        await cleanTarget('coverage')
        break

      case 'temp':
        await cleanTarget('temp')
        break

      case 'deep':
        await deepClean()
        break

      case 'help':
        showHelp()
        break

      default:
        console.error(chalk.red(`❌ Unknown mode: ${mode}`))
        showHelp()
        process.exit(1)
    }

    console.log(chalk.green('\n✅ Clean complete!'))
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message)
    process.exit(1)
  }
}

/**
 * Clean all targets
 */
async function cleanAll() {
  console.log(chalk.blue('Cleaning all build artifacts...\n'))

  // Prompt for confirmation
  const answer = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'targets',
      message: 'Select items to clean:',
      choices: Object.entries(CLEAN_TARGETS)
        .filter(([key]) => key !== 'nodeModules' && key !== 'lockFiles')
        .map(([key, value]) => ({
          name: value.name,
          value: key,
          checked: true,
        })),
    },
  ])

  if (answer.targets.length === 0) {
    console.log(chalk.gray('No targets selected'))
    return
  }

  // Clean selected targets
  for (const target of answer.targets) {
    await cleanTarget(target)
  }
}

/**
 * Deep clean (including node_modules)
 */
async function deepClean() {
  console.log(chalk.yellow.bold('⚠️  Deep Clean\n'))
  console.log(chalk.gray('This will remove node_modules and lock files\n'))

  // Confirm
  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: chalk.yellow('Continue? You will need to run npm install afterwards.'),
      default: false,
    },
  ])

  if (!answer.confirm) {
    console.log(chalk.gray('Cancelled'))
    return
  }

  // Clean all targets including node_modules
  for (const [key, target] of Object.entries(CLEAN_TARGETS)) {
    await cleanTarget(key)
  }
}

/**
 * Clean specific target
 */
async function cleanTarget(targetKey) {
  const target = CLEAN_TARGETS[targetKey]

  if (!target) {
    console.error(chalk.red(`❌ Unknown target: ${targetKey}`))
    return
  }

  console.log(chalk.blue(`Cleaning ${target.name}...`))

  if (target.warning) {
    console.log(chalk.yellow(`⚠️  ${target.warning}`))
  }

  let cleaned = 0

  for (const targetPath of target.paths) {
    const fullPath = path.join(PROJECT_ROOT, targetPath)

    try {
      // Handle glob patterns
      if (targetPath.includes('*')) {
        const pattern = targetPath
        const files = await findFiles(pattern)

        for (const file of files) {
          if (await fs.pathExists(file)) {
            await fs.remove(file)
            console.log(chalk.gray(`  ✓ ${path.relative(PROJECT_ROOT, file)}`))
            cleaned++
          }
        }
      } else {
        // Direct path
        if (await fs.pathExists(fullPath)) {
          const stats = await fs.stat(fullPath)
          await fs.remove(fullPath)
          console.log(
            chalk.gray(
              `  ✓ ${path.relative(PROJECT_ROOT, fullPath)}${
                stats.isDirectory() ? '/' : ''
              }`
            )
          )
          cleaned++
        }
      }
    } catch (error) {
      console.log(chalk.yellow(`  ⚠️  Failed to clean: ${targetPath}`))
    }
  }

  if (cleaned === 0) {
    console.log(chalk.gray('  (nothing to clean)'))
  } else {
    console.log(chalk.green(`  ✓ Cleaned ${cleaned} item(s)`))
  }
}

/**
 * Find files matching pattern
 */
async function findFiles(pattern) {
  const glob = require('glob')

  return new Promise((resolve, reject) => {
    glob(pattern, { cwd: PROJECT_ROOT, absolute: true }, (err, files) => {
      if (err) reject(err)
      else resolve(files)
    })
  })
}

/**
 * Show help
 */
function showHelp() {
  console.log(chalk.blue.bold('Clean Build Artifacts\n'))
  console.log(chalk.gray('Modes:\n'))
  console.log(chalk.cyan('  all') + chalk.gray('      Clean all (except node_modules)'))
  console.log(chalk.cyan('  cache') + chalk.gray('    Clean cache files'))
  console.log(chalk.cyan('  build') + chalk.gray('    Clean build files'))
  console.log(chalk.cyan('  coverage') + chalk.gray(' Clean coverage reports'))
  console.log(chalk.cyan('  temp') + chalk.gray('     Clean temporary files'))
  console.log(chalk.cyan('  deep') + chalk.gray('     Deep clean (including node_modules)'))
  console.log(chalk.cyan('  help') + chalk.gray('     Show this help'))
  console.log(chalk.gray('\nExamples:\n'))
  console.log(chalk.gray('  npm run clean'))
  console.log(chalk.gray('  npm run clean:cache'))
  console.log(chalk.gray('  npm run clean:build'))
  console.log()
}

// Run CLI
main()
