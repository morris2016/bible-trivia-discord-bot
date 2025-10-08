#!/usr/bin/env node

/**
 * User Badge Extraction Script
 * Extracts all users and their badge levels from the database
 */

import { getAllUsers } from './src/database-postgres.ts';

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
 * Export users to JSON file
 */
function exportToJSON(users, filename = 'users-badges-export.json') {
  const exportData = {
    exported_at: new Date().toISOString(),
    total_users: users.length,
    badge_breakdown: {},
    users: users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      badge_level: BADGE_CONFIG[user.role]?.level || 1,
      badge_label: BADGE_CONFIG[user.role]?.label || 'USER',
      created_at: user.created_at,
      updated_at: user.updated_at
    }))
  };

  // Calculate badge breakdown
  users.forEach(user => {
    const role = user.role;
    exportData.badge_breakdown[role] = (exportData.badge_breakdown[role] || 0) + 1;
  });

  const fs = require('fs');
  fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
  console.log(`\n💾 Users exported to: ${filename}`);
}

/**
 * Export users to CSV file
 */
function exportToCSV(users, filename = 'users-badges-export.csv') {
  const headers = ['ID', 'Name', 'Email', 'Role', 'Badge Level', 'Badge Label', 'Created At', 'Updated At'];
  const rows = users.map(user => [
    user.id,
    user.name,
    user.email,
    user.role,
    BADGE_CONFIG[user.role]?.level || 1,
    BADGE_CONFIG[user.role]?.label || 'USER',
    user.created_at,
    user.updated_at
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  const fs = require('fs');
  fs.writeFileSync(filename, csvContent);
  console.log(`\n💾 Users exported to: ${filename}`);
}

/**
 * Main extraction function
 */
async function extractUsersAndBadges() {
  console.log('🚀 User Badge Extraction Script');
  console.log('===============================\n');

  try {
    console.log('🔍 Fetching users from database...');

    // Get users from database
    const users = await getAllUsers();

    if (!users || users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    console.log(`✅ Found ${users.length} users in database\n`);

    // Sort users by badge level (highest first)
    const sortedUsers = users.sort((a, b) => {
      const aLevel = BADGE_CONFIG[a.role]?.level || 0;
      const bLevel = BADGE_CONFIG[b.role]?.level || 0;
      return bLevel - aLevel;
    });

    console.log('👥 All Users with Badge Levels:');
    console.log('================================');

    // Display each user
    sortedUsers.forEach(displayUser);

    // Display statistics
    displayBadgeStats(users);

    // Export options
    console.log('\n💾 Export Options:');
    console.log('==================');

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const jsonFilename = `users-badges-${timestamp}.json`;
    const csvFilename = `users-badges-${timestamp}.csv`;

    exportToJSON(users, jsonFilename);
    exportToCSV(users, csvFilename);

    console.log('\n✅ User extraction completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • Total users: ${users.length}`);
    console.log(`   • Superadmins: ${users.filter(u => u.role === 'superadmin').length}`);
    console.log(`   • Admins: ${users.filter(u => u.role === 'admin').length}`);
    console.log(`   • Moderators: ${users.filter(u => u.role === 'moderator').length}`);
    console.log(`   • Regular users: ${users.filter(u => u.role === 'user').length}`);

  } catch (error) {
    console.error('❌ Error extracting users:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure the database is running');
    console.log('2. Check database connection settings');
    console.log('3. Verify you have proper database permissions');
    console.log('4. Check the database schema and table structure');
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (command === '--help' || command === '-h') {
  console.log('User Badge Extraction Script');
  console.log('Usage: node extract-users-badges.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h    Show this help message');
  console.log('  --json        Export only to JSON');
  console.log('  --csv         Export only to CSV');
  console.log('');
  console.log('Examples:');
  console.log('  node extract-users-badges.js');
  console.log('  node extract-users-badges.js --json');
  process.exit(0);
}

// Run the extraction
extractUsersAndBadges().catch(console.error);