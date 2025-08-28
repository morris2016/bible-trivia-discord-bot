import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { registerUser, loginUser, authMiddleware, setAuthCookie, clearAuthCookie, getLoggedInUser } from './auth';
import { authenticate, requirePermission, requireContentCreator, hasPermission } from './auth-middleware';
import commentsApi from './comments-api';

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
  setGlobalEnv,

  toggleLike,
  getLikeCount,
  getUserLikeStatus,

  suspendUser,
  banUser,
  logActivity,
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

// Mount comments API
api.route('/', commentsApi);



// Health check
api.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug environment variables (for production debugging)
api.get('/debug/env', (c) => {
  return c.json({
    hasEnv: !!c.env,
    envKeys: c.env ? Object.keys(c.env).filter(key => !key.includes('SECRET') && !key.includes('PASSWORD')) : [],
    hasDatabaseUrl: !!c.env?.DATABASE_URL,
    hasGoogleClientId: !!c.env?.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!c.env?.GOOGLE_CLIENT_SECRET,
    hasEnvironment: !!c.env?.ENVIRONMENT,
    processEnvHas: {
      databaseUrl: !!process.env.DATABASE_URL,
      googleClientId: !!process.env.GOOGLE_CLIENT_ID
    },
    timestamp: new Date().toISOString()
  });
});

