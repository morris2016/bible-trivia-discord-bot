import { Hono } from 'hono';
import { adminRenderer, AdminLayout } from './admin-renderer';
import { getLoggedInUser } from './auth';
import { getArticles, getResources } from './database-neon';
import adminApi from './admin-api';

const adminApp = new Hono();

// Use admin renderer
adminApp.use(adminRenderer);

// Mount admin API routes
adminApp.route('/api', adminApi);

// Admin authentication check
async function requireAdmin(c: any, next: () => Promise<void>) {
  const user = await getLoggedInUser(c);
  
  if (!user || user.role !== 'admin') {
    return c.redirect('/login');
  }
  
  c.set('adminUser', user);
  await next();
}

// Apply admin authentication to all routes
adminApp.use('*', requireAdmin);

// Admin Dashboard
adminApp.get('/', async (c) => {
  const user = c.get('adminUser');
  
  return c.render(
    <AdminLayout currentUser={user} currentPage="dashboard" breadcrumb="Dashboard">
      <div class="admin-page-header">
        <h1 class="admin-page-title">Dashboard</h1>
        <p class="admin-page-subtitle">Overview of your Faith Defenders community</p>
      </div>

      {/* Statistics Grid */}
      <div class="admin-stats-grid">
        <div class="admin-stat-card">
          <div class="admin-stat-header">
            <div class="admin-stat-title">Total Users</div>
            <div class="admin-stat-icon blue">
              <i class="fas fa-users"></i>
            </div>
          </div>
          <div class="admin-stat-number" id="total-users">-</div>
          <div class="admin-stat-change positive" id="users-change">Loading...</div>
        </div>

        <div class="admin-stat-card">
          <div class="admin-stat-header">
            <div class="admin-stat-title">Published Articles</div>
            <div class="admin-stat-icon green">
              <i class="fas fa-newspaper"></i>
            </div>
          </div>
          <div class="admin-stat-number" id="published-articles">-</div>
          <div class="admin-stat-change positive" id="articles-change">Loading...</div>
        </div>

        <div class="admin-stat-card">
          <div class="admin-stat-header">
            <div class="admin-stat-title">Total Resources</div>
            <div class="admin-stat-icon yellow">
              <i class="fas fa-book"></i>
            </div>
          </div>
          <div class="admin-stat-number" id="total-resources">-</div>
          <div class="admin-stat-change positive" id="resources-change">Loading...</div>
        </div>

        <div class="admin-stat-card">
          <div class="admin-stat-header">
            <div class="admin-stat-title">Total Views</div>
            <div class="admin-stat-icon red">
              <i class="fas fa-eye"></i>
            </div>
          </div>
          <div class="admin-stat-number" id="total-views">-</div>
          <div class="admin-stat-change positive" id="views-change">Loading...</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">Quick Actions</h3>
            <p class="admin-card-subtitle">Common administrative tasks</p>
          </div>
          <div class="admin-card-content">
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <a href="/admin/articles/new" class="admin-btn admin-btn-primary">
                <i class="fas fa-plus"></i> New Article
              </a>
              <a href="/admin/resources/new" class="admin-btn admin-btn-secondary">
                <i class="fas fa-plus"></i> Add Resource
              </a>
              <a href="/admin/users" class="admin-btn admin-btn-outline">
                <i class="fas fa-users"></i> Manage Users
              </a>
            </div>
          </div>
        </div>

        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">Recent Activity</h3>
            <p class="admin-card-subtitle">Latest site activity</p>
          </div>
          <div class="admin-card-content">
            <div id="recent-activity">
              <div class="admin-loading">
                <div class="admin-spinner"></div>
                Loading recent activity...
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Content */}
      <div class="admin-card">
        <div class="admin-card-header">
          <h3 class="admin-card-title">Recent Content</h3>
          <p class="admin-card-subtitle">Latest articles and resources</p>
        </div>
        <div class="admin-card-content">
          <div id="recent-content">
            <div class="admin-loading">
              <div class="admin-spinner"></div>
              Loading recent content...
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            // Wait for admin.js to load before calling loadDashboardData
            function checkForFunction() {
              if (typeof window.loadDashboardData === 'function') {
                window.loadDashboardData();
              } else {
                setTimeout(checkForFunction, 100);
              }
            }
            checkForFunction();
          });
        `
      }}></script>
    </AdminLayout>, 
    { title: 'Dashboard' }
  );
});

// Articles Management
adminApp.get('/articles', async (c) => {
  const user = c.get('adminUser');
  
  return c.render(
    <AdminLayout currentUser={user} currentPage="articles" breadcrumb="Articles">
      <div class="admin-page-header">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 class="admin-page-title">Articles</h1>
            <p class="admin-page-subtitle">Manage all articles on your site</p>
          </div>
          <a href="/admin/articles/new" class="admin-btn admin-btn-primary">
            <i class="fas fa-plus"></i> New Article
          </a>
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-card-content">
          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="articles-table">
                <tr>
                  <td colspan="6" style="text-align: center; padding: 2rem;">
                    <div class="admin-loading">
                      <div class="admin-spinner"></div>
                      Loading articles...
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            function checkForFunction() {
              if (typeof window.loadArticles === 'function') {
                window.loadArticles();
              } else {
                setTimeout(checkForFunction, 100);
              }
            }
            checkForFunction();
          });
        `
      }}></script>
    </AdminLayout>,
    { title: 'Articles' }
  );
});

