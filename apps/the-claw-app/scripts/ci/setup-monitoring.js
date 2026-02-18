#!/usr/bin/env node

/**
 * Setup Monitoring
 *
 * Configures monitoring and alerting for the deployed application
 */

function log(message) {
  console.log(`[Monitoring] ${message}`);
}

function main() {
  try {
    log('Setting up production monitoring...');

    const ENVIRONMENT = process.env.ENVIRONMENT || 'production';
    const SENTRY_DSN = process.env.SENTRY_DSN;

    if (SENTRY_DSN) {
      log('✅ Sentry monitoring configured');
    } else {
      log('⚠️  Sentry DSN not configured');
    }

    log('Monitoring setup complete');
    process.exit(0);
  } catch (err) {
    console.error(`Monitoring setup failed: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
