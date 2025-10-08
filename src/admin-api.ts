import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware, adminMiddleware, adminOnlyMiddleware, getLoggedInUser } from './auth';
import {
  getArticles,
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  getResources as getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getAnalyticsData,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getSiteSettings,
  updateSiteSetting,
  getDB,
  User,
  Article,
  Resource,
  Category
} from './database-neon';

// Import superadmin protection functions from postgres database
import { isSuperAdmin, isSuperAdminEmail } from './database-postgres';
import { uploadFileToR2, validateFile, generateFileMetadata, deleteFileFromR2 } from './file-storage';
import {
  rateLimitMiddleware,
  securityHeadersMiddleware,
  inputValidationMiddleware,
  validateFileUpload,
  logSecurityEvent,
  apiKeyValidationMiddleware
} from './security-middleware';
import adminMessagingApi from './admin-messaging-api';
import { Resend } from 'resend';

// Initialize Resend with API key from environment
function getResend(env?: any): Resend | null {
  const apiKey = env?.RESEND_API_KEY || process.env.RESEND_API_KEY;

  console.log('Resend API Key Debug:', {
    hasEnv: !!env,
    envKeys: env ? Object.keys(env) : [],
    hasApiKeyInEnv: !!env?.RESEND_API_KEY,
    hasApiKeyInProcess: !!process.env.RESEND_API_KEY,
    apiKeyLength: apiKey ? apiKey.length : 0,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'none'
  });

  if (!apiKey) {
    console.warn('RESEND_API_KEY not found. Please configure Resend API key for email functionality.');
    return null;
  }

  return new Resend(apiKey);
}

