/**
 * Faith Defenders - Global Navigation JavaScript
 * Professional, accessible, and mobile-responsive navigation functionality
 */

class GlobalNavigation {
  constructor() {
    this.mobileToggle = document.getElementById('mobile-menu-toggle');
    this.mobileMenu = document.getElementById('mobile-menu');
    this.mobileOverlay = document.getElementById('mobile-menu-overlay');
    this.mobileClose = document.getElementById('mobile-menu-close');
    this.userToggle = document.getElementById('user-toggle');
    this.userDropdown = document.getElementById('user-dropdown');

    this.isInitialized = false;
    this.isMobileMenuOpen = false;
    this.isUserDropdownOpen = false;

    this.init();
  }

  /**
   * Initialize navigation functionality
   */
  init() {
    if (this.isInitialized) return;

    this.bindEvents();
    this.setupAccessibility();
    this.setupKeyboardNavigation();
    this.handleInitialState();

    this.isInitialized = true;
  }

  /**
   * Bind all event listeners
   */
  bindEvents() {
    // Mobile menu toggle
    if (this.mobileToggle) {
      this.mobileToggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleMobileMenu();
      });
    }

    // Mobile menu close
    if (this.mobileClose) {
      this.mobileClose.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeMobileMenu();
      });
    }

    // Mobile overlay close
    if (this.mobileOverlay) {
      this.mobileOverlay.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeMobileMenu();
      });
    }

    // User dropdown toggle
    if (this.userToggle) {
      this.userToggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleUserDropdown();
      });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      this.handleOutsideClick(e);
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.handleEscapeKey();
      }
    });

    // Handle window resize
    window.addEventListener('resize', this.debounce(() => {
      this.handleResize();
    }, 250));

    // Handle logout functionality
    window.handleLogout = () => this.handleLogout();
  }

  /**
   * Setup accessibility features
   */
  setupAccessibility() {
    // Add ARIA attributes
    if (this.mobileToggle && this.mobileMenu) {
      this.mobileToggle.setAttribute('aria-controls', 'mobile-menu');
      this.mobileToggle.setAttribute('aria-expanded', 'false');
      this.mobileMenu.setAttribute('aria-hidden', 'true');
    }

    if (this.userToggle && this.userDropdown) {
      this.userToggle.setAttribute('aria-controls', 'user-dropdown');
      this.userToggle.setAttribute('aria-expanded', 'false');
      this.userDropdown.setAttribute('aria-hidden', 'true');
    }

    // Add skip link for keyboard users
    this.addSkipLink();
  }

  /**
   * Setup keyboard navigation
   */
  setupKeyboardNavigation() {
    // Handle keyboard navigation for mobile menu
    if (this.mobileMenu) {
      const focusableElements = this.mobileMenu.querySelectorAll(
        'a, button, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      this.mobileMenu.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      });
    }
  }

  /**
   * Handle initial state on page load
   */
  handleInitialState() {
    // Close mobile menu if screen becomes large
    if (window.innerWidth > 768 && this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }

    // Set initial focus states
    this.updateFocusStates();
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu() {
    if (this.isMobileMenuOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  /**
   * Open mobile menu
   */
  openMobileMenu() {
    this.isMobileMenuOpen = true;
    this.updateMobileMenuState();

    // Focus first menu item
    setTimeout(() => {
      const firstLink = this.mobileMenu?.querySelector('.mobile-nav-link');
      if (firstLink) {
        firstLink.focus();
      }
    }, 100);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Announce to screen readers
    this.announceToScreenReader('Mobile menu opened');
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    this.updateMobileMenuState();

    // Restore body scroll
    document.body.style.overflow = '';

    // Return focus to toggle button
    if (this.mobileToggle) {
      this.mobileToggle.focus();
    }

    // Announce to screen readers
    this.announceToScreenReader('Mobile menu closed');
  }

  /**
   * Update mobile menu state
   */
  updateMobileMenuState() {
    if (!this.mobileToggle || !this.mobileMenu || !this.mobileOverlay) return;

    if (this.isMobileMenuOpen) {
      this.mobileToggle.classList.add('active');
      this.mobileToggle.setAttribute('aria-expanded', 'true');
      this.mobileMenu.classList.add('open');
      this.mobileMenu.setAttribute('aria-hidden', 'false');
      this.mobileOverlay.classList.add('active');
    } else {
      this.mobileToggle.classList.remove('active');
      this.mobileToggle.setAttribute('aria-expanded', 'false');
      this.mobileMenu.classList.remove('open');
      this.mobileMenu.setAttribute('aria-hidden', 'true');
      this.mobileOverlay.classList.remove('active');
    }
  }

  /**
   * Toggle user dropdown
   */
  toggleUserDropdown() {
    if (this.isUserDropdownOpen) {
      this.closeUserDropdown();
    } else {
      this.openUserDropdown();
    }
  }

  /**
   * Open user dropdown
   */
  openUserDropdown() {
    this.isUserDropdownOpen = true;
    this.updateUserDropdownState();

    // Focus first dropdown item
    setTimeout(() => {
      const firstItem = this.userDropdown?.querySelector('.dropdown-item');
      if (firstItem) {
        firstItem.focus();
      }
    }, 100);
  }

  /**
   * Close user dropdown
   */
  closeUserDropdown() {
    this.isUserDropdownOpen = false;
    this.updateUserDropdownState();

    // Return focus to toggle button
    if (this.userToggle) {
      this.userToggle.focus();
    }
  }

  /**
   * Update user dropdown state
   */
  updateUserDropdownState() {
    if (!this.userToggle || !this.userDropdown) return;

    if (this.isUserDropdownOpen) {
      this.userToggle.classList.add('active');
      this.userToggle.setAttribute('aria-expanded', 'true');
      this.userDropdown.classList.add('show');
      this.userDropdown.setAttribute('aria-hidden', 'false');
    } else {
      this.userToggle.classList.remove('active');
      this.userToggle.setAttribute('aria-expanded', 'false');
      this.userDropdown.classList.remove('show');
      this.userDropdown.setAttribute('aria-hidden', 'true');
    }
  }

  /**
   * Handle clicks outside of dropdowns and mobile menu
   */
  handleOutsideClick(e) {
    // Close user dropdown if clicking outside
    if (this.isUserDropdownOpen && this.userDropdown && this.userToggle) {
      if (!this.userDropdown.contains(e.target) && !this.userToggle.contains(e.target)) {
        this.closeUserDropdown();
      }
    }

    // Close mobile menu if clicking outside on mobile
    if (this.isMobileMenuOpen && this.mobileMenu && window.innerWidth <= 768) {
      if (!this.mobileMenu.contains(e.target) && !this.mobileToggle?.contains(e.target)) {
        this.closeMobileMenu();
      }
    }
  }

  /**
   * Handle escape key presses
   */
  handleEscapeKey() {
    if (this.isUserDropdownOpen) {
      this.closeUserDropdown();
    } else if (this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Close mobile menu on larger screens
    if (window.innerWidth > 768 && this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }

    // Update focus states
    this.updateFocusStates();
  }

  /**
   * Update focus states for accessibility
   */
  updateFocusStates() {
    // Update mobile menu accessibility based on screen size
    if (window.innerWidth <= 768) {
      if (this.mobileToggle) {
        this.mobileToggle.style.display = 'flex';
      }
    } else {
      if (this.mobileToggle) {
        this.mobileToggle.style.display = 'none';
      }
    }
  }

  /**
   * Handle logout functionality
   */
  async handleLogout() {
    try {
      // Show loading state
      const logoutBtn = document.querySelector('.logout-btn');
      if (logoutBtn) {
        const originalText = logoutBtn.innerHTML;
        logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Logging out...</span>';
        logoutBtn.disabled = true;

        // Call logout API
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin'
        });

        if (response.ok) {
          // Redirect to home page
          window.location.href = '/';
        } else {
          throw new Error('Logout failed');
        }
      }
    } catch (error) {
      console.error('Logout error:', error);

      // Reset button state
      const logoutBtn = document.querySelector('.logout-btn');
      if (logoutBtn) {
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> <span>Logout</span>';
        logoutBtn.disabled = false;
      }

      // Show error message
      this.showNotification('Logout failed. Please try again.', 'error');
    }
  }

  /**
   * Add skip link for accessibility
   */
  addSkipLink() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #1e3c72;
      color: white;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 1001;
      transition: top 0.3s;
    `;

    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  /**
   * Show notification to user
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `nav-notification nav-notification--${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: ${type === 'error' ? '#ef4444' : '#1e3c72'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      z-index: 1002;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after delay
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  /**
   * Announce message to screen readers
   */
  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 1000);
  }

  /**
   * Debounce utility function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

/**
 * Initialize navigation when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize global navigation
  window.globalNavigation = new GlobalNavigation();

  // Add main content ID for skip link
  const mainContent = document.querySelector('main');
  if (mainContent && !mainContent.id) {
    mainContent.id = 'main-content';
  }
});

/**
 * Handle service worker registration for offline functionality
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
      })
      .catch((error) => {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
}