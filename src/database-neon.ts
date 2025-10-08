// Neon PostgreSQL database implementation for Cloudflare Workers
import { neon } from '@neondatabase/serverless';

// Enhanced User interface with status and moderation fields and OAuth support
export interface User {
  id: number;
  email: string;
  name: string;
  role: string; // 'admin', 'moderator', 'user'
  status: string; // 'active', 'suspended', 'banned'
  last_login?: Date;
  created_at: Date;
  updated_at?: Date;
  suspension_expires?: Date;
  suspension_reason?: string;
  google_id?: string;
  avatar_url?: string;
  email_verified?: boolean;
  auth_provider?: string; // 'email', 'google'
  password_hash?: string;
}

export interface SiteSetting {
  id: number;
  key: string;
  value: any; // JSONB - can be string, number, boolean, object
  updated_at: Date;
  updated_by?: number; // User ID who last updated
}

export interface Article {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  author_id: number;
  author_name?: string;
  category_id?: number;
  category_name?: string;
  published: boolean;
  featured?: boolean;
  slug?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Resource {
  id: number;
  title: string;
  description?: string;
  url?: string;
  resource_type: string;
  author_id: number;
  author_name?: string;
  category_id?: number;
  category_name?: string;
  slug?: string;
  created_at: Date;
  updated_at: Date;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  extracted_content?: string;
  content_preview?: string;
  download_url?: string;
  view_url?: string;
  metadata?: string;
  is_uploaded_file: boolean;
  published: boolean;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  slug: string;
  color?: string;
  icon?: string;
  created_at: Date;
  updated_at: Date;
}

export interface EmailVerification {
  id: number;
  user_id: number;
  email: string;
  otp_code: string;
  purpose: 'registration' | 'email_change' | 'password_reset' | 'admin_role_change';
  attempts: number;
  max_attempts: number;
  expires_at: Date;
  verified_at?: Date;
  created_at: Date;
  updated_at: Date;
  ip_address?: string;
  user_agent?: string;
  metadata?: any;
}


export interface Like {
  id: number;
  user_id: number;
  article_id?: number;
  resource_id?: number;
  created_at: Date;
}

export interface UserLoginHistory {
  id: number;
  user_id: number;
  login_at: Date;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  failure_reason?: string;
}

export interface UserNotification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  created_at: Date;
  expires_at?: Date;
}

export interface RoleChangeLog {
  id: number;
  target_user_id: number;
  target_user_name: string;
  target_user_email: string;
  old_role: string;
  new_role: string;
  changed_by_user_id: number;
  changed_by_user_name: string;
  change_reason?: string;
  change_method: 'direct' | 'verification' | 'admin_request';
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface Comment {
  id: number;
  content: string;
  user_id: number;
  user_name?: string;
  article_id?: number;
  resource_id?: number;
  parent_id?: number;
  reply_to_user?: string;
  created_at: Date;
  updated_at?: Date;
}

export interface AdminMessage {
  id: number;
  content: string;
  author_id: number;
  author_name: string;
  author_role: 'admin' | 'moderator';
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio' | 'document';
  file_name?: string;
  file_size?: number;
  is_highlighted: boolean;
  likes_count?: number;
  comments_count?: number;
  can_edit?: boolean;
  status: 'sent' | 'delivered' | 'read';
  delivered_at?: Date;
  read_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Database initialization flag
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

// Global environment for Cloudflare Workers
let globalEnv: any = null;

export function setGlobalEnv(env: any) {
  globalEnv = env;

  const isProduction = env?.ENVIRONMENT === 'production' || env?.CF_PAGES;
  const isLocalProd = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';

  if ((isProduction || isLocalProd) && !isInitialized) {
    isInitialized = true;
    console.log('Production environment detected - skipping database initialization');
  }
}

// Get database connection
export function getDB() {
  const databaseUrl = globalEnv?.DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    'postgresql://neondb_owner:npg_bCSE8mA2YjgT@ep-weathered-mode-adqdxv9w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=disable';

  return neon(databaseUrl);
}

export async function ensureInitialized() {
  const isCloudflare = globalEnv?.CF_PAGES || globalEnv?.ENVIRONMENT === 'production' ||
                        (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production');

  if (isCloudflare) {
    isInitialized = true;
    return;
  }

  if (!isInitialized) {
    if (initializationPromise) {
      // Don't wait for initialization - just return
      return;
    }

    // Start initialization in background
    initializationPromise = initializeDatabase().then(() => {
      isInitialized = true;
    }).catch(error => {
      console.error('Database initialization failed:', error);
      isInitialized = true; // Mark as initialized even on failure to prevent retries
    }).finally(() => {
      initializationPromise = null;
    });

    // Don't wait for completion
    return;
  }
}

// Initialize database tables
export async function initializeDatabase() {
  console.log('Initializing Neon PostgreSQL database...');
  const sql = getDB();

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NULL,
        role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'moderator', 'user')),
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        suspension_expires TIMESTAMP NULL,
        suspension_reason TEXT NULL,
        google_id VARCHAR(255) NULL,
        avatar_url TEXT NULL,
        email_verified BOOLEAN DEFAULT false,
        auth_provider VARCHAR(50) DEFAULT 'email' CHECK (auth_provider IN ('email', 'google'))
      );
    `;

    // Create site_settings table
    await sql`
      CREATE TABLE IF NOT EXISTS site_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value JSONB NOT NULL,
        updated_by INTEGER REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create email_verifications table
    await sql`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(255) NOT NULL,
        purpose VARCHAR(100) NOT NULL DEFAULT 'registration' CHECK (purpose IN ('registration', 'email_change', 'password_reset', 'admin_role_change')),
        attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 3,
        expires_at TIMESTAMP NOT NULL,
        verified_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address INET NULL,
        user_agent TEXT NULL
      );
    `;

    // Add metadata column if it doesn't exist (for backward compatibility)
    try {
      await sql`
        ALTER TABLE email_verifications
        ADD COLUMN IF NOT EXISTS metadata JSONB NULL;
      `;
    } catch (error) {
      console.log('Metadata column already exists or could not be added:', error);
    }

    // Update check constraint to include admin_role_change if it exists
    try {
      await sql`
        ALTER TABLE email_verifications
        DROP CONSTRAINT IF EXISTS email_verifications_purpose_check;
      `;
      await sql`
        ALTER TABLE email_verifications
        ADD CONSTRAINT email_verifications_purpose_check
        CHECK (purpose IN ('registration', 'email_change', 'password_reset', 'admin_role_change'));
      `;
    } catch (error) {
      console.log('Check constraint update failed:', error);
    }

    // Create admin_verification_tokens table for admin role change verification
    await sql`
      CREATE TABLE IF NOT EXISTS admin_verification_tokens (
        id SERIAL PRIMARY KEY,
        admin_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        new_role VARCHAR(50) NOT NULL CHECK (new_role IN ('admin', 'moderator', 'user')),
        verification_token VARCHAR(255) UNIQUE NOT NULL,
        purpose VARCHAR(100) NOT NULL DEFAULT 'role_change',
        expires_at TIMESTAMP NOT NULL,
        verified_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45) NULL,
        user_agent TEXT NULL
      );
    `;

    // Create role_change_log table for tracking role changes
    await sql`
      CREATE TABLE IF NOT EXISTS role_change_log (
        id SERIAL PRIMARY KEY,
        target_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_user_name VARCHAR(255) NOT NULL,
        target_user_email VARCHAR(255) NOT NULL,
        old_role VARCHAR(50) NOT NULL CHECK (old_role IN ('admin', 'moderator', 'user')),
        new_role VARCHAR(50) NOT NULL CHECK (new_role IN ('admin', 'moderator', 'user')),
        changed_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        changed_by_user_name VARCHAR(255) NOT NULL,
        change_reason TEXT NULL,
        change_method VARCHAR(50) NOT NULL DEFAULT 'direct' CHECK (change_method IN ('direct', 'verification', 'admin_request')),
        ip_address VARCHAR(45) NULL,
        user_agent TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create Bible Games tables
    await sql`
      CREATE TABLE IF NOT EXISTS bible_games (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        difficulty VARCHAR(50) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
        status VARCHAR(50) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'starting', 'active', 'completed', 'cancelled', 'expired')),
        created_by INTEGER NULL REFERENCES users(id) ON DELETE CASCADE,
        created_by_name VARCHAR(255) NOT NULL,
        max_players INTEGER NOT NULL DEFAULT 10,
        current_players INTEGER NOT NULL DEFAULT 1,
        questions_per_game INTEGER NOT NULL DEFAULT 10,
        time_per_question INTEGER NOT NULL DEFAULT 10,
        game_data JSONB NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '5 minutes')
      );
    `;

    // Alter existing table to make created_by nullable if it exists
    try {
      await sql`
        ALTER TABLE bible_games ALTER COLUMN created_by DROP NOT NULL;
      `;
    } catch (error) {
      console.log('Column already nullable or alter failed:', error);
    }

    await sql`
      CREATE TABLE IF NOT EXISTS bible_game_participants (
        id SERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL REFERENCES bible_games(id) ON DELETE CASCADE,
        user_id INTEGER NULL REFERENCES users(id) ON DELETE CASCADE,
        guest_id INTEGER NULL,
        player_name VARCHAR(255) NOT NULL,
        player_email VARCHAR(255) NULL,
        score INTEGER NOT NULL DEFAULT 0,
        correct_answers INTEGER NOT NULL DEFAULT 0,
        total_questions INTEGER NOT NULL DEFAULT 0,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_creator BOOLEAN NOT NULL DEFAULT false,
        is_active BOOLEAN NOT NULL DEFAULT true
      );
    `;

    // Add guest_id column if it doesn't exist
    try {
      await sql`
        ALTER TABLE bible_game_participants
        ADD COLUMN IF NOT EXISTS guest_id INTEGER NULL;
      `;
    } catch (error) {
      console.log('guest_id column already exists or could not be added:', error);
    }

    // Add finished_all_questions column if it doesn't exist
    try {
      await sql`
        ALTER TABLE bible_game_participants
        ADD COLUMN IF NOT EXISTS finished_all_questions BOOLEAN DEFAULT FALSE;
      `;
    } catch (error) {
      console.log('finished_all_questions column already exists or could not be added:', error);
    }

    await sql`
      CREATE TABLE IF NOT EXISTS bible_game_questions (
        id SERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL REFERENCES bible_games(id) ON DELETE CASCADE,
        question_number INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        options JSONB NOT NULL,
        bible_reference VARCHAR(255) NOT NULL,
        difficulty VARCHAR(50) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
        points INTEGER NOT NULL DEFAULT 10,
        ai_generated BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS bible_game_history (
        id SERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL REFERENCES bible_games(id) ON DELETE CASCADE,
        participant_id INTEGER NOT NULL REFERENCES bible_game_participants(id) ON DELETE CASCADE,
        question_id INTEGER NOT NULL REFERENCES bible_game_questions(id) ON DELETE CASCADE,
        selected_answer TEXT NOT NULL,
        is_correct BOOLEAN NOT NULL,
        time_taken INTEGER NOT NULL DEFAULT 10,
        points_earned INTEGER NOT NULL DEFAULT 0,
        answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create user_bible_stats table for tracking multiplayer wins
    await sql`
      CREATE TABLE IF NOT EXISTS user_bible_stats (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        difficulty VARCHAR(50) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
        multiplayer_wins INTEGER NOT NULL DEFAULT 0,
        total_games INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, difficulty)
      );
    `;

    // Create indexes for Bible games
    await sql`
      CREATE INDEX IF NOT EXISTS idx_bible_games_status ON bible_games(status);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_bible_games_created_by ON bible_games(created_by);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_bible_games_created_at ON bible_games(created_at DESC);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_bible_game_participants_game_id ON bible_game_participants(game_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_bible_game_participants_user_id ON bible_game_participants(user_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_bible_game_questions_game_id ON bible_game_questions(game_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_bible_game_history_game_id ON bible_game_history(game_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_bible_game_history_participant_id ON bible_game_history(participant_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_bible_stats_user_id ON user_bible_stats(user_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_bible_stats_difficulty ON user_bible_stats(difficulty);
    `;

    // Create indexes for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_role_change_log_target_user ON role_change_log(target_user_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_role_change_log_changed_by ON role_change_log(changed_by_user_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_role_change_log_created_at ON role_change_log(created_at DESC);
    `;

    // Create index for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_admin_verification_tokens_token ON admin_verification_tokens(verification_token);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_admin_verification_tokens_admin_user ON admin_verification_tokens(admin_user_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_admin_verification_tokens_expires ON admin_verification_tokens(expires_at);
    `;

    // Create user_bible_stats table for tracking multiplayer wins per difficulty
    await sql`
      CREATE TABLE IF NOT EXISTS user_bible_stats (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        difficulty VARCHAR(50) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
        wins INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, difficulty)
      );
    `;

    // Create verse_usage table for tracking Bible verse usage
     await sql`
       CREATE TABLE IF NOT EXISTS verse_usage (
         id SERIAL PRIMARY KEY,
         verse_reference VARCHAR(255) NOT NULL UNIQUE,
         frequency INTEGER NOT NULL DEFAULT 1,
         last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
       );
     `;

    // Create indexes for verse usage
    await sql`
      CREATE INDEX IF NOT EXISTS idx_verse_usage_reference ON verse_usage(verse_reference);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_verse_usage_frequency ON verse_usage(frequency);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_verse_usage_last_used ON verse_usage(last_used DESC);
    `;

    // Initialize default settings
    await initializeDefaultSettings();

    console.log('Database initialization completed with site settings');
    return;
  } catch (error) {
    console.error('Error creating users table:', error);
    return;
  }
}

// Slug generation function
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Site Settings functions
export async function getSiteSettings(): Promise<{ [key: string]: any }> {
  // Don't block if database is not initialized - return defaults
  if (!isInitialized) {
    console.log('Database not initialized, returning default settings');
    return getDefaultSettings();
  }

  const sql = getDB();

  try {
    const result = await sql`
      SELECT key, value::jsonb as value
      FROM site_settings
      ORDER BY key
    `;

    const settings: { [key: string]: any } = {};
    result.forEach((row: any) => {
      settings[row.key] = row.value;
    });

    return settings;
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return getDefaultSettings();
  }
}

// Default settings function
function getDefaultSettings(): { [key: string]: any } {
  return {
    site_name: 'Faith Defenders',
    site_tagline: 'Defending and sharing the Christian faith',
    site_description: 'A community dedicated to defending and sharing the Christian faith through articles, resources, and meaningful discussions.',
    contact_email: 'contact@faithdefenders.com',
    admin_email: 'admin@faithdefenders.com',
    articles_per_page: 10,
    default_article_status: 'published',
    require_comment_approval: false,
    allow_guest_comments: true,
    default_user_role: 'user',
    registration_status: 'open',
    enable_user_profiles: true,
    send_welcome_email: false,
    session_timeout: 60,
    password_strength: 'moderate',
    enable_2fa: false,
    log_user_activity: true,
    primary_color: '#1e3c72',
    secondary_color: '#2a5298',
    font_family: 'inter',
    logo_url: '',
    enable_dark_mode: false,
    show_breadcrumbs: true,
    facebook_url: '',
    twitter_url: '',
    instagram_url: '',
    youtube_url: '',
    phone_number: '',
    address: '',
    footer_text: '© 2025 Faith Defenders. All rights reserved.'
  };
}

