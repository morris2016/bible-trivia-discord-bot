// Test script for deleteUser function
const { deleteUser, getAllUsers } = require('./src/database-neon.ts');

async function testDeleteUser() {
  try {
    console.log('Testing deleteUser function...');

    // Get all users first
    const users = await getAllUsers();
    console.log(`Found ${users.length} users in database`);

    if (users.length === 0) {
      console.log('No users found to delete. Test completed.');
      return;
    }

    // Try to delete the first user (this should work now)
    const userToDelete = users[0];
    console.log(`Attempting to delete user: ${userToDelete.name} (ID: ${userToDelete.id})`);

    const result = await deleteUser(userToDelete.id);

    if (result) {
      console.log('✅ User deletion successful!');
    } else {
      console.log('❌ User deletion failed');
    }

  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testDeleteUser();