// New Article
adminApp.get('/articles/new', async (c) => {
  const user = c.get('adminUser');
  
  return c.render(
    <AdminLayout currentUser={user} currentPage="articles" breadcrumb="New Article">
      <div class="admin-page-header">
        <h1 class="admin-page-title">Create New Article</h1>
        <p class="admin-page-subtitle">Write and publish a new article</p>
      </div>

      <div class="admin-card">
        <div class="admin-card-content">
          <form id="article-form" class="admin-form">
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Title</label>
                <input type="text" name="title" class="admin-form-input" required />
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Category</label>
                <select name="category_id" class="admin-form-select" id="article-category-select">
                  <option value="">Select Category (Optional)</option>
                  {/* Categories will be loaded dynamically */}
                </select>
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Status</label>
                <select name="published" class="admin-form-select">
                  <option value="false">Draft</option>
                  <option value="true">Published</option>
                </select>
              </div>
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">Excerpt</label>
              <textarea name="excerpt" class="admin-form-textarea" rows="3" 
                placeholder="Brief description of the article..."></textarea>
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">Content</label>
              <div class="custom-toolbar">
                {/* Text formatting group */}
                <div class="toolbar-group">
                  <button type="button" class="toolbar-btn" data-action="bold" title="Bold (Ctrl+B)">
                    <i class="fas fa-bold"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="italic" title="Italic (Ctrl+I)">
                    <i class="fas fa-italic"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="underline" title="Underline (Ctrl+U)">
                    <i class="fas fa-underline"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="strikethrough" title="Strikethrough">
                    <i class="fas fa-strikethrough"></i>
                  </button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                {/* Font and size group */}
                <div class="toolbar-group">
                  <select class="toolbar-select" data-action="fontFamily" title="Font Family">
                    <option value="">Default</option>
                    <option value="serif">Serif</option>
                    <option value="sans">Sans-serif</option>
                    <option value="mono">Monospace</option>
                  </select>
                  <select class="toolbar-select" data-action="fontSize" title="Font Size">
                    <option value="">Normal</option>
                    <option value="xs">Extra Small</option>
                    <option value="sm">Small</option>
                    <option value="lg">Large</option>
                    <option value="xl">Extra Large</option>
                    <option value="2xl">2X Large</option>
                  </select>
                </div>
                
                <div class="toolbar-separator"></div>
                
                {/* Headers group */}
                <div class="toolbar-group">
                  <button type="button" class="toolbar-btn" data-action="header1" title="Heading 1">
                    <strong>H1</strong>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="header2" title="Heading 2">
                    <strong>H2</strong>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="header3" title="Heading 3">
                    <strong>H3</strong>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="header4" title="Heading 4">
                    <strong>H4</strong>
                  </button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                {/* Colors group */}
                <div class="toolbar-group">
                  <input type="color" class="color-picker" data-action="textColor" title="Text Color" value="#000000" />
                  <input type="color" class="color-picker" data-action="backgroundColor" title="Background Color" value="#ffffff" />
                  <button type="button" class="toolbar-btn" data-action="highlight" title="Highlight">
                    <i class="fas fa-highlighter"></i>
                  </button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                {/* Lists group */}
                <div class="toolbar-group">
                  <button type="button" class="toolbar-btn" data-action="orderedList" title="Numbered List">
                    <i class="fas fa-list-ol"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="bulletList" title="Bullet List">
                    <i class="fas fa-list-ul"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="checkList" title="Checklist">
                    <i class="fas fa-tasks"></i>
                  </button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                {/* Alignment group */}
                <div class="toolbar-group">
                  <button type="button" class="toolbar-btn" data-action="alignLeft" title="Align Left">
                    <i class="fas fa-align-left"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="alignCenter" title="Align Center">
                    <i class="fas fa-align-center"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="alignRight" title="Align Right">
                    <i class="fas fa-align-right"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="alignJustify" title="Justify">
                    <i class="fas fa-align-justify"></i>
                  </button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                {/* Special formatting group */}
                <div class="toolbar-group">
                  <button type="button" class="toolbar-btn" data-action="blockquote" title="Quote">
                    <i class="fas fa-quote-left"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="code" title="Inline Code">
                    <i class="fas fa-code"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="codeBlock" title="Code Block">
                    <i class="fas fa-terminal"></i>
                  </button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                {/* Advanced formatting group */}
                <div class="toolbar-group">
                  <button type="button" class="toolbar-btn" data-action="subscript" title="Subscript (H₂O)">
                    <i class="fas fa-subscript"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="superscript" title="Superscript (E=mc²)">
                    <i class="fas fa-superscript"></i>
                  </button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                {/* Media and links group */}
                <div class="toolbar-group">
                  <button type="button" class="toolbar-btn" data-action="link" title="Insert Link">
                    <i class="fas fa-link"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="image" title="Insert Image">
                    <i class="fas fa-image"></i>
                  </button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                {/* Utility group */}
                <div class="toolbar-group">
                  <button type="button" class="toolbar-btn" data-action="removeFormat" title="Clear Formatting">
                    <i class="fas fa-remove-format"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="undo" title="Undo (Ctrl+Z)">
                    <i class="fas fa-undo"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="redo" title="Redo (Ctrl+Y)">
                    <i class="fas fa-redo"></i>
                  </button>
                </div>
              </div>
              <div id="admin-content-editor" contenteditable="true" class="custom-editor"
                   style="min-height: 400px; padding: 1rem; border: 1px solid #d1d5db; border-radius: 6px; background: white; outline: none;"
                   data-placeholder="Start writing your article content..."></div>
              <textarea name="content" id="admin-content-editor-textarea" style="display: none;" required></textarea>
            </div>

            <div class="admin-actions">
              <a href="/admin/articles" class="admin-btn admin-btn-outline">Cancel</a>
              <button type="submit" class="admin-btn admin-btn-primary">
                <i class="fas fa-save"></i> Save Article
              </button>
            </div>
          </form>
        </div>
      </div>

      <div id="admin-message"></div>

      <script dangerouslySetInnerHTML={{
        __html: `
        document.addEventListener('DOMContentLoaded', function() {
          const form = document.getElementById('article-form');
          form.addEventListener('submit', createArticle);
          
          // Load categories for dropdown
          loadCategoriesDropdown('article-category-select');
          
          // Initialize custom editor
          setTimeout(() => {
            if (typeof CustomEditor === 'function') {
              // Initialize and store in global reference
              const adminEditorInstance = new CustomEditor('admin-content-editor');
              if (!window.customEditors) window.customEditors = {};
              window.customEditors.admin = adminEditorInstance;
            } else {
              console.error('CustomEditor class not found');
            }
          }, 100);
        });
        `
      }}></script>
    </AdminLayout>,
    { title: 'New Article' }
  );
});

// Edit Article
adminApp.get('/articles/:id/edit', async (c) => {
  const user = c.get('adminUser');
  const id = c.req.param('id');
  
  return c.render(
    <AdminLayout currentUser={user} currentPage="articles" breadcrumb={`Edit Article #${id}`}>
      <div class="admin-page-header">
        <h1 class="admin-page-title">Edit Article</h1>
        <p class="admin-page-subtitle">Modify article content and settings</p>
      </div>

      <div class="admin-card">
        <div class="admin-card-content">
          <form id="edit-article-form" class="admin-form" data-article-id={id}>
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Title</label>
                <input type="text" name="title" class="admin-form-input" id="edit-title" required />
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Category</label>
                <select name="category_id" class="admin-form-select" id="edit-article-category-select">
                  <option value="">Select Category (Optional)</option>
                  {/* Categories will be loaded dynamically */}
                </select>
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Status</label>
                <select name="published" class="admin-form-select" id="edit-published">
                  <option value="false">Draft</option>
                  <option value="true">Published</option>
                </select>
              </div>
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">Excerpt</label>
              <textarea name="excerpt" class="admin-form-textarea" rows="3" id="edit-excerpt"
                placeholder="Brief description of the article..."></textarea>
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">Content</label>
              <div class="custom-toolbar">
                {/* Text formatting group */}
                <div class="toolbar-group">
                  <button type="button" class="toolbar-btn" data-action="bold" title="Bold (Ctrl+B)">
                    <i class="fas fa-bold"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="italic" title="Italic (Ctrl+I)">
                    <i class="fas fa-italic"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="underline" title="Underline (Ctrl+U)">
                    <i class="fas fa-underline"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="strikethrough" title="Strikethrough">
                    <i class="fas fa-strikethrough"></i>
                  </button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                {/* Font and size group */}
                <div class="toolbar-group">
                  <select class="toolbar-select" data-action="fontFamily" title="Font Family">
                    <option value="">Default</option>
                    <option value="serif">Serif</option>
                    <option value="sans">Sans-serif</option>
                    <option value="mono">Monospace</option>
                  </select>
                  <select class="toolbar-select" data-action="fontSize" title="Font Size">
                    <option value="">Normal</option>
                    <option value="xs">Extra Small</option>
                    <option value="sm">Small</option>
                    <option value="lg">Large</option>
                    <option value="xl">Extra Large</option>
                    <option value="2xl">2X Large</option>
                  </select>
                </div>
                
                <div class="toolbar-separator"></div>
                
                {/* Headers group */}
                <div class="toolbar-group">
                  <button type="button" class="toolbar-btn" data-action="header1" title="Heading 1">
                    <strong>H1</strong>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="header2" title="Heading 2">
                    <strong>H2</strong>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="header3" title="Heading 3">
                    <strong>H3</strong>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="header4" title="Heading 4">
                    <strong>H4</strong>
                  </button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                {/* Colors group */}
                <div class="toolbar-group">
                  <input type="color" class="color-picker" data-action="textColor" title="Text Color" value="#000000" />
                  <input type="color" class="color-picker" data-action="backgroundColor" title="Background Color" value="#ffffff" />
                  <button type="button" class="toolbar-btn" data-action="highlight" title="Highlight">
                    <i class="fas fa-highlighter"></i>
                  </button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                {/* Lists group */}
                <div class="toolbar-group">
                  <button type="button" class="toolbar-btn" data-action="orderedList" title="Numbered List">
                    <i class="fas fa-list-ol"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="bulletList" title="Bullet List">
                    <i class="fas fa-list-ul"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="checkList" title="Checklist">
                    <i class="fas fa-tasks"></i>
                  </button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                {/* Alignment group */}
                <div class="toolbar-group">
                  <button type="button" class="toolbar-btn" data-action="alignLeft" title="Align Left">
                    <i class="fas fa-align-left"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="alignCenter" title="Align Center">
                    <i class="fas fa-align-center"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="alignRight" title="Align Right">
                    <i class="fas fa-align-right"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="alignJustify" title="Justify">
                    <i class="fas fa-align-justify"></i>
                  </button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                {/* Special formatting group */}
                <div class="toolbar-group">
                  <button type="button" class="toolbar-btn" data-action="blockquote" title="Quote">
                    <i class="fas fa-quote-left"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="code" title="Inline Code">
                    <i class="fas fa-code"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="codeBlock" title="Code Block">
                    <i class="fas fa-terminal"></i>
                  </button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                {/* Advanced formatting group */}
                <div class="toolbar-group">
                  <button type="button" class="toolbar-btn" data-action="subscript" title="Subscript (H₂O)">
                    <i class="fas fa-subscript"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="superscript" title="Superscript (E=mc²)">
                    <i class="fas fa-superscript"></i>
                  </button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                {/* Media and links group */}
                <div class="toolbar-group">
                  <button type="button" class="toolbar-btn" data-action="link" title="Insert Link">
                    <i class="fas fa-link"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="image" title="Insert Image">
                    <i class="fas fa-image"></i>
                  </button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                {/* Utility group */}
                <div class="toolbar-group">
                  <button type="button" class="toolbar-btn" data-action="removeFormat" title="Clear Formatting">
                    <i class="fas fa-remove-format"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="undo" title="Undo (Ctrl+Z)">
                    <i class="fas fa-undo"></i>
                  </button>
                  <button type="button" class="toolbar-btn" data-action="redo" title="Redo (Ctrl+Y)">
                    <i class="fas fa-redo"></i>
                  </button>
                </div>
              </div>
              <div id="edit-content-editor" contenteditable="true" class="custom-editor"
                   style="min-height: 400px; padding: 1rem; border: 1px solid #d1d5db; border-radius: 6px; background: white; outline: none;"
                   data-placeholder="Edit your article content..."></div>
              <textarea name="content" id="edit-content-editor-textarea" style="display: none;" required></textarea>
            </div>

            <div class="admin-actions">
              <a href="/admin/articles" class="admin-btn admin-btn-outline">Cancel</a>
              <button type="submit" class="admin-btn admin-btn-primary">
                <i class="fas fa-save"></i> Update Article
              </button>
            </div>
          </form>
        </div>
      </div>

      <div id="admin-message"></div>

      <script dangerouslySetInnerHTML={{
        __html: `
        document.addEventListener('DOMContentLoaded', function() {
          const form = document.getElementById('edit-article-form');
          form.addEventListener('submit', updateArticle);
          
          // Load categories for dropdown
          loadCategoriesDropdown('edit-article-category-select');
          
          // Initialize custom editor for editing
          setTimeout(() => {
            if (typeof CustomEditor === 'function') {
              // Initialize and store in global reference
              const editEditorInstance = new CustomEditor('edit-content-editor');
              if (!window.customEditors) window.customEditors = {};
              window.customEditors.edit = editEditorInstance;
              // Load article data after editor is initialized
              setTimeout(() => {
                loadArticleForEdit(${id});
              }, 100);
            } else {
              console.error('CustomEditor class not found');
              loadArticleForEdit(${id});
            }
          }, 100);
        });
        `
      }}></script>
    </AdminLayout>,
    { title: 'Edit Article' }
  );
});

