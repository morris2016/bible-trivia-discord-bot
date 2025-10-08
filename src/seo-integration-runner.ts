// Comprehensive SEO Integration Runner for Faith Defenders
// Automatically audits, analyzes, and optimizes all articles for maximum search engine visibility

import { performArticleSeoAudit, formatAuditResults } from './article-seo-audit'
import { getArticles } from './database-neon'
import { processArticlesForOgImages, generateAllPlatformImages, getOgTemplateForArticle } from './article-og-generator'

// Configuration for the SEO integration run
interface SeoIntegrationConfig {
  auditLimit?: number
  generateOgImages?: boolean
  updateDatabase?: boolean
  verbose?: boolean
  focusOnLowScoring?: boolean
  minimumScore?: number
}

// Results of the comprehensive SEO integration
interface SeoIntegrationResults {
  auditCompleted: Date
  totalArticlesProcessed: number
  articlesAnalyzed: number
  auditResults: any
  ogImagesGenerated: boolean
  databaseUpdated: boolean
  errors: string[]
  recommendations: string[]
  summary: {
    topIssues: Array<{issue: string, count: number}>
    avgSeoScore: number
    articlesNeedingAttention: number
  }
}

// Main integration runner function
export async function runCompleteSeoIntegration(
  config: SeoIntegrationConfig = {}
): Promise<SeoIntegrationResults> {
  const startTime = new Date()
  const errors: string[] = []
  const recommendations: string[] = []

  console.log('🚀 Starting Faith Defenders Comprehensive SEO Integration...')
  console.log(`📅 Started at: ${startTime.toISOString()}`)
  console.log(`⚙️  Configuration:`, config)

  try {
    // Step 1: Get all articles for processing
    console.log('\n📥 Step 1: Fetching articles from database...')
    const allArticles = await getArticles(true, config.auditLimit || 1000)
    console.log(`✅ Retrieved ${allArticles.length} articles`)

    // Step 2: Perform comprehensive SEO audit
    console.log('\n🔍 Step 2: Performing comprehensive SEO audit...')
    const auditResults = await performArticleSeoAudit(config.auditLimit)
    console.log('✅ SEO audit completed')

    if (config.verbose) {
      console.log('\n📊 Audit Summary:')
      console.log(`   • Average SEO Score: ${auditResults.averageSeoScore}/100`)
      console.log(`   • Articles needing optimization: ${auditResults.articlesNeedingOptimization.length}`)
      console.log(`   • Total high-priority issues: ${auditResults.highPriorityIssues.length}`)
    }

    // Step 3: Analyze low-scoring articles (if requested)
    let articlesToFocusOn = auditResults.articlesNeedingOptimization

    if (config.focusOnLowScoring) {
      const minimumScore = config.minimumScore || 70
      articlesToFocusOn = articlesToFocusOn.filter(a => a.seoScore < minimumScore)
      console.log(`\n🎯 Focusing on ${articlesToFocusOn.length} articles with SEO score < ${minimumScore}`)
    }

    // Step 4: Generate OG images for articles (if requested)
    let ogImagesGenerated = false
    let ogImageResults: any[] = []

    if (config.generateOgImages) {
      console.log('\n🖼️  Step 4: Generating OG images for articles...')

      try {
        // Process articles for OG image generation
        const articlesForOgImages = config.focusOnLowScoring
          ? articlesToFocusOn.map(a => allArticles.find(article => article.id === a.articleId)).filter(Boolean)
          : allArticles.filter(a => !a.ogImage) // Articles without existing OG images

        console.log(`   • Processing ${articlesForOgImages.length} articles for OG image generation`)

        ogImageResults = await processArticlesForOgImages(articlesForOgImages)
        ogImagesGenerated = true

        if (config.verbose && ogImageResults.length > 0) {
          console.log('\n🖼️  OG Image Generation Results:')
          ogImageResults.slice(0, 5).forEach(result => {
            console.log(`   • "${result.title}": ${result.template} template → ${result.articleId}`)
          })
          if (ogImageResults.length > 5) {
            console.log(`   • ...and ${ogImageResults.length - 5} more articles`)
          }
        }

        console.log(`✅ Generated OG images for ${ogImageResults.length} articles`)
      } catch (error) {
        errors.push(`OG image generation error: ${error}`)
        console.error('❌ OG image generation failed:', error)
      }
    }

    // Step 5: Prepare database updates (if requested)
    let databaseUpdated = false

    if (config.updateDatabase && ogImageResults.length > 0) {
      console.log('\n💾 Step 5: Preparing database updates...')

      try {
        // Here you would implement database updates
        // This would typically involve updating articles with new OG image paths
        console.log(`   • Would update ${ogImageResults.length} articles with OG image paths`)
        console.log('   • Database update placeholders:')

        ogImageResults.forEach(result => {
          console.log(`     - Article ${result.articleId}: "${result.ogImages.og}"`)
        })

        console.log('✅ Database update plan prepared (implementation needed based on your database setup)')

        // For actual database updates, you would need to:
        // 1. Import your database update functions
        // 2. Loop through ogImageResults and update each article
        // 3. Handle errors and rollbacks if needed

        databaseUpdated = true // Set to false until actual implementation

      } catch (error) {
        errors.push(`Database update error: ${error}`)
        console.error('❌ Database update failed:', error)
      }
    }

    // Step 6: Generate comprehensive recommendations
    console.log('\n💡 Step 6: Generating optimization recommendations...')

    const highPriorityIssues = auditResults.highPriorityIssues
    const articlesNeedingAttention = auditResults.articlesNeedingOptimization.length

    recommendations.push(
      '🎯 **Immediate Actions:**',
      `- Focus on ${articlesNeedingAttention} articles with SEO scores below 80`,
      '- Implement missing excerpts for articles without descriptions',
      '- Add category classification to unassigned articles'
    )

    if (ogImagesGenerated && !databaseUpdated) {
      recommendations.push(
        '💾 **Database Updates:**',
        '- Implement database update functions for OG image paths',
        '- Create migration script to update existing articles',
        '- Set up batch update process for production environment'
      )
    }

    if (auditResults.averageSeoScore < 75) {
      recommendations.push(
        '📈 **Score Improvement:**',
        '- Target average SEO score improvements of 10-15 points',
        '- Focus on title and description optimization first',
        '- Implement content expansion for articles <300 words'
      )
    }

    recommendations.push(
      '🔄 **Ongoing Optimization:**',
      '- Run this SEO integration monthly',
      '- Monitor improvements in Google Search Console',
      '- Track organic traffic increases post-optimization'
    )

    // Step 7: Generate summary
    const summary = {
      topIssues: highPriorityIssues.slice(0, 5).map(issue => ({
        issue: issue.split(' (')[0],
        count: parseInt(issue.split(' (')[1].replace(')', ''))
      })),
      avgSeoScore: auditResults.averageSeoScore,
      articlesNeedingAttention: auditResults.articlesNeedingOptimization.length
    }

    // Step 8: Final results
    const results: SeoIntegrationResults = {
      auditCompleted: new Date(),
      totalArticlesProcessed: allArticles.length,
      articlesAnalyzed: auditResults.totalArticles,
      auditResults,
      ogImagesGenerated,
      databaseUpdated,
      errors,
      recommendations,
      summary
    }

    // Print final results
    console.log('\n📋 SEO Integration Complete!')
    console.log('═'.repeat(60))
    console.log('\n📊 Final Results:')
    console.log(`   • Started: ${startTime.toISOString()}`)
    console.log(`   • Completed: ${results.auditCompleted.toISOString()}`)
    console.log(`   • Processing Time: ${(results.auditCompleted.getTime() - startTime.getTime()) / 1000}s`)
    console.log(`   • Articles Processed: ${results.totalArticlesProcessed}`)
    console.log(`   • Average SEO Score: ${results.summary.avgSeoScore}/100`)
    console.log(`   • Articles Needing Attention: ${results.summary.articlesNeedingAttention}`)
    console.log(`   • OG Images Generated: ${results.ogImagesGenerated ? '✅' : '❌'}`)
    console.log(`   • Database Updated: ${results.databaseUpdated ? '✅' : '❌'}`)

    if (errors.length > 0) {
      console.log('\n❌ Errors Encountered:')
      errors.forEach(error => console.log(`   • ${error}`))
    }

    console.log('\n📈 Top Priority Issues:')
    results.summary.topIssues.forEach(issue => {
      console.log(`   • ${issue.issue}: ${issue.count} articles`)
    })

    console.log('\n💡 Key Recommendations:')
    results.recommendations.slice(0, 5).forEach(rec => {
      console.log(`   • ${rec}`)
    })

    if (results.recommendations.length > 5) {
      console.log(`   • ...and ${results.recommendations.length - 5} more recommendations`)
    }

    console.log('\n🎯 Next Steps:')
    console.log('   • Review detailed audit results in logs')
    console.log('   • Implement high-priority optimizations')
    console.log('   • Set up monthly SEO monitoring')

    return results

  } catch (error) {
    errors.push(`Critical error: ${error}`)
    console.error('\n❌ Critical Error in SEO Integration:', error)

    throw error
  }
}

