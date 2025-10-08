#!/usr/bin/env node

/**
 * Promote a user to admin role for testing purposes
 */

const { getDB } = require('./database-neon.cjs');

async function promoteToAdmin() {
  console.log('👑 Promoting user to admin role...\n');

  try {
    const sql = getDB();

    // Update the test admin user to have admin role
    const result = await sql`
      UPDATE users
      SET role = 'admin', email_verified = true, updated_at = CURRENT_TIMESTAMP
      WHERE email = 'admin@test.com'
      RETURNING id, email, name, role, email_verified
    `;

    if (result.length > 0) {
      console.log('✅ User promoted to admin successfully!');
      console.log('User Details:', result[0]);
    } else {
      console.log('❌ User not found or already admin');
    }

  } catch (error) {
    console.error('❌ Error promoting user to admin:', error.message);
  }
}

// Run the script
if (require.main === module) {
  promoteToAdmin().catch(console.error);
}