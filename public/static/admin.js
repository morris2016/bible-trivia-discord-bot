// Faith Defenders Admin Panel JavaScript

// Global admin functions
window.adminLogout = async function() {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    
    if (response.ok) {
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Logout error:', error);
    window.location.href = '/';
  }
};

window.toggleAdminSidebar = function() {
  const sidebar = document.getElementById('admin-sidebar');
  sidebar.classList.toggle('mobile-open');
};

// Utility functions
function showAdminMessage(message, type = 'info') {
  const messageEl = document.getElementById('admin-message');
  if (!messageEl) return;
  
  messageEl.innerHTML = `<div class="admin-message admin-message-${type}">${message}</div>`;
  messageEl.style.display = 'block';
  
  // Auto hide after 5 seconds for success/info messages
  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      messageEl.style.display = 'none';
    }, 5000);
  }
}

function clearAdminMessage() {
  const messageEl = document.getElementById('admin-message');
  if (messageEl) {
    messageEl.style.display = 'none';
  }
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Dashboard Functions
window.loadDashboardData = async function() {
  try {
    console.log('loadDashboardData: Starting...');
    const response = await fetch('/admin/api/stats', {
      credentials: 'include'
    });
    
    console.log('loadDashboardData: Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('loadDashboardData: Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      const stats = data.stats;
      
      // Update statistics cards
      document.getElementById('total-users').textContent = stats.users.total;
      document.getElementById('users-change').textContent = `+${stats.users.newThisMonth} this month`;
      
      document.getElementById('published-articles').textContent = stats.articles.published;
      document.getElementById('articles-change').textContent = `${stats.articles.publishedThisMonth} published this month`;
      
      document.getElementById('total-resources').textContent = stats.resources.total;
      document.getElementById('resources-change').textContent = `+${stats.resources.newThisMonth} this month`;
      
      document.getElementById('total-views').textContent = stats.engagement.totalViews.toLocaleString();
      document.getElementById('views-change').textContent = `${stats.engagement.viewsThisMonth} this month`;
      
      // Load recent activity
      loadRecentActivity();
      
      // Load recent content
      loadRecentContent();
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showAdminMessage('Failed to load dashboard data', 'error');
  }
};

async function loadRecentActivity() {
  const activityEl = document.getElementById('recent-activity');
  if (!activityEl) return;
  
  // Mock recent activity data
  const activities = [
    { type: 'user', message: 'New user registered: John Believer', time: '2 hours ago' },
    { type: 'article', message: 'Article published: "Building Faith"', time: '4 hours ago' },
    { type: 'resource', message: 'Resource added: "Christian Podcast"', time: '1 day ago' },
    { type: 'comment', message: 'New comment on "Prayer Life"', time: '2 days ago' }
  ];
  
  let html = '';
  activities.forEach(activity => {
    const icon = activity.type === 'user' ? 'fa-user-plus' : 
                 activity.type === 'article' ? 'fa-newspaper' :
                 activity.type === 'resource' ? 'fa-book' : 'fa-comment';
                 
    html += `
      <div style="display: flex; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #e2e8f0;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; margin-right: 0.75rem;">
          <i class="fas ${icon}" style="color: #64748b; font-size: 0.8rem;"></i>
        </div>
        <div style="flex: 1;">
          <div style="font-size: 0.9rem; color: #334155;">${activity.message}</div>
          <div style="font-size: 0.8rem; color: #64748b;">${activity.time}</div>
        </div>
      </div>
    `;
  });
  
  activityEl.innerHTML = html;
}

async function loadRecentContent() {
  const contentEl = document.getElementById('recent-content');
  if (!contentEl) return;
  
  try {
    const [articlesRes, resourcesRes] = await Promise.all([
      fetch('/admin/api/articles', { credentials: 'include' }),
      fetch('/admin/api/resources', { credentials: 'include' })
    ]);
    
    const articlesData = await articlesRes.json();
    const resourcesData = await resourcesRes.json();
    
    let html = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">';
    
    // Recent Articles
    html += '<div>';
    html += '<h4 style="margin-bottom: 1rem; color: #334155;">Recent Articles</h4>';
    
    if (articlesData.success && articlesData.articles.length > 0) {
      articlesData.articles.slice(0, 3).forEach(article => {
        const statusBadge = article.published ? 
          '<span class="admin-badge admin-badge-success">Published</span>' :
          '<span class="admin-badge admin-badge-warning">Draft</span>';
          
        html += `
          <div style="padding: 1rem; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 0.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
              <h5 style="margin: 0; font-size: 0.9rem;">
                <a href="/admin/articles/${article.id}/edit" style="color: #3b82f6; text-decoration: none;">
                  ${article.title}
                </a>
              </h5>
              ${statusBadge}
            </div>
            <div style="font-size: 0.8rem; color: #64748b;">
              By ${article.author_name} • ${formatDate(article.created_at)}
            </div>
          </div>
        `;
      });
    } else {
      html += '<p style="color: #64748b; font-size: 0.9rem;">No articles yet</p>';
    }
    
    html += '</div>';
    
    // Recent Resources
    html += '<div>';
    html += '<h4 style="margin-bottom: 1rem; color: #334155;">Recent Resources</h4>';
    
    if (resourcesData.success && resourcesData.resources.length > 0) {
      resourcesData.resources.slice(0, 3).forEach(resource => {
        html += `
          <div style="padding: 1rem; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 0.5rem;">
            <div style="margin-bottom: 0.5rem;">
              <h5 style="margin: 0; font-size: 0.9rem; color: #334155;">${resource.title}</h5>
              <span class="admin-badge admin-badge-info">${resource.resource_type}</span>
            </div>
            <div style="font-size: 0.8rem; color: #64748b;">
              By ${resource.author_name} • ${formatDate(resource.created_at)}
            </div>
          </div>
        `;
      });
    } else {
      html += '<p style="color: #64748b; font-size: 0.9rem;">No resources yet</p>';
    }
    
    html += '</div></div>';
    
    contentEl.innerHTML = html;
  } catch (error) {
    console.error('Error loading recent content:', error);
    contentEl.innerHTML = '<p style="color: #dc2626;">Error loading recent content</p>';
  }
}

// Articles Management
window.loadArticles = async function() {
  try {
    console.log('loadArticles: Starting...');
    const response = await fetch('/admin/api/articles', {
      credentials: 'include'
    });
    
    console.log('loadArticles: Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('loadArticles: Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    const tableBody = document.getElementById('articles-table');
    
    if (!tableBody) {
      console.error('loadArticles: articles-table element not found!');
      return;
    }
    
    if (data.success && data.articles && data.articles.length > 0) {
      let html = '';
      data.articles.forEach(article => {
        const statusBadge = article.published ? 
          '<span class="admin-badge admin-badge-success">Published</span>' :
          '<span class="admin-badge admin-badge-warning">Draft</span>';
          
        html += `
          <tr>
            <td>
              <div style="font-weight: 500;">${article.title}</div>
              <div style="font-size: 0.8rem; color: #64748b;">${article.excerpt || 'No excerpt'}</div>
            </td>
            <td>${article.author_name}</td>
            <td>${statusBadge}</td>
            <td>${formatDate(article.created_at)}</td>
            <td>
              <div class="admin-table-actions">
                <a href="/admin/articles/${article.id}/edit" class="admin-btn admin-btn-sm admin-btn-outline">
                  <i class="fas fa-edit"></i> Edit
                </a>
                <button onclick="deleteArticle(${article.id})" class="admin-btn admin-btn-sm admin-btn-danger">
                  <i class="fas fa-trash"></i> Delete
                </button>
              </div>
            </td>
          </tr>
        `;
      });
      tableBody.innerHTML = html;
    } else if (data.success && data.articles && data.articles.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2rem; color: #64748b;">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
              <div style="font-size: 1.1rem; font-weight: 500;">No articles found</div>
              <div style="color: #9ca3af;">Get started by creating your first article</div>
              <a href="/admin/articles/new" class="admin-btn admin-btn-primary" style="text-decoration: none;">
                <i class="fas fa-plus"></i> Create Article
              </a>
            </div>
          </td>
        </tr>
      `;
    } else {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2rem; color: #dc2626;">
            Failed to load articles. Please refresh the page.
          </td>
        </tr>
      `;
    }
  } catch (error) {
    console.error('loadArticles: Error occurred:', error);
    const tableBody = document.getElementById('articles-table');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2rem; color: #dc2626;">
            <div style="margin-bottom: 1rem;">Error loading articles</div>
            <div style="font-size: 0.9rem; color: #666;">${error.message}</div>
            <div style="margin-top: 1rem;">
              <button onclick="loadArticles()" class="admin-btn admin-btn-primary">Retry</button>
            </div>
          </td>
        </tr>
      `;
    } else {
      console.error('loadArticles: Could not find articles-table element');
    }
  }
};

// Initialize Quill Editor for Admin
let adminQuill = null;
let editQuill = null;

function initializeAdminEditor() {
  if (typeof Quill === 'undefined') {
    console.error('Quill is not loaded');
    return;
  }

  const editorElement = document.getElementById('admin-content-editor');
  if (!editorElement || adminQuill) {
    return; // Editor already initialized or element not found
  }

  // Custom header handler that only applies to selected text
  function customHeaderHandler(value) {
    const range = this.quill.getSelection();
    if (!range || range.length === 0) return;

    const selectedText = this.quill.getText(range.index, range.length);
    if (!selectedText.trim()) return;

    // Store the original selection
    const startIndex = range.index;
    const endIndex = range.index + range.length;
    
    // Get all text content to reconstruct
    const fullText = this.quill.getText();
    const beforeText = fullText.substring(0, startIndex);
    const afterText = fullText.substring(endIndex);
    
    // Clear the editor completely
    this.quill.setText('');
    
    let currentIndex = 0;
    
    // Insert text before selection (if any)
    if (beforeText) {
      this.quill.insertText(currentIndex, beforeText);
      currentIndex += beforeText.length;
    }
    
    // Insert selected text with header formatting
    this.quill.insertText(currentIndex, selectedText);
    this.quill.formatText(currentIndex, selectedText.length, 'header', value);
    currentIndex += selectedText.length;
    
    // Add line break after header
    this.quill.insertText(currentIndex, '\n');
    currentIndex += 1;
    
    // Insert text after selection (if any) with no formatting
    if (afterText) {
      this.quill.insertText(currentIndex, afterText);
      // Ensure no header formatting is applied to after text
      this.quill.formatText(currentIndex, afterText.length, 'header', false);
    }
    
    // Position cursor after the header
    this.quill.setSelection(currentIndex, 0);
  }

  const toolbarOptions = {
    container: '#editor-toolbar-admin',
    handlers: {
      'header': function(value) {
        const range = this.quill.getSelection();
        if (!range || range.length === 0) {
          // If no selection, use default behavior for the line
          this.quill.format('header', value);
          return;
        }

        // For text selection, use custom inline header format
        this.quill.formatText(range.index, range.length, 'headerspan', value);
        
        // Keep selection
        this.quill.setSelection(range.index, range.length);
      },
      'image': function() {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = () => {
          const file = input.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const range = this.quill.getSelection();
              if (range) {
                this.quill.insertEmbed(range.index, 'image', e.target.result);
              }
            };
            reader.readAsDataURL(file);
          }
        };
      }
    }
  };

  // Configure font options
  const Font = Quill.import('formats/font');
  Font.whitelist = ['serif', 'monospace'];
  Quill.register(Font, true);

  // Configure size options
  const Size = Quill.import('formats/size');
  Size.whitelist = ['small', false, 'large', 'huge'];
  Quill.register(Size, true);

  // Create custom inline header formats
  const Inline = Quill.import('blots/inline');
  
  class HeaderSpan extends Inline {
    static create(value) {
      const node = super.create();
      node.setAttribute('data-header', value);
      node.className = `header-${value}`;
      return node;
    }
    
    static formats(node) {
      return node.getAttribute('data-header');
    }
  }
  
  HeaderSpan.blotName = 'headerspan';
  HeaderSpan.tagName = 'span';
  
  Quill.register(HeaderSpan);

  adminQuill = new Quill('#admin-content-editor', {
    modules: {
      toolbar: toolbarOptions
    },
    theme: 'snow',
    placeholder: 'Write your article content here...'
  });

  // Sync Quill content with hidden textarea
  adminQuill.on('text-change', function() {
    const textarea = document.getElementById('admin-content-editor-textarea');
    if (textarea) {
      textarea.value = adminQuill.root.innerHTML;
    }
  });
}

function initializeEditEditor() {
  if (typeof Quill === 'undefined') {
    console.error('Quill is not loaded');
    return;
  }

  const editorElement = document.getElementById('edit-content-editor');
  if (!editorElement || editQuill) {
    return; // Editor already initialized or element not found
  }

  // Custom header handler that only applies to selected text
  function customHeaderHandler(value) {
    const range = this.quill.getSelection();
    if (!range || range.length === 0) return;

    const selectedText = this.quill.getText(range.index, range.length);
    if (!selectedText.trim()) return;

    // Store the original selection
    const startIndex = range.index;
    const endIndex = range.index + range.length;
    
    // Get all text content to reconstruct
    const fullText = this.quill.getText();
    const beforeText = fullText.substring(0, startIndex);
    const afterText = fullText.substring(endIndex);
    
    // Clear the editor completely
    this.quill.setText('');
    
    let currentIndex = 0;
    
    // Insert text before selection (if any)
    if (beforeText) {
      this.quill.insertText(currentIndex, beforeText);
      currentIndex += beforeText.length;
    }
    
    // Insert selected text with header formatting
    this.quill.insertText(currentIndex, selectedText);
    this.quill.formatText(currentIndex, selectedText.length, 'header', value);
    currentIndex += selectedText.length;
    
    // Add line break after header
    this.quill.insertText(currentIndex, '\n');
    currentIndex += 1;
    
    // Insert text after selection (if any) with no formatting
    if (afterText) {
      this.quill.insertText(currentIndex, afterText);
      // Ensure no header formatting is applied to after text
      this.quill.formatText(currentIndex, afterText.length, 'header', false);
    }
    
    // Position cursor after the header
    this.quill.setSelection(currentIndex, 0);
  }

  const toolbarOptions = {
    container: '#editor-toolbar-edit',
    handlers: {
      'header': function(value) {
        const range = this.quill.getSelection();
        if (!range || range.length === 0) {
          // If no selection, use default behavior for the line
          this.quill.format('header', value);
          return;
        }

        // For text selection, use custom inline header format
        this.quill.formatText(range.index, range.length, 'headerspan', value);
        
        // Keep selection
        this.quill.setSelection(range.index, range.length);
      },
      'image': function() {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = () => {
          const file = input.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const range = this.quill.getSelection();
              if (range) {
                this.quill.insertEmbed(range.index, 'image', e.target.result);
              }
            };
            reader.readAsDataURL(file);
          }
        };
      }
    }
  };

  // Configure font options
  const Font = Quill.import('formats/font');
  Font.whitelist = ['serif', 'monospace'];
  Quill.register(Font, true);

  // Configure size options
  const Size = Quill.import('formats/size');
  Size.whitelist = ['small', false, 'large', 'huge'];
  Quill.register(Size, true);

  // Create custom inline header formats
  const Inline = Quill.import('blots/inline');
  
  class HeaderSpan extends Inline {
    static create(value) {
      const node = super.create();
      node.setAttribute('data-header', value);
      node.className = `header-${value}`;
      return node;
    }
    
    static formats(node) {
      return node.getAttribute('data-header');
    }
  }
  
  HeaderSpan.blotName = 'headerspan';
  HeaderSpan.tagName = 'span';
  
  Quill.register(HeaderSpan);

  editQuill = new Quill('#edit-content-editor', {
    modules: {
      toolbar: toolbarOptions
    },
    theme: 'snow',
    placeholder: 'Edit your article content here...'
  });

  // Sync Quill content with hidden textarea
  editQuill.on('text-change', function() {
    const textarea = document.getElementById('edit-content');
    if (textarea) {
      textarea.value = editQuill.root.innerHTML;
    }
  });
}

window.createArticle = async function(e) {
  e.preventDefault();
  
  const form = e.target;
  
  // Update hidden textarea with custom editor content before submitting
  if (window.customEditors && window.customEditors.admin) {
    window.customEditors.admin.syncContent();
  }
  
  const formData = new FormData(form);
  
  const articleData = {
    title: formData.get('title'),
    excerpt: formData.get('excerpt'),
    content: formData.get('content'),
    published: formData.get('published') === 'true'
  };
  
  try {
    showAdminMessage('Creating article...', 'info');
    
    const response = await fetch('/admin/api/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(articleData),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAdminMessage('Article created successfully!', 'success');
      
      // Clear the form and editor
      form.reset();
      if (window.customEditors && window.customEditors.admin) {
        window.customEditors.admin.clear();
      }
      
      setTimeout(() => {
        window.location.href = '/admin/articles';
      }, 1500);
    } else {
      showAdminMessage(data.error || 'Failed to create article', 'error');
    }
  } catch (error) {
    console.error('Error creating article:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};

window.loadArticleForEdit = async function(articleId) {
  try {
    const response = await fetch(`/admin/api/articles/${articleId}`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      const article = data.article;
      
      // Check each element exists before setting value
      const titleElement = document.getElementById('edit-title');
      const excerptElement = document.getElementById('edit-excerpt');
      const contentElement = document.getElementById('edit-content-editor-textarea');
      const publishedElement = document.getElementById('edit-published');
      
      console.log('Edit elements check:', {
        title: !!titleElement,
        excerpt: !!excerptElement,
        content: !!contentElement,
        published: !!publishedElement
      });
      
      if (titleElement) titleElement.value = article.title;
      if (excerptElement) excerptElement.value = article.excerpt || '';
      if (contentElement) contentElement.value = article.content;
      if (publishedElement) publishedElement.value = article.published.toString();
      
      // Load content into custom editor with delay to ensure it's initialized
      setTimeout(() => {
        if (window.customEditors && window.customEditors.edit) {
          console.log('Setting content via custom editor');
          console.log('Article content:', article.content);
          window.customEditors.edit.setContent(article.content);
        } else {
          console.log('Custom editor not available, setting content directly');
          // Fallback: set content directly on editor element with proper formatting
          const editEditor = document.getElementById('edit-content-editor');
          const textareaElement = document.getElementById('edit-content-editor-textarea');
          if (editEditor) {
            // Process content to ensure proper paragraph structure
            let processedContent = article.content;
            if (processedContent && !processedContent.includes('<p>')) {
              // Convert line breaks to paragraphs
              const paragraphs = processedContent.split(/\n\s*\n/);
              if (paragraphs.length > 1) {
                processedContent = paragraphs
                  .map(p => p.trim())
                  .filter(p => p.length > 0)
                  .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
                  .join('');
              } else {
                processedContent = `<p>${processedContent.replace(/\n/g, '<br>')}</p>`;
              }
            }
            
            editEditor.innerHTML = processedContent;
            // Also sync to textarea
            if (textareaElement) {
              textareaElement.value = article.content;
            }
          }
        }
      }, 300);
    } else {
      showAdminMessage('Article not found', 'error');
    }
  } catch (error) {
    console.error('Error loading article:', error);
    showAdminMessage('Error loading article', 'error');
  }
};

window.updateArticle = async function(e) {
  e.preventDefault();
  
  const form = e.target;
  const articleId = form.dataset.articleId;
  
  // Update hidden textarea with custom editor content before submitting
  if (window.customEditors && window.customEditors.edit) {
    window.customEditors.edit.syncContent();
  }
  
  const formData = new FormData(form);
  
  const articleData = {
    title: formData.get('title'),
    excerpt: formData.get('excerpt'),
    content: formData.get('content'),
    published: formData.get('published') === 'true'
  };
  
  try {
    showAdminMessage('Updating article...', 'info');
    
    const response = await fetch(`/admin/api/articles/${articleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(articleData),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAdminMessage('Article updated successfully!', 'success');
      setTimeout(() => {
        window.location.href = '/admin/articles';
      }, 1500);
    } else {
      showAdminMessage(data.error || 'Failed to update article', 'error');
    }
  } catch (error) {
    console.error('Error updating article:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};

window.deleteArticle = async function(articleId) {
  if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
    return;
  }
  
  try {
    showAdminMessage('Deleting article...', 'info');
    
    const response = await fetch(`/admin/api/articles/${articleId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAdminMessage('Article deleted successfully!', 'success');
      setTimeout(() => {
        loadArticles();
      }, 1000);
    } else {
      showAdminMessage(data.error || 'Failed to delete article', 'error');
    }
  } catch (error) {
    console.error('Error deleting article:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};

// Resources Management
window.loadResources = async function() {
  try {
    const response = await fetch('/admin/api/resources', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch resources');
    }
    
    const data = await response.json();
    const tableBody = document.getElementById('resources-table');
    
    if (data.success && data.resources.length > 0) {
      let html = '';
      data.resources.forEach(resource => {
        const statusBadge = resource.published ? 
          '<span class="admin-badge admin-badge-success">Published</span>' :
          '<span class="admin-badge admin-badge-warning">Draft</span>';
          
        const typeBadge = resource.is_uploaded_file ? 
          `<span class="admin-badge admin-badge-primary">Uploaded ${resource.resource_type}</span>` :
          `<span class="admin-badge admin-badge-info">${resource.resource_type}</span>`;
          
        html += `
          <tr>
            <td>
              <div style="font-weight: 500;">${resource.title}</div>
              <div style="font-size: 0.8rem; color: #64748b;">${resource.description || 'No description'}</div>
              ${resource.is_uploaded_file ? `<div style="font-size: 0.7rem; color: #10b981; margin-top: 0.25rem;">
                <i class="fas fa-file"></i> ${resource.file_name || 'Uploaded file'}
              </div>` : ''}
            </td>
            <td>
              ${typeBadge}
              <br>
              ${statusBadge}
            </td>
            <td>${resource.author_name}</td>
            <td>${formatDate(resource.created_at)}</td>
            <td>
              <div class="admin-table-actions">
                ${resource.is_uploaded_file && resource.view_url ? `
                  <a href="${resource.view_url}" target="_blank" class="admin-btn admin-btn-sm admin-btn-primary">
                    <i class="fas fa-eye"></i> View
                  </a>
                ` : ''}
                ${resource.url && !resource.is_uploaded_file ? `
                  <a href="${resource.url}" target="_blank" class="admin-btn admin-btn-sm admin-btn-outline">
                    <i class="fas fa-external-link-alt"></i> Visit
                  </a>
                ` : ''}
                ${resource.is_uploaded_file && resource.download_url ? `
                  <a href="${resource.download_url}" class="admin-btn admin-btn-sm admin-btn-outline">
                    <i class="fas fa-download"></i> Download
                  </a>
                ` : ''}
                <a href="/admin/resources/${resource.id}/edit" class="admin-btn admin-btn-sm admin-btn-outline">
                  <i class="fas fa-edit"></i> Edit
                </a>
                <button onclick="deleteResource(${resource.id})" class="admin-btn admin-btn-sm admin-btn-danger">
                  <i class="fas fa-trash"></i> Delete
                </button>
              </div>
            </td>
          </tr>
        `;
      });
      tableBody.innerHTML = html;
    } else {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2rem; color: #64748b;">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
              <div style="font-size: 1.1rem; font-weight: 500;">No resources found</div>
              <div style="color: #9ca3af;">Get started by adding your first resource</div>
              <a href="/admin/resources/new" class="admin-btn admin-btn-primary" style="text-decoration: none;">
                <i class="fas fa-plus"></i> Add Resource
              </a>
            </div>
          </td>
        </tr>
      `;
    }
  } catch (error) {
    console.error('Error loading resources:', error);
    document.getElementById('resources-table').innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 2rem; color: #dc2626;">
          <div style="margin-bottom: 1rem;">Error loading resources</div>
          <div style="font-size: 0.9rem; color: #666;">${error.message}</div>
          <div style="margin-top: 1rem;">
            <button onclick="loadResources()" class="admin-btn admin-btn-primary">Retry</button>
          </div>
        </td>
      </tr>
    `;
  }
};

// Link Resource Creation
window.createLinkResource = async function(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  
  const resourceData = {
    title: formData.get('title'),
    description: formData.get('description'),
    url: formData.get('url'),
    resource_type: formData.get('resource_type'),
    published: formData.get('published') === 'on'
  };
  
  try {
    showAdminMessage('Adding resource...', 'info');
    
    const response = await fetch('/admin/api/resources', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resourceData),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAdminMessage('Resource added successfully!', 'success');
      setTimeout(() => {
        window.location.href = '/admin/resources';
      }, 1500);
    } else {
      showAdminMessage(data.error || 'Failed to add resource', 'error');
    }
  } catch (error) {
    console.error('Error creating resource:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};

// PDF Text Extraction Function
async function extractPDFText(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Configure PDF.js worker
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      
      // Load the PDF
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      // Extract text from each page (limit to first 20 pages for performance)
      const maxPages = Math.min(pdf.numPages, 20);
      
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Enhanced text extraction with formatting preservation
        const pageText = formatTextContent(textContent);
        fullText += pageText + '\n\n';
      }
      
      return fullText.trim();
    }
  } catch (error) {
    console.error('PDF text extraction failed:', error);
  }
  return '';
}

// Helper function to preserve formatting during text extraction
function formatTextContent(textContent) {
  if (!textContent.items || textContent.items.length === 0) {
    return '';
  }
  
  // Analyze text items to identify potential superscripts and footnotes
  const items = textContent.items.map(item => ({
    text: item.str,
    x: Math.round(item.transform[4]), // X coordinate
    y: Math.round(item.transform[5]), // Y coordinate
    width: item.width || 0,
    height: item.height || 0,
    fontSize: item.height || 12 // Approximate font size from height
  }));
  
  // Group text items by their Y coordinate (lines), with tolerance for superscripts
  const lines = {};
  const superscripts = [];
  
  // First pass: identify potential superscripts (smaller text, higher Y position)
  const avgFontSize = items.reduce((sum, item) => sum + item.fontSize, 0) / items.length;
  const minSuperscriptSize = avgFontSize * 0.7; // Superscripts are typically 70% of normal size
  
  items.forEach(item => {
    // Check if this might be a superscript (smaller and positioned higher)
    const isSuperscript = item.fontSize < minSuperscriptSize && /^\d+$/.test(item.text.trim());
    
    if (isSuperscript) {
      superscripts.push(item);
    } else {
      // Group regular text by Y coordinate with tolerance for slight variations
      let foundLine = false;
      for (const existingY in lines) {
        if (Math.abs(parseInt(existingY) - item.y) <= 3) { // Tolerance of 3 units
          lines[existingY].push(item);
          foundLine = true;
          break;
        }
      }
      
      if (!foundLine) {
        lines[item.y] = [item];
      }
    }
  });
  
  // Sort lines by Y coordinate (top to bottom)
  const sortedYs = Object.keys(lines).map(y => parseInt(y)).sort((a, b) => b - a);
  
  let result = '';
  let lastY = null;
  
  sortedYs.forEach(y => {
    // Check if this is a new paragraph (significant gap between lines)
    if (lastY !== null && (lastY - y) > 20) {
      result += '\n\n'; // Add paragraph break for large gaps
    }
    
    // Sort items in this line by X coordinate (left to right)
    const lineItems = lines[y].sort((a, b) => a.x - b.x);
    
    let lineText = '';
    let lastX = null;
    
    lineItems.forEach((item, index) => {
      const text = item.text.trim();
      if (!text) return;
      
      // Add space if there's a gap between text items
      if (lastX !== null && (item.x - lastX) > 10) {
        lineText += ' ';
      }
      
      lineText += text;
      
      // Check for superscripts that belong after this text
      const nearbySuper = superscripts.filter(sup => 
        sup.x >= item.x && 
        sup.x <= (item.x + item.width + 20) && // Within reasonable distance
        Math.abs(sup.y - y) <= 15 // Close to this line's Y position
      ).sort((a, b) => a.x - b.x);
      
      nearbySuper.forEach(sup => {
        lineText += `^${sup.text.trim()}`; // Mark superscripts with ^
        // Remove from superscripts array to avoid duplicates
        const index = superscripts.indexOf(sup);
        if (index > -1) superscripts.splice(index, 1);
      });
      
      lastX = item.x + item.width;
    });
    
    if (lineText.trim()) {
      result += lineText.trim() + '\n';
    }
    
    lastY = y;
  });
  
  // Clean up extra newlines and format paragraphs
  return result
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    .replace(/\n\n\n+/g, '\n\n') // Remove excessive newlines
    .replace(/([.!?])\s*\n(?=[A-Z])/g, '$1\n\n') // Add paragraph breaks after sentences that end with punctuation followed by a capital letter
    .replace(/([a-z])([A-Z][a-z])/g, '$1 $2') // Add space between words that got joined (lowercase followed by uppercase)
    .replace(/\s+\^(\d+)/g, '^$1') // Clean up superscript formatting
    .trim();
}

// File Upload Resource Creation
window.uploadResourceFile = async function(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  
  // Validate file
  const file = formData.get('file');
  if (!file || file.size === 0) {
    showAdminMessage('Please select a file to upload', 'error');
    return;
  }
  
  // Check file type
  const resourceType = formData.get('resource_type');
  const allowedTypes = {
    'book': ['application/pdf'],
    'podcast': ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a']
  };
  
  if (!allowedTypes[resourceType] || !allowedTypes[resourceType].includes(file.type)) {
    showAdminMessage('Invalid file type for selected resource type', 'error');
    return;
  }
  
  try {
    showAdminMessage('Processing file...', 'info');
    
    // Extract text content if it's a PDF
    let extractedText = '';
    if (file.type === 'application/pdf') {
      showAdminMessage('Extracting text from PDF...', 'info');
      extractedText = await extractPDFText(file);
      
      if (extractedText) {
        // Add extracted content to form data
        formData.append('extracted_content', extractedText);
        showAdminMessage('Text extracted successfully. Uploading...', 'info');
      } else {
        showAdminMessage('Text extraction failed, uploading file only...', 'warning');
      }
    } else {
      showAdminMessage('Uploading file...', 'info');
    }
    
    const response = await fetch('/admin/api/resources/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      const message = extractedText ? 
        'File uploaded successfully with extracted text content!' : 
        'File uploaded successfully!';
      showAdminMessage(message, 'success');
      setTimeout(() => {
        window.location.href = '/admin/resources';
      }, 1500);
    } else {
      showAdminMessage(data.error || 'Failed to upload file', 'error');
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};

// Utility function to format file sizes
window.formatFileSize = function(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Load Resource for Editing
window.loadResourceForEdit = async function(resourceId) {
  try {
    const response = await fetch(`/admin/api/resources/${resourceId}`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      const resource = data.resource;
      
      // Check each element exists before setting value
      const titleElement = document.getElementById('edit-resource-title');
      const typeElement = document.getElementById('edit-resource-type');
      const urlElement = document.getElementById('edit-resource-url');
      const descriptionElement = document.getElementById('edit-resource-description');
      const publishedElement = document.getElementById('edit-resource-published');
      
      if (titleElement) titleElement.value = resource.title;
      if (typeElement) typeElement.value = resource.resource_type;
      if (urlElement) urlElement.value = resource.url || '';
      if (descriptionElement) descriptionElement.value = resource.description || '';
      if (publishedElement) publishedElement.checked = resource.published;
      
      // Show/hide URL vs file info based on resource type
      const urlGroup = document.getElementById('edit-url-group');
      const fileInfo = document.getElementById('edit-file-info');
      
      if (resource.is_uploaded_file) {
        // Show file info, hide URL input
        if (urlGroup) urlGroup.style.display = 'none';
        if (fileInfo) {
          fileInfo.style.display = 'block';
          
          const filenameEl = document.getElementById('edit-current-filename');
          const filesizeEl = document.getElementById('edit-current-filesize');
          const downloadLinkEl = document.getElementById('edit-download-link');
          const viewLinkEl = document.getElementById('edit-view-link');
          
          if (filenameEl) filenameEl.textContent = resource.file_name || 'Unknown file';
          if (filesizeEl) filesizeEl.textContent = window.formatFileSize(resource.file_size || 0);
          if (downloadLinkEl && resource.download_url) {
            downloadLinkEl.href = resource.download_url;
          }
          if (viewLinkEl && resource.view_url) {
            viewLinkEl.href = resource.view_url;
            viewLinkEl.style.display = 'inline-flex';
          }
        }
      } else {
        // Show URL input, hide file info
        if (urlGroup) urlGroup.style.display = 'block';
        if (fileInfo) fileInfo.style.display = 'none';
      }
    } else {
      showAdminMessage('Resource not found', 'error');
    }
  } catch (error) {
    console.error('Error loading resource:', error);
    showAdminMessage('Error loading resource', 'error');
  }
};

// Update Resource
window.updateResource = async function(e) {
  e.preventDefault();
  
  const form = e.target;
  const resourceId = form.dataset.resourceId;
  const formData = new FormData(form);
  
  const resourceData = {
    title: formData.get('title'),
    description: formData.get('description'),
    url: formData.get('url'),
    resource_type: formData.get('resource_type'),
    published: formData.get('published') === 'on'
  };
  
  try {
    showAdminMessage('Updating resource...', 'info');
    
    const response = await fetch(`/admin/api/resources/${resourceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resourceData),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAdminMessage('Resource updated successfully!', 'success');
      setTimeout(() => {
        window.location.href = '/admin/resources';
      }, 1500);
    } else {
      showAdminMessage(data.error || 'Failed to update resource', 'error');
    }
  } catch (error) {
    console.error('Error updating resource:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};

window.deleteResource = async function(resourceId) {
  if (!confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
    return;
  }
  
  try {
    showAdminMessage('Deleting resource...', 'info');
    
    const response = await fetch(`/admin/api/resources/${resourceId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAdminMessage('Resource deleted successfully!', 'success');
      setTimeout(() => {
        loadResources();
      }, 1000);
    } else {
      showAdminMessage(data.error || 'Failed to delete resource', 'error');
    }
  } catch (error) {
    console.error('Error deleting resource:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};

// Users Management
window.loadUsers = async function() {
  try {
    const response = await fetch('/admin/api/users', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    const data = await response.json();
    const tableBody = document.getElementById('users-table');
    
    if (data.success && data.users.length > 0) {
      let html = '';
      data.users.forEach(user => {
        const statusBadge = user.status === 'active' ? 
          '<span class="admin-badge admin-badge-success">Active</span>' :
          '<span class="admin-badge admin-badge-danger">Inactive</span>';
          
        const roleBadge = user.role === 'admin' ?
          '<span class="admin-badge admin-badge-warning">Admin</span>' :
          '<span class="admin-badge admin-badge-info">User</span>';
          
        html += `
          <tr>
            <td>
              <div style="font-weight: 500;">${user.name}</div>
              <div style="font-size: 0.8rem; color: #64748b;">${user.articles_count} articles, ${user.resources_count} resources</div>
            </td>
            <td>${user.email}</td>
            <td>${roleBadge}</td>
            <td>${statusBadge}</td>
            <td>${formatDate(user.created_at)}</td>
            <td>${formatDateTime(user.last_login)}</td>
            <td>
              <div class="admin-table-actions">
                <button onclick="editUser(${user.id}, '${user.role}', '${user.status}')" class="admin-btn admin-btn-sm admin-btn-outline">
                  <i class="fas fa-edit"></i> Edit
                </button>
                ${user.role !== 'admin' ? `
                  <button onclick="deleteUser(${user.id})" class="admin-btn admin-btn-sm admin-btn-danger">
                    <i class="fas fa-trash"></i> Delete
                  </button>
                ` : ''}
              </div>
            </td>
          </tr>
        `;
      });
      tableBody.innerHTML = html;
    } else {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem; color: #64748b;">
            No users found
          </td>
        </tr>
      `;
    }
  } catch (error) {
    console.error('Error loading users:', error);
    document.getElementById('users-table').innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem; color: #dc2626;">
          Error loading users
        </td>
      </tr>
    `;
  }
};

window.editUser = function(userId, currentRole, currentStatus) {
  const newRole = prompt(`Change role for user (current: ${currentRole}):`, currentRole);
  if (newRole && newRole !== currentRole) {
    updateUserRole(userId, newRole);
  }
};

async function updateUserRole(userId, role) {
  try {
    showAdminMessage('Updating user...', 'info');
    
    const response = await fetch(`/admin/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAdminMessage('User updated successfully!', 'success');
      setTimeout(() => {
        loadUsers();
      }, 1000);
    } else {
      showAdminMessage(data.error || 'Failed to update user', 'error');
    }
  } catch (error) {
    console.error('Error updating user:', error);
    showAdminMessage('Error updating user', 'error');
  }
}

window.deleteUser = async function(userId) {
  if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
    return;
  }
  
  try {
    showAdminMessage('Deleting user...', 'info');
    
    const response = await fetch(`/admin/api/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAdminMessage('User deleted successfully!', 'success');
      setTimeout(() => {
        loadUsers();
      }, 1000);
    } else {
      showAdminMessage(data.error || 'Failed to delete user', 'error');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};

// Analytics
window.loadAnalytics = async function() {
  try {
    const response = await fetch('/admin/api/analytics', {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      const analytics = data.analytics;
      const contentStats = analytics.contentStats;
      
      // Update analytics stat cards
      const pageviewsEl = document.getElementById('analytics-pageviews');
      const pageviewsChangeEl = document.getElementById('analytics-pageviews-change');
      if (pageviewsEl && pageviewsChangeEl) {
        const totalViews = analytics.pageViews.data.reduce((sum, views) => sum + views, 0);
        pageviewsEl.textContent = totalViews.toLocaleString();
        pageviewsChangeEl.textContent = totalViews === 0 ? 'No tracking data yet' : 'Real-time data';
        pageviewsChangeEl.className = 'admin-stat-change' + (totalViews > 0 ? ' positive' : '');
      }
      
      const readtimeEl = document.getElementById('analytics-readtime');
      const readtimeChangeEl = document.getElementById('analytics-readtime-change');
      if (readtimeEl && readtimeChangeEl) {
        readtimeEl.textContent = contentStats.averageReadTime;
        readtimeChangeEl.textContent = contentStats.averageReadTime === '0:00' ? 'No articles published yet' : 'Based on published content';
        readtimeChangeEl.className = 'admin-stat-change' + (contentStats.averageReadTime !== '0:00' ? ' positive' : '');
      }
      
      const growthEl = document.getElementById('analytics-growth');
      const growthChangeEl = document.getElementById('analytics-growth-change');
      if (growthEl && growthChangeEl) {
        const totalNewUsers = analytics.userGrowth.data.reduce((sum, users) => sum + users, 0);
        growthEl.textContent = totalNewUsers.toString();
        growthChangeEl.textContent = totalNewUsers === 0 ? 'No new users this period' : `${totalNewUsers} users in last 6 months`;
        growthChangeEl.className = 'admin-stat-change' + (totalNewUsers > 0 ? ' positive' : '');
      }
      
      const engagementEl = document.getElementById('analytics-engagement');
      const engagementChangeEl = document.getElementById('analytics-engagement-change');
      if (engagementEl && engagementChangeEl) {
        engagementEl.textContent = contentStats.contentEngagement + '%';
        engagementChangeEl.textContent = contentStats.contentEngagement === 0 ? 'No published content yet' : 'Based on published vs total content';
        engagementChangeEl.className = 'admin-stat-change' + (contentStats.contentEngagement > 0 ? ' positive' : '');
      }
      
      // Load top articles
      const topArticlesEl = document.getElementById('top-articles');
      if (topArticlesEl) {
        if (analytics.topArticles.length > 0) {
          let html = '';
          analytics.topArticles.forEach((article, index) => {
            html += `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #e2e8f0;">
                <div>
                  <div style="font-weight: 500; font-size: 0.9rem;">${article.title}</div>
                  <div style="font-size: 0.8rem; color: #64748b;">#${index + 1} most viewed</div>
                </div>
                <div style="font-weight: 600; color: #3b82f6;">${article.views} views</div>
              </div>
            `;
          });
          topArticlesEl.innerHTML = html;
        } else {
          topArticlesEl.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #64748b;">
              <i class="fas fa-newspaper" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
              <div>No published articles yet</div>
              <div style="font-size: 0.8rem; margin-top: 0.5rem;">Create your first article to see analytics data</div>
            </div>
          `;
        }
      }
      
      // Load user growth chart
      loadUserGrowthChart(analytics.userGrowth);
      
      console.log('Analytics loaded successfully');
    }
  } catch (error) {
    console.error('Error loading analytics:', error);
    showAdminMessage('Failed to load analytics', 'error');
  }
};

// Mobile responsive
function checkMobileView() {
  const toggle = document.querySelector('.admin-mobile-toggle');
  if (window.innerWidth <= 1024) {
    if (toggle) toggle.style.display = 'block';
  } else {
    if (toggle) toggle.style.display = 'none';
    const sidebar = document.getElementById('admin-sidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');
  }
}

// Initialize mobile check on load and resize
document.addEventListener('DOMContentLoaded', checkMobileView);
window.addEventListener('resize', checkMobileView);

// Chart functions
function loadUserGrowthChart(userGrowthData) {
  const chartContainer = document.getElementById('user-growth-chart');
  if (!chartContainer) return;
  
  // If no user data, show empty state
  if (userGrowthData.data.every(count => count === 0)) {
    chartContainer.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #64748b;">
        <i class="fas fa-chart-line" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
        <div>No user growth data yet</div>
        <div style="font-size: 0.8rem; margin-top: 0.5rem;">Chart will appear when users register</div>
      </div>
    `;
    return;
  }
  
  // Create simple text-based chart for now (can be upgraded to Chart.js later)
  const maxValue = Math.max(...userGrowthData.data);
  const chartHtml = `
    <div style="padding: 1rem;">
      <div style="display: flex; align-items: end; height: 150px; gap: 0.5rem; margin-bottom: 1rem;">
        ${userGrowthData.labels.map((label, index) => {
          const value = userGrowthData.data[index];
          const height = maxValue > 0 ? (value / maxValue) * 120 : 5;
          return `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
              <div style="
                background: #3b82f6; 
                width: 100%; 
                height: ${height}px; 
                border-radius: 4px 4px 0 0;
                margin-bottom: 0.5rem;
                min-height: 5px;
              "></div>
              <div style="font-size: 0.7rem; color: #64748b;">${label}</div>
              <div style="font-size: 0.8rem; font-weight: 600; color: #1e293b;">${value}</div>
            </div>
          `;
        }).join('')}
      </div>
      <div style="text-align: center; font-size: 0.8rem; color: #64748b;">
        User registrations by month
      </div>
    </div>
  `;
  
  chartContainer.innerHTML = chartHtml;
}

// Category Management Functions
window.loadCategories = async function() {
  try {
    const response = await fetch('/admin/api/categories', {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      displayCategories(data.categories);
    } else {
      showAdminMessage('Failed to load categories: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error loading categories:', error);
    showAdminMessage('Network error loading categories', 'error');
  }
};

function displayCategories(categories) {
  const tbody = document.getElementById('categories-table-body');
  
  if (categories.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="admin-table-empty">No categories found. Create your first category!</td></tr>';
    return;
  }
  
  tbody.innerHTML = categories.map(category => `
    <tr>
      <td>
        <div class="admin-category-name">
          <i class="${category.icon || 'fas fa-folder'}" style="color: ${category.color || '#3b82f6'}; margin-right: 8px;"></i>
          <strong>${category.name}</strong>
        </div>
      </td>
      <td>
        <span class="admin-category-description">${category.description || 'No description'}</span>
      </td>
      <td>
        <div class="admin-color-display" style="background-color: ${category.color || '#3b82f6'};" title="${category.color || '#3b82f6'}"></div>
      </td>
      <td>
        <code class="admin-icon-code">${category.icon || 'fas fa-folder'}</code>
      </td>
      <td>
        <code class="admin-slug-code">${category.slug}</code>
      </td>
      <td>${new Date(category.created_at).toLocaleDateString()}</td>
      <td>
        <button class="admin-btn admin-btn-sm admin-btn-outline" onclick="loadCategoryForEdit(${category.id})" title="Edit">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="admin-btn admin-btn-sm admin-btn-danger" onclick="deleteCategory(${category.id}, '${category.name}')" title="Delete">
          <i class="fas fa-trash"></i> Delete
        </button>
      </td>
    </tr>
  `).join('');
}

window.showCreateCategoryForm = function() {
  document.getElementById('create-category-modal').style.display = 'flex';
  document.querySelector('#create-category-form input[name="name"]').focus();
};

window.hideCreateCategoryForm = function() {
  document.getElementById('create-category-modal').style.display = 'none';
  document.getElementById('create-category-form').reset();
};

window.generateSlug = function(name) {
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  document.querySelector('#create-category-form input[name="slug"]').value = slug;
};

window.generateEditSlug = function(name) {
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  document.querySelector('#edit-category-form input[name="slug"]').value = slug;
};

window.createCategory = async function(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  
  const categoryData = {
    name: formData.get('name'),
    description: formData.get('description'),
    slug: formData.get('slug'),
    color: formData.get('color'),
    icon: formData.get('icon')
  };
  
  try {
    showAdminMessage('Creating category...', 'info');
    
    const response = await fetch('/admin/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(categoryData),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAdminMessage('Category created successfully!', 'success');
      hideCreateCategoryForm();
      loadCategories();
    } else {
      showAdminMessage('Error: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error creating category:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};

window.loadCategoryForEdit = async function(categoryId) {
  try {
    const response = await fetch(`/admin/api/categories/${categoryId}`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      const category = data.category;
      
      document.getElementById('edit-category-id').value = category.id;
      document.getElementById('edit-category-name').value = category.name;
      document.getElementById('edit-category-slug').value = category.slug;
      document.getElementById('edit-category-description').value = category.description || '';
      document.getElementById('edit-category-color').value = category.color || '#3b82f6';
      document.getElementById('edit-category-icon').value = category.icon || 'fas fa-folder';
      
      document.getElementById('edit-category-modal').style.display = 'flex';
      document.getElementById('edit-category-name').focus();
    } else {
      showAdminMessage('Error loading category: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error loading category:', error);
    showAdminMessage('Network error loading category', 'error');
  }
};

window.hideEditCategoryForm = function() {
  document.getElementById('edit-category-modal').style.display = 'none';
  document.getElementById('edit-category-form').reset();
};

window.updateCategory = async function(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  
  const categoryId = formData.get('id');
  const categoryData = {
    name: formData.get('name'),
    description: formData.get('description'),
    slug: formData.get('slug'),
    color: formData.get('color'),
    icon: formData.get('icon')
  };
  
  try {
    showAdminMessage('Updating category...', 'info');
    
    const response = await fetch(`/admin/api/categories/${categoryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(categoryData),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAdminMessage('Category updated successfully!', 'success');
      hideEditCategoryForm();
      loadCategories();
    } else {
      showAdminMessage('Error: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error updating category:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};

window.deleteCategory = async function(categoryId, categoryName) {
  if (!confirm(`Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`)) {
    return;
  }
  
  try {
    showAdminMessage('Deleting category...', 'info');
    
    const response = await fetch(`/admin/api/categories/${categoryId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAdminMessage('Category deleted successfully!', 'success');
      loadCategories();
    } else {
      showAdminMessage('Error: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};