// Admin verification email template
const adminVerificationTemplate = (adminName: string, targetUserName: string, newRole: string, verificationToken: string) => ({
  subject: '🛡️ Admin Role Change Verification - Faith Defenders',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 25%, #a78bfa 50%, #c4b5fd 75%, #7c3aed 100%); padding: 20px; border-radius: 10px;">
      <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2d1b2d; margin: 0; font-size: 28px;">🛡️ Faith Defenders</h1>
          <p style="color: #666; margin: 5px 0;">Admin Role Change Verification</p>
        </div>

        <h2 style="color: #2d1b2d; margin-bottom: 20px;">Hello ${adminName},</h2>

        <p style="color: #333; line-height: 1.6; margin-bottom: 25px;">
          You have requested to change the role of user <strong>${targetUserName}</strong> to <strong>${newRole}</strong>.
          This is a critical security action that requires your verification.
        </p>

        <div style="background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0;">
          <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your verification token:</p>
          <div style="font-size: 32px; font-weight: bold; color: #7c3aed; letter-spacing: 3px; font-family: monospace; word-break: break-all;">
            ${verificationToken}
          </div>
          <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">This token expires in 15 minutes</p>
        </div>

        <div style="background: #fefce8; border: 1px solid #fde047; border-radius: 6px; padding: 15px; margin: 25px 0;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            <strong>⚠️ Security Notice:</strong> This action will ${newRole === 'admin' ? 'grant administrative privileges' : newRole === 'moderator' ? 'grant moderation privileges' : 'revoke elevated privileges'} for user ${targetUserName}.
            Please ensure this change is authorized and necessary.
          </p>
        </div>

        <p style="color: #333; line-height: 1.6; margin-bottom: 25px;">
          To complete this role change, please enter the verification token above in the admin panel.
          If you did not request this change, please contact security immediately.
        </p>

        <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
          <p style="color: #666; font-size: 14px; margin: 0;">
            This is an automated security notification from Faith Defenders.
          </p>
          <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
            Need help? Contact security at hakunamatataministry@gmail.com
          </p>
        </div>
      </div>
    </div>
  `,
  text: `
    Admin Role Change Verification - Faith Defenders

    Hello ${adminName},

    You have requested to change the role of user ${targetUserName} to ${newRole}.
    This is a critical security action that requires your verification.

    Your verification token: ${verificationToken}

    This token expires in 15 minutes.

    SECURITY NOTICE: This action will ${newRole === 'admin' ? 'grant administrative privileges' : newRole === 'moderator' ? 'grant moderation privileges' : 'revoke elevated privileges'} for user ${targetUserName}.

    To complete this role change, please enter the verification token above in the admin panel.
    If you did not request this change, please contact security immediately.

    This is an automated security notification from Faith Defenders.
    Need help? Contact security at hakunamatataministry@gmail.com
  `
});

// Send admin verification email using Resend
async function sendAdminVerificationEmail(
  adminEmail: string,
  adminName: string,
  targetUserName: string,
  newRole: string,
  verificationToken: string,
  env?: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const resend = getResend(env);

    if (!resend) {
      // Fallback to console logging if no API key (development mode)
      console.log('📧 ADMIN VERIFICATION EMAIL (Development Mode):');
      console.log('To:', adminEmail);
      console.log('Admin Name:', adminName);
      console.log('Target User:', targetUserName);
      console.log('New Role:', newRole);
      console.log('Verification Token:', verificationToken);
      console.log('Subject:', adminVerificationTemplate(adminName, targetUserName, newRole, verificationToken).subject);

      return {
        success: true,
        messageId: `dev-${Date.now()}`,
        error: 'Development mode - email logged to console'
      };
    }

    const template = adminVerificationTemplate(adminName, targetUserName, newRole, verificationToken);
    const fromEmail = env?.FROM_EMAIL || process.env.FROM_EMAIL || 'Faith Defenders <security@faithdefenders.com>';

    console.log('Attempting to send admin verification email via Resend:', {
      from: fromEmail,
      to: adminEmail,
      subject: template.subject
    });

    const result = await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: template.subject,
      text: template.text,
      html: template.html
    });

    console.log('Resend API result:', result);

    if (result.error) {
      console.error('Resend API error:', result.error);
      return {
        success: false,
        error: `Email service error: ${result.error.message || JSON.stringify(result.error)}`
      };
    }

    console.log('Admin verification email sent successfully via Resend:', result.data?.id);
    return { success: true, messageId: result.data?.id };

  } catch (error) {
    console.error('Error sending admin verification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error'
    };
  }
}

const adminApi = new Hono();

// Security middleware for admin routes - more restrictive rate limiting
adminApi.use('*', rateLimitMiddleware({ maxRequests: 50, windowMs: 15 * 60 * 1000 })); // 50 requests per 15 minutes
adminApi.use('*', securityHeadersMiddleware());
adminApi.use('*', inputValidationMiddleware({ excludePaths: ['/api/auth/login', '/api/auth/register', '/api/auth/verify-email', '/api/auth/resend-verification', '/api/auth/request-password-reset', '/api/auth/reset-password', '/security/dashboard', '/security/events', '/security/alerts', '/security/threats'] }));

// Enable CORS for admin API routes
adminApi.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'https://*.pages.dev', 'https://*.e2b.dev'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-API-Key'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// CSRF protection temporarily disabled for admin API
// TODO: Implement proper CSRF token generation and synchronization
// adminApi.use('*', (c, next) => {
//   const method = c.req.method.toLowerCase();
//   if (['post', 'put', 'delete', 'patch'].includes(method)) {
//     return csrfProtectionMiddleware()(c, next);
//   }
//   return next();
// });

// Admin authentication middleware - require admin role
adminApi.use('*', authMiddleware);
adminApi.use('*', adminMiddleware);

// Dashboard Statistics (Admin Only)
adminApi.get('/stats', adminOnlyMiddleware, async (c) => {
  try {
    const allArticles = await getAllArticles(); // Get all articles (published and unpublished)
    const publishedArticles = await getArticles(true); // Get only published articles
    const resources = await getAllResources();
    const allUsers = await getAllUsers();
    
    // Real user stats
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const newUsersThisMonth = allUsers.filter(u => u.created_at >= lastMonth).length;
    
    // Calculate article stats
    const draftArticles = allArticles.length - publishedArticles.length;
    
    // Real engagement stats (0 since no tracking yet)
    const totalViews = 0; // No real view tracking implemented yet
    const viewsThisMonth = 0;
    
    return c.json({
      success: true,
      stats: {
        users: {
          total: allUsers.length,
          newThisMonth: newUsersThisMonth,
          growth: newUsersThisMonth > 0 ? `+${newUsersThisMonth} this month` : 'No new users'
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

// Articles Management with Search and Filter
adminApi.get('/articles', async (c) => {
  try {
    const user = (c as any).get('user') as User;
    const allArticles = await getAllArticles(); // Get all articles including drafts

    // Get query parameters for search and filter
    const search = c.req.query('search') || '';
    const status = c.req.query('status') || 'all'; // 'all', 'published', 'draft'
    const category = c.req.query('category') || 'all';
    const author = c.req.query('author') || 'all'; // 'all' or author ID
    const sortBy = c.req.query('sortBy') || 'created_at'; // 'created_at', 'title', 'author'
    const sortOrder = c.req.query('sortOrder') || 'desc'; // 'asc', 'desc'
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');

    // Filter articles based on user role
    let articles;
    if (user.role === 'admin') {
      // Admins see all articles
      articles = allArticles;
    } else if (user.role === 'moderator') {
      // Moderators only see their own articles
      articles = allArticles.filter(article => article.author_id === user.id);
    } else {
      // Should not happen due to middleware, but safety check
      return c.json({ success: false, error: 'Unauthorized' }, 403);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      articles = articles.filter(article =>
        article.title.toLowerCase().includes(searchLower) ||
        article.excerpt?.toLowerCase().includes(searchLower) ||
        article.content?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (status !== 'all') {
      articles = articles.filter(article =>
        status === 'published' ? article.published : !article.published
      );
    }

    // Apply category filter
    if (category !== 'all') {
      const categoryId = parseInt(category);
      if (!isNaN(categoryId)) {
        articles = articles.filter(article => article.category_id === categoryId);
      }
    }

    // Apply author filter
    if (author !== 'all') {
      const authorId = parseInt(author);
      if (!isNaN(authorId)) {
        articles = articles.filter(article => article.author_id === authorId);
      }
    }

    // Apply sorting
    articles.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'author':
          aValue = a.author_name?.toLowerCase() || '';
          bValue = b.author_name?.toLowerCase() || '';
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Apply pagination
    const totalArticles = articles.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedArticles = articles.slice(startIndex, endIndex);

    return c.json({
      success: true,
      articles: paginatedArticles,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalArticles / limit),
        totalArticles: totalArticles,
        hasNext: endIndex < totalArticles,
        hasPrev: page > 1
      },
      filters: {
        search: search,
        status: status,
        category: category,
        author: author,
        sortBy: sortBy,
        sortOrder: sortOrder
      }
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
    const user = (c as any).get('user') as User;
    const { title, content, excerpt, published = false, category_id } = await c.req.json();
    
    if (!title || !content) {
      return c.json({
        success: false,
        error: 'Title and content are required'
      }, 400);
    }

    const categoryId = category_id ? parseInt(category_id) : undefined;
    const article = await createArticle(title, content, excerpt || '', user.id, categoryId);
    
    // Update published status if specified
    if (published !== article.published) {
      await updateArticle(article.id, title, content, excerpt || '', published, categoryId);
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
    const user = (c as any).get('user') as User;
    const id = parseInt(c.req.param('id'));
    const { title, content, excerpt, published, category_id } = await c.req.json();

    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid article ID' }, 400);
    }

    // First get the existing article to check ownership
    const existingArticle = await getArticleById(id);
    if (!existingArticle) {
      return c.json({ success: false, error: 'Article not found' }, 404);
    }

    // Check ownership for moderators
    if (user.role === 'moderator' && existingArticle.author_id !== user.id) {
      return c.json({ success: false, error: 'You can only edit your own articles' }, 403);
    }

    const categoryId = category_id ? parseInt(category_id) : undefined;
    const updatedArticle = await updateArticle(id, title, content, excerpt || '', published || false, categoryId);

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

adminApi.delete('/articles/:id', async (c) => {
  try {
    const user = (c as any).get('user') as User;
    const id = parseInt(c.req.param('id'));

    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid article ID' }, 400);
    }

    // First get the existing article to check ownership
    const existingArticle = await getArticleById(id);
    if (!existingArticle) {
      return c.json({ success: false, error: 'Article not found' }, 404);
    }

    // Check ownership for moderators
    if (user.role === 'moderator' && existingArticle.author_id !== user.id) {
      return c.json({ success: false, error: 'You can only delete your own articles' }, 403);
    }

    const success = await deleteArticle(id);

    if (!success) {
      return c.json({ success: false, error: 'Article not found or failed to delete' }, 404);
    }

    return c.json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting admin article:', error);
    return c.json({
      success: false,
      error: 'Failed to delete article'
    }, 500);
  }
});

// Resources Management with Search and Filter
adminApi.get('/resources', async (c) => {
  try {
    const user = (c as any).get('user') as User;
    const allResources = await getAllResources();

    // Get query parameters for search and filter
    const search = c.req.query('search') || '';
    const type = c.req.query('type') || 'all'; // 'all', 'link', 'book', 'video', 'podcast', 'study', 'other'
    const category = c.req.query('category') || 'all';
    const author = c.req.query('author') || 'all'; // 'all' or author ID
    const status = c.req.query('status') || 'all'; // 'all', 'published', 'draft'
    const sortBy = c.req.query('sortBy') || 'created_at'; // 'created_at', 'title', 'author', 'type'
    const sortOrder = c.req.query('sortOrder') || 'desc'; // 'asc', 'desc'
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');

    // Filter resources based on user role
    let resources;
    if (user.role === 'admin') {
      // Admins see all resources
      resources = allResources;
    } else if (user.role === 'moderator') {
      // Moderators only see their own resources
      resources = allResources.filter(resource => resource.author_id === user.id);
    } else {
      // Should not happen due to middleware, but safety check
      return c.json({ success: false, error: 'Unauthorized' }, 403);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      resources = resources.filter(resource =>
        resource.title.toLowerCase().includes(searchLower) ||
        resource.description?.toLowerCase().includes(searchLower) ||
        resource.resource_type?.toLowerCase().includes(searchLower)
      );
    }

    // Apply type filter
    if (type !== 'all') {
      resources = resources.filter(resource => resource.resource_type === type);
    }

    // Apply category filter
    if (category !== 'all') {
      const categoryId = parseInt(category);
      if (!isNaN(categoryId)) {
        resources = resources.filter(resource => resource.category_id === categoryId);
      }
    }

    // Apply author filter
    if (author !== 'all') {
      const authorId = parseInt(author);
      if (!isNaN(authorId)) {
        resources = resources.filter(resource => resource.author_id === authorId);
      }
    }

    // Apply status filter
    if (status !== 'all') {
      resources = resources.filter(resource =>
        status === 'published' ? resource.published : !resource.published
      );
    }

    // Apply sorting
    resources.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'author':
          aValue = a.author_name?.toLowerCase() || '';
          bValue = b.author_name?.toLowerCase() || '';
          break;
        case 'type':
          aValue = a.resource_type?.toLowerCase() || '';
          bValue = b.resource_type?.toLowerCase() || '';
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Apply pagination
    const totalResources = resources.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResources = resources.slice(startIndex, endIndex);

    return c.json({
      success: true,
      resources: paginatedResources,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalResources / limit),
        totalResources: totalResources,
        hasNext: endIndex < totalResources,
        hasPrev: page > 1
      },
      filters: {
        search: search,
        type: type,
        category: category,
        author: author,
        status: status,
        sortBy: sortBy,
        sortOrder: sortOrder
      }
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
    const user = (c as any).get('user') as User;
    const { title, description, url, resource_type, category_id } = await c.req.json();
    
    if (!title) {
      return c.json({
        success: false,
        error: 'Title is required'
      }, 400);
    }

    const categoryId = category_id ? parseInt(category_id) : undefined;
    const resource = await createResource(
      title, 
      description || '', 
      url || '', 
      resource_type || 'link', 
      user.id,
      categoryId
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

// Resource file upload endpoint
adminApi.post('/resources/upload', async (c) => {
  try {
    const user = (c as any).get('user') as User;
    const body = await c.req.formData();
    
    const title = body.get('title') as string;
    const description = body.get('description') as string;
    const resourceType = body.get('resource_type') as string || 'file';
    const published = (body.get('published') as string) === 'true';
    const categoryId = body.get('category_id') ? parseInt(body.get('category_id') as string) : undefined;
    const extractedContentFromClient = body.get('extracted_content') as string;
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
    
    // Enhanced file validation with security checks
    const allowedTypes = [
      'application/pdf',
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/mp4',
      'audio/aac',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    const maxSize = 100 * 1024 * 1024; // 100MB max for admin uploads
    
    const validation = validateFileUpload(file, allowedTypes, maxSize);
    if (!validation.valid) {
      await logSecurityEvent(c, 'ADMIN_FILE_UPLOAD_VALIDATION_FAILED', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        errors: validation.errors,
        userId: user.id,
        userRole: user.role,
        blocked: true,
        suspicious: true
      });
      
      return c.json({
        success: false,
        error: validation.errors.join(', ')
      }, 400);
    }
    
    // Log successful file upload attempt
    await logSecurityEvent(c, 'ADMIN_FILE_UPLOAD_STARTED', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      userId: user.id,
      userRole: user.role
    });
    
    // Upload file to R2
    try {
      var uploadResult = await uploadFileToR2(c.env, file, file.name, file.type);
      var fileName = file.name;
      var fileSize = file.size;
      var filePath = uploadResult.key;
      var downloadUrl = uploadResult.url;
      
      // Log successful upload
      await logSecurityEvent(c, 'ADMIN_FILE_UPLOAD_SUCCESS', {
        fileName: fileName,
        fileSize: fileSize,
        filePath: filePath,
        userId: user.id,
        userRole: user.role
      });
    } catch (uploadError) {
      // Log failed upload
      await logSecurityEvent(c, 'ADMIN_FILE_UPLOAD_FAILED', {
        fileName: file.name,
        error: uploadError instanceof Error ? uploadError.message : 'Unknown error',
        userId: user.id,
        userRole: user.role,
        blocked: true,
        suspicious: true
      });
      throw uploadError;
    }
    
    // Enhanced content preview and extraction based on file type
    let contentPreview = '';
    let extractedContent = '';

    if (file.type === 'application/pdf') {
      // PDF document - simple text description only
      contentPreview = `PDF document "${fileName}" (${(fileSize / 1024 / 1024).toFixed(2)} MB)`;
      extractedContent = `PDF document uploaded successfully. Use the download button above to view the PDF.`;
    } else if (file.type.startsWith('audio/')) {
      contentPreview = `Audio file "${fileName}" (${(fileSize / 1024 / 1024).toFixed(2)} MB) ready for playback`;
      extractedContent = `
        <div class="audio-preview">
          <div class="audio-info">
            <h3><i class="fas fa-headphones"></i> ${title}</h3>
            <p class="audio-meta">
              <strong>File:</strong> ${fileName}<br>
              <strong>Size:</strong> ${(fileSize / 1024 / 1024).toFixed(2)} MB<br>
              <strong>Type:</strong> Audio File (${file.type.split('/')[1].toUpperCase()})
            </p>
          </div>
          
          <div class="audio-content">
            <p><i class="fas fa-info-circle"></i> <strong>Audio Content</strong></p>
            <p>This audio file has been uploaded and is ready for download and playback.</p>
            <p>Click the "Download Original" button above to download and listen to the ${resourceType}.</p>
            
            <p style="margin-top: 1rem; font-style: italic; color: #6b7280;">
              Future updates will include direct audio playback controls on this page.
            </p>
          </div>
        </div>
        
        <style>
          .audio-preview {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1.5rem;
            background: #f0fdf4;
          }
          .audio-info h3 {
            margin: 0 0 0.5rem 0;
            color: #059669;
          }
          .audio-meta {
            color: #6b7280;
            font-size: 0.875rem;
            margin-bottom: 1rem;
            line-height: 1.5;
          }
          .audio-content p:first-child {
            font-weight: 600;
            color: #047857;
            margin-bottom: 0.5rem;
          }
        </style>
      `;
    } else if (file.type.startsWith('image/')) {
      contentPreview = `Image file "${fileName}" (${(fileSize / 1024).toFixed(1)} KB) ready for viewing`;
      extractedContent = `
        <div class="image-preview">
          <h3><i class="fas fa-image"></i> ${title}</h3>
          <p>Image file uploaded successfully. Download to view the image.</p>
        </div>
      `;
    } else {
      contentPreview = `Document "${fileName}" (${(fileSize / 1024).toFixed(1)} KB) available for download`;
      extractedContent = `
        <div class="document-preview">
          <h3><i class="fas fa-file-alt"></i> ${title}</h3>
          <p>Document file uploaded successfully. Download to view the content.</p>
        </div>
      `;
    }
    
    // Create resource with file upload options
    const resource = await createResource(
      title,
      description || '',
      '', // No external URL for uploaded files
      resourceType,
      user.id,
      categoryId,
      {
        filePath,
        fileName,
        fileSize,
        extractedContent,
        contentPreview,
        downloadUrl: downloadUrl,
        viewUrl: `/resources/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        metadata: JSON.stringify({
          originalName: fileName,
          mimeType: file.type,
          uploadedAt: new Date().toISOString()
        }),
        isUploadedFile: true,
        published
      }
    );
    
    return c.json({
      success: true,
      message: 'File uploaded and resource created successfully',
      resource: resource
    });
  } catch (error) {
    console.error('Error uploading resource file:', error);
    return c.json({
      success: false,
      error: 'Failed to upload file and create resource'
    }, 500);
  }
});

