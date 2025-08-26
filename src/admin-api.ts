import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware, adminMiddleware, getLoggedInUser } from './auth';
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
  deleteUser,
  User,
  Article,
  Resource,
  Category
} from './database-neon';

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

// Articles Management
adminApi.get('/articles', async (c) => {
  try {
    const articles = await getAllArticles(); // Get all articles including drafts
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
    const id = parseInt(c.req.param('id'));
    const { title, content, excerpt, published, category_id } = await c.req.json();
    
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid article ID' }, 400);
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
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid article ID' }, 400);
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
    const user = c.get('user') as User;
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
    
    // Validate file type
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
    
    if (!allowedTypes.includes(file.type)) {
      return c.json({
        success: false,
        error: `File type ${file.type} not supported. Supported types: PDF, Audio (MP3, WAV, OGG, AAC), Documents (DOC, DOCX, TXT), Images (JPG, PNG, GIF)`
      }, 400);
    }
    
    // For now, we'll create a simple file path (in production, you'd upload to R2 or similar)
    const fileName = file.name;
    const fileSize = file.size;
    const filePath = `/uploads/${Date.now()}-${fileName}`;
    
    // Enhanced content preview and extraction based on file type
    let contentPreview = '';
    let extractedContent = '';
    
    if (file.type === 'application/pdf') {
      
      // Use extracted content from client if available
      if (extractedContentFromClient && extractedContentFromClient.trim()) {
        contentPreview = `PDF document "${fileName}" (${(fileSize / 1024 / 1024).toFixed(2)} MB) - Text content extracted for web viewing.`;
        
        // Format the extracted text content as HTML with enhanced formatting
        const paragraphs = extractedContentFromClient
          .split('\n\n')
          .map(paragraph => paragraph.trim())
          .filter(paragraph => paragraph.length > 0);
          
        const formattedText = paragraphs
          .map((paragraph, index) => {
            // Handle different paragraph types
            let content = paragraph.replace(/\n/g, '<br>');
            
            // Convert superscript markers to HTML superscripts
            content = content.replace(/\^(\d+)/g, '<sup>$1</sup>');
            
            // First paragraph is likely the title - make it a proper header
            if (index === 0 && paragraph.length < 150) {
              return `<h2 class="pdf-title">${content}</h2>`;
            }
            
            // Second paragraph might be author - style appropriately
            if (index === 1 && paragraph.length < 100 && !paragraph.match(/[.!?]$/)) {
              return `<p class="pdf-author"><strong>${content}</strong></p>`;
            }
            
            // Make other short lines that appear to be headers bold
            if (paragraph.length < 80 && !paragraph.match(/[.!?;,]$/)) {
              return `<p class="pdf-subheader"><strong>${content}</strong></p>`;
            }
            
            return `<p class="pdf-paragraph">${content}</p>`;
          })
          .join('\n');
        
        extractedContent = `
          <div class="pdf-content-extracted">
            <div class="pdf-info">
              <h3><i class="fas fa-file-pdf"></i> ${title}</h3>
              <p class="pdf-meta">
                <strong>File:</strong> ${fileName}<br>
                <strong>Size:</strong> ${(fileSize / 1024 / 1024).toFixed(2)} MB<br>
                <strong>Type:</strong> PDF Document (Text Extracted)
              </p>
            </div>
            
            <div class="pdf-text-content">
              <h4>Document Content</h4>
              <div class="extracted-text-content" style="line-height: 1.6; margin-top: 1rem;">
                ${formattedText}
              </div>
            </div>
            
            <div class="pdf-actions" style="margin-top: 2rem; padding: 1rem; background: #f8fafc; border-radius: 8px;">
              <p><strong>Additional Options:</strong></p>
              <p>• Use the "Download Original" button above to access the original PDF file</p>
              <p>• The text content above has been extracted for easy web reading</p>
            </div>
          </div>
          
          <style>
            .pdf-content-extracted {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 1.5rem;
              background: #ffffff;
            }
            .pdf-info h3 {
              margin: 0 0 0.5rem 0;
              color: #dc2626;
            }
            .pdf-meta {
              color: #6b7280;
              font-size: 0.875rem;
              margin-bottom: 1.5rem;
              line-height: 1.5;
            }
            .pdf-text-content h4 {
              color: #374151;
              margin-bottom: 1rem;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 0.5rem;
            }
            .extracted-text-content {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 1.5rem;
              max-height: 600px;
              overflow-y: auto;
            }
            .extracted-text-content .pdf-paragraph {
              margin-bottom: 1.2rem;
              text-align: justify;
              line-height: 1.7;
              color: #1f2937;
            }
            .extracted-text-content .pdf-paragraph:last-child {
              margin-bottom: 0;
            }
            .extracted-text-content .pdf-paragraph strong {
              color: #374151;
              font-weight: 600;
            }
            .extracted-text-content .pdf-title {
              text-align: center;
              color: #1f2937;
              font-size: 1.5rem;
              font-weight: 700;
              margin-bottom: 1.5rem;
              line-height: 1.4;
            }
            .extracted-text-content .pdf-author {
              text-align: center;
              color: #4b5563;
              font-size: 1.1rem;
              margin-bottom: 2rem;
              font-style: italic;
            }
            .extracted-text-content .pdf-subheader {
              margin-top: 1.5rem;
              margin-bottom: 1rem;
              color: #374151;
              font-weight: 600;
            }
            .extracted-text-content sup {
              font-size: 0.75em;
              line-height: 0;
              position: relative;
              vertical-align: baseline;
              top: -0.5em;
              color: #dc2626;
              font-weight: 500;
            }
          </style>
        `;
      } else {
        // Fallback content when extraction fails
        contentPreview = `PDF document "${fileName}" (${(fileSize / 1024 / 1024).toFixed(2)} MB) - Click download to view the full document.`;
        extractedContent = `
          <div class="pdf-preview">
            <div class="pdf-info">
              <h3><i class="fas fa-file-pdf"></i> ${title}</h3>
              <p class="pdf-meta">
                <strong>File:</strong> ${fileName}<br>
                <strong>Size:</strong> ${(fileSize / 1024 / 1024).toFixed(2)} MB<br>
                <strong>Type:</strong> PDF Document
              </p>
            </div>
            
            <div class="pdf-content">
              <h4>Document Content</h4>
              <div class="content-notice">
                <p><i class="fas fa-info-circle"></i> <strong>PDF Ready for Viewing</strong></p>
                <p>This PDF document has been uploaded successfully. To read the content:</p>
                
                <ul style="margin: 1rem 0;">
                  <li>Click the "Download Original" button above to download and view the PDF</li>
                  <li>The document contains the full ${title} content</li>
                  <li>Use any PDF viewer to read the document</li>
                </ul>
                
                <p style="margin-top: 1rem; font-style: italic; color: #6b7280;">
                  Text extraction was not available for this PDF, but the original file is ready for download.
                </p>
              </div>
            </div>
          </div>
          
          <style>
            .pdf-preview {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 1.5rem;
              background: #f9fafb;
            }
            .pdf-info h3 {
              margin: 0 0 0.5rem 0;
              color: #dc2626;
            }
            .pdf-meta {
              color: #6b7280;
              font-size: 0.875rem;
              margin-bottom: 1.5rem;
              line-height: 1.5;
            }
            .pdf-content h4 {
              color: #374151;
              margin-bottom: 1rem;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 0.5rem;
            }
            .content-notice {
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              border-radius: 6px;
              padding: 1rem;
            }
            .content-notice p:first-child {
              font-weight: 600;
              color: #1d4ed8;
              margin-bottom: 0.5rem;
            }
            .content-notice ul {
              margin: 0.5rem 0;
              padding-left: 1.5rem;
            }
            .content-notice li {
              margin-bottom: 0.25rem;
            }
          </style>
        `;
      }
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
        downloadUrl: filePath,
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

    // Prepare update options - preserve file metadata if it's an uploaded file
    let updateOptions = {
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
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid resource ID' }, 400);
    }

    const success = await deleteResource(id);
    
    if (!success) {
      return c.json({ success: false, error: 'Resource not found or failed to delete' }, 404);
    }
    
    return c.json({
      success: true,
      message: 'Resource deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting admin resource:', error);
    return c.json({
      success: false,
      error: 'Failed to delete resource'
    }, 500);
  }
});

// Categories Management
adminApi.get('/categories', async (c) => {
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

adminApi.get('/categories/:id', async (c) => {
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

adminApi.put('/categories/:id', async (c) => {
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

adminApi.delete('/categories/:id', async (c) => {
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

adminApi.delete('/users/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid user ID' }, 400);
    }

    const success = await deleteUser(id);
    
    if (!success) {
      return c.json({ success: false, error: 'User not found or failed to delete' }, 404);
    }
    
    return c.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting admin user:', error);
    return c.json({
      success: false,
      error: 'Failed to delete user'
    }, 500);
  }
});

// Analytics endpoint
adminApi.get('/analytics', async (c) => {
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

export default adminApi;