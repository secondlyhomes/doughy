#!/usr/bin/env node

/**
 * Prepare Production Configuration
 *
 * Generates production-specific configuration files
 */

const { applyProductionConfig } = require('./prepare-staging-config');
const fs = require('fs');
const path = require('path');

function main() {
  try {
    console.log('Preparing production configuration...');

    const templatePath = path.join(process.cwd(), 'templates', 'app.json');
    const appJsonPath = path.join(process.cwd(), 'app.json');

    const configPath = fs.existsSync(appJsonPath) ? appJsonPath : templatePath;

    if (!fs.existsSync(configPath)) {
      throw new Error('app.json template not found');
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const updatedConfig = applyProductionConfig(config);

    // Save
    const outputPath = path.join(process.cwd(), 'app.json');
    fs.writeFileSync(outputPath, JSON.stringify(updatedConfig, null, 2));

    console.log('✅ Production configuration prepared');
    process.exit(0);
  } catch (err) {
    console.error('❌ Configuration preparation failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