export async function updateSiteSetting(key: string, value: any, userId?: number): Promise<boolean> {
  await ensureInitialized();
  const sql = getDB();
  
  try {
    const result = await sql`
      INSERT INTO site_settings (key, value, updated_by, updated_at)
      VALUES (${key}, ${JSON.stringify(value)}::jsonb, ${userId || null}, NOW())
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
      RETURNING id
    `;
    
    return result.length > 0;
  } catch (error) {
    console.error('Error updating site setting:', error);
    return false;
  }
}

export async function getSiteSetting(key: string): Promise<any> {
  await ensureInitialized();
  const sql = getDB();
  
  try {
    const result = await sql`
      SELECT value::jsonb as value
      FROM site_settings
      WHERE key = ${key}
    `;
    
    return result[0]?.value || null;
  } catch (error) {
    console.error(`Error fetching site setting ${key}:`, error);
    return null;
  }
}

export async function initializeDefaultSettings(userId?: number): Promise<void> {
  await ensureInitialized();
  const sql = getDB();
  
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
    'primary_color': '#1e3c72',
    'secondary_color': '#2a5298',
    'font_family': 'inter',
    'logo_url': '',
    'enable_dark_mode': false,
    'show_breadcrumbs': true,
    'facebook_url': '',
    'twitter_url': '',
    'instagram_url': '',
    'youtube_url': '',
    'phone_number': '',
    'address': '',
    'footer_text': '© 2025 Faith Defenders. All rights reserved.'
  };
  
  try {
    for (const [key, value] of Object.entries(defaultSettings)) {
      const exists = await sql`
        SELECT id FROM site_settings WHERE key = ${key}
      `;
      
      if (exists.length === 0) {
        await sql`
          INSERT INTO site_settings (key, value, updated_by, updated_at)
          VALUES (${key}, ${JSON.stringify(value)}::jsonb, ${userId || null}, NOW())
        `;
      }
    }
  } catch (error) {
    console.error('Error initializing default settings:', error);
  }
}

// User functions
export async function createUser(
  email: string, 
  name: string, 
  passwordHash: string | null = null, 
  role: string = 'user',
  oauthData?: {
    google_id?: string;
    avatar_url?: string;
    auth_provider?: string;
    email_verified?: boolean;
  }
): Promise<User> {
  await ensureInitialized();
  const sql = getDB();
  
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@faithdefenders.com';
  const isAdminEmail = email === 'admin@faithdefenders.com' || email === adminEmail;
  const userRole = isAdminEmail ? 'admin' : role;
  
  const {
    google_id = null,
    avatar_url = null,
    auth_provider = 'email',
    email_verified = false
  } = oauthData || {};
  
  const result = await sql`
    INSERT INTO users (
      email, name, password_hash, role,
      google_id, avatar_url, auth_provider, email_verified,
      created_at
    )
    VALUES (
      ${email}, ${name}, ${passwordHash}, ${userRole},
      ${google_id}, ${avatar_url}, ${auth_provider}, ${email_verified},
      NOW()
    )
    RETURNING id, email, name, role, status, last_login, created_at, updated_at, suspension_expires, suspension_reason, google_id, avatar_url, auth_provider, email_verified
  `;

  return result[0] as User;
}

