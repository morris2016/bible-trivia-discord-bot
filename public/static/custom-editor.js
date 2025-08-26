// Custom Word-like Rich Text Editor - Complete Edition
// Built from scratch for precise formatting control with all features

class CustomEditor {
  constructor(elementId) {
    this.editor = document.getElementById(elementId);
    this.hiddenTextarea = document.getElementById(elementId + '-textarea');
    
    if (!this.editor) return;
    
    this.setupEditor();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
  }

  setupEditor() {
    // Make sure the editor is contenteditable
    this.editor.contentEditable = true;
    this.editor.style.minHeight = '400px';
    this.editor.style.padding = '1rem';
    this.editor.style.border = '1px solid #d1d5db';
    this.editor.style.borderRadius = '6px';
    this.editor.style.fontSize = '14px';
    this.editor.style.lineHeight = '1.6';
    this.editor.style.fontFamily = 'Inter, sans-serif';
    this.editor.style.outline = 'none';
    this.editor.style.backgroundColor = '#ffffff';

    // Add placeholder behavior
    this.updatePlaceholder();
    
    // Sync content with hidden textarea
    this.syncContent();
  }

  setupEventListeners() {
    // Update hidden textarea when content changes
    this.editor.addEventListener('input', () => {
      this.syncContent();
      this.updatePlaceholder();
    });

    this.editor.addEventListener('keyup', () => this.syncContent());
    this.editor.addEventListener('paste', () => {
      setTimeout(() => this.syncContent(), 10);
    });
  }

