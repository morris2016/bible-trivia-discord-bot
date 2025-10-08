// Faith Defenders Articles Page JavaScript
// Handles search and filtering without interfering with styling

document.addEventListener('DOMContentLoaded', function() {
  console.log('Articles page loaded - initializing search functionality...');

  // Initialize articles search
  initializeArticlesSearch();

  // Initialize filter functionality
  initializeArticleFilters();

  // Initialize mobile functionality
  initializeMobileFeatures();
});

function initializeArticlesSearch() {
  const searchInput = document.getElementById('articles-search');
  const clearSearchBtn = document.getElementById('clear-search');

  if (!searchInput) {
    console.log('Articles search input not found - skipping search initialization');
    return;
  }

  console.log('Initializing articles search...');

  // Search input handler with debounce
  let searchTimeout;
  searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      handleArticlesSearch();
    }, 300);
  });

  // Clear search button
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', function() {
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      handleArticlesSearch();
    });
  }

  // Show/hide clear button based on input
  searchInput.addEventListener('input', function() {
    if (clearSearchBtn) {
      clearSearchBtn.style.display = this.value ? 'flex' : 'none';
    }
  });
}

function handleArticlesSearch() {
  const searchInput = document.getElementById('articles-search');
  const categoryFilter = document.getElementById('category-filter');
  const sortFilter = document.getElementById('sort-filter');

  if (!searchInput) return;

  const query = searchInput.value.toLowerCase().trim();
  const category = categoryFilter ? categoryFilter.value : '';
  const sort = sortFilter ? sortFilter.value : 'newest';

  console.log(`Searching articles: query="${query}", category="${category}", sort="${sort}"`);

  // Get all article cards
  const articleCards = document.querySelectorAll('.article-card');
  let visibleCount = 0;

  articleCards.forEach(card => {
    const titleElement = card.querySelector('.article-title a');
    const excerptElement = card.querySelector('.article-excerpt');
    const authorElement = card.querySelector('.article-author');

    if (!titleElement) return;

    const title = titleElement.textContent.toLowerCase();
    const excerpt = excerptElement ? excerptElement.textContent.toLowerCase() : '';
    const author = authorElement ? authorElement.textContent.toLowerCase() : '';
    const cardCategory = card.getAttribute('data-category') || '';

    // Check if article matches search criteria
    const matchesSearch = !query ||
      title.includes(query) ||
      excerpt.includes(query) ||
      author.includes(query);

    const matchesCategory = !category || cardCategory === category;

    const shouldShow = matchesSearch && matchesCategory;

    if (shouldShow) {
      card.style.display = 'block';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });

  // Update search results info
  updateArticlesSearchResults(visibleCount, query || category);

  console.log(`Articles search complete: ${visibleCount} articles visible`);
}

function updateArticlesSearchResults(count, hasFilters) {
  const resultsInfo = document.getElementById('search-results-info');
  const resultsCount = document.getElementById('results-count');
  const clearAllBtn = document.getElementById('clear-all-filters');

  if (!resultsInfo || !resultsCount) return;

  if (hasFilters) {
    resultsInfo.style.display = 'flex';
    resultsCount.textContent = `${count} ${count === 1 ? 'result' : 'results'} found`;

    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', function() {
        // Clear all filters
        const searchInput = document.getElementById('articles-search');
        const categoryFilter = document.getElementById('category-filter');
        const sortFilter = document.getElementById('sort-filter');

        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = '';
        if (sortFilter) sortFilter.value = 'newest';

        const clearSearchBtn = document.getElementById('clear-search');
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';

        handleArticlesSearch();
      });
    }
  } else {
    resultsInfo.style.display = 'none';
  }
}

function initializeArticleFilters() {
  const categoryFilter = document.getElementById('category-filter');
  const sortFilter = document.getElementById('sort-filter');
  const toggleFiltersBtn = document.getElementById('toggle-filters');

  // Category filter change handler
  if (categoryFilter) {
    categoryFilter.addEventListener('change', handleArticlesSearch);
  }

  // Sort filter change handler
  if (sortFilter) {
    sortFilter.addEventListener('change', function() {
      // For now, just re-run search (sorting would need backend implementation)
      handleArticlesSearch();
    });
  }

  // Toggle filters button (for mobile)
  if (toggleFiltersBtn) {
    toggleFiltersBtn.addEventListener('click', function() {
      const filterControls = document.querySelector('.filter-controls');
      if (filterControls) {
        filterControls.classList.toggle('show-mobile');
      }
    });
  }

  // Load categories for filter dropdown
  loadCategoriesForArticles();
}

async function loadCategoriesForArticles() {
  try {
    const response = await fetch('/api/categories');
    const data = await response.json();

    if (data.success && data.categories) {
      const categoryFilter = document.getElementById('category-filter');
      if (categoryFilter) {
        // Clear existing options except "All Categories"
        const allOption = categoryFilter.querySelector('option[value=""]');
        categoryFilter.innerHTML = '';
        if (allOption) categoryFilter.appendChild(allOption);

        // Add category options
        data.categories.forEach(category => {
          const option = document.createElement('option');
          option.value = category.name;
          option.textContent = category.name;
          categoryFilter.appendChild(option);
        });

        console.log(`Loaded ${data.categories.length} categories for articles filter`);
      }
    }
  } catch (error) {
    console.error('Error loading categories for articles:', error);
  }
}

function initializeMobileFeatures() {
  // Add mobile-specific functionality
  if (window.innerWidth <= 768) {
    console.log('Mobile device detected - initializing mobile features');

    // Add mobile search enhancements
    enhanceMobileSearch();

    // Add mobile filter enhancements
    enhanceMobileFilters();
  }
}

function enhanceMobileSearch() {
  const searchInput = document.getElementById('articles-search');
  if (!searchInput) return;

  // Add mobile keyboard handling
  searchInput.addEventListener('focus', function() {
    document.body.classList.add('mobile-keyboard-active');
  });

  searchInput.addEventListener('blur', function() {
    setTimeout(() => {
      document.body.classList.remove('mobile-keyboard-active');
    }, 100);
  });
}

function enhanceMobileFilters() {
  const filterControls = document.querySelector('.filter-controls');
  if (!filterControls) return;

  // Add mobile-friendly filter styling
  filterControls.classList.add('mobile-enhanced');
}

// Handle window resize
window.addEventListener('resize', function() {
  const searchInput = document.getElementById('articles-search');
  if (searchInput && window.innerWidth <= 768) {
    enhanceMobileSearch();
  }
});

console.log('Articles page JavaScript loaded successfully');