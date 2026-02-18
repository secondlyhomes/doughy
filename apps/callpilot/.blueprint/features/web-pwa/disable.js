#!/usr/bin/env node

/**
 * Disable web/PWA feature
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../..');

function print(message, color = 'reset') {
  const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
  };
  console.log(colors[color] + message + colors.reset);
}

async function disable() {
  print('\n🌐 Disabling Web/PWA Support...', 'yellow');

  try {
    // Step 1: Remove files
    print('\n🗑️  Removing files...', 'yellow');

    const filesToRemove = [
      path.join(ROOT_DIR, 'vercel.json'),
      path.join(ROOT_DIR, 'netlify.toml'),
      path.join(ROOT_DIR, 'public/manifest.json'),
      path.join(ROOT_DIR, 'src/hooks/useBreakpoint.ts'),
    ];

    for (const file of filesToRemove) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        print(`   ✓ Removed ${path.relative(ROOT_DIR, file)}`, 'green');
      }
    }

    // Step 2: Instructions for app.json cleanup
    print('\n⚙️  Manual cleanup required:', 'yellow');
    print('\n1. Remove from app.json:', 'reset');
    print('   - expo.web object', 'reset');
    print('   - expo.plugins (expo-router web config)', 'reset');
    print('\n2. Remove web-related files if no longer needed:', 'reset');
    print('   - public/ directory', 'reset');
    print('   - public/icon-*.png files', 'reset');
    print('   - public/service-worker.js (if exists)', 'reset');
    print('\n3. Remove dist/ directory (build output):', 'reset');
    print('   rm -rf dist/', 'reset');

    // Success message
    print('\n✅ Web/PWA Support disabled!', 'green');
    print('\n📝 Note: Documentation still available at:', 'reset');
    print('   .blueprint/features/web-pwa/README.md\n', 'reset');

    return { success: true };
  } catch (error) {
    print(`\n❌ Error: ${error.message}`, 'yellow');
    return { success: false, error: error.message };
  }
}

module.exports = { disable };

// Run if called directly
if (require.main === module) {
  disable().then((result) => {
    process.exit(result.success ? 0 : 1);
  });
}