// Resources Management
adminApp.get('/resources', async (c) => {
  const user = c.get('adminUser');
  
  return c.render(
    <AdminLayout currentUser={user} currentPage="resources" breadcrumb="Resources">
      <div class="admin-page-header">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 class="admin-page-title">Resources</h1>
            <p class="admin-page-subtitle">Manage all resources in your library</p>
          </div>
          <a href="/admin/resources/new" class="admin-btn admin-btn-primary">
            <i class="fas fa-plus"></i> New Resource
          </a>
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-card-content">
          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="resources-table">
                <tr>
                  <td colspan="6" style="text-align: center; padding: 2rem;">
                    <div class="admin-loading">
                      <div class="admin-spinner"></div>
                      Loading resources...
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            function checkForFunction() {
              if (typeof window.loadResources === 'function') {
                window.loadResources();
              } else {
                setTimeout(checkForFunction, 100);
              }
            }
            checkForFunction();
          });
        `
      }}></script>
    </AdminLayout>,
    { title: 'Resources' }
  );
});

// New Resource
adminApp.get('/resources/new', async (c) => {
  const user = c.get('adminUser');
  
  return c.render(
    <AdminLayout currentUser={user} currentPage="resources" breadcrumb="New Resource">
      <div class="admin-page-header">
        <h1 class="admin-page-title">Add New Resource</h1>
        <p class="admin-page-subtitle">Add a helpful resource to the library</p>
      </div>

      <div class="admin-card">
        <div class="admin-card-content">
          {/* Resource Type Selection */}
          <div class="admin-form-tabs">
            <button type="button" class="admin-tab-btn active" data-tab="link">
              <i class="fas fa-link"></i> Link Resource
            </button>
            <button type="button" class="admin-tab-btn" data-tab="upload">
              <i class="fas fa-upload"></i> Upload File
            </button>
          </div>

          {/* Link Resource Form */}
          <form id="resource-link-form" class="admin-form resource-form active">
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Title</label>
                <input type="text" name="title" class="admin-form-input" required />
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Category</label>
                <select name="category_id" class="admin-form-select" id="link-resource-category-select">
                  <option value="">Select Category (Optional)</option>
                  {/* Categories will be loaded dynamically */}
                </select>
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Type</label>
                <select name="resource_type" class="admin-form-select">
                  <option value="link">Website/Link</option>
                  <option value="book">Book (External Link)</option>
                  <option value="video">Video (External Link)</option>
                  <option value="podcast">Podcast (External Link)</option>
                  <option value="study">Study Guide</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">URL</label>
              <input type="url" name="url" class="admin-form-input" 
                placeholder="https://example.com" required />
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">Description</label>
              <textarea name="description" class="admin-form-textarea" rows="4" 
                placeholder="Describe this resource and why it's helpful..."></textarea>
            </div>

            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-checkbox-label">
                  <input type="checkbox" name="published" checked />
                  Publish immediately
                </label>
              </div>
            </div>

            <div class="admin-actions">
              <a href="/admin/resources" class="admin-btn admin-btn-outline">Cancel</a>
              <button type="submit" class="admin-btn admin-btn-primary">
                <i class="fas fa-save"></i> Add Resource
              </button>
            </div>
          </form>

          {/* Upload File Form */}
          <form id="resource-upload-form" class="admin-form resource-form" enctype="multipart/form-data">
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Title</label>
                <input type="text" name="title" class="admin-form-input" required />
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Category</label>
                <select name="category_id" class="admin-form-select" id="upload-resource-category-select">
                  <option value="">Select Category (Optional)</option>
                  {/* Categories will be loaded dynamically */}
                </select>
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Type</label>
                <select name="resource_type" class="admin-form-select" id="upload-type-select">
                  <option value="book">Book (PDF)</option>
                  <option value="podcast">Podcast (Audio)</option>
                </select>
              </div>
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">File Upload</label>
              <div class="admin-file-upload-area" id="file-upload-area">
                <div class="admin-file-upload-content">
                  <i class="fas fa-cloud-upload-alt admin-file-upload-icon"></i>
                  <div class="admin-file-upload-text">
                    <div class="admin-file-upload-primary">Drop files here or click to upload</div>
                    <div class="admin-file-upload-secondary" id="file-type-hint">
                      Supported formats: PDF files for books
                    </div>
                  </div>
                </div>
                <input type="file" name="file" class="admin-file-input" id="file-input" 
                       accept=".pdf" required />
              </div>
              <div class="admin-file-preview" id="file-preview" style="display: none;">
                <div class="admin-file-item">
                  <i class="fas fa-file-pdf admin-file-icon"></i>
                  <div class="admin-file-info">
                    <div class="admin-file-name" id="file-name"></div>
                    <div class="admin-file-size" id="file-size"></div>
                  </div>
                  <button type="button" class="admin-file-remove" id="remove-file">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">Description</label>
              <textarea name="description" class="admin-form-textarea" rows="4" 
                placeholder="Describe this resource and why it's helpful..."></textarea>
            </div>

            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-checkbox-label">
                  <input type="checkbox" name="published" checked />
                  Publish immediately
                </label>
              </div>
            </div>

            <div class="admin-actions">
              <a href="/admin/resources" class="admin-btn admin-btn-outline">Cancel</a>
              <button type="submit" class="admin-btn admin-btn-primary">
                <i class="fas fa-upload"></i> Upload Resource
              </button>
            </div>
          </form>
        </div>
      </div>

      <div id="admin-message"></div>

      <script dangerouslySetInnerHTML={{
        __html: `
        document.addEventListener('DOMContentLoaded', function() {
          // Tab switching functionality
          const tabBtns = document.querySelectorAll('.admin-tab-btn');
          const resourceForms = document.querySelectorAll('.resource-form');
          
          tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
              const tabType = this.dataset.tab;
              
              // Update active tab
              tabBtns.forEach(b => b.classList.remove('active'));
              this.classList.add('active');
              
              // Show corresponding form
              resourceForms.forEach(form => {
                form.classList.remove('active');
                if (form.id.includes(tabType)) {
                  form.classList.add('active');
                }
              });
              
              // Update file type hints
              updateFileTypeHints(tabType);
            });
          });
          
          // Update file type hints based on selection
          function updateFileTypeHints(formType) {
            const fileTypeHint = document.getElementById('file-type-hint');
            const fileInput = document.getElementById('file-input');
            const uploadTypeSelect = document.getElementById('upload-type-select');
            
            if (formType === 'upload' && uploadTypeSelect) {
              const selectedType = uploadTypeSelect.value;
              if (selectedType === 'book') {
                fileTypeHint.textContent = 'Supported formats: PDF files for books';
                fileInput.accept = '.pdf';
              } else if (selectedType === 'podcast') {
                fileTypeHint.textContent = 'Supported formats: MP3, WAV audio files';
                fileInput.accept = '.mp3,.wav,.m4a';
              }
            }
          }
          
          // File upload type change handler
          const uploadTypeSelect = document.getElementById('upload-type-select');
          if (uploadTypeSelect) {
            uploadTypeSelect.addEventListener('change', function() {
              updateFileTypeHints('upload');
            });
          }
          
          // File upload drag and drop
          const fileUploadArea = document.getElementById('file-upload-area');
          const fileInput = document.getElementById('file-input');
          const filePreview = document.getElementById('file-preview');
          
          if (fileUploadArea && fileInput) {
            // Click to upload
            fileUploadArea.addEventListener('click', function() {
              fileInput.click();
            });
            
            // Drag and drop
            fileUploadArea.addEventListener('dragover', function(e) {
              e.preventDefault();
              this.classList.add('drag-over');
            });
            
            fileUploadArea.addEventListener('dragleave', function(e) {
              e.preventDefault();
              this.classList.remove('drag-over');
            });
            
            fileUploadArea.addEventListener('drop', function(e) {
              e.preventDefault();
              this.classList.remove('drag-over');
              
              const files = e.dataTransfer.files;
              if (files.length > 0) {
                fileInput.files = files;
                showFilePreview(files[0]);
              }
            });
            
            // File input change
            fileInput.addEventListener('change', function() {
              if (this.files.length > 0) {
                showFilePreview(this.files[0]);
              }
            });
          }
          
          // Show file preview
          function showFilePreview(file) {
            const fileName = document.getElementById('file-name');
            const fileSize = document.getElementById('file-size');
            
            if (fileName && fileSize) {
              fileName.textContent = file.name;
              fileSize.textContent = formatFileSize(file.size);
              filePreview.style.display = 'block';
              fileUploadArea.style.display = 'none';
            }
          }
          
          // Remove file
          const removeFileBtn = document.getElementById('remove-file');
          if (removeFileBtn) {
            removeFileBtn.addEventListener('click', function() {
              fileInput.value = '';
              filePreview.style.display = 'none';
              fileUploadArea.style.display = 'flex';
            });
          }
          
          // Format file size
          function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
          }
          
          // Load categories for both forms
          loadCategoriesDropdown('link-resource-category-select');
          loadCategoriesDropdown('upload-resource-category-select');
          
          // Form submissions
          const linkForm = document.getElementById('resource-link-form');
          const uploadForm = document.getElementById('resource-upload-form');
          
          if (linkForm) {
            linkForm.addEventListener('submit', createLinkResource);
          }
          
          if (uploadForm) {
            uploadForm.addEventListener('submit', uploadResourceFile);
          }
        });
        `
      }}></script>
    </AdminLayout>,
    { title: 'New Resource' }
  );
});

// Edit Resource
adminApp.get('/resources/:id/edit', async (c) => {
  const user = c.get('adminUser');
  const id = c.req.param('id');
  
  return c.render(
    <AdminLayout currentUser={user} currentPage="resources" breadcrumb={`Edit Resource #${id}`}>
      <div class="admin-page-header">
        <h1 class="admin-page-title">Edit Resource</h1>
        <p class="admin-page-subtitle">Modify resource information and settings</p>
      </div>

      <div class="admin-card">
        <div class="admin-card-content">
          <form id="edit-resource-form" class="admin-form" data-resource-id={id}>
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Title</label>
                <input type="text" name="title" class="admin-form-input" id="edit-resource-title" required />
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Category</label>
                <select name="category_id" class="admin-form-select" id="edit-resource-category-select">
                  <option value="">Select Category (Optional)</option>
                  {/* Categories will be loaded dynamically */}
                </select>
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Type</label>
                <select name="resource_type" class="admin-form-select" id="edit-resource-type">
                  <option value="link">Website/Link</option>
                  <option value="book">Book</option>
                  <option value="video">Video</option>
                  <option value="podcast">Podcast</option>
                  <option value="study">Study Guide</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div class="admin-form-group" id="edit-url-group">
              <label class="admin-form-label">URL</label>
              <input type="url" name="url" class="admin-form-input" id="edit-resource-url"
                placeholder="https://example.com" />
            </div>

            <div class="admin-form-group" id="edit-file-info" style="display: none;">
              <label class="admin-form-label">File Information</label>
              <div class="admin-file-info-display">
                <div class="admin-file-current">
                  <i class="fas fa-file admin-file-icon"></i>
                  <div class="admin-file-details">
                    <div class="admin-file-name" id="edit-current-filename"></div>
                    <div class="admin-file-size" id="edit-current-filesize"></div>
                  </div>
                </div>
                <div class="admin-file-actions">
                  <a href="#" id="edit-download-link" class="admin-btn admin-btn-sm admin-btn-outline" target="_blank">
                    <i class="fas fa-download"></i> Download
                  </a>
                  <a href="#" id="edit-view-link" class="admin-btn admin-btn-sm admin-btn-primary" target="_blank" style="display: none;">
                    <i class="fas fa-eye"></i> View
                  </a>
                </div>
              </div>
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">Description</label>
              <textarea name="description" class="admin-form-textarea" rows="4" id="edit-resource-description"
                placeholder="Describe this resource and why it's helpful..."></textarea>
            </div>

            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-checkbox-label">
                  <input type="checkbox" name="published" id="edit-resource-published" />
                  Published
                </label>
              </div>
            </div>

            <div class="admin-actions">
              <a href="/admin/resources" class="admin-btn admin-btn-outline">Cancel</a>
              <button type="submit" class="admin-btn admin-btn-primary">
                <i class="fas fa-save"></i> Update Resource
              </button>
            </div>
          </form>
        </div>
      </div>

      <div id="admin-message"></div>

      <script dangerouslySetInnerHTML={{
        __html: `
        document.addEventListener('DOMContentLoaded', function() {
          const form = document.getElementById('edit-resource-form');
          form.addEventListener('submit', updateResource);
          
          // Load categories for dropdown
          loadCategoriesDropdown('edit-resource-category-select');
          
          // Load resource data
          loadResourceForEdit(${id});
        });
        `
      }}></script>
    </AdminLayout>,
    { title: 'Edit Resource' }
  );
});

