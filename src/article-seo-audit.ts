// Article SEO Audit System for Faith Defenders
// This utility provides comprehensive SEO analysis and optimization recommendations for all articles

import { getArticles } from './database-neon'

export interface ArticleSeoAnalysis {
  articleId: number
  title: string
  seoScore: number
  issues: string[]
  recommendations: string[]
  currentSeoData: {
    title: string
    description: string
    keywords: string[]
    canonicalUrl: string
    ogImage: string
    wordCount: number
    readingTime: number
    hasExcerpt: boolean
    hasCategory: boolean
    lastModified: string
  }
}

export interface AuditResults {
  totalArticles: number
  averageSeoScore: number
  articlesNeedingOptimization: ArticleSeoAnalysis[]
  highPriorityIssues: string[]
  recommendations: string[]
}

// Analyze individual article for SEO optimization opportunities
export function analyzeArticleSeo(article: any): ArticleSeoAnalysis {
  const issues: string[] = []
  const recommendations: string[] = []

  // Title analysis
  const titleLength = article.title.length
  const optimizedTitle = optimizeTitle(article.title)
  if (titleLength > 60) {
    issues.push(`Title too long (${titleLength} chars). Optimal: 50-60 chars`)
    recommendations.push(`Consider shortening title from ${titleLength} to 50-60 characters`)
  } else if (titleLength < 30) {
    issues.push(`Title too short (${titleLength} chars). Consider expansion`)
    recommendations.push(`Consider expanding title to 30-60 characters for better SEO`)
  }

  // Description analysis
  const description = article.excerpt || article.content.substring(0, 160).replace(/<[^>]*>/g, '')
  const descLength = description.length
  if (descLength > 160) {
    issues.push(`Meta description too long (${descLength} chars). Max: 160 chars`)
    recommendations.push(`Shorten meta description to 150-160 characters`)
  } else if (descLength < 120) {
    issues.push(`Meta description too short (${descLength} chars). Consider expansion`)
    recommendations.push(`Expand meta description to 120-160 characters`)
  }

  // Content analysis
  const contentText = article.content.replace(/<[^>]*>/g, '')
  const wordCount = contentText.split(/\s+/).length
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  if (wordCount < 300) {
    issues.push(`Content too short (${wordCount} words). Minimum: 300 words`)
    recommendations.push(`Expand content to at least 300 words for better SEO`)
  }

  if (!article.excerpt || article.excerpt.length < 10) {
    issues.push('Missing excerpt/summary')
    recommendations.push(`Add an excerpt of 120-160 characters for better social sharing and search results`)
  }

  // Keyword analysis
  const christianKeywords = [
    'jesus', 'christ', 'bible', 'prayer', 'faith', 'god', 'holy spirit',
    'salvation', 'grace', 'gospel', 'scripture', 'church', 'ministry',
    'worship', 'discipleship', 'evangelism', 'mission', 'testimony'
  ]

  const contentLower = contentText.toLowerCase()
  const foundKeywords = christianKeywords.filter(keyword => contentLower.includes(keyword))

  if (foundKeywords.length < 3) {
    issues.push(`Low keyword diversity (${foundKeywords.length} Christian keywords found)`)
    recommendations.push(`Incorporate more Christian keywords: ${christianKeywords.slice(0, 5).join(', ')}`)
  }

  // OG Image check
  const hasOgImage = article.ogImage || '/static/images/og-article.jpg'
  if (!hasOgImage) {
    issues.push('Missing OG image for social sharing')
    recommendations.push(`Add an OG image (1200x630px) for better social media sharing`)
  }

  // Category analysis
  if (!article.category_name) {
    issues.push('Missing category classification')
    recommendations.push(`Assign article to a relevant category for better organization and SEO`)
  }

  // Calculate SEO score (0-100)
  let seoScore = 100
  seoScore -= issues.length * 10 // Deduct 10 points per issue
  seoScore = Math.max(0, seoScore) // Don't go below 0

  // If score is too high, adjust based on content quality
  if (seoScore > 90 && wordCount < 500) {
    seoScore -= 10
    recommendations.push(`High-quality content detected. Consider adding more depth to reach ${wordCount + 200} words`)
  }

  return {
    articleId: article.id,
    title: article.title,
    seoScore,
    issues,
    recommendations,
    currentSeoData: {
      title: optimizedTitle,
      description: description.substring(0, 160),
      keywords: generateKeywords(article),
      canonicalUrl: `https://faithdefenders.com/articles/${article.slug || article.id}`,
      ogImage: hasOgImage,
      wordCount,
      readingTime,
      hasExcerpt: !!(article.excerpt && article.excerpt.length > 0),
      hasCategory: !!article.category_name,
      lastModified: article.updated_at || article.created_at
    }
  }
}

