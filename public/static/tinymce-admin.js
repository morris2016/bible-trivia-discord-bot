// TinyMCE Admin Editor Configuration

// Initialize TinyMCE for admin article creation
function initializeAdminEditor() {
  if (typeof tinymce === 'undefined') {
    console.error('TinyMCE is not loaded');
    return;
  }

  tinymce.init({
    selector: '#admin-content-editor',
    height: 400,
    menubar: false,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons'
    ],
    toolbar: 'undo redo | blocks | bold italic underline strikethrough | ' +
      'fontfamily fontsize | forecolor backcolor | ' +
      'alignleft aligncenter alignright alignjustify | ' +
      'bullist numlist outdent indent | ' +
      'link image media table | ' +
      'emoticons charmap | preview code fullscreen help',
    
    // Custom formats for inline headers
    formats: {
      h1_inline: { inline: 'span', styles: { fontSize: '2em', fontWeight: 'bold', color: '#1e40af' } },
      h2_inline: { inline: 'span', styles: { fontSize: '1.5em', fontWeight: 'bold', color: '#1e40af' } },
      h3_inline: { inline: 'span', styles: { fontSize: '1.25em', fontWeight: 'bold', color: '#1e40af' } },
      h4_inline: { inline: 'span', styles: { fontSize: '1.1em', fontWeight: 'bold', color: '#1e40af' } },
      h5_inline: { inline: 'span', styles: { fontSize: '1em', fontWeight: 'bold', color: '#1e40af' } },
      h6_inline: { inline: 'span', styles: { fontSize: '0.9em', fontWeight: 'bold', color: '#1e40af' } }
    },

    // Custom toolbar button definitions
    setup: function (editor) {
      // Add custom inline header buttons
      editor.ui.registry.addSplitButton('inlineheaders', {
        text: 'Headers',
        icon: 'h1',
        tooltip: 'Apply header formatting to selected text',
        onAction: function () {
          // Default action - apply H1
          editor.formatter.toggle('h1_inline');
        },
        onItemAction: function (api, value) {
          editor.formatter.toggle(value);
        },
        fetch: function (callback) {
          const items = [
            { type: 'choiceitem', text: 'Header 1', value: 'h1_inline' },
            { type: 'choiceitem', text: 'Header 2', value: 'h2_inline' },
            { type: 'choiceitem', text: 'Header 3', value: 'h3_inline' },
            { type: 'choiceitem', text: 'Header 4', value: 'h4_inline' },
            { type: 'choiceitem', text: 'Header 5', value: 'h5_inline' },
            { type: 'choiceitem', text: 'Header 6', value: 'h6_inline' }
          ];
          callback(items);
        }
      });

      // Replace the default blocks dropdown with our custom one
      editor.ui.registry.addMenuButton('customblocks', {
        text: 'Blocks',
        icon: 'paragraph',
        fetch: function (callback) {
          const items = [
            { type: 'menuitem', text: 'Paragraph', onAction: () => editor.formatter.apply('p') },
            { type: 'menuitem', text: 'Header 1', onAction: () => editor.formatter.apply('h1') },
            { type: 'menuitem', text: 'Header 2', onAction: () => editor.formatter.apply('h2') },
            { type: 'menuitem', text: 'Header 3', onAction: () => editor.formatter.apply('h3') },
            { type: 'menuitem', text: 'Header 4', onAction: () => editor.formatter.apply('h4') },
            { type: 'menuitem', text: 'Header 5', onAction: () => editor.formatter.apply('h5') },
            { type: 'menuitem', text: 'Header 6', onAction: () => editor.formatter.apply('h6') },
            { type: 'separator' },
            { type: 'menuitem', text: 'Inline H1', onAction: () => editor.formatter.toggle('h1_inline') },
            { type: 'menuitem', text: 'Inline H2', onAction: () => editor.formatter.toggle('h2_inline') },
            { type: 'menuitem', text: 'Inline H3', onAction: () => editor.formatter.toggle('h3_inline') },
            { type: 'menuitem', text: 'Inline H4', onAction: () => editor.formatter.toggle('h4_inline') },
            { type: 'menuitem', text: 'Inline H5', onAction: () => editor.formatter.toggle('h5_inline') },
            { type: 'menuitem', text: 'Inline H6', onAction: () => editor.formatter.toggle('h6_inline') }
          ];
          callback(items);
        }
      });
    },
    
    // Update toolbar to use our custom blocks dropdown
    toolbar: 'undo redo | customblocks inlineheaders | bold italic underline strikethrough | ' +
      'fontfamily fontsize | forecolor backcolor | ' +
      'alignleft aligncenter alignright alignjustify | ' +
      'bullist numlist outdent indent | ' +
      'link image media table | ' +
      'emoticons charmap | preview code fullscreen help',

    content_style: `
      body { font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; }
      .mce-content-body { padding: 1rem; }
    `,

    // Enable image uploads
    images_upload_handler: function (blobInfo, success, failure) {
      // Convert to base64 for now (in production, upload to server)
      const reader = new FileReader();
      reader.onload = function(e) {
        success(e.target.result);
      };
      reader.readAsDataURL(blobInfo.blob());
    }
  });
}