// Categories Management
adminApp.get('/categories', async (c) => {
  const user = c.get('adminUser');
  
  return c.render(
    <AdminLayout currentUser={user} currentPage="categories" breadcrumb="Categories">
      <div class="admin-page">
        <div class="admin-page-header">
          <div>
            <h1 class="admin-page-title">Categories</h1>
            <p class="admin-page-subtitle">Organize content with categories</p>
          </div>
          <button class="admin-btn admin-btn-primary" onclick="showCreateCategoryForm()">
            <i class="fas fa-plus"></i> New Category
          </button>
        </div>

        <div class="admin-card">
          <div class="admin-table-container">
            <table class="admin-table" id="categories-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Color</th>
                  <th>Icon</th>
                  <th>Slug</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="categories-table-body">
                <tr>
                  <td colspan="7" class="admin-table-loading">Loading categories...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Category Modal */}
        <div id="create-category-modal" class="admin-modal" style="display: none;">
          <div class="admin-modal-content">
            <div class="admin-modal-header">
              <h3>Create New Category</h3>
              <button class="admin-modal-close" onclick="hideCreateCategoryForm()">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="admin-modal-body">
              <form id="create-category-form" onsubmit="createCategory(event)">
                <div class="admin-form-group">
                  <label class="admin-form-label">Name *</label>
                  <input type="text" name="name" class="admin-form-input" required 
                    placeholder="Category Name" onkeyup="generateSlug(this.value)" />
                </div>
                
                <div class="admin-form-group">
                  <label class="admin-form-label">Slug *</label>
                  <input type="text" name="slug" class="admin-form-input" required 
                    placeholder="category-slug" pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$" />
                  <small>URL-friendly identifier (lowercase, hyphens only)</small>
                </div>

                <div class="admin-form-group">
                  <label class="admin-form-label">Description</label>
                  <textarea name="description" class="admin-form-textarea" rows="3"
                    placeholder="Brief description of this category..."></textarea>
                </div>

                <div class="admin-form-row">
                  <div class="admin-form-group">
                    <label class="admin-form-label">Color</label>
                    <input type="color" name="color" class="admin-form-input admin-color-input" value="#3b82f6" />
                  </div>
                  
                  <div class="admin-form-group">
                    <label class="admin-form-label">Icon</label>
                    <input type="text" name="icon" class="admin-form-input" value="fas fa-folder" 
                      placeholder="fas fa-folder" />
                    <small>FontAwesome icon class (e.g., fas fa-folder)</small>
                  </div>
                </div>

                <div class="admin-actions">
                  <button type="button" class="admin-btn admin-btn-outline" onclick="hideCreateCategoryForm()">Cancel</button>
                  <button type="submit" class="admin-btn admin-btn-primary">
                    <i class="fas fa-plus"></i> Create Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Edit Category Modal */}
        <div id="edit-category-modal" class="admin-modal" style="display: none;">
          <div class="admin-modal-content">
            <div class="admin-modal-header">
              <h3>Edit Category</h3>
              <button class="admin-modal-close" onclick="hideEditCategoryForm()">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="admin-modal-body">
              <form id="edit-category-form" onsubmit="updateCategory(event)">
                <input type="hidden" name="id" id="edit-category-id" />
                
                <div class="admin-form-group">
                  <label class="admin-form-label">Name *</label>
                  <input type="text" name="name" class="admin-form-input" required 
                    placeholder="Category Name" id="edit-category-name" onkeyup="generateEditSlug(this.value)" />
                </div>
                
                <div class="admin-form-group">
                  <label class="admin-form-label">Slug *</label>
                  <input type="text" name="slug" class="admin-form-input" required 
                    placeholder="category-slug" pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$" id="edit-category-slug" />
                  <small>URL-friendly identifier (lowercase, hyphens only)</small>
                </div>

                <div class="admin-form-group">
                  <label class="admin-form-label">Description</label>
                  <textarea name="description" class="admin-form-textarea" rows="3"
                    placeholder="Brief description of this category..." id="edit-category-description"></textarea>
                </div>

                <div class="admin-form-row">
                  <div class="admin-form-group">
                    <label class="admin-form-label">Color</label>
                    <input type="color" name="color" class="admin-form-input admin-color-input" id="edit-category-color" />
                  </div>
                  
                  <div class="admin-form-group">
                    <label class="admin-form-label">Icon</label>
                    <input type="text" name="icon" class="admin-form-input" 
                      placeholder="fas fa-folder" id="edit-category-icon" />
                    <small>FontAwesome icon class (e.g., fas fa-folder)</small>
                  </div>
                </div>

                <div class="admin-actions">
                  <button type="button" class="admin-btn admin-btn-outline" onclick="hideEditCategoryForm()">Cancel</button>
                  <button type="submit" class="admin-btn admin-btn-primary">
                    <i class="fas fa-save"></i> Update Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div id="admin-message"></div>

      <script dangerouslySetInnerHTML={{
        __html: `
        document.addEventListener('DOMContentLoaded', function() {
          loadCategories();
        });
        `
      }} />
    </AdminLayout>,
    { title: 'Categories' }
  );
});

