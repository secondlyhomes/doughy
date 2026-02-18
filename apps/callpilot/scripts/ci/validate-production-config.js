#!/usr/bin/env node

/**
 * Validate Production Configuration
 *
 * Ensures production configuration is ready for deployment
 */

const fs = require('fs');
const path = require('path');

function log(message) {
  console.log(`[Validate] ${message}`);
}

function error(message) {
  console.error(`[Error] ${message}`);
}

function main() {
  try {
    log('Validating production configuration...');

    // Check required environment variables
    const required = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
    ];

    const missing = required.filter((v) => !process.env[v]);

    if (missing.length > 0) {
      error(`Missing environment variables: ${missing.join(', ')}`);
      process.exit(1);
    }

    // Check app.json exists
    const appJsonPath = path.join(process.cwd(), 'app.json');
    const templatePath = path.join(process.cwd(), 'templates', 'app.json');

    if (!fs.existsSync(appJsonPath) && !fs.existsSync(templatePath)) {
      error('app.json not found');
      process.exit(1);
    }

    log('✅ Production configuration validated');
    process.exit(0);
  } catch (err) {
    error(`Validation failed: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
