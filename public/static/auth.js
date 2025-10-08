// Faith Defenders Security Enhancement System
// Cloudflare-compatible client-side security measures

// Global Security Manager
class FaithDefendersSecurityManager {
  constructor() {
    this.securityConfig = {
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      passwordStrengthRequired: 3, // 0-4 scale
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      csrfTokens: new Map(),
      rateLimitWindow: 60 * 1000, // 1 minute
      maxRequestsPerWindow: 10,
      suspiciousPatterns: [
        /script/i,
        /javascript/i,
        /vbscript/i,
        /onload/i,
        /onerror/i,
        /onclick/i,
        /<iframe/i,
        /<object/i,
        /<embed/i,
        /eval\s*\(/i,
        /document\.cookie/i,
        /localStorage/i,
        /sessionStorage/i
      ]
    };
    
    this.securityState = {
      loginAttempts: this.getStoredAttempts(),
      lastAttemptTime: this.getLastAttemptTime(),
      requestCounts: new Map(),
      sessionStartTime: Date.now(),
      isLocked: false,
      threats: []
    };
    
    this.init();
  }

  init() {
    this.setupSecurityHeaders();
    this.initializeCSRFProtection();
    this.setupRateLimiting();
    this.initializeThreatDetection();
    this.setupSessionManagement();
    this.enhanceFormSecurity();
    this.setupSecurityLogging();
    this.initializeBruteForceProtection();
  }

  // Enhanced CSRF Protection
  initializeCSRFProtection() {
    // Generate CSRF token for this session
    const csrfToken = this.generateSecureToken();
    this.securityConfig.csrfTokens.set('main', csrfToken);
    
    // Add CSRF token to all forms
    this.addCSRFTokensToForms();
    
    // Intercept all fetch requests to add CSRF token
    this.interceptFetchRequests();
  }

  generateSecureToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  addCSRFTokensToForms() {
    document.addEventListener('DOMContentLoaded', () => {
      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = 'csrf_token';
        csrfInput.value = this.securityConfig.csrfTokens.get('main');
        form.appendChild(csrfInput);
      });
    });
  }

  interceptFetchRequests() {
    const originalFetch = window.fetch;
    window.fetch = async (url, options = {}) => {
      // Add CSRF token to headers
      const headers = new Headers(options.headers || {});
      headers.set('X-CSRF-Token', this.securityConfig.csrfTokens.get('main'));
      headers.set('X-Requested-With', 'XMLHttpRequest');
      
      // Security logging for API calls
      this.logSecurityEvent('api_request', {
        url: typeof url === 'string' ? url : url.url,
        method: options.method || 'GET',
        timestamp: Date.now()
      });
      
      return originalFetch(url, {
        ...options,
        headers
      });
    };
  }

  // Rate Limiting
  setupRateLimiting() {
    this.rateLimitCheck = this.rateLimitCheck.bind(this);
  }

  rateLimitCheck(endpoint = 'general') {
    const now = Date.now();
    const windowStart = now - this.securityConfig.rateLimitWindow;
    
    // Clean old entries
    const requests = this.securityState.requestCounts.get(endpoint) || [];
    const validRequests = requests.filter(time => time > windowStart);
    
    if (validRequests.length >= this.securityConfig.maxRequestsPerWindow) {
      this.logSecurityEvent('rate_limit_exceeded', {
        endpoint,
        attempts: validRequests.length,
        timestamp: now
      });
      return false;
    }
    
    validRequests.push(now);
    this.securityState.requestCounts.set(endpoint, validRequests);
    return true;
  }

  // Input Sanitization and Validation
  sanitizeInput(input, context = 'general') {
    if (typeof input !== 'string') return input;
    
    let sanitized = input;
    
    // Remove potentially dangerous patterns
    this.securityConfig.suspiciousPatterns.forEach(pattern => {
      if (pattern.test(sanitized)) {
        this.logSecurityEvent('suspicious_input_detected', {
          pattern: pattern.toString(),
          input: input.substring(0, 100),
          context,
          timestamp: Date.now()
        });
        sanitized = sanitized.replace(pattern, '');
      }
    });
    
    // HTML encode
    const div = document.createElement('div');
    div.textContent = sanitized;
    sanitized = div.innerHTML;
    
    // Additional context-specific sanitization
    switch (context) {
      case 'email':
        sanitized = sanitized.toLowerCase().trim();
        break;
      case 'name':
        sanitized = sanitized.replace(/[<>\"']/g, '');
        break;
      case 'password':
        // Don't log or modify passwords, just check length
        return input.length <= 128 ? input : input.substring(0, 128);
    }
    
    return sanitized;
  }

  validateInput(input, type) {
    const validators = {
      email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      password: /^.{8,128}$/,
      name: /^[a-zA-Z\s\-']{2,50}$/,
      phone: /^[\+]?[1-9][\d]{0,15}$/
    };
    
    const validator = validators[type];
    if (!validator) return true;
    
    const isValid = validator.test(input);
    if (!isValid) {
      this.logSecurityEvent('input_validation_failed', {
        type,
        inputLength: input.length,
        timestamp: Date.now()
      });
    }
    
    return isValid;
  }

  // Brute Force Protection
  initializeBruteForceProtection() {
    this.checkLockoutStatus();
  }

  checkLockoutStatus() {
    const attempts = this.securityState.loginAttempts;
    const lastAttempt = this.securityState.lastAttemptTime;
    const now = Date.now();
    
    if (attempts >= this.securityConfig.maxLoginAttempts) {
      const timeSinceLast = now - lastAttempt;
      if (timeSinceLast < this.securityConfig.lockoutDuration) {
        this.securityState.isLocked = true;
        const remainingTime = this.securityConfig.lockoutDuration - timeSinceLast;
        this.showSecurityMessage(
          `Account temporarily locked. Try again in ${Math.ceil(remainingTime / 60000)} minutes.`,
          'error'
        );
        return false;
      } else {
        // Reset attempts after lockout period
        this.resetLoginAttempts();
      }
    }
    
    return true;
  }

  recordFailedLogin() {
    this.securityState.loginAttempts++;
    this.securityState.lastAttemptTime = Date.now();
    
    localStorage.setItem('fd_login_attempts', this.securityState.loginAttempts.toString());
    localStorage.setItem('fd_last_attempt', this.securityState.lastAttemptTime.toString());
    
    this.logSecurityEvent('failed_login_attempt', {
      attempts: this.securityState.loginAttempts,
      timestamp: this.securityState.lastAttemptTime,
      userAgent: navigator.userAgent
    });
    
    if (this.securityState.loginAttempts >= this.securityConfig.maxLoginAttempts) {
      this.logSecurityEvent('account_locked', {
        totalAttempts: this.securityState.loginAttempts,
        timestamp: Date.now()
      });
    }
  }

  recordSuccessfulLogin() {
    this.resetLoginAttempts();
    this.logSecurityEvent('successful_login', {
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    });
  }

  resetLoginAttempts() {
    this.securityState.loginAttempts = 0;
    this.securityState.isLocked = false;
    localStorage.removeItem('fd_login_attempts');
    localStorage.removeItem('fd_last_attempt');
  }

  getStoredAttempts() {
    return parseInt(localStorage.getItem('fd_login_attempts') || '0');
  }

  getLastAttemptTime() {
    return parseInt(localStorage.getItem('fd_last_attempt') || '0');
  }

  // Session Management
  setupSessionManagement() {
    this.sessionTimer = setInterval(() => {
      this.checkSessionTimeout();
    }, 60000); // Check every minute
    
    // Reset session timer on user activity
    ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
      document.addEventListener(event, () => {
        this.resetSessionTimer();
      }, { passive: true });
    });
  }

  checkSessionTimeout() {
    const now = Date.now();
    const sessionAge = now - this.securityState.sessionStartTime;
    
    if (sessionAge > this.securityConfig.sessionTimeout) {
      this.logSecurityEvent('session_timeout', {
        sessionDuration: sessionAge,
        timestamp: now
      });
      this.handleSessionTimeout();
    }
  }

  resetSessionTimer() {
    this.securityState.sessionStartTime = Date.now();
  }

  handleSessionTimeout() {
    this.showSecurityMessage('Your session has expired for security reasons. Please log in again.', 'warning');
    setTimeout(() => {
      if (typeof window.logout === 'function') {
        window.logout();
      } else {
        window.location.href = '/auth/login';
      }
    }, 3000);
  }

  // Threat Detection
  initializeThreatDetection() {
    this.setupDevToolsDetection();
    this.setupDOMManipulationDetection();
    this.setupNetworkAnomalyDetection();
  }

  setupDevToolsDetection() {
    let devtools = false;
    const threshold = 160;
    
    const detectDevTools = () => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools) {
          devtools = true;
          this.logSecurityEvent('devtools_opened', {
            timestamp: Date.now(),
            userAgent: navigator.userAgent
          });
        }
      } else {
        devtools = false;
      }
    };
    
    setInterval(detectDevTools, 500);
  }

  setupDOMManipulationDetection() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              const tagName = node.tagName?.toLowerCase();
              const suspiciousTags = ['script', 'iframe', 'object', 'embed'];
              
              if (suspiciousTags.includes(tagName)) {
                this.logSecurityEvent('suspicious_dom_manipulation', {
                  tagName,
                  innerHTML: node.innerHTML?.substring(0, 200),
                  timestamp: Date.now()
                });
              }
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  setupNetworkAnomalyDetection() {
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      if (typeof url === 'string' && !url.startsWith(window.location.origin) && !url.startsWith('/')) {
        window.fdSecurity.logSecurityEvent('external_request_detected', {
          method,
          url: url.substring(0, 200),
          timestamp: Date.now()
        });
      }
      return originalXHROpen.call(this, method, url, ...args);
    };
  }

  // Enhanced Form Security
  enhanceFormSecurity() {
    document.addEventListener('DOMContentLoaded', () => {
      this.secureAllForms();
    });
  }

  secureAllForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      this.secureForm(form);
    });
  }

  secureForm(form) {
    // Add security attributes
    form.setAttribute('autocomplete', 'on');
    form.setAttribute('novalidate', 'true'); // We handle validation ourselves
    
    // Secure all inputs
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      this.secureInput(input);
    });
    
    // Add form submission handler
    form.addEventListener('submit', (e) => {
      if (!this.validateForm(form)) {
        e.preventDefault();
        return false;
      }
    });
  }

  secureInput(input) {
    const inputType = input.type || input.tagName.toLowerCase();
    
    // Set appropriate security attributes
    switch (inputType) {
      case 'email':
        input.setAttribute('spellcheck', 'false');
        input.setAttribute('autocomplete', 'email');
        break;
      case 'password':
        input.setAttribute('autocomplete', 'current-password');
        input.setAttribute('spellcheck', 'false');
        break;
      case 'text':
        if (input.name?.includes('name')) {
          input.setAttribute('autocomplete', 'name');
        }
        break;
    }
    
    // Add input validation
    input.addEventListener('input', (e) => {
      const sanitized = this.sanitizeInput(e.target.value, input.type);
      if (sanitized !== e.target.value) {
        e.target.value = sanitized;
      }
    });
    
    input.addEventListener('paste', (e) => {
      setTimeout(() => {
        const sanitized = this.sanitizeInput(e.target.value, input.type);
        e.target.value = sanitized;
      }, 0);
    });
  }

  validateForm(form) {
    if (!this.rateLimitCheck('form_submission')) {
      this.showSecurityMessage('Too many form submissions. Please wait before trying again.', 'error');
      return false;
    }
    
    if (this.securityState.isLocked) {
      this.showSecurityMessage('Account is temporarily locked due to suspicious activity.', 'error');
      return false;
    }
    
    const inputs = form.querySelectorAll('input, textarea');
    let isValid = true;
    
    inputs.forEach(input => {
      if (input.required && !input.value.trim()) {
        isValid = false;
        this.showFieldError(input, 'This field is required');
      } else if (input.value && !this.validateInput(input.value, input.type)) {
        isValid = false;
        this.showFieldError(input, 'Invalid input format');
      }
    });
    
    return isValid;
  }

  // Security Logging
  setupSecurityLogging() {
    this.securityLog = [];
    this.maxLogEntries = 1000;
  }

  logSecurityEvent(eventType, details = {}) {
    const logEntry = {
      type: eventType,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...details
    };
    
    this.securityLog.push(logEntry);
    
    // Keep log size manageable
    if (this.securityLog.length > this.maxLogEntries) {
      this.securityLog.shift();
    }
    
    // Send critical events to server
    const criticalEvents = [
      'account_locked',
      'suspicious_input_detected',
      'devtools_opened',
      'suspicious_dom_manipulation',
      'external_request_detected'
    ];
    
    if (criticalEvents.includes(eventType)) {
      this.sendSecurityAlert(logEntry);
    }
  }

  async sendSecurityAlert(logEntry) {
    try {
      await fetch('/api/security/alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.securityConfig.csrfTokens.get('main')
        },
        body: JSON.stringify(logEntry),
        credentials: 'include'
      });
    } catch (error) {
      console.warn('Failed to send security alert:', error);
    }
  }


  // Security Headers
  setupSecurityHeaders() {
    // These would typically be set by the server, but we can add client-side equivalents
    const securityHeaders = {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
    
    // Store for potential server communication
    this.securityHeaders = securityHeaders;
  }

  // UI Helper Methods
  showSecurityMessage(message, type = 'info') {
    const messageContainer = document.createElement('div');
    messageContainer.className = `security-message security-message-${type}`;
    messageContainer.innerHTML = `
      <div class="security-message-content">
        <strong>Security Notice:</strong> ${message}
      </div>
    `;
    
    Object.assign(messageContainer.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 16px',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '500',
      fontSize: '14px',
      zIndex: '10000',
      maxWidth: '400px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      backgroundColor: type === 'error' ? '#ef4444' : 
                      type === 'warning' ? '#f59e0b' : 
                      type === 'success' ? '#10b981' : '#3b82f6'
    });
    
    document.body.appendChild(messageContainer);
    
    setTimeout(() => {
      if (messageContainer.parentNode) {
        messageContainer.parentNode.removeChild(messageContainer);
      }
    }, 5000);
  }

  showFieldError(input, message) {
    // Clear existing error
    const existingError = input.parentNode.querySelector('.security-field-error');
    if (existingError) {
      existingError.remove();
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'security-field-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = 'color: #ef4444; font-size: 0.875rem; margin-top: 0.25rem;';
    
    input.parentNode.appendChild(errorDiv);
    input.style.borderColor = '#ef4444';
  }

  // Public API Methods
  isSecure() {
    return !this.securityState.isLocked && 
           this.securityState.threats.length === 0;
  }

  getSecurityStatus() {
    return {
      isLocked: this.securityState.isLocked,
      loginAttempts: this.securityState.loginAttempts,
      threats: this.securityState.threats.length,
      sessionAge: Date.now() - this.securityState.sessionStartTime
    };
  }

  cleanup() {
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
    }
  }
}

