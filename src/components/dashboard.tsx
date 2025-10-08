import { Context } from 'hono'
import { Footer } from './footer'

interface DashboardProps {
  c: Context
  welcome?: boolean
}

// Dashboard Component
export async function Dashboard({ c, welcome }: DashboardProps) {
  const user = await getLoggedInUser(c)

  if (!user) {
    // Redirect logic would be handled in the route
    return null
  }

  const settings = c.get('settings') || {}
  const isWelcome = welcome === true

  return (
    <div className="min-h-screen">
      <main className="dashboard-content">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <h1 className="page-title">Welcome, {user.name}!</h1>
            <p className="page-subtitle">Manage your articles and resources</p>

            {!user.email_verified && (settings.auth_provider !== 'google') && (
              <div className="verification-warning">
                <div className="warning-card">
                  <div className="warning-icon">⚠️</div>
                  <div className="warning-content">
                    <h4>Email Verification Required</h4>
                    <p>Please verify your email address to fully activate your account and ensure you can receive important updates.</p>
                    <div className="warning-actions">
                      <a href={`/verify-email?userId=${user.id}`} className="btn-warning">Verify Email Now</a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isWelcome && (
              <div className="welcome-message">
                <div className="welcome-card">
                  <h3>🎉 Welcome to Faith Defenders!</h3>
                  <p>Your account has been successfully created. You can now create articles, manage resources, and engage with our community.</p>
                  <div className="welcome-actions">
                    <a href="/dashboard?tab=create-article" className="btn-primary">Write Your First Article</a>
                    <button onclick="this.parentElement.parentElement.parentElement.style.display='none'" className="btn-secondary">Got it!</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="dashboard-tabs">
            <button className="tab-btn active" onclick="showTab('overview')">Overview</button>
            <button className="tab-btn" onclick="showTab('settings')">Settings</button>
            {(user.role === 'admin' || user.role === 'moderator') && (
              <a href={user.role === 'admin' ? '/admin' : '/admin/articles'} className="tab-btn" style={{ background: '#1e40af', color: 'white', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fas fa-shield-alt"></i>
                Admin Panel
              </a>
            )}
          </div>

          {/* Overview Tab */}
          <div id="overview-tab" className="tab-content">
            <div className="dashboard-welcome">
              <h3>Welcome to your Dashboard!</h3>
              <p>Here you can view your activity, manage your account settings, and access content.</p>

              {(user.role !== 'admin' && user.role !== 'moderator') && (
                <div className="content-creation-notice">
                  <div className="notice-card">
                    <i className="fas fa-info-circle"></i>
                    <div>
                      <h4>Want to Contribute Content?</h4>
                      <p>Content creation is handled through our admin panel to ensure quality and consistency.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="dashboard-stats">
              <div className="stat-card">
                <h3>Total Articles</h3>
                <div className="stat-number" id="user-articles-count">-</div>
              </div>
              <div className="stat-card">
                <h3>Total Resources</h3>
                <div className="stat-number" id="user-resources-count">-</div>
              </div>
            </div>
            <div id="user-content"></div>
          </div>

          {/* Settings Tab */}
          <div id="settings-tab" className="tab-content" style={{ display: 'none' }}>
            <div className="settings-section">
              <h3>Account Settings</h3>

              <div className="settings-card">
                <h4>Account Information</h4>
                <div className="account-info">
                  <div className="info-row">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{user.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{user.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Role:</span>
                    <span className="info-value">{user.role}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Account Type:</span>
                    <span className="info-value">{settings.auth_provider === 'google' ? 'Google OAuth' : 'Email/Password'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Email Verified:</span>
                    <span className="info-value">
                      {user.email_verified ? (
                        <span className="status-verified">✓ Verified</span>
                      ) : (
                        <span className="status-unverified">⚠ Not Verified</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional settings would go here... */}
            </div>
          </div>

          <div id="dashboard-message" className="dashboard-message"></div>
        </div>
      </main>

      <Footer c={c} />

      {/* Service Worker Registration */}
      <script dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js')
                .then(function(registration) {
                console.log('Service Worker registered successfully:', registration.scope);
              })
              .catch(function(error) {
                console.log('Service Worker registration failed:', error);
              });
            });
          }
        `
      }}></script>

      {/* Load auth.js for user dropdown functionality */}
      <script src="/static/auth.js"></script>
      <script src="/static/dashboard.js"></script>
      <script src="/static/custom-editor.js"></script>
    </div>
  )
}

async function getLoggedInUser(c: Context) {
  try {
    const { getLoggedInUser } = await import('../auth')
    return await getLoggedInUser(c)
  } catch (error) {
    console.error('Error getting logged in user:', error)
    return null
  }
}

export default Dashboard
