import { Hono } from 'hono';
import { adminRenderer, AdminLayout } from './admin-renderer';
import { getLoggedInUser } from './auth';
import { getArticles, getResources } from './database-mock';
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
        __html: `document.addEventListener('DOMContentLoaded', loadDashboardData);`
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
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="articles-table">
                <tr>
                  <td colspan="5" style="text-align: center; padding: 2rem;">
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
        __html: `document.addEventListener('DOMContentLoaded', loadArticles);`
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
              <textarea name="content" class="admin-form-textarea large" rows="15" 
                placeholder="Write your article content here..." required></textarea>
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
              <textarea name="content" class="admin-form-textarea large" rows="15" id="edit-content"
                placeholder="Write your article content here..." required></textarea>
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
          loadArticleForEdit(${id});
          const form = document.getElementById('edit-article-form');
          form.addEventListener('submit', updateArticle);
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
                  <th>Author</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="resources-table">
                <tr>
                  <td colspan="5" style="text-align: center; padding: 2rem;">
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
        __html: `document.addEventListener('DOMContentLoaded', loadResources);`
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
          <form id="resource-form" class="admin-form">
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Title</label>
                <input type="text" name="title" class="admin-form-input" required />
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Type</label>
                <select name="resource_type" class="admin-form-select">
                  <option value="link">Website/Link</option>
                  <option value="book">Book</option>
                  <option value="video">Video</option>
                  <option value="podcast">Podcast</option>
                  <option value="study">Study Guide</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">URL</label>
              <input type="url" name="url" class="admin-form-input" 
                placeholder="https://example.com" />
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">Description</label>
              <textarea name="description" class="admin-form-textarea" rows="4" 
                placeholder="Describe this resource and why it's helpful..."></textarea>
            </div>

            <div class="admin-actions">
              <a href="/admin/resources" class="admin-btn admin-btn-outline">Cancel</a>
              <button type="submit" class="admin-btn admin-btn-primary">
                <i class="fas fa-save"></i> Add Resource
              </button>
            </div>
          </form>
        </div>
      </div>

      <div id="admin-message"></div>

      <script dangerouslySetInnerHTML={{
        __html: `
        document.addEventListener('DOMContentLoaded', function() {
          const form = document.getElementById('resource-form');
          form.addEventListener('submit', createResource);
        });
        `
      }}></script>
    </AdminLayout>,
    { title: 'New Resource' }
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
        __html: `document.addEventListener('DOMContentLoaded', loadUsers);`
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
          <div class="admin-stat-number" id="analytics-pageviews">1,250</div>
          <div class="admin-stat-change positive">+12% from last month</div>
        </div>

        <div class="admin-stat-card">
          <div class="admin-stat-header">
            <div class="admin-stat-title">Average Read Time</div>
            <div class="admin-stat-icon green">
              <i class="fas fa-clock"></i>
            </div>
          </div>
          <div class="admin-stat-number" id="analytics-readtime">4:30</div>
          <div class="admin-stat-change positive">+8% from last month</div>
        </div>

        <div class="admin-stat-card">
          <div class="admin-stat-header">
            <div class="admin-stat-title">User Growth</div>
            <div class="admin-stat-icon yellow">
              <i class="fas fa-user-plus"></i>
            </div>
          </div>
          <div class="admin-stat-number" id="analytics-growth">15</div>
          <div class="admin-stat-change positive">+25% from last month</div>
        </div>

        <div class="admin-stat-card">
          <div class="admin-stat-header">
            <div class="admin-stat-title">Content Engagement</div>
            <div class="admin-stat-icon red">
              <i class="fas fa-heart"></i>
            </div>
          </div>
          <div class="admin-stat-number" id="analytics-engagement">87%</div>
          <div class="admin-stat-change positive">+5% from last month</div>
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
            <div id="user-growth-chart">Chart placeholder</div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `document.addEventListener('DOMContentLoaded', loadAnalytics);`
      }}></script>
    </AdminLayout>,
    { title: 'Analytics' }
  );
});

export default adminApp;