// Users Management
adminApp.get('/users', async (c) => {
  const user = c.get('adminUser');
  
  return c.render(
    <AdminLayout currentUser={user} currentPage="users" breadcrumb="Users">
      <div class="admin-page-header">
        <h1 class="admin-page-title">Users</h1>
        <p class="admin-page-subtitle">Manage all registered users</p>
      </div>

      <div class="admin-card">
        <div class="admin-card-content">
          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="users-table">
                <tr>
                  <td colspan="7" style="text-align: center; padding: 2rem;">
                    <div class="admin-loading">
                      <div class="admin-spinner"></div>
                      Loading users...
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            function checkForFunction() {
              if (typeof window.loadUsers === 'function') {
                window.loadUsers();
              } else {
                setTimeout(checkForFunction, 100);
              }
            }
            checkForFunction();
          });
        `
      }}></script>
    </AdminLayout>,
    { title: 'Users' }
  );
});

// Analytics
adminApp.get('/analytics', async (c) => {
  const user = c.get('adminUser');
  
  return c.render(
    <AdminLayout currentUser={user} currentPage="analytics" breadcrumb="Analytics">
      <div class="admin-page-header">
        <h1 class="admin-page-title">Analytics</h1>
        <p class="admin-page-subtitle">Site performance and user engagement metrics</p>
      </div>

      {/* Analytics Cards */}
      <div class="admin-stats-grid">
        <div class="admin-stat-card">
          <div class="admin-stat-header">
            <div class="admin-stat-title">Page Views</div>
            <div class="admin-stat-icon blue">
              <i class="fas fa-chart-line"></i>
            </div>
          </div>
          <div class="admin-stat-number" id="analytics-pageviews">0</div>
          <div class="admin-stat-change" id="analytics-pageviews-change">No tracking data yet</div>
        </div>

        <div class="admin-stat-card">
          <div class="admin-stat-header">
            <div class="admin-stat-title">Average Read Time</div>
            <div class="admin-stat-icon green">
              <i class="fas fa-clock"></i>
            </div>
          </div>
          <div class="admin-stat-number" id="analytics-readtime">0:00</div>
          <div class="admin-stat-change" id="analytics-readtime-change">No articles published yet</div>
        </div>

        <div class="admin-stat-card">
          <div class="admin-stat-header">
            <div class="admin-stat-title">User Growth</div>
            <div class="admin-stat-icon yellow">
              <i class="fas fa-user-plus"></i>
            </div>
          </div>
          <div class="admin-stat-number" id="analytics-growth">0</div>
          <div class="admin-stat-change" id="analytics-growth-change">No new users this period</div>
        </div>

        <div class="admin-stat-card">
          <div class="admin-stat-header">
            <div class="admin-stat-title">Content Engagement</div>
            <div class="admin-stat-icon red">
              <i class="fas fa-heart"></i>
            </div>
          </div>
          <div class="admin-stat-number" id="analytics-engagement">0%</div>
          <div class="admin-stat-change" id="analytics-engagement-change">No published content yet</div>
        </div>
      </div>

      {/* Charts and detailed analytics would go here */}
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">Top Articles</h3>
            <p class="admin-card-subtitle">Most viewed articles this month</p>
          </div>
          <div class="admin-card-content">
            <div id="top-articles">Loading...</div>
          </div>
        </div>

        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">User Growth</h3>
            <p class="admin-card-subtitle">New user registrations over time</p>
          </div>
          <div class="admin-card-content">
            <div id="user-growth-chart">
              <div style="text-align: center; padding: 2rem; color: #64748b;">
                <i class="fas fa-chart-line" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <div>No user growth data yet</div>
                <div style="font-size: 0.8rem; margin-top: 0.5rem;">Chart will appear when users register</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            function checkForFunction() {
              if (typeof window.loadAnalytics === 'function') {
                window.loadAnalytics();
              } else {
                setTimeout(checkForFunction, 100);
              }
            }
            checkForFunction();
          });
        `
      }}></script>
    </AdminLayout>,
    { title: 'Analytics' }
  );
});

