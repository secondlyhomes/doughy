#!/usr/bin/env node

/**
 * Disable push notifications feature
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
  print('\n🔔 Disabling Push Notifications...', 'yellow');

  try {
    // Step 1: Remove files
    print('\n🗑️  Removing files...', 'yellow');

    const filesToRemove = [
      path.join(ROOT_DIR, 'src/hooks/useNotifications.ts'),
      path.join(ROOT_DIR, 'src/services/notificationService.ts'),
    ];

    for (const file of filesToRemove) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        print(`   ✓ Removed ${path.relative(ROOT_DIR, file)}`, 'green');
      }
    }

    // Step 2: Uninstall dependencies
    print('\n📦 Uninstalling dependencies...', 'yellow');
    print('   Run manually if needed:', 'reset');
    print('   npm uninstall expo-notifications expo-server-sdk', 'reset');

    // Step 3: Instructions for app.json cleanup
    print('\n⚙️  Manual cleanup required:', 'yellow');
    print('\n1. Remove from app.json:', 'reset');
    print('   - expo.plugins array entry for "expo-notifications"', 'reset');
    print('   - expo.ios.infoPlist.UIBackgroundModes array', 'reset');
    print('   - expo.android.googleServicesFile', 'reset');
    print('   - expo.android.permissions (notification-related)', 'reset');
    print('\n2. Remove google-services.json from project root', 'reset');
    print('\n3. Remove notification assets if no longer needed:', 'reset');
    print('   - assets/notification-icon.png', 'reset');
    print('   - assets/notification-sound.wav', 'reset');

    // Success message
    print('\n✅ Push Notifications disabled!', 'green');
    print('\n📝 Note: Documentation still available at:', 'reset');
    print('   .blueprint/features/push-notifications/README.md\n', 'reset');

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
