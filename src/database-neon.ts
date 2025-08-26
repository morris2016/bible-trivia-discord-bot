// Neon PostgreSQL database implementation for Cloudflare Workers
import { neon } from '@neondatabase/serverless';

// Interfaces (keeping the same as mock for compatibility)
export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at: Date;
}

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

export interface Resource {
  id: number;
  title: string;
  description?: string;
  url?: string;
  resource_type: string;
  author_id: number;
  author_name?: string;
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

// Database initialization flag
let isInitialized = false;

// Get database connection
function getDB() {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || 
    'postgres://neondb_owner:npg_bCSE8mA2YjgT@ep-weathered-mode-adqdxv9w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';
  
  return neon(databaseUrl);
}

// Lazy initialization - call this before any database operation
async function ensureInitialized() {
  if (!isInitialized) {
    await initializeDatabase();
    isInitialized = true;
  }
}

// Initialize database tables
export async function initializeDatabase() {
  console.log('Initializing Neon PostgreSQL database...');
  
  const sql = getDB();
  
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

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

    // Check if admin user exists, if not create it
    const adminCheck = await sql`SELECT id FROM users WHERE email = 'siagmoo26@gmail.com'`;
    
    if (adminCheck.length === 0) {
      // Insert admin user with pre-generated hash for Famous2016?
      await sql`
        INSERT INTO users (email, name, password_hash, role, created_at) 
        VALUES (
          'siagmoo26@gmail.com',
          'Admin',
          '$2b$12$LyqXRi/3ydfFM/A7urZUQOZjO3bKWIFGd3cicUMx9Pc5S9OYAFMd6',
          'admin',
          '2025-01-01'
        )
      `;
      console.log('Admin user created in Neon PostgreSQL');
    } else {
      console.log('Admin user already exists in Neon PostgreSQL');
    }

    // Insert sample resources if they don't exist
    const resourcesCheck = await sql`SELECT COUNT(*) FROM resources`;
    if (parseInt(resourcesCheck[0].count) === 0) {
      const adminUser = await sql`SELECT id FROM users WHERE email = 'siagmoo26@gmail.com'`;
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
      const adminUser = await sql`SELECT id FROM users WHERE email = 'siagmoo26@gmail.com'`;
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

    console.log('Neon PostgreSQL database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// User functions
export async function createUser(email: string, name: string, passwordHash: string, role: string = 'user'): Promise<User> {
  await ensureInitialized();
  const sql = getDB();
  
  // Only make specific admin emails an admin, not any first user
  const isAdminEmail = email === 'admin@faithdefenders.com' || email === 'siagmoo26@gmail.com';
  const userRole = isAdminEmail ? 'admin' : role;
  
  const result = await sql`
    INSERT INTO users (email, name, password_hash, role, created_at)
    VALUES (${email}, ${name}, ${passwordHash}, ${userRole}, NOW())
    RETURNING id, email, name, role, created_at
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
  const result = await sql`SELECT id, email, name, role, created_at FROM users WHERE id = ${id}`;
  return result[0] || null;
}

export async function getAllUsers(): Promise<User[]> {
  const sql = getDB();
  const result = await sql`SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC`;
  return result;
}

export async function updateUserRole(id: number, role: string): Promise<User | null> {
  const sql = getDB();
  const result = await sql`
    UPDATE users SET role = ${role} WHERE id = ${id}
    RETURNING id, email, name, role, created_at
  `;
  return result[0] || null;
}

// Article functions
export async function createArticle(title: string, content: string, excerpt: string, authorId: number): Promise<Article> {
  const sql = getDB();
  
  const result = await sql`
    INSERT INTO articles (title, content, excerpt, author_id, published, created_at, updated_at)
    VALUES (${title}, ${content}, ${excerpt}, ${authorId}, false, NOW(), NOW())
    RETURNING *
  `;

  const article = result[0];
  
  // Get author name
  const author = await getUserById(authorId);
  return {
    ...article,
    author_name: author?.name
  };
}

export async function getArticles(published: boolean = true): Promise<Article[]> {
  const sql = getDB();
  const result = await sql`
    SELECT a.*, u.name as author_name 
    FROM articles a 
    LEFT JOIN users u ON a.author_id = u.id 
    WHERE a.published = ${published}
    ORDER BY a.created_at DESC
  `;
  return result;
}

export async function getAllArticles(): Promise<Article[]> {
  await ensureInitialized();
  const sql = getDB();
  const result = await sql`
    SELECT a.*, u.name as author_name 
    FROM articles a 
    LEFT JOIN users u ON a.author_id = u.id 
    ORDER BY a.created_at DESC
  `;
  return result;
}

export async function getArticleById(id: number): Promise<Article | null> {
  const sql = getDB();
  const result = await sql`
    SELECT a.*, u.name as author_name 
    FROM articles a 
    LEFT JOIN users u ON a.author_id = u.id 
    WHERE a.id = ${id}
  `;
  return result[0] || null;
}

export async function updateArticle(id: number, title: string, content: string, excerpt: string, published: boolean): Promise<Article | null> {
  const sql = getDB();
  const result = await sql`
    UPDATE articles 
    SET title = ${title}, content = ${content}, excerpt = ${excerpt}, published = ${published}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  if (result.length === 0) return null;

  const article = result[0];
  // Get author name
  const author = await getUserById(article.author_id);
  return {
    ...article,
    author_name: author?.name
  };
}

// Resource functions
export async function createResource(
  title: string, 
  description: string, 
  url: string, 
  resourceType: string, 
  authorId: number,
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
      title, description, url, resource_type, author_id, 
      created_at, updated_at, file_path, file_name, file_size,
      extracted_content, content_preview, download_url, view_url,
      metadata, is_uploaded_file, published
    )
    VALUES (
      ${title}, ${description}, ${url}, ${resourceType}, ${authorId}, 
      NOW(), NOW(), ${options?.filePath || null}, ${options?.fileName || null}, ${options?.fileSize || null},
      ${options?.extractedContent || null}, ${options?.contentPreview || null}, 
      ${options?.downloadUrl || null}, ${options?.viewUrl || null},
      ${options?.metadata || null}, ${options?.isUploadedFile || false}, ${options?.published !== undefined ? options.published : true}
    )
    RETURNING *
  `;

  const resource = result[0];
  
  // Get author name
  const author = await getUserById(authorId);
  return {
    ...resource,
    author_name: author?.name
  };
}

export async function getResources(published?: boolean): Promise<Resource[]> {
  const sql = getDB();
  let query = sql`
    SELECT r.*, u.name as author_name 
    FROM resources r 
    LEFT JOIN users u ON r.author_id = u.id 
  `;
  
  if (published !== undefined) {
    query = sql`
      SELECT r.*, u.name as author_name 
      FROM resources r 
      LEFT JOIN users u ON r.author_id = u.id 
      WHERE r.published = ${published}
      ORDER BY r.created_at DESC
    `;
  } else {
    query = sql`
      SELECT r.*, u.name as author_name 
      FROM resources r 
      LEFT JOIN users u ON r.author_id = u.id 
      ORDER BY r.created_at DESC
    `;
  }
  
  return query;
}

export async function getResourceById(id: number): Promise<Resource | null> {
  await ensureInitialized();
  const sql = getDB();
  const result = await sql`
    SELECT r.*, u.name as author_name 
    FROM resources r 
    LEFT JOIN users u ON r.author_id = u.id 
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
        resource_type = ${resourceType}, updated_at = NOW(),
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
  // Get author name
  const author = await getUserById(resource.author_id);
  return {
    ...resource,
    author_name: author?.name
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
  
  // Real page views (no mock data - would be 0 initially)
  const pageViewsData = calculateRealPageViews();
  
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
      averageReadTime: await calculateAverageReadTime(sql, publishedArticles),
      contentEngagement: publishedArticles > 0 ? Math.floor((publishedArticles / Math.max(1, totalArticles)) * 100) : 0
    }
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

function calculateRealPageViews() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  // Real page views would be tracked in production - starting with zeros
  const data = months.map(() => 0);
  
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