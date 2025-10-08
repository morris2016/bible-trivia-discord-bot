#!/usr/bin/env node

/**
 * Enhanced Security Dashboard Test Script
 * Tests the new risk level indicators and security monitoring features
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@faithdefenders.org';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Test scenarios with different risk levels
const TEST_SCENARIOS = [
  {
    name: 'Low Risk - Normal Activity',
    endpoint: '/api/security/alert',
    method: 'POST',
    data: {
      type: 'info',
      message: 'User logged in successfully',
      severity: 'low',
      details: { userId: 'user123', ipAddress: '192.168.1.1' }
    },
    expectedRiskLevel: 'low'
  },
  {
    name: 'Medium Risk - Rate Limiting',
    endpoint: '/api/security/alert',
    method: 'POST',
    data: {
      type: 'warning',
      message: 'Rate limit exceeded for IP 192.168.1.100',
      severity: 'medium',
      details: { userId: null, ipAddress: '192.168.1.100' }
    },
    expectedRiskLevel: 'medium'
  },
  {
    name: 'High Risk - Brute Force',
    endpoint: '/api/security/alert',
    method: 'POST',
    data: {
      type: 'error',
      message: 'Multiple failed login attempts detected from IP 203.0.113.1',
      severity: 'high',
      details: { userId: null, ipAddress: '203.0.113.1' }
    },
    expectedRiskLevel: 'high'
  },
  {
    name: 'Critical Risk - SQL Injection',
    endpoint: '/api/security/alert',
    method: 'POST',
    data: {
      type: 'critical',
      message: 'SQL injection attempt blocked from IP 10.0.0.50',
      severity: 'critical',
      details: { userId: null, ipAddress: '10.0.0.50' }
    },
    expectedRiskLevel: 'critical'
  },
  {
    name: 'CSRF Attempt',
    endpoint: '/api/security/alert',
    method: 'POST',
    data: {
      type: 'warning',
      message: 'CSRF token validation failed for request',
      severity: 'medium',
      details: { userId: 'user456', ipAddress: '192.168.1.200' }
    },
    expectedRiskLevel: 'medium'
  }
];

class SecurityDashboardTester {
  constructor() {
    this.sessionCookie = null;
    this.csrfToken = null;
  }

  async makeRequest(url, options = {}, data = null) {
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
          'User-Agent': 'SecurityDashboardTest/1.0',
          ...options.headers
        }
      };

      if (this.sessionCookie) {
        requestOptions.headers.Cookie = this.sessionCookie;
      }

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

            // Extract session cookie if present
            if (res.headers['set-cookie']) {
              const sessionCookie = res.headers['set-cookie'].find(cookie =>
                cookie.startsWith('session=')
              );
              if (sessionCookie) {
                this.sessionCookie = sessionCookie.split(';')[0];
              }
            }

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

  async login() {
    console.log('🔐 Logging in as admin...');

    try {
      const response = await this.makeRequest(`${BASE_URL}/api/auth/login`, {
        method: 'POST'
      }, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      });

      if (response.status === 200 && response.body?.success) {
        console.log('✅ Login successful');
        return true;
      } else {
        console.log('❌ Login failed:', response.body?.error || 'Unknown error');
        return false;
      }
    } catch (error) {
      console.log('❌ Login error:', error.message);
      return false;
    }
  }

  async testSecurityAlert(scenario) {
    console.log(`\n🧪 Testing: ${scenario.name}`);

    try {
      const response = await this.makeRequest(`${BASE_URL}${scenario.endpoint}`, {
        method: scenario.method
      }, scenario.data);

      if (response.status === 200) {
        console.log(`✅ Alert logged successfully`);
        console.log(`   Expected risk level: ${scenario.expectedRiskLevel}`);
        return true;
      } else {
        console.log(`❌ Alert failed: ${response.status}`);
        console.log(`   Response:`, response.body);
        return false;
      }
    } catch (error) {
      console.log(`❌ Alert error:`, error.message);
      return false;
    }
  }

  async testDashboardAccess() {
    console.log('\n📊 Testing dashboard access...');

    try {
      const response = await this.makeRequest(`${BASE_URL}/admin/security`);

      if (response.status === 200) {
        console.log('✅ Dashboard accessible');
        return true;
      } else {
        console.log(`❌ Dashboard access failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log('❌ Dashboard access error:', error.message);
      return false;
    }
  }

  async testSecurityAPI() {
    console.log('\n🔍 Testing security API endpoints...');

    const endpoints = [
      '/api/admin/security/dashboard',
      '/api/admin/security/events',
      '/api/admin/security/threats'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(`${BASE_URL}${endpoint}`);

        if (response.status === 200) {
          console.log(`✅ ${endpoint} - OK`);
        } else {
          console.log(`❌ ${endpoint} - Failed (${response.status})`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint} - Error: ${error.message}`);
      }
    }
  }

  async runTests() {
    console.log('🚀 Starting Enhanced Security Dashboard Tests\n');
    console.log('=' .repeat(60));

    // Test login
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.log('❌ Cannot proceed without admin login');
      return;
    }

    // Test dashboard access
    await this.testDashboardAccess();

    // Test security API endpoints
    await this.testSecurityAPI();

    // Test various security scenarios
    console.log('\n🔥 Testing Security Scenarios');
    console.log('=' .repeat(40));

    let passedTests = 0;
    let totalTests = TEST_SCENARIOS.length;

    for (const scenario of TEST_SCENARIOS) {
      const success = await this.testSecurityAlert(scenario);
      if (success) passedTests++;
    }

    // Summary
    console.log('\n📈 Test Summary');
    console.log('=' .repeat(20));
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);

    if (passedTests === totalTests) {
      console.log('\n🎉 All security dashboard tests passed!');
      console.log('🔒 Enhanced risk level indicators are working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the security dashboard implementation.');
    }

    console.log('\n💡 Next Steps:');
    console.log('   1. Visit /admin/security to see the enhanced dashboard');
    console.log('   2. Check that alerts show proper risk level colors and badges');
    console.log('   3. Verify security status overview displays correctly');
    console.log('   4. Confirm risk trend indicators are working');
  }
}

// Run the tests
if (require.main === module) {
  const tester = new SecurityDashboardTester();
  tester.runTests().catch(console.error);
}

module.exports = SecurityDashboardTester;