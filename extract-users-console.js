/**
 * Browser Console Script to Extract All Users and Their Badges
 * Run this in the browser console while logged in as admin
 */

// Badge configuration
const BADGE_CONFIG = {
  superadmin: {
    level: 4,
    color: '#dc2626',
    icon: '👑',
    label: 'SUPERADMIN'
  },
  admin: {
    level: 3,
    color: '#7c3aed',
    icon: '🛡️',
    label: 'ADMIN'
  },
  moderator: {
    level: 2,
    color: '#059669',
    icon: '⚖️',
    label: 'MODERATOR'
  },
  user: {
    level: 1,
    color: '#2563eb',
    icon: '👤',
    label: 'USER'
  }
};

/**
 * Extract all users and their badges
 */
async function extractAllUsersAndBadges() {
  console.log('🚀 Extracting All Users and Their Badges...');
  console.log('==========================================\n');

  try {
    // Fetch users from API
    const response = await fetch('/admin/api/users');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'API returned error');
    }

    const users = data.users || [];

    if (users.length === 0) {
      console.log('❌ No users found');
      return;
    }

    console.log(`✅ Found ${users.length} users in database\n`);

    // Sort users by badge level (highest first)
    const sortedUsers = users.sort((a, b) => {
      const aLevel = BADGE_CONFIG[a.role]?.level || 0;
      const bLevel = BADGE_CONFIG[b.role]?.level || 0;
      return bLevel - aLevel;
    });

    console.log('👥 ALL USERS WITH BADGE LEVELS:');
    console.log('================================');

    // Display each user
    sortedUsers.forEach((user, index) => {
      const badge = BADGE_CONFIG[user.role] || BADGE_CONFIG.user;
      const color = badge.color;
      const icon = badge.icon;
      const label = badge.label;

      console.log(`${index + 1}. ${icon} ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${label} (Level ${badge.level})`);
      console.log(`   Joined: ${new Date(user.created_at).toLocaleDateString()}`);
      console.log(`   User ID: ${user.id}`);
      console.log('');
    });

    // Statistics
    const stats = {
      superadmin: 0,
      admin: 0,
      moderator: 0,
      user: 0
    };

    users.forEach(user => {
      if (stats.hasOwnProperty(user.role)) {
        stats[user.role]++;
      } else {
        stats.user++; // Default to user if unknown role
      }
    });

    console.log('📊 BADGE STATISTICS:');
    console.log('===================');

    Object.entries(stats).forEach(([role, count]) => {
      const badge = BADGE_CONFIG[role];
      const icon = badge.icon;
      const label = badge.label;

      console.log(`${icon} ${label}: ${count}`);
    });

    console.log(`\n👥 Total Users: ${users.length}`);

    // Create downloadable data
    const exportData = {
      exported_at: new Date().toISOString(),
      total_users: users.length,
      badge_breakdown: stats,
      users: sortedUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        badge_level: BADGE_CONFIG[user.role]?.level || 1,
        badge_label: BADGE_CONFIG[user.role]?.label || 'USER',
        created_at: user.created_at
      }))
    };

    // Store in global variable for easy access
    window.extractedUserData = exportData;

    console.log('\n💾 EXPORT DATA AVAILABLE:');
    console.log('========================');
    console.log('Data stored in: window.extractedUserData');
    console.log('Copy to clipboard: copy(window.extractedUserData)');
    console.log('Download as JSON: downloadUserData()');

    // Create download function
    window.downloadUserData = function() {
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

      const exportFileDefaultName = `users-badges-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    };

    console.log('\n✅ Extraction completed successfully!');
    console.log('Run downloadUserData() to download the data as JSON file.');

  } catch (error) {
    console.error('❌ Error extracting users:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure you are logged in as an admin');
    console.log('2. Check that the server is running');
    console.log('3. Verify you have proper permissions');
    console.log('4. Try refreshing the page and logging in again');
  }
}

// Make function available globally
window.extractAllUsersAndBadges = extractAllUsersAndBadges;

// Auto-run instructions
console.log('🎯 User Badge Extraction Script Loaded!');
console.log('======================================');
console.log('Run: extractAllUsersAndBadges()');
console.log('');
console.log('This will:');
console.log('• Fetch all users from the database');
console.log('• Display them with their badge levels');
console.log('• Show badge statistics');
console.log('• Export data for download');
console.log('');
console.log('Make sure you are logged in as an admin first!');