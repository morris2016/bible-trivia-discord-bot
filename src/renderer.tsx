import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children, c }: any) => {
  const settings = c?.get('settings') || {};

  // Apply theme and color settings to body
  const bodyStyle = {
    backgroundColor: settings.theme_color || undefined,
    fontFamily: settings.font_family || undefined,
  };

  // Apply CSS custom properties for theme
  const cssVars = `
    :root {
      --primary-color: ${settings.primary_color || '#1e3c72'};
      --secondary-color: ${settings.secondary_color || '#2a5298'};
      --font-family: ${settings.font_family || 'system-ui, -apple-system, sans-serif'};
      --font-size-base: ${settings.base_font_size ? `${settings.base_font_size}px` : '16px'};
      --articles-per-page: ${settings.articles_per_page || '30'};
    }
  `;

  // Determine page-specific CSS files to load
  // In development, c.req might be undefined - provide fallback
  const currentPath = c?.req?.path || '/';
  const basePath = currentPath.split('/')[1] || '';
  const pathSegments = currentPath.split('/').filter(Boolean);

  // Map routes to their specific CSS files
  const pageCssMap: Record<string, string[]> = {
    // All pages use main.css for consistent styling
    '': ['/static/main.css'],
    articles: ['/static/main.css'],
    resources: ['/static/main.css'],
    podcasts: ['/static/main.css'],
    about: ['/static/main.css'],
    login: ['/static/main.css'],
    'verify-email': ['/static/main.css'],
    'forgot-password': ['/static/main.css'],
    'reset-password': ['/static/main.css'],
    dashboard: ['/static/main.css'],
    'security-dashboard': ['/static/main.css'],
    tools: ['/static/main.css'],
    'bible-contest': ['/static/main.css'],
    api: ['/static/main.css'],
    admin: ['/static/main.css'],
    auth: ['/static/main.css'],
    init: ['/static/main.css']
  };

  // Determine which CSS files to load
  let cssFiles: string[];

  if (basePath in pageCssMap) {
    cssFiles = pageCssMap[basePath];
  } else if (pathSegments.length >= 1 && pathSegments[0] in pageCssMap) {
    cssFiles = pageCssMap[pathSegments[0]];
  } else {
    // Default fallback - load common.css globally
    cssFiles = ['/static/common.css'];
  }

  // Handle Article and Resource individual pages
  if (basePath === 'articles' && pathSegments.length === 2) {
    cssFiles = ['/static/main.css'];
  } else if (basePath === 'resources' && pathSegments.length === 2) {
    cssFiles = ['/static/main.css'];
  }

  // For development server, always load main CSS as fallback
  if (!c?.req?.path) {
    cssFiles = ['/static/main.css'];
  }

  // Map routes to their specific JS files (optional)
  const pageJsMap: Record<string, string[]> = {
    '': ['/static/js/home.js'], // Homepage
    articles: ['/static/articles.js'], // Articles page with dedicated functionality
    resources: ['/static/search.js'], // Resources page needs search functionality
    podcasts: ['/static/js/home.js'], // Podcasts use home player functionality
    about: ['/static/js/about.js'],
    login: ['/static/auth.js'],
    'verify-email': ['/static/verification.js'],
    'forgot-password': ['/static/password-reset.js'],
    'reset-password': ['/static/password-reset.js'],
    dashboard: ['/static/dashboard.js'],
    tools: ['/static/js/tools.js']
  };

  // Determine which JS files to load
  let jsFiles: string[] = [];

  if (basePath in pageJsMap) {
    jsFiles = pageJsMap[basePath];
  }

  // For development server, load home JS as fallback
  if (!c?.req?.path && !jsFiles.length) {
    jsFiles = ['/static/js/home.js'];
  }

  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover" />
        <title>{settings.site_title || settings.site_name || 'Faith Defenders'}</title>
        <meta name="description" content={settings.site_description || 'Defending and sharing the Christian faith through articles, resources, and community.'} />
        <meta name="tagline" content={settings.site_tagline || 'Defending and sharing the Christian faith'} />
        <meta name="keywords" content={settings.site_keywords || 'christian, faith, bible, articles, resources, community, gospel'} />
        <meta name="contact" content={settings.contact_email || 'contact@faithdefenders.com'} />
        <meta name="author" content={settings.site_author || settings.site_name || 'Faith Defenders'} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="/" />

        {/* Open Graph Tags */}
        <meta property="og:title" content={settings.site_title || settings.site_name || 'Faith Defenders'} />
        <meta property="og:description" content={settings.site_description || 'Defending and sharing the Christian faith through articles, resources, and community.'} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="/" />
        <meta property="og:image" content={settings.og_image || '/static/images/og-image.jpg'} />
        <meta property="og:site_name" content={settings.site_name || 'Faith Defenders'} />
        <meta property="og:locale" content="en_US" />

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={settings.site_title || settings.site_name || 'Faith Defenders'} />
        <meta name="twitter:description" content={settings.site_description || 'Defending and sharing the Christian faith through articles, resources, and community.'} />
        <meta name="twitter:image" content={settings.og_image || '/static/images/og-image.jpg'} />
        <meta name="twitter:site" content={settings.twitter_handle || '@FaithDefenders'} />
        <meta name="twitter:creator" content={settings.twitter_handle || '@FaithDefenders'} />

        {/* Favicon and Icons */}
        <link rel="icon" href={settings.favicon_url || "/static/favicon.ico"} type="image/x-icon" />
        <link rel="apple-touch-icon" sizes="180x180" href="/static/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/static/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/static/favicon-16x16.png" />

        {/* Preload critical resources */}
        {cssFiles.map(cssFile => (
          <link key={cssFile} rel="preload" href={cssFile} as="style" />
        ))}
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" as="style" />

        {/* Chart.js for dynamic chart rendering */}
        <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>

        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//cdn.jsdelivr.net" />

        {/* Dynamic CSS variables for theme */}
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />

        {/* Load modular CSS files */}
        {cssFiles.map(cssFile => (
          <link key={cssFile} href={cssFile} rel="stylesheet" />
        ))}

        {/* Global Navigation CSS - Load last to allow page-specific overrides */}
        <link href="/static/navigation.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script src="/static/pdfjs/pdf.min.js"></script>
        <script src="/static/pdfjs/pdf.worker.min.js"></script>
        <script src="/static/pdfjs/pdf-viewer.js"></script>

        {/* Font Awesome for icons */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossorigin="anonymous" referrerpolicy="no-referrer" />

        {/* Google AdSense */}
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3301198339974547" crossorigin="anonymous"></script>
      </head>
      <body style={bodyStyle}>
        <div id="app">
          {children}
        </div>

        {/* Load page-specific JavaScript files */}
        {jsFiles.map(jsFile => (
          <script key={jsFile} src={jsFile}></script>
        ))}

        {/* Global Navigation JavaScript */}
        <script src="/static/js/navigation.js"></script>
      </body>
    </html>
  )
})
