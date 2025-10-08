// Dashboard JavaScript

let currentTab = 'overview';

function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.style.display = 'none';
  });

  // Remove active class from all tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Show selected tab
  document.getElementById(`${tabName}-tab`).style.display = 'block';

  // Add active class to selected tab button
  event.target.classList.add('active');

  currentTab = tabName;

  if (tabName === 'overview') {
    loadUserContent();
  }
}

function showMessage(message, type = 'info') {
  const messageEl = document.getElementById('dashboard-message');
  messageEl.textContent = message;
  messageEl.className = `dashboard-message ${type}`;
  messageEl.style.display = 'block';
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    messageEl.style.display = 'none';
  }, 5000);
}

async function loadUserContent() {
  try {
    // Load user's articles count and resources count
    const [articlesRes, resourcesRes] = await Promise.all([
      fetch('/api/articles', { credentials: 'include' }),
      fetch('/api/resources', { credentials: 'include' })
    ]);
    
    const articlesData = await articlesRes.json();
    const resourcesData = await resourcesRes.json();
    
    if (articlesData.success) {
      document.getElementById('user-articles-count').textContent = articlesData.articles.length;
    }
    
    if (resourcesData.success) {
      document.getElementById('user-resources-count').textContent = resourcesData.resources.length;
    }
    
    // Display recent content
    let contentHtml = '<h3>Recent Activity</h3>';
    
    if (articlesData.success && articlesData.articles.length > 0) {
      contentHtml += '<h4>Your Recent Articles</h4>';
      articlesData.articles.slice(0, 3).forEach(article => {
        contentHtml += `
          <div class="content-item">
            <h5><a href="/articles/${article.id}">${article.title}</a></h5>
            <p>${article.excerpt || 'No excerpt available'}</p>
            <small>Published: ${new Date(article.created_at).toLocaleDateString()}</small>
          </div>
        `;
      });
    }
    
    if (resourcesData.success && resourcesData.resources.length > 0) {
      contentHtml += '<h4>Your Recent Resources</h4>';
      resourcesData.resources.slice(0, 3).forEach(resource => {
        contentHtml += `
          <div class="content-item">
            <h5>${resource.title}</h5>
            <p>${resource.description || 'No description available'}</p>
            <small>Added: ${new Date(resource.created_at).toLocaleDateString()}</small>
          </div>
        `;
      });
    }
    
    if ((!articlesData.success || articlesData.articles.length === 0) && 
        (!resourcesData.success || resourcesData.resources.length === 0)) {
      contentHtml += '<p>No content yet. Start by creating your first article or adding a resource!</p>';
    }
    
    document.getElementById('user-content').innerHTML = contentHtml;
    
  } catch (error) {
    console.error('Error loading user content:', error);
    document.getElementById('user-content').innerHTML = '<p>Error loading content</p>';
  }
}



// Check URL for tab parameter
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const tab = urlParams.get('tab');

  if (tab && ['overview', 'settings'].includes(tab)) {
    // Find and click the appropriate tab button
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      if (btn.textContent.toLowerCase().includes(tab.replace('-', ' '))) {
        btn.click();
      }
    });
  } else {
    // Load overview by default
    loadUserContent();
  }
});

// Global logout function
window.logout = async function() {
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

// Change Password Functionality
document.addEventListener('DOMContentLoaded', function() {
  const changePasswordForm = document.getElementById('change-password-form');
  const confirmPasswordInput = document.getElementById('confirm-new-password');
  const newPasswordInput = document.getElementById('new-password');
  
  // Password confirmation validation
  if (confirmPasswordInput && newPasswordInput) {
    confirmPasswordInput.addEventListener('input', function() {
      const newPassword = newPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      
      if (confirmPassword && newPassword !== confirmPassword) {
        confirmPasswordInput.setCustomValidity('Passwords do not match');
      } else {
        confirmPasswordInput.setCustomValidity('');
      }
    });
  }
  
  // Handle change password form
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const messageDiv = document.getElementById('change-password-message');
      const submitButton = e.target.querySelector('button[type="submit"]');
      const formData = new FormData(e.target);
      
      const currentPassword = formData.get('currentPassword');
      const newPassword = formData.get('newPassword');
      const confirmNewPassword = formData.get('confirmNewPassword');
      
      // Validation
      if (!currentPassword) {
        showPasswordMessage(messageDiv, 'Please enter your current password.', 'error');
        return;
      }
      
      if (!newPassword || newPassword.length < 6) {
        showPasswordMessage(messageDiv, 'New password must be at least 6 characters long.', 'error');
        return;
      }
      
      if (newPassword !== confirmNewPassword) {
        showPasswordMessage(messageDiv, 'New passwords do not match.', 'error');
        return;
      }
      
      // Disable submit button
      submitButton.disabled = true;
      submitButton.textContent = 'Changing Password...';
      
      try {
        const response = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            currentPassword,
            newPassword
          }),
        });
        
        const result = await response.json();
        
        if (result.success) {
          showPasswordMessage(messageDiv, result.message, 'success');
          
          // Clear form
          changePasswordForm.reset();
        } else {
          showPasswordMessage(messageDiv, result.error || 'Failed to change password', 'error');
        }
        
      } catch (error) {
        console.error('Change password error:', error);
        showPasswordMessage(messageDiv, 'Network error. Please try again.', 'error');
      } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = 'Change Password';
      }
    });
  }
});

// Utility function to show password change messages
function showPasswordMessage(messageDiv, message, type) {
  if (!messageDiv) return;
  
  messageDiv.innerHTML = `
    <div class="message ${type === 'success' ? 'message-success' : 'message-error'}">
      ${message}
    </div>
  `;
  
  // Clear message after 5 seconds for success messages
  if (type === 'success') {
    setTimeout(() => {
      messageDiv.innerHTML = '';
    }, 5000);
  }
}