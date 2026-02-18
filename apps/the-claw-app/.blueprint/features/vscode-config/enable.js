const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../..');
const FEATURE_DIR = __dirname;

/**
 * Enable VS Code configuration feature
 */
async function enable() {
  console.log('📦 Setting up VS Code configuration...');

  try {
    // Step 1: Create .vscode directory
    const vscodeDir = path.join(ROOT_DIR, '.vscode');
    if (!fs.existsSync(vscodeDir)) {
      console.log('  Creating .vscode directory...');
      fs.mkdirSync(vscodeDir, { recursive: true });
    }

    // Step 2: Copy code snippets
    console.log('  Creating code snippets...');
    const snippetsTemplate = fs.readFileSync(
      path.join(FEATURE_DIR, 'mobile-blueprint.code-snippets.template'),
      'utf8'
    );
    fs.writeFileSync(path.join(vscodeDir, 'mobile-blueprint.code-snippets'), snippetsTemplate);

    // Step 3: Copy or merge settings.json
    console.log('  Setting up editor settings...');
    const settingsTemplate = JSON.parse(
      fs.readFileSync(path.join(FEATURE_DIR, 'settings.json.template'), 'utf8')
    );
    const settingsPath = path.join(vscodeDir, 'settings.json');

    if (fs.existsSync(settingsPath)) {
      // Merge with existing settings
      const existingSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      const mergedSettings = { ...existingSettings, ...settingsTemplate };
      fs.writeFileSync(settingsPath, JSON.stringify(mergedSettings, null, 2) + '\n');
      console.log('    ℹ️  Merged with existing settings.json');
    } else {
      // Create new settings file
      fs.writeFileSync(settingsPath, JSON.stringify(settingsTemplate, null, 2) + '\n');
    }

    // Step 4: Copy or merge extensions.json
    console.log('  Setting up extension recommendations...');
    const extensionsTemplate = JSON.parse(
      fs.readFileSync(path.join(FEATURE_DIR, 'extensions.json.template'), 'utf8')
    );
    const extensionsPath = path.join(vscodeDir, 'extensions.json');

    if (fs.existsSync(extensionsPath)) {
      // Merge with existing extensions
      const existingExtensions = JSON.parse(fs.readFileSync(extensionsPath, 'utf8'));
      const mergedExtensions = {
        recommendations: [
          ...new Set([
            ...(existingExtensions.recommendations || []),
            ...(extensionsTemplate.recommendations || []),
          ]),
        ],
      };
      fs.writeFileSync(extensionsPath, JSON.stringify(mergedExtensions, null, 2) + '\n');
      console.log('    ℹ️  Merged with existing extensions.json');
    } else {
      // Create new extensions file
      fs.writeFileSync(extensionsPath, JSON.stringify(extensionsTemplate, null, 2) + '\n');
    }

    console.log('✅ VS Code configuration enabled successfully!');
    console.log('');
    console.log('📚 What was created:');
    console.log('   - .vscode/mobile-blueprint.code-snippets');
    console.log('   - .vscode/settings.json');
    console.log('   - .vscode/extensions.json');
    console.log('');
    console.log('⚡ Code snippets available:');
    console.log('   - rnscreen     → React Native screen');
    console.log('   - rncomp       → React Native component');
    console.log('   - rnhook       → Custom React hook');
    console.log('   - rnsvc        → Service function');
    console.log('   - rnsupabase   → Supabase query');
    console.log('   - rntest       → Jest test case');
    console.log('   - rncontext    → React Context + Provider');
    console.log('');
    console.log('ℹ️  VS Code will prompt to install recommended extensions.');
    console.log('   Snippets are available immediately (no restart needed).');

    return { success: true };
  } catch (error) {
    console.error('❌ Failed to enable VS Code configuration:', error.message);
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