// Initialize Security Manager
window.fdSecurity = new FaithDefendersSecurityManager();

// Enhanced Authentication Security Wrapper
class SecureAuthManager {
  constructor() {
    this.security = window.fdSecurity;
    this.init();
  }

  init() {
    this.enhanceLoginProcess();
    this.enhanceRegistrationProcess();
    this.setupPasswordSecurity();
  }

  enhanceLoginProcess() {
    document.addEventListener('DOMContentLoaded', () => {
      const loginForms = document.querySelectorAll('#login-form, #signin-form');
      loginForms.forEach(form => {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          await this.handleSecureLogin(e.target);
        });
      });
    });
  }

  async handleSecureLogin(form) {
    // Check brute force protection
    if (!this.security.checkLockoutStatus()) {
      return;
    }
    
    // Rate limiting check
    if (!this.security.rateLimitCheck('login')) {
      this.security.showSecurityMessage('Too many login attempts. Please wait.', 'error');
      return;
    }
    
    const formData = new FormData(form);
    const email = this.security.sanitizeInput(formData.get('email'), 'email');
    const password = formData.get('password'); // Don't sanitize password
    
    // Validate inputs
    if (!this.security.validateInput(email, 'email')) {
      this.security.showSecurityMessage('Please enter a valid email address.', 'error');
      return;
    }
    
    if (!password || password.length < 6) {
      this.security.showSecurityMessage('Password must be at least 6 characters.', 'error');
      return;
    }
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.security.securityConfig.csrfTokens.get('main')
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.security.recordSuccessfulLogin();
        this.security.showSecurityMessage('Login successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = window.location.pathname + window.location.search;
        }, 1000);
      } else {
        this.security.recordFailedLogin();
        this.security.showSecurityMessage(data.error || 'Login failed', 'error');
      }
    } catch (error) {
      this.security.recordFailedLogin();
      this.security.logSecurityEvent('login_network_error', {
        error: error.message,
        timestamp: Date.now()
      });
      this.security.showSecurityMessage('Network error. Please try again.', 'error');
    }
  }

  enhanceRegistrationProcess() {
    document.addEventListener('DOMContentLoaded', () => {
      const registerForms = document.querySelectorAll('#register-form, #signup-form');
      registerForms.forEach(form => {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          await this.handleSecureRegistration(e.target);
        });
      });
    });
  }

  async handleSecureRegistration(form) {
    // Rate limiting check
    if (!this.security.rateLimitCheck('registration')) {
      this.security.showSecurityMessage('Too many registration attempts. Please wait.', 'error');
      return;
    }
    
    const formData = new FormData(form);
    const name = this.security.sanitizeInput(formData.get('name'), 'name');
    const email = this.security.sanitizeInput(formData.get('email'), 'email');
    const password = formData.get('password'); // Don't sanitize password
    
    // Enhanced validation
    if (!this.security.validateInput(name, 'name')) {
      this.security.showSecurityMessage('Please enter a valid name (2-50 characters).', 'error');
      return;
    }
    
    if (!this.security.validateInput(email, 'email')) {
      this.security.showSecurityMessage('Please enter a valid email address.', 'error');
      return;
    }
    
    if (!this.validatePasswordStrength(password)) {
      return;
    }
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.security.securityConfig.csrfTokens.get('main')
        },
        body: JSON.stringify({ name, email, password }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.security.showSecurityMessage('Account created successfully!', 'success');
        setTimeout(() => {
          if (data.requiresVerification && data.userId) {
            window.location.href = `/verify-email?userId=${data.userId}`;
          } else {
            window.location.href = '/';
          }
        }, 1000);
      } else {
        this.security.showSecurityMessage(data.error || 'Registration failed', 'error');
      }
    } catch (error) {
      this.security.logSecurityEvent('registration_network_error', {
        error: error.message,
        timestamp: Date.now()
      });
      this.security.showSecurityMessage('Network error. Please try again.', 'error');
    }
  }

  setupPasswordSecurity() {
    document.addEventListener('DOMContentLoaded', () => {
      const passwordInputs = document.querySelectorAll('input[type="password"]');
      passwordInputs.forEach(input => {
        this.enhancePasswordInput(input);
      });
    });
  }

  enhancePasswordInput(input) {
    // Add real-time password strength checking
    input.addEventListener('input', () => {
      this.checkPasswordStrength(input.value, input);
    });
    
    // Prevent password pasting for security
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      this.security.showSecurityMessage('For security reasons, passwords cannot be pasted.', 'warning');
    });
    
    // Clear clipboard on password focus (security measure)
    input.addEventListener('focus', () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('').catch(() => {
          // Ignore errors, this is just a security measure
        });
      }
    });
  }

  checkPasswordStrength(password, inputElement) {
    const strength = this.calculatePasswordStrength(password);
    const strengthIndicator = inputElement.parentNode.querySelector('.password-strength-indicator') ||
                             this.createPasswordStrengthIndicator(inputElement);
    
    this.updatePasswordStrengthIndicator(strengthIndicator, strength, password.length);
  }

  calculatePasswordStrength(password) {
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    
    strength += checks.length ? 20 : 0;
    strength += checks.lowercase ? 20 : 0;
    strength += checks.uppercase ? 20 : 0;
    strength += checks.numbers ? 20 : 0;
    strength += checks.symbols ? 20 : 0;
    
    // Bonus for longer passwords
    if (password.length >= 12) strength += 10;
    if (password.length >= 16) strength += 10;
    
    return Math.min(strength, 100);
  }

  createPasswordStrengthIndicator(inputElement) {
    const indicator = document.createElement('div');
    indicator.className = 'password-strength-indicator';
    indicator.innerHTML = `
      <div class="password-strength-bar">
        <div class="password-strength-fill"></div>
      </div>
      <div class="password-strength-text">Password strength: <span class="strength-level">Weak</span></div>
    `;
    
    indicator.style.cssText = `
      margin-top: 8px;
      font-size: 0.875rem;
    `;
    
    inputElement.parentNode.appendChild(indicator);
    return indicator;
  }

  updatePasswordStrengthIndicator(indicator, strength, length) {
    const fill = indicator.querySelector('.password-strength-fill');
    const text = indicator.querySelector('.strength-level');
    
    fill.style.width = `${strength}%`;
    
    let level = 'Very Weak';
    let color = '#ef4444';
    
    if (strength >= 80) {
      level = 'Very Strong';
      color = '#10b981';
    } else if (strength >= 60) {
      level = 'Strong';
      color = '#10b981';
    } else if (strength >= 40) {
      level = 'Fair';
      color = '#f59e0b';
    } else if (strength >= 20) {
      level = 'Weak';
      color = '#ef4444';
    }
    
    fill.style.backgroundColor = color;
    text.textContent = level;
    text.style.color = color;
  }

  validatePasswordStrength(password) {
    const strength = this.calculatePasswordStrength(password);
    const minStrength = this.security.securityConfig.passwordStrengthRequired * 20;
    
    if (strength < minStrength) {
      this.security.showSecurityMessage(
        `Password is too weak. Please use a stronger password with at least 8 characters, including uppercase, lowercase, numbers, and symbols.`,
        'error'
      );
      return false;
    }
    
    return true;
  }
}

