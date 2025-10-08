// Simple import script for additional questions - manually create database connection
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Database connection
const databaseUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_bCSE8mA2YjgT@ep-weathered-mode-adqdxv9w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=disable';

const sql = neon(databaseUrl);

// Import questions function
async function importQuestionsBatch(questions) {
  let success = 0;
  let failed = 0;
  const errors = [];

  try {
    // Process questions individually to handle duplicates properly
    for (const question of questions) {
      try {
        const result = await sql`
          INSERT INTO bible_questions (
            question_text, correct_answer, options, bible_reference, difficulty,
            points, category, subcategory, tags, question_type, verse_context,
            explanation, source, quality_score, created_at, updated_at
          )
          VALUES (
            ${question.questionText}, ${question.correctAnswer}, ${JSON.stringify(question.options)}::jsonb,
            ${question.bibleReference}, ${question.difficulty}, ${question.points},
            ${question.category}, ${question.subcategory || null}, ${JSON.stringify(question.tags || [])}::jsonb,
            ${question.questionType}, ${question.verseContext || null}, ${question.explanation || null},
            ${question.source}, ${question.qualityScore || null}, NOW(), NOW()
          )
          ON CONFLICT (question_text, correct_answer, bible_reference) DO NOTHING
          RETURNING id
        `;

        if (result.length > 0) {
          success++;
        } else {
          // Question was skipped due to conflict (duplicate)
          success++; // Still count as success since it exists
        }

      } catch (questionError) {
        console.error('Error importing question:', questionError);
        failed++;
        errors.push(`Question import failed: ${questionError instanceof Error ? questionError.message : String(questionError)}`);
      }
    }

  } catch (error) {
    console.error('Error in batch import:', error);
    failed = questions.length;
    errors.push(`Batch import failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  return { success, failed, errors };
}

// Get question stats function
async function getQuestionStats() {
  try {
    // Get total count
    const totalResult = await sql`SELECT COUNT(*) as count FROM bible_questions`;
    const totalQuestions = parseInt(totalResult[0].count);

    // Get distribution by difficulty
    const difficultyResult = await sql`
      SELECT difficulty, COUNT(*) as count
      FROM bible_questions
      GROUP BY difficulty
      ORDER BY difficulty
    `;

    const questionsByDifficulty = {};
    difficultyResult.forEach((row) => {
      questionsByDifficulty[row.difficulty] = parseInt(row.count);
    });

    // Get distribution by category
    const categoryResult = await sql`
      SELECT category, COUNT(*) as count
      FROM bible_questions
      GROUP BY category
      ORDER BY category
    `;

    const questionsByCategory = {};
    categoryResult.forEach((row) => {
      questionsByCategory[row.category] = parseInt(row.count);
    });

    // Get average quality score
    const qualityResult = await sql`
      SELECT AVG(quality_score) as avg_score
      FROM bible_questions
      WHERE quality_score IS NOT NULL
    `;

    const averageQualityScore = qualityResult[0].avg_score ? parseFloat(qualityResult[0].avg_score) : 0;

    // Get unique sources
    const sourceResult = await sql`
      SELECT DISTINCT source
      FROM bible_questions
      ORDER BY source
    `;

    const sources = sourceResult.map((row) => row.source);

    return {
      totalQuestions,
      questionsByDifficulty,
      questionsByCategory,
      averageQualityScore,
      sources
    };

  } catch (error) {
    console.error('Error getting question stats:', error);
    return {
      totalQuestions: 0,
      questionsByDifficulty: {},
      questionsByCategory: {},
      averageQualityScore: 0,
      sources: []
    };
  }
}

async function importAdditionalQuestions() {
  try {
    console.log('🚀 Starting additional questions import...');

    // Load the additional questions
    const questionsFilePath = path.join(process.cwd(), 'src', 'additional-questions.ts');
    const fileContent = fs.readFileSync(questionsFilePath, 'utf8');

    // Extract the questions array from the file (basic regex approach)
    const questionsMatch = fileContent.match(/export const ADDITIONAL_BIBLE_QUESTIONS = (\[[\s\S]*?\]);/);
    if (!questionsMatch) {
      throw new Error('Could not find ADDITIONAL_BIBLE_QUESTIONS in the file');
    }

    // Parse the JavaScript array (this is basic - in production you'd use a proper JS parser)
    const questionsCode = questionsMatch[1]
      // Replace export with empty string
      .replace(/export const ADDITIONAL_BIBLE_QUESTIONS = /, '')
      // Remove trailing semicolon
      .replace(/;$/, '');

    let questions;
    try {
      questions = eval(questionsCode);
    } catch (evalError) {
      console.error('Failed to parse questions from file:', evalError);
      throw new Error('Could not parse questions array from TypeScript file');
    }

    console.log(`📊 Found ${questions.length} raw questions in file`);

    // Map the question structure to database format
    const questionsToImport = questions.map(q => ({
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
      source: 'additional-questions-ts',
      qualityScore: null
    }));

    console.log(`📊 Found ${questionsToImport.length} questions to import`);
    console.log('📋 Sample question structure:', JSON.stringify(questionsToImport[0], null, 2));

    // Import questions in batches
    const batchSize = 50;
    const results = [];
    let totalSuccess = 0;
    let totalFailed = 0;

    for (let i = 0; i < questionsToImport.length; i += batchSize) {
      const batch = questionsToImport.slice(i, i + batchSize);
      console.log(`📦 Importing batch ${Math.floor(i/batchSize) + 1} (${batch.length} questions)...`);

      try {
        const result = await importQuestionsBatch(batch);
        results.push(result);
        totalSuccess += result.success;
        totalFailed += result.failed;

        console.log(`✅ Batch completed: ${result.success} success, ${result.failed} failed`);
        if (result.errors.length > 0) {
          console.log('❌ Errors:', result.errors.slice(0, 3).join('; '));
        }
      } catch (error) {
        console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, error);
        totalFailed += batch.length;
        results.push({ success: 0, failed: batch.length, errors: [error.message] });
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 IMPORT COMPLETE!');
    console.log('📊 Final Results:');
    console.log(`   ✅ Successfully imported: ${totalSuccess} questions`);
    console.log(`   ❌ Failed to import: ${totalFailed} questions`);
    console.log(`   📈 Total questions processed: ${questionsToImport.length}`);

    // Get stats after import
    console.log('\n📈 Getting updated question stats...');
    const stats = await getQuestionStats();

    console.log('📊 Current Database Statistics:');
    console.log(`   Total questions: ${stats.totalQuestions}`);
    console.log(`   By difficulty:`, JSON.stringify(stats.questionsByDifficulty, null, 2));
    console.log(`   By category:`, JSON.stringify(stats.questionsByCategory, null, 2));
    console.log(`   Average quality score: ${stats.averageQualityScore.toFixed(2)}`);
    console.log(`   Sources: ${stats.sources.join(', ')}`);

    // Check if our new source is represented
    const sourcesWithNew = stats.sources || [];
    if (sourcesWithNew.includes('additional-questions-ts')) {
      console.log('✅ New questions successfully added to database!');
    } else {
      console.log('⚠️ Warning: New source not found in database sources');
    }

  } catch (error) {
    console.error('❌ Import failed with error:', error);
    process.exit(1);
  }
}

// Run the import
importAdditionalQuestions().then(() => {
  console.log('\n🏁 All done!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
