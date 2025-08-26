// Faith Defenders Search and Filter System

// Global search state
let searchState = {
  articles: {
    originalData: [],
    filteredData: [],
    currentQuery: '',
    currentCategory: '',
    currentSort: 'newest'
  },
  resources: {
    originalData: [],
    filteredData: [],
    currentQuery: '',
    currentCategory: '',
    currentType: '',
    currentSort: 'newest'
  }
};

// Initialize Articles Search
window.initializeArticlesSearch = function() {
  console.log('Initializing articles search...');
  
  // Get elements
  const searchInput = document.getElementById('articles-search');
  const categoryFilter = document.getElementById('category-filter');
  const sortFilter = document.getElementById('sort-filter');
  const clearSearchBtn = document.getElementById('clear-search');
  const clearAllBtn = document.getElementById('clear-all-filters');
  const toggleFiltersBtn = document.getElementById('toggle-filters');
  const resultsInfo = document.getElementById('search-results-info');
  
  if (!searchInput) {
    console.error('Articles search elements not found');
    return;
  }
  
  // Load categories for filter
  loadCategoriesForFilter('category-filter');
  
  // Store original articles data
  storeOriginalArticlesData();
  
  // Search input handlers
  searchInput.addEventListener('input', debounce(handleArticlesSearch, 300));
  searchInput.addEventListener('focus', () => searchInput.parentElement.classList.add('focused'));
  searchInput.addEventListener('blur', () => searchInput.parentElement.classList.remove('focused'));
  
  // Filter handlers
  if (categoryFilter) {
    categoryFilter.addEventListener('change', handleArticlesSearch);
  }
  if (sortFilter) {
    sortFilter.addEventListener('change', handleArticlesSearch);
  }
  
  // Clear buttons
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', clearArticlesSearch);
  }
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAllArticlesFilters);
  }
  
  // Toggle filters (mobile friendly)
  if (toggleFiltersBtn) {
    toggleFiltersBtn.addEventListener('click', toggleFilters);
  }
};

// Initialize Resources Search
window.initializeResourcesSearch = function() {
  console.log('Initializing resources search...');
  
  // Get elements
  const searchInput = document.getElementById('resources-search');
  const categoryFilter = document.getElementById('resource-category-filter');
  const typeFilter = document.getElementById('resource-type-filter');
  const sortFilter = document.getElementById('resource-sort-filter');
  const clearSearchBtn = document.getElementById('clear-search-resources');
  const clearAllBtn = document.getElementById('clear-all-resource-filters');
  const toggleFiltersBtn = document.getElementById('toggle-resource-filters');
  
  if (!searchInput) {
    console.error('Resources search elements not found');
    return;
  }
  
  // Load categories for filter
  loadCategoriesForFilter('resource-category-filter');
  
  // Store original resources data
  storeOriginalResourcesData();
  
  // Search input handlers
  searchInput.addEventListener('input', debounce(handleResourcesSearch, 300));
  searchInput.addEventListener('focus', () => searchInput.parentElement.classList.add('focused'));
  searchInput.addEventListener('blur', () => searchInput.parentElement.classList.remove('focused'));
  
  // Filter handlers
  if (categoryFilter) {
    categoryFilter.addEventListener('change', handleResourcesSearch);
  }
  if (typeFilter) {
    typeFilter.addEventListener('change', handleResourcesSearch);
  }
  if (sortFilter) {
    sortFilter.addEventListener('change', handleResourcesSearch);
  }
  
  // Clear buttons
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', clearResourcesSearch);
  }
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAllResourcesFilters);
  }
  
  // Toggle filters
  if (toggleFiltersBtn) {
    toggleFiltersBtn.addEventListener('click', toggleResourceFilters);
  }
};

// Store original articles data from DOM
function storeOriginalArticlesData() {
  const container = document.getElementById('articles-container');
  if (!container) return;
  
  const articles = [];
  const articleElements = container.querySelectorAll('.article-item');
  
  articleElements.forEach(element => {
    const titleElement = element.querySelector('.article-title a');
    const excerptElement = element.querySelector('.article-excerpt');
    const metaElement = element.querySelector('.article-meta');
    const categoryElement = element.querySelector('.category-badge');
    
    if (titleElement) {
      const article = {
        element: element,
        title: titleElement.textContent.trim(),
        excerpt: excerptElement ? excerptElement.textContent.trim() : '',
        meta: metaElement ? metaElement.textContent.trim() : '',
        category: categoryElement ? categoryElement.textContent.trim() : '',
        categoryData: element.getAttribute('data-category') || '',
        url: titleElement.href
      };
      articles.push(article);
    }
  });
  
  searchState.articles.originalData = articles;
  searchState.articles.filteredData = [...articles];
  
  console.log(`Stored ${articles.length} articles for search`);
}

