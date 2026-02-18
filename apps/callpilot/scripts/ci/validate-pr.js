#!/usr/bin/env node

/**
 * PR Validation Script
 *
 * Validates pull requests against project standards:
 * - Title format
 * - Description quality
 * - Size limits
 * - Required files
 * - Breaking changes
 * - Commit message format
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  maxPRSize: 1000, // Maximum total changes
  maxFilesChanged: 50, // Maximum files changed
  requiredLabels: [], // Labels that must be present
  titlePattern: /^(feat|fix|docs|style|refactor|perf|test|chore|ci|build|revert)(\(.+\))?: .+/,
  minDescriptionLength: 50,
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

/**
 * Get PR information from GitHub API
 */
async function getPRInfo() {
  const prNumber = process.env.PR_NUMBER;
  const token = process.env.GITHUB_TOKEN;

  if (!prNumber) {
    throw new Error('PR_NUMBER environment variable not set');
  }

  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable not set');
  }

  const [owner, repo] = process.env.GITHUB_REPOSITORY?.split('/') || [];
  if (!owner || !repo) {
    throw new Error('GITHUB_REPOSITORY environment variable not set correctly');
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch PR info: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get PR files from GitHub API
 */
async function getPRFiles() {
  const prNumber = process.env.PR_NUMBER;
  const token = process.env.GITHUB_TOKEN;
  const [owner, repo] = process.env.GITHUB_REPOSITORY?.split('/') || [];

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch PR files: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Validate PR title format
 */
function validateTitle(title) {
  info('Validating PR title...');

  if (!title) {
    error('PR title is empty');
    return false;
  }

  if (!CONFIG.titlePattern.test(title)) {
    error('PR title does not match conventional commit format');
    error('Expected format: type(scope): description');
    error('Example: feat(auth): add login functionality');
    error('Valid types: feat, fix, docs, style, refactor, perf, test, chore, ci, build, revert');
    return false;
  }

  success('PR title format is valid');
  return true;
}

/**
 * Validate PR description
 */
function validateDescription(body) {
  info('Validating PR description...');

  if (!body || body.length < CONFIG.minDescriptionLength) {
    error(`PR description is too short (minimum ${CONFIG.minDescriptionLength} characters)`);
    warning('A good PR description should include:');
    warning('- What changes were made');
    warning('- Why the changes were made');
    warning('- How to test the changes');
    return false;
  }

  // Check for common description sections
  const hasWhat = /## What|## Changes|## Description/i.test(body);
  const hasWhy = /## Why|## Motivation|## Context/i.test(body);
  const hasHow = /## How|## Testing|## Test Plan/i.test(body);

  if (!hasWhat && !hasWhy && !hasHow) {
    warning('PR description could be improved with structured sections:');
    warning('- ## What: Describe the changes');
    warning('- ## Why: Explain the motivation');
    warning('- ## How to Test: Testing instructions');
  }

  success('PR description is adequate');
  return true;
}

/**
 * Validate PR size
 */
function validateSize(files) {
  info('Validating PR size...');

  const filesChanged = files.length;
  const additions = files.reduce((sum, file) => sum + file.additions, 0);
  const deletions = files.reduce((sum, file) => sum + file.deletions, 0);
  const totalChanges = additions + deletions;

  info(`Files changed: ${filesChanged}`);
  info(`Additions: +${additions}`);
  info(`Deletions: -${deletions}`);
  info(`Total changes: ${totalChanges}`);

  let isValid = true;

  if (filesChanged > CONFIG.maxFilesChanged) {
    warning(`PR changes ${filesChanged} files (recommended max: ${CONFIG.maxFilesChanged})`);
    warning('Consider breaking this PR into smaller, more focused changes');
    isValid = false;
  }

  if (totalChanges > CONFIG.maxPRSize) {
    warning(`PR has ${totalChanges} total changes (recommended max: ${CONFIG.maxPRSize})`);
    warning('Large PRs are harder to review and more likely to introduce bugs');
    warning('Consider breaking this into multiple PRs');
    isValid = false;
  }

  if (isValid) {
    success('PR size is reasonable');
  }

  return isValid;
}

/**
 * Check for breaking changes
 */
function checkBreakingChanges(title, body) {
  info('Checking for breaking changes...');

  const hasBreakingInTitle = title.includes('!:') || title.toUpperCase().includes('BREAKING');
  const hasBreakingInBody = body && body.toUpperCase().includes('BREAKING CHANGE');

  if (hasBreakingInTitle || hasBreakingInBody) {
    warning('⚠️  This PR contains BREAKING CHANGES!');
    warning('Make sure:');
    warning('- Breaking changes are clearly documented');
    warning('- Migration guide is provided');
    warning('- Version bump is appropriate (major version)');
    return true;
  }

  info('No breaking changes detected');
  return false;
}

/**
 * Validate modified files
 */
function validateFiles(files) {
  info('Validating modified files...');

  const issues = [];

  // Check for sensitive files
  const sensitiveFiles = [
    '.env',
    'secrets.json',
    'credentials.json',
    'keystore.jks',
    '.p12',
    'google-services.json',
    'GoogleService-Info.plist',
  ];

  files.forEach((file) => {
    const filename = path.basename(file.filename);

    // Check for sensitive files
    if (sensitiveFiles.some((pattern) => filename.includes(pattern))) {
      issues.push(`⚠️  Sensitive file detected: ${file.filename}`);
    }

    // Check for large files
    if (file.additions > 500) {
      issues.push(`⚠️  Large file: ${file.filename} (+${file.additions} lines)`);
    }

    // Check for lockfile-only changes
    if (filename === 'package-lock.json' || filename === 'yarn.lock') {
      if (files.length === 1) {
        issues.push('⚠️  PR only updates lockfile - is this intentional?');
      }
    }
  });

  if (issues.length > 0) {
    warning('File validation warnings:');
    issues.forEach((issue) => warning(issue));
    return false;
  }

  success('File validation passed');
  return true;
}

/**
 * Check for required changes
 */
function checkRequiredChanges(files) {
  info('Checking for required changes...');

  const filenames = files.map((f) => f.filename);
  const hasSourceChanges = filenames.some((f) => f.startsWith('src/'));
  const hasTestChanges = filenames.some(
    (f) => f.includes('.test.') || f.includes('.spec.') || f.includes('__tests__')
  );

  if (hasSourceChanges && !hasTestChanges) {
    warning('Source code changed but no test files were modified');
    warning('Consider adding tests for your changes');
    return false;
  }

  success('Required changes check passed');
  return true;
}

/**
 * Validate commit messages
 */
function validateCommits() {
  info('Validating commit messages...');

  try {
    // Get commits in the PR
    const commits = execSync('git log --format=%s origin/main..HEAD', {
      encoding: 'utf8',
    })
      .trim()
      .split('\n')
      .filter(Boolean);

    if (commits.length === 0) {
      warning('No commits found to validate');
      return true;
    }

    let isValid = true;
    commits.forEach((commit) => {
      if (!CONFIG.titlePattern.test(commit)) {
        warning(`Invalid commit message format: "${commit}"`);
        isValid = false;
      }
    });

    if (isValid) {
      success(`All ${commits.length} commit messages are valid`);
    } else {
      error('Some commit messages do not follow conventional commit format');
    }

    return isValid;
  } catch (err) {
    warning('Could not validate commit messages');
    return true; // Don't fail on this
  }
}

/**
 * Check for merge conflicts
 */
function checkMergeConflicts(files) {
  info('Checking for merge conflicts...');

  const conflictMarkers = ['<<<<<<<', '>>>>>>>', '======='];
  let hasConflicts = false;

  files.forEach((file) => {
    if (file.patch) {
      conflictMarkers.forEach((marker) => {
        if (file.patch.includes(marker)) {
          error(`Merge conflict detected in ${file.filename}`);
          hasConflicts = true;
        }
      });
    }
  });

  if (hasConflicts) {
    error('PR contains merge conflicts - please resolve before merging');
    return false;
  }

  success('No merge conflicts detected');
  return true;
}

/**
 * Generate validation report
 */
function generateReport(results) {
  console.log('\n' + '='.repeat(60));
  log('PR Validation Report', 'cyan');
  console.log('='.repeat(60) + '\n');

  const passed = Object.values(results).filter((r) => r === true).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([check, result]) => {
    const icon = result ? '✅' : '❌';
    const status = result ? 'PASS' : 'FAIL';
    console.log(`${icon} ${check}: ${status}`);
  });

  console.log('\n' + '='.repeat(60));
  log(`Results: ${passed}/${total} checks passed`, passed === total ? 'green' : 'red');
  console.log('='.repeat(60) + '\n');

  return passed === total;
}

/**
 * Main validation function
 */
async function main() {
  try {
    log('\n🔍 Starting PR validation...\n', 'blue');

    // Get PR information
    const pr = await getPRInfo();
    const files = await getPRFiles();

    info(`Validating PR #${pr.number}: ${pr.title}`);
    info(`Author: ${pr.user.login}`);
    info(`Base: ${pr.base.ref} ← Head: ${pr.head.ref}`);
    console.log('');

    // Run all validations
    const results = {
      'Title Format': validateTitle(pr.title),
      'Description Quality': validateDescription(pr.body),
      'PR Size': validateSize(files),
      'File Validation': validateFiles(files),
      'Required Changes': checkRequiredChanges(files),
      'Commit Messages': validateCommits(),
      'Merge Conflicts': checkMergeConflicts(files),
    };

    // Check for breaking changes (informational only)
    checkBreakingChanges(pr.title, pr.body);

    // Generate and display report
    const allPassed = generateReport(results);

    if (allPassed) {
      log('\n🎉 All validations passed!', 'green');
      process.exit(0);
    } else {
      log('\n❌ Some validations failed. Please review and fix the issues above.', 'red');
      process.exit(1);
    }
  } catch (err) {
    error(`Validation failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  validateTitle,
  validateDescription,
  validateSize,
  validateFiles,
  checkBreakingChanges,
};
