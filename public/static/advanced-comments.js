// Advanced Comment System JavaScript
class AdvancedCommentSystem {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId)
    this.options = {
      articleId: options.articleId || null,
      resourceId: options.resourceId || null,
      currentUser: options.currentUser || null,
      ...options
    }
    
    this.comments = []
    this.filters = {
      search: '',
      sort: 'newest', 
      filter: 'all'
    }
    
    this.init()
  }

  async init() {
    this.render()
    this.attachEventListeners()
    await this.loadComments()
  }

  render() {
    this.container.innerHTML = `
      <div class="advanced-comments bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-3xl font-bold mb-2">Discussion</h2>
              <p class="text-blue-100">
                <span id="comment-count">Loading...</span>
              </p>
            </div>
          </div>
        </div>

        <div class="p-6">
          <!-- Controls -->
          <div class="flex flex-wrap gap-4 mb-6">
            <div class="flex-1 min-w-64">
              <div class="relative">
                <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  id="search-input"
                  placeholder="Search comments and authors..."
                  class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <select id="sort-select" class="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="popular">Most Popular</option>
            </select>
            
            <select id="filter-select" class="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Comments</option>
              <option value="pinned">Pinned Only</option>
              ${this.options.currentUser ? '<option value="liked">Liked by Me</option>' : ''}
            </select>
            
            <button id="apply-filters" class="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
              Filter
            </button>
          </div>
          
          <!-- Add Comment -->
          ${this.options.currentUser ? `
            <div class="mb-8 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6">
              <form id="comment-form" class="comment-form flex space-x-4">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-lg shadow-lg">
                  😊
                </div>
                <div class="flex-1 space-y-4">
                  <textarea
                    id="comment-content"
                    placeholder="What are your thoughts? Use @ to mention someone..."
                    class="w-full p-4 border-0 bg-white rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    rows="4"
                    required
                  ></textarea>
                  
                  <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-4">
                      <button type="button" id="emoji-picker-btn" class="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                          <line x1="9" y1="9" x2="9.01" y2="9"/>
                          <line x1="15" y1="9" x2="15.01" y2="9"/>
                        </svg>
                        <span class="text-sm">Emoji</span>
                      </button>
                    </div>
                    
                    <button
                      type="submit"
                      class="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 shadow-lg transition-all duration-200 flex items-center space-x-2 font-medium"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22,2 15,22 11,13 2,9 22,2"/>
                      </svg>
                      <span>Post Comment</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ` : `
            <div class="mb-8 bg-gray-50 rounded-2xl p-6 text-center">
              <p class="text-gray-600">
                <a href="/login" class="text-blue-600 hover:text-blue-800 font-medium">Sign in</a> 
                to join the discussion
              </p>
            </div>
          `}

          <!-- Comments List -->
          <div id="comments-list" class="space-y-6">
            <div class="text-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p class="text-gray-500 mt-2">Loading comments...</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Emoji Picker Modal -->
      <div id="emoji-picker" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
        <div class="bg-white rounded-xl p-6 max-w-md w-full m-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">Choose an emoji</h3>
            <button id="close-emoji-picker" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="emoji-grid grid grid-cols-8 gap-2">
            ${['😀', '😂', '🥰', '😍', '🤔', '👍', '👎', '❤️', '🚀', '✨', '🔥', '💯', '👏', '🎉', '💫', '📱'].map(emoji => 
              `<button class="emoji-option text-2xl hover:bg-gray-100 rounded p-2 transition-colors" data-emoji="${emoji}">${emoji}</button>`
            ).join('')}
          </div>
        </div>
      </div>
    `
  }

  attachEventListeners() {
    // Filter controls
    document.getElementById('apply-filters').addEventListener('click', () => {
      this.filters.search = document.getElementById('search-input').value
      this.filters.sort = document.getElementById('sort-select').value
      this.filters.filter = document.getElementById('filter-select').value
      this.loadComments()
    })

    // Enter key in search
    document.getElementById('search-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('apply-filters').click()
      }
    })

    // Comment form
    if (this.options.currentUser) {
      document.getElementById('comment-form').addEventListener('submit', (e) => {
        e.preventDefault()
        this.submitComment()
      })

      // Emoji picker
      document.getElementById('emoji-picker-btn').addEventListener('click', () => {
        document.getElementById('emoji-picker').classList.remove('hidden')
      })

      document.getElementById('close-emoji-picker').addEventListener('click', () => {
        document.getElementById('emoji-picker').classList.add('hidden')
      })

      document.getElementById('emoji-picker').addEventListener('click', (e) => {
        if (e.target.id === 'emoji-picker') {
          document.getElementById('emoji-picker').classList.add('hidden')
        }
      })

      // Emoji selection
      document.querySelectorAll('.emoji-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const emoji = e.target.dataset.emoji
          const textarea = document.getElementById('comment-content')
          const cursorPos = textarea.selectionStart
          const textBefore = textarea.value.substring(0, cursorPos)
          const textAfter = textarea.value.substring(textarea.selectionEnd)
          textarea.value = textBefore + emoji + textAfter
          textarea.focus()
          textarea.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length)
          document.getElementById('emoji-picker').classList.add('hidden')
        })
      })
    }
  }

  async loadComments() {
    try {
      const params = new URLSearchParams({
        ...(this.options.articleId && { articleId: this.options.articleId }),
        ...(this.options.resourceId && { resourceId: this.options.resourceId }),
        search: this.filters.search,
        sort: this.filters.sort,
        filter: this.filters.filter
      })

      const response = await fetch(`/api/advanced-comments/comments?${params}`)
      const data = await response.json()

      if (data.success) {
        this.comments = data.comments
        this.renderComments()
        this.updateCommentCount()
        this.attachCommentEventListeners()
      } else {
        console.error('Error loading comments:', data.error)
      }
    } catch (error) {
      console.error('Error loading comments:', error)
    }
  }

  renderComments() {
    const commentsList = document.getElementById('comments-list')
    
    if (this.comments.length === 0) {
      commentsList.innerHTML = `
        <div class="text-center py-16 text-gray-500">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          <h3 class="text-xl font-medium mb-2">No comments found</h3>
          <p>
            ${this.filters.search ? 
              `No comments match your search for "${this.filters.search}"` : 
              this.filters.filter === 'pinned' ? 
                'No pinned comments yet' : 
                this.filters.filter === 'liked' ?
                  'No liked comments yet' :
                  'Be the first to share your thoughts!'
            }
          </p>
        </div>
      `
      return
    }

    commentsList.innerHTML = this.comments.map(comment => this.renderComment(comment)).join('')
  }

  renderComment(comment, isReply = false) {
    const replyClass = isReply ? 'ml-8 mt-4 border-l-2 border-blue-100 pl-4' : 'mb-6'
    const pinnedClass = comment.pinned ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md' : 'bg-white border-gray-200 shadow-sm'
    const contentWithMentions = comment.content.replace(/@(\w+)/g, '<span class="text-blue-600 font-semibold">@$1</span>')
    const canModerate = this.options.currentUser && (this.options.currentUser.role === 'admin' || this.options.currentUser.role === 'moderator')
    
    return `
      <div class="${replyClass} ${pinnedClass} rounded-xl border p-5 comment-card transition-all duration-200 hover:shadow-lg" data-comment-id="${comment.id}">
        ${comment.pinned && !isReply ? `
          <div class="flex items-center space-x-2 mb-3 text-blue-600 text-sm font-medium">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 12V4a1 1 0 0 0-.5-.87l-4-2a1 1 0 0 0-1 0l-4 2A1 1 0 0 0 6 4v8H2v2a1 1 0 0 0 1 1h3v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-5h3a1 1 0 0 0 1-1v-2h-4z"/>
            </svg>
            <span>Pinned Comment</span>
          </div>
        ` : ''}

        <!-- Comment Header -->
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-lg shadow-md">
              ${comment.avatar}
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <span class="font-semibold text-gray-900">${comment.author}</span>
                ${this.renderBadge(comment.badge)}
                ${comment.edited ? '<span class="text-xs text-gray-500">(edited)</span>' : ''}
              </div>
              <div class="flex items-center space-x-1 text-sm text-gray-500">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
                <span>${comment.timestamp}</span>
              </div>
            </div>
          </div>
          
          ${this.options.currentUser ? `
            <div class="relative">
              <button class="action-menu-btn p-2 hover:bg-gray-100 rounded-full transition-colors" data-comment-id="${comment.id}">
                <svg class="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="19" cy="12" r="1"/>
                  <circle cx="5" cy="12" r="1"/>
                </svg>
              </button>
              
              <div class="action-menu absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-20 hidden">
                <button class="edit-btn w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 rounded-t-xl" data-comment-id="${comment.id}">
                  <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  <span>Edit comment</span>
                </button>
                ${!isReply && canModerate ? `
                  <button class="pin-btn w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3" data-comment-id="${comment.id}">
                    <svg class="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 12V4a1 1 0 0 0-.5-.87l-4-2a1 1 0 0 0-1 0l-4 2A1 1 0 0 0 6 4v8H2v2a1 1 0 0 0 1 1h3v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-5h3a1 1 0 0 0 1-1v-2h-4z"/>
                    </svg>
                    <span>${comment.pinned ? 'Unpin' : 'Pin'} comment</span>
                  </button>
                ` : ''}
                <button class="report-btn w-full px-4 py-3 text-left hover:bg-gray-50 text-red-600 flex items-center space-x-3 rounded-b-xl">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6v1a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  </svg>
                  <span>Report comment</span>
                </button>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Comment Content -->
        <div class="mb-4">
          <div class="prose prose-sm max-w-none">
            <p class="text-gray-800 leading-relaxed whitespace-pre-wrap">${contentWithMentions}</p>
          </div>
        </div>

        <!-- Comment Actions -->
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-6 text-sm">
            <button class="like-btn flex items-center space-x-2 transition-colors ${
              comment.liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }" data-comment-id="${comment.id}" data-liked="${comment.liked}">
              <svg class="w-5 h-5 ${comment.liked ? 'fill-current' : ''}" fill="${comment.liked ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
              <span class="like-count font-medium">${comment.likes}</span>
            </button>
            
            ${!isReply && this.options.currentUser ? `
              <button class="reply-btn flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors" data-comment-id="${comment.id}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                <span>Reply</span>
              </button>
            ` : ''}
          </div>
        </div>

        ${!isReply && this.options.currentUser ? `
          <!-- Reply Input -->
          <div class="reply-input mt-6 bg-gray-50 rounded-xl p-4 hidden" data-parent-id="${comment.id}">
            <form class="reply-form flex space-x-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-lg">
                😊
              </div>
              <div class="flex-1 space-y-3">
                <textarea
                  placeholder="Reply to ${comment.author}..."
                  class="w-full p-4 border-0 bg-white rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  rows="3"
                  required
                ></textarea>
                <div class="flex justify-end space-x-2">
                  <button type="button" class="cancel-reply px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22,2 15,22 11,13 2,9 22,2"/>
                    </svg>
                    <span>Reply</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        ` : ''}

        <!-- Replies -->
        ${comment.replies && comment.replies.length > 0 ? 
          comment.replies.map(reply => this.renderComment(reply, true)).join('') : ''
        }
      </div>
    `
  }

  renderBadge(badge) {
    if (!badge) return ''
    
    const badgeClasses = {
      'Admin': 'bg-red-100 text-red-800',
      'Moderator': 'bg-blue-100 text-blue-800', 
      'Member': 'bg-gray-100 text-gray-800'
    }
    
    return `<span class="px-2 py-1 rounded-full text-xs font-medium ${badgeClasses[badge] || badgeClasses['Member']}">${badge}</span>`
  }

  attachCommentEventListeners() {
    // Action menu toggle
    document.addEventListener('click', (e) => {
      // Close all action menus first
      document.querySelectorAll('.action-menu').forEach(menu => {
        if (!e.target.closest('.action-menu-btn') || 
            e.target.closest('.action-menu-btn').dataset.commentId !== menu.closest('[data-comment-id]').dataset.commentId) {
          menu.classList.add('hidden')
        }
      })
      
      if (e.target.closest('.action-menu-btn')) {
        const btn = e.target.closest('.action-menu-btn')
        const menu = btn.nextElementSibling
        menu.classList.toggle('hidden')
      }
      
      // Like button
      if (e.target.closest('.like-btn')) {
        e.preventDefault()
        const btn = e.target.closest('.like-btn')
        const commentId = btn.dataset.commentId
        this.toggleLike(commentId, btn)
      }
      
      // Reply button
      if (e.target.closest('.reply-btn')) {
        e.preventDefault()
        const btn = e.target.closest('.reply-btn')
        const commentId = btn.dataset.commentId
        const replyInput = document.querySelector(`[data-parent-id="${commentId}"].reply-input`)
        
        if (replyInput) {
          replyInput.classList.toggle('hidden')
          if (!replyInput.classList.contains('hidden')) {
            replyInput.querySelector('textarea').focus()
          }
        }
      }
      
      // Cancel reply
      if (e.target.closest('.cancel-reply')) {
        e.preventDefault()
        const replyInput = e.target.closest('.reply-input')
        replyInput.classList.add('hidden')
        replyInput.querySelector('textarea').value = ''
      }

      // Pin button
      if (e.target.closest('.pin-btn')) {
        e.preventDefault()
        const btn = e.target.closest('.pin-btn')
        const commentId = btn.dataset.commentId
        this.togglePin(commentId)
      }
    })

    // Reply form submission
    document.querySelectorAll('.reply-form').forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault()
        const parentId = form.closest('.reply-input').dataset.parentId
        const content = form.querySelector('textarea').value.trim()
        
        if (content) {
          this.submitReply(parentId, content, form)
        }
      })
    })
  }

  async submitComment() {
    const content = document.getElementById('comment-content').value.trim()
    
    if (!content) return

    try {
      const response = await fetch('/api/advanced-comments/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          articleId: this.options.articleId,
          resourceId: this.options.resourceId
        })
      })

      const data = await response.json()

      if (data.success) {
        document.getElementById('comment-content').value = ''
        await this.loadComments()
      } else {
        console.error('Error submitting comment:', data.error)
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
    }
  }

  async submitReply(parentId, content, form) {
    try {
      const response = await fetch('/api/advanced-comments/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          articleId: this.options.articleId,
          resourceId: this.options.resourceId,
          parentId: parseInt(parentId)
        })
      })

      const data = await response.json()

      if (data.success) {
        form.querySelector('textarea').value = ''
        form.closest('.reply-input').classList.add('hidden')
        await this.loadComments()
      } else {
        console.error('Error submitting reply:', data.error)
      }
    } catch (error) {
      console.error('Error submitting reply:', error)
    }
  }

  async toggleLike(commentId, btn) {
    try {
      const response = await fetch(`/api/advanced-comments/comments/${commentId}/like`, {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        btn.dataset.liked = data.liked
        btn.querySelector('.like-count').textContent = data.likes
        
        const svg = btn.querySelector('svg')
        if (data.liked) {
          btn.classList.add('text-red-500')
          btn.classList.remove('text-gray-500')
          svg.setAttribute('fill', 'currentColor')
        } else {
          btn.classList.add('text-gray-500')
          btn.classList.remove('text-red-500')
          svg.setAttribute('fill', 'none')
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  async togglePin(commentId) {
    try {
      const response = await fetch(`/api/advanced-comments/comments/${commentId}/pin`, {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        await this.loadComments()
      }
    } catch (error) {
      console.error('Error toggling pin:', error)
    }
  }

  updateCommentCount() {
    const count = this.comments.length
    const totalReplies = this.comments.reduce((sum, comment) => sum + (comment.replies?.length || 0), 0)
    const total = count + totalReplies
    
    document.getElementById('comment-count').textContent = 
      `${total} ${total === 1 ? 'comment' : 'comments'}${this.filters.search ? ` matching "${this.filters.search}"` : ''}`
  }
}

// Export for use
window.AdvancedCommentSystem = AdvancedCommentSystem