// Initialize Secure Auth Manager
window.fdSecureAuth = new SecureAuthManager();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.fdSecurity) {
    window.fdSecurity.cleanup();
  }
});

console.log('Faith Defenders Security System initialized successfully');

// Authentication JavaScript


// Initialize mobile enhancements when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on the PDF viewer page - don't initialize mobile enhancements that interfere with PDF scrolling
  const isPDFViewer = window.location.pathname.includes('/view') || document.querySelector('#pdf-viewer-container');

  if (!isPDFViewer) {
    new MobileArticleReader();
    new MobileMediaPlayer();
  }
});

// Mobile Article Reader Enhancement Class
class MobileArticleReader {
  constructor() {
    this.init();
  }

  init() {
    this.setupReadingProgress();
    this.setupMobileScrolling();
    this.setupMobileInteractions();
  }

  // Reading progress indicator for mobile
  setupReadingProgress() {
    if (window.innerWidth > 768) return;

    const articleBody = document.querySelector('.article-body');
    if (!articleBody) return;

    // Create reading progress bar
    const progressContainer = document.createElement('div');
    progressContainer.className = 'reading-progress';
    
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress-bar';
    
    progressContainer.appendChild(progressBar);
    document.body.insertBefore(progressContainer, document.body.firstChild);

    // Update progress on scroll
    let ticking = false;
    const updateProgress = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min((scrollTop / docHeight) * 100, 100);
      
      progressBar.style.width = progress + '%';
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateProgress);
        ticking = true;
      }
    }, { passive: true });
  }

  // Enhanced mobile scrolling experience
  setupMobileScrolling() {
    if (window.innerWidth > 768) return;

    // Smooth scroll for article links
    const articleLinks = document.querySelectorAll('.article-body a[href^="#"]');
    articleLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });

    // Back to top functionality
    this.createBackToTop();
  }

  createBackToTop() {
    // Check if we're on the PDF viewer page - don't create back-to-top button there
    if (window.location.pathname.includes('/view') || document.querySelector('#pdf-viewer-container')) {
      return;
    }

    // Remove any existing back-to-top button to prevent duplicates
    const existingButton = document.querySelector('.back-to-top-mobile');
    if (existingButton) {
      existingButton.remove();
    }

    const backToTop = document.createElement('button');
    backToTop.className = 'back-to-top-mobile';
    backToTop.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTop.setAttribute('aria-label', 'Back to top');
    
    // Style the button - optimized for mobile to prevent interference
    Object.assign(backToTop.style, {
      position: 'fixed',
      bottom: '2rem',
      right: '1rem',
      width: '48px',
      height: '48px',
      backgroundColor: '#4f46e5',
      color: 'white',
      border: 'none',
      borderRadius: '50%',
      fontSize: '1.25rem',
      cursor: 'pointer',
      zIndex: '10', // Reduced z-index to prevent interference
      opacity: '0',
      visibility: 'hidden',
      transform: 'translateY(20px)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
      pointerEvents: 'none', // Initially disable pointer events
      touchAction: 'none' // Prevent touch actions when hidden
    });

    document.body.appendChild(backToTop);

    // Add a CSS class for additional control
    backToTop.classList.add('mobile-back-to-top');

    // Show/hide based on scroll - optimized for performance and mobile
    let scrollThrottle = false;
    let lastScrollTop = 0;
    let isButtonVisible = false;

    const updateButtonVisibility = (scrollTop) => {
      const shouldShow = scrollTop > 300;

      // Only update if there's a meaningful change to avoid unnecessary DOM updates
      if (shouldShow !== isButtonVisible) {
        if (shouldShow) {
          backToTop.style.opacity = '1';
          backToTop.style.visibility = 'visible';
          backToTop.style.transform = 'translateY(0)';
          backToTop.style.pointerEvents = 'auto'; // Enable touch when visible
          backToTop.style.touchAction = 'auto';
          isButtonVisible = true;
        } else {
          backToTop.style.opacity = '0';
          backToTop.style.visibility = 'hidden';
          backToTop.style.transform = 'translateY(20px)';
          backToTop.style.pointerEvents = 'none'; // Disable touch when hidden
          backToTop.style.touchAction = 'none';
          isButtonVisible = false;
        }
      }

      lastScrollTop = scrollTop;
    };

    window.addEventListener('scroll', () => {
      if (!scrollThrottle) {
        requestAnimationFrame(() => {
          const scrollTop = window.pageYOffset;
          updateButtonVisibility(scrollTop);
          scrollThrottle = false;
        });
        scrollThrottle = true;
      }
    }, { passive: true });

    // Click handler - only scroll to top when explicitly clicked
    backToTop.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      // Only scroll if button is actually visible and interactive
      if (isButtonVisible && backToTop.style.pointerEvents === 'auto') {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    });

    // Prevent touch events from interfering with scrolling when button is hidden
    backToTop.addEventListener('touchstart', (e) => {
      if (!isButtonVisible) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, { passive: false });

    backToTop.addEventListener('touchmove', (e) => {
      if (!isButtonVisible) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, { passive: false });

    backToTop.addEventListener('touchend', (e) => {
      if (!isButtonVisible) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, { passive: false });
  }

  // Mobile-specific interactions
  setupMobileInteractions() {
    if (window.innerWidth > 768) return;

    // Improve image viewing on mobile
    const images = document.querySelectorAll('.article-body img');
    images.forEach(img => {
      img.addEventListener('click', () => {
        this.openImageModal(img);
      });

      // Add loading states
      img.addEventListener('load', () => {
        img.style.opacity = '1';
      });

      img.style.opacity = '0';
      img.style.transition = 'opacity 0.3s ease';
    });

    // Add text selection improvements
    this.enhanceTextSelection();

    // Apply same keyboard handling as login forms
    this.setupCommentKeyboardHandling();
  }

  // Image modal for mobile viewing
  openImageModal(img) {
    const modal = document.createElement('div');
    modal.className = 'image-modal-mobile';
    
    Object.assign(modal.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '2000',
      padding: '1rem'
    });

    const modalImg = document.createElement('img');
    modalImg.src = img.src;
    modalImg.alt = img.alt;
    Object.assign(modalImg.style, {
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain',
      borderRadius: '8px'
    });

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.setAttribute('aria-label', 'Close image');
    Object.assign(closeBtn.style, {
      position: 'absolute',
      top: '1rem',
      right: '1rem',
      width: '44px',
      height: '44px',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
      border: 'none',
      borderRadius: '50%',
      fontSize: '1.25rem',
      cursor: 'pointer',
      backdropFilter: 'blur(10px)'
    });

    modal.appendChild(modalImg);
    modal.appendChild(closeBtn);
    document.body.appendChild(modal);

    // Close handlers
    const closeModal = () => {
      document.body.removeChild(modal);
      document.body.style.overflow = '';
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  // Enhance text selection for mobile
  enhanceTextSelection() {
    const articleBody = document.querySelector('.article-body');
    if (!articleBody) return;

    // Add selection feedback
    articleBody.addEventListener('selectstart', () => {
      articleBody.classList.add('selecting-text');
    });

    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      if (selection.toString().length === 0) {
        articleBody.classList.remove('selecting-text');
      }
    });
  }

  // Enhanced keyboard handling for comment inputs
  setupCommentKeyboardHandling() {
    if (window.innerWidth > 768) return;

    let keyboardVisible = false;
    let originalViewportHeight = window.innerHeight;

    // Enhanced keyboard detection for comments
    window.addEventListener('resize', () => {
      const currentHeight = window.innerHeight;
      const heightDifference = originalViewportHeight - currentHeight;

      // More aggressive threshold for comment inputs
      if (heightDifference > 80) { // Reduced threshold for better detection
        if (!keyboardVisible) {
          keyboardVisible = true;
          document.body.classList.add('mobile-keyboard-active');
          this.adjustForCommentKeyboard();
          this.handleCommentKeyboardAppearance();
          console.log('Comment keyboard detected - class added');
        }
      } else {
        if (keyboardVisible) {
          keyboardVisible = false;
          document.body.classList.remove('mobile-keyboard-active');
          this.restoreAfterCommentKeyboard();
          this.handleCommentKeyboardDisappearance();
          console.log('Comment keyboard hidden - class removed');
        }
      }
    });

    // Enhanced comment input focus handling
    const commentInputs = document.querySelectorAll('#comment-input, .comment-input, textarea[name="comment"], textarea[name="content"]');
    commentInputs.forEach(input => {
      input.addEventListener('focus', () => {
        console.log('Comment input focused');
        setTimeout(() => {
          input.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }, 300);
      });

      // Prevent keyboard from closing on touch
      input.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        console.log('Comment input touched');
      });

      // Enhanced blur handling
      input.addEventListener('blur', () => {
        console.log('Comment input blurred');
        // Keep focus if keyboard is still visible
        setTimeout(() => {
          if (keyboardVisible && !document.activeElement.matches('input, textarea')) {
            console.log('Attempting to restore focus to comment input');
            input.focus();
          }
        }, 100);
      });
    });

    // Alternative keyboard detection for comments
    this.setupCommentAlternativeKeyboardDetection();
  }

  // Enhanced comment keyboard appearance handling
  handleCommentKeyboardAppearance() {
    // Add specific class for comment keyboard
    document.body.classList.add('comment-keyboard-visible');

    // Adjust comments section positioning
    const commentsSection = document.querySelector('.comments-section, #comments-list');
    if (commentsSection) {
      commentsSection.style.paddingBottom = '20px';
    }

    // Only prevent page scroll for comment inputs, not general article reading
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      const isCommentInput = activeElement.matches('#comment-input, .comment-input, textarea[name="comment"], textarea[name="content"]');
      if (isCommentInput) {
        document.body.style.overflow = 'hidden';
      }
    }
  }

  // Enhanced comment keyboard disappearance handling
  handleCommentKeyboardDisappearance() {
    // Remove comment keyboard class
    document.body.classList.remove('comment-keyboard-visible');

    // Restore comments section
    const commentsSection = document.querySelector('.comments-section, #comments-list');
    if (commentsSection) {
      commentsSection.style.paddingBottom = '';
    }

    // Only restore page scroll if it was restricted for comment inputs
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      const isCommentInput = activeElement.matches('#comment-input, .comment-input, textarea[name="comment"], textarea[name="content"]');
      if (isCommentInput) {
        document.body.style.overflow = '';
      }
    } else {
      // If no active input, always restore scroll
      document.body.style.overflow = '';
    }
  }

  // Alternative keyboard detection methods for comments
  setupCommentAlternativeKeyboardDetection() {
    // Visual Viewport API for comments
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        const heightDiff = window.innerHeight - window.visualViewport.height;
        if (heightDiff > 50) {
          console.log('Comment visual viewport changed - keyboard detected');
          document.body.classList.add('mobile-keyboard-active');
          this.adjustForCommentKeyboard();
          this.handleCommentKeyboardAppearance();
        } else {
          document.body.classList.remove('mobile-keyboard-active');
          this.restoreAfterCommentKeyboard();
          this.handleCommentKeyboardDisappearance();
        }
      });
    }

    // Touch events for comment inputs
    document.addEventListener('touchstart', (e) => {
      if (e.target.matches('#comment-input, .comment-input, textarea[name="comment"], textarea[name="content"]')) {
        console.log('Comment input touched - preventing default');
        e.stopPropagation();
      }
    });

    // Prevent accidental keyboard dismissal
    document.addEventListener('touchend', (e) => {
      if (e.target.matches('#comment-input, .comment-input, textarea[name="comment"], textarea[name="content"]')) {
        e.preventDefault();
      }
    });
  }

  adjustForCommentKeyboard() {
    // Reduce fixed elements that might interfere (same as login forms)
    const fixedElements = document.querySelectorAll('.mobile-menu-panel, .mobile-search-overlay');
    fixedElements.forEach(el => {
      el.style.paddingBottom = '0';
    });
  }

  restoreAfterCommentKeyboard() {
    // Restore original positioning (same as login forms)
    const fixedElements = document.querySelectorAll('.mobile-menu-panel, .mobile-search-overlay');
    fixedElements.forEach(el => {
      el.style.paddingBottom = '';
    });
  }
}