// Update resource endpoint
adminApi.put('/resources/:id', async (c) => {
  try {
    const user = (c as any).get('user') as User;
    const id = parseInt(c.req.param('id'));
    const { title, description, url, resource_type, published, category_id } = await c.req.json();

    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid resource ID' }, 400);
    }

    if (!title) {
      return c.json({
        success: false,
        error: 'Title is required'
      }, 400);
    }

    // First get the existing resource to preserve file metadata
    const existingResource = await getResourceById(id);
    if (!existingResource) {
      return c.json({ success: false, error: 'Resource not found' }, 404);
    }

    // Check ownership for moderators
    if (user.role === 'moderator' && existingResource.author_id !== user.id) {
      return c.json({ success: false, error: 'You can only edit your own resources' }, 403);
    }

    // Prepare update options - preserve file metadata if it's an uploaded file
    let updateOptions: any = {
      published: published || false
    };

    if (existingResource.is_uploaded_file) {
      // For uploaded files, preserve all file metadata and only update editable fields
      updateOptions = {
        ...updateOptions,
        filePath: existingResource.file_path,
        fileName: existingResource.file_name,
        fileSize: existingResource.file_size,
        extractedContent: existingResource.extracted_content,
        contentPreview: existingResource.content_preview,
        downloadUrl: existingResource.download_url,
        viewUrl: existingResource.view_url,
        metadata: existingResource.metadata,
        isUploadedFile: true
      };
    }

    const categoryId = category_id ? parseInt(category_id) : existingResource.category_id;
    const updatedResource = await updateResource(
      id,
      title, 
      description || '', 
      existingResource.is_uploaded_file ? (existingResource.url || '') : (url || ''), // Preserve original URL for uploaded files
      resource_type || existingResource.resource_type, // Preserve original type if not specified
      categoryId,
      updateOptions
    );
    
    if (!updatedResource) {
      return c.json({ success: false, error: 'Failed to update resource' }, 500);
    }
    
    return c.json({
      success: true,
      message: 'Resource updated successfully',
      resource: updatedResource
    });
  } catch (error) {
    console.error('Error updating admin resource:', error);
    return c.json({
      success: false,
      error: 'Failed to update resource'
    }, 500);
  }
});

