// Simple test to check if server is running and returning HTML
console.log('🔍 Faith Defenders Server Status Check')
console.log('═'.repeat(50))

async function checkServer(url) {
  try {
    console.log(`📡 Testing: ${url}`)

    const response = await fetch(url)

    console.log(`✅ Server responding: ${response.status} ${response.statusText}`)
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}`)
    console.log(`📏 Content-Length: ${response.headers.get('content-length')} bytes`)

    const html = await response.text()

    // Basic HTML checks
    const checks = [
      { name: 'Has <html> tag', test: html.includes('<html') },
      { name: 'Has <head> tag', test: html.includes('<head') },
      { name: 'Has <body> tag', test: html.includes('<body') },
      { name: 'Has Faith Defenders in title', test: html.includes('Faith Defenders') },
      { name: 'Has meta tags', test: html.includes('<meta') },
      { name: 'Has structured data script', test: html.match(/application\/ld\+json/) }
    ]

    console.log('\n📊 BASIC HTML ANALYSIS:')
    console.log('─'.repeat(30))

    checks.forEach(check => {
      console.log(`${check.test ? '✅' : '❌'} ${check.name}`)
    })

    // Show first 500 characters of HTML
    console.log('\n📄 HTML PREVIEW (first 500 characters):')
    console.log('─'.repeat(40))
    console.log(html.substring(0, 500) + '...')

    // Check if HTML looks like server-side rendered content
    if (html.includes('.article-title') || html.includes('Faith Defenders')) {
      console.log('\n🎉 SUCCESS: Server is running and serving content!')
    } else {
      console.log('\n⚠️  HTML looks minimal - might be client-side rendered')
      console.log('💡 Make sure your development server is running (npm run dev)')
    }

  } catch (error) {
    console.log(`❌ Connection Error: ${error.message}`)
    console.log('\n💡 Troubleshooting steps:')
    console.log('1. Make sure your development server is running')
    console.log('2. Check if the correct port is being used (5173)')
    console.log('3. Try restarting your server to load new changes')
    console.log('4. Verify the URL is accessible in your browser')
  }
}

// Test the specific article URL
const testUrl = 'http://localhost:5173/articles/old-testament-messianic-prophecies-and-their-fulfillment'
checkServer(testUrl)

// Also test the homepage
console.log('\n' + '='.repeat(50))
console.log('📡 Also testing homepage...')

const homeUrl = 'http://localhost:5173'
checkServer(homeUrl)
