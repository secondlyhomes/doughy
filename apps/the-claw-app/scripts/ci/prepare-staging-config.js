#!/usr/bin/env node

/**
 * Prepare Staging Configuration
 *
 * Generates staging-specific configuration files:
 * - app.json with staging settings
 * - Environment-specific variables
 * - Staging bundle identifiers
 */

const fs = require('fs');
const path = require('path');

const ENVIRONMENT = process.env.ENVIRONMENT || 'staging';

function log(message) {
  console.log(`[Config] ${message}`);
}

function error(message) {
  console.error(`[Error] ${message}`);
}

/**
 * Load template app.json
 */
function loadTemplateConfig() {
  const templatePath = path.join(process.cwd(), 'templates', 'app.json');
  const appJsonPath = path.join(process.cwd(), 'app.json');

  const configPath = fs.existsSync(appJsonPath) ? appJsonPath : templatePath;

  if (!fs.existsSync(configPath)) {
    throw new Error('app.json template not found');
  }

  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

/**
 * Apply staging configuration
 */
function applyStagingConfig(config) {
  log('Applying staging configuration...');

  const expo = config.expo;

  // Update app name
  expo.name = `${expo.name} (Staging)`;
  expo.slug = `${expo.slug}-staging`;

  // Update bundle identifiers
  if (expo.ios) {
    expo.ios.bundleIdentifier = `${expo.ios.bundleIdentifier}.staging`;
  }

  if (expo.android) {
    expo.android.package = `${expo.android.package}.staging`;
  }

  // Update environment
  if (!expo.extra) {
    expo.extra = {};
  }

  expo.extra.environment = 'staging';
  expo.extra.supabaseUrl = process.env.SUPABASE_URL;
  expo.extra.supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  expo.extra.sentryDsn = process.env.SENTRY_DSN;

  // Update update channel
  expo.updates = expo.updates || {};
  expo.updates.url = expo.updates.url || `https://u.expo.dev/${expo.extra.eas?.projectId}`;

  // Update colors for visual distinction
  if (expo.splash) {
    expo.splash.backgroundColor = '#1a1a2e'; // Darker for staging
  }

  log('✅ Staging configuration applied');

  return config;
}

/**
 * Apply production configuration
 */
function applyProductionConfig(config) {
  log('Applying production configuration...');

  const expo = config.expo;

  // Update environment
  if (!expo.extra) {
    expo.extra = {};
  }

  expo.extra.environment = 'production';
  expo.extra.supabaseUrl = process.env.SUPABASE_URL;
  expo.extra.supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  expo.extra.sentryDsn = process.env.SENTRY_DSN;

  log('✅ Production configuration applied');

  return config;
}

/**
 * Save configuration
 */
function saveConfig(config) {
  const outputPath = path.join(process.cwd(), 'app.json');
  fs.writeFileSync(outputPath, JSON.stringify(config, null, 2));
  log(`✅ Configuration saved to ${outputPath}`);
}

/**
 * Main function
 */
function main() {
  try {
    log(`Preparing ${ENVIRONMENT} configuration...`);

    // Load template
    const config = loadTemplateConfig();

    // Apply environment-specific config
    let updatedConfig;
    if (ENVIRONMENT === 'staging') {
      updatedConfig = applyStagingConfig(config);
    } else if (ENVIRONMENT === 'production') {
      updatedConfig = applyProductionConfig(config);
    } else {
      updatedConfig = config;
    }

    // Save configuration
    saveConfig(updatedConfig);

    log(`✅ ${ENVIRONMENT} configuration prepared successfully`);
    process.exit(0);
  } catch (err) {
    error(`Configuration preparation failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  applyStagingConfig,
  applyProductionConfig,
};
