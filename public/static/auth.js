// Authentication JavaScript

function showLogin() {
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('register-form').style.display = 'none';
  document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.auth-tab')[0].classList.add('active');
  clearMessage();
}

function showRegister() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
  document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.auth-tab')[1].classList.add('active');
  clearMessage();
}

function showMessage(message, type = 'info') {
  const messageEl = document.getElementById('auth-message');
  messageEl.textContent = message;
  messageEl.className = `auth-message ${type}`;
  messageEl.style.display = 'block';
}

function clearMessage() {
  const messageEl = document.getElementById('auth-message');
  messageEl.style.display = 'none';
}

// Login form submission
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const email = formData.get('email');
  const password = formData.get('password');
  
  try {
    showMessage('Signing in...', 'info');
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } else {
      if (data.requiresVerification && data.userId) {
        showMessage(`${data.error} Redirecting to verification...`, 'error');
        setTimeout(() => {
          window.location.href = `/verify-email?userId=${data.userId}`;
        }, 2000);
      } else {
        showMessage(data.error || 'Login failed', 'error');
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    showMessage('Network error. Please try again.', 'error');
  }
});

// Register form submission
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const name = formData.get('name');
  const email = formData.get('email');
  const password = formData.get('password');
  
  if (password.length < 6) {
    showMessage('Password must be at least 6 characters long', 'error');
    return;
  }
  
  try {
    showMessage('Creating account...', 'info');
    
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      if (data.requiresVerification && data.userId) {
        showMessage('Account created! Redirecting to email verification...', 'success');
        setTimeout(() => {
          window.location.href = `/verify-email?userId=${data.userId}`;
        }, 1500);
      } else {
        showMessage('Registration successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      }
    } else {
      showMessage(data.error || 'Registration failed', 'error');
    }
  } catch (error) {
    console.error('Registration error:', error);
    showMessage('Network error. Please try again.', 'error');
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

// Handle URL parameters for OAuth errors and messages
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');
  const message = urlParams.get('message');
  const verified = urlParams.get('verified');
  
  if (verified === 'true') {
    showMessage('Email verified successfully! You can now sign in to your account.', 'success');
    // Clean up URL without reloading page
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    return;
  }
  
  if (error) {
    let errorMessage = 'Authentication failed';
    
    switch (error) {
      case 'oauth_error':
        errorMessage = 'Google authentication was cancelled or failed';
        break;
      case 'missing_code':
        errorMessage = 'Authentication code missing from Google';
        break;
      case 'token_error':
        errorMessage = 'Failed to exchange authentication code';
        break;
      case 'user_info_error':
        errorMessage = 'Failed to get user information from Google';
        break;
      case 'user_creation_failed':
        errorMessage = 'Failed to create user account';
        break;
      case 'user_already_exists':
        errorMessage = message || 'Account already exists, please sign in instead';
        break;
      case 'oauth_callback_error':
        errorMessage = 'OAuth callback error occurred';
        break;
      default:
        errorMessage = message || 'Authentication failed';
    }
    
    showMessage(errorMessage, 'error');
    
    // Clean up URL without reloading page
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }
});