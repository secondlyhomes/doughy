#!/usr/bin/env node

/**
 * Environment Diagnostics
 *
 * Check development environment setup and dependencies
 *
 * Usage:
 *   npm run doctor
 */

const { execSync } = require('child_process')
const chalk = require('chalk')
const fs = require('fs-extra')
const path = require('path')

// Project root
const PROJECT_ROOT = path.resolve(__dirname, '../..')

/**
 * Main diagnostic
 */
async function main() {
  console.log(chalk.blue.bold('\n🔍 Environment Diagnostics\n'))

  const results = []

  // Check Node.js
  results.push(await checkNode())

  // Check npm
  results.push(await checkNpm())

  // Check Expo CLI
  results.push(await checkExpoCLI())

  // Check Supabase CLI
  results.push(await checkSupabaseCLI())

  // Check Git
  results.push(await checkGit())

  // Check TypeScript
  results.push(await checkTypeScript())

  // Check Dependencies
  results.push(await checkDependencies())

  // Check Environment Variables
  results.push(await checkEnvVars())

  // Check Ports
  results.push(await checkPorts())

  // Check File Structure
  results.push(await checkFileStructure())

  // Summary
  printSummary(results)
}

/**
 * Check Node.js version
 */
async function checkNode() {
  console.log(chalk.blue('Checking Node.js...'))

  try {
    const version = execSync('node --version', { encoding: 'utf-8' }).trim()
    const major = parseInt(version.slice(1).split('.')[0])

    if (major >= 20) {
      console.log(chalk.green(`  ✓ Node.js ${version}`))
      return { name: 'Node.js', status: 'pass', message: version }
    } else {
      console.log(chalk.yellow(`  ⚠️  Node.js ${version} (v20+ recommended)`))
      return { name: 'Node.js', status: 'warn', message: `${version} (v20+ recommended)` }
    }
  } catch (error) {
    console.log(chalk.red('  ✗ Node.js not found'))
    return { name: 'Node.js', status: 'fail', message: 'Not found' }
  }
}

/**
 * Check npm version
 */
async function checkNpm() {
  console.log(chalk.blue('Checking npm...'))

  try {
    const version = execSync('npm --version', { encoding: 'utf-8' }).trim()
    const major = parseInt(version.split('.')[0])

    if (major >= 10) {
      console.log(chalk.green(`  ✓ npm ${version}`))
      return { name: 'npm', status: 'pass', message: version }
    } else {
      console.log(chalk.yellow(`  ⚠️  npm ${version} (v10+ recommended)`))
      return { name: 'npm', status: 'warn', message: `${version} (v10+ recommended)` }
    }
  } catch (error) {
    console.log(chalk.red('  ✗ npm not found'))
    return { name: 'npm', status: 'fail', message: 'Not found' }
  }
}

/**
 * Check Expo CLI
 */
async function checkExpoCLI() {
  console.log(chalk.blue('Checking Expo CLI...'))

  try {
    const version = execSync('npx expo --version', { encoding: 'utf-8' }).trim()
    console.log(chalk.green(`  ✓ Expo CLI ${version}`))
    return { name: 'Expo CLI', status: 'pass', message: version }
  } catch (error) {
    console.log(chalk.yellow('  ⚠️  Expo CLI not found (will be installed on first run)'))
    return { name: 'Expo CLI', status: 'warn', message: 'Not found (optional)' }
  }
}

/**
 * Check Supabase CLI
 */
async function checkSupabaseCLI() {
  console.log(chalk.blue('Checking Supabase CLI...'))

  try {
    const version = execSync('supabase --version', { encoding: 'utf-8' }).trim()
    console.log(chalk.green(`  ✓ Supabase CLI ${version}`))
    return { name: 'Supabase CLI', status: 'pass', message: version }
  } catch (error) {
    console.log(chalk.yellow('  ⚠️  Supabase CLI not found (optional for backend features)'))
    return { name: 'Supabase CLI', status: 'warn', message: 'Not found (optional)' }
  }
}

/**
 * Check Git
 */
async function checkGit() {
  console.log(chalk.blue('Checking Git...'))

  try {
    const version = execSync('git --version', { encoding: 'utf-8' }).trim()
    console.log(chalk.green(`  ✓ ${version}`))
    return { name: 'Git', status: 'pass', message: version }
  } catch (error) {
    console.log(chalk.red('  ✗ Git not found'))
    return { name: 'Git', status: 'fail', message: 'Not found' }
  }
}

/**
 * Check TypeScript
 */
async function checkTypeScript() {
  console.log(chalk.blue('Checking TypeScript...'))

  try {
    const version = execSync('npx tsc --version', { encoding: 'utf-8' }).trim()
    console.log(chalk.green(`  ✓ ${version}`))
    return { name: 'TypeScript', status: 'pass', message: version }
  } catch (error) {
    console.log(chalk.red('  ✗ TypeScript not found'))
    return { name: 'TypeScript', status: 'fail', message: 'Not found' }
  }
}

/**
 * Check dependencies
 */
async function checkDependencies() {
  console.log(chalk.blue('Checking dependencies...'))

  const packageJsonPath = path.join(PROJECT_ROOT, 'package.json')
  const nodeModulesPath = path.join(PROJECT_ROOT, 'node_modules')

  if (!await fs.pathExists(packageJsonPath)) {
    console.log(chalk.red('  ✗ package.json not found'))
    return { name: 'Dependencies', status: 'fail', message: 'package.json not found' }
  }

  if (!await fs.pathExists(nodeModulesPath)) {
    console.log(chalk.yellow('  ⚠️  node_modules not found (run: npm install)'))
    return { name: 'Dependencies', status: 'warn', message: 'Not installed' }
  }

  const packageJson = await fs.readJson(packageJsonPath)
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  }

  const totalDeps = Object.keys(dependencies).length
  console.log(chalk.green(`  ✓ ${totalDeps} dependencies installed`))

  return { name: 'Dependencies', status: 'pass', message: `${totalDeps} installed` }
}

