// Faith Defenders Admin Security Enhancement System
// Cloudflare-compatible admin security measures

// Admin Security Manager
class AdminSecurityManager {
  constructor() {
    this.adminConfig = {
      sessionTimeout: 15 * 60 * 1000, // 15 minutes for admin sessions
      maxConcurrentSessions: 3,
      adminActivityTimeout: 5 * 60 * 1000, // 5 minutes of inactivity
      suspiciousActivityThreshold: 10,
      adminPrivilegeLevels: {
        super_admin: 100,
        admin: 80,
        moderator: 60,
        editor: 40,
        viewer: 20
      },
      criticalActions: [
        'delete_user',
        'delete_article',
        'delete_resource',
        'change_user_role',
        'system_settings',
        'database_backup',
        'user_ban'
      ]
    };

    this.adminState = {
      sessionStartTime: Date.now(),
      lastActivityTime: Date.now(),
      activityCount: 0,
      suspiciousActivities: [],
      currentPrivilegeLevel: 0,
      sessionId: this.generateSessionId(),
      adminActions: [],
      securityAlerts: []
    };

    // Initialize audit trail before other methods
    this.initializeAdminAuditTrail();

    this.init();
  }

  init() {
    this.setupAdminSessionManagement();
    this.initializeAdminPrivilegeValidation();
    this.setupAdminActivityMonitoring();
    this.enhanceAdminInterfaceSecurity();
    this.setupAdminActionLogging();
    this.initializeAdminThreatDetection();
    this.setupAdminSecurityHeaders();
    this.enhanceAdminAuthentication();
  }

  generateSessionId() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Admin Session Management
  setupAdminSessionManagement() {
    // Enhanced session timeout for admin users
    this.sessionCheckInterval = setInterval(() => {
      this.checkAdminSessionTimeout();
    }, 60000); // Check every minute

    // Track admin activity
    this.setupAdminActivityTracking();

    // Handle admin session warnings
    this.setupSessionWarningSystem();
  }

  setupAdminActivityTracking() {
    const adminActions = [
      'click', 'keydown', 'scroll', 'mousemove',
      'submit', 'change', 'focus', 'blur'
    ];

    adminActions.forEach(action => {
      document.addEventListener(action, () => {
        this.updateAdminActivity();
      }, { passive: true });
    });

    // Track admin-specific actions
    this.trackAdminSpecificActions();
  }

