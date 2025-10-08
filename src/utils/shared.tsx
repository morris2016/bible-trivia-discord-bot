import { Context } from 'hono'

// Global Settings Loader script (for all pages)
export const GlobalSettingsScript = () => (
  <script dangerouslySetInnerHTML={{
    __html: `
      // Dynamic site settings loader - runs on all pages
      async function loadSiteSettings() {
        try {
          const response = await fetch('/api/settings');
          if (!response.ok) throw new Error('Failed to fetch settings');
          const result = await response.json();
          if (!result.success) throw new Error(result.error || 'Invalid response');
          const settings = result.settings || {};

          // Update document title
          if (settings.site_name) {
            document.title = settings.site_name;

            // Update all h1 elements that might be site titles
            const siteTitles = document.querySelectorAll('.nav-brand h1, .nav-brand h2');
            siteTitles.forEach(title => {
              title.textContent = settings.site_name;
            });

            // Update tagline
            const taglineElement = document.querySelector('.nav-brand .tagline');
            if (taglineElement) {
              taglineElement.textContent = settings.site_tagline || 'Defending and sharing the Christian faith';
            }
          }

          // Update meta tags
          const metaTags = {
            title: document.querySelector('meta[property="og:title"], meta[name="twitter:title"], title') || document.querySelector('title'),
            description: document.querySelector('meta[name="description"], meta[property="og:description"]'),
            tagline: document.querySelector('meta[name="tagline"]'),
            keywords: document.querySelector('meta[name="keywords"], meta[name="twitter:keywords"]')
          };

          if (metaTags.title) {
            if (metaTags.title.tagName.toLowerCase() === 'title') {
              metaTags.title.textContent = settings.site_name || 'Faith Defenders';
            } else {
              metaTags.title.setAttribute('content', settings.site_name || 'Faith Defenders');
            }
          }

          if (metaTags.description) {
            metaTags.description.setAttribute('content', settings.site_description || 'Faith Defenders - Defending and sharing the Christian faith.');
          }

          if (metaTags.tagline) {
            metaTags.tagline.setAttribute('content', settings.site_tagline || 'Defending and sharing the Christian faith');
          }

          if (metaTags.keywords) {
            metaTags.keywords.setAttribute('content', settings.site_keywords || 'christian, faith, bible, articles, resources, community, gospel');
          }

          // Update favicon if set
          if (settings.favicon_url) {
            const link = document.querySelector('link[rel="icon"]') || document.createElement('link');
            link.rel = 'icon';
            link.href = settings.favicon_url;
            if (!document.querySelector('link[rel="icon"]')) {
              document.head.appendChild(link);
            }
          }

          // Update logo if set
          if (settings.logo_url) {
            const logoElements = document.querySelectorAll('.nav-brand img, .nav-brand .logo, .site-logo');
            logoElements.forEach(logo => {
              if (logo.tagName.toLowerCase() === 'img') {
                logo.src = settings.logo_url;
              } else {
                logo.style.backgroundImage = 'url(' + settings.logo_url + ')';
              }
            });
          }

          // Apply CSS custom properties for theme
          const root = document.documentElement;
          const cssVars = {
            '--primary-color': settings.primary_color || '#1e3c72',
            '--secondary-color': settings.secondary_color || '#2a5298',
            '--font-family': settings.font_family || 'system-ui, -apple-system, sans-serif',
            '--font-size-base': settings.base_font_size ? \`\${settings.base_font_size}px\` : '16px',
            '--articles-per-page': settings.articles_per_page || '30'
          };

          Object.entries(cssVars).forEach(([key, value]) => {
            if (value) root.style.setProperty(key, value);
          });

          // Apply theme settings to body
          if (settings.theme_color) {
            document.body.style.backgroundColor = settings.theme_color;
          }

          if (settings.font_family) {
            document.body.style.fontFamily = settings.font_family;
          }

          // Apply dark mode if enabled
          if (settings.enable_dark_mode) {
            document.body.classList.add('dark');
          } else {
            document.body.classList.remove('dark');
          }

          // Control breadcrumb visibility
          const breadcrumbs = document.querySelectorAll('.breadcrumb, .breadcrumbs');
          breadcrumbs.forEach(breadcrumb => {
            if (settings.show_breadcrumbs === false) {
              breadcrumb.style.display = 'none';
            } else {
              breadcrumb.style.display = '';
            }
          });

          // Store settings globally for use in other scripts
          window.siteSettings = settings;
          console.log('Site settings loaded:', Object.keys(settings).length, 'settings applied');

          // Trigger custom event for other scripts to react to settings change
          window.dispatchEvent(new CustomEvent('settingsLoaded', { detail: settings }));

        } catch (error) {
          console.warn('Failed to load site settings:', error);
          // Fallback to hardcoded values if fetch fails
          document.title = 'Faith Defenders';
        }
      }

      // Load settings when DOM is ready, but don't block rendering
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadSiteSettings);
      } else {
        loadSiteSettings();
      }

      // Reload settings on pageshow (for back/forward navigation)
      window.addEventListener('pageshow', loadSiteSettings);
    `
  }} />
)

// Helper function to generate footer (simplified version)
// Utility function to process full HTML documents for display
export function processFullHTMLDocumentForDisplay(html: string): { content: string; scripts: string[]; styles: string[]; externalScripts: string[] } {
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

export function generateFooter(settings: any) {
  const footerText = settings.footer_text || '© 2024 Faith Defenders. All rights reserved.';
  const contactEmail = settings.contact_email || 'contact@faithdefenders.com';
  const phoneNumber = settings.phone_number;
  const address = settings.address;
  const facebookUrl = settings.facebook_url;
  const twitterUrl = settings.twitter_url;
  const instagramUrl = settings.instagram_url;
  const youtubeUrl = settings.youtube_url;

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Social Media Links */}
          {(facebookUrl || twitterUrl || instagramUrl || youtubeUrl) && (
            <div className="footer-social">
              <h4>Follow Us</h4>
              <div className="social-links">
                {facebookUrl && (
                  <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="social-link facebook" title="Follow us on Facebook">
                    <i className="fab fa-facebook-f"></i>
                  </a>
                )}
                {twitterUrl && (
                  <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="social-link twitter" title="Follow us on Twitter">
                    <i className="fab fa-twitter"></i>
                  </a>
                )}
                {instagramUrl && (
                  <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="social-link instagram" title="Follow us on Instagram">
                    <i className="fab fa-instagram"></i>
                  </a>
                )}
                {youtubeUrl && (
                  <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="social-link youtube" title="Subscribe to our YouTube channel">
                    <i className="fab fa-youtube"></i>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Contact Information */}
          {(phoneNumber || address) && (
            <div className="footer-contact">
              <h4>Contact Us</h4>
              <div className="contact-info">
                {phoneNumber && (
                  <div className="contact-item">
                    <i className="fas fa-phone"></i>
                    <span>{phoneNumber}</span>
                  </div>
                )}
                {address && (
                  <div className="contact-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{address}</span>
                  </div>
                )}
                <div className="contact-item">
                  <i className="fas fa-envelope"></i>
                  <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                </div>
              </div>
            </div>
          )}

          {/* Footer Text */}
          <div className="footer-text">
            <p>{footerText}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
