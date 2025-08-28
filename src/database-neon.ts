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
  created_at: Date;
  updated_at: Date;
  // New fields for enhanced resources
  file_path?: string;           // Path to uploaded file
  file_name?: string;           // Original filename
  file_size?: number;           // File size in bytes
  extracted_content?: string;   // Extracted text content for PDFs
  content_preview?: string;     // Short preview/excerpt
  download_url?: string;        // Direct download link
  view_url?: string;           // Viewing link for web display
  metadata?: string;           // JSON metadata (colors, formatting, etc.)
  is_uploaded_file: boolean;   // Whether this is an uploaded file or external link
  published: boolean;          // Whether resource is published
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  slug: string;
  color?: string;           // Hex color for UI
  icon?: string;            // FontAwesome icon name
  created_at: Date;
  updated_at: Date;
}

export interface EmailVerification {
  id: number;
  user_id: number;
  email: string;
  otp_code: string;
  purpose: 'registration' | 'email_change' | 'password_reset';
  attempts: number;
  max_attempts: number;
  expires_at: Date;
  verified_at?: Date;
  created_at: Date;
  updated_at: Date;
  ip_address?: string;
  user_agent?: string;
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

export interface Comment {
  id: number;
  content: string;
  user_id: number;
  user_name?: string;
  article_id?: number;
  resource_id?: number;
  parent_id?: number;  // For reply hierarchy
  reply_to_user?: string;  // Name of user being replied to
  created_at: Date;
  updated_at?: Date;
}

// Database initialization flag
// Skip initialization in Cloudflare Workers to avoid "Too many subrequests" error
// Database tables are already created in production
let isInitialized = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production' ? true : false;

// Global environment for Cloudflare Workers
let globalEnv: any = null;

export function setGlobalEnv(env: any) {
  globalEnv = env;
  
  // Skip database initialization in production (Cloudflare Workers)
  // The database is already set up and initialization causes "Too many subrequests" error
  if (env?.ENVIRONMENT === 'production' || env?.CF_PAGES) {
    isInitialized = true;
    console.log('Production environment detected - skipping database initialization');
  }
  
  // Debug logging for environment setup
  console.log('Global environment set:', {
    hasEnv: !!env,
    envKeys: env ? Object.keys(env) : [],
    hasDatabaseUrl: !!env?.DATABASE_URL,
    hasGoogleClientId: !!env?.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!env?.GOOGLE_CLIENT_SECRET,
    hasEnvironment: !!env?.ENVIRONMENT,
    isInitialized: isInitialized,
    skipInit: !!env?.ENVIRONMENT || !!env?.CF_PAGES
  });
}

// Get database connection
export function getDB() {
  // Priority order for database URL:
  // 1. Cloudflare Workers environment (c.env from request context)
  // 2. Process environment variables (local development)
  // 3. Hardcoded fallback (development/testing)
  let databaseUrl = globalEnv?.DATABASE_URL || 
    process.env.DATABASE_URL || 
    process.env.POSTGRES_URL || 
    'postgres://neondb_owner:npg_bCSE8mA2YjgT@ep-weathered-mode-adqdxv9w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';
  
  // Debug logging for environment resolution
  console.log('Database connection debug:', {
    hasGlobalEnv: !!globalEnv,
    globalEnvKeys: globalEnv ? Object.keys(globalEnv) : [],
    hasDatabaseUrlInGlobalEnv: !!globalEnv?.DATABASE_URL,
    hasDatabaseUrlInProcessEnv: !!process.env.DATABASE_URL,
    usingFallback: !globalEnv?.DATABASE_URL && !process.env.DATABASE_URL,
    urlLength: databaseUrl?.length || 0
  });
  
  return neon(databaseUrl);
}

// Lazy initialization - call this before any database operation
async function ensureInitialized() {
  if (!isInitialized) {
    // Skip initialization in Cloudflare Workers (production) to avoid "Too many subrequests"
    // Check for Cloudflare environment indicators
    const isCloudflare = globalEnv?.CF_PAGES || globalEnv?.ENVIRONMENT === 'production' || 
                        (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production');
    
    if (isCloudflare) {
      console.log('Cloudflare Workers environment detected - skipping database initialization');
      isInitialized = true;
      return;
    }
    
    await initializeDatabase();
    isInitialized = true;
  }
}

// Initialize database tables
export async function initializeDatabase() {
  console.log('Initializing Neon PostgreSQL database...');
  
  const sql = getDB();
  
  try {
    // Create users table with enhanced moderation fields and OAuth support
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

    // Add new columns to existing users table (for existing databases)
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned'))`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_expires TIMESTAMP NULL`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT NULL`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) NULL`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT NULL`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'email' CHECK (auth_provider IN ('email', 'google'))`;
      
      // Make password_hash nullable for OAuth users
      await sql`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`;
      
      // Add role constraint if it doesn't exist
      await sql`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`;
      await sql`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'moderator', 'user'))`;
    } catch (error) {
      // Columns/constraints might already exist, which is fine
      console.log('Some user table columns/constraints already exist');
    }

    // Create articles table
    await sql`
      CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        author_id INTEGER REFERENCES users(id),
        published BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create resources table with enhanced fields
    await sql`
      CREATE TABLE IF NOT EXISTS resources (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        url TEXT,
        resource_type VARCHAR(100) NOT NULL,
        author_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        file_path TEXT,
        file_name VARCHAR(255),
        file_size BIGINT,
        extracted_content TEXT,
        content_preview TEXT,
        download_url TEXT,
        view_url TEXT,
        metadata TEXT,
        is_uploaded_file BOOLEAN DEFAULT false,
        published BOOLEAN DEFAULT true
      );
    `;

    // Add new columns to existing resources table (for existing databases)
    try {
      await sql`ALTER TABLE resources ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
      await sql`ALTER TABLE resources ADD COLUMN IF NOT EXISTS file_path TEXT`;
      await sql`ALTER TABLE resources ADD COLUMN IF NOT EXISTS file_name VARCHAR(255)`;
      await sql`ALTER TABLE resources ADD COLUMN IF NOT EXISTS file_size BIGINT`;
      await sql`ALTER TABLE resources ADD COLUMN IF NOT EXISTS extracted_content TEXT`;
      await sql`ALTER TABLE resources ADD COLUMN IF NOT EXISTS content_preview TEXT`;
      await sql`ALTER TABLE resources ADD COLUMN IF NOT EXISTS download_url TEXT`;
      await sql`ALTER TABLE resources ADD COLUMN IF NOT EXISTS view_url TEXT`;
      await sql`ALTER TABLE resources ADD COLUMN IF NOT EXISTS metadata TEXT`;
      await sql`ALTER TABLE resources ADD COLUMN IF NOT EXISTS is_uploaded_file BOOLEAN DEFAULT false`;
      await sql`ALTER TABLE resources ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true`;
    } catch (error) {
      // Columns might already exist, which is fine
      console.log('Some columns already exist in resources table');
    }

    // Create categories table
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        slug VARCHAR(255) NOT NULL UNIQUE,
        color VARCHAR(7) DEFAULT '#3b82f6',
        icon VARCHAR(50) DEFAULT 'fas fa-folder',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Insert default categories if none exist
    const categoryCheck = await sql`SELECT COUNT(*) as count FROM categories`;
    if (categoryCheck[0]?.count == 0) {
      await sql`
        INSERT INTO categories (name, description, slug, color, icon) VALUES
        ('Apologetics', 'Christian apologetics and defense of the faith', 'apologetics', '#dc2626', 'fas fa-shield-alt'),
        ('Theology', 'Biblical theology and doctrine', 'theology', '#7c3aed', 'fas fa-cross'),
        ('Bible Study', 'Bible studies and scriptural analysis', 'bible-study', '#059669', 'fas fa-book-open'),
        ('Devotional', 'Daily devotions and spiritual growth', 'devotional', '#ea580c', 'fas fa-heart'),
        ('History', 'Church history and historical resources', 'history', '#0891b2', 'fas fa-landmark'),
        ('Philosophy', 'Christian philosophy and worldview', 'philosophy', '#7c2d12', 'fas fa-lightbulb'),
        ('Resources', 'General Christian resources and tools', 'resources', '#4f46e5', 'fas fa-tools')
      `;
    }

    // Add category fields to existing articles and resources tables
    try {
      await sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id)`;
      await sql`ALTER TABLE resources ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id)`;
      console.log('Category columns added successfully');
    } catch (error) {
      // Columns might already exist, which is fine
      console.log('Category columns might already exist');
    }
    
    // Create comments table for articles and resources
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE NULL,
        resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE NULL,
        parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE NULL,
        status VARCHAR(50) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
        like_count INTEGER DEFAULT 0,
        pinned BOOLEAN DEFAULT false,
        edited BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT comments_content_check CHECK (
          (article_id IS NOT NULL AND resource_id IS NULL) OR
          (article_id IS NULL AND resource_id IS NOT NULL)
        )
      );
    `;

