#!/usr/bin/env node

/**
 * Version Bump Script
 *
 * Automatically determines version bump based on conventional commits
 * Supports: major, minor, patch
 */

const { execSync } = require('child_process')
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')

// Paths
const ROOT_DIR = path.join(__dirname, '..')
const PACKAGE_JSON = path.join(ROOT_DIR, 'package.json')
const APP_JSON = path.join(ROOT_DIR, 'app.json')

/**
 * Get git commits since last tag
 */
function getCommitsSinceLastTag() {
  try {
    // Get last tag
    const lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim()

    // Get commits since last tag
    const commits = execSync(`git log ${lastTag}..HEAD --oneline`, { encoding: 'utf-8' })

    return {
      lastTag,
      commits: commits.trim().split('\n').filter(Boolean),
    }
  } catch (error) {
    // No tags yet
    console.log(chalk.yellow('⚠️  No previous tags found. Using all commits.'))

    const commits = execSync('git log --oneline', { encoding: 'utf-8' })

    return {
      lastTag: null,
      commits: commits.trim().split('\n').filter(Boolean),
    }
  }
}

/**
 * Analyze commits to determine version bump type
 */
function analyzeCommits(commits) {
  const analysis = {
    breaking: [],
    features: [],
    fixes: [],
    other: [],
  }

  for (const commit of commits) {
    const message = commit.substring(commit.indexOf(' ') + 1) // Remove commit hash

    // Check for breaking changes
    if (message.includes('BREAKING CHANGE:') || message.includes('!:')) {
      analysis.breaking.push(message)
    }
    // Check for features
    else if (message.match(/^feat(\(.*\))?:/i)) {
      analysis.features.push(message)
    }
    // Check for fixes
    else if (message.match(/^fix(\(.*\))?:/i)) {
      analysis.fixes.push(message)
    }
    // Other commits
    else {
      analysis.other.push(message)
    }
  }

  return analysis
}

/**
 * Determine version bump type
 */
function determineBumpType(analysis) {
  if (analysis.breaking.length > 0) {
    return 'major'
  } else if (analysis.features.length > 0) {
    return 'minor'
  } else if (analysis.fixes.length > 0) {
    return 'patch'
  } else {
    return 'patch' // Default to patch
  }
}

/**
 * Increment version
 */
function incrementVersion(version, bumpType) {
  const parts = version.split('.').map(Number)

  switch (bumpType) {
    case 'major':
      parts[0]++
      parts[1] = 0
      parts[2] = 0
      break
    case 'minor':
      parts[1]++
      parts[2] = 0
      break
    case 'patch':
      parts[2]++
      break
  }

  return parts.join('.')
}

/**
 * Update package.json version
 */
async function updatePackageJson(newVersion) {
  const pkg = await fs.readJson(PACKAGE_JSON)
  pkg.version = newVersion
  await fs.writeJson(PACKAGE_JSON, pkg, { spaces: 2 })
}

/**
 * Update app.json version and build numbers
 */
async function updateAppJson(newVersion) {
  try {
    const appJson = await fs.readJson(APP_JSON)

    if (!appJson.expo) {
      console.log(chalk.yellow('⚠️  No expo config in app.json'))
      return
    }

    // Update version
    appJson.expo.version = newVersion

    // Increment iOS build number
    if (appJson.expo.ios) {
      const currentBuild = appJson.expo.ios.buildNumber || '1'
      appJson.expo.ios.buildNumber = String(parseInt(currentBuild) + 1)
    }

    // Increment Android version code
    if (appJson.expo.android) {
      const currentCode = appJson.expo.android.versionCode || 1
      appJson.expo.android.versionCode = currentCode + 1
    }

    await fs.writeJson(APP_JSON, appJson, { spaces: 2 })
  } catch (error) {
    console.log(chalk.yellow('⚠️  app.json not found or invalid'))
  }
}

/**
 * Create git tag
 */
function createGitTag(version, message) {
  const tag = `v${version}`
  execSync(`git tag -a ${tag} -m "${message}"`, { stdio: 'inherit' })
  return tag
}

/**
 * Main function
 */
async function main() {
  try {
    console.log(chalk.bold.cyan('\n📦 Version Bump\n'))

    // Get command line argument for forced bump type
    const forcedBumpType = process.argv[2] // major, minor, or patch

    // Get commits since last tag
    const { lastTag, commits } = getCommitsSinceLastTag()

    if (lastTag) {
      console.log(chalk.gray(`Last tag: ${lastTag}`))
    }

    console.log(chalk.gray(`Analyzing ${commits.length} commits...\n`))

    // Analyze commits
    const analysis = analyzeCommits(commits)

    // Display analysis
    if (analysis.breaking.length > 0) {
      console.log(chalk.red(`⚠️  Breaking changes (${analysis.breaking.length}):`))
      analysis.breaking.forEach(c => console.log(chalk.gray(`   - ${c}`)))
      console.log()
    }

    if (analysis.features.length > 0) {
      console.log(chalk.green(`✨ Features (${analysis.features.length}):`))
      analysis.features.forEach(c => console.log(chalk.gray(`   - ${c}`)))
      console.log()
    }

    if (analysis.fixes.length > 0) {
      console.log(chalk.blue(`🐛 Fixes (${analysis.fixes.length}):`))
      analysis.fixes.forEach(c => console.log(chalk.gray(`   - ${c}`)))
      console.log()
    }

    // Determine bump type
    const suggestedBumpType = determineBumpType(analysis)
    const bumpType = forcedBumpType || suggestedBumpType

    if (forcedBumpType) {
      console.log(chalk.yellow(`Forced bump type: ${bumpType}`))
    } else {
      console.log(chalk.cyan(`Suggested bump type: ${bumpType}`))
    }

    // Get current version
    const pkg = await fs.readJson(PACKAGE_JSON)
    const currentVersion = pkg.version
    const newVersion = incrementVersion(currentVersion, bumpType)

    console.log()
    console.log(chalk.bold(`${currentVersion} → ${newVersion}\n`))

    // Update files
    console.log(chalk.gray('Updating package.json...'))
    await updatePackageJson(newVersion)

    console.log(chalk.gray('Updating app.json...'))
    await updateAppJson(newVersion)

    // Create git tag
    console.log(chalk.gray('Creating git tag...'))
    const tag = createGitTag(newVersion, `Release ${newVersion}`)

    // Success
    console.log()
    console.log(chalk.green(`✅ Version bumped to ${newVersion}`))
    console.log(chalk.green(`✅ Git tag created: ${tag}`))
    console.log()
    console.log(chalk.bold('Next steps:'))
    console.log(chalk.gray('  1. Review changes: git diff'))
    console.log(chalk.gray('  2. Commit: git add . && git commit -m "chore: release v' + newVersion + '"'))
    console.log(chalk.gray('  3. Push: git push origin main && git push origin ' + tag))
    console.log()
  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message)
    process.exit(1)
  }
}

main()
