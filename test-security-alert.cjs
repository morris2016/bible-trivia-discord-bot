// Test script to trigger a security alert and verify it's logged in the dashboard
const http = require('http');

const testSecurityAlert = () => {
  const alertData = {
    type: 'warning',
    timestamp: new Date().toISOString(),
    message: 'Test security alert triggered from test script',
    details: {
      testType: 'manual_trigger',
      source: 'test-script',
      severity: 'medium'
    }
  };

  const options = {
    hostname: 'localhost',
    port: 5173,
    path: '/api/security/alert',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(JSON.stringify(alertData))
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);

    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      console.log(`Response: ${chunk}`);
    });

    res.on('end', () => {
      console.log('Security alert test completed. Check the admin dashboard at /admin/security to see if the alert appears.');
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  // Write data to request body
  req.write(JSON.stringify(alertData));
  req.end();
};

// Run the test
console.log('Triggering security alert test...');
testSecurityAlert();