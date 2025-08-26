// Real PostgreSQL database implementation for Neon
import { Client } from 'pg';

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
}

// Database connection
let client: Client | null = null;

async function getClient(): Promise<Client> {
  if (!client) {
    client = new Client({
      connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    await client.connect();
    console.log('Connected to Neon PostgreSQL database');
  }
  return client;
}

// Initialize database tables
export async function initializeDatabase() {
  console.log('Initializing PostgreSQL database...');
  
  const client = await getClient();
  
  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create articles table
    await client.query(`
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
    `);

    // Create resources table
    await client.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        url TEXT,
        resource_type VARCHAR(100) NOT NULL,
        author_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check if admin user exists, if not create it
    const adminCheck = await client.query('SELECT id FROM users WHERE email = $1', ['siagmoo26@gmail.com']);
    
    if (adminCheck.rows.length === 0) {
      // Insert admin user with pre-generated hash for Famous2016?
      await client.query(`
        INSERT INTO users (email, name, password_hash, role, created_at) 
        VALUES ($1, $2, $3, $4, $5)
      `, [
        'siagmoo26@gmail.com',
        'Admin',
        '$2b$12$LyqXRi/3ydfFM/A7urZUQOZjO3bKWIFGd3cicUMx9Pc5S9OYAFMd6',
        'admin',
        new Date('2025-01-01')
      ]);
      console.log('Admin user created in PostgreSQL');
    } else {
      console.log('Admin user already exists in PostgreSQL');
    }

    // Insert sample resources if they don't exist
    const resourcesCheck = await client.query('SELECT COUNT(*) FROM resources');
    if (parseInt(resourcesCheck.rows[0].count) === 0) {
      const adminUser = await client.query('SELECT id FROM users WHERE email = $1', ['siagmoo26@gmail.com']);
      const adminId = adminUser.rows[0].id;

      const sampleResources = [
        ['Bible Gateway', 'Read the Bible online in multiple translations and languages. Includes study tools and devotionals.', 'https://www.biblegateway.com', 'website'],
        ['Mere Christianity by C.S. Lewis', 'A classic work of Christian apologetics, presenting rational arguments for the Christian faith.', 'https://www.amazon.com/Mere-Christianity-C-S-Lewis/dp/0060652926', 'book'],
        ['The Case for Christ by Lee Strobel', 'Investigative journalist examines the evidence for Jesus Christ using his legal and journalistic background.', 'https://www.amazon.com/Case-Christ-Journalists-Personal-Investigation/dp/0310209307', 'book'],
        ['Desiring God Podcast', 'John Piper and guests discuss Christian living, theology, and biblical truth.', 'https://www.desiringgod.org/ask-pastor-john', 'podcast']
      ];

      for (const [title, description, url, type] of sampleResources) {
        await client.query(`
          INSERT INTO resources (title, description, url, resource_type, author_id, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [title, description, url, type, adminId, new Date()]);
      }
      console.log('Sample resources created in PostgreSQL');
    }

    console.log('PostgreSQL database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// User functions
export async function createUser(email: string, name: string, passwordHash: string, role: string = 'user'): Promise<User> {
  const client = await getClient();
  
  // Only make specific admin emails an admin, not any first user
  const isAdminEmail = email === 'admin@faithdefenders.com' || email === 'siagmoo26@gmail.com';
  const userRole = isAdminEmail ? 'admin' : role;
  
  const result = await client.query(`
    INSERT INTO users (email, name, password_hash, role, created_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, email, name, role, created_at
  `, [email, name, passwordHash, userRole, new Date()]);

  return result.rows[0];
}

export async function getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  const client = await getClient();
  const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

export async function getUserById(id: number): Promise<User | null> {
  const client = await getClient();
  const result = await client.query('SELECT id, email, name, role, created_at FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getAllUsers(): Promise<User[]> {
  const client = await getClient();
  const result = await client.query('SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC');
  return result.rows;
}

export async function updateUserRole(id: number, role: string): Promise<User | null> {
  const client = await getClient();
  const result = await client.query(`
    UPDATE users SET role = $1 WHERE id = $2
    RETURNING id, email, name, role, created_at
  `, [role, id]);
  return result.rows[0] || null;
}

// Article functions
export async function createArticle(title: string, content: string, excerpt: string, authorId: number): Promise<Article> {
  const client = await getClient();
  
  const result = await client.query(`
    INSERT INTO articles (title, content, excerpt, author_id, published, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $6)
    RETURNING *
  `, [title, content, excerpt, authorId, false, new Date()]);

  const article = result.rows[0];
  
  // Get author name
  const author = await getUserById(authorId);
  return {
    ...article,
    author_name: author?.name
  };
}

export async function getArticles(published: boolean = true): Promise<Article[]> {
  const client = await getClient();
  const result = await client.query(`
    SELECT a.*, u.name as author_name 
    FROM articles a 
    LEFT JOIN users u ON a.author_id = u.id 
    WHERE a.published = $1 
    ORDER BY a.created_at DESC
  `, [published]);
  return result.rows;
}

export async function getAllArticles(): Promise<Article[]> {
  const client = await getClient();
  const result = await client.query(`
    SELECT a.*, u.name as author_name 
    FROM articles a 
    LEFT JOIN users u ON a.author_id = u.id 
    ORDER BY a.created_at DESC
  `);
  return result.rows;
}

export async function getArticleById(id: number): Promise<Article | null> {
  const client = await getClient();
  const result = await client.query(`
    SELECT a.*, u.name as author_name 
    FROM articles a 
    LEFT JOIN users u ON a.author_id = u.id 
    WHERE a.id = $1
  `, [id]);
  return result.rows[0] || null;
}

export async function updateArticle(id: number, title: string, content: string, excerpt: string, published: boolean): Promise<Article | null> {
  const client = await getClient();
  const result = await client.query(`
    UPDATE articles 
    SET title = $1, content = $2, excerpt = $3, published = $4, updated_at = $5
    WHERE id = $6
    RETURNING *
  `, [title, content, excerpt, published, new Date(), id]);

  if (result.rows.length === 0) return null;

  const article = result.rows[0];
  // Get author name
  const author = await getUserById(article.author_id);
  return {
    ...article,
    author_name: author?.name
  };
}

// Resource functions
export async function createResource(title: string, description: string, url: string, resourceType: string, authorId: number): Promise<Resource> {
  const client = await getClient();
  
  const result = await client.query(`
    INSERT INTO resources (title, description, url, resource_type, author_id, created_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [title, description, url, resourceType, authorId, new Date()]);

  const resource = result.rows[0];
  
  // Get author name
  const author = await getUserById(authorId);
  return {
    ...resource,
    author_name: author?.name
  };
}

export async function getResources(): Promise<Resource[]> {
  const client = await getClient();
  const result = await client.query(`
    SELECT r.*, u.name as author_name 
    FROM resources r 
    LEFT JOIN users u ON r.author_id = u.id 
    ORDER BY r.created_at DESC
  `);
  return result.rows;
}

export async function getResourceById(id: number): Promise<Resource | null> {
  const client = await getClient();
  const result = await client.query(`
    SELECT r.*, u.name as author_name 
    FROM resources r 
    LEFT JOIN users u ON r.author_id = u.id 
    WHERE r.id = $1
  `, [id]);
  return result.rows[0] || null;
}

// Analytics Functions
export async function getAnalyticsData() {
  const client = await getClient();
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  
  // Real user growth over the last 6 months
  const userGrowthData = await calculateRealUserGrowth(client);
  
  // Real page views (no mock data - would be 0 initially)
  const pageViewsData = calculateRealPageViews();
  
  // Real content stats
  const publishedArticlesResult = await client.query('SELECT COUNT(*) FROM articles WHERE published = true');
  const totalArticlesResult = await client.query('SELECT COUNT(*) FROM articles');
  const totalResourcesResult = await client.query('SELECT COUNT(*) FROM resources');
  const totalUsersResult = await client.query('SELECT COUNT(*) FROM users');
  const newUsersThisMonthResult = await client.query('SELECT COUNT(*) FROM users WHERE created_at >= $1', [lastMonth]);
  const newArticlesThisMonthResult = await client.query('SELECT COUNT(*) FROM articles WHERE published = true AND created_at >= $1', [lastMonth]);
  const newResourcesThisMonthResult = await client.query('SELECT COUNT(*) FROM resources WHERE created_at >= $1', [lastMonth]);

  const publishedArticles = parseInt(publishedArticlesResult.rows[0].count);
  const totalArticles = parseInt(totalArticlesResult.rows[0].count);
  const totalResources = parseInt(totalResourcesResult.rows[0].count);
  const totalUsers = parseInt(totalUsersResult.rows[0].count);
  const newUsersThisMonth = parseInt(newUsersThisMonthResult.rows[0].count);
  const newArticlesThisMonth = parseInt(newArticlesThisMonthResult.rows[0].count);
  const newResourcesThisMonth = parseInt(newResourcesThisMonthResult.rows[0].count);
  
  // Real top articles (only if articles exist, no mock views)
  const topArticlesResult = await client.query(`
    SELECT a.id, a.title, u.name as author_name 
    FROM articles a 
    LEFT JOIN users u ON a.author_id = u.id 
    WHERE a.published = true 
    ORDER BY a.created_at DESC 
    LIMIT 5
  `);
  
  const topArticles = topArticlesResult.rows.map(article => ({
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
      averageReadTime: await calculateAverageReadTime(client, publishedArticles),
      contentEngagement: publishedArticles > 0 ? Math.floor((publishedArticles / Math.max(1, totalArticles)) * 100) : 0
    }
  };
}

async function calculateRealUserGrowth(client: Client) {
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
    
    const result = await client.query(
      'SELECT COUNT(*) FROM users WHERE created_at >= $1 AND created_at <= $2',
      [monthStart, monthEnd]
    );
    
    data.push(parseInt(result.rows[0].count));
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

async function calculateAverageReadTime(client: Client, publishedCount: number): Promise<string> {
  if (publishedCount === 0) return '0:00';
  
  // Estimate reading time based on content length (average 200 words per minute)
  const result = await client.query('SELECT content FROM articles WHERE published = true');
  const articles = result.rows;
  
  if (articles.length === 0) return '0:00';
  
  const totalMinutes = articles.reduce((total, article) => {
    const wordCount = article.content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    return total + readingTime;
  }, 0);
  
  const averageMinutes = Math.floor(totalMinutes / articles.length);
  const minutes = Math.floor(averageMinutes);
  const seconds = Math.floor((averageMinutes - minutes) * 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}