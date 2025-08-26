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
    const response = await fetch('/admin/api/stats', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
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
    const response = await fetch('/admin/api/articles', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch articles');
    }
    
    const data = await response.json();
    const tableBody = document.getElementById('articles-table');
    
    if (data.success && data.articles.length > 0) {
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
    } else {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2rem; color: #64748b;">
            No articles found. <a href="/admin/articles/new">Create your first article</a>
          </td>
        </tr>
      `;
    }
  } catch (error) {
    console.error('Error loading articles:', error);
    document.getElementById('articles-table').innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 2rem; color: #dc2626;">
          Error loading articles
        </td>
      </tr>
    `;
  }
};

window.createArticle = async function(e) {
  e.preventDefault();
  
  const form = e.target;
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
      document.getElementById('edit-title').value = article.title;
      document.getElementById('edit-excerpt').value = article.excerpt || '';
      document.getElementById('edit-content').value = article.content;
      document.getElementById('edit-published').value = article.published.toString();
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
    // Mock delete (in real implementation, call DELETE API)
    showAdminMessage('Article deleted successfully!', 'success');
    setTimeout(() => {
      loadArticles();
    }, 1000);
  } catch (error) {
    console.error('Error deleting article:', error);
    showAdminMessage('Error deleting article', 'error');
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
        html += `
          <tr>
            <td>
              <div style="font-weight: 500;">${resource.title}</div>
              <div style="font-size: 0.8rem; color: #64748b;">${resource.description || 'No description'}</div>
            </td>
            <td>
              <span class="admin-badge admin-badge-info">${resource.resource_type}</span>
            </td>
            <td>${resource.author_name}</td>
            <td>${formatDate(resource.created_at)}</td>
            <td>
              <div class="admin-table-actions">
                ${resource.url ? `<a href="${resource.url}" target="_blank" class="admin-btn admin-btn-sm admin-btn-outline">
                  <i class="fas fa-external-link-alt"></i> View
                </a>` : ''}
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
            No resources found. <a href="/admin/resources/new">Add your first resource</a>
          </td>
        </tr>
      `;
    }
  } catch (error) {
    console.error('Error loading resources:', error);
    document.getElementById('resources-table').innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 2rem; color: #dc2626;">
          Error loading resources
        </td>
      </tr>
    `;
  }
};

window.createResource = async function(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  
  const resourceData = {
    title: formData.get('title'),
    description: formData.get('description'),
    url: formData.get('url'),
    resource_type: formData.get('resource_type')
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

window.deleteResource = async function(resourceId) {
  if (!confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
    return;
  }
  
  try {
    // Mock delete (in real implementation, call DELETE API)
    showAdminMessage('Resource deleted successfully!', 'success');
    setTimeout(() => {
      loadResources();
    }, 1000);
  } catch (error) {
    console.error('Error deleting resource:', error);
    showAdminMessage('Error deleting resource', 'error');
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
    // Mock delete (in real implementation, call DELETE API)
    showAdminMessage('User deleted successfully!', 'success');
    setTimeout(() => {
      loadUsers();
    }, 1000);
  } catch (error) {
    console.error('Error deleting user:', error);
    showAdminMessage('Error deleting user', 'error');
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
      
      // Load top articles
      const topArticlesEl = document.getElementById('top-articles');
      if (topArticlesEl && analytics.topArticles) {
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
      }
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