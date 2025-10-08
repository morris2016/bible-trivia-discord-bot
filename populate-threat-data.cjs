#!/usr/bin/env node

/**
 * Script to populate threat data for testing the enhanced security dashboard
 */

const { getDB } = require('./src/database-neon');

async function populateThreatData() {
  console.log('🔥 Populating threat data for testing...\n');

  try {
    const sql = getDB();

    // Initialize security tables if they don't exist
    console.log('📋 Initializing security tables...');
    await sql`
      CREATE TABLE IF NOT EXISTS security_events (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        level VARCHAR(20) DEFAULT 'info' CHECK (level IN ('info', 'warning', 'error', 'critical')),
        message TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id),
        user_name VARCHAR(255),
        ip_address VARCHAR(45),
        user_agent TEXT,
        url TEXT,
        method VARCHAR(10),
        request_data JSONB,
        headers JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved BOOLEAN DEFAULT false,
        resolved_at TIMESTAMP,
        resolved_by INTEGER REFERENCES users(id),
        notes TEXT
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS threat_attacks (
        id SERIAL PRIMARY KEY,
        attack_type VARCHAR(50) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        user_agent TEXT,
        url TEXT,
        method VARCHAR(10),
        payload TEXT,
        blocked BOOLEAN DEFAULT true,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER REFERENCES users(id),
        country VARCHAR(2),
        risk_score INTEGER DEFAULT 0,
        metadata JSONB
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS rate_limit_events (
        id SERIAL PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        user_id INTEGER REFERENCES users(id),
        route VARCHAR(255) NOT NULL,
        method VARCHAR(10),
        request_count INTEGER DEFAULT 1,
        window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        window_end TIMESTAMP,
        blocked BOOLEAN DEFAULT false,
        metadata JSONB
      );
    `;

    console.log('✅ Security tables ready');

    // Insert sample threat data
    console.log('📊 Inserting sample threat data...');

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    // Insert threat attacks
    await sql`
      INSERT INTO threat_attacks (attack_type, ip_address, user_agent, url, method, payload, blocked, timestamp, risk_score, metadata)
      VALUES
        ('brute_force', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '/api/auth/login', 'POST', '{"email":"admin@test.com","password":"wrong"}', true, ${oneHourAgo}, 7, '{"attempts": 5}'),
        ('brute_force', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '/api/auth/login', 'POST', '{"email":"admin@test.com","password":"wrong2"}', true, ${oneHourAgo}, 7, '{"attempts": 5}'),
        ('brute_force', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '/api/auth/login', 'POST', '{"email":"admin@test.com","password":"wrong3"}', true, ${oneHourAgo}, 7, '{"attempts": 5}'),
        ('sql_injection', '10.0.0.50', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', '/api/articles', 'POST', '{"title":"Test","content":"'' UNION SELECT * FROM users--"}', true, ${twoHoursAgo}, 9, '{"pattern": "union_select"}'),
        ('csrf', '192.168.1.200', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', '/api/admin/articles', 'POST', '{"title":"CSRF Test"}', true, ${oneHourAgo}, 6, '{"missing_token": true}'),
        ('csrf', '192.168.1.200', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', '/api/admin/resources', 'POST', '{"title":"CSRF Test 2"}', true, ${oneHourAgo}, 6, '{"missing_token": true}'),
        ('xss', '203.0.113.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15', '/api/articles', 'POST', '{"title":"<script>alert(\\"xss\\")</script>","content":"test"}', true, ${twoHoursAgo}, 6, '{"pattern": "script_tag"}'),
        ('suspicious_ip', '203.0.113.195', 'Mozilla/5.0 (compatible; Bot/1.0)', '/api/articles', 'GET', null, true, ${oneHourAgo}, 5, '{"bot_detected": true}')
    `;

    // Insert rate limit events
    await sql`
      INSERT INTO rate_limit_events (ip_address, route, method, request_count, window_start, window_end, blocked, metadata)
      VALUES
        ('192.168.1.100', '/api/articles', 'GET', 150, ${oneHourAgo}, ${new Date(oneHourAgo.getTime() + 15 * 60 * 1000)}, true, '{"user_agent": "Mozilla/5.0"}'),
        ('192.168.1.100', '/api/resources', 'GET', 120, ${oneHourAgo}, ${new Date(oneHourAgo.getTime() + 15 * 60 * 1000)}, true, '{"user_agent": "Mozilla/5.0"}'),
        ('10.0.0.50', '/api/auth/login', 'POST', 25, ${twoHoursAgo}, ${new Date(twoHoursAgo.getTime() + 15 * 60 * 1000)}, true, '{"user_agent": "PostmanRuntime"}')
    `;

    // Insert security events
    await sql`
      INSERT INTO security_events (event_type, level, message, ip_address, user_agent, url, method, timestamp)
      VALUES
        ('RATE_LIMIT_EXCEEDED', 'warning', 'Rate limit exceeded for IP 192.168.1.100 on /api/articles', '192.168.1.100', 'Mozilla/5.0', '/api/articles', 'GET', ${oneHourAgo}),
        ('CSRF_TOKEN_MISMATCH', 'warning', 'CSRF token mismatch for /api/admin/articles', '192.168.1.200', 'Mozilla/5.0', '/api/admin/articles', 'POST', ${oneHourAgo}),
        ('MALICIOUS_INPUT_DETECTED', 'error', 'SQL injection attempt blocked', '10.0.0.50', 'Mozilla/5.0', '/api/articles', 'POST', ${twoHoursAgo}),
        ('INVALID_API_KEY', 'warning', 'Invalid API key provided', '192.168.1.150', 'PostmanRuntime', '/api/admin/stats', 'GET', ${oneHourAgo})
    `;

    console.log('✅ Sample threat data inserted successfully!');
    console.log('\n📊 Expected results in threat detection tab:');
    console.log('   • Brute Force Attempts: 3');
    console.log('   • Suspicious IPs: 2');
    console.log('   • CSRF Attempts: 2');
    console.log('   • SQL Injection Attempts: 1');
    console.log('\n🔍 Check the admin security dashboard at /admin/security');
    console.log('💡 The threat detection tab should now display populated data with risk indicators.');

  } catch (error) {
    console.error('❌ Error populating threat data:', error);
  }
}

// Run the script
if (require.main === module) {
  populateThreatData().catch(console.error);
}