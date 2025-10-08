import { Navigation } from './navigation'

export async function ArticleView({ c }: { c: any }) {
  const user = c.get('user')
  const idOrSlug = c.req.param('idOrSlug')

  console.log(`Loading article with ID/Slug: ${idOrSlug}`)

  // Import and use the database function directly from the Neon database
  const { getArticleById, getArticleBySlug, trackPageView, logActivity } = await import('../database-neon')

  // Prioritize slugs over IDs for better SEO
  let article
  try {
    // First try to get by slug (most common case for SEO-friendly URLs)
    article = await getArticleBySlug(idOrSlug)

    // If not found by slug, try to parse as ID (fallback for legacy URLs)
    if (!article) {
      const id = parseInt(idOrSlug)
      if (!isNaN(id)) {
        article = await getArticleById(id)
      }
    }
  } catch (error) {
    console.error('Error loading article:', error)
    return c.redirect('/articles')
  }

  console.log(`Article found:`, article ? `"${article.title}"` : 'null')

  if (!article) {
    console.log('Article not found, redirecting to articles list')
    return c.redirect('/articles')
  }

  // Track page view
  const userAgent = c.req.header('User-Agent') || ''
  const ipAddress = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || ''

  await trackPageView(article.id, undefined, user?.id, ipAddress, userAgent)

  // Log activity
  if (user) {
    await logActivity(
      user.id,
      'article_view',
      `Viewed article: "${article.title}"`,
      'article',
      article.id
    )
  }

  // Process the article content for full HTML documents
  const processedContent = processFullHTMLDocumentForDisplay(article.content)

  return c.render(
    <div className="min-h-screen">
      <Navigation c={c} user={user} />

      {/* Load external scripts if needed */}
      {processedContent.externalScripts.length > 0 && (
        <>
          {processedContent.externalScripts.map((scriptSrc, index) => (
            <script key={index} src={scriptSrc} />
          ))}
        </>
      )}

      <main className="article-content">
        <div className="article-container">

          <div className="content-layout">
            <div className="main-content-area">
              <article className="article-detail">
                <h1 className="article-title">{article.title}</h1>
                <div className="article-meta">
                  By {article.author_name} • {new Date(article.created_at).toLocaleDateString()}
                </div>

                {/* Inject styles if present */}
                {processedContent.styles.length > 0 && (
                  <style dangerouslySetInnerHTML={{ __html: processedContent.styles.join('\n') }} />
                )}

                {/* Inject external scripts if present */}
                {processedContent.externalScripts.length > 0 && (
                  <>
                    {processedContent.externalScripts.map((scriptSrc, index) => (
                      <script key={index} src={scriptSrc} />
                    ))}
                  </>
                )}

                <div className="article-body" dangerouslySetInnerHTML={{ __html: processedContent.content }} />

                {/* Execute inline scripts if present */}
                {processedContent.scripts.length > 0 && (
                  <script dangerouslySetInnerHTML={{
                    __html: `
                      (function() {
                        try {
                          ${processedContent.scripts.join('\n')}
                        } catch (error) {
                          console.error('Error executing inline scripts:', error);
                        }
                      })();
                    `
                  }} />
                )}
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

// Utility function to process full HTML documents for display
function processFullHTMLDocumentForDisplay(html: string): { content: string; scripts: string[]; styles: string[]; externalScripts: string[] } {
  // Decode HTML entities first - fix the malformed entity decoding
  const decodedHtml = html
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/&/g, '&')
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/'/g, "'");

  // Check if it's a full HTML document
  if (!decodedHtml.trim().startsWith('<!DOCTYPE html>') && !decodedHtml.trim().startsWith('<html')) {
    return { content: html, scripts: [], styles: [], externalScripts: [] };
  }

  // Simple string-based extraction for server-side processing
  const styles: string[] = [];
  const scripts: string[] = [];
  const externalScripts: string[] = [];

  // Extract style tags
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let styleMatch;
  while ((styleMatch = styleRegex.exec(html)) !== null) {
    styles.push(styleMatch[1]);
  }

  // Extract script tags (both inline and external)
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  const scriptTagRegex = /<script[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi;
  let scriptMatch;
  while ((scriptMatch = scriptRegex.exec(html)) !== null) {
    if (scriptMatch[1].trim()) { // Inline scripts
      scripts.push(scriptMatch[1]);
    }
  }

  // Extract external script sources
  let externalMatch;
  while ((externalMatch = scriptTagRegex.exec(html)) !== null) {
    externalScripts.push(externalMatch[1]);
  }

  // Extract body content
  const bodyRegex = /<body[^>]*>([\s\S]*?)<\/body>/i;
  const bodyMatch = bodyRegex.exec(html);
  const content = bodyMatch ? bodyMatch[1] : html;

  return { content, scripts, styles, externalScripts };
}
