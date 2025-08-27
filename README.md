# Faith Defenders Website

## Project Overview
- **Name**: Faith Defenders
- **Goal**: A complete faith-based community website with user authentication, content management, resource sharing, and comprehensive admin panel
- **Features**: Multi-page navigation, user authentication, article management, resource library, full admin backend, **comprehensive custom rich text editor**

## URLs
- **Development**: https://3000-inazuof9eohwqpew3aev9.e2b.dev
- **Admin Panel**: https://3000-inazuof9eohwqpew3aev9.e2b.dev/admin
- **Admin Settings**: https://3000-inazuof9eohwqpew3aev9.e2b.dev/admin/settings
- **Admin Backup**: https://3000-inazuof9eohwqpew3aev9.e2b.dev/admin/backup
- **Admin Roles**: https://3000-inazuof9eohwqpew3aev9.e2b.dev/admin/roles
- **Password Reset**: https://3000-inazuof9eohwqpew3aev9.e2b.dev/forgot-password 🔐 **NEW**
- **Dashboard Settings**: https://3000-inazuof9eohwqpew3aev9.e2b.dev/dashboard (Settings tab) 🔐 **NEW**
- **GitHub**: https://github.com/morris2016/Faith-defenders

## Currently Completed Features

### **Main Website**
- ✅ **Frontend Design**: Complete navigation with purple/lavender theme
- ✅ **User Authentication**: Registration, login, logout with JWT tokens  
- ✅ **Google OAuth Integration**: Complete Google sign-in/sign-up flow with @hono/oauth-providers 🔐 **NEW**
- ✅ **Email Verification System**: OTP-based email verification with Gmail integration 📧 **NEW**
- ✅ **Password Recovery**: Complete forgot password flow with email-based reset codes 🔐 **NEW**
- ✅ **User Settings**: Password change functionality in dashboard settings 🔐 **NEW**
- ✅ **Security Hardening**: All credentials moved to environment variables 🔒 **SECURED**
- ✅ **Article System**: Create, read, update articles with author attribution
- ✅ **Resource Library**: Add and browse faith-based resources (books, websites, podcasts)
- ✅ **User Dashboard**: Tabbed interface for content management
- ✅ **Dynamic Content**: Homepage shows latest articles and resources
- ✅ **Responsive Design**: Mobile-friendly interface
- ✅ **Sample Content**: Pre-loaded with example articles and resources
- ✅ **Secure Authentication**: HTTP-only cookies and password hashing
- ✅ **Comments & Likes System**: Interactive community engagement features with **like/dislike buttons**
- ✅ **Role-Based Permissions**: Admin/Moderator/User hierarchy with content creation restrictions

### **Email System** 📧 **NEW**
- ✅ **Gmail Integration**: Professional email delivery using hakunamatataministry@gmail.com
- ✅ **Email Verification**: OTP codes sent to new registrations for account verification
- ✅ **Password Reset**: Secure password recovery with email-delivered reset codes
- ✅ **Professional Templates**: HTML email templates with Faith Defenders branding
- ✅ **Nodemailer Implementation**: Robust email sending with Gmail SMTP configuration
- ✅ **Email Security**: Email verification required for commenting and full site access

### **Custom Rich Text Editor** 🎉 **NEW**
- ✅ **Built from Scratch**: Complete custom editor replacing Quill.js and TinyMCE
- ✅ **Word-like Formatting**: Precise inline formatting (select partial text for headers)
- ✅ **Comprehensive Toolbar**: Professional multi-section toolbar with all formatting options
- ✅ **Text Formatting**: Bold, italic, underline, strikethrough with keyboard shortcuts
- ✅ **Headers**: H1-H4 with proper sizing and inline application to selected text
- ✅ **Font Options**: Font family (serif, sans-serif, monospace) and size controls
- ✅ **Color Controls**: Text color, background color, and highlight functionality
- ✅ **Text Alignment**: Left, center, right, justify alignment options
- ✅ **Lists**: Ordered lists, bullet lists, and interactive checklists
- ✅ **Special Formatting**: Blockquotes, inline code, code blocks
- ✅ **Advanced Text**: Subscript (H₂O), superscript (E=mc²) formatting
- ✅ **Media Support**: Link insertion and image upload capabilities
- ✅ **Utility Functions**: Clear formatting, undo/redo functionality
- ✅ **Form Integration**: Seamless synchronization with hidden textarea for form submission
- ✅ **Multi-Instance**: Works across dashboard, admin panel (create & edit forms)

