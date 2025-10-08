import { Context } from 'hono'

// Bible Trivia 1 HTML Route Component - Serves the HTML content directly for Cloudflare compatibility
export async function BibleTrivia1Html({ c }: { c: Context }) {
  // Get authenticated user if available
  const user = c.get('user');

  // Serve the HTML content directly for Cloudflare compatibility
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- Primary SEO -->
    <title>Bible Trivia Game 1 - Database-Powered Scripture Quiz | GospelWays</title>
    <meta name="description" content="Challenge your biblical knowledge with our database-powered Bible trivia game. Test yourself with questions from all 66 books, compete in multiplayer matches, and learn scripture through interactive gameplay.">
    <meta name="keywords" content="Bible trivia, scripture quiz, biblical knowledge, Bible game, Christian quiz, Bible study, scripture learning, multiplayer Bible game, AI Bible questions">
    <meta name="author" content="GospelWays">
    <link rel="canonical" href="https://gospelways.org/tools/bible-trivia1.html">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://gospelways.org/tools/bible-trivia1.html">
    <meta property="og:title" content="Bible Trivia Game 1 - Database-Powered Scripture Quiz | GospelWays">
    <meta property="og:description" content="Challenge your biblical knowledge with our database-powered Bible trivia game. Test yourself with questions from all 66 books, compete in multiplayer matches, and learn scripture through interactive gameplay.">
    <meta property="og:image" content="https://gospelways.org/static/bible-trivia-og.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="GospelWays">
    <meta property="og:locale" content="en_US">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://gospelways.org/tools/bible-trivia1.html">
    <meta property="twitter:title" content="Bible Trivia Game 1 - Database-Powered Scripture Quiz | GospelWays">
    <meta property="twitter:description" content="Challenge your biblical knowledge with our database-powered Bible trivia game. Test yourself with questions from all 66 books, compete in multiplayer matches, and learn scripture through interactive gameplay.">
    <meta property="twitter:image" content="https://gospelways.org/static/bible-trivia-og.png">

    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Bible Trivia Game 1",
      "description": "AI-powered Bible trivia game with questions from all 66 books of the Bible",
      "url": "https://gospelways.org/tools/bible-trivia1.html",
      "applicationCategory": "EducationalApplication",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "featureList": [
        "AI-generated questions",
        "Multiplayer gameplay",
        "All 66 Bible books",
        "Multiple difficulty levels",
        "Question review system"
      ],
      "author": {
        "@type": "Organization",
        "name": "GospelWays"
      },
      "publisher": {
        "@type": "Organization",
        "name": "GospelWays"
      }
    }
    </script>

    <link rel="stylesheet" href="/static/bible-trivia1.css">
    <link rel="stylesheet" href="/static/navigation.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    
    <style>
        .retry-info {
            background: rgba(255, 152, 0, 0.1);
            border: 1px solid rgba(255, 152, 0, 0.3);
            border-radius: 8px;
            padding: 10px;
            margin-top: 10px;
            font-size: 12px;
            color: #ff9800;
        }
        .retry-attempt {
            margin-top: 5px;
            font-weight: 600;
        }
        .connection-status {
            display: inline-block;
            margin-left: 10px;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
        }
        .connection-status.online {
            background: rgba(76, 175, 80, 0.2);
            color: #4caf50;
        }
        .connection-status.retrying {
            background: rgba(255, 152, 0, 0.2);
            color: #ff9800;
        }
        .connection-status.offline {
            background: rgba(244, 67, 54, 0.2);
            color: #f44336;
        }
    </style>
