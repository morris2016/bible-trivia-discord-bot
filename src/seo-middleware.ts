import type { MiddlewareHandler } from 'hono'

interface SeoData {
  title: string
  description: string
  keywords: string
  ogImage: string
  canonical: string
  type?: string
  publishedTime?: string
  modifiedTime?: string
  author?: string
  section?: string
  tags?: string[]
}

export const createSeoMiddleware = (seoData: SeoData): MiddlewareHandler => {
  return async (c, next) => {
    try {
      // Store SEO data in context
      c.set('seo', seoData)
      await next()

      // After the response is generated, inject SEO meta tags
      if (c.res.headers.get('content-type')?.includes('text/html')) {
        const html = await c.res.text()

        // Build SEO meta tags
        const baseUrl = c.env?.DOMAIN || 'https://faithdefenders.com'
        // Improve title formatting for articles - ensure it's optimized for search
        const fullTitle = seoData.type === 'article'
          ? `${seoData.title} - Faith Defenders Christian Articles`
          : seoData.title === 'Faith Defenders'
          ? seoData.title
          : `${seoData.title} | Faith Defenders`
        const canonicalUrl = seoData.canonical.startsWith('http') ? seoData.canonical : `${baseUrl}${seoData.canonical}`
        const ogImageUrl = seoData.ogImage.startsWith('http') ? seoData.ogImage : `${baseUrl}${seoData.ogImage}`

        // Escape special characters for HTML
        const escapeHtml = (text: string) => text
          .replace(/&/g, '&')
          .replace(/</g, '<')
          .replace(/>/g, '>')
          .replace(/"/g, '"')
          .replace(/'/g, '\'')

        const metaTags = `
          <title>${escapeHtml(fullTitle)}</title>
          <meta name="description" content="${escapeHtml(seoData.description)}" />
          <meta name="keywords" content="${escapeHtml(seoData.keywords)}" />
          <meta name="author" content="${escapeHtml(seoData.author || 'Faith Defenders')}" />
          <meta name="robots" content="index, follow" />
          <link rel="canonical" href="${canonicalUrl}" />

          <!-- Open Graph Tags -->
          <meta property="og:title" content="${escapeHtml(fullTitle)}" />
          <meta property="og:description" content="${escapeHtml(seoData.description)}" />
          <meta property="og:type" content="${seoData.type || 'website'}" />
          <meta property="og:url" content="${canonicalUrl}" />
          <meta property="og:image" content="${ogImageUrl}" />
          <meta property="og:site_name" content="Faith Defenders" />
          <meta property="og:locale" content="en_US" />
          ${seoData.publishedTime ? `<meta property="article:published_time" content="${seoData.publishedTime}" />` : ''}
          ${seoData.modifiedTime ? `<meta property="article:modified_time" content="${seoData.modifiedTime}" />` : ''}
          ${seoData.author ? `<meta property="article:author" content="${escapeHtml(seoData.author)}" />` : ''}
          ${seoData.section ? `<meta property="article:section" content="${escapeHtml(seoData.section)}" />` : ''}
          ${seoData.tags ? seoData.tags.map(tag => `<meta property="article:tag" content="${escapeHtml(tag)}" />`).join('\n          ') : ''}

          <!-- Twitter Card Tags -->
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${escapeHtml(fullTitle)}" />
          <meta name="twitter:description" content="${escapeHtml(seoData.description)}" />
          <meta name="twitter:image" content="${ogImageUrl}" />
          <meta name="twitter:site" content="@FaithDefenders" />
          <meta name="twitter:creator" content="@FaithDefenders" />

          <!-- Structured Data -->
          <script type="application/ld+json">
          ${JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              // Organization Schema
              {
                "@type": "Organization",
                "@id": `${baseUrl}#organization`,
                "name": "Faith Defenders",
                "url": baseUrl,
                "logo": {
                  "@type": "ImageObject",
                  "url": `${baseUrl}/static/images/logo.png`,
                  "width": 400,
                  "height": 400
                },
                "description": "Defending and sharing the Christian faith through articles, resources, and community.",
                "sameAs": [
                  "https://twitter.com/FaithDefenders",
                  "https://facebook.com/FaithDefenders"
                ],
                "contactPoint": {
                  "@type": "ContactPoint",
                  "telephone": "+1-555-123-4567",
                  "contactType": "customer service",
                  "availableLanguage": "English"
                }
              },
              // Website Schema
              {
                "@type": "WebSite",
                "@id": `${baseUrl}#website`,
                "url": baseUrl,
                "name": "Faith Defenders",
                "description": "Defending and sharing the Christian faith through articles, resources, and community.",
                "publisher": {
                  "@id": `${baseUrl}#organization`
                },
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": `${baseUrl}/articles?search={search_term_string}`
                  },
                  "query-input": "required name=search_term_string"
                }
              },
              // WebPage Schema
              {
                "@type": "WebPage",
                "@id": `${canonicalUrl}#webpage`,
                "url": canonicalUrl,
                "name": fullTitle,
                "description": seoData.description,
                "isPartOf": {
                  "@id": `${baseUrl}#website`
                },
                "primaryImageOfPage": {
                  "@type": "ImageObject",
                  "url": ogImageUrl
                },
                "datePublished": seoData.publishedTime || new Date().toISOString(),
                "dateModified": seoData.modifiedTime || seoData.publishedTime || new Date().toISOString()
              },
              // Article Schema (if applicable)
              ...(seoData.type === "article" ? [{
                "@type": "Article",
                "@id": `${canonicalUrl}#article`,
                "headline": seoData.title,
                "description": seoData.description,
                "datePublished": seoData.publishedTime,
                "dateModified": seoData.modifiedTime,
                "author": {
                  "@type": "Person",
                  "name": seoData.author || "Faith Defenders"
                },
                "publisher": {
                  "@id": `${baseUrl}#organization`
                },
                "mainEntityOfPage": {
                  "@id": `${canonicalUrl}#webpage`
                },
                "articleSection": seoData.section || "Christian Faith",
                "keywords": seoData.keywords,
                "image": ogImageUrl
              }] : [])
            ]
          }, null, 2)}
          </script>
        `

        // Replace the entire head section content more reliably
        const headRegex = /<head[^>]*>([\s\S]*?)<\/head>/
        const headMatch = html.match(headRegex)

        if (headMatch) {
          const originalHeadContent = headMatch[1]
          // Remove existing SEO-related tags to prevent duplicates
          const cleanedHeadContent = originalHeadContent
            .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
            .replace(/<meta name="description"[^>]*\/?>/gi, '')
            .replace(/<meta name="keywords"[^>]*\/?>/gi, '')
            .replace(/<meta name="author"[^>]*\/?>/gi, '')
            .replace(/<meta name="robots"[^>]*\/?>/gi, '')
            .replace(/<link rel="canonical"[^>]*\/?>/gi, '')
            .replace(/<meta property="og:[^"]*"[^>]*\/?>/gi, '')
            .replace(/<meta name="twitter:[^"]*"[^>]*\/?>/gi, '')
            .replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, '')

          const newHeadContent = metaTags.trim() + cleanedHeadContent
          const modifiedHtml = html.replace(headMatch[0], `<head>${newHeadContent}</head>`)

          // Return modified HTML
          c.res = new Response(modifiedHtml, {
            status: c.res.status,
            headers: c.res.headers
          })
        } else {
          // Fallback: if head section not found, return original response
          console.warn('SEO Middleware: Could not find head section in HTML')
        }
      }
    } catch (error) {
      console.error('SEO Middleware Error:', error)
      // Continue with original response if SEO processing fails
      await next()
    }
  }
}

export const defaultSeoMiddleware: MiddlewareHandler = async (c, next) => {
  const defaultSeo: SeoData = {
    title: 'Faith Defenders',
    description: 'Defending and sharing the Christian faith through articles, resources, and community.',
    keywords: 'christian, faith, bible, articles, resources, community, gospel',
    ogImage: '/static/images/og-image.jpg',
    canonical: c.req.url,
    type: 'website'
  }

  c.set('seo', defaultSeo)
  await next()
}

// Enhanced article SEO middleware with comprehensive optimization
export const createArticleSeoMiddleware = (articleData: {
  id: number
  title: string
  content: string
  excerpt?: string
  author_name: string
  created_at: Date
  updated_at?: Date
  category_name?: string
  slug?: string
}): MiddlewareHandler => {
  return async (c, next) => {
    try {
      const baseUrl = c.env?.DOMAIN || 'https://faithdefenders.com'

      // Extract key content for better SEO (first 200 words for keyword analysis)
      const contentPreview = articleData.content.replace(/<[^>]*>/g, '').substring(0, 300) + '...'

      // Generate optimized meta description
      const metaDescription = articleData.excerpt && articleData.excerpt.length > 10
        ? articleData.excerpt.substring(0, 155) + (articleData.excerpt.length > 155 ? '...' : '')
        : contentPreview.substring(0, 155) + '...'

      // Generate comprehensive keywords for the article
      const baseKeywords = ['christian article', 'faith', 'bible', 'gospel']
      const categoryKeywords = articleData.category_name
        ? articleData.category_name.toLowerCase().split(' ')
        : []
      const authorKeywords = articleData.author_name
        ? [`by ${articleData.author_name}`]
        : []
      const contentKeywords = extractContentKeywords(articleData.content).slice(0, 3)

      const keywords = [
        ...baseKeywords,
        ...categoryKeywords,
        ...contentKeywords,
        ...authorKeywords,
        'christian teaching',
        'spiritual growth'
      ].join(', ')

      // Generate reading time estimate
      const wordCount = articleData.content.replace(/<[^>]*>/g, '').split(/\s+/).length
      const readingTime = Math.max(1, Math.ceil(wordCount / 200)) // Average reading speed

      // Enhanced article SEO data
      const articleSeo: SeoData = {
        title: articleData.title,
        description: metaDescription,
        keywords: keywords,
        ogImage: `/static/images/og-article.jpg`, // Could be enhanced to use article-specific images
        canonical: `/articles/${articleData.slug || articleData.id}`,
        type: 'article',
        publishedTime: articleData.created_at.toISOString(),
        modifiedTime: articleData.updated_at?.toISOString() || articleData.created_at.toISOString(),
        author: articleData.author_name || 'Faith Defenders',
        section: articleData.category_name || 'Christian Faith',
        tags: [
          'christian faith',
          'biblical teaching',
          ...(articleData.category_name ? [articleData.category_name.toLowerCase()] : [])
        ]
      }

      // Apply the base SEO middleware with enhanced article data
      await createSeoMiddleware(articleSeo)(c, next)

      // Add additional article-specific optimizations after base middleware
      if (c.res.headers.get('content-type')?.includes('text/html')) {
        let html = await c.res.clone().text()

        // Add article-specific meta tags
        const articleMetaTags = `
          <!-- Article-specific SEO enhancements -->
          <meta name="article:author" content="${articleData.author_name || 'Faith Defenders'}" />
          <meta name="article:section" content="${articleData.category_name || 'Christian Faith'}" />
          <meta name="article:published_time" content="${articleData.created_at.toISOString()}" />
          ${articleData.updated_at ? `<meta name="article:modified_time" content="${articleData.updated_at.toISOString()}" />` : ''}
          <meta name="article:tag" content="christian faith" />
          <meta name="article:tag" content="biblical teaching" />
          ${articleData.category_name ? `<meta name="article:tag" content="${articleData.category_name}" />` : ''}

          <!-- Reading time and word count -->
          <meta name="twitter:label1" content="Reading time" />
          <meta name="twitter:data1" content="${readingTime} min read" />
          <meta name="twitter:label2" content="Author" />
          <meta name="twitter:data2" content="${articleData.author_name || 'Faith Defenders'}" />
        `

        // Insert article meta tags before closing head tag
        html = html.replace('</head>', `${articleMetaTags}</head>`)

        // Return enhanced HTML
        c.res = new Response(html, {
          status: c.res.status,
          headers: c.res.headers
        })
      }
    } catch (error) {
      console.error('Article SEO Middleware Error:', error)
      await next()
    }
  }
}

// Helper function to extract keywords from article content
function extractContentKeywords(content: string): string[] {
  const text = content.replace(/<[^>]*>/g, '').toLowerCase()
  const christianKeywords = [
    'jesus', 'christ', 'bible', 'prayer', 'faith', 'god', 'holy spirit',
    'salvation', 'grace', 'gospel', 'scripture', 'church', 'ministry',
    'worship', 'discipleship', 'evangelism', 'mission', 'testimony'
  ]

  // Simple keyword extraction - could be enhanced with more sophisticated NLP
  return christianKeywords.filter(keyword =>
    text.includes(keyword) && text.split(keyword).length > 1
  ).slice(0, 5)
}

// Utility function to ensure all articles have SEO optimization
export const ensureArticleSeoOptimization = (article: any) => {
  return {
    seoTitle: optimizeArticleTitle(article.title),
    seoDescription: optimizeArticleDescription(article.excerpt || article.content),
    seoKeywords: generateArticleKeywords(article),
    canonicalUrl: generateCanonicalUrl(article)
  }
}

// Title optimization for articles
function optimizeArticleTitle(title: string): string {
  if (title.endsWith(' - Faith Defenders Christian Articles')) {
    return title
  }
  if (title.length > 50) {
    return title.substring(0, 47) + '... - Faith Defenders Christian Articles'
  }
  return `${title} - Faith Defenders Christian Articles`
}

// Description optimization
function optimizeArticleDescription(content: string): string {
  const cleanContent = content.replace(/<[^>]*>/g, '')
  if (cleanContent.length <= 155) {
    return cleanContent
  }
  return cleanContent.substring(0, 152) + '...'
}

// Keyword generation for articles
function generateArticleKeywords(article: any): string {
  const keywords = new Set(['christian article', 'faith', 'bible'])

  // Add category if available
  if (article.category_name) {
    keywords.add(article.category_name.toLowerCase())
  }

  // Add author-related keyword
  if (article.author_name) {
    keywords.add(`written by ${article.author_name}`)
  }

  // Extract keywords from title
  const titleWords = article.title.toLowerCase().split(/\s+/)
    .filter((word: string) => word.length > 3)
    .slice(0, 3)
  titleWords.forEach((word: string) => keywords.add(word))

  return Array.from(keywords).join(', ')
}

// Canonical URL generation
function generateCanonicalUrl(article: any): string {
  const baseUrl = 'https://faithdefenders.com'
  const slug = article.slug || article.id
  return `${baseUrl}/articles/${slug}`
}
