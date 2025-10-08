/**
 * Browser-based User Badge Level Test Script
 * Run this in the browser console while logged in as admin
 * Tests the user badge/role system by fetching users and displaying their badge levels
 */

// Badge hierarchy and styling
const BADGE_CONFIG = {
  superadmin: {
    level: 4,
    color: '#dc2626', // Red
    bgColor: '#fef2f2',
    icon: '👑',
    label: 'SUPERADMIN',
    borderColor: '#b91c1c'
  },
  admin: {
    level: 3,
    color: '#7c3aed', // Purple
    bgColor: '#faf5ff',
    icon: '🛡️',
    label: 'ADMIN',
    borderColor: '#6d28d9'
  },
  moderator: {
    level: 2,
    color: '#059669', // Green
    bgColor: '#f0fdf4',
    icon: '⚖️',
    label: 'MODERATOR',
    borderColor: '#047857'
  },
  user: {
    level: 1,
    color: '#2563eb', // Blue
    bgColor: '#eff6ff',
    icon: '👤',
    label: 'USER',
    borderColor: '#1d4ed8'
  }
};

/**
 * Create styled badge element
 */
function createBadgeElement(role) {
  const config = BADGE_CONFIG[role] || BADGE_CONFIG.user;

  const badge = document.createElement('span');
  badge.textContent = `${config.icon} ${config.label}`;
  badge.style.cssText = `
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: ${config.color};
    background-color: ${config.bgColor};
    border: 2px solid ${config.borderColor};
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin: 2px;
  `;

  return badge;
}

/**
 * Display user with badge information
 */
function displayUser(user, index) {
  const config = BADGE_CONFIG[user.role] || BADGE_CONFIG.user;

  // Create user card
  const userCard = document.createElement('div');
  userCard.style.cssText = `
    border: 2px solid ${config.borderColor};
    border-radius: 12px;
    padding: 16px;
    margin: 8px 0;
    background: linear-gradient(135deg, ${config.bgColor} 0%, #ffffff 100%);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  `;

  // User header
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  `;

  const nameDiv = document.createElement('div');
  nameDiv.innerHTML = `<strong style="font-size: 18px; color: ${config.color};">${config.icon} ${user.name}</strong>`;
  header.appendChild(nameDiv);

  const badge = createBadgeElement(user.role);
  header.appendChild(badge);

  // User details
  const details = document.createElement('div');
  details.style.cssText = 'font-size: 14px; color: #64748b;';
  details.innerHTML = `
    <div><strong>Email:</strong> ${user.email}</div>
    <div><strong>Role Level:</strong> ${config.level}</div>
    <div><strong>Joined:</strong> ${new Date(user.created_at).toLocaleDateString()}</div>
    <div><strong>User ID:</strong> <code style="background: #f1f5f9; padding: 2px 4px; border-radius: 4px;">${user.id}</code></div>
  `;

  userCard.appendChild(header);
  userCard.appendChild(details);

  return userCard;
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

  const statsContainer = document.createElement('div');
  statsContainer.style.cssText = `
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
    margin: 20px 0;
  `;

  const title = document.createElement('h3');
  title.textContent = '📊 Badge Statistics';
  title.style.cssText = 'margin: 0 0 16px 0; color: #1e293b;';
  statsContainer.appendChild(title);

  Object.entries(stats).forEach(([role, count]) => {
    const config = BADGE_CONFIG[role];
    const statDiv = document.createElement('div');
    statDiv.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    `;

    const badge = createBadgeElement(role);
    const countSpan = document.createElement('span');
    countSpan.textContent = count.toString();
    countSpan.style.cssText = `font-weight: bold; color: ${config.color}; font-size: 16px;`;

    statDiv.appendChild(badge);
    statDiv.appendChild(countSpan);
    statsContainer.appendChild(statDiv);
  });

  const totalDiv = document.createElement('div');
  totalDiv.style.cssText = `
    margin-top: 16px;
    padding-top: 16px;
    border-top: 2px solid #cbd5e1;
    text-align: center;
    font-weight: bold;
    color: #1e293b;
  `;
  totalDiv.textContent = `👥 Total Users: ${users.length}`;
  statsContainer.appendChild(totalDiv);

  return statsContainer;
}

/**
 * Display badge hierarchy
 */
