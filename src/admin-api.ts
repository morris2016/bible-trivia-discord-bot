import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware, adminMiddleware, getLoggedInUser } from './auth';
import { 
  getArticles as getAllArticles, 
  getArticleById, 
  createArticle, 
  updateArticle,
  getResources as getAllResources,
  getResourceById,
  createResource,
  User,
  Article,
  Resource
} from './database-mock';

const adminApi = new Hono();

// Enable CORS for admin API routes
adminApi.use('*', cors({
  origin: ['http://localhost:3000', 'https://*.pages.dev', 'https://*.e2b.dev'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Admin authentication middleware - require admin role
adminApi.use('*', authMiddleware);
adminApi.use('*', adminMiddleware);

// Dashboard Statistics
adminApi.get('/stats', async (c) => {
  try {
    const allArticles = await getAllArticles(false); // Get all articles (published and unpublished)
    const publishedArticles = await getAllArticles(true); // Get only published articles
    const resources = await getAllResources();
    
    // Mock user stats (in real implementation, get from database)
    const totalUsers = 15; // Replace with actual user count
    const newUsersThisMonth = 3; // Replace with actual new user count
    
    // Calculate article stats
    const draftArticles = allArticles.length - publishedArticles.length;
    
    // Mock engagement stats (in real implementation, calculate from analytics)
    const totalViews = 1250;
    const viewsThisMonth = 320;
    
    return c.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth,
          growth: '+15%'
        },
        articles: {
          total: allArticles.length,
          published: publishedArticles.length,
          drafts: draftArticles,
          publishedThisMonth: publishedArticles.filter(a => {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return new Date(a.created_at) > monthAgo;
          }).length
        },
        resources: {
          total: resources.length,
          newThisMonth: resources.filter(r => {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return new Date(r.created_at) > monthAgo;
          }).length
        },
        engagement: {
          totalViews: totalViews,
          viewsThisMonth: viewsThisMonth,
          avgViewsPerArticle: Math.round(totalViews / publishedArticles.length) || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch statistics'
    }, 500);
  }
});

// Articles Management
adminApi.get('/articles', async (c) => {
  try {
    const articles = await getAllArticles(false); // Get all articles including drafts
    return c.json({
      success: true,
      articles: articles
    });
  } catch (error) {
    console.error('Error fetching admin articles:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch articles'
    }, 500);
  }
});

adminApi.get('/articles/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid article ID' }, 400);
    }

    const article = await getArticleById(id);
    if (!article) {
      return c.json({ success: false, error: 'Article not found' }, 404);
    }

    return c.json({
      success: true,
      article: article
    });
  } catch (error) {
    console.error('Error fetching admin article:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch article'
    }, 500);
  }
});

adminApi.post('/articles', async (c) => {
  try {
    const user = c.get('user') as User;
    const { title, content, excerpt, published = false } = await c.req.json();
    
    if (!title || !content) {
      return c.json({
        success: false,
        error: 'Title and content are required'
      }, 400);
    }

    const article = await createArticle(title, content, excerpt || '', user.id);
    
    // Update published status if specified
    if (published !== article.published) {
      await updateArticle(article.id, title, content, excerpt || '', published);
    }
    
    return c.json({
      success: true,
      message: 'Article created successfully',
      article: article
    });
  } catch (error) {
    console.error('Error creating admin article:', error);
    return c.json({
      success: false,
      error: 'Failed to create article'
    }, 500);
  }
});

adminApi.put('/articles/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const { title, content, excerpt, published } = await c.req.json();
    
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid article ID' }, 400);
    }

    const updatedArticle = await updateArticle(id, title, content, excerpt || '', published || false);
    
    if (!updatedArticle) {
      return c.json({ success: false, error: 'Article not found' }, 404);
    }
    
    return c.json({
      success: true,
      message: 'Article updated successfully',
      article: updatedArticle
    });
  } catch (error) {
    console.error('Error updating admin article:', error);
    return c.json({
      success: false,
      error: 'Failed to update article'
    }, 500);
  }
});