// Mobile Media Player Enhancement Class
class MobileMediaPlayer {
  constructor() {
    this.init();
  }

  init() {
    this.setupMobileVideoPlayer();
    this.setupMobileAudioPlayer();
    this.setupMediaControls();
    this.setupTouchGestures();
  }

  // Enhanced mobile video player
  setupMobileVideoPlayer() {
    if (window.innerWidth > 768) return;

    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      this.enhanceVideoPlayer(video);
    });
  }

  enhanceVideoPlayer(video) {
    // Create mobile video controls overlay
    const controls = this.createVideoControls(video);
    video.parentNode.insertBefore(controls, video.nextSibling);

    // Add mobile-specific event listeners
    video.addEventListener('loadedmetadata', () => {
      this.setupVideoTouchControls(video, controls);
    });

    // Handle fullscreen for mobile
    video.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) {
        controls.classList.add('fullscreen');
      } else {
        controls.classList.remove('fullscreen');
      }
    });
  }

  createVideoControls(video) {
    const controls = document.createElement('div');
    controls.className = 'mobile-video-controls';

    controls.innerHTML = `
      <div class="video-controls-bar">
        <button class="play-pause-btn" aria-label="Play/Pause">
          <i class="fas fa-play"></i>
        </button>
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
        </div>
        <button class="fullscreen-btn" aria-label="Fullscreen">
          <i class="fas fa-expand"></i>
        </button>
      </div>
      <div class="video-info">
        <span class="current-time">0:00</span>
        <span class="duration">0:00</span>
      </div>
    `;

    return controls;
  }

  setupVideoTouchControls(video, controls) {
    const playPauseBtn = controls.querySelector('.play-pause-btn');
    const progressBar = controls.querySelector('.progress-bar');
    const progressFill = controls.querySelector('.progress-fill');
    const fullscreenBtn = controls.querySelector('.fullscreen-btn');
    const currentTimeEl = controls.querySelector('.current-time');
    const durationEl = controls.querySelector('.duration');

    // Play/Pause toggle
    playPauseBtn.addEventListener('click', () => {
      if (video.paused) {
        video.play();
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
      } else {
        video.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
      }
    });

    // Progress bar interaction
    progressBar.addEventListener('click', (e) => {
      const rect = progressBar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      video.currentTime = percent * video.duration;
    });

    // Update progress
    video.addEventListener('timeupdate', () => {
      const percent = (video.currentTime / video.duration) * 100;
      progressFill.style.width = percent + '%';
      currentTimeEl.textContent = this.formatTime(video.currentTime);
    });

    // Update duration
    video.addEventListener('loadedmetadata', () => {
      durationEl.textContent = this.formatTime(video.duration);
    });

    // Fullscreen toggle
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        video.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });

    // Double tap to play/pause
    let lastTap = 0;
    video.addEventListener('touchend', (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      if (tapLength < 500 && tapLength > 0) {
        e.preventDefault();
        playPauseBtn.click();
      }
      lastTap = currentTime;
    });
  }

  // Enhanced mobile audio player
  setupMobileAudioPlayer() {
    if (window.innerWidth > 768) return;

    const audios = document.querySelectorAll('audio');
    audios.forEach(audio => {
      this.enhanceAudioPlayer(audio);
    });
  }

  enhanceAudioPlayer(audio) {
    // Create mobile audio controls
    const controls = this.createAudioControls(audio);
    audio.parentNode.insertBefore(controls, audio.nextSibling);

    // Add mobile-specific event listeners
    audio.addEventListener('loadedmetadata', () => {
      this.setupAudioTouchControls(audio, controls);
    });
  }

  createAudioControls(audio) {
    const controls = document.createElement('div');
    controls.className = 'mobile-audio-controls';

    controls.innerHTML = `
      <div class="audio-controls-bar">
        <button class="rewind-btn" aria-label="Rewind 10s">
          <i class="fas fa-backward"></i>
        </button>
        <button class="play-pause-btn" aria-label="Play/Pause">
          <i class="fas fa-play"></i>
        </button>
        <button class="forward-btn" aria-label="Forward 10s">
          <i class="fas fa-forward"></i>
        </button>
      </div>
      <div class="audio-progress">
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
      </div>
      <div class="audio-info">
        <span class="current-time">0:00</span>
        <span class="duration">0:00</span>
        <div class="speed-control">
          <button class="speed-btn" data-speed="1">1x</button>
        </div>
      </div>
    `;

    return controls;
  }

  setupAudioTouchControls(audio, controls) {
    const playPauseBtn = controls.querySelector('.play-pause-btn');
    const rewindBtn = controls.querySelector('.rewind-btn');
    const forwardBtn = controls.querySelector('.forward-btn');
    const progressBar = controls.querySelector('.progress-bar');
    const progressFill = controls.querySelector('.progress-fill');
    const currentTimeEl = controls.querySelector('.current-time');
    const durationEl = controls.querySelector('.duration');
    const speedBtn = controls.querySelector('.speed-btn');

    // Play/Pause toggle
    playPauseBtn.addEventListener('click', () => {
      if (audio.paused) {
        audio.play();
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
      } else {
        audio.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
      }
    });

    // Rewind 10 seconds
    rewindBtn.addEventListener('click', () => {
      audio.currentTime = Math.max(0, audio.currentTime - 10);
    });

    // Forward 10 seconds
    forwardBtn.addEventListener('click', () => {
      audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
    });

    // Progress bar interaction
    progressBar.addEventListener('click', (e) => {
      const rect = progressBar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      audio.currentTime = percent * audio.duration;
    });

    // Update progress
    audio.addEventListener('timeupdate', () => {
      const percent = (audio.currentTime / audio.duration) * 100;
      progressFill.style.width = percent + '%';
      currentTimeEl.textContent = this.formatTime(audio.currentTime);
    });

    // Update duration
    audio.addEventListener('loadedmetadata', () => {
      durationEl.textContent = this.formatTime(audio.duration);
    });

    // Playback speed control
    speedBtn.addEventListener('click', () => {
      const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
      const currentSpeed = audio.playbackRate;
      const currentIndex = speeds.indexOf(currentSpeed);
      const nextIndex = (currentIndex + 1) % speeds.length;
      audio.playbackRate = speeds[nextIndex];
      speedBtn.textContent = speeds[nextIndex] + 'x';
    });
  }

  // General media controls setup
  setupMediaControls() {
    if (window.innerWidth > 768) return;

    // Handle media loading states
    const mediaElements = document.querySelectorAll('video, audio');
    mediaElements.forEach(media => {
      media.addEventListener('loadstart', () => {
        this.showMediaLoading(media);
      });

      media.addEventListener('canplay', () => {
        this.hideMediaLoading(media);
      });

      media.addEventListener('error', () => {
        this.showMediaError(media);
      });
    });
  }

  showMediaLoading(media) {
    const loading = document.createElement('div');
    loading.className = 'media-loading';
    loading.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    media.parentNode.insertBefore(loading, media.nextSibling);
  }

  hideMediaLoading(media) {
    const loading = media.parentNode.querySelector('.media-loading');
    if (loading) loading.remove();
  }

  showMediaError(media) {
    const error = document.createElement('div');
    error.className = 'media-error';
    error.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Media failed to load';

    media.parentNode.insertBefore(error, media.nextSibling);
  }

  // Touch gesture support
  setupTouchGestures() {
    if (window.innerWidth > 768) return;

    // Swipe gestures for volume control
    let startY = 0;
    let startVolume = 0;

    document.addEventListener('touchstart', (e) => {
      if (e.target.closest('video, audio')) {
        startY = e.touches[0].clientY;
        const media = e.target.closest('video, audio');
        startVolume = media.volume;
      }
    });

    document.addEventListener('touchmove', (e) => {
      if (e.target.closest('video, audio')) {
        e.preventDefault();
        const media = e.target.closest('video, audio');
        const currentY = e.touches[0].clientY;
        const deltaY = startY - currentY;
        const volumeChange = deltaY / 200; // Adjust sensitivity
        media.volume = Math.max(0, Math.min(1, startVolume + volumeChange));
      }
    });
  }

  // Utility function to format time
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

