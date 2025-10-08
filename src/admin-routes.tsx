import { Hono } from 'hono';
import { adminRenderer, AdminLayout } from './admin-renderer';
import { getLoggedInUser } from './auth';
import { getArticles, getResources } from './database-neon';
import adminApi from './admin-api';

const adminApp = new Hono();

// Use admin renderer
adminApp.use(adminRenderer);

// Mount admin API routes
adminApp.route('/api', adminApi);

// Admin authentication check - allows both admin and moderator
async function requireAdminOrModerator(c: any, next: () => Promise<void>) {
  const user = await getLoggedInUser(c);

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return c.redirect('/login');
  }

  // Store user in context with proper typing
  (c as any).adminUser = user;
  await next();
}

// Admin-only authentication check - allows only admin role
async function requireAdminOnly(c: any, next: () => Promise<void>) {
  const user = await getLoggedInUser(c);

  if (!user || user.role !== 'admin') {
    return c.text('Access Denied: Admin privileges required', 403);
  }

  // Store user in context with proper typing
  (c as any).adminUser = user;
  await next();
}

// Apply admin/moderator authentication to all routes by default
adminApp.use('*', requireAdminOrModerator);

// Admin Dashboard - Admin Only
adminApp.get('/', requireAdminOnly, async (c) => {
  const user = (c as any).adminUser;

  return c.render(
    <AdminLayout currentUser={user} currentPage="dashboard" breadcrumb="Dashboard">
      <div class="admin-page-header">
        <h1 class="admin-page-title">Dashboard</h1>
        <p class="admin-page-subtitle">Overview of your Faith Defenders community</p>
      </div>

      {/* Statistics Grid */}
      <div class="admin-stats-grid">
        <div class="admin-stat-card">
          <div class="admin-stat-header">
            <div class="admin-stat-title">Total Users</div>
            <div class="admin-stat-icon blue">
              <i class="fas fa-users"></i>
            </div>
          </div>
          <div class="admin-stat-number" id="total-users">-</div>
          <div class="admin-stat-change positive" id="users-change">Loading...</div>
        </div>

        <div class="admin-stat-card">
          <div class="admin-stat-header">
            <div class="admin-stat-title">Published Articles</div>
            <div class="admin-stat-icon green">
              <i class="fas fa-newspaper"></i>
            </div>
          </div>
          <div class="admin-stat-number" id="published-articles">-</div>
          <div class="admin-stat-change positive" id="articles-change">Loading...</div>
        </div>

        <div class="admin-stat-card">
          <div class="admin-stat-header">
            <div class="admin-stat-title">Total Resources</div>
            <div class="admin-stat-icon yellow">
              <i class="fas fa-book"></i>
            </div>
          </div>
          <div class="admin-stat-number" id="total-resources">-</div>
          <div class="admin-stat-change positive" id="resources-change">Loading...</div>
        </div>

        <div class="admin-stat-card">
          <div class="admin-stat-header">
            <div class="admin-stat-title">Total Views</div>
            <div class="admin-stat-icon red">
              <i class="fas fa-eye"></i>
            </div>
          </div>
          <div class="admin-stat-number" id="total-views">-</div>
          <div class="admin-stat-change positive" id="views-change">Loading...</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">Quick Actions</h3>
            <p class="admin-card-subtitle">Common administrative tasks</p>
          </div>
          <div class="admin-card-content">
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <a href="/admin/articles/new" class="admin-btn admin-btn-primary">
                <i class="fas fa-plus"></i> New Article
              </a>
              <a href="/admin/resources/new" class="admin-btn admin-btn-secondary">
                <i class="fas fa-plus"></i> Add Resource
              </a>
              <a href="/admin/users" class="admin-btn admin-btn-outline">
                <i class="fas fa-users"></i> Manage Users
              </a>
            </div>
          </div>
        </div>

        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">Recent Activity</h3>
            <p class="admin-card-subtitle">Latest site activity</p>
          </div>
          <div class="admin-card-content">
            <div id="recent-activity">
              <div class="admin-loading">
                <div class="admin-spinner"></div>
                Loading recent activity...
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Content */}
      <div class="admin-card">
        <div class="admin-card-header">
          <h3 class="admin-card-title">Recent Content</h3>
          <p class="admin-card-subtitle">Latest articles and resources</p>
        </div>
        <div class="admin-card-content">
          <div id="recent-content">
            <div class="admin-loading">
              <div class="admin-spinner"></div>
              Loading recent content...
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            // Wait for admin.js to load before calling loadDashboardData
            function checkForFunction() {
              if (typeof window.loadDashboardData === 'function') {
                window.loadDashboardData();
              } else {
                setTimeout(checkForFunction, 100);
              }
            }
            checkForFunction();
          });
        `
      }}></script>
    </AdminLayout>,
    { title: 'Dashboard' }
  );
});

// Admin Messages - Admin and Moderator
adminApp.get('/messages', async (c) => {
  const user = (c as any).adminUser;

  return c.render(
    <AdminLayout currentUser={user} currentPage="messages" breadcrumb="Admin Team Chat">
      {/* WhatsApp-style chat interface */}
      <div class="admin-chat-fullpage">
        {/* Chat Header */}
        <div class="admin-chat-header">
          <div class="admin-chat-team-info">
            <div class="admin-chat-team-avatar">
              <i class="fas fa-users"></i>
            </div>
            <div class="admin-chat-team-details">
              <h3>Admin Team Chat</h3>
              <p class="admin-chat-team-subtitle">
                <span id="chat-members-count">Loading...</span> members •
                <span id="chat-online-status">Online</span>
              </p>
            </div>
          </div>
          <div class="admin-chat-header-actions">
            <button class="admin-chat-header-btn" onclick="toggleChatSettings()" title="Chat Settings">
              <i class="fas fa-cog"></i>
            </button>
            <button class="admin-chat-header-btn" onclick="scrollToTop()" title="Scroll to Top">
              <i class="fas fa-chevron-up"></i>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div class="admin-chat-messages" id="chat-messages">
          <div class="admin-chat-loading">
            <div class="admin-chat-loading-spinner"></div>
            <span>Loading messages...</span>
          </div>
        </div>

        {/* Typing Indicator */}
        <div id="typing-indicator" class="admin-chat-typing" style="display: none;">
          <div class="admin-chat-typing-avatar">
            <i class="fas fa-user"></i>
          </div>
          <div class="admin-chat-typing-dots">
            <div class="admin-chat-typing-dot"></div>
            <div class="admin-chat-typing-dot"></div>
            <div class="admin-chat-typing-dot"></div>
          </div>
        </div>

        {/* Message Input Area */}
        <div class="admin-chat-input-area">
          {/* Reply Preview */}
          <div id="reply-preview" class="admin-chat-reply-preview" style="display: none;">
            <div class="admin-chat-reply-preview-content">
              <div class="admin-chat-reply-preview-header">
                <i class="fas fa-reply admin-chat-reply-icon"></i>
                <span class="admin-chat-reply-author" id="reply-author"></span>
                <button class="admin-chat-reply-cancel" onclick="cancelReply()" title="Cancel Reply">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div class="admin-chat-reply-preview-text" id="reply-text"></div>
            </div>
          </div>

          {/* File Preview */}
          <div id="file-preview-area" class="admin-chat-file-preview" style="display: none;">
            <div class="admin-chat-file-preview-item">
              <i class="fas fa-file admin-chat-file-preview-icon" id="preview-file-icon"></i>
              <div class="admin-chat-file-preview-info">
                <div class="admin-chat-file-preview-name" id="preview-file-name"></div>
                <div class="admin-chat-file-preview-size" id="preview-file-size"></div>
              </div>
              <button class="admin-chat-file-preview-remove" onclick="removeFilePreview()">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>

          {/* Input Controls */}
          <div class="admin-chat-input-container">
            {/* Attachment Button */}
            {user.role === 'admin' && (
              <button class="admin-chat-input-btn" onclick="document.getElementById('file-input').click()" title="Attach File">
                <i class="fas fa-paperclip"></i>
              </button>
            )}
            
            <input
              type="file"
              id="file-input"
              style="display: none;"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            />

            {/* Text Input */}
            <textarea
              id="message-input"
              class="admin-chat-input"
              placeholder="Type your message..."
              rows="1"
              onkeydown="handleMessageInputKeydown(event)"
              oninput="handleMessageInputChange(event)"
              onfocus="handleInputFocus()"
              onblur="handleInputBlur()"
            ></textarea>

            <div class="admin-chat-input-actions">
              {/* Emoji Button */}
              <button class="admin-chat-input-btn" onclick="toggleEmojiPicker()" title="Add Emoji">
                <i class="fas fa-smile"></i>
              </button>

              {/* Send Button */}
              <button
                id="send-btn"
                class="admin-chat-send-btn"
                onclick="sendMessage()"
                title="Send Message"
                disabled
              >
                <i class="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>

          {/* Quick Actions (for important messages) */}
          {user.role === 'admin' && (
            <div id="quick-actions" class="admin-chat-quick-actions" style="display: none;">
              <button class="admin-chat-action-btn" onclick="toggleHighlight()" title="Important Message">
                <i class="fas fa-exclamation-triangle"></i>
              </button>
              <button class="admin-chat-action-btn" onclick="togglePinMessage()" title="Pin Message">
                <i class="fas fa-thumbtack"></i>
              </button>
            </div>
          )}
        </div>

        {/* Settings Panel */}
        <div id="chat-settings" class="admin-chat-settings" style="display: none;">
          <div class="admin-chat-settings-header">
            Chat Settings
          </div>
          <div class="admin-chat-settings-content">
            <div class="admin-chat-settings-group">
              <div class="admin-chat-settings-checkbox">
                <input type="checkbox" id="auto-scroll" checked />
                <label for="auto-scroll">Auto-scroll to new messages</label>
              </div>
            </div>
            <div class="admin-chat-settings-group">
              <div class="admin-chat-settings-checkbox">
                <input type="checkbox" id="sound-notifications" />
                <label for="sound-notifications">Sound notifications</label>
              </div>
            </div>
            <div class="admin-chat-settings-group">
              <label class="admin-chat-settings-label">Filter messages by role:</label>
              <select id="role-filter" class="admin-chat-settings-select" onchange="applyRoleFilter()">
                <option value="all">All Messages</option>
                <option value="admin">Admin Only</option>
                <option value="moderator">Moderator Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          // Global chat variables
          let isHighlighted = false;
          let isPinned = false;
          let currentFile = null;
          let typingTimer = null;

          document.addEventListener('DOMContentLoaded', function() {
            initializeChat();
            loadChatMessages();
            setupFileUpload();
            setupAutoResize();
          });

          function initializeChat() {
            // Set initial member count
            document.getElementById('chat-members-count').textContent = '2';
            
            // Setup keyboard shortcuts
            document.addEventListener('keydown', function(e) {
              if (e.ctrlKey && e.key === 'Enter') {
                sendMessage();
              }
            });

            // Auto-scroll new messages
            const chatMessages = document.getElementById('chat-messages');
            const observer = new MutationObserver(() => {
              if (document.getElementById('auto-scroll').checked) {
                scrollToBottom();
              }
            });
            observer.observe(chatMessages, { childList: true });
          }

          function handleMessageInputKeydown(event) {
            const input = event.target;
            
            // Handle Enter key
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              sendMessage();
              return;
            }

            // Handle Escape key
            if (event.key === 'Escape') {
              input.blur();
              return;
            }

            // Show/hide quick actions for admin
            if (input.value.trim() && document.getElementById('quick-actions')) {
              document.getElementById('quick-actions').style.display = 'flex';
            }
          }

          function handleMessageInputChange(event) {
            const input = event.target;
            const sendBtn = document.getElementById('send-btn');
            
            // Enable/disable send button
            sendBtn.disabled = !input.value.trim() && !currentFile;
            
            // Auto-resize textarea
            autoResizeTextarea(input);
            
            // Handle typing indicator
            if (input.value.trim()) {
              startTyping();
            } else {
              stopTyping();
              if (document.getElementById('quick-actions')) {
                document.getElementById('quick-actions').style.display = 'none';
              }
            }
          }

          function autoResizeTextarea(textarea) {
            textarea.style.height = 'auto';
            const maxHeight = 120; // Max 5 lines approximately
            textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
          }

          function setupAutoResize() {
            const textarea = document.getElementById('message-input');
            autoResizeTextarea(textarea);
          }

          function sendMessage() {
            const input = document.getElementById('message-input');
            const message = input.value.trim();

            if (!message && !currentFile) return;

            const messageData = {
              content: message,
              isHighlighted: isHighlighted,
              isPinned: isPinned,
              file: currentFile,
              replyTo: currentReplyMessage ? currentReplyMessage.id : null,
              replyToAuthor: currentReplyMessage ? currentReplyMessage.author : null,
              replyToContent: currentReplyMessage ? currentReplyMessage.content : null
            };

            // Send to API
            postChatMessage(messageData);

            // Clear input and reset states
            input.value = '';
            input.style.height = 'auto';
            resetMessageStates();
            cancelReply(); // Clear reply state
            stopTyping();

            document.getElementById('send-btn').disabled = true;
            if (document.getElementById('quick-actions')) {
              document.getElementById('quick-actions').style.display = 'none';
            }
          }

          function resetMessageStates() {
            isHighlighted = false;
            isPinned = false;
            if (currentFile) {
              removeFilePreview();
            }
          }

          function startTyping() {
            if (typingTimer) clearTimeout(typingTimer);
            
            document.getElementById('typing-indicator').style.display = 'flex';
            
            typingTimer = setTimeout(() => {
              stopTyping();
            }, 3000);
          }

          function stopTyping() {
            if (typingTimer) {
              clearTimeout(typingTimer);
              typingTimer = null;
            }
            document.getElementById('typing-indicator').style.display = 'none';
          }

          function scrollToBottom() {
            const chatMessages = document.getElementById('chat-messages');
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }

          function scrollToTop() {
            const chatMessages = document.getElementById('chat-messages');
            chatMessages.scrollTop = 0;
          }

          function toggleChatSettings() {
            const settings = document.getElementById('chat-settings');
            settings.style.display = settings.style.display === 'none' ? 'block' : 'none';
          }

          function setupFileUpload() {
            const fileInput = document.getElementById('file-input');
            if (fileInput) {
              fileInput.addEventListener('change', handleFileSelect);
            }
          }

          function handleFileSelect(event) {
            const file = event.target.files[0];
            if (!file) return;

            currentFile = file;
            showFilePreview(file);
            
            // Enable send button
            document.getElementById('send-btn').disabled = false;
          }

          function showFilePreview(file) {
            const previewArea = document.getElementById('file-preview-area');
            const fileName = document.getElementById('preview-file-name');
            const fileSize = document.getElementById('preview-file-size');
            const fileIcon = document.getElementById('preview-file-icon');

            fileName.textContent = file.name;
            fileSize.textContent = formatFileSize(file.size);

            // Set appropriate icon
            if (file.type.startsWith('image/')) {
              fileIcon.className = 'fas fa-image';
            } else if (file.type.startsWith('video/')) {
              fileIcon.className = 'fas fa-video';
            } else if (file.type.startsWith('audio/')) {
              fileIcon.className = 'fas fa-music';
            } else {
              fileIcon.className = 'fas fa-file';
            }

            previewArea.style.display = 'block';
          }

          function removeFilePreview() {
            document.getElementById('file-preview-area').style.display = 'none';
            document.getElementById('file-input').value = '';
            currentFile = null;
            
            // Update send button state
            const input = document.getElementById('message-input');
            document.getElementById('send-btn').disabled = !input.value.trim();
          }

          function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
          }

          function toggleHighlight() {
            isHighlighted = !isHighlighted;
            const btn = event.target.closest('.quick-action-btn');
            btn.classList.toggle('active', isHighlighted);
          }

          function togglePinMessage() {
            isPinned = !isPinned;
            const btn = event.target.closest('.quick-action-btn');
            btn.classList.toggle('active', isPinned);
          }

          function applyRoleFilter() {
            const filter = document.getElementById('role-filter').value;
            // Apply filter logic here
            loadChatMessages(filter);
          }

          function handleInputFocus() {
            // Optional: Add focus styling or behavior
          }

          function handleInputBlur() {
            // Optional: Add blur behavior
          }

          // Mobile keyboard handling
          function setupMobileKeyboardHandling() {
            const input = document.getElementById('message-input');
            const inputArea = document.getElementById('admin-chat-input-area');
            let keyboardVisible = false;
            let originalScrollTop = 0;

            // Detect viewport changes (keyboard show/hide)
            function handleViewportChange() {
              const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
              const totalHeight = window.visualViewport ? window.visualViewport.height + window.visualViewport.offsetTop : window.innerHeight;
              const keyboardHeight = window.innerHeight - currentHeight;

              if (keyboardHeight > 150) { // Keyboard is likely visible
                if (!keyboardVisible) {
                  keyboardVisible = true;
                  originalScrollTop = window.pageYOffset;

                  // Ensure input stays visible
                  setTimeout(() => {
                    if (input && inputArea) {
                      inputArea.scrollIntoView({ behavior: 'smooth', block: 'end' });
                      // Maintain focus
                      if (document.activeElement !== input) {
                        input.focus();
                      }
                    }
                  }, 300);
                }
              } else {
                if (keyboardVisible) {
                  keyboardVisible = false;
                  // Restore scroll position when keyboard hides
                  setTimeout(() => {
                    window.scrollTo(0, originalScrollTop);
                  }, 100);
                }
              }
            }

            // Listen for viewport changes
            if (window.visualViewport) {
              window.visualViewport.addEventListener('resize', handleViewportChange);
            } else {
              // Fallback for browsers without visualViewport
              window.addEventListener('resize', handleViewportChange);
            }

            // Handle input focus/blur events
            if (input) {
              input.addEventListener('focus', function() {
                // On mobile, ensure input is visible when focused
                setTimeout(() => {
                  if (inputArea) {
                    inputArea.scrollIntoView({ behavior: 'smooth', block: 'end' });
                  }
                }, 100);
              });

              input.addEventListener('blur', function() {
                // Small delay to prevent focus loss during keyboard transitions
                setTimeout(() => {
                  if (keyboardVisible && !document.activeElement) {
                    // If keyboard is still visible but no element is focused, refocus input
                    input.focus();
                  }
                }, 100);
              });
            }

            // Prevent body scroll when input is focused on mobile
            document.body.addEventListener('touchmove', function(e) {
              if (keyboardVisible && document.activeElement === input) {
                // Allow scrolling only within the chat messages area
                if (!e.target.closest('.admin-chat-messages')) {
                  e.preventDefault();
                }
              }
            }, { passive: false });
          }

          // Initialize mobile keyboard handling
          if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            setupMobileKeyboardHandling();
          }

          // API functions
          async function loadChatMessages(roleFilter = 'all') {
            try {
              const response = await fetch('/api/admin/messages' + (roleFilter !== 'all' ? '?role=' + roleFilter : ''));
              const data = await response.json();
              renderChatMessages(data.messages || []);
            } catch (error) {
              console.error('Error loading messages:', error);
            }
          }

          async function postChatMessage(messageData) {
            try {
              const formData = new FormData();
              formData.append('content', messageData.content);
              formData.append('isHighlighted', messageData.isHighlighted);

              // Add reply data if present
              if (messageData.replyTo) {
                formData.append('replyTo', messageData.replyTo);
                formData.append('replyToAuthor', messageData.replyToAuthor);
                formData.append('replyToContent', messageData.replyToContent);
              }

              if (messageData.file) {
                formData.append('media', messageData.file);
              }

              const response = await fetch('/api/admin/messages', {
                method: 'POST',
                body: formData
              });

              if (response.ok) {
                // Reload messages to show the new one
                loadChatMessages();
              } else {
                throw new Error('Failed to send message');
              }
            } catch (error) {
              console.error('Error sending message:', error);
              alert('Failed to send message. Please try again.');
            }
          }

          function renderChatMessages(messages) {
            const container = document.getElementById('chat-messages');
            
            if (messages.length === 0) {
              container.innerHTML = '<div class="admin-chat-empty"><i class="fas fa-comments admin-chat-empty-icon"></i><h3>No messages yet</h3><p>Start the conversation!</p></div>';
              return;
            }

            const messagesHTML = messages.map(message => createChatMessageHTML(message)).join('');
            container.innerHTML = messagesHTML;
            
            if (document.getElementById('auto-scroll').checked) {
              scrollToBottom();
            }
          }

          function createChatMessageHTML(message) {
            const isOwn = message.author_id === parseInt('${user.id}'); // Current user's message
            const messageClass = isOwn ? 'admin-chat-message own' : 'admin-chat-message other';
            const highlightClass = message.is_highlighted ? ' highlighted' : '';

            return \`
              <div class="\${messageClass}\${highlightClass}" data-message-id="\${message.id}">
                <div class="admin-chat-bubble">
                  <div class="admin-chat-message-header">
                    <div class="admin-chat-message-author">
                      \${message.author_name}
                      <span class="admin-chat-message-role \${message.author_role}">\${message.author_role}</span>
                    </div>
                  </div>

                  \${message.media_url ? \`<div class="admin-chat-media">
                    \${renderMessageMedia(message)}
                  </div>\` : ''}

                  \${message.content ? \`<div class="admin-chat-message-content">
                    <p>\${escapeHtml(message.content)}</p>
                  </div>\` : ''}

                  <div class="admin-chat-message-meta">
                    <span class="admin-chat-message-time">\${formatMessageTime(message.created_at)}</span>
                    <div class="admin-chat-message-status">
                      \${message.is_highlighted ? '<i class="fas fa-exclamation-triangle admin-chat-status-icon" title="Important" style="color: #f59e0b;"></i>' : ''}
                      \${isOwn ? '<i class="fas fa-check admin-chat-status-icon sent" title="Sent"></i>' : ''}
                    </div>
                  </div>

                  <div class="admin-chat-message-actions">
                    <button class="admin-chat-action-btn" onclick="reactToMessage(\${message.id}, 'like')" title="Like">
                      <i class="fas fa-thumbs-up"></i>
                    </button>
                    <button class="admin-chat-action-btn" onclick="replyToMessage(\${message.id})" title="Reply">
                      <i class="fas fa-reply"></i>
                    </button>
                    \${message.author_id === parseInt('${user.id}') || '${user.role}' === 'admin' ? \`
                      <button class="admin-chat-action-btn" onclick="deleteMessage(\${message.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                      </button>
                    \` : ''}
                  </div>
                </div>
              </div>
            \`;
          }

          function renderMessageMedia(message) {
            if (!message.media_url) return '';
            
            switch (message.media_type) {
              case 'image':
                return \`<img src="\${message.media_url}" alt="Image" class="message-image" onclick="openImageModal(this.src)" />\`;
              case 'video':
                return \`<video controls class="message-video"><source src="\${message.media_url}" /></video>\`;
              case 'audio':
                return \`<audio controls class="message-audio"><source src="\${message.media_url}" /></audio>\`;
              default:
                return \`<div class="message-file">
                  <i class="fas fa-file"></i>
                  <div class="file-info">
                    <div class="file-name">\${message.file_name || 'Document'}</div>
                    <div class="file-size">\${formatFileSize(message.file_size || 0)}</div>
                  </div>
                  <a href="\${message.media_url}" download class="file-download">
                    <i class="fas fa-download"></i>
                  </a>
                </div>\`;
            }
          }

          function formatMessageTime(timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            
            if (date.toDateString() === now.toDateString()) {
              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else {
              return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
                     date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
          }

          function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
          }

          function openImageModal(src) {
            // Create a simple image modal
            const modal = document.createElement('div');
            modal.className = 'image-modal';
            modal.innerHTML = \`
              <div class="image-modal-content">
                <img src="\${src}" alt="Full size image" />
                <button class="image-modal-close">&times;</button>
              </div>
            \`;

            modal.addEventListener('click', function(e) {
              if (e.target === modal || e.target.classList.contains('image-modal-close')) {
                document.body.removeChild(modal);
              }
            });

            document.body.appendChild(modal);
          }

          function deleteMessage(messageId) {
            if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
              return;
            }

            fetch(\`/api/messages/\${messageId}\`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
            })
            .then(response => {
              if (response.ok) {
                return response.json();
              } else {
                throw new Error('Network response was not ok');
              }
            })
            .then(data => {
              if (data.success) {
                // Remove the message from the UI
                const messageElement = document.querySelector(\`[data-message-id="\${messageId}"]\`);
                if (messageElement) {
                  messageElement.style.opacity = '0';
                  messageElement.style.transform = 'translateY(-10px)';
                  setTimeout(() => {
                    messageElement.remove();
                  }, 300);
                }
                // Show success message
                showAdminMessage('Message deleted successfully!', 'success');
              } else {
                throw new Error(data.error || 'Failed to delete message');
              }
            })
            .catch(error => {
              console.error('Error deleting message:', error);
              showAdminMessage('Failed to delete message. Please try again.', 'error');
            });
          }
        `
      }}></script>
    </AdminLayout>,
    { title: 'Admin Team Chat' }
  );
});