// Store original resources data from DOM
function storeOriginalResourcesData() {
  const container = document.getElementById('resources-container');
  if (!container) return;
  
  const resources = [];
  const resourceElements = container.querySelectorAll('.resource-card');
  
  resourceElements.forEach(element => {
    const titleElement = element.querySelector('.resource-title a');
    const descriptionElement = element.querySelector('.resource-description');
    const metaElement = element.querySelector('.resource-meta');
    const typeElement = element.querySelector('.resource-type');
    const categoryElement = element.querySelector('.category-badge');
    
    if (titleElement) {
      const resource = {
        element: element,
        title: titleElement.textContent.trim(),
        description: descriptionElement ? descriptionElement.textContent.trim() : '',
        meta: metaElement ? metaElement.textContent.trim() : '',
        type: typeElement ? typeElement.textContent.trim() : '',
        category: categoryElement ? categoryElement.textContent.trim() : '',
        categoryData: element.getAttribute('data-category') || '',
        typeData: element.getAttribute('data-type') || '',
        url: titleElement.href
      };
      resources.push(resource);
    }
  });
  
  searchState.resources.originalData = resources;
  searchState.resources.filteredData = [...resources];
  
  console.log(`Stored ${resources.length} resources for search`);
}

// Handle articles search and filtering
function handleArticlesSearch() {
  const searchInput = document.getElementById('articles-search');
  const categoryFilter = document.getElementById('category-filter');
  const sortFilter = document.getElementById('sort-filter');
  const clearSearchBtn = document.getElementById('clear-search');
  
  if (!searchInput) return;
  
  const query = searchInput.value.toLowerCase().trim();
  const category = categoryFilter ? categoryFilter.value : '';
  const sort = sortFilter ? sortFilter.value : 'newest';
  
  // Update state
  searchState.articles.currentQuery = query;
  searchState.articles.currentCategory = category;
  searchState.articles.currentSort = sort;
  
  // Show/hide clear search button
  if (clearSearchBtn) {
    clearSearchBtn.style.display = query ? 'flex' : 'none';
  }
  
  // Filter articles
  let filtered = [...searchState.articles.originalData];
  
  // Text search
  if (query) {
    filtered = filtered.filter(article => {
      return article.title.toLowerCase().includes(query) ||
             article.excerpt.toLowerCase().includes(query) ||
             article.meta.toLowerCase().includes(query) ||
             article.category.toLowerCase().includes(query);
    });
  }
  
  // Category filter
  if (category) {
    filtered = filtered.filter(article => article.categoryData === category);
  }
  
  // Sort
  filtered = sortArticles(filtered, sort);
  
  // Update filtered data
  searchState.articles.filteredData = filtered;
  
  // Update UI
  updateArticlesDisplay(filtered);
  updateSearchResultsInfo('search-results-info', 'results-count', filtered.length, query || category);
}

// Handle resources search and filtering
function handleResourcesSearch() {
  const searchInput = document.getElementById('resources-search');
  const categoryFilter = document.getElementById('resource-category-filter');
  const typeFilter = document.getElementById('resource-type-filter');
  const sortFilter = document.getElementById('resource-sort-filter');
  const clearSearchBtn = document.getElementById('clear-search-resources');
  
  if (!searchInput) return;
  
  const query = searchInput.value.toLowerCase().trim();
  const category = categoryFilter ? categoryFilter.value : '';
  const type = typeFilter ? typeFilter.value : '';
  const sort = sortFilter ? sortFilter.value : 'newest';
  
  // Update state
  searchState.resources.currentQuery = query;
  searchState.resources.currentCategory = category;
  searchState.resources.currentType = type;
  searchState.resources.currentSort = sort;
  
  // Show/hide clear search button
  if (clearSearchBtn) {
    clearSearchBtn.style.display = query ? 'flex' : 'none';
  }
  
  // Filter resources
  let filtered = [...searchState.resources.originalData];
  
  // Text search
  if (query) {
    filtered = filtered.filter(resource => {
      return resource.title.toLowerCase().includes(query) ||
             resource.description.toLowerCase().includes(query) ||
             resource.meta.toLowerCase().includes(query) ||
             resource.category.toLowerCase().includes(query) ||
             resource.type.toLowerCase().includes(query);
    });
  }
  
  // Category filter
  if (category) {
    filtered = filtered.filter(resource => resource.categoryData === category);
  }
  
  // Type filter
  if (type) {
    filtered = filtered.filter(resource => resource.typeData === type);
  }
  
  // Sort
  filtered = sortResources(filtered, sort);
  
  // Update filtered data
  searchState.resources.filteredData = filtered;
  
  // Update UI
  updateResourcesDisplay(filtered);
  updateSearchResultsInfo('resource-search-results-info', 'resource-results-count', filtered.length, query || category || type);
}

// Sort articles
function sortArticles(articles, sortBy) {
  return articles.sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return a.meta.localeCompare(b.meta);
      case 'title':
        return a.title.localeCompare(b.title);
      case 'newest':
      default:
        return b.meta.localeCompare(a.meta);
    }
  });
}

// Sort resources
function sortResources(resources, sortBy) {
  return resources.sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return a.meta.localeCompare(b.meta);
      case 'title':
        return a.title.localeCompare(b.title);
      case 'newest':
      default:
        return b.meta.localeCompare(a.meta);
    }
  });
}

