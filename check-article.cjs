// Check article with slug 'hghh'
const { getArticles } = require('./src/database-neon.ts');

async function checkArticle() {
  try {
    const articles = await getArticles(true);
    const article = articles.find(a => a.slug === 'hgvv');

    if (article) {
      console.log('✅ Article found!');
      console.log('Title:', article.title);
      console.log('Slug:', article.slug);
      console.log('Published:', article.published);
      console.log('Content length:', article.content.length, 'characters');

      const isFullHTML = article.content.trim().startsWith('<!DOCTYPE html>') || article.content.trim().startsWith('<html');
      console.log('Is full HTML document:', isFullHTML);

      if (isFullHTML) {
        console.log('✅ This is a full HTML document that should be processed!');
        console.log('Content preview:', article.content.substring(0, 300) + '...');
      } else {
        console.log('Content preview:', article.content.substring(0, 200) + '...');
      }
    } else {
      console.log('❌ Article with slug "hghh" not found');
      console.log('Available articles:');
      articles.slice(0, 5).forEach(a => {
        console.log(`  - ${a.title} (${a.slug})`);
      });
    }
  } catch (error) {
    console.error('❌ Error checking article:', error);
  }
}

checkArticle();