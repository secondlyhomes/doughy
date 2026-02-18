#!/usr/bin/env node

/**
 * Component Size Checker
 * Warns if components exceed 200 lines (project standard: 200 hard, 150 target)
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const MAX_COMPONENT_LINES = 200

// Patterns for component files
const COMPONENT_PATTERNS = [
  /\.tsx$/,
  /\.jsx$/,
]

// Directories to check
const COMPONENT_DIRS = [
  'src/components',
  'src/screens',
  'app',
]

function isComponentFile(filename) {
  return COMPONENT_PATTERNS.some(pattern => pattern.test(filename))
}

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
    })
    return output.split('\n').filter(Boolean).filter(isComponentFile)
  } catch (error) {
    // No staged files or git error
    return []
  }
}

function countLines(filepath) {
  if (!fs.existsSync(filepath)) {
    return 0
  }

  const content = fs.readFileSync(filepath, 'utf-8')
  const lines = content.split('\n')

  // Count non-empty, non-comment-only lines
  let count = 0
  let inBlockComment = false

  lines.forEach(line => {
    const trimmed = line.trim()

    // Track block comments
    if (trimmed.includes('/*')) inBlockComment = true
    if (trimmed.includes('*/')) {
      inBlockComment = false
      return
    }

    // Skip empty lines, single-line comments, and lines in block comments
    if (
      trimmed.length === 0 ||
      trimmed.startsWith('//') ||
      trimmed.startsWith('*') ||
      inBlockComment
    ) {
      return
    }

    count++
  })

  return count
}

function checkComponentSize(filepath) {
  const lineCount = countLines(filepath)

  if (lineCount > MAX_COMPONENT_LINES) {
    return {
      file: filepath,
      lines: lineCount,
      exceeded: lineCount - MAX_COMPONENT_LINES,
    }
  }

  return null
}

function main() {
  console.log('📏 Checking component sizes...\n')

  const stagedFiles = getStagedFiles()

  if (stagedFiles.length === 0) {
    console.log('No component files to check.')
    return
  }

  const oversizedComponents = []

  stagedFiles.forEach(file => {
    const result = checkComponentSize(file)
    if (result) {
      oversizedComponents.push(result)
    }
  })

  if (oversizedComponents.length > 0) {
    console.warn('\n⚠️  WARNING: Components exceed 200-line limit:\n')
    oversizedComponents.forEach(component => {
      console.warn(`   ${component.file}`)
      console.warn(`   → ${component.lines} lines (${component.exceeded} over limit)\n`)
    })

    console.warn('📋 Recommendations:')
    console.warn('   1. Split large components into smaller, focused components')
    console.warn('   2. Extract logic into custom hooks (useXxx.ts)')
    console.warn('   3. Move business logic to service files')
    console.warn('   4. See docs/patterns/NEW-FEATURE.md for guidance\n')

    console.warn('💡 This is a warning, not a blocker.')
    console.warn('   Commit will proceed, but consider refactoring.\n')

    // Don't exit with error - just warn
    // Uncomment below to make this a hard blocker:
    // process.exit(1)
  } else {
    console.log(`✅ Checked ${stagedFiles.length} component(s) - All under 200 lines\n`)
  }
}

main()
