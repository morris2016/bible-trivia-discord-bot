// Mock database implementation for testing
// In production, replace with Cloudflare D1 or Workers-compatible database

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

// In-memory storage (for demonstration purposes)
let users: (User & { password_hash: string })[] = [];
let articles: Article[] = [];
let resources: Resource[] = [];
let nextUserId = 1;
let nextArticleId = 1;
let nextResourceId = 1;

// Initialize with some sample data
export async function initializeDatabase() {
  console.log('Initializing mock database...');
  
  // Add admin user from environment variables
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@faithdefenders.com';
  const adminName = process.env.ADMIN_NAME || 'Admin';
  // Note: In production, use proper password hashing from environment
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || '$2b$12$LyqXRi/3ydfFM/A7urZUQOZjO3bKWIFGd3cicUMx9Pc5S9OYAFMd6';
  
  users.push({
    id: 1,
    email: adminEmail,
    name: adminName,
    password_hash: adminPasswordHash,
    role: 'admin',
    created_at: new Date('2025-01-01')
  });
  
  console.log('Admin user created successfully');

  // Add some sample articles for testing
  articles.push({
    id: 1,
    title: 'Welcome to Faith Defenders',
    content: 'This is our first published article about defending the Christian faith. We welcome all believers to join our community and engage in meaningful discussions about apologetics, theology, and Christian living. Our mission is to provide resources and support for those seeking to understand and defend their faith in an increasingly secular world.',
    excerpt: 'Our first published article about defending the Christian faith',
    author_id: 1,
    author_name: 'Admin',
    published: true,
    created_at: new Date('2025-01-15'),
    updated_at: new Date('2025-01-15')
  }, {
    id: 2,
    title: 'The Importance of Christian Apologetics',
    content: 'Christian apologetics is the discipline of defending the Christian faith through systematic argumentation and discourse. In today\'s world, it\'s more important than ever for believers to be able to give reasons for their hope. This article explores the biblical foundation for apologetics and provides practical guidance for engaging with skeptics and seekers.',
    excerpt: 'Understanding why apologetics matters in today\'s world',
    author_id: 1,
    author_name: 'Admin',
    published: true,
    created_at: new Date('2025-01-18'),
    updated_at: new Date('2025-01-18')
  }, {
    id: 3,
    title: 'Building a Strong Prayer Life (Draft)',
    content: 'Prayer is the foundation of Christian spiritual life. This comprehensive guide will help you develop a consistent and meaningful prayer practice. We will cover different types of prayer, how to overcome common obstacles, and practical tips for maintaining a vibrant prayer life even during busy seasons.',
    excerpt: 'A comprehensive guide to developing a meaningful prayer practice',
    author_id: 1,
    author_name: 'Admin',
    published: false,
    created_at: new Date('2025-01-20'),
    updated_at: new Date('2025-01-20')
  });

  nextArticleId = articles.length + 1;

  // Add sample resources
  resources.push({
    id: 1,
    title: 'Bible Gateway',
    description: 'Read the Bible online in multiple translations and languages. Includes study tools and devotionals.',
    url: 'https://www.biblegateway.com',
    resource_type: 'website',
    author_id: 1,
    author_name: 'Admin',
    created_at: new Date('2025-01-15')
  }, {
    id: 2,
    title: 'Mere Christianity by C.S. Lewis',
    description: 'A classic work of Christian apologetics, presenting rational arguments for the Christian faith.',
    url: 'https://www.amazon.com/Mere-Christianity-C-S-Lewis/dp/0060652926',
    resource_type: 'book',
    author_id: 1,
    author_name: 'Admin',
    created_at: new Date('2025-01-16')
  }, {
    id: 3,
    title: 'The Case for Christ by Lee Strobel',
    description: 'Investigative journalist examines the evidence for Jesus Christ using his legal and journalistic background.',
    url: 'https://www.amazon.com/Case-Christ-Journalists-Personal-Investigation/dp/0310209307',
    resource_type: 'book',
    author_id: 1,
    author_name: 'Admin',
    created_at: new Date('2025-01-17')
  }, {
    id: 4,
    title: 'Desiring God Podcast',
    description: 'John Piper and guests discuss Christian living, theology, and biblical truth.',
    url: 'https://www.desiringgod.org/ask-pastor-john',
    resource_type: 'podcast',
    author_id: 1,
    author_name: 'Admin',
    created_at: new Date('2025-01-18')
  });

  nextUserId = users.length + 1;
  nextArticleId = articles.length + 1;
  nextResourceId = resources.length + 1;
  
  console.log('Mock database initialized with admin user and sample resources');
  console.log('Articles collection is empty - ready for real user content!');
}