### **Comments & Likes System** 🎉 **NEW**
- ✅ **User Engagement**: Like articles and resources with heart button
- ✅ **Comment System**: Threaded comments with reply functionality  
- ✅ **Comment Like/Dislike**: Individual comment like and dislike buttons with numerical counts
- ✅ **Real-time Interactions**: Immediate feedback and engagement updates
- ✅ **User Authentication Required**: Comments and likes require user login with email verification
- ✅ **Author Attribution**: Comment authors displayed with avatars
- ✅ **Time Stamps**: Relative time display (e.g., "2 hours ago")
- ✅ **Character Limits**: 1000 character limit for comments with live counter
- ✅ **Reply Threading**: Nested replies for organized discussions
- ✅ **Like Counts**: Display total likes with user's like status
- ✅ **Professional UI**: Clean, modern comment and like interface matching reference design
- ✅ **Comment Management**: Edit and delete functionality for comment authors and moderators

### **Role-Based Permission System** 🔐 **NEW**
- ✅ **Three-Tier Hierarchy**: Admin → Moderator → User role structure
- ✅ **Content Creation Restrictions**: Only admins and moderators can create articles/resources
- ✅ **User Interaction Rights**: Regular users can like and comment on existing content
- ✅ **Dashboard Adaptation**: UI dynamically shows appropriate options based on user role
- ✅ **Permission Middleware**: Server-side enforcement of role-based permissions
- ✅ **User Status Management**: Active, suspended, and banned user states
- ✅ **Moderation Tools**: Admin suspension, role changes, and user management features
- ✅ **Authentication Security**: Enhanced user session validation and status checking

### **Admin Panel** 🆕 **FIXED**
- ✅ **Admin Authentication**: Separate admin access with role-based permissions
- ✅ **Admin Dashboard**: Comprehensive site overview with metrics and statistics ✅ **FIXED - Statistics Loading**
- ✅ **Real Data Display**: Dashboard now shows actual statistics instead of "Loading..." placeholders
- ✅ **Analytics Integration**: Fixed data structure mismatch between Analytics and Dashboard endpoints
- ✅ **Article Management**: Full CRUD operations for all articles (published and drafts)
- ✅ **Resource Management**: Add, edit, and manage community resources
- ✅ **User Management**: View all users, update roles, manage permissions with enhanced moderation tools
- ✅ **Analytics Dashboard**: Site performance metrics and engagement data
- ✅ **Site Settings Management**: Complete settings interface (general, content, user, security settings)
- ✅ **Backup & Export**: Database backup and content export functionality with restore options
- ✅ **Role Management**: Comprehensive role and permissions management (promote, demote, permissions overview)
- ✅ **Professional UI**: Separate admin interface with sidebar navigation
- ✅ **Quick Actions**: Easy access to common administrative tasks
- ✅ **Separate Styling**: Independent CSS and JavaScript files for admin interface
- ✅ **Admin Panel Link**: Accessible from main dashboard for admin users only
- ✅ **User Moderation**: Comprehensive user management with status tracking, suspension, and role management

## Authentication System 🔐 **ENHANCED**

### **Multi-Provider Authentication**
- ✅ **Email/Password Registration**: Traditional registration with email verification
- ✅ **Google OAuth Integration**: One-click sign-in/sign-up with Google accounts
- ✅ **Email Verification**: Required OTP verification for email registrations
- ✅ **Password Recovery**: Complete forgot password flow with email reset codes
- ✅ **Account Security**: Password change functionality in user settings

### **Authentication Flow**
1. **New Users**: Choose email registration (requires OTP verification) or Google OAuth (instant)
2. **Email Verification**: Email registrations receive OTP codes for account verification
3. **Login Options**: Sign in via email/password or Google OAuth
4. **Password Recovery**: Forgot password sends secure reset codes via email
5. **Profile Management**: Change passwords and update account settings in dashboard

### **Security Features**
- ✅ **Environment Variables**: All credentials securely stored in environment configuration
- ✅ **JWT Tokens**: Secure authentication with HTTP-only cookies
- ✅ **Password Hashing**: bcrypt encryption for password security
- ✅ **Email Verification**: Required verification blocks unverified users from commenting
- ✅ **Gmail Integration**: Professional email delivery using hakunamatataministry@gmail.com

