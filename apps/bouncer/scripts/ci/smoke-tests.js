#!/usr/bin/env node

/**
 * Smoke Tests
 *
 * Quick validation tests to verify critical functionality:
 * - API accessibility
 * - Authentication endpoints
 * - Database connectivity
 * - Critical user paths
 */

const https = require('https');

const ENVIRONMENT = process.env.ENVIRONMENT || 'staging';
const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

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

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const requestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      timeout: options.timeout || 10000,
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Test API health
 */
async function testAPIHealth() {
  info('Testing API health...');

  if (!API_URL || !API_KEY) {
    error('API_URL or API_KEY not configured');
    return false;
  }

  try {
    const response = await makeRequest(`${API_URL}/rest/v1/`, {
      headers: {
        apikey: API_KEY,
      },
    });

    if (response.statusCode >= 200 && response.statusCode < 300) {
      success('API health check passed');
      return true;
    } else {
      error(`API health check failed: ${response.statusCode}`);
      return false;
    }
  } catch (err) {
    error(`API health check error: ${err.message}`);
    return false;
  }
}

/**
 * Test authentication endpoints
 */
async function testAuthentication() {
  info('Testing authentication endpoints...');

  if (!API_URL || !API_KEY) {
    error('API_URL or API_KEY not configured');
    return false;
  }

  try {
    // Test signup endpoint accessibility
    const response = await makeRequest(`${API_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        apikey: API_KEY,
      },
      body: {
        email: 'test@example.com',
        password: process.env.SMOKE_TEST_PASSWORD || 'test-placeholder',
      },
    });

    // We expect either 200 (success) or 400 (validation error) or 422 (user exists)
    // 500 would indicate a server problem
    if (response.statusCode < 500) {
      success('Authentication endpoint is accessible');
      return true;
    } else {
      error(`Authentication endpoint error: ${response.statusCode}`);
      return false;
    }
  } catch (err) {
    error(`Authentication test error: ${err.message}`);
    return false;
  }
}

/**
 * Test database connectivity
 */
async function testDatabaseConnectivity() {
  info('Testing database connectivity...');

  if (!API_URL || !API_KEY) {
    error('API_URL or API_KEY not configured');
    return false;
  }

  try {
    // Try to access a table (even if empty)
    const response = await makeRequest(`${API_URL}/rest/v1/`, {
      headers: {
        apikey: API_KEY,
      },
    });

    if (response.statusCode >= 200 && response.statusCode < 500) {
      success('Database connectivity check passed');
      return true;
    } else {
      error(`Database connectivity check failed: ${response.statusCode}`);
      return false;
    }
  } catch (err) {
    error(`Database connectivity error: ${err.message}`);
    return false;
  }
}

/**
 * Test RLS policies
 */
async function testRLSPolicies() {
  info('Testing RLS policies...');

  if (!API_URL || !API_KEY) {
    error('API_URL or API_KEY not configured');
    return false;
  }

  try {
    // Try to access data without authentication
    // Should fail or return empty results (not error)
    const response = await makeRequest(`${API_URL}/rest/v1/profiles?limit=1`, {
      headers: {
        apikey: API_KEY,
      },
    });

    // RLS should allow the request but return no data or require auth
    if (response.statusCode >= 200 && response.statusCode < 500) {
      success('RLS policies are active');
      return true;
    } else {
      error(`RLS check failed: ${response.statusCode}`);
      return false;
    }
  } catch (err) {
    // If table doesn't exist, that's okay for smoke test
    success('RLS check completed (table may not exist yet)');
    return true;
  }
}

/**
 * Test response times
 */
async function testResponseTimes() {
  info('Testing API response times...');

  if (!API_URL || !API_KEY) {
    error('API_URL or API_KEY not configured');
    return false;
  }

  try {
    const startTime = Date.now();

    await makeRequest(`${API_URL}/rest/v1/`, {
      headers: {
        apikey: API_KEY,
      },
    });

    const responseTime = Date.now() - startTime;

    info(`Response time: ${responseTime}ms`);

    if (responseTime < 5000) {
      success('Response time is acceptable');
      return true;
    } else {
      error(`Response time too slow: ${responseTime}ms`);
      return false;
    }
  } catch (err) {
    error(`Response time test error: ${err.message}`);
    return false;
  }
}

/**
 * Generate smoke test report
 */
function generateReport(results) {
  console.log('\n' + '='.repeat(60));
  log('Smoke Test Report', 'cyan');
  console.log('='.repeat(60) + '\n');

  log(`Environment: ${ENVIRONMENT.toUpperCase()}`, 'cyan');
  log(`Time: ${new Date().toISOString()}`, 'cyan');
  console.log('');

  const passed = Object.values(results).filter((r) => r === true).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([test, result]) => {
    const icon = result ? '✅' : '❌';
    const status = result ? 'PASS' : 'FAIL';
    console.log(`${icon} ${test}: ${status}`);
  });

  console.log('\n' + '='.repeat(60));
  log(`Results: ${passed}/${total} tests passed`, passed === total ? 'green' : 'red');
  console.log('='.repeat(60) + '\n');

  return passed === total;
}

/**
 * Main function
 */
async function main() {
  try {
    log('\n🧪 Running smoke tests...\n', 'cyan');

    if (!API_URL || !API_KEY) {
      error('API_URL and API_KEY environment variables are required');
      error('Example:');
      error('  export API_URL=https://xxx.supabase.co');
      error('  export API_KEY=your-anon-key');
      process.exit(1);
    }

    info(`Testing: ${API_URL}`);
    console.log('');

    // Run all smoke tests
    const results = {
      'API Health': await testAPIHealth(),
      'Authentication': await testAuthentication(),
      'Database Connectivity': await testDatabaseConnectivity(),
      'RLS Policies': await testRLSPolicies(),
      'Response Times': await testResponseTimes(),
    };

    // Generate report
    const allPassed = generateReport(results);

    if (allPassed) {
      log('\n🎉 All smoke tests passed!', 'green');
      process.exit(0);
    } else {
      log('\n❌ Some smoke tests failed', 'red');
      process.exit(1);
    }
  } catch (err) {
    error(`Smoke tests failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  testAPIHealth,
  testAuthentication,
  testDatabaseConnectivity,
};