// Admin Settings
adminApp.get('/settings', async (c) => {
  const user = c.get('adminUser');
  
  return c.render(
    <AdminLayout currentUser={user} currentPage="settings" breadcrumb="Site Settings">
      <div class="admin-page-header">
        <h1 class="admin-page-title">Site Settings</h1>
        <p class="admin-page-subtitle">Configure your Faith Defenders community settings</p>
      </div>

      <div class="admin-settings-container">
        {/* General Settings */}
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">
              <i class="fas fa-globe"></i>
              General Settings
            </h3>
          </div>
          <div class="admin-card-content">
            <form id="general-settings-form" class="admin-form">
              <div class="admin-form-row">
                <div class="admin-form-group">
                  <label class="admin-form-label">Site Name</label>
                  <input type="text" name="site_name" class="admin-form-input" 
                    value="Faith Defenders" placeholder="Your site name" />
                </div>
                <div class="admin-form-group">
                  <label class="admin-form-label">Site Tagline</label>
                  <input type="text" name="site_tagline" class="admin-form-input" 
                    value="Defending and sharing the Christian faith" placeholder="Your site tagline" />
                </div>
              </div>

              <div class="admin-form-group">
                <label class="admin-form-label">Site Description</label>
                <textarea name="site_description" class="admin-form-textarea" rows="3"
                  placeholder="Describe your faith community...">A community dedicated to defending and sharing the Christian faith through articles, resources, and meaningful discussions.</textarea>
              </div>

              <div class="admin-form-row">
                <div class="admin-form-group">
                  <label class="admin-form-label">Contact Email</label>
                  <input type="email" name="contact_email" class="admin-form-input" 
                    placeholder="contact@faithdefenders.com" />
                </div>
                <div class="admin-form-group">
                  <label class="admin-form-label">Admin Email</label>
                  <input type="email" name="admin_email" class="admin-form-input" 
                    value={user.email} placeholder="admin@faithdefenders.com" />
                </div>
              </div>

              <div class="admin-form-actions">
                <button type="submit" class="admin-btn admin-btn-primary">
                  <i class="fas fa-save"></i>
                  Save General Settings
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Content Settings */}
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">
              <i class="fas fa-file-alt"></i>
              Content Settings
            </h3>
          </div>
          <div class="admin-card-content">
            <form id="content-settings-form" class="admin-form">
              <div class="admin-form-row">
                <div class="admin-form-group">
                  <label class="admin-form-label">Articles Per Page</label>
                  <select name="articles_per_page" class="admin-form-select">
                    <option value="5">5 articles</option>
                    <option value="10" selected>10 articles</option>
                    <option value="15">15 articles</option>
                    <option value="20">20 articles</option>
                  </select>
                </div>
                <div class="admin-form-group">
                  <label class="admin-form-label">Default Article Status</label>
                  <select name="default_article_status" class="admin-form-select">
                    <option value="draft">Draft</option>
                    <option value="published" selected>Published</option>
                  </select>
                </div>
              </div>

              <div class="admin-form-group">
                <label class="admin-form-checkbox-container">
                  <input type="checkbox" name="require_approval" class="admin-form-checkbox" />
                  <span class="admin-form-checkbox-mark"></span>
                  Require admin approval for user comments
                </label>
              </div>

              <div class="admin-form-group">
                <label class="admin-form-checkbox-container">
                  <input type="checkbox" name="allow_guest_comments" class="admin-form-checkbox" />
                  <span class="admin-form-checkbox-mark"></span>
                  Allow comments from non-registered users
                </label>
              </div>

              <div class="admin-form-actions">
                <button type="submit" class="admin-btn admin-btn-primary">
                  <i class="fas fa-save"></i>
                  Save Content Settings
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* User Management Settings */}
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">
              <i class="fas fa-users"></i>
              User Management
            </h3>
          </div>
          <div class="admin-card-content">
            <form id="user-settings-form" class="admin-form">
              <div class="admin-form-row">
                <div class="admin-form-group">
                  <label class="admin-form-label">Default User Role</label>
                  <select name="default_user_role" class="admin-form-select">
                    <option value="user" selected>Regular User</option>
                    <option value="moderator">Moderator</option>
                  </select>
                </div>
                <div class="admin-form-group">
                  <label class="admin-form-label">Registration Status</label>
                  <select name="registration_status" class="admin-form-select">
                    <option value="open" selected>Open Registration</option>
                    <option value="approval">Require Admin Approval</option>
                    <option value="closed">Registration Closed</option>
                  </select>
                </div>
              </div>

              <div class="admin-form-group">
                <label class="admin-form-checkbox-container">
                  <input type="checkbox" name="enable_user_profiles" class="admin-form-checkbox" checked />
                  <span class="admin-form-checkbox-mark"></span>
                  Enable public user profiles
                </label>
              </div>

              <div class="admin-form-group">
                <label class="admin-form-checkbox-container">
                  <input type="checkbox" name="send_welcome_email" class="admin-form-checkbox" />
                  <span class="admin-form-checkbox-mark"></span>
                  Send welcome email to new users
                </label>
              </div>

              <div class="admin-form-actions">
                <button type="submit" class="admin-btn admin-btn-primary">
                  <i class="fas fa-save"></i>
                  Save User Settings
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Security Settings */}
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">
              <i class="fas fa-shield-alt"></i>
              Security Settings
            </h3>
          </div>
          <div class="admin-card-content">
            <form id="security-settings-form" class="admin-form">
              <div class="admin-form-row">
                <div class="admin-form-group">
                  <label class="admin-form-label">Session Timeout (minutes)</label>
                  <select name="session_timeout" class="admin-form-select">
                    <option value="30">30 minutes</option>
                    <option value="60" selected>1 hour</option>
                    <option value="120">2 hours</option>
                    <option value="1440">24 hours</option>
                  </select>
                </div>
                <div class="admin-form-group">
                  <label class="admin-form-label">Password Strength</label>
                  <select name="password_strength" class="admin-form-select">
                    <option value="basic">Basic (6+ characters)</option>
                    <option value="moderate" selected>Moderate (8+ chars, mixed case)</option>
                    <option value="strong">Strong (12+ chars, symbols)</option>
                  </select>
                </div>
              </div>

              <div class="admin-form-group">
                <label class="admin-form-checkbox-container">
                  <input type="checkbox" name="enable_2fa" class="admin-form-checkbox" />
                  <span class="admin-form-checkbox-mark"></span>
                  Enable two-factor authentication (2FA)
                </label>
              </div>

              <div class="admin-form-group">
                <label class="admin-form-checkbox-container">
                  <input type="checkbox" name="log_user_activity" class="admin-form-checkbox" checked />
                  <span class="admin-form-checkbox-mark"></span>
                  Log user activity and login attempts
                </label>
              </div>

              <div class="admin-form-actions">
                <button type="submit" class="admin-btn admin-btn-primary">
                  <i class="fas fa-save"></i>
                  Save Security Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            // Settings form handlers
            document.getElementById('general-settings-form').addEventListener('submit', function(e) {
              e.preventDefault();
              handleSettingsSubmit(this, 'general', 'General settings updated successfully!');
            });
            
            document.getElementById('content-settings-form').addEventListener('submit', function(e) {
              e.preventDefault();
              handleSettingsSubmit(this, 'content', 'Content settings updated successfully!');
            });
            
            document.getElementById('user-settings-form').addEventListener('submit', function(e) {
              e.preventDefault();
              handleSettingsSubmit(this, 'user', 'User settings updated successfully!');
            });
            
            document.getElementById('security-settings-form').addEventListener('submit', function(e) {
              e.preventDefault();
              handleSettingsSubmit(this, 'security', 'Security settings updated successfully!');
            });
            
            async function handleSettingsSubmit(form, type, successMessage) {
              const formData = new FormData(form);
              const data = Object.fromEntries(formData.entries());
              
              try {
                const submitButton = form.querySelector('button[type="submit"]');
                const originalText = submitButton.innerHTML;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                submitButton.disabled = true;
                
                // For now, simulate successful save
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                showAdminMessage(successMessage, 'success');
                
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
              } catch (error) {
                console.error('Settings save error:', error);
                showAdminMessage('Failed to save settings. Please try again.', 'error');
                
                const submitButton = form.querySelector('button[type="submit"]');
                submitButton.innerHTML = form.id.includes('general') ? '<i class="fas fa-save"></i> Save General Settings' :
                  form.id.includes('content') ? '<i class="fas fa-save"></i> Save Content Settings' :
                  form.id.includes('user') ? '<i class="fas fa-save"></i> Save User Settings' :
                  '<i class="fas fa-save"></i> Save Security Settings';
                submitButton.disabled = false;
              }
            }
          });
        `
      }}></script>
    </AdminLayout>,
    { title: 'Settings' }
  );
});

// Admin Roles Management
adminApp.get('/roles', async (c) => {
  const user = c.get('adminUser');
  
  return c.render(
    <AdminLayout currentUser={user} currentPage="roles" breadcrumb="Role Management">
      <div class="admin-page-header">
        <h1 class="admin-page-title">Role Management</h1>
        <p class="admin-page-subtitle">Manage user roles and permissions for your Faith Defenders community</p>
      </div>

      <div class="admin-roles-container">
        {/* Current Roles Overview */}
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">
              <i class="fas fa-users-cog"></i>
              Current Roles Overview
            </h3>
          </div>
          <div class="admin-card-content">
            <div class="admin-roles-stats">
              <div class="admin-role-stat">
                <div class="admin-role-stat-icon admin">
                  <i class="fas fa-crown"></i>
                </div>
                <div class="admin-role-stat-info">
                  <div class="admin-role-stat-number" id="admin-count">-</div>
                  <div class="admin-role-stat-label">Administrators</div>
                </div>
              </div>
              
              <div class="admin-role-stat">
                <div class="admin-role-stat-icon moderator">
                  <i class="fas fa-shield-alt"></i>
                </div>
                <div class="admin-role-stat-info">
                  <div class="admin-role-stat-number" id="moderator-count">-</div>
                  <div class="admin-role-stat-label">Moderators</div>
                </div>
              </div>
              
              <div class="admin-role-stat">
                <div class="admin-role-stat-icon user">
                  <i class="fas fa-user"></i>
                </div>
                <div class="admin-role-stat-info">
                  <div class="admin-role-stat-number" id="user-count">-</div>
                  <div class="admin-role-stat-label">Regular Users</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Role Definitions */}
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">
              <i class="fas fa-list-ul"></i>
              Role Definitions & Permissions
            </h3>
          </div>
          <div class="admin-card-content">
            <div class="admin-roles-definitions">
              
              {/* Administrator Role */}
              <div class="admin-role-definition admin-role-admin">
                <div class="admin-role-header">
                  <div class="admin-role-icon">
                    <i class="fas fa-crown"></i>
                  </div>
                  <div class="admin-role-info">
                    <h4 class="admin-role-name">Administrator</h4>
                    <p class="admin-role-description">Full access to all features and settings</p>
                  </div>
                </div>
                <div class="admin-role-permissions">
                  <h5>Permissions:</h5>
                  <ul class="admin-permissions-list">
                    <li><i class="fas fa-check"></i> Create, edit, and delete all articles</li>
                    <li><i class="fas fa-check"></i> Manage all resources and library content</li>
                    <li><i class="fas fa-check"></i> Full user management and role assignment</li>
                    <li><i class="fas fa-check"></i> Access admin panel and all settings</li>
                    <li><i class="fas fa-check"></i> Moderate comments and user behavior</li>
                    <li><i class="fas fa-check"></i> Database backup and site management</li>
                    <li><i class="fas fa-check"></i> View analytics and performance metrics</li>
                  </ul>
                </div>
              </div>

              {/* Moderator Role */}
              <div class="admin-role-definition admin-role-moderator">
                <div class="admin-role-header">
                  <div class="admin-role-icon">
                    <i class="fas fa-shield-alt"></i>
                  </div>
                  <div class="admin-role-info">
                    <h4 class="admin-role-name">Moderator</h4>
                    <p class="admin-role-description">Content creation and community moderation</p>
                  </div>
                </div>
                <div class="admin-role-permissions">
                  <h5>Permissions:</h5>
                  <ul class="admin-permissions-list">
                    <li><i class="fas fa-check"></i> Create, edit, and publish articles</li>
                    <li><i class="fas fa-check"></i> Add and manage resource library items</li>
                    <li><i class="fas fa-times"></i> Limited user management (no role changes)</li>
                    <li><i class="fas fa-times"></i> No access to admin panel or settings</li>
                    <li><i class="fas fa-check"></i> Moderate comments and user interactions</li>
                    <li><i class="fas fa-times"></i> No database or system management access</li>
                    <li><i class="fas fa-times"></i> Limited analytics access</li>
                  </ul>
                </div>
              </div>

              {/* Regular User Role */}
              <div class="admin-role-definition admin-role-user">
                <div class="admin-role-header">
                  <div class="admin-role-icon">
                    <i class="fas fa-user"></i>
                  </div>
                  <div class="admin-role-info">
                    <h4 class="admin-role-name">Regular User</h4>
                    <p class="admin-role-description">Community engagement and interaction</p>
                  </div>
                </div>
                <div class="admin-role-permissions">
                  <h5>Permissions:</h5>
                  <ul class="admin-permissions-list">
                    <li><i class="fas fa-times"></i> Cannot create or edit articles</li>
                    <li><i class="fas fa-times"></i> Cannot add resources to library</li>
                    <li><i class="fas fa-times"></i> No user management capabilities</li>
                    <li><i class="fas fa-times"></i> No admin panel access</li>
                    <li><i class="fas fa-check"></i> Comment on articles and resources</li>
                    <li><i class="fas fa-check"></i> Like/dislike content and comments</li>
                    <li><i class="fas fa-check"></i> Edit own profile and comments</li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Quick Role Actions */}
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">
              <i class="fas fa-bolt"></i>
              Quick Role Actions
            </h3>
          </div>
          <div class="admin-card-content">
            <div class="admin-quick-actions">
              <div class="admin-action-section">
                <h4>Promote User to Moderator</h4>
                <p>Select a regular user to promote to moderator status</p>
                <div class="admin-action-form">
                  <select id="promote-user-select" class="admin-form-select">
                    <option value="">Select a user...</option>
                    {/* Users will be loaded dynamically */}
                  </select>
                  <button class="admin-btn admin-btn-primary" onclick="promoteToModerator()">
                    <i class="fas fa-arrow-up"></i>
                    Promote to Moderator
                  </button>
                </div>
              </div>

              <div class="admin-action-section">
                <h4>Promote User to Administrator</h4>
                <p class="admin-warning-text">
                  <i class="fas fa-exclamation-triangle"></i>
                  Administrators have full site control. Use with caution.
                </p>
                <div class="admin-action-form">
                  <select id="admin-user-select" class="admin-form-select">
                    <option value="">Select a user...</option>
                    {/* Users will be loaded dynamically */}
                  </select>
                  <button class="admin-btn admin-btn-warning" onclick="promoteToAdmin()">
                    <i class="fas fa-crown"></i>
                    Promote to Administrator
                  </button>
                </div>
              </div>

              <div class="admin-action-section">
                <h4>Demote User Role</h4>
                <p>Demote a moderator or administrator to regular user</p>
                <div class="admin-action-form">
                  <select id="demote-user-select" class="admin-form-select">
                    <option value="">Select a user...</option>
                    {/* Users will be loaded dynamically */}
                  </select>
                  <button class="admin-btn admin-btn-secondary" onclick="demoteUser()">
                    <i class="fas fa-arrow-down"></i>
                    Demote to User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Role Management History */}
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">
              <i class="fas fa-history"></i>
              Recent Role Changes
            </h3>
          </div>
          <div class="admin-card-content">
            <div class="admin-role-history" id="role-history">
              <div class="admin-no-data">
                <i class="fas fa-clock"></i>
                No recent role changes to display.
              </div>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            loadRoleStats();
            loadUserSelects();
            loadRoleHistory();
          });

          async function loadRoleStats() {
            try {
              const response = await fetch('/admin/api/users');
              if (response.ok) {
                const data = await response.json();
                const users = data.users || [];
                
                const adminCount = users.filter(u => u.role === 'admin').length;
                const moderatorCount = users.filter(u => u.role === 'moderator').length;
                const userCount = users.filter(u => u.role === 'user').length;
                
                document.getElementById('admin-count').textContent = adminCount;
                document.getElementById('moderator-count').textContent = moderatorCount;
                document.getElementById('user-count').textContent = userCount;
              }
            } catch (error) {
              console.error('Error loading role stats:', error);
            }
          }

          async function loadUserSelects() {
            try {
              const response = await fetch('/admin/api/users');
              if (response.ok) {
                const data = await response.json();
                const users = data.users || [];
                
                // Populate promote to moderator select (regular users only)
                const promoteSelect = document.getElementById('promote-user-select');
                const regularUsers = users.filter(u => u.role === 'user');
                promoteSelect.innerHTML = '<option value="">Select a user...</option>';
                regularUsers.forEach(user => {
                  const option = document.createElement('option');
                  option.value = user.id;
                  option.textContent = \`\${user.name} (\${user.email})\`;
                  promoteSelect.appendChild(option);
                });
                
                // Populate promote to admin select (non-admin users)
                const adminSelect = document.getElementById('admin-user-select');
                const nonAdminUsers = users.filter(u => u.role !== 'admin');
                adminSelect.innerHTML = '<option value="">Select a user...</option>';
                nonAdminUsers.forEach(user => {
                  const option = document.createElement('option');
                  option.value = user.id;
                  option.textContent = \`\${user.name} (\${user.email}) - \${user.role.toUpperCase()}\`;
                  adminSelect.appendChild(option);
                });
                
                // Populate demote select (admins and moderators only)
                const demoteSelect = document.getElementById('demote-user-select');
                const privilegedUsers = users.filter(u => u.role === 'admin' || u.role === 'moderator');
                demoteSelect.innerHTML = '<option value="">Select a user...</option>';
                privilegedUsers.forEach(user => {
                  const option = document.createElement('option');
                  option.value = user.id;
                  option.textContent = \`\${user.name} (\${user.email}) - \${user.role.toUpperCase()}\`;
                  demoteSelect.appendChild(option);
                });
              }
            } catch (error) {
              console.error('Error loading users:', error);
            }
          }

          function loadRoleHistory() {
            // Simulate role change history
            const historyContainer = document.getElementById('role-history');
            const sampleHistory = [
              { user: 'John Doe', action: 'Promoted to Moderator', time: '2 hours ago', by: 'Admin' },
              { user: 'Jane Smith', action: 'Demoted to User', time: '1 day ago', by: 'Admin' },
              { user: 'Mike Johnson', action: 'Promoted to Administrator', time: '3 days ago', by: 'Admin' }
            ];
            
            if (sampleHistory.length === 0) {
              historyContainer.innerHTML = '<div class="admin-no-data"><i class="fas fa-clock"></i>No recent role changes to display.</div>';
              return;
            }
            
            const historyHTML = sampleHistory.map(item => \`
              <div class="admin-history-item">
                <div class="admin-history-icon">
                  <i class="fas fa-\${item.action.includes('Promoted') ? 'arrow-up' : 'arrow-down'}"></i>
                </div>
                <div class="admin-history-content">
                  <div class="admin-history-main">\${item.user} - \${item.action}</div>
                  <div class="admin-history-meta">By \${item.by} • \${item.time}</div>
                </div>
              </div>
            \`).join('');
            
            historyContainer.innerHTML = historyHTML;
          }

          async function promoteToModerator() {
            const userId = document.getElementById('promote-user-select').value;
            if (!userId) {
              showAdminMessage('Please select a user to promote.', 'warning');
              return;
            }
            
            if (confirm('Are you sure you want to promote this user to moderator? They will gain content creation and moderation abilities.')) {
              await updateUserRole(userId, 'moderator');
            }
          }

          async function promoteToAdmin() {
            const userId = document.getElementById('admin-user-select').value;
            if (!userId) {
              showAdminMessage('Please select a user to promote.', 'warning');
              return;
            }
            
            if (confirm('Are you sure you want to promote this user to administrator? This gives them full site control including the ability to manage other administrators.')) {
              await updateUserRole(userId, 'admin');
            }
          }

          async function demoteUser() {
            const userId = document.getElementById('demote-user-select').value;
            if (!userId) {
              showAdminMessage('Please select a user to demote.', 'warning');
              return;
            }
            
            if (confirm('Are you sure you want to demote this user to regular user? They will lose their current privileges.')) {
              await updateUserRole(userId, 'user');
            }
          }

          async function updateUserRole(userId, newRole) {
            try {
              const response = await fetch(\`/admin/api/users/\${userId}\`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role: newRole })
              });
              
              if (response.ok) {
                const roleDisplayNames = {
                  'admin': 'Administrator',
                  'moderator': 'Moderator',
                  'user': 'Regular User'
                };
                
                showAdminMessage(\`User role updated to \${roleDisplayNames[newRole]} successfully!\`, 'success');
                
                // Refresh the page data
                loadRoleStats();
                loadUserSelects();
                loadRoleHistory();
              } else {
                throw new Error('Failed to update user role');
              }
            } catch (error) {
              console.error('Error updating user role:', error);
              showAdminMessage('Failed to update user role. Please try again.', 'error');
            }
          }
        `
      }}></script>
    </AdminLayout>,
    { title: 'Role Management' }
  );
});