## Rich Text Editor Features

### **🎯 Word-Like Behavior**
Unlike traditional rich text editors (Quill.js, TinyMCE) that apply formatting to entire paragraphs:
- **Precise Selection**: Select any portion of text and apply formatting only to that selection
- **Inline Headers**: Apply H1, H2, H3, H4 to selected words within a paragraph
- **Surrounding Text Unchanged**: Text before and after selection remains unformatted
- **Microsoft Word Experience**: Behaves exactly like Word's formatting system

### **🛠️ Complete Formatting Toolbar**

#### **Text Formatting Group**
- **Bold** (Ctrl+B) - Bold selected text
- **Italic** (Ctrl+I) - Italic selected text  
- **Underline** (Ctrl+U) - Underline selected text
- **Strikethrough** - Strike through selected text

#### **Font & Size Group**
- **Font Family** - Default, Serif, Sans-serif, Monospace
- **Font Size** - Extra Small, Small, Normal, Large, Extra Large, 2X Large

#### **Headers Group**
- **H1** - Large heading (2em)
- **H2** - Section heading (1.5em)  
- **H3** - Subsection heading (1.25em)
- **H4** - Small heading (1.1em)

#### **Colors Group**
- **Text Color** - Color picker for text color
- **Background Color** - Color picker for background color
- **Highlight** - Yellow highlighter effect

#### **Lists Group**
- **Numbered List** - Create ordered lists (1, 2, 3...)
- **Bullet List** - Create unordered lists (•)
- **Checklist** - Interactive checkboxes (☐ ☑)

#### **Alignment Group**
- **Align Left** - Left-align text
- **Align Center** - Center-align text
- **Align Right** - Right-align text  
- **Justify** - Justify text alignment

#### **Special Formatting Group**
- **Quote** - Create blockquotes with left border styling
- **Inline Code** - Monospace code formatting with background
- **Code Block** - Multi-line code blocks with syntax highlighting

#### **Advanced Formatting Group**
- **Subscript** - Lower text (H₂O)
- **Superscript** - Raised text (E=mc²)

#### **Media & Links Group**
- **Insert Link** - Add hyperlinks with URL prompt
- **Insert Image** - Upload and embed images

#### **Utility Group**
- **Clear Formatting** - Remove all formatting from selected text
- **Undo** (Ctrl+Z) - Undo last action
- **Redo** (Ctrl+Y) - Redo last undone action

### **🔧 Technical Implementation**
- **Pure JavaScript**: No external dependencies (Quill, TinyMCE removed)
- **contentEditable API**: Native browser editing capabilities
- **document.execCommand**: Standard formatting commands
- **Custom CSS Classes**: Styled formatting elements
- **Real-time Sync**: Automatic synchronization with hidden textarea
- **Form Compatibility**: Works seamlessly with existing form submissions
- **Cross-Instance**: Same editor across dashboard, admin create, admin edit

## Functional Entry URIs

### **Public Pages**
- `/` - Homepage with latest articles and welcome content
- `/articles` - Browse all published articles
- `/articles/{id}` - View individual article
- `/resources` - Browse all shared resources  
- `/about` - About Faith Defenders
- `/login` - User authentication (login/register forms)
- `/forgot-password` - Password recovery page 🔐 **NEW**

### **Authentication Pages** 🔐 **NEW**
- `/login` - Email/password login and Google OAuth sign-in
- `/register` - Email registration with OTP verification
- `/auth/google` - Google OAuth authentication endpoint
- `/auth/google/callback` - Google OAuth callback handler
- `/forgot-password` - Secure password recovery with email codes
- `/reset-password` - Password reset form with verification codes

### **Protected Pages** (requires login)
- `/dashboard` - User dashboard with **comprehensive rich text editor**
- `/dashboard?tab=create-article` - Create new article with **full formatting toolbar**
- `/dashboard?tab=create-resource` - Add new resource
- `/dashboard?tab=settings` - User account settings and password change 🔐 **NEW**

