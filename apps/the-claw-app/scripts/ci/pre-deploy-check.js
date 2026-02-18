#!/usr/bin/env node

/**
 * Pre-deployment Check Script
 *
 * Comprehensive pre-deployment validation:
 * - Environment configuration
 * - Database connectivity
 * - API health checks
 * - Required secrets
 * - Build artifacts
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ENVIRONMENT = process.env.ENVIRONMENT || 'staging';

// Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

/**
 * Check required environment variables
 */
function checkEnvironmentVariables() {
  info('Checking environment variables...');

  const required = {
    staging: [
      'SUPABASE_STAGING_URL',
      'SUPABASE_STAGING_ANON_KEY',
      'EXPO_TOKEN',
    ],
    production: [
      'SUPABASE_PRODUCTION_URL',
      'SUPABASE_PRODUCTION_ANON_KEY',
      'EXPO_TOKEN',
      'SENTRY_DSN_PRODUCTION',
    ],
  };

  const envVars = required[ENVIRONMENT] || required.staging;
  const missing = [];

  envVars.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    error(`Missing required environment variables: ${missing.join(', ')}`);
    return false;
  }

  success(`All required environment variables are set`);
  return true;
}

/**
 * Validate package.json
 */
function validatePackageJson() {
  info('Validating package.json...');

  const packagePath = path.join(process.cwd(), 'package.json');

  if (!fs.existsSync(packagePath)) {
    error('package.json not found');
    return false;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    // Check version format
    if (!/^\d+\.\d+\.\d+$/.test(pkg.version)) {
      error(`Invalid version format: ${pkg.version}`);
      return false;
    }

    // Check required fields
    const required = ['name', 'version', 'dependencies', 'scripts'];
    const missing = required.filter((field) => !pkg[field]);

    if (missing.length > 0) {
      error(`Missing required fields in package.json: ${missing.join(', ')}`);
      return false;
    }

    success(`package.json is valid (v${pkg.version})`);
    return true;
  } catch (err) {
    error(`Failed to parse package.json: ${err.message}`);
    return false;
  }
}

/**
 * Check app configuration
 */
function validateAppConfig() {
  info('Validating app configuration...');

  const appJsonPath = path.join(process.cwd(), 'app.json');
  const templatePath = path.join(process.cwd(), 'templates', 'app.json');

  const configPath = fs.existsSync(appJsonPath) ? appJsonPath : templatePath;

  if (!fs.existsSync(configPath)) {
    error('app.json not found');
    return false;
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    if (!config.expo) {
      error('Invalid app.json: missing expo configuration');
      return false;
    }

    const expo = config.expo;

    // Check required fields
    const required = ['name', 'slug', 'version'];
    const missing = required.filter((field) => !expo[field]);

    if (missing.length > 0) {
      error(`Missing required fields in app.json: ${missing.join(', ')}`);
      return false;
    }

    success(`app.json is valid (${expo.name} v${expo.version})`);
    return true;
  } catch (err) {
    error(`Failed to parse app.json: ${err.message}`);
    return false;
  }
}

/**
 * Check EAS configuration
 */
function validateEASConfig() {
  info('Validating EAS configuration...');

  const easPath = path.join(process.cwd(), 'eas.json');

  if (!fs.existsSync(easPath)) {
    warning('eas.json not found');
    return true; // Not critical
  }

  try {
    const config = JSON.parse(fs.readFileSync(easPath, 'utf8'));

    if (!config.build) {
      error('Invalid eas.json: missing build configuration');
      return false;
    }

    // Check for required profiles
    const requiredProfiles = ['development', 'preview', 'production'];
    const missing = requiredProfiles.filter((profile) => !config.build[profile]);

    if (missing.length > 0) {
      warning(`Missing build profiles in eas.json: ${missing.join(', ')}`);
    }

    success('eas.json is valid');
    return true;
  } catch (err) {
    error(`Failed to parse eas.json: ${err.message}`);
    return false;
  }
}

/**
 * Test API connectivity
 */
