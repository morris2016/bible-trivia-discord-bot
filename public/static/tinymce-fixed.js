// TinyMCE Fixed Configuration for Inline Headers

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
      'insertdatetime', 'media', 'table', 'help', 'wordcount'
    ],
    
    // Custom toolbar without default blocks - using our custom headers
    toolbar: 'undo redo | customheaders | bold italic underline strikethrough | ' +
      'fontfamily fontsize | forecolor backcolor | ' +
      'alignleft aligncenter alignright alignjustify | ' +
      'bullist numlist outdent indent | ' +
      'link image media table | ' +
      'code preview fullscreen help',
    
    // Override default formats to use inline spans for headers
    formats: {
      // Override default block headers with inline versions
      h1: { inline: 'span', styles: { fontSize: '2em', fontWeight: 'bold', color: '#1e40af', lineHeight: '1.2' } },
      h2: { inline: 'span', styles: { fontSize: '1.5em', fontWeight: 'bold', color: '#1e40af', lineHeight: '1.3' } },
      h3: { inline: 'span', styles: { fontSize: '1.25em', fontWeight: 'bold', color: '#1e40af', lineHeight: '1.4' } },
      h4: { inline: 'span', styles: { fontSize: '1.1em', fontWeight: 'bold', color: '#1e40af', lineHeight: '1.4' } },
      h5: { inline: 'span', styles: { fontSize: '1em', fontWeight: 'bold', color: '#1e40af', lineHeight: '1.4' } },
      h6: { inline: 'span', styles: { fontSize: '0.9em', fontWeight: 'bold', color: '#1e40af', lineHeight: '1.4' } }
    },

    setup: function (editor) {
      // Add custom headers dropdown that uses inline formatting
      editor.ui.registry.addMenuButton('customheaders', {
        text: 'Headers',
        icon: 'h1',
        tooltip: 'Apply header formatting to selected text',
        fetch: function (callback) {
          const items = [
            { 
              type: 'menuitem', 
              text: 'Normal Text', 
              onAction: () => {
                // Remove all header formatting
                ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(format => {
                  editor.formatter.remove(format);
                });
              }
            },
            { type: 'separator' },
            { 
              type: 'menuitem', 
              text: 'Header 1 (Large)', 
              onAction: () => {
                // Clear other headers first
                ['h2', 'h3', 'h4', 'h5', 'h6'].forEach(format => {
                  editor.formatter.remove(format);
                });
                editor.formatter.toggle('h1');
              }
            },
            { 
              type: 'menuitem', 
              text: 'Header 2 (Section)', 
              onAction: () => {
                ['h1', 'h3', 'h4', 'h5', 'h6'].forEach(format => {
                  editor.formatter.remove(format);
                });
                editor.formatter.toggle('h2');
              }
            },
            { 
              type: 'menuitem', 
              text: 'Header 3 (Subsection)', 
              onAction: () => {
                ['h1', 'h2', 'h4', 'h5', 'h6'].forEach(format => {
                  editor.formatter.remove(format);
                });
                editor.formatter.toggle('h3');
              }
            },
            { 
              type: 'menuitem', 
              text: 'Header 4 (Small)', 
              onAction: () => {
                ['h1', 'h2', 'h3', 'h5', 'h6'].forEach(format => {
                  editor.formatter.remove(format);
                });
                editor.formatter.toggle('h4');
              }
            },
            { 
              type: 'menuitem', 
              text: 'Header 5 (Smaller)', 
              onAction: () => {
                ['h1', 'h2', 'h3', 'h4', 'h6'].forEach(format => {
                  editor.formatter.remove(format);
                });
                editor.formatter.toggle('h5');
              }
            },
            { 
              type: 'menuitem', 
              text: 'Header 6 (Smallest)', 
              onAction: () => {
                ['h1', 'h2', 'h3', 'h4', 'h5'].forEach(format => {
                  editor.formatter.remove(format);
                });
                editor.formatter.toggle('h6');
              }
            }
          ];
          callback(items);
        }
      });

      // Add individual header buttons for quick access
      ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(headerLevel => {
        const headerNum = headerLevel.charAt(1);
        editor.ui.registry.addButton(headerLevel, {
          text: `H${headerNum}`,
          tooltip: `Apply Header ${headerNum} formatting to selected text`,
          onAction: () => {
            // Clear other headers first
            ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(format => {
              if (format !== headerLevel) {
                editor.formatter.remove(format);
              }
            });
            editor.formatter.toggle(headerLevel);
          }
        });
      });
    },

    content_style: `
      body { 
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
        font-size: 14px; 
        line-height: 1.6;
      }
      .mce-content-body { 
        padding: 1rem; 
      }
    `,

    // Prevent TinyMCE from converting our inline headers to block headers
    verify_html: false,
    convert_urls: false,
    
    // Enable image uploads
    images_upload_handler: function (blobInfo, success, failure) {
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
      'insertdatetime', 'media', 'table', 'help', 'wordcount'
    ],
    
    toolbar: 'undo redo | customheaders | bold italic underline strikethrough | ' +
      'fontfamily fontsize | forecolor backcolor | ' +
      'alignleft aligncenter alignright alignjustify | ' +
      'bullist numlist outdent indent | ' +
      'link image media table | ' +
      'code preview fullscreen help',
    
    // Same inline header formats
    formats: {
      h1: { inline: 'span', styles: { fontSize: '2em', fontWeight: 'bold', color: '#1e40af', lineHeight: '1.2' } },
      h2: { inline: 'span', styles: { fontSize: '1.5em', fontWeight: 'bold', color: '#1e40af', lineHeight: '1.3' } },
      h3: { inline: 'span', styles: { fontSize: '1.25em', fontWeight: 'bold', color: '#1e40af', lineHeight: '1.4' } },
      h4: { inline: 'span', styles: { fontSize: '1.1em', fontWeight: 'bold', color: '#1e40af', lineHeight: '1.4' } },
      h5: { inline: 'span', styles: { fontSize: '1em', fontWeight: 'bold', color: '#1e40af', lineHeight: '1.4' } },
      h6: { inline: 'span', styles: { fontSize: '0.9em', fontWeight: 'bold', color: '#1e40af', lineHeight: '1.4' } }
    },

    setup: function (editor) {
      // Same setup as admin editor
      editor.ui.registry.addMenuButton('customheaders', {
        text: 'Headers',
        icon: 'h1',
        tooltip: 'Apply header formatting to selected text',
        fetch: function (callback) {
          const items = [
            { 
              type: 'menuitem', 
              text: 'Normal Text', 
              onAction: () => {
                ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(format => {
                  editor.formatter.remove(format);
                });
              }
            },
            { type: 'separator' },
            { 
              type: 'menuitem', 
              text: 'Header 1 (Large)', 
              onAction: () => {
                ['h2', 'h3', 'h4', 'h5', 'h6'].forEach(format => {
                  editor.formatter.remove(format);
                });
                editor.formatter.toggle('h1');
              }
            },
            { 
              type: 'menuitem', 
              text: 'Header 2 (Section)', 
              onAction: () => {
                ['h1', 'h3', 'h4', 'h5', 'h6'].forEach(format => {
                  editor.formatter.remove(format);
                });
                editor.formatter.toggle('h2');
              }
            },
            { 
              type: 'menuitem', 
              text: 'Header 3 (Subsection)', 
              onAction: () => {
                ['h1', 'h2', 'h4', 'h5', 'h6'].forEach(format => {
                  editor.formatter.remove(format);
                });
                editor.formatter.toggle('h3');
              }
            },
            { 
              type: 'menuitem', 
              text: 'Header 4 (Small)', 
              onAction: () => {
                ['h1', 'h2', 'h3', 'h5', 'h6'].forEach(format => {
                  editor.formatter.remove(format);
                });
                editor.formatter.toggle('h4');
              }
            },
            { 
              type: 'menuitem', 
              text: 'Header 5 (Smaller)', 
              onAction: () => {
                ['h1', 'h2', 'h3', 'h4', 'h6'].forEach(format => {
                  editor.formatter.remove(format);
                });
                editor.formatter.toggle('h5');
              }
            },
            { 
              type: 'menuitem', 
              text: 'Header 6 (Smallest)', 
              onAction: () => {
                ['h1', 'h2', 'h3', 'h4', 'h5'].forEach(format => {
                  editor.formatter.remove(format);
                });
                editor.formatter.toggle('h6');
              }
            }
          ];
          callback(items);
        }
      });
    },

    content_style: `
      body { 
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
        font-size: 14px; 
        line-height: 1.6;
      }
      .mce-content-body { 
        padding: 1rem; 
      }
    `,

    verify_html: false,
    convert_urls: false,

    images_upload_handler: function (blobInfo, success, failure) {
      const reader = new FileReader();
      reader.onload = function(e) {
        success(e.target.result);
      };
      reader.readAsDataURL(blobInfo.blob());
    }
  });
}