// Generate optimized keywords for an article
export function generateKeywords(article: any): string[] {
  const keywords = new Set<string>()

  // Base Christian keywords
  keywords.add('christian article')
  keywords.add('faith')
  keywords.add('bible')
  keywords.add('gospel')

  // Category keywords
  if (article.category_name) {
    const categoryWords = article.category_name.toLowerCase().split(/\s+/)
    categoryWords.forEach((word: string) => keywords.add(word))
  }

  // Author keywords
  if (article.author_name) {
    keywords.add(`by ${article.author_name}`)
  }

  // Extract keywords from title
  const titleWords = article.title.toLowerCase()
    .split(/\s+/)
    .filter((word: string) => word.length > 3)
    .slice(0, 3)
  titleWords.forEach((word: string) => keywords.add(word))

  // Extract Christian keywords from content
  const content = article.content.replace(/<[^>]*>/g, '').toLowerCase()
  const christianKeywords = [
    'jesus', 'christ', 'bible', 'prayer', 'faith', 'god', 'salvation',
    'grace', 'gospel', 'scripture', 'church', 'ministry', 'worship'
  ]

  christianKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      keywords.add(keyword)
    }
  })

  return Array.from(keywords).slice(0, 10) // Limit to 10 keywords
}

// Optimize article title for SEO
export function optimizeTitle(title: string): string {
  // Remove any existing SEO suffix to avoid duplication
  let cleanTitle = title
    .replace(/\s*-\s*Faith Defenders.*$/i, '')
    .replace(/\s*\|\s*Faith Defenders.*$/i, '')

  // Ensure optimal length
  if (cleanTitle.length > 57) {
    cleanTitle = cleanTitle.substring(0, 54) + '...'
  }

  return `${cleanTitle} - Faith Defenders Christian Articles`
}

// Suggest OG image based on article content
export function suggestOgImage(article: any): string {
  // Check if article already has an OG image
  if (article.ogImage) {
    return article.ogImage
  }

  // Generate suggestions based on category/topic
  const category = article.category_name?.toLowerCase() || ''
  const content = article.content.toLowerCase()

  if (category.includes('prayer') || content.includes('pray')) {
    return '/static/images/og-prayer.jpg'
  } else if (category.includes('bible') || content.includes('scripture')) {
    return '/static/images/og-bible.jpg'
  } else if (category.includes('faith') || content.includes('faith')) {
    return '/static/images/og-faith.jpg'
  } else if (category.includes('worship') || content.includes('worship')) {
    return '/static/images/og-worship.jpg'
  }

  return '/static/images/og-article.jpg' // Default
}

// Comprehensive SEO audit for all articles
export async function performArticleSeoAudit(limit?: number): Promise<AuditResults> {
  try {
    // Get articles to audit
    const articles = await getArticles(true, limit || 100)
    const analyses = articles.map(analyzeArticleSeo)

    // Calculate summary stats
    const totalArticles = analyses.length
    const averageSeoScore = analyses.reduce((sum, analysis) => sum + analysis.seoScore, 0) / totalArticles
    const articlesNeedingOptimization = analyses.filter(analysis => analysis.seoScore < 80)

    // Aggregate high-priority issues
    const issueCounts: { [key: string]: number } = {}
    analyses.forEach(analysis => {
      analysis.issues.forEach(issue => {
        issueCounts[issue] = (issueCounts[issue] || 0) + 1
      })
    })

    const highPriorityIssues = Object.entries(issueCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([issue, count]) => `${issue} (${count} articles)`)

    // Generate recommendations
    const recommendations = generateBulkRecommendations(analyses)

    return {
      totalArticles,
      averageSeoScore: Math.round(averageSeoScore * 10) / 10,
      articlesNeedingOptimization,
      highPriorityIssues,
      recommendations
    }
  } catch (error) {
    console.error('Error performing article SEO audit:', error)
    throw error
  }
}