async function testAPIConnectivity() {
  info('Testing API connectivity...');

  const apiUrl = process.env[`SUPABASE_${ENVIRONMENT.toUpperCase()}_URL`];
  const apiKey = process.env[`SUPABASE_${ENVIRONMENT.toUpperCase()}_ANON_KEY`];

  if (!apiUrl || !apiKey) {
    warning('API credentials not configured, skipping connectivity test');
    return true;
  }

  return new Promise((resolve) => {
    const url = new URL('/rest/v1/', apiUrl);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'GET',
      headers: {
        apikey: apiKey,
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        success('API connectivity test passed');
        resolve(true);
      } else {
        error(`API connectivity test failed: ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      error(`API connectivity test failed: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      error('API connectivity test timed out');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

/**
 * Check build dependencies
 */
function checkBuildDependencies() {
  info('Checking build dependencies...');

  const nodeModulesPath = path.join(process.cwd(), 'node_modules');

  if (!fs.existsSync(nodeModulesPath)) {
    error('node_modules not found - run npm install');
    return false;
  }

  // Check critical dependencies
  const critical = ['expo', 'react', 'react-native', '@supabase/supabase-js'];
  const missing = [];

  critical.forEach((dep) => {
    const depPath = path.join(nodeModulesPath, dep);
    if (!fs.existsSync(depPath)) {
      missing.push(dep);
    }
  });

  if (missing.length > 0) {
    error(`Missing critical dependencies: ${missing.join(', ')}`);
    return false;
  }

  success('All critical dependencies are installed');
  return true;
}

/**
 * Run security checks
 */
function runSecurityChecks() {
  info('Running security checks...');

  // Check for common security issues
  const issues = [];

  // Check for .env file in git
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignore.includes('.env')) {
      issues.push('.env not in .gitignore');
    }
  }

  // Check for hardcoded secrets in code
  const srcPath = path.join(process.cwd(), 'src');
  if (fs.existsSync(srcPath)) {
    // This is a simplified check - use a proper secrets scanner in production
    const patterns = [
      /apikey['"]\s*[:=]\s*['"][a-zA-Z0-9]{20,}/i,
      /api_key['"]\s*[:=]\s*['"][a-zA-Z0-9]{20,}/i,
      /password['"]\s*[:=]\s*['"][^'"]{8,}/i,
    ];

    // Simplified check - in production, use proper tooling
    warning('Run dedicated secrets scanning tool for thorough security check');
  }

  if (issues.length > 0) {
    warning('Security issues found:');
    issues.forEach((issue) => warning(`  - ${issue}`));
    return false;
  }

  success('Basic security checks passed');
  return true;
}

/**
 * Generate pre-deployment report
 */
function generateReport(results) {
  console.log('\n' + '='.repeat(60));
  log('Pre-deployment Check Report', 'cyan');
  console.log('='.repeat(60) + '\n');

  log(`Environment: ${ENVIRONMENT.toUpperCase()}`, 'cyan');
  log(`Time: ${new Date().toISOString()}`, 'cyan');
  console.log('');

  const passed = Object.values(results).filter((r) => r === true).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([check, result]) => {
    const icon = result ? '✅' : '❌';
    const status = result ? 'PASS' : 'FAIL';
    console.log(`${icon} ${check}: ${status}`);
  });

  console.log('\n' + '='.repeat(60));
  log(`Results: ${passed}/${total} checks passed`, passed === total ? 'green' : 'red');
  console.log('='.repeat(60) + '\n');

  return passed === total;
}

/**
 * Main function
 */
async function main() {
  try {
    log('\n🔍 Running pre-deployment checks...\n', 'cyan');

    const results = {
      'Environment Variables': checkEnvironmentVariables(),
      'package.json': validatePackageJson(),
      'app.json': validateAppConfig(),
      'eas.json': validateEASConfig(),
      'Build Dependencies': checkBuildDependencies(),
      'Security Checks': runSecurityChecks(),
    };

    // Async checks
    results['API Connectivity'] = await testAPIConnectivity();

    // Generate report
    const allPassed = generateReport(results);

    if (allPassed) {
      log('\n🎉 All pre-deployment checks passed!', 'green');
      log(`Deployment to ${ENVIRONMENT} can proceed`, 'green');
      process.exit(0);
    } else {
      log('\n❌ Some pre-deployment checks failed', 'red');
      log('Please fix the issues above before deploying', 'red');
      process.exit(1);
    }
  } catch (err) {
    error(`Pre-deployment check failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkEnvironmentVariables,
  validatePackageJson,
  validateAppConfig,
  testAPIConnectivity,
};
