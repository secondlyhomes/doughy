#!/usr/bin/env node

/**
 * Interactive setup wizard for mobile-app-blueprint features
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT_DIR = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT_DIR, '.blueprint/config.json');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Feature definitions
const features = {
  essential: [
    {
      id: 'pre-commit-hooks',
      name: 'Pre-commit Hooks',
      description: 'Automatically lint & format code before commits',
      recommended: true,
    },
    {
      id: 'database-seeding',
      name: 'Database Seeding',
      description: 'Pre-configured seed data for local development',
      recommended: true,
    },
    {
      id: 'agents-md',
      name: 'AGENTS.md AI Context',
      description: 'Works with Claude, Cursor, Copilot, etc.',
      recommended: true,
    },
    {
      id: 'vscode-config',
      name: 'VS Code Snippets',
      description: 'Component templates with shortcuts',
      recommended: true,
    },
    {
      id: 'mobile-dev-setup',
      name: 'Mobile Development Setup',
      description: 'Guide for running on iOS/Android devices (Expo Go, simulators, EAS)',
      recommended: true,
    },
    {
      id: 'push-notifications',
      name: 'Push Notifications',
      description: 'Native push notifications for iOS (APNS) & Android (FCM V1)',
      recommended: true,
    },
  ],
  optional: [
    {
      id: 'component-docs',
      name: 'Component Documentation (Ladle)',
      description: 'Isolate and test components (FREE, 10x faster than Storybook)',
      whenToUse: 'Component library > 10 components',
      recommended: false,
    },
    {
      id: 'visual-regression',
      name: 'Visual Regression Testing (BackstopJS)',
      description: 'Catch UI bugs automatically (FREE)',
      whenToUse: 'UI bugs happening frequently',
      recommended: false,
    },
    {
      id: 'web-pwa',
      name: 'Web/PWA Support',
      description: 'Deploy as Progressive Web App',
      whenToUse: 'Targeting web users',
      recommended: false,
    },
  ],
};

function print(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function printHeader() {
  print('\n╔══════════════════════════════════════════════════════════════╗', 'cyan');
  print('║                                                              ║', 'cyan');
  print('║           Mobile App Blueprint - Feature Setup 🚀            ║', 'cyan');
  print('║                                                              ║', 'cyan');
  print('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  print('');
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    // Create config from template
    const templatePath = path.join(ROOT_DIR, '.blueprint/config.json.template');
    if (fs.existsSync(templatePath)) {
      const template = fs.readFileSync(templatePath, 'utf8');
      fs.writeFileSync(CONFIG_PATH, template);
    } else {
      // Create minimal config
      const config = {
        version: '1.0.0',
        features: {},
      };
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    }
  }

  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
}

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function enableFeature(featureId) {
  print(`\nEnabling ${featureId}...`, 'yellow');

  const enableScriptPath = path.join(ROOT_DIR, `.blueprint/features/${featureId}/enable.js`);

  if (!fs.existsSync(enableScriptPath)) {
    print(`  ⚠️  Feature ${featureId} is not yet implemented`, 'yellow');
    print(`     See .blueprint/features/${featureId}/README.md for manual setup`, 'yellow');
    return { success: false, manual: true };
  }

  try {
    const { enable } = require(enableScriptPath);
    const result = await enable();

    if (result.success) {
      // Update config
      const config = loadConfig();
      if (!config.features[featureId]) {
        config.features[featureId] = {};
      }
      config.features[featureId].enabled = true;
      config.features[featureId].enabledAt = new Date().toISOString();
      saveConfig(config);
    }

    return result;
  } catch (error) {
    print(`  ❌ Error enabling ${featureId}: ${error.message}`, 'yellow');
    return { success: false, error: error.message };
  }
}

async function promptFeatureSelection(featureList, category) {
  print(`\n${colors.bright}${category} Features:${colors.reset}`);
  print('');

  const selected = [];

  for (const feature of featureList) {
    const checkbox = feature.recommended ? '[✓]' : '[ ]';
    print(`${checkbox} ${colors.bright}${feature.name}${colors.reset}`, feature.recommended ? 'green' : 'reset');
    print(`    → ${feature.description}`, 'reset');
    if (feature.whenToUse) {
      print(`    When to use: ${feature.whenToUse}`, 'yellow');
    }
    print('');

    const answer = await ask(`  Enable ${feature.name}? (Y/n): `);
    const shouldEnable = answer.toLowerCase() !== 'n';

    if (shouldEnable) {
      selected.push(feature.id);
    }
  }

  return selected;
}

async function main() {
  try {
    printHeader();

    print("Let's set up your project. Select features to enable:\n", 'bright');

    // Load config
    const config = loadConfig();

    // Prompt for essential features
    const selectedEssential = await promptFeatureSelection(features.essential, 'Essential');

    // Ask if user wants to see optional features
    print('');
    const showOptional = await ask('Configure optional features now? (y/N): ');
    let selectedOptional = [];

    if (showOptional.toLowerCase() === 'y') {
      selectedOptional = await promptFeatureSelection(features.optional, 'Optional');
    }

    const allSelected = [...selectedEssential, ...selectedOptional];

    if (allSelected.length === 0) {
      print('\n📝 No features selected. You can enable them later with:', 'yellow');
      print('   node .blueprint/features/[feature-name]/enable.js', 'yellow');
      print('\nOr run this setup again: npm run setup\n', 'yellow');
      rl.close();
      return;
    }

    // Enable selected features
    print(`\n🚀 Enabling ${allSelected.length} feature(s)...\n`, 'bright');

    let successCount = 0;
    let manualCount = 0;

    for (const featureId of allSelected) {
      const result = await enableFeature(featureId);
      if (result.success) {
        successCount++;
      } else if (result.manual) {
        manualCount++;
      }
    }

    // Summary
    print('\n' + '='.repeat(60), 'cyan');
    print('✅ Setup Complete!', 'green');
    print('='.repeat(60) + '\n', 'cyan');

    print(`Features enabled: ${successCount}`, 'green');
    if (manualCount > 0) {
      print(`Features requiring manual setup: ${manualCount}`, 'yellow');
      print('  (See .blueprint/features/[feature-name]/README.md)\n', 'yellow');
    }

    print('\n📚 Next steps:', 'bright');
    print('   1. Review changes: git status', 'reset');
    print('   2. Test your setup: npm start', 'reset');
    print('   3. Manage features: npm run features\n', 'reset');

    rl.close();
  } catch (error) {
    print(`\n❌ Setup failed: ${error.message}`, 'yellow');
    rl.close();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { enableFeature, loadConfig, saveConfig };
