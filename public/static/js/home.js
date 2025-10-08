/**
 * Home Page JavaScript
 * Handles homepage-specific functionality for Faith Defenders
 */

(function() {
  'use strict';

  // Initialize homepage functionality when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    initializeHomepage();
    initializeAnimations();
    setupPodcastPlayers();
  });

  /**
   * Initialize homepage-specific features
   */
  function initializeHomepage() {
    console.log('Initializing homepage functionality...');

    // Carousel for latest articles (if implemented)
    initializeArticleCarousel();

    // Dynamic content loading for categories
    setupCategoryFilters();

    // Hero section animations
    initializeHeroEffects();

    // Resource cards hover effects
    setupResourceCardEffects();

    // Statistics counter animation
    initializeStatCounters();

    console.log('Homepage functionality initialized');
  }

  /**
   * Initialize article carousel if present
   */
  function initializeArticleCarousel() {
    const carousels = document.querySelectorAll('.article-carousel');
    carousels.forEach(carousel => {
      const items = carousel.querySelectorAll('.carousel-item');
      if (items.length > 3) {
        carousel.classList.add('has-multiple-items');
      }

      // Add touch/swipe functionality for mobile
      setupTouchInteractions(carousel);
    });
  }

  /**
   * Setup category filtering functionality
   */
  function setupCategoryFilters() {
    const categoryButtons = document.querySelectorAll('.category-filter-btn');
    categoryButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        const category = this.dataset.category;

        // Remove active class from all buttons
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');

        // Filter content
        filterContentByCategory(category);
      });
    });
  }

  /**
   * Filter content by selected category
   */
  function filterContentByCategory(category) {
    const contentItems = document.querySelectorAll('.content-item[data-category]');
    contentItems.forEach(item => {
      if (category === 'all' || item.dataset.category === category) {
        item.style.display = '';
        item.classList.add('fade-in');
      } else {
        item.style.display = 'none';
        item.classList.remove('fade-in');
      }
    });
  }

  /**
   * Initialize hero section effects
   */
  function initializeHeroEffects() {
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');

    if (heroTitle) {
      // Add typing effect simulation
      heroTitle.style.opacity = '0';
      setTimeout(() => {
        heroTitle.style.transition = 'opacity 1s ease-in';
        heroTitle.style.opacity = '1';
      }, 200);

      if (heroSubtitle) {
        setTimeout(() => {
          heroSubtitle.style.transition = 'opacity 1s ease-in';
          heroSubtitle.style.opacity = '1';
        }, 800);
      }
    }

    // Parallax effect for hero background elements
    window.addEventListener('scroll', function() {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.5;

      const heroBg = document.querySelector('.hero-background');
      if (heroBg) {
        heroBg.style.transform = `translate3d(0, ${rate}px, 0)`;
      }
    });
  }

  /**
   * Setup resource card hover effects
   */
  function setupResourceCardEffects() {
    const resourceCards = document.querySelectorAll('.resource-card, .important-content-card');

    resourceCards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        // Add ripple effect
        createRippleEffect(this);
      });

      card.addEventListener('click', function(e) {
        // Add click animation for better UX
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
          this.style.transform = '';
        }, 100);
      });
    });
  }

  /**
   * Create ripple effect on click
   */
  function createRippleEffect(element) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple-effect';

    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = rect.width / 2;
    const y = rect.height / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x - size / 2}px`;
    ripple.style.top = `${y - size / 2}px`;

    element.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  /**
   * Initialize statistics counter animations
   */
  function initializeStatCounters() {
    const statNumbers = document.querySelectorAll('.stat-number, .counter');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statNumbers.forEach(stat => observer.observe(stat));
  }

  /**
   * Animate counter from 0 to target value
   */
  function animateCounter(element) {
    const target = parseInt(element.dataset.target) || parseInt(element.textContent) || 0;
    const duration = 2000; // 2 seconds
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
   * Setup podcast player functionality
   */
  function setupPodcastPlayers() {
    // Initialize YouTube players for video podcasts
    initializeYouTubePlayers();

    // Setup audio player controls
    initializeAudioPlayers();
  }

  /**
   * Initialize YouTube players if present
   */
  function initializeYouTubePlayers() {
    const ytPlayers = document.querySelectorAll('.youtube-player');
    ytPlayers.forEach(player => {
      const videoId = player.dataset.videoId;
      if (videoId && typeof YT !== 'undefined') {
        new YT.Player(player.id, {
          height: '360',
          width: '640',
          videoId: videoId,
          playerVars: {
            rel: 0,
            modestbranding: 1,
            showinfo: 0,
            controls: 1
          }
        });
      }
    });
  }

  /**
   * Initialize audio player controls
   */
  function initializeAudioPlayers() {
    const audioPlayers = document.querySelectorAll('.audio-player audio');

    audioPlayers.forEach(audio => {
      // Add loading states
      audio.addEventListener('loadstart', function() {
        this.parentElement?.classList.add('loading');
      });

      audio.addEventListener('canplay', function() {
        this.parentElement?.classList.remove('loading');
        this.parentElement?.classList.add('loaded');
      });

      // Visualizer functionality
      audio.addEventListener('play', function() {
        this.parentElement?.querySelector('.audio-visualizer')?.classList.add('active');
      });

      audio.addEventListener('pause', function() {
        this.parentElement?.querySelector('.audio-visualizer')?.classList.remove('active');
      });

      audio.addEventListener('ended', function() {
        this.parentElement?.querySelector('.audio-visualizer')?.classList.remove('active');
        // Reset to beginning
        this.currentTime = 0;
      });
    });
  }


  /**
   * Initialize entrance animations
   */
  function initializeAnimations() {
    // Use Intersection Observer for scroll-triggered animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, { threshold: 0.1 });

    // Observe elements that should animate in
    const animatedElements = document.querySelectorAll('.animate-on-scroll, .section-card, .feature-card, .resource-card');
    animatedElements.forEach(el => observer.observe(el));

    // Add staggered animation delays
    document.querySelectorAll('.animate-stagger').forEach((el, index) => {
      el.style.animationDelay = `${index * 0.1}s`;
    });
  }

  /**
   * Setup touch interactions for mobile devices
   */
  function setupTouchInteractions(element) {
    let startX, startY, endX, endY;

    element.addEventListener('touchstart', (e) => {
      startX = e.changedTouches[0].screenX;
      startY = e.changedTouches[0].screenY;
    });

    element.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].screenX;
      endY = e.changedTouches[0].screenY;

      const diffX = startX - endX;
      const diffY = startY - endY;

      // Detect horizontal swipe
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) {
          slideCarousel(element, 'next');
        } else {
          slideCarousel(element, 'prev');
        }
      }
    });
  }

  /**
   * Slide carousel in specified direction
   */
  function slideCarousel(carousel, direction) {
    const track = carousel.querySelector('.carousel-track');
    if (!track) return;

    const slideWidth = carousel.offsetWidth;
    const currentTransform = track.style.transform || 'translateX(0px)';
    const currentX = parseInt(currentTransform.replace('translateX(', '').replace('px)', '')) || 0;

    let newX;
    if (direction === 'next') {
      newX = Math.max(currentX - slideWidth, -track.offsetWidth + slideWidth);
    } else {
      newX = Math.min(currentX + slideWidth, 0);
    }

    track.style.transform = `translateX(${newX}px)`;

    // Update active indicators
    updateCarouselIndicators(carousel, Math.abs(newX / slideWidth));
  }

  /**
   * Update carousel indicators
   */
  function updateCarouselIndicators(carousel, activeIndex) {
    const indicators = carousel.querySelectorAll('.carousel-indicator');
    indicators.forEach((indicator, index) => {
      indicator.classList.toggle('active', index === activeIndex);
    });
  }

  /**
   * Add CSS for homepage effects
   */
  if (typeof document !== 'undefined' && document.head) {
    const style = document.createElement('style');
    style.textContent = `
      .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
      }

      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }

      .audio-visualizer.active span {
        animation: visualizer 1.5s ease-in-out infinite both;
      }

      .audio-visualizer.active span:nth-child(1) { animation-delay: -0.3s; }
      .audio-visualizer.active span:nth-child(2) { animation-delay: -0.15s; }
      .audio-visualizer.active span:nth-child(3) { animation-delay: 0s; }
      .audio-visualizer.active span:nth-child(4) { animation-delay: 0.15s; }
      .audio-visualizer.active span:nth-child(5) { animation-delay: 0.3s; }

      @keyframes visualizer {
        0%, 100% { opacity: 0.5; transform: scaleY(1); }
        50% { opacity: 1; transform: scaleY(1.5); }
      }

      .animate-in {
        animation: fadeInUp 0.8s ease-out forwards;
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .animate-in {
          animation: none !important;
        }
        .ripple-effect {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

})();
