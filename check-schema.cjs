// Check admin_messages table schema
const { getDB } = require('./src/database-neon.ts');

async function checkSchema() {
  try {
    const sql = getDB();
    const result = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'admin_messages'
      ORDER BY ordinal_position
    `;

    console.log('Current admin_messages table schema:');
    result.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} (${col.is_nullable}) default: ${col.column_default}`);
    });
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkSchema();