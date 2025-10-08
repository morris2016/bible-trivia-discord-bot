import { Context } from 'hono'
import { Footer } from './footer'
import { Navigation } from './navigation'
import { getArticles, getCategories } from '../database-neon'

interface ArticlesProps {
  c: Context
}

// Articles List Page Component
export async function Articles({ c }: ArticlesProps) {
  const user = await getLoggedInUser(c)
  const settings = c.get('settings') || {}
  const articlesPerPage = settings.articles_per_page || 30
  const articles = await getArticles(true, articlesPerPage)

  return (
    <div className="min-h-screen">
      <Navigation c={c} user={user} />
      <main className="main-content">
        <div className="container">
          {/* Search and Filter Bar */}
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
                <button type="button" id="clear-search" className="clear-search" style={{ display: 'none' }}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            <div className="filter-controls">
              <select id="category-filter" className="filter-select">
                <option value="">All Categories</option>
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

          <div className="page-header">
            <h1 className="page-title">Articles</h1>
            <p className="page-subtitle">Browse our collection of faith-based articles and insights.</p>
            {user && (user.role === 'admin' || user.role === 'moderator') && (
              <a href="/admin" className="btn-primary">Write New Article</a>
            )}
          </div>

          {/* Search Results Info */}
          <div id="search-results-info" className="search-results-info" style={{ display: 'none' }}>
            <span id="results-count"></span>
            <button type="button" id="clear-all-filters" className="clear-filters-btn">
              <i className="fas fa-times"></i> Clear All
            </button>
          </div>

          {/* Articles Per Page Info */}
          <div className="articles-per-page-info" style={{ marginBottom: '1rem', fontSize: '0.9em', color: '#6b7280' }}>
            <p>Showing {articles.length} articles per page (configured: {articlesPerPage})</p>
          </div>

          {articles.length > 0 ? (
            <div id="articles-container" className="articles-grid">
              {articles.map((article) => (
                <div key={article.id} className="article-card" data-category={article.category_name || ''}>
                  <div className="article-content">
                    <h3 className="article-title">
                      <a href={`/articles/${article.slug || article.id}`}>{article.title}</a>
                    </h3>
                    <p className="article-excerpt">{article.excerpt ? (article.excerpt.length > 120 ? article.excerpt.substring(0, 120) + '...' : article.excerpt) : 'Read this inspiring article about faith and Christian living.'}</p>
                    <div className="article-author">By {article.author_name}</div>
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

      <Footer c={c} />
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

export default Articles