/**
 * Check environment variables
 */
async function checkEnvVars() {
  console.log(chalk.blue('Checking environment variables...'))

  const envPath = path.join(PROJECT_ROOT, '.env.local')

  if (!await fs.pathExists(envPath)) {
    console.log(chalk.yellow('  ⚠️  .env.local not found'))
    console.log(chalk.gray('      Copy .env.example to .env.local'))
    return { name: 'Environment', status: 'warn', message: '.env.local not found' }
  }

  const envContent = await fs.readFile(envPath, 'utf-8')
  const lines = envContent.split('\n').filter((line) => line.trim() && !line.startsWith('#'))

  console.log(chalk.green(`  ✓ .env.local exists (${lines.length} variables)`))

  // Check for required variables
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY']
  const missing = required.filter((key) => !envContent.includes(key))

  if (missing.length > 0) {
    console.log(chalk.yellow(`  ⚠️  Missing: ${missing.join(', ')}`))
    return { name: 'Environment', status: 'warn', message: `Missing ${missing.length} variables` }
  }

  return { name: 'Environment', status: 'pass', message: `${lines.length} variables` }
}

/**
 * Check ports
 */
async function checkPorts() {
  console.log(chalk.blue('Checking ports...'))

  const portsToCheck = [
    { port: 19000, name: 'Expo DevTools' },
    { port: 19001, name: 'Expo Metro' },
    { port: 54321, name: 'Supabase API' },
  ]

  const results = []

  for (const { port, name } of portsToCheck) {
    const inUse = await isPortInUse(port)
    if (inUse) {
      console.log(chalk.yellow(`  ⚠️  Port ${port} (${name}) is in use`))
      results.push({ port, name, inUse: true })
    } else {
      console.log(chalk.gray(`  · Port ${port} (${name}) available`))
      results.push({ port, name, inUse: false })
    }
  }

  const anyInUse = results.some((r) => r.inUse)
  return {
    name: 'Ports',
    status: anyInUse ? 'warn' : 'pass',
    message: anyInUse ? 'Some ports in use' : 'All available',
  }
}

/**
 * Check if port is in use
 */
async function isPortInUse(port) {
  const net = require('net')

  return new Promise((resolve) => {
    const server = net.createServer()

    server.once('error', () => {
      resolve(true)
    })

    server.once('listening', () => {
      server.close()
      resolve(false)
    })

    server.listen(port)
  })
}

/**
 * Check file structure
 */
async function checkFileStructure() {
  console.log(chalk.blue('Checking file structure...'))

  const requiredDirs = ['src', 'app', 'assets']
  const requiredFiles = ['package.json', 'tsconfig.json', 'app.json']

  const missing = []

  for (const dir of requiredDirs) {
    const dirPath = path.join(PROJECT_ROOT, dir)
    if (!await fs.pathExists(dirPath)) {
      missing.push(dir + '/')
    }
  }

  for (const file of requiredFiles) {
    const filePath = path.join(PROJECT_ROOT, file)
    if (!await fs.pathExists(filePath)) {
      missing.push(file)
    }
  }

  if (missing.length > 0) {
    console.log(chalk.red(`  ✗ Missing: ${missing.join(', ')}`))
    return { name: 'File Structure', status: 'fail', message: `Missing ${missing.length} items` }
  }

  console.log(chalk.green('  ✓ All required files present'))
  return { name: 'File Structure', status: 'pass', message: 'Complete' }
}

/**
 * Print summary
 */
function printSummary(results) {
  console.log(chalk.blue.bold('\n📊 Summary:\n'))

  const passed = results.filter((r) => r.status === 'pass').length
  const warned = results.filter((r) => r.status === 'warn').length
  const failed = results.filter((r) => r.status === 'fail').length

  // Print results table
  const maxNameLength = Math.max(...results.map((r) => r.name.length))

  for (const result of results) {
    const icon =
      result.status === 'pass'
        ? chalk.green('✓')
        : result.status === 'warn'
        ? chalk.yellow('⚠')
        : chalk.red('✗')

    const name = result.name.padEnd(maxNameLength)
    console.log(`  ${icon} ${name}  ${chalk.gray(result.message)}`)
  }

  // Print counts
  console.log()
  console.log(chalk.green(`  ✓ Passed: ${passed}`))
  if (warned > 0) {
    console.log(chalk.yellow(`  ⚠ Warnings: ${warned}`))
  }
  if (failed > 0) {
    console.log(chalk.red(`  ✗ Failed: ${failed}`))
  }

  // Overall status
  console.log()
  if (failed > 0) {
    console.log(chalk.red.bold('❌ Environment has issues\n'))
    console.log(chalk.gray('Fix the failed checks above and run again.\n'))
    process.exit(1)
  } else if (warned > 0) {
    console.log(chalk.yellow.bold('⚠️  Environment has warnings\n'))
    console.log(chalk.gray('Consider addressing warnings for optimal development.\n'))
  } else {
    console.log(chalk.green.bold('✅ Environment is ready!\n'))
  }
}

// Run diagnostic
main().catch((error) => {
  console.error(chalk.red('❌ Error:'), error.message)
  process.exit(1)
})
