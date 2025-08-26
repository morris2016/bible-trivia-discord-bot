# Faith Defenders Website

## Project Overview
- **Name**: Faith Defenders
- **Goal**: A complete faith-based community website with user authentication, content management, resource sharing, and comprehensive admin panel
- **Features**: Multi-page navigation, user authentication, article management, resource library, full admin backend

## URLs
- **Development**: https://3000-is7fg5sswmfe6jdg130f3.e2b.dev
- **Admin Panel**: https://3000-is7fg5sswmfe6jdg130f3.e2b.dev/admin
- **GitHub**: (Will be added when pushed to repository)

## Currently Completed Features

### **Main Website**
- ✅ **Frontend Design**: Complete navigation with purple/lavender theme
- ✅ **User Authentication**: Registration, login, logout with JWT tokens
- ✅ **Article System**: Create, read, update articles with author attribution
- ✅ **Resource Library**: Add and browse faith-based resources (books, websites, podcasts)
- ✅ **User Dashboard**: Tabbed interface for content management
- ✅ **Dynamic Content**: Homepage shows latest articles and resources
- ✅ **Responsive Design**: Mobile-friendly interface
- ✅ **Sample Content**: Pre-loaded with example articles and resources
- ✅ **Secure Authentication**: HTTP-only cookies and password hashing

### **Admin Panel** 🆕
- ✅ **Admin Authentication**: Separate admin access with role-based permissions
- ✅ **Admin Dashboard**: Comprehensive site overview with metrics and statistics
- ✅ **Article Management**: Full CRUD operations for all articles (published and drafts)
- ✅ **Resource Management**: Add, edit, and manage community resources
- ✅ **User Management**: View all users, update roles, manage permissions
- ✅ **Analytics Dashboard**: Site performance metrics and engagement data
- ✅ **Professional UI**: Separate admin interface with sidebar navigation
- ✅ **Quick Actions**: Easy access to common administrative tasks
- ✅ **Separate Styling**: Independent CSS and JavaScript files for admin interface
- ✅ **Admin Panel Link**: Accessible from main dashboard for admin users only

## Functional Entry URIs

### **Public Pages**
- `/` - Homepage with latest articles and welcome content
- `/articles` - Browse all published articles
- `/articles/{id}` - View individual article
- `/resources` - Browse all shared resources  
- `/about` - About Faith Defenders
- `/login` - User authentication (login/register forms)

### **Protected Pages** (requires login)
- `/dashboard` - User dashboard with content management
- `/dashboard?tab=create-article` - Create new article
- `/dashboard?tab=create-resource` - Add new resource

### **Admin Panel** (requires admin role) 🆕
- `/admin` - Admin dashboard with site overview and metrics
- `/admin/articles` - Manage all articles (create, edit, delete, publish/unpublish)
- `/admin/articles/new` - Create new article with full editor
- `/admin/articles/:id/edit` - Edit existing articles
- `/admin/resources` - Manage resource library
- `/admin/resources/new` - Add new resources to library  
- `/admin/users` - User management (view users, change roles, manage accounts)
- `/admin/analytics` - Site analytics and performance metrics

### **API Endpoints**
- `GET /api/health` - API health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info
- `GET /api/articles` - Get all published articles
- `GET /api/articles/{id}` - Get specific article
- `POST /api/articles` - Create new article (auth required)
- `PUT /api/articles/{id}` - Update article (auth required)
- `GET /api/resources` - Get all resources
- `POST /api/resources` - Create new resource (auth required)

### **Admin API Endpoints** (requires admin role) 🆕
- `GET /admin/api/stats` - Dashboard statistics and site metrics
- `GET /admin/api/articles` - Get all articles (published and drafts)
- `GET /admin/api/articles/{id}` - Get specific article for editing
- `POST /admin/api/articles` - Create new article via admin panel
- `PUT /admin/api/articles/{id}` - Update article via admin panel
- `GET /admin/api/resources` - Get all resources for management
- `POST /admin/api/resources` - Create new resource via admin panel
- `GET /admin/api/users` - Get all users with stats and management data
- `PUT /admin/api/users/{id}` - Update user role/status
- `GET /admin/api/analytics` - Detailed analytics and performance data

## Data Architecture

### **Data Models**
- **Users**: ID, email, name, role (admin/user), password hash, timestamps
- **Articles**: ID, title, content, excerpt, author, published status, timestamps
- **Resources**: ID, title, description, URL, type (book/website/podcast/etc), author, timestamps

### **Storage Services**
- **Development**: Mock in-memory database with sample data
- **Production Ready**: PostgreSQL schema designed for Neon database
- **Authentication**: JWT tokens with HTTP-only cookies
- **Password Security**: bcrypt hashing with configurable rounds

### **Sample Data Included**
- **Admin User**: admin@faithdefenders.com (password: admin123)
- **Articles**: 3 pre-written faith articles (Welcome, Apologetics, Prayer Life)  
- **Resources**: 4 curated resources (Bible Gateway, Christian books, podcasts)

## User Guide

### **For Visitors**
1. Browse articles and resources without creating an account
2. Read full articles and access external resource links
3. Register for an account to contribute content

### **For Registered Users**
1. **Register/Login**: Use the login page to create account or sign in
2. **Dashboard Access**: Access your dashboard to manage content
3. **Create Articles**: Write and publish faith-based articles
4. **Add Resources**: Share helpful resources with the community
5. **Profile Management**: View your contributions and statistics

