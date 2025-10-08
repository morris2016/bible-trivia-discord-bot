import { Context } from 'hono'
import { Footer } from './footer'
import { Navigation } from './navigation'
import { getResources } from '../database-neon'

interface ResourcesProps {
  c: Context
}

// Resources List Page Component
export async function Resources({ c }: ResourcesProps) {
  const user = await getLoggedInUser(c)
  const resources = await getResources(true)

  return (
    <div className="min-h-screen">
      <Navigation c={c} user={user} />
      {/* Search and Filter Bar */}
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
            <button type="button" id="clear-search-resources" className="clear-search" style={{ display: 'none' }}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div className="filter-controls">
          <select id="resource-category-filter" className="filter-select">
            <option value="">All Categories</option>
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

      <main className="homepage-main">
        <div className="homepage-container">
          <div className="page-header">
            <h1 className="page-title">Resources</h1>
            <p className="page-subtitle">Discover helpful resources to strengthen your faith journey.</p>
            {user && (user.role === 'admin' || user.role === 'moderator') && (
              <a href="/admin" className="btn-primary">Add Resource</a>
            )}
          </div>

          {/* Search Results Info */}
          <div id="resource-search-results-info" className="search-results-info" style={{ display: 'none' }}>
            <span id="resource-results-count"></span>
            <button type="button" id="clear-all-resource-filters" className="clear-filters-btn">
              <i className="fas fa-times"></i> Clear All
            </button>
          </div>

          {resources.length > 0 ? (
            <div id="resources-container" className="resources-grid">
              {resources.map((resource) => (
                <div key={resource.id} className="resource-card" data-category={resource.category_name || ''} data-type={resource.resource_type}>
                  <div className="resource-content">
                    <h3 className="resource-title">
                      <a href={resource.is_uploaded_file && resource.file_name?.toLowerCase().endsWith('.pdf') ? `/resources/${resource.slug || resource.id}/view` : `/resources/${resource.slug || resource.id}`}>
                        {resource.title}
                      </a>
                    </h3>
                    <p className="resource-excerpt">
                      {resource.description ? (resource.description.length > 120 ? resource.description.substring(0, 120) + '...' : resource.description) : 'Explore this helpful faith resource.'}
                    </p>
                    <div className="resource-author">By {resource.author_name}</div>
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

export default Resources
