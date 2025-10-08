import { getDB } from './src/database-neon.ts';

async function fixExpiresColumn() {
  try {
    console.log('Connecting to database...');
    const sql = getDB();

    console.log('Checking if expires_at column exists...');

    // Check if column exists
    const checkResult = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'bible_games' AND column_name = 'expires_at'
    `;

    if (checkResult.length === 0) {
      console.log('expires_at column missing, adding it...');
      await sql`
        ALTER TABLE bible_games
        ADD COLUMN expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '5 minutes')
      `;
      console.log('✅ expires_at column added successfully');
    } else {
      console.log('✅ expires_at column already exists');
    }

    // Test inserting a row to make sure it works
    console.log('Testing insert...');
    const testResult = await sql`
      INSERT INTO bible_games (
        name, difficulty, created_by_name, max_players, questions_per_game, time_per_question
      ) VALUES (
        'test_game', 'easy', 'test_user', 10, 10, 10
      ) RETURNING id, expires_at
    `;

    console.log('✅ Test insert successful:', testResult[0]);

    // Clean up test data
    await sql`DELETE FROM bible_games WHERE name = 'test_game'`;
    console.log('✅ Test cleanup successful');

  } catch (error) {
    console.error('Error:', error);
  }
}

fixExpiresColumn();