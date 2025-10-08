# User Badge Level Test Scripts

This directory contains test scripts to verify the user badge/role system in the Faith Defenders application.

## 📋 Available Test Scripts

### 1. Node.js Script (`test-user-badges.js`)
A command-line script that fetches and displays user badge information.

**Features:**
- ✅ Displays badge hierarchy
- ✅ Fetches users from API
- ✅ Shows user details with badge levels
- ✅ Provides badge statistics
- ✅ Color-coded console output

**Usage:**
```bash
node test-user-badges.js
```

**Requirements:**
- Node.js installed
- Server running (`npm run dev`)
- Admin authentication (may require session cookies)

### 2. Browser Script (`test-user-badges-browser.js`)
A browser-based script that can be run in the browser console.

**Features:**
- ✅ Visual badge display with colors and icons
- ✅ Interactive results panel
- ✅ Real-time user data fetching
- ✅ Badge hierarchy visualization
- ✅ Statistics dashboard

**Usage:**
1. Open browser console (F12)
2. Copy and paste the script content
3. Run `testUserBadges()` function

**Alternative Usage:**
```javascript
// Load script dynamically
const script = document.createElement('script');
script.src = '/test-user-badges-browser.js';
document.head.appendChild(script);

// Run after loading
setTimeout(() => testUserBadges(), 1000);
```

### 3. HTML Test Page (`test-user-badges.html`)
A complete HTML page with a user-friendly interface for testing.

**Features:**
- ✅ One-click testing
- ✅ Visual results display
- ✅ Instructions and troubleshooting
- ✅ Mobile-friendly interface

**Usage:**
1. Navigate to `/test-user-badges.html` in your browser
2. Click "Test User Badges" button
3. View results in the overlay panel

## 🏆 Badge Hierarchy

The system supports the following badge levels (highest to lowest):

1. **👑 SUPERADMIN** (Level 4) - Ultimate system control
   - Absolute protection from modifications
   - Cannot be demoted or deleted
   - Reserved for siagmoo26@gmail.com

2. **🛡️ ADMIN** (Level 3) - Full system access
   - Can manage users and content
   - Can promote/demote moderators
   - Cannot modify superadmin accounts

3. **⚖️ MODERATOR** (Level 2) - Content moderation
   - Can moderate content
   - Limited user management
   - Cannot modify admin accounts

4. **👤 USER** (Level 1) - Standard user
   - Basic access
   - Can view and interact with content

## 🔧 Setup Requirements

### Prerequisites
- Faith Defenders server running (`npm run dev`)
- Admin user account logged in
- Valid session/authentication

### Authentication
The test scripts require admin-level authentication to access the `/admin/api/users` endpoint. Make sure you're logged in as an administrator before running the tests.

## 📊 Test Output

### Console Output (Node.js)
```
🚀 User Badge Level Test Script
===============================

🏆 Badge Hierarchy:
==================
4. 👑 SUPERADMIN
3. 🛡️ ADMIN
2. ⚖️ MODERATOR
1. 👤 USER

👥 Found 5 users:
========================
1. 👑 John Doe
   Email: john@example.com
   Role: SUPERADMIN (Level 4)
   Joined: 1/15/2024
   ID: 123

2. 🛡️ Jane Admin
   Email: jane@example.com
   Role: ADMIN (Level 3)
   Joined: 2/20/2024
   ID: 124

📊 Badge Statistics:
==================
👑 SUPERADMIN: 1
🛡️ ADMIN: 2
⚖️ MODERATOR: 1
👤 USER: 1

👥 Total Users: 5
✅ User badge test completed successfully!
```

### Browser Output
- Visual overlay panel with styled user cards
- Color-coded badges with icons
- Interactive statistics dashboard
- Badge hierarchy visualization

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Error**
   ```
   ❌ Error: API returned error: Authentication required
   ```
   **Solution:** Log in as an admin user first

2. **Server Not Running**
   ```
   ❌ Error: Request failed: ECONNREFUSED
   ```
   **Solution:** Start the server with `npm run dev`

3. **Script Loading Error**
   ```
   ❌ Test script failed to load
   ```
   **Solution:** Check browser console for network errors

4. **No Users Found**
   ```
   ❌ No users found
   ```
   **Solution:** Ensure the database has user records

### Debug Steps
1. Check server logs for API errors
2. Verify admin authentication status
3. Check network connectivity
4. Clear browser cache and cookies
5. Try different browser or incognito mode

## 🔒 Security Notes

- These test scripts only read user data
- No modifications are made to the database
- All authentication is handled through existing session management
- Test results are displayed locally and not stored

## 📞 Support

If you encounter issues with the test scripts:

1. Check the troubleshooting section above
2. Verify your server configuration
3. Ensure proper admin authentication
4. Check browser console for detailed error messages
5. Review server logs for API-related errors

## 🎯 Expected Results

When working correctly, the test should:
- ✅ Display the badge hierarchy
- ✅ Fetch all users from the API
- ✅ Show each user with their badge level
- ✅ Display statistics for each badge type
- ✅ Highlight superadmin protection features
- ✅ Show proper color coding and icons

The test confirms that the role-based access control system is functioning properly with proper badge level assignments and security protections.