// Update articles display
function updateArticlesDisplay(filtered) {
  const container = document.getElementById('articles-container');
  if (!container) return;
  
  // Hide all articles first
  searchState.articles.originalData.forEach(article => {
    article.element.style.display = 'none';
  });
  
  if (filtered.length === 0) {
    // Show no results message
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <i class="fas fa-search" style="font-size: 3rem; opacity: 0.5; color: #9ca3af;"></i>
        </div>
        <h3 class="empty-state-title">No articles found</h3>
        <p class="empty-state-description">
          Try adjusting your search terms or filters to find what you're looking for.
        </p>
      </div>
    `;
  } else {
    // Restore container to articles list
    if (container.classList.contains('empty-state')) {
      container.className = 'articles-list';
      container.innerHTML = '';
      
      // Re-append all original elements
      searchState.articles.originalData.forEach(article => {
        container.appendChild(article.element);
      });
    }
    
    // Show matching articles
    filtered.forEach(article => {
      article.element.style.display = 'block';
    });
  }
}

// Update resources display
function updateResourcesDisplay(filtered) {
  const container = document.getElementById('resources-container');
  if (!container) return;
  
  // Hide all resources first
  searchState.resources.originalData.forEach(resource => {
    resource.element.style.display = 'none';
  });
  
  if (filtered.length === 0) {
    // Show no results message
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <i class="fas fa-search" style="font-size: 3rem; opacity: 0.5; color: #9ca3af;"></i>
        </div>
        <h3 class="empty-state-title">No resources found</h3>
        <p class="empty-state-description">
          Try adjusting your search terms or filters to find what you're looking for.
        </p>
      </div>
    `;
  } else {
    // Restore container to resources grid
    if (container.classList.contains('empty-state')) {
      container.className = 'resources-grid';
      container.innerHTML = '';
      
      // Re-append all original elements
      searchState.resources.originalData.forEach(resource => {
        container.appendChild(resource.element);
      });
    }
    
    // Show matching resources
    filtered.forEach(resource => {
      resource.element.style.display = 'block';
    });
  }
}

// Update search results info
function updateSearchResultsInfo(infoId, countId, count, hasFilters) {
  const infoElement = document.getElementById(infoId);
  const countElement = document.getElementById(countId);
  
  if (!infoElement || !countElement) return;
  
  if (hasFilters) {
    infoElement.style.display = 'flex';
    countElement.textContent = `${count} ${count === 1 ? 'result' : 'results'} found`;
  } else {
    infoElement.style.display = 'none';
  }
}

// Load categories for filter dropdowns
async function loadCategoriesForFilter(selectId) {
  try {
    const response = await fetch('/api/categories');
    const data = await response.json();
    const selectElement = document.getElementById(selectId);
    
    if (data.success && data.categories && selectElement) {
      // Clear existing options except first
      const firstOption = selectElement.firstElementChild;
      selectElement.innerHTML = '';
      selectElement.appendChild(firstOption);
      
      // Add category options
      data.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        selectElement.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading categories for filter:', error);
  }
}

// Clear search functions
function clearArticlesSearch() {
  const searchInput = document.getElementById('articles-search');
  const clearBtn = document.getElementById('clear-search');
  
  if (searchInput) {
    searchInput.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    handleArticlesSearch();
  }
}

function clearResourcesSearch() {
  const searchInput = document.getElementById('resources-search');
  const clearBtn = document.getElementById('clear-search-resources');
  
  if (searchInput) {
    searchInput.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    handleResourcesSearch();
  }
}

// Clear all filters
function clearAllArticlesFilters() {
  const searchInput = document.getElementById('articles-search');
  const categoryFilter = document.getElementById('category-filter');
  const sortFilter = document.getElementById('sort-filter');
  
  if (searchInput) searchInput.value = '';
  if (categoryFilter) categoryFilter.value = '';
  if (sortFilter) sortFilter.value = 'newest';
  
  handleArticlesSearch();
}

function clearAllResourcesFilters() {
  const searchInput = document.getElementById('resources-search');
  const categoryFilter = document.getElementById('resource-category-filter');
  const typeFilter = document.getElementById('resource-type-filter');
  const sortFilter = document.getElementById('resource-sort-filter');
  
  if (searchInput) searchInput.value = '';
  if (categoryFilter) categoryFilter.value = '';
  if (typeFilter) typeFilter.value = '';
  if (sortFilter) sortFilter.value = 'newest';
  
  handleResourcesSearch();
}

// Toggle filters visibility (for mobile)
function toggleFilters() {
  const filterControls = document.querySelector('.filter-controls');
  if (filterControls) {
    filterControls.classList.toggle('show-mobile');
  }
}

function toggleResourceFilters() {
  const filterControls = document.querySelector('.filter-controls');
  if (filterControls) {
    filterControls.classList.toggle('show-mobile');
  }
}

// Debounce function for search input
function debounce(func, wait) {
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