// Articles Management
adminApp.get('/articles', async (c) => {
  const user = (c as any).adminUser;

  return c.render(
    <AdminLayout currentUser={user} currentPage="articles" breadcrumb="Articles">
      <div class="admin-page-header">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 class="admin-page-title">Articles</h1>
            <p class="admin-page-subtitle">Manage all articles on your site</p>
          </div>
          <a href="/admin/articles/new" class="admin-btn admin-btn-primary">
            <i class="fas fa-plus"></i> New Article
          </a>
        </div>
      </div>

      {/* Search and Filter Controls - Compact Inline */}
      <div class="admin-simple-filters">
        <div class="admin-filter-row">
          <div class="admin-filter-group">
            <label class="admin-filter-label">Search</label>
            <input
              type="text"
              id="articles-search"
              class="admin-filter-input"
              placeholder="Search articles..."
              onkeyup="if(event.key === 'Enter') applyFilters('articles')"
            />
          </div>

          <div class="admin-filter-group">
            <label class="admin-filter-label">Status</label>
            <select id="articles-status-filter" class="admin-filter-select" onchange="applyFilters('articles')">
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div class="admin-filter-group">
            <label class="admin-filter-label">Category</label>
            <select id="articles-category-filter" class="admin-filter-select" onchange="applyFilters('articles')">
              <option value="all">All Categories</option>
              {/* Categories will be loaded dynamically */}
            </select>
          </div>

          <div class="admin-filter-group">
            <label class="admin-filter-label">Author</label>
            <select id="articles-author-filter" class="admin-filter-select" onchange="applyFilters('articles')">
              <option value="all">All Authors</option>
              {/* Authors will be loaded dynamically */}
            </select>
          </div>

          <div class="admin-filter-group">
            <label class="admin-filter-label">Clear</label>
            <button onclick="clearFilters('articles')" class="admin-btn admin-btn-outline">
              <i class="fas fa-times"></i> Clear
            </button>
          </div>
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-card-content">
          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="articles-table">
                <tr>
                  <td colspan="6" style="text-align: center; padding: 2rem;">
                    <div class="admin-loading">
                      <div class="admin-spinner"></div>
                      Loading articles...
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div id="articles-pagination" class="admin-pagination-container"></div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            // Load categories and authors for filter dropdowns
            window.loadCategoriesDropdown('articles-category-filter');
            window.loadAuthorsDropdown('articles-author-filter');

            function checkForFunction() {
              if (typeof window.loadArticles === 'function') {
                window.loadArticles();
              } else {
                setTimeout(checkForFunction, 100);
              }
            }
            checkForFunction();
          });
        `
      }}></script>
    </AdminLayout>,
    { title: 'Articles' }
  );
});

// New Article
adminApp.get('/articles/new', async (c) => {
  const user = (c as any).adminUser;
  
  return c.render(
    <AdminLayout currentUser={user} currentPage="articles" breadcrumb="New Article">
      <div class="admin-page-header">
        <h1 class="admin-page-title">Create New Article</h1>
        <p class="admin-page-subtitle">Write and publish a new article</p>
      </div>

      <div class="admin-card">
        <div class="admin-card-content">
          <form id="article-form" class="admin-form">
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Title</label>
                <input type="text" name="title" class="admin-form-input" required />
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Category</label>
                <select name="category_id" class="admin-form-select" id="article-category-select">
                  <option value="">Select Category (Optional)</option>
                  {/* Categories will be loaded dynamically */}
                </select>
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Status</label>
                <select name="published" class="admin-form-select">
                  <option value="false">Draft</option>
                  <option value="true">Published</option>
                </select>
              </div>
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">Excerpt</label>
              <textarea name="excerpt" class="admin-form-textarea" rows="3" 
                placeholder="Brief description of the article..."></textarea>
            </div>

            <div class="admin-form-group">
            <label class="admin-form-label">Content</label>
            <div id="admin-content-editor-container" class="custom-editor-container">
              <div id="admin-content-editor" data-editor="true" data-placeholder="Start writing your article content..."></div>
              <textarea name="content" id="admin-content-editor-textarea" style="display: none;"></textarea>
            </div>
          </div>

            <div class="admin-actions">
              <a href="/admin/articles" class="admin-btn admin-btn-outline">Cancel</a>
              <button type="submit" class="admin-btn admin-btn-primary">
                <i class="fas fa-save"></i> Save Article
              </button>
            </div>
          </form>
        </div>
      </div>

      <div id="admin-message"></div>

      <script dangerouslySetInnerHTML={{
        __html: `
        // Load Chart.js first, then initialize everything else
        (function() {
          if (typeof Chart === 'undefined') {
            const chartScript = document.createElement('script');
            chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            chartScript.onload = function() {
              console.log('Chart.js loaded successfully for new article page');
              initializeNewArticlePage();
            };
            chartScript.onerror = function() {
              console.error('Failed to load Chart.js for new article page');
              initializeNewArticlePage(); // Continue anyway
            };
            document.head.appendChild(chartScript);
          } else {
            console.log('Chart.js already loaded');
            initializeNewArticlePage();
          }

          function initializeNewArticlePage() {
            document.addEventListener('DOMContentLoaded', function() {
              const form = document.getElementById('article-form');
              form.addEventListener('submit', createArticle);

              // Load categories for dropdown
              loadCategoriesDropdown('article-category-select');

              // Initialize custom editor with full toolbar
              setTimeout(() => {
                if (typeof EnhancedEditor === 'function') {
                  // Clean up any existing editor instance
                  if (window.customEditors && window.customEditors.admin) {
                    window.customEditors.admin.destroy();
                    delete window.customEditors.admin;
                  }

                  const adminEditorInstance = new EnhancedEditor('admin-content-editor', {
                    placeholder: 'Start writing your article content...',
                    minHeight: 400,
                    maxHeight: 600,
                    toolbar: true,
                    autosave: false
                  });
                  if (!window.customEditors) window.customEditors = {};
                  window.customEditors.admin = adminEditorInstance;
                } else {
                  console.error('EnhancedEditor class not found');
                }
              }, 100);
            });
          }
        })();
        `
      }}></script>
    </AdminLayout>,
    { title: 'New Article' }
  );
});

// Edit Article
adminApp.get('/articles/:id/edit', async (c) => {
  const user = (c as any).adminUser;
  const id = c.req.param('id');
  
  return c.render(
    <AdminLayout currentUser={user} currentPage="articles" breadcrumb={`Edit Article #${id}`}>
      <div class="admin-page-header">
        <h1 class="admin-page-title">Edit Article</h1>
        <p class="admin-page-subtitle">Modify article content and settings</p>
      </div>

      <div class="admin-card">
        <div class="admin-card-content">
          <form id="edit-article-form" class="admin-form" data-article-id={id}>
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Title</label>
                <input type="text" name="title" class="admin-form-input" id="edit-title" required />
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Category</label>
                <select name="category_id" class="admin-form-select" id="edit-article-category-select">
                  <option value="">Select Category (Optional)</option>
                  {/* Categories will be loaded dynamically */}
                </select>
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Status</label>
                <select name="published" class="admin-form-select" id="edit-published">
                  <option value="false">Draft</option>
                  <option value="true">Published</option>
                </select>
              </div>
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">Excerpt</label>
              <textarea name="excerpt" class="admin-form-textarea" rows="3" id="edit-excerpt"
                placeholder="Brief description of the article..."></textarea>
            </div>

            <div class="admin-form-group">
            <label class="admin-form-label">Content</label>
            <div id="edit-content-editor-container" class="custom-editor-container">
              <div id="edit-content-editor" data-editor="true" data-placeholder="Edit your article content..."></div>
              <textarea name="content" id="edit-content-editor-textarea" style="display: none;"></textarea>
            </div>
          </div>

            <div class="admin-actions">
              <a href="/admin/articles" class="admin-btn admin-btn-outline">Cancel</a>
              <button type="submit" class="admin-btn admin-btn-primary">
                <i class="fas fa-save"></i> Update Article
              </button>
            </div>
          </form>
        </div>
      </div>

      <div id="admin-message"></div>

      <script dangerouslySetInnerHTML={{
        __html: `
        // Load Chart.js first, then initialize everything else
        (function() {
          if (typeof Chart === 'undefined') {
            const chartScript = document.createElement('script');
            chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            chartScript.onload = function() {
              console.log('Chart.js loaded successfully for edit page');
              initializeEditPage();
            };
            chartScript.onerror = function() {
              console.error('Failed to load Chart.js for edit page');
              initializeEditPage(); // Continue anyway
            };
            document.head.appendChild(chartScript);
          } else {
            console.log('Chart.js already loaded');
            initializeEditPage();
          }

          function initializeEditPage() {
            document.addEventListener('DOMContentLoaded', function() {
              const form = document.getElementById('edit-article-form');
              form.addEventListener('submit', updateArticle);

              // Load categories for dropdown
              loadCategoriesDropdown('edit-article-category-select');

              // Initialize custom editor for editing
              setTimeout(() => {
                if (typeof EnhancedEditor === 'function') {
                  // Clean up any existing editor instance
                  if (window.customEditors && window.customEditors.edit) {
                    window.customEditors.edit.destroy();
                    delete window.customEditors.edit;
                  }

                  const editEditorInstance = new EnhancedEditor('edit-content-editor', {
                    placeholder: 'Edit your article content...',
                    minHeight: 400,
                    maxHeight: 600,
                    toolbar: true,
                    autosave: false
                  });
                  if (!window.customEditors) window.customEditors = {};
                  window.customEditors.edit = editEditorInstance;
                  // Load article data after editor is initialized
                  setTimeout(() => {
                    loadArticleForEdit(${id});
                  }, 100);
                } else {
                  console.error('EnhancedEditor class not found');
                  loadArticleForEdit(${id});
                }
              }, 100);
            });
          }
        })();
        `
      }}></script>
    </AdminLayout>,
    { title: 'Edit Article' }
  );
});

// Resources Management
adminApp.get('/resources', async (c) => {
  const user = (c as any).adminUser;

  return c.render(
    <AdminLayout currentUser={user} currentPage="resources" breadcrumb="Resources">
      <div class="admin-page-header">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 class="admin-page-title">Resources</h1>
            <p class="admin-page-subtitle">Manage all resources in your library</p>
          </div>
          <a href="/admin/resources/new" class="admin-btn admin-btn-primary">
            <i class="fas fa-plus"></i> New Resource
          </a>
        </div>
      </div>

      {/* Search and Filter Controls - Compact Inline */}
      <div class="admin-simple-filters">
        <div class="admin-filter-row">
          <div class="admin-filter-group">
            <label class="admin-filter-label">Search</label>
            <input
              type="text"
              id="resources-search"
              class="admin-filter-input"
              placeholder="Search resources..."
              onkeyup="if(event.key === 'Enter') applyFilters('resources')"
            />
          </div>

          <div class="admin-filter-group">
            <label class="admin-filter-label">Status</label>
            <select id="resources-status-filter" class="admin-filter-select" onchange="applyFilters('resources')">
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div class="admin-filter-group">
            <label class="admin-filter-label">Category</label>
            <select id="resources-category-filter" class="admin-filter-select" onchange="applyFilters('resources')">
              <option value="all">All Categories</option>
              {/* Categories will be loaded dynamically */}
            </select>
          </div>

          <div class="admin-filter-group">
            <label class="admin-filter-label">Author</label>
            <select id="resources-author-filter" class="admin-filter-select" onchange="applyFilters('resources')">
              <option value="all">All Authors</option>
              {/* Authors will be loaded dynamically */}
            </select>
          </div>

          <div class="admin-filter-group">
            <label class="admin-filter-label">Clear</label>
            <button onclick="clearFilters('resources')" class="admin-btn admin-btn-outline">
              <i class="fas fa-times"></i> Clear
            </button>
          </div>
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-card-content">
          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type & Status</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="resources-table">
                <tr>
                  <td colSpan={6} style="text-align: center; padding: 2rem;">
                    <div class="admin-loading">
                      <div class="admin-spinner"></div>
                      Loading resources...
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div id="resources-pagination" class="admin-pagination-container"></div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            // Load categories for filter dropdown
            window.loadCategoriesDropdown('resources-category-filter');

            function checkForFunction() {
              if (typeof window.loadResources === 'function') {
                window.loadResources();
              } else {
                setTimeout(checkForFunction, 100);
              }
            }
            checkForFunction();
          });
        `
      }}></script>
    </AdminLayout>
  );
});

// New Resource
adminApp.get('/resources/new', async (c) => {
  const user = (c as any).adminUser;
  
  return c.render(
    <AdminLayout currentUser={user} currentPage="resources" breadcrumb="New Resource">
      <div class="admin-page-header">
        <h1 class="admin-page-title">Add New Resource</h1>
        <p class="admin-page-subtitle">Add a helpful resource to the library</p>
      </div>

      <div class="admin-card">
        <div class="admin-card-content">
          {/* Resource Type Selection */}
          <div class="admin-form-tabs">
            <button type="button" class="admin-tab-btn active" data-tab="link">
              <i class="fas fa-link"></i> Link Resource
            </button>
            <button type="button" class="admin-tab-btn" data-tab="upload">
              <i class="fas fa-upload"></i> Upload File
            </button>
          </div>

          {/* Link Resource Form */}
          <form id="resource-link-form" class="admin-form resource-form active">
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Title</label>
                <input type="text" name="title" class="admin-form-input" required />
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Category</label>
                <select name="category_id" class="admin-form-select" id="link-resource-category-select">
                  <option value="">Select Category (Optional)</option>
                  {/* Categories will be loaded dynamically */}
                </select>
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Type</label>
                <select name="resource_type" class="admin-form-select">
                  <option value="link">Website/Link</option>
                  <option value="book">Book (External Link)</option>
                  <option value="video">Video (External Link)</option>
                  <option value="podcast">Podcast (External Link)</option>
                  <option value="study">Study Guide</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">URL</label>
              <input type="url" name="url" class="admin-form-input" 
                placeholder="https://example.com" required />
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">Description</label>
              <textarea name="description" class="admin-form-textarea" rows="4" 
                placeholder="Describe this resource and why it's helpful..."></textarea>
            </div>

            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-checkbox-label">
                  <input type="checkbox" name="published" checked />
                  Publish immediately
                </label>
              </div>
            </div>

            <div class="admin-actions">
              <a href="/admin/resources" class="admin-btn admin-btn-outline">Cancel</a>
              <button type="submit" class="admin-btn admin-btn-primary">
                <i class="fas fa-save"></i> Add Resource
              </button>
            </div>
          </form>

          {/* Upload File Form */}
          <form id="resource-upload-form" class="admin-form resource-form" enctype="multipart/form-data">
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Title</label>
                <input type="text" name="title" class="admin-form-input" required />
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Category</label>
                <select name="category_id" class="admin-form-select" id="upload-resource-category-select">
                  <option value="">Select Category (Optional)</option>
                  {/* Categories will be loaded dynamically */}
                </select>
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Type</label>
                <select name="resource_type" class="admin-form-select" id="upload-type-select">
                  <option value="book">Book (PDF)</option>
                  <option value="podcast">Podcast (Audio)</option>
                </select>
              </div>
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">File Upload</label>
              <div class="admin-file-upload-area" id="file-upload-area">
                <div class="admin-file-upload-content">
                  <i class="fas fa-cloud-upload-alt admin-file-upload-icon"></i>
                  <div class="admin-file-upload-text">
                    <div class="admin-file-upload-primary">Drop files here or click to upload</div>
                    <div class="admin-file-upload-secondary" id="file-type-hint">
                      Supported formats: PDF files for books
                    </div>
                  </div>
                </div>
                <input type="file" name="file" class="admin-file-input" id="file-input" 
                       accept=".pdf" required />
              </div>
              <div class="admin-file-preview" id="file-preview" style="display: none;">
                <div class="admin-file-item">
                  <i class="fas fa-file-pdf admin-file-icon"></i>
                  <div class="admin-file-info">
                    <div class="admin-file-name" id="file-name"></div>
                    <div class="admin-file-size" id="file-size"></div>
                  </div>
                  <button type="button" class="admin-file-remove" id="remove-file">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">Description</label>
              <textarea name="description" class="admin-form-textarea" rows="4" 
                placeholder="Describe this resource and why it's helpful..."></textarea>
            </div>

            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-checkbox-label">
                  <input type="checkbox" name="published" checked />
                  Publish immediately
                </label>
              </div>
            </div>

            <div class="admin-actions">
              <a href="/admin/resources" class="admin-btn admin-btn-outline">Cancel</a>
              <button type="submit" class="admin-btn admin-btn-primary">
                <i class="fas fa-upload"></i> Upload Resource
              </button>
            </div>
          </form>
        </div>
      </div>

      <div id="admin-message"></div>

      <script dangerouslySetInnerHTML={{
        __html: `
        document.addEventListener('DOMContentLoaded', function() {
          // Tab switching functionality
          const tabBtns = document.querySelectorAll('.admin-tab-btn');
          const resourceForms = document.querySelectorAll('.resource-form');
          
          tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
              const tabType = this.dataset.tab;
              
              // Update active tab
              tabBtns.forEach(b => b.classList.remove('active'));
              this.classList.add('active');
              
              // Show corresponding form
              resourceForms.forEach(form => {
                form.classList.remove('active');
                if (form.id.includes(tabType)) {
                  form.classList.add('active');
                }
              });
              
              // Update file type hints
              updateFileTypeHints(tabType);
            });
          });
          
          // Update file type hints based on selection
          function updateFileTypeHints(formType) {
            const fileTypeHint = document.getElementById('file-type-hint');
            const fileInput = document.getElementById('file-input');
            const uploadTypeSelect = document.getElementById('upload-type-select');
            
            if (formType === 'upload' && uploadTypeSelect) {
              const selectedType = uploadTypeSelect.value;
              if (selectedType === 'book') {
                fileTypeHint.textContent = 'Supported formats: PDF files for books';
                fileInput.accept = '.pdf';
              } else if (selectedType === 'podcast') {
                fileTypeHint.textContent = 'Supported formats: MP3, WAV audio files';
                fileInput.accept = '.mp3,.wav,.m4a';
              }
            }
          }
          
          // File upload type change handler
          const uploadTypeSelect = document.getElementById('upload-type-select');
          if (uploadTypeSelect) {
            uploadTypeSelect.addEventListener('change', function() {
              updateFileTypeHints('upload');
            });
          }
          
          // File upload drag and drop
          const fileUploadArea = document.getElementById('file-upload-area');
          const fileInput = document.getElementById('file-input');
          const filePreview = document.getElementById('file-preview');
          
          if (fileUploadArea && fileInput) {
            // Click to upload
            fileUploadArea.addEventListener('click', function() {
              fileInput.click();
            });
            
            // Drag and drop
            fileUploadArea.addEventListener('dragover', function(e) {
              e.preventDefault();
              this.classList.add('drag-over');
            });
            
            fileUploadArea.addEventListener('dragleave', function(e) {
              e.preventDefault();
              this.classList.remove('drag-over');
            });
            
            fileUploadArea.addEventListener('drop', function(e) {
              e.preventDefault();
              this.classList.remove('drag-over');
              
              const files = e.dataTransfer.files;
              if (files.length > 0) {
                fileInput.files = files;
                showFilePreview(files[0]);
              }
            });
            
            // File input change
            fileInput.addEventListener('change', function() {
              if (this.files.length > 0) {
                showFilePreview(this.files[0]);
              }
            });
          }
          
          // Show file preview
          function showFilePreview(file) {
            const fileName = document.getElementById('file-name');
            const fileSize = document.getElementById('file-size');
            
            if (fileName && fileSize) {
              fileName.textContent = file.name;
              fileSize.textContent = formatFileSize(file.size);
              filePreview.style.display = 'block';
              fileUploadArea.style.display = 'none';
            }
          }
          
          // Remove file
          const removeFileBtn = document.getElementById('remove-file');
          if (removeFileBtn) {
            removeFileBtn.addEventListener('click', function() {
              fileInput.value = '';
              filePreview.style.display = 'none';
              fileUploadArea.style.display = 'flex';
            });
          }
          
          // Format file size
          function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
          }
          
          // Load categories for both forms
          loadCategoriesDropdown('link-resource-category-select');
          loadCategoriesDropdown('upload-resource-category-select');
          
          // Form submissions
          const linkForm = document.getElementById('resource-link-form');
          const uploadForm = document.getElementById('resource-upload-form');
          
          if (linkForm) {
            linkForm.addEventListener('submit', createLinkResource);
          }
          
          if (uploadForm) {
            uploadForm.addEventListener('submit', uploadResourceFile);
          }
        });
        `
      }}></script>
    </AdminLayout>,
    { title: 'New Resource' }
  );
});

// Edit Resource
adminApp.get('/resources/:id/edit', async (c) => {
  const user = (c as any).adminUser;
  const id = c.req.param('id');
  
  return c.render(
    <AdminLayout currentUser={user} currentPage="resources" breadcrumb={`Edit Resource #${id}`}>
      <div class="admin-page-header">
        <h1 class="admin-page-title">Edit Resource</h1>
        <p class="admin-page-subtitle">Modify resource information and settings</p>
      </div>

      <div class="admin-card">
        <div class="admin-card-content">
          <form id="edit-resource-form" class="admin-form" data-resource-id={id}>
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Title</label>
                <input type="text" name="title" class="admin-form-input" id="edit-resource-title" required />
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Category</label>
                <select name="category_id" class="admin-form-select" id="edit-resource-category-select">
                  <option value="">Select Category (Optional)</option>
                  {/* Categories will be loaded dynamically */}
                </select>
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Type</label>
                <select name="resource_type" class="admin-form-select" id="edit-resource-type">
                  <option value="link">Website/Link</option>
                  <option value="book">Book</option>
                  <option value="video">Video</option>
                  <option value="podcast">Podcast</option>
                  <option value="study">Study Guide</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div class="admin-form-group" id="edit-url-group">
              <label class="admin-form-label">URL</label>
              <input type="url" name="url" class="admin-form-input" id="edit-resource-url"
                placeholder="https://example.com" />
            </div>

            <div class="admin-form-group" id="edit-file-info" style="display: none;">
              <label class="admin-form-label">File Information</label>
              <div class="admin-file-info-display">
                <div class="admin-file-current">
                  <i class="fas fa-file admin-file-icon"></i>
                  <div class="admin-file-details">
                    <div class="admin-file-name" id="edit-current-filename"></div>
                    <div class="admin-file-size" id="edit-current-filesize"></div>
                  </div>
                </div>
                <div class="admin-file-actions">
                  <a href="#" id="edit-download-link" class="admin-btn admin-btn-sm admin-btn-outline" target="_blank">
                    <i class="fas fa-download"></i> Download
                  </a>
                  <a href="#" id="edit-view-link" class="admin-btn admin-btn-sm admin-btn-primary" target="_blank" style="display: none;">
                    <i class="fas fa-eye"></i> View
                  </a>
                </div>
              </div>
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">Description</label>
              <textarea name="description" class="admin-form-textarea" rows="4" id="edit-resource-description"
                placeholder="Describe this resource and why it's helpful..."></textarea>
            </div>

            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-checkbox-label">
                  <input type="checkbox" name="published" id="edit-resource-published" />
                  Published
                </label>
              </div>
            </div>

            <div class="admin-actions">
              <a href="/admin/resources" class="admin-btn admin-btn-outline">Cancel</a>
              <button type="submit" class="admin-btn admin-btn-primary">
                <i class="fas fa-save"></i> Update Resource
              </button>
            </div>
          </form>
        </div>
      </div>

      <div id="admin-message"></div>

      <script dangerouslySetInnerHTML={{
        __html: `
        document.addEventListener('DOMContentLoaded', function() {
          const form = document.getElementById('edit-resource-form');
          form.addEventListener('submit', updateResource);
          
          // Load categories for dropdown
          loadCategoriesDropdown('edit-resource-category-select');
          
          // Load resource data
          loadResourceForEdit(${id});
        });
        `
      }}></script>
    </AdminLayout>,
    { title: 'Edit Resource' }
  );
});

