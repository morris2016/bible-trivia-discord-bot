// Security Testing Script
const https = require('https');
const http = require('http');

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Security-Test/1.0',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testRateLimiting() {
  console.log('🧪 Testing Rate Limiting...');

  const loginUrl = 'http://localhost:5173/api/auth/login';
  const loginData = { email: 'test@example.com', password: 'wrongpassword' };

  // Make multiple login attempts to trigger rate limiting
  for (let i = 1; i <= 60; i++) {
    try {
      const response = await makeRequest(loginUrl, {
        method: 'POST',
        body: loginData
      });

      console.log(`Attempt ${i}: Status ${response.status}`);

      if (response.status === 429) {
        console.log('✅ Rate limiting triggered!');
        console.log('Response:', response.data);
        break;
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`Attempt ${i} failed:`, error.message);
    }
  }
}

async function testCSRFProtection() {
  console.log('\n🛡️ Testing CSRF Protection...');

  const registerUrl = 'http://localhost:5173/api/auth/register';
  const registerData = {
    email: 'csrf-test@example.com',
    name: 'CSRF Test',
    password: 'testpassword123'
  };

  try {
    // Try to register without CSRF token
    const response = await makeRequest(registerUrl, {
      method: 'POST',
      body: registerData
    });

    console.log('CSRF Test Status:', response.status);
    console.log('Response:', response.data);

    if (response.status === 403) {
      console.log('✅ CSRF protection working!');
    } else {
      console.log('❌ CSRF protection may not be working');
    }
  } catch (error) {
    console.error('CSRF test failed:', error.message);
  }
}

async function testInputValidation() {
  console.log('\n🔍 Testing Input Validation...');

  const registerUrl = 'http://localhost:5173/api/auth/register';

  // Test XSS attempt
  const xssData = {
    email: 'xss-test@example.com',
    name: '<script>alert("XSS")</script>',
    password: 'testpassword123'
  };

  // Test SQL injection attempt
  const sqlData = {
    email: 'sql-test@example.com',
    name: 'Test User',
    password: 'password\' OR \'1\'=\'1'
  };

  try {
    // Get CSRF token first
    const csrfResponse = await makeRequest('http://localhost:8787/api/csrf-token');
    const csrfToken = csrfResponse.data?.csrfToken;

    if (!csrfToken) {
      console.log('❌ Could not get CSRF token');
      return;
    }

    // Test XSS
    const xssResponse = await makeRequest(registerUrl, {
      method: 'POST',
      body: xssData,
      headers: { 'x-csrf-token': csrfToken }
    });

    console.log('XSS Test Status:', xssResponse.status);
    console.log('XSS Response:', xssResponse.data);

    // Test SQL injection
    const sqlResponse = await makeRequest(registerUrl, {
      method: 'POST',
      body: sqlData,
      headers: { 'x-csrf-token': csrfToken }
    });

    console.log('SQL Injection Test Status:', sqlResponse.status);
    console.log('SQL Response:', sqlResponse.data);

  } catch (error) {
    console.error('Input validation test failed:', error.message);
  }
}

async function testSecurityHeaders() {
  console.log('\n🔒 Testing Security Headers...');

  try {
    const response = await makeRequest('http://localhost:5173/api/health');

    console.log('Security Headers:');
    const securityHeaders = [
      'content-security-policy',
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security',
      'referrer-policy',
      'permissions-policy'
    ];

    securityHeaders.forEach(header => {
      const value = response.headers[header];
      if (value) {
        console.log(`✅ ${header}: ${value}`);
      } else {
        console.log(`❌ ${header}: Missing`);
      }
    });

  } catch (error) {
    console.error('Security headers test failed:', error.message);
  }
}

async function testSecurityDashboard() {
  console.log('\n📊 Testing Security Dashboard...');

  try {
    // Test dashboard endpoint (will likely fail without auth, but we can check the response)
    const dashboardResponse = await makeRequest('http://localhost:8787/api/admin/security/dashboard');
    console.log('Dashboard Status:', dashboardResponse.status);
    console.log('Dashboard Response:', dashboardResponse.data);

    // Test events endpoint
    const eventsResponse = await makeRequest('http://localhost:8787/api/admin/security/events');
    console.log('Events Status:', eventsResponse.status);
    console.log('Events Response:', eventsResponse.data);

  } catch (error) {
    console.error('Security dashboard test failed:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Security System Tests...\n');

  await testSecurityHeaders();
  await testCSRFProtection();
  await testInputValidation();
  await testRateLimiting();
  await testSecurityDashboard();

  console.log('\n✅ Security testing completed!');
}

// Run tests
runAllTests().catch(console.error);