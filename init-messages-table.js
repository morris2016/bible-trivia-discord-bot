// Initialize Messages Table Script
// Run this to create the admin messaging tables in your database

import { initializeDatabase } from './src/database-neon.js';

async function initMessagesTable() {
  try {
    console.log('🚀 Initializing admin messaging tables...');

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