adminApi.delete('/resources/:id', async (c) => {
  try {
    const user = (c as any).get('user') as User;
    const id = parseInt(c.req.param('id'));

    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid resource ID' }, 400);
    }

    // First get the existing resource to check ownership and get file info
    const existingResource = await getResourceById(id);
    if (!existingResource) {
      return c.json({ success: false, error: 'Resource not found' }, 404);
    }

    // Check ownership for moderators
    if (user.role === 'moderator' && existingResource.author_id !== user.id) {
      return c.json({ success: false, error: 'You can only delete your own resources' }, 403);
    }

    // If this is an uploaded file, delete it from R2 bucket first
    if (existingResource.is_uploaded_file && existingResource.file_path) {
      console.log('Deleting file from R2 bucket:', existingResource.file_path);
      const fileDeleted = await deleteFileFromR2(c.env, existingResource.file_path);

      if (!fileDeleted) {
        console.warn('Failed to delete file from R2 bucket, but continuing with database deletion');
      } else {
        console.log('File successfully deleted from R2 bucket');
      }
    }

    // Delete the resource from database
    const success = await deleteResource(id);

    if (!success) {
      return c.json({ success: false, error: 'Failed to delete resource from database' }, 500);
    }

    return c.json({
      success: true,
      message: 'Resource and associated file deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting admin resource:', error);
    return c.json({
      success: false,
      error: 'Failed to delete resource'
    }, 500);
  }
});

