import { jsxRenderer } from 'hono/jsx-renderer'

export const adminRenderer = jsxRenderer(({ children, title }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title ? `${title} - Faith Defenders Admin` : 'Faith Defenders Admin'}</title>
        <link href="/static/admin.css" rel="stylesheet" />
        <link href="/static/custom-editor.css" rel="stylesheet" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* Simple custom editor CSS */}
        {/* PDF.js for file content extraction */}
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
      </head>
      <body class="admin-body">
        {children}
        {/* No external rich text editors */}
        <script src="/static/admin.js"></script>
        <script src="/static/custom-editor.js"></script>
      </body>
    </html>
  )
})

interface AdminLayoutProps {
  children: any;
  currentUser: any;
  currentPage?: string;
  breadcrumb?: string;
}

export function AdminLayout({ children, currentUser, currentPage = 'dashboard', breadcrumb = 'Dashboard' }: AdminLayoutProps) {
  return (
    <div class="admin-container">
      {/* Sidebar Navigation */}
      <nav class="admin-sidebar" id="admin-sidebar">
        <div class="admin-sidebar-header">
          <a href="/admin" class="admin-logo">
            <i class="fas fa-shield-alt"></i> Faith Defenders
          </a>
        </div>
        
        <div class="admin-nav">
          <div class="admin-nav-section">
            <div class="admin-nav-title">Overview</div>
            <a href="/admin" class={`admin-nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}>
              <i class="fas fa-chart-pie"></i>
              Dashboard
            </a>
            <a href="/admin/analytics" class={`admin-nav-link ${currentPage === 'analytics' ? 'active' : ''}`}>
              <i class="fas fa-chart-line"></i>
              Analytics
            </a>
          </div>
          
          <div class="admin-nav-section">
            <div class="admin-nav-title">Content Management</div>
            <a href="/admin/articles" class={`admin-nav-link ${currentPage === 'articles' ? 'active' : ''}`}>
              <i class="fas fa-newspaper"></i>
              Articles
            </a>
            <a href="/admin/resources" class={`admin-nav-link ${currentPage === 'resources' ? 'active' : ''}`}>
              <i class="fas fa-book"></i>
              Resources
            </a>
            <a href="/admin/categories" class={`admin-nav-link ${currentPage === 'categories' ? 'active' : ''}`}>
              <i class="fas fa-tags"></i>
              Categories
            </a>
          </div>
          
          <div class="admin-nav-section">
            <div class="admin-nav-title">User Management</div>
            <a href="/admin/users" class={`admin-nav-link ${currentPage === 'users' ? 'active' : ''}`}>
              <i class="fas fa-users"></i>
              Users
            </a>
            <a href="/admin/roles" class={`admin-nav-link ${currentPage === 'roles' ? 'active' : ''}`}>
              <i class="fas fa-user-shield"></i>
              Roles & Permissions
            </a>
          </div>
          
          <div class="admin-nav-section">
            <div class="admin-nav-title">Settings</div>
            <a href="/admin/settings" class={`admin-nav-link ${currentPage === 'settings' ? 'active' : ''}`}>
              <i class="fas fa-cog"></i>
              Site Settings
            </a>
            <a href="/admin/backup" class={`admin-nav-link ${currentPage === 'backup' ? 'active' : ''}`}>
              <i class="fas fa-download"></i>
              Backup & Export
            </a>
          </div>
          
          <div class="admin-nav-section">
            <div class="admin-nav-title">Actions</div>
            <a href="/" class="admin-nav-link" target="_blank">
              <i class="fas fa-external-link-alt"></i>
              View Site
            </a>
            <a href="#" class="admin-nav-link" onclick="adminLogout()">
              <i class="fas fa-sign-out-alt"></i>
              Logout
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main class="admin-main">
        {/* Header */}
        <header class="admin-header">
          <div class="admin-breadcrumb">
            <a href="/admin">Admin</a>
            <span>/</span>
            <span>{breadcrumb}</span>
          </div>
          
          <div class="admin-user-info">
            <div class="admin-user-avatar">
              {currentUser?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <div style="font-weight: 500; font-size: 0.9rem;">{currentUser?.name || 'Administrator'}</div>
              <div style="font-size: 0.8rem; color: #64748b;">{currentUser?.role || 'Admin'}</div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div class="admin-content">
          {children}
        </div>
      </main>
      
      {/* Mobile Menu Toggle */}
      <button class="admin-mobile-toggle" onclick="toggleAdminSidebar()" style="display: none;">
        <i class="fas fa-bars"></i>
      </button>
    </div>
  )
}