// Resources Management
adminApi.get('/resources', async (c) => {
  try {
    const resources = await getAllResources();
    return c.json({
      success: true,
      resources: resources
    });
  } catch (error) {
    console.error('Error fetching admin resources:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch resources'
    }, 500);
  }
});

adminApi.get('/resources/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid resource ID' }, 400);
    }

    const resource = await getResourceById(id);
    if (!resource) {
      return c.json({ success: false, error: 'Resource not found' }, 404);
    }

    return c.json({
      success: true,
      resource: resource
    });
  } catch (error) {
    console.error('Error fetching admin resource:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch resource'
    }, 500);
  }
});

adminApi.post('/resources', async (c) => {
  try {
    const user = c.get('user') as User;
    const { title, description, url, resource_type } = await c.req.json();
    
    if (!title) {
      return c.json({
        success: false,
        error: 'Title is required'
      }, 400);
    }

    const resource = await createResource(
      title, 
      description || '', 
      url || '', 
      resource_type || 'link', 
      user.id
    );
    
    return c.json({
      success: true,
      message: 'Resource created successfully',
      resource: resource
    });
  } catch (error) {
    console.error('Error creating admin resource:', error);
    return c.json({
      success: false,
      error: 'Failed to create resource'
    }, 500);
  }
});

// Mock Users Management (in real implementation, use actual database)
adminApi.get('/users', async (c) => {
  try {
    // Mock users data (in real implementation, fetch from database)
    const users = [
      {
        id: 1,
        name: 'Faith Admin',
        email: 'admin@faithdefenders.com',
        role: 'admin',
        created_at: '2025-01-15T00:00:00Z',
        last_login: '2025-08-26T08:00:00Z',
        status: 'active',
        articles_count: 3,
        resources_count: 4
      },
      {
        id: 2,
        name: 'John Believer',
        email: 'john@example.com',
        role: 'user',
        created_at: '2025-01-20T00:00:00Z',
        last_login: '2025-08-25T15:30:00Z',
        status: 'active',
        articles_count: 1,
        resources_count: 2
      },
      {
        id: 3,
        name: 'Sarah Faith',
        email: 'sarah@example.com',
        role: 'user',
        created_at: '2025-01-25T00:00:00Z',
        last_login: '2025-08-20T10:15:00Z',
        status: 'active',
        articles_count: 0,
        resources_count: 1
      }
    ];
    
    return c.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch users'
    }, 500);
  }
});

// Update user role/status
adminApi.put('/users/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const { role, status } = await c.req.json();
    
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid user ID' }, 400);
    }
    
    // Mock update (in real implementation, update database)
    return c.json({
      success: true,
      message: 'User updated successfully',
      user: { id, role, status }
    });
  } catch (error) {
    console.error('Error updating admin user:', error);
    return c.json({
      success: false,
      error: 'Failed to update user'
    }, 500);
  }
});

// Analytics endpoint
adminApi.get('/analytics', async (c) => {
  try {
    // Mock analytics data (in real implementation, calculate from actual data)
    const analytics = {
      pageViews: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        data: [120, 190, 300, 500, 200, 300]
      },
      topArticles: [
        { title: 'Welcome to Faith Defenders', views: 450, id: 1 },
        { title: 'The Importance of Christian Apologetics', views: 320, id: 2 },
        { title: 'Building a Strong Prayer Life', views: 280, id: 3 }
      ],
      userGrowth: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        data: [5, 8, 12, 15]
      },
      contentStats: {
        articlesPublished: 12,
        resourcesAdded: 8,
        commentsReceived: 24,
        averageReadTime: '4:30'
      }
    };
    
    return c.json({
      success: true,
      analytics: analytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch analytics'
    }, 500);
  }
});

export default adminApi;