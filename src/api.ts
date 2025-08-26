import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { registerUser, loginUser, authMiddleware, setAuthCookie, clearAuthCookie, getLoggedInUser } from './auth';
import { 
  getArticles, 
  getArticleById, 
  createArticle, 
  updateArticle,
  getResources,
  getResourceById,
  createResource,
  User 
} from './database-mock';

const api = new Hono();

// Enable CORS for API routes
api.use('*', cors({
  origin: ['http://localhost:3000', 'https://*.pages.dev', 'https://*.e2b.dev'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Health check
api.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication Routes
api.post('/auth/register', async (c) => {
  try {
    const { email, name, password } = await c.req.json();
    const user = await registerUser(email, name, password);
    
    // Set HTTP-only cookie
    if (user.token) {
      setAuthCookie(c, user.token);
    }

    // Don't send token in response body for security
    const { token, ...userResponse } = user;
    return c.json({
      success: true,
      message: 'User registered successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed'
    }, 400);
  }
});

api.post('/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    const user = await loginUser(email, password);
    
    // Set HTTP-only cookie
    if (user.token) {
      setAuthCookie(c, user.token);
    }

    // Don't send token in response body for security
    const { token, ...userResponse } = user;
    return c.json({
      success: true,
      message: 'Login successful',
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Login failed'
    }, 401);
  }
});

api.post('/auth/logout', async (c) => {
  clearAuthCookie(c);
  return c.json({
    success: true,
    message: 'Logout successful'
  });
});

api.get('/auth/me', async (c) => {
  const user = await getLoggedInUser(c);
  
  if (!user) {
    return c.json({ error: 'Not authenticated' }, 401);
  }

  return c.json({
    success: true,
    user: user
  });
});

// Articles Routes
api.get('/articles', async (c) => {
  try {
    const articles = await getArticles(true); // Only published articles
    return c.json({
      success: true,
      articles: articles
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch articles'
    }, 500);
  }
});

api.get('/articles/:id', async (c) => {
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
    console.error('Error fetching article:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch article'
    }, 500);
  }
});

api.post('/articles', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const { title, content, excerpt } = await c.req.json();
    
    if (!title || !content) {
      return c.json({
        success: false,
        error: 'Title and content are required'
      }, 400);
    }

    const article = await createArticle(title, content, excerpt || '', user.id);
    
    return c.json({
      success: true,
      message: 'Article created successfully',
      article: article
    });
  } catch (error) {
    console.error('Error creating article:', error);
    return c.json({
      success: false,
      error: 'Failed to create article'
    }, 500);
  }
});

api.put('/articles/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const id = parseInt(c.req.param('id'));
    const { title, content, excerpt, published } = await c.req.json();
    
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid article ID' }, 400);
    }

    // Check if article exists and user owns it (or is admin)
    const existingArticle = await getArticleById(id);
    if (!existingArticle) {
      return c.json({ success: false, error: 'Article not found' }, 404);
    }

    if (existingArticle.author_id !== user.id && user.role !== 'admin') {
      return c.json({ success: false, error: 'Permission denied' }, 403);
    }

    const updatedArticle = await updateArticle(id, title, content, excerpt || '', published || false);
    
    return c.json({
      success: true,
      message: 'Article updated successfully',
      article: updatedArticle
    });
  } catch (error) {
    console.error('Error updating article:', error);
    return c.json({
      success: false,
      error: 'Failed to update article'
    }, 500);
  }
});

// Resources Routes
api.get('/resources', async (c) => {
  try {
    const resources = await getResources();
    return c.json({
      success: true,
      resources: resources
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch resources'
    }, 500);
  }
});

api.get('/resources/:id', async (c) => {
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
    console.error('Error fetching resource:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch resource'
    }, 500);
  }
});

api.post('/resources', authMiddleware, async (c) => {
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
    console.error('Error creating resource:', error);
    return c.json({
      success: false,
      error: 'Failed to create resource'
    }, 500);
  }
});

export default api;