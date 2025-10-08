// Import Additional Bible Questions Script
// Adds more questions to balance difficulty distribution

import { BIBLE_QUESTIONS } from './bible-questions-data';
import { ADDITIONAL_BIBLE_QUESTIONS } from './additional-questions';
import { importQuestionsBatch, getQuestionStats } from './database-neon';

async function importAdditionalQuestions(): Promise<void> {
  console.log('🚀 Starting import of additional Bible questions...');

  // Combine existing and additional questions
  const allQuestions = [...BIBLE_QUESTIONS, ...ADDITIONAL_BIBLE_QUESTIONS];

  console.log(`📚 Total questions to process: ${allQuestions.length}`);
  console.log(`📚 Original questions: ${BIBLE_QUESTIONS.length}`);
  console.log(`📚 Additional questions: ${ADDITIONAL_BIBLE_QUESTIONS.length}`);

  // Convert questions to database format
  console.log('📝 Converting questions to database format...');
  const dbQuestions = allQuestions.map((q) => ({
    questionText: q.question,
    correctAnswer: q.correctAnswer,
    options: q.options,
    bibleReference: q.reference,
    difficulty: q.difficulty,
    points: q.points,
    category: q.category,
    subcategory: q.subcategory || null,
    tags: q.tags || [],
    questionType: q.questionType,
    verseContext: q.verseContext || null,
    explanation: q.explanation || null,
    source: 'additional-questions-manual'
  }));

  console.log(`✅ Converted ${dbQuestions.length} questions for import`);

  // Import questions in batches to avoid memory issues
  const batchSize = 500;
  const totalBatches = Math.ceil(dbQuestions.length / batchSize);

  console.log(`📦 Importing questions in ${totalBatches} batches of ${batchSize}...`);

  let totalSuccess = 0;
  let totalFailed = 0;
  const errors: string[] = [];

  for (let i = 0; i < dbQuestions.length; i += batchSize) {
    const batch = dbQuestions.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;

    console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} questions)...`);

    try {
      const importResult = await importQuestionsBatch(batch);

      totalSuccess += importResult.success;
      totalFailed += importResult.failed;

      if (importResult.errors.length > 0) {
        errors.push(...importResult.errors);
        console.log(`   ⚠️  ${importResult.errors.length} errors in this batch`);
      }

      console.log(`   ✅ Success: ${importResult.success}, ❌ Failed: ${importResult.failed}`);
      console.log(`   📊 Progress: ${totalSuccess + totalFailed}/${allQuestions.length} questions`);

      // Small delay between batches to avoid overwhelming the database
      if (batchNumber < totalBatches) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

    } catch (error) {
      console.error(`❌ Error importing batch ${batchNumber}:`, error);
      totalFailed += batch.length;
      errors.push(`Batch ${batchNumber} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Get final statistics
  console.log('\n📊 Import Summary:');
  console.log(`   ✅ Successfully imported: ${totalSuccess} questions`);
  console.log(`   ❌ Failed to import: ${totalFailed} questions`);
  console.log(`   📈 Success rate: ${((totalSuccess / (totalSuccess + totalFailed)) * 100).toFixed(1)}%`);
  console.log(`   🎯 Total processed: ${totalSuccess + totalFailed} questions`);

  // Get database statistics
  try {
    const stats = await getQuestionStats();
    console.log('\n📊 Database Statistics After Additional Import:');
    console.log(`   📚 Total questions in database: ${stats.totalQuestions}`);
    console.log(`   📈 Distribution by difficulty:`, stats.questionsByDifficulty);
    console.log(`   ⭐ Average quality score: ${stats.averageQualityScore.toFixed(1)}`);

    // Show improvement in balance
    const current = stats.questionsByDifficulty;
    const original = { easy: 333, medium: 163, hard: 117, expert: 175 };
    console.log('\n📊 Balance Improvement:');
    console.log(`   Easy: ${original.easy} → ${current.easy || 0} (+${(current.easy || 0) - original.easy})`);
    console.log(`   Medium: ${original.medium} → ${current.medium || 0} (+${(current.medium || 0) - original.medium})`);
    console.log(`   Hard: ${original.hard} → ${current.hard || 0} (+${(current.hard || 0) - original.hard})`);
    console.log(`   Expert: ${original.expert} → ${current.expert || 0} (+${(current.expert || 0) - original.expert})`);

  } catch (error) {
    console.error('❌ Error getting database statistics:', error);
  }

  // Save errors to file if any occurred
  if (errors.length > 0) {
    const fs = await import('fs');
    const path = await import('path');
    const errorLogPath = path.join(process.cwd(), 'additional-import-errors.log');
    fs.writeFileSync(errorLogPath, `Additional Import Errors (${new Date().toISOString()}):\n\n${errors.join('\n')}`, 'utf-8');
    console.log(`\n⚠️  ${errors.length} errors occurred. Check additional-import-errors.log for details.`);
  }

  if (totalFailed === 0) {
    console.log('\n🎊 All additional questions successfully imported to database!');
    console.log('✅ Bible trivia system now has a more balanced and comprehensive question bank!');
  } else {
    console.log('\n⚠️  Import completed with some failures. The database still has substantial additional questions.');
    console.log('💡 You can re-run the import to retry failed questions, or manually review the errors.');
  }
}

// Run the import if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('additional-import.ts')) {
  importAdditionalQuestions()
    .then(() => {
      console.log('\n🎉 Additional questions import process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Import process failed:', error);
      process.exit(1);
    });
}

export { importAdditionalQuestions };