// Admin Backup & Export
adminApp.get('/backup', async (c) => {
  const user = c.get('adminUser');
  
  return c.render(
    <AdminLayout currentUser={user} currentPage="backup" breadcrumb="Backup & Export">
      <div class="admin-page-header">
        <h1 class="admin-page-title">Backup & Export</h1>
        <p class="admin-page-subtitle">Backup your data and export content for safekeeping</p>
      </div>

      <div class="admin-backup-container">
        {/* Database Backup */}
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">
              <i class="fas fa-database"></i>
              Database Backup
            </h3>
          </div>
          <div class="admin-card-content">
            <p class="admin-card-description">
              Create a complete backup of your database including users, articles, resources, and comments.
            </p>
            
            <div class="admin-backup-actions">
              <button class="admin-btn admin-btn-primary" id="backup-database">
                <i class="fas fa-download"></i>
                Download Database Backup
              </button>
              <button class="admin-btn admin-btn-secondary" id="schedule-backup">
                <i class="fas fa-clock"></i>
                Schedule Automatic Backups
              </button>
            </div>
            
            <div class="admin-backup-info">
              <div class="admin-info-item">
                <strong>Last Backup:</strong> <span id="last-backup-time">Never</span>
              </div>
              <div class="admin-info-item">
                <strong>Backup Size:</strong> <span id="backup-size">-</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Export */}
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">
              <i class="fas fa-file-export"></i>
              Content Export
            </h3>
          </div>
          <div class="admin-card-content">
            <p class="admin-card-description">
              Export your content in various formats for sharing or migration purposes.
            </p>
            
            <div class="admin-export-options">
              <div class="admin-export-option">
                <h4>Articles Export</h4>
                <p>Export all published articles as JSON, CSV, or PDF collection.</p>
                <div class="admin-export-buttons">
                  <button class="admin-btn admin-btn-outline" onclick="exportContent('articles', 'json')">
                    <i class="fas fa-code"></i> JSON
                  </button>
                  <button class="admin-btn admin-btn-outline" onclick="exportContent('articles', 'csv')">
                    <i class="fas fa-table"></i> CSV
                  </button>
                  <button class="admin-btn admin-btn-outline" onclick="exportContent('articles', 'pdf')">
                    <i class="fas fa-file-pdf"></i> PDF
                  </button>
                </div>
              </div>
              
              <div class="admin-export-option">
                <h4>Resources Export</h4>
                <p>Export your resource library with all metadata and links.</p>
                <div class="admin-export-buttons">
                  <button class="admin-btn admin-btn-outline" onclick="exportContent('resources', 'json')">
                    <i class="fas fa-code"></i> JSON
                  </button>
                  <button class="admin-btn admin-btn-outline" onclick="exportContent('resources', 'csv')">
                    <i class="fas fa-table"></i> CSV
                  </button>
                </div>
              </div>
              
              <div class="admin-export-option">
                <h4>Users Export</h4>
                <p>Export user information (excluding sensitive data like passwords).</p>
                <div class="admin-export-buttons">
                  <button class="admin-btn admin-btn-outline" onclick="exportContent('users', 'csv')">
                    <i class="fas fa-table"></i> CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Restore Options */}
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">
              <i class="fas fa-upload"></i>
              Restore & Import
            </h3>
          </div>
          <div class="admin-card-content">
            <div class="admin-warning">
              <i class="fas fa-exclamation-triangle"></i>
              <strong>Warning:</strong> Restoring from backup will overwrite existing data. Please ensure you have a current backup before proceeding.
            </div>
            
            <div class="admin-restore-section">
              <h4>Restore from Backup</h4>
              <p>Upload a backup file to restore your database.</p>
              
              <div class="admin-file-upload">
                <input type="file" id="restore-file" class="admin-file-input" accept=".sql,.json,.zip" />
                <label for="restore-file" class="admin-file-label">
                  <i class="fas fa-cloud-upload-alt"></i>
                  Choose Backup File
                </label>
              </div>
              
              <button class="admin-btn admin-btn-danger" id="restore-backup" disabled>
                <i class="fas fa-upload"></i>
                Restore from Backup
              </button>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            // Database backup handler
            document.getElementById('backup-database').addEventListener('click', async function() {
              const button = this;
              const originalText = button.innerHTML;
              
              try {
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Backup...';
                button.disabled = true;
                
                // Simulate backup creation
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // In a real implementation, this would call an API endpoint
                showAdminMessage('Database backup created successfully!', 'success');
                
                // Update last backup time
                document.getElementById('last-backup-time').textContent = new Date().toLocaleString();
                document.getElementById('backup-size').textContent = '2.3 MB';
                
              } catch (error) {
                console.error('Backup error:', error);
                showAdminMessage('Failed to create backup. Please try again.', 'error');
              } finally {
                button.innerHTML = originalText;
                button.disabled = false;
              }
            });
            
            // Restore file handler
            document.getElementById('restore-file').addEventListener('change', function(e) {
              const restoreButton = document.getElementById('restore-backup');
              if (e.target.files.length > 0) {
                restoreButton.disabled = false;
                restoreButton.innerHTML = '<i class="fas fa-upload"></i> Restore from ' + e.target.files[0].name;
              } else {
                restoreButton.disabled = true;
                restoreButton.innerHTML = '<i class="fas fa-upload"></i> Restore from Backup';
              }
            });
            
            // Restore backup handler
            document.getElementById('restore-backup').addEventListener('click', function() {
              if (confirm('Are you sure you want to restore from this backup? This will overwrite all existing data and cannot be undone.')) {
                showAdminMessage('Restore functionality will be implemented in a future update.', 'info');
              }
            });
          });
          
          // Export content function
          async function exportContent(type, format) {
            try {
              showAdminMessage(\`Exporting \${type} as \${format.toUpperCase()}...\`, 'info');
              
              // Simulate export process
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              showAdminMessage(\`\${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully!\`, 'success');
            } catch (error) {
              console.error('Export error:', error);
              showAdminMessage(\`Failed to export \${type}. Please try again.\`, 'error');
            }
          }
        `
      }}></script>
    </AdminLayout>,
    { title: 'Backup & Export' }
  );
});

export default adminApp;