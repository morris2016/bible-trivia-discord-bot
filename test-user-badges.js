#!/usr/bin/env node

/**
 * User Badge Level Test Script
 * Tests the user badge/role system by fetching users and displaying their badge levels
 */

import https from 'https';
import http from 'http';

// Configuration
const BASE_URL = 'http://localhost:5173'; // Server is running on port 5173
const API_ENDPOINT = '/admin/api/users';

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
 * Make HTTP request to fetch users
 */
function fetchUsers() {
  return new Promise((resolve, reject) => {
    const url = BASE_URL + API_ENDPOINT;
    console.log(`🔍 Fetching users from: ${url}`);

    // For simplicity, we'll use a basic HTTP request
    // In a real scenario, you'd need proper authentication headers
    const request = http.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    request.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    // Set timeout
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

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
 * Main function
 */
async function main() {
  console.log('🚀 User Badge Level Test Script');
  console.log('===============================\n');

  try {
    // Display hierarchy first
    displayBadgeHierarchy();

    // Fetch users
    const response = await fetchUsers();

    if (!response.success) {
      throw new Error(`API returned error: ${response.error || 'Unknown error'}`);
    }

    const users = response.users || [];

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

    console.log('✅ User badge test completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure the server is running (npm run dev)');
    console.log('2. Check that you have admin access');
    console.log('3. Verify the API endpoint is correct');
    console.log('4. Check network connectivity');
  }
}

// Run as standalone script
main().catch(console.error);

// Exported for use in other scripts
export { fetchUsers, displayUser, displayBadgeStats, displayBadgeHierarchy };