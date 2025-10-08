import { Hono } from 'hono'
import { Context } from 'hono'
import type { Next } from 'hono'
import { renderer } from './renderer'
import { initializeDatabase, setGlobalEnv, getSiteSettings } from './database-neon'
import { getLoggedInUser } from './auth'
import api from './api'
import adminApp from './admin-routes'
import adminMessagingApi from './admin-messaging-api'
import googleAuthApp from './google-auth'
import initDbApp from './init-db'
import { securityMonitoring } from './security-monitoring'
import { createSeoMiddleware, defaultSeoMiddleware } from './seo-middleware'
import { securityHeadersMiddleware } from './security-middleware'

// Import database functions
import { getArticles, getResources } from './database-neon'
import { getArticleById, getArticleBySlug, getResourceById, getResourceBySlug, trackPageView, logActivity } from './database-neon'

// Import all page components
import { Home } from './components/home'
import { About } from './components/about'
import { Articles } from './components/articles'
import { Resources } from './components/resources'
import { Podcasts } from './components/podcasts'
import { Login } from './components/login'
import { VerifyEmail } from './components/verify-email'
import { ForgotPassword } from './components/forgot-password'
import { ResetPassword } from './components/reset-password'
import { Dashboard } from './components/dashboard'
import { Tools } from './components/tools'
import { SecurityDashboard } from './components/security-dashboard'
import { BibleContest } from './components/bible-contest'
import { BibleTriviaHtml } from './components/bible-trivia-html'
import { BibleTrivia1Html } from './components/bible-trivia1-html'
import { ArticleView } from './components/article-view'
import { ResourceView } from './components/resource-view'

const app: Hono = new Hono()

// Environment and user context middleware - MUST be before route mounting
app.use('*', async (c, next) => {
  try {
    // Set global environment for database access in Cloudflare Workers
    setGlobalEnv(c.env);

    // Set default user context
    c.set('user', null);
    (c as any).set('userId', null);
    (c as any).set('userRole', 'guest');

    // Default settings
    const defaultSettings = {
      site_name: 'Faith Defenders',
      site_title: 'Faith Defenders - Defending and Sharing the Christian Faith',
      site_description: 'A community dedicated to defending and sharing the Christian faith through articles, resources, and meaningful discussions.',
      primary_color: '#1e3c72',
      secondary_color: '#2a5298'
    };

    // Fetch actual settings synchronously
    let settings = defaultSettings;
    try {
      const fetchedSettings = await getSiteSettings();
      if (fetchedSettings && Object.keys(fetchedSettings).length > 0) {
        settings = { ...defaultSettings, ...fetchedSettings };
      }
    } catch (error) {
      console.error('Error getting site settings:', error);
    }
    (c as any).set('settings', settings);

    // Get user synchronously
    try {
      const user = await getLoggedInUser(c);
      if (user) {
        c.set('user', user);
        (c as any).set('userId', user.id);
        (c as any).set('userRole', user.role || 'guest');
      }
    } catch (error) {
      console.error('Error getting logged in user:', error);
    }

  } catch (error) {
    console.error('Error setting user context:', error);
  }
  await next();
})

// Apply security headers middleware to all routes
app.use('*', securityHeadersMiddleware())

// Mount admin routes FIRST to avoid main API middleware interference
app.route('/api/admin', adminMessagingApi)
app.route('/admin', adminApp)

// Mount security monitoring routes
app.route('/api/security', securityMonitoring.getApp())

// Mount Google OAuth routes
app.route('/auth', googleAuthApp)

// Mount database initialization route
app.route('/init', initDbApp)

// Mount API routes FIRST to ensure they handle requests before renderer middleware
app.route('/api', api)