// Mobile Form Enhancements Class
class MobileFormEnhancer {
  constructor() {
    this.keyboardVisible = false;
    this.originalViewportHeight = window.innerHeight;
    this.init();
  }

  init() {
    this.setupMobileFormValidation();
    this.setupMobileKeyboardHandling();
    this.setupMobileFormInteractions();
    this.setupMobileInputOptimizations();
  }

  // Enhanced mobile form validation
  setupMobileFormValidation() {
    if (window.innerWidth > 768) return;

    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      this.enhanceFormValidation(form);
    });
  }

  enhanceFormValidation(form) {
    const inputs = form.querySelectorAll('input, textarea, select');
    const submitBtn = form.querySelector('input[type="submit"], button[type="submit"]');

    inputs.forEach(input => {
      // Real-time validation feedback
      input.addEventListener('blur', () => {
        this.validateField(input);
      });

      input.addEventListener('input', () => {
        this.clearFieldError(input);
      });

      // Mobile-specific input types
      this.optimizeInputType(input);
    });

    if (submitBtn) {
      form.addEventListener('submit', (e) => {
        if (!this.validateForm(form)) {
          e.preventDefault();
          this.showFormErrors(form);
        }
      });
    }
  }

  validateField(input) {
    const value = input.value.trim();
    const fieldName = input.name || input.id;
    let isValid = true;
    let errorMessage = '';

    // Field-specific validation
    switch (fieldName) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          isValid = false;
          errorMessage = 'Please enter a valid email address';
        }
        break;

      case 'password':
        if (value.length < 6) {
          isValid = false;
          errorMessage = 'Password must be at least 6 characters';
        }
        break;

      case 'name':
        if (value.length < 2) {
          isValid = false;
          errorMessage = 'Name must be at least 2 characters';
        }
        break;

      default:
        if (input.hasAttribute('required') && !value) {
          isValid = false;
          errorMessage = 'This field is required';
        }
    }

    if (!isValid) {
      this.showFieldError(input, errorMessage);
    } else {
      this.clearFieldError(input);
    }

    return isValid;
  }

  validateForm(form) {
    const inputs = form.querySelectorAll('input, textarea, select');
    let isValid = true;

    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  showFieldError(input, message) {
    this.clearFieldError(input);

    const errorDiv = document.createElement('div');
    errorDiv.className = 'mobile-field-error';
    errorDiv.textContent = message;

    Object.assign(errorDiv.style, {
      color: '#ef4444',
      fontSize: '0.8rem',
      marginTop: '0.25rem',
      fontWeight: '500',
      animation: 'slideInDown 0.2s ease-out'
    });

    input.parentNode.insertBefore(errorDiv, input.nextSibling);
    input.classList.add('mobile-field-error-input');

    // Add error styling to input
    input.style.borderColor = '#ef4444';
    input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
  }

  clearFieldError(input) {
    const errorDiv = input.parentNode.querySelector('.mobile-field-error');
    if (errorDiv) {
      errorDiv.remove();
    }

    input.classList.remove('mobile-field-error-input');
    input.style.borderColor = '';
    input.style.boxShadow = '';
  }

  showFormErrors(form) {
    // Scroll to first error
    const firstError = form.querySelector('.mobile-field-error-input');
    if (firstError) {
      firstError.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      firstError.focus();
    }

    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
  }

  // Mobile keyboard handling
  setupMobileKeyboardHandling() {
    if (window.innerWidth > 768) return;

    // Enhanced keyboard detection for all mobile devices
    window.addEventListener('resize', () => {
      const currentHeight = window.innerHeight;
      const heightDifference = this.originalViewportHeight - currentHeight;

      // More aggressive threshold for better mobile keyboard detection
      if (heightDifference > 80) { // Reduced threshold for better detection
        if (!keyboardVisible) {
          keyboardVisible = true;
          document.body.classList.add('mobile-keyboard-active');
          this.adjustForKeyboard();
          console.log('Mobile keyboard detected - class added');

          // Additional mobile-specific adjustments
          this.handleMobileKeyboardAppearance();
        }
      } else {
        if (keyboardVisible) {
          keyboardVisible = false;
          document.body.classList.remove('mobile-keyboard-active');
          this.restoreAfterKeyboard();
          console.log('Mobile keyboard hidden - class removed');

          // Additional mobile-specific cleanup
          this.handleMobileKeyboardDisappearance();
        }
      }
    });

    // Additional keyboard detection methods for better reliability
    this.setupAlternativeKeyboardDetection();

    // Handle input focus
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        setTimeout(() => {
          input.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }, 300);
      });
    });
  }

  adjustForKeyboard() {
    // Reduce fixed elements that might interfere
    const fixedElements = document.querySelectorAll('.mobile-menu-panel, .mobile-search-overlay');
    fixedElements.forEach(el => {
      el.style.paddingBottom = '0';
    });
  }

  restoreAfterKeyboard() {
    // Restore original positioning
    const fixedElements = document.querySelectorAll('.mobile-menu-panel, .mobile-search-overlay');
    fixedElements.forEach(el => {
      el.style.paddingBottom = '';
    });
  }

  // Enhanced mobile keyboard appearance handling
  handleMobileKeyboardAppearance() {
    // Prevent viewport jumping on iOS
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      const content = viewport.getAttribute('content') || '';
      if (!content.includes('height=device-height')) {
        viewport.setAttribute('content', content + ', height=device-height');
      }
    }

    // Add mobile keyboard active class to body for CSS targeting
    document.body.classList.add('mobile-keyboard-visible');

    // Adjust scroll position to keep focused input visible
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      setTimeout(() => {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }, 100);

      // Only prevent body scroll when actually interacting with form inputs
      // Check if we're in an article reading context vs form input context
      const isInArticle = activeElement.closest('.article-body, .article-content, .content-layout');
      if (!isInArticle) {
        // Only apply scroll restrictions for form inputs, not article reading
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
      }
    }
  }

  // Enhanced mobile keyboard disappearance handling
  handleMobileKeyboardDisappearance() {
    // Remove mobile keyboard active class
    document.body.classList.remove('mobile-keyboard-visible');

    // Only restore body scroll if it was actually restricted (for form inputs)
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      const isInArticle = activeElement.closest('.article-body, .article-content, .content-layout');
      if (!isInArticle) {
        // Only restore scroll restrictions that were applied for form inputs
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
      }
    } else {
      // If no active input, always restore scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    // Don't auto-scroll to top as this disrupts article reading
    // Removed automatic scroll-to-top to prevent disrupting article reading
    // Only restore scroll position if we actually modified it
  }

  // Alternative keyboard detection methods for better reliability
  setupAlternativeKeyboardDetection() {
    // Method 1: Focus/blur events
    document.addEventListener('focusin', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        console.log('Input focused - potential keyboard appearance');
        // Additional keyboard detection logic can be added here
      }
    });

    document.addEventListener('focusout', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        console.log('Input blurred - potential keyboard disappearance');
        // Additional keyboard detection logic can be added here
      }
    });

    // Method 2: Touch events for better mobile detection
    document.addEventListener('touchstart', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        console.log('Touch on input - mobile keyboard likely');
      }
    });

    // Method 3: Visual viewport API for modern browsers
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        const heightDiff = window.innerHeight - window.visualViewport.height;
        if (heightDiff > 50) {
          console.log('Visual viewport changed - keyboard detected');
          if (!this.keyboardVisible) {
            this.keyboardVisible = true;
            document.body.classList.add('mobile-keyboard-active');
            this.adjustForKeyboard();
            this.handleMobileKeyboardAppearance();
          }
        } else {
          if (this.keyboardVisible) {
            this.keyboardVisible = false;
            document.body.classList.remove('mobile-keyboard-active');
            this.restoreAfterKeyboard();
            this.handleMobileKeyboardDisappearance();
          }
        }
      });
    }
  }

  // Mobile form interactions
  setupMobileFormInteractions() {
    if (window.innerWidth > 768) return;

    // Enhanced form submission feedback
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const originalSubmit = form.onsubmit;
      form.onsubmit = (e) => {
        const submitBtn = form.querySelector('input[type="submit"], button[type="submit"]');
        if (submitBtn) {
          this.showLoadingState(submitBtn);
        }

        if (originalSubmit) {
          return originalSubmit.call(form, e);
        }
      };
    });

    // Better select dropdowns for mobile
    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
      this.enhanceMobileSelect(select);
    });
  }

  showLoadingState(button) {
    const originalText = button.textContent || button.value;
    button.disabled = true;
    button.textContent = button.value = 'Processing...';

    // Add loading spinner
    const spinner = document.createElement('i');
    spinner.className = 'fas fa-spinner fa-spin';
    spinner.style.marginLeft = '0.5rem';
    button.appendChild(spinner);

    // Store original text for restoration
    button.dataset.originalText = originalText;
  }

  restoreButtonState(button) {
    button.disabled = false;
    const originalText = button.dataset.originalText;
    if (originalText) {
      button.textContent = button.value = originalText;
      button.dataset.originalText = '';
    }
  }

  enhanceMobileSelect(select) {
    // Add mobile-friendly styling
    select.classList.add('mobile-enhanced-select');

    // Better touch interaction
    select.addEventListener('touchstart', () => {
      select.style.transform = 'scale(0.98)';
    });

    select.addEventListener('touchend', () => {
      select.style.transform = '';
    });
  }

  // Mobile input optimizations
  setupMobileInputOptimizations() {
    if (window.innerWidth > 768) return;

    const inputs = document.querySelectorAll('input, textarea');

    inputs.forEach(input => {
      // Prevent zoom on iOS
      input.style.fontSize = '16px';

      // Better autocomplete attributes
      this.optimizeInputType(input);

      // Add input mode for better keyboard
      this.setInputMode(input);
    });
  }

  optimizeInputType(input) {
    const type = input.type;
    const name = input.name || input.id;

    // Optimize input types for mobile
    if (name && name.includes('email')) {
      input.type = 'email';
      input.inputMode = 'email';
      input.autocomplete = 'email';
    } else if (name && name.includes('phone')) {
      input.type = 'tel';
      input.inputMode = 'tel';
      input.autocomplete = 'tel';
    } else if (name && name.includes('password')) {
      input.autocomplete = 'current-password';
    } else if (name && name.includes('name')) {
      input.autocomplete = 'name';
    }
  }

  setInputMode(input) {
    const type = input.type;

    switch (type) {
      case 'email':
        input.inputMode = 'email';
        break;
      case 'tel':
        input.inputMode = 'tel';
        break;
      case 'number':
        input.inputMode = 'numeric';
        break;
      case 'url':
        input.inputMode = 'url';
        break;
      default:
        if (input.tagName === 'TEXTAREA') {
          input.inputMode = 'text';
        }
    }
  }
}