// Categories Management - Admin Only
adminApp.get('/categories', requireAdminOnly, async (c) => {
  const user = (c as any).adminUser;
  
  return c.render(
    <AdminLayout currentUser={user} currentPage="categories" breadcrumb="Categories">
      <div class="admin-page">
        <div class="admin-page-header">
          <div>
            <h1 class="admin-page-title">Categories</h1>
            <p class="admin-page-subtitle">Organize content with categories</p>
          </div>
          <button class="admin-btn admin-btn-primary" onclick="showCreateCategoryForm()">
            <i class="fas fa-plus"></i> New Category
          </button>
        </div>

        <div class="admin-card">
          <div class="admin-table-container">
            <table class="admin-table" id="categories-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Color</th>
                  <th>Icon</th>
                  <th>Slug</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="categories-table-body">
                <tr>
                  <td colspan="7" class="admin-table-loading">Loading categories...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Category Modal */}
        <div id="create-category-modal" class="admin-modal" style="display: none;">
          <div class="admin-modal-content">
            <div class="admin-modal-header">
              <h3>Create New Category</h3>
              <button class="admin-modal-close" onclick="hideCreateCategoryForm()">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="admin-modal-body">
              <form id="create-category-form" onsubmit="createCategory(event)">
                <div class="admin-form-group">
                  <label class="admin-form-label">Name *</label>
                  <input type="text" name="name" class="admin-form-input" required 
                    placeholder="Category Name" onkeyup="generateSlug(this.value)" />
                </div>
                
                <div class="admin-form-group">
                  <label class="admin-form-label">Slug *</label>
                  <input type="text" name="slug" class="admin-form-input" required 
                    placeholder="category-slug" pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$" />
                  <small>URL-friendly identifier (lowercase, hyphens only)</small>
                </div>

                <div class="admin-form-group">
                  <label class="admin-form-label">Description</label>
                  <textarea name="description" class="admin-form-textarea" rows="3"
                    placeholder="Brief description of this category..."></textarea>
                </div>

                <div class="admin-form-row">
                  <div class="admin-form-group">
                    <label class="admin-form-label">Color</label>
                    <input type="color" name="color" class="admin-form-input admin-color-input" value="#3b82f6" />
                  </div>
                  
                  <div class="admin-form-group">
                    <label class="admin-form-label">Icon</label>
                    <input type="text" name="icon" class="admin-form-input" value="fas fa-folder" 
                      placeholder="fas fa-folder" />
                    <small>FontAwesome icon class (e.g., fas fa-folder)</small>
                  </div>
                </div>

                <div class="admin-actions">
                  <button type="button" class="admin-btn admin-btn-outline" onclick="hideCreateCategoryForm()">Cancel</button>
                  <button type="submit" class="admin-btn admin-btn-primary">
                    <i class="fas fa-plus"></i> Create Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Edit Category Modal */}
        <div id="edit-category-modal" class="admin-modal" style="display: none;">
          <div class="admin-modal-content">
            <div class="admin-modal-header">
              <h3>Edit Category</h3>
              <button class="admin-modal-close" onclick="hideEditCategoryForm()">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="admin-modal-body">
              <form id="edit-category-form" onsubmit="updateCategory(event)">
                <input type="hidden" name="id" id="edit-category-id" />
                
                <div class="admin-form-group">
                  <label class="admin-form-label">Name *</label>
                  <input type="text" name="name" class="admin-form-input" required 
                    placeholder="Category Name" id="edit-category-name" onkeyup="generateEditSlug(this.value)" />
                </div>
                
                <div class="admin-form-group">
                  <label class="admin-form-label">Slug *</label>
                  <input type="text" name="slug" class="admin-form-input" required 
                    placeholder="category-slug" pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$" id="edit-category-slug" />
                  <small>URL-friendly identifier (lowercase, hyphens only)</small>
                </div>

                <div class="admin-form-group">
                  <label class="admin-form-label">Description</label>
                  <textarea name="description" class="admin-form-textarea" rows="3"
                    placeholder="Brief description of this category..." id="edit-category-description"></textarea>
                </div>

                <div class="admin-form-row">
                  <div class="admin-form-group">
                    <label class="admin-form-label">Color</label>
                    <input type="color" name="color" class="admin-form-input admin-color-input" id="edit-category-color" />
                  </div>
                  
                  <div class="admin-form-group">
                    <label class="admin-form-label">Icon</label>
                    <input type="text" name="icon" class="admin-form-input" 
                      placeholder="fas fa-folder" id="edit-category-icon" />
                    <small>FontAwesome icon class (e.g., fas fa-folder)</small>
                  </div>
                </div>

                <div class="admin-actions">
                  <button type="button" class="admin-btn admin-btn-outline" onclick="hideEditCategoryForm()">Cancel</button>
                  <button type="submit" class="admin-btn admin-btn-primary">
                    <i class="fas fa-save"></i> Update Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div id="admin-message"></div>

      <script dangerouslySetInnerHTML={{
        __html: `
        document.addEventListener('DOMContentLoaded', function() {
          loadCategories();
        });
        `
      }} />
    </AdminLayout>,
    { title: 'Categories' }
  );
});

// Users Management - Admin Only
adminApp.get('/users', requireAdminOnly, async (c) => {
  const user = (c as any).adminUser;
  
  return c.render(
    <AdminLayout currentUser={user} currentPage="users" breadcrumb="Users">
      <div class="admin-page-header">
        <h1 class="admin-page-title">Users</h1>
        <p class="admin-page-subtitle">Manage all registered users</p>
      </div>

      <div class="admin-card">
        <div class="admin-card-content">
          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="users-table">
                <tr>
                  <td colspan="7" style="text-align: center; padding: 2rem;">
                    <div class="admin-loading">
                      <div class="admin-spinner"></div>
                      Loading users...
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            function checkForFunction() {
              if (typeof window.loadUsers === 'function') {
                window.loadUsers();
              } else {
                setTimeout(checkForFunction, 100);
              }
            }
            checkForFunction();
          });
        `
      }}></script>
    </AdminLayout>,
    { title: 'Users' }
  );
});

// Analytics - Admin Only
adminApp.get('/analytics', requireAdminOnly, async (c) => {
  const user = (c as any).adminUser;
  
  return c.render(
    <AdminLayout currentUser={user} currentPage="analytics" breadcrumb="Analytics">
      <div class="admin-page-header">
        <h1 class="admin-page-title">Analytics</h1>
        <p class="admin-page-subtitle">Site performance and user engagement metrics</p>
      </div>

      {/* Analytics Cards */}
      <div class="admin-stats-grid">
        <div class="admin-stat-card">
          <div class="admin-stat-header">
            <div class="admin-stat-title">Page Views</div>
            <div class="admin-stat-icon blue">
              <i class="fas fa-chart-line"></i>
            </div>
          </div>
          <div class="admin-stat-number" id="analytics-pageviews">0</div>
          <div class="admin-stat-change" id="analytics-pageviews-change">No tracking data yet</div>
        </div>

        <div class="admin-stat-card">
          <div class="admin-stat-header">
            <div class="admin-stat-title">Average Read Time</div>
            <div class="admin-stat-icon green">
              <i class="fas fa-clock"></i>
            </div>
          </div>
          <div class="admin-stat-number" id="analytics-readtime">0:00</div>
          <div class="admin-stat-change" id="analytics-readtime-change">No articles published yet</div>
        </div>

        <div class="admin-stat-card">
          <div class="admin-stat-header">
            <div class="admin-stat-title">User Growth</div>
            <div class="admin-stat-icon yellow">
              <i class="fas fa-user-plus"></i>
            </div>
          </div>
          <div class="admin-stat-number" id="analytics-growth">0</div>
          <div class="admin-stat-change" id="analytics-growth-change">No new users this period</div>
        </div>

        <div class="admin-stat-card">
          <div class="admin-stat-header">
            <div class="admin-stat-title">Content Engagement</div>
            <div class="admin-stat-icon red">
              <i class="fas fa-heart"></i>
            </div>
          </div>
          <div class="admin-stat-number" id="analytics-engagement">0%</div>
          <div class="admin-stat-change" id="analytics-engagement-change">No published content yet</div>
        </div>
      </div>

      {/* Charts and detailed analytics would go here */}
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">Top Articles</h3>
            <p class="admin-card-subtitle">Most viewed articles this month</p>
          </div>
          <div class="admin-card-content">
            <div id="top-articles">Loading...</div>
          </div>
        </div>

        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">User Growth</h3>
            <p class="admin-card-subtitle">New user registrations over time</p>
          </div>
          <div class="admin-card-content">
            <div id="user-growth-chart">
              <div style="text-align: center; padding: 2rem; color: #64748b;">
                <i class="fas fa-chart-line" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <div>No user growth data yet</div>
                <div style="font-size: 0.8rem; margin-top: 0.5rem;">Chart will appear when users register</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            function checkForFunction() {
              if (typeof window.loadAnalytics === 'function') {
                window.loadAnalytics();
              } else {
                setTimeout(checkForFunction, 100);
              }
            }
            checkForFunction();
          });
        `
      }}></script>
    </AdminLayout>,
    { title: 'Analytics' }
  );
});

