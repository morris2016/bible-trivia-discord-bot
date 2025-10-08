#!/usr/bin/env node

/**
 * Create a test admin user for testing the security dashboard
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:5173';

async function createTestAdmin() {
  console.log('🧪 Creating test admin user...\n');

  try {
    // Register a new admin user
    console.log('📝 Registering test admin user...');
    const registerResponse = await makeRequest(`${BASE_URL}/api/auth/register`, {
      method: 'POST'
    }, {
      email: 'admin@test.com',
      name: 'Test Admin',
      password: 'Admin123!'
    });

    console.log(`Registration Status: ${registerResponse.status}`);

    if (registerResponse.status === 200 && registerResponse.body && registerResponse.body.success) {
      console.log('✅ Admin user registered successfully!');
      console.log('📧 Please check your email to verify the account, then use these credentials:');
      console.log('   Email: admin@test.com');
      console.log('   Password: Admin123!');
      console.log('\n🔄 After verification, you can access the security dashboard at:');
      console.log('   http://localhost:5173/security-dashboard');
    } else {
      console.log('❌ Registration failed');
      console.log('Response:', registerResponse.body);
    }

  } catch (error) {
    console.error('❌ Error creating test admin:', error.message);
  }
}

async function makeRequest(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AdminCreator/1.0',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Run the script
if (require.main === module) {
  createTestAdmin().catch(console.error);
}