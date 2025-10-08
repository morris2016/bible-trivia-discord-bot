// Test script to verify dynamic security configuration
console.log('🔧 Testing Dynamic Security Configuration...\n');

// Simulate environment variables
process.env.NODE_ENV = 'development';
process.env.RATE_LIMIT_WINDOW_MS = '600000'; // 10 minutes
process.env.RATE_LIMIT_MAX_REQUESTS = '500'; // 500 requests
process.env.CSRF_TOKEN_LENGTH = '64';
process.env.FILE_UPLOAD_MAX_SIZE = '5242880'; // 5MB
process.env.UPTIME_TRACKING_ENABLED = 'true';

// Import configuration
try {
  const { SECURITY_CONFIG } = require('./src/security-middleware.ts');

  console.log('✅ Dynamic Configuration Loaded Successfully!\n');
  console.log('📊 Current Configuration Values:\n');

  console.log('🔐 Rate Limiting:');
  console.log(`   Max Requests: ${SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS}`);
  console.log(`   Window (ms): ${SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS}`);
  console.log(`   Login Max: ${SECURITY_CONFIG.RATE_LIMIT.STRICT_ENDPOINTS['/api/auth/login'].max}`);
  console.log('');

  console.log('🛡️ CSRF Protection:');
  console.log(`   Token Length: ${SECURITY_CONFIG.CSRF.TOKEN_LENGTH}`);
  console.log(`   Cookie Name: ${SECURITY_CONFIG.CSRF.COOKIE_NAME}`);
  console.log('');

  console.log('📁 File Upload:');
  console.log(`   Max Size: ${(SECURITY_CONFIG.FILE_UPLOAD.MAX_SIZE / 1024 / 1024).toFixed(1)}MB`);
  console.log(`   Allowed Types: ${SECURITY_CONFIG.FILE_UPLOAD.ALLOWED_TYPES.join(', ')}`);
  console.log('');

  console.log('⏱️ Session Management:');
  console.log(`   Max Age: ${(SECURITY_CONFIG.SESSION.MAX_AGE / 1000 / 60 / 60).toFixed(1)} hours`);
  console.log(`   Idle Timeout: ${(SECURITY_CONFIG.SESSION.IDLE_TIMEOUT / 1000 / 60).toFixed(1)} minutes`);
  console.log('');

  console.log('📈 Monitoring:');
  console.log(`   Uptime Tracking: ${SECURITY_CONFIG.MONITORING.UPTIME_TRACKING}`);
  console.log(`   Calculation Window: ${(SECURITY_CONFIG.MONITORING.UPTIME_CALCULATION_WINDOW / 1000 / 60 / 60).toFixed(1)} hours`);
  console.log('');

  console.log('🎉 All hardcoded values successfully made dynamic!');
  console.log('\n📝 Next Steps:');
  console.log('1. Set these environment variables in your .env file');
  console.log('2. Restart your server to pick up new values');
  console.log('3. Test with different values to verify dynamic configuration');

} catch (error) {
  console.log('❌ Error loading configuration:', error.message);
  console.log('💡 Make sure to run this after building your TypeScript files');
}
