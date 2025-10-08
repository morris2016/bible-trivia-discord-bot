#!/usr/bin/env node

/**
 * User Badge System Demo Script
 * Demonstrates the badge hierarchy and user display functionality
 */

// Badge hierarchy and styling
const BADGE_CONFIG = {
  superadmin: {
    level: 4,
    color: '\x1b[31m', // Red
    icon: '👑',
    label: 'SUPERADMIN'
  },
  admin: {
    level: 3,
    color: '\x1b[35m', // Magenta
    icon: '🛡️',
    label: 'ADMIN'
  },
  moderator: {
    level: 2,
    color: '\x1b[32m', // Green
    icon: '⚖️',
    label: 'MODERATOR'
  },
  user: {
    level: 1,
    color: '\x1b[34m', // Blue
    icon: '👤',
    label: 'USER'
  }
};

// Reset color
const RESET = '\x1b[0m';

/**
 * Mock user data for demonstration
 */
const mockUsers = [
  {
    id: 1,
    name: 'siagmoo26',
    email: 'siagmoo26@gmail.com',
    role: 'superadmin',
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    name: 'John Admin',
    email: 'john.admin@example.com',
    role: 'admin',
    created_at: '2024-02-20T14:15:00Z'
  },
  {
    id: 3,
    name: 'Jane Moderator',
    email: 'jane.mod@example.com',
    role: 'moderator',
    created_at: '2024-03-10T09:45:00Z'
  },
  {
    id: 4,
    name: 'Bob User',
    email: 'bob.user@example.com',
    role: 'user',
    created_at: '2024-04-05T16:20:00Z'
  },
  {
    id: 5,
    name: 'Alice Admin',
    email: 'alice.admin@example.com',
    role: 'admin',
    created_at: '2024-05-12T11:30:00Z'
  }
];

/**
 * Display user with badge information
 */
function displayUser(user, index) {
  const badge = BADGE_CONFIG[user.role] || BADGE_CONFIG.user;
  const color = badge.color;
  const icon = badge.icon;
  const label = badge.label;

  console.log(`${color}${index + 1}. ${icon} ${user.name}${RESET}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${color}${label}${RESET} (Level ${badge.level})`);
  console.log(`   Joined: ${new Date(user.created_at).toLocaleDateString()}`);
  console.log(`   ID: ${user.id}`);
  console.log('');
}

/**
 * Display badge statistics
 */
function displayBadgeStats(users) {
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

  console.log('\n📊 Badge Statistics:');
  console.log('==================');

  Object.entries(stats).forEach(([role, count]) => {
    const badge = BADGE_CONFIG[role];
    const color = badge.color;
    const icon = badge.icon;
    const label = badge.label;

    console.log(`${color}${icon} ${label}: ${count}${RESET}`);
  });

  console.log(`\n👥 Total Users: ${users.length}`);
}

/**
 * Display badge hierarchy
 */
function displayBadgeHierarchy() {
  console.log('\n🏆 Badge Hierarchy:');
  console.log('==================');

  const sortedBadges = Object.entries(BADGE_CONFIG)
    .sort(([,a], [,b]) => b.level - a.level);

  sortedBadges.forEach(([role, config]) => {
    const color = config.color;
    const icon = config.icon;
    const label = config.label;

    console.log(`${color}${config.level}. ${icon} ${label}${RESET}`);
  });
}

/**
 * Demonstrate superadmin protection
 */
function demonstrateSuperadminProtection() {
  console.log('\n🔒 Superadmin Protection Demo:');
  console.log('==============================');

  const superadminUser = mockUsers.find(u => u.role === 'superadmin');

  if (superadminUser) {
    console.log(`🛡️ Protected User: ${superadminUser.name} (${superadminUser.email})`);
    console.log('🚫 Cannot be demoted or deleted');
    console.log('🚫 Role changes blocked');
    console.log('✅ Absolute system protection active');
  }

  console.log('\n⚠️  Attempting to change superadmin role...');
  console.log('❌ BLOCKED: Superadmin protection active');
  console.log('✅ System integrity maintained');
}

/**
 * Main demo function
 */
function main() {
  console.log('🚀 User Badge System Demo');
  console.log('=========================\n');

  // Display hierarchy first
  displayBadgeHierarchy();

  // Simulate API response
  console.log('\n🔍 Simulating API Response...');
  console.log('✅ Authentication successful (demo mode)');
  console.log('✅ Users fetched from database');

  const users = mockUsers;

  if (users.length === 0) {
    console.log('❌ No users found');
    return;
  }

  console.log(`\n👥 Found ${users.length} users:`);
  console.log('========================');

  // Sort users by badge level (highest first)
  const sortedUsers = users.sort((a, b) => {
    const aLevel = BADGE_CONFIG[a.role]?.level || 0;
    const bLevel = BADGE_CONFIG[b.role]?.level || 0;
    return bLevel - aLevel;
  });

  // Display each user
  sortedUsers.forEach(displayUser);

  // Display statistics
  displayBadgeStats(users);

  // Demonstrate superadmin protection
  demonstrateSuperadminProtection();

  console.log('\n✅ User badge demo completed successfully!');
  console.log('\n💡 To test with real data:');
  console.log('1. Log in as admin in your browser');
  console.log('2. Navigate to /test-user-badges.html');
  console.log('3. Click "Test User Badges" button');
  console.log('4. Or run testUserBadges() in browser console');
}

// Run the demo
main();

// Export functions for use in other scripts
export { displayUser, displayBadgeStats, displayBadgeHierarchy, demonstrateSuperadminProtection };