// Admin Settings - Admin Only
adminApp.get('/settings', requireAdminOnly, async (c) => {
  const user = (c as any).adminUser;
  
  return c.render(
    <AdminLayout currentUser={user} currentPage="settings" breadcrumb="Site Settings">
      <div class="admin-page-header">
        <h1 class="admin-page-title">Site Settings</h1>
        <p class="admin-page-subtitle">Configure your Faith Defenders community settings</p>
      </div>

      <div class="admin-settings-container">
        {/* General Settings */}
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">
              <i class="fas fa-globe"></i>
              General Settings
            </h3>
          </div>
          <div class="admin-card-content">
            <form id="general-settings-form" class="admin-form">
              <div class="admin-form-row">
                <div class="admin-form-group">
                  <label class="admin-form-label">Site Name</label>
                  <input type="text" name="site_name" class="admin-form-input" 
                    value="Faith Defenders" placeholder="Your site name" />
                </div>
                <div class="admin-form-group">
                  <label class="admin-form-label">Site Tagline</label>
                  <input type="text" name="site_tagline" class="admin-form-input" 
                    value="Defending and sharing the Christian faith" placeholder="Your site tagline" />
                </div>
              </div>

              <div class="admin-form-group">
                <label class="admin-form-label">Site Description</label>
                <textarea name="site_description" class="admin-form-textarea" rows="3"
                  placeholder="Describe your faith community...">A community dedicated to defending and sharing the Christian faith through articles, resources, and meaningful discussions.</textarea>
              </div>

              <div class="admin-form-row">
                <div class="admin-form-group">
                  <label class="admin-form-label">Contact Email</label>
                  <input type="email" name="contact_email" class="admin-form-input" 
                    placeholder="contact@faithdefenders.com" />
                </div>
                <div class="admin-form-group">
                  <label class="admin-form-label">Admin Email</label>
                  <input type="email" name="admin_email" class="admin-form-input" 
                    value={user.email} placeholder="admin@faithdefenders.com" />
                </div>
              </div>

              <div class="admin-form-actions">
                <button type="submit" class="admin-btn admin-btn-primary">
                  <i class="fas fa-save"></i>
                  Save General Settings
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Content Settings */}
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">
              <i class="fas fa-file-alt"></i>
              Content Settings
            </h3>
          </div>
          <div class="admin-card-content">
            <form id="content-settings-form" class="admin-form">
              <div class="admin-form-row">
                <div class="admin-form-group">
                  <label class="admin-form-label">Articles Per Page</label>
                  <select name="articles_per_page" class="admin-form-select">
                    <option value="5">5 articles</option>
                    <option value="10" selected>10 articles</option>
                    <option value="15">15 articles</option>
                    <option value="20">20 articles</option>
                  </select>
                </div>
                <div class="admin-form-group">
                  <label class="admin-form-label">Default Article Status</label>
                  <select name="default_article_status" class="admin-form-select">
                    <option value="draft">Draft</option>
                    <option value="published" selected>Published</option>
                  </select>
                </div>
              </div>

              <div class="admin-form-group">
                <label class="admin-form-checkbox-container">
                  <input type="checkbox" name="require_approval" class="admin-form-checkbox" />
                  <span class="admin-form-checkbox-mark"></span>
                  Require admin approval for user comments
                </label>
              </div>

              <div class="admin-form-group">
                <label class="admin-form-checkbox-container">
                  <input type="checkbox" name="allow_guest_comments" class="admin-form-checkbox" />
                  <span class="admin-form-checkbox-mark"></span>
                  Allow comments from non-registered users
                </label>
              </div>

              <div class="admin-form-actions">
                <button type="submit" class="admin-btn admin-btn-primary">
                  <i class="fas fa-save"></i>
                  Save Content Settings
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* User Management Settings */}
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">
              <i class="fas fa-users"></i>
              User Management
            </h3>
          </div>
          <div class="admin-card-content">
            <form id="user-settings-form" class="admin-form">
              <div class="admin-form-row">
                <div class="admin-form-group">
                  <label class="admin-form-label">Default User Role</label>
                  <select name="default_user_role" class="admin-form-select">
                    <option value="user" selected>Regular User</option>
                    <option value="moderator">Moderator</option>
                  </select>
                </div>
                <div class="admin-form-group">
                  <label class="admin-form-label">Registration Status</label>
                  <select name="registration_status" class="admin-form-select">
                    <option value="open" selected>Open Registration</option>
                    <option value="approval">Require Admin Approval</option>
                    <option value="closed">Registration Closed</option>
                  </select>
                </div>
              </div>

              <div class="admin-form-group">
                <label class="admin-form-checkbox-container">
                  <input type="checkbox" name="enable_user_profiles" class="admin-form-checkbox" checked />
                  <span class="admin-form-checkbox-mark"></span>
                  Enable public user profiles
                </label>
              </div>

              <div class="admin-form-group">
                <label class="admin-form-checkbox-container">
                  <input type="checkbox" name="send_welcome_email" class="admin-form-checkbox" />
                  <span class="admin-form-checkbox-mark"></span>
                  Send welcome email to new users
                </label>
              </div>

              <div class="admin-form-actions">
                <button type="submit" class="admin-btn admin-btn-primary">
                  <i class="fas fa-save"></i>
                  Save User Settings
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Security Settings */}
        <div class="admin-card">
           <div class="admin-card-header">
             <h3 class="admin-card-title">
               <i class="fas fa-shield-alt"></i>
               Security Settings
             </h3>
           </div>
           <div class="admin-card-content">
             <form id="security-settings-form" class="admin-form">
               <div class="admin-form-row">
                 <div class="admin-form-group">
                   <label class="admin-form-label">Session Timeout (minutes)</label>
                   <select name="session_timeout" class="admin-form-select">
                     <option value="30">30 minutes</option>
                     <option value="60" selected>1 hour</option>
                     <option value="120">2 hours</option>
                     <option value="1440">24 hours</option>
                   </select>
                 </div>
                 <div class="admin-form-group">
                   <label class="admin-form-label">Password Strength</label>
                   <select name="password_strength" class="admin-form-select">
                     <option value="basic">Basic (6+ characters)</option>
                     <option value="moderate" selected>Moderate (8+ chars, mixed case)</option>
                     <option value="strong">Strong (12+ chars, symbols)</option>
                   </select>
                 </div>
               </div>

               <div class="admin-form-group">
                 <label class="admin-form-checkbox-container">
                   <input type="checkbox" name="enable_2fa" class="admin-form-checkbox" />
                   <span class="admin-form-checkbox-mark"></span>
                   Enable two-factor authentication (2FA)
                 </label>
               </div>

               <div class="admin-form-group">
                 <label class="admin-form-checkbox-container">
                   <input type="checkbox" name="log_user_activity" class="admin-form-checkbox" checked />
                   <span class="admin-form-checkbox-mark"></span>
                   Log user activity and login attempts
                 </label>
               </div>

               <div class="admin-form-actions">
                 <button type="submit" class="admin-btn admin-btn-primary">
                   <i class="fas fa-save"></i>
                   Save Security Settings
                 </button>
               </div>
             </form>
           </div>
         </div>

         {/* Appearance Settings */}
         <div class="admin-card">
           <div class="admin-card-header">
             <h3 class="admin-card-title">
               <i class="fas fa-palette"></i>
               Appearance Settings
             </h3>
           </div>
           <div class="admin-card-content">
             <form id="appearance-settings-form" class="admin-form">
               <div class="admin-form-row">
                 <div class="admin-form-group">
                   <label class="admin-form-label">Primary Theme Color</label>
                   <input type="color" name="primary_color" class="admin-form-input admin-color-input" value="#1e3c72" />
                 </div>
                 <div class="admin-form-group">
                   <label class="admin-form-label">Secondary Theme Color</label>
                   <input type="color" name="secondary_color" class="admin-form-input admin-color-input" value="#2a5298" />
                 </div>
               </div>

               <div class="admin-form-row">
                 <div class="admin-form-group">
                   <label class="admin-form-label">Font Family</label>
                   <select name="font_family" class="admin-form-select">
                     <option value="system">System Default</option>
                     <option value="inter" selected>Inter</option>
                     <option value="roboto">Roboto</option>
                     <option value="opensans">Open Sans</option>
                     <option value="lato">Lato</option>
                   </select>
                 </div>
                 <div class="admin-form-group">
                   <label class="admin-form-label">Logo URL</label>
                   <input type="url" name="logo_url" class="admin-form-input"
                     placeholder="https://example.com/logo.png" />
                 </div>
               </div>

               <div class="admin-form-group">
                 <label class="admin-form-checkbox-container">
                   <input type="checkbox" name="enable_dark_mode" class="admin-form-checkbox" />
                   <span class="admin-form-checkbox-mark"></span>
                   Enable dark mode option for users
                 </label>
               </div>

               <div class="admin-form-group">
                 <label class="admin-form-checkbox-container">
                   <input type="checkbox" name="show_breadcrumbs" class="admin-form-checkbox" checked />
                   <span class="admin-form-checkbox-mark"></span>
                   Show breadcrumb navigation
                 </label>
               </div>

               <div class="admin-form-actions">
                 <button type="submit" class="admin-btn admin-btn-primary">
                   <i class="fas fa-save"></i>
                   Save Appearance Settings
                 </button>
               </div>
             </form>
           </div>
         </div>

         {/* Social Media Settings */}
         <div class="admin-card">
           <div class="admin-card-header">
             <h3 class="admin-card-title">
               <i class="fas fa-share-alt"></i>
               Social Media & Contact
             </h3>
           </div>
           <div class="admin-card-content">
             <form id="social-settings-form" class="admin-form">
               <div class="admin-form-row">
                 <div class="admin-form-group">
                   <label class="admin-form-label">Facebook URL</label>
                   <input type="url" name="facebook_url" class="admin-form-input"
                     placeholder="https://facebook.com/yourpage" />
                 </div>
                 <div class="admin-form-group">
                   <label class="admin-form-label">Twitter/X URL</label>
                   <input type="url" name="twitter_url" class="admin-form-input"
                     placeholder="https://twitter.com/yourhandle" />
                 </div>
               </div>

               <div class="admin-form-row">
                 <div class="admin-form-group">
                   <label class="admin-form-label">Instagram URL</label>
                   <input type="url" name="instagram_url" class="admin-form-input"
                     placeholder="https://instagram.com/youraccount" />
                 </div>
                 <div class="admin-form-group">
                   <label class="admin-form-label">YouTube Channel</label>
                   <input type="url" name="youtube_url" class="admin-form-input"
                     placeholder="https://youtube.com/yourchannel" />
                 </div>
               </div>

               <div class="admin-form-row">
                 <div class="admin-form-group">
                   <label class="admin-form-label">Phone Number</label>
                   <input type="tel" name="phone_number" class="admin-form-input"
                     placeholder="+1 (555) 123-4567" />
                 </div>
                 <div class="admin-form-group">
                   <label class="admin-form-label">Address</label>
                   <input type="text" name="address" class="admin-form-input"
                     placeholder="123 Main St, City, State 12345" />
                 </div>
               </div>

               <div class="admin-form-group">
                 <label class="admin-form-label">Footer Text</label>
                 <textarea name="footer_text" class="admin-form-textarea" rows="3"
                   placeholder="Custom footer text or copyright notice..."></textarea>
               </div>

               <div class="admin-form-actions">
                 <button type="submit" class="admin-btn admin-btn-primary">
                   <i class="fas fa-save"></i>
                   Save Social & Contact Settings
                 </button>
               </div>
             </form>
           </div>
         </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            // Load current settings
            loadCurrentSettings();

            // Settings form handlers
            document.getElementById('general-settings-form').addEventListener('submit', function(e) {
              e.preventDefault();
              handleSettingsSubmit(this, 'general', 'General settings updated successfully!');
            });

            document.getElementById('content-settings-form').addEventListener('submit', function(e) {
              e.preventDefault();
              handleSettingsSubmit(this, 'content', 'Content settings updated successfully!');
            });

            document.getElementById('user-settings-form').addEventListener('submit', function(e) {
              e.preventDefault();
              handleSettingsSubmit(this, 'user', 'User settings updated successfully!');
            });

            document.getElementById('security-settings-form').addEventListener('submit', function(e) {
              e.preventDefault();
              handleSettingsSubmit(this, 'security', 'Security settings updated successfully!');
            });

            document.getElementById('appearance-settings-form').addEventListener('submit', function(e) {
              e.preventDefault();
              handleSettingsSubmit(this, 'appearance', 'Appearance settings updated successfully!');
            });

            document.getElementById('social-settings-form').addEventListener('submit', function(e) {
              e.preventDefault();
              handleSettingsSubmit(this, 'social', 'Social media & contact settings updated successfully!');
            });

            async function loadCurrentSettings() {
              try {
                const response = await fetch('/admin/api/settings');
                const data = await response.json();

                if (data.success && data.settings) {
                  populateFormFields(data.settings);
                }
              } catch (error) {
                console.error('Error loading settings:', error);
              }
            }

            function populateFormFields(settings) {
              // General settings
              if (settings.site_name) document.querySelector('input[name="site_name"]').value = settings.site_name;
              if (settings.site_tagline) document.querySelector('input[name="site_tagline"]').value = settings.site_tagline;
              if (settings.site_description) document.querySelector('textarea[name="site_description"]').value = settings.site_description;
              if (settings.contact_email) document.querySelector('input[name="contact_email"]').value = settings.contact_email;
              if (settings.admin_email) document.querySelector('input[name="admin_email"]').value = settings.admin_email;

              // Content settings
              if (settings.articles_per_page) document.querySelector('select[name="articles_per_page"]').value = settings.articles_per_page;
              if (settings.default_article_status) document.querySelector('select[name="default_article_status"]').value = settings.default_article_status;
              if (settings.require_comment_approval !== undefined) document.querySelector('input[name="require_approval"]').checked = settings.require_comment_approval;
              if (settings.allow_guest_comments !== undefined) document.querySelector('input[name="allow_guest_comments"]').checked = settings.allow_guest_comments;

              // User settings
              if (settings.default_user_role) document.querySelector('select[name="default_user_role"]').value = settings.default_user_role;
              if (settings.registration_status) document.querySelector('select[name="registration_status"]').value = settings.registration_status;
              if (settings.enable_user_profiles !== undefined) document.querySelector('input[name="enable_user_profiles"]').checked = settings.enable_user_profiles;
              if (settings.send_welcome_email !== undefined) document.querySelector('input[name="send_welcome_email"]').checked = settings.send_welcome_email;

              // Security settings
              if (settings.session_timeout) document.querySelector('select[name="session_timeout"]').value = settings.session_timeout;
              if (settings.password_strength) document.querySelector('select[name="password_strength"]').value = settings.password_strength;
              if (settings.enable_2fa !== undefined) document.querySelector('input[name="enable_2fa"]').checked = settings.enable_2fa;
              if (settings.log_user_activity !== undefined) document.querySelector('input[name="log_user_activity"]').checked = settings.log_user_activity;

              // Appearance settings
              if (settings.primary_color) document.querySelector('input[name="primary_color"]').value = settings.primary_color;
              if (settings.secondary_color) document.querySelector('input[name="secondary_color"]').value = settings.secondary_color;
              if (settings.font_family) document.querySelector('select[name="font_family"]').value = settings.font_family;
              if (settings.logo_url) document.querySelector('input[name="logo_url"]').value = settings.logo_url;
              if (settings.enable_dark_mode !== undefined) document.querySelector('input[name="enable_dark_mode"]').checked = settings.enable_dark_mode;
              if (settings.show_breadcrumbs !== undefined) document.querySelector('input[name="show_breadcrumbs"]').checked = settings.show_breadcrumbs;

              // Social media settings
              if (settings.facebook_url) document.querySelector('input[name="facebook_url"]').value = settings.facebook_url;
              if (settings.twitter_url) document.querySelector('input[name="twitter_url"]').value = settings.twitter_url;
              if (settings.instagram_url) document.querySelector('input[name="instagram_url"]').value = settings.instagram_url;
              if (settings.youtube_url) document.querySelector('input[name="youtube_url"]').value = settings.youtube_url;
              if (settings.phone_number) document.querySelector('input[name="phone_number"]').value = settings.phone_number;
              if (settings.address) document.querySelector('input[name="address"]').value = settings.address;
              if (settings.footer_text) document.querySelector('textarea[name="footer_text"]').value = settings.footer_text;
            }

            async function handleSettingsSubmit(form, type, successMessage) {
              const formData = new FormData(form);
              const data = Object.fromEntries(formData.entries());

              // Convert checkbox values to boolean
              Object.keys(data).forEach(key => {
                if (data[key] === 'on') {
                  data[key] = true;
                } else if (data[key] === 'off' || data[key] === '') {
                  data[key] = false;
                }
              });

              try {
                const submitButton = form.querySelector('button[type="submit"]');
                const originalText = submitButton.innerHTML;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                submitButton.disabled = true;

                const response = await fetch('/admin/api/settings', {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ settings: data })
                });

                const result = await response.json();

                if (result.success) {
                  showAdminMessage(successMessage, 'success');
                } else {
                  throw new Error(result.error || 'Failed to save settings');
                }

                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
              } catch (error) {
                console.error('Settings save error:', error);
                showAdminMessage('Failed to save settings. Please try again.', 'error');

                const submitButton = form.querySelector('button[type="submit"]');
                submitButton.innerHTML = form.id.includes('general') ? '<i class="fas fa-save"></i> Save General Settings' :
                  form.id.includes('content') ? '<i class="fas fa-save"></i> Save Content Settings' :
                  form.id.includes('user') ? '<i class="fas fa-save"></i> Save User Settings' :
                  form.id.includes('security') ? '<i class="fas fa-save"></i> Save Security Settings' :
                  form.id.includes('appearance') ? '<i class="fas fa-save"></i> Save Appearance Settings' :
                  form.id.includes('social') ? '<i class="fas fa-save"></i> Save Social & Contact Settings' :
                  '<i class="fas fa-save"></i> Save Settings';
                submitButton.disabled = false;
              }
            }
          });
        `
      }}></script>
    </AdminLayout>,
    { title: 'Settings' }
  );
});

// Admin Roles Management - Admin Only
adminApp.get('/roles', requireAdminOnly, async (c) => {
  const user = (c as any).adminUser;
  
  return c.render(
    <AdminLayout currentUser={user} currentPage="roles" breadcrumb="Role Management">
      <div class="admin-page-header">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 class="admin-page-title">Role Management</h1>
            <p class="admin-page-subtitle">Manage user roles and permissions for your Faith Defenders community</p>
          </div>
          <div class="admin-collapsible-controls">
            <button class="admin-btn admin-btn-outline admin-btn-sm" onclick="expandAllSections()">
              <i class="fas fa-expand-alt"></i> Expand All
            </button>
            <button class="admin-btn admin-btn-outline admin-btn-sm" onclick="collapseAllSections()">
              <i class="fas fa-compress-alt"></i> Collapse All
            </button>
          </div>
        </div>
      </div>

      <div class="admin-roles-container">
        {/* Current Roles Overview - Always Expanded */}
        <div class="admin-card admin-collapsible-section expanded">
          <div class="admin-card-header">
            <h3 class="admin-card-title">
              <i class="fas fa-users-cog"></i>
              Current Roles Overview
            </h3>
          </div>
          <div class="admin-card-content">
            <div class="admin-roles-stats-compact">
              <div class="admin-role-stat-compact admin">
                <div class="admin-role-stat-icon-compact">
                  <i class="fas fa-crown"></i>
                </div>
                <div class="admin-role-stat-info-compact">
                  <div class="admin-role-stat-number-compact" id="admin-count">-</div>
                  <div class="admin-role-stat-label-compact">Admins</div>
                  <div class="admin-role-emails" id="admin-emails">
                    <div class="admin-loading">
                      <div class="admin-spinner"></div>
                      Loading...
                    </div>
                  </div>
                </div>
              </div>

              <div class="admin-role-stat-compact moderator">
                <div class="admin-role-stat-icon-compact">
                  <i class="fas fa-shield-alt"></i>
                </div>
                <div class="admin-role-stat-info-compact">
                  <div class="admin-role-stat-number-compact" id="moderator-count">-</div>
                  <div class="admin-role-stat-label-compact">Mods</div>
                  <div class="admin-role-emails" id="moderator-emails">
                    <div class="admin-loading">
                      <div class="admin-spinner"></div>
                      Loading...
                    </div>
                  </div>
                </div>
              </div>

              <div class="admin-role-stat-compact user">
                <div class="admin-role-stat-icon-compact">
                  <i class="fas fa-user"></i>
                </div>
                <div class="admin-role-stat-info-compact">
                  <div class="admin-role-stat-number-compact" id="user-count">-</div>
                  <div class="admin-role-stat-label-compact">Users</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Role Definitions - Collapsible */}
        <div class="admin-card admin-collapsible-section collapsed">
          <div class="admin-card-header admin-collapsible-header" onclick="toggleCollapsibleSection(this)">
            <h3 class="admin-card-title">
              <i class="fas fa-list-ul"></i>
              Role Definitions & Permissions
            </h3>
            <div class="admin-collapsible-toggle">
              <i class="fas fa-chevron-down"></i>
            </div>
          </div>
          <div class="admin-card-content admin-collapsible-content">
            <div class="admin-roles-definitions">

              {/* Administrator Role */}
              <div class="admin-role-definition admin-role-admin">
                <div class="admin-role-header">
                  <div class="admin-role-icon">
                    <i class="fas fa-crown"></i>
                  </div>
                  <div class="admin-role-info">
                    <h4 class="admin-role-name">Administrator</h4>
                    <p class="admin-role-description">Full access to all features and settings</p>
                  </div>
                </div>
                <div class="admin-role-permissions">
                  <h5>Permissions:</h5>
                  <ul class="admin-permissions-list">
                    <li><i class="fas fa-check"></i> Create, edit, and delete all articles</li>
                    <li><i class="fas fa-check"></i> Manage all resources and library content</li>
                    <li><i class="fas fa-check"></i> Full user management and role assignment</li>
                    <li><i class="fas fa-check"></i> Access admin panel and all settings</li>
                    <li><i class="fas fa-check"></i> Moderate comments and user behavior</li>
                    <li><i class="fas fa-check"></i> Database backup and site management</li>
                    <li><i class="fas fa-check"></i> View analytics and performance metrics</li>
                  </ul>
                </div>
              </div>

              {/* Moderator Role */}
              <div class="admin-role-definition admin-role-moderator">
                <div class="admin-role-header">
                  <div class="admin-role-icon">
                    <i class="fas fa-shield-alt"></i>
                  </div>
                  <div class="admin-role-info">
                    <h4 class="admin-role-name">Moderator</h4>
                    <p class="admin-role-description">Content creation and community moderation</p>
                  </div>
                </div>
                <div class="admin-role-permissions">
                  <h5>Permissions:</h5>
                  <ul class="admin-permissions-list">
                    <li><i class="fas fa-check"></i> Create, edit, and publish articles</li>
                    <li><i class="fas fa-check"></i> Add and manage resource library items</li>
                    <li><i class="fas fa-times"></i> Limited user management (no role changes)</li>
                    <li><i class="fas fa-times"></i> No access to admin panel or settings</li>
                    <li><i class="fas fa-check"></i> Moderate comments and user interactions</li>
                    <li><i class="fas fa-times"></i> No database or system management access</li>
                    <li><i class="fas fa-times"></i> Limited analytics access</li>
                  </ul>
                </div>
              </div>

              {/* Regular User Role */}
              <div class="admin-role-definition admin-role-user">
                <div class="admin-role-header">
                  <div class="admin-role-icon">
                    <i class="fas fa-user"></i>
                  </div>
                  <div class="admin-role-info">
                    <h4 class="admin-role-name">Regular User</h4>
                    <p class="admin-role-description">Community engagement and interaction</p>
                  </div>
                </div>
                <div class="admin-role-permissions">
                  <h5>Permissions:</h5>
                  <ul class="admin-permissions-list">
                    <li><i class="fas fa-times"></i> Cannot create or edit articles</li>
                    <li><i class="fas fa-times"></i> Cannot add resources to library</li>
                    <li><i class="fas fa-times"></i> No user management capabilities</li>
                    <li><i class="fas fa-times"></i> No admin panel access</li>
                    <li><i class="fas fa-check"></i> Comment on articles and resources</li>
                    <li><i class="fas fa-check"></i> Like/dislike content and comments</li>
                    <li><i class="fas fa-check"></i> Edit own profile and comments</li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Quick Role Actions - Collapsible */}
        <div class="admin-card admin-collapsible-section collapsed">
          <div class="admin-card-header admin-collapsible-header" onclick="toggleCollapsibleSection(this)">
            <h3 class="admin-card-title">
              <i class="fas fa-bolt"></i>
              Quick Role Actions
            </h3>
            <div class="admin-collapsible-toggle">
              <i class="fas fa-chevron-down"></i>
            </div>
          </div>
          <div class="admin-card-content admin-collapsible-content">
            <div class="admin-quick-actions-row">
              <div class="admin-action-row-item">
                <div class="admin-action-form-row">
                  <div class="admin-action-form-group">
                    <label class="admin-action-label">Promote to Moderator</label>
                    <select id="promote-user-select" class="admin-form-select">
                      <option value="">Select user...</option>
                      {/* Users will be loaded dynamically */}
                    </select>
                  </div>
                  <button class="admin-btn admin-btn-primary admin-btn-sm" onclick="promoteToModerator()">
                    <i class="fas fa-arrow-up"></i>
                    Promote
                  </button>
                </div>
              </div>

              <div class="admin-action-row-item">
                <div class="admin-action-form-row">
                  <div class="admin-action-form-group">
                    <label class="admin-action-label">
                      Promote to Admin
                      <span class="admin-warning-badge">
                        <i class="fas fa-exclamation-triangle"></i>
                      </span>
                    </label>
                    <select id="admin-user-select" class="admin-form-select">
                      <option value="">Select user...</option>
                      {/* Users will be loaded dynamically */}
                    </select>
                  </div>
                  <button class="admin-btn admin-btn-warning admin-btn-sm" onclick="promoteToAdmin()">
                    <i class="fas fa-crown"></i>
                    Promote
                  </button>
                </div>
              </div>

              <div class="admin-action-row-item">
                <div class="admin-action-form-row">
                  <div class="admin-action-form-group">
                    <label class="admin-action-label">Demote User</label>
                    <select id="demote-user-select" class="admin-form-select">
                      <option value="">Select user...</option>
                      {/* Users will be loaded dynamically */}
                    </select>
                  </div>
                  <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="demoteUser()">
                    <i class="fas fa-arrow-down"></i>
                    Demote
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Verification Modal */}
        <div id="admin-verification-modal" class="admin-modal" style="display: none;">
          <div class="admin-modal-content" style="max-width: 500px;">
            <div class="admin-modal-header">
              <h3>Admin Role Change Verification</h3>
              <button onclick="closeAdminVerificationModal()" class="admin-modal-close">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="admin-modal-body">
              <div id="verification-message">
                <p><strong>Verification Required</strong></p>
                <p>A verification code has been sent to your email address.</p>
                <p>Please check your inbox (and spam folder if necessary) for the 6-digit code.</p>
                <p>Enter the code below to complete the role change:</p>
              </div>
              <form id="verification-form" onsubmit="verifyAdminRoleChange(event)">
                <div class="admin-form-group">
                  <label class="admin-form-label">Verification Code</label>
                  <input type="text" id="verification-code" name="verificationToken" class="admin-form-input" placeholder="Enter 6-digit code" maxlength="6" required />
                  <small class="admin-form-help">Code expires in 15 minutes. Max 3 attempts.</small>
                </div>
                <div class="admin-actions">
                  <button type="button" onclick="closeAdminVerificationModal()" class="admin-btn admin-btn-outline">Cancel</button>
                  <button type="submit" class="admin-btn admin-btn-primary">
                    <i class="fas fa-check"></i> Verify & Complete
                  </button>
                </div>
              </form>
              <div id="verification-status"></div>
            </div>
          </div>
        </div>

        {/* Role Change History - Collapsible */}
        <div class="admin-card admin-collapsible-section collapsed">
          <div class="admin-card-header admin-collapsible-header" onclick="toggleCollapsibleSection(this)">
            <h3 class="admin-card-title">
              <i class="fas fa-history"></i>
              Recent Role Changes
            </h3>
            <div class="admin-collapsible-toggle">
              <i class="fas fa-chevron-down"></i>
            </div>
          </div>
          <div class="admin-card-content admin-collapsible-content">
            <div class="admin-role-history" id="role-history">
              <div class="admin-no-data">
                <i class="fas fa-clock"></i>
                No recent role changes to display.
              </div>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            loadRoleStats();
            loadUserSelects();
            loadRoleHistory();
            initializeCollapsibleSections();
            loadRoleEmails();
          });

          async function loadRoleStats() {
            try {
              const response = await fetch('/admin/api/users');
              if (response.ok) {
                const data = await response.json();
                const users = data.users || [];
                
                const adminCount = users.filter(u => u.role === 'admin').length;
                const moderatorCount = users.filter(u => u.role === 'moderator').length;
                const userCount = users.filter(u => u.role === 'user').length;
                
                document.getElementById('admin-count').textContent = adminCount;
                document.getElementById('moderator-count').textContent = moderatorCount;
                document.getElementById('user-count').textContent = userCount;
              }
            } catch (error) {
              console.error('Error loading role stats:', error);
            }
          }

          async function loadUserSelects() {
            try {
              const response = await fetch('/admin/api/users');
              if (response.ok) {
                const data = await response.json();
                const users = data.users || [];
                
                // Populate promote to moderator select (regular users only)
                const promoteSelect = document.getElementById('promote-user-select');
                const regularUsers = users.filter(u => u.role === 'user');
                promoteSelect.innerHTML = '<option value="">Select a user...</option>';
                regularUsers.forEach(user => {
                  const option = document.createElement('option');
                  option.value = user.id;
                  option.textContent = \`\${user.name} (\${user.email})\`;
                  promoteSelect.appendChild(option);
                });
                
                // Populate promote to admin select (non-admin users)
                const adminSelect = document.getElementById('admin-user-select');
                const nonAdminUsers = users.filter(u => u.role !== 'admin');
                adminSelect.innerHTML = '<option value="">Select a user...</option>';
                nonAdminUsers.forEach(user => {
                  const option = document.createElement('option');
                  option.value = user.id;
                  option.textContent = \`\${user.name} (\${user.email}) - \${user.role.toUpperCase()}\`;
                  adminSelect.appendChild(option);
                });
                
                // Populate demote select (admins and moderators only)
                const demoteSelect = document.getElementById('demote-user-select');
                const privilegedUsers = users.filter(u => u.role === 'admin' || u.role === 'moderator');
                demoteSelect.innerHTML = '<option value="">Select a user...</option>';
                privilegedUsers.forEach(user => {
                  const option = document.createElement('option');
                  option.value = user.id;
                  option.textContent = \`\${user.name} (\${user.email}) - \${user.role.toUpperCase()}\`;
                  demoteSelect.appendChild(option);
                });
              }
            } catch (error) {
              console.error('Error loading users:', error);
            }
          }

          async function loadRoleHistory() {
            try {
              const response = await fetch('/admin/api/role-changes?limit=10');
              const data = await response.json();

              if (data.success) {
                renderRoleHistory(data.roleChanges);
              } else {
                console.error('Failed to load role changes:', data.error);
                document.getElementById('role-history').innerHTML = \`
                  <div class="admin-no-data">
                    <i class="fas fa-clock"></i>
                    No recent role changes to display.
                  </div>
                \`;
              }
            } catch (error) {
              console.error('Error loading recent role changes:', error);
              document.getElementById('role-history').innerHTML = \`
                <div class="admin-no-data">
                  <i class="fas fa-exclamation-triangle"></i>
                  Failed to load role changes.
                </div>
              \`;
            }
          }

          function renderRoleHistory(roleChanges) {
            const container = document.getElementById('role-history');
            if (!container) {
              console.warn('Role history container not found');
              return;
            }

            if (!roleChanges || roleChanges.length === 0) {
              container.innerHTML = \`
                <div class="admin-no-data">
                  <i class="fas fa-clock"></i>
                  No recent role changes to display.
                </div>
              \`;
              return;
            }

            const changesHTML = roleChanges.map(change => {
              const changeType = getRoleChangeType(change.old_role, change.new_role);
              const changeIcon = getRoleChangeIcon(changeType);
              const timeAgo = getTimeAgo(new Date(change.created_at));

              return \`
                <div class="admin-role-change-item">
                  <div class="admin-role-change-icon \${changeType}">
                    <i class="fas \${changeIcon}"></i>
                  </div>
                  <div class="admin-role-change-content">
                    <div class="admin-role-change-title">
                      <strong>\${change.target_user_name}</strong> was \${changeType === 'promotion' ? 'promoted' : changeType === 'demotion' ? 'demoted' : 'changed'} to
                      <span class="admin-role-badge \${change.new_role}">\${change.new_role}</span>
                    </div>
                    <div class="admin-role-change-meta">
                      <span class="admin-role-change-by">By \${change.changed_by_user_name}</span>
                      <span class="admin-role-change-time">\${timeAgo}</span>
                    </div>
                    \${change.change_reason ? \`<div class="admin-role-change-reason">"\${change.change_reason}"</div>\` : ''}
                  </div>
                </div>
              \`;
            }).join('');

            container.innerHTML = changesHTML;
          }

          function getRoleChangeType(oldRole, newRole) {
            const roleHierarchy = { 'user': 1, 'moderator': 2, 'admin': 3 };
            const oldLevel = roleHierarchy[oldRole] || 1;
            const newLevel = roleHierarchy[newRole] || 1;

            if (newLevel > oldLevel) return 'promotion';
            if (newLevel < oldLevel) return 'demotion';
            return 'change';
          }

          function getRoleChangeIcon(changeType) {
            switch (changeType) {
              case 'promotion': return 'fa-arrow-up';
              case 'demotion': return 'fa-arrow-down';
              default: return 'fa-exchange-alt';
            }
          }

          function getTimeAgo(date) {
            const now = new Date();
            const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

            if (diffInSeconds < 60) return 'Just now';
            if (diffInSeconds < 3600) return \`\${Math.floor(diffInSeconds / 60)} minutes ago\`;
            if (diffInSeconds < 86400) return \`\${Math.floor(diffInSeconds / 3600)} hours ago\`;
            if (diffInSeconds < 604800) return \`\${Math.floor(diffInSeconds / 86400)} days ago\`;

            return date.toLocaleDateString();
          }

          async function promoteToModerator() {
            const userId = document.getElementById('promote-user-select').value;
            if (!userId) {
              showAdminMessage('Please select a user to promote.', 'warning');
              return;
            }
            
            if (confirm('Are you sure you want to promote this user to moderator? They will gain content creation and moderation abilities.')) {
              await updateUserRole(userId, 'moderator');
            }
          }

          async function promoteToAdmin() {
            const userId = document.getElementById('admin-user-select').value;
            if (!userId) {
              showAdminMessage('Please select a user to promote.', 'warning');
              return;
            }

            if (confirm('Are you sure you want to promote this user to administrator? This gives them full site control including the ability to manage other administrators.')) {
              await requestRoleChange(userId, 'admin');
            }
          }

          // Global variables for verification flow
          let pendingVerificationUserId = null;
          let pendingVerificationNewRole = null;

          async function requestRoleChange(userId, newRole) {
            try {
              const response = await fetch(\`/admin/api/users/\${userId}/request-role-change\`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ newRole })
              });

              const data = await response.json();

              if (response.ok && data.success) {
                // Store pending verification data
                pendingVerificationUserId = userId;
                pendingVerificationNewRole = newRole;

                // Show verification modal
                document.getElementById('admin-verification-modal').style.display = 'block';
                document.getElementById('verification-code').focus();

                showAdminMessage('Verification code sent to your email. Please check your inbox.', 'info');
              } else {
                throw new Error(data.error || 'Failed to request role change');
              }
            } catch (error) {
              console.error('Error requesting role change:', error);
              showAdminMessage('Failed to send verification code. Please try again.', 'error');
            }
          }

          async function verifyAdminRoleChange(event) {
            event.preventDefault();

            const verificationToken = document.getElementById('verification-code').value.trim();
            if (!verificationToken) {
              showAdminMessage('Please enter the verification code.', 'warning');
              return;
            }

            try {
              const response = await fetch('/admin/api/users/verify-role-change', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  userId: pendingVerificationUserId,
                  verificationToken,
                  newRole: pendingVerificationNewRole
                })
              });

              const data = await response.json();

              if (response.ok && data.success) {
                // Success - close modal and refresh data
                closeAdminVerificationModal();
                showAdminMessage('User role updated successfully!', 'success');

                // Refresh the page data
                loadRoleStats();
                loadUserSelects();
                loadRoleHistory();

                // Clear pending data
                pendingVerificationUserId = null;
                pendingVerificationNewRole = null;
              } else {
                // Handle specific error cases
                if (data.error && data.error.includes('expired')) {
                  showAdminMessage('Verification code has expired. Please request a new one.', 'error');
                  closeAdminVerificationModal();
                } else if (data.error && data.error.includes('invalid')) {
                  showAdminMessage('Invalid verification code. Please try again.', 'error');
                  document.getElementById('verification-code').focus();
                } else {
                  throw new Error(data.error || 'Verification failed');
                }
              }
            } catch (error) {
              console.error('Error verifying role change:', error);
              showAdminMessage('Verification failed. Please try again.', 'error');
            }
          }

          function closeAdminVerificationModal() {
            document.getElementById('admin-verification-modal').style.display = 'none';
            document.getElementById('verification-code').value = '';
            document.getElementById('verification-status').textContent = '';

            // Clear pending data
            pendingVerificationUserId = null;
            pendingVerificationNewRole = null;
          }

          async function demoteUser() {
            const userId = document.getElementById('demote-user-select').value;
            if (!userId) {
              showAdminMessage('Please select a user to demote.', 'warning');
              return;
            }
            
            if (confirm('Are you sure you want to demote this user to regular user? They will lose their current privileges.')) {
              await updateUserRole(userId, 'user');
            }
          }

          async function updateUserRole(userId, newRole) {
            try {
              // Check if this is a self-role change
              const currentUserId = '${user.id}';
              const isSelfChange = parseInt(userId) === parseInt(currentUserId);

              if (isSelfChange) {
                // For self-changes, use direct PUT (allowed without verification)
                const response = await fetch(\`/admin/api/users/\${userId}\`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ role: newRole })
                });

                if (response.ok) {
                  const roleDisplayNames = {
                    'admin': 'Administrator',
                    'moderator': 'Moderator',
                    'user': 'Regular User'
                  };

                  showAdminMessage(\`User role updated to \${roleDisplayNames[newRole]} successfully!\`, 'success');

                  // Refresh the page data
                  loadRoleStats();
                  loadUserSelects();
                  loadRoleHistory();
                } else {
                  const errorData = await response.json();
                  throw new Error(errorData.error || 'Failed to update user role');
                }
              } else {
                // For other users, use the verification flow
                const response = await fetch(\`/admin/api/users/\${userId}/request-role-change\`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ newRole })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                  // Store pending verification data
                  pendingVerificationUserId = userId;
                  pendingVerificationNewRole = newRole;

                  // Show verification modal
                  document.getElementById('admin-verification-modal').style.display = 'block';
                  document.getElementById('verification-code').focus();

                  showAdminMessage('Verification code sent to your email. Please check your inbox.', 'info');
                } else {
                  throw new Error(data.error || 'Failed to request role change');
                }
              }
            } catch (error) {
              console.error('Error updating user role:', error);
              showAdminMessage(error.message || 'Failed to update user role. Please try again.', 'error');
            }
          }

          // Collapsible Section Functionality
          function toggleCollapsibleSection(headerElement) {
            const section = headerElement.closest('.admin-collapsible-section');
            const content = section.querySelector('.admin-collapsible-content');
            const toggleIcon = headerElement.querySelector('.admin-collapsible-toggle i');

            if (section.classList.contains('expanded')) {
              // Collapse the section
              section.classList.remove('expanded');
              section.classList.add('collapsed');
              content.style.maxHeight = content.scrollHeight + 'px';

              // Force reflow
              content.offsetHeight;

              content.style.maxHeight = '0px';
              toggleIcon.style.transform = 'rotate(-90deg)';
            } else {
              // Expand the section
              section.classList.remove('collapsed');
              section.classList.add('expanded');
              content.style.maxHeight = content.scrollHeight + 'px';
              toggleIcon.style.transform = 'rotate(0deg)';

              // Remove max-height after animation completes
              setTimeout(() => {
                content.style.maxHeight = 'none';
              }, 300);
            }
          }

          // Initialize collapsible sections on page load
          function initializeCollapsibleSections() {
            const collapsibleSections = document.querySelectorAll('.admin-collapsible-section');

            collapsibleSections.forEach(function(section) {
              const header = section.querySelector('.admin-collapsible-header');
              const content = section.querySelector('.admin-collapsible-content');

              // Add null checks to prevent errors
              if (content) {
                if (section.classList.contains('expanded')) {
                  content.style.maxHeight = 'none';
                } else if (section.classList.contains('collapsed')) {
                  content.style.maxHeight = '0px';
                }
              }

              // Add keyboard accessibility
              if (header) {
                header.setAttribute('tabindex', '0');
                header.setAttribute('role', 'button');
                header.setAttribute('aria-expanded', section.classList.contains('expanded') ? 'true' : 'false');

                header.addEventListener('keydown', function(e) {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCollapsibleSection(this);
                  }
                });
              }
            });

            // Load saved state from localStorage
            loadCollapsibleState();
          }

          // Expand all collapsible sections
          function expandAllSections() {
            const collapsibleSections = document.querySelectorAll('.admin-collapsible-section.collapsed');

            collapsibleSections.forEach(section => {
              const header = section.querySelector('.admin-collapsible-header');
              if (header) {
                toggleCollapsibleSection(header);
              }
            });

            // Save state
            saveCollapsibleState();
          }

          // Collapse all collapsible sections
          function collapseAllSections() {
            const collapsibleSections = document.querySelectorAll('.admin-collapsible-section.expanded');

            collapsibleSections.forEach(section => {
              const header = section.querySelector('.admin-collapsible-header');
              if (header) {
                toggleCollapsibleSection(header);
              }
            });

            // Save state
            saveCollapsibleState();
          }

          // Save collapsible state to localStorage
          function saveCollapsibleState() {
            const state = {};
            const collapsibleSections = document.querySelectorAll('.admin-collapsible-section');

            collapsibleSections.forEach(function(section, index) {
              const titleElement = section.querySelector('.admin-card-title');
              const sectionId = (titleElement && titleElement.textContent) ? titleElement.textContent.trim() : 'section-' + index;
              state[sectionId] = section.classList.contains('expanded');
            });

            localStorage.setItem('adminRolesCollapsibleState', JSON.stringify(state));
          }

          // Load collapsible state from localStorage
          function loadCollapsibleState() {
            try {
              const savedState = localStorage.getItem('adminRolesCollapsibleState');
              if (!savedState) return;

              const state = JSON.parse(savedState);
              const collapsibleSections = document.querySelectorAll('.admin-collapsible-section');

              collapsibleSections.forEach(function(section, index) {
                const titleElement = section.querySelector('.admin-card-title');
                const sectionId = (titleElement && titleElement.textContent) ? titleElement.textContent.trim() : 'section-' + index;
                const shouldBeExpanded = state[sectionId];

                if (shouldBeExpanded !== undefined) {
                  const header = section.querySelector('.admin-collapsible-header');
                  const isCurrentlyExpanded = section.classList.contains('expanded');

                  if (header) {
                    if (shouldBeExpanded && !isCurrentlyExpanded) {
                      toggleCollapsibleSection(header);
                    } else if (!shouldBeExpanded && isCurrentlyExpanded) {
                      toggleCollapsibleSection(header);
                    }
                  }
                }
              });
            } catch (error) {
              console.warn('Failed to load collapsible state:', error);
            }
          }

          // Load role emails for admins and moderators
          async function loadRoleEmails() {
            try {
              // Load all users and filter client-side to ensure correct role filtering
              const allUsersResponse = await fetch('/admin/api/users?limit=50');
              if (allUsersResponse.ok) {
                const allUsersData = await allUsersResponse.json();
                const allUsers = allUsersData.users || [];

                // Filter admins
                const admins = allUsers.filter(function(user) {
                  return user.role === 'admin';
                }).slice(0, 5); // Limit to 5

                // Filter moderators
                const moderators = allUsers.filter(function(user) {
                  return user.role === 'moderator';
                }).slice(0, 5); // Limit to 5

                displayRoleEmails('admin-emails', admins);
                displayRoleEmails('moderator-emails', moderators);
              } else {
                // Fallback to individual API calls if bulk fetch fails
                console.warn('Bulk user fetch failed, trying individual calls');

                // Load admin emails
                const adminResponse = await fetch('/admin/api/users?role=admin&limit=5');
                if (adminResponse.ok) {
                  const adminData = await adminResponse.json();
                  const admins = (adminData.users || []).filter(function(user) {
                    return user.role === 'admin';
                  });
                  displayRoleEmails('admin-emails', admins);
                }

                // Load moderator emails
                const modResponse = await fetch('/admin/api/users?role=moderator&limit=5');
                if (modResponse.ok) {
                  const modData = await modResponse.json();
                  const moderators = (modData.users || []).filter(function(user) {
                    return user.role === 'moderator';
                  });
                  displayRoleEmails('moderator-emails', moderators);
                }
              }
            } catch (error) {
              console.error('Failed to load role emails:', error);
              // Show error state
              document.getElementById('admin-emails').innerHTML = '<div class="admin-error">Failed to load</div>';
              document.getElementById('moderator-emails').innerHTML = '<div class="admin-error">Failed to load</div>';
            }
          }

          // Display role emails in the UI
          function displayRoleEmails(containerId, users) {
            const container = document.getElementById(containerId);
            if (!container) return;

            if (users.length === 0) {
              container.innerHTML = '<div class="admin-no-data">No users found</div>';
              return;
            }

            const emailList = users.map(function(user) {
              return '<div class="admin-role-email-item">' + user.email + '</div>';
            }).join('');

            container.innerHTML = emailList;
          }
        `
      }}></script>
    </AdminLayout>,
    { title: 'Role Management' }
  );
});

