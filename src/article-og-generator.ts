// Article OG Image Generation System for Faith Defenders
// Generates optimized social sharing images for Christian articles

interface OgImageTemplate {
  name: string
  theme: 'prayer' | 'bible' | 'faith' | 'worship' | 'ministry' | 'general'
  background: string
  primaryColor: string
  secondaryColor: string
  fontColor: string
  accentColor: string
}

interface ArticleOgConfig {
  title: string
  author: string
  category: string
  excerpt: string
  theme: string
  wordCount: number
  readingTime: number
}

// Predefined Faith-themed templates
const OG_TEMPLATES: OgImageTemplate[] = [
  {
    name: 'Prayer Focus',
    theme: 'prayer',
    background: 'linear-gradient(135deg, #4C1D95, #1E40AF)',
    primaryColor: '#F59E0B',
    secondaryColor: '#DBEAFE',
    fontColor: '#FFFFFF',
    accentColor: '#FBBF24'
  },
  {
    name: 'Bible Study',
    theme: 'bible',
    background: 'linear-gradient(135deg, #7C2D12, #B91C1C)',
    primaryColor: '#FFFFFF',
    secondaryColor: '#FED7AA',
    fontColor: '#FEF3C7',
    accentColor: '#FDBA74'
  },
  {
    name: 'Faith Journey',
    theme: 'faith',
    background: 'linear-gradient(135deg, #166534, #059669)',
    primaryColor: '#ECFDF5',
    secondaryColor: '#A7F3D0',
    fontColor: '#FFFFFF',
    accentColor: '#6EE7B7'
  },
  {
    name: 'Worship Moment',
    theme: 'worship',
    background: 'linear-gradient(135deg, #7C3AED, #4C1D95)',
    primaryColor: '#DDD6FE',
    secondaryColor: '#C4B5FD',
    fontColor: '#FFFFFF',
    accentColor: '#A78BFA'
  },
  {
    name: 'Ministry Work',
    theme: 'ministry',
    background: 'linear-gradient(135deg, #92400E, #EA580C)',
    primaryColor: '#FFFFFF',
    secondaryColor: '#FED7AA',
    fontColor: '#FFF7ED',
    accentColor: '#FB923C'
  },
  {
    name: 'General Faith',
    theme: 'general',
    background: 'linear-gradient(135deg, #1E293B, #334155)',
    primaryColor: '#E2E8F0',
    secondaryColor: '#CBD5E1',
    fontColor: '#FFFFFF',
    accentColor: '#94A3B8'
  }
]

// Get template based on article content and category
export function getOgTemplateForArticle(article: any): OgImageTemplate {
  const content = (article.content + ' ' + article.title + ' ' + (article.category_name || '')).toLowerCase()

  // Check for specific keywords and return matching template
  if (content.includes('pray') || content.includes('prayer') || content.includes('lord')) {
    return OG_TEMPLATES.find(t => t.theme === 'prayer')!
  }
  if (content.includes('bible') || content.includes('scripture') || content.includes('word')) {
    return OG_TEMPLATES.find(t => t.theme === 'bible')!
  }
  if (content.includes('faith') || content.includes('believe') || content.includes('trust')) {
    return OG_TEMPLATES.find(t => t.theme === 'faith')!
  }
  if (content.includes('worship') || content.includes('praise') || content.includes('song')) {
    return OG_TEMPLATES.find(t => t.theme === 'worship')!
  }
  if (content.includes('ministry') || content.includes('serve') || content.includes('mission')) {
    return OG_TEMPLATES.find(t => t.theme === 'ministry')!
  }

  // Default to general faith template
  return OG_TEMPLATES.find(t => t.theme === 'general')!
}

// Generate HTML template for OG image
export function generateOgImageHtml(article: any, template: OgImageTemplate): string {
  const config: ArticleOgConfig = {
    title: article.title,
    author: article.author_name || 'Faith Defenders',
    category: article.category_name || 'Christian Faith',
    excerpt: article.excerpt || article.content.substring(0, 100),
    theme: template.name,
    wordCount: article.content.replace(/<[^>]*>/g, '').split(/\s+/).length,
    readingTime: Math.max(1, Math.ceil(article.content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200))
  }

  return `
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 40px;
      width: 1200px;
      height: 630px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      font-family: 'Georgia', 'Times New Roman', serif;
      background: ${template.background};
      color: ${template.fontColor};
      position: relative;
      overflow: hidden;
    }

    body::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.05)"/><circle cx="80" cy="80" r="1" fill="rgba(255,255,255,0.05)"/></svg>') repeat;
      opacity: 0.3;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }

    .logo-section {
      display: flex;
      align-items: center;
      font-size: 18px;
      font-weight: bold;
      color: ${template.primaryColor};
    }

    .logo-icon {
      font-size: 24px;
      margin-right: 12px;
      color: ${template.accentColor};
    }

    .theme-badge {
      background: ${template.primaryColor};
      color: ${template.background.includes('linear-gradient') ? '#1E293B' : '#000'};
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      max-width: 100%;
    }

    .title {
      font-size: clamp(38px, 5vw, 72px);
      font-weight: bold;
      line-height: 1.1;
      margin: 0 0 20px 0;
      color: ${template.primaryColor};
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .excerpt {
      font-size: 24px;
      line-height: 1.4;
      margin: 0 0 30px 0;
      color: ${template.secondaryColor};
      font-style: italic;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 16px;
      color: ${template.secondaryColor};
    }

    .author-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .author {
      font-weight: bold;
      color: ${template.primaryColor};
    }

    .category {
      font-size: 14px;
      opacity: 0.9;
    }

    .stats {
      display: flex;
      gap: 20px;
      align-items: center;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
    }

    .stat-icon {
      color: ${template.accentColor};
    }

    .brand {
      position: absolute;
      bottom: 20px;
      right: 40px;
      font-size: 12px;
      color: ${template.secondaryColor};
      opacity: 0.7;
      font-style: italic;
    }

    /* Responsive adjustments for very long titles */
    @media (max-width: 600px) {
      .title {
        font-size: 48px;
      }
      .excerpt {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <span class="logo-icon">✝️</span>
      Faith Defenders
    </div>
    <div class="theme-badge">${template.name}</div>
  </div>

  <div class="content">
    <h1 class="title">${config.title}</h1>
    <p class="excerpt">${config.excerpt}...</p>
  </div>

  <div class="footer">
    <div class="author-info">
      <div class="author">By ${config.author}</div>
      <div class="category">${config.category}</div>
    </div>

    <div class="stats">
      <div class="stat">
        <span class="stat-icon">📖</span>
        ${config.readingTime} min read
      </div>
      <div class="stat">
        <span class="stat-icon">📄</span>
        ${config.wordCount} words
      </div>
    </div>
  </div>

  <div class="brand">faithdefenders.com</div>
</body>
</html>`
}

