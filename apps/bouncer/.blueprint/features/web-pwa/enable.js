#!/usr/bin/env node

/**
 * Enable web/PWA feature
 */

const fs = require('fs');
const path = require('path');

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
  print('\n🌐 Enabling Web/PWA Support...', 'cyan');

  try {
    // Step 1: Copy template files
    print('\n📝 Copying template files...', 'yellow');

    const filesToCopy = [
      {
        src: path.join(FEATURE_DIR, 'vercel.json.template'),
        dest: path.join(ROOT_DIR, 'vercel.json'),
      },
      {
        src: path.join(FEATURE_DIR, 'netlify.toml.template'),
        dest: path.join(ROOT_DIR, 'netlify.toml'),
      },
      {
        src: path.join(FEATURE_DIR, 'manifest.json.template'),
        dest: path.join(ROOT_DIR, 'public/manifest.json'),
      },
      {
        src: path.join(FEATURE_DIR, 'useBreakpoint.ts.template'),
        dest: path.join(ROOT_DIR, 'src/hooks/useBreakpoint.ts'),
      },
    ];

    // Ensure directories exist
    const publicDir = path.join(ROOT_DIR, 'public');
    const hooksDir = path.join(ROOT_DIR, 'src/hooks');

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }

    for (const file of filesToCopy) {
      if (fs.existsSync(file.src)) {
        // Don't overwrite if exists
        if (fs.existsSync(file.dest)) {
          print(`   ⚠️  ${path.relative(ROOT_DIR, file.dest)} already exists (skipped)`, 'yellow');
        } else {
          fs.copyFileSync(file.src, file.dest);
          print(`   ✓ ${path.relative(ROOT_DIR, file.dest)}`, 'green');
        }
      }
    }

    // Step 2: Instructions for app.json
    print('\n⚙️  Configuration required:', 'cyan');
    print('\n1. Update app.json with web config:', 'bright');
    print('   (See .blueprint/features/web-pwa/app.json-additions.json)', 'reset');
    print('', 'reset');
    print('   "web": {', 'reset');
    print('     "bundler": "metro",', 'reset');
    print('     "output": "static",', 'reset');
    print('     "favicon": "./assets/favicon.png"', 'reset');
    print('   }', 'reset');

    // Step 3: PWA icon instructions
    print('\n📱 PWA Icon Setup (Required):', 'cyan');
    print('   Generate PWA icons from your app icon:', 'reset');
    print('', 'reset');
    print('   # Using ImageMagick (install: brew install imagemagick)', 'reset');
    print('   convert assets/icon.png -resize 192x192 public/icon-192.png', 'reset');
    print('   convert assets/icon.png -resize 512x512 public/icon-512.png', 'reset');
    print('   convert assets/icon.png -resize 48x48 public/favicon.png', 'reset');
    print('', 'reset');
    print('   Or use online tools:', 'reset');
    print('   - https://realfavicongenerator.net/', 'reset');
    print('   - https://www.pwabuilder.com/', 'reset');

    // Step 4: Testing instructions
    print('\n🧪 Test Web App:', 'cyan');
    print('   1. Run: npm run web', 'reset');
    print('   2. Open: http://localhost:19006', 'reset');
    print('   3. Test responsive design (DevTools)', 'reset');
    print('   4. Build production: npx expo export --platform web', 'reset');

    // Step 5: Deployment instructions
    print('\n🚀 Deploy Options:', 'cyan');
    print('\n   EAS Hosting (Recommended for Expo Router):', 'reset');
    print('   eas build --platform web', 'reset');
    print('   eas deploy', 'reset');
    print('', 'reset');
    print('   Vercel:', 'reset');
    print('   vercel', 'reset');
    print('', 'reset');
    print('   Netlify:', 'reset');
    print('   netlify deploy --prod', 'reset');

    // Step 6: Responsive design helper
    print('\n📐 Responsive Design:', 'cyan');
    print('   Use the useBreakpoint hook:', 'reset');
    print('', 'reset');
    print('   import { useBreakpoint } from \'@/hooks/useBreakpoint\';', 'reset');
    print('', 'reset');
    print('   const { isMobile, isTablet, isDesktop } = useBreakpoint();', 'reset');

    // Success message
    print('\n✅ Web/PWA Support enabled!', 'green');
    print('\n📖 Full Guide:', 'cyan');
    print('   .blueprint/features/web-pwa/README.md', 'reset');

    print('\n🚀 Next Steps:', 'cyan');
    print('   1. Update app.json with web configuration', 'reset');
    print('   2. Generate PWA icons (192px, 512px, favicon)', 'reset');
    print('   3. Update public/manifest.json with your app details', 'reset');
    print('   4. Run: npm run web (test locally)', 'reset');
    print('   5. Deploy to EAS Hosting, Vercel, or Netlify\n', 'reset');

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