export async function getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  if (!isInitialized) {
    console.log('Database not initialized, cannot get user by email');
    return null;
  }

  const sql = getDB();
  try {
    const result = await sql`SELECT * FROM users WHERE email = ${email}`;
    return result[0] as (User & { password_hash: string }) || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

export async function getUserById(id: number): Promise<User | null> {
  if (!isInitialized) {
    console.log('Database not initialized, cannot get user by ID');
    return null;
  }

  const sql = getDB();
  try {
    const result = await sql`
      SELECT id, email, name, role, status, last_login, created_at, updated_at,
             suspension_expires, suspension_reason, email_verified, auth_provider
      FROM users WHERE id = ${id}
    `;
    return result[0] as User || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

export async function updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
  await ensureInitialized();
  const sql = getDB();
  
  await sql`
    UPDATE users 
    SET password_hash = ${hashedPassword}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${userId}
  `;
}

export async function getAllUsers(): Promise<User[]> {
  await ensureInitialized();
  const sql = getDB();
  const result = await sql`
    SELECT id, email, name, role, status, last_login, created_at, updated_at,
           suspension_expires, suspension_reason, email_verified, auth_provider
    FROM users ORDER BY created_at DESC
  `;
  return result as User[];
}

export async function updateUserRole(id: number, role: string): Promise<User | null> {
  await ensureInitialized();
  const sql = getDB();
  const result = await sql`
    UPDATE users
    SET role = ${role}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING id, email, name, role, status, last_login, created_at, updated_at, suspension_expires, suspension_reason
  `;
  return result[0] as User || null;
}

export async function updateUserStatus(id: number, status: string, reason?: string, expiresAt?: Date): Promise<User | null> {
  await ensureInitialized();
  const sql = getDB();

  const result = await sql`
    UPDATE users
    SET status = ${status},
        updated_at = CURRENT_TIMESTAMP,
        suspension_reason = ${reason || null},
        suspension_expires = ${expiresAt || null}
    WHERE id = ${id}
    RETURNING id, email, name, role, status, last_login, created_at, updated_at, suspension_expires, suspension_reason
  `;
  return result[0] as User || null;
}

export async function linkUserOAuthAccount(userId: number, oauthData: {
  google_id?: string;
  avatar_url?: string;
  auth_provider?: string;
  email_verified?: boolean;
}): Promise<User | null> {
  await ensureInitialized();
  const sql = getDB();
  
  const {
    google_id = null,
    avatar_url = null,
    auth_provider = 'google',
    email_verified = true
  } = oauthData;
  
  const result = await sql`
    UPDATE users 
    SET 
      google_id = ${google_id},
      avatar_url = ${avatar_url},
      auth_provider = ${auth_provider},
      email_verified = ${email_verified},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${userId}
    RETURNING id, email, name, role, status, last_login, created_at, updated_at, suspension_expires, suspension_reason, google_id, avatar_url, auth_provider, email_verified
  `;
  return result[0] as (User & { password_hash: string }) | null;
}

export async function recordUserLogin(userId: number, ipAddress?: string, userAgent?: string, success: boolean = true, failureReason?: string): Promise<void> {
  await ensureInitialized();
  const sql = getDB();
  
  await sql`
    INSERT INTO user_login_history (user_id, ip_address, user_agent, success, failure_reason)
    VALUES (${userId}, ${ipAddress || null}, ${userAgent || null}, ${success}, ${failureReason || null})
  `;
  
  if (success) {
    await sql`
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `;
  }
}

export async function getUserLoginHistory(userId: number, limit: number = 10): Promise<UserLoginHistory[]> {
  await ensureInitialized();
  const sql = getDB();

  const result = await sql`
    SELECT * FROM user_login_history
    WHERE user_id = ${userId}
    ORDER BY login_at DESC
    LIMIT ${limit}
  `;
  return result as UserLoginHistory[];
}

// Article functions
export async function createArticle(title: string, content: string, excerpt: string, authorId: number, categoryId?: number): Promise<Article> {
  await ensureInitialized();
  const sql = getDB();
  const slug = generateSlug(title);

  // Get default article status from settings
  const settings = await getSiteSettings();
  const defaultStatus = settings.default_article_status === 'published';

  const result = await sql`
    INSERT INTO articles (title, content, excerpt, author_id, category_id, slug, published, created_at, updated_at)
    VALUES (${title}, ${content}, ${excerpt}, ${authorId}, ${categoryId || null}, ${slug}, ${defaultStatus}, NOW(), NOW())
    RETURNING *
  `;

  const article = result[0] as Article;
  const author = await getUserById(authorId);
  const category = categoryId ? await getCategoryById(categoryId) : null;

  return {
    ...article,
    author_name: author?.name,
    category_name: category?.name
  };
}

export async function getArticles(published: boolean = true, limit?: number): Promise<Article[]> {
  await ensureInitialized();
  const sql = getDB();

  let result;
  if (limit && limit > 0) {
    result = await sql`
      SELECT a.*, u.name as author_name, c.name as category_name
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.published = ${published}
      ORDER BY a.created_at DESC
      LIMIT ${limit}
    `;
  } else {
    result = await sql`
      SELECT a.*, u.name as author_name, c.name as category_name
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.published = ${published}
      ORDER BY a.created_at DESC
    `;
  }

  return result as unknown as Article[];
}

export async function getAllArticles(): Promise<Article[]> {
  await ensureInitialized();
  const sql = getDB();
  const result = await sql`
    SELECT a.*, u.name as author_name, c.name as category_name
    FROM articles a
    LEFT JOIN users u ON a.author_id = u.id
    LEFT JOIN categories c ON a.category_id = c.id
    ORDER BY a.created_at DESC
  `;
  return result as unknown as Article[];
}

export async function getArticleById(id: number): Promise<Article | null> {
  await ensureInitialized();
  const sql = getDB();
  const result = await sql`
    SELECT a.*, u.name as author_name, c.name as category_name
    FROM articles a
    LEFT JOIN users u ON a.author_id = u.id
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.id = ${id}
  `;
  return result[0] as unknown as Article | null;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  await ensureInitialized();
  const sql = getDB();
  const result = await sql`
    SELECT a.*, u.name as author_name, c.name as category_name
    FROM articles a
    LEFT JOIN users u ON a.author_id = u.id
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.slug = ${slug} AND a.published = true
  `;
  return result[0] as unknown as Article | null;
}

export async function updateArticle(id: number, title: string, content: string, excerpt: string, published: boolean, categoryId?: number): Promise<Article | null> {
  await ensureInitialized();
  const sql = getDB();
  const slug = generateSlug(title);

  const result = await sql`
    UPDATE articles
    SET title = ${title}, content = ${content}, excerpt = ${excerpt}, published = ${published}, category_id = ${categoryId || null}, slug = ${slug}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  if (result.length === 0) return null;

  const article = result[0] as Article;
  const author = await getUserById(article.author_id);
  const category = article.category_id ? await getCategoryById(article.category_id) : null;

  return {
    ...article,
    author_name: author?.name,
    category_name: category?.name
  };
}

export async function deleteArticle(id: number): Promise<boolean> {
  await ensureInitialized();
  const sql = getDB();
  
  try {
    const existsResult = await sql`
      SELECT id FROM articles WHERE id = ${id}
    `;
    
    if (existsResult.length === 0) {
      return false;
    }
    
    await sql`
      DELETE FROM articles WHERE id = ${id}
    `;
    
    return true;
  } catch (error) {
    console.error('Error deleting article:', error);
    return false;
  }
}

// Resource functions
export async function createResource(
  title: string,
  description: string,
  url: string,
  resourceType: string,
  authorId: number,
  categoryId?: number,
  options?: {
    filePath?: string;
    fileName?: string;
    fileSize?: number;
    extractedContent?: string;
    contentPreview?: string;
    downloadUrl?: string;
    viewUrl?: string;
    metadata?: string;
    isUploadedFile?: boolean;
    published?: boolean;
  }
): Promise<Resource> {
  await ensureInitialized();
  const sql = getDB();
  const slug = generateSlug(title);

  const result = await sql`
    INSERT INTO resources (
      title, description, url, resource_type, author_id, category_id, slug,
      created_at, updated_at, file_path, file_name, file_size,
      extracted_content, content_preview, download_url, view_url,
      metadata, is_uploaded_file, published
    )
    VALUES (
      ${title}, ${description}, ${url}, ${resourceType}, ${authorId}, ${categoryId || null}, ${slug},
      NOW(), NOW(), ${options?.filePath || null}, ${options?.fileName || null}, ${options?.fileSize || null},
      ${options?.extractedContent || null}, ${options?.contentPreview || null},
      ${options?.downloadUrl || null}, ${options?.viewUrl || null},
      ${options?.metadata || null}, ${options?.isUploadedFile || false}, ${options?.published !== undefined ? options.published : true}
    )
    RETURNING *
  `;

  const resource = result[0] as Resource;
  const author = await getUserById(authorId);
  const category = categoryId ? await getCategoryById(categoryId) : null;

  return {
    ...resource,
    author_name: author?.name,
    category_name: category?.name
  };
}

export async function getResources(published?: boolean): Promise<Resource[]> {
  await ensureInitialized();
  const sql = getDB();

  let result;
  if (published !== undefined) {
    result = await sql`
      SELECT r.*, u.name as author_name, c.name as category_name
      FROM resources r
      LEFT JOIN users u ON r.author_id = u.id
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE r.published = ${published}
      ORDER BY r.created_at DESC
    `;
  } else {
    result = await sql`
      SELECT r.*, u.name as author_name, c.name as category_name
      FROM resources r
      LEFT JOIN users u ON r.author_id = u.id
      LEFT JOIN categories c ON r.category_id = c.id
      ORDER BY r.created_at DESC
    `;
  }

  return result as unknown as Resource[];
}

export async function getResourceById(id: number): Promise<Resource | null> {
  await ensureInitialized();
  const sql = getDB();
  const result = await sql`
    SELECT r.*, u.name as author_name, c.name as category_name
    FROM resources r
    LEFT JOIN users u ON r.author_id = u.id
    LEFT JOIN categories c ON r.category_id = c.id
    WHERE r.id = ${id}
  `;
  return result[0] as unknown as Resource | null;
}

export async function getResourceBySlug(slug: string): Promise<Resource | null> {
  await ensureInitialized();
  const sql = getDB();
  const result = await sql`
    SELECT r.*, u.name as author_name, c.name as category_name
    FROM resources r
    LEFT JOIN users u ON r.author_id = u.id
    LEFT JOIN categories c ON r.category_id = c.id
    WHERE r.slug = ${slug} AND r.published = true
  `;
  return result[0] as unknown as Resource | null;
}

export async function updateResource(
  id: number,
  title: string,
  description: string,
  url: string,
  resourceType: string,
  categoryId?: number,
  options?: {
    filePath?: string;
    fileName?: string;
    fileSize?: number;
    extractedContent?: string;
    contentPreview?: string;
    downloadUrl?: string;
    viewUrl?: string;
    metadata?: string;
    isUploadedFile?: boolean;
    published?: boolean;
  }
): Promise<Resource | null> {
  await ensureInitialized();
  const sql = getDB();
  const slug = generateSlug(title);

  const result = await sql`
    UPDATE resources
    SET title = ${title}, description = ${description}, url = ${url},
        resource_type = ${resourceType}, category_id = ${categoryId || null}, slug = ${slug}, updated_at = NOW(),
        file_path = ${options?.filePath || null},
        file_name = ${options?.fileName || null},
        file_size = ${options?.fileSize || null},
        extracted_content = ${options?.extractedContent || null},
        content_preview = ${options?.contentPreview || null},
        download_url = ${options?.downloadUrl || null},
        view_url = ${options?.viewUrl || null},
        metadata = ${options?.metadata || null},
        is_uploaded_file = ${options?.isUploadedFile !== undefined ? options.isUploadedFile : false},
        published = ${options?.published !== undefined ? options.published : true}
    WHERE id = ${id}
    RETURNING *
  `;

  if (result.length === 0) return null;

  const resource = result[0] as Resource;
  const author = await getUserById(resource.author_id);
  const category = resource.category_id ? await getCategoryById(resource.category_id) : null;

  return {
    ...resource,
    author_name: author?.name,
    category_name: category?.name
  };
}

export async function deleteResource(id: number): Promise<boolean> {
  await ensureInitialized();
  const sql = getDB();
  
  try {
    const existsResult = await sql`
      SELECT id FROM resources WHERE id = ${id}
    `;
    
    if (existsResult.length === 0) {
      return false;
    }
    
    await sql`
      DELETE FROM resources WHERE id = ${id}
    `;
    
    return true;
  } catch (error) {
    console.error('Error deleting resource:', error);
    return false;
  }
}

export async function deleteUser(id: number): Promise<boolean> {
  await ensureInitialized();
  const sql = getDB();

  try {
    const existsResult = await sql`
      SELECT id FROM users WHERE id = ${id}
    `;

    if (existsResult.length === 0) {
      return false;
    }

    // Delete in order to avoid foreign key constraint violations
    // Start with child tables that reference the user

    // Delete email verifications and admin tokens (these tables exist)
    try {
      await sql`DELETE FROM email_verifications WHERE user_id = ${id}`;
    } catch (error) {
      console.log('email_verifications table may not exist or be empty:', error instanceof Error ? error.message : String(error));
    }

    try {
      await sql`DELETE FROM admin_verification_tokens WHERE admin_user_id = ${id} OR target_user_id = ${id}`;
    } catch (error) {
      console.log('admin_verification_tokens table may not exist or be empty:', error instanceof Error ? error.message : String(error));
    }

    // Delete role change logs (this table exists)
    try {
      await sql`DELETE FROM role_change_log WHERE target_user_id = ${id} OR changed_by_user_id = ${id}`;
    } catch (error) {
      console.log('role_change_log table may not exist or be empty:', error instanceof Error ? error.message : String(error));
    }

    // Note: The following tables don't exist in the current schema but may be added later
    // When they are added, uncomment these deletions:
    /*
    // Delete user-related activity and logs
    try {
      await sql`DELETE FROM user_login_history WHERE user_id = ${id}`;
    } catch (error) {
      console.log('user_login_history table does not exist yet');
    }

    try {
      await sql`DELETE FROM user_notifications WHERE user_id = ${id}`;
    } catch (error) {
      console.log('user_notifications table does not exist yet');
    }

    try {
      await sql`DELETE FROM activity_log WHERE user_id = ${id}`;
    } catch (error) {
      console.log('activity_log table does not exist yet');
    }

    try {
      await sql`DELETE FROM page_views WHERE user_id = ${id}`;
    } catch (error) {
      console.log('page_views table does not exist yet');
    }

    // Delete likes and comments
    try {
      await sql`DELETE FROM likes WHERE user_id = ${id}`;
    } catch (error) {
      console.log('likes table does not exist yet');
    }

    try {
      await sql`DELETE FROM comments WHERE user_id = ${id}`;
    } catch (error) {
      console.log('comments table does not exist yet');
    }

    // Delete admin messages and related data
    try {
      await sql`DELETE FROM admin_message_likes WHERE user_id = ${id}`;
    } catch (error) {
      console.log('admin_message_likes table does not exist yet');
    }

    try {
      await sql`DELETE FROM admin_message_comments WHERE user_id = ${id}`;
    } catch (error) {
      console.log('admin_message_comments table does not exist yet');
    }

    try {
      await sql`DELETE FROM admin_message_reactions WHERE user_id = ${id}`;
    } catch (error) {
      console.log('admin_message_reactions table does not exist yet');
    }

    try {
      await sql`DELETE FROM admin_messages WHERE author_id = ${id}`;
    } catch (error) {
      console.log('admin_messages table does not exist yet');
    }

    // Delete articles and resources
    try {
      await sql`DELETE FROM articles WHERE author_id = ${id}`;
    } catch (error) {
      console.log('articles table does not exist yet');
    }

    try {
      await sql`DELETE FROM resources WHERE author_id = ${id}`;
    } catch (error) {
      console.log('resources table does not exist yet');
    }
    */

    // Finally delete the user record
    await sql`
      DELETE FROM users WHERE id = ${id}
    `;

    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}

// Category functions
export async function getCategories(): Promise<Category[]> {
  await ensureInitialized();
  const sql = getDB();
  const result = await sql`
    SELECT * FROM categories
    ORDER BY name ASC
  `;
  return result as Category[];
}

export async function getCategoryById(id: number): Promise<Category | null> {
  await ensureInitialized();
  const sql = getDB();
  const result = await sql`
    SELECT * FROM categories
    WHERE id = ${id}
  `;
  return result[0] as Category | null;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  await ensureInitialized();
  const sql = getDB();
  const result = await sql`
    SELECT * FROM categories
    WHERE slug = ${slug}
  `;
  return result[0] as Category | null;
}

export async function createCategory(
  name: string,
  description: string,
  slug: string,
  color: string = '#3b82f6',
  icon: string = 'fas fa-folder'
): Promise<Category> {
  await ensureInitialized();
  const sql = getDB();

  const result = await sql`
    INSERT INTO categories (name, description, slug, color, icon)
    VALUES (${name}, ${description}, ${slug}, ${color}, ${icon})
    RETURNING *
  `;
  return result[0] as Category;
}

export async function updateCategory(
  id: number,
  name: string,
  description: string,
  slug: string,
  color: string = '#3b82f6',
  icon: string = 'fas fa-folder'
): Promise<Category | null> {
  await ensureInitialized();
  const sql = getDB();

  const result = await sql`
    UPDATE categories
    SET name = ${name}, description = ${description}, slug = ${slug},
        color = ${color}, icon = ${icon}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return result[0] as Category | null;
}

export async function deleteCategory(id: number): Promise<boolean> {
  await ensureInitialized();
  const sql = getDB();

  try {
    const result = await sql`
      DELETE FROM categories
      WHERE id = ${id}
    `;
    return (result as any).count > 0;
  } catch (error) {
    console.error('Error deleting category:', error);
    return false;
  }
}

// Like functions
export async function toggleLike(userId: number, articleId?: number, resourceId?: number): Promise<{ liked: boolean; count: number }> {
  await ensureInitialized();
  const sql = getDB();
  
  const existing = await sql`
    SELECT id FROM likes 
    WHERE user_id = ${userId} 
      AND (${articleId ? sql`article_id = ${articleId}` : sql`article_id IS NULL`})
      AND (${resourceId ? sql`resource_id = ${resourceId}` : sql`resource_id IS NULL`})
  `;
  
  if (existing.length > 0) {
    await sql`DELETE FROM likes WHERE id = ${existing[0].id}`;
  } else {
    await sql`
      INSERT INTO likes (user_id, article_id, resource_id)
      VALUES (${userId}, ${articleId || null}, ${resourceId || null})
    `;
  }
  
  const countResult = await sql`
    SELECT COUNT(*) as count FROM likes 
    WHERE (${articleId ? sql`article_id = ${articleId}` : sql`article_id IS NULL`})
      AND (${resourceId ? sql`resource_id = ${resourceId}` : sql`resource_id IS NULL`})
  `;
  
  return {
    liked: existing.length === 0,
    count: parseInt(countResult[0].count)
  };
}

export async function getLikeCount(articleId?: number, resourceId?: number): Promise<number> {
  await ensureInitialized();
  const sql = getDB();
  
  const result = await sql`
    SELECT COUNT(*) as count FROM likes 
    WHERE (${articleId ? sql`article_id = ${articleId}` : sql`article_id IS NULL`})
      AND (${resourceId ? sql`resource_id = ${resourceId}` : sql`resource_id IS NULL`})
  `;
  
  return parseInt(result[0].count);
}

export async function getUserLikeStatus(userId: number, articleId?: number, resourceId?: number): Promise<boolean> {
  await ensureInitialized();
  const sql = getDB();
  
  const result = await sql`
    SELECT id FROM likes 
    WHERE user_id = ${userId}
      AND (${articleId ? sql`article_id = ${articleId}` : sql`article_id IS NULL`})
      AND (${resourceId ? sql`resource_id = ${resourceId}` : sql`resource_id IS NULL`})
  `;
  
  return result.length > 0;
}

// Notification functions
export async function createUserNotification(userId: number, title: string, message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info', expiresAt?: Date): Promise<UserNotification> {
  await ensureInitialized();
  const sql = getDB();

  const result = await sql`
    INSERT INTO user_notifications (user_id, title, message, type, expires_at)
    VALUES (${userId}, ${title}, ${message}, ${type}, ${expiresAt || null})
    RETURNING *
  `;
  return result[0] as UserNotification;
}

export async function getUserNotifications(userId: number, includeRead: boolean = false): Promise<UserNotification[]> {
  await ensureInitialized();
  const sql = getDB();

  const result = await sql`
    SELECT * FROM user_notifications
    WHERE user_id = ${userId}
      ${includeRead ? sql`` : sql`AND read = FALSE`}
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    ORDER BY created_at DESC
  `;
  return result as UserNotification[];
}

export async function markNotificationAsRead(id: number): Promise<boolean> {
  await ensureInitialized();
  const sql = getDB();

  try {
    const result = await sql`
      UPDATE user_notifications
      SET read = TRUE
      WHERE id = ${id}
    `;
    return (result as any).count > 0;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

export async function deleteNotification(id: number): Promise<boolean> {
  await ensureInitialized();
  const sql = getDB();

  try {
    const result = await sql`DELETE FROM user_notifications WHERE id = ${id}`;
    return (result as any).count > 0;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
}

// User Moderation Functions
export async function suspendUser(userId: number, days: number, reason: string): Promise<boolean> {
  await ensureInitialized();
  const sql = getDB();

  try {
    const suspensionExpires = new Date();
    suspensionExpires.setDate(suspensionExpires.getDate() + days);

    const result = await sql`
      UPDATE users
      SET
        status = 'suspended',
        suspension_expires = ${suspensionExpires.toISOString()},
        suspension_reason = ${reason},
        updated_at = NOW()
      WHERE id = ${userId}
    `;

    await sql`
      INSERT INTO user_notifications (user_id, title, message, type)
      VALUES (
        ${userId},
        'Account Suspended',
        ${`Your account has been suspended for ${days} day(s). Reason: ${reason}`},
        'warning'
      )
    `;

    return (result as any).count > 0;
  } catch (error) {
    console.error('Error suspending user:', error);
    return false;
  }
}

export async function banUser(userId: number, reason: string): Promise<boolean> {
  await ensureInitialized();
  const sql = getDB();

  try {
    const result = await sql`
      UPDATE users
      SET
        status = 'banned',
        suspension_reason = ${reason},
        updated_at = NOW()
      WHERE id = ${userId}
    `;

    await sql`
      INSERT INTO user_notifications (user_id, title, message, type)
      VALUES (
        ${userId},
        'Account Banned',
        ${`Your account has been permanently banned. Reason: ${reason}`},
        'error'
      )
    `;

    return (result as any).count > 0;
  } catch (error) {
    console.error('Error banning user:', error);
    return false;
  }
}

// Comment System Functions
export async function createComment(
  content: string,
  userId: number,
  articleId?: number,
  resourceId?: number,
  parentId?: number
): Promise<Comment> {
  await ensureInitialized();
  const sql = getDB();

  const trimmedContent = content.trim().substring(0, 500);

  let replyToUser = null;
  if (parentId) {
    const parentResult = await sql`
      SELECT u.name
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.id = ${parentId}
    `;
    replyToUser = parentResult[0]?.name || null;
  }

  const result = await sql`
    INSERT INTO comments (content, author_id, article_id, resource_id, parent_id)
    VALUES (${trimmedContent}, ${userId}, ${articleId || null}, ${resourceId || null}, ${parentId || null})
    RETURNING *
  `;

  const commentWithUser = await sql`
    SELECT c.*, u.name as user_name
    FROM comments c
    JOIN users u ON c.author_id = u.id
    WHERE c.id = ${result[0].id}
  `;

  return {
    ...commentWithUser[0],
    user_id: commentWithUser[0].author_id,
    reply_to_user: replyToUser
  } as Comment;
}

export async function getComments(articleId?: number, resourceId?: number): Promise<Comment[]> {
  await ensureInitialized();
  const sql = getDB();

  const result = await sql`
    WITH RECURSIVE comment_tree AS (
      SELECT
        c.id, c.content, c.author_id as user_id, u.name as user_name,
        c.article_id, c.resource_id, c.parent_id, c.created_at, c.updated_at,
        0 as depth,
        ARRAY[c.created_at] as path
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.parent_id IS NULL
        AND (${articleId ? sql`c.article_id = ${articleId}` : sql`c.article_id IS NULL`})
        AND (${resourceId ? sql`c.resource_id = ${resourceId}` : sql`c.resource_id IS NULL`})

      UNION ALL

      SELECT
        c.id, c.content, c.author_id as user_id, u.name as user_name,
        c.article_id, c.resource_id, c.parent_id, c.created_at, c.updated_at,
        ct.depth + 1,
        ct.path || c.created_at
      FROM comments c
      JOIN users u ON c.author_id = u.id
      JOIN comment_tree ct ON c.parent_id = ct.id
      WHERE ct.depth < 10
    )
    SELECT
      ct.*,
      pu.name as reply_to_user
    FROM comment_tree ct
    LEFT JOIN comments pc ON ct.parent_id = pc.id
    LEFT JOIN users pu ON pc.author_id = pu.id
    ORDER BY ct.path
  `;

  return result as unknown as Comment[];
}

export async function deleteComment(commentId: number, userId: number, userRole?: string): Promise<boolean> {
  await ensureInitialized();
  const sql = getDB();

  try {
    const commentResult = await sql`
      SELECT c.author_id, u.role as author_role
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.id = ${commentId}
    `;

    if (commentResult.length === 0) {
      return false;
    }

    const commentAuthorId = commentResult[0].author_id;
    const commentAuthorRole = commentResult[0].author_role;

    let canDelete = false;

    if (userRole === 'admin') {
      canDelete = true;
    } else if (userRole === 'moderator') {
      canDelete = commentAuthorRole === 'user';
    } else {
      canDelete = commentAuthorId === userId;
    }

    if (!canDelete) {
      return false;
    }

    const result = await sql`
      DELETE FROM comments
      WHERE id = ${commentId}
    `;
    return (result as any).count > 0;
  } catch (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
}

// View Tracking Functions
export async function trackPageView(
  articleId?: number, 
  resourceId?: number, 
  userId?: number, 
  ipAddress?: string, 
  userAgent?: string
): Promise<void> {
  await ensureInitialized();
  const sql = getDB();
  
  try {
    await sql`
      INSERT INTO page_views (article_id, resource_id, user_id, ip_address, user_agent)
      VALUES (${articleId || null}, ${resourceId || null}, ${userId || null}, ${ipAddress || null}, ${userAgent || null})
    `;
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
}

export async function getTotalPageViews(): Promise<number> {
  await ensureInitialized();
  const sql = getDB();
  
  try {
    const result = await sql`SELECT COUNT(*) as count FROM page_views`;
    return parseInt(result[0].count);
  } catch (error) {
    console.error('Error getting total page views:', error);
    return 0;
  }
}

export async function getPageViewsThisMonth(): Promise<number> {
  await ensureInitialized();
  const sql = getDB();
  
  try {
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    const result = await sql`
      SELECT COUNT(*) as count FROM page_views 
      WHERE viewed_at >= ${firstDayOfMonth.toISOString()}
    `;
    return parseInt(result[0].count);
  } catch (error) {
    console.error('Error getting page views this month:', error);
    return 0;
  }
}

// Activity Logging Functions
export async function logActivity(
  userId: number | null,
  activityType: string,
  description: string,
  entityType?: string,
  entityId?: number
): Promise<void> {
  await ensureInitialized();
  const sql = getDB();
  
  try {
    await sql`
      INSERT INTO activity_log (user_id, activity_type, description, entity_type, entity_id)
      VALUES (${userId}, ${activityType}, ${description}, ${entityType || null}, ${entityId || null})
    `;
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

export async function getRecentActivity(limit: number = 10): Promise<any[]> {
  await ensureInitialized();
  const sql = getDB();
  
  try {
    const result = await sql`
      SELECT 
        al.*,
        u.name as user_name,
        a.title as article_title,
        r.title as resource_title
      FROM activity_log al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN articles a ON al.entity_type = 'article' AND al.entity_id = a.id
      LEFT JOIN resources r ON al.entity_type = 'resource' AND al.entity_id = r.id
      ORDER BY al.created_at DESC
      LIMIT ${limit}
    `;
    
    return result.map(activity => ({
      id: activity.id,
      userName: activity.user_name || 'Anonymous',
      activityType: activity.activity_type,
      description: activity.description,
      entityType: activity.entity_type,
      entityId: activity.entity_id,
      articleTitle: activity.article_title,
      resourceTitle: activity.resource_title,
      createdAt: activity.created_at
    }));
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
}

// Analytics Functions
export async function getAnalyticsData() {
  await ensureInitialized();
  const sql = getDB();
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  
  const userGrowthData = await calculateRealUserGrowth(sql);
  const totalViews = await getTotalPageViews();
  const viewsThisMonth = await getPageViewsThisMonth();
  const pageViewsData = await calculateRealPageViews(sql);
  
  const publishedArticlesResult = await sql`SELECT COUNT(*) FROM articles WHERE published = true`;
  const totalArticlesResult = await sql`SELECT COUNT(*) FROM articles`;
  const totalResourcesResult = await sql`SELECT COUNT(*) FROM resources`;
  const totalUsersResult = await sql`SELECT COUNT(*) FROM users`;
  const newUsersThisMonthResult = await sql`SELECT COUNT(*) FROM users WHERE created_at >= ${lastMonth}`;
  const newArticlesThisMonthResult = await sql`SELECT COUNT(*) FROM articles WHERE published = true AND created_at >= ${lastMonth}`;
  const newResourcesThisMonthResult = await sql`SELECT COUNT(*) FROM resources WHERE created_at >= ${lastMonth}`;

  const publishedArticles = parseInt(publishedArticlesResult[0].count);
  const totalArticles = parseInt(totalArticlesResult[0].count);
  const totalResources = parseInt(totalResourcesResult[0].count);
  const totalUsers = parseInt(totalUsersResult[0].count);
  const newUsersThisMonth = parseInt(newUsersThisMonthResult[0].count);
  const newArticlesThisMonth = parseInt(newArticlesThisMonthResult[0].count);
  const newResourcesThisMonth = parseInt(newResourcesThisMonthResult[0].count);
  
  const topArticlesResult = await sql`
    SELECT a.id, a.title, u.name as author_name 
    FROM articles a 
    LEFT JOIN users u ON a.author_id = u.id 
    WHERE a.published = true 
    ORDER BY a.created_at DESC 
    LIMIT 5
  `;
  
  const topArticles = topArticlesResult.map(article => ({
    id: article.id,
    title: article.title,
    views: 0,
    author: article.author_name || 'Unknown'
  }));
  
  return {
    pageViews: pageViewsData,
    topArticles,
    userGrowth: userGrowthData,
    contentStats: {
      totalUsers,
      newUsersThisMonth,
      publishedArticles,
      totalArticles,
      newArticlesThisMonth,
      totalResources,
      newResourcesThisMonth,
      totalViews,
      viewsThisMonth,
      averageReadTime: await calculateAverageReadTime(sql, publishedArticles),
      contentEngagement: publishedArticles > 0 ? Math.floor((publishedArticles / Math.max(1, totalArticles)) * 100) : 0
    },
    recentActivity: await getRecentActivity(5)
  };
}

async function calculateRealUserGrowth(sql: any) {
  const now = new Date();
  const months = [];
  const data = [];
  
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
    months.push(monthName);
    
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    
    const result = await sql`
      SELECT COUNT(*) FROM users 
      WHERE created_at >= ${monthStart} AND created_at <= ${monthEnd}
    `;
    
    data.push(parseInt(result[0].count));
  }
  
  return {
    labels: months,
    data
  };
}

async function calculateRealPageViews(sql: any) {
  const now = new Date();
  const months = [];
  const data = [];
  
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
    months.push(monthName);
    
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    
    const result = await sql`
      SELECT COUNT(*) FROM page_views 
      WHERE viewed_at >= ${monthStart} AND viewed_at <= ${monthEnd}
    `;
    
    data.push(parseInt(result[0].count));
  }
  
  return {
    labels: months,
    data
  };
}

async function calculateAverageReadTime(sql: any, publishedCount: number): Promise<string> {
  if (publishedCount === 0) return '0:00';
  
  const result = await sql`SELECT content FROM articles WHERE published = true`;
  
  if (result.length === 0) return '0:00';
  
  const totalMinutes = result.reduce((total: number, article: any) => {
    const wordCount = article.content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    return total + readingTime;
  }, 0);
  
  const averageMinutes = Math.floor(totalMinutes / result.length);
  const minutes = Math.floor(averageMinutes);
  const seconds = Math.floor((averageMinutes - minutes) * 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Email Verification Functions
export async function createEmailVerification(
  userId: number,
  email: string,
  purpose: 'registration' | 'email_change' | 'password_reset' | 'admin_role_change' = 'registration',
  ipAddress?: string,
  userAgent?: string,
  metadata?: any
): Promise<EmailVerification> {
  await ensureInitialized();
  const sql = getDB();

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await sql`
    DELETE FROM email_verifications
    WHERE user_id = ${userId} AND purpose = ${purpose}
  `;

  // Handle IP address - convert "unknown" to null for INET type
  const processedIpAddress = (ipAddress === 'unknown' || !ipAddress) ? null : ipAddress;

  const result = await sql`
    INSERT INTO email_verifications (
      user_id, email, otp_code, purpose, expires_at, ip_address, user_agent, metadata
    ) VALUES (
      ${userId}, ${email}, ${otpCode}, ${purpose}, ${expiresAt},
      ${processedIpAddress}, ${userAgent || null}, ${metadata ? JSON.stringify(metadata) : null}
    )
    RETURNING *
  `;

  return result[0] as unknown as EmailVerification;
}

export async function verifyEmailOTP(
  userId: number,
  otpCode: string,
  purpose: 'registration' | 'email_change' | 'password_reset' | 'admin_role_change' = 'registration'
): Promise<{ success: boolean; message: string; verification?: EmailVerification }> {
  await ensureInitialized();
  const sql = getDB();

  const verifications = await sql`
    SELECT * FROM email_verifications
    WHERE user_id = ${userId} AND purpose = ${purpose} AND verified_at IS NULL
    ORDER BY created_at DESC LIMIT 1
  `;

  if (verifications.length === 0) {
    return { success: false, message: 'No verification found. Please request a new code.' };
  }

  const verification = verifications[0];

  if (new Date() > new Date(verification.expires_at)) {
    return { success: false, message: 'Verification code has expired. Please request a new code.' };
  }

  if (verification.attempts >= verification.max_attempts) {
    return { success: false, message: 'Too many failed attempts. Please request a new code.' };
  }

  if (verification.otp_code !== otpCode) {
    await sql`
      UPDATE email_verifications
      SET attempts = attempts + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${verification.id}
    `;

    const remainingAttempts = verification.max_attempts - (verification.attempts + 1);
    return {
      success: false,
      message: `Invalid code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`
    };
  }

  const updatedResult = await sql`
    UPDATE email_verifications
    SET verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${verification.id}
    RETURNING *
  `;

  if (purpose === 'registration') {
    await sql`
      UPDATE users
      SET email_verified = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `;
  }

  return {
    success: true,
    message: 'Email verified successfully!',
    verification: updatedResult[0] as EmailVerification
  };
}

export async function getEmailVerification(
  userId: number,
  purpose: 'registration' | 'email_change' | 'password_reset' | 'admin_role_change' = 'registration'
): Promise<EmailVerification | null> {
  await ensureInitialized();
  const sql = getDB();

  const result = await sql`
    SELECT * FROM email_verifications
    WHERE user_id = ${userId} AND purpose = ${purpose} AND verified_at IS NULL
    ORDER BY created_at DESC LIMIT 1
  `;

  return result[0] as unknown as EmailVerification | null;
}

export async function deleteEmailVerification(
  userId: number,
  purpose: 'registration' | 'email_change' | 'password_reset' | 'admin_role_change' = 'registration'
): Promise<boolean> {
  await ensureInitialized();
  const sql = getDB();
  
  const result = await sql`
    DELETE FROM email_verifications 
    WHERE user_id = ${userId} AND purpose = ${purpose}
  `;
  
  return result.length > 0;
}

export async function cleanupExpiredVerifications(): Promise<number> {
  await ensureInitialized();
  const sql = getDB();

  const result = await sql`
    DELETE FROM email_verifications
    WHERE expires_at < CURRENT_TIMESTAMP
  `;

  return result.length;
}


// Admin Message Functions
export async function createAdminMessage(
  content: string,
  authorId: number,
  authorName: string,
  authorRole: 'admin' | 'moderator',
  options?: {
    mediaUrl?: string;
    mediaType?: 'image' | 'video' | 'audio' | 'document';
    fileName?: string;
    fileSize?: number;
    isHighlighted?: boolean;
  }
): Promise<AdminMessage> {
  await ensureInitialized();
  const sql = getDB();

  const result = await sql`
    INSERT INTO admin_messages (
      content, author_id, author_name, author_role,
      media_url, media_type, file_name, file_size, is_highlighted,
      status, delivered_at, read_at
    )
    VALUES (
      ${content}, ${authorId}, ${authorName}, ${authorRole},
      ${options?.mediaUrl || null}, ${options?.mediaType || null},
      ${options?.fileName || null}, ${options?.fileSize || null},
      ${options?.isHighlighted || false},
      'sent', NULL, NULL
    )
    RETURNING *
  `;

  const message = result[0] as AdminMessage;
  return {
    ...message,
    likes_count: 0,
    comments_count: 0,
    can_edit: true
  };
}

export async function getAdminMessages(limit: number = 50): Promise<AdminMessage[]> {
  await ensureInitialized();
  const sql = getDB();

  const result = await sql`
    SELECT
      am.*,
      COALESCE(likes.likes_count, 0) as likes_count,
      COALESCE(comments.comments_count, 0) as comments_count
    FROM admin_messages am
    LEFT JOIN (
      SELECT message_id, COUNT(*) as likes_count
      FROM admin_message_likes
      GROUP BY message_id
    ) likes ON am.id = likes.message_id
    LEFT JOIN (
      SELECT message_id, COUNT(*) as comments_count
      FROM admin_message_comments
      GROUP BY message_id
    ) comments ON am.id = comments.message_id
    ORDER BY am.created_at DESC
    LIMIT ${limit}
  `;

  return result as unknown as AdminMessage[];
}

export async function getAdminMessagesByRole(role?: 'admin' | 'moderator', limit: number = 50): Promise<AdminMessage[]> {
  await ensureInitialized();
  const sql = getDB();

  if (role) {
    const result = await sql`
      SELECT
        am.*,
        COALESCE(likes.likes_count, 0) as likes_count,
        COALESCE(comments.comments_count, 0) as comments_count
      FROM admin_messages am
      LEFT JOIN (
        SELECT message_id, COUNT(*) as likes_count
        FROM admin_message_likes
        GROUP BY message_id
      ) likes ON am.id = likes.message_id
      LEFT JOIN (
        SELECT message_id, COUNT(*) as comments_count
        FROM admin_message_comments
        GROUP BY message_id
      ) comments ON am.id = comments.message_id
      WHERE am.author_role = ${role}
      ORDER BY am.created_at DESC
      LIMIT ${limit}
    `;
    return result as unknown as AdminMessage[];
  } else {
    return getAdminMessages(limit);
  }
}

export async function getFilteredAdminMessages(filters: any, limit: number = 50): Promise<{ messages: AdminMessage[], totalCount: number }> {
  await ensureInitialized();

  try {
    const messages = await getAdminMessages(limit);
    const totalCount = messages.length;

    let filteredMessages = messages;

    if (filters.role && filters.role !== 'all') {
      filteredMessages = filteredMessages.filter(msg => msg.author_role === filters.role);
    }

    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filteredMessages = filteredMessages.filter(msg =>
        msg.content.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date | null = null;

      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'custom':
          if (filters.dateFrom) {
            startDate = new Date(filters.dateFrom);
          }
          break;
        default:
          startDate = new Date(0);
      }

      if (startDate) {
        filteredMessages = filteredMessages.filter(msg =>
          new Date(msg.created_at) >= startDate!
        );
      }

      if (filters.dateRange === 'custom' && filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        filteredMessages = filteredMessages.filter(msg =>
          new Date(msg.created_at) <= endDate
        );
      }
    }

    if (filters.mediaType && filters.mediaType !== 'all') {
      if (filters.mediaType === 'text') {
        filteredMessages = filteredMessages.filter(msg => !msg.media_url);
      } else {
        filteredMessages = filteredMessages.filter(msg => msg.media_type === filters.mediaType);
      }
    }

    if (filters.status && filters.status !== 'all') {
      filteredMessages = filteredMessages.filter(msg => msg.status === filters.status);
    }

    if (filters.sort) {
      switch (filters.sort) {
        case 'oldest':
          filteredMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          break;
        case 'most-liked':
          filteredMessages.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
          break;
        case 'most-commented':
          filteredMessages.sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));
          break;
        case 'newest':
        default:
          filteredMessages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
      }
    }

    const offset = filters.offset || 0;
    const paginatedMessages = filteredMessages.slice(offset, offset + limit);

    return {
      messages: paginatedMessages,
      totalCount: filteredMessages.length
    };
  } catch (error) {
    console.error('Error getting filtered admin messages:', error);
    return {
      messages: [],
      totalCount: 0
    };
  }
}

export async function deleteAdminMessage(id: number, userId: number, userRole: string): Promise<boolean> {
  await ensureInitialized();
  const sql = getDB();

  try {
    const messageResult = await sql`
      SELECT author_id, author_role FROM admin_messages WHERE id = ${id}
    `;

    if (messageResult.length === 0) {
      return false;
    }

    const messageAuthorId = messageResult[0].author_id;
    const messageAuthorRole = messageResult[0].author_role;

    let canDelete = false;

    if (userRole === 'admin') {
      canDelete = true;
    } else if (userRole === 'moderator') {
      canDelete = messageAuthorId === userId || messageAuthorRole === 'user';
    }

    if (!canDelete) {
      return false;
    }

    const result = await sql`
      DELETE FROM admin_messages WHERE id = ${id}
    `;

    return (result as any).length > 0;
  } catch (error) {
    console.error('Error deleting admin message:', error);
    return false;
  }
}

export async function updateAdminMessageStatus(id: number, status: 'sent' | 'delivered' | 'read'): Promise<boolean> {
  await ensureInitialized();
  const sql = getDB();

  try {
    let updateFields: any = {
      status: status,
      updated_at: new Date().toISOString()
    };

    if (status === 'delivered') {
      updateFields.delivered_at = new Date().toISOString();
    } else if (status === 'read') {
      updateFields.read_at = new Date().toISOString();
      updateFields.delivered_at = updateFields.delivered_at || new Date().toISOString();
    }

    const result = await sql`
      UPDATE admin_messages
      SET status = ${updateFields.status},
          delivered_at = ${updateFields.delivered_at || null},
          read_at = ${updateFields.read_at || null},
          updated_at = ${updateFields.updated_at}
      WHERE id = ${id}
    `;

    return (result as any).length > 0;
  } catch (error) {
    console.error('Error updating admin message status:', error);
    return false;
  }
}

// Message Reaction Functions
export async function checkUserReaction(messageId: number, userId: number): Promise<any | null> {
  await ensureInitialized();
  const sql = getDB();

  try {
    const result = await sql`
      SELECT * FROM admin_message_reactions
      WHERE message_id = ${messageId} AND user_id = ${userId}
    `;
    return result[0] as unknown as any | null;
  } catch (error) {
    console.error('Error checking user reaction:', error);
    return null;
  }
}

export async function addMessageReaction(messageId: number, userId: number, reactionType: string): Promise<any> {
  await ensureInitialized();
  const sql = getDB();

  try {
    const result = await sql`
      INSERT INTO admin_message_reactions (message_id, user_id, reaction_type)
      VALUES (${messageId}, ${userId}, ${reactionType})
      RETURNING *
    `;
    return result[0] as unknown as any;
  } catch (error) {
    console.error('Error adding message reaction:', error);
    throw error;
  }
}

export async function updateMessageReaction(messageId: number, userId: number, reactionType: string): Promise<any> {
  await ensureInitialized();
  const sql = getDB();

  try {
    const result = await sql`
      UPDATE admin_message_reactions
      SET reaction_type = ${reactionType}, updated_at = CURRENT_TIMESTAMP
      WHERE message_id = ${messageId} AND user_id = ${userId}
      RETURNING *
    `;
    return result[0] as unknown as any;
  } catch (error) {
    console.error('Error updating message reaction:', error);
    throw error;
  }
}

export async function removeMessageReaction(messageId: number, userId: number): Promise<boolean> {
  await ensureInitialized();
  const sql = getDB();

  try {
    const result = await sql`
      DELETE FROM admin_message_reactions
      WHERE message_id = ${messageId} AND user_id = ${userId}
    `;
    return (result as any).length > 0;
  } catch (error) {
    console.error('Error removing message reaction:', error);
    return false;
  }
}

export async function getMessageReactions(messageId: number): Promise<any[]> {
  await ensureInitialized();
  const sql = getDB();

  try {
    const result = await sql`
      SELECT
        amr.*,
        u.name as user_name,
        u.role as user_role
      FROM admin_message_reactions amr
      JOIN users u ON amr.user_id = u.id
      WHERE amr.message_id = ${messageId}
      ORDER BY amr.created_at ASC
    `;
    return result as unknown as any[];
  } catch (error) {
    console.error('Error getting message reactions:', error);
    return [];
  }
}

// Role Change Log Functions
export async function logRoleChange(
  targetUserId: number,
  targetUserName: string,
  targetUserEmail: string,
  oldRole: string,
  newRole: string,
  changedByUserId: number,
  changedByUserName: string,
  changeReason?: string,
  changeMethod: 'direct' | 'verification' | 'admin_request' = 'direct',
  ipAddress?: string,
  userAgent?: string
): Promise<RoleChangeLog> {
  await ensureInitialized();
  const sql = getDB();

  const result = await sql`
    INSERT INTO role_change_log (
      target_user_id, target_user_name, target_user_email,
      old_role, new_role, changed_by_user_id, changed_by_user_name,
      change_reason, change_method, ip_address, user_agent
    )
    VALUES (
      ${targetUserId}, ${targetUserName}, ${targetUserEmail},
      ${oldRole}, ${newRole}, ${changedByUserId}, ${changedByUserName},
      ${changeReason || null}, ${changeMethod}, ${ipAddress || null}, ${userAgent || null}
    )
    RETURNING *
  `;

  return result[0] as RoleChangeLog;
}

export async function getRecentRoleChanges(limit: number = 10): Promise<RoleChangeLog[]> {
  await ensureInitialized();
  const sql = getDB();

  const result = await sql`
    SELECT * FROM role_change_log
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  return result as unknown as RoleChangeLog[];
}

// Bible Game interfaces
export interface BibleGame {
  id: number;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  status: 'waiting' | 'starting' | 'active' | 'completed' | 'cancelled' | 'expired';
  created_by: number;
  created_by_name: string;
  max_players: number;
  current_players: number;
  questions_per_game: number;
  time_per_question: number;
  game_data?: any; // JSONB for game-specific data
  created_at: Date;
  updated_at: Date;
  started_at?: Date;
  completed_at?: Date;
  expires_at: Date;
}

export interface BibleGameParticipant {
  id: number;
  game_id: number;
  user_id?: number;
  guest_id?: number;
  player_name: string;
  player_email?: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  joined_at: Date;
  last_activity: Date;
  is_creator: boolean;
  is_active: boolean;
  finished_all_questions?: boolean;
}

export interface BibleGameQuestion {
  id: number;
  game_id: number;
  question_number: number;
  question_text: string;
  correct_answer: string;
  options: string[]; // JSON array
  bible_reference: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  points: number;
  ai_generated: boolean;
  created_at: Date;
}

export interface BibleGameHistory {
  id: number;
  game_id: number;
  participant_id: number;
  question_id: number;
  selected_answer: string;
  is_correct: boolean;
  time_taken: number; // seconds
  points_earned: number;
  answered_at: Date;
}

export interface UserBibleStats {
  id: number;
  user_id: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  multiplayer_wins: number;
  total_games: number;
  created_at: Date;
  updated_at: Date;
}

// Bible Game Database Functions
export async function createBibleGame(
  name: string,
  difficulty: 'easy' | 'medium' | 'hard' | 'expert',
  createdBy: number | null,
  createdByName: string,
  options?: {
    maxPlayers?: number;
    questionsPerGame?: number;
    timePerQuestion?: number;
    expirationHours?: number; // Custom expiration time in hours
  }
): Promise<BibleGame> {
  await ensureInitialized();
  const sql = getDB();

  const {
    maxPlayers = 10,
    questionsPerGame = 10,
    timePerQuestion = 10,
    expirationHours
  } = options || {};

  // Set expiration time based on game type:
  // - Multiplayer games (maxPlayers > 1): 1 hour
  // - Solo games (maxPlayers = 1): 30 minutes
  // - Custom expiration if specified
  let expirationHoursValue: number;
  if (expirationHours) {
    expirationHoursValue = expirationHours;
  } else if (maxPlayers > 1) {
    // Multiplayer game rooms expire in 1 hour
    expirationHoursValue = 1;
  } else {
    // Solo games expire in 30 minutes
    expirationHoursValue = 0.5;
  }

  // Calculate the actual expiration timestamp in JavaScript
  const expiresAt = new Date(Date.now() + (expirationHoursValue * 60 * 60 * 1000));

  const result = await sql`
    INSERT INTO bible_games (
      name, difficulty, status, created_by, created_by_name,
      max_players, current_players, questions_per_game, time_per_question,
      expires_at
    )
    VALUES (
      ${name}, ${difficulty}, 'waiting', ${createdBy || null}, ${createdByName},
      ${maxPlayers}, 0, ${questionsPerGame}, ${timePerQuestion},
      ${expiresAt.toISOString()}
    )
    RETURNING *
  `;

  return result[0] as unknown as BibleGame;
}

export async function getBibleGames(status?: string): Promise<BibleGame[]> {
  await ensureInitialized();
  const sql = getDB();

  let result;
  if (status) {
    result = await sql`
      SELECT bg.*, u.name as created_by_name
      FROM bible_games bg
      LEFT JOIN users u ON bg.created_by = u.id
      WHERE bg.status = ${status}
      ORDER BY bg.created_at DESC
    `;
  } else {
    result = await sql`
      SELECT bg.*, u.name as created_by_name
      FROM bible_games bg
      LEFT JOIN users u ON bg.created_by = u.id
      ORDER BY bg.created_at DESC
    `;
  }

  return result as unknown as BibleGame[];
}

export async function expireOldGames(): Promise<number> {
  await ensureInitialized();
  const sql = getDB();

  // Don't expire games that are actively generating questions (status = 'starting')
  // Only expire games that are still 'waiting' and haven't started question generation
  const result = await sql`
    UPDATE bible_games
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'waiting'
      AND expires_at < NOW()
      AND created_at < (NOW() - INTERVAL '5 minutes')
      AND id NOT IN (
        SELECT DISTINCT game_id
        FROM bible_game_questions
        WHERE created_at > (NOW() - INTERVAL '10 minutes')
      )
    RETURNING id
  `;

  return result.length;
}

export async function cleanupExpiredGameRooms(): Promise<{
  gamesDeleted: number;
  participantsDeleted: number;
  questionsDeleted: number;
  historyDeleted: number;
}> {
  await ensureInitialized();
  const sql = getDB();

  try {
    console.log(`🧹 Starting cleanup of expired game rooms based on individual expiration times and completed games`);
    console.log(`🕐 Current time: ${new Date().toISOString()}`);

    // First, let's get ALL games to see what's in the database
    const allGames = await sql`
      SELECT id, name, status, created_at, expires_at, completed_at, max_players
      FROM bible_games
      ORDER BY created_at DESC
    `;

    console.log(`📊 Total games in database: ${allGames.length}`);
    allGames.forEach((game: any, index: number) => {
      const gameTime = new Date(game.created_at);
      const expiresAt = new Date(game.expires_at);
      const completedAt = game.completed_at ? new Date(game.completed_at) : null;
      const hoursDiff = (new Date().getTime() - gameTime.getTime()) / (1000 * 60 * 60);
      const isExpired = new Date() > expiresAt;
      const gameType = game.max_players > 1 ? 'Multiplayer' : 'Solo';

      // Check if completed games are older than 10 minutes
      let shouldDeleteCompleted = false;
      let completedAgeMinutes = 0;
      if (completedAt) {
        completedAgeMinutes = (new Date().getTime() - completedAt.getTime()) / (1000 * 60);
        shouldDeleteCompleted = completedAgeMinutes > 10;
      }

      console.log(`  ${index + 1}. ID:${game.id} "${game.name}" (${game.status}) - ${gameType} - ${hoursDiff.toFixed(1)}h old - Expires: ${expiresAt.toISOString()} ${isExpired ? '(EXPIRED)' : '(ACTIVE)'}${completedAt ? ` - Completed: ${completedAt.toISOString()} (${completedAgeMinutes.toFixed(1)}min ago) ${shouldDeleteCompleted ? '(DELETE COMPLETED)' : ''}` : ''}`);
    });

    // Get games that should be deleted based on TWO conditions:
    // 1. Games that have expired based on their individual expires_at timestamp
    // 2. Games that have been completed and are older than 10 minutes
    const expiredGames = await sql`
      SELECT id, name, status, created_at, expires_at, completed_at, max_players, 'expired' as deletion_reason
      FROM bible_games
      WHERE expires_at < CURRENT_TIMESTAMP
    `;

    const completedGames = await sql`
      SELECT id, name, status, created_at, expires_at, completed_at, max_players, 'completed_10min' as deletion_reason
      FROM bible_games
      WHERE completed_at IS NOT NULL
        AND EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - completed_at)) / 60 > 10
    `;

    // Combine the results and remove duplicates (games that are both expired and completed)
    const gamesToDelete = [...expiredGames, ...completedGames].filter((game, index, self) =>
      index === self.findIndex(g => g.id === game.id)
    );

    console.log(`\n🎯 Games to delete: ${gamesToDelete.length}`);

    if (gamesToDelete.length === 0) {
      console.log('✅ No expired or completed game rooms found to clean up');
      return {
        gamesDeleted: 0,
        participantsDeleted: 0,
        questionsDeleted: 0,
        historyDeleted: 0
      };
    }

    // Log deletion reasons
    const expiredCount = gamesToDelete.filter(g => g.deletion_reason === 'expired').length;
    const completedCount = gamesToDelete.filter(g => g.deletion_reason === 'completed_10min').length;
    console.log(`📊 Deletion breakdown: ${expiredCount} expired, ${completedCount} completed (>10min)`);

    const gameIds = gamesToDelete.map(g => g.id);
    console.log(`🗑️ Games to delete:`, gameIds.map(id => {
      const game = gamesToDelete.find(g => g.id === id);
      const gameType = game?.max_players > 1 ? 'Multiplayer' : 'Solo';
      const reason = game?.deletion_reason === 'expired' ? 'EXPIRED' : 'COMPLETED_10MIN';
      return `${id}("${game?.name}" - ${game?.status} - ${gameType} - ${reason})`;
    }).join(', '));

    // Delete in order to respect foreign key constraints
    // 1. Delete game history first
    console.log('\n📝 Step 1: Deleting game history...');
    const historyResult = await sql`
      DELETE FROM bible_game_history
      WHERE game_id = ANY(${gameIds})
    `;
    console.log(`✅ Deleted ${historyResult.length} history records`);

    // 2. Delete game questions
    console.log('📝 Step 2: Deleting game questions...');
    const questionsResult = await sql`
      DELETE FROM bible_game_questions
      WHERE game_id = ANY(${gameIds})
    `;
    console.log(`✅ Deleted ${questionsResult.length} question records`);

    // 3. Delete game participants
    console.log('📝 Step 3: Deleting game participants...');
    const participantsResult = await sql`
      DELETE FROM bible_game_participants
      WHERE game_id = ANY(${gameIds})
    `;
    console.log(`✅ Deleted ${participantsResult.length} participant records`);

    // 4. Finally delete the games themselves
    console.log('📝 Step 4: Deleting games...');
    const gamesResult = await sql`
      DELETE FROM bible_games
      WHERE id = ANY(${gameIds})
    `;
    console.log(`✅ Deleted ${gamesResult.length} game records`);

    const result = {
      gamesDeleted: gamesResult.length,
      participantsDeleted: participantsResult.length,
      questionsDeleted: questionsResult.length,
      historyDeleted: historyResult.length
    };

    console.log('\n🎉 Game room cleanup completed successfully!');
    console.log('📊 Cleanup Summary:', result);

    // Verify cleanup worked by checking remaining games that should be deleted
    const remainingToDelete = await sql`
      SELECT COUNT(*) as count FROM bible_games
      WHERE expires_at < CURRENT_TIMESTAMP
         OR (completed_at IS NOT NULL AND EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - completed_at))/60 > 10)
    `;

    if (parseInt(remainingToDelete[0].count) === 0) {
      console.log('✅ Verification: No expired or old completed games remaining - cleanup was successful!');
    } else {
      console.log(`⚠️ Warning: ${remainingToDelete[0].count} games still need deletion - manual check needed`);
    }

    return result;

  } catch (error) {
    console.error('❌ Error during game room cleanup:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    throw error;
  }
}

export async function canStartGame(gameId: number, userId: number): Promise<{
  canStart: boolean;
  reason?: string;
  minPlayers: number;
  currentPlayers: number;
  isCreator: boolean;
}> {
  await ensureInitialized();
  const sql = getDB();

  const game = await getBibleGameById(gameId);
  if (!game) {
    return {
      canStart: false,
      reason: 'Game not found',
      minPlayers: 1,
      currentPlayers: 0,
      isCreator: false
    };
  }

  const participants = await getBibleGameParticipants(gameId);
  const isCreator = game.created_by === userId;

  if (!isCreator) {
    return {
      canStart: false,
      reason: 'Only game creator can start the game',
      minPlayers: 1,
      currentPlayers: participants.length,
      isCreator: false
    };
  }

  const currentPlayers = participants.length;
  const minPlayers = 1; // Allow playing alone

  return {
    canStart: true,
    minPlayers,
    currentPlayers,
    isCreator
  };
}

export async function getBibleGameById(id: number): Promise<BibleGame | null> {
  await ensureInitialized();
  const sql = getDB();

  const result = await sql`
    SELECT bg.*, u.name as created_by_name
    FROM bible_games bg
    LEFT JOIN users u ON bg.created_by = u.id
    WHERE bg.id = ${id}
  `;

  return result[0] as BibleGame || null;
}

export async function joinBibleGame(gameId: number, userId: number, playerName: string, playerEmail?: string): Promise<BibleGameParticipant> {
  await ensureInitialized();
  const sql = getDB();

  // Check if user is already in the game
  const existing = await sql`
    SELECT id FROM bible_game_participants
    WHERE game_id = ${gameId} AND user_id = ${userId}
  `;

  if (existing.length > 0) {
    throw new Error('User already joined this game');
  }

  // Check if game is still accepting players
  const game = await getBibleGameById(gameId);
  if (!game || game.status !== 'waiting') {
    throw new Error('Game is not accepting new players');
  }

  if (game.current_players >= game.max_players) {
    throw new Error('Game is full');
  }

  // Join the game
  const result = await sql`
    INSERT INTO bible_game_participants (
      game_id, user_id, player_name, player_email,
      score, correct_answers, total_questions, is_creator, is_active
    )
    VALUES (
      ${gameId}, ${userId}, ${playerName}, ${playerEmail || null},
      0, 0, 0, false, true
    )
    RETURNING *
  `;

  // Update game player count
  await sql`
    UPDATE bible_games
    SET current_players = current_players + 1, updated_at = NOW()
    WHERE id = ${gameId}
  `;

  return result[0] as unknown as BibleGameParticipant;
}

export async function joinBibleGameAsGuest(gameId: number, playerName: string, playerEmail?: string): Promise<BibleGameParticipant> {
  await ensureInitialized();
  const sql = getDB();

  // Check if game is still accepting players
  const game = await getBibleGameById(gameId);
  if (!game || game.status !== 'waiting') {
    throw new Error('Game is not accepting new players');
  }

  if (game.current_players >= game.max_players) {
    throw new Error('Game is full');
  }

  // Get the next available guest_id for this game
  const existingParticipants = await sql`
    SELECT guest_id FROM bible_game_participants
    WHERE game_id = ${gameId} AND guest_id IS NOT NULL
    ORDER BY guest_id DESC
    LIMIT 1
  `;

  const nextGuestId = existingParticipants.length > 0 ? existingParticipants[0].guest_id + 1 : 0;

  // Join as guest (no user_id)
  const result = await sql`
    INSERT INTO bible_game_participants (
      game_id, guest_id, player_name, player_email,
      score, correct_answers, total_questions, is_creator, is_active
    )
    VALUES (
      ${gameId}, ${nextGuestId}, ${playerName}, ${playerEmail || null},
      0, 0, 0, ${nextGuestId === 0}, true
    )
    RETURNING *
  `;

  // Update game player count
  await sql`
    UPDATE bible_games
    SET current_players = current_players + 1, updated_at = NOW()
    WHERE id = ${gameId}
  `;

  return result[0] as unknown as BibleGameParticipant;
}

export async function getBibleGameParticipants(gameId: number): Promise<BibleGameParticipant[]> {
  await ensureInitialized();
  const sql = getDB();

  const result = await sql`
    SELECT
      bgp.*,
      u.name as user_name,
      u.email as user_email,
      COALESCE(answer_counts.finished_questions, 0) as finished_questions
    FROM bible_game_participants bgp
    LEFT JOIN users u ON bgp.user_id = u.id
    LEFT JOIN (
      SELECT
        participant_id,
        COUNT(*) as finished_questions
      FROM bible_game_history
      WHERE game_id = ${gameId}
      GROUP BY participant_id
    ) answer_counts ON bgp.id = answer_counts.participant_id
    WHERE bgp.game_id = ${gameId} AND bgp.is_active = true
    ORDER BY bgp.joined_at ASC
  `;

  return result as unknown as BibleGameParticipant[];
}

export async function getBibleGameParticipantByGuestId(gameId: number, guestId: number): Promise<BibleGameParticipant | null> {
  await ensureInitialized();
  const sql = getDB();

  const result = await sql`
    SELECT
      bgp.*,
      u.name as user_name,
      u.email as user_email,
      COALESCE(answer_counts.finished_questions, 0) as finished_questions
    FROM bible_game_participants bgp
    LEFT JOIN users u ON bgp.user_id = u.id
    LEFT JOIN (
      SELECT
        participant_id,
        COUNT(*) as finished_questions
      FROM bible_game_history
      WHERE game_id = ${gameId}
      GROUP BY participant_id
    ) answer_counts ON bgp.id = answer_counts.participant_id
    WHERE bgp.game_id = ${gameId} AND bgp.guest_id = ${guestId}
  `;

  return result[0] as unknown as BibleGameParticipant || null;
}

export async function setPlayerFinishedAllQuestions(gameId: number, guestId: number): Promise<boolean> {
  await ensureInitialized();
  const sql = getDB();

  // Get the game to check total questions
  const game = await getBibleGameById(gameId);
  if (!game) {
    console.error('setPlayerFinishedAllQuestions: Game not found:', gameId);
    return false;
  }

  // Get the participant
  const participant = await getBibleGameParticipantByGuestId(gameId, guestId);
  if (!participant) {
    console.error('setPlayerFinishedAllQuestions: Participant not found:', { gameId, guestId });
    return false;
  }

  // Check if player has actually finished all questions
  const finishedQuestions = await sql`
    SELECT COUNT(*) as count
    FROM bible_game_history
    WHERE game_id = ${gameId} AND participant_id = ${participant.id}
  `;

  const hasFinishedAll = finishedQuestions[0].count >= game.questions_per_game;

  console.log('setPlayerFinishedAllQuestions: Checking completion status:', {
    gameId,
    guestId,
    finishedQuestions: finishedQuestions[0].count,
    totalQuestions: game.questions_per_game,
    hasFinishedAll,
    participantId: participant.id
  });

  // Always set the finished flag when called - this is the key fix
  // The client calls this when they finish, so we should trust that and set the flag
  const result = await sql`
    UPDATE bible_game_participants
    SET finished_all_questions = true, last_activity = NOW()
    WHERE game_id = ${gameId} AND guest_id = ${guestId}
    RETURNING id
  `;

  console.log('setPlayerFinishedAllQuestions: Player marked as finished:', {
    gameId,
    guestId,
    finishedQuestions: finishedQuestions[0].count,
    totalQuestions: game.questions_per_game,
    updated: result.length > 0
  });

  return result.length > 0;
}

export async function checkAllPlayersFinished(gameId: number): Promise<{
  allFinished: boolean;
  finishedCount: number;
  totalPlayers: number;
  finishedPlayers: BibleGameParticipant[];
}> {
  await ensureInitialized();
  const sql = getDB();

  const game = await getBibleGameById(gameId);
  if (!game) {
    throw new Error('Game not found');
  }

  // Get participants with their finished status directly from the finished_all_questions flag
  const participantsResult = await sql`
    SELECT
      bgp.*,
      u.name as user_name,
      u.email as user_email
    FROM bible_game_participants bgp
    LEFT JOIN users u ON bgp.user_id = u.id
    WHERE bgp.game_id = ${gameId} AND bgp.is_active = true
    ORDER BY bgp.joined_at ASC
  `;

  // Check which players have finished all questions based on the finished_all_questions flag
  const finishedPlayers = participantsResult.filter((p: any) => p.finished_all_questions === true);

  return {
    allFinished: finishedPlayers.length === participantsResult.length && participantsResult.length > 0,
    finishedCount: finishedPlayers.length,
    totalPlayers: participantsResult.length,
    finishedPlayers: finishedPlayers as unknown as BibleGameParticipant[]
  };
}

export async function checkAllPlayersFinishedWithDeadlockDetection(gameId: number): Promise<{
  allFinished: boolean;
  finishedCount: number;
  totalPlayers: number;
  finishedPlayers: BibleGameParticipant[];
  forceCompleted?: boolean;
  deadlockDetected?: boolean;
}> {
  await ensureInitialized();
  const sql = getDB();

  let attempts = 0;
  const maxAttempts = 3;
  let result: any = null;

  while (attempts < maxAttempts) {
    try {
      const game = await getBibleGameById(gameId);
      if (!game) {
        throw new Error('Game not found');
      }

      // Get participants with their finished status
      const participantsResult = await sql`
        SELECT
          bgp.*,
          u.name as user_name,
          u.email as user_email
        FROM bible_game_participants bgp
        LEFT JOIN users u ON bgp.user_id = u.id
        WHERE bgp.game_id = ${gameId} AND bgp.is_active = true
        ORDER BY bgp.joined_at ASC
      `;

      // Check which players have finished all questions
      const finishedPlayers = participantsResult.filter((p: any) => p.finished_all_questions === true);

      // DEADLOCK DETECTION: Multiple completion conditions
      const allFinished = finishedPlayers.length === participantsResult.length && participantsResult.length > 0;
      const allFinishedByHistory = participantsResult.every((p: any) => {
        // Check if player has answered all questions in history
        return p.total_questions >= game.questions_per_game;
      });

      // Force completion if game is stuck
      const shouldForceComplete = !allFinished && !allFinishedByHistory &&
        (finishedPlayers.length >= participantsResult.length - 1) &&
        participantsResult.length > 1;

      result = {
        allFinished: allFinished || allFinishedByHistory,
        finishedCount: finishedPlayers.length,
        totalPlayers: participantsResult.length,
        finishedPlayers: finishedPlayers as unknown as BibleGameParticipant[],
        forceCompleted: shouldForceComplete,
        deadlockDetected: shouldForceComplete
      };

      // If we detect a stuck state, force completion
      if (shouldForceComplete) {
        console.log('checkAllPlayersFinishedWithDeadlockDetection: Force completion detected:', {
          gameId,
          finishedCount: finishedPlayers.length,
          totalPlayers: participantsResult.length,
          attempt: attempts + 1
        });

        // Mark game as completed
        await sql`
          UPDATE bible_games
          SET status = 'completed', completed_at = NOW(), updated_at = NOW()
          WHERE id = ${gameId} AND status IN ('active', 'starting')
        `;

        // Mark remaining players as finished
        await sql`
          UPDATE bible_game_participants
          SET finished_all_questions = true, last_activity = NOW()
          WHERE game_id = ${gameId} AND finished_all_questions = false
        `;

        result.allFinished = true;
        result.forceCompleted = true;
      }

      break; // Success, exit loop
    } catch (error) {
      attempts++;
      console.error(`checkAllPlayersFinishedWithDeadlockDetection: Attempt ${attempts} failed:`, error);

      if (attempts < maxAttempts) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempts - 1)));
      }
    }
  }

  if (!result) {
    throw new Error('Failed to check game completion after all retry attempts');
  }

  return result;
}

export async function startBibleGame(gameId: number): Promise<boolean> {
  await ensureInitialized();
  const sql = getDB();

  // First check the current game status
  const gameCheck = await sql`
    SELECT id, status FROM bible_games WHERE id = ${gameId}
  `;

  if (gameCheck.length === 0) {
    console.error('startBibleGame: Game not found:', gameId);
    return false;
  }

  const currentStatus = gameCheck[0].status;
  console.log('startBibleGame: Current game status:', { gameId, currentStatus });

  if (currentStatus === 'active' || currentStatus === 'completed') {
    console.log('startBibleGame: Game already started or completed:', { gameId, currentStatus });
    return true; // Already started
  }

  console.log('startBibleGame: Attempting to update game status to starting for gameId:', gameId);

  const result = await sql`
    UPDATE bible_games
    SET status = 'starting', started_at = NOW(), updated_at = NOW()
    WHERE id = ${gameId} AND status IN ('waiting', 'expired', 'starting', 'cancelled')
    RETURNING id
  `;

  console.log('startBibleGame: Update result:', { gameId, updatedRows: result.length, result });

  // Verify the update worked
  const verifyUpdate = await sql`
    SELECT id, status, started_at FROM bible_games WHERE id = ${gameId}
  `;

  console.log('startBibleGame: Verification after update:', verifyUpdate[0] as unknown as BibleGame);

  const success = result.length > 0 || currentStatus === 'starting';
  console.log('startBibleGame: Returning:', success, { currentStatus, updatedRows: result.length });

  return success;
}

export async function createBibleGameQuestions(
  gameId: number,
  questions: Array<{
    questionText: string;
    correctAnswer: string;
    options: string[];
    bibleReference: string;
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    points: number;
    questionNumber?: number;  // Optional question number
  }>
): Promise<BibleGameQuestion[]> {
  await ensureInitialized();
  const sql = getDB();

  const insertedQuestions = [];

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    // Use provided question number or fall back to loop counter
    const questionNumber = question.questionNumber || (i + 1);
    const result = await sql`
      INSERT INTO bible_game_questions (
        game_id, question_number, question_text, correct_answer,
        options, bible_reference, difficulty, points, ai_generated
      )
      VALUES (
        ${gameId}, ${questionNumber}, ${question.questionText}, ${question.correctAnswer},
        ${JSON.stringify(question.options)}, ${question.bibleReference},
        ${question.difficulty}, ${question.points}, true
      )
      RETURNING *
    `;
    insertedQuestions.push(result[0]);
  }

  return insertedQuestions as unknown as BibleGameQuestion[];
}

export async function getBibleGameQuestions(gameId: number): Promise<BibleGameQuestion[]> {
  await ensureInitialized();
  const sql = getDB();

  const result = await sql`
    SELECT * FROM bible_game_questions
    WHERE game_id = ${gameId}
    ORDER BY question_number ASC
  `;

  return result.map(q => ({
    ...q,
    options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
  })) as unknown as BibleGameQuestion[];
}

export async function recordBibleGameAnswer(
  gameId: number,
  participantId: number,
  questionId: number,
  selectedAnswer: string,
  timeTaken: number
): Promise<BibleGameHistory> {
  await ensureInitialized();
  const sql = getDB();

  // Get the question to check if answer is correct
  const question = await sql`
    SELECT correct_answer, points FROM bible_game_questions
    WHERE id = ${questionId}
  `;

  if (question.length === 0) {
    throw new Error('Question not found');
  }

  const isCorrect = selectedAnswer === question[0].correct_answer;
  const pointsEarned = isCorrect ? question[0].points : 0;

  // Record the answer
  const result = await sql`
    INSERT INTO bible_game_history (
      game_id, participant_id, question_id, selected_answer,
      is_correct, time_taken, points_earned
    )
    VALUES (
      ${gameId}, ${participantId}, ${questionId}, ${selectedAnswer},
      ${isCorrect}, ${timeTaken}, ${pointsEarned}
    )
    RETURNING *
  `;

  // Update participant score
  await sql`
    UPDATE bible_game_participants
    SET score = score + ${pointsEarned},
        correct_answers = correct_answers + ${isCorrect ? 1 : 0},
        total_questions = total_questions + 1,
        last_activity = NOW()
    WHERE id = ${participantId}
  `;

  return result[0] as unknown as BibleGameHistory;
}

export async function getBibleGameResults(gameId: number): Promise<{
  game: BibleGame;
  participants: (BibleGameParticipant & { user_name?: string; user_email?: string })[];
  leaderboard: any[];
}> {
  await ensureInitialized();
  const sql = getDB();

  const game = await getBibleGameById(gameId);
  if (!game) {
    throw new Error('Game not found');
  }

  const participants = await getBibleGameParticipants(gameId);

  // Get final scores and rankings
  const leaderboard = await sql`
    SELECT
      bgp.*,
      u.name as user_name,
      u.email as user_email,
      ROW_NUMBER() OVER (ORDER BY bgp.score DESC, bgp.correct_answers DESC) as rank
    FROM bible_game_participants bgp
    LEFT JOIN users u ON bgp.user_id = u.id
    WHERE bgp.game_id = ${gameId} AND bgp.is_active = true
    ORDER BY bgp.score DESC, bgp.correct_answers DESC
  `;

  return {
    game,
    participants,
    leaderboard: leaderboard as unknown as any[]
  };
}

export async function completeBibleGame(gameId: number): Promise<boolean> {
  await ensureInitialized();
  const sql = getDB();

  // First get game details to check if it's multiplayer
  const game = await getBibleGameById(gameId);
  if (!game) {
    return false;
  }

  const result = await sql`
    UPDATE bible_games
    SET status = 'completed', completed_at = NOW(), updated_at = NOW()
    WHERE id = ${gameId} AND status IN ('active', 'starting')
  `;

  if (result.length > 0) {
    // Update user stats for multiplayer games
    if (game.max_players > 1) {
      await updateUserStatsForCompletedGame(gameId, game.difficulty as 'easy' | 'medium' | 'hard' | 'expert');
    }
  }

  return result.length > 0;
}

async function updateUserStatsForCompletedGame(gameId: number, difficulty: 'easy' | 'medium' | 'hard' | 'expert'): Promise<void> {
  await ensureInitialized();
  const sql = getDB();

  try {
    // Get the top players (winners) from the completed game
    const winners = await sql`
      SELECT
        bgp.user_id,
        bgp.player_name,
        bgp.score,
        ROW_NUMBER() OVER (ORDER BY bgp.score DESC, bgp.correct_answers DESC) as rank
      FROM bible_game_participants bgp
      WHERE bgp.game_id = ${gameId}
        AND bgp.user_id IS NOT NULL
        AND bgp.is_active = true
      ORDER BY bgp.score DESC, bgp.correct_answers DESC
      LIMIT 3
    `;

    // Update stats for all participants (increment total_games)
    const allParticipants = await sql`
      SELECT DISTINCT user_id
      FROM bible_game_participants
      WHERE game_id = ${gameId} AND user_id IS NOT NULL AND is_active = true
    `;

    for (const participant of allParticipants) {
      await updateUserBibleStats(participant.user_id, difficulty, false);
    }

    // Update wins for top 3 players (consider them winners)
    for (const winner of winners) {
      if (winner.user_id && winner.rank <= 3) {
        await updateUserBibleStats(winner.user_id, difficulty, true);
      }
    }

    console.log(`Updated user stats for game ${gameId}: ${allParticipants.length} participants, ${winners.length} winners`);
  } catch (error) {
    console.error('Error updating user stats for completed game:', error);
  }
}

// User Bible Stats Functions
export async function getUserBibleStats(userId: number): Promise<UserBibleStats[]> {
  await ensureInitialized();
  const sql = getDB();

  const result = await sql`
    SELECT * FROM user_bible_stats
    WHERE user_id = ${userId}
    ORDER BY difficulty
  `;

  return result as unknown as UserBibleStats[];
}

export async function updateUserBibleStats(userId: number, difficulty: 'easy' | 'medium' | 'hard' | 'expert', isWin: boolean = false): Promise<void> {
  await ensureInitialized();
  const sql = getDB();

  // Upsert user stats
  await sql`
    INSERT INTO user_bible_stats (user_id, difficulty, multiplayer_wins, total_games, updated_at)
    VALUES (${userId}, ${difficulty}, ${isWin ? 1 : 0}, 1, NOW())
    ON CONFLICT (user_id, difficulty) DO UPDATE SET
      multiplayer_wins = user_bible_stats.multiplayer_wins + ${isWin ? 1 : 0},
      total_games = user_bible_stats.total_games + 1,
      updated_at = NOW()
  `;
}

export async function getGlobalLeaderboard(difficulty: 'easy' | 'medium' | 'hard' | 'expert', limit: number = 5): Promise<{ user_id: number; name: string; email: string; multiplayer_wins: number; total_games: number }[]> {
  await ensureInitialized();
  const sql = getDB();

  const result = await sql`
    SELECT
      ubs.user_id,
      u.name,
      u.email,
      ubs.multiplayer_wins,
      ubs.total_games
    FROM user_bible_stats ubs
    JOIN users u ON ubs.user_id = u.id
    WHERE ubs.difficulty = ${difficulty}
      AND u.status = 'active'
    ORDER BY ubs.multiplayer_wins DESC, ubs.total_games DESC
    LIMIT ${limit}
  `;

  return result as unknown as { user_id: number; name: string; email: string; multiplayer_wins: number; total_games: number }[];
}

export async function forceCompleteBibleGame(gameId: number, guestId: number): Promise<boolean> {
  await ensureInitialized();
  const sql = getDB();

  try {
    console.log('forceCompleteBibleGame: Attempting to force complete game:', { gameId, guestId });

    // First check if the requesting player exists and is in the game
    const participant = await getBibleGameParticipantByGuestId(gameId, guestId);
    if (!participant) {
      console.error('forceCompleteBibleGame: Participant not found:', { gameId, guestId });
      return false;
    }

    // Get current game state
    const game = await getBibleGameById(gameId);
    if (!game) {
      console.error('forceCompleteBibleGame: Game not found:', gameId);
      return false;
    }

    // DEADLOCK DETECTION: Multiple force completion conditions
    const participants = await getBibleGameParticipants(gameId);
    const finishedCount = participants.filter(p => p.finished_all_questions).length;
    const shouldForceComplete = finishedCount >= participants.length - 1 || // All but one finished
                               participants.length <= 1 || // Single player game
                               (game.status === 'starting' && Date.now() - new Date(game.created_at).getTime() > 300000); // 5 minutes old

    if (!shouldForceComplete) {
      console.log('forceCompleteBibleGame: Force completion conditions not met:', {
        gameId,
        finishedCount,
        totalPlayers: participants.length,
        gameStatus: game.status,
        gameAge: Date.now() - new Date(game.created_at).getTime()
      });
      return false;
    }

    // Mark all remaining players as finished
    const result = await sql`
      UPDATE bible_game_participants
      SET finished_all_questions = true, last_activity = NOW()
      WHERE game_id = ${gameId} AND finished_all_questions = false
    `;

    // Mark game as completed
    const completeResult = await sql`
      UPDATE bible_games
      SET status = 'completed', completed_at = NOW(), updated_at = NOW()
      WHERE id = ${gameId} AND status IN ('waiting', 'starting', 'active')
    `;

    const success = completeResult.length > 0;
    console.log('forceCompleteBibleGame: Force completion result:', {
      gameId,
      guestId,
      success,
      playersMarkedFinished: result.length,
      gameCompleted: completeResult.length > 0
    });

    return success;
  } catch (error) {
    console.error('forceCompleteBibleGame: Error during force completion:', error);
    return false;
  }
}

export async function leaveBibleGame(gameId: number, guestId: number): Promise<boolean> {
  await ensureInitialized();
  const sql = getDB();

  // Check if the leaving participant is the creator (guest_id = 0)
  const participantCheck = await sql`
    SELECT guest_id FROM bible_game_participants
    WHERE game_id = ${gameId} AND guest_id = ${guestId}
  `;

  if (participantCheck.length === 0) {
    return false; // Participant not found
  }

  const isCreator = participantCheck[0].guest_id === 0;

  if (isCreator) {
    // Check if game has already started and if there are other active participants
    const gameCheck = await sql`
      SELECT status, created_at, current_players FROM bible_games WHERE id = ${gameId}
    `;

    if (gameCheck.length === 0) {
      return false; // Game not found
    }

    const gameStatus = gameCheck[0].status;
    const gameCreatedAt = new Date(gameCheck[0].created_at);
    const currentPlayers = gameCheck[0].current_players;
    const gameAgeMinutes = (Date.now() - gameCreatedAt.getTime()) / (1000 * 60);

    // Count other active participants (excluding the creator)
    const otherParticipants = await sql`
      SELECT COUNT(*) as count FROM bible_game_participants
      WHERE game_id = ${gameId} AND guest_id != ${guestId} AND is_active = true
    `;

    const otherActivePlayers = parseInt(otherParticipants[0].count);

    console.log('leaveBibleGame: Creator leaving analysis:', {
      gameId,
      gameStatus,
      gameAgeMinutes,
      currentPlayers,
      otherActivePlayers,
      guestId
    });

    // CASE 1: Game has started (starting, active, or completed) - always continue if there are other players
    if (gameStatus === 'starting' || gameStatus === 'active' || gameStatus === 'completed') {
      if (otherActivePlayers > 0) {
        console.log('leaveBibleGame: Creator leaving started game with other players - marking as inactive, game continues:', {
          gameId,
          gameStatus,
          otherActivePlayers
        });

        // Just mark creator as inactive - other players continue
        await sql`
          UPDATE bible_game_participants
          SET is_active = false, last_activity = NOW()
          WHERE game_id = ${gameId} AND guest_id = ${guestId}
        `;

        // Update game player count
        await sql`
          UPDATE bible_games
          SET current_players = current_players - 1, updated_at = NOW()
          WHERE id = ${gameId}
        `;

        return true;
      } else {
        // Game has started but no other active players - end the game
        console.log('leaveBibleGame: Creator leaving started game with no other players - ending game:', {
          gameId,
          gameStatus
        });

        await sql`
          UPDATE bible_games
          SET status = 'cancelled', updated_at = NOW()
          WHERE id = ${gameId}
        `;

        // Mark creator as inactive
        await sql`
          UPDATE bible_game_participants
          SET is_active = false, last_activity = NOW()
          WHERE game_id = ${gameId} AND guest_id = ${guestId}
        `;

        return true;
      }
    }

    // CASE 2: Game is still waiting
    if (gameStatus === 'waiting') {
      if (otherActivePlayers > 0) {
        // There are other players waiting - cancel the game and notify them
        console.log('leaveBibleGame: Creator leaving waiting game with other players - cancelling game and notifying players:', {
          gameId,
          gameStatus,
          otherActivePlayers
        });

        // Mark game as cancelled
        await sql`
          UPDATE bible_games
          SET status = 'cancelled', updated_at = NOW()
          WHERE id = ${gameId}
        `;

        // Mark creator as inactive
        await sql`
          UPDATE bible_game_participants
          SET is_active = false, last_activity = NOW()
          WHERE game_id = ${gameId} AND guest_id = ${guestId}
        `;

        // Update game player count
        await sql`
          UPDATE bible_games
          SET current_players = current_players - 1, updated_at = NOW()
          WHERE id = ${gameId}
        `;

        return true;
      } else {
        // No other players - destroy the game
        console.log('leaveBibleGame: Creator leaving waiting game with no other players - destroying game:', {
          gameId,
          gameStatus,
          gameAgeMinutes
        });

        await sql`
          DELETE FROM bible_games WHERE id = ${gameId}
        `;
        // Cascade delete will handle participants and questions
        return true;
      }
    }

    // CASE 3: Game is in other status (cancelled, expired) - just remove creator
    console.log('leaveBibleGame: Creator leaving game in other status - marking as inactive:', {
      gameId,
      gameStatus
    });

    // Just mark creator as inactive
    await sql`
      UPDATE bible_game_participants
      SET is_active = false, last_activity = NOW()
      WHERE game_id = ${gameId} AND guest_id = ${guestId}
    `;

    // Update game player count
    await sql`
      UPDATE bible_games
      SET current_players = current_players - 1, updated_at = NOW()
      WHERE id = ${gameId}
    `;

    return true;
  } else {
    // Regular participant leaving - just mark as inactive
    await sql`
      UPDATE bible_game_participants
      SET is_active = false, last_activity = NOW()
      WHERE game_id = ${gameId} AND guest_id = ${guestId}
    `;

    // Update game player count
    await sql`
      UPDATE bible_games
      SET current_players = current_players - 1, updated_at = NOW()
      WHERE id = ${gameId}
    `;

    return true;
  }
}

export async function getRoleChangesByUser(targetUserId: number, limit: number = 20): Promise<RoleChangeLog[]> {
  await ensureInitialized();
  const sql = getDB();

  const result = await sql`
    SELECT * FROM role_change_log
    WHERE target_user_id = ${targetUserId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  return result as unknown as RoleChangeLog[];
}

export async function getRoleChangesByAdmin(changedByUserId: number, limit: number = 20): Promise<RoleChangeLog[]> {
  await ensureInitialized();
  const sql = getDB();

  const result = await sql`
    SELECT * FROM role_change_log
    WHERE changed_by_user_id = ${changedByUserId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  return result as unknown as RoleChangeLog[];
}

// Verse Usage Tracking System
export interface VerseUsage {
  id: number;
  verse_reference: string;
  frequency: number;
  last_used: Date;
  created_at: Date;
  updated_at: Date;
}

export interface VerseUsageStats {
  totalVerses: number;
  totalUsages: number;
  averageFrequency: number;
  mostUsedVerse: string;
  leastUsedVerse: string;
}

export async function recordVerseUsage(verseReference: string): Promise<void> {
  await ensureInitialized();
  const sql = getDB();

  try {
    // First check if verse exists
    const existing = await sql`
      SELECT id, frequency FROM verse_usage
      WHERE verse_reference = ${verseReference}
    `;

    if (existing.length > 0) {
      // Update existing verse
      await sql`
        UPDATE verse_usage
        SET frequency = frequency + 1,
            last_used = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existing[0].id}
      `;
    } else {
      // Insert new verse
      await sql`
        INSERT INTO verse_usage (verse_reference, frequency, last_used, created_at, updated_at)
        VALUES (${verseReference}, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
    }
  } catch (error) {
    console.error('Error recording verse usage:', error);
    // Don't throw - continue even if tracking fails
  }
}

// Batch verse usage recording to reduce database calls
export async function recordVerseUsageBatch(verseReferences: string[]): Promise<void> {
  if (verseReferences.length === 0) return;

  await ensureInitialized();
  const sql = getDB();

  try {
    // Create a batch of unique verse references
    const uniqueVerses = [...new Set(verseReferences)];

    // Build the batch update query
    const values = uniqueVerses.map((verse, index) =>
      `('${verse}', ${index + 1})`
    ).join(', ');

    // Use a single query to update/insert all verses
    await sql`
      WITH verse_data AS (
        VALUES ${values}
      ),
      upsert_data AS (
        SELECT
          column1 as verse_reference,
          column2 as batch_order
        FROM verse_data
      )
      INSERT INTO verse_usage (verse_reference, frequency, last_used, created_at, updated_at)
      SELECT
        verse_reference,
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM upsert_data
      ON CONFLICT (verse_reference)
      DO UPDATE SET
        frequency = verse_usage.frequency + 1,
        last_used = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    `;

    console.log(`[Batch] Recorded usage for ${uniqueVerses.length} unique verses`);
  } catch (error) {
    console.error('Error recording batch verse usage:', error);
    // Fallback to individual calls if batch fails
    console.log('Falling back to individual verse usage recording...');
    for (const verseReference of verseReferences) {
      try {
        await recordVerseUsage(verseReference);
      } catch (fallbackError) {
        console.error(`Failed to record verse usage for ${verseReference}:`, fallbackError);
      }
    }
  }
}

export async function getVerseUsageStats(): Promise<VerseUsageStats> {
  await ensureInitialized();
  const sql = getDB();

  try {
    const result = await sql`
      SELECT
        COUNT(*) as total_verses,
        COALESCE(SUM(frequency), 0) as total_usages,
        COALESCE(AVG(frequency), 0) as average_frequency
      FROM verse_usage
    `;

    const mostUsed = await sql`
      SELECT verse_reference, frequency
      FROM verse_usage
      ORDER BY frequency DESC
      LIMIT 1
    `;

    const leastUsed = await sql`
      SELECT verse_reference, frequency
      FROM verse_usage
      ORDER BY frequency ASC
      LIMIT 1
    `;

    return {
      totalVerses: parseInt(result[0].total_verses) || 0,
      totalUsages: parseInt(result[0].total_usages) || 0,
      averageFrequency: parseFloat(result[0].average_frequency) || 0,
      mostUsedVerse: mostUsed[0]?.verse_reference || 'None',
      leastUsedVerse: leastUsed[0]?.verse_reference || 'None'
    };
  } catch (error) {
    console.error('Error getting verse usage stats:', error);
    return {
      totalVerses: 0,
      totalUsages: 0,
      averageFrequency: 0,
      mostUsedVerse: 'None',
      leastUsedVerse: 'None'
    };
  }
}

export async function getUnusedVerses(limit: number = 100): Promise<VerseUsage[]> {
  await ensureInitialized();
  const sql = getDB();

  try {
    const result = await sql`
      SELECT * FROM verse_usage
      WHERE frequency = 1
      ORDER BY last_used DESC
      LIMIT ${limit}
    `;
    return result as unknown as VerseUsage[];
  } catch (error) {
    console.error('Error getting unused verses:', error);
    return [];
  }
}

export async function getLowFrequencyVerses(maxFrequency: number = 3, limit: number = 200): Promise<VerseUsage[]> {
  await ensureInitialized();
  const sql = getDB();

  try {
    const result = await sql`
      SELECT * FROM verse_usage
      WHERE frequency <= ${maxFrequency}
      ORDER BY frequency ASC, last_used DESC
      LIMIT ${limit}
    `;
    return result as unknown as VerseUsage[];
  } catch (error) {
    console.error('Error getting low frequency verses:', error);
    return [];
  }
}

export async function getVerseUsageByBook(bookName: string): Promise<VerseUsage[]> {
  await ensureInitialized();
  const sql = getDB();

  try {
    const result = await sql`
      SELECT * FROM verse_usage
      WHERE verse_reference LIKE ${bookName + '%'}
      ORDER BY frequency DESC, last_used DESC
    `;
    return result as unknown as VerseUsage[];
  } catch (error) {
    console.error('Error getting verse usage by book:', error);
    return [];
  }
}

export async function getAllVerseUsage(limit: number = 10000): Promise<VerseUsage[]> {
  await ensureInitialized();
  const sql = getDB();

  try {
    const result = await sql`
      SELECT * FROM verse_usage
      ORDER BY last_used DESC
      LIMIT ${limit}
    `;
    return result as unknown as VerseUsage[];
  } catch (error) {
    console.error('Error getting all verse usage:', error);
    return [];
  }
}

export async function getRecentVerseUsage(days: number = 3): Promise<VerseUsage[]> {
  await ensureInitialized();
  const sql = getDB();

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await sql`
      SELECT * FROM verse_usage
      WHERE last_used >= ${cutoffDate.toISOString()}
      ORDER BY last_used DESC
    `;
    return result as unknown as VerseUsage[];
  } catch (error) {
    console.error('Error getting recent verse usage:', error);
    return [];
  }
}

export async function getBookUsageSummary(): Promise<{ [bookName: string]: { totalUsages: number; uniqueVerses: number } }> {
  await ensureInitialized();
  const sql = getDB();

  try {
    const result = await sql`
      SELECT
        CASE
          WHEN verse_reference LIKE '1 %' THEN '1 ' || SPLIT_PART(verse_reference, ' ', 2)
          WHEN verse_reference LIKE '2 %' THEN '2 ' || SPLIT_PART(verse_reference, ' ', 2)
          WHEN verse_reference LIKE '3 %' THEN '3 ' || SPLIT_PART(verse_reference, ' ', 2)
          ELSE SPLIT_PART(verse_reference, ' ', 1)
        END as book_name,
        SUM(frequency) as total_usages,
        COUNT(*) as unique_verses
      FROM verse_usage
      GROUP BY book_name
      ORDER BY total_usages DESC
    `;

    const summary: { [bookName: string]: { totalUsages: number; uniqueVerses: number } } = {};
    result.forEach((row: any) => {
      summary[row.book_name] = {
        totalUsages: parseInt(row.total_usages),
        uniqueVerses: parseInt(row.unique_verses)
      };
    });

    return summary;
  } catch (error) {
    console.error('Error getting book usage summary:', error);
    return {};
  }
}

export async function cleanupOldVerseData(daysOld: number = 5): Promise<number> {
  await ensureInitialized();
  const sql = getDB();

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await sql`
      DELETE FROM verse_usage
      WHERE last_used < ${cutoffDate.toISOString()}
    `;

    console.log(`Cleaned up ${result.length} old verse usage records older than ${daysOld} days`);
    return result.length;
  } catch (error) {
    console.error('Error cleaning up old verse data:', error);
    return 0;
  }
}

