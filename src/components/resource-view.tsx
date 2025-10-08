import { Navigation } from './navigation'

export async function ResourceView({ c }: { c: any }) {
  const user = c.get('user')
  const idOrSlug = c.req.param('idOrSlug')

  console.log(`Loading resource with ID/Slug: ${idOrSlug}`)

  // Import and use the database function directly from the Neon database
  const { getResourceById, getResourceBySlug, trackPageView, logActivity } = await import('../database-neon')

  // Prioritize slugs over IDs for better SEO
  let resource
  try {
    // First try to get by slug (most common case for SEO-friendly URLs)
    resource = await getResourceBySlug(idOrSlug)

    // If not found by slug, try to parse as ID (fallback for legacy URLs)
    if (!resource) {
      const id = parseInt(idOrSlug)
      if (!isNaN(id)) {
        resource = await getResourceById(id)
      }
    }
  } catch (error) {
    console.error('Error loading resource:', error)
    return c.redirect('/resources')
  }

  console.log(`Resource found:`, resource ? `"${resource.title}"` : 'null')

  if (!resource) {
    console.log('Resource not found, redirecting to resources list')
    return c.redirect('/resources')
  }

  // Track page view
  const userAgent = c.req.header('User-Agent') || ''
  const ipAddress = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || ''

  await trackPageView(undefined, resource.id, user?.id, ipAddress, userAgent)

  // Log activity
  if (user) {
    await logActivity(
      user.id,
      'resource_view',
      `Viewed resource: "${resource.title}"`,
      'resource',
      resource.id
    )
  }

  // If it's an external link, redirect to it
  if (!resource.is_uploaded_file && resource.url) {
    return c.redirect(resource.url)
  }

  // If it's a PDF file, redirect to PDF viewer
  if (resource.is_uploaded_file && resource.file_name?.toLowerCase().endsWith('.pdf')) {
    return c.redirect(`/resources/${resource.id}/view`)
  }

  // For other uploaded files, show web view
  return c.render(
    <div className="min-h-screen">
      <Navigation c={c} user={user} />

      <main className="article-content">
        <div className="article-container">

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
                <div className="resource-actions" style={{ margin: '1rem 0', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                  {resource.is_uploaded_file && resource.file_name?.toLowerCase().endsWith('.pdf') && (
                    <a href={`/resources/${resource.slug || resource.id}/view`} className="btn-primary" style={{ marginRight: '1rem', background: '#059669' }}>
                      <i className="fas fa-file-pdf"></i> View PDF
                    </a>
                  )}
                  {resource.download_url && (
                    <a href={resource.download_url} className="btn-primary" style={{ marginRight: '1rem' }} download>
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
                  <div className="resource-description" style={{ margin: '1.5rem 0', padding: '1rem', background: '#f0f9ff', borderLeft: '4px solid #3b82f6', borderRadius: '0 8px 8px 0' }}>
                    <p>{resource.description ? (resource.description.length > 150 ? resource.description.substring(0, 150) + '...' : resource.description) : 'Explore this helpful faith resource.'}</p>
                  </div>
                )}

                {/* Content Display */}
                <div className="article-body">
                  {/* Audio Player for Podcasts */}
                  {resource.resource_type === 'podcast' && resource.is_uploaded_file && resource.download_url ? (
                    <div className="podcast-player-container" style={{ margin: '2rem 0', padding: '2rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', color: 'white' }}>
                      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <i className="fas fa-podcast" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.9 }}></i>
                        <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Now Playing</h3>
                        <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>{resource.title}</p>
                      </div>

                      <audio
                        id="podcast-audio-player"
                        controls
                        preload="metadata"
                        style={{ width: '100%', maxWidth: '600px', margin: '0 auto', display: 'block', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '25px', padding: '0.5rem' }}
                      >
                        <source src={resource.download_url} type="audio/mpeg" />
                        <source src={resource.download_url} type="audio/mp3" />
                        <source src={resource.download_url} type="audio/wav" />
                        <source src={resource.download_url} type="audio/ogg" />
                        Your browser does not support the audio element.
                      </audio>

                      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <small style={{ opacity: 0.8 }}>
                          <i className="fas fa-headphones"></i> Listen to this podcast episode
                        </small>
                      </div>
                    </div>
                  ) : resource.extracted_content ? (
                    <div dangerouslySetInnerHTML={{ __html: resource.extracted_content }} />
                  ) : resource.content_preview ? (
                    <div>
                      <h3>Preview:</h3>
                      <p>{resource.content_preview}</p>
                      <p style={{ color: '#6b7280', fontStyle: 'italic', marginTop: '1rem' }}>
                        Full content extraction is being processed. Please check back later or download the original file.
                      </p>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      <i className="fas fa-file-alt" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}></i>
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

              // Reinitialize on resize (debounced) - only on significant width changes
              let resizeTimeout;
              let lastWidth = window.innerWidth;
              window.addEventListener('resize', function() {
                const currentWidth = window.innerWidth;
                const widthDifference = Math.abs(currentWidth - lastWidth);

                // Only reinitialize if width changed by more than 100px (significant change)
                if (widthDifference > 100) {
                  clearTimeout(resizeTimeout);
                  resizeTimeout = setTimeout(() => {
                    initResponsiveComments();
                    lastWidth = window.innerWidth;
                  }, 300);
                }
              });
            }
          });
        `
      }}></script>

      {/* Load auth.js for user dropdown functionality */}
      <script src="/static/auth.js"></script>
    </div>
  )
}
