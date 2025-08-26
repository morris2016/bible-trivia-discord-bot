import { Pool } from 'pg';

// Database connection
let pool: Pool | null = null;

export function getPool(env?: any): Pool {
  if (!pool) {
    // Try multiple sources for connection string
    let connectionString = '';
    
    if (env?.DATABASE_URL) {
      connectionString = env.DATABASE_URL;
    } else if (env?.POSTGRES_URL) {
      connectionString = env.POSTGRES_URL;
    } else if (typeof process !== 'undefined' && process.env) {
      connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
    }
    
    // Fallback to hardcoded for development (remove in production)
    if (!connectionString) {
      connectionString = 'postgres://neondb_owner:npg_bCSE8mA2YjgT@ep-weathered-mode-adqdxv9w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';
    }
    
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false // Required for Neon
      },
      max: 10, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

// Database schema initialization
export async function initializeDatabase(env?: any) {
  const client = getPool(env);
  
  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create articles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        published BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create resources table
    await client.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        url VARCHAR(500),
        resource_type VARCHAR(100) DEFAULT 'link',
        author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sessions table for authentication
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_resources_author ON resources(author_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// User management functions
export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at: Date;
}

export async function createUser(email: string, name: string, passwordHash: string, role: string = 'user'): Promise<User> {
  const client = getPool();
  const result = await client.query(
    'INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
    [email, name, passwordHash, role]
  );
  return result.rows[0];
}

export async function getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  const client = getPool();
  const result = await client.query(
    'SELECT id, email, name, password_hash, role, created_at FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

export async function getUserById(id: number): Promise<User | null> {
  const client = getPool();
  const result = await client.query(
    'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

// Article management functions
export interface Article {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  author_id: number;
  author_name?: string;
  published: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function createArticle(title: string, content: string, excerpt: string, authorId: number): Promise<Article> {
  const client = getPool();
  const result = await client.query(
    `INSERT INTO articles (title, content, excerpt, author_id) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, title, content, excerpt, author_id, published, created_at, updated_at`,
    [title, content, excerpt, authorId]
  );
  return result.rows[0];
}

export async function getArticles(published: boolean = true): Promise<Article[]> {
  const client = getPool();
  const result = await client.query(
    `SELECT a.id, a.title, a.content, a.excerpt, a.author_id, u.name as author_name, 
            a.published, a.created_at, a.updated_at 
     FROM articles a 
     LEFT JOIN users u ON a.author_id = u.id 
     WHERE a.published = $1 
     ORDER BY a.created_at DESC`,
    [published]
  );
  return result.rows;
}

export async function getArticleById(id: number): Promise<Article | null> {
  const client = getPool();
  const result = await client.query(
    `SELECT a.id, a.title, a.content, a.excerpt, a.author_id, u.name as author_name, 
            a.published, a.created_at, a.updated_at 
     FROM articles a 
     LEFT JOIN users u ON a.author_id = u.id 
     WHERE a.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function updateArticle(id: number, title: string, content: string, excerpt: string, published: boolean): Promise<Article | null> {
  const client = getPool();
  const result = await client.query(
    `UPDATE articles 
     SET title = $1, content = $2, excerpt = $3, published = $4, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $5 
     RETURNING id, title, content, excerpt, author_id, published, created_at, updated_at`,
    [title, content, excerpt, published, id]
  );
  return result.rows[0] || null;
}

// Resource management functions
export interface Resource {
  id: number;
  title: string;
  description?: string;
  url?: string;
  resource_type: string;
  author_id: number;
  author_name?: string;
  created_at: Date;
}

export async function createResource(title: string, description: string, url: string, resourceType: string, authorId: number): Promise<Resource> {
  const client = getPool();
  const result = await client.query(
    `INSERT INTO resources (title, description, url, resource_type, author_id) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING id, title, description, url, resource_type, author_id, created_at`,
    [title, description, url, resourceType, authorId]
  );
  return result.rows[0];
}

export async function getResources(): Promise<Resource[]> {
  const client = getPool();
  const result = await client.query(
    `SELECT r.id, r.title, r.description, r.url, r.resource_type, r.author_id, 
            u.name as author_name, r.created_at 
     FROM resources r 
     LEFT JOIN users u ON r.author_id = u.id 
     ORDER BY r.created_at DESC`
  );
  return result.rows;
}

export async function getResourceById(id: number): Promise<Resource | null> {
  const client = getPool();
  const result = await client.query(
    `SELECT r.id, r.title, r.description, r.url, r.resource_type, r.author_id, 
            u.name as author_name, r.created_at 
     FROM resources r 
     LEFT JOIN users u ON r.author_id = u.id 
     WHERE r.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}