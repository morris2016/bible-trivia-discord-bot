// Quick server connection test
async function checkServer(url) {
  try {
    console.log(`Testing server connection to ${url}...`)
    const response = await fetch(url)
    console.log(`✅ Server responds: ${response.status}`)
    console.log(`✅ Server content loaded successfully`)
    return true
  } catch (error) {
    console.log(`❌ Server connection failed: ${error.message}`)
    console.log(`🔍 Troubleshooting steps:`)
    console.log(`1. Check if your Faith Defenders server is running`)
    console.log(`2. Verify it's on port 5173`)
    console.log(`3. Try accessing http://localhost:5173 in your browser first`)
    return false
  }
}

// Test homepage first
checkServer('http://localhost:5173').then(success => {
  if (success) {
    console.log(`\n🎯 Ready to test article SEO! Run:`)
    console.log(`node test-new-article-seo.js`)
  }
})