### **Admin Panel** (requires admin role) 🆕
- `/admin` - Admin dashboard with site overview and metrics ✅ **FIXED**
- `/admin/articles` - Manage all articles (create, edit, delete, publish/unpublish)
- `/admin/articles/new` - Create new article with **comprehensive rich text editor**
- `/admin/articles/:id/edit` - Edit existing articles with **full formatting capabilities**
- `/admin/resources` - Manage resource library
- `/admin/resources/new` - Add new resources to library  
- `/admin/users` - User management (view users, change roles, manage accounts)
- `/admin/analytics` - Site analytics and performance metrics
- `/admin/settings` - **Complete site settings management** (general, content, user, security)
- `/admin/backup` - **Database backup and content export functionality**
- `/admin/roles` - **Role management and permissions system** (promote, demote, permissions overview)

### **API Endpoints**
- `GET /api/health` - API health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/forgot-password` - Request password reset 🔐 **NEW**
- `POST /api/auth/reset-password` - Reset password with code 🔐 **NEW**
- `POST /api/auth/change-password` - Change user password 🔐 **NEW**
- `POST /api/auth/verify-email` - Verify email with OTP code 📧 **NEW**
- `POST /api/auth/resend-verification` - Resend verification code 📧 **NEW**
- `GET /api/articles` - Get all published articles
- `GET /api/articles/{id}` - Get specific article
- `POST /api/articles` - Create new article (admin/moderator only)
- `PUT /api/articles/{id}` - Update article (auth required)
- `GET /api/resources` - Get all resources
- `POST /api/resources` - Create new resource (admin/moderator only)
- `GET /api/articles/{id}/comments` - Get article comments with like/dislike counts
- `POST /api/articles/{id}/comments` - Create comment (verified users only) 📧 **NEW**
- `GET /api/resources/{id}/comments` - Get resource comments with like/dislike counts
- `POST /api/resources/{id}/comments` - Create comment (verified users only) 📧 **NEW**
- `POST /api/articles/{id}/like` - Toggle article like (auth required)
- `POST /api/resources/{id}/like` - Toggle resource like (auth required)
- `GET /api/articles/{id}/likes` - Get article like count and user status
- `GET /api/resources/{id}/likes` - Get resource like count and user status
- `POST /api/comments/{id}/like` - Like specific comment (auth required)
- `POST /api/comments/{id}/dislike` - Dislike specific comment (auth required)
- `GET /api/comments/{id}/likes` - Get comment like/dislike counts and user status
- `PUT /api/comments/{id}` - Edit comment content (owner/admin/moderator only)
- `DELETE /api/comments/{id}` - Delete comment (owner/admin/moderator only)

### **Admin API Endpoints** (requires admin role) 🆕
- `GET /admin/api/analytics` - Dashboard statistics and detailed analytics ✅ **FIXED**
- `GET /admin/api/articles` - Get all articles (published and drafts)
- `GET /admin/api/articles/{id}` - Get specific article for editing
- `POST /admin/api/articles` - Create new article via admin panel
- `PUT /admin/api/articles/{id}` - Update article via admin panel
- `GET /admin/api/resources` - Get all resources for management
- `POST /admin/api/resources` - Create new resource via admin panel
- `GET /admin/api/users` - Get all users with stats and management data
- `PUT /admin/api/users/{id}` - Update user role/status

## Data Architecture

### **Data Models**
- **Users**: ID, email, name, role (admin/moderator/user), status (active/suspended/banned), password hash, last login, suspension details, google_id, avatar_url, email_verified, auth_provider, timestamps
- **Articles**: ID, title, content, excerpt, author, published status, category, timestamps
- **Resources**: ID, title, description, URL, type, author, category, file upload support, timestamps
- **Comments**: ID, content, author, article/resource reference, parent comment (for replies), approval status, timestamps
- **Likes**: ID, user, article/resource reference, timestamps (with uniqueness constraints)
- **Email Verifications**: ID, user_id, email, verification_code, purpose (email_verification/password_reset), attempts, expires_at, timestamps 📧 **NEW**
- **User Login History**: ID, user, login timestamp, IP address, user agent, success status, failure reason
- **User Notifications**: ID, user, title, message, type (info/warning/success/error), read status, expiration, timestamps

### **Storage Services**
- **Development**: Neon PostgreSQL database with real data persistence
- **Production Ready**: Full PostgreSQL schema with proper relationships and constraints
- **Authentication**: JWT tokens with HTTP-only cookies
- **Password Security**: bcrypt hashing with configurable rounds
- **Email Integration**: Gmail SMTP with professional templates

### **Sample Data Included**
- **Admin User**: Configured via environment variables (.dev.vars) 🔒 **SECURED**
- **Articles**: 3 pre-written faith articles (Welcome, Apologetics, Prayer Life)  
- **Resources**: 4 curated resources (Bible Gateway, Christian books, podcasts)

## User Guide

### **For Visitors**
1. Browse articles and resources without creating an account
2. Read full articles and access external resource links
3. Register for an account to contribute content and engage with community

### **For New Users** 📧 **ENHANCED**
1. **Registration Options**: 
   - **Email Registration**: Create account with email verification (OTP code required)
   - **Google OAuth**: Instant registration/login with Google account
2. **Email Verification**: Check email for OTP code and verify account before full access
3. **Account Recovery**: Use "Forgot Password" if needed - secure email-based recovery

### **For Regular Users** 
1. **Sign In**: Use email/password or Google OAuth to access your account
2. **Browse Content**: Read articles and explore resources created by moderators
3. **Engage with Content**: Like articles and resources that resonate with you
4. **Join Discussions**: Comment on articles and resources (requires verified email), reply to other comments
5. **Community Interaction**: Build relationships through meaningful discussion
6. **Account Management**: Change password and update settings in dashboard
7. **Profile Management**: View your activity and engagement history

### **For Moderators** (User role elevated by admin)
1. **Content Creation**: Use the **comprehensive rich text editor** to write formatted articles
2. **Resource Sharing**: Add helpful resources to the community library
3. **Rich Text Formatting**: Select text and apply headers, colors, lists, quotes, and more
4. **Community Moderation**: Help maintain quality discussions and content
5. **Dashboard Access**: Access expanded dashboard with content creation tools

### **For Administrators** 🆕 **ENHANCED**
1. **Access Admin Panel**: Click "Admin Panel" button in main dashboard
2. **Site Overview**: View comprehensive site statistics and metrics (✅ **Dashboard Fixed**)
3. **Content Management**: Create and edit articles with **full rich text editor**
4. **Advanced Formatting**: Use all formatting options including code blocks, subscript/superscript
5. **Resource Management**: Add and manage community resources
6. **User Management**: View all users, update roles, manage accounts
7. **Analytics**: Monitor site performance and user engagement with real data
8. **Quick Actions**: Fast access to common administrative tasks

### **Admin Credentials** 🔒 **SECURED**
- **Configuration**: Admin credentials are securely configured via environment variables
- **Location**: See `.dev.vars` file (gitignored) for current configuration
- **Current Admin**: Configured via environment variables (see .env.example)
- **Role**: admin (pre-configured with admin privileges)
- **Security**: No hardcoded credentials in source code - all configurable via environment

## Testing Authentication Flows 🔐 **NEW**

### **Email Registration & Verification Test**
1. Visit `/register` and create account with email/password
2. Check email for OTP verification code
3. Enter OTP to verify email address
4. Login with verified credentials

### **Google OAuth Test** 
1. Visit `/login` and click "Continue with Google"
2. Complete Google authentication
3. Automatically logged in with Google account
4. No email verification required for OAuth users

### **Password Recovery Test**
1. Visit `/forgot-password` 
2. Enter your email address
3. Check email for reset code
4. Enter reset code and new password
5. Login with new credentials

### **Dashboard Editor Test**
1. Login with any verified user credentials
2. Go to Dashboard → "Create Article" tab
3. Test Word-like formatting:
   - Type: "This is normal text with HEADING text and more normal text"
   - Select only "HEADING" (not the entire line)
   - Click H1 button
   - Result: Only "HEADING" becomes large and blue, surrounding text stays normal ✨

### **Admin Editor Test** 
1. Login with admin credentials (configured in .env.example)
2. Go to Admin Panel → Articles → "New Article" 
3. Test comprehensive formatting:
   - **Text Formatting**: Bold, italic, underline, strikethrough
   - **Headers**: H1-H4 on selected text portions
   - **Colors**: Text and background color pickers
   - **Lists**: Ordered, bullet, and interactive checklists
   - **Special**: Quotes, code, subscript/superscript
   - **Media**: Links and image uploads
   - **Alignment**: Left, center, right, justify

### **Admin Dashboard Statistics Test** ✅ **FIXED**
1. Login with admin credentials
2. Visit `/admin` - Dashboard shows real statistics instead of "Loading..."
3. Verify statistics display: user counts, article counts, resource counts, engagement metrics
4. Compare with `/admin/analytics` page to ensure data consistency

### **Key Difference from Old Editors** 🎯
- **Before**: Selecting text and clicking H1 would format the entire paragraph
- **After**: Selecting text and clicking H1 formats ONLY the selected text
- **Result**: Perfect Word-like precision for inline formatting within paragraphs

## Backend Features

### **Enhanced Authentication System** 🔐 **NEW**
- **Multi-Provider Support**: Email/password registration and Google OAuth integration
- **Email Verification**: OTP-based verification using Gmail SMTP integration
- **Password Recovery**: Secure forgot password flow with email-delivered reset codes
- **Password Security**: bcrypt hashing with configurable rounds
- **JWT Token Management**: HTTP-only cookies with automatic session management
- **Role-Based Access**: Admin, moderator, and user roles with appropriate permissions
- **Account Security**: Password change functionality and account management

### **Email Integration** 📧 **NEW**
- **Gmail SMTP**: Professional email delivery using hakunamatataministry@gmail.com
- **Email Templates**: Branded HTML emails for verification and password reset
- **OTP System**: Secure one-time password codes for verification and recovery
- **Email Security**: Verification requirements for commenting and site interaction

### **Content Management**
- Rich article creation with **comprehensive formatting editor**
- Resource library with categorization (book, website, podcast, etc.)
- Author attribution and timestamps
- Published/draft status for articles
- User ownership validation for content editing

### **API Design**
- RESTful API endpoints with consistent response format
- CORS-enabled for cross-origin requests
- Comprehensive error handling and validation
- Success/error response structure with detailed messages

## Features Not Yet Implemented
- **Enhanced Search**: Full-text search with filters (basic search UI implemented)
- **Social Features**: User profiles, following system, and user-to-user interactions
- **Content Analytics**: Detailed view tracking and engagement metrics
- **File Upload System**: Enhanced file upload for resources with cloud storage
- **Advanced Moderation**: Automated content filtering and approval workflows
- **Mobile App**: Native mobile application for iOS and Android
- **Email Notifications**: Expanded email notification system (account updates, content notifications)

## Recommended Next Steps

### **Phase 1: Search & Discovery**
1. **Enhanced Search**: Implement full-text search for articles and resources
2. **Content Categories**: Advanced tagging and categorization system
3. **Content Filters**: Filter by date, author, category, engagement metrics

### **Phase 2: Social Features**
1. **User Profiles**: Enhanced profiles with bios, social links, and activity history
2. **Following System**: User-to-user following and content feeds
3. **Notifications**: In-app notification system for mentions, replies, and updates

### **Phase 3: Analytics & Insights**
1. **Content Analytics**: Detailed view tracking, engagement metrics, and performance insights
2. **User Analytics**: User behavior analysis and engagement patterns
3. **Admin Insights**: Advanced admin analytics and reporting tools

### **Phase 4: Advanced Features**
1. **Mobile App**: Native mobile application for iOS and Android
2. **Advanced Security**: Two-factor authentication and enhanced security features
3. **API Expansion**: Public API for third-party integrations
4. **Performance Optimization**: Caching, CDN integration, and performance enhancements

## Deployment
- **Platform**: Cloudflare Pages (ready for deployment)
- **Status**: ✅ Development Active with **Enhanced Authentication & Admin Dashboard**
- **Tech Stack**: Hono + TypeScript + Vite + Custom Rich Text Editor + JWT Authentication + Google OAuth + Gmail Integration
- **Database**: Neon PostgreSQL (production ready)
- **Last Updated**: 2025-08-27
- **Latest Updates**: 
  - ✅ **Admin Dashboard Fixed** - Real statistics display instead of loading placeholders
  - ✅ **Security Hardened** - All credentials moved to environment variables
  - ✅ **Email System Complete** - Gmail integration with verification and recovery
  - ✅ **Google OAuth Integrated** - One-click authentication with Google accounts
  - ✅ **Password Recovery System** - Complete forgot password flow with email codes

## Development Commands
```bash
# Start development server
npm run build && pm2 start ecosystem.config.cjs

