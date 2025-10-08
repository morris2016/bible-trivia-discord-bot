#!/usr/bin/env node

/**
 * Script to trigger security events for testing the enhanced dashboard
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

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

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function triggerSecurityEvents() {
  console.log('🔥 Triggering security events to populate threat data...\n');

  const events = [
    // Rate limiting events
    { name: 'Rate Limit Exceeded', endpoint: '/api/articles', method: 'GET' },
    { name: 'Rate Limit Exceeded', endpoint: '/api/articles', method: 'GET' },
    { name: 'Rate Limit Exceeded', endpoint: '/api/articles', method: 'GET' },

    // CSRF attempts
    { name: 'CSRF Attempt', endpoint: '/api/admin/articles', method: 'POST', data: { title: 'test' } },
    { name: 'CSRF Attempt', endpoint: '/api/admin/resources', method: 'POST', data: { title: 'test' } },

    // Malicious input
    { name: 'SQL Injection Attempt', endpoint: '/api/articles', method: 'POST', data: { title: '<script>alert("xss")</script>', content: 'SELECT * FROM users' } },
    { name: 'XSS Attempt', endpoint: '/api/resources', method: 'POST', data: { title: '<img src=x onerror=alert(1)>', description: 'test' } },

    // File upload security
    { name: 'Malicious File Upload', endpoint: '/api/admin/resources/upload', method: 'POST', data: { title: 'malicious.exe' } }
  ];

  for (const event of events) {
    try {
      console.log(`📡 Triggering: ${event.name}`);
      const response = await makeRequest(`${BASE_URL}${event.endpoint}`, {
        method: event.method
      }, event.data);

      console.log(`   Status: ${response.status}`);
      if (response.status !== 200 && response.status !== 429) {
        console.log(`   ✅ Security event likely triggered`);
      } else {
        console.log(`   ⚠️  Request succeeded (might not trigger security event)`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n🎯 Security events triggered!');
  console.log('📊 Check the admin security dashboard at /admin/security');
  console.log('🔍 The threat detection tab should now show populated data.');
}

// Run the script
if (require.main === module) {
  triggerSecurityEvents().catch(console.error);
}