  trackAdminSpecificActions() {
    // Track admin panel navigation
    const adminLinks = document.querySelectorAll('a[href*="/admin"]');
    adminLinks.forEach(link => {
      link.addEventListener('click', () => {
        this.logAdminAction('navigation', {
          to: link.href,
          timestamp: Date.now()
        });
      });
    });

    // Track admin form submissions
    const adminForms = document.querySelectorAll('form');
    adminForms.forEach(form => {
      form.addEventListener('submit', () => {
        this.logAdminAction('form_submission', {
          formId: form.id || form.className,
          timestamp: Date.now()
        });
      });
    });

    // Track admin button clicks
    const adminButtons = document.querySelectorAll('.admin-btn, button');
    adminButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.logAdminAction('button_click', {
          buttonText: button.textContent?.trim(),
          buttonClass: button.className,
          timestamp: Date.now()
        });
      });
    });
  }

  updateAdminActivity() {
    this.adminState.lastActivityTime = Date.now();
    this.adminState.activityCount++;

    // Reset session warning if shown
    this.clearSessionWarning();
  }

  checkAdminSessionTimeout() {
    const now = Date.now();
    const sessionAge = now - this.adminState.sessionStartTime;
    const inactivityTime = now - this.adminState.lastActivityTime;

    // Check for session timeout (15 minutes total)
    if (sessionAge > this.adminConfig.sessionTimeout) {
      this.handleAdminSessionTimeout('session_expired');
      return;
    }

    // Check for inactivity timeout (5 minutes)
    if (inactivityTime > this.adminConfig.adminActivityTimeout) {
      this.showAdminInactivityWarning();
    }
  }

  setupSessionWarningSystem() {
    // Create session warning modal
    this.createSessionWarningModal();
  }

  createSessionWarningModal() {
    const modal = document.createElement('div');
    modal.id = 'admin-session-warning-modal';
    modal.className = 'admin-modal';
    modal.innerHTML = `
      <div class="admin-modal-content" style="max-width: 400px;">
        <div class="admin-modal-header">
          <h3 style="color: #f59e0b; margin: 0;">
            <i class="fas fa-exclamation-triangle"></i> Session Warning
          </h3>
        </div>
        <div class="admin-modal-body">
          <p style="margin-bottom: 1rem;">Your admin session will expire soon due to inactivity.</p>
          <p style="margin-bottom: 1.5rem; font-size: 0.9rem; color: #64748b;">
            For security reasons, admin sessions expire after 15 minutes of total time or 5 minutes of inactivity.
          </p>
          <div style="display: flex; gap: 0.75rem;">
            <button onclick="window.adminSecurity.extendAdminSession()" class="admin-btn admin-btn-primary" style="flex: 1;">
              <i class="fas fa-clock"></i> Extend Session
            </button>
            <button onclick="window.adminSecurity.logoutAdmin()" class="admin-btn admin-btn-outline" style="flex: 1;">
              <i class="fas fa-sign-out-alt"></i> Logout Now
            </button>
          </div>
        </div>
      </div>
    `;

    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    document.body.appendChild(modal);
  }

  showAdminInactivityWarning() {
    const modal = document.getElementById('admin-session-warning-modal');
    if (modal && modal.style.display === 'none') {
      modal.style.display = 'flex';
      this.logAdminAction('session_warning_shown', {
        timestamp: Date.now()
      });
    }
  }

  clearSessionWarning() {
    const modal = document.getElementById('admin-session-warning-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  extendAdminSession() {
    this.adminState.sessionStartTime = Date.now();
    this.adminState.lastActivityTime = Date.now();
    this.clearSessionWarning();

    this.logAdminAction('session_extended', {
      timestamp: Date.now()
    });

    // Show success message
    this.showAdminSecurityMessage('Admin session extended successfully', 'success');
  }

  handleAdminSessionTimeout(reason) {
    this.logAdminAction('session_timeout', {
      reason,
      sessionDuration: Date.now() - this.adminState.sessionStartTime,
      timestamp: Date.now()
    });

    // Clear session data
    this.clearAdminSessionData();

    // Show timeout message
    this.showAdminSecurityMessage(
      'Your admin session has expired for security reasons. Please log in again.',
      'warning'
    );

    // Redirect to login after delay
    setTimeout(() => {
      if (typeof window.adminLogout === 'function') {
        window.adminLogout();
      } else {
        window.location.href = '/auth/login';
      }
    }, 3000);
  }

  clearAdminSessionData() {
    // Clear admin-specific session data
    localStorage.removeItem('admin_session_id');
    localStorage.removeItem('admin_last_activity');
    sessionStorage.removeItem('admin_privileges');

    // Clear intervals
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }
  }

  // Admin Privilege Validation
  initializeAdminPrivilegeValidation() {
    this.validateCurrentAdminPrivileges();
    this.setupPrivilegeBasedUI();
    this.enhanceAdminActionValidation();
  }

  validateCurrentAdminPrivileges() {
    // Get admin role from page data or API
    const adminRoleElement = document.querySelector('[data-admin-role]');
    const adminRole = adminRoleElement?.dataset.adminRole || 'user';

    this.adminState.currentPrivilegeLevel = this.adminConfig.adminPrivilegeLevels[adminRole] || 0;

    // Store in session storage for persistence
    sessionStorage.setItem('admin_privileges', JSON.stringify({
      role: adminRole,
      level: this.adminState.currentPrivilegeLevel,
      timestamp: Date.now()
    }));

    this.logAdminAction('privilege_validation', {
      role: adminRole,
      level: this.adminState.currentPrivilegeLevel,
      timestamp: Date.now()
    });
  }

  setupPrivilegeBasedUI() {
    // Hide/show UI elements based on privileges
    this.applyPrivilegeBasedRestrictions();

    // Add privilege indicators
    this.addPrivilegeIndicators();
  }

  applyPrivilegeBasedRestrictions() {
    const privilegeLevel = this.adminState.currentPrivilegeLevel;

    // Super admin only elements
    if (privilegeLevel < 100) {
      const superAdminElements = document.querySelectorAll('[data-requires-privilege="100"]');
      superAdminElements.forEach(el => {
        el.style.display = 'none';
      });
    }

    // Admin level elements (80+)
    if (privilegeLevel < 80) {
      const adminElements = document.querySelectorAll('[data-requires-privilege="80"]');
      adminElements.forEach(el => {
        el.style.display = 'none';
      });
    }

    // Moderator level elements (60+)
    if (privilegeLevel < 60) {
      const moderatorElements = document.querySelectorAll('[data-requires-privilege="60"]');
      moderatorElements.forEach(el => {
        el.style.display = 'none';
      });
    }

    // Editor level elements (40+)
    if (privilegeLevel < 40) {
      const editorElements = document.querySelectorAll('[data-requires-privilege="40"]');
      editorElements.forEach(el => {
        el.style.display = 'none';
      });
    }
  }

  addPrivilegeIndicators() {
    const privilegeIndicators = document.querySelectorAll('[data-show-privilege-level]');
    privilegeIndicators.forEach(indicator => {
      const requiredLevel = parseInt(indicator.dataset.showPrivilegeLevel);
      if (this.adminState.currentPrivilegeLevel >= requiredLevel) {
        indicator.style.display = 'inline-block';
      } else {
        indicator.style.display = 'none';
      }
    });
  }

  enhanceAdminActionValidation() {
    // Add privilege validation to critical actions
    this.adminConfig.criticalActions.forEach(action => {
      const actionElements = document.querySelectorAll(`[data-admin-action="${action}"]`);
      actionElements.forEach(element => {
        element.addEventListener('click', (e) => {
          if (!this.validateAdminAction(action)) {
            e.preventDefault();
            this.showAdminSecurityMessage(
              'You do not have sufficient privileges to perform this action.',
              'error'
            );
            return false;
          }
        });
      });
    });
  }

  validateAdminAction(action) {
    const requiredPrivileges = {
      'delete_user': 80,
      'delete_article': 60,
      'delete_resource': 60,
      'change_user_role': 80,
      'system_settings': 100,
      'database_backup': 100,
      'user_ban': 60
    };

    const requiredLevel = requiredPrivileges[action];
    if (!requiredLevel) return true; // Action doesn't require special privileges

    const hasPrivilege = this.adminState.currentPrivilegeLevel >= requiredLevel;

    this.logAdminAction('privilege_check', {
      action,
      requiredLevel,
      currentLevel: this.adminState.currentPrivilegeLevel,
      granted: hasPrivilege,
      timestamp: Date.now()
    });

    return hasPrivilege;
  }

  // Admin Activity Monitoring
  setupAdminActivityMonitoring() {
    this.monitorAdminActions();
    this.setupAdminBehaviorAnalysis();
    this.initializeAdminAuditTrail();
  }

  initializeAdminAuditTrail() {
    // Initialize audit trail for admin actions
    this.adminAuditTrail = [];
    this.auditTrailMaxSize = 100;
  }

  setupAdminBehaviorAnalysis() {
    // Analyze admin behavior patterns
    this.adminBehaviorPatterns = {
      normalActivityHours: [9, 10, 11, 12, 13, 14, 15, 16, 17], // 9 AM to 5 PM
      normalActionsPerMinute: 10,
      normalSessionDuration: 2 * 60 * 60 * 1000 // 2 hours
    };
  }

  monitorAdminActions() {
    // Monitor all admin actions for suspicious patterns
    const adminActions = [
      'user_delete', 'user_role_change', 'article_delete',
      'resource_delete', 'settings_change', 'bulk_action'
    ];

    adminActions.forEach(action => {
      const actionElements = document.querySelectorAll(`[data-admin-action="${action}"]`);
      actionElements.forEach(element => {
        element.addEventListener('click', () => {
          this.recordAdminActivity(action, element);
        });
      });
    });
  }

  recordAdminActivity(action, element) {
    const activity = {
      action,
      timestamp: Date.now(),
      elementId: element.id,
      elementClass: element.className,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent
    };

    this.adminState.adminActions.push(activity);

    // Keep only last 100 actions
    if (this.adminState.adminActions.length > 100) {
      this.adminState.adminActions.shift();
    }

    // Check for suspicious patterns
    this.analyzeAdminBehavior(activity);
  }

  analyzeAdminBehavior(currentActivity) {
    const recentActions = this.adminState.adminActions.slice(-10);
    const suspiciousPatterns = this.detectSuspiciousPatterns(recentActions);

    if (suspiciousPatterns.length > 0) {
      this.adminState.suspiciousActivities.push({
        patterns: suspiciousPatterns,
        timestamp: Date.now(),
        recentActions: recentActions
      });

      // Alert if too many suspicious activities
      if (this.adminState.suspiciousActivities.length >= this.adminConfig.suspiciousActivityThreshold) {
        this.handleSuspiciousAdminActivity();
      }
    }
  }

  detectSuspiciousPatterns(actions) {
    const patterns = [];

    // Rapid fire actions (more than 5 actions in 10 seconds)
    const recentActions = actions.filter(a => Date.now() - a.timestamp < 10000);
    if (recentActions.length > 5) {
      patterns.push('rapid_actions');
    }

    // Multiple delete actions in short time
    const deleteActions = actions.filter(a =>
      a.action.includes('delete') && Date.now() - a.timestamp < 30000
    );
    if (deleteActions.length > 3) {
      patterns.push('multiple_deletes');
    }

    // Unusual time patterns (actions at unusual hours)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      patterns.push('unusual_hours');
    }

    return patterns;
  }

  handleSuspiciousAdminActivity() {
    this.logAdminAction('suspicious_activity_detected', {
      suspiciousCount: this.adminState.suspiciousActivities.length,
      timestamp: Date.now()
    });

    // Show warning to admin
    this.showAdminSecurityMessage(
      'Suspicious activity detected. Your actions are being monitored.',
      'warning'
    );

    // Could trigger additional security measures here
    this.enableEnhancedMonitoring();
  }

  enableEnhancedMonitoring() {
    // Enable more detailed logging
    this.enhancedMonitoringEnabled = true;

    // Could add additional security measures like:
    // - Require additional authentication for critical actions
    // - Send alerts to security team
    // - Log all keystrokes temporarily
  }

  // Admin Action Logging
  setupAdminActionLogging() {
    this.initializeAdminAuditLog();
    this.setupAdminActionExport();
  }

  initializeAdminAuditLog() {
    // Create audit log container if it doesn't exist
    if (!document.getElementById('admin-audit-log')) {
      this.createAdminAuditLogContainer();
    }
  }

  createAdminAuditLogContainer() {
    const container = document.createElement('div');
    container.id = 'admin-audit-log';
    container.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      width: 300px;
      max-height: 200px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      font-size: 12px;
      padding: 10px;
      border-radius: 5px;
      overflow-y: auto;
      display: none;
      z-index: 9999;
    `;

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
        <strong>Admin Audit Log</strong>
        <button onclick="this.parentElement.parentElement.style.display='none'" style="background: none; border: none; color: white; cursor: pointer;">×</button>
      </div>
      <div id="admin-audit-entries"></div>
    `;

    document.body.appendChild(container);
  }

  logAdminAction(action, details = {}) {
    const logEntry = {
      action,
      details,
      timestamp: Date.now(),
      sessionId: this.adminState.sessionId,
      privilegeLevel: this.adminState.currentPrivilegeLevel
    };

    // Add to audit trail
    this.adminAuditTrail.push(logEntry);

    // Keep audit trail at max size
    if (this.adminAuditTrail.length > this.auditTrailMaxSize) {
      this.adminAuditTrail.shift();
    }

    // Add to audit log display
    this.addToAuditLogDisplay(logEntry);

    // Store in admin state
    this.adminState.adminActions.push(logEntry);

    // Send to server for persistent logging (now local storage)
    this.sendAdminActionToServer(logEntry);
  }

  addToAuditLogDisplay(logEntry) {
    const container = document.getElementById('admin-audit-entries');
    if (!container) return;

    const entry = document.createElement('div');
    entry.style.cssText = `
      margin-bottom: 3px;
      padding: 2px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    `;

    const time = new Date(logEntry.timestamp).toLocaleTimeString();
    entry.innerHTML = `
      <div style="font-weight: bold;">${time} - ${logEntry.action}</div>
      <div style="font-size: 11px; color: #ccc;">${JSON.stringify(logEntry.details).substring(0, 50)}...</div>
    `;

    container.appendChild(entry);

    // Keep only last 20 entries in display
    while (container.children.length > 20) {
      container.removeChild(container.firstChild);
    }

    // Auto-scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  async sendAdminActionToServer(logEntry) {
    // In Cloudflare Workers environment, we can't maintain persistent state
    // So we'll just log locally instead of sending to server
    try {
      console.log('Admin action logged locally:', logEntry);
      // Store in localStorage for client-side persistence (limited)
      const existingLogs = JSON.parse(localStorage.getItem('admin_audit_logs') || '[]');
      existingLogs.push(logEntry);
      // Keep only last 50 entries to avoid storage bloat
      if (existingLogs.length > 50) {
        existingLogs.shift();
      }
      localStorage.setItem('admin_audit_logs', JSON.stringify(existingLogs));
    } catch (error) {
      console.warn('Failed to store admin action locally:', error);
    }
  }

  setupAdminActionExport() {
    // Add export functionality for audit logs
    window.exportAdminAuditLog = () => {
      const data = {
        sessionId: this.adminState.sessionId,
        actions: this.adminState.adminActions,
        exportTime: Date.now()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-audit-log-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
  }

  // Admin Interface Security
  enhanceAdminInterfaceSecurity() {
    this.secureAdminForms();
    this.addAdminInterfaceProtections();
    this.setupAdminKeyboardSecurity();
  }

  secureAdminForms() {
    const adminForms = document.querySelectorAll('form');
    adminForms.forEach(form => {
      // Add CSRF token if not present
      if (!form.querySelector('input[name="csrf_token"]')) {
        const csrfToken = this.generateCSRFToken();
        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = 'csrf_token';
        csrfInput.value = csrfToken;
        form.appendChild(csrfInput);

        // Store CSRF token for API calls
        if (!this.adminState.csrfToken) {
          this.adminState.csrfToken = csrfToken;
        }
      }

      // Add form security attributes
      form.setAttribute('autocomplete', 'off');
      form.setAttribute('spellcheck', 'false');

      // Add form submission security
      form.addEventListener('submit', (e) => {
        if (!this.validateAdminForm(form)) {
          e.preventDefault();
          return false;
        }
      });
    });
  }

  generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  getCSRFHeaders() {
    if (this.adminState.csrfToken) {
      return {
        'x-csrf-token': this.adminState.csrfToken
      };
    }
    return {};
  }

  validateAdminForm(form) {
    // Check for suspicious input patterns
    const inputs = form.querySelectorAll('input, textarea, select');
    for (const input of inputs) {
      if (input.value && this.containsSuspiciousContent(input.value)) {
        this.showAdminSecurityMessage(
          'Suspicious content detected in form. Please review your input.',
          'error'
        );
        return false;
      }
    }

    return true;
  }

  containsSuspiciousContent(content) {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /onclick=/i,
      /eval\s*\(/i,
      /document\.cookie/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(content));
  }

  addAdminInterfaceProtections() {
    // Prevent right-click context menu on admin pages
    document.addEventListener('contextmenu', (e) => {
      if (window.location.pathname.includes('/admin')) {
        e.preventDefault();
        this.logAdminAction('context_menu_attempt', {
          timestamp: Date.now()
        });
      }
    });

    // Prevent drag and drop of external files
    document.addEventListener('dragover', (e) => {
      if (window.location.pathname.includes('/admin')) {
        e.preventDefault();
      }
    });

    document.addEventListener('drop', (e) => {
      if (window.location.pathname.includes('/admin')) {
        e.preventDefault();
        this.showAdminSecurityMessage(
          'File drop is not allowed in admin interface.',
          'warning'
        );
      }
    });
  }

  setupAdminKeyboardSecurity() {
    // Monitor for suspicious keyboard patterns
    let keySequence = '';
    const maxSequenceLength = 20;

    document.addEventListener('keydown', (e) => {
      if (!window.location.pathname.includes('/admin')) return;

      keySequence += e.key.toLowerCase();

      // Keep sequence at max length
      if (keySequence.length > maxSequenceLength) {
        keySequence = keySequence.slice(-maxSequenceLength);
      }

      // Check for suspicious patterns
      if (this.isSuspiciousKeySequence(keySequence)) {
        this.handleSuspiciousKeySequence(e);
      }
    });
  }

  isSuspiciousKeySequence(sequence) {
    const suspiciousPatterns = [
      'javascript:',
      '<script',
      'eval(',
      'document.cookie',
      'localStorage',
      'sessionStorage'
    ];

    return suspiciousPatterns.some(pattern =>
      sequence.includes(pattern.toLowerCase())
    );
  }

  handleSuspiciousKeySequence(event) {
    event.preventDefault();
    this.logAdminAction('suspicious_key_sequence', {
      sequence: event.key,
      timestamp: Date.now()
    });

    this.showAdminSecurityMessage(
      'Suspicious keyboard input detected.',
      'warning'
    );
  }

  // Admin Threat Detection
  initializeAdminThreatDetection() {
    this.setupAdminNetworkMonitoring();
    this.initializeAdminBehaviorAnalysis();
    this.setupAdminAnomalyDetection();
  }

  setupAdminNetworkMonitoring() {
    // Monitor admin API calls
    const originalFetch = window.fetch;
    window.fetch = async (url, options = {}) => {
      if (url.includes('/admin/api/')) {
        this.logAdminAction('admin_api_call', {
          url,
          method: options.method || 'GET',
          timestamp: Date.now()
        });
      }

      return originalFetch(url, options);
    };
  }

  initializeAdminBehaviorAnalysis() {
    // Analyze admin behavior patterns
    this.adminBehaviorPatterns = {
      normalActivityHours: [9, 10, 11, 12, 13, 14, 15, 16, 17], // 9 AM to 5 PM
      normalActionsPerMinute: 10,
      normalSessionDuration: 2 * 60 * 60 * 1000 // 2 hours
    };
  }

  setupAdminAnomalyDetection() {
    // Detect anomalous admin behavior
    setInterval(() => {
      this.detectAdminAnomalies();
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  detectAdminAnomalies() {
    const currentHour = new Date().getHours();
    const sessionDuration = Date.now() - this.adminState.sessionStartTime;
    const recentActions = this.adminState.adminActions.filter(
      action => Date.now() - action.timestamp < 60000 // Last minute
    );

    let anomalies = [];

    // Check unusual hours
    if (!this.adminBehaviorPatterns.normalActivityHours.includes(currentHour)) {
      anomalies.push('unusual_hours');
    }

    // Check excessive actions
    if (recentActions.length > this.adminBehaviorPatterns.normalActionsPerMinute) {
      anomalies.push('excessive_actions');
    }

    // Check long session
    if (sessionDuration > this.adminBehaviorPatterns.normalSessionDuration) {
      anomalies.push('long_session');
    }

    if (anomalies.length > 0) {
      this.logAdminAction('admin_anomaly_detected', {
        anomalies,
        currentHour,
        recentActionCount: recentActions.length,
        sessionDuration,
        timestamp: Date.now()
      });
    }
  }

  // Admin Security Headers
  setupAdminSecurityHeaders() {
    // Add admin-specific security headers
    const adminSecurityHeaders = {
      'X-Admin-Session': this.adminState.sessionId,
      'X-Admin-Privilege-Level': this.adminState.currentPrivilegeLevel,
      'X-Admin-Activity-Time': this.adminState.lastActivityTime
    };

    // Store for use in API calls
    this.adminSecurityHeaders = adminSecurityHeaders;
  }

  // Enhanced Admin Authentication
  enhanceAdminAuthentication() {
    this.setupAdminLoginSecurity();
    this.initializeAdminMFAValidation();
    this.setupAdminPasswordSecurity();
  }

  setupAdminLoginSecurity() {
    // Enhanced admin login validation
    const adminLoginForm = document.getElementById('admin-login-form') ||
                          document.querySelector('form[action*="/admin/login"]');

    if (adminLoginForm) {
      adminLoginForm.addEventListener('submit', (e) => {
        if (!this.validateAdminLoginAttempt(adminLoginForm)) {
          e.preventDefault();
          return false;
        }
      });
    }
  }

  validateAdminLoginAttempt(form) {
    const email = form.querySelector('input[name="email"]')?.value;
    const password = form.querySelector('input[name="password"]')?.value;

    // Basic validation
    if (!email || !password) {
      this.showAdminSecurityMessage('Email and password are required.', 'error');
      return false;
    }

    // Check for suspicious patterns
    if (this.containsSuspiciousContent(email) || this.containsSuspiciousContent(password)) {
      this.showAdminSecurityMessage('Invalid login credentials.', 'error');
      return false;
    }

    return true;
  }

  initializeAdminMFAValidation() {
    // Setup for future MFA implementation
    this.mfaEnabled = false;
    this.mfaRequired = this.adminState.currentPrivilegeLevel >= 80; // Admin level and above
  }

  setupAdminPasswordSecurity() {
    // Enhanced password requirements for admin accounts
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
      if (window.location.pathname.includes('/admin')) {
        input.addEventListener('input', () => {
          this.validateAdminPasswordStrength(input.value, input);
        });
      }
    });
  }

  validateAdminPasswordStrength(password, inputElement) {
    // Stricter requirements for admin passwords
    const requirements = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      noCommonWords: !/(password|admin|123456|qwerty)/i.test(password)
    };

    const score = Object.values(requirements).filter(Boolean).length;
    const isStrong = score >= 5; // All requirements met

    // Visual feedback
    if (inputElement) {
      if (isStrong) {
        inputElement.style.borderColor = '#10b981';
      } else if (score >= 3) {
        inputElement.style.borderColor = '#f59e0b';
      } else {
        inputElement.style.borderColor = '#ef4444';
      }
    }

    return isStrong;
  }

  // Public API Methods
  getAdminSecurityStatus() {
    return {
      sessionActive: true,
      privilegeLevel: this.adminState.currentPrivilegeLevel,
      sessionAge: Date.now() - this.adminState.sessionStartTime,
      lastActivity: this.adminState.lastActivityTime,
      suspiciousActivities: this.adminState.suspiciousActivities.length,
      enhancedMonitoring: this.enhancedMonitoringEnabled || false
    };
  }

  showAdminAuditLog() {
    const auditLog = document.getElementById('admin-audit-log');
    if (auditLog) {
      auditLog.style.display = auditLog.style.display === 'none' ? 'block' : 'none';
    }
  }

  logoutAdmin() {
    this.logAdminAction('admin_logout', {
      sessionDuration: Date.now() - this.adminState.sessionStartTime,
      timestamp: Date.now()
    });

    this.clearAdminSessionData();

    if (typeof window.adminLogout === 'function') {
      window.adminLogout();
    } else {
      window.location.href = '/auth/login';
    }
  }

  showAdminSecurityMessage(message, type = 'info') {
    const messageContainer = document.createElement('div');
    messageContainer.className = `admin-security-message admin-security-message-${type}`;
    messageContainer.innerHTML = `
      <div class="admin-security-message-content">
        <strong>Admin Security:</strong> ${message}
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
      zIndex: '10001',
      maxWidth: '400px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      backgroundColor: type === 'error' ? '#dc2626' :
                      type === 'warning' ? '#d97706' :
                      type === 'success' ? '#059669' : '#3b82f6'
    });

    document.body.appendChild(messageContainer);

    setTimeout(() => {
      if (messageContainer.parentNode) {
        messageContainer.parentNode.removeChild(messageContainer);
      }
    }, 5000);
  }

  // Cleanup
  cleanup() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    this.clearAdminSessionData();
  }
}

// Initialize Admin Security Manager
if (window.location.pathname.includes('/admin')) {
  window.adminSecurity = new AdminSecurityManager();

  // Add admin security status to window
  window.getAdminSecurityStatus = () => {
    return window.adminSecurity.getAdminSecurityStatus();
  };

  // Add admin audit log toggle
  window.toggleAdminAuditLog = () => {
    window.adminSecurity.showAdminAuditLog();
  };

  // Add admin security export
  window.exportAdminAuditLog = () => {
    window.adminSecurity.exportAdminAuditLog();
  };

  console.log('Faith Defenders Admin Security System initialized');
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.adminSecurity) {
    window.adminSecurity.cleanup();
  }
});

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
    console.log('loadDashboardData: Starting...');
    const response = await fetch('/admin/api/analytics', {
      credentials: 'include'
    });
    
    console.log('loadDashboardData: Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('loadDashboardData: Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      const analytics = data.analytics;
      const stats = analytics.contentStats;
      
      // Update statistics cards
      document.getElementById('total-users').textContent = stats.totalUsers;
      document.getElementById('users-change').textContent = `+${stats.newUsersThisMonth} this month`;
      
      document.getElementById('published-articles').textContent = stats.publishedArticles;
      document.getElementById('articles-change').textContent = `${stats.newArticlesThisMonth} published this month`;
      
      document.getElementById('total-resources').textContent = stats.totalResources;
      document.getElementById('resources-change').textContent = `+${stats.newResourcesThisMonth} this month`;
      
      document.getElementById('total-views').textContent = (stats.totalViews || 0).toLocaleString();
      document.getElementById('views-change').textContent = `${stats.viewsThisMonth || 0} this month`;
      
      // Load recent activity with real data
      loadRecentActivity(analytics.recentActivity);
      
      // Load recent content
      loadRecentContent();
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showAdminMessage('Failed to load dashboard data', 'error');
  }
};

async function loadRecentActivity(recentActivityData) {
  const activityEl = document.getElementById('recent-activity');
  if (!activityEl) return;
  
  if (!recentActivityData || recentActivityData.length === 0) {
    activityEl.innerHTML = '<div style="text-align: center; color: #64748b; padding: 1rem;">No recent activity</div>';
    return;
  }
  
  let html = '';
  recentActivityData.forEach(activity => {
    const icon = activity.activityType.includes('user') ? 'fa-user-plus' : 
                 activity.activityType.includes('article') ? 'fa-newspaper' :
                 activity.activityType.includes('resource') ? 'fa-book' : 
                 activity.activityType.includes('comment') ? 'fa-comment' :
                 activity.activityType.includes('login') ? 'fa-sign-in-alt' : 'fa-bell';
    
    // Calculate time ago
    const timeAgo = formatTimeAgo(activity.createdAt);
                 
    html += `
      <div style="display: flex; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #e2e8f0;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; margin-right: 0.75rem;">
          <i class="fas ${icon}" style="color: #64748b; font-size: 0.8rem;"></i>
        </div>
        <div style="flex: 1;">
          <div style="font-size: 0.9rem; color: #334155;">${activity.description}</div>
          <div style="font-size: 0.8rem; color: #64748b;">${timeAgo}</div>
        </div>
      </div>
    `;
  });
  
  activityEl.innerHTML = html;
}

function formatTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

async function loadRecentContent() {
  const contentEl = document.getElementById('recent-content');
  if (!contentEl) return;
  
  try {
    const [articlesRes, resourcesRes] = await Promise.all([
      fetch('/admin/api/articles', {
        method: 'GET',
        credentials: 'include'
      }),
      fetch('/admin/api/resources', {
        method: 'GET',
        credentials: 'include'
      })
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

// Global variables for search and filter state
let currentArticlesFilters = {
  search: '',
  status: 'all',
  category: 'all',
  author: 'all',
  page: 1
};

// Global variables for message pagination
let currentMessageFilters = {
  search: '',
  role: 'all',
  sort: 'oldest',
  dateRange: 'all',
  dateFrom: '',
  dateTo: '',
  mediaType: 'all',
  status: 'all',
  page: 1,
  limit: 20
};

let totalMessagePages = 1;
let totalMessages = 0;

// Real-time messaging variables
let messageWebSocket = null;
let messageEventSource = null; // Fallback for SSE
let currentMessages = [];
let isConnected = false;
let reconnectAttempts = 0;
let maxReconnectAttempts = 5;
let reconnectDelay = 1000; // Start with 1 second

// Typing indicator variables
let typingUsers = new Map(); // Map of userId -> {name, role, timestamp}
let typingTimeout = null;
let isTyping = false;

// Articles Management with Search and Filter
window.loadArticles = async function(filters = {}) {
  try {
    console.log('loadArticles: Starting...');

    // Merge with current filters
    Object.assign(currentArticlesFilters, filters);

    // Build query string
    const queryParams = new URLSearchParams();
    Object.entries(currentArticlesFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        queryParams.append(key, value);
      }
    });

    const url = `/admin/api/articles?${queryParams.toString()}`;
    console.log('loadArticles: Fetching from:', url);

    const response = await fetch(url, {
      credentials: 'include'
    });

    console.log('loadArticles: Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('loadArticles: Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const tableBody = document.getElementById('articles-table');
    const paginationContainer = document.getElementById('articles-pagination');

    if (!tableBody) {
      console.error('loadArticles: articles-table element not found!');
      return;
    }

    if (data.success && data.articles && data.articles.length > 0) {
      let html = '';
      data.articles.forEach(article => {
        const statusBadge = article.published ?
          '<span class="admin-badge admin-badge-success">Published</span>' :
          '<span class="admin-badge admin-badge-warning">Draft</span>';

        const categoryBadge = article.category_name ?
          `<span class="admin-badge admin-badge-info">${article.category_name}</span>` :
          '<span style="color: #9ca3af;">No Category</span>';

        html += `
          <tr>
            <td>
              <div style="font-weight: 500;">${article.title}</div>
              <div style="font-size: 0.8rem; color: #64748b;">${article.excerpt || 'No excerpt'}</div>
            </td>
            <td>${article.author_name}</td>
            <td>${categoryBadge}</td>
            <td>${statusBadge}</td>
            <td>${formatDate(article.created_at)}</td>
            <td>
              <div class="admin-table-actions">
                <a href="/admin/articles/${article.id}/edit" class="admin-btn admin-btn-sm admin-btn-outline">
                  <i class="fas fa-edit"></i> Edit
                </a>
                <button onclick="toggleArticleStatus(${article.id}, ${article.published})" class="admin-btn admin-btn-sm ${article.published ? 'admin-btn-warning' : 'admin-btn-success'}">
                  <i class="fas ${article.published ? 'fa-eye-slash' : 'fa-eye'}"></i> ${article.published ? 'Unpublish' : 'Publish'}
                </button>
                <button onclick="deleteArticle(${article.id}, '${article.title.replace(/'/g, "\\'")}')" class="admin-btn admin-btn-sm admin-btn-danger">
                  <i class="fas fa-trash"></i> Delete
                </button>
              </div>
            </td>
          </tr>
        `;
      });

      tableBody.innerHTML = html;

      // Update pagination
      if (paginationContainer && data.pagination) {
        updatePagination(paginationContainer, data.pagination, 'articles');
      }
    } else {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem;">
            <div class="admin-empty-state">
              <i class="fas fa-newspaper" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 1rem;"></i>
              <div style="color: #64748b; margin-bottom: 1rem;">No articles found</div>
              <a href="/admin/articles/new" class="admin-btn admin-btn-primary">
                <i class="fas fa-plus"></i> Create First Article
              </a>
            </div>
          </td>
        </tr>
      `;

      // Clear pagination
      if (paginationContainer) {
        paginationContainer.innerHTML = '';
      }
    }
  } catch (error) {
    console.error('Error loading articles:', error);
    showAdminMessage('Failed to load articles', 'error');
  }
};

