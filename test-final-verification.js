// FINAL SEO VERIFICATION - Check homepage exactly as before
console.log('🧪 FINAL SEO VERIFICATION')
console.log('═'.repeat(50))

async function checkHomepageSEO(url) {
  try {
    console.log(`📡 Testing: ${url}`)

    const response = await fetch(url)
    const html = await response.text()

    console.log('✅ Homepage loaded')

    const checks = [
      'title contains Faith Defenders',
      'has meta description',
      'has meta keywords',
      'has Open Graph tags',
      'has Twitter cards',
      'has canonical URL',
      'has structured data script'
    ].map(check => {
      let result = false
      let value = ''

      switch(check) {
        case 'title contains Faith Defenders':
          result = html.includes('Faith Defenders')
          value = html.match(/<title>([^<]*)<\/title>/)?.[1] || 'not found'
          break
        case 'has meta description':
          result = html.includes('name="description"')
          value = html.match(/content="([^"]*)"/)?.[1]?.substring(0, 100) + '...' || ''
          break
        case 'has meta keywords':
          result = html.includes('name="keywords"')
          break
        case 'has Open Graph tags':
          result = html.includes('property="og:')
          break
        case 'has Twitter cards':
          result = html.includes('name="twitter:')
          break
        case 'has canonical URL':
          result = html.includes('rel="canonical"')
          break
        case 'has structured data script':
          result = html.match(/application\/ld\+json/) !== null
          const match = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)
          value = match ? `${match[1].length} characters` : 'not found'
          break
      }

      console.log(`${result ? '✅' : '❌'} ${check}${value ? ` (${value})` : ''}`)
      return result
    })

    const passedCount = checks.filter(Boolean).length
    const totalCount = checks.length

    console.log(`\n📈 SCORE: ${passedCount}/${totalCount} (${Math.round(passedCount/totalCount * 100)}%)`)

    if (passedCount === totalCount) {
      console.log('\n🎉 CONGRATULATIONS! Homepage SEO is 100% perfect!')
    } else {
      console.log('\n⚠️  Score is not 100%. Check failed items above.')
    }

  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

checkHomepageSEO('http://localhost:5173')
