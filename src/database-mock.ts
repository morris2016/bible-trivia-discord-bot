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
  
  // Add sample user
  users.push({
    id: 1,
    email: 'admin@faithdefenders.com',
    name: 'Faith Admin',
    password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewmBH.FzxJi6OOP6', // password: admin123
    role: 'admin',
    created_at: new Date()
  });

  // Add sample articles
  articles.push({
    id: 1,
    title: 'Welcome to Faith Defenders',
    content: `Faith Defenders is a community dedicated to defending and sharing the Christian faith. Our mission is to provide resources, articles, and a supportive community for believers to grow in their faith and learn to defend it against challenges.

In this digital age, faith is often challenged by various ideologies and worldviews. It's more important than ever for Christians to be equipped with knowledge, understanding, and the ability to articulate their beliefs clearly and lovingly.

Through our articles and resources, we aim to help believers understand the depth and beauty of Christian doctrine, learn apologetics, and develop a stronger relationship with God.

Join us on this journey of faith, learning, and spiritual growth. Together, we can strengthen our faith and help others discover the truth of the Gospel.`,
    excerpt: 'Welcome to Faith Defenders - a community dedicated to defending and sharing the Christian faith through resources, articles, and fellowship.',
    author_id: 1,
    author_name: 'Faith Admin',
    published: true,
    created_at: new Date('2025-01-15'),
    updated_at: new Date('2025-01-15')
  }, {
    id: 2,
    title: 'The Importance of Christian Apologetics',
    content: `Christian apologetics is the discipline of defending the faith through reasoned arguments and evidence. The word "apologetics" comes from the Greek word "apologia," which means "to give a defense."

In 1 Peter 3:15, we are commanded to "always be prepared to give an answer to everyone who asks you to give the reason for the hope that you have." This verse is the foundation of Christian apologetics.

Why is apologetics important?

1. It strengthens our own faith by providing intellectual grounding
2. It helps us share the Gospel more effectively
3. It removes intellectual barriers that prevent people from considering Christianity
4. It demonstrates that faith and reason are compatible

Some key areas of apologetics include:
- The existence of God
- The reliability of Scripture
- The historical evidence for Jesus
- The problem of evil and suffering
- The uniqueness of Christianity

By studying apologetics, we become better equipped to defend our faith with gentleness and respect.`,
    excerpt: 'Learn about the importance of Christian apologetics in defending and sharing your faith through reasoned arguments and evidence.',
    author_id: 1,
    author_name: 'Faith Admin',
    published: true,
    created_at: new Date('2025-01-20'),
    updated_at: new Date('2025-01-20')
  }, {
    id: 3,
    title: 'Building a Strong Prayer Life',
    content: `Prayer is the cornerstone of Christian life - it's our direct communication with God. Developing a strong prayer life is essential for spiritual growth and maintaining a close relationship with our Heavenly Father.

Here are some practical steps to strengthen your prayer life:

1. **Set aside dedicated time**: Choose a specific time each day for prayer. Many find early morning or evening works best.

2. **Find a quiet place**: Jesus often withdrew to lonely places to pray (Luke 5:16). Find a space where you can focus without distractions.

3. **Use Scripture**: Let God's Word guide your prayers. Pray through Psalms or use biblical promises as foundations for your requests.

4. **Keep a prayer journal**: Write down your prayers, requests, and God's answers. This helps you see how God works in your life.

5. **Pray with others**: Join prayer groups or pray with family members. Corporate prayer has special power (Matthew 18:20).

6. **Be persistent**: Don't give up when prayers seem unanswered. Continue to seek God's will and timing.

Remember, prayer is not just about asking for things - it's about relationship, worship, confession, and listening to God.`,
    excerpt: 'Discover practical steps to build a strong prayer life and deepen your relationship with God through consistent communication.',
    author_id: 1,
    author_name: 'Faith Admin',
    published: true,
    created_at: new Date('2025-01-25'),
    updated_at: new Date('2025-01-25')
  });

  // Add sample resources
  resources.push({
    id: 1,
    title: 'Bible Gateway',
    description: 'Read the Bible online in multiple translations and languages. Includes study tools and devotionals.',
    url: 'https://www.biblegateway.com',
    resource_type: 'website',
    author_id: 1,
    author_name: 'Faith Admin',
    created_at: new Date('2025-01-15')
  }, {
    id: 2,
    title: 'Mere Christianity by C.S. Lewis',
    description: 'A classic work of Christian apologetics, presenting rational arguments for the Christian faith.',
    url: 'https://www.amazon.com/Mere-Christianity-C-S-Lewis/dp/0060652926',
    resource_type: 'book',
    author_id: 1,
    author_name: 'Faith Admin',
    created_at: new Date('2025-01-16')
  }, {
    id: 3,
    title: 'The Case for Christ by Lee Strobel',
    description: 'Investigative journalist examines the evidence for Jesus Christ using his legal and journalistic background.',
    url: 'https://www.amazon.com/Case-Christ-Journalists-Personal-Investigation/dp/0310209307',
    resource_type: 'book',
    author_id: 1,
    author_name: 'Faith Admin',
    created_at: new Date('2025-01-17')
  }, {
    id: 4,
    title: 'Desiring God Podcast',
    description: 'John Piper and guests discuss Christian living, theology, and biblical truth.',
    url: 'https://www.desiringgod.org/ask-pastor-john',
    resource_type: 'podcast',
    author_id: 1,
    author_name: 'Faith Admin',
    created_at: new Date('2025-01-18')
  });

  nextUserId = users.length + 1;
  nextArticleId = articles.length + 1;
  nextResourceId = resources.length + 1;
  
  console.log('Mock database initialized with sample data');
}

// User functions
export async function createUser(email: string, name: string, passwordHash: string, role: string = 'user'): Promise<User> {
  const user = {
    id: nextUserId++,
    email,
    name,
    password_hash: passwordHash,
    role,
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