// Generate bulk recommendations for optimization
function generateBulkRecommendations(analyses: ArticleSeoAnalysis[]): string[] {
  const recommendations: string[] = []

  // Analyze common patterns
  const missingExcerpts = analyses.filter(a => !a.currentSeoData.hasExcerpt).length
  const missingCategories = analyses.filter(a => !a.currentSeoData.hasCategory).length
  const shortTitles = analyses.filter(a => a.currentSeoData.title.length < 30).length
  const longTitles = analyses.filter(a => a.currentSeoData.title.length > 60).length
  const shortContent = analyses.filter(a => a.currentSeoData.wordCount < 300).length

  if (missingExcerpts > analyses.length * 0.3) {
    recommendations.push(`📝 Add excerpts to ${missingExcerpts} articles (${Math.round(missingExcerpts/analyses.length*100)}%) to improve meta descriptions`)
  }

  if (missingCategories > analyses.length * 0.2) {
    recommendations.push(`🏷️ Assign categories to ${missingCategories} articles for better topical SEO and site structure`)
  }

  if (shortTitles > 0) {
    recommendations.push(`🔤 Expand ${shortTitles} short titles to 30-60 characters for better search visibility`)
  }

  if (longTitles > 0) {
    recommendations.push(`✂️ Shorten ${longTitles} long titles to fit within 50-60 character limit`)
  }

  if (shortContent > 0) {
    recommendations.push(`📄 Expand ${shortContent} articles to at least 300 words for comprehensive coverage`)
  }

  // Priority recommendations
  recommendations.unshift(
    '🎯 Priority: Focus on articles with SEO scores below 70 first',
    '📊 Monitor improvements quarterly to track SEO progress',
    '🔍 Use Google Search Console to identify new keyword opportunities'
  )

  return recommendations
}

// Export audit results to readable format
export function formatAuditResults(results: AuditResults): string {
  return `
📊 Faith Defenders Article SEO Audit Results
═══════════════════════════════════════════════

📈 Overview:
   • Total Articles: ${results.totalArticles}
   • Average SEO Score: ${results.averageSeoScore}/100
   • Articles Needing Optimization: ${results.articlesNeedingOptimization.length}

🚨 High Priority Issues:
${results.highPriorityIssues.map(issue => `   • ${issue}`).join('\n')}

💡 Recommendations:
${results.recommendations.map(rec => `   • ${rec}`).join('\n')}

${results.articlesNeedingOptimization.length > 0 ? `

🔧 Articles Needing Immediate Attention:
${results.articlesNeedingOptimization.slice(0, 10).map(article =>
`   • "${article.title}" (Score: ${article.seoScore})`
).join('\n')}

   ${results.articlesNeedingOptimization.length > 10 ? `   ...and ${results.articlesNeedingOptimization.length - 10} more` : ''}
` : ''}

═══════════════════════════════════════════════
Run this audit monthly to track SEO improvements!
`
}

// Auto-fix function for common SEO issues
export function generateAutoFixes(analysis: ArticleSeoAnalysis): string[] {
  const fixes: string[] = []

  // Title fixes
  if (analysis.currentSeoData.title.length > 60) {
    fixes.push(`Shorten title from ${analysis.currentSeoData.title.length} to ≤60 characters`)
  } else if (analysis.currentSeoData.title.length < 30) {
    fixes.push(`Expand title from ${analysis.currentSeoData.title.length} to ≥30 characters`)
  }

  // Description fixes
  if (analysis.currentSeoData.description.length > 160) {
    fixes.push(`Truncate meta description from ${analysis.currentSeoData.description.length} to 160 characters`)
  } else if (analysis.currentSeoData.description.length < 120) {
    fixes.push(`Expand meta description from ${analysis.currentSeoData.description.length} to 120-160 characters`)
  }

  // Content fixes
  if (analysis.currentSeoData.wordCount < 300) {
    const targetWords = 300 - analysis.currentSeoData.wordCount
    fixes.push(`Add ${targetWords} more words to reach minimum 300 word count`)
  }

  // Missing elements
  if (!analysis.currentSeoData.hasExcerpt) {
    fixes.push('Generate excerpt from article content (120-160 characters)')
  }

  if (!analysis.currentSeoData.hasCategory) {
    fixes.push('Assign article to relevant category')
  }

  return fixes
}