// Test database connection directly
api.get('/debug/db', async (c) => {
  try {
    const { setGlobalEnv, getDB } = await import('./database-neon');
    
    // Set environment first
    setGlobalEnv(c.env);
    
    // Try to get database connection
    const sql = getDB();
    
    // Simple query test
    const result = await sql`SELECT 1 as test`;
    
    // Test if categories table exists and has data
    let categoriesTest = null;
    try {
      categoriesTest = await sql`SELECT COUNT(*) as count FROM categories`;
    } catch (tableError) {
      categoriesTest = { error: tableError.message };
    }
    
    return c.json({
      success: true,
      testQuery: result,
      categoriesTable: categoriesTest,
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5), // First 5 lines of stack
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Test getCategories function directly
api.get('/debug/categories', async (c) => {
  try {
    // Set environment first
    setGlobalEnv(c.env);
    
    // Try the actual getCategories function
    const categories = await getCategories();
    
    return c.json({
      success: true,
      categories: categories,
      count: categories.length,
      message: 'getCategories function successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 10),
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Simple categories endpoint that bypasses initialization
api.get('/categories-simple', async (c) => {
  try {
    // Set environment first
    setGlobalEnv(c.env);
    
    // Get database connection directly without initialization
    const { getDB } = await import('./database-neon');
    const sql = getDB();
    
    // Direct query without any initialization
    const categories = await sql`
      SELECT * FROM categories 
      ORDER BY name ASC
    `;
    
    return c.json({
      success: true,
      categories: categories,
      count: categories.length,
      message: 'Direct query successful - bypassed initialization',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Authentication Routes
api.post('/auth/register', async (c) => {
  try {
    // Set global environment for database access
    setGlobalEnv(c.env);
    
    const { email, name, password } = await c.req.json();
    
    // Import email verification functions
    const { createEmailVerification } = await import('./database-neon');
    const { sendVerificationEmail } = await import('./email-service-resend');
    
    // Get client info for security logging
    const ipAddress = c.req.header('cf-connecting-ip') || 
                      c.req.header('x-forwarded-for') || 
                      c.req.header('x-real-ip') || 'unknown';
    const userAgent = c.req.header('user-agent') || 'unknown';
    
    // Create user but don't log them in yet (email_verified will be false)
    const user = await registerUser(email, name, password, false); // Don't auto-login
    
    // Create email verification record
    const verification = await createEmailVerification(
      user.id,
      email,
      'registration',
      ipAddress,
      userAgent
    );
    
    console.log('About to send verification email:', { email, name, otpCode: verification.otp_code });
    
    // Send verification email
    const emailResult = await sendVerificationEmail(email, name, verification.otp_code, c.env);
    
    console.log('Registration email result:', emailResult);
    
    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Still return success but with a warning
      return c.json({
        success: true,
        message: 'Account created successfully, but verification email failed to send. Please contact support.',
        requiresVerification: true,
        userId: user.id
      });
    }
    
    // Log preview URL for testing
    if (emailResult.previewUrl) {
      console.log('📧 Verification email preview:', emailResult.previewUrl);
    }

    // Log registration activity
    await logActivity(
      user.id,
      'user_registration',
      `New user registered: ${user.name} (email verification required)`,
      'user',
      user.id
    );

    return c.json({
      success: true,
      message: 'Account created successfully! Please check your email for a verification code.',
      requiresVerification: true,
      userId: user.id
    });
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed'
    }, 400);
  }
});

// Verify email with OTP
api.post('/auth/verify-email', async (c) => {
  try {
    // Set global environment for database access
    setGlobalEnv(c.env);
    
    const { userId, otpCode } = await c.req.json();
    
    if (!userId || !otpCode) {
      return c.json({
        success: false,
        error: 'User ID and OTP code are required'
      }, 400);
    }
    
    console.log('Email verification request:', { userId, otpCodeLength: otpCode?.length });
    
    const { verifyEmailOTP, getUserById, logActivity } = await import('./database-neon');
    const { sendWelcomeEmail } = await import('./email-service-resend');
    
    console.log('Attempting to verify OTP...');
    
    // Verify the OTP
    const result = await verifyEmailOTP(userId, otpCode, 'registration');
    
    console.log('OTP verification result:', result);
    
    if (!result.success) {
      console.log('OTP verification failed:', result.message);
      return c.json({
        success: false,
        error: result.message || 'Invalid or expired verification code'
      }, 400);
    }
    
    // Get user details for welcome email
    const user = await getUserById(userId);
    if (user) {
      // Send welcome email (don't wait for it)
      sendWelcomeEmail(user.email, user.name).catch(error => {
        console.error('Failed to send welcome email:', error);
      });
      
      // Log successful verification
      await logActivity(
        userId,
        'email_verification',
        `Email verified for user: ${user.name}`,
        'user',
        userId
      );
    }
    
    return c.json({
      success: true,
      message: 'Email verified successfully! You can now sign in to your account.'
    });
    
  } catch (error) {
    console.error('Email verification error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return c.json({
      success: false,
      error: 'Verification failed. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Resend verification code
api.post('/auth/resend-verification', async (c) => {
  try {
    // Set global environment for database access
    setGlobalEnv(c.env);
    
    const { userId } = await c.req.json();
    
    if (!userId) {
      return c.json({
        success: false,
        error: 'User ID is required'
      }, 400);
    }
    
    console.log('Resend verification request for userId:', userId);
    
    const { getUserById, createEmailVerification } = await import('./database-neon');
    const { sendVerificationEmail } = await import('./email-service-resend');
    
    console.log('Modules imported successfully');
    
    // Get user details
    const user = await getUserById(userId);
    console.log('User lookup result:', { found: !!user, email: user?.email, verified: user?.email_verified });
    if (!user) {
      return c.json({
        success: false,
        error: 'User not found'
      }, 404);
    }
    
    if (user.email_verified) {
      return c.json({
        success: false,
        error: 'Email is already verified'
      }, 400);
    }
    
    // Get client info
    const ipAddress = c.req.header('cf-connecting-ip') || 
                      c.req.header('x-forwarded-for') || 
                      c.req.header('x-real-ip') || 'unknown';
    const userAgent = c.req.header('user-agent') || 'unknown';
    
    console.log('Creating new verification code for user:', user.email);
    
    // Create new verification code
    const verification = await createEmailVerification(
      userId,
      user.email,
      'registration',
      ipAddress,
      userAgent
    );
    
    console.log('Verification created:', { id: verification.id, otp_code: verification.otp_code });
    
    // Send new verification email
    console.log('Attempting to send verification email...');
    console.log('Email details:', { 
      email: user.email, 
      name: user.name, 
      otpCode: verification.otp_code,
      hasEnv: !!c.env,
      envKeys: c.env ? Object.keys(c.env) : []
    });
    
    const emailResult = await sendVerificationEmail(user.email, user.name, verification.otp_code, c.env);
    console.log('Email send result:', emailResult);
    
    if (!emailResult.success) {
      return c.json({
        success: false,
        error: 'Failed to send verification email. Please try again later.'
      }, 500);
    }
    
    return c.json({
      success: true,
      message: 'New verification code sent! Please check your email.'
    });
    
  } catch (error) {
    console.error('Resend verification error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      userId: c.req.json?.userId || 'No userId in request'
    });
    return c.json({
      success: false,
      error: 'Failed to resend verification code. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

api.post('/auth/login', async (c) => {
  try {
    // Set global environment for database access
    setGlobalEnv(c.env);
    
    const { email, password } = await c.req.json();
    const user = await loginUser(email, password);
    
    // Set HTTP-only cookie
    if (user.token) {
      setAuthCookie(c, user.token);
    }

    // Log login activity
    await logActivity(
      user.id,
      'user_login',
      `User logged in: ${user.name}`,
      'user',
      user.id
    );

    // Don't send token in response body for security
    const { token, ...userResponse } = user;
    return c.json({
      success: true,
      message: 'Login successful',
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Handle email not verified error
    if (error instanceof Error && (error as any).code === 'EMAIL_NOT_VERIFIED') {
      return c.json({
        success: false,
        error: error.message,
        requiresVerification: true,
        userId: (error as any).userId
      }, 403);
    }
    
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

// Test email configuration endpoint
api.post('/auth/test-email', async (c) => {
  try {
    // Set global environment for database access
    setGlobalEnv(c.env);
    
    const { testEmailConfig, sendVerificationEmail } = await import('./email-service-resend');
    
    // Test email configuration
    const configTest = await testEmailConfig(c.env);
    
    if (!configTest.success) {
      return c.json({
        success: false,
        error: configTest.error
      }, 500);
    }
    
    // Send test email
    const testEmail = await sendVerificationEmail(
      'hakunamatataministry@gmail.com', 
      'Test User', 
      '123456', 
      c.env
    );
    
    return c.json({
      success: testEmail.success,
      message: testEmail.success ? 'Test email sent successfully!' : 'Failed to send test email',
      error: testEmail.error,
      messageId: testEmail.messageId
    });
    
  } catch (error) {
    console.error('Email test error:', error);
    return c.json({
      success: false,
      error: 'Email test failed'
    }, 500);
  }
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

// Password Reset Routes
api.post('/auth/request-password-reset', async (c) => {
  try {
    // Set global environment for database access
    setGlobalEnv(c.env);
    
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ success: false, error: 'Email is required' }, 400);
    }
    
    // Import functions
    const { getUserByEmail, createEmailVerification } = await import('./database-neon');
    const { sendPasswordResetEmail } = await import('./email-service-resend');
    
    // Check if user exists
    const user = await getUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return c.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      });
    }
    
    // Skip if user is OAuth user (Google)
    if (user.auth_provider === 'google') {
      return c.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      });
    }
    
    // Create verification record (OTP generated inside the function)
    const verification = await createEmailVerification(
      user.id,
      user.email,
      'password_reset',
      c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
      c.req.header('User-Agent')
    );
    
    // Get the generated OTP code from the verification record
    const otpCode = verification.otp_code;
    
    // Send password reset email
    const emailResult = await sendPasswordResetEmail(user.email, user.name, otpCode, c.env);
    
    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return c.json({
        success: false,
        error: 'Failed to send password reset email'
      }, 500);
    }
    
    return c.json({
      success: true,
      message: 'Password reset code has been sent to your email address.',
      userId: user.id // Include user ID for the reset form
    });
    
  } catch (error) {
    console.error('Password reset request error:', error);
    return c.json({
      success: false,
      error: 'Password reset request failed'
    }, 500);
  }
});

api.post('/auth/reset-password', async (c) => {
  try {
    // Set global environment for database access
    setGlobalEnv(c.env);
    
    const { userId, otpCode, newPassword } = await c.req.json();
    
    if (!userId || !otpCode || !newPassword) {
      return c.json({ 
        success: false, 
        error: 'User ID, OTP code, and new password are required' 
      }, 400);
    }
    
    if (newPassword.length < 6) {
      return c.json({
        success: false,
        error: 'Password must be at least 6 characters long'
      }, 400);
    }
    
    // Import functions
    const { verifyEmailOTP, getUserById, updateUserPassword } = await import('./database-neon');
    const { hashPassword } = await import('./auth');
    
    // Verify the OTP code
    const result = await verifyEmailOTP(userId, otpCode, 'password_reset');
    
    if (!result.success) {
      return c.json({
        success: false,
        error: result.message
      }, 400);
    }
    
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update the user's password
    const user = await getUserById(userId);
    if (!user) {
      return c.json({
        success: false,
        error: 'User not found'
      }, 404);
    }
    
    await updateUserPassword(userId, hashedPassword);
    
    return c.json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.'
    });
    
  } catch (error) {
    console.error('Password reset error:', error);
    return c.json({
      success: false,
      error: 'Password reset failed'
    }, 500);
  }
});

// Change Password (for logged-in users)
api.post('/auth/change-password', async (c) => {
  try {
    const { currentPassword, newPassword } = await c.req.json();
    
    if (!currentPassword || !newPassword) {
      return c.json({ 
        success: false, 
        error: 'Current password and new password are required' 
      }, 400);
    }
    
    if (newPassword.length < 6) {
      return c.json({
        success: false,
        error: 'New password must be at least 6 characters long'
      }, 400);
    }
    
    // Get logged in user
    const user = await getLoggedInUser(c);
    if (!user) {
      return c.json({ error: 'Not authenticated' }, 401);
    }
    
    // Check if user is OAuth user (can't change password)
    if (user.auth_provider === 'google') {
      return c.json({
        success: false,
        error: 'Cannot change password for Google OAuth accounts. Manage your password through Google.'
      }, 400);
    }
    
    // Import functions
    const { getUserByEmail, updateUserPassword } = await import('./database-neon');
    const { verifyPassword, hashPassword } = await import('./auth');
    
    // Get user with password hash
    const userWithHash = await getUserByEmail(user.email);
    if (!userWithHash) {
      return c.json({
        success: false,
        error: 'User not found'
      }, 404);
    }
    
    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, userWithHash.password_hash);
    if (!isValidPassword) {
      return c.json({
        success: false,
        error: 'Current password is incorrect'
      }, 400);
    }
    
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update the password
    await updateUserPassword(user.id, hashedPassword);
    
    return c.json({
      success: true,
      message: 'Password changed successfully.'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    return c.json({
      success: false,
      error: 'Failed to change password'
    }, 500);
  }
});

// Articles Routes
api.get('/articles', async (c) => {
  try {
    // Ensure environment is set for database access
    setGlobalEnv(c.env);
    
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

api.post('/articles', authMiddleware, requirePermission('CREATE_ARTICLE'), async (c) => {
  try {
    const user = c.get('user') as User;
    const { title, content, excerpt } = await c.req.json();
    
    // Double-check permissions (belt and suspenders approach)
    if (!hasPermission(user.role, 'CREATE_ARTICLE')) {
      return c.json({
        success: false,
        error: 'Only admins and moderators can create articles',
        code: 'INSUFFICIENT_PERMISSIONS'
      }, 403);
    }
    
    if (!title || !content) {
      return c.json({
        success: false,
        error: 'Title and content are required'
      }, 400);
    }

    const article = await createArticle(title, content, excerpt || '', user.id);
    
    // Log article creation activity
    await logActivity(
      user.id,
      'article_created',
      `Article published: "${article.title}"`,
      'article',
      article.id
    );
    
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
    // Ensure environment is set for database access
    setGlobalEnv(c.env);
    
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

api.post('/resources', authMiddleware, requirePermission('CREATE_RESOURCE'), async (c) => {
  try {
    const user = c.get('user') as User;
    const { title, description, url, resource_type, published } = await c.req.json();
    
    // Double-check permissions
    if (!hasPermission(user.role, 'CREATE_RESOURCE')) {
      return c.json({
        success: false,
        error: 'Only admins and moderators can create resources',
        code: 'INSUFFICIENT_PERMISSIONS'
      }, 403);
    }
    
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
      undefined, // categoryId
      {
        published: published !== undefined ? published : true,
        isUploadedFile: false
      }
    );
    
    // Log resource creation activity
    await logActivity(
      user.id,
      'resource_created',
      `Resource added: "${resource.title}"`,
      'resource',
      resource.id
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
api.post('/resources/upload', authMiddleware, requirePermission('CREATE_RESOURCE'), async (c) => {
  try {
    const user = c.get('user') as User;
    
    // Double-check permissions
    if (!hasPermission(user.role, 'CREATE_RESOURCE')) {
      return c.json({
        success: false,
        error: 'Only admins and moderators can upload resources',
        code: 'INSUFFICIENT_PERMISSIONS'
      }, 403);
    }
    
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
    // Ensure environment is set for database access
    setGlobalEnv(c.env);
    
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

// Analytics API (Admin only)
api.get('/analytics', authMiddleware, requirePermission('ADMIN_ACCESS'), async (c) => {
  try {
    const { getAnalyticsData } = await import('./database-neon');
    const analyticsData = await getAnalyticsData();
    
    return c.json({
      success: true,
      ...analyticsData
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch analytics data'
    }, 500);
  }
});



// Like Routes - Available to all authenticated users
api.post('/articles/:id/like', authMiddleware, requirePermission('LIKE_CONTENT'), async (c) => {
  try {
    const user = c.get('user') as User;
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid article ID' }, 400);
    }
    
    // Verify article exists
    const article = await getArticleById(id);
    if (!article) {
      return c.json({ success: false, error: 'Article not found' }, 404);
    }

    const result = await toggleLike(user.id, id, undefined);
    
    return c.json({
      success: true,
      liked: result.liked,
      likeCount: result.count,
      message: result.liked ? 'Article liked' : 'Article unliked'
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    return c.json({
      success: false,
      error: 'Failed to update like status'
    }, 500);
  }
});

api.post('/resources/:id/like', authMiddleware, requirePermission('LIKE_CONTENT'), async (c) => {
  try {
    const user = c.get('user') as User;
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid resource ID' }, 400);
    }
    
    // Verify resource exists
    const resource = await getResourceById(id);
    if (!resource) {
      return c.json({ success: false, error: 'Resource not found' }, 404);
    }

    const result = await toggleLike(user.id, undefined, id);
    
    return c.json({
      success: true,
      liked: result.liked,
      likeCount: result.count,
      message: result.liked ? 'Resource liked' : 'Resource unliked'
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    return c.json({
      success: false,
      error: 'Failed to update like status'
    }, 500);
  }
});

// Get like status and count
api.get('/articles/:id/likes', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid article ID' }, 400);
    }

    const count = await getLikeCount(id, undefined);
    
    // If user is authenticated, also get their like status
    let userLiked = false;
    try {
      const user = await getLoggedInUser(c);
      if (user) {
        userLiked = await getUserLikeStatus(user.id, id, undefined);
      }
    } catch (error) {
      // User not authenticated, that's okay
    }
    
    return c.json({
      success: true,
      likeCount: count,
      userLiked: userLiked
    });
  } catch (error) {
    console.error('Error fetching like data:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch like data'
    }, 500);
  }
});

api.get('/resources/:id/likes', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid resource ID' }, 400);
    }

    const count = await getLikeCount(undefined, id);
    
    // If user is authenticated, also get their like status
    let userLiked = false;
    try {
      const user = await getLoggedInUser(c);
      if (user) {
        userLiked = await getUserLikeStatus(user.id, undefined, id);
      }
    } catch (error) {
      // User not authenticated, that's okay
    }
    
    return c.json({
      success: true,
      likeCount: count,
      userLiked: userLiked
    });
  } catch (error) {
    console.error('Error fetching like data:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch like data'
    }, 500);
  }
});



export default api;