// Categories Management (Admin and Moderator)
adminApi.get('/categories', adminMiddleware, async (c) => {
  try {
    const categories = await getCategories();
    return c.json({
      success: true,
      categories: categories
    });
  } catch (error) {
    console.error('Error fetching admin categories:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch categories'
    }, 500);
  }
});

adminApi.get('/categories/:id', adminOnlyMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid category ID' }, 400);
    }

    const category = await getCategoryById(id);
    if (!category) {
      return c.json({ success: false, error: 'Category not found' }, 404);
    }

    return c.json({
      success: true,
      category: category
    });
  } catch (error) {
    console.error('Error fetching admin category:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch category'
    }, 500);
  }
});

adminApi.post('/categories', async (c) => {
  try {
    const { name, description, slug, color, icon } = await c.req.json();
    
    if (!name || !slug) {
      return c.json({
        success: false,
        error: 'Name and slug are required'
      }, 400);
    }

    const category = await createCategory(
      name,
      description || '',
      slug,
      color || '#3b82f6',
      icon || 'fas fa-folder'
    );
    
    return c.json({
      success: true,
      message: 'Category created successfully',
      category: category
    });
  } catch (error) {
    console.error('Error creating admin category:', error);
    return c.json({
      success: false,
      error: error instanceof Error && error.message.includes('unique') 
        ? 'Category name or slug already exists' 
        : 'Failed to create category'
    }, 500);
  }
});

adminApi.put('/categories/:id', adminOnlyMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const { name, description, slug, color, icon } = await c.req.json();
    
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid category ID' }, 400);
    }
    
    if (!name || !slug) {
      return c.json({
        success: false,
        error: 'Name and slug are required'
      }, 400);
    }

    const updatedCategory = await updateCategory(
      id,
      name,
      description || '',
      slug,
      color || '#3b82f6',
      icon || 'fas fa-folder'
    );
    
    if (!updatedCategory) {
      return c.json({ success: false, error: 'Category not found' }, 404);
    }
    
    return c.json({
      success: true,
      message: 'Category updated successfully',
      category: updatedCategory
    });
  } catch (error) {
    console.error('Error updating admin category:', error);
    return c.json({
      success: false,
      error: error instanceof Error && error.message.includes('unique') 
        ? 'Category name or slug already exists' 
        : 'Failed to update category'
    }, 500);
  }
});

adminApi.delete('/categories/:id', adminOnlyMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid category ID' }, 400);
    }

    const success = await deleteCategory(id);
    
    if (!success) {
      return c.json({ success: false, error: 'Category not found or failed to delete' }, 404);
    }
    
    return c.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting admin category:', error);
    return c.json({
      success: false,
      error: 'Failed to delete category'
    }, 500);
  }
});

// Real Users Management using database (Admin and Moderator)
adminApi.get('/users', adminMiddleware, async (c) => {
  try {
    // Get all users from database
    const dbUsers = await getAllUsers();
    
    // Get user stats (articles and resources count for each user)
    const usersWithStats = await Promise.all(
      dbUsers.map(async (user) => {
        // Count articles by this user
        const userArticles = await getAllArticles();
        const articlesCount = userArticles.filter(article => article.author_id === user.id).length;
        
        // Count resources by this user
        const userResources = await getAllResources();
        const resourcesCount = userResources.filter(resource => resource.author_id === user.id).length;
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
          last_login: null, // TODO: Add last_login tracking to database
          status: 'active', // TODO: Add user status to database
          articles_count: articlesCount,
          resources_count: resourcesCount
        };
      })
    );
    
    return c.json({
      success: true,
      users: usersWithStats
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch users'
    }, 500);
  }
});

// Get user by ID (Admin Only)
adminApi.get('/users/:id', adminOnlyMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid user ID' }, 400);
    }
    
    const user = await getUserById(id);
    
    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }
    
    return c.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch user'
    }, 500);
  }
});