function displayBadgeHierarchy() {
  const hierarchyContainer = document.createElement('div');
  hierarchyContainer.style.cssText = `
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
    margin: 20px 0;
  `;

  const title = document.createElement('h3');
  title.textContent = '🏆 Badge Hierarchy';
  title.style.cssText = 'margin: 0 0 16px 0; color: #1e293b;';
  hierarchyContainer.appendChild(title);

  const sortedBadges = Object.entries(BADGE_CONFIG)
    .sort(([,a], [,b]) => b.level - a.level);

  sortedBadges.forEach(([role, config]) => {
    const badgeDiv = document.createElement('div');
    badgeDiv.style.cssText = `
      display: flex;
      align-items: center;
      margin: 8px 0;
      padding: 8px;
      border-radius: 8px;
      background: white;
      border: 1px solid ${config.borderColor};
    `;

    const levelSpan = document.createElement('span');
    levelSpan.textContent = `${config.level}.`;
    levelSpan.style.cssText = `font-weight: bold; margin-right: 12px; color: ${config.color};`;

    const badge = createBadgeElement(role);

    badgeDiv.appendChild(levelSpan);
    badgeDiv.appendChild(badge);
    hierarchyContainer.appendChild(badgeDiv);
  });

  return hierarchyContainer;
}

/**
 * Main test function
 */
async function testUserBadges() {
  console.log('🚀 Starting User Badge Level Test...');

  // Create results container
  const resultsContainer = document.createElement('div');
  resultsContainer.id = 'user-badge-test-results';
  resultsContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 400px;
    max-height: 80vh;
    overflow-y: auto;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  // Add close button
  const closeButton = document.createElement('button');
  closeButton.textContent = '✕';
  closeButton.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #64748b;
  `;
  closeButton.onclick = () => resultsContainer.remove();
  resultsContainer.appendChild(closeButton);

  // Add title
  const title = document.createElement('h2');
  title.textContent = '🚀 User Badge Test Results';
  title.style.cssText = 'margin: 0 0 20px 0; color: #1e293b; font-size: 18px;';
  resultsContainer.appendChild(title);

  // Add hierarchy
  resultsContainer.appendChild(displayBadgeHierarchy());

  // Add loading message
  const loadingDiv = document.createElement('div');
  loadingDiv.textContent = '🔍 Fetching users...';
  loadingDiv.style.cssText = 'text-align: center; padding: 20px; color: #64748b;';
  resultsContainer.appendChild(loadingDiv);

  // Add to page
  document.body.appendChild(resultsContainer);

  try {
    // Fetch users
    const response = await fetch('/admin/api/users');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'API returned error');
    }

    const users = data.users || [];

    // Remove loading message
    loadingDiv.remove();

    if (users.length === 0) {
      const noUsersDiv = document.createElement('div');
      noUsersDiv.textContent = '❌ No users found';
      noUsersDiv.style.cssText = 'text-align: center; padding: 20px; color: #dc2626;';
      resultsContainer.appendChild(noUsersDiv);
      return;
    }

    // Sort users by badge level (highest first)
    const sortedUsers = users.sort((a, b) => {
      const aLevel = BADGE_CONFIG[a.role]?.level || 0;
      const bLevel = BADGE_CONFIG[b.role]?.level || 0;
      return bLevel - aLevel;
    });

    // Add user count
    const countDiv = document.createElement('div');
    countDiv.textContent = `👥 Found ${users.length} users:`;
    countDiv.style.cssText = 'font-weight: bold; margin: 20px 0 10px 0; color: #1e293b;';
    resultsContainer.appendChild(countDiv);

    // Display each user
    sortedUsers.forEach((user, index) => {
      resultsContainer.appendChild(displayUser(user, index));
    });

    // Add statistics
    resultsContainer.appendChild(displayBadgeStats(users));

    // Success message
    const successDiv = document.createElement('div');
    successDiv.textContent = '✅ User badge test completed successfully!';
    successDiv.style.cssText = 'text-align: center; padding: 16px; color: #059669; font-weight: bold;';
    resultsContainer.appendChild(successDiv);

    console.log('✅ User badge test completed successfully!');
    console.log(`Found ${users.length} users with badge levels displayed.`);

  } catch (error) {
    console.error('❌ Error:', error.message);

    loadingDiv.textContent = `❌ Error: ${error.message}`;
    loadingDiv.style.color = '#dc2626';

    // Add troubleshooting info
    const troubleshootingDiv = document.createElement('div');
    troubleshootingDiv.style.cssText = 'margin-top: 16px; font-size: 14px; color: #64748b;';
    troubleshootingDiv.innerHTML = `
      <strong>💡 Troubleshooting:</strong><br>
      1. Make sure you're logged in as an admin<br>
      2. Check that the server is running<br>
      3. Verify you have proper permissions<br>
      4. Try refreshing the page and logging in again
    `;
    resultsContainer.appendChild(troubleshootingDiv);
  }
}

// Make function available globally
window.testUserBadges = testUserBadges;

// Auto-run if this script is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 User Badge Test Script Loaded!');
    console.log('Run testUserBadges() in the console to test user badge levels.');
  });
} else {
  console.log('🎯 User Badge Test Script Loaded!');
  console.log('Run testUserBadges() in the console to test user badge levels.');
}