// Initialize mobile form enhancements
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on the PDF viewer page - don't initialize mobile form enhancements
  const isPDFViewer = window.location.pathname.includes('/view') || document.querySelector('#pdf-viewer-container');

  if (window.innerWidth <= 768 && !isPDFViewer) {
    new MobileFormEnhancer();
  }
});

// Handle window resize for mobile features
window.addEventListener('resize', () => {
  // Check if we're on the PDF viewer page - don't reinitialize mobile enhancements
  const isPDFViewer = window.location.pathname.includes('/view') || document.querySelector('#pdf-viewer-container');

  // Reinitialize mobile features if switching to/from mobile
  if (window.innerWidth <= 768) {
    if (!isPDFViewer) {
      // Remove any existing mobile features and reinitialize
      const existingProgress = document.querySelector('.reading-progress');
      const existingBackToTop = document.querySelector('.back-to-top-mobile');

      if (!existingProgress || !existingBackToTop) {
        new MobileArticleReader();
      }

      // Initialize form enhancements if not already done
      if (!window.mobileFormEnhancer) {
        window.mobileFormEnhancer = new MobileFormEnhancer();
      }
    }
  } else {
    // Clean up mobile-only features on desktop
    const progressBar = document.querySelector('.reading-progress');
    const backToTop = document.querySelector('.back-to-top-mobile');

    if (progressBar) progressBar.remove();
    if (backToTop) backToTop.remove();
  }
});

