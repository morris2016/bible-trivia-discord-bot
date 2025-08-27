// Email Verification JavaScript

function showMessage(message, type = 'info') {
  const messageEl = document.getElementById('verification-message');
  messageEl.textContent = message;
  messageEl.className = `auth-message ${type}`;
  messageEl.style.display = 'block';
}

function clearMessage() {
  const messageEl = document.getElementById('verification-message');
  messageEl.style.display = 'none';
}

function setLoading(isLoading) {
  const submitBtn = document.querySelector('#verify-form button[type="submit"]');
  const resendBtn = document.getElementById('resend-btn');
  const otpInput = document.getElementById('otp-code');
  
  submitBtn.disabled = isLoading;
  resendBtn.disabled = isLoading;
  otpInput.disabled = isLoading;
  
  if (isLoading) {
    submitBtn.textContent = 'Verifying...';
  } else {
    submitBtn.textContent = 'Verify Email';
  }
}

// Handle OTP input formatting
document.getElementById('otp-code').addEventListener('input', function(e) {
  let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
  if (value.length > 6) {
    value = value.substring(0, 6);
  }
  e.target.value = value;
  
  // Auto-submit when 6 digits are entered
  if (value.length === 6) {
    const form = document.getElementById('verify-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn.disabled) {
      form.dispatchEvent(new Event('submit'));
    }
  }
});

// Handle OTP paste
document.getElementById('otp-code').addEventListener('paste', function(e) {
  setTimeout(() => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 6) {
      value = value.substring(0, 6);
    }
    e.target.value = value;
    
    if (value.length === 6) {
      const form = document.getElementById('verify-form');
      const submitBtn = form.querySelector('button[type="submit"]');
      if (!submitBtn.disabled) {
        form.dispatchEvent(new Event('submit'));
      }
    }
  }, 100);
});

// Handle verification form submission
document.getElementById('verify-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  clearMessage();
  
  const userId = document.getElementById('user-id').value;
  const otpCode = document.getElementById('otp-code').value;
  
  if (!userId) {
    showMessage('User ID is missing. Please try registering again.', 'error');
    return;
  }
  
  if (!otpCode || otpCode.length !== 6) {
    showMessage('Please enter a valid 6-digit verification code.', 'error');
    return;
  }
  
  setLoading(true);
  
  try {
    const response = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: parseInt(userId),
        otpCode: otpCode
      }),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('Email verified successfully! Redirecting to login...', 'success');
      setTimeout(() => {
        window.location.href = '/login?verified=true';
      }, 2000);
    } else {
      showMessage(data.error || 'Verification failed. Please try again.', 'error');
    }
  } catch (error) {
    console.error('Verification error:', error);
    showMessage('Network error. Please check your connection and try again.', 'error');
  } finally {
    setLoading(false);
  }
});

// Handle resend verification code
document.getElementById('resend-btn').addEventListener('click', async function(e) {
  e.preventDefault();
  clearMessage();
  
  const userId = document.getElementById('user-id').value;
  
  if (!userId) {
    showMessage('User ID is missing. Please try registering again.', 'error');
    return;
  }
  
  const btn = e.target;
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Sending...';
  
  try {
    const response = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: parseInt(userId)
      }),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('New verification code sent! Please check your email.', 'success');
      // Clear the OTP input
      document.getElementById('otp-code').value = '';
      document.getElementById('otp-code').focus();
    } else {
      showMessage(data.error || 'Failed to resend verification code.', 'error');
    }
  } catch (error) {
    console.error('Resend error:', error);
    showMessage('Network error. Please try again.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});

// Handle URL parameters
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('userId');
  
  if (userId) {
    document.getElementById('user-id').value = userId;
  }
  
  // Focus on OTP input
  document.getElementById('otp-code').focus();
});