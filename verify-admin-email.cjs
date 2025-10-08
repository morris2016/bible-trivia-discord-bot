#!/usr/bin/env node

/**
 * Verify the test admin user's email for testing purposes
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:5173';

async function verifyAdminEmail() {
  console.log('🧪 Verifying test admin email...\n');

  try {
    // First, get the user ID by attempting to register again (this will fail but give us info)
    console.log('🔍 Finding test admin user...');

    // For testing purposes, let's try to login first to see if email verification is required
    const loginResponse = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'X-Test-Mode': 'true'
      }
    }, {
      email: 'admin@test.com',
      password: 'Admin123!'
    });

    console.log(`Login Status: ${loginResponse.status}`);

    if (loginResponse.status === 200) {
      console.log('✅ Admin user is already verified and can login!');
      console.log('📊 Testing security dashboard access...');

      // Test API dashboard access first
      console.log('🔍 Testing API dashboard access...');
      const apiDashboardResponse = await makeRequest(`${BASE_URL}/admin/api/security/dashboard`, {
        headers: {
          'Authorization': `Bearer ${loginResponse.body.token}`
        }
      });

      console.log(`API Dashboard Status: ${apiDashboardResponse.status}`);
      if (apiDashboardResponse.status === 200) {
        console.log('✅ Security dashboard API accessible!');
        console.log('📈 Dashboard data:', JSON.stringify(apiDashboardResponse.body, null, 2));
      } else {
        console.log('❌ API Dashboard access failed');
        console.log('Response:', apiDashboardResponse.body);
      }

      // Test web dashboard access (correct URL)
      console.log('\n🌐 Testing web dashboard access...');
      const dashboardResponse = await makeRequest(`${BASE_URL}/admin/security`, {
        headers: {
          'Authorization': `Bearer ${loginResponse.body.token}`,
          'Cookie': loginResponse.headers['set-cookie'] ? loginResponse.headers['set-cookie'].join('; ') : ''
        }
      });

      console.log(`Web Dashboard Status: ${dashboardResponse.status}`);
      if (dashboardResponse.status === 200) {
        console.log('✅ Security dashboard web interface accessible!');
        console.log('📄 Dashboard HTML length:', dashboardResponse.body ? dashboardResponse.body.length : 'N/A');
      } else if (dashboardResponse.status === 302) {
        console.log('🔄 Redirect detected - checking redirect location...');
        const redirectLocation = dashboardResponse.headers.location;
        console.log('Redirect to:', redirectLocation);
        if (redirectLocation && redirectLocation.includes('/login')) {
          console.log('⚠️  Redirected to login page - web interface uses session-based auth, not JWT');
          console.log('💡 To access web dashboard, login through browser at:', `${BASE_URL}/login`);
        } else {
          console.log('ℹ️  Redirected to:', redirectLocation);
        }
      } else {
        console.log('❌ Web dashboard access failed');
        console.log('Response:', dashboardResponse.body);
      }

    } else if (loginResponse.status === 403 && loginResponse.body && loginResponse.body.requiresVerification) {
      console.log('📧 Email verification required. User ID:', loginResponse.body.userId);

      // Try to verify the email using the user ID
      const verifyResponse = await makeRequest(`${BASE_URL}/api/auth/verify-email`, {
        method: 'POST'
      }, {
        userId: loginResponse.body.userId,
        otpCode: '123456' // Default OTP for testing
      });

      console.log(`Verification Status: ${verifyResponse.status}`);
      if (verifyResponse.status === 200) {
        console.log('✅ Email verified successfully!');
        console.log('🔄 Please try logging in again.');
      } else {
        console.log('❌ Email verification failed');
        console.log('Response:', verifyResponse.body);
      }

    } else {
      console.log('❌ Login failed for other reasons');
      console.log('Response:', loginResponse.body);
    }

  } catch (error) {
    console.error('❌ Error verifying admin email:', error.message);
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
        'User-Agent': 'EmailVerifier/1.0',
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
  verifyAdminEmail().catch(console.error);
}