// Make toggleUserDropdown available immediately on window object
window.toggleUserDropdown = function(event) {
  event.preventDefault();
  event.stopPropagation();

  const dropdown = event.target.closest('.user-dropdown');
  if (!dropdown) return;
  
  const menu = dropdown.querySelector('.dropdown-menu');
  if (!menu) return;

  // Close other dropdowns
  document.querySelectorAll('.dropdown-menu.show').forEach(otherMenu => {
    if (otherMenu !== menu) {
      otherMenu.classList.remove('show');
      const parentDropdown = otherMenu.closest('.user-dropdown');
      if (parentDropdown) {
        parentDropdown.classList.remove('active');
      }
    }
  });

  // Toggle current dropdown
  menu.classList.toggle('show');
  dropdown.classList.toggle('active');
};

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
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
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
        window.location.href = window.location.pathname + window.location.search;
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
}

// Register form submission
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
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
          window.location.href = window.location.pathname + window.location.search;
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
}

// Global logout function
window.logout = async function() {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });

    if (response.ok) {
      window.location.href = window.location.pathname + window.location.search;
    }
  } catch (error) {
    console.error('Logout error:', error);
    window.location.href = window.location.pathname + window.location.search;
  }
};

// Toggle user dropdown function (already defined above - this is a duplicate that can be removed)

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
  if (!event.target.closest('.user-dropdown')) {
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
      menu.classList.remove('show');
      menu.closest('.user-dropdown').classList.remove('active');
    });
  }
});

// Logout function
async function logout() {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      window.location.href = window.location.pathname + window.location.search;
    } else {
      console.error('Logout failed');
    }
  } catch (error) {
    console.error('Error during logout:', error);
  }
}

// Professional Authentication System
class ProfessionalAuth {
  constructor() {
    this.init();
  }

  init() {
    this.setupTabSwitching();
    this.setupPasswordToggles();
    this.setupPasswordStrength();
    this.setupFormValidation();
    this.setupFormSubmission();
    this.setupAnimations();
    this.handleUrlParameters();
  }

