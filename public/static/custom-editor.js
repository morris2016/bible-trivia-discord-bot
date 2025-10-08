// Enhanced Rich Text Editor with Better Paste Handling and Dark Mode
class EnhancedEditor {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container with id "${containerId}" not found`);
      return;
    }

    this.options = {
      placeholder: 'Start typing...',
      minHeight: 400,
      maxHeight: 600,
      toolbar: true,
      statusbar: true,
      autosave: false,
      autosaveInterval: 30000,
      spellcheck: true,
      theme: 'auto', // 'light', 'dark', or 'auto'
      ...options
    };

    this.state = {
      history: [],
      historyIndex: -1,
      maxHistory: 50,
      savedSelection: null,
      isFullscreen: false,
      wordCount: 0,
      charCount: 0,
      currentTheme: 'light'
    };

    // Track extracted styles for saving
    this.extractedStyles = [];

    this.init();
  }
  
  init() {
    this.detectTheme();
    this.createStructure();
    this.setupEditor();
    this.createToolbar();
    this.createStatusBar();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    this.addToHistory();
    
    if (this.options.autosave) {
      this.setupAutosave();
    }
  }
  
  detectTheme() {
    // Check for saved theme preference first
    const savedTheme = localStorage.getItem('editor-theme');

    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      this.state.currentTheme = savedTheme;
    } else if (this.options.theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.state.currentTheme = prefersDark ? 'dark' : 'light';
    } else {
      this.state.currentTheme = this.options.theme || 'light';
    }

    // Apply theme to document
    this.applyTheme(this.state.currentTheme);
  }
  
  applyTheme(theme) {
    console.log('Applying theme:', theme);
    document.documentElement.setAttribute('data-theme', theme);
    this.state.currentTheme = theme;

    // Update theme toggle button if it exists
    if (this.themeToggleBtn) {
      const icon = this.themeToggleBtn.querySelector('i');
      if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        console.log('Updated theme toggle button icon to:', icon.className);
      }
    }

    // Update toolbar button icon when theme changes
    this.updateThemeToggleIcon();
    console.log('Theme applied successfully');
  }
  
  toggleTheme() {
    const newTheme = this.state.currentTheme === 'dark' ? 'light' : 'dark';
    console.log('Toggling theme from', this.state.currentTheme, 'to', newTheme);
    this.applyTheme(newTheme);
    localStorage.setItem('editor-theme', newTheme);
    console.log('Theme toggled successfully');
  }

  updateThemeToggleIcon() {
    // Update theme toggle button icon
    const themeToggleBtn = this.toolbar?.querySelector('[data-command="toggleTheme"]');
    if (themeToggleBtn) {
      const icon = themeToggleBtn.querySelector('i');
      if (icon) {
        icon.className = this.getThemeToggleIcon();
      }
    }
  }

  getThemeToggleIcon() {
    return this.state.currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
  
  createStructure() {
    // Create wrapper
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'editor-wrapper';
    
    // Create editor content area
    this.editor = document.createElement('div');
    this.editor.className = 'editor-content';
    this.editor.contentEditable = true;
    this.editor.setAttribute('data-placeholder', this.options.placeholder);
    this.editor.style.minHeight = `${this.options.minHeight}px`;
    this.editor.style.maxHeight = `${this.options.maxHeight}px`;
    
    // Clear container and add wrapper
    this.container.innerHTML = '';
    this.container.appendChild(this.wrapper);
  }
  
  setupEditor() {
    this.editor.spellcheck = this.options.spellcheck;
    
    // Focus handler
    this.editor.addEventListener('focus', () => {
      this.wrapper.classList.add('focused');
    });
    
    this.editor.addEventListener('blur', () => {
      this.wrapper.classList.remove('focused');
      this.saveSelection();
    });
    
    // Input handler
    this.editor.addEventListener('input', () => {
      this.handleInput();
    });
    
    // Enhanced paste handler
    this.editor.addEventListener('paste', (e) => {
      this.handlePaste(e);
    });
    
    // Add the editor to wrapper AFTER toolbar
    this.wrapper.appendChild(this.editor);
  }
  
  createToolbar() {
    if (!this.options.toolbar) return;
    
    this.toolbar = document.createElement('div');
    this.toolbar.className = 'editor-toolbar';
    
    const toolbarGroups = [
      // Text formatting
      {
        items: [
          { type: 'button', command: 'bold', icon: 'fas fa-bold', tooltip: 'Bold (Ctrl+B)' },
          { type: 'button', command: 'italic', icon: 'fas fa-italic', tooltip: 'Italic (Ctrl+I)' },
          { type: 'button', command: 'underline', icon: 'fas fa-underline', tooltip: 'Underline (Ctrl+U)' },
          { type: 'button', command: 'strikethrough', icon: 'fas fa-strikethrough', tooltip: 'Strikethrough (Alt+S)' },
          { type: 'button', command: 'subscript', icon: 'fas fa-subscript', tooltip: 'Subscript' },
          { type: 'button', command: 'superscript', icon: 'fas fa-superscript', tooltip: 'Superscript' }
        ]
      },
      // Font options
      {
        items: [
          { type: 'dropdown', command: 'fontFamily', label: 'Font', options: [
            { value: '', label: 'Default' },
            { value: 'Arial, sans-serif', label: 'Arial' },
            { value: '"Times New Roman", serif', label: 'Times New Roman' },
            { value: 'Georgia, serif', label: 'Georgia' },
            { value: '"Courier New", monospace', label: 'Courier New' },
            { value: 'Verdana, sans-serif', label: 'Verdana' },
            { value: '"Comic Sans MS", cursive', label: 'Comic Sans' }
          ]},
          { type: 'dropdown', command: 'fontSize', label: 'Size', options: [
            { value: '1', label: '10px' },
            { value: '2', label: '12px' },
            { value: '3', label: '14px' },
            { value: '4', label: '16px' },
            { value: '5', label: '18px' },
            { value: '6', label: '24px' },
            { value: '7', label: '32px' }
          ]}
        ]
      },
      // Headings
      {
        items: [
          { type: 'dropdown', command: 'heading', label: 'Format', options: [
            { value: 'p', label: 'Paragraph' },
            { value: 'h1', label: 'Heading 1' },
            { value: 'h2', label: 'Heading 2' },
            { value: 'h3', label: 'Heading 3' },
            { value: 'h4', label: 'Heading 4' },
            { value: 'h5', label: 'Heading 5' },
            { value: 'h6', label: 'Heading 6' }
          ]}
        ]
      },
      // Colors
      {
        items: [
          { type: 'color', command: 'foreColor', icon: 'fas fa-palette', tooltip: 'Text Color' },
          { type: 'color', command: 'backColor', icon: 'fas fa-fill-drip', tooltip: 'Background Color' },
          { type: 'dropdown', command: 'highlight', icon: 'fas fa-highlighter', tooltip: 'Highlight', options: [
            { value: 'yellow', label: '🟨 Yellow' },
            { value: 'green', label: '🟩 Green' },
            { value: 'blue', label: '🟦 Blue' },
            { value: 'pink', label: '🟪 Pink' },
            { value: 'purple', label: '🟣 Purple' }
          ]}
        ]
      },
      // Lists
      {
        items: [
          { type: 'button', command: 'insertUnorderedList', icon: 'fas fa-list-ul', tooltip: 'Bullet List' },
          { type: 'button', command: 'insertOrderedList', icon: 'fas fa-list-ol', tooltip: 'Numbered List' },
          { type: 'button', command: 'taskList', icon: 'fas fa-tasks', tooltip: 'Task List' },
          { type: 'button', command: 'outdent', icon: 'fas fa-outdent', tooltip: 'Decrease Indent' },
          { type: 'button', command: 'indent', icon: 'fas fa-indent', tooltip: 'Increase Indent' }
        ]
      },
      // Alignment
      {
        items: [
          { type: 'button', command: 'justifyLeft', icon: 'fas fa-align-left', tooltip: 'Align Left' },
          { type: 'button', command: 'justifyCenter', icon: 'fas fa-align-center', tooltip: 'Align Center' },
          { type: 'button', command: 'justifyRight', icon: 'fas fa-align-right', tooltip: 'Align Right' },
          { type: 'button', command: 'justifyFull', icon: 'fas fa-align-justify', tooltip: 'Justify' }
        ]
      },
      // Insert
      {
        items: [
          { type: 'button', command: 'createLink', icon: 'fas fa-link', tooltip: 'Insert Link (Ctrl+K)' },
          { type: 'button', command: 'unlink', icon: 'fas fa-unlink', tooltip: 'Remove Link' },
          { type: 'button', command: 'insertImage', icon: 'fas fa-image', tooltip: 'Insert Image' },
          { type: 'button', command: 'insertVideo', icon: 'fas fa-video', tooltip: 'Insert Video' },
          { type: 'button', command: 'insertTable', icon: 'fas fa-table', tooltip: 'Insert Table' },
          { type: 'button', command: 'insertHorizontalRule', icon: 'fas fa-minus', tooltip: 'Horizontal Line' }
        ]
      },
      // Code
      {
        items: [
          { type: 'button', command: 'code', icon: 'fas fa-code', tooltip: 'Inline Code' },
          { type: 'button', command: 'codeBlock', icon: 'fas fa-file-code', tooltip: 'Code Block' },
          { type: 'button', command: 'blockquote', icon: 'fas fa-quote-right', tooltip: 'Blockquote' },
          { type: 'button', command: 'insertHTML', icon: 'fas fa-code', tooltip: 'Insert HTML Code' }
        ]
      },
      // Special
      {
        items: [
          { type: 'button', command: 'emoji', icon: 'fas fa-smile', tooltip: 'Insert Emoji' },
          { type: 'button', command: 'specialChars', icon: 'fas fa-omega', tooltip: 'Special Characters' },
          { type: 'button', command: 'findReplace', icon: 'fas fa-search', tooltip: 'Find & Replace (Ctrl+F)' }
        ]
      },
      // Actions
      {
        items: [
          { type: 'button', command: 'removeFormat', icon: 'fas fa-eraser', tooltip: 'Clear Formatting' },
          { type: 'button', command: 'undo', icon: 'fas fa-undo', tooltip: 'Undo (Ctrl+Z)' },
          { type: 'button', command: 'redo', icon: 'fas fa-redo', tooltip: 'Redo (Ctrl+Y)' },
          { type: 'button', command: 'fullscreen', icon: 'fas fa-expand', tooltip: 'Fullscreen (F11)' },
          { type: 'button', command: 'print', icon: 'fas fa-print', tooltip: 'Print (Ctrl+P)' }
        ]
      }
    ];
    
    // Add theme toggle to the last group
    toolbarGroups.push({
      items: [
        { type: 'button', command: 'toggleTheme', icon: this.getThemeToggleIcon(), tooltip: 'Toggle Theme' }
      ],
      className: 'editor-theme-toggle'
    });
    
    toolbarGroups.forEach((group, index) => {
      const groupEl = document.createElement('div');
      groupEl.className = 'editor-toolbar-group';
      if (group.className) {
        groupEl.className += ' ' + group.className;
      }
      
      group.items.forEach(item => {
        const element = this.createToolbarItem(item);
        if (element) {
          groupEl.appendChild(element);
          
          // Store theme toggle button reference
          if (item.command === 'toggleTheme') {
            this.themeToggleBtn = element;
          }
        }
      });
      
      this.toolbar.appendChild(groupEl);
      
      // Add separator between groups (except last two)
      if (index < toolbarGroups.length - 2) {
        const separator = document.createElement('div');
        separator.className = 'editor-separator';
        this.toolbar.appendChild(separator);
      }
    });
    
    this.wrapper.insertBefore(this.toolbar, this.wrapper.firstChild);

    // Ensure theme toggle icon is correct after toolbar creation
    this.updateThemeToggleIcon();
  }
  
  createToolbarItem(item) {
    switch (item.type) {
      case 'button':
        return this.createToolbarButton(item);
      case 'dropdown':
        return this.createToolbarDropdown(item);
      case 'color':
        return this.createColorPicker(item);
      default:
        return null;
    }
  }
  
  createToolbarButton(item) {
    const button = document.createElement('button');
    button.className = 'editor-btn';
    button.innerHTML = `<i class="${item.icon}"></i>`;
    button.setAttribute('data-tooltip', item.tooltip || '');
    button.dataset.command = item.command;
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      this.executeCommand(item.command);
    });
    
    return button;
  }
  
  createToolbarDropdown(item) {
    const dropdown = document.createElement('div');
    dropdown.className = 'editor-dropdown';
    
    const toggle = document.createElement('button');
    toggle.className = 'editor-btn editor-dropdown-toggle';
    toggle.innerHTML = item.icon ? `<i class="${item.icon}"></i>` : item.label;
    toggle.setAttribute('data-tooltip', item.tooltip || '');
    
    const menu = document.createElement('div');
    menu.className = 'editor-dropdown-menu';
    
    item.options.forEach(option => {
      const menuItem = document.createElement('button');
      menuItem.className = 'editor-dropdown-item';
      menuItem.innerHTML = option.label;
      menuItem.dataset.value = option.value;
      
      // Add font preview for font family dropdown
      if (item.command === 'fontFamily' && option.value) {
        menuItem.style.fontFamily = option.value;
      }
      
      menuItem.addEventListener('click', (e) => {
        e.preventDefault();
        this.executeCommand(item.command, option.value);
        dropdown.classList.remove('show');
        
        // Update toggle label for some dropdowns
        if (item.command === 'heading' || item.command === 'fontSize') {
          toggle.innerHTML = option.label;
        }
      });
      
      menu.appendChild(menuItem);
    });
    
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Close other dropdowns
      document.querySelectorAll('.editor-dropdown.show').forEach(d => {
        if (d !== dropdown) d.classList.remove('show');
      });
      
      dropdown.classList.toggle('show');
    });
    
    dropdown.appendChild(toggle);
    dropdown.appendChild(menu);
    
    return dropdown;
  }
  
  createColorPicker(item) {
    const wrapper = document.createElement('div');
    wrapper.className = 'editor-color-picker';
    
    const input = document.createElement('input');
    input.type = 'color';
    input.className = 'editor-color-input';
    input.value = item.command === 'foreColor' ? '#000000' : '#ffff00';
    
    const preview = document.createElement('div');
    preview.className = 'editor-color-preview';
    preview.innerHTML = `<i class="${item.icon}"></i>`;
    preview.style.color = input.value;
    preview.setAttribute('data-tooltip', item.tooltip || '');
    
    input.addEventListener('input', (e) => {
      preview.style.color = e.target.value;
      this.executeCommand(item.command, e.target.value);
    });
    
    wrapper.appendChild(input);
    wrapper.appendChild(preview);
    
    return wrapper;
  }
  
  createStatusBar() {
    if (!this.options.statusbar) return;
    
    this.statusbar = document.createElement('div');
    this.statusbar.className = 'editor-statusbar';
    
    const left = document.createElement('div');
    left.className = 'editor-statusbar-item';
    left.innerHTML = `
      <span>Words: <strong id="word-count">0</strong></span>
      <span>Characters: <strong id="char-count">0</strong></span>
      <span>Lines: <strong id="line-count">1</strong></span>
    `;
    
    const right = document.createElement('div');
    right.className = 'editor-statusbar-item';
    right.innerHTML = `
      <span id="save-status">Ready</span>
    `;
    
    this.statusbar.appendChild(left);
    this.statusbar.appendChild(right);
    
    this.wrapper.appendChild(this.statusbar);
  }
  
  setupEventListeners() {
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.editor-dropdown')) {
        document.querySelectorAll('.editor-dropdown.show').forEach(d => {
          d.classList.remove('show');
        });
      }
      
      // Close emoji picker
      if (this.emojiPicker && !e.target.closest('.editor-emoji-picker') && 
          !e.target.closest('[data-command="emoji"]')) {
        this.emojiPicker.classList.remove('show');
      }
    });
    
    // Update toolbar state on selection change
    document.addEventListener('selectionchange', () => {
      if (this.editor && this.editor.contains(window.getSelection().anchorNode)) {
        this.updateToolbarState();
      }
    });
    
    // Listen for theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (this.options.theme === 'auto') {
        this.applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
  
  setupKeyboardShortcuts() {
    this.editor.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const alt = e.altKey;
      const shift = e.shiftKey;
      
      if (ctrl) {
        switch (key) {
          case 'b':
            e.preventDefault();
            this.executeCommand('bold');
            break;
          case 'i':
            e.preventDefault();
            this.executeCommand('italic');
            break;
          case 'u':
            e.preventDefault();
            this.executeCommand('underline');
            break;
          case 'z':
            e.preventDefault();
            if (shift) {
              this.redo();
            } else {
              this.undo();
            }
            break;
          case 'y':
            e.preventDefault();
            this.redo();
            break;
          case 's':
            e.preventDefault();
            this.save();
            break;
          case 'k':
            e.preventDefault();
            this.executeCommand('createLink');
            break;
          case 'p':
            e.preventDefault();
            this.executeCommand('print');
            break;
          case 'f':
            e.preventDefault();
            this.executeCommand('findReplace');
            break;
          case 'h':
            if (shift) {
              e.preventDefault();
              this.executeCommand('highlight', 'yellow');
            }
            break;
        }
      } else if (alt) {
        switch (key) {
          case 's':
            e.preventDefault();
            this.executeCommand('strikethrough');
            break;
        }
      } else if (key === 'f11') {
        e.preventDefault();
        this.executeCommand('fullscreen');
      }
    });
  }
  
  executeCommand(command, value = null) {
    // Save current selection
    this.saveSelection();
    
    // Focus editor
    this.editor.focus();
    
    // Restore selection
    this.restoreSelection();
    
    switch (command) {
      // Custom commands
      case 'heading':
        this.formatHeading(value);
        break;
      case 'taskList':
        this.insertTaskList();
        break;
      case 'code':
        this.insertInlineCode();
        break;
      case 'codeBlock':
        this.insertCodeBlock();
        break;
      case 'blockquote':
        this.insertBlockquote();
        break;
      case 'createLink':
        this.insertLink();
        break;
      case 'insertImage':
        this.insertImage();
        break;
      case 'insertVideo':
        this.insertVideo();
        break;
      case 'insertTable':
        this.insertTable();
        break;
      case 'highlight':
        this.applyHighlight(value);
        break;
      case 'emoji':
        this.showEmojiPicker();
        break;
      case 'specialChars':
        this.showSpecialChars();
        break;
      case 'findReplace':
        this.showFindReplace();
        break;
      case 'fullscreen':
        this.toggleFullscreen();
        break;
      case 'print':
        this.print();
        break;
      case 'undo':
        this.undo();
        break;
      case 'redo':
        this.redo();
        break;
      case 'toggleTheme':
        this.toggleTheme();
        break;
      case 'insertHTML':
        this.openHtmlInsertPopup();
        break;
      case 'fontFamily':
        if (value) {
          document.execCommand('fontName', false, value);
        }
        break;
      case 'fontSize':
        if (value) {
          document.execCommand('fontSize', false, value);
        }
        break;
      // Standard execCommand
      default:
        document.execCommand(command, false, value);
    }
    
    this.saveSelection();
    this.updateToolbarState();
    this.addToHistory();
  }
  
  formatHeading(tag) {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    // Get the parent block element
    let block = range.commonAncestorContainer;
    while (block && block.nodeType !== 1) {
      block = block.parentNode;
    }
    
    if (block && block !== this.editor) {
      // Find the closest block element
      while (block.parentNode !== this.editor && block.parentNode) {
        block = block.parentNode;
      }
      
      if (tag === 'p') {
        // Convert to paragraph
        const p = document.createElement('p');
        p.innerHTML = block.innerHTML;
        block.parentNode.replaceChild(p, block);
      } else {
        // Convert to heading
        const heading = document.createElement(tag);
        heading.innerHTML = block.innerHTML;
        block.parentNode.replaceChild(heading, block);
      }
    } else {
      // Fallback to execCommand
      document.execCommand('formatBlock', false, tag === 'p' ? '<p>' : `<${tag}>`);
    }
  }
  
  insertTaskList() {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    const ul = document.createElement('ul');
    ul.className = 'task-list';
    
    // Get selected text or use default
    const selectedText = range.toString();
    const items = selectedText ? selectedText.split('\n') : ['Task item'];
    
    items.forEach(item => {
      if (item.trim()) {
        const li = document.createElement('li');
        li.className = 'task-list-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        
        const text = document.createTextNode(' ' + item.trim());
        
        li.appendChild(checkbox);
        li.appendChild(text);
        ul.appendChild(li);
      }
    });
    
    range.deleteContents();
    range.insertNode(ul);
    range.setStartAfter(ul);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  insertInlineCode() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (selectedText) {
      const code = document.createElement('code');
      code.textContent = selectedText;
      range.deleteContents();
      range.insertNode(code);
      
      // Move cursor after code element
      range.setStartAfter(code);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      document.execCommand('insertHTML', false, '<code>code</code>');
    }
  }
  
  insertCodeBlock() {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const selectedText = range.toString() || 'Enter code here';
    
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = selectedText;
    pre.appendChild(code);
    
    // Insert at block level
    range.deleteContents();
    
    // Find parent block
    let parentBlock = range.commonAncestorContainer;
    while (parentBlock && parentBlock !== this.editor && parentBlock.parentNode !== this.editor) {
      parentBlock = parentBlock.parentNode;
    }
    
    if (parentBlock && parentBlock !== this.editor) {
      parentBlock.parentNode.insertBefore(pre, parentBlock.nextSibling);
    } else {
      range.insertNode(pre);
    }
    
    // Move cursor after the pre element
    const newRange = document.createRange();
    newRange.setStartAfter(pre);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
  }
  
  insertBlockquote() {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const selectedText = range.toString() || 'Quote text';
    
    const blockquote = document.createElement('blockquote');
    const p = document.createElement('p');
    p.textContent = selectedText;
    blockquote.appendChild(p);
    
    range.deleteContents();
    range.insertNode(blockquote);
    
    // Move cursor after blockquote
    range.setStartAfter(blockquote);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  insertLink() {
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    const url = prompt('Enter URL:', 'https://');
    if (!url || url === 'https://') return;
    
    if (selectedText) {
      document.execCommand('createLink', false, url);
    } else {
      const linkText = prompt('Enter link text:', url);
      if (linkText) {
        const a = document.createElement('a');
        a.href = url;
        a.textContent = linkText;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        
        const range = selection.getRangeAt(0);
        range.insertNode(a);
        
        // Move cursor after link
        range.setStartAfter(a);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }
  
  insertImage() {
    const url = prompt('Enter image URL:', 'https://');
    if (url && url !== 'https://') {
      const img = document.createElement('img');
      img.src = url;
      img.alt = 'Image';
      img.style.maxWidth = '100%';
      
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      range.insertNode(img);
      
      // Move cursor after image
      range.setStartAfter(img);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
  
  insertVideo() {
    const url = prompt('Enter video URL (YouTube/Vimeo):', '');
    if (!url) return;
    
    let embedUrl = '';
    let videoId;
    
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId[1]}`;
      }
    }
    // Vimeo
    else if (url.includes('vimeo.com')) {
      videoId = url.match(/vimeo\.com\/(\d+)/);
      if (videoId) {
        embedUrl = `https://player.vimeo.com/video/${videoId[1]}`;
      }
    }
    
    if (embedUrl) {
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.paddingBottom = '56.25%';
      wrapper.style.height = '0';
      wrapper.style.overflow = 'hidden';
      wrapper.style.maxWidth = '100%';
      wrapper.style.margin = '1em 0';
      
      const iframe = document.createElement('iframe');
      iframe.src = embedUrl;
      iframe.style.position = 'absolute';
      iframe.style.top = '0';
      iframe.style.left = '0';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.frameBorder = '0';
      iframe.allowFullscreen = true;
      
      wrapper.appendChild(iframe);
      
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      range.insertNode(wrapper);
      
      // Move cursor after video
      range.setStartAfter(wrapper);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      alert('Invalid video URL. Please use a YouTube or Vimeo URL.');
    }
  }
  
  insertTable() {
    const rows = prompt('Number of rows:', '3');
    const cols = prompt('Number of columns:', '3');
    
    if (rows && cols) {
      const table = document.createElement('table');
      const tbody = document.createElement('tbody');
      
      // Create header row
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      for (let j = 0; j < parseInt(cols); j++) {
        const th = document.createElement('th');
        th.textContent = `Header ${j + 1}`;
        headerRow.appendChild(th);
      }
      thead.appendChild(headerRow);
      table.appendChild(thead);
      
      // Create body rows
      for (let i = 0; i < parseInt(rows); i++) {
        const tr = document.createElement('tr');
        for (let j = 0; j < parseInt(cols); j++) {
          const td = document.createElement('td');
          td.textContent = `Cell ${i + 1}-${j + 1}`;
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      range.insertNode(table);
      
      // Move cursor after table
      range.setStartAfter(table);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
  
  applyHighlight(color) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0 || selection.isCollapsed) return;
    
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.className = `highlight-${color}`;
    
    try {
      range.surroundContents(span);
    } catch (e) {
      // If surroundContents fails, use alternative method
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    }
    
    // Restore selection
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  showEmojiPicker() {
    if (!this.emojiPicker) {
      this.emojiPicker = document.createElement('div');
      this.emojiPicker.className = 'editor-emoji-picker';
      
      const categories = {
        'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔'],
        'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪', '🖕', '✍️', '🙏', '💍', '💄', '💋'],
        'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
        'Objects': ['⭐', '🌟', '✨', '⚡', '🔥', '💥', '☀️', '🌈', '☁️', '🌧️', '⛈️', '❄️', '🌊', '🎈', '🎉', '🎊', '🎁', '🏆', '🥇', '🥈', '🥉', '🏅', '🎯', '🎪', '🎨']
      };
      
      Object.entries(categories).forEach(([category, emojis]) => {
        emojis.forEach(emoji => {
          const btn = document.createElement('button');
          btn.className = 'editor-emoji';
          btn.textContent = emoji;
          btn.title = category;
          btn.addEventListener('click', () => {
            document.execCommand('insertText', false, emoji);
            this.emojiPicker.classList.remove('show');
          });
          this.emojiPicker.appendChild(btn);
        });
      });
      
      this.wrapper.appendChild(this.emojiPicker);
    }
    
    this.emojiPicker.classList.toggle('show');
  }
  
  showSpecialChars() {
    const chars = [
      '©', '®', '™', '€', '£', '¥', '¢', '§', '¶', 
      '†', '‡', '•', '…', '°', '¹', '²', '³', '½', 
      '¼', '¾', '±', '×', '÷', '≠', '≈', '≤', '≥', 
      '∞', 'α', 'β', 'γ', 'δ', 'π', 'σ', 'μ', 'Ω',
      '←', '→', '↑', '↓', '↔', '⇐', '⇒', '⇑', '⇓', '⇔'
    ];
    
    const modal = this.createModal('Special Characters', '');
    const grid = document.createElement('div');
    grid.className = 'editor-special-chars';
    
    chars.forEach(char => {
      const btn = document.createElement('button');
      btn.className = 'editor-special-char';
      btn.textContent = char;
      btn.addEventListener('click', () => {
        this.editor.focus();
        this.restoreSelection();
        document.execCommand('insertText', false, char);
        modal.remove();
      });
      grid.appendChild(btn);
    });
    
    modal.querySelector('.editor-modal-body').appendChild(grid);
  }
  
  showFindReplace() {
    if (!this.findReplacePanel) {
      this.findReplacePanel = document.createElement('div');
      this.findReplacePanel.className = 'editor-find-replace';
      this.findReplacePanel.innerHTML = `
        <div class="editor-form-group">
          <input type="text" class="editor-form-input" id="find-input" placeholder="Find...">
        </div>
        <div class="editor-form-group">
          <input type="text" class="editor-form-input" id="replace-input" placeholder="Replace with...">
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="editor-btn" id="close-find">Close</button>
          <button class="editor-btn" id="find-next">Find Next</button>
          <button class="editor-btn" id="replace-one">Replace</button>
          <button class="editor-btn" id="replace-all">Replace All</button>
        </div>
      `;

      this.wrapper.appendChild(this.findReplacePanel);

      // Add event listeners
      this.findReplacePanel.querySelector('#close-find').addEventListener('click', () => {
        this.findReplacePanel.classList.remove('show');
      });

      this.findReplacePanel.querySelector('#find-next').addEventListener('click', () => {
        const text = this.findReplacePanel.querySelector('#find-input').value;
        if (text) {
          if (window.find) {
            window.find(text);
          }
        }
      });

      this.findReplacePanel.querySelector('#replace-one').addEventListener('click', () => {
        const find = this.findReplacePanel.querySelector('#find-input').value;
        const replace = this.findReplacePanel.querySelector('#replace-input').value;
        if (find) {
          const selection = window.getSelection();
          if (selection.toString() === find) {
            document.execCommand('insertText', false, replace);
          }
        }
      });

      this.findReplacePanel.querySelector('#replace-all').addEventListener('click', () => {
        const find = this.findReplacePanel.querySelector('#find-input').value;
        const replace = this.findReplacePanel.querySelector('#replace-input').value;
        if (find) {
          const content = this.editor.innerHTML;
          const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          this.editor.innerHTML = content.replace(regex, replace);
          this.addToHistory();
        }
      });
    }

    this.findReplacePanel.classList.toggle('show');

    // Focus find input
    if (this.findReplacePanel.classList.contains('show')) {
      this.findReplacePanel.querySelector('#find-input').focus();
    }
  }

  openHtmlInsertPopup() {
    // Define global method for popup to communicate back
    window.processHtmlInsertion = (html) => {
      this.insertHtmlContent(html);
      delete window.processHtmlInsertion;
    };

    // Open popup window
    const popupWidth = 1200;
    const popupHeight = 800;
    const left = (window.screen.width - popupWidth) / 2;
    const top = (window.screen.height - popupHeight) / 2;
    const popupFeatures = `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes,status=yes,toolbar=yes,menubar=yes`;

    window.open('/static/html-insert-popup.html', 'htmlInsertPopup', popupFeatures);
  }

  insertHtmlContent(html) {
    if (!html || !html.trim()) return;

    // Process the HTML content - decode entities only, no cleaning
    const decodedHTML = this.decodeHtmlEntities(html);

    // Extract and apply styles to document head
    const { content: htmlWithoutStyles, styles: extractedStyles } = this.extractAndApplyStyles(decodedHTML);

    // Handle Chart.js scripts if present - extract BEFORE removing styles
    let chartScripts = [];
    if (decodedHTML.includes('new Chart') || decodedHTML.includes('Chart.js') || decodedHTML.includes('chartjs')) {
      // Extract scripts more carefully to avoid including style tags
      const scriptBlocks = decodedHTML.split(/<\/script>/gi);

      scriptBlocks.forEach(block => {
        const scriptStart = block.lastIndexOf('<script');
        if (scriptStart !== -1) {
          const scriptContent = block.substring(scriptStart);
          // Only include scripts that actually contain Chart.js code
          if (scriptContent.includes('new Chart') || scriptContent.includes('Chart.js') || scriptContent.includes('chartjs')) {
            // Extract just the JavaScript content, not the HTML tags
            const jsContent = scriptContent.replace(/<script[^>]*>/gi, '').trim();
            if (jsContent && !jsContent.startsWith('<style') && !jsContent.includes('<style')) {
              chartScripts.push(jsContent);
            }
          }
        }
      });
    }

    // Insert the HTML without styles
    document.execCommand('insertHTML', false, htmlWithoutStyles);

    // Process Chart.js scripts after HTML insertion
    if (chartScripts.length > 0) {
      this.processChartJSImmediately(chartScripts);
    }

    this.addToHistory();
  }
  
  toggleFullscreen() {
    this.state.isFullscreen = !this.state.isFullscreen;
    this.wrapper.classList.toggle('fullscreen');
    
    const btn = this.toolbar.querySelector('[data-command="fullscreen"] i');
    if (btn) {
      btn.className = this.state.isFullscreen ? 'fas fa-compress' : 'fas fa-expand';
    }
  }
  
  print() {
    const printWindow = window.open('', '', 'height=600,width=800');
    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          return '';
        }
      })
      .join('\n');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Document</title>
          <style>
            ${styles}
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #000;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
          </style>
        </head>
        <body>${this.editor.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
  
  createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'editor-modal show';
    modal.innerHTML = `
      <div class="editor-modal-content">
        <div class="editor-modal-header">
          <h3 class="editor-modal-title">${title}</h3>
          <button class="editor-modal-close">&times;</button>
        </div>
        <div class="editor-modal-body">${content}</div>
      </div>
    `;
    
    modal.querySelector('.editor-modal-close').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    document.body.appendChild(modal);
    return modal;
  }
  
  handleInput() {
    this.updateWordCount();
    this.addToHistory();
    
    if (this.options.onChange) {
      this.options.onChange(this.getContent());
    }
  }
  
  handlePaste(e) {
    e.preventDefault();

    // Get clipboard data
    const clipboardData = e.clipboardData || window.clipboardData;
    const pastedHTML = clipboardData.getData('text/html');
    const pastedText = clipboardData.getData('text/plain');

    if (pastedHTML) {
      // Decode HTML entities and insert directly without cleaning
      const decodedHTML = this.decodeHtmlEntities(pastedHTML);

      // Extract and apply styles to document head
      const { content: htmlWithoutStyles, styles: extractedStyles } = this.extractAndApplyStyles(decodedHTML);

      // Handle Chart.js scripts if present - extract BEFORE removing styles
      let chartScripts = [];
      if (decodedHTML.includes('new Chart') || decodedHTML.includes('Chart.js') || decodedHTML.includes('chartjs')) {
        // Extract scripts more carefully to avoid including style tags
        const scriptBlocks = decodedHTML.split(/<\/script>/gi);

        scriptBlocks.forEach(block => {
          const scriptStart = block.lastIndexOf('<script');
          if (scriptStart !== -1) {
            const scriptContent = block.substring(scriptStart);
            // Only include scripts that actually contain Chart.js code
            if (scriptContent.includes('new Chart') || scriptContent.includes('Chart.js') || scriptContent.includes('chartjs')) {
              // Extract just the JavaScript content, not the HTML tags
              const jsContent = scriptContent.replace(/<script[^>]*>/gi, '').trim();
              if (jsContent && !jsContent.startsWith('<style') && !jsContent.includes('<style')) {
                chartScripts.push(jsContent);
              }
            }
          }
        });

        if (chartScripts.length > 0) {
          // Insert HTML first, then process Chart.js
          document.execCommand('insertHTML', false, htmlWithoutStyles);
          this.processChartJSImmediately(chartScripts);
          this.handleInput();
          this.addToHistory();
          return;
        }
      }

      // Insert HTML without styles
      document.execCommand('insertHTML', false, htmlWithoutStyles);
    } else if (pastedText) {
      // Format plain text (detect markdown-like formatting)
      const formatted = this.formatPlainText(pastedText);
      document.execCommand('insertHTML', false, formatted);
    }

    this.handleInput();
    this.addToHistory();
  }

  // NEW METHOD: Process Chart.js with proper loading synchronization
  processChartJSWithProperLoading(chartScripts, cleanedHTML) {
    console.log('Processing Chart.js scripts with proper loading...');

    // Step 1: Ensure Chart.js 3.9.1 is loaded first
    this.ensureChartJSLoaded().then(() => {
      console.log('Chart.js is confirmed loaded, proceeding with chart rendering...');

      // Step 2: Insert cleaned HTML first
      document.execCommand('insertHTML', false, cleanedHTML);

      // Step 3: Execute chart scripts after HTML insertion
      setTimeout(() => {
        this.executeChartScriptsSafely(chartScripts);
      }, 100);

      // Step 4: Update UI after chart processing
      this.handleInput();
      this.addToHistory();
    }).catch(error => {
      console.error('Failed to load Chart.js:', error);
      // Fallback: insert HTML without charts
      const fallbackHTML = cleanedHTML.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      document.execCommand('insertHTML', false, fallbackHTML);
      this.handleInput();
      this.addToHistory();
    });
  }

  // NEW METHOD: Ensure Chart.js is loaded properly
  ensureChartJSLoaded() {
    return new Promise((resolve, reject) => {
      // Check if Chart.js is already loaded
      if (window.Chart && window.Chart.version && window.Chart.version.startsWith('3.')) {
        console.log('Chart.js is already loaded:', window.Chart.version);
        resolve();
        return;
      }

      // Remove any existing Chart.js scripts to avoid conflicts
      const existingScripts = document.querySelectorAll('script[src*="chart.js"], script[src*="Chart.js"]');
      existingScripts.forEach(script => {
        console.log('Removing existing Chart.js script:', script.src);
        script.remove();
      });

      // Force load Chart.js 3.9.1
      const chartScript = document.createElement('script');
      chartScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js';
      chartScript.integrity = 'sha512-ElRFoEQdI5HtTockmVEKqsxVNwHnHvxqs9A+A1QqRIHnUASEHkrhEWX+NTR8cnK+PXk+ZkYH3/adpLGWdxJuA==';
      chartScript.crossOrigin = 'anonymous';

      let loaded = false;

      chartScript.onload = () => {
        if (!loaded) {
          loaded = true;
          console.log('Chart.js 3.9.1 loaded successfully');
          resolve();
        }
      };

      chartScript.onerror = () => {
        if (!loaded) {
          loaded = true;
          console.error('Failed to load Chart.js from CDN, trying fallback');
          reject(new Error('Chart.js CDN loading failed'));
        }
      };

      // Set a timeout in case loading hangs
      setTimeout(() => {
        if (!loaded) {
          loaded = true;
          console.warn('Chart.js loading timeout');
          reject(new Error('Chart.js loading timeout'));
        }
      }, 10000);

      document.head.appendChild(chartScript);
    });
  }

  // NEW METHOD: Execute chart scripts safely after Chart.js is loaded
  executeChartScriptsSafely(chartScripts) {
    if (!window.Chart) {
      console.error('Chart.js not available for script execution');
      return;
    }

    chartScripts.forEach((script, index) => {
      try {
        console.log(`Executing chart script ${index + 1} safely...`);

        // Apply variable replacement fixes if needed
        let fixedScript = script;

        // Find variable declaration and chart pattern
        const lines = script.split('\n');
        let varDeclaration = '';
        let varName = '';

        // Find variable declaration for chart context
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if ((line.startsWith('const') || line.startsWith('let') || line.startsWith('var')) &&
              line.includes('document.getElementById') && line.includes('.getContext')) {
            varDeclaration = line;
            const varMatch = line.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/);
            if (varMatch) {
              varName = varMatch[1];
              console.log(`Found variable '${varName}' in chart script ${index + 1}`);
            }
            break;
          }
        }

        // Apply variable replacement for scripts that use ctx1 but have different variable names
        if (varName && varName !== 'ctx1' && script.includes('new Chart(ctx1,')) {
          fixedScript = script.replace(/new Chart\(ctx1,/g, `new Chart(${varName},`);
          console.log(`Applied variable fix: ctx1 -> ${varName} in chart script ${index + 1}`);
        }

        // Execute the fixed script safely
        this.executeChartCode(fixedScript);

        console.log(`Chart script ${index + 1} executed successfully`);
      } catch (error) {
        console.error(`Error executing chart script ${index + 1}:`, error);

        // Try fallback execution
        try {
          this.executeChartCode(script);
          console.log(`Chart script ${index + 1} fallback execution successful`);
        } catch (fallbackError) {
          console.error(`Chart script ${index + 1} fallback execution failed:`, fallbackError);
        }
      }
    });
  }

  decodeHtmlEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }

  // Extract styles from HTML and apply them to document head
  extractAndApplyStyles(html) {
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    const styles = [];
    let match;
    let htmlWithoutStyles = html;

    // Extract all style tags
    while ((match = styleRegex.exec(html)) !== null) {
      const styleContent = match[1];
      if (styleContent.trim()) {
        styles.push(styleContent.trim());
      }
    }

    // Remove style tags from HTML
    htmlWithoutStyles = htmlWithoutStyles.replace(styleRegex, '');

    // Filter and clean styles to prevent website-wide interference
    if (styles.length > 0) {
      const filteredStyles = this.filterContentStyles(styles);

      if (filteredStyles.length > 0) {
        // Check if we already have our custom style container
        let styleContainer = document.getElementById('editor-injected-styles');
        if (!styleContainer) {
          styleContainer = document.createElement('style');
          styleContainer.id = 'editor-injected-styles';
          styleContainer.setAttribute('data-editor-styles', 'true');
          document.head.appendChild(styleContainer);
        }

        // Add new styles to the container
        const combinedStyles = filteredStyles.join('\n\n/* --- Next Style Block --- */\n\n');
        styleContainer.textContent += '\n\n' + combinedStyles;

        // Track the extracted styles for saving
        if (!this.extractedStyles) {
          this.extractedStyles = [];
        }
        this.extractedStyles.push(...filteredStyles);

        console.log('Applied', filteredStyles.length, 'filtered style blocks to document head and tracked for saving');
      }
    }

    return {
      content: htmlWithoutStyles,
      styles: styles
    };
  }

  // Filter styles to prevent website-wide interference
  filterContentStyles(styles) {
    const filteredStyles = [];

    styles.forEach(styleBlock => {
      let filteredBlock = styleBlock;

      // Remove dangerous body styles that affect the entire website
      // Remove background gradients/images
      filteredBlock = filteredBlock.replace(/body\s*\{[^}]*background[^}]*\}/gi, '');
      filteredBlock = filteredBlock.replace(/body\s*\{[^}]*background-color[^}]*\}/gi, '');
      filteredBlock = filteredBlock.replace(/body\s*\{[^}]*background-image[^}]*\}/gi, '');

      // Remove body margin/padding that could affect layout
      filteredBlock = filteredBlock.replace(/body\s*\{[^}]*margin[^}]*\}/gi, '');
      filteredBlock = filteredBlock.replace(/body\s*\{[^}]*padding[^}]*\}/gi, '');

      // Remove body color that could affect global text
      filteredBlock = filteredBlock.replace(/body\s*\{[^}]*color[^}]*\}/gi, '');

      // Remove other potentially dangerous body properties
      filteredBlock = filteredBlock.replace(/body\s*\{[^}]*position[^}]*\}/gi, '');
      filteredBlock = filteredBlock.replace(/body\s*\{[^}]*z-index[^}]*\}/gi, '');
      filteredBlock = filteredBlock.replace(/body\s*\{[^}]*width[^}]*\}/gi, '');
      filteredBlock = filteredBlock.replace(/body\s*\{[^}]*height[^}]*\}/gi, '');
      filteredBlock = filteredBlock.replace(/body\s*\{[^}]*overflow[^}]*\}/gi, '');

      // Clean up any empty body rules
      filteredBlock = filteredBlock.replace(/body\s*\{\s*\}/gi, '');

      // Remove multiple consecutive empty lines
      filteredBlock = filteredBlock.replace(/\n\s*\n\s*\n/g, '\n\n');

      if (filteredBlock.trim()) {
        filteredStyles.push(filteredBlock.trim());
      }
    });

    return filteredStyles;
  }
  
  cleanPastedHTML(html) {
    // Decode HTML entities first
    const decodedHtml = this.decodeHtmlEntities(html);

    // Use regex-based cleaning for better performance
    let cleaned = decodedHtml;
    const retainedScripts = [];
    const retainedStyles = [];

    // Extract and retain Chart.js and D3.js scripts and other chart-related scripts
    const chartScriptRegex = /<script[^>]*?(?:src="[^"]*(?:chart\.js|chartjs|D3|plotly|apexcharts)[^"]*"[^>]*?)>([\s\S]*?)<\/script>/gi;
    let scriptMatch;

    while ((scriptMatch = chartScriptRegex.exec(decodedHtml)) !== null) {
      retainedScripts.push(scriptMatch[0]);
    }

    // Extract and retain Chart.js script tags even without external URLs
    const chartScriptContentRegex = /<script[^>]*>[\s\S]*?(?:new Chart|Chart\.|ChartJS)[\s\S]*?<\/script>/gi;
    let chartContentMatch;
    while ((chartContentMatch = chartScriptContentRegex.exec(decodedHtml)) !== null) {
      retainedScripts.push(chartContentMatch[0]);
    }

    // Extract and retain style tags
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let styleMatch;
    while ((styleMatch = styleRegex.exec(decodedHtml)) !== null) {
      retainedStyles.push(styleMatch[0]);
    }

    // Remove script and style tags from cleaned HTML for rendering
    cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Conservative cleanup - preserve styling but remove dangerous attributes
    // Only remove onclick, onload, onerror, and data-* attributes that could be malicious
    cleaned = cleaned.replace(/\s+(?:onclick|onload|onerror)=["'][^"']*["']/gi, '');

    // Remove potentially malicious data attributes but keep style and class
    cleaned = cleaned.replace(/\s+data-(?:url|href|src)=["'][^"']*["']/gi, '');

    // Remove classes that are known to be dangerous (Microsoft Office classes, etc.)
    cleaned = cleaned.replace(/class=["'][^"']*?(?:Mso|mso-)[^"']*?["']/gi, '');

    return {
      content: cleaned,
      retainedScripts: retainedScripts,
      retainedStyles: retainedStyles
    };
  }

  processFullHTMLDocument(html) {
    // For complex HTML documents with scripts and interactive content,
    // use an iframe-based approach to properly render and extract content

    // Create a temporary iframe to render the full HTML document
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.width = '800px';
    iframe.style.height = '600px';

    // Add iframe to document
    document.body.appendChild(iframe);

    // Get iframe document
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    // Write the full HTML document to the iframe
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Wait for the iframe to load completely
    iframe.onload = () => {
      try {
        // Extract the rendered body content
        const bodyContent = iframeDoc.body.innerHTML;

        // Insert the rendered content into the editor
        document.execCommand('insertHTML', false, bodyContent);

        // Initialize any interactive content (charts, etc.)
        this.initializeInteractiveContent();

        // Clean up the iframe
        document.body.removeChild(iframe);

        // Add to history
        this.addToHistory();

      } catch (error) {
        console.error('Error processing HTML document in iframe:', error);

        // Fallback to regex-based approach
        this.fallbackProcessHTMLDocument(html);

        // Clean up the iframe
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }
    };

    // Set a timeout in case onload doesn't fire
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        try {
          const bodyContent = iframeDoc.body.innerHTML;
          document.execCommand('insertHTML', false, bodyContent);
          this.initializeInteractiveContent();
          this.addToHistory();
        } catch (error) {
          console.error('Timeout error processing HTML document:', error);
          this.fallbackProcessHTMLDocument(html);
        }
        document.body.removeChild(iframe);
      }
    }, 3000); // 3 second timeout
  }

  fallbackProcessHTMLDocument(html) {
    // Fallback regex-based extraction for better performance
    const styles = [];
    const scripts = [];
    const externalScripts = [];

    // Extract style tags
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let styleMatch;
    while ((styleMatch = styleRegex.exec(html)) !== null) {
      styles.push(styleMatch[0]); // Keep the full tag
    }

    // Extract script tags (both inline and external)
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    const scriptTagRegex = /<script[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi;

    // First pass: collect all scripts (both inline and external) in order
    let combinedScripts = [];
    html.replace(scriptRegex, (match, scriptContent, scriptSrc) => {
      if (scriptSrc) {
        combinedScripts.push({ type: 'external', src: scriptSrc });
      } else if (scriptContent.trim()) {
        combinedScripts.push({ type: 'inline', content: scriptContent });
      }
      return match;
    });

    // Separate by type for existing logic compatibility
    combinedScripts.forEach(script => {
      if (script.type === 'external') {
        externalScripts.push(script.src);
      } else if (script.type === 'inline') {
        scripts.push(script.content);
      }
    });

    // Extract body content
    const bodyRegex = /<body[^>]*>([\s\S]*?)<\/body>/i;
    const bodyMatch = bodyRegex.exec(html);
    const bodyContent = bodyMatch ? bodyMatch[1] : html;

    // Combine styles and body content
    let result = '';

    // Add styles first
    if (styles.length > 0) {
      result += styles.join('\n') + '\n';
    }

    // Add body content
    result += bodyContent;

    // Insert the content first
    document.execCommand('insertHTML', false, result);

    // Immediately process Chart.js scripts that may be in the pasted content
    this.processChartJSImmediately(scripts);

    // Then handle external scripts and remaining inline scripts
    if (externalScripts.length > 0 || scripts.length > 0) {
      setTimeout(() => {
        this.loadExternalScriptsAndExecute(externalScripts, scripts);
      }, 0);
    } else {
      // No scripts, but still initialize interactive content for styling
      setTimeout(() => this.initializeInteractiveContent(), 100);
    }
  }

  // Process Chart.js scripts immediately after paste to ensure charts render
  processChartJSImmediately(scripts) {
    const chartScripts = scripts.filter(script =>
      script.includes('new Chart') ||
      script.includes('Chart.js') ||
      script.includes('chartjs')
    );

    if (chartScripts.length === 0) return;

    console.log('Processing Chart.js scripts immediately:', chartScripts.length);

    // First, ensure Chart.js v3.9.1 library is loaded if not already present (SAME AS POPUP)
    if (!window.Chart) {
      // Load Chart.js v3.9.1 (same as popup)
      const chartJSUrl = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js';
      if (document.querySelector(`script[src="${chartJSUrl}"]`) === null) {
        const script = document.createElement('script');
        script.src = chartJSUrl;
        script.onload = () => {
          console.log('Chart.js v3.9.1 library loaded, executing chart scripts');
          this.executeChartScriptsImmediatelyWithVariableFix(chartScripts);
        };
        script.onerror = () => {
          console.error('Failed to load Chart.js v3.9.1 library');
        };
        document.head.appendChild(script);
      }
    } else {
      // Chart.js is already loaded, execute scripts immediately
      setTimeout(() => {
        this.executeChartScriptsImmediatelyWithVariableFix(chartScripts);
      }, 0);
    }
  }

  // Execute Chart.js scripts immediately - ENHANCED with variable replacement fix
  executeChartScriptsImmediately(chartScripts) {
    chartScripts.forEach(script => {
      try {
        console.log('Executing Chart.js script immediately:', script.substring(0, 100) + '...');

        // Execute in global context
        (function() {
          eval(script);
        }).call(window);

        console.log('Chart.js script executed successfully');
      } catch (error) {
        console.error('Error executing Chart.js script immediately:', error);
      }
    });
  }

  // SPECIAL METHOD: Execute Chart.js scripts with variable replacement fix (SAME as POPUP)
  executeChartScriptsImmediatelyWithVariableFix(chartScripts) {
    console.log('🔥 ENHANCED CHART DETECTION ACTIVATED - Variable replacement enabled');

    chartScripts.forEach((script, index) => {
      try {
        console.log(`Processing chart script ${index + 1}:`, script.substring(0, 100) + '...');

        // APPLY VARIABLE REPLACEMENT FIX - Same logic as popup
        let fixedScript = script;

        // Find variable declaration and chart pattern
        const lines = script.split('\n');
        let varDeclaration = '';
        let varName = '';

        // Find variable declaration
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if ((line.startsWith('const') || line.startsWith('let') || line.startsWith('var')) &&
              line.includes('document.getElementById') && line.includes('.getContext')) {
            varDeclaration = line;
            const varMatch = line.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/);
            if (varMatch) {
              varName = varMatch[1];
              console.log(`Found variable '${varName}' in script ${index + 1}`);
            }
            break;
          }
        }

        // Apply variable replacement for ctx2 and ctx3
        if (varName === 'ctx2' || varName === 'ctx3') {
          fixedScript = script.replace(/new\s+Chart\s*\(\s*ctx1\s*,/g, `new Chart(${varName},`);
          console.log(`🔧 FIXED variable replacement: ctx1 -> ${varName} in script ${index + 1}`);
        }

        // Execute the fixed script
        console.log(`Executing chart script ${index + 1} with fixes...`);
        (function() {
          eval(fixedScript);
        }).call(window);

        console.log(`Chart script ${index + 1} executed successfully`);

      } catch (error) {
        console.error(`Error executing chart script ${index + 1} with fixes:`, error);
        // Try original script as fallback
        try {
          (function() {
            eval(script);
          }).call(window);
          console.log(`Chart script ${index + 1} fallback execution successful`);
        } catch (fallbackError) {
          console.error(`Chart script ${index + 1} fallback execution failed:`, fallbackError);
        }
      }
    });
  }

  // Enhanced script loading with Chart.js detection
  loadExternalScriptsAndExecute(externalScripts, scripts) {
    let loadedCount = 0;
    const totalScripts = externalScripts.length;
    const hasChartJS = externalScripts.some(src => src.includes('chart.js') || src.includes('Chart.js') || src.includes('chartjs'));
    const hasD3 = externalScripts.some(src => src.includes('d3'));

    if (totalScripts === 0) {
      // No external scripts, execute inline scripts immediately
      this.executeInlineScripts(scripts);
      // Initialize interactive content after scripts execute
      setTimeout(() => this.initializeInteractiveContent(), 100);
      return;
    }

    // Load external scripts first
    externalScripts.forEach(scriptSrc => {
      const script = document.createElement('script');
      script.src = scriptSrc;
      script.onload = () => {
        console.log('Loaded external script:', scriptSrc);
        loadedCount++;
        if (loadedCount === totalScripts) {
          // All external scripts loaded, now wait for specific libraries if needed
          this.waitForLibrariesAndExecute(scripts, { hasChartJS, hasD3 });
        }
      };
      script.onerror = () => {
        console.error('Failed to load external script:', scriptSrc);
        loadedCount++;
        if (loadedCount === totalScripts) {
          this.waitForLibrariesAndExecute(scripts, { hasChartJS, hasD3 });
        }
      };
      document.head.appendChild(script);
    });
  }

  // Wait for specific libraries to be available before executing scripts
  waitForLibrariesAndExecute(scripts, libraries) {
    let checkCount = 0;
    const maxChecks = 100; // 5 seconds max (100 * 50ms)

    const checkLibraries = () => {
      checkCount++;
      let allReady = true;

      if (libraries.hasChartJS && !window.Chart) {
        console.log('Waiting for Chart.js to load...');
        allReady = false;
      }

      if (libraries.hasD3 && !window.d3) {
        console.log('Waiting for D3.js to load...');
        allReady = false;
      }

      if (allReady) {
        console.log('All required libraries loaded, executing scripts');
        // All required libraries are loaded, execute inline scripts
        this.executeInlineScripts(scripts);
        // Initialize interactive content after scripts execute
        setTimeout(() => this.initializeInteractiveContent(), 100);
      } else if (checkCount < maxChecks) {
        // Wait a bit more and check again
        setTimeout(checkLibraries, 50);
      } else {
        console.warn('Timeout waiting for libraries, proceeding with script execution anyway');
        // Execute scripts even if libraries aren't detected (they might load later)
        this.executeInlineScripts(scripts);
        setTimeout(() => this.initializeInteractiveContent(), 100);
      }
    };

    checkLibraries();
  }

  executeInlineScripts(scripts) {
    scripts.forEach(scriptContent => {
      try {
        // Execute inline script in global scope
        (function() {
          eval(scriptContent);
        }).call(window);
      } catch (error) {
        console.error('Error executing inline script:', error);
      }
    });
  }

  // Enhanced method to handle Chart.js and other interactive content
  initializeInteractiveContent() {
    // Wait a bit for DOM to settle
    setTimeout(() => {
      // Use POPUP-STYLE chart processing - EXACT COPY FROM POPUP
      this.initializeChartsPopupStyle();

      // Initialize other interactive libraries
      this.initializeInteractiveLibraries();

      // Handle other interactive elements
      this.initializeOtherInteractiveElements();
    }, 100);
  }

  // CRITICAL POPUP-STYLE CHART DETECTION - EXACT COPY FROM POPUP
  initializeChartsWithRestart() {
    console.log('🔥 ENHANCED CHART INITIALIZATION - POPUP-STYLE PROCESSING');

    // Force reload Chart.js if not present or wrong version
    if (!window.Chart || (window.Chart && window.Chart.version !== '3.9.1')) {
      console.log('Ensuring Chart.js v3.9.1 is loaded...');

      // Remove old Chart.js if it exists
      if (window.Chart) {
        delete window.Chart;
      }

      // Load Chart.js v3.9.1
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js';
      script.onload = () => {
        console.log('Chart.js v3.9.1 loaded, restarting chart initialization');
        this.initializeCharts(); // Call the main chart init
      };
      script.onerror = () => {
        console.error('Failed to load Chart.js v3.9.1');
      };
      document.head.appendChild(script);
      return;
    }

    this.initializeCharts(); // Normal flow with Chart.js already loaded
  }

  // EXACT POPUP-STYLE CHART INITIALIZATION
  initializeCharts() {
    if (!window.Chart) {
      console.warn('Chart.js not loaded, skipping chart initialization');
      // Try again in 1 second in case Chart.js loads later
      setTimeout(() => {
        if (window.Chart) {
          console.log('Chart.js loaded later, initializing charts now');
          this.initializeCharts();
        }
      }, 1000);
      return;
    }

    // Destroy any existing Chart.js instances to prevent canvas reuse issues
    if (window.Chart && window.Chart.instances) {
      try {
        // Clear all existing chart instances
        Object.keys(window.Chart.instances).forEach(id => {
          const chart = window.Chart.instances[id];
          if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
          }
        });

        // Only clear instances if the property is writable
        if (Object.getOwnPropertyDescriptor(window.Chart, 'instances')?.writable !== false) {
          window.Chart.instances = {};
        }
      } catch (error) {
        console.warn('Could not clear Chart.js instances:', error);
      }
    }

    const editorElement = this.editor || document.getElementById(this.container?.id?.replace('-editor', '-editor')) || document.getElementById('editor');
    if (!editorElement) {
      console.warn('Editor element not found for chart initialization');
      return;
    }

    // Find all canvas elements in the editor that might be charts
    const canvases = editorElement.querySelectorAll('canvas[id]');
    console.log('Found', canvases.length, 'canvas elements to initialize');

    canvases.forEach(canvas => {
      const canvasId = canvas.id;
      if (canvasId && window.Chart) {
        try {
          console.log('Initializing chart for canvas:', canvasId);

          // Look for Chart.js initialization code in script tags within the editor
          const scripts = editorElement.querySelectorAll('script');
          let chartCode = null;
          let chartConfig = null;

          scripts.forEach(script => {
            const content = script.textContent || script.innerText;
            if (content && content.includes(canvasId) && content.includes('new Chart')) {
              console.log('Found Chart.js code for:', canvasId);

              // First try to extract just the chart configuration
              const configMatch = content.match(new RegExp(`new Chart\\(['"]${canvasId}['"],\\s*(\\{[^}]*\\})\\)`, 's'));
              if (configMatch) {
                try {
                  chartConfig = JSON.parse(configMatch[1]);
                  console.log('Extracted chart config:', chartConfig);
                } catch (e) {
                  console.warn('Failed to parse chart config, using fallback');
                }
              }

              // POPUP-STYLE EXACT VARIABLE REPLACEMENT LOGIC
              const lines = content.split('\n');
              let varDeclaration = '';
              let varName = '';

              // Find variable declaration
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if ((line.startsWith('const') || line.startsWith('let') || line.startsWith('var')) &&
                    line.includes(canvasId) && line.includes('document.getElementById')) {
                  varDeclaration = line;
                  const varMatch = line.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/);
                  if (varMatch) {
                    varName = varMatch[1];
                    console.log(`Found variable '${varName}' in script for ${canvasId}`);
                  }
                  break;
                }
              }

              // Find chart call and apply CRITICAL VARIABLE REPLACEMENT
              if (varName && varDeclaration) {
                const newChartIndex = content.indexOf('new Chart(');
                if (newChartIndex !== -1) {
                  // Parse from new Chart to end of statement
                  let braceCount = 0;
                  let inString = false;
                  let stringChar = '';
                  let statementEndIndex = -1;
                  let foundClosingBracket = false;

                  for (let i = newChartIndex; i < content.length && statementEndIndex === -1; i++) {
                    const char = content[i];
                    const prevChar = i > 0 ? content[i - 1] : '';

                    // Handle strings
                    if (!inString && (char === '"' || char === "'")) {
                      inString = true;
                      stringChar = char;
                    } else if (inString && char === stringChar && prevChar !== '\\') {
                      inString = false;
                    } else if (!inString) {
                      if (char === '{') braceCount++;
                      if (char === '}') braceCount--;
                      if (char === ')') {
                        if (braceCount === 0) {
                          statementEndIndex = i + 1;
                          console.log('Found complete Chart call ending at:', statementEndIndex);
                          break;
                        }
                      }
                    }
                  }

                  if (statementEndIndex !== -1) {
                    let chartCall = content.substring(newChartIndex, statementEndIndex).trim();

                    // CRITICAL POPUP-STYLE VARIABLE REPLACEMENT
                    if (varName === 'ctx2' || varName === 'ctx3') {
                      chartCall = chartCall.replace(/new Chart\(ctx1,/g, `new Chart(${varName},`);
                      chartCall = chartCall.replace(/new Chart\(ctx2/g, `new Chart(${varName}`);
                      chartCall = chartCall.replace(/new Chart\(ctx3/g, `new Chart(${varName}`);
                      console.log('🔧 FIXED variable replacement in chart call');
                    }

                    chartCode = varDeclaration + '\n' + chartCall;
                    console.log('✅ COMPLETE EXTRACTED CODE FOR', canvasId);
                    console.log('Variable declaration:', varDeclaration);
                  }
                }
              }

              // Fallback for direct patterns
              if (!chartCode) {
                const directChartMatch = content.match(new RegExp(`new Chart\\s*\\(\\s*document\.getElementById\\(\\s*['"]${canvasId}['"]\\s*\\)[^}]*\\}\\s*\\);`, 's'));
                if (directChartMatch) {
                  chartCode = directChartMatch[0];
                  console.log('✅ Found direct document.getElementById pattern');
                }
              }

              if (chartCode) {
                console.log('Executing Chart.js initialization for:', canvasId);
                try {
                  eval(chartCode);
                  console.log('Chart initialized successfully:', canvasId);
                } catch (error) {
                  console.error('Error executing chart code for:', canvasId, error);
                }
              }
            }
          });

          if (chartConfig && !chartCode) {
            // Use extracted config directly
            this.createChartFromConfig(canvasId, chartConfig);
          }
        } catch (error) {
          console.error('Error initializing chart:', canvasId, error);
        }
      }
    });
  }

  // Initialize charts with retry logic for better reliability
  initializeChartsWithRetry() {
    const maxRetries = 5;
    let retryCount = 0;

    const tryInitializeCharts = () => {
      try {
        this.initializeCharts();
        // If we get here without errors, charts are initialized
      } catch (error) {
        console.warn('Chart initialization failed, retrying...', error);
        retryCount++;
        if (retryCount < maxRetries) {
          setTimeout(tryInitializeCharts, 200 * retryCount); // Exponential backoff
        } else {
          console.error('Chart initialization failed after', maxRetries, 'retries');
        }
      }
    };

    tryInitializeCharts();
  }

  // Enhanced Chart.js initialization
  initializeCharts() {
    if (!window.Chart) {
      console.warn('Chart.js not loaded, skipping chart initialization');
      // Try again in 1 second in case Chart.js loads later
      setTimeout(() => {
        if (window.Chart) {
          console.log('Chart.js loaded later, initializing charts now');
          this.initializeCharts();
        }
      }, 1000);
      return;
    }

    // Find all canvas elements in the editor that might be charts
    const canvases = this.editor.querySelectorAll('canvas[id]');
    console.log('Found', canvases.length, 'canvas elements to initialize');

    canvases.forEach(canvas => {
      const canvasId = canvas.id;
      if (canvasId) {
        try {
          // Clear any existing chart instance
          if (window.Chart.instances && window.Chart.instances[canvasId]) {
            window.Chart.instances[canvasId].destroy();
          }

          // Try to find and execute chart initialization code
          this.initializeChartById(canvasId);

        } catch (error) {
          console.error('Error initializing chart:', canvasId, error);
          // Try to reinitialize after a short delay
          setTimeout(() => {
            try {
              this.initializeChartById(canvasId);
            } catch (retryError) {
              console.error('Retry failed for chart:', canvasId, retryError);
              // Last resort: try to execute any chart code found in scripts
              this.attemptChartRecovery(canvasId);
            }
          }, 500);
        }
      }
    });
  }

  // Attempt to recover chart initialization if other methods fail
  attemptChartRecovery(canvasId) {
    console.log('Attempting chart recovery for:', canvasId);
    const scripts = this.editor.querySelectorAll('script');
    scripts.forEach(script => {
      const content = script.textContent || script.innerText;
      if (content && content.includes(canvasId) && content.includes('new Chart')) {
        try {
          // Try direct execution as last resort
          eval(content);
          console.log('Chart recovery successful for:', canvasId);
        } catch (error) {
          console.error('Chart recovery failed for:', canvasId, error);
        }
      }
    });
  }

  // Initialize other interactive libraries
  initializeInteractiveLibraries() {
    // Initialize D3.js visualizations
    this.initializeD3Visualizations();

    // Initialize other charting libraries
    this.initializeOtherChartLibraries();

    // Initialize custom interactive elements
    this.initializeCustomInteractiveElements();
  }

  // Initialize D3.js visualizations
  initializeD3Visualizations() {
    if (window.d3) {
      try {
        // Find D3.js containers and initialize them
        const d3Containers = this.editor.querySelectorAll('[data-d3-chart]');
        d3Containers.forEach(container => {
          const chartType = container.getAttribute('data-d3-chart');
          const dataAttr = container.getAttribute('data-d3-data');

          if (chartType && dataAttr) {
            try {
              const data = JSON.parse(dataAttr);
              this.initializeD3Chart(container, chartType, data);
            } catch (error) {
              console.error('Error parsing D3 data:', error);
            }
          }
        });
      } catch (error) {
        console.error('Error initializing D3.js:', error);
      }
    }
  }

  // Initialize D3 chart
  initializeD3Chart(container, chartType, data) {
    // Clear existing content
    container.innerHTML = '';

    const width = container.offsetWidth || 400;
    const height = container.offsetHeight || 300;

    const svg = window.d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Basic chart implementations
    switch (chartType) {
      case 'bar':
        this.createD3BarChart(svg, data, width, height);
        break;
      case 'line':
        this.createD3LineChart(svg, data, width, height);
        break;
      case 'pie':
        this.createD3PieChart(svg, data, width, height);
        break;
      default:
        console.warn('Unsupported D3 chart type:', chartType);
    }
  }

  // Create D3 bar chart
  createD3BarChart(svg, data, width, height) {
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const x = window.d3.scaleBand()
      .domain(data.map(d => d.label))
      .range([0, innerWidth])
      .padding(0.1);

    const y = window.d3.scaleLinear()
      .domain([0, window.d3.max(data, d => d.value)])
      .nice()
      .range([innerHeight, 0]);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(window.d3.axisBottom(x));

    g.append('g')
      .attr('class', 'y-axis')
      .call(window.d3.axisLeft(y));

    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.label))
      .attr('y', d => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', d => innerHeight - y(d.value))
      .attr('fill', 'steelblue');
  }

  // Create D3 line chart
  createD3LineChart(svg, data, width, height) {
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const x = window.d3.scaleLinear()
      .domain(window.d3.extent(data, d => d.x))
      .range([0, innerWidth]);

    const y = window.d3.scaleLinear()
      .domain(window.d3.extent(data, d => d.y))
      .nice()
      .range([innerHeight, 0]);

    const line = window.d3.line()
      .x(d => x(d.x))
      .y(d => y(d.y));

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(window.d3.axisBottom(x));

    g.append('g')
      .attr('class', 'y-axis')
      .call(window.d3.axisLeft(y));

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 2)
      .attr('d', line);
  }

  // Create D3 pie chart
  createD3PieChart(svg, data, width, height) {
    const radius = Math.min(width, height) / 2 - 40;

    const color = window.d3.scaleOrdinal()
      .domain(data.map(d => d.label))
      .range(window.d3.schemeCategory10);

    const pie = window.d3.pie()
      .value(d => d.value);

    const arc = window.d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter().append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.label));

    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .text(d => d.data.label);
  }

  // Initialize other charting libraries
  initializeOtherChartLibraries() {
    // Support for Plotly.js
    if (window.Plotly) {
      this.initializePlotlyCharts();
    }

    // Support for ApexCharts
    if (window.ApexCharts) {
      this.initializeApexCharts();
    }
  }

  // Initialize Plotly charts
  initializePlotlyCharts() {
    const plotlyContainers = this.editor.querySelectorAll('[data-plotly]');
    plotlyContainers.forEach(container => {
      const dataAttr = container.getAttribute('data-plotly-data');
      const layoutAttr = container.getAttribute('data-plotly-layout');

      if (dataAttr && layoutAttr) {
        try {
          const data = JSON.parse(dataAttr);
          const layout = JSON.parse(layoutAttr);
          window.Plotly.newPlot(container, data, layout);
        } catch (error) {
          console.error('Error initializing Plotly chart:', error);
        }
      }
    });
  }

  // Initialize ApexCharts
  initializeApexCharts() {
    const apexContainers = this.editor.querySelectorAll('[data-apex-chart]');
    apexContainers.forEach(container => {
      const optionsAttr = container.getAttribute('data-apex-options');

      if (optionsAttr) {
        try {
          const options = JSON.parse(optionsAttr);
          const chart = new window.ApexCharts(container, options);
          chart.render();
        } catch (error) {
          console.error('Error initializing ApexChart:', error);
        }
      }
    });
  }

  // Initialize custom interactive elements
  initializeCustomInteractiveElements() {
    // Initialize accordions
    this.initializeAccordions();

    // Initialize tabs
    this.initializeTabs();

    // Initialize tooltips
    this.initializeTooltips();

    // Initialize modals
    this.initializeModals();
  }

  // Initialize accordion elements
  initializeAccordions() {
    const accordions = this.editor.querySelectorAll('.accordion, [data-accordion]');
    accordions.forEach(accordion => {
      const headers = accordion.querySelectorAll('.accordion-header, .accordion-toggle');
      headers.forEach(header => {
        header.addEventListener('click', () => {
          const content = header.nextElementSibling;
          if (content) {
            content.classList.toggle('active');
            header.classList.toggle('active');
          }
        });
      });
    });
  }

  // Initialize tab elements
  initializeTabs() {
    const tabContainers = this.editor.querySelectorAll('.tabs-container, [data-tabs]');
    tabContainers.forEach(container => {
      const tabButtons = container.querySelectorAll('.tab-button, .tab-btn');
      const tabContents = container.querySelectorAll('.tab-content, .tab-pane');

      tabButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
          // Remove active class from all buttons and contents
          tabButtons.forEach(btn => btn.classList.remove('active'));
          tabContents.forEach(content => content.classList.remove('active'));

          // Add active class to clicked button and corresponding content
          button.classList.add('active');
          if (tabContents[index]) {
            tabContents[index].classList.add('active');
          }
        });
      });
    });
  }

  // Initialize tooltips
  initializeTooltips() {
    const tooltipElements = this.editor.querySelectorAll('[data-tooltip], [title]');
    tooltipElements.forEach(element => {
      const tooltipText = element.getAttribute('data-tooltip') || element.getAttribute('title');

      if (tooltipText) {
        element.addEventListener('mouseenter', (e) => {
          this.showTooltip(e.target, tooltipText);
        });

        element.addEventListener('mouseleave', () => {
          this.hideTooltip();
        });
      }
    });
  }

  // Show tooltip
  showTooltip(element, text) {
    // Remove existing tooltip
    this.hideTooltip();

    const tooltip = document.createElement('div');
    tooltip.className = 'editor-tooltip';
    tooltip.textContent = text;

    document.body.appendChild(tooltip);

    // Position tooltip
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) + 'px';
    tooltip.style.top = rect.top - 30 + 'px';

    // Show tooltip
    setTimeout(() => tooltip.classList.add('show'), 10);
  }

  // Hide tooltip
  hideTooltip() {
    const tooltip = document.querySelector('.editor-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  }

  // Initialize modals
  initializeModals() {
    const modalTriggers = this.editor.querySelectorAll('[data-modal-trigger]');
    modalTriggers.forEach(trigger => {
      const modalId = trigger.getAttribute('data-modal-trigger');
      const modal = this.editor.querySelector(`#${modalId}`);

      if (modal) {
        trigger.addEventListener('click', () => {
          modal.classList.add('show');
        });

        // Close modal when clicking outside or on close button
        modal.addEventListener('click', (e) => {
          if (e.target === modal || e.target.classList.contains('modal-close')) {
            modal.classList.remove('show');
          }
        });
      }
    });
  }

  // Initialize a specific chart by canvas ID
  initializeChartById(canvasId) {
    const canvas = this.editor.querySelector(`#${canvasId}`);
    if (!canvas) return;

    console.log('Initializing chart for canvas:', canvasId);

    // Look for Chart.js initialization code in script tags within the editor
    const scripts = this.editor.querySelectorAll('script');
    let chartCode = null;
    let chartConfig = null;

    scripts.forEach(script => {
      const content = script.textContent || script.innerText;
      if (content && content.includes(canvasId) && content.includes('new Chart')) {
        console.log('Found Chart.js code for:', canvasId);

        // First try to extract just the chart configuration
        const configMatch = content.match(new RegExp(`new Chart\\(['"]${canvasId}['"],\\s*(\\{[^}]*\\})\\)`, 's'));
        if (configMatch) {
          try {
            chartConfig = JSON.parse(configMatch[1]);
            console.log('Extracted chart config:', chartConfig);
          } catch (e) {
            console.warn('Failed to parse chart config, using fallback');
          }
        }

        // Extract the full chart initialization code as fallback
        const lines = content.split('\n');
        const chartLines = [];
        let inChartBlock = false;
        let braceCount = 0;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();

          if (line.includes(`new Chart(${canvasId}`) || line.includes(`new Chart('${canvasId}'`) || line.includes(`new Chart("${canvasId}"`)) {
            inChartBlock = true;
            braceCount = 0;
          }

          if (inChartBlock) {
            chartLines.push(lines[i]);

            // Count braces to find the end of the chart initialization
            braceCount += (line.match(/\{/g) || []).length;
            braceCount -= (line.match(/\}/g) || []).length;

            if (braceCount <= 0 && chartLines.length > 1) {
              break;
            }
          }
        }

        if (chartLines.length > 0) {
          chartCode = chartLines.join('\n');
        }
      }
    });

    if (chartCode) {
      // Wait for Chart.js to be available before executing
      this.waitForChartJSAndExecute(chartCode, canvasId);
    } else if (chartConfig) {
      // Use extracted config directly
      this.createChartFromConfig(canvasId, chartConfig);
    }
  }

  // Create chart directly from config object
  createChartFromConfig(canvasId, config) {
    const canvas = this.editor.querySelector(`#${canvasId}`);
    if (!canvas || !window.Chart) return;

    try {
      console.log('Creating chart directly from config for:', canvasId);
      const chart = new window.Chart(canvas, config);
      console.log('Chart created successfully:', canvasId);
      return chart;
    } catch (error) {
      console.error('Error creating chart from config:', error);
      // Clean fallback
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.background = '#f8f9fa';
    }
  }

  // Wait for Chart.js to be loaded before executing chart code
  waitForChartJSAndExecute(chartCode, canvasId) {
    const maxRetries = 10;
    let retryCount = 0;

    const checkAndExecute = () => {
      if (window.Chart) {
        try {
          // Execute the chart initialization code in a safe context
          this.executeChartCode(chartCode);
          console.log('Successfully initialized chart:', canvasId);
        } catch (error) {
          console.error('Error executing chart code for:', canvasId, error);
        }
      } else {
        retryCount++;
        if (retryCount < maxRetries) {
          // Wait 100ms and try again
          setTimeout(checkAndExecute, 100);
        } else {
          console.error('Chart.js not loaded after', maxRetries, 'retries for chart:', canvasId);
        }
      }
    };

    checkAndExecute();
  }

  // Execute chart code safely
  executeChartCode(code) {
    try {
      // Create a safe execution context
      const safeEval = new Function('window', 'document', 'Chart', code);
      safeEval(window, document, window.Chart);
    } catch (error) {
      console.error('Error in safe chart execution:', error);
      // Fallback to regular eval if safe eval fails
      try {
        eval(code);
      } catch (fallbackError) {
        console.error('Fallback chart execution also failed:', fallbackError);
      }
    }
  }

  reinitializeChart(canvasId) {
    // Look for Chart.js initialization code in script tags within the editor
    const scripts = this.editor.querySelectorAll('script');
    scripts.forEach(script => {
      const content = script.textContent || script.innerText;
      if (content && content.includes(canvasId) && content.includes('new Chart')) {
        try {
          // Execute the chart initialization code
          eval(content);
        } catch (error) {
          console.error('Error executing chart initialization:', error);
        }
      }
    });
  }

  // EXACT POPUP-STYLE CHART INITIALIZATION - COPIED FROM POPUP
  initializeChartsPopupStyle() {
    if (!this.editor) return;

    // Destroy any existing Chart.js instances to prevent canvas reuse issues
    if (window.Chart && window.Chart.instances) {
      try {
        // Clear all existing chart instances
        Object.keys(window.Chart.instances).forEach(id => {
          const chart = window.Chart.instances[id];
          if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
          }
        });

        // Only clear instances if the property is writable
        if (Object.getOwnPropertyDescriptor(window.Chart, 'instances')?.writable !== false) {
          window.Chart.instances = {};
        }
      } catch (error) {
        console.warn('Could not clear Chart.js instances:', error);
      }
    }

    const canvases = this.editor.querySelectorAll('canvas[id]');
    canvases.forEach(canvas => {
      const canvasId = canvas.id;
      if (canvasId && window.Chart) {
        try {
          console.log('🎯 Initializing chart for canvas:', canvasId);

          // Look for Chart.js initialization code in script tags within the editor
          const scripts = this.editor.querySelectorAll('script');
          let chartCode = null;
          let chartConfig = null;

          scripts.forEach(script => {
            const content = script.textContent || script.innerText;
            if (content && content.includes(canvasId) && content.includes('new Chart')) {
              console.log('Found Chart.js code for:', canvasId);

              // First try to extract just the chart configuration
              const configMatch = content.match(new RegExp(`new Chart\\(['"]${canvasId}['"],\\s*(\\{[^}]*\\})\\)`, 's'));
              if (configMatch) {
                try {
                  chartConfig = JSON.parse(configMatch[1]);
                  console.log('Extracted chart config:', chartConfig);
                } catch (e) {
                  console.warn('Failed to parse chart config, using fallback');
                }
              }

              // FIND VARIABLE DECLARATION FIRST
              const lines = content.split('\n');
              let varDeclaration = '';
              let varName = '';

              for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if ((line.startsWith('const') || line.startsWith('let') || line.startsWith('var')) &&
                    line.includes(canvasId) && line.includes('document.getElementById')) {

                  console.log('FOUND variable declaration:', line);
                  varDeclaration = line;

                  // Extract variable name
                  const varMatch = line.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/);
                  if (varMatch) {
                    varName = varMatch[1];
                    console.log('EXTRACTED variable name:', varName);
                  }
                  break;
                }
              }

              // FIND CHART CALL
              if (varName && varDeclaration) {
                const newChartIndex = content.indexOf('new Chart(');
                let chartCall = '';
                let completeChartCode = '';

                if (newChartIndex !== -1) {
                  console.log('FOUND new Chart call at position:', newChartIndex);

                  // Parse from new Chart to )};
                  let braceCount = 0;
                  let inString = false;
                  let stringChar = '';
                  let statementEndIndex = -1;
                  let foundClosingBracket = false;

                  for (let i = newChartIndex; i < content.length && statementEndIndex === -1; i++) {
                    const char = content[i];
                    const prevChar = i > 0 ? content[i - 1] : '';

                    // Handle strings
                    if (!inString && (char === '"' || char === "'")) {
                      inString = true;
                      stringChar = char;
                    } else if (inString && char === stringChar && prevChar !== '\\') {
                      inString = false;
                    } else if (!inString) {
                      if (char === '{') braceCount++;
                      if (char === '}') braceCount--;
                      if (char === ')') {
                        if (braceCount === 0) {
                          statementEndIndex = i + 1;
                          console.log('FOUND complete Chart call ending at:', statementEndIndex);
                          break;
                        }
                      }
                    }
                  }

                  // Extract and combine - FIX the variable replacement
                  if (statementEndIndex !== -1) {
                    chartCall = content.substring(newChartIndex, statementEndIndex + 1).trim();

                    // CRITICAL FIX: Replace ctx1 with the correct variable name in the chart call
                    if (varName === 'ctx2' || varName === 'ctx3') {
                      chartCall = chartCall.replace('new Chart(ctx1,', 'new Chart(' + varName + ',');
                      console.log('🔧 FIXED variable replacement in chart call');
                    }

                    completeChartCode = varDeclaration + '\n' + chartCall;

                    console.log('✅ COMPLETE EXTRACTED CODE FOR', canvasId);
                    console.log('Variable declaration:', varDeclaration);
                    console.log('Chart call (first 100 chars):', chartCall.substring(0, 100));
                    console.log('Total code length:', completeChartCode.length);

                    chartCode = completeChartCode;
                  } else {
                    console.log('❌ Failed to find complete Chart call');
                  }
                } else {
                  console.log('❌ No new Chart( call found');
                }
              } else {
                console.log('❌ No variable declaration found for canvas:', canvasId);
                // Fallback for direct document.getElementById patterns
                const directChartMatch = content.match(new RegExp(`new Chart\\s*\\(\\s*document\.getElementById\\(\\s*['"]${canvasId}['"]\\s*\\)[^}]*\\}\\s*\\);`, 's'));
                if (directChartMatch) {
                  chartCode = directChartMatch[0];
                  console.log('✅ Found direct document.getElementById pattern');
                }
              }
            }
          });

          // This was already in the editor's old chart system
          if (chartConfig && !chartCode) {
            // Use extracted config directly
            this.createChartFromConfig(canvasId, chartConfig);
          } else if (chartCode) {
            console.log('🔥 Executing chart code for:', canvasId);
            try {
              // Execute the chart code in the current context
              (function() {
                eval(chartCode);
              }).call(window);
              console.log('🎉 Chart created successfully for:', canvasId);
            } catch (error) {
              console.error('❌ Error executing chart code for:', canvasId, error);
            }
          } else {
            console.warn('⚠️ No chart code found for canvas:', canvasId);
          }
        } catch (e) {
          console.warn('❌ Chart init failed for:', canvasId, e.message);
          console.log('Failed to process chart for canvas:', canvasId);
        }
      }
    });
  }

  initializeOtherInteractiveElements() {
    // Handle other interactive elements like timelines, etc.
    const timelineElements = this.editor.querySelectorAll('.timeline-visual');
    timelineElements.forEach(timeline => {
      // Ensure timeline styles are applied
      timeline.style.display = 'flex';
      timeline.style.alignItems = 'center';
      timeline.style.overflowX = 'auto !important';
    });

    // Handle chart containers with POPUP-STYLE responsive styling
    const chartContainers = this.editor.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
      container.style.maxWidth = '100% !important';
      container.style.margin = '20px 0 !important';
      container.style.padding = '15px !important';
      container.style.background = '#f8fafc !important';
      container.style.borderRadius = '8px !important';
      container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1) !important';
      container.style.border = '1px solid #e5e7eb !important';
    });

    // POPUP-STYLE canvas responsive styling - CRITICAL FOR EDITOR
    const canvases = this.editor.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      canvas.style.maxWidth = '100% !important';
      canvas.style.height = 'auto !important';
      canvas.style.display = 'block !important';
      canvas.style.margin = '0 auto !important';
      canvas.style.borderRadius = '6px !important';
      canvas.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15) !important';
    });

    // POPUP-STYLE chart container fallback
    chartContainers.forEach(container => {
      const canvas = container.querySelector('canvas');
      if (canvas) {
        canvas.style.maxHeight = '350px !important';
        canvas.style.width = '100% !important';
        canvas.style.objectFit = 'contain !important';
      }
    });

    // POPUP-STYLE tables and responsive elements
    const tables = this.editor.querySelectorAll('table');
    tables.forEach(table => {
      table.style.width = '100% !important';
      table.style.maxWidth = '100% !important';
      table.style.fontSize = '0.9em !important';
      table.style.margin = '15px 0 !important';
    });

    // Table cells
    const tableCells = this.editor.querySelectorAll('th, td');
    tableCells.forEach(cell => {
      cell.style.padding = '8px 4px !important';
      cell.style.whiteSpace = 'nowrap !important';
      cell.style.overflow = 'hidden !important';
      cell.style.textOverflow = 'ellipsis !important';
    });

    // POPUP-STYLE content containers
    const contentContainers = this.editor.querySelectorAll('.container, .evidence-box, .calculation-box, .refutation-box');
    contentContainers.forEach(container => {
      container.style.width = '100% !important';
      container.style.maxWidth = '100% !important';
      container.style.margin = '0 !important';
      container.style.padding = '20px !important';
    });

    // POPUP-STYLE headings
    const headings = this.editor.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      heading.style.fontSize = `${2.5 - (level * 0.2)}em !important`;
      heading.style.marginTop = level === 1 ? '20px !important' : `${25 - (level * 10)}px !important`;
    });

    // POPUP-STYLE blockquotes
    const blockquotes = this.editor.querySelectorAll('blockquote');
    blockquotes.forEach(blockquote => {
      blockquote.style.margin = '15px 0 !important';
    });

    // POPUP-STYLE timeline styling
    const timelinePoints = this.editor.querySelectorAll('.timeline-point');
    timelinePoints.forEach(point => {
      point.style.whiteSpace = 'nowrap !important';
    });
  }

  // CRITICAL POPUP-STYLE CHART DETECTION - EXACT COPY FROM POPUP
  initializeChartsWithRestart() {
    console.log('🔥 ENHANCED CHART INITIALIZATION - POPUP-STYLE PROCESSING');

    // Force reload Chart.js if not present or wrong version
    if (!window.Chart || (window.Chart && window.Chart.version !== '3.9.1')) {
      console.log('Ensuring Chart.js v3.9.1 is loaded...');

      // Remove old Chart.js if it exists
      if (window.Chart) {
        delete window.Chart;
      }

      // Load Chart.js v3.9.1
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js';
      script.onload = () => {
        console.log('Chart.js v3.9.1 loaded, restarting chart initialization');
        this.initializeCharts(); // Call the main chart init
      };
      script.onerror = () => {
        console.error('Failed to load Chart.js v3.9.1');
      };
      document.head.appendChild(script);
      return;
    }

    this.initializeCharts(); // Normal flow with Chart.js already loaded
  }
  
  formatPlainText(text) {
    // Split into lines
    const lines = text.split('\n');
    const formatted = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Skip empty lines
      if (!trimmed) {
        formatted.push('<br>');
        return;
      }
      
      // Detect headers (# Heading)
      if (trimmed.match(/^#{1,6}\s+/)) {
        const level = trimmed.match(/^(#{1,6})\s+/)[1].length;
        const content = trimmed.replace(/^#{1,6}\s+/, '');
        formatted.push(`<h${level}>${this.escapeHtml(content)}</h${level}>`);
        return;
      }
      
      // Detect lists
      if (trimmed.match(/^[\*\-\+]\s+/)) {
        const content = trimmed.replace(/^[\*\-\+]\s+/, '');
        formatted.push(`<li>${this.escapeHtml(content)}</li>`);
        return;
      }
      
      if (trimmed.match(/^\d+\.\s+/)) {
        const content = trimmed.replace(/^\d+\.\s+/, '');
        formatted.push(`<li>${this.escapeHtml(content)}</li>`);
        return;
      }
      
      // Detect blockquotes (> Quote)
      if (trimmed.match(/^>\s+/)) {
        const content = trimmed.replace(/^>\s+/, '');
        formatted.push(`<blockquote>${this.escapeHtml(content)}</blockquote>`);
        return;
      }
      
      // Regular paragraph
      formatted.push(`<p>${this.escapeHtml(trimmed)}</p>`);
    });
    
    // Wrap consecutive list items
    let result = formatted.join('');
    result = result.replace(/(<li>.*?<\/li>)+/g, (match) => {
      return `<ul>${match}</ul>`;
    });
    
    return result;
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  updateWordCount() {
    const text = this.editor.innerText || this.editor.textContent || '';
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const lines = text.split('\n').length;
    
    this.state.wordCount = words.length;
    this.state.charCount = text.length;
    
    if (this.statusbar) {
      const wordCountEl = document.getElementById('word-count');
      const charCountEl = document.getElementById('char-count');
      const lineCountEl = document.getElementById('line-count');
      
      if (wordCountEl) wordCountEl.textContent = this.state.wordCount;
      if (charCountEl) charCountEl.textContent = this.state.charCount;
      if (lineCountEl) lineCountEl.textContent = lines;
    }
  }
  
  updateToolbarState() {
    if (!this.toolbar) return;
    
    const buttons = this.toolbar.querySelectorAll('[data-command]');
    
    buttons.forEach(button => {
      const command = button.dataset.command;
      
      // Skip custom commands
      if (['heading', 'taskList', 'code', 'codeBlock', 'highlight', 'emoji', 
           'specialChars', 'findReplace', 'fullscreen', 'print', 'toggleTheme'].includes(command)) {
        return;
      }
      
      try {
        const state = document.queryCommandState(command);
        button.classList.toggle('active', state);
      } catch (e) {
        // Command not supported
      }
    });
  }
  
  saveSelection() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      this.state.savedSelection = selection.getRangeAt(0);
    }
  }
  
  restoreSelection() {
    if (this.state.savedSelection) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(this.state.savedSelection);
    }
  }
  
  addToHistory() {
    const content = this.editor.innerHTML;
    
    // Don't add if content hasn't changed
    if (this.state.history[this.state.historyIndex] === content) {
      return;
    }
    
    // Remove any redo history
    this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
    
    // Add new state
    this.state.history.push(content);
    this.state.historyIndex++;
    
    // Limit history size
    if (this.state.history.length > this.state.maxHistory) {
      this.state.history.shift();
      this.state.historyIndex--;
    }
  }
  
  undo() {
    if (this.state.historyIndex > 0) {
      this.state.historyIndex--;
      this.editor.innerHTML = this.state.history[this.state.historyIndex];
      this.updateWordCount();
    }
  }
  
  redo() {
    if (this.state.historyIndex < this.state.history.length - 1) {
      this.state.historyIndex++;
      this.editor.innerHTML = this.state.history[this.state.historyIndex];
      this.updateWordCount();
    }
  }
  
  setupAutosave() {
    setInterval(() => {
      this.save();
    }, this.options.autosaveInterval);
  }
  
  save() {
    const content = this.getContent();
    localStorage.setItem(`editor_content_${this.container.id}`, content);
    localStorage.setItem('editor-theme', this.state.currentTheme);
    
    if (this.statusbar) {
      const status = this.statusbar.querySelector('#save-status');
      if (status) {
        status.textContent = 'Saved at ' + new Date().toLocaleTimeString();
        setTimeout(() => {
          status.textContent = 'Ready';
        }, 3000);
      }
    }
    
    if (this.options.onSave) {
      this.options.onSave(content);
    }
  }
  
  load() {
    const content = localStorage.getItem(`editor_content_${this.container.id}`);
    const theme = localStorage.getItem('editor-theme');

    if (content) {
      this.setContent(content);
    }

    if (theme && (theme === 'light' || theme === 'dark')) {
      this.applyTheme(theme);
    } else {
      // If no valid theme in localStorage, use auto-detection
      this.detectTheme();
    }
  }
  
  // Public API
  setContent(html) {
    // Extract and apply any styles in the content before setting
    if (html && html.includes('<style')) {
      const { content, styles } = this.extractAndApplyStyles(html);
      this.editor.innerHTML = content;
    } else {
      this.editor.innerHTML = html;
    }
    this.updateWordCount();
    this.addToHistory();
  }

  syncContent() {
    // Sync editor content with hidden textarea if it exists
    const textarea = document.getElementById(this.container.id + '-textarea') ||
                     document.getElementById(this.container.id.replace('-editor', '-editor-textarea'));
    if (textarea) {
      textarea.value = this.getContent();
    }
  }

  getContent() {
    // Get the current HTML content
    let content = this.editor.innerHTML;

    // If we have extracted styles, include them in the saved content
    if (this.extractedStyles && this.extractedStyles.length > 0) {
      // Create a style tag with all extracted styles
      const styleTag = `<style>${this.extractedStyles.join('\n')}</style>`;

      // Insert the style tag at the beginning of the content
      content = styleTag + content;
    }

    return content;
  }
  
  getText() {
    return this.editor.innerText || this.editor.textContent || '';
  }
  
  clear() {
    this.editor.innerHTML = '';
    this.extractedStyles = []; // Clear extracted styles
    this.updateWordCount();
    this.addToHistory();
  }
  
  focus() {
    this.editor.focus();
  }
  
  destroy() {
    // Clean up event listeners
    if (this.visibilityInterval) {
      clearInterval(this.visibilityInterval);
    }
    
    if (this.autosaveInterval) {
      clearInterval(this.autosaveInterval);
    }
    
    // Clear container
    this.container.innerHTML = '';
  }
}

