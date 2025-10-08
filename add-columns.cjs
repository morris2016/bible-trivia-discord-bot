// Add missing columns to admin_messages table
const { getDB } = require('./src/database-neon.ts');

async function addColumns() {
  const sql = getDB();
  try {
    console.log('Adding missing columns to admin_messages table...');

    // Add status column
    console.log('Adding status column...');
    await sql`ALTER TABLE admin_messages ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent'`;
    console.log('✅ Added status column');

    // Add delivered_at column
    console.log('Adding delivered_at column...');
    await sql`ALTER TABLE admin_messages ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP NULL`;
    console.log('✅ Added delivered_at column');

    // Add read_at column
    console.log('Adding read_at column...');
    await sql`ALTER TABLE admin_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP NULL`;
    console.log('✅ Added read_at column');

    console.log('🎉 All missing columns added successfully!');
  } catch (error) {
    console.error('❌ Error adding columns:', error);
  }
}

addColumns();