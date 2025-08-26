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
  updateResource,
  deleteResource,
  getCategories,
  User 
} from './database-neon';

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
    const { title, description, url, resource_type, published } = await c.req.json();
    
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
      user.id,
      {
        published: published !== undefined ? published : true,
        isUploadedFile: false
      }
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

// Enhanced file upload endpoint for resources
api.post('/resources/upload', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const body = await c.req.formData();
    
    const title = body.get('title') as string;
    const description = body.get('description') as string || '';
    const resourceType = body.get('resource_type') as string || 'book';
    const published = body.get('published') === 'true';
    const file = body.get('file') as File;
    
    if (!title) {
      return c.json({
        success: false,
        error: 'Title is required'
      }, 400);
    }

    if (!file) {
      return c.json({
        success: false,
        error: 'File is required'
      }, 400);
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'audio/mpeg', 'audio/wav', 'audio/mp3'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({
        success: false,
        error: 'Only PDF and audio files are allowed'
      }, 400);
    }

    // For now, we'll create a placeholder. In production, you'd upload to R2 or similar
    const fileName = file.name;
    const fileSize = file.size;
    const filePath = `/uploads/${Date.now()}-${fileName}`;
    
    // For PDFs, we would extract text content here
    let extractedContent = '';
    let contentPreview = '';
    let metadata = '{}';
    
    if (file.type === 'application/pdf') {
      // TODO: Implement PDF text extraction
      contentPreview = `${description.substring(0, 200)}...`;
      metadata = JSON.stringify({
        fileType: 'pdf',
        pages: 'unknown',
        hasImages: false,
        colorProfile: 'unknown'
      });
    } else if (file.type.startsWith('audio/')) {
      contentPreview = `Audio file: ${fileName}`;
      metadata = JSON.stringify({
        fileType: 'audio',
        duration: 'unknown',
        format: file.type.split('/')[1]
      });
    }

    const resource = await createResource(
      title,
      description,
      '', // No external URL for uploaded files
      resourceType,
      user.id,
      {
        filePath,
        fileName,
        fileSize,
        extractedContent,
        contentPreview,
        downloadUrl: filePath,
        viewUrl: resourceType === 'book' ? `/resources/${title.toLowerCase().replace(/\s+/g, '-')}/view` : null,
        metadata,
        isUploadedFile: true,
        published
      }
    );
    
    return c.json({
      success: true,
      message: 'File uploaded successfully',
      resource: resource
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return c.json({
      success: false,
      error: 'Failed to upload file'
    }, 500);
  }
});

// Update resource endpoint
api.put('/resources/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const id = parseInt(c.req.param('id'));
    const { title, description, url, resource_type, published } = await c.req.json();
    
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid resource ID' }, 400);
    }

    // Check if resource exists and user owns it (or is admin)
    const existingResource = await getResourceById(id);
    if (!existingResource) {
      return c.json({ success: false, error: 'Resource not found' }, 404);
    }

    if (existingResource.author_id !== user.id && user.role !== 'admin') {
      return c.json({ success: false, error: 'Permission denied' }, 403);
    }

    const updatedResource = await updateResource(
      id, 
      title, 
      description || '', 
      url || '', 
      resource_type || 'link',
      {
        published: published !== undefined ? published : true
      }
    );
    
    return c.json({
      success: true,
      message: 'Resource updated successfully',
      resource: updatedResource
    });
  } catch (error) {
    console.error('Error updating resource:', error);
    return c.json({
      success: false,
      error: 'Failed to update resource'
    }, 500);
  }
});

// Delete resource endpoint
api.delete('/resources/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid resource ID' }, 400);
    }

    // Check if resource exists and user owns it (or is admin)
    const existingResource = await getResourceById(id);
    if (!existingResource) {
      return c.json({ success: false, error: 'Resource not found' }, 404);
    }

    if (existingResource.author_id !== user.id && user.role !== 'admin') {
      return c.json({ success: false, error: 'Permission denied' }, 403);
    }

    const success = await deleteResource(id);
    
    if (success) {
      return c.json({
        success: true,
        message: 'Resource deleted successfully'
      });
    } else {
      return c.json({
        success: false,
        error: 'Failed to delete resource'
      }, 500);
    }
  } catch (error) {
    console.error('Error deleting resource:', error);
    return c.json({
      success: false,
      error: 'Failed to delete resource'
    }, 500);
  }
});

// Categories Routes (Public endpoint for frontend filtering)
api.get('/categories', async (c) => {
  try {
    const categories = await getCategories();
    return c.json({
      success: true,
      categories: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch categories'
    }, 500);
  }
});

export default api;