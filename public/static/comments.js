// Essential Comment System - Compact UI with Reply Hierarchy
class CommentSystem {
  constructor(container, articleId = null, resourceId = null) {
    this.container = container;
    this.articleId = articleId;
    this.resourceId = resourceId;
    this.comments = [];
    this.currentUser = null;
    this.eventHandlers = [];

    this.init();
  }

  async init() {
    // Check if user is authenticated
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        this.currentUser = data.user;
      }
    } catch (error) {
      console.log('User not authenticated');
    }

    this.render();
    await this.loadComments();
  }

  render() {
    this.container.innerHTML = `
      <div class="comments-section">
        <div class="comments-header">
          <h3 class="comments-title">
            <i class="fas fa-comments"></i>
            Comments
            <span class="comments-count" id="comments-count">0</span>
          </h3>
        </div>

        ${this.currentUser ? this.renderCommentForm() : this.renderLoginPrompt()}

        <div class="comments-list" id="comments-list">
          <div class="loading">
            <i class="fas fa-spinner fa-spin"></i> Loading comments...
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }
  
  
  renderCommentForm(parentId = null, replyToUser = null) {
    const isReply = parentId !== null;
    const placeholder = isReply ? `Reply to ${replyToUser}...` : 'Share your thoughts...';
    const submitText = isReply ? 'Reply' : 'Comment';
    const formId = isReply ? `reply-form-${parentId}` : 'main-comment-form';
    const textareaId = isReply ? `reply-textarea-${parentId}` : 'main-comment-textarea';
    
    return `
      <form class="comment-form ${isReply ? 'reply-form' : 'main-form'}" id="${formId}">
        <div class="form-group">
          <textarea 
            id="${textareaId}"
            name="content" 
            placeholder="${placeholder}"
            maxlength="500" 
            rows="3"
            class="comment-input"
            required
          ></textarea>
          <div class="char-count">
            <span class="current">0</span>/500
          </div>
        </div>
        <div class="form-actions">
          <small class="form-hint">Press Enter to submit, Shift+Enter for new line</small>
          ${isReply ? `<button type="button" class="btn-cancel">Cancel</button>` : ''}
          <button type="submit" class="btn-submit">${submitText}</button>
        </div>
        ${parentId ? `<input type="hidden" name="parentId" value="${parentId}">` : ''}
      </form>
    `;
  }
  
  renderLoginPrompt() {
    return `
      <div class="login-prompt">
        <i class="fas fa-sign-in-alt"></i>
        <a href="/login">Login</a> to join the conversation
      </div>
    `;
  }
  
  bindEvents() {
    // Character counter for comment forms
    const inputHandler = (e) => {
      if (e.target.classList.contains('comment-input')) {
        const current = e.target.value.length;
        const counter = e.target.closest('.form-group').querySelector('.current');
        counter.textContent = current;

        const charCount = e.target.closest('.form-group').querySelector('.char-count');
        charCount.classList.toggle('warning', current > 400); // Warning at 400 chars
        charCount.classList.toggle('error', current > 500);   // Error at 500 chars
      }
    };

    // Enter key submission for comment forms
    const keydownHandler = (e) => {
      if (e.target.classList.contains('comment-input')) {
        // Submit on Enter (but not Shift+Enter for new lines)
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const form = e.target.closest('.comment-form');
          if (form) {
            this.handleCommentSubmit(form);
          }
        }
      }
    };

    // Form submissions
    const submitHandler = (e) => {
      e.preventDefault();
      if (e.target.classList.contains('comment-form')) {
        this.handleCommentSubmit(e.target);
      }
    };

    // Reply button clicks
    const clickHandler = (e) => {
      if (e.target.classList.contains('btn-reply')) {
        const commentId = e.target.dataset.commentId;
        const userName = e.target.dataset.userName;
        this.showReplyForm(commentId, userName);
      }

      if (e.target.classList.contains('btn-cancel')) {
        e.target.closest('.reply-form').remove();
      }

      if (e.target.classList.contains('btn-delete')) {
        const commentId = e.target.dataset.commentId;
        this.deleteComment(commentId);
      }
    };

    this.container.addEventListener('input', inputHandler);
    this.container.addEventListener('keydown', keydownHandler);
    this.container.addEventListener('submit', submitHandler);
    this.container.addEventListener('click', clickHandler);

    this.eventHandlers = [
      { type: 'input', handler: inputHandler },
      { type: 'keydown', handler: keydownHandler },
      { type: 'submit', handler: submitHandler },
      { type: 'click', handler: clickHandler }
    ];
  }
  
  destroy() {
    this.eventHandlers.forEach(({ type, handler }) => {
      this.container.removeEventListener(type, handler);
    });
    this.eventHandlers = [];
    this.container.innerHTML = '';
  }
  
  async handleCommentSubmit(form) {
    const formData = new FormData(form);
    const content = formData.get('content').trim();
    const parentId = formData.get('parentId');

    if (!content) return;

    const submitBtn = form.querySelector('.btn-submit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Posting...';
    submitBtn.disabled = true;

    try {
      const payload = {
        content,
        articleId: this.articleId,
        resourceId: this.resourceId
      };

      if (parentId) {
        payload.parentId = parseInt(parentId);
      }

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        form.reset();
        form.querySelector('.current').textContent = '0';

        // Remove reply form if it was a reply
        if (parentId) {
          form.remove();
        }

        // Reload comments
        await this.loadComments();
      } else {
        const error = await response.json();

        // Handle email verification required
        if (error.requiresVerification && error.userId) {
          const confirmed = confirm(
            `${error.error}\n\nWould you like to verify your email now?`
          );
          if (confirmed) {
            window.location.href = `/verify-email?userId=${error.userId}`;
            return;
          }
        } else {
          alert(error.error || 'Failed to post comment');
        }
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }
  
  async loadComments() {
    try {
      const params = new URLSearchParams();
      if (this.articleId) params.append('articleId', this.articleId);
      if (this.resourceId) params.append('resourceId', this.resourceId);

      const response = await fetch(`/api/comments?${params}`);
      const data = await response.json();

      if (response.ok) {
        this.comments = data.comments;
        this.renderComments();
      } else {
        console.error('Error loading comments:', data.error);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      document.getElementById('comments-list').innerHTML = '<div class="error">Failed to load comments</div>';
    }
  }

  renderComments() {
    const commentsList = document.getElementById('comments-list');
    const commentsCount = document.getElementById('comments-count');

    commentsCount.textContent = this.comments.length;

    if (this.comments.length === 0) {
      commentsList.innerHTML = '<div class="empty-state">No comments yet. Be the first to comment!</div>';
      return;
    }

    // Build hierarchical structure
    const commentTree = this.buildCommentTree();
    commentsList.innerHTML = this.renderCommentTree(commentTree);
  }
  
  buildCommentTree() {
    const commentMap = new Map();
    const tree = [];
    
    // First pass: create comment objects
    this.comments.forEach(comment => {
      commentMap.set(comment.id, { 
        ...comment, 
        children: [] 
      });
    });
    
    // Second pass: build hierarchy
    this.comments.forEach(comment => {
      const commentNode = commentMap.get(comment.id);
      
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.children.push(commentNode);
        }
      } else {
        tree.push(commentNode);
      }
    });
    
    return tree;
  }
  
  renderCommentTree(tree, depth = 0) {
    return tree.map(comment => {
      const isOwn = this.currentUser && this.currentUser.id === comment.user_id;
      const canReply = this.currentUser && depth < 5; // Limit nesting depth
      const canDelete = this.currentUser !== null;
      const timeAgo = this.formatTimeAgo(comment.created_at);

      return `
        <div class="comment" data-comment-id="${comment.id}" style="margin-left: ${depth * 15}px">
          <div class="comment-content">
            <div class="comment-header">
              <span class="author">${comment.user_name}</span>
              ${comment.reply_to_user ? `<span class="reply-to">→ ${comment.reply_to_user}</span>` : ''}
              <span class="time">${timeAgo}</span>
            </div>
            <div class="comment-body">${this.formatCommentContent(comment.content)}</div>
            <div class="comment-actions">
              ${canReply ? `
                <button class="btn-reply" data-comment-id="${comment.id}" data-user-name="${comment.user_name}">
                  <i class="fas fa-reply"></i> Reply
                </button>
              ` : ''}
              ${canDelete ? `
                <button class="btn-delete" data-comment-id="${comment.id}">
                  <i class="fas fa-trash"></i> Delete
                </button>
              ` : ''}
            </div>
          </div>
          ${comment.children.length > 0 ? this.renderCommentTree(comment.children, depth + 1) : ''}
        </div>
      `;
    }).join('');
  }
  
  formatCommentContent(content) {
    // Simple text formatting - escape HTML and add line breaks
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }
  
  formatTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 30) return `${diffDays}d`;

    return date.toLocaleDateString();
  }
  
  showReplyForm(commentId, userName) {
    // Remove any existing reply forms
    this.container.querySelectorAll('.reply-form').forEach(form => form.remove());

    const commentEl = this.container.querySelector(`[data-comment-id="${commentId}"]`);
    const replyFormHtml = this.renderCommentForm(commentId, userName);

    // Insert reply form after the comment
    commentEl.insertAdjacentHTML('afterend', replyFormHtml);

    // Focus the textarea
    const textarea = commentEl.nextElementSibling.querySelector('textarea');
    setTimeout(() => textarea.focus(), 100);
  }
  
  async deleteComment(commentId) {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    const deleteBtn = document.querySelector(`[data-comment-id="${commentId}"] .btn-delete`);
    if (deleteBtn && deleteBtn.disabled) {
      return; // Already being deleted
    }

    if (deleteBtn) {
      deleteBtn.disabled = true;
      deleteBtn.textContent = 'Deleting...';
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await this.loadComments();
      } else if (response.status === 404) {
        const error = await response.json();
        alert(error.error || 'You do not have permission to delete this comment');
        if (deleteBtn) {
          deleteBtn.disabled = false;
          deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete comment');
        if (deleteBtn) {
          deleteBtn.disabled = false;
          deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
        }
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
      if (deleteBtn) {
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
      }
    }
  }
}

// Global comment system manager
window.commentSystemManager = {
  currentSystem: null,

  init: function(containerId, articleId = null, resourceId = null) {
    const container = document.getElementById(containerId);
    if (container) {
      if (this.currentSystem) {
        this.destroy();
      }
      this.currentSystem = new CommentSystem(container, articleId, resourceId);
    } else {
      console.warn(`Comment container "${containerId}" not found`);
    }
  },

  destroy: function() {
    if (this.currentSystem) {
      if (typeof this.currentSystem.destroy === 'function') {
        this.currentSystem.destroy();
      }
      this.currentSystem = null;
    }
  }
};

// Initialize comment system when DOM is ready
window.initComments = function(containerId, articleId = null, resourceId = null) {
  window.commentSystemManager.init(containerId, articleId, resourceId);
};