// Dynamic sitemap generation
app.get('/sitemap.xml', async (c) => {
  try {
    const baseUrl = 'https://faithdefenders.com'; // Replace with your actual domain

    // Get all published articles and resources
    const settings = (c as any).get('settings') || {};
    const articlesPerPage = settings.articles_per_page || 30;
    const [articles, resources] = await Promise.all([
      getArticles(true, articlesPerPage),
      getResources(true)
    ]);

    // Build sitemap XML
    const sitemapEntries = [
      `<url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
      `<url><loc>${baseUrl}/articles</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`,
      `<url><loc>${baseUrl}/resources</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`,
      `<url><loc>${baseUrl}/about</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
    ];

    // Add articles to sitemap
    articles.forEach(article => {
      const lastmod = article.updated_at ? new Date(article.updated_at).toISOString().split('T')[0] : new Date(article.created_at).toISOString().split('T')[0];
      sitemapEntries.push(
        `<url><loc>${baseUrl}/articles/${article.slug || article.id}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`
      );
    });

    // Add resources to sitemap
    resources.forEach(resource => {
      const lastmod = resource.updated_at ? new Date(resource.updated_at).toISOString().split('T')[0] : new Date(resource.created_at).toISOString().split('T')[0];
      sitemapEntries.push(
        `<url><loc>${baseUrl}/resources/${resource.slug || resource.id}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`
      );
    });

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.join('\n')}</urlset>`;

    return c.text(sitemapXml, 200, {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return c.text('Error generating sitemap', 500);
  }
});

// Routes are now mounted earlier to avoid middleware conflicts

// Apply renderer middleware only to non-API routes
app.use('*', async (c, next) => {
  // Skip API routes - let them be handled by the API handlers
  if (c.req.path.startsWith('/api/')) {
    return next();
  }
  return renderer(c, next);
})

app.get('/security-dashboard', async (c) => {
  return SecurityDashboard({ c });
});

app.get('/', createSeoMiddleware({
  title: 'Faith Defenders - Defending and Sharing the Christian Faith',
  description: 'Discover inspiring Christian articles, faith-based resources, and community discussions. Join our mission to strengthen faith through biblical teachings and spiritual growth.',
  keywords: 'christian faith, bible study, christian articles, faith resources, christian community, gospel, spiritual growth, biblical teachings',
  ogImage: '/static/images/og-home.jpg',
  canonical: '/',
  type: 'website'
}), async (c) => {
  return c.render(await Home({ c }))
})

app.get('/articles', createSeoMiddleware({
  title: 'Christian Articles - Faith-Based Content and Biblical Teachings',
  description: 'Explore our collection of inspiring Christian articles, biblical teachings, and faith-based content. Discover insights for spiritual growth and biblical understanding.',
  keywords: 'christian articles, biblical teachings, faith content, spiritual growth, bible study, christian writing, gospel teachings',
  ogImage: '/static/images/og-articles.jpg',
  canonical: '/articles',
  type: 'website'
}), async (c) => {
  return c.render(await Articles({ c }))
})

app.get('/resources', createSeoMiddleware({
  title: 'Christian Resources - Faith-Based Study Materials and Tools',
  description: 'Access comprehensive Christian resources including study guides, books, videos, podcasts, and tools to deepen your faith and biblical understanding.',
  keywords: 'christian resources, bible study guides, christian books, faith videos, christian podcasts, spiritual tools, biblical resources',
  ogImage: '/static/images/og-resources.jpg',
  canonical: '/resources',
  type: 'website'
}), async (c) => {
  return c.render(await Resources({ c }))
})

app.get('/podcasts', async (c) => {
  return c.render(await Podcasts({ c }))
})

app.get('/about', defaultSeoMiddleware, async (c) => {
  return c.render(await About({ c }))
})

app.get('/login', async (c) => {
  return c.render(await Login({ c }));
});

app.get('/forgot-password', async (c) => {
  return c.render(await ForgotPassword({ c }));
});

app.get('/reset-password', async (c) => {
  return c.render(await ResetPassword({ c }));
});

app.get('/verify-email', async (c) => {
  return c.render(await VerifyEmail({ c }));
});

app.get('/dashboard', async (c) => {
  return c.render(await Dashboard({ c }));
});

app.get('/bible-contest', async (c) => {
  return BibleContest({ c });
});

app.get('/tools', async (c) => {
  return c.render(await Tools({ c }));
})

// Bible Trivia route - serves the bible-trivia.html file
app.get('/tools/bible-trivia.html', async (c) => {
  return BibleTriviaHtml({ c });
})

// Bible Trivia 1 route - serves the bible-trivia1.html file
app.get('/tools/bible-trivia1.html', async (c) => {
  return BibleTrivia1Html({ c });
})

// Individual resource view
app.get('/resources/:idOrSlug', async (c) => {
  return ResourceView({ c });
})

// PDF viewer route - uses custom PDF.js viewer
app.get('/resources/:idOrSlug/view', async (c) => {
  return ResourceView({ c });
})

// Individual article view
app.get('/articles/:idOrSlug', async (c) => {
  return ArticleView({ c });
})

export default app
