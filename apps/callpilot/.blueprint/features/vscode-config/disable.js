const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../..');

/**
 * Disable VS Code configuration feature
 */
async function disable() {
  console.log('🗑️  Disabling VS Code configuration...');

  try {
    const vscodeDir = path.join(ROOT_DIR, '.vscode');

    // Step 1: Remove snippets file
    const snippetsPath = path.join(vscodeDir, 'mobile-blueprint.code-snippets');
    if (fs.existsSync(snippetsPath)) {
      console.log('  Removing code snippets...');
      fs.unlinkSync(snippetsPath);
    }

    // Step 2: Note about settings.json and extensions.json
    console.log('  ℹ️  Keeping settings.json and extensions.json');
    console.log('     (They may contain user customizations)');
    console.log('     Delete manually if needed:');
    console.log('       - .vscode/settings.json');
    console.log('       - .vscode/extensions.json');

    // Step 3: Remove .vscode directory if empty
    if (fs.existsSync(vscodeDir)) {
      const files = fs.readdirSync(vscodeDir);
      if (files.length === 0) {
        console.log('  Removing empty .vscode directory...');
        fs.rmdirSync(vscodeDir);
      }
    }

    console.log('✅ VS Code configuration disabled successfully!');
    console.log('');
    console.log('ℹ️  Code snippets have been removed.');
    console.log('   Editor settings and extension recommendations preserved.');

    return { success: true };
  } catch (error) {
    console.error('❌ Failed to disable VS Code configuration:', error.message);
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
