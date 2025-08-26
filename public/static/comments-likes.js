// Comments and Likes functionality for articles and resources
class CommentsLikes {
  constructor(contentType, contentId) {
    this.contentType = contentType; // 'article' or 'resource'
    this.contentId = contentId;
    this.currentUser = null;
    this.init();
  }

  async init() {
    await this.loadCurrentUser();
    await this.loadComments();
    await this.loadLikes();
    this.setupEventListeners();
  }

  async loadCurrentUser() {
    try {
      const response = await axios.get('/api/auth/me');
      if (response.data.success) {
        this.currentUser = response.data.user;
      }
    } catch (error) {
      // User not authenticated, that's okay
      this.currentUser = null;
    }
  }

  async loadComments() {
    try {
      const response = await axios.get(`/api/${this.contentType}s/${this.contentId}/comments`);
      if (response.data.success) {
        this.renderComments(response.data.comments);
        // Load user like status for each comment if authenticated
        if (this.currentUser) {
          await this.loadCommentLikeStatus(response.data.comments);
        }
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      this.showError('Failed to load comments');
    }
  }

  async loadLikes() {
    try {
      const response = await axios.get(`/api/${this.contentType}s/${this.contentId}/likes`);
      if (response.data.success) {
        this.renderLikes(response.data.likeCount, response.data.userLiked);
      }
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  }

  renderComments(comments) {
    const commentsContainer = document.getElementById('comments-section');
    if (!commentsContainer) return;

    let commentsHtml = `
      <div class="comments-header">
        <h3>Comments <span class="comment-count-badge">${comments.length}</span></h3>
      </div>
    `;

    // Add comment form for authenticated users
    if (this.currentUser) {
      commentsHtml += this.renderCommentForm();
    } else {
      commentsHtml += `
        <div class="comment-login-prompt">
          <p>Please <a href="/login">sign in</a> to leave a comment.</p>
        </div>
      `;
    }

    // Render comments
    if (comments.length > 0) {
      commentsHtml += '<div class="comments-list">';
      
      // Group comments by parent (for nested replies support)
      const topLevelComments = comments.filter(c => !c.parent_id);
      const replies = comments.filter(c => c.parent_id);
      
      topLevelComments.forEach(comment => {
        commentsHtml += this.renderComment(comment);
        
        // Render replies to this comment
        const commentReplies = replies.filter(r => r.parent_id === comment.id);
        if (commentReplies.length > 0) {
          commentsHtml += '<div class="comment-replies">';
          commentReplies.forEach(reply => {
            commentsHtml += this.renderComment(reply, true);
          });
          commentsHtml += '</div>';
        }
      });
      
      commentsHtml += '</div>';
    } else {
      commentsHtml += `
        <div class="no-comments">
          <p><i class="fas fa-comment-slash"></i> No comments yet. Be the first to share your thoughts!</p>
        </div>
      `;
    }

    commentsContainer.innerHTML = commentsHtml;
  }

  renderCommentForm(parentId = null) {
    const formId = parentId ? `reply-form-${parentId}` : 'main-comment-form';
    const placeholder = parentId ? 'Write a reply...' : 'Share your thoughts...';
    const buttonText = parentId ? 'Post Reply' : 'Post Comment';

    return `
      <form id="${formId}" class="comment-form" data-parent-id="${parentId || ''}">
        <div class="comment-form-header">
          <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.name)}&background=3b82f6&color=ffffff&size=40" 
               alt="${this.currentUser.name}" class="comment-avatar">
          <span class="comment-author">${this.currentUser.name}</span>
        </div>
        <div class="comment-form-body">
          <textarea name="content" placeholder="${placeholder}" required maxlength="1000"></textarea>
          <div class="comment-form-actions">
            <div class="character-count">0/1000</div>
            <div class="form-buttons">
              ${parentId ? `<button type="button" class="btn-cancel" onclick="this.closest('.reply-section').style.display='none'">Cancel</button>` : ''}
              <button type="submit" class="btn-primary">${buttonText}</button>
            </div>
          </div>
        </div>
      </form>
    `;
  }

  renderComment(comment, isReply = false) {
    const timeAgo = this.formatTimeAgo(new Date(comment.created_at));
    const replyClass = isReply ? 'comment-reply' : '';
    
    // Check if current user can edit/delete this comment
    const canEdit = this.currentUser && (
      this.currentUser.id === comment.author_id || 
      ['admin', 'moderator'].includes(this.currentUser.role)
    );
    const isOwner = this.currentUser && this.currentUser.id === comment.author_id;
    const isModerator = this.currentUser && ['admin', 'moderator'].includes(this.currentUser.role);
    
    return `
      <div class="comment ${replyClass}" data-comment-id="${comment.id}">
        <div class="comment-header">
          <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author_name)}&background=6b7280&color=ffffff&size=32" 
               alt="${comment.author_name}" class="comment-avatar">
          <div class="comment-meta">
            <span class="comment-author">${comment.author_name}${comment.author_role === 'admin' ? ' <span class="role-badge admin">Admin</span>' : comment.author_role === 'moderator' ? ' <span class="role-badge moderator">Mod</span>' : ''}</span>
            <span class="comment-time">${timeAgo}</span>
          </div>
          ${canEdit ? `
            <div class="comment-menu">
              <button type="button" class="comment-menu-btn" onclick="commentsLikes.toggleCommentMenu(${comment.id})">
                <i class="fas fa-ellipsis-v"></i>
              </button>
              <div id="comment-menu-${comment.id}" class="comment-menu-dropdown" style="display: none;">
                ${isOwner ? `<button type="button" onclick="commentsLikes.editComment(${comment.id})"><i class="fas fa-edit"></i> Edit</button>` : ''}
                ${canEdit ? `<button type="button" onclick="commentsLikes.deleteComment(${comment.id})" class="delete-btn"><i class="fas fa-trash"></i> Delete</button>` : ''}
                ${isModerator && !isOwner ? `<button type="button" onclick="commentsLikes.moderateComment(${comment.id}, '${comment.author_name}')" class="moderate-btn"><i class="fas fa-shield-alt"></i> Moderate User</button>` : ''}
              </div>
            </div>
          ` : ''}
        </div>
        <div class="comment-content" id="comment-content-${comment.id}">
          <p>${this.escapeHtml(comment.content)}</p>
        </div>
        <div id="comment-edit-${comment.id}" class="comment-edit-form" style="display: none;">
          <textarea class="edit-textarea">${this.escapeHtml(comment.content)}</textarea>
          <div class="edit-actions">
            <button type="button" class="btn-cancel" onclick="commentsLikes.cancelEdit(${comment.id})">Cancel</button>
            <button type="button" class="btn-primary" onclick="commentsLikes.saveEdit(${comment.id})">Save</button>
          </div>
        </div>
        <div class="comment-actions">
          <button type="button" class="comment-like-btn" onclick="commentsLikes.likeComment(${comment.id})" data-comment-id="${comment.id}" data-comment-like-status="">
            <i class="fas fa-thumbs-up"></i>
            <span class="like-count">${comment.like_count || 0}</span>
          </button>
          <button type="button" class="comment-dislike-btn" onclick="commentsLikes.dislikeComment(${comment.id})" data-comment-id="${comment.id}" data-comment-dislike-status="">
            <i class="fas fa-thumbs-down"></i>
            <span class="dislike-count">${comment.dislike_count || 0}</span>
          </button>
          ${!isReply ? `
            <button type="button" class="comment-reply-btn" onclick="commentsLikes.showReplyForm(${comment.id})">
              <i class="fas fa-reply"></i> Reply
            </button>
          ` : ''}
        </div>
        ${!isReply ? `
          <div id="reply-section-${comment.id}" class="reply-section" style="display: none;">
            ${this.renderCommentForm(comment.id)}
          </div>
        ` : ''}
      </div>
    `;
  }

  renderLikes(likeCount, userLiked) {
    const likesContainer = document.getElementById('likes-section');
    if (!likesContainer) return;

    const likedClass = userLiked ? 'liked' : '';
    const likeIcon = userLiked ? 'fas fa-heart' : 'far fa-heart';
    const likeText = userLiked ? 'Liked' : 'Like';

    let likesHtml = `
      <div class="likes-container">
        <div class="like-stats">
          <span class="like-count">${likeCount} ${likeCount === 1 ? 'like' : 'likes'}</span>
        </div>
    `;

    if (this.currentUser) {
      likesHtml += `
        <button id="like-button" class="like-button ${likedClass}" data-liked="${userLiked}">
          <i class="${likeIcon}"></i>
          <span>${likeText}</span>
        </button>
      `;
    } else {
      likesHtml += `
        <div class="like-login-prompt">
          <a href="/login" class="like-button">
            <i class="far fa-heart"></i>
            <span>Sign in to like</span>
          </a>
        </div>
      `;
    }

    likesHtml += '</div>';
    likesContainer.innerHTML = likesHtml;
  }

  setupEventListeners() {
    // Like button functionality
    document.addEventListener('click', (e) => {
      if (e.target.closest('#like-button')) {
        e.preventDefault();
        this.toggleLike();
      }
    });

    // Comment form submissions
    document.addEventListener('submit', (e) => {
      if (e.target.classList.contains('comment-form')) {
        e.preventDefault();
        this.submitComment(e.target);
      }
    });

    // Character count for comment forms
    document.addEventListener('input', (e) => {
      if (e.target.matches('.comment-form textarea')) {
        const textarea = e.target;
        const charCount = textarea.closest('.comment-form').querySelector('.character-count');
        if (charCount) {
          const currentLength = textarea.value.length;
          charCount.textContent = `${currentLength}/1000`;
          charCount.style.color = currentLength > 900 ? '#ef4444' : '#6b7280';
        }
      }
    });
  }

  async toggleLike() {
    if (!this.currentUser) {
      window.location.href = '/login';
      return;
    }

    const likeButton = document.getElementById('like-button');
    if (!likeButton) return;

    try {
      // Optimistic update
      const currentLiked = likeButton.dataset.liked === 'true';
      const newLiked = !currentLiked;
      
      likeButton.disabled = true;
      likeButton.classList.toggle('liked', newLiked);
      
      const response = await axios.post(`/api/${this.contentType}s/${this.contentId}/like`);
      
      if (response.data.success) {
        // Update UI with actual response
        this.renderLikes(response.data.likeCount, response.data.liked);
        
        // Show brief feedback
        this.showMessage(response.data.message, 'success');
      } else {
        throw new Error(response.data.error || 'Failed to update like');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      this.showError('Failed to update like. Please try again.');
      // Revert optimistic update
      this.loadLikes();
    }
  }

  async submitComment(form) {
    if (!this.currentUser) {
      window.location.href = '/login';
      return;
    }

    const formData = new FormData(form);
    const content = formData.get('content');
    const parentId = form.dataset.parentId;

    if (!content || content.trim().length === 0) {
      this.showError('Please enter a comment');
      return;
    }

    try {
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Posting...';

      const requestData = {
        content: content.trim()
      };

      if (parentId) {
        requestData.parentId = parseInt(parentId);
      }

      const response = await axios.post(`/api/${this.contentType}s/${this.contentId}/comments`, requestData);

      if (response.data.success) {
        // Clear form
        form.reset();
        form.querySelector('.character-count').textContent = '0/1000';
        
        // Hide reply form if it was a reply
        if (parentId) {
          form.closest('.reply-section').style.display = 'none';
        }
        
        // Reload comments
        await this.loadComments();
        
        this.showMessage('Comment posted successfully!', 'success');
      } else {
        throw new Error(response.data.error || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      this.showError('Failed to post comment. Please try again.');
    } finally {
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = false;
      submitButton.textContent = parentId ? 'Post Reply' : 'Post Comment';
    }
  }

  showReplyForm(commentId) {
    // Hide any other open reply forms
    document.querySelectorAll('.reply-section').forEach(section => {
      section.style.display = 'none';
    });
    
    // Show this reply form
    const replySection = document.getElementById(`reply-section-${commentId}`);
    if (replySection) {
      replySection.style.display = 'block';
      replySection.querySelector('textarea').focus();
    }
  }

  formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showMessage(message, type = 'info') {
    const messageEl = document.createElement('div');
    messageEl.className = `alert alert-${type}`;
    messageEl.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      ${message}
    `;
    messageEl.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 1000;
      padding: 12px 16px; border-radius: 6px; color: white;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    `;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
      messageEl.remove();
    }, 3000);
  }

  showError(message) {
    this.showMessage(message, 'error');
  }

  // Moderation and Management Functions
  toggleCommentMenu(commentId) {
    // Close all other menus
    document.querySelectorAll('.comment-menu-dropdown').forEach(menu => {
      if (menu.id !== `comment-menu-${commentId}`) {
        menu.style.display = 'none';
      }
    });
    
    // Toggle this menu
    const menu = document.getElementById(`comment-menu-${commentId}`);
    if (menu) {
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
  }

  editComment(commentId) {
    this.toggleCommentMenu(commentId);
    
    const contentDiv = document.getElementById(`comment-content-${commentId}`);
    const editForm = document.getElementById(`comment-edit-${commentId}`);
    
    if (contentDiv && editForm) {
      contentDiv.style.display = 'none';
      editForm.style.display = 'block';
      editForm.querySelector('textarea').focus();
    }
  }

  cancelEdit(commentId) {
    const contentDiv = document.getElementById(`comment-content-${commentId}`);
    const editForm = document.getElementById(`comment-edit-${commentId}`);
    
    if (contentDiv && editForm) {
      contentDiv.style.display = 'block';
      editForm.style.display = 'none';
      
      // Reset textarea to original content
      const originalContent = contentDiv.querySelector('p').textContent;
      editForm.querySelector('textarea').value = originalContent;
    }
  }

  async saveEdit(commentId) {
    const editForm = document.getElementById(`comment-edit-${commentId}`);
    const textarea = editForm.querySelector('textarea');
    const newContent = textarea.value.trim();
    
    if (!newContent) {
      this.showError('Comment cannot be empty');
      return;
    }
    
    try {
      const saveButton = editForm.querySelector('.btn-primary');
      saveButton.disabled = true;
      saveButton.textContent = 'Saving...';
      
      const response = await axios.put(`/api/comments/${commentId}`, {
        content: newContent
      });
      
      if (response.data.success) {
        // Update the content display
        const contentDiv = document.getElementById(`comment-content-${commentId}`);
        contentDiv.querySelector('p').textContent = newContent;
        
        // Hide edit form and show content
        contentDiv.style.display = 'block';
        editForm.style.display = 'none';
        
        this.showMessage('Comment updated successfully!', 'success');
      } else {
        throw new Error(response.data.error || 'Failed to update comment');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      this.showError('Failed to update comment. Please try again.');
    } finally {
      const saveButton = editForm.querySelector('.btn-primary');
      saveButton.disabled = false;
      saveButton.textContent = 'Save';
    }
  }

  async deleteComment(commentId) {
    this.toggleCommentMenu(commentId);
    
    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await axios.delete(`/api/comments/${commentId}`);
      
      if (response.data.success) {
        // Remove comment from DOM
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentElement) {
          commentElement.remove();
        }
        
        // Reload comments to update count
        await this.loadComments();
        
        this.showMessage('Comment deleted successfully!', 'success');
      } else {
        throw new Error(response.data.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      this.showError('Failed to delete comment. Please try again.');
    }
  }

  async moderateComment(commentId, authorName) {
    this.toggleCommentMenu(commentId);
    
    const action = prompt(`Choose moderation action for user "${authorName}":\n\n1. Warn user\n2. Suspend for 1 day\n3. Suspend for 7 days\n4. Ban permanently\n\nEnter number (1-4) or cancel:`);
    
    if (!action || !['1', '2', '3', '4'].includes(action)) {
      return;
    }
    
    const actions = {
      '1': { type: 'warn', message: 'User has been warned' },
      '2': { type: 'suspend', days: 1, message: 'User suspended for 1 day' },
      '3': { type: 'suspend', days: 7, message: 'User suspended for 7 days' },
      '4': { type: 'ban', message: 'User has been permanently banned' }
    };
    
    const selectedAction = actions[action];
    const reason = prompt('Enter reason for moderation action (optional):') || 'Violating community guidelines';
    
    try {
      const response = await axios.post(`/api/comments/${commentId}/moderate`, {
        action: selectedAction.type,
        days: selectedAction.days,
        reason: reason
      });
      
      if (response.data.success) {
        this.showMessage(selectedAction.message, 'success');
        
        // If comment was deleted as part of moderation, reload comments
        if (response.data.commentDeleted) {
          await this.loadComments();
        }
      } else {
        throw new Error(response.data.error || 'Failed to moderate user');
      }
    } catch (error) {
      console.error('Error moderating user:', error);
      this.showError('Failed to moderate user. Please try again.');
    }
  }

  // Load user like status for comments
  async loadCommentLikeStatus(comments) {
    if (!this.currentUser) return;
    
    // Load like status for each comment
    for (const comment of comments) {
      try {
        const response = await axios.get(`/api/comments/${comment.id}/likes`);
        if (response.data.success) {
          const commentElement = document.querySelector(`[data-comment-id="${comment.id}"]`);
          if (commentElement) {
            const likeBtn = commentElement.querySelector('.comment-like-btn');
            const dislikeBtn = commentElement.querySelector('.comment-dislike-btn');
            
            // Update button states based on user's current like status
            if (response.data.userLikeType === 'like') {
              likeBtn.classList.add('liked');
              dislikeBtn.classList.remove('disliked');
            } else if (response.data.userLikeType === 'dislike') {
              likeBtn.classList.remove('liked');
              dislikeBtn.classList.add('disliked');
            } else {
              likeBtn.classList.remove('liked');
              dislikeBtn.classList.remove('disliked');
            }
          }
        }
      } catch (error) {
        console.error('Error loading like status for comment', comment.id, error);
      }
    }
  }

  // Comment Like/Dislike Functions
  async likeComment(commentId) {
    if (!this.currentUser) {
      this.showError('Please sign in to like comments');
      return;
    }

    try {
      const response = await axios.post(`/api/comments/${commentId}/like`);
      
      if (response.data.success) {
        // Update the UI
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        const likeBtn = commentElement.querySelector('.comment-like-btn');
        const dislikeBtn = commentElement.querySelector('.comment-dislike-btn');
        const likeCount = likeBtn.querySelector('.like-count');
        const dislikeCount = dislikeBtn.querySelector('.dislike-count');
        
        // Update counts
        likeCount.textContent = response.data.likeCount;
        dislikeCount.textContent = response.data.dislikeCount;
        
        // Update button states
        if (response.data.liked) {
          likeBtn.classList.add('liked');
          dislikeBtn.classList.remove('disliked'); // Remove dislike if user liked
        } else {
          likeBtn.classList.remove('liked');
        }
        
        this.showMessage(response.data.message, 'success');
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      this.showError('Failed to like comment');
    }
  }

  async dislikeComment(commentId) {
    if (!this.currentUser) {
      this.showError('Please sign in to dislike comments');
      return;
    }

    try {
      const response = await axios.post(`/api/comments/${commentId}/dislike`);
      
      if (response.data.success) {
        // Update the UI
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        const likeBtn = commentElement.querySelector('.comment-like-btn');
        const dislikeBtn = commentElement.querySelector('.comment-dislike-btn');
        const likeCount = likeBtn.querySelector('.like-count');
        const dislikeCount = dislikeBtn.querySelector('.dislike-count');
        
        // Update counts
        likeCount.textContent = response.data.likeCount;
        dislikeCount.textContent = response.data.dislikeCount;
        
        // Update button states
        if (response.data.disliked) {
          dislikeBtn.classList.add('disliked');
          likeBtn.classList.remove('liked'); // Remove like if user disliked
        } else {
          dislikeBtn.classList.remove('disliked');
        }
        
        this.showMessage(response.data.message, 'success');
      }
    } catch (error) {
      console.error('Error disliking comment:', error);
      this.showError('Failed to dislike comment');
    }
  }
}

// Close menus when clicking outside
document.addEventListener('click', function(event) {
  if (!event.target.closest('.comment-menu')) {
    document.querySelectorAll('.comment-menu-dropdown').forEach(menu => {
      menu.style.display = 'none';
    });
  }
});

// Initialize when page loads
let commentsLikes = null;

function initializeCommentsAndLikes(contentType, contentId) {
  commentsLikes = new CommentsLikes(contentType, contentId);
}