// Update pagination display
function updatePagination(container, pagination, type) {
  if (!pagination || pagination.totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '<div class="admin-pagination">';

  // Previous button
  if (pagination.hasPrev) {
    html += `<button class="admin-btn admin-btn-sm admin-btn-outline" onclick="changePage(${pagination.currentPage - 1}, '${type}')">
      <i class="fas fa-chevron-left"></i> Previous
    </button>`;
  }

  // Page numbers
  const startPage = Math.max(1, pagination.currentPage - 2);
  const endPage = Math.min(pagination.totalPages, pagination.currentPage + 2);

  if (startPage > 1) {
    html += `<button class="admin-btn admin-btn-sm admin-btn-outline" onclick="changePage(1, '${type}')">1</button>`;
    if (startPage > 2) {
      html += '<span class="admin-pagination-dots">...</span>';
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const activeClass = i === pagination.currentPage ? 'admin-btn-primary' : 'admin-btn-outline';
    html += `<button class="admin-btn admin-btn-sm ${activeClass}" onclick="changePage(${i}, '${type}')">${i}</button>`;
  }

  if (endPage < pagination.totalPages) {
    if (endPage < pagination.totalPages - 1) {
      html += '<span class="admin-pagination-dots">...</span>';
    }
    html += `<button class="admin-btn admin-btn-sm admin-btn-outline" onclick="changePage(${pagination.totalPages}, '${type}')">${pagination.totalPages}</button>`;
  }

  // Next button
  if (pagination.hasNext) {
    html += `<button class="admin-btn admin-btn-sm admin-btn-outline" onclick="changePage(${pagination.currentPage + 1}, '${type}')">
      Next <i class="fas fa-chevron-right"></i>
    </button>`;
  }

  html += '</div>';
  container.innerHTML = html;
}

// Change page function
window.changePage = function(page, type) {
  if (type === 'articles') {
    currentArticlesFilters.page = page;
    loadArticles();
  } else if (type === 'resources') {
    currentResourcesFilters.page = page;
    loadResources();
  }
};

// Apply filters function
window.applyFilters = function(type) {
  const searchInput = document.getElementById(`${type}-search`);
  const statusSelect = document.getElementById(`${type}-status-filter`);
  const categorySelect = document.getElementById(`${type}-category-filter`);
  const authorSelect = document.getElementById(`${type}-author-filter`);

  const filters = {
    search: searchInput ? searchInput.value : '',
    status: statusSelect ? statusSelect.value : 'all',
    category: categorySelect ? categorySelect.value : 'all',
    author: authorSelect ? authorSelect.value : 'all',
    page: 1 // Reset to first page when applying filters
  };

  if (type === 'articles') {
    Object.assign(currentArticlesFilters, filters);
    loadArticles();
  } else if (type === 'resources') {
    Object.assign(currentResourcesFilters, filters);
    loadResources();
  }
};

// Clear filters function
window.clearFilters = function(type) {
  const searchInput = document.getElementById(`${type}-search`);
  const statusSelect = document.getElementById(`${type}-status-filter`);
  const categorySelect = document.getElementById(`${type}-category-filter`);
  const authorSelect = document.getElementById(`${type}-author-filter`);

  if (searchInput) searchInput.value = '';
  if (statusSelect) statusSelect.value = 'all';
  if (categorySelect) categorySelect.value = 'all';
  if (authorSelect) authorSelect.value = 'all';

  if (type === 'articles') {
    currentArticlesFilters = {
      search: '',
      status: 'all',
      category: 'all',
      author: 'all',
      page: 1
    };
    loadArticles();
  } else if (type === 'resources') {
    currentResourcesFilters = {
      search: '',
      type: 'all',
      category: 'all',
      status: 'all',
      author: 'all',
      page: 1
    };
    loadResources();
  }
};

// Initialize Quill Editor for Admin
let adminQuill = null;
let editQuill = null;

function initializeAdminEditor() {
  if (typeof Quill === 'undefined') {
    console.error('Quill is not loaded');
    return;
  }

  const editorElement = document.getElementById('admin-content-editor');
  if (!editorElement || adminQuill) {
    return; // Editor already initialized or element not found
  }

  // Common Quill configuration - only initialize once
  if (!window.quillConfigured) {
    // Configure font options
    const Font = Quill.import('formats/font');
    Font.whitelist = ['serif', 'monospace'];
    Quill.register(Font, true);

    // Configure size options
    const Size = Quill.import('formats/size');
    Size.whitelist = ['small', false, 'large', 'huge'];
    Quill.register(Size, true);

    // Create custom inline header formats
    const Inline = Quill.import('blots/inline');
    
    class HeaderSpan extends Inline {
      static create(value) {
        const node = super.create();
        node.setAttribute('data-header', value);
        node.className = `header-${value}`;
        return node;
      }
      
      static formats(node) {
        return node.getAttribute('data-header');
      }
    }
    
    HeaderSpan.blotName = 'headerspan';
    HeaderSpan.tagName = 'span';
    
    Quill.register(HeaderSpan);
    
    window.quillConfigured = true;
  }

  // Common toolbar handler functions
  const createImageHandler = function() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = () => {
      const file = input.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const range = this.quill.getSelection();
          if (range) {
            this.quill.insertEmbed(range.index, 'image', e.target.result);
          }
        };
        reader.readAsDataURL(file);
      }
    };
  };

  const createHeaderHandler = function(value) {
    const range = this.quill.getSelection();
    if (!range || range.length === 0) {
      // If no selection, use default behavior for the line
      this.quill.format('header', value);
      return;
    }

    // For text selection, use custom inline header format
    this.quill.formatText(range.index, range.length, 'headerspan', value);
    
    // Keep selection
    this.quill.setSelection(range.index, range.length);
  };

  const toolbarOptions = {
    container: '#editor-toolbar-admin',
    handlers: {
      'header': createHeaderHandler,
      'image': createImageHandler
    }
  };

  adminQuill = new Quill('#admin-content-editor', {
    modules: {
      toolbar: toolbarOptions
    },
    theme: 'snow',
    placeholder: 'Write your article content here...'
  });

  // Sync Quill content with hidden textarea
  adminQuill.on('text-change', function() {
    const textarea = document.getElementById('admin-content-editor-textarea');
    if (textarea) {
      textarea.value = adminQuill.root.innerHTML;
    }
  });
}

function initializeEditEditor() {
  if (typeof Quill === 'undefined') {
    console.error('Quill is not loaded');
    return;
  }

  const editorElement = document.getElementById('edit-content-editor');
  if (!editorElement || editQuill) {
    return; // Editor already initialized or element not found
  }

  const editToolbarOptions = {
    container: '#editor-toolbar-edit',
    handlers: {
      'header': createHeaderHandler,
      'image': createImageHandler
    }
  };

  editQuill = new Quill('#edit-content-editor', {
    modules: {
      toolbar: editToolbarOptions
    },
    theme: 'snow',
    placeholder: 'Edit your article content here...'
  });

  // Sync Quill content with hidden textarea
  editQuill.on('text-change', function() {
    const textarea = document.getElementById('edit-content');
    if (textarea) {
      textarea.value = editQuill.root.innerHTML;
    }
  });
}