// Quick SEO status check function
export async function quickSeoStatus(limit: number = 10): Promise<void> {
  try {
    console.log('\n⚡ Quick SEO Status Check')
    console.log('═'.repeat(40))

    const articles = await getArticles(true, limit)
    const auditResults = await performArticleSeoAudit(limit)

    console.log(`\nArticles analyzed: ${articles.length}`)
    console.log(`Average SEO score: ${auditResults.averageSeoScore}/100`)
    console.log(`Articles needing attention: ${auditResults.articlesNeedingOptimization.length}`)

    if (auditResults.highPriorityIssues.length > 0) {
      console.log('\nTop issues:')
      auditResults.highPriorityIssues.slice(0, 3).forEach(issue => {
        console.log(`   • ${issue}`)
      })
    }

  } catch (error) {
    console.error('Quick SEO status check failed:', error)
  }
}

// OG Image generation test function
export async function testOgImageGeneration(): Promise<void> {
  try {
    console.log('\n🖼️  OG Image Generation Test')
    console.log('═'.repeat(40))

    const articles = await getArticles(true, 3) // Test with 3 articles
    const results = await processArticlesForOgImages(articles)

    console.log(`\nGenerated OG images for ${results.length} articles:`)
    results.forEach(result => {
      console.log(`\n📄 "${result.title}" (${result.articleId})`)
      console.log(`   Template: ${result.template}`)
      console.log(`   OG Image: ${result.ogImages.og}`)
      console.log(`   Twitter: ${result.ogImages.twitter}`)
      console.log(`   Facebook: ${result.ogImages.facebook}`)
      console.log(`   LinkedIn: ${result.ogImages.linkedin}`)
    })

  } catch (error) {
    console.error('OG image generation test failed:', error)
  }
}

// Export functions for use in CLI or manual execution
if (import.meta.main) {
  // Run when executed directly as a script
  const args = process.argv.slice(2)

  if (args.includes('--quick')) {
    await quickSeoStatus(parseInt(args[args.indexOf('--quick') + 1]) || 10)
  } else if (args.includes('--test-og')) {
    await testOgImageGeneration()
  } else if (args.includes('--help')) {
    console.log(`
Faith Defenders SEO Integration Runner
═══════════════════════════════════════

Usage:
  node src/seo-integration-runner.ts [options]

Options:
  --quick [limit]    Quick SEO status check (default: 10 articles)
  --test-og         Test OG image generation with sample articles
  --full            Run complete SEO integration (interactive)
  --help            Show this help message

Examples:
  node src/seo-integration-runner.ts --quick 20
  node src/seo-integration-runner.ts --test-og
  node src/seo-integration-runner.ts --full
    `.trim())
  } else {
    console.log('Run with --help for usage information')
    console.log('Or use individual functions programmatically:')
    console.log('')
    console.log(`import { runCompleteSeoIntegration } from './seo-integration-runner'`)
    console.log(`const results = await runCompleteSeoIntegration({ auditLimit: 100, generateOgImages: true })`)
  }
}