// Initialize TinyMCE for dashboard
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
      'insertdatetime', 'media', 'table', 'help', 'wordcount'
    ],
    
    toolbar: 'undo redo | customheaders | bold italic underline strikethrough | ' +
      'fontfamily fontsize | forecolor backcolor | ' +
      'alignleft aligncenter alignright alignjustify | ' +
      'bullist numlist outdent indent | ' +
      'link image media table | ' +
      'code preview fullscreen help',
    
    formats: {
      h1: { inline: 'span', styles: { fontSize: '2em', fontWeight: 'bold', color: '#1e40af', lineHeight: '1.2' } },
      h2: { inline: 'span', styles: { fontSize: '1.5em', fontWeight: 'bold', color: '#1e40af', lineHeight: '1.3' } },
      h3: { inline: 'span', styles: { fontSize: '1.25em', fontWeight: 'bold', color: '#1e40af', lineHeight: '1.4' } },
      h4: { inline: 'span', styles: { fontSize: '1.1em', fontWeight: 'bold', color: '#1e40af', lineHeight: '1.4' } },
      h5: { inline: 'span', styles: { fontSize: '1em', fontWeight: 'bold', color: '#1e40af', lineHeight: '1.4' } },
      h6: { inline: 'span', styles: { fontSize: '0.9em', fontWeight: 'bold', color: '#1e40af', lineHeight: '1.4' } }
    },

    setup: function (editor) {
      editor.ui.registry.addMenuButton('customheaders', {
        text: 'Headers',
        icon: 'h1',
        tooltip: 'Apply header formatting to selected text',
        fetch: function (callback) {
          const items = [
            { 
              type: 'menuitem', 
              text: 'Normal Text', 
              onAction: () => {
                ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(format => {
                  editor.formatter.remove(format);
                });
              }
            },
            { type: 'separator' },
            { 
              type: 'menuitem', 
              text: 'Header 1 (Large)', 
              onAction: () => {
                ['h2', 'h3', 'h4', 'h5', 'h6'].forEach(format => {
                  editor.formatter.remove(format);
                });
                editor.formatter.toggle('h1');
              }
            },
            { 
              type: 'menuitem', 
              text: 'Header 2 (Section)', 
              onAction: () => {
                ['h1', 'h3', 'h4', 'h5', 'h6'].forEach(format => {
                  editor.formatter.remove(format);
                });
                editor.formatter.toggle('h2');
              }
            },
            { 
              type: 'menuitem', 
              text: 'Header 3 (Subsection)', 
              onAction: () => {
                ['h1', 'h2', 'h4', 'h5', 'h6'].forEach(format => {
                  editor.formatter.remove(format);
                });
                editor.formatter.toggle('h3');
              }
            },
            { 
              type: 'menuitem', 
              text: 'Header 4 (Small)', 
              onAction: () => {
                ['h1', 'h2', 'h3', 'h5', 'h6'].forEach(format => {
                  editor.formatter.remove(format);
                });
                editor.formatter.toggle('h4');
              }
            },
            { 
              type: 'menuitem', 
              text: 'Header 5 (Smaller)', 
              onAction: () => {
                ['h1', 'h2', 'h3', 'h4', 'h6'].forEach(format => {
                  editor.formatter.remove(format);
                });
                editor.formatter.toggle('h5');
              }
            },
            { 
              type: 'menuitem', 
              text: 'Header 6 (Smallest)', 
              onAction: () => {
                ['h1', 'h2', 'h3', 'h4', 'h5'].forEach(format => {
                  editor.formatter.remove(format);
                });
                editor.formatter.toggle('h6');
              }
            }
          ];
          callback(items);
        }
      });
    },

    content_style: `
      body { 
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
        font-size: 14px; 
        line-height: 1.6;
      }
      .mce-content-body { 
        padding: 1rem; 
      }
    `,

    verify_html: false,
    convert_urls: false,

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