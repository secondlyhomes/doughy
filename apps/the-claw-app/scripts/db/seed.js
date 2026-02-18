#!/usr/bin/env node

/**
 * Database Seeding Tool
 *
 * Seed database with test data for development
 *
 * Usage:
 *   npm run db:seed              # Seed with default data
 *   npm run db:seed users        # Seed specific table
 *   npm run db:seed clear        # Clear all data
 *   npm run db:seed generate     # Generate seed file from data
 */

const fs = require('fs-extra')
const path = require('path')
const { execSync } = require('child_process')
const chalk = require('chalk')
const inquirer = require('inquirer')

// Directories
const PROJECT_ROOT = path.resolve(__dirname, '../..')
const SEED_FILE = path.join(PROJECT_ROOT, 'supabase', 'seed.sql')
const SEED_DATA_DIR = path.join(__dirname, 'seed-data')

// Seed data templates
const SEED_TEMPLATES = {
  users: {
    name: 'Users',
    table: 'profiles',
    data: [
      {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'user1@example.com',
        full_name: 'Test User 1',
        avatar_url: null,
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'user2@example.com',
        full_name: 'Test User 2',
        avatar_url: null,
      },
    ],
  },
  tasks: {
    name: 'Tasks',
    table: 'tasks',
    data: [
      {
        title: 'Complete documentation',
        description: 'Write comprehensive docs',
        status: 'todo',
        user_id: '00000000-0000-0000-0000-000000000001',
      },
      {
        title: 'Review PR',
        description: 'Review pull request #123',
        status: 'in_progress',
        user_id: '00000000-0000-0000-0000-000000000001',
      },
      {
        title: 'Deploy to production',
        description: 'Deploy latest changes',
        status: 'done',
        user_id: '00000000-0000-0000-0000-000000000002',
      },
    ],
  },
}

/**
 * Main CLI
 */
async function main() {
  try {
    const args = process.argv.slice(2)
    const command = args[0] || 'seed'

    console.log(chalk.blue.bold('\n🌱 Database Seeding Tool\n'))

    switch (command) {
      case 'seed':
      case 'run':
        await seed(args[1])
        break

      case 'clear':
        await clear(args[1])
        break

      case 'generate':
        await generate()
        break

      case 'list':
        listTemplates()
        break

      case 'help':
        showHelp()
        break

      default:
        // Treat as table name
        await seed(command)
    }
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message)
    process.exit(1)
  }
}

/**
 * Seed database
 */
async function seed(tableName) {
  try {
    if (tableName) {
      // Seed specific table
      await seedTable(tableName)
    } else {
      // Seed all tables
      await seedAll()
    }

    console.log(chalk.green('\n✅ Database seeded successfully!'))
  } catch (error) {
    throw new Error(`Seeding failed: ${error.message}`)
  }
}

/**
 * Seed all tables
 */
async function seedAll() {
  console.log(chalk.blue('Seeding all tables...\n'))

  // Prompt for confirmation
  const answer = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'tables',
      message: 'Select tables to seed:',
      choices: Object.entries(SEED_TEMPLATES).map(([key, value]) => ({
        name: value.name,
        value: key,
        checked: true,
      })),
    },
  ])

  if (answer.tables.length === 0) {
    console.log(chalk.gray('No tables selected'))
    return
  }

  // Generate SQL
  let sql = '-- Seed Data\n-- Generated: ' + new Date().toISOString() + '\n\n'

  for (const tableName of answer.tables) {
    const template = SEED_TEMPLATES[tableName]
    sql += generateInsertSQL(template.table, template.data)
    sql += '\n'
  }

  // Write seed file
  await fs.ensureDir(path.dirname(SEED_FILE))
  await fs.writeFile(SEED_FILE, sql)

  console.log(chalk.green('✅ Seed file created:'))
  console.log(chalk.cyan(`   ${path.relative(PROJECT_ROOT, SEED_FILE)}`))

  // Run seed
  const runAnswer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'run',
      message: 'Run seed now?',
      default: true,
    },
  ])

  if (runAnswer.run) {
    execSync('supabase db seed', { stdio: 'inherit' })
    console.log(chalk.green('✅ Seed applied!'))
  }
}

/**
 * Seed specific table
 */
async function seedTable(tableName) {
  const template = SEED_TEMPLATES[tableName]

  if (!template) {
    console.error(chalk.red(`❌ Unknown table: ${tableName}`))
    console.log(chalk.gray('\nAvailable tables:'))
    Object.keys(SEED_TEMPLATES).forEach((key) => {
      console.log(chalk.gray(`  - ${key}`))
    })
    process.exit(1)
  }

  console.log(chalk.blue(`Seeding ${template.name}...\n`))

  // Generate SQL
  const sql =
    '-- Seed: ' +
    template.name +
    '\n-- Generated: ' +
    new Date().toISOString() +
    '\n\n' +
    generateInsertSQL(template.table, template.data)

  // Write and run
  await fs.writeFile(SEED_FILE, sql)
  execSync('supabase db seed', { stdio: 'inherit' })

  console.log(chalk.green(`✅ ${template.name} seeded!`))
  console.log(chalk.gray(`   ${template.data.length} rows inserted`))
}

/**
 * Clear database
 */
