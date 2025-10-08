// Generate More Unique Bible Questions Script
// Uses AI to generate additional questions for each difficulty level

import { AIBibleQuestionGenerator } from './ai-bible-question-generator';
import { importQuestionsBatch } from './database-neon';

async function generateMoreQuestions(): Promise<void> {
  console.log('🚀 Starting AI generation of additional Bible questions...');

  // Get API key from environment
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY or AI_API_KEY environment variable is required');
  }

  const generator = new AIBibleQuestionGenerator(Date.now(), apiKey);

  // Target distribution - aim for more balanced numbers
  const targets = {
    easy: 50,    // Already has 333, add 50 more = 383 total
    medium: 200, // Has 163, add 200 more = 363 total
    hard: 250,   // Has 117, add 250 more = 367 total
    expert: 100  // Has 175, add 100 more = 275 total
  };

  console.log('📊 Target generation counts:', targets);

  let totalGenerated = 0;
  let totalImported = 0;

  for (const [difficulty, count] of Object.entries(targets) as [keyof typeof targets, number][]) {
    console.log(`\n🎯 Generating ${count} ${difficulty} questions...`);

    try {
      // Generate questions in batches of 10 to avoid overwhelming the API
      const batchSize = 10;
      let generatedForDifficulty = 0;

      for (let i = 0; i < count; i += batchSize) {
        const batchCount = Math.min(batchSize, count - i);
        console.log(`  📦 Generating batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(count / batchSize)} (${batchCount} questions)...`);

        try {
          const questions = await generator.generateQuestionBatch(difficulty, batchCount);

          if (questions.length > 0) {
            // Convert to database format
            const dbQuestions = questions.map(q => ({
              questionText: q.text,
              correctAnswer: q.correctAnswer,
              options: q.options,
              bibleReference: q.reference,
              difficulty: q.difficulty,
              points: q.points,
              category: 'AI Generated',
              subcategory: null,
              tags: ['ai-generated', difficulty],
              questionType: 'multiple-choice',
              verseContext: null,
              explanation: null,
              source: `ai-generator-${difficulty}-${new Date().toISOString().split('T')[0]}`
            }));

            // Import to database
            const importResult = await importQuestionsBatch(dbQuestions);

            generatedForDifficulty += questions.length;
            totalGenerated += questions.length;
            totalImported += importResult.success;

            console.log(`    ✅ Generated: ${questions.length}, Imported: ${importResult.success}, Failed: ${importResult.failed}`);

            if (importResult.errors.length > 0) {
              console.log(`    ⚠️  Errors: ${importResult.errors.slice(0, 3).join('; ')}${importResult.errors.length > 3 ? '...' : ''}`);
            }

            // Small delay between batches to be respectful to the API
            if (i + batchSize < count) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          } else {
            console.log(`    ❌ No questions generated in this batch`);
          }

        } catch (batchError) {
          console.error(`    ❌ Error in batch:`, batchError);
        }
      }

      console.log(`✅ Completed ${difficulty}: Generated ${generatedForDifficulty} questions`);

    } catch (difficultyError) {
      console.error(`❌ Error generating ${difficulty} questions:`, difficultyError);
    }
  }

  console.log('\n📊 Generation Summary:');
  console.log(`   🎯 Total generated: ${totalGenerated} questions`);
  console.log(`   ✅ Successfully imported: ${totalImported} questions`);
  console.log(`   📈 Success rate: ${totalGenerated > 0 ? ((totalImported / totalGenerated) * 100).toFixed(1) : 0}%`);

  // Get final database statistics
  try {
    const { getQuestionStats } = await import('./database-neon');
    const finalStats = await getQuestionStats();
    console.log('\n📊 Final Database Statistics:');
    console.log(`   📚 Total questions: ${finalStats.totalQuestions}`);
    console.log(`   📈 Distribution by difficulty:`, finalStats.questionsByDifficulty);
    console.log(`   ⭐ Average quality score: ${finalStats.averageQualityScore.toFixed(1)}`);
    console.log(`   📊 Sources: ${finalStats.sources.join(', ')}`);
  } catch (statsError) {
    console.error('❌ Error getting final statistics:', statsError);
  }

  if (totalImported > 0) {
    console.log('\n🎊 Successfully added more unique questions to balance the difficulty distribution!');
    console.log('✅ Bible trivia system now has a more comprehensive and balanced question bank!');
  } else {
    console.log('\n⚠️  No new questions were successfully imported. Check the errors above.');
  }
}

// Run the generation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('generate-more-questions.ts')) {
  generateMoreQuestions()
    .then(() => {
      console.log('\n🎉 Question generation process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Generation process failed:', error);
      process.exit(1);
    });
}

export { generateMoreQuestions };