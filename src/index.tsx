import { Hono } from 'hono'
import { renderer } from './renderer'
import { initializeDatabase, getArticles, getResources } from './database-neon'
import { getLoggedInUser } from './auth'
import api from './api'
import adminApp from './admin-routes'
import googleAuthApp from './google-auth'


const app = new Hono()

// Database will be initialized on first request

// User context middleware - MUST be before route mounting
app.use('*', async (c, next) => {
  try {
    const user = await getLoggedInUser(c);
    c.set('user', user);
    c.set('userId', user?.id);
    c.set('userRole', user?.role || 'guest');
  } catch (error) {
    console.error('Error setting user context:', error);
  }
  await next();
})

// Mount API routes
app.route('/api', api)

// Mount admin routes
app.route('/admin', adminApp)

// Mount Google OAuth routes
app.route('/auth', googleAuthApp)

app.use(renderer)

app.get('/', async (c) => {
  try {
    const user = await getLoggedInUser(c);
    const recentArticles = await getArticles(true);
    const featuredArticles = recentArticles.slice(0, 3); // Show first 3 articles
    
    return c.render(
      <div className="min-h-screen">
        {/* Navigation Header */}
        <nav className="nav-header">
          <div className="nav-container">
            <div className="nav-brand">
              <h1>Faith Defenders</h1>
            </div>
            <div className="nav-menu">
              <a href="/" className="nav-link active">Home</a>
              <a href="/articles" className="nav-link">Articles</a>
              <a href="/resources" className="nav-link">resources</a>
              <a href="/about" className="nav-link">About</a>
              {user ? (
                <>
                  <a href="/dashboard" className="nav-link">Dashboard</a>
                  <span className="nav-link user-info">Hello, {user.name}</span>
                </>
              ) : (
                <a href="/login" className="nav-link">login</a>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="main-content">
          <div className="content-container">
            <h1 className="page-title">Welcome to Faith Defenders</h1>
            <p className="page-subtitle">Defending and sharing the Christian faith through articles, resources, and community.</p>
            
            {featuredArticles.length > 0 ? (
              <div className="featured-articles">
                <h2 className="section-title">Latest Articles</h2>
                <div className="articles-grid">
                  {featuredArticles.map((article) => (
                    <div key={article.id} className="article-card">
                      <h3 className="article-title">
                        <a href={`/articles/${article.id}`}>{article.title}</a>
                      </h3>
                      <p className="article-excerpt">{article.excerpt}</p>
                      <div className="article-meta">
                        By {article.author_name} • {new Date(article.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="view-all">
                  <a href="/articles" className="btn-primary">View All Articles</a>
                </div>
              </div>
            ) : (
              <div className="homepage-cta">
                <div className="cta-content">
                  <h2 className="cta-title">Join Our Community</h2>
                  <p className="cta-description">
                    Explore resources, share insights, and connect with fellow believers in defending and growing in the Christian faith.
                  </p>
                  <div className="cta-actions">
                    <a href="/articles" className="btn-primary">Explore Articles</a>
                    <a href="/resources" className="btn-secondary">Browse Resources</a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    )
  } catch (error) {
    console.error('Error loading homepage:', error);
    return c.render(
      <div className="min-h-screen">
        <nav className="nav-header">
          <div className="nav-container">
            <div className="nav-brand">
              <h1>Faith Defenders</h1>
            </div>
            <div className="nav-menu">
              <a href="/" className="nav-link active">Home</a>
              <a href="/articles" className="nav-link">Articles</a>
              <a href="/resources" className="nav-link">resources</a>
              <a href="/about" className="nav-link">About</a>
              <a href="/login" className="nav-link">login</a>
            </div>
          </div>
        </nav>
        <main className="main-content">
          <div className="content-container">
            <h1 className="page-title">Welcome to Faith Defenders</h1>
            <p className="page-subtitle">Defending and sharing the Christian faith through articles, resources, and community.</p>
          </div>
        </main>
      </div>
    )
  }
})

// Additional routes for navigation
app.get('/articles', async (c) => {
  try {
    const user = await getLoggedInUser(c);
    const articles = await getArticles(true);
    
    return c.render(
      <div className="min-h-screen">
        <nav className="nav-header">
          <div className="nav-container">
            <div className="nav-brand">
              <h1>Faith Defenders</h1>
            </div>
            <div className="nav-menu">
              <a href="/" className="nav-link">Home</a>
              <a href="/articles" className="nav-link active">Articles</a>
              <a href="/resources" className="nav-link">resources</a>
              <a href="/about" className="nav-link">About</a>
              {user ? (
                <>
                  <a href="/dashboard" className="nav-link">Dashboard</a>
                  <span className="nav-link user-info">Hello, {user.name}</span>
                </>
              ) : (
                <a href="/login" className="nav-link">login</a>
              )}
            </div>
          </div>
        </nav>
        {/* Search and Filter Bar - Positioned higher near navigation */}
        <div className="search-filter-container">
          <div className="search-bar">
            <div className="search-input-wrapper">
              <i className="fas fa-search search-icon"></i>
              <input 
                type="text" 
                id="articles-search" 
                className="search-input" 
                placeholder="Search articles..."
                autoComplete="off"
              />
              <button type="button" id="clear-search" className="clear-search" style="display: none;">
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div className="filter-controls">
            <select id="category-filter" className="filter-select">
              <option value="">All Categories</option>
              {/* Categories loaded dynamically */}
            </select>
            <select id="sort-filter" className="filter-select">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">A-Z</option>
            </select>
            <button type="button" id="toggle-filters" className="filter-toggle">
              <i className="fas fa-sliders-h"></i>
              <span>Filters</span>
            </button>
          </div>
        </div>
        
        <main className="main-content has-search">
          <div className="content-container with-search">
            <div className="page-header with-search">
              <h1 className="page-title">Articles</h1>
              <p className="page-subtitle">Browse our collection of faith-based articles and insights.</p>
              {user && (user.role === 'admin' || user.role === 'moderator') && (
                <a href="/dashboard?tab=create-article" className="btn-primary">Write New Article</a>
              )}
            </div>
          </div>
          
          {/* Search Results Info */}
          <div id="search-results-info" className="search-results-info" style="display: none;">
            <span id="results-count"></span>
            <button type="button" id="clear-all-filters" className="clear-filters-btn">
              <i className="fas fa-times"></i> Clear All
            </button>
          </div>
          
          <div className="content-container">
            {articles.length > 0 ? (
              <div id="articles-container" className="articles-list">
                {articles.map((article) => (
                  <div key={article.id} className="article-item" data-category={article.category_name || ''}>
                    <h3 className="article-title">
                      <a href={`/articles/${article.id}`}>{article.title}</a>
                    </h3>
                    {article.category_name && (
                      <div className="article-category">
                        <span className="category-badge">{article.category_name}</span>
                      </div>
                    )}
                    <p className="article-excerpt">{article.excerpt}</p>
                    <div className="article-meta">
                      By {article.author_name} • {new Date(article.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div id="articles-container" className="empty-state">
                <div className="empty-state-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="empty-state-title">No Articles Yet</h3>
                <p className="empty-state-description">
                  This is where inspiring faith-based articles will appear. Start building our community knowledge by sharing your insights, biblical reflections, or theological discussions.
                </p>
                <div className="empty-state-actions">
                  {user && (user.role === 'admin' || user.role === 'moderator') ? (
                    <a href="/dashboard?tab=create-article" className="btn-primary">
                      ✍️ Write the First Article
                    </a>
                  ) : user ? (
                    <div className="empty-state-login">
                      <p>Only moderators can create articles.</p>
                      <a href="/about" className="btn-secondary">Learn More</a>
                    </div>
                  ) : (
                    <div className="empty-state-login">
                      <p>Ready to contribute?</p>
                      <a href="/login" className="btn-primary">Sign In to Write</a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
        
        {/* Search and Filter JavaScript */}
        <script src="/static/search.js"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              if (typeof initializeArticlesSearch === 'function') {
                initializeArticlesSearch();
              }
            });
          `
        }}></script>
      </div>
    )
  } catch (error) {
    console.error('Error loading articles:', error);
    return c.render(
      <div className="min-h-screen">
        <nav className="nav-header">
          <div className="nav-container">
            <div className="nav-brand">
              <h1>Faith Defenders</h1>
            </div>
            <div className="nav-menu">
              <a href="/" className="nav-link">Home</a>
              <a href="/articles" className="nav-link active">Articles</a>
              <a href="/resources" className="nav-link">resources</a>
              <a href="/about" className="nav-link">About</a>
              <a href="/login" className="nav-link">login</a>
            </div>
          </div>
        </nav>
        <main className="main-content">
          <div className="content-container">
            <h1 className="page-title">Articles</h1>
            <p className="page-subtitle">Browse our collection of faith-based articles and insights.</p>
          </div>
        </main>
      </div>
    )
  }
})

app.get('/resources', async (c) => {
  try {
    const user = await getLoggedInUser(c);
    const resources = await getResources();
    
    return c.render(
      <div className="min-h-screen">
        <nav className="nav-header">
          <div className="nav-container">
            <div className="nav-brand">
              <h1>Faith Defenders</h1>
            </div>
            <div className="nav-menu">
              <a href="/" className="nav-link">Home</a>
              <a href="/articles" className="nav-link">Articles</a>
              <a href="/resources" className="nav-link active">resources</a>
              <a href="/about" className="nav-link">About</a>
              {user ? (
                <>
                  <a href="/dashboard" className="nav-link">Dashboard</a>
                  <span className="nav-link user-info">Hello, {user.name}</span>
                </>
              ) : (
                <a href="/login" className="nav-link">login</a>
              )}
            </div>
          </div>
        </nav>
        {/* Search and Filter Bar - Positioned higher near navigation */}
        <div className="search-filter-container">
          <div className="search-bar">
            <div className="search-input-wrapper">
              <i className="fas fa-search search-icon"></i>
              <input 
                type="text" 
                id="resources-search" 
                className="search-input" 
                placeholder="Search resources..."
                autoComplete="off"
              />
              <button type="button" id="clear-search-resources" className="clear-search" style="display: none;">
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div className="filter-controls">
            <select id="resource-category-filter" className="filter-select">
              <option value="">All Categories</option>
              {/* Categories loaded dynamically */}
            </select>
            <select id="resource-type-filter" className="filter-select">
              <option value="">All Types</option>
              <option value="link">Links</option>
              <option value="book">Books</option>
              <option value="video">Videos</option>
              <option value="podcast">Podcasts</option>
              <option value="study">Study Guides</option>
              <option value="other">Other</option>
            </select>
            <select id="resource-sort-filter" className="filter-select">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">A-Z</option>
            </select>
            <button type="button" id="toggle-resource-filters" className="filter-toggle">
              <i className="fas fa-sliders-h"></i>
              <span>Filters</span>
            </button>
          </div>
        </div>
        
        <main className="main-content has-search">
          <div className="content-container with-search">
            <div className="page-header with-search">
              <h1 className="page-title">Resources</h1>
              <p className="page-subtitle">Discover helpful resources to strengthen your faith journey.</p>
              {user && (user.role === 'admin' || user.role === 'moderator') && (
                <a href="/dashboard?tab=create-resource" className="btn-primary">Add Resource</a>
              )}
            </div>
          </div>
          
          {/* Search Results Info */}
          <div id="resource-search-results-info" className="search-results-info" style="display: none;">
            <span id="resource-results-count"></span>
            <button type="button" id="clear-all-resource-filters" className="clear-filters-btn">
              <i className="fas fa-times"></i> Clear All
            </button>
          </div>
          
          <div className="content-container">
            {resources.length > 0 ? (
              <div id="resources-container" className="resources-grid">
                {resources.map((resource) => (
                  <div key={resource.id} className="resource-card" data-category={resource.category_name || ''} data-type={resource.resource_type}>
                    <div className="resource-header">
                      <div className="resource-type">{resource.resource_type}</div>
                      {resource.is_uploaded_file && (
                        <div className="resource-badge uploaded">
                          <i className="fas fa-cloud-upload-alt"></i> Uploaded
                        </div>
                      )}
                    </div>
                    <h3 className="resource-title">
                      <a href={`/resources/${resource.id}`}>{resource.title}</a>
                    </h3>
                    {resource.category_name && (
                      <div className="resource-category">
                        <span className="category-badge">{resource.category_name}</span>
                      </div>
                    )}
                    <p className="resource-description">{resource.description}</p>
                    <div className="resource-meta">
                      By {resource.author_name} • {new Date(resource.created_at).toLocaleDateString()}
                      {resource.is_uploaded_file && resource.file_name && (
                        <>
                          <br />
                          <small>File: {resource.file_name}</small>
                        </>
                      )}
                    </div>
                    <div className="resource-actions">
                      <a href={`/resources/${resource.id}`} className="resource-link">
                        {resource.is_uploaded_file ? (
                          <>
                            <i className="fas fa-eye"></i> View Resource →
                          </>
                        ) : (
                          <>
                            <i className="fas fa-external-link-alt"></i> Visit Resource →
                          </>
                        )}
                      </a>
                      {resource.is_uploaded_file && resource.download_url && (
                        <a href={resource.download_url} className="resource-download" download>
                          <i className="fas fa-download"></i> Download
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div id="resources-container" className="empty-state">
                <h3>No resources yet</h3>
                <p>Be the first to share helpful faith resources!</p>
                {user && (user.role === 'admin' || user.role === 'moderator') && (
                  <a href="/dashboard?tab=create-resource" className="btn-primary">Add the First Resource</a>
                )}
                {user && user.role === 'user' && (
                  <p className="empty-state-description">Only moderators can add resources.</p>
                )}
              </div>
            )}
          </div>
        </main>
        
        {/* Search and Filter JavaScript */}
        <script src="/static/search.js"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              if (typeof initializeResourcesSearch === 'function') {
                initializeResourcesSearch();
              }
            });
          `
        }}></script>
      </div>
    )
  } catch (error) {
    console.error('Error loading resources:', error);
    return c.render(
      <div className="min-h-screen">
        <nav className="nav-header">
          <div className="nav-container">
            <div className="nav-brand">
              <h1>Faith Defenders</h1>
            </div>
            <div className="nav-menu">
              <a href="/" className="nav-link">Home</a>
              <a href="/articles" className="nav-link">Articles</a>
              <a href="/resources" className="nav-link active">resources</a>
              <a href="/about" className="nav-link">About</a>
              <a href="/login" className="nav-link">login</a>
            </div>
          </div>
        </nav>
        <main className="main-content">
          <div className="content-container">
            <h1 className="page-title">Resources</h1>
            <p className="page-subtitle">Discover helpful resources to strengthen your faith journey.</p>
          </div>
        </main>
      </div>
    )
  }
})

app.get('/about', (c) => {
  return c.render(
    <div className="min-h-screen">
      <nav className="nav-header">
        <div className="nav-container">
          <div className="nav-brand">
            <h1>Faith Defenders</h1>
          </div>
          <div className="nav-menu">
            <a href="/" className="nav-link">Home</a>
            <a href="/articles" className="nav-link">Articles</a>
            <a href="/resources" className="nav-link">resources</a>
            <a href="/about" className="nav-link active">About</a>
            <a href="/login" className="nav-link">login</a>
          </div>
        </div>
      </nav>
      <main className="main-content">
        <div className="content-container">
          <h1 className="page-title">About Faith Defenders</h1>
          <p className="page-subtitle">Learn more about our mission to defend and share the Christian faith.</p>
        </div>
      </main>
    </div>
  )
})

// Individual resource view
app.get('/resources/:id', async (c) => {
  try {
    const user = await getLoggedInUser(c);
    const id = parseInt(c.req.param('id'));
    
    console.log(`Loading resource with ID: ${id}`);
    
    if (isNaN(id)) {
      console.log('Invalid resource ID, redirecting to resources list');
      return c.redirect('/resources');
    }

    // Import and use the database function directly from the Neon database
    const { getResourceById, trackPageView, logActivity } = await import('./database-neon');
    const resource = await getResourceById(id);
    
    console.log(`Resource found:`, resource ? `"${resource.title}"` : 'null');
    
    if (!resource) {
      console.log('Resource not found, redirecting to resources list');
      return c.redirect('/resources');
    }
    
    // Track page view
    const userAgent = c.req.header('User-Agent') || '';
    const ipAddress = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || '';
    
    await trackPageView(undefined, resource.id, user?.id, ipAddress, userAgent);
    
    // Log activity  
    if (user) {
      await logActivity(
        user.id, 
        'resource_view', 
        `Viewed resource: "${resource.title}"`, 
        'resource', 
        resource.id
      );
    }
    
    // If it's an external link, redirect to it
    if (!resource.is_uploaded_file && resource.url) {
      return c.redirect(resource.url);
    }
    
    // For uploaded files, show web view
    return c.render(
      <div className="min-h-screen">
        <nav className="nav-header">
          <div className="nav-container">
            <div className="nav-brand">
              <h1>Faith Defenders</h1>
            </div>
            <div className="nav-menu">
              <a href="/" className="nav-link">Home</a>
              <a href="/articles" className="nav-link">Articles</a>
              <a href="/resources" className="nav-link">Resources</a>
              <a href="/about" className="nav-link">About</a>
              {user ? (
                <>
                  <a href="/dashboard" className="nav-link">Dashboard</a>
                  <span className="nav-link user-info">Hello, {user.name}</span>
                </>
              ) : (
                <a href="/login" className="nav-link">Login</a>
              )}
            </div>
          </div>
        </nav>
        <main className="article-content">
          <div className="article-container">
            <div className="breadcrumb">
              <a href="/resources">← Back to Resources</a>
            </div>
            
            <div className="content-layout">
              <div className="main-content-area">
                <article className="article-detail">
              <h1 className="article-title">{resource.title}</h1>
              <div className="article-meta">
                <span className="resource-type">{resource.resource_type}</span> • 
                By {resource.author_name} • {new Date(resource.created_at).toLocaleDateString()}
                {resource.file_name && (
                  <>
                    <br />
                    <small>Original file: {resource.file_name}</small>
                  </>
                )}
              </div>
              
              {/* Resource Actions */}
              <div className="resource-actions" style="margin: 1rem 0; padding: 1rem; background: #f8fafc; border-radius: 8px;">
                {resource.download_url && (
                  <a href={resource.download_url} className="btn-primary" style="margin-right: 1rem;" download>
                    <i className="fas fa-download"></i> Download Original
                  </a>
                )}
                {resource.url && !resource.is_uploaded_file && (
                  <a href={resource.url} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                    <i className="fas fa-external-link-alt"></i> Visit Source
                  </a>
                )}
              </div>
              
              {/* Description */}
              {resource.description && (
                <div className="resource-description" style="margin: 1.5rem 0; padding: 1rem; background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0;">
                  <p>{resource.description}</p>
                </div>
              )}
              
              {/* Content Display */}
              <div className="article-body">
                {resource.extracted_content ? (
                  <div dangerouslySetInnerHTML={{ __html: resource.extracted_content }} />
                ) : resource.content_preview ? (
                  <div>
                    <h3>Preview:</h3>
                    <p>{resource.content_preview}</p>
                    <p style="color: #6b7280; font-style: italic; margin-top: 1rem;">
                      Full content extraction is being processed. Please check back later or download the original file.
                    </p>
                  </div>
                ) : (
                  <div style="text-align: center; padding: 2rem; color: #6b7280;">
                    <i className="fas fa-file-alt" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>Content is being processed for web viewing.</p>
                    <p>You can download the original file using the button above.</p>
                  </div>
                )}
              </div>
            </article>
            
            {/* Likes Section - always with main content */}
            <div className="content-interactions">
              <div id="likes-section">
                {/* Likes will be loaded here */}
              </div>
            </div>
            
            {/* Comment Section - Mobile Only (Desktop shows in sidebar) */}
            <div id="comments-container-mobile" className="comments-mobile-only"></div>
          </div>
          
          {/* Comments Sidebar - Desktop Only */}
          <div className="comments-sidebar">
            <div className="sidebar-sticky">
              <div id="comments-container-desktop"></div>
            </div>
          </div>

        </div>
      </div>
    </main>
        
        {/* Scripts */}
        <script src="/static/comments.js"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              // Initialize comment system for resource - responsive containers
              if (window.initComments) {
                // Check screen size and initialize appropriate container
                function initResponsiveComments() {
                  const isMobile = window.innerWidth < 1024;
                  const desktopContainer = document.getElementById('comments-container-desktop');
                  const mobileContainer = document.getElementById('comments-container-mobile');
                  
                  // Clear both containers first
                  if (desktopContainer) desktopContainer.innerHTML = '';
                  if (mobileContainer) mobileContainer.innerHTML = '';
                  
                  // Initialize in appropriate container
                  const targetContainer = isMobile ? 'comments-container-mobile' : 'comments-container-desktop';
                  window.initComments(targetContainer, null, ${resource.id});
                }
                
                // Initialize on load
                initResponsiveComments();
                
                // Reinitialize on resize (debounced)
                let resizeTimeout;
                window.addEventListener('resize', function() {
                  clearTimeout(resizeTimeout);
                  resizeTimeout = setTimeout(initResponsiveComments, 300);
                });
              }
            });
          `
        }}></script>

      </div>
    )
  } catch (error) {
    console.error('Error loading resource:', error);
    return c.redirect('/resources');
  }
})

// Individual article view
app.get('/articles/:id', async (c) => {
  try {
    const user = await getLoggedInUser(c);
    const id = parseInt(c.req.param('id'));
    
    console.log(`Loading article with ID: ${id}`);
    
    if (isNaN(id)) {
      console.log('Invalid article ID, redirecting to articles list');
      return c.redirect('/articles');
    }

    // Import and use the database function directly from the Neon database
    const { getArticleById, trackPageView, logActivity } = await import('./database-neon');
    const article = await getArticleById(id);
    
    console.log(`Article found:`, article ? `"${article.title}"` : 'null');
    
    if (!article) {
      console.log('Article not found, redirecting to articles list');
      return c.redirect('/articles');
    }
    
    // Track page view
    const userAgent = c.req.header('User-Agent') || '';
    const ipAddress = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || '';
    
    await trackPageView(article.id, undefined, user?.id, ipAddress, userAgent);
    
    // Log activity
    if (user) {
      await logActivity(
        user.id, 
        'article_view', 
        `Viewed article: "${article.title}"`, 
        'article', 
        article.id
      );
    }
    
    return c.render(
      <div className="min-h-screen">
        <nav className="nav-header">
          <div className="nav-container">
            <div className="nav-brand">
              <h1>Faith Defenders</h1>
            </div>
            <div className="nav-menu">
              <a href="/" className="nav-link">Home</a>
              <a href="/articles" className="nav-link">Articles</a>
              <a href="/resources" className="nav-link">resources</a>
              <a href="/about" className="nav-link">About</a>
              {user ? (
                <>
                  <a href="/dashboard" className="nav-link">Dashboard</a>
                  <span className="nav-link user-info">Hello, {user.name}</span>
                </>
              ) : (
                <a href="/login" className="nav-link">login</a>
              )}
            </div>
          </div>
        </nav>
        <main className="article-content">
          <div className="article-container">
            <div className="breadcrumb">
              <a href="/articles">← Back to Articles</a>
            </div>
            
            <div className="content-layout">
              <div className="main-content-area">
                <article className="article-detail">
                  <h1 className="article-title">{article.title}</h1>
                  <div className="article-meta">
                    By {article.author_name} • {new Date(article.created_at).toLocaleDateString()}
                  </div>
                  <div className="article-body" dangerouslySetInnerHTML={{ __html: article.content }} />
                </article>
                
                {/* Likes Section - always with main content */}
                <div className="content-interactions">
                  <div id="likes-section">
                    {/* Likes will be loaded here */}
                  </div>
                </div>
                
                {/* Comment Section - Mobile Only (Desktop shows in sidebar) */}
                <div id="comments-container-mobile" className="comments-mobile-only"></div>
              </div>
              
              {/* Comments Sidebar - Desktop Only */}
              <div className="comments-sidebar">
                <div className="sidebar-sticky">
                  <div id="comments-container-desktop"></div>
                </div>
              </div>

            </div>
          </div>
        </main>
        
        {/* Scripts */}
        <script src="/static/comments.js"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              // Initialize comment system for article - responsive containers
              if (window.initComments) {
                // Check screen size and initialize appropriate container
                function initResponsiveComments() {
                  const isMobile = window.innerWidth < 1024;
                  const desktopContainer = document.getElementById('comments-container-desktop');
                  const mobileContainer = document.getElementById('comments-container-mobile');
                  
                  // Clear both containers first
                  if (desktopContainer) desktopContainer.innerHTML = '';
                  if (mobileContainer) mobileContainer.innerHTML = '';
                  
                  // Initialize in appropriate container
                  const targetContainer = isMobile ? 'comments-container-mobile' : 'comments-container-desktop';
                  window.initComments(targetContainer, ${article.id}, null);
                }
                
                // Initialize on load
                initResponsiveComments();
                
                // Reinitialize on resize (debounced)
                let resizeTimeout;
                window.addEventListener('resize', function() {
                  clearTimeout(resizeTimeout);
                  resizeTimeout = setTimeout(initResponsiveComments, 300);
                });
              }
            });
          `
        }}></script>

      </div>
    )
  } catch (error) {
    console.error('Error loading article:', error);
    return c.redirect('/articles');
  }
})

app.get('/login', async (c) => {
  const user = await getLoggedInUser(c);
  
  if (user) {
    return c.redirect('/dashboard');
  }
  
  return c.render(
    <div className="min-h-screen">
      <nav className="nav-header">
        <div className="nav-container">
          <div className="nav-brand">
            <h1>Faith Defenders</h1>
          </div>
          <div className="nav-menu">
            <a href="/" className="nav-link">Home</a>
            <a href="/articles" className="nav-link">Articles</a>
            <a href="/resources" className="nav-link">resources</a>
            <a href="/about" className="nav-link">About</a>
            <a href="/login" className="nav-link active">login</a>
          </div>
        </div>
      </nav>
      <main className="auth-content">
        <div className="auth-container">
          <div className="auth-card">
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to your Faith Defenders account</p>
            
            <div className="auth-tabs">
              <button className="auth-tab active" onclick="showLogin()">Sign In</button>
              <button className="auth-tab" onclick="showRegister()">Sign Up</button>
            </div>
            
            {/* Login Form */}
            <form id="login-form" className="auth-form">
              <div className="form-group">
                <label for="login-email">Email</label>
                <input type="email" id="login-email" name="email" required />
              </div>
              <div className="form-group">
                <label for="login-password">Password</label>
                <input type="password" id="login-password" name="password" required />
              </div>
              <button type="submit" className="btn-primary">Sign In</button>
              
              {/* Forgot Password Link */}
              <div className="auth-links">
                <a href="/forgot-password" className="auth-link">Forgot your password?</a>
              </div>
              
              {/* OAuth Separator */}
              <div className="oauth-separator">
                <span>or</span>
              </div>
              
              {/* Google OAuth Button */}
              <a href="/auth/google/login" className="btn-google-oauth">
                <svg width="20" height="20" viewBox="0 0 24 24" className="google-icon">
                  <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </a>
            </form>
            
            {/* Register Form */}
            <form id="register-form" className="auth-form" style="display: none;">
              <div className="form-group">
                <label for="register-name">Full Name</label>
                <input type="text" id="register-name" name="name" required />
              </div>
              <div className="form-group">
                <label for="register-email">Email</label>
                <input type="email" id="register-email" name="email" required />
              </div>
              <div className="form-group">
                <label for="register-password">Password</label>
                <input type="password" id="register-password" name="password" required minlength="6" />
              </div>
              <button type="submit" className="btn-primary">Sign Up</button>
              
              {/* OAuth Separator */}
              <div className="oauth-separator">
                <span>or</span>
              </div>
              
              {/* Google OAuth Button */}
              <a href="/auth/google/login?signup=true" className="btn-google-oauth">
                <svg width="20" height="20" viewBox="0 0 24 24" className="google-icon">
                  <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </a>
            </form>
            
            <div id="auth-message" className="auth-message"></div>
          </div>
        </div>
      </main>
      
      <script src="/static/auth.js"></script>
    </div>
  )
})

// Email verification page
app.get('/verify-email', async (c) => {
  const userId = c.req.query('userId');
  const user = await getLoggedInUser(c);
  
  // If already logged in and verified, redirect to dashboard
  if (user && user.email_verified) {
    return c.redirect('/dashboard');
  }
  
  return c.render(
    <div className="min-h-screen">
      <nav className="nav-header">
        <div className="nav-container">
          <div className="nav-brand">
            <h1>Faith Defenders</h1>
          </div>
          <div className="nav-menu">
            <a href="/" className="nav-link">Home</a>
            <a href="/articles" className="nav-link">Articles</a>
            <a href="/resources" className="nav-link">Resources</a>
            <a href="/about" className="nav-link">About</a>
            <a href="/login" className="nav-link">Login</a>
          </div>
        </div>
      </nav>
      
      <main className="auth-content">
        <div className="auth-container">
          <div className="auth-card">
            <h1 className="auth-title">Verify Your Email</h1>
            <p className="auth-subtitle">Please check your email for a verification code</p>
            
            <div className="verification-info">
              <div className="verification-icon">
                📧
              </div>
              <p>We've sent a 6-digit verification code to your email address. Enter the code below to verify your account and complete your registration.</p>
            </div>
            
            <form id="verify-form" className="auth-form">
              <input type="hidden" id="user-id" value={userId || ''} />
              <div className="form-group">
                <label for="otp-code">Verification Code</label>
                <input 
                  type="text" 
                  id="otp-code" 
                  name="otpCode" 
                  placeholder="Enter 6-digit code" 
                  maxlength="6" 
                  pattern="[0-9]{6}"
                  required 
                  autocomplete="one-time-code"
                />
              </div>
              <button type="submit" className="btn-primary">Verify Email</button>
              
              <div className="verification-actions">
                <button type="button" id="resend-btn" className="btn-link">
                  Didn't receive the code? Resend
                </button>
                <a href="/login" className="btn-link">
                  Back to Login
                </a>
              </div>
            </form>
            
            <div id="verification-message" className="auth-message"></div>
          </div>
        </div>
      </main>
      
      <script src="/static/verification.js"></script>
    </div>
  )
})

// Forgot Password page
app.get('/forgot-password', async (c) => {
  const user = await getLoggedInUser(c);
  
  if (user) {
    return c.redirect('/dashboard');
  }
  
  return c.render(
    <div className="min-h-screen">
      <nav className="nav-header">
        <div className="nav-container">
          <div className="nav-brand">
            <h1>Faith Defenders</h1>
          </div>
          <div className="nav-menu">
            <a href="/" className="nav-link">Home</a>
            <a href="/articles" className="nav-link">Articles</a>
            <a href="/resources" className="nav-link">resources</a>
            <a href="/about" className="nav-link">About</a>
            <a href="/login" className="nav-link">login</a>
          </div>
        </div>
      </nav>
      <main className="auth-content">
        <div className="auth-container">
          <div className="auth-card">
            <h1 className="auth-title">Reset Your Password</h1>
            <p className="auth-subtitle">Enter your email address and we'll send you a reset code</p>
            
            <form id="forgot-password-form" className="auth-form">
              <div className="form-group">
                <label for="email">Email Address</label>
                <input type="email" id="email" name="email" required />
              </div>
              <button type="submit" className="btn-primary">Send Reset Code</button>
            </form>
            
            <div className="auth-links">
              <a href="/login" className="auth-link">← Back to Sign In</a>
            </div>
            
            <div id="forgot-password-message" className="auth-message"></div>
          </div>
        </div>
      </main>
      
      <script src="/static/password-reset.js"></script>
    </div>
  )
})

// Reset Password page (with OTP)
app.get('/reset-password', async (c) => {
  const user = await getLoggedInUser(c);
  
  if (user) {
    return c.redirect('/dashboard');
  }
  
  const userId = c.req.query('userId');
  if (!userId) {
    return c.redirect('/forgot-password');
  }
  
  return c.render(
    <div className="min-h-screen">
      <nav className="nav-header">
        <div className="nav-container">
          <div className="nav-brand">
            <h1>Faith Defenders</h1>
          </div>
          <div className="nav-menu">
            <a href="/" className="nav-link">Home</a>
            <a href="/articles" className="nav-link">Articles</a>
            <a href="/resources" className="nav-link">resources</a>
            <a href="/about" className="nav-link">About</a>
            <a href="/login" className="nav-link">login</a>
          </div>
        </div>
      </nav>
      <main className="auth-content">
        <div className="auth-container">
          <div className="auth-card">
            <h1 className="auth-title">Enter Reset Code</h1>
            <p className="auth-subtitle">Enter the 6-digit code sent to your email and your new password</p>
            
            <form id="reset-password-form" className="auth-form">
              <input type="hidden" id="user-id" value={userId} />
              
              <div className="form-group">
                <label for="otp-code">6-Digit Reset Code</label>
                <input 
                  type="text" 
                  id="otp-code" 
                  name="otpCode" 
                  placeholder="000000"
                  maxLength="6"
                  pattern="[0-9]{6}"
                  required 
                />
                <small className="form-help">Enter the code sent to your email</small>
              </div>
              
              <div className="form-group">
                <label for="new-password">New Password</label>
                <input type="password" id="new-password" name="newPassword" minLength="6" required />
                <small className="form-help">At least 6 characters</small>
              </div>
              
              <div className="form-group">
                <label for="confirm-password">Confirm New Password</label>
                <input type="password" id="confirm-password" name="confirmPassword" minLength="6" required />
              </div>
              
              <button type="submit" className="btn-primary">Reset Password</button>
            </form>
            
            <div className="auth-links">
              <a href="/forgot-password" className="auth-link">← Request New Code</a>
              <a href="/login" className="auth-link">Back to Sign In</a>
            </div>
            
            <div id="reset-password-message" className="auth-message"></div>
          </div>
        </div>
      </main>
      
      <script src="/static/password-reset.js"></script>
    </div>
  )
})

// Dashboard page
app.get('/dashboard', async (c) => {
  const user = await getLoggedInUser(c);
  
  if (!user) {
    return c.redirect('/login');
  }
  
  const isWelcome = c.req.query('welcome') === 'true';
  
  return c.render(
    <div className="min-h-screen">
      <nav className="nav-header">
        <div className="nav-container">
          <div className="nav-brand">
            <h1>Faith Defenders</h1>
          </div>
          <div className="nav-menu">
            <a href="/" className="nav-link">Home</a>
            <a href="/articles" className="nav-link">Articles</a>
            <a href="/resources" className="nav-link">resources</a>
            <a href="/about" className="nav-link">About</a>
            <a href="/dashboard" className="nav-link active">Dashboard</a>
            <button onclick="logout()" className="nav-link logout-btn">Logout</button>
          </div>
        </div>
      </nav>
      <main className="dashboard-content">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <h1 className="page-title">Welcome, {user.name}!</h1>
            <p className="page-subtitle">Manage your articles and resources</p>
            
            {!user.email_verified && user.auth_provider !== 'google' && (
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
                  <p>Your account has been successfully created using Google authentication. You can now create articles, manage resources, and engage with our community.</p>
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
            {(user.role === 'admin' || user.role === 'moderator') && (
              <button className="tab-btn" onclick="showTab('create-article')">Create Article</button>
            )}
            {(user.role === 'admin' || user.role === 'moderator') && (
              <button className="tab-btn" onclick="showTab('create-resource')">Add Resource</button>
            )}
            <button className="tab-btn" onclick="showTab('settings')">
              <i className="fas fa-cog"></i> Settings
            </button>
            {user.role === 'admin' && (
              <a href="/admin" className="tab-btn" style="background: #1e40af; color: white; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem;">
                <i className="fas fa-shield-alt"></i>
                Admin Panel
              </a>
            )}
          </div>
          
          {/* Overview Tab */}
          <div id="overview-tab" className="tab-content">
            <div className="dashboard-stats">
              <div className="stat-card">
                <h3>Your Articles</h3>
                <div className="stat-number" id="user-articles-count">-</div>
              </div>
              <div className="stat-card">
                <h3>Your Resources</h3>
                <div className="stat-number" id="user-resources-count">-</div>
              </div>
            </div>
            <div id="user-content"></div>
          </div>
          
          {/* Create Article Tab */}
          <div id="create-article-tab" className="tab-content" style="display: none;">
            <div className="form-card">
              <h2>Create New Article</h2>
              <form id="create-article-form" className="content-form">
                <div className="form-group">
                  <label for="article-title">Title</label>
                  <input type="text" id="article-title" name="title" required />
                </div>
                <div className="form-group">
                  <label for="article-excerpt">Excerpt</label>
                  <textarea id="article-excerpt" name="excerpt" rows="3" placeholder="Brief description of your article..."></textarea>
                </div>
                <div className="form-group">
                  <label for="article-content-label">Content</label>
                  <div className="custom-toolbar">
                    {/* Text formatting group */}
                    <div className="toolbar-group">
                      <button type="button" className="toolbar-btn" data-action="bold" title="Bold (Ctrl+B)">
                        <i className="fas fa-bold"></i>
                      </button>
                      <button type="button" className="toolbar-btn" data-action="italic" title="Italic (Ctrl+I)">
                        <i className="fas fa-italic"></i>
                      </button>
                      <button type="button" className="toolbar-btn" data-action="underline" title="Underline (Ctrl+U)">
                        <i className="fas fa-underline"></i>
                      </button>
                      <button type="button" className="toolbar-btn" data-action="strikethrough" title="Strikethrough">
                        <i className="fas fa-strikethrough"></i>
                      </button>
                    </div>
                    
                    <div className="toolbar-separator"></div>
                    
                    {/* Font and size group */}
                    <div className="toolbar-group">
                      <select className="toolbar-select" data-action="fontFamily" title="Font Family">
                        <option value="">Default</option>
                        <option value="serif">Serif</option>
                        <option value="sans">Sans-serif</option>
                        <option value="mono">Monospace</option>
                      </select>
                      <select className="toolbar-select" data-action="fontSize" title="Font Size">
                        <option value="">Normal</option>
                        <option value="xs">Extra Small</option>
                        <option value="sm">Small</option>
                        <option value="lg">Large</option>
                        <option value="xl">Extra Large</option>
                        <option value="2xl">2X Large</option>
                      </select>
                    </div>
                    
                    <div className="toolbar-separator"></div>
                    
                    {/* Headers group */}
                    <div className="toolbar-group">
                      <button type="button" className="toolbar-btn" data-action="header1" title="Heading 1">
                        <strong>H1</strong>
                      </button>
                      <button type="button" className="toolbar-btn" data-action="header2" title="Heading 2">
                        <strong>H2</strong>
                      </button>
                      <button type="button" className="toolbar-btn" data-action="header3" title="Heading 3">
                        <strong>H3</strong>
                      </button>
                      <button type="button" className="toolbar-btn" data-action="header4" title="Heading 4">
                        <strong>H4</strong>
                      </button>
                    </div>
                    
                    <div className="toolbar-separator"></div>
                    
                    {/* Colors group */}
                    <div className="toolbar-group">
                      <input type="color" className="color-picker" data-action="textColor" title="Text Color" defaultValue="#000000" />
                      <input type="color" className="color-picker" data-action="backgroundColor" title="Background Color" defaultValue="#ffffff" />
                      <button type="button" className="toolbar-btn" data-action="highlight" title="Highlight">
                        <i className="fas fa-highlighter"></i>
                      </button>
                    </div>
                    
                    <div className="toolbar-separator"></div>
                    
                    {/* Lists group */}
                    <div className="toolbar-group">
                      <button type="button" className="toolbar-btn" data-action="orderedList" title="Numbered List">
                        <i className="fas fa-list-ol"></i>
                      </button>
                      <button type="button" className="toolbar-btn" data-action="bulletList" title="Bullet List">
                        <i className="fas fa-list-ul"></i>
                      </button>
                      <button type="button" className="toolbar-btn" data-action="checkList" title="Checklist">
                        <i className="fas fa-tasks"></i>
                      </button>
                    </div>
                    
                    <div className="toolbar-separator"></div>
                    
                    {/* Alignment group */}
                    <div className="toolbar-group">
                      <button type="button" className="toolbar-btn" data-action="alignLeft" title="Align Left">
                        <i className="fas fa-align-left"></i>
                      </button>
                      <button type="button" className="toolbar-btn" data-action="alignCenter" title="Align Center">
                        <i className="fas fa-align-center"></i>
                      </button>
                      <button type="button" className="toolbar-btn" data-action="alignRight" title="Align Right">
                        <i className="fas fa-align-right"></i>
                      </button>
                      <button type="button" className="toolbar-btn" data-action="alignJustify" title="Justify">
                        <i className="fas fa-align-justify"></i>
                      </button>
                    </div>
                    
                    <div className="toolbar-separator"></div>
                    
                    {/* Special formatting group */}
                    <div className="toolbar-group">
                      <button type="button" className="toolbar-btn" data-action="blockquote" title="Quote">
                        <i className="fas fa-quote-left"></i>
                      </button>
                      <button type="button" className="toolbar-btn" data-action="code" title="Inline Code">
                        <i className="fas fa-code"></i>
                      </button>
                      <button type="button" className="toolbar-btn" data-action="codeBlock" title="Code Block">
                        <i className="fas fa-terminal"></i>
                      </button>
                    </div>
                    
                    <div className="toolbar-separator"></div>
                    
                    {/* Advanced formatting group */}
                    <div className="toolbar-group">
                      <button type="button" className="toolbar-btn" data-action="subscript" title="Subscript (H₂O)">
                        <i className="fas fa-subscript"></i>
                      </button>
                      <button type="button" className="toolbar-btn" data-action="superscript" title="Superscript (E=mc²)">
                        <i className="fas fa-superscript"></i>
                      </button>
                    </div>
                    
                    <div className="toolbar-separator"></div>
                    
                    {/* Media and links group */}
                    <div className="toolbar-group">
                      <button type="button" className="toolbar-btn" data-action="link" title="Insert Link">
                        <i className="fas fa-link"></i>
                      </button>
                      <button type="button" className="toolbar-btn" data-action="image" title="Insert Image">
                        <i className="fas fa-image"></i>
                      </button>
                    </div>
                    
                    <div className="toolbar-separator"></div>
                    
                    {/* Utility group */}
                    <div className="toolbar-group">
                      <button type="button" className="toolbar-btn" data-action="removeFormat" title="Clear Formatting">
                        <i className="fas fa-remove-format"></i>
                      </button>
                      <button type="button" className="toolbar-btn" data-action="undo" title="Undo (Ctrl+Z)">
                        <i className="fas fa-undo"></i>
                      </button>
                      <button type="button" className="toolbar-btn" data-action="redo" title="Redo (Ctrl+Y)">
                        <i className="fas fa-redo"></i>
                      </button>
                    </div>
                  </div>
                  <div id="article-content-editor" contenteditable="true" className="custom-editor"
                       style="min-height: 400px; padding: 1rem; border: 1px solid #d1d5db; border-radius: 6px; background: white; outline: none;"
                       data-placeholder="Start writing your article content..."></div>
                  <textarea name="content" id="article-content-editor-textarea" style="display: none;" required></textarea>
                </div>
                <div className="form-actions">
                  <label className="checkbox-label">
                    <input type="checkbox" id="article-published" name="published" />
                    Publish immediately
                  </label>
                  <button type="submit" className="btn-primary">Save Article</button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Create Resource Tab */}
          <div id="create-resource-tab" className="tab-content" style="display: none;">
            <div className="form-card">
              <h2>Add New Resource</h2>
              <form id="create-resource-form" className="content-form">
                <div className="form-group">
                  <label for="resource-title">Title</label>
                  <input type="text" id="resource-title" name="title" required />
                </div>
                <div className="form-group">
                  <label for="resource-description">Description</label>
                  <textarea id="resource-description" name="description" rows="3" placeholder="Describe this resource..."></textarea>
                </div>
                <div className="form-group">
                  <label for="resource-url">URL</label>
                  <input type="url" id="resource-url" name="url" placeholder="https://example.com" />
                </div>
                <div className="form-group">
                  <label for="resource-type">Type</label>
                  <select id="resource-type" name="resource_type">
                    <option value="link">Link</option>
                    <option value="book">Book</option>
                    <option value="video">Video</option>
                    <option value="podcast">Podcast</option>
                    <option value="study">Study Guide</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary">Add Resource</button>
              </form>
            </div>
          </div>
          
          {/* Settings Tab */}
          <div id="settings-tab" className="tab-content" style="display: none;">
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
                    <span className="info-value">
                      {user.auth_provider === 'google' ? 'Google OAuth' : 'Email/Password'}
                    </span>
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
              
              {user.auth_provider !== 'google' && (
                <div className="settings-card">
                  <h4>Change Password</h4>
                  <p className="setting-description">Update your account password for better security.</p>
                  
                  <form id="change-password-form" className="settings-form">
                    <div className="form-group">
                      <label htmlFor="current-password">Current Password</label>
                      <input type="password" id="current-password" name="currentPassword" required />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="new-password">New Password</label>
                      <input type="password" id="new-password" name="newPassword" minLength="6" required />
                      <small className="form-help">At least 6 characters</small>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="confirm-new-password">Confirm New Password</label>
                      <input type="password" id="confirm-new-password" name="confirmNewPassword" minLength="6" required />
                    </div>
                    
                    <div className="form-actions">
                      <button type="submit" className="btn-primary">Change Password</button>
                    </div>
                  </form>
                  
                  <div id="change-password-message" className="settings-message"></div>
                </div>
              )}
              
              {user.auth_provider === 'google' && (
                <div className="settings-card">
                  <h4>Password Management</h4>
                  <div className="oauth-notice">
                    <i className="fas fa-info-circle"></i>
                    <div>
                      <p><strong>You signed in with Google</strong></p>
                      <p>Your password is managed by Google. To change your password, please visit your Google Account settings.</p>
                      <a href="https://myaccount.google.com/security" target="_blank" className="btn-secondary">
                        <i className="fab fa-google"></i> Manage Google Account
                      </a>
                    </div>
                  </div>
                </div>
              )}
              
              {!user.email_verified && user.auth_provider !== 'google' && (
                <div className="settings-card">
                  <h4>Email Verification</h4>
                  <div className="verification-notice">
                    <i className="fas fa-exclamation-triangle"></i>
                    <div>
                      <p><strong>Email Not Verified</strong></p>
                      <p>Please verify your email address to access all features and ensure account security.</p>
                      <a href={`/verify-email?userId=${user.id}`} className="btn-warning">
                        Verify Email Now
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div id="dashboard-message" className="dashboard-message"></div>
        </div>
      </main>
      
      {/* Simple custom editor */}
      <script src="/static/dashboard.js"></script>
      <script src="/static/custom-editor.js"></script>
    </div>
  )
})

export default app
