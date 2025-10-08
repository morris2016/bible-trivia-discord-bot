import { Context } from 'hono'

// Bible Trivia HTML Route Component - Serves the HTML content directly for Cloudflare compatibility
export async function BibleTriviaHtml({ c }: { c: Context }) {
  // Serve the HTML content directly for Cloudflare compatibility
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GospelWays Bible Trivia - AI Powered</title>
    <link rel="stylesheet" href="/static/bible-trivia.css">
</head>
<body>
    <div class="container">
        <!-- Homepage Navigation Button -->
        <button id="homeButton" class="home-button" onclick="goHome()" title="Go to Homepage">🏠 Home</button>

        <h1>📖 GospelWays Bible Trivia <span class="ai-badge">AI Powered</span></h1>


        <!-- Loading Section -->
        <div class="loading-section">
            <div class="loading-spinner"></div>
            <div class="loading-text ai-generating">AI is generating unique Bible questions...</div>
            <div class="question-count" id="questionProgress">Generating question 1 of 10...</div>
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

            <!-- Create Game Form -->
            <div id="createGameForm" style="display: none; margin-top: 20px;">
                <h3>Create New Game</h3>
                <form id="newGameForm">
                    <div class="form-group">
                        <label for="gameName">Game Name</label>
                        <input type="text" id="gameName" required placeholder="Enter game name">
                    </div>
                    <div class="form-group">
                        <label for="gameDifficulty">Difficulty</label>
                        <select id="gameDifficulty">
                            <option value="easy">Easy - Basic Bible Stories</option>
                            <option value="medium">Medium - Bible Books & Context</option>
                            <option value="hard">Hard - Deep Scripture Knowledge</option>
                            <option value="expert">Expert - Biblical Languages & Exegesis</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="maxPlayers">Max Players</label>
                        <select id="maxPlayers">
                            <option value="2">2 Players</option>
                            <option value="4">4 Players</option>
                            <option value="6">6 Players</option>
                            <option value="8">8 Players</option>
                            <option value="10" selected>10 Players</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="questionsPerGame">Questions Per Game</label>
                        <select id="questionsPerGame">
                            <option value="5">5 Questions</option>
                            <option value="10" selected>10 Questions</option>
                            <option value="15">15 Questions</option>
                            <option value="20">20 Questions</option>
                            <option value="25">25 Questions</option>
                        </select>
                    </div>
                    <button type="submit" class="btn">Create Game</button>
                    <button type="button" id="cancelCreateBtn" class="btn">Cancel</button>
                </form>
            </div>

            <!-- Join Game Form -->
            <div id="joinGameForm" style="display: none; margin-top: 20px;">
                <h3>Join Existing Game</h3>
                <div id="availableGames">
                    <p>Loading available games...</p>
                </div>
                <button type="button" id="cancelJoinBtn" class="btn" style="margin-top: 10px;">Cancel</button>
            </div>

            <!-- Solo Game Form -->
            <div id="soloGameForm" style="display: none; margin-top: 20px;">
                <h3>Play Solo Game</h3>
                <form id="newSoloGameForm">
                    <div class="form-group">
                        <label for="soloPlayerName">Your Name</label>
                        <input type="text" id="soloPlayerName" required placeholder="Enter your name">
                    </div>
                    <div class="form-group">
                        <label for="soloDifficulty">Difficulty</label>
                        <select id="soloDifficulty">
                            <option value="easy">Easy - Basic Bible Stories</option>
                            <option value="medium">Medium - Bible Books & Context</option>
                            <option value="hard">Hard - Deep Scripture Knowledge</option>
                            <option value="expert">Expert - Biblical Languages & Exegesis</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="soloQuestions">Questions</label>
                        <select id="soloQuestions">
                            <option value="5">5 Questions</option>
                            <option value="10" selected>10 Questions</option>
                            <option value="15">15 Questions</option>
                            <option value="20">20 Questions</option>
                            <option value="25">25 Questions</option>
                        </select>
                    </div>
                    <button type="submit" class="btn">Start Solo Game</button>
                    <button type="button" id="cancelSoloBtn" class="btn">Cancel</button>
                </form>
            </div>

            <!-- Game Room -->
            <div id="gameRoom" style="display: none; margin-top: 20px;">
                <h3 id="roomTitle">Game Room</h3>
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

            <button onclick="resetAndRestart()" class="btn">Play Again</button>
        </div>

        <!-- Countdown Overlay -->
        <div class="countdown-overlay" id="countdownOverlay">
            <div class="countdown-number" id="countdownNumber">3</div>
        </div>
    </div>

    <script src="/static/bible-trivia.js"></script>
</body>
</html>`;

  c.header('Content-Type', 'text/html');
  c.header('Cache-Control', 'public, max-age=3600');
  return c.html(htmlContent);
}