// Initialize TinyMCE for admin article editing  
function initializeEditEditor() {
  if (typeof tinymce === 'undefined') {
    console.error('TinyMCE is not loaded');
    return;
  }

  tinymce.init({
    selector: '#edit-content-editor',
    height: 400,
    menubar: false,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons'
    ],
    toolbar: 'undo redo | customblocks inlineheaders | bold italic underline strikethrough | ' +
      'fontfamily fontsize | forecolor backcolor | ' +
      'alignleft aligncenter alignright alignjustify | ' +
      'bullist numlist outdent indent | ' +
      'link image media table | ' +
      'emoticons charmap | preview code fullscreen help',
    
    // Same custom formats and setup as admin editor
    formats: {
      h1_inline: { inline: 'span', styles: { fontSize: '2em', fontWeight: 'bold', color: '#1e40af' } },
      h2_inline: { inline: 'span', styles: { fontSize: '1.5em', fontWeight: 'bold', color: '#1e40af' } },
      h3_inline: { inline: 'span', styles: { fontSize: '1.25em', fontWeight: 'bold', color: '#1e40af' } },
      h4_inline: { inline: 'span', styles: { fontSize: '1.1em', fontWeight: 'bold', color: '#1e40af' } },
      h5_inline: { inline: 'span', styles: { fontSize: '1em', fontWeight: 'bold', color: '#1e40af' } },
      h6_inline: { inline: 'span', styles: { fontSize: '0.9em', fontWeight: 'bold', color: '#1e40af' } }
    },

    setup: function (editor) {
      // Same setup as admin editor
      editor.ui.registry.addMenuButton('customblocks', {
        text: 'Blocks',
        icon: 'paragraph',
        fetch: function (callback) {
          const items = [
            { type: 'menuitem', text: 'Paragraph', onAction: () => editor.formatter.apply('p') },
            { type: 'menuitem', text: 'Header 1', onAction: () => editor.formatter.apply('h1') },
            { type: 'menuitem', text: 'Header 2', onAction: () => editor.formatter.apply('h2') },
            { type: 'menuitem', text: 'Header 3', onAction: () => editor.formatter.apply('h3') },
            { type: 'menuitem', text: 'Header 4', onAction: () => editor.formatter.apply('h4') },
            { type: 'menuitem', text: 'Header 5', onAction: () => editor.formatter.apply('h5') },
            { type: 'menuitem', text: 'Header 6', onAction: () => editor.formatter.apply('h6') },
            { type: 'separator' },
            { type: 'menuitem', text: 'Inline H1', onAction: () => editor.formatter.toggle('h1_inline') },
            { type: 'menuitem', text: 'Inline H2', onAction: () => editor.formatter.toggle('h2_inline') },
            { type: 'menuitem', text: 'Inline H3', onAction: () => editor.formatter.toggle('h3_inline') },
            { type: 'menuitem', text: 'Inline H4', onAction: () => editor.formatter.toggle('h4_inline') },
            { type: 'menuitem', text: 'Inline H5', onAction: () => editor.formatter.toggle('h5_inline') },
            { type: 'menuitem', text: 'Inline H6', onAction: () => editor.formatter.toggle('h6_inline') }
          ];
          callback(items);
        }
      });

      editor.ui.registry.addSplitButton('inlineheaders', {
        text: 'Headers',
        icon: 'h1',
        tooltip: 'Apply header formatting to selected text',
        onAction: function () {
          editor.formatter.toggle('h1_inline');
        },
        onItemAction: function (api, value) {
          editor.formatter.toggle(value);
        },
        fetch: function (callback) {
          const items = [
            { type: 'choiceitem', text: 'Header 1', value: 'h1_inline' },
            { type: 'choiceitem', text: 'Header 2', value: 'h2_inline' },
            { type: 'choiceitem', text: 'Header 3', value: 'h3_inline' },
            { type: 'choiceitem', text: 'Header 4', value: 'h4_inline' },
            { type: 'choiceitem', text: 'Header 5', value: 'h5_inline' },
            { type: 'choiceitem', text: 'Header 6', value: 'h6_inline' }
          ];
          callback(items);
        }
      });
    },

    content_style: `
      body { font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; }
      .mce-content-body { padding: 1rem; }
    `,

    images_upload_handler: function (blobInfo, success, failure) {
      const reader = new FileReader();
      reader.onload = function(e) {
        success(e.target.result);
      };
      reader.readAsDataURL(blobInfo.blob());
    }
  });
}