# Build for production  
npm run build

# Deploy to Cloudflare Pages
npm run deploy

# Test API endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/articles
```

## Project Structure
```
webapp/
├── src/
│   ├── index.tsx           # Main app with dashboard rich text editor
│   ├── renderer.tsx        # JSX renderer for main website
│   ├── api.ts             # API routes for authentication and content
│   ├── auth.ts            # Authentication utilities and middleware
│   ├── database-neon.ts   # Neon PostgreSQL database with real data
│   ├── email-service.ts   # 📧 Gmail email integration service
│   ├── google-auth.tsx    # 🔐 Google OAuth authentication routes
│   ├── admin-routes.tsx   # 🆕 Admin panel with comprehensive editor
│   ├── admin-renderer.tsx # 🆕 Admin-specific JSX renderer and layout
│   └── admin-api.ts       # 🆕 Admin API endpoints and functionality
├── public/
│   └── static/
│       ├── style.css           # Main website styling
│       ├── auth.js             # Authentication JavaScript
│       ├── dashboard.js        # Dashboard functionality
│       ├── admin.css          # 🆕 Admin panel styling (separate from main site)
│       ├── admin.js           # 🆕 Admin panel JavaScript functionality ✅ FIXED
│       ├── custom-editor.css  # 🎉 Rich text editor styles
│       └── custom-editor.js   # 🎉 Complete rich text editor implementation
├── .dev.vars             # 🔒 Environment variables with all credentials (gitignored)
├── ecosystem.config.cjs   # PM2 configuration
├── vite.config.ts        # Vite build configuration
├── wrangler.jsonc        # Cloudflare configuration
└── package.json          # Dependencies and scripts
```

## Testing the Backend

### **Test User Registration with Email Verification** 📧 **NEW**
```bash
# Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User", "password": "password123"}'

