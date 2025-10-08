import { Context } from 'hono'

interface NavigationProps {
  c: Context
  user?: any
}

export async function Navigation({ c, user }: NavigationProps) {
  const currentPath = c.req.path

  return (
    <nav className="global-navigation" role="navigation" aria-label="Main navigation">
      <div className="nav-container">
        {/* Brand/Logo */}
        <div className="nav-brand">
          <a href="/" className="brand-link">
            <h1 className="brand-title">Faith Defenders</h1>
            <span className="brand-tagline">Defending the Faith</span>
          </a>
        </div>

        {/* Desktop Navigation Menu */}
        <div className="nav-menu" id="nav-menu">
          <ul className="nav-links" role="menubar">
            <li role="none">
              <a href="/" className={`nav-link ${currentPath === '/' ? 'active' : ''}`} role="menuitem">
                <i className="fas fa-home" aria-hidden="true"></i>
                <span>Home</span>
              </a>
            </li>
            <li role="none">
              <a href="/articles" className={`nav-link ${currentPath.startsWith('/articles') ? 'active' : ''}`} role="menuitem">
                <i className="fas fa-newspaper" aria-hidden="true"></i>
                <span>Articles</span>
              </a>
            </li>
            <li role="none">
              <a href="/resources" className={`nav-link ${currentPath.startsWith('/resources') ? 'active' : ''}`} role="menuitem">
                <i className="fas fa-book" aria-hidden="true"></i>
                <span>Resources</span>
              </a>
            </li>
            <li role="none">
              <a href="/tools" className={`nav-link ${currentPath.startsWith('/tools') ? 'active' : ''}`} role="menuitem">
                <i className="fas fa-tools" aria-hidden="true"></i>
                <span>Tools</span>
              </a>
            </li>
            <li role="none">
              <a href="/podcasts" className={`nav-link ${currentPath.startsWith('/podcasts') ? 'active' : ''}`} role="menuitem">
                <i className="fas fa-podcast" aria-hidden="true"></i>
                <span>Podcasts</span>
              </a>
            </li>
            <li role="none">
              <a href="/about" className={`nav-link ${currentPath === '/about' ? 'active' : ''}`} role="menuitem">
                <i className="fas fa-info-circle" aria-hidden="true"></i>
                <span>About</span>
              </a>
            </li>
          </ul>
        </div>

        {/* User Actions */}
        <div className="nav-actions">
          {user ? (
            <div className="user-menu">
              <button className="user-toggle" id="user-toggle" aria-expanded="false" aria-haspopup="true">
                <div className="user-avatar">
                  <i className="fas fa-user-circle" aria-hidden="true"></i>
                </div>
                <span className="user-name">Hello, {user.name}</span>
                <i className="fas fa-chevron-down" aria-hidden="true"></i>
              </button>
              <div className="user-dropdown" id="user-dropdown" role="menu" aria-label="User menu">
                <a href="/dashboard" className="dropdown-item" role="menuitem">
                  <i className="fas fa-tachometer-alt" aria-hidden="true"></i>
                  <span>Dashboard</span>
                </a>
                <a href="/dashboard?tab=settings" className="dropdown-item" role="menuitem">
                  <i className="fas fa-cog" aria-hidden="true"></i>
                  <span>Settings</span>
                </a>
                {(user.role === 'admin' || user.role === 'moderator') && (
                  <a href={user.role === 'admin' ? '/admin' : '/admin/articles'} className="dropdown-item" role="menuitem">
                    <i className="fas fa-shield-alt" aria-hidden="true"></i>
                    <span>Admin Panel</span>
                  </a>
                )}
                <div className="dropdown-divider" role="separator"></div>
                <button className="dropdown-item logout-btn" onclick="handleLogout()" role="menuitem">
                  <i className="fas fa-sign-out-alt" aria-hidden="true"></i>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-actions">
              <a href={`/login?redirect=${encodeURIComponent(currentPath)}`} className="btn-login">
                <i className="fas fa-sign-in-alt" aria-hidden="true"></i>
                <span>Sign In</span>
              </a>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button className="mobile-menu-toggle" id="mobile-menu-toggle" aria-label="Toggle mobile menu" aria-expanded="false">
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div className="mobile-menu-overlay" id="mobile-menu-overlay"></div>

      {/* Mobile Menu */}
      <div className="mobile-menu" id="mobile-menu" aria-hidden="true">
        <div className="mobile-menu-header">
          <div className="mobile-menu-brand">
            <h2>Faith Defenders</h2>
            <p>Defending the Faith</p>
          </div>
          <button className="mobile-menu-close" id="mobile-menu-close" aria-label="Close mobile menu">
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>

        <nav className="mobile-nav-menu">
          <ul className="mobile-nav-links" role="menubar">
            <li role="none">
              <a href="/" className={`mobile-nav-link ${currentPath === '/' ? 'active' : ''}`} role="menuitem">
                <i className="fas fa-home" aria-hidden="true"></i>
                <span>Home</span>
              </a>
            </li>
            <li role="none">
              <a href="/articles" className={`mobile-nav-link ${currentPath.startsWith('/articles') ? 'active' : ''}`} role="menuitem">
                <i className="fas fa-newspaper" aria-hidden="true"></i>
                <span>Articles</span>
              </a>
            </li>
            <li role="none">
              <a href="/resources" className={`mobile-nav-link ${currentPath.startsWith('/resources') ? 'active' : ''}`} role="menuitem">
                <i className="fas fa-book" aria-hidden="true"></i>
                <span>Resources</span>
              </a>
            </li>
            <li role="none">
              <a href="/tools" className={`mobile-nav-link ${currentPath.startsWith('/tools') ? 'active' : ''}`} role="menuitem">
                <i className="fas fa-tools" aria-hidden="true"></i>
                <span>Tools</span>
              </a>
            </li>
            <li role="none">
              <a href="/podcasts" className={`mobile-nav-link ${currentPath.startsWith('/podcasts') ? 'active' : ''}`} role="menuitem">
                <i className="fas fa-podcast" aria-hidden="true"></i>
                <span>Podcasts</span>
              </a>
            </li>
            <li role="none">
              <a href="/about" className={`mobile-nav-link ${currentPath === '/about' ? 'active' : ''}`} role="menuitem">
                <i className="fas fa-info-circle" aria-hidden="true"></i>
                <span>About</span>
              </a>
            </li>
          </ul>

          {/* Mobile User Section */}
          <div className="mobile-user-section">
            {user ? (
              <div className="mobile-user-info">
                <div className="mobile-user-avatar">
                  <i className="fas fa-user-circle" aria-hidden="true"></i>
                </div>
                <div className="mobile-user-details">
                  <h3>{user.name}</h3>
                  <p>{user.email}</p>
                </div>
              </div>
            ) : (
              <div className="mobile-auth-section">
                <p>Join our community</p>
                <a href={`/login?redirect=${encodeURIComponent(currentPath)}`} className="mobile-login-btn">
                  <i className="fas fa-sign-in-alt" aria-hidden="true"></i>
                  Sign In
                </a>
              </div>
            )}
          </div>
        </nav>
      </div>
    </nav>
  )
}

export default Navigation