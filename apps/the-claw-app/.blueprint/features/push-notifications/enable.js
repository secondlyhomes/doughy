#!/usr/bin/env node

/**
 * Enable push notifications feature
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '../../..');
const FEATURE_DIR = __dirname;

function print(message, color = 'reset') {
  const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bright: '\x1b[1m',
  };
  console.log(colors[color] + message + colors.reset);
}

async function enable() {
  print('\n🔔 Enabling Push Notifications...', 'cyan');

  try {
    // Step 1: Install dependencies
    print('\n📦 Installing dependencies...', 'yellow');
    print('   - expo-notifications (client)', 'reset');
    print('   - expo-server-sdk (server - optional)', 'reset');

    try {
      execSync('npm install expo-notifications', {
        cwd: ROOT_DIR,
        stdio: 'inherit',
      });

      // expo-server-sdk is optional (for server-side only)
      print('\n💡 Note: Install expo-server-sdk if sending from your own server:', 'yellow');
      print('   npm install expo-server-sdk', 'reset');
    } catch (error) {
      print('   ⚠️  npm install failed. Run manually: npm install expo-notifications', 'yellow');
    }

    // Step 2: Copy template files
    print('\n📝 Copying template files...', 'yellow');

    const filesToCopy = [
      {
        src: path.join(FEATURE_DIR, 'useNotifications.ts.template'),
        dest: path.join(ROOT_DIR, 'src/hooks/useNotifications.ts'),
      },
      {
        src: path.join(FEATURE_DIR, 'notificationService.ts.template'),
        dest: path.join(ROOT_DIR, 'src/services/notificationService.ts'),
      },
    ];

    // Ensure directories exist
    const hooksDir = path.join(ROOT_DIR, 'src/hooks');
    const servicesDir = path.join(ROOT_DIR, 'src/services');

    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }
    if (!fs.existsSync(servicesDir)) {
      fs.mkdirSync(servicesDir, { recursive: true });
    }

    for (const file of filesToCopy) {
      if (fs.existsSync(file.src)) {
        fs.copyFileSync(file.src, file.dest);
        print(`   ✓ ${path.relative(ROOT_DIR, file.dest)}`, 'green');
      }
    }

    // Step 3: Instructions for app.json
    print('\n⚙️  Configuration required:', 'cyan');
    print('\n1. Update app.json with push notification config:', 'bright');
    print('   (See .blueprint/features/push-notifications/app.json-additions.json)', 'reset');
    print('\n2. Add plugins section:', 'reset');
    print('   "plugins": [', 'reset');
    print('     ["expo-notifications", {', 'reset');
    print('       "icon": "./assets/notification-icon.png",', 'reset');
    print('       "color": "#ffffff"', 'reset');
    print('     }]', 'reset');
    print('   ]', 'reset');

    // Step 4: iOS APNS setup instructions
    print('\n📱 iOS APNS Setup (Required):', 'cyan');
    print('   1. Go to: https://developer.apple.com/account', 'reset');
    print('   2. Create App ID with Push Notifications enabled', 'reset');
    print('   3. Create APNs Key (.p8 file)', 'reset');
    print('   4. Configure EAS: eas credentials', 'reset');
    print('   5. Build development build: eas build --profile development --platform ios', 'reset');
    print('\n   ⚠️  Must use physical iPhone (simulator doesn\'t support push)', 'yellow');
    print('   ⚠️  Development build required (not Expo Go)', 'yellow');

    // Step 5: Android FCM setup instructions
    print('\n🤖 Android FCM Setup (Required):', 'cyan');
    print('   1. Go to: https://console.firebase.google.com/', 'reset');
    print('   2. Create Firebase project', 'reset');
    print('   3. Add Android app, download google-services.json', 'reset');
    print('   4. Place google-services.json in project root', 'reset');
    print('   5. Enable FCM V1 API (not V0!)', 'reset');
    print('   6. Update app.json: "googleServicesFile": "./google-services.json"', 'reset');
    print('   7. Build: eas build --profile development --platform android', 'reset');
    print('\n   ⚠️  Physical device recommended (emulator unreliable)', 'yellow');
    print('   ⚠️  FCM V1 API required (V0 deprecated)', 'yellow');

    // Step 6: Usage example
    print('\n📚 Usage Example:', 'cyan');
    print('   import { useNotifications } from \'@/hooks/useNotifications\';', 'reset');
    print('', 'reset');
    print('   const { expoPushToken, requestPermission } = useNotifications({', 'reset');
    print('     projectId: \'your-project-id\',', 'reset');
    print('     onNotificationTapped: (response) => {', 'reset');
    print('       navigation.navigate(response.notification.request.content.data.screen);', 'reset');
    print('     },', 'reset');
    print('   });', 'reset');
    print('', 'reset');
    print('   // Request permission', 'reset');
    print('   await requestPermission();', 'reset');
    print('', 'reset');
    print('   // Send token to your server', 'reset');
    print('   if (expoPushToken) {', 'reset');
    print('     await saveTokenToServer(expoPushToken);', 'reset');
    print('   }', 'reset');

    // Success message
    print('\n✅ Push Notifications enabled!', 'green');
    print('\n📖 Full Guide:', 'cyan');
    print('   .blueprint/features/push-notifications/README.md', 'reset');

    print('\n🚀 Next Steps:', 'cyan');
    print('   1. Set up iOS APNS credentials (Apple Developer account)', 'reset');
    print('   2. Set up Android FCM (Firebase project)', 'reset');
    print('   3. Update app.json with configurations', 'reset');
    print('   4. Build development builds (not Expo Go!)', 'reset');
    print('   5. Test on physical devices', 'reset');
    print('\n   Test notifications: https://expo.dev/notifications\n', 'reset');

    return { success: true };
  } catch (error) {
    print(`\n❌ Error: ${error.message}`, 'yellow');
    return { success: false, error: error.message };
  }
}

module.exports = { enable };

// Run if called directly
if (require.main === module) {
  enable().then((result) => {
    process.exit(result.success ? 0 : 1);
  });
}