// Request admin role change (Admin Only)
adminApi.post('/users/:id/request-role-change', adminOnlyMiddleware, async (c) => {
  try {
    const targetUserId = parseInt(c.req.param('id'));
    const { newRole } = await c.req.json();

    if (isNaN(targetUserId)) {
      return c.json({ success: false, error: 'Invalid user ID' }, 400);
    }

    if (!newRole || typeof newRole !== 'string' || !['user', 'moderator', 'admin'].includes(newRole)) {
      return c.json({ success: false, error: 'Invalid role. Must be "user", "moderator", or "admin"' }, 400);
    }

    const currentUser = (c as any).get('user') as User;

    // Prevent users from changing their own role (they should use the verify endpoint)
    if (currentUser.id === targetUserId) {
      return c.json({ success: false, error: 'Cannot request role change for yourself. Use the verification endpoint instead.' }, 400);
    }

    // Get target user details
    const targetUser = await getUserById(targetUserId);
    if (!targetUser) {
      return c.json({ success: false, error: 'Target user not found' }, 404);
    }

    // SUPERADMIN PROTECTION: Prevent any role changes to superadmin users
    if (await isSuperAdmin(targetUserId)) {
      return c.json({
        success: false,
        error: 'Superadmin users cannot have their role changed for security reasons'
      }, 403);
    }

    // Check if target user already has the requested role
    if (targetUser.role === newRole) {
      return c.json({ success: false, error: `User already has the role "${newRole}"` }, 400);
    }

    // Import required functions
    const { createEmailVerification } = await import('./database-neon');
    const { sendVerificationEmail } = await import('./email-service');

    // Store role change details in verification metadata
    const roleChangeData = {
      targetUserId: targetUserId,
      targetUserName: targetUser.name,
      targetUserEmail: targetUser.email,
      newRole: newRole,
      requestedBy: currentUser.id,
      requestedByName: currentUser.name
    };

    // Create email verification using existing system with metadata
    const verification = await createEmailVerification(
      currentUser.id,
      currentUser.email,
      'admin_role_change',
      c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
      c.req.header('User-Agent') || 'unknown',
      roleChangeData
    );

    // Send admin verification email using admin-specific template
    const emailResult = await sendAdminVerificationEmail(
      currentUser.email,
      currentUser.name,
      targetUser.name,
      newRole,
      verification.otp_code,
      c.env
    );

    if (!emailResult.success) {
      console.error('Failed to send admin verification email:', emailResult.error);
      return c.json({
        success: false,
        error: 'Failed to send verification email. Please try again.'
      }, 500);
    }

    // Log security event
    await logSecurityEvent(c, 'ADMIN_ROLE_CHANGE_REQUESTED', {
      adminUserId: currentUser.id,
      adminUserName: currentUser.name,
      targetUserId: targetUserId,
      targetUserName: targetUser.name,
      newRole: newRole,
      verificationId: verification.id,
      emailSent: true
    });

    return c.json({
      success: true,
      message: `Role change request sent. Please check your email (${currentUser.email}) for the verification token.`,
      requestId: verification.id,
      expiresAt: verification.expires_at
    });
  } catch (error) {
    console.error('Error requesting admin role change:', error);
    return c.json({
      success: false,
      error: 'Failed to request role change'
    }, 500);
  }
});

