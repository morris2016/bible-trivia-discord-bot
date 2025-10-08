import { Context } from 'hono'
import { Footer } from './footer'
import { Navigation } from './navigation'
import { getArticles, getResources } from '../database-neon'

interface HomeProps {
  c: Context
}

// Home Page Component
export async function Home({ c }: HomeProps) {
  const user = c.get('user')
  const settings = c.get('settings') || {}

  // Fetch articles and resources for simplified homepage
  const articlesPerPage = settings.articles_per_page || 30
  const [recentArticles, resources] = await Promise.all([
    getArticles(true, articlesPerPage),
    getResources(true)
  ])

  // Filter resources to only get podcasts
  const podcasts = resources.filter(resource => resource.resource_type === 'podcast')

  // Pre-calculate what we need to avoid multiple iterations
  // Also pre-format dates to avoid repeated Date object creation in render
  const latestArticles = recentArticles.slice(0, 3).map(article => ({
    ...article,
    formattedDate: new Date(article.created_at).toLocaleDateString(),
    shortExcerpt: article.excerpt
      ? (article.excerpt.length > 100 ? article.excerpt.substring(0, 100) + '...' : article.excerpt)
      : 'Read this inspiring article about faith and Christian living.'
  }))

  // Pre-format latest podcasts
  const latestPodcasts = podcasts.slice(0, 3).map(podcast => ({
    ...podcast,
    formattedDate: new Date(podcast.created_at).toLocaleDateString(),
    shortDescription: podcast.description
      ? (podcast.description.length > 120 ? podcast.description.substring(0, 120) + '...' : podcast.description)
      : 'Listen to this inspiring faith-based podcast episode.'
  }))

  return (
    <div className="min-h-screen">
      <Navigation c={c} user={user} />
      {/* Main Content */}
      <main className="homepage-main">
        <div className="homepage-container">
          {/* Hero Section */}
          <div className="hero-section">
            <h1 className="page-title">Welcome to Faith Defenders</h1>
            <p className="page-subtitle">Defending and sharing the Christian faith through articles, resources, and community.</p>
          </div>

          {/* Latest Articles Grid */}
          {latestArticles.length > 0 && (
            <section className="latest-articles-section">
              <div className="section-header">
                <h2 className="section-title">Latest Articles</h2>
                <p className="section-subtitle">Discover fresh insights and biblical teachings from our community</p>
              </div>
              <div className="latest-articles-row">
                {latestArticles.map((article) => (
                  <div key={article.id} className="latest-article-card">
                    <div className="article-content">
                      <h3 className="article-title">
                        <a href={`/articles/${article.slug || article.id}`}>{article.title}</a>
                      </h3>
                      <p className="article-excerpt">{article.shortExcerpt}</p>
                      <div className="article-author">By {article.author_name}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="view-all">
                <a href="/articles" className="btn-primary">View All Articles</a>
              </div>
            </section>
          )}

          {/* Latest Podcasts Section */}
          {latestPodcasts.length > 0 && (
            <section className="latest-podcasts-section">
              <div className="section-header">
                <h2 className="section-title">Latest Podcasts</h2>
                <p className="section-subtitle">Listen to inspiring faith-based audio content</p>
              </div>
              <div className="latest-podcasts-row">
                {latestPodcasts.map((podcast, index) => (
                  <div key={podcast.id} className="latest-podcast-card">
                    {/* Classic Video Container */}
                    <div className="classic-video-container">
                      {podcast.is_uploaded_file && podcast.download_url ? (
                        /* Classic Audio Player for Uploaded Files */
                        <div className="classic-audio-player">
                          <div className="audio-player-backdrop">
                            <div className="audio-visualizer">
                              <span></span><span></span><span></span>
                              <span></span><span></span>
                            </div>
                            <i className="fas fa-podcast audio-icon"></i>
                          </div>
                          <audio
                            controls
                            className="classic-audio-element"
                            preload="metadata"
                          >
                            <source src={podcast.download_url} type="audio/mpeg" />
                            <source src={podcast.download_url} type="audio/mp3" />
                            <source src={podcast.download_url} type="audio/wav" />
                            <source src={podcast.download_url} type="audio/ogg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      ) : podcast.url && (podcast.url.includes('youtube.com') || podcast.url.includes('youtu.be')) ? (
                        /* Classic YouTube Video Player */
                        <div className="classic-youtube-wrapper">
                          <div className="video-aspect-ratio">
                            <iframe
                              id={`youtube-player-${podcast.id}`}
                              className="classic-youtube-iframe"
                              src={`https://www.youtube.com/embed/${podcast.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&#\?]*)/)?.[1] || ''}?rel=0&modestbranding=1&autohide=1&showinfo=0&controls=1`}
                              title={podcast.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                        </div>
                      ) : (
                        /* Classic Fallback for external podcasts */
                        <div className="classic-fallback">
                          <i className="fas fa-external-link-alt"></i>
                          <p>External Podcast</p>
                          <a href={podcast.url} target="_blank" rel="noopener noreferrer" className="classic-external-btn">
                            Open External Link
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Classic Title Bar */}
                    <div className="classic-podcast-info">
                      <h3 className="classic-podcast-title">
                        <a href={`/resources/${podcast.slug || podcast.id}`}>{podcast.title}</a>
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
              <div className="view-all">
                <a href="/podcasts" className="btn-primary">View All Podcasts</a>
              </div>
            </section>
          )}

          {/* Quick Contact Section */}
          <section className="quick-contact-section" style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            padding: '4rem 2rem',
            borderRadius: '1.5rem',
            textAlign: 'center',
            marginBottom: '4rem',
            border: '1px solid rgba(59, 130, 246, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)'
          }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              color: '#0f172a',
              marginBottom: '1.5rem',
              letterSpacing: '-0.025em'
            }}>📬 Get In Touch</h2>
            <p style={{
              fontSize: '1.15rem',
              color: '#64748b',
              marginBottom: '2rem',
              maxWidth: '600px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              Have questions about our faith community? We'd love to hear from you!
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
              marginBottom: '2rem'
            }}>
              <a href={`mailto:${settings.contact_email || 'contact@faithdefenders.com'}`} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.75rem',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
              }}>
                <i className="fas fa-envelope"></i>
                Send Email
              </a>
              <a href="/about" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1rem 2rem',
                background: 'transparent',
                color: '#64748b',
                textDecoration: 'none',
                border: '2px solid #e2e8f0',
                borderRadius: '0.75rem',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.3s ease'
              }}>
                <i className="fas fa-info-circle"></i>
                Learn More
              </a>
            </div>
          </section>

          {/* Important Content Section */}
          <section className="important-content-section">
            <div className="important-content-grid">
              <div className="important-content-card">
                <div className="content-icon">
                  <i className="fas fa-bible"></i>
                </div>
                <h3>Daily Bible Study</h3>
                <p>Deepen your understanding of God's Word with guided studies and reflections.</p>
                <a href="/resources" className="content-link">Explore Resources →</a>
              </div>
              <div className="important-content-card">
                <div className="content-icon">
                  <i className="fas fa-users"></i>
                </div>
                <h3>Community Fellowship</h3>
                <p>Connect with fellow believers, share insights, and grow together in faith.</p>
                <a href="/about" className="content-link">Join Community →</a>
              </div>
              <div className="important-content-card">
                <div className="content-icon">
                  <i className="fas fa-pray"></i>
                </div>
                <h3>Prayer Support</h3>
                <p>Find encouragement through prayer, share prayer requests, and support one another.</p>
                <a href="/about" className="content-link">Learn More →</a>
              </div>
            </div>
          </section>

        </div>
      </main>

      <Footer c={c} />
    </div>
  )
}

export default Home