  setupKeyboardShortcuts() {
    this.editor.addEventListener('keydown', (e) => {
      // Ctrl+B for bold
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        this.toggleFormat('bold');
      }
      // Ctrl+I for italic
      else if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        this.toggleFormat('italic');
      }
      // Ctrl+U for underline
      else if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        this.toggleFormat('underline');
      }
      // Ctrl+Z for undo
      else if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        this.undo();
      }
      // Ctrl+Y for redo
      else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        this.redo();
      }
    });
  }

  updatePlaceholder() {
    const isEmpty = this.editor.textContent.trim() === '';
    const placeholder = this.editor.getAttribute('data-placeholder');
    
    if (isEmpty && placeholder) {
      this.editor.style.color = '#9ca3af';
      if (this.editor.innerHTML === '' || this.editor.textContent === placeholder) {
        this.editor.textContent = placeholder;
      }
    } else {
      this.editor.style.color = '#000000';
      if (this.editor.textContent === placeholder) {
        this.editor.innerHTML = '';
      }
    }
  }

  syncContent() {
    if (this.hiddenTextarea) {
      const placeholder = this.editor.getAttribute('data-placeholder');
      const content = this.editor.textContent === placeholder ? '' : this.editor.innerHTML;
      this.hiddenTextarea.value = content;
    }
  }

  // ============ BASIC TEXT FORMATTING ============
  
  // Format selected text only (inline formatting)
  toggleFormat(command) {
    const selection = window.getSelection();
    
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    
    if (range.collapsed) {
      // No selection - just apply formatting at cursor position
      document.execCommand(command, false, null);
    } else {
      // Text is selected - apply formatting only to selected text
      document.execCommand(command, false, null);
    }
    
    this.syncContent();
  }

  // Apply strikethrough formatting
  strikethrough() {
    this.toggleFormat('strikeThrough');
  }

  // ============ HEADER FORMATTING ============

  // Apply header formatting to selected text only
  applyHeader(level) {
    const selection = window.getSelection();
    
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    
    if (range.collapsed) return; // No selection
    
    // Get the selected text
    const selectedText = range.toString();
    
    if (!selectedText.trim()) return;
    
    // Create a span with header styling
    const span = document.createElement('span');
    span.style.fontWeight = 'bold';
    span.style.color = '#1e40af';
    
    // Set font size based on header level
    switch(level) {
      case 1: span.style.fontSize = '2em'; break;
      case 2: span.style.fontSize = '1.5em'; break;
      case 3: span.style.fontSize = '1.25em'; break;
      case 4: span.style.fontSize = '1.1em'; break;
      case 5: span.style.fontSize = '1em'; break;
      case 6: span.style.fontSize = '0.9em'; break;
    }
    
    // Add header class for identification
    span.className = `custom-header-${level}`;
    span.textContent = selectedText;
    
    // Replace selected text with styled span
    range.deleteContents();
    range.insertNode(span);
    
    // Clear selection and position cursor after the span
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.setStartAfter(span);
    newRange.collapse(true);
    selection.addRange(newRange);
    
    this.syncContent();
  }

  // ============ FONT STYLING ============

  applyFontFamily(family) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) return;
    
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    
    switch(family) {
      case 'serif': span.className = 'font-serif'; break;
      case 'sans': span.className = 'font-sans'; break;
      case 'mono': span.className = 'font-mono'; break;
      default: return;
    }
    
    span.appendChild(range.extractContents());
    range.insertNode(span);
    
    this.syncContent();
  }

  applyFontSize(size) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) return;
    
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    
    switch(size) {
      case 'xs': span.className = 'text-xs'; break;
      case 'sm': span.className = 'text-sm'; break;
      case 'lg': span.className = 'text-lg'; break;
      case 'xl': span.className = 'text-xl'; break;
      case '2xl': span.className = 'text-2xl'; break;
      default: return;
    }
    
    span.appendChild(range.extractContents());
    range.insertNode(span);
    
    this.syncContent();
  }

  // ============ COLOR FORMATTING ============

  // Apply text color
  applyTextColor(color) {
    const selection = window.getSelection();
    
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    
    if (range.collapsed) return;
    
    document.execCommand('foreColor', false, color);
    this.syncContent();
  }

  // Apply background color
  applyBackgroundColor(color) {
    const selection = window.getSelection();
    
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    
    if (range.collapsed) return;
    
    document.execCommand('backColor', false, color);
    this.syncContent();
  }

  // Apply highlight
  highlight() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) return;
    
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.className = 'highlight';
    span.appendChild(range.extractContents());
    range.insertNode(span);
    
    this.syncContent();
  }

  // ============ TEXT ALIGNMENT ============

  // Apply text alignment
  applyAlignment(align) {
    const selection = window.getSelection();
    let element = this.editor;
    
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      element = range.commonAncestorContainer;
      
      // Find the closest block element
      while (element.nodeType !== Node.ELEMENT_NODE || 
             !['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE'].includes(element.tagName)) {
        element = element.parentNode;
        if (element === this.editor) break;
      }
    }
    
    // Remove existing alignment classes
    element.classList.remove('text-left', 'text-center', 'text-right', 'text-justify');
    
    // Add new alignment class
    if (align !== 'left') { // left is default
      element.classList.add(`text-${align}`);
    }
    
    this.syncContent();
  }

  // ============ LIST FORMATTING ============

  createOrderedList() {
    document.execCommand('insertOrderedList', false, null);
    this.syncContent();
  }

  createBulletList() {
    document.execCommand('insertUnorderedList', false, null);
    this.syncContent();
  }

  createCheckList() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const ul = document.createElement('ul');
    ul.className = 'checklist';
    
    const li = document.createElement('li');
    li.textContent = 'New checklist item';
    ul.appendChild(li);
    
    range.insertNode(ul);
    
    // Position cursor at end of new item
    const newRange = document.createRange();
    newRange.setStart(li, li.childNodes.length);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
    
    this.syncContent();
  }

  // ============ SPECIAL FORMATTING ============

  // Apply blockquote formatting
  applyBlockquote() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const blockquote = document.createElement('blockquote');
    
    if (range.collapsed) {
      blockquote.innerHTML = '<p>Quote text here...</p>';
      range.insertNode(blockquote);
    } else {
      const selectedContent = range.extractContents();
      const p = document.createElement('p');
      p.appendChild(selectedContent);
      blockquote.appendChild(p);
      range.insertNode(blockquote);
    }
    
    this.syncContent();
  }

  // Apply inline code formatting
  applyInlineCode() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) return;
    
    const range = selection.getRangeAt(0);
    const code = document.createElement('code');
    code.appendChild(range.extractContents());
    range.insertNode(code);
    
    this.syncContent();
  }

  // Apply code block formatting
  applyCodeBlock() {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    
    if (range.collapsed) {
      code.textContent = 'Code block';
    } else {
      code.appendChild(range.extractContents());
    }
    
    pre.appendChild(code);
    range.insertNode(pre);
    
    this.syncContent();
  }

  // ============ ADVANCED FORMATTING ============

  // Apply subscript
  applySubscript() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) return;
    
    const range = selection.getRangeAt(0);
    const sub = document.createElement('sub');
    sub.appendChild(range.extractContents());
    range.insertNode(sub);
    
    this.syncContent();
  }

  // Apply superscript
  applySuperscript() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) return;
    
    const range = selection.getRangeAt(0);
    const sup = document.createElement('sup');
    sup.appendChild(range.extractContents());
    range.insertNode(sup);
    
    this.syncContent();
  }

  // ============ LINKS AND MEDIA ============

  // Insert link
  insertLink() {
    const selection = window.getSelection();
    let url = prompt('Enter URL:');
    
    if (!url) return;
    
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    if (selection.rangeCount > 0 && !selection.getRangeAt(0).collapsed) {
      // Text is selected
      const range = selection.getRangeAt(0);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.appendChild(range.extractContents());
      range.insertNode(a);
    } else {
      // No selection, insert new link
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = url;
      
      const range = selection.getRangeAt(0);
      range.insertNode(a);
    }
    
    this.syncContent();
  }

  // Insert image
  insertImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target.result;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.insertNode(img);
          
          // Position cursor after image
          const newRange = document.createRange();
          newRange.setStartAfter(img);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
        
        this.syncContent();
      };
      reader.readAsDataURL(file);
    };
    
    input.click();
  }

  // ============ UTILITY FUNCTIONS ============

  // Clear all formatting from selected text
  clearFormatting() {
    const selection = window.getSelection();
    
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    
    if (range.collapsed) return;
    
    document.execCommand('removeFormat', false, null);
    
    // Also remove our custom header classes and other spans
    const selectedElement = range.commonAncestorContainer;
    if (selectedElement.nodeType === Node.ELEMENT_NODE) {
      const customElements = selectedElement.querySelectorAll('[class*="custom-header-"], [class*="highlight"], [class*="font-"], [class*="text-"]');
      customElements.forEach(el => {
        const textNode = document.createTextNode(el.textContent);
        el.parentNode.replaceChild(textNode, el);
      });
    }
    
    this.syncContent();
  }

  // Undo functionality
  undo() {
    document.execCommand('undo', false, null);
    this.syncContent();
  }

  // Redo functionality
  redo() {
    document.execCommand('redo', false, null);
    this.syncContent();
  }

  // Set content (for loading existing articles)
  setContent(html) {
    if (!html || html.trim() === '') {
      this.editor.innerHTML = '';
      this.updatePlaceholder();
      this.syncContent();
      return;
    }

    // Process the HTML to ensure proper formatting
    let processedHtml = html;
    
    // Convert line breaks to proper paragraphs if needed
    if (!processedHtml.includes('<p>') && !processedHtml.includes('<div>')) {
      // Split by double line breaks for paragraphs
      const paragraphs = processedHtml.split(/\n\s*\n/);
      if (paragraphs.length > 1) {
        processedHtml = paragraphs
          .map(p => p.trim())
          .filter(p => p.length > 0)
          .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
          .join('');
      } else {
        // Single paragraph with line breaks
        processedHtml = `<p>${processedHtml.replace(/\n/g, '<br>')}</p>`;
      }
    } else {
      // Already has HTML structure, just ensure line breaks are preserved
      processedHtml = processedHtml.replace(/\n/g, '<br>');
    }

    this.editor.innerHTML = processedHtml;
    this.updatePlaceholder();
    this.syncContent();
    
    // Clear any placeholder styling that might have been applied
    this.editor.style.color = '#000000';
  }

  // Get content
  getContent() {
    const placeholder = this.editor.getAttribute('data-placeholder');
    return this.editor.textContent === placeholder ? '' : this.editor.innerHTML;
  }

  // Clear content
  clear() {
    this.editor.innerHTML = '';
    this.updatePlaceholder();
    this.syncContent();
  }
}