// Verify admin role change with token (Admin Only)
adminApi.post('/users/verify-role-change', adminOnlyMiddleware, async (c) => {
  try {
    const { verificationToken } = await c.req.json();

    if (!verificationToken || typeof verificationToken !== 'string') {
      return c.json({ success: false, error: 'Verification token is required' }, 400);
    }

    const currentUser = (c as any).get('user') as User;

    // Import required functions
    const { verifyEmailOTP, getEmailVerification } = await import('./database-neon');

    // Verify the token using existing email verification system
    const verificationResult = await verifyEmailOTP(currentUser.id, verificationToken, 'admin_role_change');
    if (!verificationResult.success) {
      return c.json({ success: false, error: verificationResult.message }, 400);
    }

    const verification = verificationResult.verification;
    if (!verification || !verification.metadata) {
      return c.json({ success: false, error: 'Invalid verification record' }, 400);
    }

    const { targetUserId, newRole } = verification.metadata;

    if (!targetUserId || !newRole) {
      return c.json({ success: false, error: 'Role change details not found in verification' }, 400);
    }

    // Get target user details
    const targetUser = await getUserById(targetUserId);
    if (!targetUser) {
      return c.json({ success: false, error: 'Target user not found' }, 404);
    }

    // Update the user's role
    const updatedUser = await updateUserRole(targetUserId, newRole);
    if (!updatedUser) {
      return c.json({ success: false, error: 'Failed to update user role' }, 500);
    }

    // Log the role change in the role change log
    const { logRoleChange } = await import('./database-neon');
    await logRoleChange(
      targetUserId,
      targetUser.name,
      targetUser.email,
      targetUser.role, // old role
      newRole, // new role
      currentUser.id,
      currentUser.name,
      verification.metadata?.reason || 'Role change via verification',
      'verification',
      c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP'),
      c.req.header('User-Agent')
    );

    // Log successful role change
    await logSecurityEvent(c, 'ADMIN_ROLE_CHANGE_COMPLETED', {
      adminUserId: currentUser.id,
      adminUserName: currentUser.name,
      targetUserId: targetUserId,
      targetUserName: targetUser.name,
      oldRole: targetUser.role,
      newRole: newRole,
      verificationMethod: 'email_token'
    });

    return c.json({
      success: true,
      message: `User role successfully changed from "${targetUser.role}" to "${newRole}"`,
      user: updatedUser,
      changeDetails: {
        oldRole: targetUser.role,
        newRole: newRole,
        changedBy: currentUser.name,
        changedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error verifying admin role change:', error);
    return c.json({
      success: false,
      error: 'Failed to verify role change'
    }, 500);
  }
});

// Get pending admin verification requests (Admin Only)
adminApi.get('/users/pending-verifications', adminOnlyMiddleware, async (c) => {
  try {
    const currentUser = (c as any).get('user') as User;

    // Import required function
    const { getEmailVerification } = await import('./database-neon');

    // Get pending admin role change verifications for the current user
    // Since we're using the existing email verification system, we need to find
    // verifications that are for admin_role_change purpose and belong to the current user
    const pendingVerification = await getEmailVerification(currentUser.id, 'admin_role_change');

    const pendingVerifications = pendingVerification ? [pendingVerification] : [];

    return c.json({
      success: true,
      verifications: pendingVerifications
    });
  } catch (error) {
    console.error('Error fetching pending verifications:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch pending verifications'
    }, 500);
  }
});

// Update user role (Admin Only) - LEGACY ENDPOINT - Now requires verification for security
adminApi.put('/users/:id', adminOnlyMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const { role } = await c.req.json();

    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid user ID' }, 400);
    }

    if (!role || typeof role !== 'string' || !['user', 'moderator', 'admin'].includes(role)) {
      return c.json({ success: false, error: 'Invalid role. Must be "user", "moderator", or "admin"' }, 400);
    }

    const currentUser = (c as any).get('user') as User;

    // For self-role changes, allow without verification (but still prevent demotion)
    if (currentUser.id === id) {
      if (role !== 'admin') {
        return c.json({ success: false, error: 'Cannot remove your own admin privileges' }, 400);
      }

      const targetUser = await getUserById(id);
      if (!targetUser) {
        return c.json({ success: false, error: 'User not found' }, 404);
      }

      const updatedUser = await updateUserRole(id, role);

      if (!updatedUser) {
        return c.json({ success: false, error: 'User not found' }, 404);
      }

      // Log the role change
      const { logRoleChange } = await import('./database-neon');
      await logRoleChange(
        id,
        targetUser.name,
        targetUser.email,
        targetUser.role, // old role
        role, // new role
        currentUser.id,
        currentUser.name,
        'Self-role confirmation',
        'direct',
        c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP'),
        c.req.header('User-Agent')
      );

      return c.json({
        success: true,
        message: 'User role updated successfully',
        user: updatedUser
      });
    }

    // For other users, require verification process
    return c.json({
      success: false,
      error: 'For security reasons, role changes for other users must be verified via email. Please use the /users/:id/request-role-change endpoint first.',
      actionRequired: 'Use POST /admin/api/users/' + id + '/request-role-change to initiate the verification process'
    }, 400);

  } catch (error) {
    console.error('Error updating user role:', error);
    return c.json({
      success: false,
      error: 'Failed to update user role'
    }, 500);
  }
});

// Delete user (with additional safety checks) (Admin Only)
adminApi.delete('/users/:id', adminOnlyMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid user ID' }, 400);
    }
    
    // Prevent users from deleting themselves
    const currentUser = (c as any).get('user') as User;
    if (currentUser.id === id) {
      return c.json({ success: false, error: 'Cannot delete your own account' }, 400);
    }
    
    // Check if user exists first
    const userToDelete = await getUserById(id);
    if (!userToDelete) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // SUPERADMIN PROTECTION: Prevent deletion of superadmin users
    if (await isSuperAdmin(id)) {
      return c.json({
        success: false,
        error: 'Superadmin users cannot be deleted for security reasons'
      }, 403);
    }
    
    // Get user's content counts for confirmation message
    const userArticles = await getAllArticles();
    const userResources = await getAllResources();
    const articlesCount = userArticles.filter(article => article.author_id === id).length;
    const resourcesCount = userResources.filter(resource => resource.author_id === id).length;
    
    const success = await deleteUser(id);
    
    if (!success) {
      return c.json({ success: false, error: 'Failed to delete user' }, 500);
    }
    
    return c.json({
      success: true,
      message: `User "${userToDelete.name}" deleted successfully. ${articlesCount + resourcesCount > 0 ? `Note: ${articlesCount} articles and ${resourcesCount} resources by this user were also removed.` : ''}`
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return c.json({
      success: false,
      error: 'Failed to delete user'
    }, 500);
  }
});

