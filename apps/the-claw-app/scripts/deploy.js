#!/usr/bin/env node

/**
 * Deploy Script
 *
 * Full deployment workflow:
 * 1. Pre-deployment checks
 * 2. Version bump
 * 3. Generate changelog
 * 4. Commit and tag
 * 5. Build (optional)
 * 6. Push (optional)
 */

const { execSync } = require('child_process')
const inquirer = require('inquirer')
const chalk = require('chalk')
const path = require('path')

/**
 * Execute command with output
 */
function exec(command, description) {
  console.log(chalk.gray(`\n${description}...`))
  try {
    execSync(command, { stdio: 'inherit' })
    return true
  } catch (error) {
    console.error(chalk.red(`\n❌ Failed: ${description}`))
    return false
  }
}

/**
 * Execute command silently
 */
function execSilent(command) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim()
  } catch (error) {
    return null
  }
}

/**
 * Main deployment workflow
 */
async function main() {
  console.log(chalk.bold.magenta('\n🚀 Deployment Workflow\n'))

  // Step 1: Pre-deployment checks
  console.log(chalk.bold.cyan('Step 1: Pre-deployment Checks\n'))

  const { runChecks } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'runChecks',
      message: 'Run pre-deployment checks?',
      default: true,
    },
  ])

  if (runChecks) {
    if (!exec('node scripts/pre-deployment-check.js', 'Running checks')) {
      const { continueAnyway } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continueAnyway',
          message: 'Checks failed. Continue anyway?',
          default: false,
        },
      ])

      if (!continueAnyway) {
        console.log(chalk.yellow('\nDeployment cancelled.'))
        process.exit(0)
      }
    }
  }

  // Step 2: Version bump
  console.log(chalk.bold.cyan('\n\nStep 2: Version Bump\n'))

  const { bumpType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'bumpType',
      message: 'Version bump type:',
      choices: [
        { name: 'Auto-detect (recommended)', value: 'auto' },
        { name: 'Patch (bug fixes)', value: 'patch' },
        { name: 'Minor (new features)', value: 'minor' },
        { name: 'Major (breaking changes)', value: 'major' },
      ],
      default: 'auto',
    },
  ])

  const bumpCommand =
    bumpType === 'auto'
      ? 'node scripts/version-bump.js'
      : `node scripts/version-bump.js ${bumpType}`

  if (!exec(bumpCommand, 'Bumping version')) {
    console.log(chalk.red('\n❌ Version bump failed'))
    process.exit(1)
  }

  // Get new version
  const newVersion = execSilent('node -p "require(\'./package.json\').version"')

  // Step 3: Generate changelog
  console.log(chalk.bold.cyan('\n\nStep 3: Generate Changelog\n'))

  const { generateChangelog } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'generateChangelog',
      message: 'Generate changelog?',
      default: true,
    },
  ])

  if (generateChangelog) {
    exec('node scripts/generate-changelog.js', 'Generating changelog')
  }

  // Step 4: Review changes
  console.log(chalk.bold.cyan('\n\nStep 4: Review Changes\n'))

  exec('git diff package.json app.json CHANGELOG.md', 'Showing changes')

  const { confirmChanges } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmChanges',
      message: 'Proceed with these changes?',
      default: true,
    },
  ])

  if (!confirmChanges) {
    console.log(chalk.yellow('\nDeployment cancelled.'))
    // Revert changes
    exec('git checkout package.json app.json CHANGELOG.md', 'Reverting changes')
    exec('git tag -d v' + newVersion, 'Removing tag')
    process.exit(0)
  }

  // Step 5: Commit and push
  console.log(chalk.bold.cyan('\n\nStep 5: Commit and Push\n'))

  const { commitAndPush } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'commitAndPush',
      message: 'Commit and push changes?',
      default: true,
    },
  ])

  if (commitAndPush) {
    // Commit
    exec('git add package.json app.json CHANGELOG.md', 'Staging files')
    exec(
      `git commit -m "chore: release v${newVersion}"`,
      'Creating commit'
    )

    // Push
    const { pushToRemote } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'pushToRemote',
        message: 'Push to remote?',
        default: true,
      },
    ])

    if (pushToRemote) {
      const branch = execSilent('git branch --show-current')
      exec(`git push origin ${branch}`, 'Pushing commits')
      exec(`git push origin v${newVersion}`, 'Pushing tags')
    }
  }

  // Step 6: Build (optional)
  console.log(chalk.bold.cyan('\n\nStep 6: Build (Optional)\n'))

  const { buildApp } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'buildApp',
      message: 'Build app with EAS?',
      default: false,
    },
  ])

  if (buildApp) {
    const { platform } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'platform',
        message: 'Select platforms:',
        choices: [
          { name: 'iOS', value: 'ios' },
          { name: 'Android', value: 'android' },
        ],
      },
    ])

    if (platform.includes('ios')) {
      exec(
        'eas build --platform ios --profile production',
        'Building for iOS'
      )
    }

    if (platform.includes('android')) {
      exec(
        'eas build --platform android --profile production',
        'Building for Android'
      )
    }
  }

  // Step 7: Submit (optional)
  console.log(chalk.bold.cyan('\n\nStep 7: Submit (Optional)\n'))

  const { submitApp } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'submitApp',
      message: 'Submit to app stores?',
      default: false,
    },
  ])

  if (submitApp) {
    const { submitPlatform } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'submitPlatform',
        message: 'Select platforms:',
        choices: [
          { name: 'iOS (TestFlight)', value: 'ios' },
          { name: 'Android (Internal Testing)', value: 'android' },
        ],
      },
    ])

    if (submitPlatform.includes('ios')) {
      exec('eas submit --platform ios --latest', 'Submitting to TestFlight')
    }

    if (submitPlatform.includes('android')) {
      exec(
        'eas submit --platform android --track internal --latest',
        'Submitting to Play Store'
      )
    }
  }

  // Success!
  console.log(chalk.bold.green('\n\n✅ Deployment complete!\n'))
  console.log(chalk.bold(`Version: ${newVersion}`))
  console.log(chalk.gray(`Tag: v${newVersion}`))
  console.log()
}

main()
