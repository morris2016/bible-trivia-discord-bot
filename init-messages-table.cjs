// Initialize Messages Table Script (CommonJS)
// Run this to create the admin messaging tables in your database

const { getDB } = require('./src/database-neon.ts');

async function checkTableExists(tableName) {
  const sql = getDB();
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = ${tableName}
      )
    `;
    return result[0].exists;
  } catch (error) {
    console.log(`⚠️  Could not check if ${tableName} exists:`, error.message);
    return false;
  }
}

async function initMessagesTable() {
  try {
    console.log('🔍 Checking admin messaging tables...');

    const tables = [
      'admin_messages',
      'admin_message_likes',
      'admin_message_comments',
      'admin_message_reactions'
    ];

    let allTablesExist = true;
    for (const table of tables) {
      const exists = await checkTableExists(table);
      if (exists) {
        console.log(`✅ ${table} already exists`);
      } else {
        console.log(`❌ ${table} missing`);
        allTablesExist = false;
      }
    }

    if (allTablesExist) {
      console.log('');
      console.log('🎉 All admin messaging tables already exist!');
      console.log('📋 Tables ready:');
      console.log('  - admin_messages (main messages table)');
      console.log('  - admin_message_likes (message likes/reactions)');
      console.log('  - admin_message_comments (message comments)');
      console.log('  - admin_message_reactions (emoji reactions)');
      console.log('');
      console.log('🚀 Your admin messaging system is ready to use!');
      return;
    }

    console.log('');
    console.log('🚀 Initializing missing admin messaging tables...');

    const { initializeDatabase } = require('./src/database-neon.ts');
    await initializeDatabase();

    console.log('✅ Admin messaging tables created successfully!');
    console.log('');
    console.log('📋 Tables created:');
    console.log('  - admin_messages (main messages table)');
    console.log('  - admin_message_likes (message likes/reactions)');
    console.log('  - admin_message_comments (message comments)');
    console.log('  - admin_message_reactions (emoji reactions)');
    console.log('');
    console.log('🎉 Your admin messaging system is ready to use!');

  } catch (error) {
    console.error('❌ Error initializing messaging tables:', error);
    process.exit(1);
  }
}

// Run the initialization
initMessagesTable();