// Update form submission handlers for TinyMCE
window.createArticle = async function(e) {
  e.preventDefault();
  
  const form = e.target;
  
  // Get TinyMCE content
  const content = tinymce.get('admin-content-editor').getContent();
  
  const formData = new FormData(form);
  
  const articleData = {
    title: formData.get('title'),
    excerpt: formData.get('excerpt'),
    content: content,
    published: formData.get('published') === 'true'
  };
  
  try {
    showAdminMessage('Creating article...', 'info');
    
    const response = await fetch('/admin/api/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(articleData),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAdminMessage('Article created successfully!', 'success');
      
      // Clear the form and editor
      form.reset();
      tinymce.get('admin-content-editor').setContent('');
      
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

window.updateArticle = async function(e) {
  e.preventDefault();
  
  const form = e.target;
  const articleId = form.dataset.articleId;
  
  // Get TinyMCE content
  const content = tinymce.get('edit-content-editor').getContent();
  
  const formData = new FormData(form);
  
  const articleData = {
    title: formData.get('title'),
    excerpt: formData.get('excerpt'),
    content: content,
    published: formData.get('published') === 'true'
  };
  
  try {
    showAdminMessage('Updating article...', 'info');
    
    const response = await fetch(`/admin/api/articles/${articleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
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

window.loadArticleForEdit = async function(articleId) {
  try {
    const response = await fetch(`/admin/api/articles/${articleId}`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      const article = data.article;
      document.getElementById('edit-title').value = article.title;
      document.getElementById('edit-excerpt').value = article.excerpt || '';
      document.getElementById('edit-published').value = article.published.toString();
      
      // Load content into TinyMCE editor if it exists
      if (tinymce.get('edit-content-editor')) {
        tinymce.get('edit-content-editor').setContent(article.content);
      }
    } else {
      showAdminMessage('Article not found', 'error');
    }
  } catch (error) {
    console.error('Error loading article:', error);
    showAdminMessage('Error loading article', 'error');
  }
};