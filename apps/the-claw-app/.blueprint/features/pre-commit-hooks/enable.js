const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '../../..');
const FEATURE_DIR = __dirname;

/**
 * Enable pre-commit hooks feature
 */
async function enable() {
  console.log('📦 Installing pre-commit hooks...');

  try {
    // Step 1: Install dependencies
    console.log('  Installing husky and lint-staged...');
    execSync('npm install --save-dev husky lint-staged @commitlint/cli @commitlint/config-conventional', {
      cwd: ROOT_DIR,
      stdio: 'inherit',
    });

    // Step 2: Initialize husky
    console.log('  Initializing husky...');
    execSync('npx husky init', { cwd: ROOT_DIR, stdio: 'inherit' });

    // Step 3: Copy pre-commit hook
    console.log('  Setting up pre-commit hook...');
    const preCommitTemplate = fs.readFileSync(path.join(FEATURE_DIR, 'pre-commit.template'), 'utf8');
    fs.writeFileSync(path.join(ROOT_DIR, '.husky/pre-commit'), preCommitTemplate);
    fs.chmodSync(path.join(ROOT_DIR, '.husky/pre-commit'), '755');

    // Step 4: Copy commit-msg hook
    console.log('  Setting up commit-msg hook...');
    const commitMsgTemplate = fs.readFileSync(path.join(FEATURE_DIR, 'commit-msg.template'), 'utf8');
    fs.writeFileSync(path.join(ROOT_DIR, '.husky/commit-msg'), commitMsgTemplate);
    fs.chmodSync(path.join(ROOT_DIR, '.husky/commit-msg'), '755');

    // Step 5: Copy commitlint config
    console.log('  Setting up commitlint config...');
    const commitlintConfig = fs.readFileSync(path.join(FEATURE_DIR, 'commitlintrc.template.js'), 'utf8');
    fs.writeFileSync(path.join(ROOT_DIR, '.commitlintrc.js'), commitlintConfig);

    // Step 6: Update package.json with lint-staged config
    console.log('  Updating package.json with lint-staged config...');
    const packageJsonPath = path.join(ROOT_DIR, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Add lint-staged config
    packageJson['lint-staged'] = {
      '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
      '*.{json,md,yml,yaml}': ['prettier --write'],
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

    // Step 7: Test hooks
    console.log('  Testing hooks...');
    execSync('npx husky', { cwd: ROOT_DIR, stdio: 'inherit' });

    console.log('✅ Pre-commit hooks enabled successfully!');
    console.log('');
    console.log('ℹ️  Hooks will run automatically on git commit.');
    console.log('   To bypass hooks (emergency only): git commit --no-verify');

    return { success: true };
  } catch (error) {
    console.error('❌ Failed to enable pre-commit hooks:', error.message);
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
