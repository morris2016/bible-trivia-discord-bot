#!/usr/bin/env node

/**
 * Test script to trigger security events and check if they appear in the dashboard
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:5173';

async function testSecurityEvents() {
  console.log('🧪 Testing Security Events and Dashboard...\n');

  try {
    // First, trigger some security events by making malicious requests
    console.log('🚨 Triggering security events...');

    // Try XSS attack
    console.log('1. Testing XSS attack...');
    await makeRequest(`${BASE_URL}/api/articles`, {
      method: 'POST'
    }, {
      title: '<script>alert("XSS")</script>',
      content: 'Test content',
      excerpt: 'Test excerpt'
    });

    // Try SQL injection
    console.log('2. Testing SQL injection...');
    await makeRequest(`${BASE_URL}/api/articles`, {
      method: 'POST'
    }, {
      title: 'Test Article',
      content: "'; DROP TABLE users; --",
      excerpt: 'Test excerpt'
    });

    // Try rate limiting
    console.log('3. Testing rate limiting...');
    for (let i = 0; i < 15; i++) {
      await makeRequest(`${BASE_URL}/api/articles`);
    }

    // Try invalid login
    console.log('4. Testing invalid login...');
    await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST'
    }, {
      email: 'invalid@example.com',
      password: 'wrongpassword'
    });

    console.log('✅ Security events triggered!\n');

    // Wait a moment for events to be processed
    console.log('⏳ Waiting for events to be processed...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Now check the security dashboard data
    console.log('📊 Checking security dashboard data...');

    // Try to access dashboard without authentication (should fail but might show some data)
    const dashboardResponse = await makeRequest(`${BASE_URL}/api/admin/security/dashboard`);
    console.log(`Dashboard Status: ${dashboardResponse.status}`);

    if (dashboardResponse.status === 401) {
      console.log('❌ Dashboard requires authentication');
    } else {
      const data = dashboardResponse.body;
      console.log('📈 Dashboard Data:', JSON.stringify(data, null, 2));
    }

    // Check security events endpoint
    const eventsResponse = await makeRequest(`${BASE_URL}/api/admin/security/events`);
    console.log(`Events Status: ${eventsResponse.status}`);

    if (eventsResponse.status === 401) {
      console.log('❌ Events require authentication');
    } else {
      const data = eventsResponse.body;
      console.log(`📋 Found ${data.events ? data.events.length : 0} security events`);
      if (data.events && data.events.length > 0) {
        console.log('Recent events:');
        data.events.slice(0, 5).forEach((event, i) => {
          console.log(`  ${i + 1}. ${event.event_type} (${event.level}): ${event.message}`);
        });
      }
    }

    // Check threat data
    const threatsResponse = await makeRequest(`${BASE_URL}/api/admin/security/threats`);
    console.log(`Threats Status: ${threatsResponse.status}`);

    if (threatsResponse.status === 401) {
      console.log('❌ Threats require authentication');
    } else {
      const data = threatsResponse.body;
      console.log('🛡️ Threat Data:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error testing security events:', error.message);
  }
}

async function makeRequest(url, options = {}, body = null) {
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
        'User-Agent': 'SecurityTest/1.0',
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

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Run the test
if (require.main === module) {
  testSecurityEvents().catch(console.error);
}