// User Statistics endpoint (Admin Only)
adminApi.get('/users/stats', adminOnlyMiddleware, async (c) => {
  try {
    const allUsers = await getAllUsers();
    const allArticles = await getAllArticles();
    const allResources = await getAllResources();
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    const recentUsers = allUsers.filter(user => new Date(user.created_at) >= thirtyDaysAgo);
    const newUsersThisWeek = allUsers.filter(user => new Date(user.created_at) >= sevenDaysAgo);
    
    const adminUsers = allUsers.filter(user => user.role === 'admin');
    const regularUsers = allUsers.filter(user => user.role === 'user');
    
    // Most active users (by content creation)
    const userActivity = allUsers.map(user => ({
      ...user,
      articles_count: allArticles.filter(article => article.author_id === user.id).length,
      resources_count: allResources.filter(resource => resource.author_id === user.id).length
    })).sort((a, b) => (b.articles_count + b.resources_count) - (a.articles_count + a.resources_count));
    
    return c.json({
      success: true,
      stats: {
        totalUsers: allUsers.length,
        newUsersThisMonth: recentUsers.length,
        newUsersThisWeek: newUsersThisWeek.length,
        adminUsers: adminUsers.length,
        regularUsers: regularUsers.length,
        mostActiveUsers: userActivity.slice(0, 5),
        userGrowth: {
          thisMonth: recentUsers.length,
          growthRate: allUsers.length > 0 ? Math.round((recentUsers.length / allUsers.length) * 100) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch user statistics'
    }, 500);
  }
});

// Analytics endpoint (Admin Only)
adminApi.get('/analytics', adminOnlyMiddleware, async (c) => {
  try {
    // Get real analytics data from database
    const analytics = await getAnalyticsData();

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

// Cleanup PDF Content endpoint (Admin Only)
adminApi.post('/cleanup-pdf-content', adminOnlyMiddleware, async (c) => {
  try {
    const { cleanupPDFContent } = await import('./cleanup-pdf-content');

    const result = await cleanupPDFContent(c.env);

    if (result.success) {
      return c.json({
        success: true,
        message: `Successfully cleaned up PDF content in ${result.updated} resources`,
        updated: result.updated
      });
    } else {
      return c.json({
        success: false,
        error: result.error
      }, 500);
    }
  } catch (error) {
    console.error('Error running PDF content cleanup:', error);
    return c.json({
      success: false,
      error: 'Failed to run PDF content cleanup'
    }, 500);
  }
});

// Settings Management (Admin Only)
adminApi.get('/settings', adminOnlyMiddleware, async (c) => {
  try {
    const settings = await getSiteSettings();
    return c.json({
      success: true,
      settings: settings
    });
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch settings'
    }, 500);
  }
});

adminApi.put('/settings', adminOnlyMiddleware, async (c) => {
  try {
    const user = (c as any).get('user') as User;
    const { settings } = await c.req.json();

    if (!settings || typeof settings !== 'object') {
      return c.json({
        success: false,
        error: 'Invalid settings data'
      }, 400);
    }

    // Update each setting
    const updatePromises = Object.entries(settings).map(async ([key, value]) => {
      return await updateSiteSetting(key, value, user.id);
    });

    const results = await Promise.all(updatePromises);
    const success = results.every(result => result);

    if (success) {
      return c.json({
        success: true,
        message: 'Settings updated successfully'
      });
    } else {
      return c.json({
        success: false,
        error: 'Failed to update some settings'
      }, 500);
    }
  } catch (error) {
    console.error('Error updating site settings:', error);
    return c.json({
      success: false,
      error: 'Failed to update settings'
    }, 500);
  }
});

// Security endpoints (Admin and Moderator)
adminApi.get('/security/dashboard', async (c) => {
  try {
    // First ensure security tables exist
    const { initializeSecurityTables, getSecurityDashboardData } = await import('./security-db');
    await initializeSecurityTables();

    const dashboardData = await getSecurityDashboardData();

    return c.json({
      success: true,
      ...dashboardData
    });
  } catch (error) {
    console.error('Security dashboard error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch security dashboard data'
    }, 500);
  }
});

adminApi.get('/security/events', async (c) => {
  try {
    // First ensure security tables exist
    const { initializeSecurityTables, getSecurityEvents } = await import('./security-db');
    await initializeSecurityTables();

    const limit = parseInt(c.req.query('limit') || '50');
    const level = c.req.query('level');
    const events = await getSecurityEvents(limit, level);

    return c.json({
      success: true,
      events: events
    });
  } catch (error) {
    console.error('Security events error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch security events'
    }, 500);
  }
});

adminApi.get('/security/alerts', async (c) => {
  try {
    // First ensure security tables exist
    const { initializeSecurityTables, getSecurityAlerts } = await import('./security-db');
    await initializeSecurityTables();

    const status = c.req.query('status') || 'active';
    const limit = parseInt(c.req.query('limit') || '50');
    const alerts = await getSecurityAlerts(status, limit);

    return c.json({
      success: true,
      alerts: alerts
    });
  } catch (error) {
    console.error('Security alerts error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch security alerts'
    }, 500);
  }
});

adminApi.get('/security/threats', async (c) => {
  try {
    // First ensure security tables exist
    const { initializeSecurityTables, getThreatSummary, getRateLimitStats } = await import('./security-db');
    await initializeSecurityTables();

    const threatMetrics = await getThreatSummary(7);
    const rateLimitStats = await getRateLimitStats(24);

    return c.json({
      success: true,
      threatMetrics,
      rateLimitStats
    });
  } catch (error) {
    console.error('Threat metrics error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch threat metrics'
    }, 500);
  }
});

adminApi.post('/security/alerts/:id/acknowledge', adminOnlyMiddleware, async (c) => {
  try {
    const alertId = parseInt(c.req.param('id'));
    if (isNaN(alertId)) {
      return c.json({ success: false, error: 'Invalid alert ID' }, 400);
    }

    const sql = getDB();
    await sql`
      UPDATE security_alerts
      SET status = 'acknowledged'
      WHERE id = ${alertId}
    `;

    return c.json({
      success: true,
      message: 'Alert acknowledged successfully'
    });
  } catch (error) {
    console.error('Alert acknowledge error:', error);
    return c.json({
      success: false,
      error: 'Failed to acknowledge alert'
    }, 500);
  }
});

adminApi.delete('/security/events/:id', adminOnlyMiddleware, async (c) => {
  try {
    const eventId = parseInt(c.req.param('id'));
    if (isNaN(eventId)) {
      return c.json({ success: false, error: 'Invalid event ID' }, 400);
    }

    const sql = getDB();
    await sql`
      DELETE FROM security_events
      WHERE id = ${eventId}
    `;

    return c.json({
      success: true,
      message: 'Security event deleted successfully'
    });
  } catch (error) {
    console.error('Event deletion error:', error);
    return c.json({
      success: false,
      error: 'Failed to delete security event'
    }, 500);
  }
});

// Get recent role changes (Admin Only)
adminApi.get('/role-changes', adminOnlyMiddleware, async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10');
    const { getRecentRoleChanges } = await import('./database-neon');

    const roleChanges = await getRecentRoleChanges(limit);

    return c.json({
      success: true,
      roleChanges: roleChanges
    });
  } catch (error) {
    console.error('Error fetching role changes:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch role changes'
    }, 500);
  }
});

// Mount messaging API routes
adminApi.route('/messages', adminMessagingApi);

export default adminApi;
