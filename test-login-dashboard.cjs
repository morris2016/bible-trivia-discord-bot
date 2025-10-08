const http = require('http');

const BASE_URL = 'http://localhost:5173';

async function makeRequest(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Mode': 'true',
        ...options.headers
      }
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null
          };
          resolve(response);
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

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testLoginAndDashboard() {
  try {
    console.log('🔐 Testing login with provided credentials...');

    // Login
    const loginResponse = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST'
    }, {
      email: 'siagmoo26@gmail.com',
      password: 'Famous2016?'
    });

    console.log('Login Status:', loginResponse.status);
    console.log('Login Response:', loginResponse.data);

    if (loginResponse.status !== 200) {
      console.log('❌ Login failed');
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful, got token');

    // Test dashboard access
    console.log('\n📊 Testing security dashboard access...');

    const dashboardResponse = await makeRequest(`${BASE_URL}/api/admin/security/dashboard`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Dashboard Status:', dashboardResponse.status);
    console.log('Dashboard Response:', dashboardResponse.data);

    if (dashboardResponse.status === 200) {
      console.log('✅ Dashboard access successful!');
    } else {
      console.log('❌ Dashboard access failed');
    }

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testLoginAndDashboard();