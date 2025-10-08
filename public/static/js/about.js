/**
 * About Page JavaScript
 * Handles about page specific functionality for Faith Defenders
 */

(function() {
  'use strict';

  // Initialize about page functionality when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    initializeAboutPage();
    initializeValuesAnimation();
    initializeBeliefsScroll();
    setupContactForm();
    initializeStatsVisibility();
  });

  /**
   * Initialize about page specific features
   */
  function initializeAboutPage() {
    console.log('Initializing about page functionality...');

    // Hero section animations
    initializeHeroEffects();

    // Mission statement interactions
    setupMissionInteractions();

    // Belief cards hover effects
    setupBeliefCardEffects();

    // Feature cards animations
    initializeFeatureCards();

    // Get involved animations
    setupGetInvolved();

    console.log('About page functionality initialized');
  }

  /**
   * Initialize hero section effects
   */
  function initializeHeroEffects() {
    const heroSection = document.querySelector('.about-hero');
    if (!heroSection) return;

    // Add gradient animation to background
    const gradientOverlay = heroSection.querySelector('svg');
    if (gradientOverlay) {
      gradientOverlay.animate(
        [
          { opacity: 0 },
          { opacity: 0.1, transform: 'scale(1.05)' },
          { opacity: 0.05 }
        ],
        {
          duration: 8000,
          iterations: Infinity,
          direction: 'alternate',
          easing: 'ease-in-out'
        }
      );
    }

    // Add typing effect to title
    const title = heroSection.querySelector('.page-title, h1');
    if (title) {
      const originalText = title.textContent;
      title.textContent = '';

      let charIndex = 0;
      const typingInterval = setInterval(() => {
        if (charIndex < originalText.length) {
          title.textContent += originalText[charIndex];
          charIndex++;
        } else {
          clearInterval(typingInterval);

          // Add cursor blink animation
          title.classList.add('typing-complete');
        }
      }, 100);
    }

    // Parallax effect for hero elements
    window.addEventListener('scroll', function() {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.3;

      const title = heroSection.querySelector('.page-title, h1');
      if (title) {
        title.style.transform = `translateY(${rate * 0.5}px)`;
      }

      const subtitle = heroSection.querySelector('.page-subtitle, p');
      if (subtitle) {
        subtitle.style.transform = `translateY(${rate * 0.3}px)`;
      }
    });
  }

  /**
   * Setup mission statement interactions
   */
  function setupMissionInteractions() {
    const missionCards = document.querySelectorAll('.mission-card, .doctrine-item');

    missionCards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        // Add glow effect
        this.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
        this.style.transform = 'translateY(-5px)';

        // Highlight related elements
        const category = this.dataset.category;
        if (category) {
          document.querySelectorAll(`[data-category="${category}"]`).forEach(el => {
            if (el !== this) {
              el.style.opacity = '0.7';
            }
          });
        }
      });

      card.addEventListener('mouseleave', function() {
        this.style.boxShadow = '';
        this.style.transform = '';

        // Reset opacity
        const category = this.dataset.category;
        if (category) {
          document.querySelectorAll(`[data-category="${category}"]`).forEach(el => {
            el.style.opacity = '';
          });
        }
      });

      // Add click animation
      card.addEventListener('click', function() {
        this.style.transform = 'scale(0.98)';
        setTimeout(() => {
          this.style.transform = '';
        }, 150);
      });
    });
  }

  /**
   * Setup belief card hover effects
   */
  function setupBeliefCardEffects() {
    const beliefCards = document.querySelectorAll('.doctrine-item, .mission-card');

    beliefCards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        // Add dynamic shadow based on card theme
        if (this.classList.contains('doctrine-item')) {
          this.style.boxShadow = '0 15px 35px rgba(59, 130, 246, 0.2)';
        }

        // Add ripple effect
        createRippleEffect(this);
      });

      card.addEventListener('mouseleave', function() {
        this.style.boxShadow = '';
      });
    });
  }

  /**
   * Create ripple effect on card
   */
  function createRippleEffect(element) {
    const ripple = document.createElement('div');
    ripple.className = 'belief-ripple';

    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 0.8;
    const x = rect.width / 2;
    const y = rect.height / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x - size / 2}px`;
    ripple.style.top = `${y - size / 2}px`;

    element.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 500);
  }

  /**
   * Initialize feature cards animations
   */
  function initializeFeatureCards() {
    const featureCards = document.querySelectorAll('.feature-card');
    if (featureCards.length === 0) return;

    // Use Intersection Observer for scroll-triggered animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('animate-in');
          }, index * 200);
        }
      });
    }, { threshold: 0.2 });

    featureCards.forEach(card => observer.observe(card));

    // Add hover interactions
    featureCards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        const emoji = this.querySelector('.feature-emoji');
        if (emoji) {
          emoji.animate(
            [
              { transform: 'scale(1)' },
              { transform: 'scale(1.2)' },
              { transform: 'scale(1)' }
            ],
            { duration: 300, easing: 'ease-out' }
          );
        }
      });
    });
  }

  /**
   * Initialize values animation
   */
  function initializeValuesAnimation() {
    const valueItems = document.querySelectorAll('.value-item, .feature-card');

    // Stagger animation
    valueItems.forEach((item, index) => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(20px)';

      setTimeout(() => {
        item.animate(
          [
            { opacity: 0, transform: 'translateY(20px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ],
          {
            duration: 600,
            fill: 'forwards',
            easing: 'ease-out'
          }
        );
      }, index * 150);
    });
  }

  /**
   * Initialize beliefs scroll animation
   */
  function initializeBeliefsScroll() {
    const beliefSection = document.querySelector('.beliefs-section');
    if (!beliefSection) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const doctrineItems = beliefSection.querySelectorAll('.doctrine-item');
          doctrineItems.forEach((item, index) => {
            setTimeout(() => {
              item.classList.add('slide-in-bounce');
            }, index * 200);
          });
        }
      });
    }, { threshold: 0.3 });

    observer.observe(beliefSection);
  }

  /**
   * Setup get involved section
   */
  function setupGetInvolved() {
    const getInvolvedCard = document.querySelector('.get-involved-card');
    if (!getInvolvedCard) return;

    const actions = getInvolvedCard.querySelectorAll('a, button');
    actions.forEach(action => {
      action.addEventListener('mouseenter', function() {
        this.animate(
          [
            { transform: 'scale(1)' },
            { transform: 'scale(1.05)' },
            { transform: 'scale(1)' }
          ],
          { duration: 400, easing: 'ease-in-out' }
        );
      });
    });
  }

  /**
   * Setup contact form functionality
   */
  function setupContactForm() {
    const contactForm = document.querySelector('#contact-form, .contact-form');
    if (!contactForm) return;

    // Add form validation
    const inputs = contactForm.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', function() {
        validateInput(this);
      });
    });

    // Add submit handler
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      submitContactForm(this);
    });
  }

  /**
   * Validate input field
   */
  function validateInput(input) {
    const value = input.value.trim();
    let isValid = true;

    // Remove previous validation classes
    input.classList.remove('valid', 'invalid');

    // Check required fields
    if (input.hasAttribute('required') && !value) {
      isValid = false;
    }

    // Email validation
    if (input.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      isValid = emailRegex.test(value);
    }

    // Add validation class
    input.classList.add(isValid ? 'valid' : 'invalid');

    // Show/hide error message
    const errorMessage = input.parentNode.querySelector('.field-error');
    if (errorMessage) {
      errorMessage.style.display = isValid ? 'none' : 'block';
    }

    return isValid;
  }

  /**
   * Submit contact form
   */
  function submitContactForm(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    // Simulate form submission (replace with actual API call)
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;

      // Show success message
      showMessage('Thank you for your message! We\'ll get back to you soon.', 'success');

      // Reset form
      form.reset();
    }, 2000);
  }

  /**
   * Show message to user
   */
  function showMessage(message, type = 'info') {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;

    // Add to page
    document.body.appendChild(messageEl);

    // Animate in
    messageEl.animate(
      [
        { opacity: 0, transform: 'translateY(20px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ],
      { duration: 300 }
    );

    // Remove after delay
    setTimeout(() => {
      messageEl.animate(
        [
          { opacity: 1, transform: 'translateY(0)' },
          { opacity: 0, transform: 'translateY(-20px)' }
        ],
        { duration: 300 }
      ).addEventListener('finish', () => messageEl.remove());
    }, 4000);
  }

  /**
   * Initialize stats visibility animation
   */
  function initializeStatsVisibility() {
    const statElements = document.querySelectorAll('.stat-counter, .stat-number');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateStatCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statElements.forEach(stat => observer.observe(stat));
  }

  /**
   * Animate stat counter
   */
  function animateStatCounter(element) {
    const target = parseInt(element.dataset.target) || parseInt(element.textContent) || 0;
    const duration = 2000;
    const steps = 50;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      element.textContent = Math.floor(current).toLocaleString();
    }, duration / steps);
  }

  /**
   * Add CSS for about page animations
   */
  if (typeof document !== 'undefined' && document.head) {
    const style = document.createElement('style');
    style.textContent = `
      .belief-ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: belief-ripple 0.5s linear;
        pointer-events: none;
        z-index: 1;
      }

      @keyframes belief-ripple {
        to {
          transform: scale(3);
          opacity: 0;
        }
      }

      .animate-in {
        animation: slideInUp 0.6s ease-out forwards;
      }

      @keyframes slideInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .slide-in-bounce {
        animation: slideInBounce 0.8s ease-out forwards;
      }

      @keyframes slideInBounce {
        0% {
          opacity: 0;
          transform: translateX(-100%);
        }
        60% {
          transform: translateX(10%);
        }
        100% {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .typing-complete::after {
        content: '';
        display: inline-block;
        width: 3px;
        height: 1em;
        background: currentColor;
        animation: blink 1s infinite;
        margin-left: 2px;
      }

      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }

      .message {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        max-width: 400px;
      }

      .message-success {
        background: #10b981;
      }

      .message-error {
        background: #ef4444;
      }

      .message-info {
        background: #3b82f6;
      }

      .input-valid {
        border-color: #10b981;
        box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
      }

      .input-invalid {
        border-color: #ef4444;
        box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
      }

      .field-error {
        color: #ef4444;
        font-size: 0.875rem;
        margin-top: 0.25rem;
        display: none;
      }

      @media (prefers-reduced-motion: reduce) {
        .animate-in,
        .slide-in-bounce,
        .typing-complete::after,
        .belief-ripple {
          animation: none !important;
        }
      }

      @media (max-width: 768px) {
        .message {
          top: auto;
          bottom: 20px;
          right: 20px;
          left: 20px;
          max-width: none;
        }

        .about-hero h1 {
          font-size: 2.5rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

})();