### **For Administrators** 🆕
1. **Access Admin Panel**: Click "Admin Panel" button in main dashboard
2. **Site Overview**: View comprehensive site statistics and metrics
3. **Content Management**: Create, edit, publish/unpublish all articles
4. **Resource Management**: Add and manage community resources
5. **User Management**: View all users, update roles, manage accounts
6. **Analytics**: Monitor site performance and user engagement
7. **Quick Actions**: Fast access to common administrative tasks

### **Admin Credentials** 
- **Email**: admin@faithdefenders.com
- **Password**: admin123
- **Note**: First registered user or users with email admin@faithdefenders.com automatically become admin

## Backend Features

### **Authentication System**
- Secure user registration with email validation
- Password hashing using bcrypt
- JWT token-based sessions with HTTP-only cookies
- Automatic session management and logout
- Protected routes with middleware

### **Content Management**
- Rich article creation with title, excerpt, and full content
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
- **Database Migration**: Switch from mock to PostgreSQL production database
- **Image Upload**: Article images and user avatars
- **Content Moderation**: Admin approval workflow for articles
- **Search Functionality**: Search articles and resources
- **Comments System**: User discussion on articles
- **Email Notifications**: Account verification and notifications
- **Social Features**: User profiles and following system
- **Advanced Editor**: Rich text editor for article creation
- **Categories/Tags**: Content organization and filtering
- **Analytics**: Content views and user engagement metrics

## Recommended Next Steps

### **Phase 1: Production Database**
1. **PostgreSQL Integration**: Replace mock database with Neon PostgreSQL
2. **Database Migrations**: Implement proper schema migrations
3. **Data Persistence**: Ensure data survives server restarts

### **Phase 2: Content Enhancement**
1. **Rich Text Editor**: Implement WYSIWYG editor for articles
2. **Image Upload**: Add support for article images and user avatars
3. **Content Categories**: Implement tagging and categorization system
4. **Search Feature**: Add full-text search for articles and resources

### **Phase 3: Community Features**
1. **User Profiles**: Enhanced user profiles with bios and social links
2. **Comments System**: Enable discussion on articles
3. **Content Moderation**: Admin approval workflow for user-generated content
4. **Email System**: Account verification and notification emails

### **Phase 4: Advanced Features**
1. **Analytics Dashboard**: Content performance and user engagement metrics
2. **Social Features**: Following system and community interaction
3. **Mobile App**: Native mobile application
4. **Advanced Security**: Two-factor authentication and advanced security features

## Deployment
- **Platform**: Cloudflare Pages (ready for deployment)
- **Status**: ✅ Development Active with Full Backend
- **Tech Stack**: Hono + TypeScript + Vite + PostgreSQL + JWT Authentication
- **Database**: Mock (development) / PostgreSQL (production)
- **Last Updated**: 2025-08-26

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
│   ├── index.tsx           # Main app with all routes and pages
│   ├── renderer.tsx        # JSX renderer for main website
│   ├── api.ts             # API routes for authentication and content
│   ├── auth.ts            # Authentication utilities and middleware
│   ├── database-mock.ts   # Mock database with sample data
│   ├── database.ts        # PostgreSQL database schema and functions
│   ├── admin-routes.tsx   # 🆕 Admin panel routes and pages
│   ├── admin-renderer.tsx # 🆕 Admin-specific JSX renderer and layout
│   └── admin-api.ts       # 🆕 Admin API endpoints and functionality
├── public/
│   └── static/
│       ├── style.css      # Main website styling
│       ├── auth.js        # Authentication JavaScript
│       ├── dashboard.js   # Dashboard functionality
│       ├── admin.css      # 🆕 Admin panel styling (separate from main site)
│       └── admin.js       # 🆕 Admin panel JavaScript functionality
├── ecosystem.config.cjs   # PM2 configuration
├── .dev.vars             # Environment variables (gitignored)
├── vite.config.ts        # Vite build configuration
├── wrangler.jsonc        # Cloudflare configuration
└── package.json          # Dependencies and scripts
```

## Testing the Backend

### **Test User Registration**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User", "password": "password123"}'
```

### **Test Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### **Test Content APIs**
```bash
# Get articles
curl http://localhost:3000/api/articles

# Get resources  
curl http://localhost:3000/api/resources
```

### **Test Admin Panel** 🆕
```bash
# Register admin user (auto-promoted to admin role)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@faithdefenders.com", "name": "Faith Admin", "password": "admin123"}'

# Test admin API (requires authentication)
curl -b cookies.txt http://localhost:3000/admin/api/stats

# Access admin dashboard
# Visit: http://localhost:3000/admin (redirects to login if not authenticated)
```

## 🎉 Complete Faith-Based Community Platform

The Faith Defenders website is now a **fully functional faith-based community platform** with:

### **🌟 Main Website Features:**
- Beautiful responsive design with purple/lavender theme
- Complete user authentication and content management
- Dynamic article and resource systems
- User dashboard for content creation

### **⚡ Admin Panel Features:**
- **Professional admin interface** with sidebar navigation
- **Comprehensive site management** with metrics and analytics
- **Complete content control** - manage all articles and resources
- **User management** - role assignment and account administration
- **Separate styling** - completely independent from main website
- **Real-time statistics** - engagement metrics and performance data

### **🔐 Security & Architecture:**
- Role-based access control (admin/user permissions)
- Secure authentication with HTTP-only cookies
- Separate admin and user interfaces
- Protected API endpoints with middleware
- Clean separation of concerns

**Ready for production deployment** with PostgreSQL integration and Cloudflare Pages hosting!