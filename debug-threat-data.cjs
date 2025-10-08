#!/usr/bin/env node

/**
 * Debug script to check threat data in database and test dashboard display
 */

async function loadModules() {
  const { getDB } = await import('./src/database-neon.ts');
  const { getThreatSummary, getSecurityDashboardData } = await import('./src/security-db.ts');
  return { getDB, getThreatSummary, getSecurityDashboardData };
}

async function debugThreatData() {
  console.log('🔍 Debugging threat data...\n');

  try {
    const { getDB, getThreatSummary, getSecurityDashboardData } = await loadModules();
    const sql = getDB();

    // Check if threat_attacks table exists and has data
    console.log('📊 Checking threat_attacks table...');
    const threatAttacks = await sql`SELECT * FROM threat_attacks ORDER BY timestamp DESC LIMIT 10`;
    console.log(`Found ${threatAttacks.length} threat attacks:`);
    threatAttacks.forEach((attack, i) => {
      console.log(`  ${i + 1}. ${attack.attack_type} from ${attack.ip_address} at ${attack.timestamp}`);
    });

    // Check security_events table
    console.log('\n📋 Checking security_events table...');
    const securityEvents = await sql`SELECT * FROM security_events ORDER BY timestamp DESC LIMIT 10`;
    console.log(`Found ${securityEvents.length} security events:`);
    securityEvents.forEach((event, i) => {
      console.log(`  ${i + 1}. ${event.event_type} (${event.level}): ${event.message}`);
    });

    // Test the getThreatSummary function directly
    console.log('\n🔬 Testing getThreatSummary function...');
    const threatSummary = await getThreatSummary(1); // Last 24 hours
    console.log('Threat Summary:', JSON.stringify(threatSummary, null, 2));

    // Test the getSecurityDashboardData function
    console.log('\n📈 Testing getSecurityDashboardData function...');
    const dashboardData = await getSecurityDashboardData();
    console.log('Dashboard Threats:', JSON.stringify(dashboardData.threats, null, 2));

    // Insert a test threat attack directly
    console.log('\n🧪 Inserting test threat attack...');
    const testIP = '127.0.0.1';
    const now = new Date();

    await sql`
      INSERT INTO threat_attacks (
        attack_type, ip_address, user_agent, url, method, payload,
        blocked, timestamp, risk_score, metadata
      ) VALUES (
        'brute_force', ${testIP}, 'TestAgent/1.0', '/api/auth/login', 'POST',
        '{"email":"test@test.com","password":"wrong"}', true, ${now}, 7,
        '{"test": true, "source": "debug_script"}'
      )
    `;

    await sql`
      INSERT INTO threat_attacks (
        attack_type, ip_address, user_agent, url, method, payload,
        blocked, timestamp, risk_score, metadata
      ) VALUES (
        'csrf', ${testIP}, 'TestAgent/1.0', '/api/admin/articles', 'POST',
        '{"title":"Test"}', true, ${now}, 6,
        '{"test": true, "source": "debug_script"}'
      )
    `;

    await sql`
      INSERT INTO threat_attacks (
        attack_type, ip_address, user_agent, url, method, payload,
        blocked, timestamp, risk_score, metadata
      ) VALUES (
        'sql_injection', ${testIP}, 'TestAgent/1.0', '/api/articles', 'POST',
        '{"content":"'' UNION SELECT * FROM users--"}', true, ${now}, 9,
        '{"test": true, "source": "debug_script"}'
      )
    `;

    console.log('✅ Test threat attacks inserted');

    // Test again after insertion
    console.log('\n🔄 Re-testing after insertion...');
    const updatedSummary = await getThreatSummary(1);
    console.log('Updated Threat Summary:', JSON.stringify(updatedSummary, null, 2));

    const updatedDashboard = await getSecurityDashboardData();
    console.log('Updated Dashboard Threats:', JSON.stringify(updatedDashboard.threats, null, 2));

  } catch (error) {
    console.error('❌ Error debugging threat data:', error);
  }
}

// Run the script
if (require.main === module) {
  debugThreatData().catch(console.error);
}