// Initialize editors when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  
  // Initialize admin editor
  const adminEditor = new CustomEditor('admin-content-editor');
  
  // Initialize edit editor  
  const editEditor = new CustomEditor('edit-content-editor');
  
  // Initialize dashboard editor
  const dashboardEditor = new CustomEditor('article-content-editor');
  
  // Setup comprehensive toolbar button event listeners
  setupComprehensiveToolbarListeners(adminEditor, 'admin-content-editor');
  setupComprehensiveToolbarListeners(editEditor, 'edit-content-editor');  
  setupComprehensiveToolbarListeners(dashboardEditor, 'article-content-editor');
  
  // Store global references
  window.customEditors = {
    admin: adminEditor,
    edit: editEditor,
    dashboard: dashboardEditor
  };
});

function setupComprehensiveToolbarListeners(editor, editorId) {
  if (!editor || !editor.editor) return;
  
  // Find the toolbar associated with this editor
  const editorElement = document.getElementById(editorId);
  if (!editorElement) return;
  
  // Look for toolbar in the same form or nearby
  const form = editorElement.closest('form') || editorElement.closest('.admin-form') || editorElement.closest('.content-form');
  const toolbar = form ? form.querySelector('.custom-toolbar') : document.querySelector('.custom-toolbar');
  
  if (!toolbar) return;
  
  // Add event listeners to toolbar buttons
  const buttons = toolbar.querySelectorAll('button[data-action], input[data-action], select[data-action]');
  buttons.forEach(element => {
    const action = element.getAttribute('data-action');
    
    if (element.tagName === 'BUTTON') {
      element.addEventListener('click', (e) => {
        e.preventDefault();
        handleToolbarAction(editor, action);
      });
    } else if (element.tagName === 'INPUT' && element.type === 'color') {
      element.addEventListener('change', (e) => {
        handleColorAction(editor, action, e.target.value);
      });
    } else if (element.tagName === 'SELECT') {
      element.addEventListener('change', (e) => {
        handleSelectAction(editor, action, e.target.value);
      });
    }
  });
}

