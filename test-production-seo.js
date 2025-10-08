// Test SEO on the LIVE PRODUCTION website (gospelways.com)
console.log('🌐 PRODUCTION SEO VERIFICATION - Live Website Testing')
console.log('═'.repeat(60))

async function testProductionSEO(url) {
  try {
    console.log(`🚀 Testing LIVE production article: ${url}`)

    const response = await fetch(url)
    if (!response.ok) {
      console.log(`❌ Article not found or server error: ${response.status}`)
      console.log(`   Check if the article exists at this URL`)
      return
    }

    const html = await response.text()
    console.log('✅ Production article loaded successfully')

    // Check SEO components on LIVE website
    const seoTests = [
      {
        name: 'Title Tag',
        check: html.includes('<title>'),
        value: html.match(/<title>([^<]*)<\/title>/)?.[1] || 'Not found'
      },
      {
        name: 'Meta Description',
        check: html.includes('name="description"'),
        value: html.match(/content="([^"]*)"[^>]*name="description"/)?.[1]?.substring(0, 80) + '...' || 'Not found'
      },
      {
        name: 'Keywords',
        check: html.includes('name="keywords"'),
        value: html.includes('christian') ? '✓ Christian keywords detected' : 'Not found'
      },
      {
        name: 'Open Graph Title',
        check: html.includes('property="og:title"'),
        value: html.includes('gospelways.com') || html.includes('Faith Defenders') ? 'OG data detected' : 'Not found'
      },
      {
        name: 'Twitter Cards',
        check: html.includes('name="twitter:title"'),
        value: html.includes('name="twitter:') ? 'Twitter data detected' : 'Not found'
      },
      {
        name: 'Canonical URL',
        check: html.includes('rel="canonical"'),
        value: html.includes(url.replace('https://', '')) ? 'Canonical URL set' : 'Not found'
      },
      {
        name: 'Structured Data (JSON-LD)',
        check: html.match(/application\/ld\+json/) !== null,
        value: html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)?.[1?.length] ?
               `${html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1].length} chars JSON-LD` :
               'Not found'
      },
      {
        name: 'Article Content',
        check: html.includes('article') || html.includes('content'),
        value: 'Article structure detected'
      },
      {
        name: 'Faith Defenders Branding',
        check: html.includes('Faith Defenders') || html.includes('Gospel Ways'),
        value: 'Christian ministry branding found'
      }
    ]

    console.log('\n📊 PRODUCTION SEO VERIFICATION:')
    console.log('─'.repeat(40))
    console.log(`🌐 LIVE URL: ${url}`)
    console.log(`📏 HTML Size: ${html.length.toLocaleString()} characters`)
    console.log()

    const scores = []
    seoTests.forEach(test => {
      const status = test.check ? '✅' : '❌'
      console.log(`${status} ${test.name}: ${test.value}`)
      scores.push(test.check)
    })

    const passedCount = scores.filter(Boolean).length
    const totalTests = scores.length
    const successRate = Math.round((passedCount / totalTests) * 100)

    console.log(`\n📈 PRODUCTION SEO SCORE: ${passedCount}/${totalTests} (${successRate}% completion)`)
    console.log()

    if (successRate >= 90) {
      console.log('🎉 EXCELLENT: Production site has comprehensive SEO!')
      console.log('🟢 LIVE website is optimized for search engines')
      console.log('📈 Christian articles getting maximum visibility')
      console.log('🌐 Social sharing and search appearance optimized')
    } else if (successRate >= 70) {
      console.log('⚠️ GOOD: Basic SEO implemented on live site')
      console.log('🔧 Some optimization may need production deployment')
    } else {
      console.log('❌ LIMITED: Production SEO needs improvement')
      console.log('🛠️ Check if SEO system deployed to production')
    }

    // Show some evidence of what we found
    console.log('\n🔍 PRODUCTION ANALYSIS:')
    if (html.match(/<title>([^<]*)<\/title>/)) {
      console.log(`• Page Title: "${html.match(/<title>([^<]*)<\/title>/)[1]}"`)
    }

    if (html.match(/content="([^"]*)"[^>]*name="description"/)) {
      console.log(`• Description: ${html.match(/content="([^"]*)"[^>]*name="description"/)[1].substring(0, 100)}...`)
    }

    // Check for our SEO system evidence
    if (html.includes('Faith Defenders') && html.includes('christian')) {
      console.log('\n✝️ ✅ CHRISTIAN SEO DETECTED: Your SEO system is working!')
    } else {
      console.log('\n❌ CHRISTIAN SEO NOT DETECTED: May need production deployment')
    }

    console.log(`\n🔗 PRODUCTION ARTICLE ACCESSIBLE: ${url}`)
    console.log(`🚀 LIVE SEO SYSTEM STATUS: ${successRate >= 80 ? 'ACTIVE' : 'NEEDS CHECK'}`)

  } catch (error) {
    console.log(`❌ Production connection failed: ${error.message}`)
    console.log('\n💡 Troubleshooting:')
    console.log('• Verify the article URL: https://gospelways.com/articles/[article-slug]')
    console.log('• Check if your production site is accessible')
    console.log('• Confirm SEO system deployed to production')
    console.log('• Try accessing the homepage first: https://gospelways.com')
  }
}

// Test the production article
const productionUrl = 'https://gospelways.com/articles/unveiling-the-truth-a-christian-examination-of-islamic-teachings-and-practices'
testProductionSEO(productionUrl)