// User functions
export async function createUser(email: string, name: string, passwordHash: string, role: string = 'user'): Promise<User> {
  // Only make specific admin emails an admin, not any first user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@faithdefenders.com';
  const isAdminEmail = email === 'admin@faithdefenders.com' || email === adminEmail;
  const userRole = isAdminEmail ? 'admin' : role;
  
  const user = {
    id: nextUserId++,
    email,
    name,
    password_hash: passwordHash,
    role: userRole,
    created_at: new Date()
  };
  users.push(user);
  
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  return users.find(u => u.email === email) || null;
}

export async function getUserById(id: number): Promise<User | null> {
  const user = users.find(u => u.id === id);
  if (!user) return null;
  
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function updateUserRole(id: number, role: string): Promise<User | null> {
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) return null;
  
  users[userIndex].role = role;
  const { password_hash, ...userWithoutPassword } = users[userIndex];
  return userWithoutPassword;
}

export async function getAllUsers(): Promise<User[]> {
  return users.map(u => {
    const { password_hash, ...userWithoutPassword } = u;
    return userWithoutPassword;
  }).sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
}

// Article functions
export async function createArticle(title: string, content: string, excerpt: string, authorId: number): Promise<Article> {
  const author = await getUserById(authorId);
  const article = {
    id: nextArticleId++,
    title,
    content,
    excerpt,
    author_id: authorId,
    author_name: author?.name,
    published: false,
    created_at: new Date(),
    updated_at: new Date()
  };
  articles.push(article);
  return article;
}

export async function getArticles(published: boolean = true): Promise<Article[]> {
  return articles
    .filter(a => a.published === published)
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
}

// Get ALL articles regardless of published status (for admin panel)
export async function getAllArticles(): Promise<Article[]> {
  return articles
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
}

export async function getArticleById(id: number): Promise<Article | null> {
  return articles.find(a => a.id === id) || null;
}

export async function updateArticle(id: number, title: string, content: string, excerpt: string, published: boolean): Promise<Article | null> {
  const articleIndex = articles.findIndex(a => a.id === id);
  if (articleIndex === -1) return null;
  
  articles[articleIndex] = {
    ...articles[articleIndex],
    title,
    content,
    excerpt,
    published,
    updated_at: new Date()
  };
  
  return articles[articleIndex];
}

// Resource functions
export async function createResource(title: string, description: string, url: string, resourceType: string, authorId: number): Promise<Resource> {
  const author = await getUserById(authorId);
  const resource = {
    id: nextResourceId++,
    title,
    description,
    url,
    resource_type: resourceType,
    author_id: authorId,
    author_name: author?.name,
    created_at: new Date()
  };
  resources.push(resource);
  return resource;
}

export async function getResources(): Promise<Resource[]> {
  return resources.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
}

export async function getResourceById(id: number): Promise<Resource | null> {
  return resources.find(r => r.id === id) || null;
}

// Analytics Functions
export async function getAnalyticsData() {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  
  // Real user growth over the last 6 months
  const userGrowthData = calculateRealUserGrowth();
  
  // Real page views (no mock data - would be 0 initially)
  const pageViewsData = calculateRealPageViews();
  
  // Real content stats
  const publishedArticles = articles.filter(a => a.published);
  const totalResources = resources.length;
  const newUsersThisMonth = users.filter(u => u.created_at >= lastMonth).length;
  const newArticlesThisMonth = publishedArticles.filter(a => a.created_at >= lastMonth).length;
  const newResourcesThisMonth = resources.filter(r => r.created_at >= lastMonth).length;
  
  // Real top articles (only if articles exist, no mock views)
  const topArticles = publishedArticles.length > 0 
    ? publishedArticles
        .map(article => ({
          id: article.id,
          title: article.title,
          views: 0, // Real view tracking would go here
          author: article.author_name || 'Unknown'
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5)
    : [];
  
  return {
    pageViews: pageViewsData,
    topArticles,
    userGrowth: userGrowthData,
    contentStats: {
      totalUsers: users.length,
      newUsersThisMonth,
      publishedArticles: publishedArticles.length,
      totalArticles: articles.length,
      newArticlesThisMonth,
      totalResources,
      newResourcesThisMonth,
      averageReadTime: calculateAverageReadTime(publishedArticles),
      contentEngagement: publishedArticles.length > 0 ? Math.floor((publishedArticles.length / Math.max(1, articles.length)) * 100) : 0
    }
  };
}

function calculateRealUserGrowth() {
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
    
    const usersInMonth = users.filter(u => {
      const userDate = new Date(u.created_at);
      return userDate >= monthStart && userDate <= monthEnd;
    }).length;
    
    data.push(usersInMonth);
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

function calculateAverageReadTime(articles: Article[]): string {
  if (articles.length === 0) return '0:00';
  
  // Estimate reading time based on content length (average 200 words per minute)
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

// Remove the mock calculateContentEngagement function since we moved the logic inline