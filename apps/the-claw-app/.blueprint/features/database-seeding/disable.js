const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../..');

/**
 * Disable database seeding feature
 */
async function disable() {
  console.log('🗑️  Disabling database seeding...');

  try {
    // Step 1: Remove seed files
    const seedsDir = path.join(ROOT_DIR, 'supabase/seeds');
    if (fs.existsSync(seedsDir)) {
      console.log('  Removing supabase/seeds directory...');
      fs.rmSync(seedsDir, { recursive: true, force: true });
    }

    // Step 2: Remove seed.sql
    const seedSql = path.join(ROOT_DIR, 'supabase/seed.sql');
    if (fs.existsSync(seedSql)) {
      console.log('  Removing seed.sql...');
      fs.unlinkSync(seedSql);
    }

    // Step 3: Remove seed_sql_paths from config.toml
    console.log('  Updating supabase/config.toml...');
    const configPath = path.join(ROOT_DIR, 'supabase/config.toml');

    if (fs.existsSync(configPath)) {
      let config = fs.readFileSync(configPath, 'utf8');

      // Remove seed_sql_paths section
      config = config.replace(/seed_sql_paths\s*=\s*\[[\s\S]*?\]/g, '');

      // Clean up extra blank lines
      config = config.replace(/\n{3,}/g, '\n\n');

      fs.writeFileSync(configPath, config);
    }

    // Step 4: Remove database scripts from package.json
    console.log('  Removing database scripts from package.json...');
    const packageJsonPath = path.join(ROOT_DIR, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    if (packageJson.scripts) {
      delete packageJson.scripts['db:reset'];
      delete packageJson.scripts['db:seed'];
      delete packageJson.scripts['db:migrate'];
      delete packageJson.scripts['db:generate'];
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

    console.log('✅ Database seeding disabled successfully!');
    console.log('');
    console.log('ℹ️  Your database migrations are still intact.');
    console.log('   Only seed data configuration has been removed.');

    return { success: true };
  } catch (error) {
    console.error('❌ Failed to disable database seeding:', error.message);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  disable().then((result) => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { disable };
