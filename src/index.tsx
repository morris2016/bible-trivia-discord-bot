import { Hono } from 'hono'
import { renderer } from './renderer'
import { initializeDatabase, getArticles, getResources } from './database-mock'
import { getLoggedInUser } from './auth'
import api from './api'

const app = new Hono()

// Initialize database on startup
initializeDatabase().catch(console.error);

// Mount API routes
app.route('/api', api)

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
            
            {featuredArticles.length > 0 && (
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
        <main className="main-content">
          <div className="content-container">
            <div className="page-header">
              <h1 className="page-title">Articles</h1>
              <p className="page-subtitle">Browse our collection of faith-based articles and insights.</p>
              {user && (
                <a href="/dashboard?tab=create-article" className="btn-primary">Write New Article</a>
              )}
            </div>
            
            {articles.length > 0 ? (
              <div className="articles-list">
                {articles.map((article) => (
                  <div key={article.id} className="article-item">
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
            ) : (
              <div className="empty-state">
                <h3>No articles yet</h3>
                <p>Be the first to share your faith-based insights!</p>
                {user && (
                  <a href="/dashboard?tab=create-article" className="btn-primary">Write the First Article</a>
                )}
              </div>
            )}
          </div>
        </main>
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
        <main className="main-content">
          <div className="content-container">
            <div className="page-header">
              <h1 className="page-title">Resources</h1>
              <p className="page-subtitle">Discover helpful resources to strengthen your faith journey.</p>
              {user && (
                <a href="/dashboard?tab=create-resource" className="btn-primary">Add Resource</a>
              )}
            </div>
            
            {resources.length > 0 ? (
              <div className="resources-grid">
                {resources.map((resource) => (
                  <div key={resource.id} className="resource-card">
                    <div className="resource-type">{resource.resource_type}</div>
                    <h3 className="resource-title">
                      {resource.url ? (
                        <a href={resource.url} target="_blank" rel="noopener noreferrer">{resource.title}</a>
                      ) : (
                        resource.title
                      )}
                    </h3>
                    <p className="resource-description">{resource.description}</p>
                    <div className="resource-meta">
                      By {resource.author_name} • {new Date(resource.created_at).toLocaleDateString()}
                    </div>
                    {resource.url && (
                      <a href={resource.url} target="_blank" rel="noopener noreferrer" className="resource-link">
                        Visit Resource →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>No resources yet</h3>
                <p>Be the first to share helpful faith resources!</p>
                {user && (
                  <a href="/dashboard?tab=create-resource" className="btn-primary">Add the First Resource</a>
                )}
              </div>
            )}
          </div>
        </main>
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

// Individual article view
app.get('/articles/:id', async (c) => {
  try {
    const user = await getLoggedInUser(c);
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.redirect('/articles');
    }

    const response = await fetch(`${c.req.url.split('/articles')[0]}/api/articles/${id}`);
    const data = await response.json();
    
    if (!data.success) {
      return c.redirect('/articles');
    }

    const article = data.article;
    
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
            <article className="article-detail">
              <h1 className="article-title">{article.title}</h1>
              <div className="article-meta">
                By {article.author_name} • {new Date(article.created_at).toLocaleDateString()}
              </div>
              <div className="article-body" dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br>') }} />
            </article>
          </div>
        </main>
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
            </form>
            
            <div id="auth-message" className="auth-message"></div>
          </div>
        </div>
      </main>
      
      <script src="/static/auth.js"></script>
    </div>
  )
})

// Dashboard page
app.get('/dashboard', async (c) => {
  const user = await getLoggedInUser(c);
  
  if (!user) {
    return c.redirect('/login');
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
          </div>
          
          <div className="dashboard-tabs">
            <button className="tab-btn active" onclick="showTab('overview')">Overview</button>
            <button className="tab-btn" onclick="showTab('create-article')">Create Article</button>
            <button className="tab-btn" onclick="showTab('create-resource')">Add Resource</button>
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
                  <label for="article-content">Content</label>
                  <textarea id="article-content" name="content" rows="10" required placeholder="Write your article content here..."></textarea>
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
          
          <div id="dashboard-message" className="dashboard-message"></div>
        </div>
      </main>
      
      <script src="/static/dashboard.js"></script>
    </div>
  )
})

export default app
