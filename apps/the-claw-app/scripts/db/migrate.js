#!/usr/bin/env node

/**
 * Database Migration Tool
 *
 * Manage Supabase database migrations
 *
 * Usage:
 *   npm run db:migrate              # Run pending migrations
 *   npm run db:migrate status       # Show migration status
 *   npm run db:migrate create name  # Create new migration
 *   npm run db:migrate rollback     # Rollback last migration
 *   npm run db:migrate reset        # Reset database (dev only)
 */

const fs = require('fs-extra')
const path = require('path')
const { execSync } = require('child_process')
const chalk = require('chalk')
const inquirer = require('inquirer')

// Directories
const PROJECT_ROOT = path.resolve(__dirname, '../..')
const MIGRATIONS_DIR = path.join(PROJECT_ROOT, 'supabase', 'migrations')
const SEED_DIR = path.join(PROJECT_ROOT, 'supabase', 'seed.sql')

/**
 * Main CLI
 */
async function main() {
  try {
    const args = process.argv.slice(2)
    const command = args[0] || 'migrate'

    console.log(chalk.blue.bold('\n🗄️  Database Migration Tool\n'))

    // Check Supabase CLI is installed
    checkSupabaseCLI()

    switch (command) {
      case 'migrate':
      case 'up':
        await runMigrations()
        break

      case 'status':
        await showStatus()
        break

      case 'create':
        await createMigration(args[1])
        break

      case 'rollback':
      case 'down':
        await rollback()
        break

      case 'reset':
        await reset()
        break

      case 'seed':
        await seed()
        break

      case 'list':
        await listMigrations()
        break

      case 'help':
        showHelp()
        break

      default:
        console.error(chalk.red(`❌ Unknown command: ${command}`))
        showHelp()
        process.exit(1)
    }
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message)
    process.exit(1)
  }
}

/**
 * Check if Supabase CLI is installed
 */
function checkSupabaseCLI() {
  try {
    execSync('supabase --version', { stdio: 'ignore' })
  } catch (error) {
    console.error(chalk.red('❌ Supabase CLI not found'))
    console.log(chalk.gray('\nInstall with:'))
    console.log(chalk.cyan('  npm install -g supabase'))
    console.log(chalk.gray('\nOr see: https://supabase.com/docs/guides/cli'))
    process.exit(1)
  }
}

/**
 * Run pending migrations
 */
async function runMigrations() {
  console.log(chalk.blue('Running migrations...\n'))

  try {
    // Check if local Supabase is running
    const isRunning = checkSupabaseRunning()
    if (!isRunning) {
      console.log(chalk.yellow('⚠️  Local Supabase not running'))
      const answer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'start',
          message: 'Start Supabase now?',
          default: true,
        },
      ])

      if (answer.start) {
        console.log(chalk.blue('Starting Supabase...'))
        execSync('supabase start', { stdio: 'inherit' })
      } else {
        console.log(chalk.gray('Cancelled'))
        return
      }
    }

    // Run migrations
    const output = execSync('supabase db reset', { encoding: 'utf-8' })
    console.log(output)

    console.log(chalk.green('✅ Migrations complete!'))

    // Prompt to generate types
    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'generateTypes',
        message: 'Generate TypeScript types?',
        default: true,
      },
    ])

    if (answer.generateTypes) {
      await generateTypes()
    }
  } catch (error) {
    throw new Error(`Migration failed: ${error.message}`)
  }
}

/**
 * Show migration status
 */
async function showStatus() {
  try {
    console.log(chalk.blue('Migration Status:\n'))

    // Get local migrations
    const localMigrations = await getLocalMigrations()
    console.log(chalk.cyan(`Local Migrations: ${localMigrations.length}`))

    if (localMigrations.length === 0) {
      console.log(chalk.gray('  No migrations found'))
      return
    }

    // List migrations
    console.log(chalk.blue('\nMigrations:'))
    localMigrations.forEach((migration, index) => {
      const number = String(index + 1).padStart(2, '0')
      console.log(chalk.gray(`  ${number}. ${migration.name}`))
      console.log(chalk.gray(`      ${migration.file}`))
    })

    // Check if Supabase is running
    const isRunning = checkSupabaseRunning()
    console.log(chalk.blue('\nSupabase Status:'))
    console.log(
      isRunning
        ? chalk.green('  ✓ Running')
        : chalk.yellow('  ✗ Not running (start with: supabase start)')
    )
  } catch (error) {
    throw new Error(`Status check failed: ${error.message}`)
  }
}