// Generate filename for OG image
export function generateOgImageFilename(article: any): string {
  const slug = article.slug || article.id
  return `og-article-${slug}.jpg`
}

// Generate the public URL for an article's OG image
export function getOgImageUrl(article: any, baseUrl: string = 'https://faithdefenders.com'): string {
  const filename = generateOgImageFilename(article)
  return `${baseUrl}/static/images/og-articles/${filename}`
}

// Configuration for different social platforms
export interface SocialPlatformConfig {
  twitter: { width: number; height: number; filename: string }
  facebook: { width: number; height: number; filename: string }
  linkedin: { width: number; height: number; filename: string }
}

export const SOCIAL_PLATFORMS: SocialPlatformConfig = {
  twitter: { width: 1200, height: 600, filename: 'twitter-' },
  facebook: { width: 1200, height: 630, filename: 'facebook-' },
  linkedin: { width: 1200, height: 627, filename: 'linkedin-' }
}

// Generate OG images for all social platforms
export function generateAllPlatformImages(article: any): { [platform: string]: string } {
  const template = getOgTemplateForArticle(article)
  const baseFilename = generateOgImageFilename(article)

  const images: { [platform: string]: string } = {}

  for (const [platformName, config] of Object.entries(SOCIAL_PLATFORMS)) {
    const filename = `${config.filename}${baseFilename.replace('.jpg', '.png')}`
    images[platformName] = `/static/images/og-articles/${filename}`
  }

  // Also include OG image in the results
  images.og = getOgImageUrl(article)

  return images
}

// Batch process articles to generate OG images
export async function processArticlesForOgImages(articles: any[]): Promise<Array<{
  articleId: number
  title: string
  ogImages: { [platform: string]: string }
  template: string
}>> {
  const results = articles.map(article => {
    const template = getOgTemplateForArticle(article)
    const ogImages = generateAllPlatformImages(article)

    return {
      articleId: article.id,
      title: article.title,
      ogImages,
      template: template.name
    }
  })

  return results
}

// Generate a simple HTML page for testing OG images
export function generateOgImageTestPage(articles: any[]): string {
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Faith Defenders - OG Image Gallery</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    .article-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
    .article-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; }
    .og-image { width: 100%; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .article-title { font-size: 18px; font-weight: bold; margin: 10px 0; }
    .article-meta { font-size: 14px; color: #666; }
    .social-links { margin-top: 10px; }
    .social-links a { margin-right: 10px; padding: 4px 8px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Faith Defenders OG Image Gallery</h1>
  <p>This page shows all generated OG images for articles. Each image can be downloaded for use in article metadata.</p>

  <div class="article-grid">
`

  articles.forEach(article => {
    const template = getOgTemplateForArticle(article)
    const ogImages = generateAllPlatformImages(article)
    const ogHtml = generateOgImageHtml(article, template)

    html += `
    <div class="article-card">
      <div class="og-image">
        <iframe srcdoc="${ogHtml.replace(/"/g, '"')}" width="100%" height="315" style="border: none;"></iframe>
      </div>
      <h3 class="article-title">${article.title}</h3>
      <div class="article-meta">
        <strong>Template:</strong> ${template.name}<br>
        <strong>Author:</strong> ${article.author_name || 'Faith Defenders'}<br>
        <strong>Category:</strong> ${article.category_name || 'General Faith'}
      </div>
      <div class="social-links">
        <a href="#" onclick="downloadOgImage('${article.id}', 'og')">Download OG Image</a>
        <a href="#" onclick="downloadOgImage('${article.id}', 'twitter')">Twitter Format</a>
        <a href="#" onclick="downloadOgImage('${article.id}', 'facebook')">Facebook Format</a>
        <a href="#" onclick="downloadOgImage('${article.id}', 'linkedin')">LinkedIn Format</a>
      </div>
    </div>
    `
  })

  html += `
  </div>

  <script>
    function downloadOgImage(articleId, platform) {
      // This would trigger a server-side image generation and download
      const url = \`/api/og-images/\${articleId}?platform=\${platform}\`
      window.open(url)
    }
  </script>
</body>
</html>
`

  return html
}

// Integration helper for existing articles
export function getOgImagePath(article: any): string {
  if (article.ogImage) {
    return article.ogImage
  }

  // Check if we have a custom path, otherwise use generated path
  if (article.generatedOgImage) {
    return article.generatedOgImage
  }

  // Generate new OG image path
  const template = getOgTemplateForArticle(article)
  const ogImages = generateAllPlatformImages(article)
  return ogImages.og
}