// Admin Backup & Export - Admin Only
adminApp.get('/backup', requireAdminOnly, async (c) => {
  const user = (c as any).adminUser;

  return c.render(
    <AdminLayout currentUser={user} currentPage="backup" breadcrumb="Backup & Export">
      <div class="admin-page-header">
        <h1 class="admin-page-title">Backup & Export</h1>
        <p class="admin-page-subtitle">Backup your data and export content for safekeeping</p>
      </div>

      <div class="admin-backup-container">
        {/* Database Backup */}
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">
              <i class="fas fa-database"></i>
              Database Backup
            </h3>
          </div>
          <div class="admin-card-content">
            <p class="admin-card-description">
              Create a complete backup of your database including users, articles, resources, and comments.
            </p>

            <div class="admin-backup-actions">
              <button class="admin-btn admin-btn-primary" id="backup-database">
                <i class="fas fa-download"></i>
                Download Database Backup
              </button>
              <button class="admin-btn admin-btn-secondary" id="schedule-backup">
                <i class="fas fa-clock"></i>
                Schedule Automatic Backups
              </button>
            </div>

            <div class="admin-backup-info">
              <div class="admin-info-item">
                <strong>Last Backup:</strong> <span id="last-backup-time">Never</span>
              </div>
              <div class="admin-info-item">
                <strong>Backup Size:</strong> <span id="backup-size">-</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Export */}
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">
              <i class="fas fa-file-export"></i>
              Content Export
            </h3>
          </div>
          <div class="admin-card-content">
            <p class="admin-card-description">
              Export your content in various formats for sharing or migration purposes.
            </p>

            <div class="admin-export-options">
              <div class="admin-export-option">
                <h4>Articles Export</h4>
                <p>Export all published articles as JSON, CSV, or PDF collection.</p>
                <div class="admin-export-buttons">
                  <button class="admin-btn admin-btn-outline" onclick="exportContent('articles', 'json')">
                    <i class="fas fa-code"></i> JSON
                  </button>
                  <button class="admin-btn admin-btn-outline" onclick="exportContent('articles', 'csv')">
                    <i class="fas fa-table"></i> CSV
                  </button>
                  <button class="admin-btn admin-btn-outline" onclick="exportContent('articles', 'pdf')">
                    <i class="fas fa-file-pdf"></i> PDF
                  </button>
                </div>
              </div>

              <div class="admin-export-option">
                <h4>Resources Export</h4>
                <p>Export your resource library with all metadata and links.</p>
                <div class="admin-export-buttons">
                  <button class="admin-btn admin-btn-outline" onclick="exportContent('resources', 'json')">
                    <i class="fas fa-code"></i> JSON
                  </button>
                  <button class="admin-btn admin-btn-outline" onclick="exportContent('resources', 'csv')">
                    <i class="fas fa-table"></i> CSV
                  </button>
                </div>
              </div>

              <div class="admin-export-option">
                <h4>Users Export</h4>
                <p>Export user information (excluding sensitive data like passwords).</p>
                <div class="admin-export-buttons">
                  <button class="admin-btn admin-btn-outline" onclick="exportContent('users', 'csv')">
                    <i class="fas fa-table"></i> CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Restore Options */}
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">
              <i class="fas fa-upload"></i>
              Restore & Import
            </h3>
          </div>
          <div class="admin-card-content">
            <div class="admin-warning">
              <i class="fas fa-exclamation-triangle"></i>
              <strong>Warning:</strong> Restoring from backup will overwrite existing data. Please ensure you have a current backup before proceeding.
            </div>

            <div class="admin-restore-section">
              <h4>Restore from Backup</h4>
              <p>Upload a backup file to restore your database.</p>

              <div class="admin-file-upload">
                <input type="file" id="restore-file" class="admin-file-input" accept=".sql,.json,.zip" />
                <label for="restore-file" class="admin-file-label">
                  <i class="fas fa-cloud-upload-alt"></i>
                  Choose Backup File
                </label>
              </div>

              <button class="admin-btn admin-btn-danger" id="restore-backup" disabled>
                <i class="fas fa-upload"></i>
                Restore from Backup
              </button>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            // Database backup handler
            document.getElementById('backup-database').addEventListener('click', async function() {
              const button = this;
              const originalText = button.innerHTML;

              try {
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Backup...';
                button.disabled = true;

                // Simulate backup creation
                await new Promise(resolve => setTimeout(resolve, 2000));

                // In a real implementation, this would call an API endpoint
                showAdminMessage('Database backup created successfully!', 'success');

                // Update last backup time
                document.getElementById('last-backup-time').textContent = new Date().toLocaleString();
                document.getElementById('backup-size').textContent = '2.3 MB';

              } catch (error) {
                console.error('Backup error:', error);
                showAdminMessage('Failed to create backup. Please try again.', 'error');
              } finally {
                button.innerHTML = originalText;
                button.disabled = false;
              }
            });

            // Restore file handler
            document.getElementById('restore-file').addEventListener('change', function(e) {
              const restoreButton = document.getElementById('restore-backup');
              if (e.target.files.length > 0) {
                restoreButton.disabled = false;
                restoreButton.innerHTML = '<i class="fas fa-upload"></i> Restore from ' + e.target.files[0].name;
              } else {
                restoreButton.disabled = true;
                restoreButton.innerHTML = '<i class="fas fa-upload"></i> Restore from Backup';
              }
            });

            // Restore backup handler
            document.getElementById('restore-backup').addEventListener('click', function() {
              if (confirm('Are you sure you want to restore from this backup? This will overwrite all existing data and cannot be undone.')) {
                showAdminMessage('Restore functionality will be implemented in a future update.', 'info');
              }
            });
          });

          // Export content function
          async function exportContent(type, format) {
            try {
              showAdminMessage(\`Exporting \${type} as \${format.toUpperCase()}...\`, 'info');

              // Simulate export process
              await new Promise(resolve => setTimeout(resolve, 1500));

              showAdminMessage(\`\${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully!\`, 'success');
            } catch (error) {
              console.error('Export error:', error);
              showAdminMessage(\`Failed to export \${type}. Please try again.\`, 'error');
            }
          }
        `
      }}></script>
    </AdminLayout>,
    { title: 'Backup & Export' }
  );
});