</head>
<body>
    <!-- Main Website Navigation -->
    <nav class="global-navigation" role="navigation" aria-label="Main navigation">
        <div class="nav-container">
            <!-- Brand/Logo -->
            <div class="nav-brand">
                <a href="/" class="brand-link">
                    <h1 class="brand-title">Faith Defenders</h1>
                    <span class="brand-tagline">Defending the Faith</span>
                </a>
            </div>

            <!-- Desktop Navigation Menu -->
            <div class="nav-menu" id="nav-menu">
                <ul class="nav-links" role="menubar">
                    <li role="none">
                        <a href="/" class="nav-link" role="menuitem">
                            <i class="fas fa-home" aria-hidden="true"></i>
                            <span>Home</span>
                        </a>
                    </li>
                    <li role="none">
                        <a href="/articles" class="nav-link" role="menuitem">
                            <i class="fas fa-newspaper" aria-hidden="true"></i>
                            <span>Articles</span>
                        </a>
                    </li>
                    <li role="none">
                        <a href="/resources" class="nav-link" role="menuitem">
                            <i class="fas fa-book" aria-hidden="true"></i>
                            <span>Resources</span>
                        </a>
                    </li>
                    <li role="none">
                        <a href="/tools" class="nav-link active" role="menuitem">
                            <i class="fas fa-tools" aria-hidden="true"></i>
                            <span>Tools</span>
                        </a>
                    </li>
                    <li role="none">
                        <a href="/podcasts" class="nav-link" role="menuitem">
                            <i class="fas fa-podcast" aria-hidden="true"></i>
                            <span>Podcasts</span>
                        </a>
                    </li>
                    <li role="none">
                        <a href="/about" class="nav-link" role="menuitem">
                            <i class="fas fa-info-circle" aria-hidden="true"></i>
                            <span>About</span>
                        </a>
                    </li>
                </ul>
            </div>

            <!-- User Actions -->
            <div class="nav-actions">
                ${user ? `
                <div class="user-menu">
                    <button class="user-toggle" id="user-toggle" aria-expanded="false" aria-haspopup="true">
                        <div class="user-avatar">
                            <i class="fas fa-user-circle" aria-hidden="true"></i>
                        </div>
                        <span class="user-name">Hello, ${user.name}</span>
                        <i class="fas fa-chevron-down" aria-hidden="true"></i>
                    </button>
                    <div class="user-dropdown" id="user-dropdown" role="menu" aria-label="User menu">
                        <a href="/dashboard" class="dropdown-item" role="menuitem">
                            <i class="fas fa-tachometer-alt" aria-hidden="true"></i>
                            <span>Dashboard</span>
                        </a>
                        <a href="/dashboard?tab=settings" class="dropdown-item" role="menuitem">
                            <i class="fas fa-cog" aria-hidden="true"></i>
                            <span>Settings</span>
                        </a>
                        ${(user.role === 'admin' || user.role === 'moderator') ? `
                        <a href="${user.role === 'admin' ? '/admin' : '/admin/articles'}" class="dropdown-item" role="menuitem">
                            <i class="fas fa-shield-alt" aria-hidden="true"></i>
                            <span>Admin Panel</span>
                        </a>
                        ` : ''}
                        <div class="dropdown-divider" role="separator"></div>
                        <button class="dropdown-item logout-btn" onclick="handleLogout()" role="menuitem">
                            <i class="fas fa-sign-out-alt" aria-hidden="true"></i>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
                ` : `
                <div class="auth-actions">
                    <a href="/login" class="btn-login">
                        <i class="fas fa-sign-in-alt" aria-hidden="true"></i>
                        <span>Sign In</span>
                    </a>
                </div>
                `}
            </div>

            <!-- Mobile Menu Toggle -->
            <button class="mobile-menu-toggle" id="mobile-menu-toggle" aria-label="Toggle mobile menu" aria-expanded="false">
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
            </button>
        </div>

        <!-- Mobile Menu Overlay -->
        <div class="mobile-menu-overlay" id="mobile-menu-overlay"></div>

        <!-- Mobile Menu -->
        <div class="mobile-menu" id="mobile-menu" aria-hidden="true">
            <div class="mobile-menu-header">
                <div class="mobile-menu-brand">
                    <h2>Faith Defenders</h2>
                    <p>Defending the Faith</p>
                </div>
                <button class="mobile-menu-close" id="mobile-menu-close" aria-label="Close mobile menu">
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
            </div>

            <nav class="mobile-nav-menu">
                <ul class="mobile-nav-links" role="menubar">
                    <li role="none">
                        <a href="/" class="mobile-nav-link" role="menuitem">
                            <i class="fas fa-home" aria-hidden="true"></i>
                            <span>Home</span>
                        </a>
                    </li>
                    <li role="none">
                        <a href="/articles" class="mobile-nav-link" role="menuitem">
                            <i class="fas fa-newspaper" aria-hidden="true"></i>
                            <span>Articles</span>
                        </a>
                    </li>
                    <li role="none">
                        <a href="/resources" class="mobile-nav-link" role="menuitem">
                            <i class="fas fa-book" aria-hidden="true"></i>
                            <span>Resources</span>
                        </a>
                    </li>
                    <li role="none">
                        <a href="/tools" class="mobile-nav-link active" role="menuitem">
                            <i class="fas fa-tools" aria-hidden="true"></i>
                            <span>Tools</span>
                        </a>
                    </li>
                    <li role="none">
                        <a href="/podcasts" class="mobile-nav-link" role="menuitem">
                            <i class="fas fa-podcast" aria-hidden="true"></i>
                            <span>Podcasts</span>
                        </a>
                    </li>
                    <li role="none">
                        <a href="/about" class="mobile-nav-link" role="menuitem">
                            <i class="fas fa-info-circle" aria-hidden="true"></i>
                            <span>About</span>
                        </a>
                    </li>
                </ul>

                <!-- Mobile User Section -->
                <div class="mobile-user-section">
                    ${user ? `
                    <div class="mobile-user-info">
                        <div class="mobile-user-avatar">
                            <i class="fas fa-user-circle" aria-hidden="true"></i>
                        </div>
                        <div class="mobile-user-details">
                            <h3>${user.name}</h3>
                            <p>${user.email}</p>
                        </div>
                    </div>
                    ` : `
                    <div class="mobile-auth-section">
                        <p>Join our community</p>
                        <a href="/login" class="mobile-login-btn">
                            <i class="fas fa-sign-in-alt" aria-hidden="true"></i>
                            Sign In
                        </a>
                    </div>
                    `}
                </div>
            </nav>
        </div>
    </nav>

    <div class="container">

        <h1>📖 GospelWays Bible Trivia 1 <span class="ai-badge">Database Powered</span><span class="connection-status online" id="connectionStatus">● Online</span></h1>


        <!-- Loading Section -->
        <div class="loading-section">
            <div class="loading-core">
                <div class="loading-spinner"></div>
                <div class="loading-rings">
                    <div class="loading-ring ring-1"></div>
                    <div class="loading-ring ring-2"></div>
                    <div class="loading-ring ring-3"></div>
                </div>
                <div class="loading-particles">
                    <div class="particle particle-1"></div>
                    <div class="particle particle-2"></div>
                    <div class="particle particle-3"></div>
                    <div class="particle particle-4"></div>
                    <div class="particle particle-5"></div>
                    <div class="particle particle-6"></div>
                </div>
            </div>
            <div class="loading-progress-container">
                <div class="loading-progress-bar">
                    <div class="loading-progress-fill" id="loadingProgressFill"></div>
                    <div class="loading-progress-glow"></div>
                </div>
                <div class="loading-progress-text">0%</div>
            </div>
            <div class="loading-text ai-generating">AI is generating unique Bible questions...</div>
            <div class="question-count" id="questionProgress">Generating question 1 of 10...</div>
            <div class="retry-info" id="retryInfo" style="display: none;">
                <div>🔄 Intelligent retry system active - handling network issues automatically</div>
                <div class="retry-attempt" id="retryAttempt"></div>
            </div>
            <div class="loading-stats">
                <div class="stat-item">
                    <div class="stat-icon">⚡</div>
                    <div class="stat-label">Processing</div>
                </div>
                <div class="stat-item">
                    <div class="stat-icon">🧠</div>
                    <div class="stat-label">AI Active</div>
                </div>
                <div class="stat-item">
                    <div class="stat-icon">📊</div>
                    <div class="stat-label">Optimizing</div>
                </div>
            </div>
            <div class="error-message" id="errorMessage"></div>
        </div>

        <!-- Lobby Section -->
        <div class="lobby-section">
            <h2>Waiting Room</h2>
            <p>Waiting for other contestants to join...</p>
            <div class="contestants-list">
                <h3>Contestants (<span id="contestantCount">0</span>/10)</h3>
                <div id="contestantsList"></div>
            </div>
            <button id="startContestBtn" class="btn" disabled>Start Contest (Waiting...)</button>
        </div>


        <!-- Multiplayer Lobby Section -->
    <div class="multiplayer-lobby-section section-active">
        <h2>🎮 Bible Trivia Multiplayer</h2>
        <div class="game-mode-selection">
            <button id="createGameBtn" class="btn">Create New Game</button>
            <button id="joinGameBtn" class="btn">Join Existing Game</button>
            <button id="playSoloBtn" class="btn">Play Solo</button>
        </div>

        <!-- Global Leaderboard Section -->
        <div class="global-leaderboard-section">
            <h3>🏆 Global Leaderboard</h3>
            <p class="leaderboard-subtitle">Top performers in multiplayer Bible trivia games</p>

            <div class="leaderboard-panels">
                <div class="leaderboard-panel">
                    <h4>Easy Difficulty</h4>
                    <div id="easy-leaderboard" class="leaderboard-list">
                        <div class="leaderboard-loading">Loading leaderboard...</div>
                    </div>
                </div>

                <div class="leaderboard-panel">
                    <h4>Medium Difficulty</h4>
                    <div id="medium-leaderboard" class="leaderboard-list">
                        <div class="leaderboard-loading">Loading leaderboard...</div>
                    </div>
                </div>

                <div class="leaderboard-panel">
                    <h4>Hard Difficulty</h4>
                    <div id="hard-leaderboard" class="leaderboard-list">
                        <div class="leaderboard-loading">Loading leaderboard...</div>
                    </div>
                </div>

                <div class="leaderboard-panel">
                    <h4>Expert Difficulty</h4>
                    <div id="expert-leaderboard" class="leaderboard-list">
                        <div class="leaderboard-loading">Loading leaderboard...</div>
                    </div>
                </div>
            </div>

            <div class="leaderboard-info">
                <p><i class="fas fa-info-circle"></i> Leaderboard shows top 5 players with the most multiplayer game wins for each difficulty level.</p>
            </div>
        </div>

        ${user && (user.role === 'admin' || user.role === 'moderator') ? `
            <!-- Admin Controls -->
            <div class="admin-controls" style="margin-top: 20px; padding: 15px; background: rgba(0,0,0,0.05); border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; color: #666;">🧹 Room Management</h4>
                <button onclick="manualCleanupExpiredRooms()" class="btn" style="background: #ff9800; margin-right: 10px;">Clean Expired Rooms</button>
                <button onclick="getCleanupStatus().then(status => { if (status) alert('🧹 Would clean: ' + status.gamesDeleted + ' games, ' + status.participantsDeleted + ' participants, ' + status.questionsDeleted + ' questions, ' + status.historyDeleted + ' history records'); else alert('❌ Failed to get cleanup status'); })" class="btn" style="background: #2196f3;">Preview Cleanup</button>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">Automatically cleans rooms older than 2 hours every 10 minutes</p>

                <h4 style="margin: 15px 0 10px 0; color: #666;">🔧 Support Button Management</h4>
                <button onclick="checkAndRestoreSupportButton()" class="btn" style="background: #4caf50; margin-right: 10px;">Check/Restore Support Button</button>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">Support button should persist and cycle every 40 seconds</p>
            </div>
            ` : ''}




        <!-- Game Room Modal -->
        <div class="modal-overlay" id="gameRoomModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="roomTitle">Game Room</h3>
                    <button class="modal-close" onclick="closeModal('gameRoomModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="game-room-info">
                        <p><strong>Game:</strong> <span id="roomGameName"></span></p>
                        <p><strong>Difficulty:</strong> <span id="roomDifficulty"></span></p>
                        <p><strong>Status:</strong> <span id="roomStatus"></span></p>
                    </div>
                    <div class="players-list">
                        <h4>Players (<span id="playerCount">0</span>/<span id="maxPlayerCount">10</span>)</h4>
                        <div id="playersList"></div>
                    </div>
                    <div class="game-room-actions">
                        <button id="startGameBtn" class="btn" style="display: none;">Start Game</button>
                        <button id="shareGameBtn" class="btn">Share Game Room</button>
                        <button id="leaveGameBtn" class="btn">Leave Game</button>
                    </div>
                    <div id="shareLinkContainer" class="share-link-container" style="display: none;">
                        <p><strong>Share this link to invite others:</strong></p>
                        <input type="text" id="gameShareLink" class="share-link-input" readonly>
                        <div class="share-actions">
                            <button id="copyShareLinkBtn" class="btn">Copy Link</button>
                        </div>
                        <p class="share-info">Anyone with this link can join your game room! The link will automatically take them to your game.</p>
                    </div>
                </div>
            </div>
        </div>

        </div>


        <!-- Game Section -->
        <div class="game-section">
            <div class="progress-bar">
                <div class="progress-fill" id="progressBar"></div>
            </div>

            <div class="stats-container">
                <div class="stat-card">
                    <div class="stat-value" id="currentQuestion">1</div>
                    <div class="stat-label">Question</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="currentScore">0</div>
                    <div class="stat-label">Score</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="correctAnswers">0</div>
                    <div class="stat-label">Correct</div>
                </div>
            </div>

            <div class="timer normal" id="timer">10</div>

            <div class="question-container">
                <div class="question-number" id="questionNumber">Question 1</div>
                <div class="answer-locked-overlay" id="answerLockedOverlay">🔒</div>
                <div class="difficulty-badge" id="difficultyBadge"></div>
                <div class="verse-text" id="verseText" style="display: none;"></div>
                <div class="verse-reference" id="verseReference"></div>
                <div class="question-text" id="questionText"></div>
                <div class="options-container" id="optionsContainer"></div>
            </div>

            <button id="submitAnswer" class="btn" disabled>Lock Answer</button>
            <span class="lock-indicator" id="lockIndicator" style="display: none;">✓ Answer Locked!</span>
        </div>

        <!-- Results Section -->
        <div class="results-section">
            <h2>Trivia Results 🏆</h2>

            <div class="results-navigation">
                <button onclick="returnToLobby()" class="btn btn-danger">
                    <i class="fas fa-arrow-left"></i>
                    Back to Game Lobby
                </button>
            </div>

            <div class="stats-container">
                <div class="stat-card">
                    <div class="stat-value" id="finalScore">0</div>
                    <div class="stat-label">Final Score</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="finalCorrect">0</div>
                    <div class="stat-label">Correct Answers</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="finalAccuracy">0%</div>
                    <div class="stat-label">Accuracy</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="finalRank">-</div>
                    <div class="stat-label">Your Rank</div>
                </div>
            </div>

            <div class="leaderboard">
                <h3>Final Leaderboard</h3>
                <div id="leaderboardContainer"></div>
            </div>

            <div class="question-review">
                <h3>📝 Question Review & Answers</h3>
                <p class="review-subtitle">See where you went right and where you can improve!</p>
                <div id="questionReviewContainer"></div>
            </div>

            <button onclick="resetAndRestart()" class="btn">Play Again</button>
        </div>

        <!-- Countdown Overlay -->
        <div class="countdown-overlay" id="countdownOverlay">
            <div class="countdown-number" id="countdownNumber">3</div>
        </div>

        <!-- Modals -->
        <!-- Create Multiplayer Modal -->
        <div class="modal-overlay" id="createMultiplayerModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Create New Multiplayer Game</h3>
                    <button class="modal-close" onclick="closeModal('createMultiplayerModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="createMultiplayerForm">
                        <div class="form-group">
                            <label for="multiplayerGameName">Game Name</label>
                            <input type="text" id="multiplayerGameName" required placeholder="Enter a name for your game">
                        </div>
                        <div class="form-group">
                            <label for="multiplayerPlayerName">Your Name</label>
                            <input type="text" id="multiplayerPlayerName" required placeholder="Enter your display name">
                        </div>
                        <div class="form-group">
                            <label for="multiplayerDifficulty">Difficulty Level</label>
                            <select id="multiplayerDifficulty">
                                <option value="easy">Easy - Basic Bible Stories</option>
                                <option value="medium">Medium - Bible Books & Context</option>
                                <option value="hard">Hard - Deep Scripture Knowledge</option>
                                <option value="expert">Expert - Biblical Languages & Exegesis</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="multiplayerMaxPlayers">Maximum Players</label>
                            <select id="multiplayerMaxPlayers">
                                <option value="2">2 Players</option>
                                <option value="4">4 Players</option>
                                <option value="6">6 Players</option>
                                <option value="8">8 Players</option>
                                <option value="10" selected>10 Players</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="multiplayerQuestions">Questions Per Game</label>
                            <select id="multiplayerQuestions">
                                <option value="5">5 Questions (Recommended)</option>
                                <option value="10" selected>10 Questions (Recommended)</option>
                                <option value="15">15 Questions</option>
                                <option value="20">20 Questions (May be slow)</option>
                            </select>
                            <small style="color: #666; font-size: 12px;">⚠️ More than 15 questions may cause timeouts</small>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Create Game</button>
                            <button type="button" class="btn btn-secondary" onclick="closeModal('createMultiplayerModal')">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Join Game Modal -->
        <div class="modal-overlay" id="joinGameModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Join Existing Game</h3>
                    <button class="modal-close" onclick="closeModal('joinGameModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="join-options">
                        <button id="quickJoinBtn" class="btn btn-primary">Quick Join</button>
                        <button id="browseGamesBtn" class="btn btn-secondary">Browse Games</button>
                        <div class="join-by-code">
                            <label for="gameCodeInput">Or enter game code:</label>
                            <input type="text" id="gameCodeInput" placeholder="Enter game code" maxlength="10">
                            <button id="joinByCodeBtn" class="btn btn-accent">Join by Code</button>
                        </div>
                    </div>
                    <div id="activeGamesList" class="active-games-list" style="display: none;">
                        <h4>Available Games</h4>
                        <div id="availableGames">
                            <p>Loading available games...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Play Solo Modal -->
        <div class="modal-overlay" id="playSoloModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Play Solo Game</h3>
                    <button class="modal-close" onclick="closeModal('playSoloModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="playSoloForm">
                        ${user ? `
                        <div class="user-info">
                            <div class="user-avatar">
                                <i class="fas fa-user-circle"></i>
                            </div>
                            <div class="user-details">
                                <h4>Playing as: ${user.name}</h4>
                                <p>Your account name will be used for the game.</p>
                            </div>
                        </div>
                        ` : `
                        <div class="form-group">
                            <label for="soloPlayerName">Your Name</label>
                            <input type="text" id="soloPlayerName" required placeholder="Enter your display name">
                        </div>
                        `}
                        <div class="form-group">
                            <label for="soloDifficulty">Difficulty Level</label>
                            <select id="soloDifficulty">
                                <option value="easy">Easy - Basic Bible Stories</option>
                                <option value="medium">Medium - Bible Books & Context</option>
                                <option value="hard">Hard - Deep Scripture Knowledge</option>
                                <option value="expert">Expert - Biblical Languages & Exegesis</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="soloQuestions">Number of Questions</label>
                            <select id="soloQuestions">
                                <option value="5">5 Questions (Recommended)</option>
                                <option value="10" selected>10 Questions (Recommended)</option>
                                <option value="15">15 Questions</option>
                                <option value="20">20 Questions (May be slow)</option>
                            </select>
                            <small style="color: #666; font-size: 12px;">⚠️ More than 15 questions may cause timeouts</small>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Start Solo Game</button>
                            <button type="button" class="btn btn-secondary" onclick="closeModal('playSoloModal')">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <script src="/static/js/navigation.js"></script>
    <script src="/static/bible-trivia1.js"></script>
    <script>
      // Simple connection status management
      (function() {
        let connectionHealthy = true;

        window.updateConnectionStatus = function(status) {
          const statusEl = document.getElementById('connectionStatus');
          if (!statusEl) return;

          statusEl.className = 'connection-status ' + status;
          const statusText = {
            'online': '● Online',
            'retrying': '⟳ Retrying',
            'offline': '✕ Offline'
          };
          statusEl.textContent = statusText[status] || '● Online';
        };

        window.updateConnectionStatus('online');

        // Simple fetch wrapper
        window.fetchWithRetry = async function(url, options = {}, retryCount = 0) {
          try {
            const response = await fetch(url, options);
            connectionHealthy = true;
            window.updateConnectionStatus('online');
            return response;
          } catch (error) {
            console.error('Fetch error:', error);
            connectionHealthy = false;
            window.updateConnectionStatus('offline');
            throw error;
          }
        };

        // Network status event listeners
        window.addEventListener('online', () => {
          connectionHealthy = true;
          window.updateConnectionStatus('online');
        });

        window.addEventListener('offline', () => {
          connectionHealthy = false;
          window.updateConnectionStatus('offline');
        });
      })();
    </script>
    <script>
      // Inject authenticated user data for trivia game
      window.authenticatedUser = ${user ? JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }) : 'null'};
    </script>
</body>
</html>`;

  c.header('Content-Type', 'text/html');
  c.header('Cache-Control', 'public, max-age=3600');
  return c.html(htmlContent);
}
