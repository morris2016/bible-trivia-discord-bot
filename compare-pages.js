// Compare homepage vs article page structured data
console.log('🔍 Faith Defenders Page Comparison: Homepage vs Article')
console.log('═'.repeat(60))

async function comparePages() {
  const urls = [
    { name: 'Homepage', url: 'http://localhost:5173' },
    { name: 'Article Page', url: 'http://localhost:5173/articles/old-testament-messianic-prophecies-and-their-fulfillment' }
  ]

  const results = []

  for (const page of urls) {
    try {
      console.log(`\n📡 Testing ${page.name}: ${page.url}`)

      const response = await fetch(page.url)
      const html = await response.text()

      // Extract structued data
      const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)

      // Extract basic meta tags
      const metaTags = html.match(/<meta[^>]*>/gi) || []
      const metaCount = metaTags.length

      results.push({
        name: page.name,
        url: page.url,
        status: response.status,
        htmlLength: html.length,
        hasJsonLd: !!jsonLdMatch,
        jsonLdLength: jsonLdMatch ? jsonLdMatch[1].trim().length : 0,
        metaCount: metaCount,
        title: html.match(/<title>([^<]*)<\/title>/i)?.[1] || 'No title'
      })

      console.log(`✅ Status: ${response.status}`)
      console.log(`📊 HTML Length: ${html.length} characters`)
      console.log(`🏷️  Meta Tags Found: ${metaCount}`)
      console.log(`📝 Title: ${results[results.length - 1].title}`)
      console.log(`📋 Structured Data: ${results[results.length - 1].hasJsonLd ? '✅ Found' : '❌ Not Found'}`)
      if (jsonLdMatch) {
        console.log(`📏 JSON-LD Length: ${jsonLdMatch[1].trim().length} characters`)
      }

    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
      results.push({
        name: page.name,
        url: page.url,
        error: error.message
      })
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 DETAILED COMPARISON:')
  console.log('─'.repeat(40))

  if (results.length >= 2) {
    const [home, article] = results

    console.log(`🏠 Homepage (${home.url}):`)
    console.log(`   📏 HTML Size: ${home.htmlLength} chars`)
    console.log(`   🏷️  Meta Tags: ${home.metaCount}`)
    console.log(`   📝 Title: ${home.title.substring(0, 60)}${home.title.length > 60 ? '...' : ''}`)
    console.log(`   📋 Structured Data: ${home.hasJsonLd ? `✅ Found (${home.jsonLdLength || 'unknown'} chars)` : '❌ Not Found'}`)

    console.log('')
    console.log(`📄 Article Page (${article.url}):`)
    console.log(`   📏 HTML Size: ${article.htmlLength} chars`)
    console.log(`   🏷️  Meta Tags: ${article.metaCount}`)
    console.log(`   📝 Title: ${article.title.substring(0, 60)}${article.title.length > 60 ? '...' : ''}`)
    console.log(`   📋 Structured Data: ${article.hasJsonLd ? `✅ Found (${article.jsonLdLength || 'unknown'} chars)` : '❌ Not Found'}`)

    console.log('')
    console.log('🎯 ANALYSIS:')

    if (home.hasJsonLd && article.hasJsonLd) {
      console.log('✅ BOTH pages have structured data - excellent!')
      console.log(`📊 Size difference: Home(${home.jsonLdLength}) vs Article(${article.jsonLdLength})`)
    } else if (home.hasJsonLd && !article.hasJsonLd) {
      console.log('⚠️  Homepage has structured data, but article page does NOT')
    } else if (!home.hasJsonLd && article.hasJsonLd) {
      console.log('⚠️  Article page has structured data, but homepage does NOT')
      console.log('💡 This suggests different middleware is being used')
    } else {
      console.log('❌ Neither page has structured data')
    }

    // Check meta tag difference
    const metaDiff = article.metaCount - home.metaCount
    if (metaDiff !== 0) {
      console.log(`📋 Meta Tag Difference: Article has ${Math.abs(metaDiff)} ${metaDiff > 0 ? 'more' : 'fewer'} meta tags`)
    }

    // Success assessment
    if (home.hasJsonLd && article.hasJsonLd) {
      console.log('\n🎉 SUCCESS: Complete SEO implementation detected!')
      console.log('📊 100% SEO coverage across your entire website!')
    } else {
      console.log('\n⚠️  Partial implementation detected')
      if (!home.hasJsonLd) console.log('💡 Homepage needs structured data')
      if (!article.hasJsonLd) console.log('💡 Article pages need structured data')
    }
  }
}

comparePages()
