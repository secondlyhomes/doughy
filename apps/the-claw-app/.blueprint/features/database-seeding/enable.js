const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../..');
const FEATURE_DIR = __dirname;

/**
 * Enable database seeding feature
 */
async function enable() {
  console.log('📦 Setting up database seeding...');

  try {
    //Step 1: Create supabase/seeds directory
    console.log('  Creating supabase/seeds directory...');
    const seedsDir = path.join(ROOT_DIR, 'supabase/seeds');
    if (!fs.existsSync(seedsDir)) {
      fs.mkdirSync(seedsDir, { recursive: true });
    }

    // Step 2: Copy seed.sql
    console.log('  Creating seed.sql...');
    const seedSqlTemplate = fs.readFileSync(path.join(FEATURE_DIR, 'seed.sql.template'), 'utf8');
    fs.writeFileSync(path.join(ROOT_DIR, 'supabase/seed.sql'), seedSqlTemplate);

    // Step 3: Copy seed files
    console.log('  Creating seed files...');
    const seedFiles = [
      '01-users.sql.template',
      '02-profiles.sql.template',
      '03-example-data.sql.template',
      'seeds-README.md.template',
    ];

    seedFiles.forEach((file) => {
      const sourcePath = path.join(FEATURE_DIR, file);
      const targetName = file.replace('.template', '');
      const targetPath = path.join(seedsDir, targetName);

      if (fs.existsSync(sourcePath)) {
        const content = fs.readFileSync(sourcePath, 'utf8');
        fs.writeFileSync(targetPath, content);
      }
    });

    // Rename README
    if (fs.existsSync(path.join(seedsDir, 'seeds-README.md'))) {
      fs.renameSync(path.join(seedsDir, 'seeds-README.md'), path.join(seedsDir, 'README.md'));
    }

    // Step 4: Update supabase/config.toml
    console.log('  Updating supabase/config.toml...');
    const configPath = path.join(ROOT_DIR, 'supabase/config.toml');

    if (fs.existsSync(configPath)) {
      let config = fs.readFileSync(configPath, 'utf8');

      // Check if seed paths already exist
      if (!config.includes('seed_sql_paths')) {
        // Add seed paths to [db] section
        const dbSectionRegex = /\[db\]/;
        if (dbSectionRegex.test(config)) {
          config = config.replace(
            /(\[db\][\s\S]*?)(\n\n|\n\[)/,
            `$1
seed_sql_paths = [
  "seed.sql",
  "seeds/01-users.sql",
  "seeds/02-profiles.sql",
  "seeds/03-example-data.sql"
]
$2`
          );
        } else {
          // Add [db] section if it doesn't exist
          config += `\n\n[db]\nseed_sql_paths = [
  "seed.sql",
  "seeds/01-users.sql",
  "seeds/02-profiles.sql",
  "seeds/03-example-data.sql"
]\n`;
        }

        fs.writeFileSync(configPath, config);
      } else {
        console.log('  ℹ️  seed_sql_paths already exists in config.toml');
      }
    } else {
      console.log('  ⚠️  supabase/config.toml not found. Create it manually or run `npx supabase init`');
    }

    // Step 5: Update package.json with npm scripts
    console.log('  Adding database scripts to package.json...');
    const packageJsonPath = path.join(ROOT_DIR, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }

    packageJson.scripts['db:reset'] = 'supabase db reset';
    packageJson.scripts['db:seed'] = 'supabase db reset --db-only';
    packageJson.scripts['db:migrate'] = 'supabase migration up';
    packageJson.scripts['db:generate'] = 'supabase gen types typescript --local > src/types/database.ts';

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

    console.log('✅ Database seeding enabled successfully!');
    console.log('');
    console.log('📚 Next steps:');
    console.log('   1. Review seed files in supabase/seeds/');
    console.log('   2. Customize 02-profiles.sql and 03-example-data.sql for your schema');
    console.log('   3. Run `npm run db:reset` to apply seeds');
    console.log('');
    console.log('ℹ️  Test users:');
    console.log('   - test@example.com / Test1234!');
    console.log('   - test2@example.com / Test1234!');
    console.log('   - test3@example.com / Test1234!');

    return { success: true };
  } catch (error) {
    console.error('❌ Failed to enable database seeding:', error.message);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  enable().then((result) => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { enable };