async function clear(tableName) {
  console.log(chalk.yellow('⚠️  Clear Database\n'))

  if (tableName) {
    const template = SEED_TEMPLATES[tableName]
    if (!template) {
      console.error(chalk.red(`❌ Unknown table: ${tableName}`))
      process.exit(1)
    }

    console.log(chalk.gray(`This will delete all data from: ${template.name}`))
  } else {
    console.log(chalk.gray('This will delete ALL data from ALL tables'))
  }

  // Confirm
  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: chalk.yellow('Continue?'),
      default: false,
    },
  ])

  if (!answer.confirm) {
    console.log(chalk.gray('Cancelled'))
    return
  }

  try {
    if (tableName) {
      // Clear specific table
      const template = SEED_TEMPLATES[tableName]
      const sql = `DELETE FROM ${template.table};`
      await runSQL(sql)
      console.log(chalk.green(`✅ ${template.name} cleared`))
    } else {
      // Clear all tables
      for (const template of Object.values(SEED_TEMPLATES)) {
        const sql = `DELETE FROM ${template.table};`
        await runSQL(sql)
        console.log(chalk.green(`✅ ${template.name} cleared`))
      }
    }
  } catch (error) {
    throw new Error(`Clear failed: ${error.message}`)
  }
}

/**
 * Generate seed file from current data
 */
async function generate() {
  console.log(chalk.blue('Generate Seed File\n'))

  console.log(chalk.gray('This will export current database data to seed file'))

  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Continue?',
      default: true,
    },
  ])

  if (!answer.confirm) {
    console.log(chalk.gray('Cancelled'))
    return
  }

  try {
    // Ensure seed data directory
    await fs.ensureDir(SEED_DATA_DIR)

    // Export each table
    for (const [key, template] of Object.entries(SEED_TEMPLATES)) {
      const outputFile = path.join(SEED_DATA_DIR, `${key}.sql`)

      console.log(chalk.blue(`Exporting ${template.name}...`))

      // Use pg_dump or supabase db dump
      const command = `supabase db dump --table ${template.table} > "${outputFile}"`

      try {
        execSync(command, { stdio: 'ignore' })
        console.log(chalk.green(`✅ ${template.name} exported`))
        console.log(chalk.gray(`   ${path.relative(PROJECT_ROOT, outputFile)}`))
      } catch (error) {
        console.log(chalk.yellow(`⚠️  ${template.name} export failed`))
      }
    }

    console.log(chalk.green('\n✅ Seed data generated!'))
    console.log(chalk.gray(`\nLocation: ${path.relative(PROJECT_ROOT, SEED_DATA_DIR)}`))
  } catch (error) {
    throw new Error(`Generation failed: ${error.message}`)
  }
}

/**
 * List available templates
 */
function listTemplates() {
  console.log(chalk.blue('Available Seed Templates:\n'))

  Object.entries(SEED_TEMPLATES).forEach(([key, template]) => {
    console.log(chalk.cyan(`${key} (${template.name})`))
    console.log(chalk.gray(`  Table: ${template.table}`))
    console.log(chalk.gray(`  Rows: ${template.data.length}`))
    console.log()
  })
}

/**
 * Generate INSERT SQL
 */
function generateInsertSQL(tableName, data) {
  if (!data || data.length === 0) {
    return `-- No data for ${tableName}\n`
  }

  // Get columns from first row
  const columns = Object.keys(data[0])

  let sql = `-- Insert into ${tableName}\n`

  data.forEach((row) => {
    const values = columns.map((col) => {
      const value = row[col]
      if (value === null || value === undefined) {
        return 'NULL'
      }
      if (typeof value === 'string') {
        // Escape single quotes
        return `'${value.replace(/'/g, "''")}'`
      }
      if (typeof value === 'boolean') {
        return value ? 'TRUE' : 'FALSE'
      }
      return value
    })

    sql += `INSERT INTO ${tableName} (${columns.join(', ')})\n`
    sql += `VALUES (${values.join(', ')});\n`
  })

  return sql
}

/**
 * Run SQL command
 */
async function runSQL(sql) {
  // Create temp file
  const tempFile = path.join(__dirname, '.temp-seed.sql')
  await fs.writeFile(tempFile, sql)

  try {
    // Run SQL
    execSync(`supabase db execute < "${tempFile}"`, { stdio: 'inherit' })
  } finally {
    // Clean up
    await fs.remove(tempFile)
  }
}

/**
 * Show help
 */
function showHelp() {
  console.log(chalk.blue.bold('Database Seeding Tool\n'))
  console.log(chalk.gray('Commands:\n'))
  console.log(chalk.cyan('  seed [table]') + chalk.gray('   Seed database (optionally specific table)'))
  console.log(chalk.cyan('  clear [table]') + chalk.gray('  Clear data (optionally specific table)'))
  console.log(chalk.cyan('  generate') + chalk.gray('       Export current data to seed files'))
  console.log(chalk.cyan('  list') + chalk.gray('           List available seed templates'))
  console.log(chalk.cyan('  help') + chalk.gray('           Show this help'))
  console.log(chalk.gray('\nExamples:\n'))
  console.log(chalk.gray('  npm run db:seed'))
  console.log(chalk.gray('  npm run db:seed users'))
  console.log(chalk.gray('  npm run db:seed clear'))
  console.log(chalk.gray('  npm run db:seed generate'))
  console.log()
}

// Run CLI
main()
