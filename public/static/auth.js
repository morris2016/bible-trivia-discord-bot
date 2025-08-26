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
      showMessage(data.error || 'Login failed', 'error');
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
      showMessage('Registration successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
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