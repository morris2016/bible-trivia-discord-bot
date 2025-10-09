const fs = require('fs');
const { AIBibleQuestionGenerator } = require('./src/ai-bible-question-generator.ts');

// Load existing questions
let existingQuestions = [];
try {
  const data = fs.readFileSync('expert-bible-questions-100.json', 'utf8');
  existingQuestions = JSON.parse(data);
} catch (err) {
  console.log('No existing file or error reading:', err.message);
}

// Need 54 more questions
const needed = 100 - existingQuestions.length;
console.log(`Need to generate ${needed} more expert questions`);

// Initialize generator
const generator = new AIBibleQuestionGenerator(1, process.env.OPENROUTER_API_KEY || '');

// Generate questions
generator.generateQuestionBatch('expert', needed).then(newQuestions => {
  console.log(`Generated ${newQuestions.length} new questions`);

  // Combine with existing
  const allQuestions = [...existingQuestions, ...newQuestions];

  // Write back to file
  fs.writeFileSync('expert-bible-questions-100.json', JSON.stringify(allQuestions, null, 2));

  console.log(`Total questions now: ${allQuestions.length}`);
}).catch(err => {
  console.error('Error generating questions:', err);
});