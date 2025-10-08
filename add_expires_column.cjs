const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: false
});

async function addExpiresColumn() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Check if column exists first
    const checkResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'bible_games' AND column_name = 'expires_at'
    `);

    if (checkResult.rows.length === 0) {
      console.log('expires_at column missing, adding it...');
      await client.query(`
        ALTER TABLE bible_games
        ADD COLUMN expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '5 minutes')
      `);
      console.log('✅ expires_at column added successfully');
    } else {
      console.log('✅ expires_at column already exists');
    }

    // Test inserting a row to make sure it works
    console.log('Testing insert...');
    const testResult = await client.query(`
      INSERT INTO bible_games (
        name, difficulty, created_by_name, max_players, questions_per_game, time_per_question
      ) VALUES (
        'test_game', 'easy', 'test_user', 10, 10, 10
      ) RETURNING id, expires_at
    `);

    console.log('✅ Test insert successful:', testResult.rows[0]);

    // Clean up test data
    await client.query(`DELETE FROM bible_games WHERE name = 'test_game'`);
    console.log('✅ Test cleanup successful');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

addExpiresColumn();