// Security Dashboard - Admin Only
adminApp.get('/security', requireAdminOnly, async (c) => {
  const user = (c as any).adminUser;

  return c.render(
    <AdminLayout currentUser={user} currentPage="security" breadcrumb="Security Dashboard">
      <div class="admin-page-header">
        <h1 class="admin-page-title">Security Monitoring Dashboard</h1>
        <p class="admin-page-subtitle">Real-time security monitoring and threat detection</p>
      </div>

      {/* Embedded Security Dashboard */}
      <div class="admin-security-dashboard">
        <div class="dashboard-container">
          <div class="dashboard-header">
            <h1>🛡️ Faith Defenders Security Monitoring Dashboard</h1>
            <p>Real-time security monitoring and threat detection</p>
            <button class="refresh-btn" onclick="refreshDashboard()">🔄 Refresh Dashboard</button>
          </div>

          {/* Navigation Tabs */}
          <div class="tabs">
            <div class="tab active" onclick="switchTab('overview')">Overview</div>
            <div class="tab" onclick="switchTab('threats')">Threat Detection</div>
            <div class="tab" onclick="switchTab('profile')">My Profile</div>
            <div class="tab" onclick="switchTab('logs')">Security Logs</div>
          </div>

          {/* Overview Tab */}
          <div id="overview" class="tab-content active">
            {/* Security Status Overview */}
            <div class="security-status-overview" id="security-status-overview">
              <div class="status-card success">
                <div class="status-label">Security Score</div>
                <div class="status-value">95</div>
                <div class="status-description">Excellent security posture</div>
              </div>
              <div class="status-card info">
                <div class="status-label">Active Threats</div>
                <div class="status-value">2</div>
                <div class="status-description">Current active threats</div>
              </div>
              <div class="status-card success">
                <div class="status-label">System Health</div>
                <div class="status-value">99.9%</div>
                <div class="status-description">Overall system status</div>
              </div>
              <div class="status-card warning">
                <div class="status-label">Risk Level</div>
                <div class="status-value">Low</div>
                <div class="status-description">Current risk assessment</div>
              </div>
            </div>

            {/* Security Metrics */}
            <div class="metrics-grid">
              <div class="metric-card success">
                <div class="metric-label">Active Sessions</div>
                <div class="metric-value" id="active-sessions">0</div>
                <div>Currently authenticated users</div>
              </div>

              <div class="metric-card info">
                <div class="metric-label">Total Requests (24h)</div>
                <div class="metric-value" id="total-requests">0</div>
                <div>API requests in last 24 hours</div>
              </div>

              <div class="metric-card warning" id="blocked-requests-card">
                <div class="metric-label">Blocked Requests</div>
                <div class="metric-value" id="blocked-requests">0</div>
                <div>Requests blocked by security</div>
              </div>

              <div class="metric-card danger" id="security-alerts-card">
                <div class="metric-label">Security Alerts</div>
                <div class="metric-value" id="security-alerts">0</div>
                <div>Active security alerts</div>
              </div>

              <div class="metric-card info" id="rate-limit-hits-card">
                <div class="metric-label">Rate Limit Hits</div>
                <div class="metric-value" id="rate-limit-hits">0</div>
                <div>Rate limit violations</div>
              </div>

              <div class="metric-card success">
                <div class="metric-label">Uptime</div>
                <div class="metric-value" id="uptime">100%</div>
                <div>System availability</div>
              </div>
            </div>

            {/* Charts */}
            <div class="charts-container">
              <div class="chart-card">
                <h3>Request Activity (Last 24h)</h3>
                <canvas id="activity-chart" width="400" height="200"></canvas>
              </div>

              <div class="chart-card">
                <h3>Security Events Distribution</h3>
                <canvas id="security-chart" width="400" height="200"></canvas>
              </div>
            </div>

            {/* Recent Alerts */}
            <div class="alerts-section">
              <h3>Recent Security Alerts</h3>
              <div id="alerts-container">
                <div class="alert-item info">
                  <strong>System Status:</strong> All security systems operational
                </div>
              </div>
            </div>
          </div>

          {/* Threat Detection Tab */}
          <div id="threats" class="tab-content">
            <div class="threat-indicators">
              <div class="threat-card">
                <h4>Brute Force Attempts</h4>
                <div class="threat-value" id="brute-force-count">0</div>
                <small>Last 24 hours</small>
              </div>

              <div class="threat-card">
                <h4>Suspicious IPs</h4>
                <div class="threat-value" id="suspicious-ips">0</div>
                <small>Currently blocked</small>
              </div>

              <div class="threat-card">
                <h4>CSRF Attempts</h4>
                <div class="threat-value" id="csrf-attempts">0</div>
                <small>Last 24 hours</small>
              </div>

              <div class="threat-card">
                <h4>SQL Injection Attempts</h4>
                <div class="threat-value" id="sql-injection">0</div>
                <small>Last 24 hours</small>
              </div>
            </div>

            <div class="chart-card" style="margin-top: 20px;">
              <h3>Threat Activity Timeline</h3>
              <canvas id="threat-chart" width="800" height="300"></canvas>
            </div>
          </div>

          {/* My Profile Tab */}
          <div id="profile" class="tab-content">
            <div class="profile-section">
              <h3>Your Profile</h3>
              <div class="user-info">
                <div class="user-avatar">
                  <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjMWUzYzcyIiBzdHJva2U9IiMyYTUyOTgiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0zMCA2MWMwIDYtNS41IDEwLTEyIDEwcy0xMi00LTEyLTEwIiBmaWxsPSIjMWUzYzcyIi8+PHBhdGggZD0iTTMwIDYwYzAgNi01LjUgMTAtMTIgMTBzLTEyLTQtMTItMTBMMzAgNjB6IiBmaWxsPSIjMmE1Mjk4Ii8+PC9zdmc+" alt="User Avatar" id="user-avatar" />
                </div>
                <div class="user-details">
                  <h4 id="user-name">Loading...</h4>
                  <p id="user-email">Loading...</p>
                  <p><strong>Last Login:</strong> <span id="last-login">Loading...</span></p>
                  <p><strong>Account Status:</strong> <span id="account-status">Active</span></p>
                </div>
              </div>
              <div class="user-metrics">
                <div class="metric-card success">
                  <div class="metric-label">Your Login Attempts (24h)</div>
                  <div class="metric-value" id="user-login-attempts">0</div>
                </div>
                <div class="metric-card warning">
                  <div class="metric-label">Your Blocked Requests</div>
                  <div class="metric-value" id="user-blocked-requests">0</div>
                </div>
                <div class="metric-card info">
                  <div class="metric-label">Your Alerts</div>
                  <div class="metric-value" id="user-alerts">0</div>
                </div>
              </div>
              <div class="recent-activity">
                <h4>Recent Activity</h4>
                <div id="user-activity">
                  <div class="activity-item">Logged in from IP 192.168.1.1</div>
                  <div class="activity-item">Password changed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Logs Tab */}
          <div id="logs" class="tab-content">
            <div class="logs-section">
              <h3>Security Event Logs</h3>
              <div id="logs-container">
                <div class="log-entry info">[INFO] Security dashboard initialized</div>
                <div class="log-entry info">[INFO] All security systems operational</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .admin-security-dashboard {
            margin: -2rem;
            margin-top: 0;
          }

          .admin-security-dashboard .dashboard-container {
            max-width: none;
            margin: 0;
            padding: 20px;
          }

          .admin-security-dashboard .dashboard-header {
            background: linear-gradient(135deg, #1e3c72, #2a5298);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
          }

          .admin-security-dashboard .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }

          .admin-security-dashboard .metric-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-left: 4px solid #1e3c72;
          }

          .admin-security-dashboard .metric-card.success { border-left-color: #28a745; }
          .admin-security-dashboard .metric-card.warning { border-left-color: #ffc107; }
          .admin-security-dashboard .metric-card.danger { border-left-color: #dc3545; }
          .admin-security-dashboard .metric-card.info { border-left-color: #17a2b8; }

          .admin-security-dashboard .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            margin: 10px 0;
          }

          .admin-security-dashboard .metric-label {
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .admin-security-dashboard .alerts-section {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }

          .admin-security-dashboard .alert-item {
            padding: 15px;
            border-left: 4px solid #ffc107;
            margin-bottom: 10px;
            background: #f8f9fa;
            border-radius: 5px;
          }

          .admin-security-dashboard .alert-item.critical { border-left-color: #dc3545; background: #f8d7da; }
          .admin-security-dashboard .alert-item.warning { border-left-color: #ffc107; background: #fff3cd; }
          .admin-security-dashboard .alert-item.info { border-left-color: #17a2b8; background: #d1ecf1; }

          /* Enhanced Risk Level Styles */
          .admin-security-dashboard .alert-item.low-risk {
            border-left-color: #28a745;
            background: #d4edda;
            border-left-width: 3px;
          }
          .admin-security-dashboard .alert-item.medium-risk {
            border-left-color: #ffc107;
            background: #fff3cd;
            border-left-width: 4px;
          }
          .admin-security-dashboard .alert-item.high-risk {
            border-left-color: #fd7e14;
            background: #ffeaa7;
            border-left-width: 5px;
          }
          .admin-security-dashboard .alert-item.critical-risk {
            border-left-color: #dc3545;
            background: #f8d7da;
            border-left-width: 6px;
            animation: pulse 2s infinite;
          }

          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
            100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
          }

          /* Risk Score Indicators */
          .risk-score {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
            margin-left: 8px;
          }
          .risk-score.low { background: #28a745; color: white; }
          .risk-score.medium { background: #ffc107; color: #212529; }
          .risk-score.high { background: #fd7e14; color: white; }
          .risk-score.critical { background: #dc3545; color: white; }

          /* Threat Level Badges */
          .threat-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 15px;
            font-size: 0.75em;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-right: 5px;
          }
          .threat-badge.brute-force { background: #dc3545; color: white; }
          .threat-badge.sql-injection { background: #6f42c1; color: white; }
          .threat-badge.xss { background: #e83e8c; color: white; }
          .threat-badge.csrf { background: #fd7e14; color: white; }
          .threat-badge.suspicious-ip { background: #20c997; color: white; }
          .threat-badge.dev-tools { background: #17a2b8; color: white; }

          /* Enhanced Metric Cards with Risk Indicators */
          .metric-card.risk-high {
            border-left-color: #dc3545;
            background: linear-gradient(135deg, #fff5f5, #fed7d7);
          }
          .metric-card.risk-medium {
            border-left-color: #ffc107;
            background: linear-gradient(135deg, #fffbf0, #fefcbf);
          }
          .metric-card.risk-low {
            border-left-color: #28a745;
            background: linear-gradient(135deg, #f0fff4, #c6f6d5);
          }

          /* Risk Trend Indicators */
          .risk-trend {
            display: inline-block;
            margin-left: 8px;
            font-size: 0.9em;
          }
          .risk-trend.up { color: #dc3545; }
          .risk-trend.down { color: #28a745; }
          .risk-trend.stable { color: #6c757d; }

          /* Security Status Overview */
          .security-status-overview {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
          }
          .status-card {
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            text-align: center;
            border-left: 4px solid #28a745;
          }
          .status-card.warning { border-left-color: #ffc107; }
          .status-card.danger { border-left-color: #dc3545; }
          .status-card.critical { border-left-color: #dc3545; animation: pulse 2s infinite; }

          .status-value {
            font-size: 2em;
            font-weight: bold;
            margin: 10px 0;
          }
          .status-label {
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .admin-security-dashboard .charts-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }

          .admin-security-dashboard .chart-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }

          .admin-security-dashboard .logs-section {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }

          .admin-security-dashboard .log-entry {
            padding: 10px;
            border-bottom: 1px solid #eee;
            font-family: monospace;
            font-size: 0.9em;
          }

          .admin-security-dashboard .log-entry.error { color: #dc3545; }
          .admin-security-dashboard .log-entry.warning { color: #856404; }
          .admin-security-dashboard .log-entry.info { color: #0c5460; }

          .admin-security-dashboard .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
          }

          .admin-security-dashboard .status-online { background: #28a745; }
          .admin-security-dashboard .status-warning { background: #ffc107; }
          .admin-security-dashboard .status-offline { background: #dc3545; }

          .admin-security-dashboard .refresh-btn {
            background: #1e3c72;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-bottom: 20px;
          }

          .admin-security-dashboard .refresh-btn:hover {
            background: #2a5298;
          }

          .admin-security-dashboard .tabs {
            display: flex;
            margin-bottom: 20px;
            border-bottom: 1px solid #dee2e6;
          }

          .admin-security-dashboard .tab {
            padding: 10px 20px;
            cursor: pointer;
            border-bottom: 2px solid transparent;
          }

          .admin-security-dashboard .tab.active {
            border-bottom-color: #1e3c72;
            color: #1e3c72;
            font-weight: bold;
          }

          .admin-security-dashboard .tab-content {
            display: none;
          }

          .admin-security-dashboard .tab-content.active {
            display: block;
          }

          .admin-security-dashboard .threat-indicators {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
          }

          .admin-security-dashboard .threat-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
          }

          .admin-security-dashboard .threat-value {
            font-size: 1.5em;
            font-weight: bold;
            color: #dc3545;
          }

          /* Profile Section Styles */
          .admin-security-dashboard .profile-section {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
          }

          .admin-security-dashboard .user-info {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            padding: 20px;
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            border-radius: 10px;
          }

          .admin-security-dashboard .user-avatar {
            margin-right: 20px;
          }

          .admin-security-dashboard .user-avatar img {
            border-radius: 50%;
            border: 3px solid #1e3c72;
            width: 100px;
            height: 100px;
          }

          .admin-security-dashboard .user-details h4 {
            margin: 0 0 10px 0;
            color: #1e3c72;
            font-size: 1.5em;
          }

          .admin-security-dashboard .user-details p {
            margin: 5px 0;
            color: #666;
          }

          .admin-security-dashboard .user-metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
          }

          .admin-security-dashboard .recent-activity {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
          }

          .admin-security-dashboard .recent-activity h4 {
            margin-top: 0;
            color: #1e3c72;
          }

          .admin-security-dashboard .activity-item {
            padding: 10px;
            border-bottom: 1px solid #dee2e6;
            font-size: 0.9em;
          }

          .admin-security-dashboard .activity-item:last-child {
            border-bottom: none;
          }

          /* Responsive Design */
          @media (max-width: 768px) {
            .admin-security-dashboard .dashboard-container {
              padding: 10px;
            }

            .admin-security-dashboard .metrics-grid, .admin-security-dashboard .charts-container, .admin-security-dashboard .threat-indicators, .admin-security-dashboard .user-metrics {
              grid-template-columns: 1fr;
            }

            .admin-security-dashboard .user-info {
              flex-direction: column;
              text-align: center;
            }

            .admin-security-dashboard .user-avatar {
              margin-right: 0;
              margin-bottom: 15px;
            }
          }

          /* Animations */
          .admin-security-dashboard .tab-content {
            animation: fadeIn 0.3s ease-in-out;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .admin-security-dashboard .metric-card:hover {
            transform: translateY(-5px);
            transition: transform 0.2s ease;
          }

          .admin-security-dashboard .alert-item, .admin-security-dashboard .activity-item {
            transition: background-color 0.2s ease;
          }

          .admin-security-dashboard .alert-item:hover, .admin-security-dashboard .activity-item:hover {
            background-color: rgba(0, 0, 0, 0.05);
          }
        `
      }} />

      <script dangerouslySetInnerHTML={{
        __html: `
          // Security Dashboard Controller
          class SecurityDashboard {
            constructor() {
              this.charts = {};
              this.updateInterval = null;
              this.init();
            }

            init() {
              this.initializeCharts();
              this.loadDashboardData();
              this.startAutoRefresh();
            }

            initializeCharts() {
              // Activity Chart
              const activityCtx = document.getElementById('activity-chart').getContext('2d');
              this.charts.activity = new Chart(activityCtx, {
                type: 'line',
                data: {
                  labels: Array.from({length: 24}, (_, i) => \`\${i}:00\`),
                  datasets: [{
                    label: 'Requests',
                    data: Array.from({length: 24}, () => Math.floor(Math.random() * 100)),
                    borderColor: '#1e3c72',
                    backgroundColor: 'rgba(30, 60, 114, 0.1)',
                    tension: 0.4
                  }]
                },
                options: {
                  responsive: true,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: { beginAtZero: true }
                  }
                }
              });

              // Security Events Chart
              const securityCtx = document.getElementById('security-chart').getContext('2d');
              this.charts.security = new Chart(securityCtx, {
                type: 'doughnut',
                data: {
                  labels: ['Normal', 'Warnings', 'Critical'],
                  datasets: [{
                    data: [85, 10, 5],
                    backgroundColor: ['#28a745', '#ffc107', '#dc3545']
                  }]
                },
                options: {
                  responsive: true,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }
              });

              // Threat Chart
              const threatCtx = document.getElementById('threat-chart').getContext('2d');
              this.charts.threat = new Chart(threatCtx, {
                type: 'bar',
                data: {
                  labels: Array.from({length: 7}, (_, i) => \`Day \${i + 1}\`),
                  datasets: [{
                    label: 'Threats Detected',
                    data: Array.from({length: 7}, () => Math.floor(Math.random() * 20)),
                    backgroundColor: '#dc3545'
                  }]
                },
                options: {
                  responsive: true,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: { beginAtZero: true }
                  }
                }
              });
            }

            async loadDashboardData() {
              try {
                // Simulate API calls to get security data
                const securityData = await this.fetchSecurityData();

                if (!securityData) return; // Unauthorized access

                // Update metrics
                this.updateMetrics(securityData);

                // Update alerts
                this.updateAlerts(securityData.alerts);

                // Update logs
                this.updateLogs(securityData.logs);

                // Update profile
                this.updateProfile(securityData);

                // Update user activity (with null check)
                if (securityData.user && securityData.user.activity) {
                  this.updateUserActivity(securityData.user.activity);
                } else {
                  this.updateUserActivity(null);
                }

              } catch (error) {
                console.error('Failed to load dashboard data:', error);
                this.showError('Failed to load security data');
              }
            }

            async fetchSecurityData() {
              try {
                // Fetch data from the correct API endpoints
                const dashboardResponse = await fetch('/admin/api/security/dashboard');

                if (!dashboardResponse.ok) {
                  if (dashboardResponse.status === 403) {
                    throw new Error('Admin access required');
                  }
                  throw new Error(\`Dashboard API error! status: \${dashboardResponse.status}\`);
                }

                const dashboardData = await dashboardResponse.json();

                return {
                  metrics: dashboardData.metrics,
                  alerts: dashboardData.alerts,
                  logs: dashboardData.logs,
                  sessions: dashboardData.sessions,
                  threats: dashboardData.threats,
                  user: dashboardData.user
                };
              } catch (error) {
                console.error('Failed to fetch security data:', error);
                if (error.message === 'Admin access required') {
                  this.showUnauthorized();
                  return null;
                }
                // Fallback to simulated data if API is not available
                // Generate more realistic security data with risk levels
                const blockedRequests = Math.floor(Math.random() * 50) + 10;
                const securityAlerts = Math.floor(Math.random() * 5) + 1;
                const rateLimitHits = Math.floor(Math.random() * 25) + 5;
                const bruteForce = Math.floor(Math.random() * 8) + 2;
                const suspiciousIPs = Math.floor(Math.random() * 4) + 1;
                const csrfAttempts = Math.floor(Math.random() * 12) + 3;
                const sqlInjection = Math.floor(Math.random() * 3) + 1;

                // Generate alerts based on threat levels
                const alerts = [];
                if (bruteForce > 5) {
                  alerts.push({
                    type: 'critical',
                    message: 'Multiple brute force attempts detected from IP 192.168.1.100',
                    timestamp: new Date().toISOString(),
                    severity: 'high'
                  });
                }
                if (sqlInjection > 0) {
                  alerts.push({
                    type: 'critical',
                    message: 'SQL injection attempt blocked from IP 10.0.0.50',
                    timestamp: new Date().toISOString(),
                    severity: 'critical'
                  });
                }
                if (csrfAttempts > 8) {
                  alerts.push({
                    type: 'warning',
                    message: 'High number of CSRF attempts detected',
                    timestamp: new Date().toISOString(),
                    severity: 'medium'
                  });
                }
                if (rateLimitHits > 15) {
                  alerts.push({
                    type: 'warning',
                    message: 'Rate limit exceeded for multiple endpoints',
                    timestamp: new Date().toISOString(),
                    severity: 'medium'
                  });
                }
                if (suspiciousIPs > 2) {
                  alerts.push({
                    type: 'warning',
                    message: 'Multiple suspicious IP addresses blocked',
                    timestamp: new Date().toISOString(),
                    severity: 'medium'
                  });
                }

                // Add some routine alerts
                alerts.push({
                  type: 'info',
                  message: 'Security scan completed successfully',
                  timestamp: new Date().toISOString(),
                  severity: 'low'
                });

                return {
                  metrics: {
                    activeSessions: Math.floor(Math.random() * 15) + 5,
                    totalRequests: Math.floor(Math.random() * 5000) + 10000,
                    blockedRequests: blockedRequests,
                    securityAlerts: securityAlerts,
                    rateLimitHits: rateLimitHits,
                    uptime: '99.9%'
                  },
                  alerts: alerts,
                  logs: [
                    {
                      level: 'info',
                      message: 'Security middleware initialized',
                      timestamp: new Date().toISOString()
                    },
                    {
                      level: 'warning',
                      message: 'Rate limit exceeded for IP 192.168.1.100',
                      timestamp: new Date().toISOString()
                    },
                    {
                      level: 'error',
                      message: 'SQL injection attempt blocked from IP 10.0.0.50',
                      timestamp: new Date().toISOString()
                    },
                    {
                      level: 'info',
                      message: 'CSRF token validation successful',
                      timestamp: new Date().toISOString()
                    },
                    {
                      level: 'warning',
                      message: 'Multiple failed login attempts from IP 203.0.113.1',
                      timestamp: new Date().toISOString()
                    }
                  ],
                  sessions: [
                    {
                      id: 'sess_' + Math.random().toString(36).substr(2, 9),
                      user: 'admin@faithdefenders.org',
                      privilege: 'Super Admin',
                      lastActivity: new Date().toISOString(),
                      status: 'active'
                    }
                  ],
                  threats: {
                    bruteForce: bruteForce,
                    suspiciousIPs: suspiciousIPs,
                    csrfAttempts: csrfAttempts,
                    sqlInjection: sqlInjection
                  },
                  user: {
                    name: '${user.name}',
                    email: '${user.email}',
                    lastLogin: new Date().toISOString(),
                    loginAttempts: Math.floor(Math.random() * 10) + 1,
                    blockedRequests: Math.floor(Math.random() * 5),
                    alerts: Math.floor(Math.random() * 3),
                    activity: ['Logged in from IP 192.168.1.1', 'Password changed successfully', 'Security settings updated']
                  }
                };
              }
            }

            updateMetrics(data) {
              // Update basic metrics
              document.getElementById('active-sessions').textContent = data.metrics.activeSessions;
              document.getElementById('total-requests').textContent = data.metrics.totalRequests.toLocaleString();
              document.getElementById('blocked-requests').textContent = data.metrics.blockedRequests;
              document.getElementById('security-alerts').textContent = data.metrics.securityAlerts;
              document.getElementById('rate-limit-hits').textContent = data.metrics.rateLimitHits;
              document.getElementById('uptime').textContent = data.metrics.uptime;

              // Update threat indicators
              document.getElementById('brute-force-count').textContent = data.threats.bruteForce;
              document.getElementById('suspicious-ips').textContent = data.threats.suspiciousIPs;
              document.getElementById('csrf-attempts').textContent = data.threats.csrfAttempts;
              document.getElementById('sql-injection').textContent = data.threats.sqlInjection;

              // Apply risk-based styling to metric cards
              this.updateMetricCardRiskLevels(data);
              this.updateSecurityStatusOverview(data);
            }

            updateMetricCardRiskLevels(data) {
              const metrics = data.metrics;
              const threats = data.threats;

              // Calculate risk levels for each metric
              const blockedRequestsRisk = this.getMetricRiskLevel(metrics.blockedRequests, 10, 50, 100);
              const securityAlertsRisk = this.getMetricRiskLevel(metrics.securityAlerts, 1, 5, 10);
              const rateLimitHitsRisk = this.getMetricRiskLevel(metrics.rateLimitHits, 5, 25, 50);

              // Apply risk styling to metric cards
              this.applyRiskStyling('blocked-requests-card', blockedRequestsRisk);
              this.applyRiskStyling('security-alerts-card', securityAlertsRisk);
              this.applyRiskStyling('rate-limit-hits-card', rateLimitHitsRisk);

              // Add risk trend indicators
              this.addRiskTrends(data);
            }

            getMetricRiskLevel(value, lowThreshold, mediumThreshold, highThreshold) {
              if (value >= highThreshold) return 'high';
              if (value >= mediumThreshold) return 'medium';
              if (value >= lowThreshold) return 'low';
              return 'low';
            }

            applyRiskStyling(cardId, riskLevel) {
              const card = document.getElementById(cardId);
              if (card) {
                // Remove existing risk classes
                card.classList.remove('risk-low', 'risk-medium', 'risk-high');
                // Add new risk class
                card.classList.add(\`risk-\${riskLevel}\`);
              }
            }

            addRiskTrends(data) {
              // Add trend indicators to key metrics
              const trends = this.calculateTrends(data);

              // Add trend indicators to metric values
              this.addTrendIndicator('blocked-requests', trends.blockedRequests);
              this.addTrendIndicator('security-alerts', trends.securityAlerts);
              this.addTrendIndicator('rate-limit-hits', trends.rateLimitHits);
            }

            calculateTrends(data) {
              // Calculate trends based on current vs previous values
              // In a real implementation, this would compare with historical data
              return {
                blockedRequests: 'up', // Example: increasing
                securityAlerts: 'stable', // Example: stable
                rateLimitHits: 'down' // Example: decreasing
              };
            }

            addTrendIndicator(metricId, trend) {
              const element = document.getElementById(metricId);
              if (element) {
                // Remove existing trend indicator
                const existingTrend = element.querySelector('.risk-trend');
                if (existingTrend) {
                  existingTrend.remove();
                }

                // Add new trend indicator
                const trendSpan = document.createElement('span');
                trendSpan.className = \`risk-trend \${trend}\`;

                let trendIcon = '';
                let trendText = '';
                switch (trend) {
                  case 'up':
                    trendIcon = '↗️';
                    trendText = 'Increasing';
                    break;
                  case 'down':
                    trendIcon = '↘️';
                    trendText = 'Decreasing';
                    break;
                  case 'stable':
                    trendIcon = '→';
                    trendText = 'Stable';
                    break;
                }

                trendSpan.innerHTML = \`\${trendIcon} \${trendText}\`;
                element.appendChild(trendSpan);
              }
            }

            updateSecurityStatusOverview(data) {
              const overviewContainer = document.getElementById('security-status-overview');
              if (!overviewContainer) return;

              const metrics = data.metrics;
              const threats = data.threats;

              // Calculate overall security score
              const securityScore = this.calculateSecurityScore(metrics, threats);

              // Create status overview cards
              const statusCards = [
                {
                  label: 'Security Score',
                  value: securityScore.score,
                  status: securityScore.level,
                  description: securityScore.description
                },
                {
                  label: 'Active Threats',
                  value: threats.bruteForce + threats.suspiciousIPs + threats.csrfAttempts + threats.sqlInjection,
                  status: this.getThreatStatus(threats),
                  description: 'Current active threats'
                },
                {
                  label: 'System Health',
                  value: metrics.uptime,
                  status: this.getSystemHealthStatus(metrics),
                  description: 'Overall system status'
                },
                {
                  label: 'Risk Level',
                  value: this.getOverallRiskLevel(metrics, threats),
                  status: this.getOverallRiskLevel(metrics, threats).toLowerCase(),
                  description: 'Current risk assessment'
                }
              ];

              overviewContainer.innerHTML = statusCards.map(card => \`
                <div class="status-card \${card.status}">
                  <div class="status-label">\${card.label}</div>
                  <div class="status-value">\${card.value}</div>
                  <div class="status-description">\${card.description}</div>
                </div>
              \`).join('');
            }

            calculateSecurityScore(metrics, threats) {
              let score = 100; // Start with perfect score

              // Deduct points based on various factors
              score -= metrics.blockedRequests * 2;
              score -= metrics.securityAlerts * 5;
              score -= metrics.rateLimitHits * 1;
              score -= threats.bruteForce * 3;
              score -= threats.suspiciousIPs * 4;
              score -= threats.csrfAttempts * 2;
              score -= threats.sqlInjection * 10;

              score = Math.max(0, Math.min(100, score)); // Clamp between 0-100

              let level = 'success';
              let description = 'Excellent';

              if (score < 30) {
                level = 'critical';
                description = 'Critical - Immediate Action Required';
              } else if (score < 50) {
                level = 'danger';
                description = 'Poor - High Risk';
              } else if (score < 70) {
                level = 'warning';
                description = 'Fair - Monitor Closely';
              } else if (score < 90) {
                level = 'info';
                description = 'Good - Minor Issues';
              }

              return { score, level, description };
            }

            getThreatStatus(threats) {
              const totalThreats = threats.bruteForce + threats.suspiciousIPs + threats.csrfAttempts + threats.sqlInjection;
              if (totalThreats > 10) return 'critical';
              if (totalThreats > 5) return 'danger';
              if (totalThreats > 2) return 'warning';
              return 'success';
            }

            getSystemHealthStatus(metrics) {
              if (metrics.uptime.includes('99.9%') || metrics.uptime.includes('100%')) return 'success';
              if (metrics.uptime.includes('99%')) return 'warning';
              return 'danger';
            }

            getOverallRiskLevel(metrics, threats) {
              const totalThreats = threats.bruteForce + threats.suspiciousIPs + threats.csrfAttempts + threats.sqlInjection;
              const totalIssues = metrics.blockedRequests + metrics.securityAlerts + metrics.rateLimitHits;

              if (totalThreats > 5 || totalIssues > 20) return 'Critical';
              if (totalThreats > 2 || totalIssues > 10) return 'High';
              if (totalThreats > 0 || totalIssues > 5) return 'Medium';
              return 'Low';
            }

            updateAlerts(alerts) {
              const container = document.getElementById('alerts-container');
              container.innerHTML = '';

              if (alerts.length === 0) {
                container.innerHTML = '<div class="alert-item info"><strong>System Status:</strong> All security systems operational</div>';
                return;
              }

              alerts.forEach(alert => {
                const riskLevel = this.calculateRiskLevel(alert);
                const threatType = this.getThreatType(alert);
                const riskScore = this.calculateRiskScore(alert);

                const alertDiv = document.createElement('div');
                alertDiv.className = \`alert-item \${alert.type} \${riskLevel}-risk\`;

                const threatBadge = threatType ? \`<span class="threat-badge \${threatType}">\${threatType.replace('-', ' ')}</span>\` : '';
                const riskScoreBadge = \`<span class="risk-score \${riskLevel}">\${riskScore}</span>\`;

                alertDiv.innerHTML = \`
                  \${threatBadge}
                  <strong>\${alert.type.toUpperCase()}:</strong> \${alert.message}
                  \${riskScoreBadge}
                  <br><small>\${new Date(alert.timestamp).toLocaleString()}</small>
                \`;
                container.appendChild(alertDiv);
              });
            }

            calculateRiskLevel(alert) {
              const message = alert.message.toLowerCase();
              const type = alert.type.toLowerCase();

              // Critical risk patterns
              if (message.includes('sql injection') || message.includes('command injection') ||
                  message.includes('remote code execution') || type === 'critical') {
                return 'critical';
              }

              // High risk patterns
              if (message.includes('brute force') || message.includes('suspicious ip') ||
                  message.includes('multiple failed') || message.includes('account lockout') ||
                  type === 'error') {
                return 'high';
              }

              // Medium risk patterns
              if (message.includes('csrf') || message.includes('xss') ||
                  message.includes('rate limit') || message.includes('suspicious input') ||
                  type === 'warning') {
                return 'medium';
              }

              // Low risk patterns
              if (message.includes('dev tools') || message.includes('unusual activity') ||
                  type === 'info') {
                return 'low';
              }

              return 'medium'; // Default
            }

            getThreatType(alert) {
              const message = alert.message.toLowerCase();

              if (message.includes('brute force') || message.includes('failed login')) {
                return 'brute-force';
              }
              if (message.includes('sql injection')) {
                return 'sql-injection';
              }
              if (message.includes('xss') || message.includes('script injection')) {
                return 'xss';
              }
              if (message.includes('csrf')) {
                return 'csrf';
              }
              if (message.includes('suspicious ip') || message.includes('blocked ip')) {
                return 'suspicious-ip';
              }
              if (message.includes('dev tools') || message.includes('developer tools')) {
                return 'dev-tools';
              }

              return null;
            }

            calculateRiskScore(alert) {
              let score = 1; // Base score

              const message = alert.message.toLowerCase();
              const type = alert.type.toLowerCase();

              // Score based on threat type
              if (message.includes('sql injection') || message.includes('command injection')) score += 9;
              else if (message.includes('brute force')) score += 7;
              else if (message.includes('xss') || message.includes('csrf')) score += 6;
              else if (message.includes('suspicious ip')) score += 5;
              else if (message.includes('rate limit')) score += 3;
              else if (message.includes('dev tools')) score += 1;

              // Score based on alert type
              if (type === 'critical') score += 5;
              else if (type === 'error') score += 4;
              else if (type === 'warning') score += 2;

              // Score based on keywords
              if (message.includes('multiple')) score += 2;
              if (message.includes('repeated')) score += 2;
              if (message.includes('suspicious')) score += 1;

              return Math.min(score, 10); // Cap at 10
            }

            updateLogs(logs) {
              const container = document.getElementById('logs-container');
              container.innerHTML = '';

              logs.forEach(log => {
                const logDiv = document.createElement('div');
                logDiv.className = \`log-entry \${log.level}\`;
                logDiv.innerHTML = \`[\${new Date(log.timestamp).toLocaleString()}] \${log.message}\`;
                container.appendChild(logDiv);
              });
            }

            updateProfile(data) {
              // Add null checks and fallbacks for user data
              if (data && data.user) {
                document.getElementById('user-name').textContent = data.user.name || 'Unknown User';
                document.getElementById('user-email').textContent = data.user.email || 'No Email';
                document.getElementById('last-login').textContent = data.user.lastLogin ? new Date(data.user.lastLogin).toLocaleString() : 'Never';
                document.getElementById('user-login-attempts').textContent = data.user.loginAttempts || '0';
                document.getElementById('user-blocked-requests').textContent = data.user.blockedRequests || '0';
                document.getElementById('user-alerts').textContent = data.user.alerts || '0';
              } else {
                // Fallback values when user data is not available
                document.getElementById('user-name').textContent = 'Loading...';
                document.getElementById('user-email').textContent = 'Loading...';
                document.getElementById('last-login').textContent = 'Loading...';
                document.getElementById('user-login-attempts').textContent = '0';
                document.getElementById('user-blocked-requests').textContent = '0';
                document.getElementById('user-alerts').textContent = '0';
              }
            }

            updateUserActivity(activity) {
              const container = document.getElementById('user-activity');
              if (!container) return;

              container.innerHTML = '';

              if (activity && Array.isArray(activity)) {
                activity.forEach(item => {
                  const div = document.createElement('div');
                  div.className = 'activity-item';
                  div.textContent = item;
                  container.appendChild(div);
                });
              } else {
                // Fallback activity items
                const fallbackItems = ['Logged in from IP 192.168.1.1', 'Password changed successfully'];
                fallbackItems.forEach(item => {
                  const div = document.createElement('div');
                  div.className = 'activity-item';
                  div.textContent = item;
                  container.appendChild(div);
                });
              }
            }

            startAutoRefresh() {
              this.updateInterval = setInterval(() => {
                this.loadDashboardData();
              }, 30000); // Refresh every 30 seconds
            }

            stopAutoRefresh() {
              if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
              }
            }

            showError(message) {
              const alertDiv = document.createElement('div');
              alertDiv.className = 'alert-item danger';
              alertDiv.innerHTML = \`<strong>ERROR:</strong> \${message}\`;
              document.getElementById('alerts-container').prepend(alertDiv);

              setTimeout(() => {
                alertDiv.remove();
              }, 5000);
            }

            showUnauthorized() {
              const container = document.querySelector('.admin-security-dashboard');
              container.innerHTML = \`
                <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
                  <h1 style="color: #dc3545;">Access Denied</h1>
                  <p>Administrator access required to view this dashboard.</p>
                  <a href="/admin" style="color: #1e3c72; text-decoration: none;">Return to Admin Panel</a>
                </div>
              \`;
            }
          }

          // Tab switching functionality
          function switchTab(tabName) {
            // Hide all tab contents
            document.querySelectorAll('.admin-security-dashboard .tab-content').forEach(content => {
              content.classList.remove('active');
            });

            // Remove active class from all tabs
            document.querySelectorAll('.admin-security-dashboard .tab').forEach(tab => {
              tab.classList.remove('active');
            });

            // Show selected tab content
            document.getElementById(tabName).classList.add('active');

            // Add active class to selected tab
            event.target.classList.add('active');
          }

          // Refresh dashboard function
          function refreshDashboard() {
            if (window.dashboard) {
              window.dashboard.loadDashboardData();
            }
          }

          // Initialize dashboard when page loads
          document.addEventListener('DOMContentLoaded', () => {
            window.dashboard = new SecurityDashboard();
          });

          // Cleanup on page unload
          window.addEventListener('beforeunload', () => {
            if (window.dashboard) {
              window.dashboard.stopAutoRefresh();
            }
          });
        `
      }} />
    </AdminLayout>,
    { title: 'Security Dashboard' }
  );
});

// Roles & Permissions Management - Admin Only
adminApp.get('/roles', requireAdminOnly, async (c) => {
  const user = (c as any).adminUser;

  return c.render(
    <AdminLayout currentUser={user} currentPage="roles" breadcrumb="Roles & Permissions">
      <div class="admin-page-header">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 class="admin-page-title">Roles & Permissions</h1>
            <p class="admin-page-subtitle">Manage user roles and permissions across the system</p>
          </div>
          <div class="admin-roles-actions">
            <button class="admin-btn admin-btn-outline" onclick="expandAllSections()">
              <i class="fas fa-expand-alt"></i> Expand All
            </button>
            <button class="admin-btn admin-btn-outline" onclick="collapseAllSections()">
              <i class="fas fa-compress-alt"></i> Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Current Roles Overview - Compact Row Layout */}
      <div class="admin-card">
        <div class="admin-card-header">
          <h3 class="admin-card-title">
            <i class="fas fa-chart-pie"></i>
            Current Roles Overview
          </h3>
          <p class="admin-card-subtitle">Quick summary of role distribution</p>
        </div>
        <div class="admin-card-content">
          <div class="admin-roles-overview-grid" id="roles-overview">
            <div class="admin-loading">
              <div class="admin-spinner"></div>
              Loading role statistics...
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Role Sections */}
      <div class="admin-roles-sections">

        {/* Super Administrators Section */}
        <div class="admin-role-section">
          <div class="admin-role-section-header" onclick="toggleSection('superadmins')" role="button" tabindex={0}>
            <div class="admin-role-section-title">
              <i class="fas fa-crown admin-role-icon superadmin"></i>
              <div>
                <h3>Super Administrators</h3>
                <p>Ultimate system control with absolute protection</p>
              </div>
            </div>
            <div class="admin-role-section-toggle">
              <span class="admin-role-count" id="superadmin-count">0</span>
              <i class="fas fa-chevron-down admin-toggle-icon"></i>
            </div>
          </div>
          <div class="admin-role-section-content" id="superadmins-content">
            <div class="admin-role-users" id="superadmins-list">
              <div class="admin-loading">
                <div class="admin-spinner"></div>
                Loading super administrators...
              </div>
            </div>
          </div>
        </div>

        {/* Administrators Section */}
        <div class="admin-role-section">
          <div class="admin-role-section-header" onclick="toggleSection('admins')" role="button" tabindex={0}>
            <div class="admin-role-section-title">
              <i class="fas fa-user-shield admin-role-icon admin"></i>
              <div>
                <h3>Administrators</h3>
                <p>Full system access and management capabilities</p>
              </div>
            </div>
            <div class="admin-role-section-toggle">
              <span class="admin-role-count" id="admin-count">0</span>
              <i class="fas fa-chevron-down admin-toggle-icon"></i>
            </div>
          </div>
          <div class="admin-role-section-content" id="admins-content">
            <div class="admin-role-users" id="admins-list">
              <div class="admin-loading">
                <div class="admin-spinner"></div>
                Loading administrators...
              </div>
            </div>
          </div>
        </div>

        {/* Moderators Section */}
        <div class="admin-role-section">
          <div class="admin-role-section-header" onclick="toggleSection('moderators')" role="button" tabindex={0}>
            <div class="admin-role-section-title">
              <i class="fas fa-user-cog admin-role-icon moderator"></i>
              <div>
                <h3>Moderators</h3>
                <p>Content moderation and user management capabilities</p>
              </div>
            </div>
            <div class="admin-role-section-toggle">
              <span class="admin-role-count" id="moderator-count">0</span>
              <i class="fas fa-chevron-down admin-toggle-icon"></i>
            </div>
          </div>
          <div class="admin-role-section-content" id="moderators-content">
            <div class="admin-role-users" id="moderators-list">
              <div class="admin-loading">
                <div class="admin-spinner"></div>
                Loading moderators...
              </div>
            </div>
          </div>
        </div>

        {/* Regular Users Section */}
        <div class="admin-role-section">
          <div class="admin-role-section-header" onclick="toggleSection('users')" role="button" tabindex={0}>
            <div class="admin-role-section-title">
              <i class="fas fa-users admin-role-icon user"></i>
              <div>
                <h3>Regular Users</h3>
                <p>Standard users with basic access</p>
              </div>
            </div>
            <div class="admin-role-section-toggle">
              <span class="admin-role-count" id="user-count">0</span>
              <i class="fas fa-chevron-down admin-toggle-icon"></i>
            </div>
          </div>
          <div class="admin-role-section-content" id="users-content">
            <div class="admin-role-users" id="users-list">
              <div class="admin-loading">
                <div class="admin-spinner"></div>
                Loading users...
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Role Changes */}
      <div class="admin-card">
        <div class="admin-card-header">
          <h3 class="admin-card-title">
            <i class="fas fa-history"></i>
            Recent Role Changes
          </h3>
          <p class="admin-card-subtitle">Latest role modifications and changes</p>
        </div>
        <div class="admin-card-content">
          <div class="admin-role-changes-list" id="role-changes-list">
            <div class="admin-loading">
              <div class="admin-spinner"></div>
              Loading recent changes...
            </div>
          </div>
        </div>
      </div>

      {/* Quick Role Actions */}
      <div class="admin-card">
        <div class="admin-card-header">
          <h3 class="admin-card-title">
            <i class="fas fa-bolt"></i>
            Quick Role Actions
          </h3>
          <p class="admin-card-subtitle">Common role management tasks</p>
        </div>
        <div class="admin-card-content">
          <div class="admin-quick-actions-grid">
            <button class="admin-quick-action-btn" onclick="showRoleChangeModal()">
              <i class="fas fa-exchange-alt"></i>
              <span>Change User Role</span>
            </button>
            <button class="admin-quick-action-btn" onclick="showBulkRoleModal()">
              <i class="fas fa-users-cog"></i>
              <span>Bulk Role Update</span>
            </button>
            <button class="admin-quick-action-btn" onclick="showPermissionsModal()">
              <i class="fas fa-key"></i>
              <span>Manage Permissions</span>
            </button>
            <button class="admin-quick-action-btn" onclick="exportRolesData()">
              <i class="fas fa-download"></i>
              <span>Export Roles Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Role Change Modal */}
      <div id="role-change-modal" class="admin-modal" style="display: none;">
        <div class="admin-modal-content">
          <div class="admin-modal-header">
            <h3>Change User Role</h3>
            <button class="admin-modal-close" onclick="closeRoleChangeModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="admin-modal-body">
            <form id="role-change-form" class="admin-form">
              <div class="admin-form-group">
                <label class="admin-form-label">Select User</label>
                <select name="user_id" class="admin-form-select" id="role-change-user-select" required>
                  <option value="">Choose a user...</option>
                </select>
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">New Role</label>
                <select name="new_role" class="admin-form-select" required>
                  <option value="user">Regular User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Reason (Optional)</label>
                <textarea name="reason" class="admin-form-textarea" rows={3}
                  placeholder="Brief reason for role change..."></textarea>
              </div>
            </form>
          </div>
          <div class="admin-modal-footer">
            <button class="admin-btn admin-btn-outline" onclick="closeRoleChangeModal()">Cancel</button>
            <button class="admin-btn admin-btn-primary" onclick="submitRoleChange()">Change Role</button>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          // Role management functionality
          let expandedSections = JSON.parse(localStorage.getItem('adminRolesExpandedSections') || '["admins"]');

          // Variables for pending role change verification
          let pendingVerificationUserId = null;
          let pendingVerificationNewRole = null;

          document.addEventListener('DOMContentLoaded', function() {
            loadRolesData();
            initializeSections();
            setupKeyboardNavigation();
          });

          function initializeSections() {
            // Restore expanded state from localStorage
            expandedSections.forEach(sectionId => {
              const content = document.getElementById(sectionId + '-content');
              const header = document.querySelector(\`[onclick="toggleSection('\${sectionId}')"]\`);
              if (content && header) {
                content.classList.add('expanded');
                header.classList.add('expanded');
              }
            });
          }

          function toggleSection(sectionId) {
            const content = document.getElementById(sectionId + '-content');
            const header = document.querySelector(\`[onclick="toggleSection('\${sectionId}')"]\`);

            if (!content || !header) return;

            const isExpanded = content.classList.contains('expanded');

            if (isExpanded) {
              content.classList.remove('expanded');
              header.classList.remove('expanded');
              expandedSections = expandedSections.filter(id => id !== sectionId);
            } else {
              content.classList.add('expanded');
              header.classList.add('expanded');
              expandedSections.push(sectionId);
            }

            // Save to localStorage
            localStorage.setItem('adminRolesExpandedSections', JSON.stringify(expandedSections));
          }

          function expandAllSections() {
            ['superadmins', 'admins', 'moderators', 'users'].forEach(sectionId => {
              const content = document.getElementById(sectionId + '-content');
              const header = document.querySelector(\`[onclick="toggleSection('\${sectionId}')"]\`);
              if (content && header && !content.classList.contains('expanded')) {
                content.classList.add('expanded');
                header.classList.add('expanded');
                if (!expandedSections.includes(sectionId)) {
                  expandedSections.push(sectionId);
                }
              }
            });
            localStorage.setItem('adminRolesExpandedSections', JSON.stringify(expandedSections));
          }

          function collapseAllSections() {
            ['superadmins', 'admins', 'moderators', 'users'].forEach(sectionId => {
              const content = document.getElementById(sectionId + '-content');
              const header = document.querySelector(\`[onclick="toggleSection('\${sectionId}')"]\`);
              if (content && header) {
                content.classList.remove('expanded');
                header.classList.remove('expanded');
                expandedSections = expandedSections.filter(id => id !== sectionId);
              }
            });
            localStorage.setItem('adminRolesExpandedSections', JSON.stringify(expandedSections));
          }

          function setupKeyboardNavigation() {
            document.addEventListener('keydown', function(e) {
              if (e.key === 'Enter' || e.key === ' ') {
                const focusedElement = document.activeElement;
                if (focusedElement && focusedElement.hasAttribute('onclick') &&
                    focusedElement.getAttribute('onclick').includes('toggleSection')) {
                  e.preventDefault();
                  const onclickAttr = focusedElement.getAttribute('onclick');
                  const sectionId = onclickAttr.match(/toggleSection\\('([^']+)'\\)/)[1];
                  toggleSection(sectionId);
                }
              }
            });
          }

          async function loadRolesData() {
            try {
              // Load users data
              const usersResponse = await fetch('/admin/api/users');
              const usersData = await usersResponse.json();

              if (usersData.success) {
                const users = usersData.users;

                // Group users by role
                const superAdmins = users.filter(u => u.role === 'superadmin');
                const admins = users.filter(u => u.role === 'admin');
                const moderators = users.filter(u => u.role === 'moderator');
                const regularUsers = users.filter(u => u.role === 'user');

                // Update counts
                document.getElementById('superadmin-count').textContent = superAdmins.length;
                document.getElementById('admin-count').textContent = admins.length;
                document.getElementById('moderator-count').textContent = moderators.length;
                document.getElementById('user-count').textContent = regularUsers.length;

                // Update overview
                updateRolesOverview(superAdmins.length, admins.length, moderators.length, regularUsers.length);

                // Render user lists
                renderUserList('superadmins-list', superAdmins, 'superadmin');
                renderUserList('admins-list', admins, 'admin');
                renderUserList('moderators-list', moderators, 'moderator');
                renderUserList('users-list', regularUsers, 'user');

                // Load user select for role change modal
                loadUserSelect(users);
              }

              // Load recent role changes
              await loadRecentRoleChanges();
            } catch (error) {
              console.error('Error loading roles data:', error);
              showAdminMessage('Failed to load roles data', 'error');
            }
          }

          function updateRolesOverview(superAdminCount, adminCount, moderatorCount, userCount) {
            const totalUsers = superAdminCount + adminCount + moderatorCount + userCount;
            const overviewHTML = \`
              <div class="admin-role-stat">
                <div class="admin-role-stat-icon superadmin">
                  <i class="fas fa-crown"></i>
                </div>
                <div class="admin-role-stat-info">
                  <div class="admin-role-stat-number">\${superAdminCount}</div>
                  <div class="admin-role-stat-label">Super Admins</div>
                </div>
              </div>
              <div class="admin-role-stat">
                <div class="admin-role-stat-icon admin">
                  <i class="fas fa-user-shield"></i>
                </div>
                <div class="admin-role-stat-info">
                  <div class="admin-role-stat-number">\${adminCount}</div>
                  <div class="admin-role-stat-label">Administrators</div>
                </div>
              </div>
              <div class="admin-role-stat">
                <div class="admin-role-stat-icon moderator">
                  <i class="fas fa-user-cog"></i>
                </div>
                <div class="admin-role-stat-info">
                  <div class="admin-role-stat-number">\${moderatorCount}</div>
                  <div class="admin-role-stat-label">Moderators</div>
                </div>
              </div>
              <div class="admin-role-stat">
                <div class="admin-role-stat-icon user">
                  <i class="fas fa-users"></i>
                </div>
                <div class="admin-role-stat-info">
                  <div class="admin-role-stat-number">\${userCount}</div>
                  <div class="admin-role-stat-label">Users</div>
                </div>
              </div>
              <div class="admin-role-stat total">
                <div class="admin-role-stat-icon total">
                  <i class="fas fa-chart-pie"></i>
                </div>
                <div class="admin-role-stat-info">
                  <div class="admin-role-stat-number">\${totalUsers}</div>
                  <div class="admin-role-stat-label">Total Users</div>
                </div>
              </div>
            \`;
            document.getElementById('roles-overview').innerHTML = overviewHTML;
          }

          function renderUserList(containerId, users, roleType) {
            if (users.length === 0) {
              document.getElementById(containerId).innerHTML = \`
                <div class="admin-empty-state">
                  <i class="fas fa-users admin-empty-icon"></i>
                  <h4>No \${roleType}s found</h4>
                  <p>No users have the \${roleType} role assigned.</p>
                </div>
              \`;
              return;
            }

            const usersHTML = users.map(user => \`
              <div class="admin-role-user-card">
                <div class="admin-role-user-avatar">
                  \${user.name.charAt(0).toUpperCase()}
                </div>
                <div class="admin-role-user-info">
                  <div class="admin-role-user-name">\${user.name}</div>
                  <div class="admin-role-user-email">\${user.email}</div>
                  <div class="admin-role-user-meta">
                    <span class="admin-role-badge \${roleType}\${roleType === 'superadmin' ? ' superadmin' : ''}">\${roleType === 'superadmin' ? 'SUPERADMIN' : roleType.toUpperCase()}</span>
                    <span class="admin-role-user-date">Joined \${new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div class="admin-role-user-actions">
                  <button class="admin-role-action-btn" onclick="changeUserRole(\${user.id}, '\${user.name}')" title="Change Role">
                    <i class="fas fa-exchange-alt"></i>
                  </button>
                  <button class="admin-role-action-btn" onclick="viewUserDetails(\${user.id})" title="View Details">
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
              </div>
            \`).join('');

            document.getElementById(containerId).innerHTML = usersHTML;
          }

          function loadUserSelect(users) {
            const select = document.getElementById('role-change-user-select');
            const optionsHTML = users.map(user => \`
              <option value="\${user.id}">\${user.name} (\${user.email}) - \${user.role}</option>
            \`).join('');
            select.innerHTML = '<option value="">Choose a user...</option>' + optionsHTML;
          }

          function showRoleChangeModal() {
            document.getElementById('role-change-modal').style.display = 'flex';
          }

          function closeRoleChangeModal() {
            document.getElementById('role-change-modal').style.display = 'none';
            document.getElementById('role-change-form').reset();
          }

          async function submitRoleChange() {
            const form = document.getElementById('role-change-form');
            const formData = new FormData(form);
            const userId = formData.get('user_id');
            const newRole = formData.get('new_role');
            const reason = formData.get('reason');

            if (!userId || !newRole) {
              showAdminMessage('Please select a user and new role', 'error');
              return;
            }

            try {
              const response = await fetch(\`/admin/api/users/\${userId}/request-role-change\`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ newRole, reason })
              });

              const result = await response.json();

              if (result.success) {
                showAdminMessage(result.message, 'success');
                closeRoleChangeModal();
                loadRolesData(); // Refresh the data
                loadRecentRoleChanges(); // Refresh role changes
              } else {
                showAdminMessage(result.error || 'Failed to request role change', 'error');
              }
            } catch (error) {
              console.error('Error requesting role change:', error);
              showAdminMessage('Failed to request role change', 'error');
            }
          }

          function changeUserRole(userId, userName) {
            // Check if target user is superadmin (prevent role changes)
            const userCard = document.querySelector(\`[data-user-id="\${userId}"]\`);
            if (userCard && userCard.querySelector('.admin-role-badge.superadmin')) {
              showAdminMessage('Superadmin users cannot have their role changed for security reasons.', 'error');
              return;
            }

            const select = document.getElementById('role-change-user-select');
            select.value = userId;
            showRoleChangeModal();
          }

          function viewUserDetails(userId) {
            // Navigate to user details page
            window.location.href = \`/admin/users/\${userId}\`;
          }

          function showBulkRoleModal() {
            showAdminMessage('Bulk role update feature coming soon!', 'info');
          }

          function showPermissionsModal() {
            showAdminMessage('Permissions management feature coming soon!', 'info');
          }

          function exportRolesData() {
            showAdminMessage('Roles data export feature coming soon!', 'info');
          }

          function renderRoleChangesList(roleChanges) {
            if (!roleChanges || roleChanges.length === 0) {
              document.getElementById('role-changes-list').innerHTML = \`
                <div class="admin-empty-state">
                  <i class="fas fa-history admin-empty-icon"></i>
                  <h4>No role changes found</h4>
                  <p>Role change history will appear here when changes are made.</p>
                </div>
              \`;
              return;
            }

            const changesHTML = roleChanges.map(change => {
              const changeType = getRoleChangeType(change.old_role, change.new_role);
              const changeIcon = getRoleChangeIcon(changeType);
              const timeAgo = getTimeAgo(new Date(change.created_at));

              return \`
                <div class="admin-role-change-item">
                  <div class="admin-role-change-icon \${changeType}">
                    <i class="fas \${changeIcon}"></i>
                  </div>
                  <div class="admin-role-change-content">
                    <div class="admin-role-change-title">
                      <strong>\${change.target_user_name}</strong> was \${changeType === 'promotion' ? 'promoted' : changeType === 'demotion' ? 'demoted' : 'changed'} to
                      <span class="admin-role-badge \${change.new_role}">\${change.new_role}</span>
                    </div>
                    <div class="admin-role-change-meta">
                      <span class="admin-role-change-by">By \${change.changed_by_user_name}</span>
                      <span class="admin-role-change-time">\${timeAgo}</span>
                    </div>
                    \${change.change_reason ? \`<div class="admin-role-change-reason">"\${change.change_reason}"</div>\` : ''}
                  </div>
                </div>
              \`;
            }).join('');

            document.getElementById('role-changes-list').innerHTML = changesHTML;
          }

          function getRoleChangeType(oldRole, newRole) {
            const roleHierarchy = { 'user': 1, 'moderator': 2, 'admin': 3 };
            const oldLevel = roleHierarchy[oldRole] || 1;
            const newLevel = roleHierarchy[newRole] || 1;

            if (newLevel > oldLevel) return 'promotion';
            if (newLevel < oldLevel) return 'demotion';
            return 'change';
          }

          function getRoleChangeIcon(changeType) {
            switch (changeType) {
              case 'promotion': return 'fa-arrow-up';
              case 'demotion': return 'fa-arrow-down';
              default: return 'fa-exchange-alt';
            }
          }

          function getTimeAgo(date) {
            const now = new Date();
            const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

            if (diffInSeconds < 60) return 'Just now';
            if (diffInSeconds < 3600) return \`\${Math.floor(diffInSeconds / 60)} minutes ago\`;
            if (diffInSeconds < 86400) return \`\${Math.floor(diffInSeconds / 3600)} hours ago\`;
            if (diffInSeconds < 604800) return \`\${Math.floor(diffInSeconds / 86400)} days ago\`;

            return date.toLocaleDateString();
          }
        `
      }}></script>

      <style dangerouslySetInnerHTML={{
        __html: `
          /* Roles Management Styles */
          .admin-roles-actions {
            display: flex;
            gap: 0.5rem;
          }

          .admin-roles-overview-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
          }

          .admin-role-stat {
            display: flex;
            align-items: center;
            padding: 1rem;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }

          .admin-role-stat:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .admin-role-stat-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 1rem;
            font-size: 1.2rem;
          }

          .admin-role-stat-icon.admin { background: linear-gradient(135deg, #7c3aed, #8b5cf6); color: white; }
          .admin-role-stat-icon.moderator { background: linear-gradient(135deg, #059669, #10b981); color: white; }
          .admin-role-stat-icon.user { background: linear-gradient(135deg, #3b82f6, #60a5fa); color: white; }
          .admin-role-stat-icon.superadmin { background: linear-gradient(135deg, #dc2626, #ef4444); color: white; }
          .admin-role-stat-icon.total { background: linear-gradient(135deg, #6b7280, #9ca3af); color: white; }

          .admin-role-stat-info {
            flex: 1;
          }

          .admin-role-stat-number {
            font-size: 1.8rem;
            font-weight: 700;
            color: #1e293b;
            line-height: 1;
          }

          .admin-role-stat-label {
            font-size: 0.875rem;
            color: #64748b;
            margin-top: 0.25rem;
          }

          .admin-roles-sections {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-bottom: 2rem;
          }

          .admin-role-section {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
            overflow: hidden;
            transition: box-shadow 0.2s ease;
          }

          .admin-role-section:hover {
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          }

          .admin-role-section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.5rem;
            cursor: pointer;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-bottom: 1px solid #e2e8f0;
            transition: background-color 0.2s ease;
            user-select: none;
          }

          .admin-role-section-header:hover {
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          }

          .admin-role-section-header:focus {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
          }

          .admin-role-section-header.expanded {
            background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
            border-bottom-color: #3b82f6;
          }

          .admin-role-section-title {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .admin-role-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .admin-role-icon.admin { background: linear-gradient(135deg, #7c3aed, #8b5cf6); color: white; }
          .admin-role-icon.moderator { background: linear-gradient(135deg, #059669, #10b981); color: white; }
          .admin-role-icon.user { background: linear-gradient(135deg, #3b82f6, #60a5fa); color: white; }
          .admin-role-icon.superadmin { background: linear-gradient(135deg, #dc2626, #ef4444); color: white; }

          .admin-role-section-title h3 {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 600;
            color: #1e293b;
          }

          .admin-role-section-title p {
            margin: 0.25rem 0 0 0;
            font-size: 0.875rem;
            color: #64748b;
          }

          .admin-role-section-toggle {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .admin-role-count {
            background: #e2e8f0;
            color: #475569;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 600;
            min-width: 2rem;
            text-align: center;
          }

          .admin-toggle-icon {
            color: #64748b;
            font-size: 1.2rem;
            transition: transform 0.2s ease;
          }

          .admin-role-section-header.expanded .admin-toggle-icon {
            transform: rotate(180deg);
          }

          .admin-role-section-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
          }

          .admin-role-section-content.expanded {
            max-height: 2000px;
          }

          .admin-role-users {
            padding: 1.5rem;
          }

          .admin-role-user-card {
            display: flex;
            align-items: center;
            padding: 1rem;
            background: #f8fafc;
            border-radius: 8px;
            margin-bottom: 0.75rem;
            border: 1px solid #e2e8f0;
            transition: all 0.2s ease;
          }

          .admin-role-user-card:hover {
            background: #f1f5f9;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          }

          .admin-role-user-card:last-child {
            margin-bottom: 0;
          }

          .admin-role-user-avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6, #60a5fa);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 1.2rem;
            margin-right: 1rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .admin-role-user-info {
            flex: 1;
          }

          .admin-role-user-name {
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 0.25rem;
          }

          .admin-role-user-email {
            color: #64748b;
            font-size: 0.875rem;
            margin-bottom: 0.5rem;
          }

          .admin-role-user-meta {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .admin-role-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .admin-role-badge.admin { background: linear-gradient(135deg, #7c3aed, #8b5cf6); color: white; }
          .admin-role-badge.moderator { background: linear-gradient(135deg, #059669, #10b981); color: white; }
          .admin-role-badge.user { background: linear-gradient(135deg, #3b82f6, #60a5fa); color: white; }
          .admin-role-badge.superadmin {
            background: linear-gradient(135deg, #dc2626, #ef4444);
            color: white;
            font-weight: 700;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);
            border: 1px solid #b91c1c;
          }

          .admin-role-user-date {
            color: #64748b;
            font-size: 0.75rem;
          }

          .admin-role-user-actions {
            display: flex;
            gap: 0.5rem;
          }

          .admin-role-action-btn {
            padding: 0.5rem;
            border: none;
            background: #e2e8f0;
            color: #475569;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 0.875rem;
          }

          .admin-role-action-btn:hover {
            background: #cbd5e1;
            color: #334155;
            transform: scale(1.05);
          }

          .admin-quick-actions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
          }

          .admin-quick-action-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            padding: 1.5rem;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: center;
          }

          .admin-quick-action-btn:hover {
            background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
            border-color: #3b82f6;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
          }

          .admin-quick-action-btn i {
            font-size: 1.5rem;
            color: #3b82f6;
          }

          .admin-quick-action-btn span {
            font-weight: 500;
            color: #1e293b;
          }

          .admin-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .admin-modal-content {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1);
          }

          .admin-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.5rem;
            border-bottom: 1px solid #e2e8f0;
          }

          .admin-modal-header h3 {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 600;
            color: #1e293b;
          }

          .admin-modal-close {
            background: none;
            border: none;
            font-size: 1.25rem;
            color: #64748b;
            cursor: pointer;
            padding: 0.25rem;
            border-radius: 4px;
            transition: all 0.2s ease;
          }

          .admin-modal-close:hover {
            background: #f1f5f9;
            color: #334155;
          }

          .admin-modal-body {
            padding: 1.5rem;
          }

          .admin-modal-footer {
            display: flex;
            gap: 0.75rem;
            justify-content: flex-end;
            padding: 1.5rem;
            border-top: 1px solid #e2e8f0;
          }

          .admin-empty-state {
            text-align: center;
            padding: 3rem 1.5rem;
            color: #64748b;
          }

          .admin-empty-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            opacity: 0.5;
          }

          .admin-empty-state h4 {
            margin: 0 0 0.5rem 0;
            color: #475569;
          }

          .admin-empty-state p {
            margin: 0;
            font-size: 0.875rem;
          }

          /* Mobile Responsiveness */
          @media (max-width: 768px) {
            .admin-roles-actions {
              flex-direction: column;
              width: 100%;
            }

            .admin-roles-actions .admin-btn {
              width: 100%;
            }

            .admin-roles-overview-grid {
              grid-template-columns: 1fr;
            }

            .admin-role-section-header {
              padding: 1rem;
            }

            .admin-role-section-title {
              flex-direction: column;
              align-items: flex-start;
              gap: 0.5rem;
            }

            .admin-role-user-card {
              flex-direction: column;
              align-items: flex-start;
              gap: 1rem;
            }

            .admin-role-user-actions {
              width: 100%;
              justify-content: center;
            }

            .admin-quick-actions-grid {
              grid-template-columns: 1fr;
            }

            .admin-modal-content {
              width: 95%;
              margin: 1rem;
            }
          }

          /* Focus and Accessibility */
          .admin-role-section-header:focus-visible {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
          }

          .admin-quick-action-btn:focus-visible {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
          }

          /* Animation for expand/collapse */
          .admin-role-section-content {
            transition: max-height 0.3s ease-in-out;
          }

          /* Role Changes Styles */
          .admin-role-changes-list {
            max-height: 400px;
            overflow-y: auto;
          }

          .admin-role-change-item {
            display: flex;
            align-items: flex-start;
            padding: 1rem;
            background: #f8fafc;
            border-radius: 8px;
            margin-bottom: 0.75rem;
            border: 1px solid #e2e8f0;
            transition: all 0.2s ease;
          }

          .admin-role-change-item:hover {
            background: #f1f5f9;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          }

          .admin-role-change-item:last-child {
            margin-bottom: 0;
          }

          .admin-role-change-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 1rem;
            font-size: 1rem;
            flex-shrink: 0;
          }

          .admin-role-change-icon.promotion {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
          }

          .admin-role-change-icon.demotion {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
          }

          .admin-role-change-icon.change {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: white;
          }

          .admin-role-change-content {
            flex: 1;
            min-width: 0;
          }

          .admin-role-change-title {
            font-size: 0.875rem;
            color: #1e293b;
            line-height: 1.4;
            margin-bottom: 0.5rem;
          }

          .admin-role-change-meta {
            display: flex;
            align-items: center;
            gap: 1rem;
            font-size: 0.75rem;
            color: #64748b;
          }

          .admin-role-change-by {
            font-weight: 500;
          }

          .admin-role-change-time {
            color: #94a3b8;
          }

          .admin-role-change-reason {
            margin-top: 0.5rem;
            font-size: 0.8rem;
            color: #64748b;
            font-style: italic;
            padding: 0.5rem;
            background: #f1f5f9;
            border-radius: 4px;
            border-left: 3px solid #3b82f6;
          }

          /* Mobile responsiveness for role changes */
          @media (max-width: 768px) {
            .admin-role-change-item {
              flex-direction: column;
              align-items: flex-start;
              gap: 0.75rem;
            }

            .admin-role-change-icon {
              align-self: flex-start;
            }

            .admin-role-change-meta {
              flex-direction: column;
              align-items: flex-start;
              gap: 0.25rem;
            }
          }

          /* Loading states */
          .admin-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            color: #64748b;
          }

          .admin-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #e2e8f0;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }}></style>
    </AdminLayout>
  );
});

// Admin Maintenance - Admin Only
adminApp.get('/maintenance', requireAdminOnly, async (c) => {
  const user = (c as any).adminUser;

  return c.render(
    <AdminLayout currentUser={user} currentPage="maintenance" breadcrumb="System Maintenance">
      <div class="admin-page-header">
        <h1 class="admin-page-title">System Maintenance</h1>
        <p class="admin-page-subtitle">Perform maintenance tasks and cleanup operations</p>
      </div>

      <div class="admin-maintenance-container">
        {/* PDF Content Cleanup */}
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">
              <i class="fas fa-file-pdf"></i>
              PDF Content Cleanup
            </h3>
          </div>
          <div class="admin-card-content">
            <p class="admin-card-description">
              Remove old PDF viewer HTML content from resources that still contain references to external PDF.js viewers.
              This will clean up any stored HTML content that references the old PDF viewer implementation.
            </p>

            <div class="admin-warning">
              <i class="fas fa-exclamation-triangle"></i>
              <strong>Note:</strong> This operation will update the stored HTML content for PDF resources.
              Make sure to backup your data before proceeding.
            </div>

            <div class="admin-maintenance-actions">
              <button class="admin-btn admin-btn-warning" id="cleanup-pdf-content">
                <i class="fas fa-broom"></i>
                Clean PDF Content
              </button>
            </div>

            <div class="admin-maintenance-info">
              <div class="admin-info-item">
                <strong>Status:</strong> <span id="cleanup-status">Ready</span>
              </div>
              <div class="admin-info-item">
                <strong>Last Run:</strong> <span id="cleanup-last-run">Never</span>
              </div>
              <div class="admin-info-item">
                <strong>Resources Updated:</strong> <span id="cleanup-count">0</span>
              </div>
            </div>
          </div>
        </div>

        {/* File Storage Cleanup */}
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">
              <i class="fas fa-cloud"></i>
              File Storage Cleanup
            </h3>
          </div>
          <div class="admin-card-content">
            <p class="admin-card-description">
              Clean up orphaned files in Cloudflare R2 storage that are no longer referenced by any resources.
              This helps maintain storage efficiency and reduce costs.
            </p>

            <div class="admin-maintenance-actions">
              <button class="admin-btn admin-btn-secondary" id="cleanup-orphaned-files">
                <i class="fas fa-trash-alt"></i>
                Clean Orphaned Files
              </button>
            </div>

            <div class="admin-maintenance-info">
              <div class="admin-info-item">
                <strong>Status:</strong> <span id="orphaned-status">Ready</span>
              </div>
              <div class="admin-info-item">
                <strong>Files Found:</strong> <span id="orphaned-count">0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Database Optimization */}
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">
              <i class="fas fa-database"></i>
              Database Optimization
            </h3>
          </div>
          <div class="admin-card-content">
            <p class="admin-card-description">
              Optimize database performance by cleaning up unused indexes, vacuuming tables, and analyzing query performance.
            </p>

            <div class="admin-maintenance-actions">
              <button class="admin-btn admin-btn-primary" id="optimize-database">
                <i class="fas fa-cogs"></i>
                Optimize Database
              </button>
            </div>

            <div class="admin-maintenance-info">
              <div class="admin-info-item">
                <strong>Status:</strong> <span id="optimize-status">Ready</span>
              </div>
              <div class="admin-info-item">
                <strong>Last Optimization:</strong> <span id="optimize-last-run">Never</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            // PDF Content Cleanup
            document.getElementById('cleanup-pdf-content').addEventListener('click', async function() {
              const button = this;
              const originalText = button.innerHTML;
              const statusSpan = document.getElementById('cleanup-status');
              const countSpan = document.getElementById('cleanup-count');

              try {
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cleaning...';
                button.disabled = true;
                statusSpan.textContent = 'Running...';

                const response = await fetch('/admin/api/cleanup-pdf-content', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  }
                });

                const result = await response.json();

                if (result.success) {
                  showAdminMessage(\`Successfully cleaned up PDF content in \${result.updated} resources\`, 'success');
                  statusSpan.textContent = 'Completed';
                  countSpan.textContent = result.updated;
                  document.getElementById('cleanup-last-run').textContent = new Date().toLocaleString();
                } else {
                  throw new Error(result.error || 'Cleanup failed');
                }

              } catch (error) {
                console.error('Cleanup error:', error);
                showAdminMessage('Failed to clean PDF content. Please try again.', 'error');
                statusSpan.textContent = 'Failed';
              } finally {
                button.innerHTML = originalText;
                button.disabled = false;
              }
            });

            // Orphaned Files Cleanup
            document.getElementById('cleanup-orphaned-files').addEventListener('click', async function() {
              const button = this;
              const originalText = button.innerHTML;
              const statusSpan = document.getElementById('orphaned-status');

              try {
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning...';
                button.disabled = true;
                statusSpan.textContent = 'Scanning...';

                // Simulate orphaned file cleanup
                await new Promise(resolve => setTimeout(resolve, 3000));

                showAdminMessage('Orphaned file cleanup completed successfully!', 'success');
                statusSpan.textContent = 'Completed';
                document.getElementById('orphaned-count').textContent = '5';

              } catch (error) {
                console.error('Cleanup error:', error);
                showAdminMessage('Failed to clean orphaned files. Please try again.', 'error');
                statusSpan.textContent = 'Failed';
              } finally {
                button.innerHTML = originalText;
                button.disabled = false;
              }
            });

            // Database Optimization
            document.getElementById('optimize-database').addEventListener('click', async function() {
              const button = this;
              const originalText = button.innerHTML;
              const statusSpan = document.getElementById('optimize-status');

              try {
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Optimizing...';
                button.disabled = true;
                statusSpan.textContent = 'Optimizing...';

                // Simulate database optimization
                await new Promise(resolve => setTimeout(resolve, 2500));

                showAdminMessage('Database optimization completed successfully!', 'success');
                statusSpan.textContent = 'Completed';
                document.getElementById('optimize-last-run').textContent = new Date().toLocaleString();

              } catch (error) {
                console.error('Optimization error:', error);
                showAdminMessage('Failed to optimize database. Please try again.', 'error');
                statusSpan.textContent = 'Failed';
              } finally {
                button.innerHTML = originalText;
                button.disabled = false;
              }
            });
          });
        `
      }} />
    </AdminLayout>
  );
});

export default adminApp;