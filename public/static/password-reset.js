// Password Reset JavaScript

// Format OTP input to only accept numbers and auto-submit when complete
document.addEventListener('DOMContentLoaded', function() {
  const otpInput = document.getElementById('otp-code');
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  
  // Auto-format OTP code input
  if (otpInput) {
    otpInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
      if (value.length > 6) {
        value = value.substring(0, 6);
      }
      e.target.value = value;
    });
  }
  
  // Password confirmation validation
  if (confirmPasswordInput) {
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
});

// Handle forgot password form (request reset code)
const forgotPasswordForm = document.getElementById('forgot-password-form');
if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const messageDiv = document.getElementById('forgot-password-message');
    const submitButton = e.target.querySelector('button[type="submit"]');
    const formData = new FormData(e.target);
    
    const email = formData.get('email');
    
    if (!email) {
      showMessage(messageDiv, 'Please enter your email address.', 'error');
      return;
    }
    
    // Disable submit button
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    
    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        showMessage(messageDiv, result.message, 'success');
        
        // If we got a userId, redirect to reset page
        if (result.userId) {
          setTimeout(() => {
            window.location.href = `/reset-password?userId=${result.userId}`;
          }, 2000);
        }
      } else {
        showMessage(messageDiv, result.error || 'Failed to send reset code', 'error');
      }
      
    } catch (error) {
      console.error('Password reset request error:', error);
      showMessage(messageDiv, 'Network error. Please try again.', 'error');
    } finally {
      // Re-enable submit button
      submitButton.disabled = false;
      submitButton.textContent = 'Send Reset Code';
    }
  });
}

// Handle reset password form (verify code and set new password)
const resetPasswordForm = document.getElementById('reset-password-form');
if (resetPasswordForm) {
  resetPasswordForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const messageDiv = document.getElementById('reset-password-message');
    const submitButton = e.target.querySelector('button[type="submit"]');
    const formData = new FormData(e.target);
    
    const userId = document.getElementById('user-id').value;
    const otpCode = formData.get('otpCode');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    
    // Validation
    if (!otpCode || otpCode.length !== 6) {
      showMessage(messageDiv, 'Please enter the 6-digit reset code.', 'error');
      return;
    }
    
    if (!newPassword || newPassword.length < 6) {
      showMessage(messageDiv, 'New password must be at least 6 characters long.', 'error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showMessage(messageDiv, 'Passwords do not match.', 'error');
      return;
    }
    
    // Disable submit button
    submitButton.disabled = true;
    submitButton.textContent = 'Resetting Password...';
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: parseInt(userId),
          otpCode,
          newPassword
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        showMessage(messageDiv, result.message, 'success');
        
        // Redirect to login after success
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        showMessage(messageDiv, result.error || 'Failed to reset password', 'error');
      }
      
    } catch (error) {
      console.error('Password reset error:', error);
      showMessage(messageDiv, 'Network error. Please try again.', 'error');
    } finally {
      // Re-enable submit button
      submitButton.disabled = false;
      submitButton.textContent = 'Reset Password';
    }
  });
}

// Utility function to show messages
function showMessage(messageDiv, message, type) {
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