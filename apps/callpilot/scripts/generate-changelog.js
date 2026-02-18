#!/usr/bin/env node

/**
 * Changelog Generator
 *
 * Automatically generates CHANGELOG.md from conventional commits
 */

const { execSync } = require('child_process')
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')

// Paths
const ROOT_DIR = path.join(__dirname, '..')
const CHANGELOG_PATH = path.join(ROOT_DIR, 'CHANGELOG.md')
const PACKAGE_JSON = path.join(ROOT_DIR, 'package.json')

/**
 * Get commits between two tags
 */
function getCommitsBetween(fromTag, toTag) {
  const range = fromTag ? `${fromTag}..${toTag || 'HEAD'}` : toTag || 'HEAD'

  try {
    const commits = execSync(`git log ${range} --oneline`, { encoding: 'utf-8' })
    return commits.trim().split('\n').filter(Boolean)
  } catch (error) {
    return []
  }
}

/**
 * Parse conventional commit
 */
function parseCommit(commit) {
  const message = commit.substring(commit.indexOf(' ') + 1)

  // Match: type(scope): subject
  const match = message.match(/^(\w+)(?:\(([^)]+)\))?: (.+)/)

  if (!match) {
    return {
      type: 'other',
      scope: null,
      subject: message,
      breaking: message.includes('BREAKING CHANGE:'),
      raw: message,
    }
  }

  return {
    type: match[1].toLowerCase(),
    scope: match[2] || null,
    subject: match[3],
    breaking: message.includes('BREAKING CHANGE:') || message.includes('!:'),
    raw: message,
  }
}

/**
 * Group commits by type
 */
function groupCommits(commits) {
  const groups = {
    breaking: [],
    features: [],
    fixes: [],
    docs: [],
    style: [],
    refactor: [],
    perf: [],
    test: [],
    chore: [],
    other: [],
  }

  for (const commit of commits) {
    const parsed = parseCommit(commit)

    if (parsed.breaking) {
      groups.breaking.push(parsed)
    } else if (parsed.type === 'feat') {
      groups.features.push(parsed)
    } else if (parsed.type === 'fix') {
      groups.fixes.push(parsed)
    } else if (parsed.type === 'docs') {
      groups.docs.push(parsed)
    } else if (parsed.type === 'style') {
      groups.style.push(parsed)
    } else if (parsed.type === 'refactor') {
      groups.refactor.push(parsed)
    } else if (parsed.type === 'perf') {
      groups.perf.push(parsed)
    } else if (parsed.type === 'test') {
      groups.test.push(parsed)
    } else if (parsed.type === 'chore') {
      groups.chore.push(parsed)
    } else {
      groups.other.push(parsed)
    }
  }

  return groups
}

/**
 * Format commit for changelog
 */
function formatCommit(parsed) {
  const scope = parsed.scope ? `**${parsed.scope}:**` : ''
  return `- ${scope} ${parsed.subject}`
}

/**
 * Generate changelog section
 */
function generateSection(version, date, groups) {
  let section = `## [${version}] - ${date}\n\n`

  if (groups.breaking.length > 0) {
    section += `### ⚠️ BREAKING CHANGES\n\n`
    groups.breaking.forEach(commit => {
      section += formatCommit(commit) + '\n'
    })
    section += '\n'
  }

  if (groups.features.length > 0) {
    section += `### ✨ Features\n\n`
    groups.features.forEach(commit => {
      section += formatCommit(commit) + '\n'
    })
    section += '\n'
  }

  if (groups.fixes.length > 0) {
    section += `### 🐛 Bug Fixes\n\n`
    groups.fixes.forEach(commit => {
      section += formatCommit(commit) + '\n'
    })
    section += '\n'
  }

  if (groups.perf.length > 0) {
    section += `### ⚡ Performance\n\n`
    groups.perf.forEach(commit => {
      section += formatCommit(commit) + '\n'
    })
    section += '\n'
  }

  if (groups.docs.length > 0) {
    section += `### 📚 Documentation\n\n`
    groups.docs.forEach(commit => {
      section += formatCommit(commit) + '\n'
    })
    section += '\n'
  }

  if (groups.refactor.length > 0) {
    section += `### ♻️ Refactoring\n\n`
    groups.refactor.forEach(commit => {
      section += formatCommit(commit) + '\n'
    })
    section += '\n'
  }

  return section
}

/**
 * Get current date in YYYY-MM-DD format
 */
function getCurrentDate() {
  const now = new Date()
  return now.toISOString().split('T')[0]
}

/**
 * Main function
 */
async function main() {
  try {
    console.log(chalk.bold.cyan('\n📝 Changelog Generator\n'))

    // Get version from package.json
    const pkg = await fs.readJson(PACKAGE_JSON)
    const version = pkg.version

    // Get last tag
    let lastTag = null
    try {
      lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim()
    } catch (error) {
      console.log(chalk.yellow('⚠️  No previous tags found'))
    }

    // Get commits since last tag
    const commits = getCommitsBetween(lastTag, null)

    if (commits.length === 0) {
      console.log(chalk.yellow('⚠️  No commits to generate changelog from'))
      return
    }

    console.log(chalk.gray(`Found ${commits.length} commits since ${lastTag || 'beginning'}\n`))

    // Group commits
    const groups = groupCommits(commits)

    // Generate changelog section
    const date = getCurrentDate()
    const newSection = generateSection(version, date, groups)

    // Read existing changelog or create new
    let changelog = ''
    if (await fs.pathExists(CHANGELOG_PATH)) {
      changelog = await fs.readFile(CHANGELOG_PATH, 'utf-8')
    } else {
      changelog = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\nand this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n`
    }

    // Insert new section after header
    const headerEnd = changelog.indexOf('\n\n') + 2
    changelog = changelog.slice(0, headerEnd) + newSection + changelog.slice(headerEnd)

    // Write changelog
    await fs.writeFile(CHANGELOG_PATH, changelog)

    // Display preview
    console.log(chalk.bold('Generated changelog:\n'))
    console.log(chalk.gray('─'.repeat(60)))
    console.log(newSection)
    console.log(chalk.gray('─'.repeat(60)))
    console.log()
    console.log(chalk.green(`✅ CHANGELOG.md updated`))
    console.log()
  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message)
    process.exit(1)
  }
}

main()