window.createArticle = async function(e) {
  e.preventDefault();

  const form = e.target;

  // Update hidden textarea with custom editor content before submitting
  if (window.customEditors && window.customEditors.admin) {
    window.customEditors.admin.syncContent();
  }

  const formData = new FormData(form);
  const categoryId = formData.get('category_id');

  const articleData = {
    title: formData.get('title'),
    excerpt: formData.get('excerpt'),
    content: formData.get('content'),
    published: formData.get('published') === 'true',
    category_id: categoryId && categoryId !== '' ? parseInt(categoryId) : null
  };

  try {
    showAdminMessage('Creating article...', 'info');

    const response = await fetch('/admin/api/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...window.adminSecurity.getCSRFHeaders()
      },
      body: JSON.stringify(articleData),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAdminMessage('Article created successfully!', 'success');

      // Clear the form and editor
      form.reset();
      if (window.customEditors && window.customEditors.admin) {
        window.customEditors.admin.clear();
      }

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

  // Function to execute scripts in loaded content (for Chart.js and other JavaScript)
  function executeScriptsInContent(container) {
    if (!container) return;

    // Check if content contains Chart.js usage
    const contentHtml = container.innerHTML;
    const needsChart = contentHtml.includes('Chart') || contentHtml.includes('chart') ||
                      contentHtml.includes('new Chart') || contentHtml.includes('Chart(');

    // Load Chart.js if needed
    if (needsChart && !window.Chart) {
      console.log('Chart.js usage detected, loading Chart.js library...');
      const chartScript = document.createElement('script');
      chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      chartScript.onload = function() {
        console.log('Chart.js library loaded successfully');
        executeChartScripts(container);
      };
      chartScript.onerror = function() {
        console.error('Failed to load Chart.js library');
      };
      document.head.appendChild(chartScript);
    } else if (needsChart && window.Chart) {
      // Chart.js already loaded, execute scripts
      executeChartScripts(container);
    } else {
      // No Chart.js needed, execute other scripts normally
      executeOtherScripts(container);
    }
  }

  // Execute Chart.js specific scripts with proper timing
  function executeChartScripts(container) {
    const scripts = container.querySelectorAll('script');

    scripts.forEach(script => {
      if (script.src && script.src.includes('chart.js')) {
        console.log('Chart.js library script found, skipping execution');
        return;
      }

      try {
        if (script.textContent && (script.textContent.includes('Chart') || script.textContent.includes('chart'))) {
          // Chart.js script - execute with delay to ensure DOM is ready
          const scriptContent = script.textContent;
          console.log('Executing Chart.js script:', scriptContent.substring(0, 100) + '...');

          setTimeout(() => {
            try {
              const func = new Function(scriptContent);
              func();
              console.log('Chart.js script executed successfully');
            } catch (error) {
              console.error('Error executing Chart.js script:', error);
            }
          }, 100);
        } else if (script.src) {
          // External script - load it dynamically
          const newScript = document.createElement('script');
          newScript.src = script.src;
          newScript.async = false;
          document.head.appendChild(newScript);
          console.log('Loaded external script:', script.src);
        } else if (script.textContent) {
          // Other inline script - execute normally
          const scriptContent = script.textContent;
          console.log('Executing other inline script:', scriptContent.substring(0, 100) + '...');

          const func = new Function(scriptContent);
          func();
        }
      } catch (error) {
        console.error('Error executing script:', error);
      }
    });
  }

  // Execute non-Chart.js scripts
  function executeOtherScripts(container) {
    const scripts = container.querySelectorAll('script');

    scripts.forEach(script => {
      try {
        if (script.src) {
          // External script - load it dynamically
          const newScript = document.createElement('script');
          newScript.src = script.src;
          newScript.async = false;
          document.head.appendChild(newScript);
          console.log('Loaded external script:', script.src);
        } else if (script.textContent) {
          // Inline script - execute it
          const scriptContent = script.textContent;
          console.log('Executing inline script:', scriptContent.substring(0, 100) + '...');

          const func = new Function(scriptContent);
          func();
        }
      } catch (error) {
        console.error('Error executing script:', error);
      }
    });
  }

window.loadArticleForEdit = async function(articleId) {
  try {
    const response = await fetch(`/admin/api/articles/${articleId}`, {
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      const article = data.article;

      // Check each element exists before setting value
      const titleElement = document.getElementById('edit-title');
      const excerptElement = document.getElementById('edit-excerpt');
      const contentElement = document.getElementById('edit-content-editor-textarea');
      const publishedElement = document.getElementById('edit-published');

      console.log('Edit elements check:', {
        title: !!titleElement,
        excerpt: !!excerptElement,
        content: !!contentElement,
        published: !!publishedElement
      });

      if (titleElement) titleElement.value = article.title;
      if (excerptElement) excerptElement.value = article.excerpt || '';
      if (publishedElement) publishedElement.value = article.published.toString();

      // Set category selection
      const categoryElement = document.getElementById('edit-article-category-select');
      if (categoryElement && article.category_id) {
        categoryElement.value = article.category_id.toString();
      }

      // Use content as-is (it's already HTML formatted)
      const content = article.content || '';

      if (contentElement) contentElement.value = content;

      // Load content into custom editor with delay to ensure it's initialized
      setTimeout(() => {
        if (window.customEditors && window.customEditors.edit) {
          console.log('Setting content via custom editor');
          console.log('Article content:', content);
          window.customEditors.edit.setContent(content);

          // Execute scripts in custom editor content after setting
          setTimeout(() => {
            const editorElement = document.getElementById('edit-content-editor');
            if (editorElement) {
              executeScriptsInContent(editorElement);
            }
          }, 200);
        } else {
          console.log('Custom editor not available, setting content directly');
          // Fallback: set content directly on editor element
          const editEditor = document.getElementById('edit-content-editor');
          const textareaElement = document.getElementById('edit-content-editor-textarea');
          if (editEditor) {
            editEditor.innerHTML = content;
            // Also sync to textarea
            if (textareaElement) {
              textareaElement.value = content;
            }

            // Execute any script tags in the content for Chart.js and other JavaScript
            setTimeout(() => {
              executeScriptsInContent(editEditor);
            }, 100);
          }
        }
      }, 300);
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
  
  // Update hidden textarea with custom editor content before submitting
  if (window.customEditors && window.customEditors.edit) {
    window.customEditors.edit.syncContent();
  }
  
  const formData = new FormData(form);
  const categoryId = formData.get('category_id');
  
  const articleData = {
    title: formData.get('title'),
    excerpt: formData.get('excerpt'),
    content: formData.get('content'),
    published: formData.get('published') === 'true',
    category_id: categoryId && categoryId !== '' ? parseInt(categoryId) : null
  };
  
  try {
    showAdminMessage('Updating article...', 'info');
    
    const response = await fetch(`/admin/api/articles/${articleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
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
    showAdminMessage('Deleting article...', 'info');

    const response = await fetch(`/admin/api/articles/${articleId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {}
    });

    const data = await response.json();

    if (data.success) {
      showAdminMessage('Article deleted successfully!', 'success');
      setTimeout(() => {
        loadArticles();
      }, 1000);
    } else {
      showAdminMessage(data.error || 'Failed to delete article', 'error');
    }
  } catch (error) {
    console.error('Error deleting article:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};

// Toggle article status (publish/unpublish)
window.toggleArticleStatus = async function(articleId, currentStatus) {
  const newStatus = !currentStatus;
  const actionText = newStatus ? 'Publishing' : 'Unpublishing';

  try {
    showAdminMessage(`${actionText} article...`, 'info');

    // First get the current article data to preserve required fields
    const getResponse = await fetch(`/admin/api/articles/${articleId}`, {
      credentials: 'include'
    });

    if (!getResponse.ok) {
      throw new Error('Failed to fetch current article data');
    }

    const getData = await getResponse.json();
    if (!getData.success) {
      throw new Error(getData.error || 'Failed to get article data');
    }

    const article = getData.article;

    // Now update with all required fields
    const response = await fetch(`/admin/api/articles/${articleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: article.title,
        content: article.content,
        excerpt: article.excerpt || '',
        published: newStatus,
        category_id: article.category_id
      }),
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      showAdminMessage(`Article ${newStatus ? 'published' : 'unpublished'} successfully!`, 'success');
      setTimeout(() => {
        loadArticles();
      }, 1000);
    } else {
      showAdminMessage(data.error || `Failed to ${newStatus ? 'publish' : 'unpublish'} article`, 'error');
    }
  } catch (error) {
    console.error('Error updating article status:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};

// Global variables for resources search and filter state
let currentResourcesFilters = {
  search: '',
  type: 'all',
  category: 'all',
  status: 'all',
  author: 'all',
  page: 1
};

// Resources Management with Search and Filter
window.loadResources = async function(filters = {}) {
  try {
    console.log('loadResources: Starting...');

    // Merge with current filters
    Object.assign(currentResourcesFilters, filters);

    // Build query string
    const queryParams = new URLSearchParams();
    Object.entries(currentResourcesFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        queryParams.append(key, value);
      }
    });

    const url = `/admin/api/resources?${queryParams.toString()}`;
    console.log('loadResources: Fetching from:', url);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {}
    });

    if (!response.ok) {
      throw new Error('Failed to fetch resources');
    }

    const data = await response.json();
    const tableBody = document.getElementById('resources-table');
    const paginationContainer = document.getElementById('resources-pagination');

    if (data.success && data.resources && data.resources.length > 0) {
      let html = '';
      data.resources.forEach(resource => {
        const statusBadge = resource.published ?
          '<span class="admin-badge admin-badge-success">Published</span>' :
          '<span class="admin-badge admin-badge-warning">Draft</span>';

        const typeBadge = resource.is_uploaded_file ?
          `<span class="admin-badge admin-badge-primary">Uploaded ${resource.resource_type}</span>` :
          `<span class="admin-badge admin-badge-info">${resource.resource_type}</span>`;

        const categoryBadge = resource.category_name ?
          `<span class="admin-badge admin-badge-info">${resource.category_name}</span>` :
          '<span style="color: #9ca3af;">No Category</span>';

        html += `
          <tr>
            <td>
              <div style="font-weight: 500;">${resource.title}</div>
              <div style="font-size: 0.8rem; color: #64748b;">${resource.description || 'No description'}</div>
              ${resource.is_uploaded_file ? `<div style="font-size: 0.7rem; color: #10b981; margin-top: 0.25rem;">
                <i class="fas fa-file"></i> ${resource.file_name || 'Uploaded file'}
              </div>` : ''}
            </td>
            <td>
              ${typeBadge}
              <br>
              ${statusBadge}
            </td>
            <td>${categoryBadge}</td>
            <td>${resource.author_name}</td>
            <td>${formatDate(resource.created_at)}</td>
            <td>
              <div class="admin-table-actions">
                ${resource.is_uploaded_file && resource.view_url ? `
                  <a href="${resource.view_url}" target="_blank" class="admin-btn admin-btn-sm admin-btn-primary">
                    <i class="fas fa-eye"></i> View
                  </a>
                ` : ''}
                ${resource.url && !resource.is_uploaded_file ? `
                  <a href="${resource.url}" target="_blank" class="admin-btn admin-btn-sm admin-btn-outline">
                    <i class="fas fa-external-link-alt"></i> Visit
                  </a>
                ` : ''}
                ${resource.is_uploaded_file && resource.download_url ? `
                  <a href="${resource.download_url}" class="admin-btn admin-btn-sm admin-btn-outline">
                    <i class="fas fa-download"></i> Download
                  </a>
                ` : ''}
                <a href="/admin/resources/${resource.id}/edit" class="admin-btn admin-btn-sm admin-btn-outline">
                  <i class="fas fa-edit"></i> Edit
                </a>
                <button onclick="toggleResourceStatus(${resource.id}, ${resource.published})" class="admin-btn admin-btn-sm ${resource.published ? 'admin-btn-warning' : 'admin-btn-success'}">
                  <i class="fas ${resource.published ? 'fa-eye-slash' : 'fa-eye'}"></i> ${resource.published ? 'Unpublish' : 'Publish'}
                </button>
                <button onclick="deleteResource(${resource.id}, '${resource.title.replace(/'/g, "\\'")}')" class="admin-btn admin-btn-sm admin-btn-danger">
                  <i class="fas fa-trash"></i> Delete
                </button>
              </div>
            </td>
          </tr>
        `;
      });
      tableBody.innerHTML = html;

      // Update pagination
      if (paginationContainer && data.pagination) {
        updatePagination(paginationContainer, data.pagination, 'resources');
      }
    } else {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem;">
            <div class="admin-empty-state">
              <i class="fas fa-book" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 1rem;"></i>
              <div style="color: #64748b; margin-bottom: 1rem;">No resources found</div>
              <a href="/admin/resources/new" class="admin-btn admin-btn-primary">
                <i class="fas fa-plus"></i> Add First Resource
              </a>
            </div>
          </td>
        </tr>
      `;

      // Clear pagination
      if (paginationContainer) {
        paginationContainer.innerHTML = '';
      }
    }
  } catch (error) {
    console.error('Error loading resources:', error);
    showAdminMessage('Failed to load resources', 'error');
  }
};

// Link Resource Creation
window.createLinkResource = async function(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  const categoryId = formData.get('category_id');
  
  const resourceData = {
    title: formData.get('title'),
    description: formData.get('description'),
    url: formData.get('url'),
    resource_type: formData.get('resource_type'),
    published: formData.get('published') === 'on',
    category_id: categoryId && categoryId !== '' ? parseInt(categoryId) : null
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


// File Upload Resource Creation
window.uploadResourceFile = async function(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  
  // Validate file
  const file = formData.get('file');
  if (!file || file.size === 0) {
    showAdminMessage('Please select a file to upload', 'error');
    return;
  }
  
  // Check file type
  const resourceType = formData.get('resource_type');
  const allowedTypes = {
    'book': ['application/pdf'],
    'podcast': ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a']
  };
  
  if (!allowedTypes[resourceType] || !allowedTypes[resourceType].includes(file.type)) {
    showAdminMessage('Invalid file type for selected resource type', 'error');
    return;
  }
  
  try {
    showAdminMessage('Uploading file...', 'info');
    
    const response = await fetch('/admin/api/resources/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: {}
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAdminMessage('File uploaded successfully!', 'success');
      setTimeout(() => {
        window.location.href = '/admin/resources';
      }, 1500);
    } else {
      showAdminMessage(data.error || 'Failed to upload file', 'error');
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};

// Utility function to format file sizes
window.formatFileSize = function(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Load Resource for Editing
window.loadResourceForEdit = async function(resourceId) {
  try {
    const response = await fetch(`/admin/api/resources/${resourceId}`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      const resource = data.resource;
      
      // Check each element exists before setting value
      const titleElement = document.getElementById('edit-resource-title');
      const typeElement = document.getElementById('edit-resource-type');
      const urlElement = document.getElementById('edit-resource-url');
      const descriptionElement = document.getElementById('edit-resource-description');
      const publishedElement = document.getElementById('edit-resource-published');
      
      if (titleElement) titleElement.value = resource.title;
      if (typeElement) typeElement.value = resource.resource_type;
      if (urlElement) urlElement.value = resource.url || '';
      if (descriptionElement) descriptionElement.value = resource.description || '';
      if (publishedElement) publishedElement.checked = resource.published;
      
      // Set category selection
      const categoryElement = document.getElementById('edit-resource-category-select');
      if (categoryElement && resource.category_id) {
        categoryElement.value = resource.category_id.toString();
      }
      
      // Show/hide URL vs file info based on resource type
      const urlGroup = document.getElementById('edit-url-group');
      const fileInfo = document.getElementById('edit-file-info');
      
      if (resource.is_uploaded_file) {
        // Show file info, hide URL input
        if (urlGroup) urlGroup.style.display = 'none';
        if (fileInfo) {
          fileInfo.style.display = 'block';
          
          const filenameEl = document.getElementById('edit-current-filename');
          const filesizeEl = document.getElementById('edit-current-filesize');
          const downloadLinkEl = document.getElementById('edit-download-link');
          const viewLinkEl = document.getElementById('edit-view-link');
          
          if (filenameEl) filenameEl.textContent = resource.file_name || 'Unknown file';
          if (filesizeEl) filesizeEl.textContent = window.formatFileSize(resource.file_size || 0);
          if (downloadLinkEl && resource.download_url) {
            downloadLinkEl.href = resource.download_url;
          }
          if (viewLinkEl && resource.view_url) {
            viewLinkEl.href = resource.view_url;
            viewLinkEl.style.display = 'inline-flex';
          }
        }
      } else {
        // Show URL input, hide file info
        if (urlGroup) urlGroup.style.display = 'block';
        if (fileInfo) fileInfo.style.display = 'none';
      }
    } else {
      showAdminMessage('Resource not found', 'error');
    }
  } catch (error) {
    console.error('Error loading resource:', error);
    showAdminMessage('Error loading resource', 'error');
  }
};

// Update Resource
window.updateResource = async function(e) {
  e.preventDefault();
  
  const form = e.target;
  const resourceId = form.dataset.resourceId;
  const formData = new FormData(form);
  const categoryId = formData.get('category_id');
  
  const resourceData = {
    title: formData.get('title'),
    description: formData.get('description'),
    url: formData.get('url'),
    resource_type: formData.get('resource_type'),
    published: formData.get('published') === 'on',
    category_id: categoryId && categoryId !== '' ? parseInt(categoryId) : null
  };
  
  try {
    showAdminMessage('Updating resource...', 'info');
    
    const response = await fetch(`/admin/api/resources/${resourceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resourceData),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAdminMessage('Resource updated successfully!', 'success');
      setTimeout(() => {
        window.location.href = '/admin/resources';
      }, 1500);
    } else {
      showAdminMessage(data.error || 'Failed to update resource', 'error');
    }
  } catch (error) {
    console.error('Error updating resource:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};

window.deleteResource = async function(resourceId) {
  if (!confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
    return;
  }

  try {
    showAdminMessage('Deleting resource...', 'info');

    const response = await fetch(`/admin/api/resources/${resourceId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      showAdminMessage('Resource deleted successfully!', 'success');
      setTimeout(() => {
        loadResources();
      }, 1000);
    } else {
      showAdminMessage(data.error || 'Failed to delete resource', 'error');
    }
  } catch (error) {
    console.error('Error deleting resource:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};

// Toggle resource status (publish/unpublish)
window.toggleResourceStatus = async function(resourceId, currentStatus) {
  const newStatus = !currentStatus;
  const actionText = newStatus ? 'Publishing' : 'Unpublishing';

  try {
    showAdminMessage(`${actionText} resource...`, 'info');

    // First get the current resource data to preserve required fields
    const getResponse = await fetch(`/admin/api/resources/${resourceId}`, {
      credentials: 'include'
    });

    if (!getResponse.ok) {
      throw new Error('Failed to fetch current resource data');
    }

    const getData = await getResponse.json();
    if (!getData.success) {
      throw new Error(getData.error || 'Failed to get resource data');
    }

    const resource = getData.resource;

    // Now update with the required fields
    const response = await fetch(`/admin/api/resources/${resourceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: resource.title,
        description: resource.description || '',
        url: resource.url || '',
        resource_type: resource.resource_type,
        published: newStatus,
        category_id: resource.category_id
      }),
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      showAdminMessage(`Resource ${newStatus ? 'published' : 'unpublished'} successfully!`, 'success');
      setTimeout(() => {
        loadResources();
      }, 1000);
    } else {
      showAdminMessage(data.error || `Failed to ${newStatus ? 'publish' : 'unpublish'} resource`, 'error');
    }
  } catch (error) {
    console.error('Error updating resource status:', error);
    showAdminMessage('Network error. Please try again.', 'error');
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
    
    // Check if we're on the roles page and handle differently
    if (!tableBody) {
      // We're probably on the roles page, refresh role-specific data instead
      if (typeof loadRoleStats === 'function') {
        loadRoleStats();
        loadUserSelects();
        loadRoleHistory();
      }
      return;
    }
    
    if (data.success && data.users.length > 0) {
      let html = '';
      data.users.forEach(user => {
        const statusBadge = user.status === 'active' ? 
          '<span class="admin-badge admin-badge-success">Active</span>' :
          '<span class="admin-badge admin-badge-danger">Inactive</span>';
          
        const roleBadge = user.role === 'admin' ?
          '<span class="admin-badge admin-badge-warning">Admin</span>' :
          user.role === 'moderator' ?
          '<span class="admin-badge admin-badge-primary">Moderator</span>' :
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
            <td>${user.last_login ? formatDateTime(user.last_login) : '<span style="color: #9ca3af;">Never</span>'}</td>
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
    const tableBody = document.getElementById('users-table');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem; color: #dc2626;">
            Error loading users
          </td>
        </tr>
      `;
    }
  }
};

// Enhanced User Management Modal
window.editUser = function(userId, currentRole, currentStatus) {
  showUserEditModal(userId, currentRole, currentStatus);
};

function showUserEditModal(userId, currentRole, currentStatus) {
  // Create modal HTML
  const modalHtml = `
    <div id="user-edit-modal" class="admin-modal" style="display: flex; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000;">
      <div class="admin-modal-content" style="background: white; padding: 2rem; border-radius: 8px; max-width: 400px; width: 90%; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        <div class="admin-modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem;">
          <h3 style="margin: 0; color: #374151;">Edit User Role</h3>
          <button onclick="closeUserEditModal()" style="background: none; border: none; font-size: 1.5rem; color: #6b7280; cursor: pointer;">&times;</button>
        </div>
        <div class="admin-modal-body">
          <form id="user-edit-form" onsubmit="submitUserEdit(event, ${userId})">
            <div style="margin-bottom: 1rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Role:</label>
              <select id="user-role-select" name="role" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem;">
                <option value="user" ${currentRole === 'user' ? 'selected' : ''}>User</option>
                <option value="moderator" ${currentRole === 'moderator' ? 'selected' : ''}>Moderator</option>
                <option value="admin" ${currentRole === 'admin' ? 'selected' : ''}>Administrator</option>
              </select>
              <small style="color: #6b7280; margin-top: 0.25rem; display: block;">Users can create content, Moderators can manage content, Admins have full access</small>
            </div>
            <div style="display: flex; gap: 1rem; margin-top: 2rem;">
              <button type="button" onclick="closeUserEditModal()" style="flex: 1; padding: 0.75rem; background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer;">Cancel</button>
              <button type="submit" style="flex: 1; padding: 0.75rem; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">Update Role</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  // Add modal to page
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeUserEditModal() {
  const modal = document.getElementById('user-edit-modal');
  if (modal) {
    modal.remove();
  }
}

async function submitUserEdit(event, userId) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const role = formData.get('role');

  closeUserEditModal();

  // Check if this is a self-role change
  const currentUserId = getCurrentUserId();
  if (currentUserId === userId) {
    // Self-role change - use direct update
    updateUserRole(userId, role);
  } else {
    // Other user role change - use verification process
    requestRoleChange(userId, role);
  }
}

async function updateUserRole(userId, role) {
  try {
    showAdminMessage('Updating user role...', 'info');

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
      showAdminMessage(`User role updated to ${role} successfully!`, 'success');
      setTimeout(() => {
        loadUsers();
      }, 1000);
    } else {
      showAdminMessage(data.error || 'Failed to update user role', 'error');
    }
  } catch (error) {
    console.error('Error updating user role:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
}

async function requestRoleChange(userId, role) {
  try {
    showAdminMessage('Requesting role change verification...', 'info');

    const response = await fetch(`/admin/api/users/${userId}/request-role-change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newRole: role }),
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      // Show verification modal
      showVerificationModal(userId, role, data.expiresAt);
    } else {
      showAdminMessage(data.error || 'Failed to request role change', 'error');
    }
  } catch (error) {
    console.error('Error requesting role change:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
}

function showVerificationModal(userId, role, expiresAt) {
  const modalHtml = `
    <div id="role-verification-modal" class="admin-modal" style="display: flex; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000;">
      <div class="admin-modal-content" style="background: white; padding: 2rem; border-radius: 8px; max-width: 400px; width: 90%; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        <div class="admin-modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem;">
          <h3 style="margin: 0; color: #374151;">Verify Role Change</h3>
          <button onclick="closeVerificationModal()" style="background: none; border: none; font-size: 1.5rem; color: #6b7280; cursor: pointer;">&times;</button>
        </div>
        <div class="admin-modal-body">
          <p style="color: #6b7280; margin-bottom: 1rem;">
            A verification email has been sent to your email address. Please enter the verification token below to complete the role change.
          </p>
          <form id="verification-form" onsubmit="submitVerification(event, ${userId}, '${role}')">
            <div style="margin-bottom: 1rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Verification Token:</label>
              <input type="text" id="verification-token" name="token" required
                     style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem; text-align: center; letter-spacing: 2px; font-family: monospace;"
                     placeholder="Enter 6-digit token" maxlength="6" pattern="[0-9]{6}">
            </div>
            <div style="display: flex; gap: 1rem; margin-top: 2rem;">
              <button type="button" onclick="closeVerificationModal()" style="flex: 1; padding: 0.75rem; background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer;">Cancel</button>
              <button type="submit" style="flex: 1; padding: 0.75rem; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">Verify & Update</button>
            </div>
          </form>
          <p style="color: #9ca3af; font-size: 0.8rem; margin-top: 1rem; text-align: center;">
            Token expires at: ${new Date(expiresAt).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  document.getElementById('verification-token').focus();
}

function closeVerificationModal() {
  const modal = document.getElementById('role-verification-modal');
  if (modal) {
    modal.remove();
  }
}

async function submitVerification(event, userId, role) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const token = formData.get('token');

  try {
    showAdminMessage('Verifying role change...', 'info');

    const response = await fetch('/admin/api/users/verify-role-change', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ verificationToken: token }),
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      closeVerificationModal();
      showAdminMessage(`User role successfully changed to ${role}!`, 'success');
      setTimeout(() => {
        loadUsers();
      }, 1000);
    } else {
      showAdminMessage(data.error || 'Verification failed', 'error');
    }
  } catch (error) {
    console.error('Error verifying role change:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
}

function getCurrentUserId() {
  // Try multiple ways to get current user ID
  const userIdElement = document.querySelector('[data-user-id]');
  if (userIdElement) {
    return parseInt(userIdElement.dataset.userId);
  }

  // Check if it's embedded in the page somehow
  const scriptTags = document.querySelectorAll('script');
  for (let script of scriptTags) {
    const content = script.textContent;
    const match = content.match(/userId.*?(\d+)/);
    if (match) {
      return parseInt(match[1]);
    }
  }

  return 0;
}

window.deleteUser = async function(userId) {
  // Get user details for confirmation
  const userRow = document.querySelector(`[onclick="deleteUser(${userId})"]`).closest('tr');
  const userName = userRow.querySelector('td:first-child div').textContent.trim();
  
  const confirmMessage = `⚠️ Delete User Confirmation\n\nUser: ${userName}\n\nThis will permanently delete:\n• The user account\n• All their articles and resources\n• This action cannot be undone\n\nType "DELETE" to confirm:`;
  
  const confirmation = prompt(confirmMessage);
  
  if (confirmation !== 'DELETE') {
    if (confirmation !== null) {
      showAdminMessage('Deletion cancelled. Please type "DELETE" to confirm.', 'warning');
    }
    return;
  }
  
  try {
    showAdminMessage('Deleting user and all associated content...', 'info');
    
    const response = await fetch(`/admin/api/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAdminMessage(data.message || 'User deleted successfully!', 'success');
      setTimeout(() => {
        loadUsers();
      }, 1500);
    } else {
      showAdminMessage(data.error || 'Failed to delete user', 'error');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};

// User Statistics
window.loadUserStats = async function() {
  try {
    const response = await fetch('/admin/api/users/stats', {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      const stats = data.stats;
      
      // Update user statistics if elements exist
      const userStatsContainer = document.getElementById('user-stats-container');
      if (userStatsContainer) {
        userStatsContainer.innerHTML = `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            <div class="admin-stat-card">
              <div class="admin-stat-header">
                <div class="admin-stat-title">Total Users</div>
                <div class="admin-stat-icon blue"><i class="fas fa-users"></i></div>
              </div>
              <div class="admin-stat-number">${stats.totalUsers}</div>
              <div class="admin-stat-change positive">All registered users</div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-header">
                <div class="admin-stat-title">New This Month</div>
                <div class="admin-stat-icon green"><i class="fas fa-user-plus"></i></div>
              </div>
              <div class="admin-stat-number">${stats.newUsersThisMonth}</div>
              <div class="admin-stat-change ${stats.growthRate > 0 ? 'positive' : ''}">${stats.growthRate}% growth rate</div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-header">
                <div class="admin-stat-title">Administrators</div>
                <div class="admin-stat-icon yellow"><i class="fas fa-user-shield"></i></div>
              </div>
              <div class="admin-stat-number">${stats.adminUsers}</div>
              <div class="admin-stat-change">${stats.regularUsers} regular users</div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-header">
                <div class="admin-stat-title">Active This Week</div>
                <div class="admin-stat-icon red"><i class="fas fa-calendar-week"></i></div>
              </div>
              <div class="admin-stat-number">${stats.newUsersThisWeek}</div>
              <div class="admin-stat-change ${stats.newUsersThisWeek > 0 ? 'positive' : ''}">New users this week</div>
            </div>
          </div>
          
          ${stats.mostActiveUsers.length > 0 ? `
            <div class="admin-card">
              <div class="admin-card-header">
                <h3 class="admin-card-title">Most Active Users</h3>
                <p class="admin-card-subtitle">Users ranked by content contributions</p>
              </div>
              <div class="admin-card-content">
                ${stats.mostActiveUsers.map((user, index) => `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #e2e8f0;">
                    <div>
                      <div style="font-weight: 500; font-size: 0.9rem;">${user.name}</div>
                      <div style="font-size: 0.8rem; color: #64748b;">${user.email}</div>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-size: 0.9rem; font-weight: 500;">${user.articles_count + user.resources_count} items</div>
                      <div style="font-size: 0.8rem; color: #64748b;">${user.articles_count} articles, ${user.resources_count} resources</div>
                    </div>
                    <div style="margin-left: 1rem;">
                      <span class="admin-badge ${user.role === 'admin' ? 'admin-badge-warning' : user.role === 'moderator' ? 'admin-badge-primary' : 'admin-badge-info'}">#${index + 1}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        `;
      }
      
      return stats;
    } else {
      console.error('Failed to load user statistics:', data.error);
    }
  } catch (error) {
    console.error('Error loading user statistics:', error);
  }
};

// Enhanced User Search and Filter
window.filterUsers = function(searchTerm, roleFilter) {
  const table = document.getElementById('users-table');
  const rows = table.querySelectorAll('tr');
  
  rows.forEach(row => {
    if (row.querySelector('th')) return; // Skip header row
    
    const nameCell = row.cells[0]?.textContent.toLowerCase() || '';
    const emailCell = row.cells[1]?.textContent.toLowerCase() || '';
    const roleCell = row.cells[2]?.textContent.toLowerCase() || '';
    
    const matchesSearch = !searchTerm || 
      nameCell.includes(searchTerm.toLowerCase()) || 
      emailCell.includes(searchTerm.toLowerCase());
    
    const matchesRole = !roleFilter || roleCell.includes(roleFilter.toLowerCase());
    
    row.style.display = (matchesSearch && matchesRole) ? '' : 'none';
  });
};

// Analytics
window.loadAnalytics = async function() {
  try {
    const response = await fetch('/admin/api/analytics', {
      method: 'GET',
      credentials: 'include',
      headers: {}
    });
    
    const data = await response.json();
    
    if (data.success) {
      const analytics = data.analytics;
      const contentStats = analytics.contentStats;
      
      // Update analytics stat cards
      const pageviewsEl = document.getElementById('analytics-pageviews');
      const pageviewsChangeEl = document.getElementById('analytics-pageviews-change');
      if (pageviewsEl && pageviewsChangeEl) {
        const totalViews = analytics.pageViews.data.reduce((sum, views) => sum + views, 0);
        pageviewsEl.textContent = totalViews.toLocaleString();
        pageviewsChangeEl.textContent = totalViews === 0 ? 'No tracking data yet' : 'Real-time data';
        pageviewsChangeEl.className = 'admin-stat-change' + (totalViews > 0 ? ' positive' : '');
      }
      
      const readtimeEl = document.getElementById('analytics-readtime');
      const readtimeChangeEl = document.getElementById('analytics-readtime-change');
      if (readtimeEl && readtimeChangeEl) {
        readtimeEl.textContent = contentStats.averageReadTime;
        readtimeChangeEl.textContent = contentStats.averageReadTime === '0:00' ? 'No articles published yet' : 'Based on published content';
        readtimeChangeEl.className = 'admin-stat-change' + (contentStats.averageReadTime !== '0:00' ? ' positive' : '');
      }
      
      const growthEl = document.getElementById('analytics-growth');
      const growthChangeEl = document.getElementById('analytics-growth-change');
      if (growthEl && growthChangeEl) {
        const totalNewUsers = analytics.userGrowth.data.reduce((sum, users) => sum + users, 0);
        growthEl.textContent = totalNewUsers.toString();
        growthChangeEl.textContent = totalNewUsers === 0 ? 'No new users this period' : `${totalNewUsers} users in last 6 months`;
        growthChangeEl.className = 'admin-stat-change' + (totalNewUsers > 0 ? ' positive' : '');
      }
      
      const engagementEl = document.getElementById('analytics-engagement');
      const engagementChangeEl = document.getElementById('analytics-engagement-change');
      if (engagementEl && engagementChangeEl) {
        engagementEl.textContent = contentStats.contentEngagement + '%';
        engagementChangeEl.textContent = contentStats.contentEngagement === 0 ? 'No published content yet' : 'Based on published vs total content';
        engagementChangeEl.className = 'admin-stat-change' + (contentStats.contentEngagement > 0 ? ' positive' : '');
      }
      
      // Load top articles
      const topArticlesEl = document.getElementById('top-articles');
      if (topArticlesEl) {
        if (analytics.topArticles.length > 0) {
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
        } else {
          topArticlesEl.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #64748b;">
              <i class="fas fa-newspaper" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
              <div>No published articles yet</div>
              <div style="font-size: 0.8rem; margin-top: 0.5rem;">Create your first article to see analytics data</div>
            </div>
          `;
        }
      }
      
      // Load user growth chart
      loadUserGrowthChart(analytics.userGrowth);
      
      console.log('Analytics loaded successfully');
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

// Chart functions
function loadUserGrowthChart(userGrowthData) {
  const chartContainer = document.getElementById('user-growth-chart');
  if (!chartContainer) return;
  
  // If no user data, show empty state
  if (userGrowthData.data.every(count => count === 0)) {
    chartContainer.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #64748b;">
        <i class="fas fa-chart-line" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
        <div>No user growth data yet</div>
        <div style="font-size: 0.8rem; margin-top: 0.5rem;">Chart will appear when users register</div>
      </div>
    `;
    return;
  }
  
  // Create simple text-based chart for now (can be upgraded to Chart.js later)
  const maxValue = Math.max(...userGrowthData.data);
  const chartHtml = `
    <div style="padding: 1rem;">
      <div style="display: flex; align-items: end; height: 150px; gap: 0.5rem; margin-bottom: 1rem;">
        ${userGrowthData.labels.map((label, index) => {
          const value = userGrowthData.data[index];
          const height = maxValue > 0 ? (value / maxValue) * 120 : 5;
          return `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
              <div style="
                background: #3b82f6; 
                width: 100%; 
                height: ${height}px; 
                border-radius: 4px 4px 0 0;
                margin-bottom: 0.5rem;
                min-height: 5px;
              "></div>
              <div style="font-size: 0.7rem; color: #64748b;">${label}</div>
              <div style="font-size: 0.8rem; font-weight: 600; color: #1e293b;">${value}</div>
            </div>
          `;
        }).join('')}
      </div>
      <div style="text-align: center; font-size: 0.8rem; color: #64748b;">
        User registrations by month
      </div>
    </div>
  `;
  
  chartContainer.innerHTML = chartHtml;
}

// Category Management Functions
window.loadCategories = async function() {
  try {
    const response = await fetch('/admin/api/categories', {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      displayCategories(data.categories);
    } else {
      showAdminMessage('Failed to load categories: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error loading categories:', error);
    showAdminMessage('Network error loading categories', 'error');
  }
};

function displayCategories(categories) {
  const tbody = document.getElementById('categories-table-body');
  
  if (categories.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="admin-table-empty">No categories found. Create your first category!</td></tr>';
    return;
  }
  
  tbody.innerHTML = categories.map(category => `
    <tr>
      <td>
        <div class="admin-category-name">
          <i class="${category.icon || 'fas fa-folder'}" style="color: ${category.color || '#3b82f6'}; margin-right: 8px;"></i>
          <strong>${category.name}</strong>
        </div>
      </td>
      <td>
        <span class="admin-category-description">${category.description || 'No description'}</span>
      </td>
      <td>
        <div class="admin-color-display" style="background-color: ${category.color || '#3b82f6'};" title="${category.color || '#3b82f6'}"></div>
      </td>
      <td>
        <code class="admin-icon-code">${category.icon || 'fas fa-folder'}</code>
      </td>
      <td>
        <code class="admin-slug-code">${category.slug}</code>
      </td>
      <td>${new Date(category.created_at).toLocaleDateString()}</td>
      <td>
        <button class="admin-btn admin-btn-sm admin-btn-outline" onclick="loadCategoryForEdit(${category.id})" title="Edit">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="admin-btn admin-btn-sm admin-btn-danger" onclick="deleteCategory(${category.id}, '${category.name}')" title="Delete">
          <i class="fas fa-trash"></i> Delete
        </button>
      </td>
    </tr>
  `).join('');
}

window.showCreateCategoryForm = function() {
  document.getElementById('create-category-modal').style.display = 'flex';
  document.querySelector('#create-category-form input[name="name"]').focus();
};

window.hideCreateCategoryForm = function() {
  document.getElementById('create-category-modal').style.display = 'none';
  document.getElementById('create-category-form').reset();
};

window.generateSlug = function(name) {
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  document.querySelector('#create-category-form input[name="slug"]').value = slug;
};

window.generateEditSlug = function(name) {
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  document.querySelector('#edit-category-form input[name="slug"]').value = slug;
};

window.createCategory = async function(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  const categoryData = {
    name: formData.get('name'),
    description: formData.get('description'),
    slug: formData.get('slug'),
    color: formData.get('color'),
    icon: formData.get('icon')
  };

  try {
    showAdminMessage('Creating category...', 'info');

    const response = await fetch('/admin/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(categoryData),
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      showAdminMessage('Category created successfully!', 'success');
      hideCreateCategoryForm();
      loadCategories();
      // Clear categories cache so dropdowns refresh with new category
      clearCategoriesCache();
    } else {
      showAdminMessage('Error: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error creating category:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};

window.loadCategoryForEdit = async function(categoryId) {
  try {
    const response = await fetch(`/admin/api/categories/${categoryId}`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      const category = data.category;
      
      document.getElementById('edit-category-id').value = category.id;
      document.getElementById('edit-category-name').value = category.name;
      document.getElementById('edit-category-slug').value = category.slug;
      document.getElementById('edit-category-description').value = category.description || '';
      document.getElementById('edit-category-color').value = category.color || '#3b82f6';
      document.getElementById('edit-category-icon').value = category.icon || 'fas fa-folder';
      
      document.getElementById('edit-category-modal').style.display = 'flex';
      document.getElementById('edit-category-name').focus();
    } else {
      showAdminMessage('Error loading category: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error loading category:', error);
    showAdminMessage('Network error loading category', 'error');
  }
};

window.hideEditCategoryForm = function() {
  document.getElementById('edit-category-modal').style.display = 'none';
  document.getElementById('edit-category-form').reset();
};

window.updateCategory = async function(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  const categoryId = formData.get('id');
  const categoryData = {
    name: formData.get('name'),
    description: formData.get('description'),
    slug: formData.get('slug'),
    color: formData.get('color'),
    icon: formData.get('icon')
  };

  try {
    showAdminMessage('Updating category...', 'info');

    const response = await fetch(`/admin/api/categories/${categoryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(categoryData),
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      showAdminMessage('Category updated successfully!', 'success');
      hideEditCategoryForm();
      loadCategories();
      // Clear categories cache so dropdowns refresh with updated category
      clearCategoriesCache();
    } else {
      showAdminMessage('Error: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error updating category:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};

window.deleteCategory = async function(categoryId, categoryName) {
  if (!confirm(`Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`)) {
    return;
  }

  try {
    showAdminMessage('Deleting category...', 'info');

    const response = await fetch(`/admin/api/categories/${categoryId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      showAdminMessage('Category deleted successfully!', 'success');
      loadCategories();
      // Clear categories cache so dropdowns refresh without deleted category
      clearCategoriesCache();
    } else {
      showAdminMessage('Error: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};

// Global cache for categories to avoid multiple API calls
let categoriesCache = null;
let categoriesCachePromise = null;

// Load Categories for Dropdown with caching
window.loadCategoriesDropdown = async function(selectElementId) {
  const selectElement = document.getElementById(selectElementId);

  if (!selectElement) {
    console.error(`Select element with ID '${selectElementId}' not found`);
    return;
  }

  // If we already have cached categories, use them
  if (categoriesCache) {
    populateCategoriesDropdown(selectElement, categoriesCache);
    return;
  }

  // If there's already a fetch in progress, wait for it
  if (categoriesCachePromise) {
    try {
      const data = await categoriesCachePromise;
      populateCategoriesDropdown(selectElement, data.categories);
    } catch (error) {
      console.error('Error loading categories for dropdown:', error);
    }
    return;
  }

  // Start a new fetch and cache the promise
  categoriesCachePromise = fetch('/admin/api/categories', {
    credentials: 'include'
  }).then(async (response) => {
    const data = await response.json();
    if (data.success && data.categories) {
      categoriesCache = data.categories; // Cache the categories
      return data;
    } else {
      throw new Error(data.error || 'Failed to load categories');
    }
  });

  try {
    const data = await categoriesCachePromise;
    populateCategoriesDropdown(selectElement, data.categories);
  } catch (error) {
    console.error('Error loading categories for dropdown:', error);
    // Clear the promise cache on error so we can retry
    categoriesCachePromise = null;
  }
};

// Helper function to populate dropdown with categories
function populateCategoriesDropdown(selectElement, categories) {
  // Clear existing options except the first default one
  selectElement.innerHTML = '<option value="">Select Category (Optional)</option>';

  // Add category options
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    selectElement.appendChild(option);
  });
}

// Function to clear categories cache when categories are modified
function clearCategoriesCache() {
  categoriesCache = null;
  categoriesCachePromise = null;
}

// Global cache for authors to avoid multiple API calls
let authorsCache = null;
let authorsCachePromise = null;

// Load Authors for Dropdown with caching
window.loadAuthorsDropdown = async function(selectElementId) {
  const selectElement = document.getElementById(selectElementId);

  if (!selectElement) {
    console.error(`Select element with ID '${selectElementId}' not found`);
    return;
  }

  // If we already have cached authors, use them
  if (authorsCache) {
    populateAuthorsDropdown(selectElement, authorsCache);
    return;
  }

  // If there's already a fetch in progress, wait for it
  if (authorsCachePromise) {
    try {
      const data = await authorsCachePromise;
      populateAuthorsDropdown(selectElement, data.authors);
    } catch (error) {
      console.error('Error loading authors for dropdown:', error);
    }
    return;
  }

  // Start a new fetch and cache the promise
  authorsCachePromise = fetch('/admin/api/users', {
    credentials: 'include'
  }).then(async (response) => {
    const data = await response.json();
    if (data.success && data.users) {
      authorsCache = data.users; // Cache the authors
      return data;
    } else {
      throw new Error(data.error || 'Failed to load authors');
    }
  });

  try {
    const data = await authorsCachePromise;
    populateAuthorsDropdown(selectElement, data.users);
  } catch (error) {
    console.error('Error loading authors for dropdown:', error);
    // Clear the promise cache on error so we can retry
    authorsCachePromise = null;
  }
};

// Helper function to populate dropdown with authors
function populateAuthorsDropdown(selectElement, authors) {
  // Clear existing options except the first default one
  selectElement.innerHTML = '<option value="all">All Authors</option>';

  // Filter to only include admins and moderators (authors)
  const authorUsers = authors.filter(user => user.role === 'admin' || user.role === 'moderator');

  // Add author options
  authorUsers.forEach(author => {
    const option = document.createElement('option');
    option.value = author.id;
    option.textContent = author.name;
    selectElement.appendChild(option);
  });
}

// Function to clear authors cache when users are modified
function clearAuthorsCache() {
  authorsCache = null;
  authorsCachePromise = null;
}

// Messaging System Functions
window.loadMessages = async function() {
  try {
    const response = await fetch('/admin/api/messages', {
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      displayMessages(data.messages);
    } else {
      showAdminMessage('Failed to load messages: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error loading messages:', error);
    showAdminMessage('Network error loading messages', 'error');
  }
};

function displayMessages(messages) {
  const container = document.getElementById('messages-container');
  if (!container) return;

  if (!messages || messages.length === 0) {
    container.innerHTML = `
      <div class="admin-empty-state">
        <i class="fas fa-comments" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 1rem;"></i>
        <div style="color: #64748b; margin-bottom: 1rem;">No messages yet</div>
        <button class="admin-btn admin-btn-primary" onclick="showNewMessageForm()">
          <i class="fas fa-plus"></i> Post First Message
        </button>
      </div>
    `;
    return;
  }

  let html = '';
  messages.forEach(message => {
    const isHighlighted = message.is_highlighted;
    const roleBadge = message.sender_role === 'admin' ?
      '<span class="message-role admin">Admin</span>' :
      '<span class="message-role moderator">Moderator</span>';

    const highlightClass = isHighlighted ? 'highlighted' : '';
    const messageClass = message.sender_role === 'admin' ? 'own-message' : 'other-message';

    // Status indicator
    const statusIndicator = getStatusIndicator(message.status);

    html += `
      <div class="message-item ${messageClass} ${highlightClass}" data-message-id="${message.id}">
        <div class="message-bubble">
          <div class="message-header">
            <span class="message-author">${message.sender_name}</span>
            ${roleBadge}
            ${statusIndicator}
          </div>

          <div class="message-content">
            ${message.content}
          </div>

          ${message.media_url ? `
            <div class="message-media">
              ${getMediaElement(message.media_url, message.media_type)}
            </div>
          ` : ''}

          <div class="message-meta">
            <span class="message-date">${formatDateTime(message.created_at)}</span>
            ${isHighlighted ? '<span class="message-status">⭐ Important</span>' : ''}
            ${message.delivered_at ? `<span class="message-status">✓ Delivered ${formatDateTime(message.delivered_at)}</span>` : ''}
            ${message.read_at ? `<span class="message-status">👁 Read ${formatDateTime(message.read_at)}</span>` : ''}
          </div>

          <div class="message-actions">
            <div class="message-reactions">
              <button class="reaction-btn ${message.user_reaction === 'like' ? 'active' : ''}" onclick="reactToMessage(${message.id}, 'like')" title="Like">
                <i class="fas fa-thumbs-up"></i>
                <span class="reaction-count">${message.reactions?.like || 0}</span>
              </button>
              <button class="reaction-btn ${message.user_reaction === 'love' ? 'active' : ''}" onclick="reactToMessage(${message.id}, 'love')" title="Love">
                <i class="fas fa-heart"></i>
                <span class="reaction-count">${message.reactions?.love || 0}</span>
              </button>
              <button class="reaction-btn ${message.user_reaction === 'laugh' ? 'active' : ''}" onclick="reactToMessage(${message.id}, 'laugh')" title="Laugh">
                <i class="fas fa-laugh"></i>
                <span class="reaction-count">${message.reactions?.laugh || 0}</span>
              </button>
              <button class="reaction-btn ${message.user_reaction === 'angry' ? 'active' : ''}" onclick="reactToMessage(${message.id}, 'angry')" title="Angry">
                <i class="fas fa-angry"></i>
                <span class="reaction-count">${message.reactions?.angry || 0}</span>
              </button>
              <button class="reaction-btn ${message.user_reaction === 'sad' ? 'active' : ''}" onclick="reactToMessage(${message.id}, 'sad')" title="Sad">
                <i class="fas fa-sad-tear"></i>
                <span class="reaction-count">${message.reactions?.sad || 0}</span>
              </button>
              <button class="reaction-btn ${message.user_reaction === 'surprise' ? 'active' : ''}" onclick="reactToMessage(${message.id}, 'surprise')" title="Surprise">
                <i class="fas fa-surprise"></i>
                <span class="reaction-count">${message.reactions?.surprise || 0}</span>
              </button>
            </div>
            <button class="admin-btn admin-btn-sm admin-btn-outline" onclick="showComments(${message.id})">
              <i class="fas fa-comment"></i> ${message.comments_count || 0}
            </button>
            <button class="admin-btn admin-btn-sm admin-btn-outline" onclick="markAsDelivered(${message.id})">
              <i class="fas fa-check"></i> Mark Delivered
            </button>
            <button class="admin-btn admin-btn-sm admin-btn-outline" onclick="markAsRead(${message.id})">
              <i class="fas fa-eye"></i> Mark Read
            </button>
            ${message.can_edit ? `
              <button class="admin-btn admin-btn-sm admin-btn-outline" onclick="editMessage(${message.id})">
                <i class="fas fa-edit"></i>
              </button>
              <button class="admin-btn admin-btn-sm admin-btn-danger" onclick="deleteMessage(${message.id})">
                <i class="fas fa-trash"></i>
              </button>
            ` : ''}
          </div>
        </div>

        <div class="admin-message-comments" id="comments-${message.id}" style="display: none;">
          <div class="admin-comments-list" id="comments-list-${message.id}">
            <!-- Comments will be loaded here -->
          </div>
          <div class="admin-comment-form">
            <textarea class="admin-comment-input" id="comment-input-${message.id}" placeholder="Write a comment..." rows="2"></textarea>
            <button class="admin-btn admin-btn-sm admin-btn-primary" onclick="postComment(${message.id})">
              <i class="fas fa-paper-plane"></i> Post
            </button>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Update message count
  updateMessageCount(messages.length);
}

function getMediaElement(mediaUrl, mediaType) {
  if (!mediaUrl) return '';

  if (mediaType.startsWith('image/')) {
    return `<img src="${mediaUrl}" alt="Message media" class="admin-message-image" onclick="openMediaModal('${mediaUrl}', 'image')">`;
  } else if (mediaType.startsWith('video/')) {
    return `
      <video controls class="admin-message-video">
        <source src="${mediaUrl}" type="${mediaType}">
        Your browser does not support the video element.
      </video>
    `;
  } else if (mediaType.startsWith('audio/')) {
    return `
      <audio controls class="admin-message-audio">
        <source src="${mediaUrl}" type="${mediaType}">
        Your browser does not support the audio element.
      </audio>
    `;
  } else {
    return `
      <div class="admin-message-file">
        <i class="fas fa-file"></i>
        <a href="${mediaUrl}" target="_blank" class="admin-file-link">Download File</a>
      </div>
    `;
  }
}

function getStatusIndicator(status) {
  switch (status) {
    case 'sent':
      return '<span class="status-indicator status-sent" title="Sent"><i class="fas fa-paper-plane"></i></span>';
    case 'delivered':
      return '<span class="status-indicator status-delivered" title="Delivered"><i class="fas fa-check"></i></span>';
    case 'read':
      return '<span class="status-indicator status-read" title="Read"><i class="fas fa-check-double"></i></span>';
    default:
      return '<span class="status-indicator status-pending" title="Pending"><i class="fas fa-clock"></i></span>';
  }
}

window.markAsDelivered = async function(messageId) {
  try {
    const response = await fetch(`/admin/api/messages/${messageId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'delivered' }),
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      showAdminMessage('Message marked as delivered', 'success');
      // Refresh messages to show updated status
      loadMessages();
    } else {
      showAdminMessage(data.error || 'Failed to update message status', 'error');
    }
  } catch (error) {
    console.error('Error updating message status:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};

window.markAsRead = async function(messageId) {
  try {
    const response = await fetch(`/admin/api/messages/${messageId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'read' }),
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      showAdminMessage('Message marked as read', 'success');
      // Refresh messages to show updated status
      loadMessages();
    } else {
      showAdminMessage(data.error || 'Failed to update message status', 'error');
    }
  } catch (error) {
    console.error('Error updating message status:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};

window.showNewMessageForm = function() {
  console.log('showNewMessageForm called');
  const modal = document.getElementById('new-message-modal');
  if (modal) {
    modal.style.display = 'flex';
  } else {
    console.error('new-message-modal not found');
  }
};

window.hideNewMessageForm = function() {
  const modal = document.getElementById('new-message-modal');
  if (modal) {
    modal.style.display = 'none';
    // Reset form
    const form = document.getElementById('new-message-form');
    if (form) form.reset();

    // Hide file preview
    const preview = document.getElementById('message-file-preview');
    if (preview) preview.style.display = 'none';

    // Show upload area
    const uploadArea = document.getElementById('message-file-upload-area');
    if (uploadArea) uploadArea.style.display = 'flex';
  }
};

window.postNewMessage = async function(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  const messageData = {
    content: formData.get('content'),
    is_highlighted: formData.get('isHighlighted') === 'on'
  };

  // Handle file upload
  const fileInput = document.getElementById('message-file-input');
  if (fileInput && fileInput.files.length > 0) {
    formData.append('media', fileInput.files[0]);
  }

  try {
    showAdminMessage('Posting message...', 'info');

    const response = await fetch('/admin/api/messages', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      showAdminMessage('Message posted successfully!', 'success');
      hideNewMessageForm();
      loadMessages();
    } else {
      showAdminMessage(data.error || 'Failed to post message', 'error');
    }
  } catch (error) {
    console.error('Error posting message:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};

window.filterMessages = function() {
  const searchTerm = document.getElementById('message-search').value;
  const roleFilter = document.getElementById('message-role-filter').value;
  const sortFilter = document.getElementById('message-sort-filter').value;
  const dateFilter = document.getElementById('message-date-filter').value;
  const mediaFilter = document.getElementById('message-media-filter').value;
  const statusFilter = document.getElementById('message-status-filter').value;

  // Handle custom date range
  let dateFrom = null;
  let dateTo = null;
  if (dateFilter === 'custom') {
    dateFrom = document.getElementById('message-date-from').value;
    dateTo = document.getElementById('message-date-to').value;
  }

  // Build filter object and reset to page 1
  const filters = {
    search: searchTerm,
    role: roleFilter,
    sort: sortFilter,
    dateRange: dateFilter,
    dateFrom: dateFrom,
    dateTo: dateTo,
    mediaType: mediaFilter,
    status: statusFilter,
    page: 1 // Reset to first page when applying filters
  };

  // Reload messages with filters
  loadMessagesWithFilters(filters);
};

window.clearMessageFilters = function() {
   // Clear all filter inputs
   document.getElementById('message-search').value = '';
   document.getElementById('message-role-filter').value = 'all';
   document.getElementById('message-sort-filter').value = 'oldest';
   document.getElementById('message-date-filter').value = 'all';
   document.getElementById('message-media-filter').value = 'all';
   document.getElementById('message-status-filter').value = 'all';
   document.getElementById('message-date-from').value = '';
   document.getElementById('message-date-to').value = '';

   // Hide custom date inputs
   document.getElementById('custom-date-group').style.display = 'none';

   // Reset pagination
   currentMessageFilters.page = 1;

   // Reload messages without filters
   loadMessages();
};

// Debounced search function
let searchTimeout = null;
window.debounceSearch = function() {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(() => {
    filterMessages();
  }, 500); // Wait 500ms after user stops typing
};

// Handle date filter change to show/hide custom date inputs
document.addEventListener('DOMContentLoaded', function() {
  const dateFilter = document.getElementById('message-date-filter');
  if (dateFilter) {
    dateFilter.addEventListener('change', function() {
      const customDateGroup = document.getElementById('custom-date-group');
      if (this.value === 'custom') {
        customDateGroup.style.display = 'block';
      } else {
        customDateGroup.style.display = 'none';
      }
    });
  }
});

// Load messages with filters and pagination
async function loadMessagesWithFilters(filters) {
  try {
    console.log('loadMessagesWithFilters: Starting with filters:', filters);

    // Update current filters
    Object.assign(currentMessageFilters, filters);

    // Build query parameters
    const params = new URLSearchParams();

    // Add pagination parameters
    params.append('page', currentMessageFilters.page.toString());
    params.append('limit', currentMessageFilters.limit.toString());

    // Add filter parameters
    if (currentMessageFilters.search) params.append('search', currentMessageFilters.search);
    if (currentMessageFilters.role && currentMessageFilters.role !== 'all') params.append('role', currentMessageFilters.role);
    if (currentMessageFilters.sort && currentMessageFilters.sort !== 'oldest') params.append('sort', currentMessageFilters.sort);
    if (currentMessageFilters.dateRange && currentMessageFilters.dateRange !== 'all') params.append('dateRange', currentMessageFilters.dateRange);
    if (currentMessageFilters.dateFrom) params.append('dateFrom', currentMessageFilters.dateFrom);
    if (currentMessageFilters.dateTo) params.append('dateTo', currentMessageFilters.dateTo);
    if (currentMessageFilters.mediaType && currentMessageFilters.mediaType !== 'all') params.append('mediaType', currentMessageFilters.mediaType);
    if (currentMessageFilters.status && currentMessageFilters.status !== 'all') params.append('status', currentMessageFilters.status);

    const url = `/admin/api/messages?${params.toString()}`;
    console.log('loadMessagesWithFilters: Fetching from:', url);

    const response = await fetch(url, {
      credentials: 'include'
    });

    console.log('loadMessagesWithFilters: Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('loadMessagesWithFilters: Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (data.success) {
      // Enhance messages with reaction data
      currentMessages = await enhanceMessagesWithReactions(data.messages || []);
      displayMessages(currentMessages);

      // Update pagination info
      totalMessages = data.totalCount || data.messages.length;
      totalMessagePages = Math.ceil(totalMessages / currentMessageFilters.limit);

      updatePaginationControls();
      updateMessageCount(data.messages.length);

      // Show filter results message
      if (data.totalCount !== undefined && data.totalCount !== data.messages.length) {
        showAdminMessage(`Showing ${data.messages.length} of ${data.totalCount} messages`, 'info');
      }
    } else {
      showAdminMessage('Failed to load filtered messages: ' + (data.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error loading filtered messages:', error);
    showAdminMessage('Failed to load filtered messages', 'error');
  }
}

// Update pagination controls
function updatePaginationControls() {
  const paginationContainer = document.getElementById('messages-pagination');
  const paginationInfo = document.getElementById('pagination-info');
  const currentPageEl = document.getElementById('current-page');
  const totalPagesEl = document.getElementById('total-pages');
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');

  if (!paginationContainer || !paginationInfo || !currentPageEl || !totalPagesEl || !prevBtn || !nextBtn) {
    return;
  }

  if (totalMessages > currentMessageFilters.limit) {
    // Show pagination
    paginationContainer.style.display = 'flex';

    // Update info
    const startItem = (currentMessageFilters.page - 1) * currentMessageFilters.limit + 1;
    const endItem = Math.min(currentMessageFilters.page * currentMessageFilters.limit, totalMessages);
    paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${totalMessages} messages`;

    // Update page numbers
    currentPageEl.textContent = currentMessageFilters.page.toString();
    totalPagesEl.textContent = totalMessagePages.toString();

    // Update button states
    prevBtn.disabled = currentMessageFilters.page <= 1;
    nextBtn.disabled = currentMessageFilters.page >= totalMessagePages;
  } else {
    // Hide pagination if not needed
    paginationContainer.style.display = 'none';
  }
}

// Change message page
window.changeMessagePage = function(direction) {
  const newPage = currentMessageFilters.page + direction;

  if (newPage >= 1 && newPage <= totalMessagePages) {
    currentMessageFilters.page = newPage;
    loadMessagesWithFilters(currentMessageFilters);
  }
};

window.likeMessage = async function(messageId) {
  try {
    const response = await fetch(`/api/admin/messages/${messageId}/like`, {
      method: 'POST',
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      // Update like count in UI
      const messageCard = document.querySelector(`[data-message-id="${messageId}"]`);
      if (messageCard) {
        const likeBtn = messageCard.querySelector('.admin-btn[onclick*="likeMessage"]');
        if (likeBtn) {
          likeBtn.innerHTML = `<i class="fas fa-thumbs-up"></i> Like (${data.likes_count})`;
        }
      }
    }
  } catch (error) {
    console.error('Error liking message:', error);
  }
};

window.showComments = function(messageId) {
  const commentsSection = document.getElementById(`comments-${messageId}`);
  if (commentsSection) {
    const isVisible = commentsSection.style.display !== 'none';
    commentsSection.style.display = isVisible ? 'none' : 'block';

    if (!isVisible) {
      loadComments(messageId);
    }
  }
};

window.loadComments = async function(messageId) {
  try {
    const response = await fetch(`/admin/api/messages/${messageId}/comments`, {
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      displayComments(messageId, data.comments);
    }
  } catch (error) {
    console.error('Error loading comments:', error);
  }
};

function displayComments(messageId, comments) {
  const commentsList = document.getElementById(`comments-list-${messageId}`);
  if (!commentsList) return;

  if (!comments || comments.length === 0) {
    commentsList.innerHTML = '<div class="admin-no-comments">No comments yet. Be the first to comment!</div>';
    return;
  }

  let html = '';
  comments.forEach(comment => {
    const roleBadge = comment.sender_role === 'admin' ?
      '<span class="admin-badge admin-badge-warning">Admin</span>' :
      '<span class="admin-badge admin-badge-primary">Moderator</span>';

    html += `
      <div class="admin-comment">
        <div class="admin-comment-header">
          <div class="admin-comment-avatar">
            <i class="fas fa-user-circle"></i>
          </div>
          <div class="admin-comment-info">
            <div class="admin-comment-name">${comment.sender_name}</div>
            <div class="admin-comment-meta">
              ${roleBadge}
              <span class="admin-comment-date">${formatDateTime(comment.created_at)}</span>
            </div>
          </div>
        </div>
        <div class="admin-comment-content">
          <p>${comment.content}</p>
        </div>
        <div class="admin-comment-actions">
          <button class="admin-btn admin-btn-xs admin-btn-outline" onclick="likeComment(${comment.id})">
            <i class="fas fa-thumbs-up"></i> Like (${comment.likes_count || 0})
          </button>
        </div>
      </div>
    `;
  });

  commentsList.innerHTML = html;
}

window.postComment = async function(messageId) {
  const input = document.getElementById(`comment-input-${messageId}`);
  if (!input || !input.value.trim()) return;

  const content = input.value.trim();

  try {
    const response = await fetch(`/api/admin/messages/${messageId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content }),
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      input.value = '';
      loadComments(messageId);
      // Update comment count
      const messageCard = document.querySelector(`[data-message-id="${messageId}"]`);
      if (messageCard) {
        const commentBtn = messageCard.querySelector('.admin-btn[onclick*="showComments"]');
        if (commentBtn) {
          commentBtn.innerHTML = `<i class="fas fa-comment"></i> Comments (${data.comments_count})`;
        }
      }
    } else {
      showAdminMessage(data.error || 'Failed to post comment', 'error');
    }
  } catch (error) {
    console.error('Error posting comment:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};

window.editMessage = function(messageId) {
  // Implementation for editing messages
  showAdminMessage('Edit functionality will be implemented', 'info');
};

window.deleteMessage = async function(messageId) {
  if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
    return;
  }

  try {
    showAdminMessage('Deleting message...', 'info');

    // Send delete request via WebSocket if connected, otherwise fallback to HTTP
    if (isConnected && messageWebSocket && messageWebSocket.readyState === WebSocket.OPEN) {
      messageWebSocket.send(JSON.stringify({
        type: 'delete_message',
        messageId: parseInt(messageId)
      }));
      showAdminMessage('Message deleted successfully!', 'success');
    } else {
      // Fallback to HTTP request
      const response = await fetch(`/admin/api/messages/${messageId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        showAdminMessage('Message deleted successfully!', 'success');
        // The real-time update will handle removing the message automatically
        // No need to manually reload messages
      } else {
        showAdminMessage(data.error || 'Failed to delete message', 'error');
      }
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};

window.likeComment = async function(commentId) {
  try {
    const response = await fetch(`/admin/api/comments/${commentId}/like`, {
      method: 'POST',
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      // Update like count in UI
      const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
      if (commentElement) {
        const likeBtn = commentElement.querySelector('.admin-btn[onclick*="likeComment"]');
        if (likeBtn) {
          likeBtn.innerHTML = `<i class="fas fa-thumbs-up"></i> Like (${data.likes_count})`;
        }
      }
    }
  } catch (error) {
    console.error('Error liking comment:', error);
  }
};

// Message reaction functions
window.reactToMessage = async function(messageId, reactionType) {
  try {
    const response = await fetch(`/admin/api/messages/${messageId}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reactionType }),
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      // Update the message reactions in the UI
      updateMessageReactions(messageId, data);
    } else {
      showAdminMessage(data.error || 'Failed to react to message', 'error');
    }
  } catch (error) {
    console.error('Error reacting to message:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};

function updateMessageReactions(messageId, reactionData) {
  const messageCard = document.querySelector(`[data-message-id="${messageId}"]`);
  if (!messageCard) return;

  const reactionButtons = messageCard.querySelectorAll('.reaction-btn');

  reactionButtons.forEach(button => {
    const reactionType = button.getAttribute('onclick').match(/'(\w+)'/)[1];
    const countSpan = button.querySelector('.reaction-count');

    // Remove active class from all buttons first
    button.classList.remove('active');

    // Update counts and active state based on reaction data
    if (reactionData.action === 'added' && reactionType === reactionData.reactionType) {
      button.classList.add('active');
      if (countSpan) {
        const currentCount = parseInt(countSpan.textContent) || 0;
        countSpan.textContent = currentCount + 1;
      }
    } else if (reactionData.action === 'updated') {
      if (reactionType === reactionData.reactionType) {
        button.classList.add('active');
      }
      // Note: In a real implementation, you'd need to get updated counts from the server
      // For now, we'll just update the active state
    } else if (reactionData.action === 'removed') {
      if (countSpan) {
        const currentCount = parseInt(countSpan.textContent) || 0;
        if (currentCount > 0) {
          countSpan.textContent = currentCount - 1;
        }
      }
    }
  });
}

// Real-time messaging functions with enhanced reliability
let maxReconnectDelay = 30000; // Max 30 seconds
let heartbeatInterval = null;
let lastHeartbeat = Date.now();

// Helper function to get authentication token
function getAuthToken() {
  // Try to get auth token from cookie or localStorage
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'auth_token' || name === 'session_token') {
      return value;
    }
  }
  return localStorage.getItem('auth_token') || localStorage.getItem('session_token');
}

function connectToMessageStream() {
  if (messageWebSocket) {
    messageWebSocket.close();
  }

  try {
    // Use WebSocket with correct URL structure
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/admin/api/messages/ws`;

    messageWebSocket = new WebSocket(wsUrl);

    messageWebSocket.onopen = function() {
      console.log('Connected to WebSocket message stream');
      isConnected = true;
      reconnectAttempts = 0;
      reconnectDelay = 1000; // Reset delay on successful connection
      updateConnectionStatus(true);
      startHeartbeat();

      // Send user joined notification
      messageWebSocket.send(JSON.stringify({
        type: 'user_joined'
      }));
    };

    // Add error handling for local development
    messageWebSocket.onerror = function(error) {
      console.warn('WebSocket connection failed (expected in local development):', error);
      isConnected = false;
      updateConnectionStatus(false);
      stopHeartbeat();

      // In local development, show a helpful message instead of trying to reconnect
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('💡 WebSocket not available in local development. Real-time features will work in production.');
        showAdminMessage('Real-time messaging requires Cloudflare Workers environment. Using HTTP fallback.', 'info');
      } else {
        // In production, try to reconnect
        scheduleReconnect();
      }
    };

    messageWebSocket.onmessage = function(event) {
      try {
        const data = JSON.parse(event.data);
        lastHeartbeat = Date.now(); // Update heartbeat timestamp
        handleMessageUpdate(data);
      } catch (error) {
        console.error('Error parsing WebSocket message data:', error);
      }
    };

    messageWebSocket.onclose = function(event) {
      console.log('WebSocket connection closed:', event.code, event.reason);
      isConnected = false;
      updateConnectionStatus(false);
      stopHeartbeat();

      // Send user left notification before closing
      if (event.code !== 1000) { // Not normal closure
        // Implement exponential backoff for reconnection
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          const delay = Math.min(reconnectDelay * Math.pow(2, reconnectAttempts - 1), maxReconnectDelay);

          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);

          setTimeout(() => {
            if (!isConnected) {
              connectToMessageStream();
            }
          }, delay);
        } else {
          console.error('Max reconnection attempts reached. Please refresh the page.');
          showAdminMessage('Connection lost. Please refresh the page to reconnect.', 'error');
        }
      }
    };

    messageWebSocket.onerror = function(error) {
      console.error('WebSocket error:', error);
      isConnected = false;
      updateConnectionStatus(false);
      stopHeartbeat();
    };

  } catch (error) {
    console.error('Failed to create WebSocket:', error);
    isConnected = false;
    updateConnectionStatus(false);
    scheduleReconnect();
  }
}

function startHeartbeat() {
  stopHeartbeat(); // Clear any existing heartbeat

  heartbeatInterval = setInterval(() => {
    const timeSinceLastHeartbeat = Date.now() - lastHeartbeat;

    // If we haven't received any message in 45 seconds, consider connection stale
    if (timeSinceLastHeartbeat > 45000) {
      console.warn('Heartbeat timeout - connection may be stale');
      if (isConnected) {
        isConnected = false;
        updateConnectionStatus(false);
        scheduleReconnect();
      }
    }
  }, 10000); // Check every 10 seconds
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

function scheduleReconnect() {
  if (reconnectAttempts < maxReconnectAttempts) {
    reconnectAttempts++;
    const delay = Math.min(reconnectDelay * Math.pow(2, reconnectAttempts - 1), maxReconnectDelay);

    console.log(`Scheduling reconnection in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);

    setTimeout(() => {
      if (!isConnected) {
        connectToMessageStream();
      }
    }, delay);
  } else {
    console.error('Max reconnection attempts reached');
    showAdminMessage('Unable to reconnect. Please refresh the page.', 'error');
  }
}

function updateConnectionStatus(connected) {
  const statusIndicator = document.getElementById('connection-status');
  if (statusIndicator) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.0.1') {
      // In local development, show a different status
      statusIndicator.className = 'connection-status local-dev';
      statusIndicator.innerHTML = '<i class="fas fa-info-circle"></i> Local Dev (HTTP)';
      statusIndicator.title = 'Real-time features require Cloudflare Workers environment';
    } else {
      statusIndicator.className = connected ? 'connection-status connected' : 'connection-status disconnected';
      statusIndicator.innerHTML = connected ?
        '<i class="fas fa-circle"></i> Connected' :
        '<i class="fas fa-circle"></i> Disconnected';
    }
  }
}

function updateMessageCount(count) {
  const countElement = document.getElementById('admin-message-stats');
  if (countElement) {
    countElement.textContent = `${count} message${count !== 1 ? 's' : ''}`;
  }
}

// Update online user count in chat header
function updateOnlineUserCount(count) {
  const countElement = document.getElementById('chat-members-count');
  if (countElement) {
    countElement.textContent = count;
  }
}

function handleMessageUpdate(data) {
  console.log('Processing message update:', data.type, data);
  
  switch (data.type) {
    case 'initial':
    case 'update':
    case 'new_message':
      handleMessagesUpdate(data);
      break;
      
    case 'message_deleted':
      handleMessageDeletion(data);
      break;
      
    case 'message_updated':
      handleMessageEdit(data);
      break;
      
    case 'heartbeat':
      handleHeartbeat(data);
      break;
      
    case 'typing':
      handleTypingUpdate(data);
      break;
      
    case 'user_joined':
      handleUserJoined(data);
      break;
      
    case 'user_left':
      handleUserLeft(data);
      break;
      
    case 'reaction':
      handleReactionUpdate(data);
      break;
      
    default:
      console.log('Unknown message type:', data.type);
  }
}

function handleMessagesUpdate(data) {
  const newMessages = data.messages || [];

  // Update online user count if provided
  if (data.onlineCount !== undefined) {
    updateOnlineUserCount(data.onlineCount);
  }

  // For new messages, always update immediately
  if (data.type === 'new_message' || newMessages.length !== currentMessages.length) {
    // If this is a new message, add it to the current list
    if (data.type === 'new_message' && data.message) {
      addMessageToUI(data.message);
      return;
    }
    
    currentMessages = newMessages;
    displayMessages(currentMessages);

    // Scroll to bottom for new messages (most recent at bottom)
    if (data.type === 'new_message') {
      scrollToBottom();
    }

    // Show notification for new messages (except for the sender)
    if (data.type === 'new_message' && newMessages.length > 0) {
      const latestMessage = newMessages[newMessages.length - 1];
      if (latestMessage && latestMessage.author_name) {
        playNotificationSound();
      }
    }
  } else {
    // Check for content changes
    const hasChanges = newMessages.some((newMsg, index) => {
      const oldMsg = currentMessages[index];
      return !oldMsg || JSON.stringify(newMsg) !== JSON.stringify(oldMsg);
    });

    if (hasChanges) {
      currentMessages = newMessages;
      displayMessages(currentMessages);
    }
  }
}

function handleMessageDeletion(data) {
  const deletedMessageId = data.messageId;
  removeMessageFromUI(deletedMessageId);
  currentMessages = currentMessages.filter(msg => msg.id !== deletedMessageId);
}

function handleMessageEdit(data) {
  if (data.message) {
    updateMessageInUI(data.message);
    // Update in current messages array
    const index = currentMessages.findIndex(msg => msg.id === data.message.id);
    if (index !== -1) {
      currentMessages[index] = data.message;
    }
  }
}

function handleHeartbeat(data) {
  // Update online count from heartbeat
  if (data.onlineCount !== undefined) {
    updateOnlineUserCount(data.onlineCount);
  }
}

function handleUserJoined(data) {
  if (data.onlineCount !== undefined) {
    updateOnlineUserCount(data.onlineCount);
  }
  if (data.userName && data.userId !== getCurrentUserId()) {
    showNotification(`${data.userName} joined the chat`, 'info');
  }
}

function handleUserLeft(data) {
  if (data.onlineCount !== undefined) {
    updateOnlineUserCount(data.onlineCount);
  }
  if (data.userName && data.userId !== getCurrentUserId()) {
    showNotification(`${data.userName} left the chat`, 'info');
  }
}

function handleReactionUpdate(data) {
  if (data.messageId && data.reaction) {
    updateMessageReaction(data.messageId, data.reaction);
  }
}

// Enhanced UI update functions
function addMessageToUI(message) {
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) return;
  
  // Remove loading indicator if present
  const loading = chatMessages.querySelector('.admin-chat-loading');
  if (loading) {
    loading.remove();
  }
  
  // Check if message already exists to avoid duplicates
  const existingMessage = document.querySelector(`[data-message-id="${message.id}"]`);
  if (existingMessage) {
    return;
  }
  
  // Create message HTML using the existing function from admin-routes.tsx
  const messageHtml = createChatMessageHTML(message);
  
  // Insert at the end
  chatMessages.insertAdjacentHTML('beforeend', messageHtml);
  
  // Auto-scroll if enabled
  if (document.getElementById('auto-scroll')?.checked) {
    scrollToBottom();
  }
  
  // Highlight new message briefly
  const messageElement = chatMessages.lastElementChild;
  if (messageElement) {
    messageElement.classList.add('new-message');
    setTimeout(() => {
      messageElement.classList.remove('new-message');
    }, 2000);
  }
}

function removeMessageFromUI(messageId) {
  const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
  if (messageElement) {
    messageElement.classList.add('message-deleted');
    setTimeout(() => {
      messageElement.remove();
    }, 300);
  }
}

function updateMessageInUI(message) {
  const messageElement = document.querySelector(`[data-message-id="${message.id}"]`);
  if (messageElement) {
    // Replace with updated message
    const updatedHtml = createChatMessageHTML(message);
    messageElement.outerHTML = updatedHtml;
  }
}

function updateMessageReaction(messageId, reaction) {
  const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
  if (messageElement) {
    // Update reaction display - this would need more specific implementation
    // based on your reaction system
    console.log(`Reaction ${reaction.type} on message ${messageId}`);
  }
}

function scrollToBottom() {
  const chatMessages = document.getElementById('chat-messages');
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

function getCurrentUserId() {
  // Try multiple ways to get current user ID
  const userIdElement = document.querySelector('[data-user-id]');
  if (userIdElement) {
    return parseInt(userIdElement.dataset.userId);
  }
  
  // Check if it's embedded in the page somehow
  const scriptTags = document.querySelectorAll('script');
  for (let script of scriptTags) {
    const content = script.textContent;
    const match = content.match(/userId.*?(\d+)/);
    if (match) {
      return parseInt(match[1]);
    }
  }
  
  return 0;
}

function playNotificationSound() {
  if (document.getElementById('sound-notifications')?.checked) {
    // Create a simple notification beep
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.log('Audio notification failed:', error);
    }
  }
}

function showNotification(message, type = 'info') {
  // Simple notification system
  const notification = document.createElement('div');
  notification.className = `admin-notification admin-notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    background-color: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

function scrollToTop() {
  const container = document.getElementById('messages-container');
  if (container) {
    container.scrollTop = 0;
  }
}

// Typing indicator functions
async function sendTypingIndicator(isTyping) {
  // Try WebSocket first if connected
  if (isConnected && messageWebSocket && messageWebSocket.readyState === WebSocket.OPEN) {
    try {
      messageWebSocket.send(JSON.stringify({
        type: 'typing',
        isTyping: isTyping
      }));
      return;
    } catch (error) {
      console.error('Error sending typing via WebSocket:', error);
    }
  }

  // Skip HTTP fallback for typing indicators to avoid 404 errors
  // Typing indicators are not critical and work best via WebSocket
  console.log('WebSocket not connected, skipping typing indicator');
}

function startTyping() {
  if (!isTyping) {
    isTyping = true;
    sendTypingIndicator(true);
  }

  // Clear existing timeout
  if (typingTimeout) {
    clearTimeout(typingTimeout);
  }

  // Set timeout to stop typing after 3 seconds of inactivity
  typingTimeout = setTimeout(() => {
    stopTyping();
  }, 3000);
}

function stopTyping() {
  if (isTyping) {
    isTyping = false;
    sendTypingIndicator(false);
  }

  if (typingTimeout) {
    clearTimeout(typingTimeout);
    typingTimeout = null;
  }
}

function handleTypingUpdate(data) {
  const { user, isTyping } = data;

  if (isTyping) {
    typingUsers.set(user.id, {
      name: user.name,
      role: user.role,
      timestamp: Date.now()
    });
  } else {
    typingUsers.delete(user.id);
  }

  updateTypingIndicator();

  // Clean up stale typing indicators (older than 10 seconds)
  const now = Date.now();
  for (const [userId, typingData] of typingUsers.entries()) {
    if (now - typingData.timestamp > 10000) {
      typingUsers.delete(userId);
    }
  }
}

function updateTypingIndicator() {
  const typingContainer = document.getElementById('typing-indicator');
  if (!typingContainer) return;

  const activeTypingUsers = Array.from(typingUsers.values());

  if (activeTypingUsers.length === 0) {
    typingContainer.style.display = 'none';
    return;
  }

  // Create typing message
  let typingMessage = '';
  if (activeTypingUsers.length === 1) {
    const user = activeTypingUsers[0];
    const roleText = user.role === 'admin' ? 'Admin' : 'Moderator';
    typingMessage = `${user.name} (${roleText}) is typing...`;
  } else if (activeTypingUsers.length === 2) {
    const names = activeTypingUsers.map(u => u.name).join(' and ');
    typingMessage = `${names} are typing...`;
  } else {
    const firstTwo = activeTypingUsers.slice(0, 2).map(u => u.name).join(', ');
    const remaining = activeTypingUsers.length - 2;
    typingMessage = `${firstTwo} and ${remaining} others are typing...`;
  }

  typingContainer.innerHTML = `
    <div class="typing-indicator">
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span class="typing-text">${typingMessage}</span>
    </div>
  `;

  typingContainer.style.display = 'block';
}

// Enhanced loadMessages function with real-time support
window.loadMessages = async function() {
  try {
    console.log('loadMessages: Starting...');

    // Don't fetch manually if we have WebSocket connection
    if (isConnected && currentMessages.length > 0) {
      displayMessages(currentMessages);
      return;
    }

    const response = await fetch('/admin/api/messages', {
      credentials: 'include'
    });

    console.log('loadMessages: Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('loadMessages: Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (data.success) {
      // Enhance messages with reaction data
      currentMessages = await enhanceMessagesWithReactions(data.messages || []);
      displayMessages(currentMessages);

      // Connect to real-time stream if not already connected
      if (!isConnected) {
        connectToMessageStream();
      }
    } else {
      showAdminMessage('Failed to load messages: ' + (data.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error loading messages:', error);
    showAdminMessage('Failed to load messages', 'error');
  }
};

// Function to enhance messages with reaction data
async function enhanceMessagesWithReactions(messages) {
  const enhancedMessages = [];

  for (const message of messages) {
    try {
      // Get reactions for this message
      const reactionsResponse = await fetch(`/admin/api/messages/${message.id}/reactions`, {
        credentials: 'include'
      });

      if (reactionsResponse.ok) {
        const reactionsData = await reactionsResponse.json();
        if (reactionsData.success) {
          // Count reactions by type
          const reactionCounts = {};
          let userReaction = null;

          reactionsData.reactions.forEach(reaction => {
            if (!reactionCounts[reaction.reaction_type]) {
              reactionCounts[reaction.reaction_type] = 0;
            }
            reactionCounts[reaction.reaction_type]++;

            // Check if current user reacted
            // Note: In a real implementation, you'd get the current user ID from authentication
            // For now, we'll assume no user reaction for simplicity
          });

          message.reactions = reactionCounts;
          message.user_reaction = userReaction;
        }
      }
    } catch (error) {
      console.error('Error loading reactions for message:', message.id, error);
      message.reactions = {};
      message.user_reaction = null;
    }

    enhancedMessages.push(message);
  }

  return enhancedMessages;
}

// Enhanced postNewMessage function with real-time updates
window.postNewMessage = async function(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  const messageData = {
    content: formData.get('content'),
    isHighlighted: formData.get('isHighlighted') === 'on'
  };

  // Handle file upload
  const fileInput = document.getElementById('message-file-input');
  if (fileInput && fileInput.files.length > 0) {
    formData.append('media', fileInput.files[0]);
  }

  try {
    showAdminMessage('Posting message...', 'info');

    const response = await fetch('/admin/api/messages', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      showAdminMessage('Message posted successfully!', 'success');
      hideNewMessageForm();

      // Clear the message input and stop typing
      const contentInput = document.getElementById('new-message-content');
      if (contentInput) contentInput.value = '';
      stopTyping();

      // The real-time update will handle displaying the new message automatically
      // No need to manually reload messages
    } else {
      showAdminMessage(data.error || 'Failed to post message', 'error');
    }
  } catch (error) {
    console.error('Error posting message:', error);
    showAdminMessage('Network error. Please try again.', 'error');
  }
};

window.openMediaModal = function(mediaUrl, mediaType) {
  // Implementation for opening media in modal
  window.open(mediaUrl, '_blank');
};

// Enhanced message sending via WebSocket
function sendMessageViaWebSocket(messageData) {
  if (messageWebSocket && messageWebSocket.readyState === WebSocket.OPEN) {
    const wsMessage = {
      type: 'send_message',
      ...messageData
    };
    
    messageWebSocket.send(JSON.stringify(wsMessage));
    return true;
  }
  
  return false;
}

// Connect to WebSocket when the admin messages page loads
document.addEventListener('DOMContentLoaded', function() {
  if (window.location.pathname.includes('/admin/messages')) {
    // Initialize real-time connection after a brief delay to let other scripts load
    setTimeout(() => {
      console.log('Initializing real-time message connection...');
      connectToMessageStream();
      
      // Enhance message input with real-time features
      enhanceMessageInputs();
    }, 2000);
  }
});

function enhanceMessageInputs() {
  const messageInput = document.getElementById('message-input');
  if (messageInput) {
    // Add typing indicators
    messageInput.addEventListener('input', handleTypingStart);
    messageInput.addEventListener('blur', handleTypingStop);
    
    // Store current user ID in DOM for easy access
    const currentUser = getCurrentUserId();
    if (currentUser && !document.querySelector('[data-user-id]')) {
      messageInput.setAttribute('data-user-id', currentUser);
    }
  }
  
  // Override the sendMessage function to use WebSocket if available
  if (typeof window.sendMessage === 'function') {
    const originalSendMessage = window.sendMessage;
    window.sendMessage = function() {
      const input = document.getElementById('message-input');
      const message = input.value.trim();

      if (!message) return;

      // Try WebSocket first
      if (sendMessageViaWebSocket({ content: message })) {
        input.value = '';
        input.style.height = 'auto';
        document.getElementById('send-btn').disabled = true;
        stopTyping();
        return;
      }

      // Fallback to original function
      originalSendMessage();
    };
  }
}

// Send typing status via WebSocket
function handleTypingStart() {
  if (!isTyping) {
    isTyping = true;
    sendTypingIndicator(true);
  }
  
  // Clear existing timeout
  if (typingTimeout) {
    clearTimeout(typingTimeout);
  }
  
  // Set timeout to stop typing after 3 seconds of inactivity
  typingTimeout = setTimeout(() => {
    isTyping = false;
    sendTypingIndicator(false);
  }, 3000);
}

function handleTypingStop() {
  if (typingTimeout) {
    clearTimeout(typingTimeout);
  }
  
  if (isTyping) {
    isTyping = false;
    sendTypingIndicator(false);
  }
}

// Cleanup function
window.disconnectMessageStream = function() {
  // Send user left notification before disconnecting
  if (messageWebSocket && messageWebSocket.readyState === WebSocket.OPEN) {
    messageWebSocket.send(JSON.stringify({
      type: 'user_left'
    }));
  }
  
  if (messageWebSocket) {
    messageWebSocket.close();
    messageWebSocket = null;
  }
  
  isConnected = false;
  updateConnectionStatus(false);
  stopHeartbeat();
};

// Handle page visibility changes to reconnect when page becomes visible
document.addEventListener('visibilitychange', function() {
  if (!document.hidden && !isConnected && window.location.pathname.includes('/admin/messages')) {
    setTimeout(() => {
      connectToMessageStream();
    }, 1000);
  }
});

// Handle before unload to clean disconnect
window.addEventListener('beforeunload', function() {
  window.disconnectMessageStream();
});

// Reply functionality
let currentReplyMessage = null;

function showReplyPreview(replyData) {
  const previewElement = document.getElementById('reply-preview');
  const authorElement = document.getElementById('reply-author');
  const textElement = document.getElementById('reply-text');

  if (!previewElement || !authorElement || !textElement) {
    console.error('Reply preview elements not found');
    return;
  }

  // Set reply data
  authorElement.textContent = replyData.author;
  textElement.textContent = replyData.content;

  // Show preview
  previewElement.style.display = 'block';

  // Update send button state
  const input = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  if (input && sendBtn) {
    sendBtn.disabled = !input.value.trim();
  }
}

window.cancelReply = function() {
  const previewElement = document.getElementById('reply-preview');
  if (previewElement) {
    previewElement.style.display = 'none';
  }

  // Clear reply data
  currentReplyMessage = null;

  // Update send button state
  const input = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  if (input && sendBtn) {
    sendBtn.disabled = !input.value.trim();
  }
};

// Reply to message function
window.replyToMessage = function(messageId) {
  try {
    // Find the message element
    const messageCard = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageCard) {
      console.error('Message not found:', messageId);
      return;
    }

    // Get message content and author
    const messageContent = messageCard.querySelector('.admin-chat-message-content p');
    const messageAuthor = messageCard.querySelector('.admin-chat-message-author');

    if (!messageContent || !messageAuthor) {
      console.error('Message content or author not found');
      return;
    }

    // Get the text content
    const originalText = messageContent.textContent.trim();
    const authorName = messageAuthor.textContent.trim();

    // Create reply prefix
    const replyPrefix = `@${authorName}: `;

    // Get the message input
    const messageInput = document.getElementById('message-input');
    if (!messageInput) {
      console.error('Message input not found');
      return;
    }

    // Set focus and add reply text
    messageInput.focus();

    // If input is empty, add the reply prefix and original message
    if (!messageInput.value.trim()) {
      messageInput.value = replyPrefix + originalText;
    } else {
      // If there's already text, add a new line and the reply
      messageInput.value += '\n' + replyPrefix + originalText;
    }

    // Auto-resize the textarea
    messageInput.style.height = 'auto';
    messageInput.style.height = messageInput.scrollHeight + 'px';

    // Enable send button
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) {
      sendBtn.disabled = false;
    }

    // Scroll to input area
    messageInput.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Show success message
    showAdminMessage('Replying to message...', 'info');

  } catch (error) {
    console.error('Error replying to message:', error);
    showAdminMessage('Failed to reply to message', 'error');
  }
};

// Role changes rendering function
function renderRoleChangesList(roleChanges) {
  const container = document.getElementById('role-changes-list');
  if (!container) {
    console.warn('Role changes list container not found');
    return;
  }

  if (!roleChanges || roleChanges.length === 0) {
    container.innerHTML = `
      <div class="admin-empty-state">
        <i class="fas fa-history admin-empty-icon"></i>
        <h4>No role changes found</h4>
        <p>Role change history will appear here when changes are made.</p>
      </div>
    `;
    return;
  }

  const changesHTML = roleChanges.map(change => {
    const changeType = getRoleChangeType(change.old_role, change.new_role);
    const changeIcon = getRoleChangeIcon(changeType);
    const timeAgo = getTimeAgo(new Date(change.created_at));

    return `
      <div class="admin-role-change-item">
        <div class="admin-role-change-icon ${changeType}">
          <i class="fas ${changeIcon}"></i>
        </div>
        <div class="admin-role-change-content">
          <div class="admin-role-change-title">
            <strong>${change.target_user_name}</strong> was ${changeType === 'promotion' ? 'promoted' : changeType === 'demotion' ? 'demoted' : 'changed'} to
            <span class="admin-role-badge ${change.new_role}">${change.new_role}</span>
          </div>
          <div class="admin-role-change-meta">
            <span class="admin-role-change-by">By ${change.changed_by_user_name}</span>
            <span class="admin-role-change-time">${timeAgo}</span>
          </div>
          ${change.change_reason ? `<div class="admin-role-change-reason">"${change.change_reason}"</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = changesHTML;
}

function getRoleChangeType(oldRole, newRole) {
  const roleHierarchy = { 'user': 1, 'moderator': 2, 'admin': 3 };
  const oldLevel = roleHierarchy[oldRole] || 1;
  const newLevel = roleHierarchy[newRole] || 1;

  if (newLevel > oldLevel) return 'promotion';
  if (newLevel < oldLevel) return 'demotion';
  return 'change';
}

function getRoleChangeIcon(changeType) {
  switch (changeType) {
    case 'promotion': return 'fa-arrow-up';
    case 'demotion': return 'fa-arrow-down';
    default: return 'fa-exchange-alt';
  }
}

function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return date.toLocaleDateString();
}

// ===== MOBILE RESPONSIVE ENHANCEMENTS =====

// Enhanced mobile responsive functionality
(function() {
    'use strict';
    
    // Check if device is mobile/touch
    const isMobile = window.innerWidth <= 768;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Mobile-specific initialization
    if (isMobile || isTouch) {
        document.body.classList.add('mobile-device');
        initMobileEnhancements();
    }
    
    function initMobileEnhancements() {
        // Enhanced table scrolling with indicators
        enhanceTableScrolling();
        
        // Mobile form improvements
        improveMobileForms();
        
        // Touch-friendly modal handling
        enhanceMobileModals();
        
        // Swipe gestures for tables
        addSwipeGestures();
        
        // Mobile-specific sidebar behavior
        enhanceMobileSidebar();
        
        // Orientation change handling
        handleOrientationChange();
        
        // iOS Safari specific fixes
        applyIOSFixes();
    }
    
    function enhanceTableScrolling() {
        const tableContainers = document.querySelectorAll('.admin-table-container');
        
        tableContainers.forEach(container => {
            // Add scroll indicators
            addScrollIndicators(container);
            
            // Smooth scrolling with momentum
            container.style.webkitOverflowScrolling = 'touch';
            container.style.overflowScrolling = 'touch';
            
            // Touch-friendly scroll behavior
            let isScrolling = false;
            let startX = 0;
            
            container.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                isScrolling = false;
            }, { passive: true });
            
            container.addEventListener('touchmove', (e) => {
                if (!isScrolling) {
                    const currentX = e.touches[0].clientX;
                    const diffX = Math.abs(currentX - startX);
                    
                    if (diffX > 10) { // Threshold for horizontal scrolling
                        isScrolling = true;
                    }
                }
            }, { passive: true });
        });
    }
    
    function addScrollIndicators(container) {
        // Create scroll indicators
        const leftIndicator = document.createElement('div');
        leftIndicator.className = 'scroll-indicator left';
        leftIndicator.innerHTML = '<i class="fas fa-chevron-left"></i>';
        
        const rightIndicator = document.createElement('div');
        rightIndicator.className = 'scroll-indicator right';
        rightIndicator.innerHTML = '<i class="fas fa-chevron-right"></i>';
        
        // Add CSS for indicators
        const style = document.createElement('style');
        style.textContent = `
            .admin-table-container {
                position: relative;
            }
            .scroll-indicator {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 0.5rem;
                border-radius: 50%;
                z-index: 2;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
            }
            .scroll-indicator.left {
                left: 0.5rem;
            }
            .scroll-indicator.right {
                right: 0.5rem;
            }
            .admin-table-container:hover .scroll-indicator {
                opacity: 0.8;
            }
            @media (max-width: 768px) {
                .scroll-indicator {
                    display: block;
                }
            }
        `;
        document.head.appendChild(style);
        
        container.appendChild(leftIndicator);
        container.appendChild(rightIndicator);
        
        // Handle scroll events to show/hide indicators
        container.addEventListener('scroll', updateScrollIndicators);
        updateScrollIndicators.call(container);
        
        function updateScrollIndicators() {
            const scrollLeft = this.scrollLeft;
            const scrollWidth = this.scrollWidth;
            const clientWidth = this.clientWidth;
            
            const canScrollLeft = scrollLeft > 0;
            const canScrollRight = scrollLeft < scrollWidth - clientWidth;
            
            leftIndicator.style.opacity = canScrollLeft ? '0.8' : '0';
            rightIndicator.style.opacity = canScrollRight ? '0.8' : '0';
        }
    }
    
    function improveMobileForms() {
        const formInputs = document.querySelectorAll('input, textarea, select');
        
        formInputs.forEach(input => {
            // Prevent zoom on iOS
            if (input.type !== 'file' && input.type !== 'checkbox' && input.type !== 'radio') {
                // Ensure font-size is at least 16px to prevent zoom
                const computedStyle = window.getComputedStyle(input);
                const fontSize = parseFloat(computedStyle.fontSize);
                if (fontSize < 16) {
                    input.style.fontSize = '16px';
                }
            }
            
            // Enhanced focus behavior
            input.addEventListener('focus', function() {
                this.classList.add('mobile-focused');
                
                // Scroll into view with better positioning
                setTimeout(() => {
                    this.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });
                }, 100);
            });
            
            input.addEventListener('blur', function() {
                this.classList.remove('mobile-focused');
            });
            
            // Auto-resize textareas
            if (input.tagName.toLowerCase() === 'textarea') {
                input.addEventListener('input', function() {
                    this.style.height = 'auto';
                    this.style.height = this.scrollHeight + 'px';
                });
            }
        });
        
        // File input improvements
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.addEventListener('change', function() {
                const label = this.closest('.admin-form-group')?.querySelector('label');
                if (label && this.files.length > 0) {
                    const originalText = label.dataset.originalText || label.textContent;
                    label.dataset.originalText = originalText;
                    
                    const fileText = this.files.length === 1
                        ? this.files[0].name
                        : `${this.files.length} files selected`;
                    
                    label.textContent = `${originalText} (${fileText})`;
                    label.style.color = '#059669';
                }
            });
        });
    }
    
    function enhanceMobileModals() {
        const modals = document.querySelectorAll('.admin-modal');
        
        modals.forEach(modal => {
            // Prevent body scroll when modal is open
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        const isVisible = modal.style.display !== 'none' && modal.style.display !== '';
                        if (isVisible) {
                            document.body.style.overflow = 'hidden';
                            document.body.style.position = 'fixed';
                            document.body.style.width = '100%';
                        } else {
                            document.body.style.overflow = '';
                            document.body.style.position = '';
                            document.body.style.width = '';
                        }
                    }
                });
            });
            
            observer.observe(modal, { attributes: true });
            
            // Enhanced modal content scrolling
            const modalContent = modal.querySelector('.admin-modal-content');
            if (modalContent) {
                modalContent.style.webkitOverflowScrolling = 'touch';
                modalContent.style.overflowScrolling = 'touch';
            }
        });
    }
    
    function addSwipeGestures() {
        const tableContainers = document.querySelectorAll('.admin-table-container');
        
        tableContainers.forEach(container => {
            let startX = 0;
            let startY = 0;
            let isHorizontalSwipe = false;
            
            container.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isHorizontalSwipe = false;
            }, { passive: true });
            
            container.addEventListener('touchmove', (e) => {
                if (!isHorizontalSwipe) {
                    const currentX = e.touches[0].clientX;
                    const currentY = e.touches[0].clientY;
                    const diffX = Math.abs(currentX - startX);
                    const diffY = Math.abs(currentY - startY);
                    
                    // Determine if this is a horizontal swipe
                    if (diffX > diffY && diffX > 10) {
                        isHorizontalSwipe = true;
                    }
                }
            }, { passive: true });
            
            container.addEventListener('touchend', (e) => {
                if (isHorizontalSwipe) {
                    const endX = e.changedTouches[0].clientX;
                    const diffX = startX - endX;
                    
                    if (Math.abs(diffX) > 50) { // Minimum swipe distance
                        const scrollAmount = 150;
                        if (diffX > 0) {
                            // Swipe left - scroll right
                            container.scrollLeft += scrollAmount;
                        } else {
                            // Swipe right - scroll left
                            container.scrollLeft -= scrollAmount;
                        }
                    }
                }
            }, { passive: true });
        });
    }
    
    function enhanceMobileSidebar() {
        const sidebar = document.getElementById('admin-sidebar');
        const mobileToggle = document.querySelector('.admin-mobile-toggle');
        
        if (!sidebar || !mobileToggle) return;
        
        // Close sidebar when clicking outside
        document.addEventListener('touchend', (e) => {
            if (sidebar.classList.contains('mobile-open')) {
                const rect = sidebar.getBoundingClientRect();
                const x = e.changedTouches[0].clientX;
                const y = e.changedTouches[0].clientY;
                
                if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                    // Check if click is not on toggle button
                    const toggleRect = mobileToggle.getBoundingClientRect();
                    if (!(x >= toggleRect.left && x <= toggleRect.right &&
                          y >= toggleRect.top && y <= toggleRect.bottom)) {
                        sidebar.classList.remove('mobile-open');
                    }
                }
            }
        });
        
        // Swipe to close sidebar
        let sidebarStartX = 0;
        sidebar.addEventListener('touchstart', (e) => {
            sidebarStartX = e.touches[0].clientX;
        }, { passive: true });
        
        sidebar.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const diffX = sidebarStartX - endX;
            
            // If swiping left more than 100px, close sidebar
            if (diffX > 100) {
                sidebar.classList.remove('mobile-open');
            }
        }, { passive: true });
    }
    
    function handleOrientationChange() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                // Recalculate table scroll positions
                const tableContainers = document.querySelectorAll('.admin-table-container');
                tableContainers.forEach(container => {
                    container.dispatchEvent(new Event('scroll'));
                });
                
                // Adjust modal heights
                const openModals = document.querySelectorAll('.admin-modal[style*="flex"], .admin-modal[style*="block"]');
                openModals.forEach(modal => {
                    const content = modal.querySelector('.admin-modal-content');
                    if (content) {
                        content.style.maxHeight = window.orientation === 0 ? '90vh' : '80vh';
                    }
                });
                
                // Refresh sidebar state
                if (window.innerWidth > 1024) {
                    const sidebar = document.getElementById('admin-sidebar');
                    if (sidebar) {
                        sidebar.classList.remove('mobile-open');
                    }
                }
            }, 100);
        });
    }
    
    function applyIOSFixes() {
        // iOS Safari specific fixes
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            // Fix viewport height on iOS Safari
            function setVH() {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
            }
            
            setVH();
            window.addEventListener('resize', setVH);
            window.addEventListener('orientationchange', () => setTimeout(setVH, 100));
            
            // Prevent rubber band scrolling on body
            document.body.addEventListener('touchmove', (e) => {
                if (e.target === document.body) {
                    e.preventDefault();
                }
            }, { passive: false });
            
            // Fix position sticky issues
            const stickyElements = document.querySelectorAll('[style*="position: sticky"]');
            stickyElements.forEach(element => {
                element.style.position = '-webkit-sticky';
                element.style.position = 'sticky';
            });
        }
    }
    
    // Initialize responsive table enhancements
    function enhanceResponsiveTables() {
        const tables = document.querySelectorAll('.admin-table');
        
        tables.forEach(table => {
            // Add data attributes for responsive design
            const headers = table.querySelectorAll('th');
            const rows = table.querySelectorAll('tbody tr');
            
            headers.forEach((header, index) => {
                const headerText = header.textContent.trim();
                rows.forEach(row => {
                    const cell = row.cells[index];
                    if (cell) {
                        cell.setAttribute('data-label', headerText);
                    }
                });
            });
            
            // Add responsive class for small screens
            if (window.innerWidth <= 480) {
                table.classList.add('admin-table-responsive');
            }
        });
    }
    
    // Re-enhance tables when content changes
    const contentObserver = new MutationObserver(function(mutations) {
        let shouldReenhance = false;
        
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                const addedNodes = Array.from(mutation.addedNodes);
                if (addedNodes.some(node =>
                    node.nodeType === 1 &&
                    (node.classList && node.classList.contains('admin-table') ||
                     node.querySelector && node.querySelector('.admin-table'))
                )) {
                    shouldReenhance = true;
                }
            }
        });
        
        if (shouldReenhance) {
            setTimeout(() => {
                enhanceResponsiveTables();
                if (isMobile || isTouch) {
                    enhanceTableScrolling();
                }
            }, 100);
        }
    });
    
    contentObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Initialize enhancements
    enhanceResponsiveTables();
    
    // Add CSS for mobile-focused inputs
    const mobileStyle = document.createElement('style');
    mobileStyle.textContent = `
        @media (max-width: 768px) {
            .mobile-focused {
                transform: scale(1.02);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2) !important;
                transition: all 0.2s ease;
                z-index: 10;
                position: relative;
            }
            
            /* Responsive table alternative layout */
            .admin-table-responsive {
                display: block !important;
            }
            
            .admin-table-responsive thead {
                display: none !important;
            }
            
            .admin-table-responsive tbody {
                display: block !important;
            }
            
            .admin-table-responsive tr {
                display: block !important;
                margin-bottom: 1rem;
                padding: 1rem;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                background: white;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            .admin-table-responsive td {
                display: block !important;
                text-align: left !important;
                border: none !important;
                padding: 0.5rem 0 !important;
                position: relative;
                padding-left: 120px !important;
            }
            
            .admin-table-responsive td:before {
                content: attr(data-label) ': ';
                font-weight: bold;
                color: #666;
                position: absolute;
                left: 0;
                top: 0.5rem;
                width: 110px;
                text-align: left;
                font-size: 0.8rem;
            }
            
            .admin-table-responsive .admin-table-actions {
                flex-direction: row !important;
                justify-content: flex-start !important;
                gap: 0.5rem !important;
                margin-top: 0.5rem;
            }
            
            .admin-table-responsive .admin-table-actions:before {
                display: none !important;
            }
        }
    `;
    document.head.appendChild(mobileStyle);
})();