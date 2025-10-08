// Database initialization endpoint for Cloudflare Workers
import { Hono } from 'hono';
import { initializeDatabase, getDB } from './database-neon';

const initApp = new Hono();

// Manual database initialization endpoint
initApp.get('/init-db', async (c) => {
  try {
    console.log('Manual database initialization requested...');

    await initializeDatabase();

    return c.json({
      success: true,
      message: 'Database with all tables initialized successfully',
      tables: [
        'users',
        'articles',
        'resources',
        'categories',
        'comments',
        'likes',
        'page_views',
        'activity_log',
        'user_login_history',
        'user_notifications',
        'email_verifications',
        'admin_messages',
        'admin_message_likes',
        'admin_message_comments',
        'admin_message_reactions',
        'security_events',
        'security_alerts',
        'threat_attacks',
        'blocked_ips',
        'rate_limit_events',
        'active_sessions',
        'bible_games',
        'bible_game_participants',
        'bible_game_questions',
        'bible_game_history'
      ]
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return c.json({
      success: false,
      error: 'Failed to initialize database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});


export default initApp;
