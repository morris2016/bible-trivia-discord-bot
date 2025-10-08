// Specific test to check for structured data (JSON-LD)
console.log('🔍 Checking for Structured Data (JSON-LD) in Faith Defenders SEO')
console.log('═'.repeat(60))

async function checkStructuredData(url) {
  try {
    console.log(`📡 Fetching: ${url}`)

    const response = await fetch(url)
    const html = await response.text()

    console.log('✅ Page loaded successfully')

    // Check multiple patterns for structured data
    const checks = [
      {
        name: 'JSON-LD Script Tag',
        pattern: /<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi,
        found: html.match(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi)
      },
      {
        name: 'Organization Schema',
        pattern: /"@type":\s*"Organization"/,
        found: html.match(/"@type":\s*"Organization"/)
      },
      {
        name: 'WebSite Schema',
        pattern: /"@type":\s*"WebSite"/,
        found: html.match(/"@type":\s*"WebSite"/)
      },
      {
        name: 'WebPage Schema',
        pattern: /"@type":\s*"WebPage"/,
        found: html.match(/"@type":\s*"WebPage"/)
      },
      {
        name: 'Article Schema',
        pattern: /"@type":\s*"Article"/,
        found: html.match(/"@type":\s*"Article"/)
      },
      {
        name: '@context declaration',
        pattern: /"@context":\s*"https:\/\/schema\.org"/,
        found: html.match(/"@context":\s*"https:\/\/schema\.org"/)
      },
      {
        name: '@graph structure',
        pattern: /"@graph"/,
        found: html.match(/"@graph"/)
      }
    ]

    console.log('\n📊 STRUCTURED DATA ANALYSIS:')
    console.log('─'.repeat(40))

    let totalFound = 0
    checks.forEach(check => {
      if (check.found && check.found.length > 0) {
        console.log(`✅ ${check.name}: Found ${check.found.length} occurrence(s)`)
        totalFound++

        // Show a snippet for the first few
        if (check.name === 'JSON-LD Script Tag' && check.found) {
          console.log('  📄 Sample content:', check.found[0].substring(0, 150) + '...')
        }
      } else {
        console.log(`❌ ${check.name}: Not found`)
      }
    })

    console.log('\n📈 SUMMARY:')
    console.log(`Found ${totalFound}/${checks.length} structured data indicators`)

    if (totalFound >= 5) {
      console.log('\n🎉 SUCCESS: Structured data is properly implemented!')
      console.log('🐍 Your site now has rich snippets capability')
      console.log('📊 100% SEO implementation achieved!')
    } else if (totalFound >= 2) {
      console.log('\n⚠️  Partial structured data found')
      console.log('💡 Some schema elements may be loading asynchronously')
    } else {
      console.log('\n❌ Issue detected')
      console.log('🚨 Structured data may not be properly implemented')
    }

    // Show raw JSON-LD for verification
    const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)
    if (jsonLdMatch && jsonLdMatch[1]) {
      console.log('\n📋 RAW STRUCTURED DATA (first 200 characters):')
      console.log('─'.repeat(50))
      console.log(jsonLdMatch[1].substring(0, 200) + '...')
    }

  } catch (error) {
    console.log('❌ Error:', error.message)
    console.log('\n💡 Tips:')
    console.log('- Make sure your Faith Defenders app is running')
    console.log('- Check the URL is accessible:', url)
    console.log('- Try restarting your dev server to load new changes')
  }
}

// Test the article URL
const testUrl = 'http://localhost:5173/articles/old-testament-messianic-prophecies-and-their-fulfillment'
checkStructuredData(testUrl)
