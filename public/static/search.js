// Faith Defenders Search and Filter System

// Global search state
let searchState = {
  resources: {
    originalData: [],
    filteredData: [],
    currentQuery: '',
    currentCategory: '',
    currentType: '',
    currentSort: 'newest'
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


// Store original resources data from DOM
function storeOriginalResourcesData() {
  const container = document.getElementById('resources-container');
  if (!container) return;

  const resources = [];
  const resourceElements = container.querySelectorAll('.resource-card');

  resourceElements.forEach((element, index) => {
    const titleElement = element.querySelector('.resource-title-compact a');
    const descriptionElement = element.querySelector('.resource-description-compact');
    const metaElement = element.querySelector('.resource-meta-compact');
    const typeElement = element.querySelector('.resource-type-compact');
    const categoryElement = element.querySelector('.category-badge');

    if (titleElement) {
      const categoryData = element.getAttribute('data-category') || '';
      const typeData = element.getAttribute('data-type') || '';
      const resource = {
        element: element,
        title: titleElement.textContent.trim(),
        description: descriptionElement ? descriptionElement.textContent.trim() : '',
        meta: metaElement ? metaElement.textContent.trim() : '',
        type: typeElement ? typeElement.textContent.trim() : '',
        category: categoryElement ? categoryElement.textContent.trim() : '',
        categoryData: categoryData,
        typeData: typeData,
        url: titleElement.href
      };
      resources.push(resource);

      // Debug category and type data
      console.log(`Resource ${index + 1}: "${resource.title}" - data-category: "${categoryData}", data-type: "${typeData}"`);
    }
  });

  searchState.resources.originalData = resources;
  searchState.resources.filteredData = [...resources];

  console.log(`Stored ${resources.length} resources for search`);
  console.log('Sample resource categories:', resources.slice(0, 3).map(r => ({ title: r.title, category: r.categoryData, type: r.typeData })));
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

  // Category filter - improved matching
  if (category) {
    console.log(`Filtering resources by category: "${category}"`);
    const beforeCount = filtered.length;
    filtered = filtered.filter(resource => {
      const matches = resource.categoryData === category;
      if (!matches) {
        console.log(`Resource "${resource.title}" category "${resource.categoryData}" does not match filter "${category}"`);
      }
      return matches;
    });
    console.log(`Category filter: ${beforeCount} -> ${filtered.length} resources`);
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


// Update resources display
function updateResourcesDisplay(filtered) {
  const container = document.getElementById('resources-container');
  if (!container) return;

  console.log(`Updating resources display: ${filtered.length} filtered results`);

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
    container.className = 'empty-state';
  } else {
    // Check if we need to restore from empty state
    const isEmptyState = container.classList.contains('empty-state') ||
                        container.querySelector('.empty-state') !== null;

    if (isEmptyState) {
      console.log('Restoring resources from empty state');
      // Clear the empty state content
      container.innerHTML = '';
      container.className = 'resources-grid';

      // Re-append all original elements
      searchState.resources.originalData.forEach(resource => {
        if (resource.element && resource.element.parentNode !== container) {
          container.appendChild(resource.element);
        }
      });
    }

    // Hide all resources first
    searchState.resources.originalData.forEach(resource => {
      if (resource.element) {
        resource.element.style.display = 'none';
      }
    });

    // Show only matching resources
    let shownCount = 0;
    filtered.forEach(resource => {
      if (resource.element) {
        resource.element.style.display = 'block';
        shownCount++;
      }
    });

    console.log(`Displayed ${shownCount} resources out of ${filtered.length} filtered results`);
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

      // Add category options - ensure consistent naming
      data.categories.forEach(category => {
        const option = document.createElement('option');
        // Use the same field that's used in data-category attributes
        option.value = category.name;
        option.textContent = category.name;
        selectElement.appendChild(option);
      });

      console.log(`Loaded ${data.categories.length} categories for filter:`, data.categories.map(c => c.name));
    }
  } catch (error) {
    console.error('Error loading categories for filter:', error);
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

// ===== MOBILE SEARCH ENHANCEMENTS =====

// Mobile Search Manager Class
class MobileSearchManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupMobileSearchUI();
    this.setupMobileFilters();
    this.setupMobileKeyboard();
    this.setupMobileVoiceSearch();
  }

  // Enhanced mobile search UI
  setupMobileSearchUI() {
    if (window.innerWidth > 768) return;

    // Create mobile search overlay
    this.createMobileSearchOverlay();

    // Add mobile search toggle buttons
    this.addMobileSearchToggles();

    // Setup mobile search suggestions
    this.setupMobileSuggestions();
  }

  createMobileSearchOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'mobile-search-overlay';
    overlay.innerHTML = `
      <div class="mobile-search-container">
        <div class="mobile-search-header">
          <button class="mobile-search-close" aria-label="Close search">
            <i class="fas fa-times"></i>
          </button>
          <div class="mobile-search-input-wrapper">
            <i class="fas fa-search mobile-search-icon"></i>
            <input type="text" class="mobile-search-input" placeholder="Search resources..." autocomplete="off">
            <button class="mobile-voice-search" aria-label="Voice search">
              <i class="fas fa-microphone"></i>
            </button>
          </div>
        </div>
        <div class="mobile-search-content">
          <div class="mobile-search-filters">
            <div class="mobile-filter-tabs">
              <button class="mobile-filter-tab active" data-filter="all">All</button>
              <button class="mobile-filter-tab" data-filter="resources">Resources</button>
            </div>
            <div class="mobile-quick-filters">
              <button class="mobile-quick-filter" data-category="apologetics">Apologetics</button>
              <button class="mobile-quick-filter" data-category="theology">Theology</button>
              <button class="mobile-quick-filter" data-category="bible-study">Bible Study</button>
              <button class="mobile-quick-filter" data-category="evangelism">Evangelism</button>
            </div>
          </div>
          <div class="mobile-search-results">
            <div class="mobile-search-suggestions">
              <div class="suggestion-header">Recent Searches</div>
              <div class="suggestion-list"></div>
            </div>
            <div class="mobile-search-results-list"></div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlay = overlay;
    this.setupOverlayEvents();
  }

  setupOverlayEvents() {
    const closeBtn = this.overlay.querySelector('.mobile-search-close');
    const searchInput = this.overlay.querySelector('.mobile-search-input');
    const voiceBtn = this.overlay.querySelector('.mobile-voice-search');

    // Close overlay
    closeBtn.addEventListener('click', () => this.hideMobileSearch());

    // Search input
    searchInput.addEventListener('input', debounce((e) => {
      this.handleMobileSearch(e.target.value);
    }, 300));

    searchInput.addEventListener('focus', () => {
      this.showSuggestions();
    });

    // Voice search
    voiceBtn.addEventListener('click', () => this.startVoiceSearch());

    // Overlay click to close
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.hideMobileSearch();
    });

    // Filter tabs
    const filterTabs = this.overlay.querySelectorAll('.mobile-filter-tab');
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.handleMobileFilter(tab.dataset.filter);
      });
    });

    // Quick filters
    const quickFilters = this.overlay.querySelectorAll('.mobile-quick-filter');
    quickFilters.forEach(filter => {
      filter.addEventListener('click', () => {
        this.handleMobileQuickFilter(filter.dataset.category);
      });
    });
  }

  addMobileSearchToggles() {
    // Add mobile search buttons to existing search inputs
    const searchInputs = document.querySelectorAll('.search-input-wrapper');
    searchInputs.forEach(wrapper => {
      if (!wrapper.querySelector('.mobile-search-toggle')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'mobile-search-toggle';
        toggleBtn.innerHTML = '<i class="fas fa-search"></i>';
        toggleBtn.setAttribute('aria-label', 'Open mobile search');
        toggleBtn.addEventListener('click', () => this.showMobileSearch());
        wrapper.appendChild(toggleBtn);
      }
    });
  }

  showMobileSearch() {
    if (this.overlay) {
      this.overlay.classList.add('active');
      document.body.style.overflow = 'hidden';

      // Focus search input after animation
      setTimeout(() => {
        const searchInput = this.overlay.querySelector('.mobile-search-input');
        if (searchInput) searchInput.focus();
      }, 300);
    }
  }

  hideMobileSearch() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
      document.body.style.overflow = '';

      // Clear search
      const searchInput = this.overlay.querySelector('.mobile-search-input');
      if (searchInput) searchInput.value = '';
    }
  }

  handleMobileSearch(query) {
    if (!query.trim()) {
      this.showSuggestions();
      return;
    }

    // Search resources only
    const allResults = [
      ...this.searchResources(query)
    ];

    this.displayMobileResults(allResults, query);
  }


  searchResources(query) {
    if (!searchState.resources.originalData) return [];

    return searchState.resources.originalData
      .filter(resource =>
        resource.title.toLowerCase().includes(query.toLowerCase()) ||
        resource.description.toLowerCase().includes(query.toLowerCase()) ||
        resource.category.toLowerCase().includes(query.toLowerCase())
      )
      .map(resource => ({
        ...resource,
        type: 'resource',
        url: resource.url
      }));
  }

  displayMobileResults(results, query) {
    const resultsContainer = this.overlay.querySelector('.mobile-search-results-list');
    if (!resultsContainer) return;

    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <div class="mobile-no-results">
          <i class="fas fa-search"></i>
          <p>No results found for "${query}"</p>
          <p>Try different keywords or check spelling</p>
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = results
      .slice(0, 10) // Limit to 10 results for mobile
      .map(result => `
        <a href="${result.url}" class="mobile-search-result-item">
          <div class="mobile-result-icon">
            <i class="fas fa-book"></i>
          </div>
          <div class="mobile-result-content">
            <div class="mobile-result-title">${this.highlightText(result.title, query)}</div>
            <div class="mobile-result-meta">
              resource • ${result.category || 'General'}
            </div>
          </div>
          <div class="mobile-result-arrow">
            <i class="fas fa-chevron-right"></i>
          </div>
        </a>
      `).join('');
  }

  highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  handleMobileFilter(filterType) {
    const searchInput = this.overlay.querySelector('.mobile-search-input');
    const query = searchInput ? searchInput.value : '';

    if (filterType === 'all') {
      this.handleMobileSearch(query);
    } else if (filterType === 'resources') {
      const results = this.searchResources(query);
      this.displayMobileResults(results, query);
    }
  }

  handleMobileQuickFilter(category) {
    const searchInput = this.overlay.querySelector('.mobile-search-input');
    if (searchInput) {
      searchInput.value = category;
      this.handleMobileSearch(category);
    }
  }

  setupMobileSuggestions() {
    this.recentSearches = this.loadRecentSearches();
    this.updateSuggestionsDisplay();
  }

  showSuggestions() {
    const suggestionsContainer = this.overlay.querySelector('.mobile-search-suggestions');
    if (suggestionsContainer) {
      suggestionsContainer.style.display = 'block';
    }
  }

  updateSuggestionsDisplay() {
    const suggestionList = this.overlay.querySelector('.suggestion-list');
    if (!suggestionList) return;

    if (this.recentSearches.length === 0) {
      suggestionList.innerHTML = '<div class="no-suggestions">No recent searches</div>';
      return;
    }

    suggestionList.innerHTML = this.recentSearches
      .slice(0, 5)
      .map(search => `
        <button class="suggestion-item" data-query="${search}">
          <i class="fas fa-history"></i>
          <span>${search}</span>
        </button>
      `).join('');

    // Add click handlers
    const suggestionItems = suggestionList.querySelectorAll('.suggestion-item');
    suggestionItems.forEach(item => {
      item.addEventListener('click', () => {
        const query = item.dataset.query;
        const searchInput = this.overlay.querySelector('.mobile-search-input');
        if (searchInput) {
          searchInput.value = query;
          this.handleMobileSearch(query);
          this.saveRecentSearch(query);
        }
      });
    });
  }

  loadRecentSearches() {
    try {
      return JSON.parse(localStorage.getItem('faithDefendersRecentSearches') || '[]');
    } catch {
      return [];
    }
  }

  saveRecentSearch(query) {
    if (!query.trim()) return;

    this.recentSearches = this.recentSearches.filter(s => s !== query);
    this.recentSearches.unshift(query);
    this.recentSearches = this.recentSearches.slice(0, 10); // Keep only 10 recent searches

    try {
      localStorage.setItem('faithDefendersRecentSearches', JSON.stringify(this.recentSearches));
    } catch (error) {
      console.warn('Could not save recent search:', error);
    }
  }

  setupMobileFilters() {
    if (window.innerWidth > 768) return;

    // Enhanced mobile filter controls
    this.setupMobileFilterDropdowns();
    this.setupMobileFilterChips();
  }

  setupMobileFilterDropdowns() {
    // Convert select dropdowns to mobile-friendly interfaces
    const selectElements = document.querySelectorAll('select[id*="filter"], select[id*="sort"]');
    selectElements.forEach(select => {
      this.convertToMobileDropdown(select);
    });
  }

  convertToMobileDropdown(select) {
    const wrapper = select.parentElement;
    if (!wrapper || wrapper.classList.contains('mobile-dropdown-converted')) return;

    wrapper.classList.add('mobile-dropdown-converted');

    const mobileDropdown = document.createElement('div');
    mobileDropdown.className = 'mobile-dropdown';
    mobileDropdown.innerHTML = `
      <button class="mobile-dropdown-trigger">
        <span class="mobile-dropdown-label">${select.options[select.selectedIndex]?.text || 'Select'}</span>
        <i class="fas fa-chevron-down"></i>
      </button>
      <div class="mobile-dropdown-menu">
        ${Array.from(select.options).map(option => `
          <button class="mobile-dropdown-option" data-value="${option.value}">
            ${option.text}
          </button>
        `).join('')}
      </div>
    `;

    // Replace select with mobile dropdown
    select.style.display = 'none';
    wrapper.appendChild(mobileDropdown);

    // Setup events
    const trigger = mobileDropdown.querySelector('.mobile-dropdown-trigger');
    const menu = mobileDropdown.querySelector('.mobile-dropdown-menu');

    trigger.addEventListener('click', () => {
      menu.classList.toggle('active');
    });

    const options = mobileDropdown.querySelectorAll('.mobile-dropdown-option');
    options.forEach(option => {
      option.addEventListener('click', () => {
        const value = option.dataset.value;
        select.value = value;
        trigger.querySelector('.mobile-dropdown-label').textContent = option.textContent;
        menu.classList.remove('active');

        // Trigger change event
        select.dispatchEvent(new Event('change'));
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!mobileDropdown.contains(e.target)) {
        menu.classList.remove('active');
      }
    });
  }

  setupMobileFilterChips() {
    // Create filter chips for active filters
    const filterContainer = document.createElement('div');
    filterContainer.className = 'mobile-filter-chips';
    filterContainer.style.display = 'none';

    // Insert after search input
    const searchWrapper = document.querySelector('.search-input-wrapper');
    if (searchWrapper) {
      searchWrapper.parentElement.insertBefore(filterContainer, searchWrapper.nextSibling);
    }

    this.filterChipsContainer = filterContainer;
  }

  updateMobileFilterChips() {
    if (!this.filterChipsContainer) return;

    const activeFilters = [];

    // Check resources filters only
    const resourcesSearch = document.getElementById('resources-search');
    const resourceCategoryFilter = document.getElementById('resource-category-filter');
    const resourceTypeFilter = document.getElementById('resource-type-filter');
    const resourceSortFilter = document.getElementById('resource-sort-filter');

    if (resourcesSearch && resourcesSearch.value) {
      activeFilters.push({ type: 'search', value: resourcesSearch.value, label: `Search: ${resourcesSearch.value}` });
    }
    if (resourceCategoryFilter && resourceCategoryFilter.value) {
      activeFilters.push({ type: 'category', value: resourceCategoryFilter.value, label: `Category: ${resourceCategoryFilter.value}` });
    }
    if (resourceTypeFilter && resourceTypeFilter.value) {
      activeFilters.push({ type: 'type', value: resourceTypeFilter.value, label: `Type: ${resourceTypeFilter.value}` });
    }
    if (resourceSortFilter && resourceSortFilter.value !== 'newest') {
      activeFilters.push({ type: 'sort', value: resourceSortFilter.value, label: `Sort: ${resourceSortFilter.value}` });
    }

    if (activeFilters.length > 0) {
      this.filterChipsContainer.innerHTML = activeFilters.map(filter => `
        <span class="mobile-filter-chip">
          ${filter.label}
          <button class="mobile-filter-chip-remove" data-type="${filter.type}" data-value="${filter.value}">
            <i class="fas fa-times"></i>
          </button>
        </span>
      `).join('');
      this.filterChipsContainer.style.display = 'flex';

      // Add remove handlers
      const removeButtons = this.filterChipsContainer.querySelectorAll('.mobile-filter-chip-remove');
      removeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          this.removeMobileFilter(btn.dataset.type, btn.dataset.value);
        });
      });
    } else {
      this.filterChipsContainer.style.display = 'none';
    }
  }

  removeMobileFilter(type, value) {
    if (type === 'search') {
      const searchInput = document.getElementById('resources-search');
      if (searchInput) searchInput.value = '';
    } else if (type === 'category') {
      const categoryFilter = document.getElementById('resource-category-filter');
      if (categoryFilter) categoryFilter.value = '';
    } else if (type === 'type') {
      const typeFilter = document.getElementById('resource-type-filter');
      if (typeFilter) typeFilter.value = '';
    } else if (type === 'sort') {
      const sortFilter = document.getElementById('resource-sort-filter');
      if (sortFilter) sortFilter.value = 'newest';
    }

    // Trigger search update
    handleResourcesSearch();
  }

  setupMobileKeyboard() {
    if (window.innerWidth > 768) return;

    // Handle mobile keyboard show/hide
    const searchInputs = document.querySelectorAll('.search-input, .mobile-search-input');
    searchInputs.forEach(input => {
      input.addEventListener('focus', () => {
        document.body.classList.add('mobile-keyboard-active');
      });

      input.addEventListener('blur', () => {
        // Delay to allow for clicks on suggestions
        setTimeout(() => {
          document.body.classList.remove('mobile-keyboard-active');
        }, 100);
      });
    });
  }

  setupMobileVoiceSearch() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log('Voice search not supported');
      return;
    }

    this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const searchInput = this.overlay.querySelector('.mobile-search-input');
      if (searchInput) {
        searchInput.value = transcript;
        this.handleMobileSearch(transcript);
        this.saveRecentSearch(transcript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Voice search error:', event.error);
    };
  }

  startVoiceSearch() {
    if (!this.recognition) return;

    const voiceBtn = this.overlay.querySelector('.mobile-voice-search');
    if (voiceBtn) {
      voiceBtn.classList.add('listening');
      voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
    }

    this.recognition.start();

    this.recognition.onend = () => {
      if (voiceBtn) {
        voiceBtn.classList.remove('listening');
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      }
    };
  }
}

// Initialize mobile search enhancements
document.addEventListener('DOMContentLoaded', () => {
  if (window.innerWidth <= 768) {
    new MobileSearchManager();
  }
});

// Update mobile search on window resize
window.addEventListener('resize', () => {
  if (window.innerWidth <= 768) {
    if (!window.mobileSearchManager) {
      window.mobileSearchManager = new MobileSearchManager();
    }
  } else {
    // Clean up mobile search on desktop
    if (window.mobileSearchManager) {
      const overlay = document.querySelector('.mobile-search-overlay');
      if (overlay) overlay.remove();
      delete window.mobileSearchManager;
    }
  }
});