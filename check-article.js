const { getArticles } = require('./src/database-neon.ts');

(async () => {
  try {
    const articles = await getArticles(true);
    const article = articles.find(a => a.slug === 'hghh');
    if (article) {
      console.log('Article found:');
      console.log('Title:', article.title);
      console.log('Content starts with:', article.content.substring(0, 200) + '...');
      console.log('Is full HTML document:', article.content.trim().startsWith('<!DOCTYPE html>') || article.content.trim().startsWith('<html'));
    } else {
      console.log('Article with slug "hghh" not found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
})();