// Bible Question Bank Interfaces
export interface BibleQuestion {
  id: number;
  question_text: string;
  correct_answer: string;
  options: string[];
  bible_reference: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  points: number;
  category: string;
  subcategory?: string;
  tags: string[];
  question_type: string;
  verse_context?: string;
  explanation?: string;
  source: string;
  quality_score?: number;
  created_at: Date;
  updated_at: Date;
}

export interface SimplifiedBibleQuestion {
  id: number;
  text: string;
  correctAnswer: string;
  options: string[];
  reference: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  points: number;
}

export interface QuestionImportResult {
  success: number;
  failed: number;
  errors: string[];
}

// Bible Question Bank Database Functions
export async function initializeQuestionBankTables(): Promise<void> {
  console.log('Initializing Bible question bank tables...');
  const sql = getDB();

  try {
    // Create bible_questions table
    await sql`
      CREATE TABLE IF NOT EXISTS bible_questions (
        id SERIAL PRIMARY KEY,
        question_text TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        options JSONB NOT NULL,
        bible_reference VARCHAR(255) NOT NULL,
        difficulty VARCHAR(50) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
        points INTEGER NOT NULL DEFAULT 10,
        category VARCHAR(255) NOT NULL,
        subcategory VARCHAR(255) NULL,
        tags JSONB DEFAULT '[]'::jsonb,
        question_type VARCHAR(100) NOT NULL,
        verse_context TEXT NULL,
        explanation TEXT NULL,
        source VARCHAR(255) NOT NULL,
        quality_score DECIMAL(3,2) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create indexes for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_bible_questions_difficulty ON bible_questions(difficulty);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_bible_questions_category ON bible_questions(category);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_bible_questions_reference ON bible_questions(bible_reference);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_bible_questions_source ON bible_questions(source);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_bible_questions_created_at ON bible_questions(created_at DESC);
    `;

    // Create a unique constraint to prevent duplicate questions
    try {
      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_bible_questions_unique
        ON bible_questions (question_text, correct_answer, bible_reference);
      `;
    } catch (error) {
      console.log('Unique index already exists or could not be created:', error);
    }

    console.log('Bible question bank tables initialized successfully');
  } catch (error) {
    console.error('Error initializing question bank tables:', error);
    throw error;
  }
}

export async function importQuestionsBatch(questions: any[]): Promise<QuestionImportResult> {
  await ensureInitialized();
  const sql = getDB();

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    // Process questions individually to handle duplicates properly
    for (const question of questions) {
      try {
        const result = await sql`
          INSERT INTO bible_questions (
            question_text, correct_answer, options, bible_reference, difficulty,
            points, category, subcategory, tags, question_type, verse_context,
            explanation, source
          )
          VALUES (
            ${question.questionText}, ${question.correctAnswer}, ${JSON.stringify(question.options)}::jsonb,
            ${question.bibleReference}, ${question.difficulty}, ${question.points},
            ${question.category}, ${question.subcategory || null}, ${JSON.stringify(question.tags || [])}::jsonb,
            ${question.questionType}, ${question.verseContext || null}, ${question.explanation || null},
            ${question.source}
          )
          ON CONFLICT (question_text, correct_answer, bible_reference) DO NOTHING
        `;

        if (result.length > 0) {
          success++;
        } else {
          // Question was skipped due to conflict (duplicate)
          success++; // Still count as success since it exists
        }

      } catch (questionError) {
        console.error('Error importing question:', questionError);
        failed++;
        errors.push(`Question import failed: ${questionError instanceof Error ? questionError.message : String(questionError)}`);
      }
    }

  } catch (error) {
    console.error('Error in batch import:', error);
    failed = questions.length;
    errors.push(`Batch import failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  return { success, failed, errors };
}

export async function getQuestionStats(): Promise<{
  totalQuestions: number;
  questionsByDifficulty: { [key: string]: number };
  questionsByCategory: { [key: string]: number };
  averageQualityScore: number;
  sources: string[];
}> {
  await ensureInitialized();
  const sql = getDB();

  try {
    // Get total count
    const totalResult = await sql`SELECT COUNT(*) as count FROM bible_questions`;
    const totalQuestions = parseInt(totalResult[0].count);

    // Get distribution by difficulty
    const difficultyResult = await sql`
      SELECT difficulty, COUNT(*) as count
      FROM bible_questions
      GROUP BY difficulty
      ORDER BY difficulty
    `;

    const questionsByDifficulty: { [key: string]: number } = {};
    difficultyResult.forEach((row: any) => {
      questionsByDifficulty[row.difficulty] = parseInt(row.count);
    });

    // Get distribution by category
    const categoryResult = await sql`
      SELECT category, COUNT(*) as count
      FROM bible_questions
      GROUP BY category
      ORDER BY category
    `;

    const questionsByCategory: { [key: string]: number } = {};
    categoryResult.forEach((row: any) => {
      questionsByCategory[row.category] = parseInt(row.count);
    });

    // Get average quality score
    const qualityResult = await sql`
      SELECT AVG(quality_score) as avg_score
      FROM bible_questions
      WHERE quality_score IS NOT NULL
    `;

    const averageQualityScore = qualityResult[0].avg_score ? parseFloat(qualityResult[0].avg_score) : 0;

    // Get unique sources
    const sourceResult = await sql`
      SELECT DISTINCT source
      FROM bible_questions
      ORDER BY source
    `;

    const sources = sourceResult.map((row: any) => row.source);

    return {
      totalQuestions,
      questionsByDifficulty,
      questionsByCategory,
      averageQualityScore,
      sources
    };

  } catch (error) {
    console.error('Error getting question stats:', error);
    return {
      totalQuestions: 0,
      questionsByDifficulty: {},
      questionsByCategory: {},
      averageQualityScore: 0,
      sources: []
    };
  }
}

export async function getRandomQuestionsByDifficulty(
  difficulty: 'easy' | 'medium' | 'hard' | 'expert',
  count: number = 10
): Promise<SimplifiedBibleQuestion[]> {
  await ensureInitialized();
  const sql = getDB();

  try {
    const result = await sql`
      SELECT question_text, correct_answer, options, bible_reference, difficulty, points
      FROM bible_questions
      WHERE difficulty = ${difficulty}
      ORDER BY RANDOM()
      LIMIT ${count}
    `;

    return result.map((row: any, index: number) => ({
      id: index + 1, // Generate a temporary ID for compatibility
      text: row.question_text,
      correctAnswer: row.correct_answer,
      options: Array.isArray(row.options) ? row.options : JSON.parse(row.options || '[]'),
      reference: row.bible_reference,
      difficulty: row.difficulty,
      points: row.points
    })) as SimplifiedBibleQuestion[];

  } catch (error) {
    console.error('Error getting random questions by difficulty:', error);
    return [];
  }
}
