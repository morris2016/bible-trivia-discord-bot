import { Context } from 'hono'
import { Footer } from './footer'
import { Navigation } from './navigation'
import { getResources } from '../database-neon'

interface PodcastsProps {
  c: Context
}

// Podcasts Page Component
export async function Podcasts({ c }: PodcastsProps) {
  const user = await getLoggedInUser(c)
  const resources = await getResources(true)

  // Filter resources to only show podcasts
  const podcasts = resources ? resources.filter(resource => resource.resource_type === 'podcast') : []

  return (
    <div className="min-h-screen">
      <Navigation c={c} user={user} />
      <main className="homepage-main">
        <div className="homepage-container">
          <div className="page-header">
            <h1 className="page-title">Podcasts</h1>
            <p className="page-subtitle">Listen to inspiring faith-based podcasts and audio content.</p>
            {user && (user.role === 'admin' || user.role === 'moderator') && (
              <a href="/admin" className="btn-primary">Add Podcast</a>
            )}
          </div>

          {podcasts.length > 0 ? (
            <div className="podcasts-grid">
              {podcasts.map((podcast, index) => (
                <div key={podcast.id} className="podcast-card">
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
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <i className="fas fa-podcast" style={{ fontSize: '4rem', color: '#6b7280' }}></i>
              </div>
              <h3 className="empty-state-title">No Podcasts Yet</h3>
              <p className="empty-state-description">
                Podcasts are coming soon! We'll be adding inspiring faith-based audio content for you to enjoy.
              </p>
              {user && (user.role === 'admin' || user.role === 'moderator') && (
                <a href="/admin" className="btn-primary">Add the First Podcast</a>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer c={c} />

      {/* Classic Video Player Scripts */}
      <script dangerouslySetInnerHTML={{
        __html: `
          // Classic video player functionality
          document.addEventListener('DOMContentLoaded', function() {
            // Add hover effects to video cards
            const cards = document.querySelectorAll('.podcast-card');
            cards.forEach(card => {
              card.addEventListener('mouseenter', function() {
                const visualizer = this.querySelector('.audio-visualizer');
                if (visualizer) {
                  visualizer.classList.add('active');
                }
              });

              card.addEventListener('mouseleave', function() {
                const visualizer = this.querySelector('.audio-visualizer');
                if (visualizer) {
                  visualizer.classList.remove('active');
                }
              });
            });

            // Handle audio player events
            const audioElements = document.querySelectorAll('.classic-audio-element');
            audioElements.forEach(audio => {
              audio.addEventListener('play', function() {
                const visualizer = this.closest('.classic-audio-player').querySelector('.audio-visualizer');
                if (visualizer) {
                  visualizer.classList.add('active');
                }
              });

              audio.addEventListener('pause', function() {
                const visualizer = this.closest('.classic-audio-player').querySelector('.audio-visualizer');
                if (visualizer) {
                  visualizer.classList.remove('active');
                }
              });

              audio.addEventListener('ended', function() {
                const visualizer = this.closest('.classic-audio-player').querySelector('.audio-visualizer');
                if (visualizer) {
                  visualizer.classList.remove('active');
                }
              });
            });
          });
        `
      }} />

      {/* Classic Podcast Player Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Classic Video Container */
          .classic-video-container {
            position: relative;
            width: 100%;
            height: 281px;
            background: #000;
            border-radius: 8px;
            overflow: hidden;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          /* Classic YouTube Wrapper */
          .classic-youtube-wrapper {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
          }

          .video-aspect-ratio {
            width: 100%;
            height: 0;
            padding-bottom: 56.25%; /* 16:9 aspect ratio */
            position: relative;
          }

          .classic-youtube-iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 8px;
          }

          /* Classic Audio Player */
          .classic-audio-player {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            border-radius: 8px;
            overflow: hidden;
          }

          .audio-player-backdrop {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            width: 100%;
            height: 100%;
          }

          .audio-visualizer {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 2px;
            margin-bottom: 1rem;
          }

          .audio-visualizer span {
            width: 4px;
            height: 20px;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 4px;
            animation: audioWave 1.5s ease-in-out infinite;
          }

          .audio-visualizer span:nth-child(1) { animation-delay: -0.1s; }
          .audio-visualizer span:nth-child(2) { animation-delay: -0.2s; }
          .audio-visualizer span:nth-child(3) { animation-delay: -0.3s; }
          .audio-visualizer span:nth-child(4) { animation-delay: -0.4s; }
          .audio-visualizer span:nth-child(5) { animation-delay: -0.5s; }

          .audio-visualizer.active span {
            background: rgba(255, 255, 255, 0.9);
          }

          @keyframes audioWave {
            0%, 100% { height: 20px; opacity: 0.6; }
            50% { height: 40px; opacity: 1; }
          }

          .audio-icon {
            font-size: 4rem;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 1rem;
          }

          .classic-audio-element {
            width: 100%;
            max-width: 300px;
            margin-top: 1rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 25px;
            padding: 0.5rem;
            border: none;
            outline: none;
          }

          /* Custom audio controls styling */
          .classic-audio-element::-webkit-media-controls-panel {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 25px;
          }

          .classic-audio-element::-webkit-media-controls-current-time-display,
          .classic-audio-element::-webkit-media-controls-time-remaining-display {
            color: white;
          }

          /* Classic Fallback */
          .classic-fallback {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 1rem;
            border-radius: 8px;
          }

          .classic-fallback i {
            font-size: 3rem;
            color: rgba(255, 255, 255, 0.8);
          }

          .classic-fallback p {
            color: white;
            font-size: 1.1rem;
            margin: 0;
          }

          .classic-external-btn {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            text-decoration: none;
            padding: 0.75rem 1.5rem;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            font-size: 0.9rem;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
          }

          .classic-external-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
          }

          /* Classic Podcast Info */
          .classic-podcast-info {
            padding: 1rem;
            background: #f8fafc;
            border-bottom-left-radius: 8px;
            border-bottom-right-radius: 8px;
          }

          .classic-podcast-title {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 600;
            color: #1f293b;
            line-height: 1.4;
          }

          .classic-podcast-title a {
            color: inherit;
            text-decoration: none;
            transition: color 0.2s ease;
          }

          .classic-podcast-title a:hover {
            color: #6366f1;
          }

          /* Podcast Card */
          .podcast-card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            transition: all 0.3s ease;
            margin-bottom: 2rem;
          }

          .podcast-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          }

          /* Podcasts Grid */
          .podcasts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
            padding: 2rem 1rem;
            max-width: 1400px;
            margin: 0 auto;
          }

          /* Responsive Design */
          @media (max-width: 768px) {
            .podcasts-grid {
              grid-template-columns: 1fr;
              gap: 1.5rem;
              padding: 1.5rem 1rem;
            }

            .classic-video-container {
              height: 250px;
            }

            .classic-podcast-title {
              font-size: 1rem;
            }
          }

          @media (max-width: 480px) {
            .classic-video-container {
              height: 200px;
            }

            .audio-icon {
              font-size: 3rem;
            }

            .classic-audio-element {
              max-width: 250px;
            }
          }

          /* Dark Mode Support */
          @media (prefers-color-scheme: dark) {
            .podcast-card {
              background: #1f2937;
            }

            .classic-podcast-info {
              background: #111827;
            }

            .classic-podcast-title {
              color: #f9fafb;
            }
          }

          /* Reduced Motion */
          @media (prefers-reduced-motion: reduce) {
            .podcast-card {
              transition: none;
            }

            .podcast-card:hover {
              transform: none;
            }

            .classic-external-btn:hover {
              transform: none;
            }
          }

          /* Loading Animation */
          @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }

          .audio-visualizer span.active {
            animation-play-state: running;
          }
        `
      }} />
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

export default Podcasts
