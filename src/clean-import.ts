// Clean Bible Questions Database Import Script
// Imports questions from the cleaned bible-questions-data.ts file

import { BIBLE_QUESTIONS } from './bible-questions-data';
import { importQuestionsBatch, initializeQuestionBankTables, getQuestionStats } from './database-neon';

async function importCleanBibleQuestions(): Promise<void> {
  console.log('🚀 Starting clean Bible questions database import...');
  console.log(`📚 Total questions to import: ${BIBLE_QUESTIONS.length}`);

  try {
    // Initialize the question bank database tables
    console.log('🔧 Initializing database tables...');
    await initializeQuestionBankTables();
    console.log('✅ Database tables initialized');

    // Convert questions to database format
    console.log('📝 Converting questions to database format...');
    const dbQuestions = BIBLE_QUESTIONS.map((q) => ({
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
      source: 'bible-questions-data-clean'
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
        console.log(`   📊 Progress: ${totalSuccess + totalFailed}/${BIBLE_QUESTIONS.length} questions`);

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
      console.log('\n📊 Database Statistics After Import:');
      console.log(`   📚 Total questions in database: ${stats.totalQuestions}`);
      console.log(`   📈 Distribution by difficulty:`, stats.questionsByDifficulty);
      console.log(`   ⭐ Average quality score: ${stats.averageQualityScore.toFixed(1)}`);
    } catch (error) {
      console.error('❌ Error getting database statistics:', error);
    }

    // Save errors to file if any occurred
    if (errors.length > 0) {
      const fs = await import('fs');
      const path = await import('path');
      const errorLogPath = path.join(process.cwd(), 'import-errors.log');
      fs.writeFileSync(errorLogPath, `Import Errors (${new Date().toISOString()}):\n\n${errors.join('\n')}`, 'utf-8');
      console.log(`\n⚠️  ${errors.length} errors occurred. Check import-errors.log for details.`);
      console.log('💡 Common causes: duplicate questions, database constraints, or data format issues.');
    }

    if (totalFailed === 0) {
      console.log('\n🎊 All questions successfully imported to database!');
      console.log('✅ Bible trivia system is now ready with a comprehensive question bank!');
    } else {
      console.log('\n⚠️  Import completed with some failures. The database still has a substantial question bank.');
      console.log('💡 You can re-run the import to retry failed questions, or manually review the errors.');
    }

  } catch (error) {
    console.error('❌ Fatal error during import:', error);
    throw error;
  }
}

// Run the import if this script is executed directly or via tsx
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('clean-import.ts')) {
  importCleanBibleQuestions()
    .then(() => {
      console.log('\n🎉 Bible questions import process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Import process failed:', error);
      process.exit(1);
    });
}

export { importCleanBibleQuestions };