  // Tab switching functionality
  setupTabSwitching() {
    const tabBtns = document.querySelectorAll('.auth-tab-btn');
    const tabIndicator = document.querySelector('.auth-tab-indicator');

    tabBtns.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.dataset.tab);
      });
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab indicator
    const tabSwitcher = document.querySelector('.auth-tab-switcher');
    tabSwitcher.setAttribute('data-active', tabName);

    // Update form containers
    document.querySelectorAll('.auth-form-container').forEach(container => {
      container.classList.remove('active');
    });
    document.getElementById(`${tabName}-form-container`).classList.add('active');

    // Clear messages
    this.clearMessage();

    // Add smooth transition
    this.addTransitionEffect();
  }

  // Password visibility toggle
  setupPasswordToggles() {
    document.querySelectorAll('.password-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        const input = e.target.closest('.input-wrapper').querySelector('.form-input');
        this.togglePasswordVisibility(input);
      });
    });
  }

  togglePasswordVisibility(input) {
    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;

    const toggle = input.closest('.input-wrapper').querySelector('.password-toggle');
    const icon = toggle.querySelector('.eye-icon');

    if (type === 'text') {
      icon.innerHTML = `
        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 101.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .806 0 1.58-.097 2.32-.284z" />
      `;
    } else {
      icon.innerHTML = `
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
      `;
    }
  }

  // Password strength indicator
  setupPasswordStrength() {
    const passwordInput = document.getElementById('signup-password');
    if (!passwordInput) return;

    passwordInput.addEventListener('input', (e) => {
      this.updatePasswordStrength(e.target.value);
    });
  }

  updatePasswordStrength(password) {
    const strengthBar = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');

    if (!strengthBar || !strengthText) return;

    let strength = 0;
    let feedback = [];

    // Length check
    if (password.length >= 8) {
      strength += 25;
      feedback.push('length');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      strength += 25;
      feedback.push('lowercase');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      strength += 25;
      feedback.push('uppercase');
    }

    // Number or special character check
    if (/[\d\W]/.test(password)) {
      strength += 25;
      feedback.push('special');
    }

    // Update visual indicator
    strengthBar.style.width = strength + '%';

    // Update color based on strength
    if (strength < 25) {
      strengthBar.style.background = 'linear-gradient(90deg, #ef4444, #ef4444)';
      strengthText.textContent = 'Very weak';
    } else if (strength < 50) {
      strengthBar.style.background = 'linear-gradient(90deg, #f59e0b, #f59e0b)';
      strengthText.textContent = 'Weak';
    } else if (strength < 75) {
      strengthBar.style.background = 'linear-gradient(90deg, #eab308, #eab308)';
      strengthText.textContent = 'Fair';
    } else if (strength < 100) {
      strengthBar.style.background = 'linear-gradient(90deg, #10b981, #10b981)';
      strengthText.textContent = 'Good';
    } else {
      strengthBar.style.background = 'linear-gradient(90deg, #10b981, #059669)';
      strengthText.textContent = 'Strong';
    }
  }

  // Form validation
  setupFormValidation() {
    document.querySelectorAll('.form-input').forEach(input => {
      input.addEventListener('blur', (e) => {
        this.validateField(e.target);
      });

      input.addEventListener('input', (e) => {
        this.clearFieldError(e.target);
      });
    });
  }

  validateField(input) {
    const value = input.value.trim();
    const fieldName = input.name || input.id;
    let isValid = true;
    let errorMessage = '';

    // Field-specific validation
    switch (fieldName) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          isValid = false;
          errorMessage = 'Please enter a valid email address';
        }
        break;

      case 'password':
        if (value.length < 8) {
          isValid = false;
          errorMessage = 'Password must be at least 8 characters';
        }
        break;

      case 'name':
        if (value.length < 2) {
          isValid = false;
          errorMessage = 'Name must be at least 2 characters';
        }
        break;

      default:
        if (input.hasAttribute('required') && !value) {
          isValid = false;
          errorMessage = 'This field is required';
        }
    }

    if (!isValid) {
      this.showFieldError(input, errorMessage);
    } else {
      this.clearFieldError(input);
    }

    return isValid;
  }

  showFieldError(input, message) {
    this.clearFieldError(input);

    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;

    Object.assign(errorDiv.style, {
      color: '#ef4444',
      fontSize: '0.875rem',
      marginTop: '0.5rem',
      fontWeight: '500',
      animation: 'slideInDown 0.2s ease-out'
    });

    input.closest('.form-field-group').appendChild(errorDiv);
    input.classList.add('field-error-input');

    // Add error styling to input
    input.style.borderColor = '#ef4444';
    input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
  }

  clearFieldError(input) {
    const fieldGroup = input.closest('.form-field-group');
    const errorDiv = fieldGroup.querySelector('.field-error');
    if (errorDiv) {
      errorDiv.remove();
    }

    input.classList.remove('field-error-input');
    input.style.borderColor = '';
    input.style.boxShadow = '';
  }

  // Form submission
  setupFormSubmission() {
    // Sign In Form
    const signinForm = document.getElementById('signin-form');
    if (signinForm) {
      signinForm.addEventListener('submit', (e) => {
        this.handleSignIn(e);
      });
    }

    // Sign Up Form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        this.handleSignUp(e);
      });
    }
  }

  async handleSignIn(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    // Validate form
    if (!this.validateForm(e.target)) {
      return;
    }

    try {
      this.showMessage('Signing in...', 'info');
      this.setLoadingState(e.target, true);

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
        this.showMessage('Login successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = window.location.pathname + window.location.search;
        }, 1000);
      } else {
        if (data.requiresVerification && data.userId) {
          this.showMessage(`${data.error} Redirecting to verification...`, 'error');
          setTimeout(() => {
            window.location.href = `/verify-email?userId=${data.userId}`;
          }, 2000);
        } else {
          this.showMessage(data.error || 'Login failed', 'error');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showMessage('Network error. Please try again.', 'error');
    } finally {
      this.setLoadingState(e.target, false);
    }
  }

  async handleSignUp(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const passwordConfirm = formData.get('password_confirm');

    // Validate form
    if (!this.validateForm(e.target)) {
      return;
    }

    // Check password confirmation
    if (password !== passwordConfirm) {
      this.showMessage('Passwords do not match. Please try again.', 'error');
      return;
    }

    try {
      this.showMessage('Creating account...', 'info');
      this.setLoadingState(e.target, true);

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
          this.showMessage('Account created! Redirecting to email verification...', 'success');
          setTimeout(() => {
            window.location.href = `/verify-email?userId=${data.userId}`;
          }, 1500);
        } else {
          this.showMessage('Registration successful! Redirecting...', 'success');
          setTimeout(() => {
            window.location.href = window.location.pathname + window.location.search;
          }, 1000);
        }
      } else {
        this.showMessage(data.error || 'Registration failed', 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.showMessage('Network error. Please try again.', 'error');
    } finally {
      this.setLoadingState(e.target, false);
    }
  }

  validateForm(form) {
    const inputs = form.querySelectorAll('.form-input');
    let isValid = true;

    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  setLoadingState(form, isLoading) {
    const submitBtn = form.querySelector('.submit-button');
    const inputs = form.querySelectorAll('.form-input');

    if (isLoading) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Processing...</span><svg class="submit-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>';
      inputs.forEach(input => input.disabled = true);
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = form.id === 'signin-form' ? '<span>Sign In</span><svg class="submit-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H6a1 1 0 100 2h4.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" /></svg>' : '<span>Create Account</span><svg class="submit-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H6a1 1 0 100 2h4.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" /></svg>';
      inputs.forEach(input => input.disabled = false);
    }
  }

  // Animations and effects
  setupAnimations() {
    this.setupInputFocusEffects();
    this.setupHoverEffects();
  }

  setupInputFocusEffects() {
    document.querySelectorAll('.form-input').forEach(input => {
      input.addEventListener('focus', (e) => {
        const wrapper = e.target.closest('.input-wrapper');
        wrapper.style.transform = 'translateY(-1px)';
        wrapper.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
      });

      input.addEventListener('blur', (e) => {
        const wrapper = e.target.closest('.input-wrapper');
        wrapper.style.transform = '';
        wrapper.style.boxShadow = '';
      });
    });
  }

  setupHoverEffects() {
    document.querySelectorAll('.oauth-button').forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateY(-2px)';
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  addTransitionEffect() {
    const formContainer = document.querySelector('.auth-form-container.active');
    if (formContainer) {
      formContainer.style.animation = 'none';
      setTimeout(() => {
        formContainer.style.animation = 'fadeInUp 0.4s ease-out';
      }, 10);
    }
  }

  // Message handling
  showMessage(message, type = 'info') {
    const messageContainer = document.querySelector('.auth-message-container');
    if (!messageContainer) return;

    messageContainer.innerHTML = `
      <div class="auth-message ${type}">
        <div class="message-content">
          <svg class="message-icon" viewBox="0 0 20 20" fill="currentColor">
            ${type === 'success' ? '<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />' :
             type === 'error' ? '<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />' :
             '<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />'}
          </svg>
          <span>${message}</span>
        </div>
      </div>
    `;

    // Auto-hide success messages
    if (type === 'success') {
      setTimeout(() => {
        this.clearMessage();
      }, 5000);
    }
  }

  clearMessage() {
    const messageContainer = document.querySelector('.auth-message-container');
    if (messageContainer) {
      messageContainer.innerHTML = '';
    }
  }

  // URL parameter handling
  handleUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const message = urlParams.get('message');
    const verified = urlParams.get('verified');

    if (verified === 'true') {
      this.showMessage('Email verified successfully! You can now sign in to your account.', 'success');
      this.cleanUrl();
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

      this.showMessage(errorMessage, 'error');
      this.cleanUrl();
    }
  }

  cleanUrl() {
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }
}

// Initialize professional authentication when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if we're on the login page
  if (document.querySelector('.professional-auth-wrapper')) {
    new ProfessionalAuth();
  }
});

// Legacy functions for backward compatibility
function showLogin() {
  if (window.professionalAuth) {
    window.professionalAuth.switchTab('signin');
  }
}

function showRegister() {
  if (window.professionalAuth) {
    window.professionalAuth.switchTab('signup');
  }
}

function showMessage(message, type = 'info') {
  if (window.professionalAuth) {
    window.professionalAuth.showMessage(message, type);
  }
}

function clearMessage() {
  if (window.professionalAuth) {
    window.professionalAuth.clearMessage();
  }
}

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

// Toggle user dropdown function
window.toggleUserDropdown = function(event) {
  event.preventDefault();
  event.stopPropagation();

  const dropdown = event.target.closest('.user-dropdown');
  if (!dropdown) return;

  const menu = dropdown.querySelector('.dropdown-menu');
  if (!menu) return;

  // Close other dropdowns
  document.querySelectorAll('.dropdown-menu.show').forEach(otherMenu => {
    if (otherMenu !== menu) {
      otherMenu.classList.remove('show');
      const parentDropdown = otherMenu.closest('.user-dropdown');
      if (parentDropdown) {
        parentDropdown.classList.remove('active');
      }
    }
  });

  // Toggle current dropdown
  menu.classList.toggle('show');
  dropdown.classList.toggle('active');
};

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
  if (!event.target.closest('.user-dropdown')) {
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
      menu.classList.remove('show');
      menu.closest('.user-dropdown').classList.remove('active');
    });
  }
});