// TinyMCE Dashboard Editor Configuration

// Initialize TinyMCE for dashboard article creation
function initializeDashboardEditor() {
  if (typeof tinymce === 'undefined') {
    console.error('TinyMCE is not loaded');
    return;
  }

  tinymce.init({
    selector: '#article-content-editor',
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
      // Add custom blocks dropdown
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

      // Add inline headers split button
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
    },

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

// Update the dashboard form submission to use TinyMCE
document.addEventListener('DOMContentLoaded', function() {
  const createForm = document.getElementById('create-article-form');
  if (createForm) {
    createForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Get TinyMCE content
      const content = tinymce.get('article-content-editor').getContent();
      
      const formData = new FormData(e.target);
      const title = formData.get('title');
      const excerpt = formData.get('excerpt');
      const published = formData.get('published') === 'on';
      
      try {
        showMessage('Creating article...', 'info');
        
        const response = await fetch('/api/articles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title, excerpt, content, published }),
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
          showMessage('Article created successfully!', 'success');
          e.target.reset();
          
          // Clear TinyMCE editor
          tinymce.get('article-content-editor').setContent('');
          
          // Switch to overview tab to see the new article
          setTimeout(() => {
            showTab('overview');
            loadUserContent();
          }, 1000);
        } else {
          showMessage(data.error || 'Failed to create article', 'error');
        }
      } catch (error) {
        console.error('Article creation error:', error);
        showMessage('Network error. Please try again.', 'error');
      }
    });
  }
});