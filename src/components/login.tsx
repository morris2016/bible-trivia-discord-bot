import { Context } from 'hono'
import { Navigation } from './navigation'

interface LoginProps {
  c: Context
}

  // Login Page Component
  export async function Login({ c }: LoginProps) {
    const user = await getLoggedInUser(c)

    if (user) {
      // Redirect logic would be handled in the route
      return null
    }

    return (
      <div className="min-h-screen">
        <Navigation c={c} user={user} />
        {/* Enhanced Professional Styles */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Enhanced Professional Auth Page Styles */
  
            * {
              box-sizing: border-box;
            }
  
            /* Root variables for consistent theming */
            :root {
              --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              --accent-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
              --glass-bg: rgba(255, 255, 255, 0.1);
              --glass-border: rgba(255, 255, 255, 0.2);
              --text-primary: #1f2937;
              --text-secondary: #6b7280;
              --text-white: #ffffff;
              --shadow-light: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              --shadow-medium: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
              --shadow-heavy: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
              --border-radius: 1rem;
              --border-radius-sm: 0.75rem;
              --border-radius-xs: 0.5rem;
            }
  
            /* Make the entire auth page fit in one viewport */
            .professional-auth-wrapper {
              min-height: 100vh;
              display: flex;
              align-items: flex-start;
              justify-content: center;
              padding: 2rem;
              padding-top: 6rem;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
              position: relative;
              overflow: hidden;
            }
  
            /* Animated background elements */
            .professional-auth-wrapper::before {
              content: '';
              position: absolute;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
              animation: rotate 20s linear infinite;
              pointer-events: none;
            }
  
            @keyframes rotate {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
  
            .auth-form-section {
              flex: 1;
              max-width: 500px;
              z-index: 2;
              position: relative;
            }
  
            .auth-visual-section {
              flex: 1;
              max-width: 600px;
              z-index: 2;
              position: relative;
            }
  
            /* Enhanced Form Container */
            .auth-form-box {
              background: rgba(255, 255, 255, 0.95);
              border-radius: var(--border-radius);
              padding: 3rem;
              box-shadow: var(--shadow-heavy), 0 0 0 1px rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.2);
              backdrop-filter: blur(20px);
              position: relative;
              overflow: hidden;
            }
  
            .auth-form-box::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 1px;
              background: linear-gradient(90deg, transparent 0%, rgba(102, 126, 234, 0.5) 50%, transparent 100%);
            }
  
            /* Enhanced Tab Switcher */
            .auth-tab-switcher {
              display: flex;
              margin-bottom: 2.5rem;
              background: rgba(0, 0, 0, 0.05);
              border-radius: var(--border-radius-xs);
              padding: 0.375rem;
              position: relative;
              border: 1px solid rgba(0, 0, 0, 0.1);
            }
  
            .auth-tab-btn {
              flex: 1;
              padding: 1rem 1.5rem;
              border: none;
              background: transparent;
              border-radius: calc(var(--border-radius-xs) - 0.125rem);
              font-size: 1rem;
              font-weight: 600;
              color: var(--text-secondary);
              cursor: pointer;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              position: relative;
              z-index: 2;
              letter-spacing: 0.025em;
            }
  
            .auth-tab-btn.active {
              background: white;
              color: var(--text-primary);
              box-shadow: var(--shadow-light);
              transform: translateY(-1px);
            }
  
            .auth-tab-btn:hover:not(.active) {
              background: rgba(255, 255, 255, 0.1);
              color: var(--text-primary);
            }
  
            .auth-tab-indicator {
              position: absolute;
              top: 0.375rem;
              left: 0.375rem;
              width: calc(50% - 0.75rem);
              height: calc(100% - 0.75rem);
              background: var(--primary-gradient);
              border-radius: calc(var(--border-radius-xs) - 0.125rem);
              transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
              z-index: 1;
            }

            /* Tab indicator animation for signup tab */
            .auth-tab-switcher:has(.auth-tab-btn[data-tab="signup"].active) .auth-tab-indicator {
              transform: translateX(100%);
            }
  
            /* Enhanced Form Headers */
            .auth-form-header {
              text-align: center;
              margin-bottom: 2.5rem;
            }
  
            .auth-form-header h2 {
              font-size: 2rem;
              font-weight: 800;
              color: var(--text-primary);
              margin-bottom: 0.75rem;
              letter-spacing: -0.025em;
              background: linear-gradient(135deg, #1f2937 0%, #4b5563 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
  
            .auth-form-header p {
              color: var(--text-secondary);
              font-size: 1.125rem;
              line-height: 1.6;
              font-weight: 400;
            }
  
            /* Enhanced OAuth Buttons */
            .oauth-button {
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 1rem;
              padding: 1rem 1.5rem;
              border: 2px solid #e5e7eb;
              border-radius: var(--border-radius-xs);
              background: white;
              color: #374151;
              font-size: 1rem;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              margin-bottom: 1.5rem;
              position: relative;
              overflow: hidden;
            }
  
            .oauth-button::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
              transition: left 0.6s;
            }
  
            .oauth-button:hover::before {
              left: 100%;
            }
  
            .oauth-button:hover {
              border-color: #4285f4;
              box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);
              transform: translateY(-2px);
            }
  
            .oauth-icon {
              width: 1.25rem;
              height: 1.25rem;
            }
  
            /* Enhanced Form Elements */
            .form-field-group {
              margin-bottom: 2rem;
            }
  
            .form-label {
              display: block;
              font-size: 0.875rem;
              font-weight: 600;
              color: var(--text-primary);
              margin-bottom: 0.75rem;
              letter-spacing: 0.025em;
            }
  
            .label-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 0.75rem;
            }
  
            .form-link {
              color: #667eea;
              text-decoration: none;
              font-size: 0.875rem;
              font-weight: 600;
              transition: all 0.2s ease;
              position: relative;
            }
  
            .form-link::after {
              content: '';
              position: absolute;
              bottom: -2px;
              left: 0;
              width: 0;
              height: 2px;
              background: #667eea;
              transition: width 0.3s ease;
            }
  
            .form-link:hover::after {
              width: 100%;
            }
  
            .form-link:hover {
              color: #5a67d8;
            }
  
            .input-wrapper {
              position: relative;
            }
  
            .input-icon {
              position: absolute;
              left: 1rem;
              top: 50%;
              transform: translateY(-50%);
              width: 1.25rem;
              height: 1.25rem;
              color: #9ca3af;
              transition: all 0.3s ease;
              pointer-events: none;
              z-index: 1;
            }
  
            .form-input {
              width: 100%;
              padding: 1rem 1rem 1rem 3rem;
              border: 2px solid #e5e7eb;
              border-radius: var(--border-radius-xs);
              font-size: 1rem;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              background: white;
              outline: none;
              font-weight: 500;
            }
  
            .form-input:focus {
              border-color: #667eea;
              box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
              transform: translateY(-1px);
            }
  
            .form-input:focus + .input-icon {
              color: #667eea;
              transform: translateY(-50%) scale(1.1);
            }
  
            .password-toggle {
              position: absolute;
              right: 1rem;
              top: 50%;
              transform: translateY(-50%);
              background: none;
              border: none;
              color: #9ca3af;
              cursor: pointer;
              padding: 0.5rem;
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 2;
              border-radius: 50%;
              transition: all 0.3s ease;
            }
  
            .password-toggle:hover {
              color: #667eea;
              background: rgba(102, 126, 234, 0.1);
            }
  
            .eye-icon {
              width: 1.25rem;
              height: 1.25rem;
            }
  
            /* Enhanced Submit Button */
            .submit-button {
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 0.75rem;
              padding: 1.25rem 2rem;
              border: none;
              border-radius: var(--border-radius-xs);
              background: var(--primary-gradient);
              color: white;
              font-size: 1rem;
              font-weight: 700;
              cursor: pointer;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              margin-bottom: 1.5rem;
              position: relative;
              overflow: hidden;
              letter-spacing: 0.025em;
              text-transform: uppercase;
            }
  
            .submit-button::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
              transition: left 0.6s;
            }
  
            .submit-button:hover::before {
              left: 100%;
            }
  
            .submit-button:hover {
              transform: translateY(-3px);
              box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
            }
  
            .submit-button:active {
              transform: translateY(-1px);
            }
  
            .submit-icon {
              width: 1.25rem;
              height: 1.25rem;
            }
  
            /* Enhanced Visual Section */
            .visual-content {
              padding: 4rem 3rem;
              text-align: center;
              position: relative;
              z-index: 2;
            }
  
            .visual-header h1 {
              font-size: 3rem;
              font-weight: 900;
              color: white;
              margin-bottom: 1.5rem;
              text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
              line-height: 1.1;
              letter-spacing: -0.05em;
              background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
  
            .visual-header p {
              font-size: 1.25rem;
              color: rgba(255, 255, 255, 0.9);
              line-height: 1.7;
              max-width: 500px;
              margin: 0 auto;
              font-weight: 400;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
  
            /* Enhanced Background Elements */
            .visual-background {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              overflow: hidden;
              border-radius: var(--border-radius);
            }
  
            .gradient-orb {
              position: absolute;
              border-radius: 50%;
              filter: blur(60px);
              opacity: 0.6;
              animation: float 6s ease-in-out infinite;
            }
  
            .gradient-orb-1 {
              width: 300px;
              height: 300px;
              background: var(--primary-gradient);
              top: 10%;
              left: 10%;
              animation-delay: 0s;
            }
  
            .gradient-orb-2 {
              width: 200px;
              height: 200px;
              background: var(--secondary-gradient);
              top: 50%;
              right: 15%;
              animation-delay: 2s;
            }
  
            .gradient-orb-3 {
              width: 250px;
              height: 250px;
              background: var(--accent-gradient);
              bottom: 15%;
              left: 20%;
              animation-delay: 4s;
            }
  
            @keyframes float {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-20px) rotate(180deg); }
            }
  
            /* Enhanced Trust Indicators */
            .trust-indicators {
              margin-top: 3rem;
              padding: 2rem 0;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
  
            .trust-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 1.5rem;
            }
  
            .trust-item {
              display: flex;
              align-items: center;
              gap: 0.75rem;
              font-size: 1rem;
              color: rgba(255, 255, 255, 0.9);
              justify-content: center;
              padding: 1rem;
              background: rgba(255, 255, 255, 0.05);
              border-radius: var(--border-radius-xs);
              border: 1px solid rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
              transition: all 0.3s ease;
            }
  
            .trust-item:hover {
              background: rgba(255, 255, 255, 0.1);
              transform: translateY(-2px);
            }
  
            .trust-icon {
              width: 1.25rem;
              height: 1.25rem;
              color: #10b981;
              flex-shrink: 0;
            }
  
            /* Enhanced Form Footer */
            .auth-form-footer {
              text-align: center;
              margin-top: 2rem;
              padding-top: 2rem;
              border-top: 1px solid #e5e7eb;
            }
  
            .auth-form-footer p {
              color: var(--text-secondary);
              font-size: 1rem;
              margin: 0;
            }
  
            .text-link {
              background: none;
              border: none;
              color: #667eea;
              text-decoration: none;
              font-size: 1rem;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
              position: relative;
            }
  
            .text-link:hover {
              color: #5a67d8;
            }
  
            /* Enhanced Message Container */
            .auth-message-container {
              margin-top: 1.5rem;
              padding: 1rem;
              border-radius: var(--border-radius-xs);
              font-size: 0.875rem;
              font-weight: 600;
              text-align: center;
              border: 2px solid #fecaca;
              background: #fef2f2;
              color: #dc2626;
            }

            /* Form Container Visibility */
            .auth-form-container {
              display: none;
            }

            .auth-form-container.active {
              display: block;
            }
  
            /* Responsive Design */
            @media (max-width: 1024px) {
              .professional-auth-wrapper {
                flex-direction: column;
                padding: 1.5rem;
              }

              .auth-form-section {
                padding-top: 2rem;
                width: 100%;
              }

              .auth-form-box {
                width: 100%;
                margin: 0 auto;
              }
            }
  
              .auth-form-section,
              .auth-visual-section {
                flex: none;
                max-width: 100%;
              }
  
              .visual-header h1 {
                font-size: 2.5rem;
              }
            }
  
            @media (max-width: 768px) {
              .professional-auth-wrapper {
                padding: 1rem;
              }
  
              .auth-form-box {
                padding: 2rem;
              }
  
              .auth-form-header h2 {
                font-size: 1.75rem;
              }
  
              .visual-header h1 {
                font-size: 2rem;
              }
  
              .trust-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 1rem;
              }
            }
  
            @media (max-width: 480px) {
              .professional-auth-wrapper {
                padding: 0.5rem;
              }
  
              .auth-form-box {
                padding: 1.5rem;
              }
  
              .auth-form-header {
                margin-bottom: 2rem;
              }
  
              .auth-form-header h2 {
                font-size: 1.5rem;
              }
  
              .auth-tab-btn {
                padding: 0.875rem 1rem;
                font-size: 0.875rem;
              }
  
              .visual-header h1 {
                font-size: 1.75rem;
              }
  
              .visual-header p {
                font-size: 1rem;
              }
  
              .trust-grid {
                grid-template-columns: 1fr;
                gap: 0.75rem;
              }
  
              .trust-item {
                padding: 0.75rem;
                font-size: 0.875rem;
              }
            }
  
            /* Loading Animation */
            .submit-button:disabled {
              opacity: 0.7;
              cursor: not-allowed;
              transform: none;
            }
  
            /* Focus Management */
            .auth-tab-btn:focus,
            .oauth-button:focus,
            .form-input:focus,
            .password-toggle:focus,
            .submit-button:focus,
            .text-link:focus {
              outline: 2px solid #667eea;
              outline-offset: 2px;
            }
  
            /* High contrast mode support */
            @media (prefers-contrast: high) {
              .auth-form-box {
                background: white;
                border: 2px solid #1f2937;
              }
  
              .auth-tab-btn.active {
                background: #1f2937;
                color: white;
              }
            }
  
            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
              * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
              }
            }
          `
        }} />
  
        {/* Service Worker Registration */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                  console.log('Service Worker registered successfully:', registration.scope);
                })
                .catch(function(error) {
                  console.log('Service Worker registration failed:', error);
                });
              });
            }

            // Global function for tab switching
            window.switchAuthTab = function(tabName) {
              if (window.professionalAuth) {
                window.professionalAuth.switchTab(tabName);
              } else {
                // Fallback if professional auth not initialized yet
                document.querySelectorAll('.auth-tab-btn').forEach(btn => {
                  btn.classList.remove('active');
                });
                document.querySelector(\`[data-tab="\${tabName}"]\`).classList.add('active');

                document.querySelectorAll('.auth-form-container').forEach(container => {
                  container.classList.remove('active');
                });
                document.getElementById(\`\${tabName}-form-container\`).classList.add('active');
              }
            };

            // Global function for password toggle
            window.togglePassword = function(inputId) {
              const input = document.getElementById(inputId);
              if (input) {
                const type = input.type === 'password' ? 'text' : 'password';
                input.type = type;
              }
            };

            // Password confirmation validation
            window.validatePasswordConfirmation = function() {
              const password = document.getElementById('signup-password');
              const confirmPassword = document.getElementById('signup-password-confirm');

              if (!password || !confirmPassword) return true;

              const passwordValue = password.value;
              const confirmValue = confirmPassword.value;

              // Clear previous error
              const existingError = confirmPassword.parentNode.querySelector('.password-match-error');
              if (existingError) {
                existingError.remove();
              }

              if (confirmValue && passwordValue !== confirmValue) {
                // Show error
                const errorDiv = document.createElement('div');
                errorDiv.className = 'password-match-error';
                errorDiv.textContent = 'Passwords do not match';
                errorDiv.style.cssText = 'color: #ef4444; font-size: 0.875rem; margin-top: 0.5rem; font-weight: 500;';
                confirmPassword.parentNode.appendChild(errorDiv);
                confirmPassword.style.borderColor = '#ef4444';
                return false;
              } else if (confirmValue && passwordValue === confirmValue) {
                // Clear error styling
                confirmPassword.style.borderColor = '';
                return true;
              }

              return true;
            };

            // Real-time password confirmation validation
            document.addEventListener('DOMContentLoaded', function() {
              const confirmPassword = document.getElementById('signup-password-confirm');
              if (confirmPassword) {
                confirmPassword.addEventListener('input', window.validatePasswordConfirmation);
                confirmPassword.addEventListener('blur', window.validatePasswordConfirmation);
              }

              // Handle signin form submission
              const signinForm = document.getElementById('signin-form');
              if (signinForm) {
                signinForm.addEventListener('submit', async function(e) {
                  e.preventDefault();

                  const email = document.getElementById('signin-email').value;
                  const password = document.getElementById('signin-password').value;
                  const rememberMe = document.querySelector('#signin-form input[type="checkbox"]').checked;

                  try {
                    const response = await fetch('/api/auth/login', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        email: email,
                        password: password,
                        rememberMe: rememberMe
                      })
                    });

                    const result = await response.json();

                    if (result.success) {
                      // Redirect to intended destination or referrer
                      const urlParams = new URLSearchParams(window.location.search);
                      const redirectTo = urlParams.get('redirect') || document.referrer || '/';
                      window.location.href = redirectTo;
                    } else {
                      showAuthMessage(result.error || 'Login failed', 'error');
                    }
                  } catch (error) {
                    console.error('Login error:', error);
                    showAuthMessage('Network error. Please try again.', 'error');
                  }
                });
              }

              // Handle signup form submission
              const signupForm = document.getElementById('signup-form');
              if (signupForm) {
                signupForm.addEventListener('submit', async function(e) {
                  e.preventDefault();

                  const name = document.getElementById('signup-name').value;
                  const email = document.getElementById('signup-email').value;
                  const password = document.getElementById('signup-password').value;
                  const passwordConfirm = document.getElementById('signup-password-confirm').value;

                  if (password !== passwordConfirm) {
                    showAuthMessage('Passwords do not match', 'error');
                    return;
                  }

                  try {
                    const response = await fetch('/api/auth/register', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        name: name,
                        email: email,
                        password: password
                      })
                    });

                    const result = await response.json();

                    if (result.success) {
                      showAuthMessage('Account created successfully! Please check your email to verify your account.', 'success');
                      // Switch to signin tab after successful registration
                      setTimeout(() => {
                        switchAuthTab('signin');
                      }, 2000);
                    } else {
                      showAuthMessage(result.error || 'Registration failed', 'error');
                    }
                  } catch (error) {
                    console.error('Registration error:', error);
                    showAuthMessage('Network error. Please try again.', 'error');
                  }
                });
              }
            });

            // Function to show auth messages
            function showAuthMessage(message, type = 'error') {
              const messageContainer = document.getElementById('auth-message');
              if (messageContainer) {
                messageContainer.textContent = message;
                messageContainer.className = type === 'success'
                  ? 'auth-message-container success'
                  : 'auth-message-container error';
                messageContainer.style.display = 'block';

                // Auto-hide success messages after 5 seconds
                if (type === 'success') {
                  setTimeout(() => {
                    messageContainer.style.display = 'none';
                  }, 5000);
                }
              }
            }
          `
        }}></script>

      {/* Professional Single-Page Authentication */}
      <div className="professional-auth-wrapper">
        {/* Left Side - Form Section */}
        <div className="auth-form-section">
          <div className="auth-form-inner">
            {/* Form Container */}
            <div className="auth-form-box">
              {/* Tab Switcher */}
              <div className="auth-tab-switcher">
                <button className="auth-tab-btn active" data-tab="signin" onclick="switchAuthTab('signin')">
                  Sign In
                </button>
                <button className="auth-tab-btn" data-tab="signup" onclick="switchAuthTab('signup')">
                  Sign Up
                </button>
                <div className="auth-tab-indicator"></div>
              </div>

              {/* Sign In Form */}
              <div id="signin-form-container" className="auth-form-container active">
                <div className="auth-form-header">
                  <h2>Welcome back</h2>
                  <p>Enter your credentials to access your account</p>
                </div>

                {/* Google OAuth Button */}
                <button className="oauth-button google-oauth" onclick="window.location.href='/auth/google/login'">
                  <svg className="oauth-icon" viewBox="0 0 24 24">
                    <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                {/* Divider */}
                <div className="auth-divider">
                  <span>or</span>
                </div>

                {/* Email/Password Form */}
                <form id="signin-form" className="professional-auth-form">
                  <div className="form-field-group">
                    <label className="form-label" htmlFor="signin-email">
                      Email address
                    </label>
                    <div className="input-wrapper">
                      <svg className="input-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      <input
                        type="email"
                        id="signin-email"
                        name="email"
                        className="form-input"
                        placeholder="name@example.com"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="form-field-group">
                    <div className="label-row">
                      <label className="form-label" htmlFor="signin-password">
                        Password
                      </label>
                      <a href="/forgot-password" className="form-link">
                        Forgot password?
                      </a>
                    </div>
                    <div className="input-wrapper">
                      <svg className="input-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <input
                        type="password"
                        id="signin-password"
                        name="password"
                        className="form-input"
                        placeholder="Enter your password"
                        required
                        autoComplete="current-password"
                      />
                      <button type="button" className="password-toggle" onclick="togglePassword('signin-password')">
                        <svg className="eye-icon" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="form-checkbox-group">
                    <label className="checkbox-label">
                      <input type="checkbox" className="form-checkbox" />
                      <span>Remember me for 30 days</span>
                    </label>
                  </div>

                  <button type="submit" className="submit-button">
                    <span>Sign In</span>
                    <svg className="submit-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H6a1 1 0 100 2h4.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </form>

                {/* Sign In Footer */}
                <div className="auth-form-footer">
                  <p>Don't have an account? <button className="text-link" onclick="switchAuthTab('signup')">Sign up for free</button></p>
                </div>
              </div>

              {/* Sign Up Form */}
              <div id="signup-form-container" className="auth-form-container">
                <div className="auth-form-header">
                  <h2>Create your account</h2>
                  <p>Join our community of faith defenders</p>
                </div>

                {/* Google OAuth Button */}
                <button className="oauth-button google-oauth" onclick="window.location.href='/auth/google/login?signup=true'">
                  <svg className="oauth-icon" viewBox="0 0 24 24">
                    <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                {/* Divider */}
                <div className="auth-divider">
                  <span>or</span>
                </div>

                {/* Registration Form */}
                <form id="signup-form" className="professional-auth-form">
                  <div className="form-field-group">
                    <label className="form-label" htmlFor="signup-name">
                      Full name
                    </label>
                    <div className="input-wrapper">
                      <svg className="input-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <input
                        type="text"
                        id="signup-name"
                        name="name"
                        className="form-input"
                        placeholder="John Doe"
                        required
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  <div className="form-field-group">
                    <label className="form-label" htmlFor="signup-email">
                      Email address
                    </label>
                    <div className="input-wrapper">
                      <svg className="input-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      <input
                        type="email"
                        id="signup-email"
                        name="email"
                        className="form-input"
                        placeholder="name@example.com"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="form-field-group">
                    <label className="form-label" htmlFor="signup-password">
                      Password
                    </label>
                    <div className="input-wrapper">
                      <svg className="input-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <input
                        type="password"
                        id="signup-password"
                        name="password"
                        className="form-input"
                        placeholder="Create a strong password"
                        required
                        minLength={8}
                        autoComplete="new-password"
                      />
                      <button type="button" className="password-toggle" onclick="togglePassword('signup-password')">
                        <svg className="eye-icon" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <div className="password-strength">
                      <div className="strength-bar">
                        <div className="strength-fill"></div>
                      </div>
                      <span className="strength-text">Password strength</span>
                    </div>
                  </div>

                  <div className="form-field-group">
                    <label className="form-label" htmlFor="signup-password-confirm">
                      Confirm Password
                    </label>
                    <div className="input-wrapper">
                      <svg className="input-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <input
                        type="password"
                        id="signup-password-confirm"
                        name="password_confirm"
                        className="form-input"
                        placeholder="Confirm your password"
                        required
                        minLength={8}
                        autoComplete="new-password"
                      />
                      <button type="button" className="password-toggle" onclick="togglePassword('signup-password-confirm')">
                        <svg className="eye-icon" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="form-checkbox-group">
                    <label className="checkbox-label">
                      <input type="checkbox" className="form-checkbox" required />
                      <span>I agree to the <a href="/terms" className="text-link">Terms</a> and <a href="/privacy" className="text-link">Privacy Policy</a></span>
                    </label>
                  </div>

                  <button type="submit" className="submit-button">
                    <span>Create Account</span>
                    <svg className="submit-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H6a1 1 0 100 2h4.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </form>

                {/* Sign Up Footer */}
                <div className="auth-form-footer">
                  <p>Already have an account? <button className="text-link" onclick="switchAuthTab('signin')">Sign in</button></p>
                </div>
              </div>

              {/* Message Container */}
              <div id="auth-message" className="auth-message-container"></div>
            </div>

            {/* Enhanced Trust Indicators */}
            <div className="trust-indicators">
              <div className="trust-grid">
                <div className="trust-item">
                  <svg className="trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Secure & Encrypted</span>
                </div>
                <div className="trust-item">
                  <svg className="trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <span>Trusted Community</span>
                </div>
                <div className="trust-item">
                  <svg className="trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 2H21l-3 6 3 6h-8.5l-1-2H5a2 2 0 00-2 2v4zm9-13.5V9" />
                  </svg>
                  <span>Faith-Based Platform</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Enhanced Visual Section */}
        <div className="auth-visual-section">
          <div className="visual-content">
            <div className="visual-header">
              <h1>Welcome to Faith Defenders</h1>
              <p>Strengthening faith through community, wisdom, and spiritual growth</p>
            </div>

            {/* Feature Highlights */}
            <div className="feature-cards">
              <div className="feature-card">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3>Verified Community</h3>
                <p>Connect with like-minded believers in a safe, moderated environment</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3>Biblical Resources</h3>
                <p>Access thousands of study materials, devotionals, and biblical insights</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3>Growing Network</h3>
                <p>Join a thriving community of faith defenders worldwide</p>
              </div>
            </div>

            {/* Stats Section */}
            <div className="auth-stats-section">
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-number">10K+</div>
                  <div className="stat-label">Active Members</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">500+</div>
                  <div className="stat-label">Bible Studies</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">50+</div>
                  <div className="stat-label">Countries</div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Background Pattern */}
          <div className="visual-background">
            <div className="gradient-orb gradient-orb-1"></div>
            <div className="gradient-orb gradient-orb-2"></div>
            <div className="gradient-orb gradient-orb-3"></div>
          </div>
        </div>
      </div>

      {/* Service Worker Registration */}
      <script dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js')
                .then(function(registration) {
                console.log('Service Worker registered successfully:', registration.scope);
              })
              .catch(function(error) {
                console.log('Service Worker registration failed:', error);
              });
            });
          }
        `
      }}></script>

    </div>
  )
}

async function getLoggedInUser(c: Context) {
  try {
    const { getLoggedInUser } = await import('../auth')
    return await getLoggedInUser(c)
  } catch (error) {
    console.error('Error getting logged in user:', error)
    return null
  }
}

export default Login
