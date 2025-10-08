// Test script to populate role changes for demonstration
import { getDB } from './src/database-neon.js';

async function testRoleChanges() {
  const sql = getDB();

  try {
    console.log('Testing role changes functionality...');

    // Insert some test role changes
    const testChanges = [
      {
        target_user_id: 1,
        target_user_name: 'John Doe',
        target_user_email: 'john@example.com',
        old_role: 'user',
        new_role: 'moderator',
        changed_by_user_id: 2,
        changed_by_user_name: 'Admin User',
        change_reason: 'Promoted for excellent community contributions',
        change_method: 'direct'
      },
      {
        target_user_id: 3,
        target_user_name: 'Jane Smith',
        target_user_email: 'jane@example.com',
        old_role: 'moderator',
        new_role: 'user',
        changed_by_user_id: 2,
        changed_by_user_name: 'Admin User',
        change_reason: 'Demoted due to policy violation',
        change_method: 'direct'
      },
      {
        target_user_id: 4,
        target_user_name: 'Mike Johnson',
        target_user_email: 'mike@example.com',
        old_role: 'user',
        new_role: 'admin',
        changed_by_user_id: 2,
        changed_by_user_name: 'Admin User',
        change_reason: 'Promoted to admin for outstanding service',
        change_method: 'verification'
      }
    ];

    for (const change of testChanges) {
      await sql`
        INSERT INTO role_change_log (
          target_user_id, target_user_name, target_user_email,
          old_role, new_role, changed_by_user_id, changed_by_user_name,
          change_reason, change_method, created_at
        )
        VALUES (
          ${change.target_user_id}, ${change.target_user_name}, ${change.target_user_email},
          ${change.old_role}, ${change.new_role}, ${change.changed_by_user_id}, ${change.changed_by_user_name},
          ${change.change_reason}, ${change.change_method}, NOW() - INTERVAL '${Math.floor(Math.random() * 7)} days'
        )
      `;
    }

    console.log('✅ Test role changes inserted successfully!');

    // Test the API endpoint
    console.log('Testing API endpoint...');
    const response = await fetch('http://localhost:8787/admin/api/role-changes?limit=5');
    const data = await response.json();

    if (data.success) {
      console.log('✅ API endpoint working!');
      console.log(`Found ${data.roleChanges.length} role changes`);
      data.roleChanges.forEach(change => {
        console.log(`- ${change.target_user_name}: ${change.old_role} → ${change.new_role}`);
      });
    } else {
      console.log('❌ API endpoint failed:', data.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRoleChanges();