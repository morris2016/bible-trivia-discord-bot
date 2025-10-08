// Test if new articles automatically get SEO optimization
console.log('🔍 Testing Automatic SEO for New Articles')
console.log('═'.repeat(50))

async function testArticleSEO(url) {
  try {
    console.log(`📡 Testing article URL: ${url}`)

    const response = await fetch(url)
    const html = await response.text()

    console.log('✅ Article loaded successfully')

    // Check automatic SEO optimizations
    const seoChecks = [
      {
        test: 'Has <title> tag',
        result: html.includes('<title>') && html.match(/<title>Faith Defenders/i)
      },
      {
        test: 'Has meta description',
        result: html.includes('name="description"')
      },
      {
        test: 'Has keywords',
        result: html.includes('name="keywords"')
      },
      {
        test: 'Has Open Graph tags',
        result: html.includes('property="og:title"')
      },
      {
        test: 'Has Twitter cards',
        result: html.includes('name="twitter:title"')
      },
      {
        test: 'Has structured data',
        result: html.match(/application\/ld\+json/) !== null
      },
      {
        test: 'Has canonical URL',
        result: html.includes('rel="canonical"')
      },
      {
        test: 'Article-specific optimizations',
        result: html.includes('article:') || html.includes('article:')
      }
    ]

    console.log('\n🔍 AUTOMATIC SEO OPTIMIZATION CHECK:')
    console.log('─'.repeat(40))

    let autoSEOCount = 0
    let totalChecks = seoChecks.length

    seoChecks.forEach(check => {
      console.log(`${check.result ? '✅' : '❌'} ${check.test}`)
      if (check.result) autoSEOCount++
    })

    const seoScore = Math.round((autoSEOCount / totalChecks) * 100)

    console.log(`\n📊 SEO SCORE: ${autoSEOCount}/${totalChecks} (${seoScore}%)`)

    if (seoScore >= 80) {
      console.log('\n🎉 EXCELLENT: Articles automatically get comprehensive SEO!')
      console.log('✅ The system applies metadata without manual intervention')
      console.log('✅ Structured data is generated on the fly')
      console.log('✅ Open Graph tags created automatically')
    } else if (seoScore >= 60) {
      console.log('\n⚠️  Good: Basic SEO is applied automatically')
      console.log('💡 Some advanced optimizations may need enhancement')
    } else {
      console.log('\n❌ Issue: Limited automatic SEO detected')
      console.log('🚨 Manual SEO configuration may be required')
    }

    // Check for dynamic content
    const hasDynamicTitle = html.match(/<title>[^<]*(old-testament-messianic|messianic)[^<]*<\/title>/i)
    console.log(`\n🔄 Article-Specific Content:`)
    console.log(`${hasDynamicTitle ? '✅' : '❌'} Title includes article-specific content`)

    const hasContentPreview = html.includes('.article-content') || html.includes('.article-body')
    console.log(`${hasContentPreview ? '✅' : '❌'} Article content structure detected`)

    console.log(`\n📋 CONCLUSION:`)
    if (autoSEOCount >= totalChecks * 0.8) {
      console.log('🟢 NEW ARTICLES GET AUTOMATIC SEO WITHOUT MANUAL CREATION!')
      console.log('✅ System is self-sustaining and scalable')
    } else {
      console.log('🟡 LIMITED automatic SEO - may need enhancement')
    }

  } catch (error) {
    console.log('❌ Error testing article SEO:', error.message)
    console.log('\n💡 Ensure your server is running and the article URL is valid')
    console.log('   Try: http://localhost:5173/articles/your-article-slug')
  }
}

// Test one of the existing articles
testArticleSEO('http://localhost:5173/articles/old-testament-messianic-prophecies-and-their-fulfillment')