/**
 * Create new migration
 */
async function createMigration(name) {
  if (!name) {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Migration name:',
        validate: (input) => {
          if (!input) return 'Name is required'
          if (!/^[a-z0-9_]+$/.test(input)) {
            return 'Name must be lowercase letters, numbers, and underscores only'
          }
          return true
        },
      },
    ])
    name = answer.name
  }

  try {
    console.log(chalk.blue(`Creating migration: ${name}...\n`))

    // Ensure migrations directory exists
    await fs.ensureDir(MIGRATIONS_DIR)

    // Create migration file with timestamp
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0]
    const fileName = `${timestamp}_${name}.sql`
    const filePath = path.join(MIGRATIONS_DIR, fileName)

    // Migration template
    const template = getMigrationTemplate(name)

    // Write file
    await fs.writeFile(filePath, template)

    console.log(chalk.green('✅ Migration created:'))
    console.log(chalk.cyan(`   ${path.relative(PROJECT_ROOT, filePath)}`))

    console.log(chalk.blue('\n📋 Next Steps:\n'))
    console.log(chalk.gray('1. Edit migration file'))
    console.log(chalk.gray('2. Run: npm run db:migrate'))
    console.log(chalk.gray('3. Generate types: npm run gen:types'))
  } catch (error) {
    throw new Error(`Migration creation failed: ${error.message}`)
  }
}

/**
 * Rollback last migration
 */
async function rollback() {
  console.log(chalk.yellow('⚠️  Rollback Migration\n'))

  // Get local migrations
  const localMigrations = await getLocalMigrations()
  if (localMigrations.length === 0) {
    console.log(chalk.gray('No migrations to rollback'))
    return
  }

  const lastMigration = localMigrations[localMigrations.length - 1]

  console.log(chalk.gray(`Last migration: ${lastMigration.name}`))

  // Confirm
  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: chalk.yellow('This will rollback the last migration. Continue?'),
      default: false,
    },
  ])

  if (!answer.confirm) {
    console.log(chalk.gray('Cancelled'))
    return
  }

  try {
    console.log(chalk.blue('Rolling back...'))

    // Delete migration file
    await fs.remove(lastMigration.path)

    // Reset database
    execSync('supabase db reset', { stdio: 'inherit' })

    console.log(chalk.green(`✅ Rolled back: ${lastMigration.name}`))
  } catch (error) {
    throw new Error(`Rollback failed: ${error.message}`)
  }
}

/**
 * Reset database (dev only)
 */
async function reset() {
  console.log(chalk.red.bold('⚠️  RESET DATABASE\n'))
  console.log(chalk.yellow('This will delete ALL data and re-run migrations.\n'))

  // Confirm
  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: chalk.red('Are you absolutely sure?'),
      default: false,
    },
  ])

  if (!answer.confirm) {
    console.log(chalk.gray('Cancelled'))
    return
  }

  // Double confirm
  const answer2 = await inquirer.prompt([
    {
      type: 'input',
      name: 'confirm',
      message: chalk.red('Type "RESET" to confirm:'),
      validate: (input) => input === 'RESET' || 'Must type RESET to confirm',
    },
  ])

  if (answer2.confirm !== 'RESET') {
    console.log(chalk.gray('Cancelled'))
    return
  }

  try {
    console.log(chalk.blue('Resetting database...'))

    // Reset
    execSync('supabase db reset', { stdio: 'inherit' })

    console.log(chalk.green('\n✅ Database reset complete!'))

    // Prompt to seed
    const seedAnswer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'seed',
        message: 'Seed database with test data?',
        default: true,
      },
    ])

    if (seedAnswer.seed) {
      await seed()
    }
  } catch (error) {
    throw new Error(`Reset failed: ${error.message}`)
  }
}

/**
 * Seed database
 */
async function seed() {
  console.log(chalk.blue('Seeding database...\n'))

  try {
    if (await fs.pathExists(SEED_DIR)) {
      execSync('supabase db seed', { stdio: 'inherit' })
      console.log(chalk.green('✅ Database seeded!'))
    } else {
      console.log(chalk.yellow('⚠️  No seed file found'))
      console.log(chalk.gray(`Create: ${path.relative(PROJECT_ROOT, SEED_DIR)}`))
    }
  } catch (error) {
    throw new Error(`Seeding failed: ${error.message}`)
  }
}

