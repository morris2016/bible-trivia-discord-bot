#!/usr/bin/env node

/**
 * Simple test to check if the security dashboard API is working
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:5173';

async function testDashboardAPI() {
  console.log('🧪 Testing Security Dashboard API...\n');

  try {
    // First, authenticate with the provided credentials
    console.log('🔐 Authenticating...');
    const loginResponse = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST'
    }, {
      email: 'siagmoo26@gmail.com',
      password: 'Famous2016?'
    });

    console.log(`Login Status: ${loginResponse.status}`);

    if (loginResponse.status !== 200) {
      console.log('❌ Authentication failed');
      console.log('Response:', loginResponse.body);
      return;
    }

    console.log('✅ Authentication successful!');

    // Extract auth token from response or cookies
    let authToken = null;
    if (loginResponse.body && loginResponse.body.token) {
      authToken = loginResponse.body.token;
    }

    // Test the dashboard data endpoint with authentication
    console.log('\n📊 Testing /api/admin/security/dashboard...');
    const dashboardResponse = await makeRequest(`${BASE_URL}/api/admin/security/dashboard`, {
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    });
    console.log(`Status: ${dashboardResponse.status}`);

    if (dashboardResponse.status === 200 && dashboardResponse.body) {
      const data = dashboardResponse.body;
      console.log('✅ Dashboard API working!');
      console.log('📈 Metrics:', JSON.stringify(data.metrics, null, 2));
      console.log('🛡️ Threats:', JSON.stringify(data.threats, null, 2));
      console.log('📋 Threat Metrics:', JSON.stringify(data.threatMetrics, null, 2));
    } else {
      console.log('❌ Dashboard API failed');
      console.log('Response:', dashboardResponse.body);
    }

    // Test the security events endpoint with authentication
    console.log('\n📋 Testing /api/admin/security/events...');
    const eventsResponse = await makeRequest(`${BASE_URL}/api/admin/security/events`, {
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    });
    console.log(`Status: ${eventsResponse.status}`);

    if (eventsResponse.status === 200 && eventsResponse.body) {
      const data = eventsResponse.body;
      console.log(`✅ Found ${data.events ? data.events.length : 0} security events`);
      if (data.events && data.events.length > 0) {
        console.log('Recent events:');
        data.events.slice(0, 3).forEach((event, i) => {
          console.log(`  ${i + 1}. ${event.event_type} (${event.level}): ${event.message}`);
        });
      }
    } else {
      console.log('❌ Events API failed');
      console.log('Response:', eventsResponse.body);
    }

  } catch (error) {
    console.error('❌ Error testing dashboard API:', error.message);
  }
}

async function makeRequest(url, options = {}) {
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
        'User-Agent': 'DashboardTest/1.0',
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

    req.end();
  });
}

// Run the test
if (require.main === module) {
  testDashboardAPI().catch(console.error);
}