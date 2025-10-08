// Test script to verify SEO is working on live articles
// Makes actual HTTP requests to check SEO meta tags

console.log('🔍 Faith Defenders SEO Live Testing')
console.log('═'.repeat(50))

const testUrl = 'http://localhost:5173/articles/old-testament-messianic-prophecies-and-their-fulfillment'

async function checkSEOMetaTags(url) {
  try {
    console.log('\n📡 Testing URL:', url)

    const response = await fetch(url)
    const html = await response.text()

    console.log('✅ Request successful')

    const metaTags = []
    const titleMatches = html.match(/<title>([^<]*)<\/title>/i)
    if (titleMatches) {
      console.log('\n🎯 PAGE TITLE:', titleMatches[1])
    }

    // Find all meta tags
    const metaRegex = /<meta[^>]*>/gi
    const metaMatches = html.match(metaRegex)

    if (metaMatches) {
      console.log('\n📊 SEO META TAGS FOUND:')
      console.log('─'.repeat(30))

      metaMatches.forEach((tag, index) => {
        if (index < 15) { // Show first 15 meta tags
          if (tag.includes('property="og:') || tag.includes('name="twitter:') ||
              tag.includes('name="description"') || tag.includes('name="keywords"')) {
            const property = tag.match(/property="([^"]*)"/) || tag.match(/name="([^"]*)"/) || []
            const content = tag.match(/content="([^"]*)"/) || []

            if (property[1] && content[1]) {
              console.log(`✓ ${property[1]}: ${content[1].substring(0, 80)}${content[1].length > 80 ? '...' : ''}`)
            }
          }
        }
      })

      // Check for specific SEO meta tags
      const seoIndicators = {
        'Title optimized': !!titleMatches && titleMatches[1].includes('Faith Defenders'),
        'Meta description': html.includes('name="description"'),
        'OG image': html.includes('property="og:image"'),
        'Twitter cards': html.includes('name="twitter:'),
        'Canonical URL': html.includes('rel="canonical"'),
        'Structured data': html.includes('application/ld+json')
      }

      console.log('\n🔍 SEO CHECKLIST:')
      console.log('─'.repeat(25))
      Object.entries(seoIndicators).forEach(([check, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${check}`)
      })

      const passedCount = Object.values(seoIndicators).filter(Boolean).length
      const totalChecks = Object.keys(seoIndicators).length

      console.log('\n📈 SEO SCORE:', `${passedCount}/${totalChecks} meta tags implemented`)
      console.log('📈 IMPLEMENTATION:', `${Math.round((passedCount/totalChecks) * 100)}% complete`)

      if (passedCount === totalChecks) {
        console.log('\n🎉 SUCCESS: All advanced SEO optimizations are active!')
      } else {
        console.log('\n⚠️  Some SEO optimizations may still be applying...')
      }

    } else {
      console.log('❌ No meta tags found - SEO system may not be running')
    }

    // Check for enhanced article SEO (reading time, etc.)
    if (html.includes('min read') || html.includes('reading time')) {
      console.log('\n✨ BONUS: Reading time estimation detected!')
    }

    if (html.includes('OG images') || html.includes('twitter:image')) {
      console.log('✨ BONUS: Multi-platform social sharing detected!')
    }

  } catch (error) {
    console.log('❌ Error testing SEO:', error.message)
    console.log('\n💡 Make sure your Faith Defenders application is running on port 5173')
    console.log('If not, try:', 'http://localhost:8787/articles/[article-slug]')
  }
}

// Run the test
checkSEOMetaTags(testUrl)

// Additional test URLs for comprehensive checking
const additionalTests = [
  'http://localhost:5173',
  'http://localhost:5173/articles',
  'http://localhost:5173/resources',
  'http://localhost:5173/about'
]

console.log('\n🔧 Additional Tests Available:')
additionalTests.forEach((url, index) => {
  console.log(`${index + 1}. ${url}`)
})
console.log('\nRun checkSEOMetaTags("URL") to test specific pages')
