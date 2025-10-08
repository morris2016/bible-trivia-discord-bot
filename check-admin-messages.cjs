// Quick script to check admin messages in database
const { getDB } = require('./src/database-neon.ts');

async function checkMessages() {
  try {
    console.log('🔍 Checking admin messages in database...');

    const sql = getDB();

    // Check if admin_messages table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'admin_messages'
      )
    `;

    if (!tableExists[0].exists) {
      console.log('❌ admin_messages table does not exist!');
      console.log('💡 Run: node init-messages-table.cjs');
      return;
    }

    console.log('✅ admin_messages table exists');

    // Count messages
    const countResult = await sql`
      SELECT COUNT(*) as count FROM admin_messages
    `;

    const messageCount = parseInt(countResult[0].count);
    console.log(`📊 Found ${messageCount} admin messages`);

    if (messageCount === 0) {
      console.log('⚠️  No admin messages found in database!');
      console.log('💡 You need to create some admin messages first');
      return;
    }

    // Get recent messages
    const messages = await sql`
      SELECT id, content, author_name, author_role, created_at
      FROM admin_messages
      ORDER BY created_at DESC
      LIMIT 10
    `;

    console.log('\n📋 Recent admin messages:');
    messages.forEach((msg, index) => {
      const content = msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content;
      console.log(`${index + 1}. ID: ${msg.id} | "${content}" | ${msg.author_name} (${msg.author_role}) | ${msg.created_at}`);
    });

  } catch (error) {
    console.error('❌ Error checking messages:', error);
  }
}

checkMessages();