// Initialize editors on page load
document.addEventListener('DOMContentLoaded', function() {
  // Initialize admin editor
  const adminEditor = document.getElementById('admin-content-editor');
  if (adminEditor) {
    window.adminEditor = new EnhancedEditor('admin-content-editor', {
      placeholder: 'Start writing your article...',
      toolbar: true,
      statusbar: true,
      autosave: true,
      theme: 'auto'
    });
    
    // Load saved content
    window.adminEditor.load();
    
    // Sync with hidden textarea if exists
    const textarea = document.getElementById('admin-content-editor-textarea');
    if (textarea) {
      window.adminEditor.options.onChange = (content) => {
        textarea.value = content;
      };
    }
  }
  
  // Initialize edit editor
  const editEditor = document.getElementById('edit-content-editor');
  if (editEditor) {
    window.editEditor = new EnhancedEditor('edit-content-editor', {
      placeholder: 'Edit your article...',
      toolbar: true,
      statusbar: true,
      autosave: true,
      theme: 'auto'
    });
    
    // Load saved content
    window.editEditor.load();
    
    // Sync with hidden textarea if exists
    const textarea = document.getElementById('edit-content-editor-textarea');
    if (textarea) {
      window.editEditor.options.onChange = (content) => {
        textarea.value = content;
      };
    }
  }
  
  // Initialize any other editors with data-editor attribute
  const dataEditors = document.querySelectorAll('[data-editor="true"]');
  dataEditors.forEach(element => {
    if (!element.id || window[element.id + 'Editor']) return;
    
    const editor = new EnhancedEditor(element.id, {
      placeholder: element.getAttribute('data-placeholder') || 'Start typing...',
      toolbar: element.getAttribute('data-toolbar') !== 'false',
      statusbar: element.getAttribute('data-statusbar') !== 'false',
      autosave: element.getAttribute('data-autosave') === 'true',
      theme: element.getAttribute('data-theme') || 'auto'
    });
    
    editor.load();
    window[element.id + 'Editor'] = editor;
  });
});

// Export for use in other scripts
window.EnhancedEditor = EnhancedEditor;
