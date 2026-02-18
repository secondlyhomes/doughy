const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '../../..');

/**
 * Disable pre-commit hooks feature
 */
async function disable() {
  console.log('🗑️  Disabling pre-commit hooks...');

  try {
    // Step 1: Remove hooks
    const huskyDir = path.join(ROOT_DIR, '.husky');
    if (fs.existsSync(huskyDir)) {
      console.log('  Removing .husky directory...');
      fs.rmSync(huskyDir, { recursive: true, force: true });
    }

    // Step 2: Remove commitlint config
    const commitlintConfig = path.join(ROOT_DIR, '.commitlintrc.js');
    if (fs.existsSync(commitlintConfig)) {
      console.log('  Removing commitlint config...');
      fs.unlinkSync(commitlintConfig);
    }

    // Step 3: Remove lint-staged from package.json
    console.log('  Removing lint-staged config from package.json...');
    const packageJsonPath = path.join(ROOT_DIR, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    delete packageJson['lint-staged'];

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

    // Step 4: Uninstall dependencies (optional - commented out to avoid breaking other features)
    // console.log('  Uninstalling dependencies...');
    // execSync('npm uninstall husky lint-staged @commitlint/cli @commitlint/config-conventional', {
    //   cwd: ROOT_DIR,
    //   stdio: 'inherit',
    // });

    console.log('✅ Pre-commit hooks disabled successfully!');
    console.log('');
    console.log('ℹ️  Dependencies (husky, lint-staged) are still installed.');
    console.log('   Run `npm uninstall husky lint-staged @commitlint/cli @commitlint/config-conventional` to remove them.');

    return { success: true };
  } catch (error) {
    console.error('❌ Failed to disable pre-commit hooks:', error.message);
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