# Verify email (check email for OTP code)
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "code": "123456"}'
```

### **Test Password Recovery** 🔐 **NEW**
```bash
# Request password reset
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Reset password with code
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "code": "123456", "newPassword": "newpassword123"}'
```

### **Test Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@faithdefenders.com", "password": "your_admin_password"}'
```

### **Test Content APIs**
```bash
# Get articles
curl http://localhost:3000/api/articles

# Get resources  
curl http://localhost:3000/api/resources
```

### **Test Admin Panel** 🆕 **ENHANCED**
```bash
# Login with environment-configured admin user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@faithdefenders.com", "password": "your_admin_password"}' \
  -c cookies.txt

# Test admin analytics (requires authentication) ✅ FIXED
curl -b cookies.txt http://localhost:3000/admin/api/analytics

# Access admin dashboard (shows real statistics)
# Visit: https://3000-inazuof9eohwqpew3aev9.e2b.dev/admin
```

## 🎉 Complete Faith-Based Community Platform

The Faith Defenders website is now a **fully functional faith-based community platform** with:

### **🌟 Enhanced Authentication:**
- **Multi-Provider Login**: Email/password and Google OAuth integration
- **Email Verification**: OTP-based verification with Gmail integration  
- **Password Recovery**: Complete forgot password flow with email codes
- **Account Security**: Password change and account management features

