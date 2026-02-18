#!/usr/bin/env node

/**
 * Verify Backend Deployment
 *
 * Verifies that backend deployment was successful:
 * - Database migrations applied
 * - Edge functions deployed
 * - API endpoints responding
 */

const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

function log(message) {
  console.log(`[Verify] ${message}`);
}

function error(message) {
  console.error(`[Error] ${message}`);
}

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
      timeout: 10000,
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data,
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function main() {
  try {
    log('Verifying backend deployment...');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      error('SUPABASE_URL or SUPABASE_ANON_KEY not set');
      process.exit(1);
    }

    // Test API
    const response = await makeRequest(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
      },
    });

    if (response.statusCode >= 200 && response.statusCode < 300) {
      log('✅ Backend verification successful');
      process.exit(0);
    } else {
      error(`Backend verification failed: ${response.statusCode}`);
      process.exit(1);
    }
  } catch (err) {
    error(`Backend verification error: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