/**
 * List all migrations
 */
async function listMigrations() {
  const migrations = await getLocalMigrations()

  if (migrations.length === 0) {
    console.log(chalk.gray('No migrations found'))
    return
  }

  console.log(chalk.blue(`Found ${migrations.length} migrations:\n`))

  migrations.forEach((migration, index) => {
    const number = String(index + 1).padStart(2, '0')
    console.log(chalk.cyan(`${number}. ${migration.name}`))
    console.log(chalk.gray(`    ${migration.timestamp}`))
    console.log(chalk.gray(`    ${path.relative(PROJECT_ROOT, migration.path)}`))
    console.log()
  })
}

/**
 * Generate TypeScript types
 */
async function generateTypes() {
  console.log(chalk.blue('Generating TypeScript types...\n'))

  try {
    execSync('npm run gen:types', { stdio: 'inherit' })
    console.log(chalk.green('✅ Types generated!'))
  } catch (error) {
    console.log(chalk.yellow('⚠️  Type generation failed'))
    console.log(chalk.gray('Run manually: npm run gen:types'))
  }
}

/**
 * Get local migrations
 */
async function getLocalMigrations() {
  if (!await fs.pathExists(MIGRATIONS_DIR)) {
    return []
  }

  const files = await fs.readdir(MIGRATIONS_DIR)
  const sqlFiles = files.filter((file) => file.endsWith('.sql'))

  return sqlFiles
    .sort()
    .map((file) => {
      const match = file.match(/^(\d+)_(.+)\.sql$/)
      return {
        file,
        timestamp: match ? match[1] : '',
        name: match ? match[2].replace(/_/g, ' ') : file,
        path: path.join(MIGRATIONS_DIR, file),
      }
    })
}

/**
 * Check if Supabase is running
 */
function checkSupabaseRunning() {
  try {
    execSync('supabase status', { stdio: 'ignore' })
    return true
  } catch (error) {
    return false
  }
}

/**
 * Get migration template
 */
function getMigrationTemplate(name) {
  const formattedName = name.replace(/_/g, ' ')

  return `-- Migration: ${formattedName}
-- Created: ${new Date().toISOString()}

-- This is a database migration file.
-- Write your schema changes below.

-- Example: Create a table
-- create table ${name} (
--   id uuid default uuid_generate_v4() primary key,
--   name text not null,
--   created_at timestamp with time zone default timezone('utc'::text, now()) not null,
--   updated_at timestamp with time zone default timezone('utc'::text, now()) not null
-- );

-- Example: Enable RLS
-- alter table ${name} enable row level security;

-- Example: Create policy
-- create policy "${formattedName} are viewable by owner"
--   on ${name} for select
--   using (auth.uid() = user_id);

-- Example: Create index
-- create index ${name}_user_id_idx on ${name}(user_id);

-- Example: Create function
-- create or replace function update_updated_at_column()
-- returns trigger as $$
-- begin
--   new.updated_at = now();
--   return new;
-- end;
-- $$ language plpgsql;

-- Example: Create trigger
-- create trigger update_${name}_updated_at
--   before update on ${name}
--   for each row
--   execute function update_updated_at_column();

-- Write your migration here
`
}

/**
 * Show help
 */
function showHelp() {
  console.log(chalk.blue.bold('Database Migration Tool\n'))
  console.log(chalk.gray('Commands:\n'))
  console.log(chalk.cyan('  migrate, up') + chalk.gray('     Run pending migrations'))
  console.log(chalk.cyan('  status') + chalk.gray('          Show migration status'))
  console.log(chalk.cyan('  create <name>') + chalk.gray('   Create new migration'))
  console.log(chalk.cyan('  rollback, down') + chalk.gray('  Rollback last migration'))
  console.log(chalk.cyan('  reset') + chalk.gray('           Reset database (dev only)'))
  console.log(chalk.cyan('  seed') + chalk.gray('            Seed database'))
  console.log(chalk.cyan('  list') + chalk.gray('            List all migrations'))
  console.log(chalk.cyan('  help') + chalk.gray('            Show this help'))
  console.log(chalk.gray('\nExamples:\n'))
  console.log(chalk.gray('  npm run db:migrate'))
  console.log(chalk.gray('  npm run db:migrate status'))
  console.log(chalk.gray('  npm run db:migrate create add_users_table'))
  console.log(chalk.gray('  npm run db:migrate rollback'))
  console.log()
}

// Run CLI
main()