    // Add new columns to existing comments table if they don't exist
    try {
      await sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0`;
      await sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT false`;
      await sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS edited BOOLEAN DEFAULT false`;
    } catch (error) {
      console.log('Comment columns might already exist');
    }
    
    // Create comment_likes table for comment likes
    await sql`
      CREATE TABLE IF NOT EXISTS comment_likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, comment_id)
      )
    `;

    // Create likes table for articles and resources
    await sql`
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE NULL,
        resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT likes_content_check CHECK (
          (article_id IS NOT NULL AND resource_id IS NULL) OR
          (article_id IS NULL AND resource_id IS NOT NULL)
        )
      );
    `;
    
    // Add unique constraints for likes (user can only like once per item)
    try {
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_article_like ON likes(user_id, article_id) WHERE article_id IS NOT NULL`;
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_resource_like ON likes(user_id, resource_id) WHERE resource_id IS NOT NULL`;
    } catch (error) {
      console.log('Unique constraints might already exist for likes');
    }
    
    // Create comment_likes table for comment likes/dislikes  
    await sql`
      CREATE TABLE IF NOT EXISTS comment_likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        like_type VARCHAR(10) NOT NULL CHECK (like_type IN ('like', 'dislike')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Add unique constraint for comment likes (user can only like/dislike once per comment)
    try {
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_comment_like ON comment_likes(user_id, comment_id)`;
    } catch (error) {
      console.log('Unique constraint might already exist for comment_likes');
    }
    
    // Create page_views table for tracking article and resource views
    await sql`
      CREATE TABLE IF NOT EXISTS page_views (
        id SERIAL PRIMARY KEY,
        article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE NULL,
        resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT page_views_content_check CHECK (
          (article_id IS NOT NULL AND resource_id IS NULL) OR
          (article_id IS NULL AND resource_id IS NOT NULL)
        )
      );
    `;
    
    // Create activity_log table for recent activity tracking
    await sql`
      CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NULL,
        activity_type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        entity_type VARCHAR(50),
        entity_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Create user_login_history table
    await sql`
      CREATE TABLE IF NOT EXISTS user_login_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address INET,
        user_agent TEXT,
        success BOOLEAN DEFAULT TRUE,
        failure_reason TEXT NULL
      );
    `;
    
    // Create user_notifications table
    await sql`
      CREATE TABLE IF NOT EXISTS user_notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL
      );
    `;
    
    // Create indexes for better performance
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments(article_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_comments_resource_id ON comments(resource_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_comments_pinned ON comments(pinned)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_likes_article_id ON likes(article_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_likes_resource_id ON likes(resource_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_user_login_history_user_id ON user_login_history(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`;
    } catch (error) {
      console.log('Some indexes might already exist');
    }

    // Check if admin user exists, if not create it from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@faithdefenders.com';
    const adminCheck = await sql`SELECT id FROM users WHERE email = ${adminEmail}`;
    
    if (adminCheck.length === 0) {
      const adminName = process.env.ADMIN_NAME || 'Admin';
      const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
      
      // Hash the admin password
      const { hashPassword } = await import('./auth');
      const hashedPassword = await hashPassword(adminPassword);
      
      await sql`
        INSERT INTO users (email, name, password_hash, role, created_at, email_verified, auth_provider) 
        VALUES (
          ${adminEmail},
          ${adminName},
          ${hashedPassword},
          'admin',
          CURRENT_TIMESTAMP,
          true,
          'email'
        )
      `;
      console.log(`Admin user created with email: ${adminEmail}`);
    } else {
      console.log('Admin user already exists');
    }

    // Insert sample resources if they don't exist
    const resourcesCheck = await sql`SELECT COUNT(*) FROM resources`;
    if (parseInt(resourcesCheck[0].count) === 0) {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@faithdefenders.com';
      const adminUser = await sql`SELECT id FROM users WHERE email = ${adminEmail}`;
      const adminId = adminUser[0].id;

      // Insert sample resources with new fields
      await sql`
        INSERT INTO resources (title, description, url, resource_type, author_id, created_at, updated_at, is_uploaded_file, published)
        VALUES 
          ('Bible Gateway', 'Read the Bible online in multiple translations and languages. Includes study tools and devotionals.', 'https://www.biblegateway.com', 'link', ${adminId}, NOW(), NOW(), false, true),
          ('Mere Christianity by C.S. Lewis', 'A classic work of Christian apologetics, presenting rational arguments for the Christian faith.', 'https://www.amazon.com/Mere-Christianity-C-S-Lewis/dp/0060652926', 'book', ${adminId}, NOW(), NOW(), false, true),
          ('The Case for Christ by Lee Strobel', 'Investigative journalist examines the evidence for Jesus Christ using his legal and journalistic background.', 'https://www.amazon.com/Case-Christ-Journalists-Personal-Investigation/dp/0310209307', 'book', ${adminId}, NOW(), NOW(), false, true),
          ('Desiring God Podcast', 'John Piper and guests discuss Christian living, theology, and biblical truth.', 'https://www.desiringgod.org/ask-pastor-john', 'podcast', ${adminId}, NOW(), NOW(), false, true)
      `;
      console.log('Sample resources created in Neon PostgreSQL');
    }

    // Insert sample articles if they don't exist
    const articlesCheck = await sql`SELECT COUNT(*) FROM articles`;
    if (parseInt(articlesCheck[0].count) === 0) {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@faithdefenders.com';
      const adminUser = await sql`SELECT id FROM users WHERE email = ${adminEmail}`;
      const adminId = adminUser[0].id;

      await sql`
        INSERT INTO articles (title, content, excerpt, author_id, published, created_at, updated_at)
        VALUES 
          (
            'Welcome to Faith Defenders',
            'This is our first published article about defending the Christian faith. We welcome all believers to join our community and engage in meaningful discussions about apologetics, theology, and Christian living. Our mission is to provide resources and support for those seeking to understand and defend their faith in an increasingly secular world.',
            'Our first published article about defending the Christian faith',
            ${adminId},
            true,
            '2025-01-15',
            '2025-01-15'
          ),
          (
            'The Importance of Christian Apologetics',
            'Christian apologetics is the discipline of defending the Christian faith through systematic argumentation and discourse. In today''s world, it''s more important than ever for believers to be able to give reasons for their hope. This article explores the biblical foundation for apologetics and provides practical guidance for engaging with skeptics and seekers.',
            'Understanding why apologetics matters in today''s world',
            ${adminId},
            true,
            '2025-01-18',
            '2025-01-18'
          ),
          (
            'Building a Strong Prayer Life (Draft)',
            'Prayer is the foundation of Christian spiritual life. This comprehensive guide will help you develop a consistent and meaningful prayer practice. We will cover different types of prayer, how to overcome common obstacles, and practical tips for maintaining a vibrant prayer life even during busy seasons.',
            'A comprehensive guide to developing a meaningful prayer practice',
            ${adminId},
            false,
            '2025-01-20',
            '2025-01-20'
          )
      `;
      console.log('Sample articles created in Neon PostgreSQL');
    }

    // Create email verification table
    await sql`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(6) NOT NULL,
        purpose VARCHAR(50) NOT NULL CHECK (purpose IN ('registration', 'email_change', 'password_reset')),
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

    // Create index for faster lookups
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_email_verifications_otp ON email_verifications(otp_code)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_email_verifications_expires ON email_verifications(expires_at)`;
    } catch (error) {
      console.log('Email verification indexes might already exist');
    }

    console.log('Neon PostgreSQL database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
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
  
  // Only make specific admin emails an admin, not any first user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@faithdefenders.com';
  const isAdminEmail = email === 'admin@faithdefenders.com' || email === adminEmail;
  const userRole = isAdminEmail ? 'admin' : role;
  
  // Set defaults for OAuth data
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
    RETURNING id, email, name, role, google_id, avatar_url, auth_provider, email_verified, created_at
  `;

  return result[0];
}

export async function getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  await ensureInitialized();
  const sql = getDB();
  const result = await sql`SELECT * FROM users WHERE email = ${email}`;
  return result[0] || null;
}

export async function getUserById(id: number): Promise<User | null> {
  await ensureInitialized();
  const sql = getDB();
  const result = await sql`
    SELECT id, email, name, role, status, last_login, created_at, updated_at, 
           suspension_expires, suspension_reason, email_verified, auth_provider 
    FROM users WHERE id = ${id}
  `;
  return result[0] || null;
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
  return result;
}

export async function updateUserRole(id: number, role: string): Promise<User | null> {
  const sql = getDB();
  const result = await sql`
    UPDATE users 
    SET role = ${role}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING id, email, name, role, status, last_login, created_at, updated_at, suspension_expires, suspension_reason
  `;
  return result[0] || null;
}

export async function updateUserStatus(id: number, status: string, reason?: string, expiresAt?: Date): Promise<User | null> {
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
  return result[0] || null;
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
  return result[0] || null;
}

export async function recordUserLogin(userId: number, ipAddress?: string, userAgent?: string, success: boolean = true, failureReason?: string): Promise<void> {
  const sql = getDB();
  
  // Record login history
  await sql`
    INSERT INTO user_login_history (user_id, ip_address, user_agent, success, failure_reason)
    VALUES (${userId}, ${ipAddress || null}, ${userAgent || null}, ${success}, ${failureReason || null})
  `;
  
  // Update last_login for successful logins
  if (success) {
    await sql`
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `;
  }
}

export async function getUserLoginHistory(userId: number, limit: number = 10): Promise<UserLoginHistory[]> {
  const sql = getDB();
  
  const result = await sql`
    SELECT * FROM user_login_history
    WHERE user_id = ${userId}
    ORDER BY login_at DESC
    LIMIT ${limit}
  `;
  return result;
}

// Article functions
export async function createArticle(title: string, content: string, excerpt: string, authorId: number, categoryId?: number): Promise<Article> {
  const sql = getDB();
  
  const result = await sql`
    INSERT INTO articles (title, content, excerpt, author_id, category_id, published, created_at, updated_at)
    VALUES (${title}, ${content}, ${excerpt}, ${authorId}, ${categoryId || null}, false, NOW(), NOW())
    RETURNING *
  `;

  const article = result[0];
  
  // Get author name and category name
  const author = await getUserById(authorId);
  const category = categoryId ? await getCategoryById(categoryId) : null;
  
  return {
    ...article,
    author_name: author?.name,
    category_name: category?.name
  };
}

export async function getArticles(published: boolean = true): Promise<Article[]> {
  const sql = getDB();
  const result = await sql`
    SELECT a.*, u.name as author_name, c.name as category_name
    FROM articles a 
    LEFT JOIN users u ON a.author_id = u.id 
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.published = ${published}
    ORDER BY a.created_at DESC
  `;
  return result;
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
  return result;
}

export async function getArticleById(id: number): Promise<Article | null> {
  const sql = getDB();
  const result = await sql`
    SELECT a.*, u.name as author_name, c.name as category_name
    FROM articles a 
    LEFT JOIN users u ON a.author_id = u.id 
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.id = ${id}
  `;
  return result[0] || null;
}

export async function updateArticle(id: number, title: string, content: string, excerpt: string, published: boolean, categoryId?: number): Promise<Article | null> {
  const sql = getDB();
  const result = await sql`
    UPDATE articles 
    SET title = ${title}, content = ${content}, excerpt = ${excerpt}, published = ${published}, category_id = ${categoryId || null}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  if (result.length === 0) return null;

  const article = result[0];
  // Get author name and category name
  const author = await getUserById(article.author_id);
  const category = article.category_id ? await getCategoryById(article.category_id) : null;
  
  return {
    ...article,
    author_name: author?.name,
    category_name: category?.name
  };
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
  const sql = getDB();
  
  const result = await sql`
    INSERT INTO resources (
      title, description, url, resource_type, author_id, category_id,
      created_at, updated_at, file_path, file_name, file_size,
      extracted_content, content_preview, download_url, view_url,
      metadata, is_uploaded_file, published
    )
    VALUES (
      ${title}, ${description}, ${url}, ${resourceType}, ${authorId}, ${categoryId || null},
      NOW(), NOW(), ${options?.filePath || null}, ${options?.fileName || null}, ${options?.fileSize || null},
      ${options?.extractedContent || null}, ${options?.contentPreview || null}, 
      ${options?.downloadUrl || null}, ${options?.viewUrl || null},
      ${options?.metadata || null}, ${options?.isUploadedFile || false}, ${options?.published !== undefined ? options.published : true}
    )
    RETURNING *
  `;

  const resource = result[0];
  
  // Get author name and category name
  const author = await getUserById(authorId);
  const category = categoryId ? await getCategoryById(categoryId) : null;
  
  return {
    ...resource,
    author_name: author?.name,
    category_name: category?.name
  };
}

export async function getResources(published?: boolean): Promise<Resource[]> {
  const sql = getDB();
  let query = sql`
    SELECT r.*, u.name as author_name, c.name as category_name
    FROM resources r 
    LEFT JOIN users u ON r.author_id = u.id 
    LEFT JOIN categories c ON r.category_id = c.id
  `;
  
  if (published !== undefined) {
    query = sql`
      SELECT r.*, u.name as author_name, c.name as category_name
      FROM resources r 
      LEFT JOIN users u ON r.author_id = u.id 
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE r.published = ${published}
      ORDER BY r.created_at DESC
    `;
  } else {
    query = sql`
      SELECT r.*, u.name as author_name, c.name as category_name
      FROM resources r 
      LEFT JOIN users u ON r.author_id = u.id 
      LEFT JOIN categories c ON r.category_id = c.id
      ORDER BY r.created_at DESC
    `;
  }
  
  return query;
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
  return result[0] || null;
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
  const sql = getDB();
  const result = await sql`
    UPDATE resources 
    SET title = ${title}, description = ${description}, url = ${url}, 
        resource_type = ${resourceType}, category_id = ${categoryId || null}, updated_at = NOW(),
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

  const resource = result[0];
  // Get author name and category name
  const author = await getUserById(resource.author_id);
  const category = resource.category_id ? await getCategoryById(resource.category_id) : null;
  
  return {
    ...resource,
    author_name: author?.name,
    category_name: category?.name
  };
}

// Delete Functions
export async function deleteArticle(id: number): Promise<boolean> {
  await ensureInitialized();
  const sql = getDB();
  
  try {
    // First check if article exists
    const existsResult = await sql`
      SELECT id FROM articles WHERE id = ${id}
    `;
    
    if (existsResult.length === 0) {
      return false;
    }
    
    // Delete the article
    await sql`
      DELETE FROM articles WHERE id = ${id}
    `;
    
    return true;
  } catch (error) {
    console.error('Error deleting article:', error);
    return false;
  }
}

export async function deleteResource(id: number): Promise<boolean> {
  await ensureInitialized();
  const sql = getDB();
  
  try {
    // First check if resource exists
    const existsResult = await sql`
      SELECT id FROM resources WHERE id = ${id}
    `;
    
    if (existsResult.length === 0) {
      return false;
    }
    
    // Delete the resource
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
    // First check if user exists
    const existsResult = await sql`
      SELECT id FROM users WHERE id = ${id}
    `;
    
    if (existsResult.length === 0) {
      return false;
    }
    
    // Delete user's articles and resources (cascade)
    await sql`DELETE FROM articles WHERE author_id = ${id}`;
    await sql`DELETE FROM resources WHERE author_id = ${id}`;
    
    // Then delete the user
    await sql`
      DELETE FROM users WHERE id = ${id}
    `;
    
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}

// Analytics Functions
export async function getAnalyticsData() {
  const sql = getDB();
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  
  // Real user growth over the last 6 months
  const userGrowthData = await calculateRealUserGrowth(sql);
  
  // Real page views from database
  const totalViews = await getTotalPageViews();
  const viewsThisMonth = await getPageViewsThisMonth();
  const pageViewsData = await calculateRealPageViews(sql);
  
  // Real content stats
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
  
  // Real top articles (only if articles exist, no mock views)
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
    views: 0, // Real view tracking would go here
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
  
  // Get the last 6 months 
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
  
  // Get the last 6 months 
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
  
  // Estimate reading time based on content length (average 200 words per minute)
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

// Category functions
export async function getCategories(): Promise<Category[]> {
  await initializeDatabase();
  const sql = getDB();
  const result = await sql`
    SELECT * FROM categories 
    ORDER BY name ASC
  `;
  return result;
}

export async function getCategoryById(id: number): Promise<Category | null> {
  await initializeDatabase();
  const sql = getDB();
  const result = await sql`
    SELECT * FROM categories 
    WHERE id = ${id}
  `;
  return result[0] || null;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  await initializeDatabase();
  const sql = getDB();
  const result = await sql`
    SELECT * FROM categories 
    WHERE slug = ${slug}
  `;
  return result[0] || null;
}

export async function createCategory(
  name: string, 
  description: string, 
  slug: string, 
  color: string = '#3b82f6', 
  icon: string = 'fas fa-folder'
): Promise<Category> {
  await initializeDatabase();
  const sql = getDB();
  
  const result = await sql`
    INSERT INTO categories (name, description, slug, color, icon) 
    VALUES (${name}, ${description}, ${slug}, ${color}, ${icon})
    RETURNING *
  `;
  return result[0];
}

export async function updateCategory(
  id: number,
  name: string, 
  description: string, 
  slug: string, 
  color: string = '#3b82f6', 
  icon: string = 'fas fa-folder'
): Promise<Category | null> {
  await initializeDatabase();
  const sql = getDB();
  
  const result = await sql`
    UPDATE categories 
    SET name = ${name}, description = ${description}, slug = ${slug}, 
        color = ${color}, icon = ${icon}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return result[0] || null;
}

export async function deleteCategory(id: number): Promise<boolean> {
  await initializeDatabase();
  const sql = getDB();
  
  try {
    const result = await sql`
      DELETE FROM categories 
      WHERE id = ${id}
    `;
    return result.count > 0;
  } catch (error) {
    console.error('Error deleting category:', error);
    return false;
  }
}





// Like functions
export async function toggleLike(userId: number, articleId?: number, resourceId?: number): Promise<{ liked: boolean; count: number }> {
  const sql = getDB();
  
  // Check if like exists
  const existing = await sql`
    SELECT id FROM likes 
    WHERE user_id = ${userId} 
      AND (${articleId ? sql`article_id = ${articleId}` : sql`article_id IS NULL`})
      AND (${resourceId ? sql`resource_id = ${resourceId}` : sql`resource_id IS NULL`})
  `;
  
  if (existing.length > 0) {
    // Unlike
    await sql`DELETE FROM likes WHERE id = ${existing[0].id}`;
  } else {
    // Like
    await sql`
      INSERT INTO likes (user_id, article_id, resource_id)
      VALUES (${userId}, ${articleId || null}, ${resourceId || null})
    `;
  }
  
  // Get updated count
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
  const sql = getDB();
  
  const result = await sql`
    SELECT COUNT(*) as count FROM likes 
    WHERE (${articleId ? sql`article_id = ${articleId}` : sql`article_id IS NULL`})
      AND (${resourceId ? sql`resource_id = ${resourceId}` : sql`resource_id IS NULL`})
  `;
  
  return parseInt(result[0].count);
}

export async function getUserLikeStatus(userId: number, articleId?: number, resourceId?: number): Promise<boolean> {
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
  const sql = getDB();
  
  const result = await sql`
    INSERT INTO user_notifications (user_id, title, message, type, expires_at)
    VALUES (${userId}, ${title}, ${message}, ${type}, ${expiresAt || null})
    RETURNING *
  `;
  return result[0];
}

export async function getUserNotifications(userId: number, includeRead: boolean = false): Promise<UserNotification[]> {
  const sql = getDB();
  
  const result = await sql`
    SELECT * FROM user_notifications
    WHERE user_id = ${userId}
      ${includeRead ? sql`` : sql`AND read = FALSE`}
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    ORDER BY created_at DESC
  `;
  return result;
}

export async function markNotificationAsRead(id: number): Promise<boolean> {
  const sql = getDB();
  
  try {
    const result = await sql`
      UPDATE user_notifications 
      SET read = TRUE 
      WHERE id = ${id}
    `;
    return result.count > 0;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

export async function deleteNotification(id: number): Promise<boolean> {
  const sql = getDB();
  
  try {
    const result = await sql`DELETE FROM user_notifications WHERE id = ${id}`;
    return result.count > 0;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
}



// User Moderation Functions
export async function suspendUser(userId: number, days: number, reason: string): Promise<boolean> {
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
    
    // Create notification for the user
    await sql`
      INSERT INTO user_notifications (user_id, title, message, type)
      VALUES (
        ${userId},
        'Account Suspended',
        ${`Your account has been suspended for ${days} day(s). Reason: ${reason}`},
        'warning'
      )
    `;
    
    return result.count > 0;
  } catch (error) {
    console.error('Error suspending user:', error);
    return false;
  }
}

export async function banUser(userId: number, reason: string): Promise<boolean> {
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
    
    // Create notification for the user
    await sql`
      INSERT INTO user_notifications (user_id, title, message, type)
      VALUES (
        ${userId},
        'Account Banned',
        ${`Your account has been permanently banned. Reason: ${reason}`},
        'error'
      )
    `;
    
    return result.count > 0;
  } catch (error) {
    console.error('Error banning user:', error);
    return false;
  }
}

// Essential Comment System Functions
export async function createComment(
  content: string, 
  userId: number, 
  articleId?: number, 
  resourceId?: number, 
  parentId?: number
): Promise<Comment> {
  await ensureInitialized();
  const sql = getDB();
  
  // Limit content to 500 characters
  const trimmedContent = content.trim().substring(0, 500);
  
  // Get parent comment info for reply context
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
  
  // Get comment with user info
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
  };
}

export async function getComments(articleId?: number, resourceId?: number): Promise<Comment[]> {
  await ensureInitialized();
  const sql = getDB();
  
  const result = await sql`
    WITH RECURSIVE comment_tree AS (
      -- Base case: top-level comments
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
      
      -- Recursive case: replies
      SELECT 
        c.id, c.content, c.author_id as user_id, u.name as user_name,
        c.article_id, c.resource_id, c.parent_id, c.created_at, c.updated_at,
        ct.depth + 1,
        ct.path || c.created_at
      FROM comments c
      JOIN users u ON c.author_id = u.id
      JOIN comment_tree ct ON c.parent_id = ct.id
      WHERE ct.depth < 10  -- Limit nesting depth
    )
    SELECT 
      ct.*,
      pu.name as reply_to_user
    FROM comment_tree ct
    LEFT JOIN comments pc ON ct.parent_id = pc.id
    LEFT JOIN users pu ON pc.author_id = pu.id
    ORDER BY ct.path
  `;
  
  return result;
}

export async function deleteComment(commentId: number, userId: number): Promise<boolean> {
  await ensureInitialized();
  const sql = getDB();
  
  try {
    const result = await sql`
      DELETE FROM comments 
      WHERE id = ${commentId} AND author_id = ${userId}
    `;
    return result.count > 0;
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

// Email Verification Functions

export async function createEmailVerification(
  userId: number,
  email: string,
  purpose: 'registration' | 'email_change' | 'password_reset' = 'registration',
  ipAddress?: string,
  userAgent?: string
): Promise<EmailVerification> {
  await ensureInitialized();
  const sql = getDB();
  
  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set expiration time (15 minutes from now)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  
  // Delete any existing verification for this user and purpose
  await sql`
    DELETE FROM email_verifications 
    WHERE user_id = ${userId} AND purpose = ${purpose}
  `;
  
  const result = await sql`
    INSERT INTO email_verifications (
      user_id, email, otp_code, purpose, expires_at, ip_address, user_agent
    ) VALUES (
      ${userId}, ${email}, ${otpCode}, ${purpose}, ${expiresAt}, 
      ${ipAddress || null}, ${userAgent || null}
    )
    RETURNING *
  `;
  
  return result[0];
}

export async function verifyEmailOTP(
  userId: number,
  otpCode: string,
  purpose: 'registration' | 'email_change' | 'password_reset' = 'registration'
): Promise<{ success: boolean; message: string; verification?: EmailVerification }> {
  await ensureInitialized();
  const sql = getDB();
  
  // Get the verification record
  const verifications = await sql`
    SELECT * FROM email_verifications 
    WHERE user_id = ${userId} AND purpose = ${purpose} AND verified_at IS NULL
    ORDER BY created_at DESC LIMIT 1
  `;
  
  if (verifications.length === 0) {
    return { success: false, message: 'No verification found. Please request a new code.' };
  }
  
  const verification = verifications[0];
  
  // Check if expired
  if (new Date() > new Date(verification.expires_at)) {
    return { success: false, message: 'Verification code has expired. Please request a new code.' };
  }
  
  // Check attempt limit
  if (verification.attempts >= verification.max_attempts) {
    return { success: false, message: 'Too many failed attempts. Please request a new code.' };
  }
  
  // Check OTP code
  if (verification.otp_code !== otpCode) {
    // Increment attempts
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
  
  // Success - mark as verified
  const updatedResult = await sql`
    UPDATE email_verifications 
    SET verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${verification.id}
    RETURNING *
  `;
  
  // Update user email verification status if this was registration
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
    verification: updatedResult[0] 
  };
}

export async function getEmailVerification(
  userId: number,
  purpose: 'registration' | 'email_change' | 'password_reset' = 'registration'
): Promise<EmailVerification | null> {
  await ensureInitialized();
  const sql = getDB();
  
  const result = await sql`
    SELECT * FROM email_verifications 
    WHERE user_id = ${userId} AND purpose = ${purpose} AND verified_at IS NULL
    ORDER BY created_at DESC LIMIT 1
  `;
  
  return result[0] || null;
}

export async function deleteEmailVerification(
  userId: number,
  purpose: 'registration' | 'email_change' | 'password_reset' = 'registration'
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