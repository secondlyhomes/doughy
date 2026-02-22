#!/usr/bin/env node

/**
 * Feature manager CLI for mobile-app-blueprint
 * Manage features after initial setup
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
  dim: '\x1b[2m',
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function print(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    print('⚠️  No configuration found. Run `npm run setup` first.', 'yellow');
    process.exit(1);
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

function printFeatureStatus() {
  const config = loadConfig();

  print('\n╔══════════════════════════════════════════════════════════════╗', 'cyan');
  print('║                    Feature Management                        ║', 'cyan');
  print('╚══════════════════════════════════════════════════════════════╝\n', 'cyan');

  print(`${colors.bright}Currently Enabled:${colors.reset}\n`, 'green');

  const enabled = Object.entries(config.features || {}).filter(([_, data]) => data.enabled);

  if (enabled.length === 0) {
    print('  No features enabled yet.\n', 'dim');
  } else {
    enabled.forEach(([featureId, data]) => {
      const enabledDate = data.enabledAt
        ? new Date(data.enabledAt).toLocaleDateString()
        : 'Unknown';
      print(`  ✓ ${featureId} ${colors.dim}(enabled ${enabledDate})${colors.reset}`, 'green');
    });
    print('');
  }

  print(`${colors.bright}Available to Enable:${colors.reset}\n`, 'yellow');

  const disabled = Object.entries(config.features || {}).filter(([_, data]) => !data.enabled);

  if (disabled.length === 0) {
    print('  All features are enabled!\n', 'dim');
  } else {
    disabled.forEach(([featureId]) => {
      print(`  → ${featureId}`, 'yellow');
    });
    print('');
  }
}

async function enableFeature(featureId) {
  print(`\nEnabling ${featureId}...`, 'yellow');

  const enableScriptPath = path.join(ROOT_DIR, `.blueprint/features/${featureId}/enable.js`);

  if (!fs.existsSync(enableScriptPath)) {
    print(`  ⚠️  Feature ${featureId} is not yet implemented`, 'yellow');
    print(`     See .blueprint/features/${featureId}/README.md for manual setup\n`, 'yellow');
    return { success: false, manual: true };
  }

  try {
    const { enable } = require(enableScriptPath);
    const result = await enable();

    if (result.success) {
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
    print(`  ❌ Error enabling ${featureId}: ${error.message}\n`, 'yellow');
    return { success: false, error: error.message };
  }
}

async function disableFeature(featureId) {
  print(`\nDisabling ${featureId}...`, 'yellow');

  const disableScriptPath = path.join(ROOT_DIR, `.blueprint/features/${featureId}/disable.js`);

  if (!fs.existsSync(disableScriptPath)) {
    print(`  ⚠️  Disable script not found for ${featureId}\n`, 'yellow');
    return { success: false };
  }

  try {
    const { disable } = require(disableScriptPath);
    const result = await disable();

    if (result.success) {
      const config = loadConfig();
      if (config.features[featureId]) {
        config.features[featureId].enabled = false;
        config.features[featureId].disabledAt = new Date().toISOString();
      }
      saveConfig(config);
    }

    return result;
  } catch (error) {
    print(`  ❌ Error disabling ${featureId}: ${error.message}\n`, 'yellow');
    return { success: false, error: error.message };
  }
}

async function interactiveMode() {
  printFeatureStatus();

  print(`${colors.bright}Commands:${colors.reset}\n`);
  print('  1-7    → Toggle feature by number');
  print('  list   → Show feature status');
  print('  enable [name]   → Enable specific feature');
  print('  disable [name]  → Disable specific feature');
  print('  exit   → Exit\n');

  const command = await ask('Enter command: ');

  if (command === 'exit' || command === 'quit') {
    print('\nGoodbye! 👋\n');
    rl.close();
    return;
  }

  if (command === 'list') {
    await interactiveMode();
    return;
  }

  if (command.startsWith('enable ')) {
    const featureId = command.substring(7).trim();
    await enableFeature(featureId);
    await interactiveMode();
    return;
  }

  if (command.startsWith('disable ')) {
    const featureId = command.substring(8).trim();
    await disableFeature(featureId);
    await interactiveMode();
    return;
  }

  print('\n⚠️  Unknown command. Try "list", "enable [name]", "disable [name]", or "exit"\n', 'yellow');
  await interactiveMode();
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Interactive mode
    await interactiveMode();
  } else if (args[0] === 'list') {
    // List features
    printFeatureStatus();
    print('\nUse `npm run features` for interactive mode.\n');
    rl.close();
  } else if (args[0] === 'enable' && args[1]) {
    // Enable specific feature
    await enableFeature(args[1]);
    rl.close();
  } else if (args[0] === 'disable' && args[1]) {
    // Disable specific feature
    await disableFeature(args[1]);
    rl.close();
  } else {
    print('\nUsage:', 'bright');
    print('  npm run features              # Interactive mode');
    print('  npm run features list         # List feature status');
    print('  npm run features enable <name>   # Enable feature');
    print('  npm run features disable <name>  # Disable feature\n');
    rl.close();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    print(`\n❌ Error: ${error.message}\n`, 'yellow');
    rl.close();
    process.exit(1);
  });
}

module.exports = { enableFeature, disableFeature, loadConfig };
