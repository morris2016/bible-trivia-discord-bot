// Script to complete the stuck database initialization promise
const { neon } = require('@neondatabase/serverless');

// Database connection
const databaseUrl = process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  'postgres://neondb_owner:npg_bCSE8mA2YjgT@ep-weathered-mode-adqdxv9w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

const sql = neon(databaseUrl);

async function completeDatabaseInitialization() {
  console.log('🔧 Force completing database initialization...');

  try {
    // Check if site_settings table exists and has data
    const settingsCheck = await sql`SELECT COUNT(*) as count FROM site_settings`;
    console.log(`📊 Found ${settingsCheck[0].count} existing settings`);

    // Initialize default settings if needed
    const defaultSettings = {
      'site_name': 'Faith Defenders',
      'site_tagline': 'Defending and sharing the Christian faith',
      'site_description': 'A community dedicated to defending and sharing the Christian faith through articles, resources, and meaningful discussions.',
      'contact_email': 'contact@faithdefenders.com',
      'admin_email': 'admin@faithdefenders.com',
      'articles_per_page': 10,
      'default_article_status': 'published',
      'require_comment_approval': false,
      'allow_guest_comments': true,
      'default_user_role': 'user',
      'registration_status': 'open',
      'enable_user_profiles': true,
      'send_welcome_email': false,
      'session_timeout': 60,
      'password_strength': 'moderate',
      'enable_2fa': false,
      'log_user_activity': true,
      // Appearance settings
      'primary_color': '#1e3c72',
      'secondary_color': '#2a5298',
      'font_family': 'inter',
      'logo_url': '',
      'enable_dark_mode': false,
      'show_breadcrumbs': true,
      // Social media settings
      'facebook_url': '',
      'twitter_url': '',
      'instagram_url': '',
      'youtube_url': '',
      'phone_number': '',
      'address': '',
      'footer_text': '© 2025 Faith Defenders. All rights reserved.'
    };

    let insertedCount = 0;
    for (const [key, value] of Object.entries(defaultSettings)) {
      const exists = await sql`SELECT id FROM site_settings WHERE key = ${key}`;
      if (exists.length === 0) {
        await sql`
          INSERT INTO site_settings (key, value, updated_at)
          VALUES (${key}, ${JSON.stringify(value)}::jsonb, NOW())
        `;
        insertedCount++;
        console.log(`✅ Created default setting: ${key}`);
      }
    }

    if (insertedCount > 0) {
      console.log(`🎉 Inserted ${insertedCount} new default settings`);
    } else {
      console.log('✅ All default settings already exist');
    }

    // Verify the settings are accessible
    const allSettings = await sql`SELECT key, value FROM site_settings ORDER BY key`;
    console.log(`📋 Total settings in database: ${allSettings.length}`);

    // Test a settings query
    const testSetting = await sql`SELECT value::jsonb as value FROM site_settings WHERE key = 'site_name'`;
    if (testSetting.length > 0) {
      console.log(`🧪 Test query successful: site_name = "${testSetting[0].value}"`);
    }

    console.log('🎊 Database initialization completed successfully!');
    console.log('💡 The admin/settings page should now work properly.');

  } catch (error) {
    console.error('❌ Error completing database initialization:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    process.exit(0);
  }
}

// Run the script
completeDatabaseInitialization();