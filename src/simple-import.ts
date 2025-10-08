// Simple Bible Questions Import Script
// Direct import without complex dependencies

import { BIBLE_QUESTIONS } from './bible-questions-data.js';

async function simpleImport(): Promise<void> {
  console.log('🚀 Starting simple Bible questions import...');
  console.log(`📚 Questions to import: ${BIBLE_QUESTIONS.length}`);

  // Just log the first few questions to verify the import works
  console.log('\n📝 First 5 questions:');
  BIBLE_QUESTIONS.slice(0, 5).forEach((q, i) => {
    console.log(`${i + 1}. ${q.question} (${q.difficulty})`);
  });

  console.log('\n✅ Import verification completed!');
  console.log(`📊 Total questions available: ${BIBLE_QUESTIONS.length}`);
  console.log(`📈 Difficulty distribution:`);

  const byDifficulty = BIBLE_QUESTIONS.reduce((acc, q) => {
    acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(byDifficulty).forEach(([difficulty, count]) => {
    console.log(`   ${difficulty}: ${count} questions`);
  });

  console.log('\n🎉 Bible questions data is ready for database import!');
}

// Run the import if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  simpleImport()
    .then(() => {
      console.log('\n✅ Simple import completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Simple import failed:', error);
      process.exit(1);
    });
}

export { simpleImport };