function handleToolbarAction(editor, action) {
  switch(action) {
    // Basic formatting
    case 'bold': editor.toggleFormat('bold'); break;
    case 'italic': editor.toggleFormat('italic'); break;
    case 'underline': editor.toggleFormat('underline'); break;
    case 'strikethrough': editor.strikethrough(); break;
    
    // Headers
    case 'header1': editor.applyHeader(1); break;
    case 'header2': editor.applyHeader(2); break;
    case 'header3': editor.applyHeader(3); break;
    case 'header4': editor.applyHeader(4); break;
    
    // Alignment
    case 'alignLeft': editor.applyAlignment('left'); break;
    case 'alignCenter': editor.applyAlignment('center'); break;
    case 'alignRight': editor.applyAlignment('right'); break;
    case 'alignJustify': editor.applyAlignment('justify'); break;
    
    // Lists
    case 'orderedList': editor.createOrderedList(); break;
    case 'bulletList': editor.createBulletList(); break;
    case 'checkList': editor.createCheckList(); break;
    
    // Special formatting
    case 'blockquote': editor.applyBlockquote(); break;
    case 'code': editor.applyInlineCode(); break;
    case 'codeBlock': editor.applyCodeBlock(); break;
    case 'highlight': editor.highlight(); break;
    
    // Advanced formatting
    case 'subscript': editor.applySubscript(); break;
    case 'superscript': editor.applySuperscript(); break;
    
    // Media and links
    case 'link': editor.insertLink(); break;
    case 'image': editor.insertImage(); break;
    
    // Utility
    case 'removeFormat': editor.clearFormatting(); break;
    case 'undo': editor.undo(); break;
    case 'redo': editor.redo(); break;
  }
}

function handleColorAction(editor, action, value) {
  switch(action) {
    case 'textColor': editor.applyTextColor(value); break;
    case 'backgroundColor': editor.applyBackgroundColor(value); break;
  }
}

function handleSelectAction(editor, action, value) {
  switch(action) {
    case 'fontFamily': editor.applyFontFamily(value); break;
    case 'fontSize': editor.applyFontSize(value); break;
  }
}

// Helper functions for form submissions
window.getEditorContent = function(editorId) {
  const textarea = document.getElementById(editorId + '-textarea');
  return textarea ? textarea.value : '';
};

window.setEditorContent = function(editorId, content) {
  const editor = document.getElementById(editorId);
  if (editor && editor.contentEditable) {
    editor.innerHTML = content;
    const textarea = document.getElementById(editorId + '-textarea');
    if (textarea) textarea.value = content;
  }
};

window.clearEditorContent = function(editorId) {
  const editor = document.getElementById(editorId);
  if (editor) {
    editor.innerHTML = '';
    const placeholder = editor.getAttribute('data-placeholder');
    if (placeholder) {
      editor.textContent = placeholder;
      editor.style.color = '#9ca3af';
    }
    const textarea = document.getElementById(editorId + '-textarea');
    if (textarea) textarea.value = '';
  }
};