### **📧 Professional Email System:**
- **Gmail Integration**: Professional email delivery with branded templates
- **Verification System**: Required email verification for full site access
- **Security Features**: Email verification blocks unverified users from commenting

### **⚡ Fixed Admin Panel:**
- **Real Statistics**: Dashboard displays actual data instead of loading placeholders ✅ **FIXED**
- **Data Consistency**: Fixed analytics endpoint data structure mismatch
- **Professional Interface**: Complete admin management with sidebar navigation
- **Comprehensive Management**: User roles, content creation, site analytics

### **🔒 Enhanced Security:**
- **Environment Variables**: All credentials securely moved from source code ✅ **SECURED**
- **No Hardcoded Data**: Admin credentials, email settings, and API keys in .dev.vars
- **Production Ready**: Secure configuration for deployment

### **📝 Revolutionary Rich Text Editor:**
- **Word-like precision** - format selected text portions, not entire paragraphs
- **Complete formatting suite** - text, headers, colors, lists, quotes, code, media
- **Professional toolbar** - organized groups with comprehensive options
- **Form integration** - seamless submission with existing backend
- **Multi-instance** - consistent experience across dashboard and admin panel
- **No dependencies** - built from scratch, replacing Quill.js and TinyMCE completely

**✨ The platform now provides a complete, secure, and professional faith-based community experience with enhanced authentication, email integration, and a fully functional admin dashboard!**

**Ready for production deployment** with PostgreSQL integration and Cloudflare Pages hosting!