// Quick script to check admin messages in database
import { getAdminMessages } from './src/database-neon.js';

async function checkMessages() {
  try {
    console.log('Checking admin messages...');
    const messages = await getAdminMessages(50);
    console.log(`Found ${messages.length} admin messages:`);

    messages.forEach((msg, index) => {
      console.log(`${index + 1}. ID: ${msg.id}, Content: "${msg.content.substring(0, 50)}...", Author: ${msg.author_name} (${msg.author_role})`);
    });

    if (messages.length === 0) {
      console.log('No admin messages found in database!');
    }
  } catch (error) {
    console.error('Error checking messages:', error);
  }
}

checkMessages();