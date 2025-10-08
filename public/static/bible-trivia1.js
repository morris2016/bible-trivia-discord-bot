// Bible Trivia Game Logic - Performance Optimized Version
// Reduced console logging, optimized polling, and improved memory management

// Performance Configuration
const PERFORMANCE_CONFIG = {
    enableConsoleLogging: false, // Disable for production
    maxPollingFrequency: 3000, // Reduced from 2000ms
    maxProgressPollingFrequency: 15000, // Reduced from 10000ms
    supportButtonCheckInterval: 10000, // Reduced from 5000ms
    maxConcurrentRequests: 3,
    cacheTimeout: 30000, // 30 seconds cache
    maxRetries: 2 // Reduced from 3
};

// Enhanced logging utility that can be disabled for performance
const logger = {
    log: (...args) => PERFORMANCE_CONFIG.enableConsoleLogging && console.log(...args),
    warn: (...args) => PERFORMANCE_CONFIG.enableConsoleLogging && console.warn(...args),
    error: (...args) => console.error(...args), // Always keep errors
    debug: (...args) => PERFORMANCE_CONFIG.enableConsoleLogging && console.debug(...args)
};

// Heart-convicting Bible verses about sin, hypocrisy, and God - Complete verses
const faithVerses = [
    "For all have sinned and fall short of the glory of God. - Romans 3:23",
    "The heart is deceitful above all things, and desperately wicked: who can know it? - Jeremiah 17:9",
    "If we say that we have no sin, we deceive ourselves, and the truth is not in us. - 1 John 1:8",
    "Woe unto you, scribes and Pharisees, hypocrites! for ye are like unto whited sepulchres, which indeed appear beautiful outward, but are within full of dead men's bones, and of all uncleanness. - Matthew 23:27",
    "And why beholdest thou the mote that is in thy brother's eye, but considerest not the beam that is in thine own eye? - Matthew 7:3",
    "For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord. - Romans 6:23",
    "He that covereth his sins shall not prosper: but whoso confesseth and forsaketh them shall have mercy. - Proverbs 28:13",
    "The Lord is not slack concerning his promise, as some men count slackness; but is longsuffering to us-ward, not willing that any should perish, but that all should come to repentance. - 2 Peter 3:9",
    "If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness. - 1 John 1:9",
    "Create in me a clean heart, O God; and renew a right spirit within me. - Psalm 51:10",
    "Let the wicked forsake his way, and the unrighteous man his thoughts: and let him return unto the Lord, and he will have mercy upon him; and to our God, for he will abundantly pardon. - Isaiah 55:7",
    "For I acknowledge my transgressions: and my sin is ever before me. Against thee, thee only, have I sinned, and done this evil in thy sight. - Psalm 51:3-4",
    "But if ye will not do so, behold, ye have sinned against the Lord: and be sure your sin will find you out. - Numbers 32:23",
    "He that hideth hatred with lying lips, and he that uttereth a slander, is a fool. - Proverbs 10:18",
    "These six things doth the Lord hate: yea, seven are an abomination unto him: A proud look, a lying tongue, and hands that shed innocent blood, An heart that deviseth wicked imaginations, feet that be swift in running to mischief, A false witness that speaketh lies, and he that soweth discord among brethren. - Proverbs 6:16-19",
    "The fear of the Lord is to hate evil: pride, and arrogancy, and the evil way, and the froward mouth, do I hate. - Proverbs 8:13",
    "Therefore thou art inexcusable, O man, whosoever thou art that judgest: for wherein thou judgest another, thou condemnest thyself; for thou that judgest doest the same things. - Romans 2:1",
    "For there is nothing covered, that shall not be revealed; neither hid, that shall not be known. - Luke 12:2",
    "And the times of this ignorance God winked at; but now commandeth all men every where to repent. - Acts 17:30",
    "For godly sorrow worketh repentance to salvation not to be repented of: but the sorrow of the world worketh death. - 2 Corinthians 7:10"
];

let verseInterval;
let verseCounter = 0;

// Game State - Complete reset for each session
let gameState = {
    currentUser: null,
    contestants: [],
    questions: [],
    sessionId: Date.now() + Math.random(), // Unique session ID
    currentQuestionIndex: 0,
    score: 0,
    correctAnswers: 0,
    selectedAnswer: null,
    answerLocked: false,
    timeLeft: 10,
    timerInterval: null,
    gameActive: false,
    usedQuestions: new Set(), // Track questions in THIS session
    userAnswers: [], // Track user answers for question review

    // Multiplayer additions
    isMultiplayer: false,
    currentGame: null, // Current multiplayer game
    currentParticipant: null, // Current player's participant record
    gameRoomId: null,
    gameUpdateInterval: null, // For polling game updates
    isGameCreator: false,
    isSoloMode: false,  // Add explicit solo mode flag
    pendingJoinGameId: null,  // For direct URL joining

    // Enhanced loading state for database-driven progress tracking
    loadingState: {
        gameId: null,
        totalQuestions: 10,
        generatedQuestions: 0,
        lastKnownCount: 0,
        isGenerating: false,
        errorCount: 0,
        maxErrors: 5,
        retryCount: 0,
        maxRetries: 3,
        canRetry: true,
        startTime: null
    }
};

// Standalone utility function for getting points by difficulty
function getPointsForDifficulty(difficulty, totalQuestionsInDifficulty = 10) {
    // Dynamic system: Points per question calculated so max total is 84
    const maxPointsPerDifficulty = 84;
    const pointsPerQuestion = maxPointsPerDifficulty / totalQuestionsInDifficulty;

    // Round to nearest integer for clean scoring
    return Math.round(pointsPerQuestion);
}

// All AI processing moved to server-side for security

// Performance monitoring utilities
const performanceMonitor = {
    metrics: {
        apiCalls: 0,
        cacheHits: 0,
        domOperations: 0,
        memoryUsage: 0,
        pollingOperations: 0
    },

    startTime: Date.now(),

    recordApiCall: function() {
        this.metrics.apiCalls++;
    },

    recordCacheHit: function() {
        this.metrics.cacheHits++;
    },

    recordDomOperation: function() {
        this.metrics.domOperations++;
    },

    recordPollingOperation: function() {
        this.metrics.pollingOperations++;
    },

    updateMemoryUsage: function() {
        if (performance.memory) {
            this.metrics.memoryUsage = performance.memory.usedJSHeapSize;
        }
    },

    getReport: function() {
        const uptime = Date.now() - this.startTime;
        return {
            uptime: Math.round(uptime / 1000),
            ...this.metrics,
            cacheHitRate: this.metrics.apiCalls > 0 ? Math.round((this.metrics.cacheHits / this.metrics.apiCalls) * 100) : 0,
            avgApiCallsPerSecond: Math.round((this.metrics.apiCalls / uptime) * 1000),
            memoryUsageMB: Math.round(this.metrics.memoryUsage / 1024 / 1024)
        };
    },

    logReport: function() {
        const report = this.getReport();
        logger.log('📊 Performance Report:', report);
        return report;
    }
};

// Optimized request throttling system with intelligent caching and reduced logging
let requestQueue = [];
let isProcessingQueue = false;
let lastRequestTime = 0;
let consecutiveFailures = 0;
let requestCache = new Map();

// Simple cache implementation for API responses
function getCachedResponse(url) {
    const cached = requestCache.get(url);
    if (cached && Date.now() - cached.timestamp < PERFORMANCE_CONFIG.cacheTimeout) {
        logger.debug('📋 Cache hit for:', url);
        return cached.response.clone();
    }
    return null;
}

function setCachedResponse(url, response) {
    requestCache.set(url, {
        response: response.clone(),
        timestamp: Date.now()
    });
    // Limit cache size
    if (requestCache.size > 50) {
        const firstKey = requestCache.keys().next().value;
        requestCache.delete(firstKey);
    }
}

async function throttledFetch(url, options = {}) {
    performanceMonitor.recordApiCall();

    // Check cache first
    const cachedResponse = getCachedResponse(url);
    if (cachedResponse) {
        performanceMonitor.recordCacheHit();
        logger.debug('📋 Cache hit for:', url);
        return cachedResponse;
    }

    return new Promise((resolve, reject) => {
        requestQueue.push({ url, options, resolve, reject, retryCount: 0 });
        if (requestQueue.length <= PERFORMANCE_CONFIG.maxConcurrentRequests) {
            processRequestQueue();
        }
    });
}

async function processRequestQueue() {
    if (isProcessingQueue || requestQueue.length === 0) {
        return;
    }

    isProcessingQueue = true;

    while (requestQueue.length > 0) {
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;

        // Use optimized backoff delay
        const backoffDelay = consecutiveFailures > 0 ?
            Math.min(1000 * Math.pow(2, consecutiveFailures), 10000) : 200;

        if (timeSinceLastRequest < backoffDelay) {
            await new Promise(resolve => setTimeout(resolve, backoffDelay - timeSinceLastRequest));
        }

        const request = requestQueue.shift();

        try {
            lastRequestTime = Date.now();
            const response = await fetch(request.url, request.options);

            if (response.ok) {
                // Cache successful responses
                setCachedResponse(request.url, response);
                consecutiveFailures = 0;
            }

            request.resolve(response);
        } catch (error) {
            consecutiveFailures++;
            logger.warn(`Request failed (attempt ${request.retryCount + 1}), failures: ${consecutiveFailures}`);

            // Reduced retry logic for performance
            if (request.retryCount < PERFORMANCE_CONFIG.maxRetries) {
                request.retryCount++;
                requestQueue.unshift(request);
                await new Promise(resolve => setTimeout(resolve, backoffDelay));
            } else {
                request.reject(error);
            }
        }
    }

    isProcessingQueue = false;
}

// DOM Elements
// Note: loginSection removed for trivia1 - users go directly to multiplayer lobby
const loadingSection = document.querySelector('.loading-section');
const lobbySection = document.querySelector('.lobby-section');
const gameSection = document.querySelector('.game-section');
const resultsSection = document.querySelector('.results-section');
const multiplayerLobbySection = document.querySelector('.multiplayer-lobby-section');

// Global Leaderboard Functions
async function loadGlobalLeaderboard() {
    try {
        const response = await fetch('/api/bible-games/leaderboard');
        const result = await response.json();

        if (result.success) {
            const difficulties = ['easy', 'medium', 'hard', 'expert'];
            difficulties.forEach(difficulty => {
                const leaderboard = result.leaderboard[difficulty] || [];
                displayDifficultyLeaderboard(difficulty, leaderboard);
            });
        } else {
            console.error('❌ Failed to load global leaderboard:', result.error);
            showLeaderboardError();
        }
    } catch (error) {
        console.error('❌ Error loading global leaderboard:', error);
        showLeaderboardError();
    }
}

function displayDifficultyLeaderboard(difficulty, players) {
    const container = document.getElementById(`${difficulty}-leaderboard`);
    if (!container) {
        console.error(`❌ Leaderboard container not found for ${difficulty}`);
        return;
    }

    if (!players || players.length === 0) {
        container.innerHTML = `
            <div class="empty-leaderboard">
                <div class="trophy-emoji">🏆</div>
                <div class="empty-text">No players yet</div>
                <div class="empty-text">Be the first to win!</div>
            </div>
        `;
        return;
    }

    // Limit to top 5 players per difficulty
    const topPlayers = players.slice(0, 5);

    const leaderboardHTML = topPlayers.map((player, index) => {
        const rankText = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

        return `
            <div class="leaderboard-entry">
                <div class="rank">${rankText}</div>
                <div class="player-info">
                    <div class="player-name">${player.name || player.player_name}</div>
                    <div class="player-stats">${player.wins || player.multiplayer_wins} wins</div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = leaderboardHTML;
}

function showLeaderboardError() {
    const difficulties = ['easy', 'medium', 'hard', 'expert'];
    difficulties.forEach(difficulty => {
        const container = document.getElementById(`${difficulty}-leaderboard`);
        if (container) {
            container.innerHTML = `
                <div class="leaderboard-error">
                    <div class="error-emoji">⚠️</div>
                    <div class="empty-text">Unable to load leaderboard</div>
                    <div class="empty-text">Please try refreshing the page</div>
                </div>
            `;
        } else {
            console.error(`❌ Leaderboard container not found for ${difficulty}`);
        }
    });
}

// Security: Disable right-click context menu on questions to prevent copying
document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.question-container') ||
        e.target.closest('.question-text') ||
        e.target.closest('.verse-text') ||
        e.target.closest('.verse-reference')) {
        e.preventDefault();
        return false;
    }
});

// Security: Disable keyboard shortcuts for copying
document.addEventListener('keydown', (e) => {
    // Disable Ctrl+C, Ctrl+X, Ctrl+V on question elements
    if ((e.ctrlKey || e.metaKey) &&
        (e.key === 'c' || e.key === 'x' || e.key === 'v') &&
        (e.target.closest('.question-container') ||
         e.target.closest('.question-text') ||
         e.target.closest('.verse-text') ||
         e.target.closest('.verse-reference'))) {
        e.preventDefault();
        return false;
    }
});

// Homepage Navigation - Now handled by the navigation menu

// Support Button Functionality
function openSupport() {
    window.open('https://buymeacoffee.com/siagmoo26i', '_blank');
}

let supportButtonInterval;

// Function to show support button (no more cycling)
function showSupportButton() {
    const supportContainer = ensureSupportContainerExists();
    if (supportContainer) {
        supportContainer.style.opacity = '1';
        supportContainer.style.transform = 'translateY(0) scale(1)';
        supportContainer.style.pointerEvents = 'auto';
        supportContainer.style.display = 'flex';
    }
}

// Function to ensure support container exists in DOM
function ensureSupportContainerExists() {
    let supportContainer = document.querySelector('.support-container');

    if (!supportContainer) {

        // Create the support container HTML
        const containerHTML = `
            <div class="support-container">
                <button id="supportButton" class="support-button" onclick="openSupport()" title="Support API Costs">
                    <div>☕</div>
                    <div>SUPPORT</div>
                </button>
                <div class="support-message">for us to maintain api costs for ai models, you may support us</div>
            </div>
        `;

        // Find the multiplayer lobby section to insert support button inside
        const lobbySection = document.querySelector('.multiplayer-lobby-section');
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = containerHTML;
        const newContainer = tempDiv.firstElementChild;

        // Remove any existing support container first
        const existingContainer = document.querySelector('.support-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        // Insert the new container inside the lobby section if it exists
        if (lobbySection) {
            lobbySection.insertBefore(newContainer, lobbySection.firstChild);
        } else {
            // Fallback: insert at the beginning of body
            document.body.insertBefore(newContainer, document.body.firstChild);
        }

        supportContainer = document.querySelector('.support-container');

        // Make sure it's visible and properly styled
        if (supportContainer) {
            supportContainer.style.opacity = '1';
            supportContainer.style.transform = 'translateY(0) scale(1)';
            supportContainer.style.display = 'flex';
            // Position inside lobby instead of fixed positioning
            supportContainer.style.position = 'relative';
            supportContainer.style.width = '100%';
            supportContainer.style.justifyContent = 'center';
            supportContainer.style.marginTop = '30px';
            supportContainer.style.pointerEvents = 'auto';
            supportContainer.style.visibility = 'visible';
            supportContainer.style.zIndex = '900';

        } else {
            console.error('❌ Failed to recreate support container');
        }
    }

    return supportContainer;
}

// Function to monitor and control support button visibility based on current section
function updateSupportButtonVisibility() {
    const supportContainer = document.querySelector('.support-container');
    if (!supportContainer) {
        return;
    }

    // Check if we're currently in any non-lobby section
    const isInNonLobbySection = document.querySelector('.game-section.section-active') ||
                               document.querySelector('.results-section.section-active') ||
                               document.querySelector('.loading-section.section-active');

    if (isInNonLobbySection) {
        supportContainer.style.opacity = '0';
        supportContainer.style.pointerEvents = 'none';
        supportContainer.style.transform = 'translateY(-20px) scale(0.9)';
    } else {
        supportContainer.style.opacity = '1';
        supportContainer.style.pointerEvents = 'auto';
        supportContainer.style.transform = 'translateY(0) scale(1)';
    }
}

// Start the support elements toggle cycle
function startSupportButtonCycle() {

    // Ensure support container exists before starting
    const initialCheck = ensureSupportContainerExists();
    if (!initialCheck) {
        console.error('❌ Cannot start support button cycle - container creation failed');
        return;
    }


    // Initial toggle after 20 seconds (visible for 20s, then hide for 20s)
    setTimeout(() => {
        toggleSupportElements();
    }, 20000);

    // Then repeat every 40 seconds (20s visible + 20s hidden)
    supportButtonInterval = setInterval(() => {
        toggleSupportElements();
    }, 40000); // 40 seconds total cycle

    // Optimized periodic DOM check with reduced frequency
    setInterval(() => {
        const supportContainer = document.querySelector('.support-container');
        if (!supportContainer || supportContainer.parentNode !== document.body) {
            ensureSupportContainerExists();
        } else {
            // Check if we're in any non-lobby section - if so, hide the support button
            const isInNonLobbySection = document.querySelector('.game-section.section-active') ||
                                       document.querySelector('.results-section.section-active') ||
                                       document.querySelector('.loading-section.section-active');

            if (isInNonLobbySection) {
                supportContainer.style.opacity = '0';
                supportContainer.style.pointerEvents = 'none';
                return;
            }

            // Ensure it's properly styled and visible (only if not in gameplay)
            const computedStyle = window.getComputedStyle(supportContainer);
            const isVisible = supportContainer.style.display !== 'none' &&
                             supportContainer.style.visibility !== 'hidden' &&
                             computedStyle.display !== 'none' &&
                             computedStyle.visibility !== 'hidden' &&
                             supportContainer.style.opacity !== '0' &&
                             computedStyle.opacity !== '0';

            if (!isVisible || supportContainer.style.position !== 'fixed') {
                supportContainer.style.opacity = '1';
                supportContainer.style.transform = 'translateY(0) scale(1)';
                supportContainer.style.display = 'flex';
                supportContainer.style.visibility = 'visible';
                supportContainer.style.position = 'fixed';
                supportContainer.style.right = '20px';
                supportContainer.style.pointerEvents = 'auto';
                supportContainer.style.zIndex = window.innerWidth <= 600 ? '950' : '900';
            }
        }
    }, PERFORMANCE_CONFIG.supportButtonCheckInterval);
}

// Stop the support elements cycle
function stopSupportButtonCycle() {
    if (supportButtonInterval) {
        clearInterval(supportButtonInterval);
        supportButtonInterval = null;
    } else {
        console.log('ℹ️ Support button cycle was not running');
    }

    // Make sure elements are visible when stopping
    const supportContainer = ensureSupportContainerExists();
    if (supportContainer) {
        supportContainer.style.opacity = '1';
        supportContainer.style.transform = 'translateY(0) scale(1)';
    } else {
        console.warn('⚠️ Support container not found when stopping cycle');
    }
}

// Player Name Persistence Functions
function savePlayerName(name) {
    try {
        localStorage.setItem('bibleTriviaPlayerName', name);
    } catch (error) {
        console.warn('⚠️ Could not save player name to localStorage:', error);
    }
}

function loadPlayerName() {
    try {
        const savedName = localStorage.getItem('bibleTriviaPlayerName');
        if (savedName && savedName.trim()) {
            console.log('✅ Player name loaded from localStorage:', savedName);
            return savedName.trim();
        }
    } catch (error) {
        console.warn('⚠️ Could not load player name from localStorage:', error);
    }
    return null;
}

function clearPlayerName() {
    try {
        localStorage.removeItem('bibleTriviaPlayerName');
        console.log('✅ Player name cleared from localStorage');
    } catch (error) {
        console.warn('⚠️ Could not clear player name from localStorage:', error);
    }
}

// function prePopulatePlayerName() {
//     const savedName = loadPlayerName();
//     if (savedName) {
//         const usernameInput = document.getElementById('username');
//         if (usernameInput) {
//             usernameInput.value = savedName;
//             console.log('✅ Player name field pre-populated with saved name');
//             // Add clear button and indicator after pre-populating
//             setTimeout(() => {
//                 addClearNameButton();
//                 addSavedNameIndicator();
//             }, 100);
//         }
//     }
// }

// function addClearNameButton() {
//     const savedName = loadPlayerName();
//     if (savedName) {
//         const usernameInput = document.getElementById('username');
//         if (usernameInput && !document.getElementById('clearNameBtn')) {
//             // Create a small clear button
//             const clearBtn = document.createElement('button');
//             clearBtn.id = 'clearNameBtn';
//             clearBtn.type = 'button';
//             clearBtn.textContent = '✕';
//             clearBtn.title = 'Clear saved name';
//             clearBtn.style.cssText = `
//                 position: absolute;
//                 right: 10px;
//                 top: 50%;
//                 transform: translateY(-50%);
//                 background: #ff4757;
//                 color: white;
//                 border: none;
//                 border-radius: 50%;
//                 width: 20px;
//                 height: 20px;
//                 font-size: 12px;
//                 cursor: pointer;
//                 display: flex;
//                 align-items: center;
//                 justify-content: center;
//                 z-index: 10;
//             `;

//             // Add hover effect
//             clearBtn.addEventListener('mouseenter', () => {
//                 clearBtn.style.background = '#ff3742';
//             });
//             clearBtn.addEventListener('mouseleave', () => {
//                 clearBtn.style.background = '#ff4757';
//             });

//             // Add click handler
//             clearBtn.addEventListener('click', () => {
//                 clearPlayerName();
//                 usernameInput.value = '';
//                 clearBtn.remove();
//                 const savedIndicator = document.getElementById('savedNameIndicator');
//                 if (savedIndicator) {
//                     savedIndicator.remove();
//                 }
//                 console.log('✅ Player name cleared by user');
//             });

//             // Position the input container relatively if not already
//             const formGroup = usernameInput.closest('.form-group');
//             if (formGroup) {
//                 formGroup.style.position = 'relative';
//                 formGroup.appendChild(clearBtn);
//             }
//         }
//     }
// }

// function addSavedNameIndicator() {
//     const savedName = loadPlayerName();
//     if (savedName && !document.getElementById('savedNameIndicator')) {
//         const usernameInput = document.getElementById('username');
//         if (usernameInput) {
//             const formGroup = usernameInput.closest('.form-group');
//             if (formGroup) {
//                 const indicator = document.createElement('div');
//                 indicator.id = 'savedNameIndicator';
//                 indicator.textContent = '💾 Name will be remembered for next game';
//                 indicator.style.cssText = `
//                     font-size: 12px;
//                     color: #666;
//                     margin-top: 5px;
//                     display: flex;
//                     align-items: center;
//                     gap: 5px;
//                 `;

//                 // Insert after the input but before any existing elements
//                 formGroup.appendChild(indicator);
//             }
//         }
//     }
// }

// Event Listeners (Login form removed for trivia1 - users go directly to multiplayer lobby)
// document.getElementById('loginForm').addEventListener('submit', (e) => {
//     e.preventDefault();
//     handleLogin();
// });

// document.getElementById('startSoloBtn').addEventListener('click', (e) => {
//     e.preventDefault();
//     handleSoloLogin();
// });

// Login form elements removed for trivia1
// document.getElementById('username').addEventListener('input', (e) => {
//     const name = e.target.value.trim();
//     if (name) {
//         savePlayerName(name);
//         setTimeout(() => {
//             addClearNameButton();
//             addSavedNameIndicator();
//         }, 100);
//     } else {
//         const clearBtn = document.getElementById('clearNameBtn');
//         const savedIndicator = document.getElementById('savedNameIndicator');
//         if (clearBtn) clearBtn.remove();
//         if (savedIndicator) savedIndicator.remove();
//     }
// });

document.getElementById('startContestBtn').addEventListener('click', startContest);
document.getElementById('submitAnswer').addEventListener('click', lockAnswer);

// Multiplayer Event Listeners - Only modal functionality now
document.getElementById('startGameBtn').addEventListener('click', startMultiplayerGame);
document.getElementById('shareGameBtn').addEventListener('click', showShareLink);
document.getElementById('copyShareLinkBtn').addEventListener('click', copyShareLink);
document.getElementById('leaveGameBtn').addEventListener('click', leaveGameRoom);


async function createNewGame(e) {
    e.preventDefault();

    // Clean up any existing game state before creating new multiplayer game
    cleanupGameState();

    const gameName = document.getElementById('gameName').value;
    const difficulty = document.getElementById('gameDifficulty').value;
    const maxPlayers = parseInt(document.getElementById('maxPlayers').value);
    const questionsPerGame = parseInt(document.getElementById('questionsPerGame').value);

    try {
        const response = await fetch('/api/bible-games/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: gameName,
                difficulty: difficulty,
                maxPlayers: maxPlayers,
                questionsPerGame: questionsPerGame, // Dynamic questions count
                timePerQuestion: 15, // Slightly longer time per question
                playerName: gameState.currentUser.name
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ Multiplayer game created successfully:', result.game.id);
            gameState.isMultiplayer = true; // Set immediately when creating multiplayer game
            gameState.currentGame = result.game;
            gameState.isGameCreator = true;
            gameState.gameRoomId = result.game.id;

            // Join the game as creator (guest_id = 0)
            try {
                const joinResponse = await fetch(`/api/bible-games/${result.game.id}/join-guest`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        playerName: gameState.currentUser.name
                    })
                });

                const joinResult = await joinResponse.json();

                if (joinResult.success) {
                    gameState.currentParticipant = joinResult.participant;
                    // Show game room with participants
                    showGameRoom(result.game, result.participants || []);
                    startGameRoomUpdates();
                } else {
                    alert('Failed to join game: ' + joinResult.error);
                }
            } catch (joinError) {
                console.error('Error joining game:', joinError);
                alert('Game created but failed to join. Please try joining manually.');
            }
        } else {
            const errorMsg = result.error || 'Unknown error occurred';
            console.error('❌ Multiplayer game creation failed:', errorMsg);
            alert(`Game Creation Error: ${errorMsg}`);
        }
    } catch (error) {
        console.error('❌ Error creating multiplayer game:', error);
        alert(`Network Error: Failed to create game. Please check your connection and try again.`);
    }
}

async function loadAvailableGames() {
    try {
        const response = await fetch('/api/bible-games?status=waiting');
        const result = await response.json();

        const gamesContainer = document.getElementById('availableGames');

        if (!gamesContainer) {
            console.error('❌ Available games container not found');
            return;
        }

        if (result.success && result.games.length > 0) {
            const gamesHTML = result.games.map(game => `
                <div class="game-item" onclick="joinGame(${game.id})">
                    <h4>${game.name}</h4>
                    <p><strong>Difficulty:</strong> ${game.difficulty}</p>
                    <p><strong>Players:</strong> ${game.current_players}/${game.max_players}</p>
                    <p><strong>Created by:</strong> ${game.created_by_name}</p>
                </div>
            `).join('');

            // Double-check container still exists before setting innerHTML
            if (gamesContainer) {
                gamesContainer.innerHTML = `
                    <div class="available-games-list">
                        ${gamesHTML}
                    </div>
                `;
            }
        } else {
            // Double-check container still exists before setting innerHTML
            if (gamesContainer) {
                gamesContainer.innerHTML = '<p>No games available. Create a new game to get started!</p>';
            }
        }

        // Update lobby stats if function exists
        if (typeof updateLobbyStats === 'function') {
            updateLobbyStats();
        }
    } catch (error) {
        console.error('Error loading games:', error);
        const gamesContainer = document.getElementById('availableGames');
        if (gamesContainer) {
            gamesContainer.innerHTML = '<p>Error loading games. Please try again.</p>';
        }
    }
}

async function loadBrowseGames() {
    try {
        console.log('🔍 loadBrowseGames: Starting to load browse games...');

        // Wait for the modal to be fully rendered
        let gamesContainer = null;
        let attempts = 0;
        const maxAttempts = 10;

        while (!gamesContainer && attempts < maxAttempts) {
            gamesContainer = document.getElementById('browseGamesList');
            if (!gamesContainer) {
                console.log(`🔍 loadBrowseGames: Waiting for container (attempt ${attempts + 1}/${maxAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 50));
                attempts++;
            }
        }

        if (!gamesContainer) {
            console.error('❌ Browse games container not found after waiting');
            console.log('🔍 loadBrowseGames: Available elements with "browse" in ID:', Array.from(document.querySelectorAll('[id*="browse"]')).map(el => el.id));
            console.log('🔍 loadBrowseGames: All elements with "games" in ID:', Array.from(document.querySelectorAll('[id*="games"]')).map(el => el.id));
            console.log('🔍 loadBrowseGames: Modal active state:', document.getElementById('browseGamesModal')?.classList.contains('active'));
            return;
        }

        console.log('✅ loadBrowseGames: Container found, proceeding...');

        const response = await fetch('/api/bible-games?status=waiting');
        const result = await response.json();

        console.log('🔍 loadBrowseGames: API response received:', result);

        if (result.success && result.games.length > 0) {
            const gamesHTML = result.games.map(game => `
                <div class="game-item" onclick="joinGame(${game.id}); closeModal('browseGamesModal'); closeModal('joinGameModal');">
                    <h4>${game.name}</h4>
                    <p><strong>Difficulty:</strong> ${game.difficulty}</p>
                    <p><strong>Players:</strong> ${game.current_players}/${game.max_players}</p>
                    <p><strong>Created by:</strong> ${game.created_by_name}</p>
                    <button class="btn join-game-btn" onclick="event.stopPropagation(); joinGame(${game.id}); closeModal('browseGamesModal'); closeModal('joinGameModal');">Join Game</button>
                </div>
            `).join('');

            // Double-check container still exists before setting innerHTML
            if (gamesContainer) {
                gamesContainer.innerHTML = gamesHTML;
            }
        } else {
            // Double-check container still exists before setting innerHTML
            if (gamesContainer) {
                gamesContainer.innerHTML = '<div class="no-games-message"><p>No games available. Create a new game to get started!</p></div>';
            }
        }
    } catch (error) {
        console.error('Error loading browse games:', error);
        const gamesContainer = document.getElementById('browseGamesList');
        if (gamesContainer) {
            gamesContainer.innerHTML = '<div class="error-message"><p>Error loading games. Please try again.</p></div>';
        }
    }
}

async function joinGame(gameId) {
    try {
        // Check if user has a name set - first check for authenticated user
        if (window.authenticatedUser && window.authenticatedUser.name) {
            console.log('🔐 Authenticated user detected, using account name:', window.authenticatedUser.name);
            gameState.currentUser = {
                name: window.authenticatedUser.name,
                difficulty: 'easy', // Default difficulty
                score: 0,
                correctAnswers: 0
            };
        } else if (!gameState.currentUser || !gameState.currentUser.name) {
            console.log('🔗 No user name found, prompting for name before joining...');
            // Store the game ID for joining after name is entered
            gameState.pendingJoinGameId = gameId;

            // Use professional inline prompt instead of basic browser prompt
            const playerName = await showProfessionalNamePrompt();

            if (!playerName || !playerName.trim()) {
                try {
                    alert('Name is required to join the game.');
                } catch (alertError) {
                    console.warn('Alert failed, showing inline message:', alertError);
                    showInlineMessage('Name is required to join the game.');
                }
                return;
            }

            // Set the user name
            gameState.currentUser = {
                name: playerName.trim(),
                difficulty: 'easy', // Default difficulty
                score: 0,
                correctAnswers: 0
            };

            // Save the player name to localStorage
            savePlayerName(playerName.trim());

            console.log('✅ User name set:', gameState.currentUser.name);
        }

        // Use guest join endpoint for multiplayer games
        const response = await fetch(`/api/bible-games/${gameId}/join-guest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                playerName: gameState.currentUser.name
            })
        });

        const result = await response.json();

        if (result.success) {
            gameState.isMultiplayer = true; // Set immediately when joining multiplayer game
            gameState.currentGame = result.game;
            gameState.currentParticipant = result.participant;
            gameState.gameRoomId = gameId;
            gameState.isGameCreator = false;

            // Clear pending join
            gameState.pendingJoinGameId = null;

            // Show game room with participants
            showGameRoom(result.game, result.participants || []);
            startGameRoomUpdates();
        } else {
            alert('Failed to join game: ' + result.error);
        }
    } catch (error) {
        console.error('Error joining game:', error);
        alert('Failed to join game. Please try again.');
    }
}

function showGameRoom(game, participants = []) {
    document.getElementById('roomTitle').textContent = `Game Room: ${game.name}`;
    document.getElementById('roomGameName').textContent = game.name;
    document.getElementById('roomDifficulty').textContent = game.difficulty;
    document.getElementById('roomStatus').textContent = game.status;

    // Open game room modal
    openModal('gameRoomModal');

    updatePlayersList(game, participants);
}

function updatePlayersList(game, participants = []) {
    document.getElementById('playerCount').textContent = game.current_players;
    document.getElementById('maxPlayerCount').textContent = game.max_players;

    // Show start button for game creator when there are enough players
    const startBtn = document.getElementById('startGameBtn');
    const isCreator = gameState.currentParticipant && gameState.currentParticipant.is_creator;
    if (isCreator && game.current_players >= 1) {
        startBtn.style.display = 'inline-block';
    } else {
        startBtn.style.display = 'none';
    }

    // Update players list display
    const playersListContainer = document.getElementById('playersList');
    if (playersListContainer && participants.length > 0) {
        const playersHTML = participants.map(participant => `
            <div class="player-item">
                <div>
                    <span class="player-name">${participant.player_name}</span>
                    <span class="player-status">Score: ${participant.score}</span>
                </div>
                ${participant.is_creator ? '<span>👑 Creator</span>' : ''}
            </div>
        `).join('');

        playersListContainer.innerHTML = playersHTML;
    }
}

function startGameRoomUpdates() {
    logger.log('Starting optimized game room updates for gameId:', gameState.gameRoomId);

    // Set up a fallback timeout for guests (in case status doesn't update properly)
    if (!gameState.isGameCreator) {
        setTimeout(() => {
            if (gameState.gameRoomId && !gameState.gameActive) {
                clearInterval(gameState.gameUpdateInterval);
                multiplayerLobbySection.classList.remove('section-active');
                loadingSection.classList.add('section-active');
                startProgressSimulation(gameState.gameRoomId);
            }
        }, 3000);
    }

    // Optimized polling with reduced frequency and consolidated checks
    let pollCycleCount = 0;
    let lastProgressCheck = 0;
    const PROGRESS_CHECK_INTERVAL = 3; // Reduced from 4 for better responsiveness

    gameState.gameUpdateInterval = setInterval(async () => {
        if (!gameState.gameUpdateInterval || gameState.gameActive) {
            return;
        }

        pollCycleCount++;

        if (gameState.gameRoomId) {
            try {
                const response = await throttledFetch(`/api/bible-games/${gameState.gameRoomId}`);

                if (!response.ok) {
                    logger.warn('Game room poll failed with status:', response.status);
                    return;
                }

                const result = await response.json();

                if (result.success) {
                    const game = result.game;
                    const participants = result.participants;

                    // Update UI elements
                    const statusElement = document.getElementById('roomStatus');
                    if (statusElement) statusElement.textContent = game.status;

                    updatePlayersList(game, participants);

                    // Optimized progress checking - less frequent but more efficient
                    const shouldCheckProgress = game.status === 'starting' && game.questions_per_game &&
                                               (pollCycleCount - lastProgressCheck) >= PROGRESS_CHECK_INTERVAL;

                    if (shouldCheckProgress) {
                        lastProgressCheck = pollCycleCount;
                        try {
                            const progressResponse = await throttledFetch(`/api/bible-games/${gameState.gameRoomId}/progress`);
                            if (progressResponse.ok) {
                                const progressResult = await progressResponse.json();
                                if (progressResult.success && progressResult.progress?.isReady) {
                                    if (game.status === 'completed') {
                                        clearInterval(gameState.gameUpdateInterval);
                                        gameState.gameUpdateInterval = null;
                                    }
                                }
                            }
                        } catch (progressError) {
                            logger.error('Error checking question progress:', progressError);
                        }
                    }

                    // Handle game status changes
                    if (game.status === 'cancelled') {
                        clearInterval(gameState.gameUpdateInterval);
                        gameState.gameUpdateInterval = null;

                        // Reset state and return to lobby
                        gameState.currentGame = null;
                        gameState.currentParticipant = null;
                        gameState.gameRoomId = null;
                        gameState.isGameCreator = false;
                        gameState.isMultiplayer = false;

                        const gameRoom = document.getElementById('gameRoom');
                        const gameModeSelection = document.querySelector('.game-mode-selection');
                        if (gameRoom) gameRoom.style.display = 'none';
                        if (gameModeSelection) gameModeSelection.style.display = 'flex';

                        const shareContainer = document.getElementById('shareLinkContainer');
                        if (shareContainer) shareContainer.style.display = 'none';

                        return;
                    }
                }
            } catch (error) {
                logger.error('Error updating game room:', error);
            }
        } else {
            clearInterval(gameState.gameUpdateInterval);
            gameState.gameUpdateInterval = null;
        }
    }, PERFORMANCE_CONFIG.maxPollingFrequency);

    // Safety timeout - reduced from 30 seconds for better performance
    setTimeout(() => {
        if (gameState.gameUpdateInterval) {
            clearInterval(gameState.gameUpdateInterval);
            gameState.gameUpdateInterval = null;
        }
    }, 20000);
}

async function startMultiplayerGame() {
    if (!gameState.gameRoomId) {
        console.error('No game room ID available');
        return;
    }

    // Production: Removed console logs for cleaner output
    // console.log('🚀 Starting multiplayer game...');
    // console.log('Game room ID:', gameState.gameRoomId);
    // console.log('Current participant:', gameState.currentParticipant);

    // Switch to loading section immediately like solo mode
    multiplayerLobbySection.classList.remove('section-active');
    loadingSection.classList.add('section-active');

    // Start progress simulation
    startProgressSimulation(gameState.gameRoomId);

    // Hide support button when entering loading section for gameplay
    updateSupportButtonVisibility();

    try {
        // Use guest start endpoint for multiplayer games
        // console.log('📡 Calling start-guest API endpoint...');

        // Add timeout for the request with enhanced error handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 300 second timeout (5 minutes)

        let response;
        try {
            response = await fetch(`/api/bible-games/${gameState.gameRoomId}/start-guest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    guestId: gameState.currentParticipant.guest_id
                }),
                signal: controller.signal
            });
        } catch (fetchError) {
            clearTimeout(timeoutId);

            if (fetchError.name === 'AbortError') {
                console.error('🚫 Request timed out after 300 seconds');
                showRetryModal('Request Timeout', 'The server is taking too long to respond. This might be due to server load. Click retry to try again.');
                return;
            } else {
                console.error('🚫 Network error during request:', fetchError);
                showRetryModal('Network Error', 'Failed to connect to the server. Check your internet connection and try again.');
                return;
            }
        }

        clearTimeout(timeoutId);
        // console.log('📡 Start game API response status:', response.status);

        // Enhanced status code handling for Cloudflare errors - MUST HANDLE 524 FIRST
        if (response.status === 524) {
            console.error('🚫 Cloudflare 524 Timeout Error: Server timed out responding');
            console.error('Response details:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });
            showRetryModal('Server Timeout (524)', 'The server is overloaded and timed out. This is a known Cloudflare issue. Click retry to wait for server recovery and try again.');
            return;
        }

        if (response.status === 500) {
            console.error('🚫 Server 500 Internal Server Error');
            console.error('Response details:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });
            showRetryModal('Server Error (500)', 'The server encountered an internal error. This might be due to "too many subrequests" limitation. Click retry to try again in 2-3 minutes.');
            return;
        }

        if (response.status === 502 || response.status === 503) {
            console.error(`🚫 Server ${response.status} Error: Bad Gateway/Service Unavailable`);
            console.error('Response details:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });
            showRetryModal(`Server Error (${response.status})`, 'The server is temporarily unavailable. Click retry to try again when the site recovers.');
            return;
        }

        if (!response.ok) {
            console.error(`🚫 HTTP ${response.status} Error`);
            console.error('Response details:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });
            showRetryModal(`Server Error (${response.status})`, `Unexpected server response (${response.status}). The server is overloaded or having issues. Click retry to try again later.`);
            return;
        }

        // Add proper error handling for JSON parsing
        let result;
        try {
            const responseText = await response.text();
            if (!responseText || responseText.trim() === '') {
                console.error('🚫 Empty response from server');
                showRetryModal('Server Error', 'Server returned an empty response. This indicates a backend issue. Click retry to try again.');
                return;
            }

            // Check content type
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('🚫 Non-JSON response detected');
                console.error('Response content:', responseText.substring(0, 500) + '...');

                // Check if it's a Cloudflare error page
                if (responseText.includes('cloudflare') && responseText.includes('timeout')) {
                    console.error('🚫 Cloudflare timeout error page detected');
                    showRetryModal('Cloudflare Timeout', 'Cloudflare detected a server overload. Click retry to try again when the server recovers.');
                    return;
                }

                throw new Error('Server returned non-JSON response');
            }

            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ JSON parse error:', parseError);
            console.error('❌ Response status:', response.status);
            console.error('❌ Response headers:', Object.fromEntries(response.headers.entries()));

            if (parseError.message.includes('Non-JSON response')) {
                showRetryModal('Invalid Response Format', 'Server returned an unexpected format. This might be an HTML error page. Click retry to try again.');
                return;
            } else if (parseError.message.includes('Empty response')) {
                showRetryModal('Empty Response', 'Server returned no data. Click retry to try again.');
                return;
            } else {
                showRetryModal('Parse Error', 'Failed to process server response. Click retry to try again.');
                return;
            }
        }

        if (result.success) {
            // Let the progress simulation handle the transition for both creators and guests
            // console.log('✅ Game started successfully, waiting for progress simulation to complete...');
            // Don't call startMultiplayerGameplay directly - let progress simulation handle it
        } else {
            console.error('❌ Failed to start game:', result.error);

            // Handle specific server-side error messages
            if (result.error && result.error.includes('too many subrequests')) {
                console.error('🚫 Server error: "Too many subrequests" - Cloudflare limitation');
                showRetryModal('Server Overload', 'Server is at capacity ("too many subrequests" error). Click retry to wait for server recovery.');
            } else if (result.error && result.error.includes('timeout')) {
                console.error('🚫 Server error: Backend timeout');
                showRetryModal('Backend Timeout', 'The AI question generation timed out. Click retry to try with a smaller request or wait for server recovery.');
            } else {
                showRetryModal('Game Start Failed', `Failed to start the game: ${result.error || 'Unknown error'}. Click retry to try again.`);
            }
        }
    } catch (error) {
        console.error('❌ Error starting game:', error);

        // Enhanced catch block with specific error types
        if (error.message && error.message.includes('NetworkError')) {
            console.error('🚫 Network connection error');
            showRetryModal('Network Error', 'Lost connection to the server. Check your internet and click retry.');
        } else if (error.message && error.message.includes('timeout')) {
            console.error('🚫 Client-side timeout');
            showRetryModal('Request Timeout', 'Request timed out after 300 seconds. The server is overloaded. Click retry to try again.');
        } else {
            console.error('🚫 Unknown error:', error.message);
            showRetryModal('Unknown Error', `An unexpected error occurred: ${error.message}. Click retry to try again.`);
        }
    }
}

async function startMultiplayerGameplay(game) {
    // Production: Removed console logs for cleaner output
    // console.log('🎮 Starting multiplayer gameplay for game:', game.id);
    // console.log('🎮 Current user is creator:', gameState.isGameCreator);
    // console.log('🎮 Current questions in gameState:', gameState.questions?.length || 0);
    // console.log('🎮 Multiplayer flag status:', gameState.isMultiplayer);

    // Ensure multiplayer flag is maintained throughout the game
    gameState.isMultiplayer = true; // Double-check multiplayer flag is set

    // Stop the game room polling (not the progress simulation!)
    if (gameState.gameUpdateInterval) {
        clearInterval(gameState.gameUpdateInterval);
        gameState.gameUpdateInterval = null;
    }

    // DON'T stop progress simulation - let it run for everyone!
    // Both creators and guests need to see the same progress tracking flow

    // Switch to game section
    multiplayerLobbySection.classList.remove('section-active');
    loadingSection.classList.add('section-active');

    try {
        // Get questions from the API
        // console.log('📡 Fetching game data from API...');
        const response = await fetch(`/api/bible-games/${game.id}`);
        const result = await response.json();
        console.log('📡 Game data API result:', result);

        if (result.success) {
            // Ensure multiplayer flag is maintained throughout the game
            gameState.isMultiplayer = true; // Double-check multiplayer flag is set
            gameState.currentGame = game;

            // Use questions from server
            if (result.questions && result.questions.length > 0) {
                console.log('✅ Loading questions from server:', result.questions.length);
                // Convert server questions to client format
                gameState.questions = result.questions.map(q => ({
                    id: q.id,
                    text: q.question_text,
                    correctAnswer: q.correct_answer,
                    options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]'),
                    reference: q.bible_reference,
                    difficulty: q.difficulty,
                    points: q.points,
                    aiGenerated: q.ai_generated,
                    questionNumber: q.question_number,
                    uniqueId: `server-${q.id}`
                }));
                console.log('✅ Mapped questions:', gameState.questions.map(q => ({ id: q.id, questionNumber: q.questionNumber, text: q.text.substring(0, 50) })));
            } else {
                // Fallback: generate questions client-side if none from server
                console.error('❌ No questions available from server - game cannot proceed');
                throw new Error('Failed to load questions from server');
            }

            console.log('🎯 Questions loaded, transitioning to game section...');
            loadingSection.classList.remove('section-active');

            // Use exact same transition sequence as guests with 1 second delay
            setTimeout(() => {
                showCountdown(() => {
                    console.log('🎮 Game section activated, loading first question...');
                    gameSection.classList.add('section-active');
                    loadQuestion();
                    gameState.gameActive = true;
                });
            }, 1000); // Same 1 second delay as guests
        } else {
            throw new Error('Failed to load game data');
        }
    } catch (error) {
        console.error('❌ Error starting multiplayer game:', error);
        showRetryModal('Multiplayer Game Error', 'Failed to start the multiplayer game. Click retry to try again.');
        // Don't go back to lobby - let user retry
    }
}

async function leaveGameRoom() {
    if (gameState.gameRoomId && gameState.currentParticipant) {
        try {
            // Call leave endpoint
            await fetch(`/api/bible-games/${gameState.gameRoomId}/leave`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    guestId: gameState.currentParticipant.guest_id
                })
            });
        } catch (error) {
            console.error('Error leaving game:', error);
        }
    }

    if (gameState.gameUpdateInterval) {
        clearInterval(gameState.gameUpdateInterval);
    }

    gameState.currentGame = null;
    gameState.currentParticipant = null;
    gameState.gameRoomId = null;
    gameState.isGameCreator = false;
    gameState.isMultiplayer = false;

    // Hide share link container when leaving
    document.getElementById('shareLinkContainer').style.display = 'none';

    document.getElementById('gameRoom').style.display = 'none';
    document.querySelector('.game-mode-selection').style.display = 'flex';
}

function showShareLink() {
    if (!gameState.gameRoomId) {
        console.error('No game room ID available for sharing');
        return;
    }

    // Generate the share URL using query parameter instead of path parameter
    let shareUrl;
    try {
        // Try to use window.location properties with fallbacks
        const origin = window.location.origin || (window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : ''));
        const pathname = window.location.pathname || '/bible-trivia1.html';
        shareUrl = `${origin}${pathname}?join=${gameState.gameRoomId}`;
    } catch (e) {
        // Fallback for environments where window.location might not work
        shareUrl = `${window.location.protocol || 'https:'}//${window.location.hostname || 'localhost'}${window.location.pathname || '/bible-trivia1.html'}?join=${gameState.gameRoomId}`;
        console.warn('Using fallback URL generation:', e);
    }
    const shareLinkInput = document.getElementById('gameShareLink');

    shareLinkInput.value = shareUrl;

    // Show the share container
    const shareContainer = document.getElementById('shareLinkContainer');
    shareContainer.style.display = 'block';

    // Scroll to make it visible
    shareContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    console.log('🔗 Share link generated:', shareUrl);
}

async function copyShareLink() {
    const shareLinkInput = document.getElementById('gameShareLink');

    try {
        // Use modern clipboard API if available
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(shareLinkInput.value);
        } else {
            // Fallback for older browsers - use selection approach
            shareLinkInput.select();
            shareLinkInput.setSelectionRange(0, 99999); // For mobile devices

            // Try execCommand as fallback
            if (document.execCommand) {
                document.execCommand('copy');
            } else {
                throw new Error('Clipboard API not supported');
            }
        }

        // Provide visual feedback
        const copyBtn = document.getElementById('copyShareLinkBtn');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.style.background = '#4caf50';

        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '';
        }, 2000);

        console.log('✅ Share link copied to clipboard');
    } catch (error) {
        console.error('❌ Failed to copy share link:', error);

        // Enhanced fallback - show instruction without alert
        const copyBtn = document.getElementById('copyShareLinkBtn');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copy Manually';
        copyBtn.style.background = '#ff9800';

        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '';
        }, 3000);

        // Don't use alert, just log the instruction
        console.log('📋 Please manually copy the link: ' + shareLinkInput.value);
    }
}

async function startSoloGame(e) {
    e.preventDefault();

    closeModal('playSoloModal');

    // Get form values - but check for authenticated user first
    let playerName, difficulty, questionsPerGame;

    if (window.authenticatedUser && window.authenticatedUser.name) {
        console.log('🔐 Authenticated user detected for solo game, using account name:', window.authenticatedUser.name);
        playerName = window.authenticatedUser.name;
        difficulty = document.getElementById('soloDifficulty').value;
        questionsPerGame = parseInt(document.getElementById('soloQuestions').value);
    } else {
        const soloPlayerNameInput = document.getElementById('soloPlayerName');
        if (soloPlayerNameInput) {
            playerName = soloPlayerNameInput.value.trim();
            if (!playerName) {
                alert('Please enter your name');
                return;
            }
            // Save player name to localStorage only for non-authenticated users
            savePlayerName(playerName);
        } else {
            // For modal version, use prompt
            playerName = await showProfessionalNamePrompt();
            if (!playerName || !playerName.trim()) {
                return;
            }
            savePlayerName(playerName.trim());
        }
        difficulty = document.getElementById('soloDifficulty').value;
        questionsPerGame = parseInt(document.getElementById('soloQuestions').value);

        // Validate question count to prevent timeouts
        if (questionsPerGame > 15) {
            alert('⚠️ Warning: More than 15 questions may cause timeouts. Please select 15 or fewer questions for best performance.');
            return;
        }
    }

    // Set up user state
    gameState.currentUser = {
        name: playerName,
        difficulty: difficulty,
        score: 0,
        correctAnswers: 0
    };

    // Switch to single-player mode
    gameState.isMultiplayer = false;
    gameState.isSoloMode = true;
    multiplayerLobbySection.classList.remove('section-active');

    // Start solo game directly
    startSoloGameDirectly(questionsPerGame);
}

function startSoloGameFromLogin() {
    // Direct solo game start from login - bypass multiplayer lobby entirely
    gameState.isMultiplayer = false;
    gameState.isSoloMode = true;

    // Get question count from login form
    const questionsPerGame = parseInt(document.getElementById('soloQuestions').value);

    // Production: Removed console logs for cleaner output
    // console.log('🎯 Starting solo game with', questionsPerGame, 'questions');

    // Go directly to loading (login section removed for trivia1)
    loadingSection.classList.add('section-active');

    // Start solo game directly
    startSoloGameDirectly(questionsPerGame);

    // Hide support button when entering loading section for solo gameplay
    updateSupportButtonVisibility();
}

async function startSoloGameDirectly(questionsPerGame) {
    // Clean up any existing game state before starting new solo game
    cleanupGameState();

    loadingSection.classList.add('section-active');

    // Hide support button when entering loading section for solo gameplay
    updateSupportButtonVisibility();

    try {
        const createResponse = await fetch('/api/bible-games/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: `Solo Game - ${gameState.currentUser.name}`,
                difficulty: gameState.currentUser.difficulty,
                playerName: gameState.currentUser.name,
                maxPlayers: 1,
                questionsPerGame: questionsPerGame,
                timePerQuestion: 10,
                isSolo: true  // Add flag to indicate solo game
            })
        });

        const createResult = await createResponse.json();

        if (!createResult.success) {
            const errorMsg = createResult.error || 'Failed to create solo game';
            console.error('❌ Solo game creation failed:', errorMsg);
            throw new Error(`Game Creation Error: ${errorMsg}`);
        }

        // For solo games, create a simplified participant object
        const participant = createResult.participant || {
            guest_id: 0, // Always 0 for solo game creators
            player_name: gameState.currentUser.name,
            is_creator: true,
            score: 0,
            correct_answers: 0,
            finished_questions: 0
        };

        // Production: Removed console logs for cleaner output
        // console.log('✅ Solo game participant created:', participant);

        gameState.currentParticipant = participant;
        gameState.currentGame = createResult.game;
        gameState.isMultiplayer = false; // Explicitly set to false
        gameState.isSoloMode = true; // Set explicit solo mode flag

        // Start progress simulation now that we have the gameId
        startProgressSimulation(createResult.game.id);

        // Start the game (this will generate questions server-side)
        // console.log('🎯 Starting solo game with guest_id:', participant.guest_id);
        const startResponse = await fetch(`/api/bible-games/${createResult.game.id}/start-guest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                guestId: participant.guest_id
            })
        });

        const startResult = await startResponse.json();

        if (!startResult.success) {
            const errorMsg = startResult.error || 'Failed to start solo game';
            console.error('❌ Solo game start failed:', errorMsg);
            throw new Error(`Game Start Error: ${errorMsg}`);
        }

        // Fetch the game with questions
        const gameResponse = await fetch(`/api/bible-games/${createResult.game.id}`);
        const gameResult = await gameResponse.json();

        if (!gameResult.success) {
            const errorMsg = gameResult.error || 'Failed to load game data';
            console.error('❌ Game data loading failed:', errorMsg);
            throw new Error(`Game Data Error: ${errorMsg}`);
        }

        if (!gameResult.questions || gameResult.questions.length === 0) {
            console.error('❌ No questions found in game data');
            throw new Error('Question Loading Error: No questions were generated for this game. Please try again.');
        }

        // Set up game state
        gameState.questions = gameResult.questions.map(q => ({
            id: q.id,
            text: q.question_text,
            correctAnswer: q.correct_answer,
            options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]'),
            reference: q.bible_reference,
            difficulty: q.difficulty,
            points: q.points,
            aiGenerated: q.ai_generated,
            questionNumber: q.question_number,
            uniqueId: `server-${q.id}`
        }));

        loadingSection.classList.remove('section-active');

        showCountdown(() => {
            gameSection.classList.add('section-active');
            loadQuestion();
            gameState.gameActive = true;
        });

    } catch (error) {
        console.error('❌ Error starting solo game:', error);

        // Use retry modal instead of going back to lobby
        showRetryModal('Solo Game Error', `Failed to start solo game: ${error.message}. Click retry to try again.`);

        // Log additional debugging info
        console.error('🔍 Debug info:', {
            user: gameState.currentUser,
            isSoloMode: gameState.isSoloMode,
            isMultiplayer: gameState.isMultiplayer,
            questionsPerGame: questionsPerGame
        });
    }
}

async function waitForAllPlayersToFinish() {
    console.log('⏳ Starting wait for all players to finish...');

    // Transition to waiting screen
    gameSection.classList.remove('section-active');
    loadingSection.classList.add('section-active');
    document.getElementById('questionProgress').textContent = 'Submitting your results...';

    const currentPlayerId = gameState.currentParticipant?.guest_id;
    const currentPlayerName = gameState.currentUser?.name;
    const gameId = gameState.currentGame?.id;

    // STEP 1: Get the actual participant count from the game
    console.log('📊 Getting actual participant count...');
    let actualParticipantCount = 0;
    try {
        const gameResponse = await fetch(`/api/bible-games/${gameId}`);
        const gameResult = await gameResponse.json();

        if (gameResult.success) {
            actualParticipantCount = gameResult.participants.length;
            console.log(`📊 Found ${actualParticipantCount} actual participants in game`);
        } else {
            console.error('❌ Failed to get participant count:', gameResult.error);
            document.getElementById('questionProgress').textContent = 'Error: Could not get participant count. Please refresh and try again.';
            return;
        }
    } catch (error) {
        console.error('❌ Error getting participant count:', error);
        document.getElementById('questionProgress').textContent = 'Error: Could not get participant count. Please refresh and try again.';
        return;
    }

    // STEP 2: Mark current player as finished
    let markFinishedSuccess = false;
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const response = await fetch(`/api/bible-games/${gameId}/set-finished`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guestId: currentPlayerId })
            });

            if (response.ok) {
                markFinishedSuccess = true;
                console.log('✅ Player marked as finished');
                break;
            }
        } catch (error) {
            console.error(`Mark finished attempt ${attempt + 1} failed:`, error);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // STEP 3: Register current player in finished players JSON
    let registerSuccess = false;
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const response = await fetch(`/api/bible-games/${gameId}/register-finished`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guestId: currentPlayerId,
                    playerName: currentPlayerName
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    registerSuccess = true;
                    console.log('✅ Player registered in finished players JSON');
                    break;
                }
            }
        } catch (error) {
            console.error(`Registration attempt ${attempt + 1} failed:`, error);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!registerSuccess) {
        console.error('❌ Failed to register in finished players JSON');
        document.getElementById('questionProgress').textContent = 'Error: Could not register completion. Please refresh and try again.';
        return;
    }

    // Wait for server synchronization
    console.log('⏳ Waiting for server synchronization...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // STEP 4: Poll finished players JSON for completion using actual participant count
    let gameEnded = false;
    let pollCount = 0;
    let lastKnownFinishedCount = 0;
    let stableCountChecks = 0;

    const pollInterval = setInterval(async () => {
        pollCount++;

        try {
            // Poll the finished players endpoint
            const response = await fetch(`/api/bible-games/${gameId}/finished-players`);
            const result = await response.json();

            if (!result.success) {
                console.error('Failed to fetch finished players data');
                return;
            }

            const finishedPlayersData = result.finishedPlayersData;
            const currentFinishedCount = finishedPlayersData.finishedPlayers.length;
            const totalPlayers = actualParticipantCount; // Use actual participant count

            console.log(`📊 Poll ${pollCount}: ${currentFinishedCount}/${totalPlayers} players registered as finished (actual participants: ${totalPlayers})`);

            // Check if count is stable (hasn't changed for 2 checks)
            if (currentFinishedCount === lastKnownFinishedCount) {
                stableCountChecks++;
            } else {
                stableCountChecks = 0;
                lastKnownFinishedCount = currentFinishedCount;
            }

            // Determine if game is complete with stability check
            const isComplete = (currentFinishedCount >= totalPlayers && stableCountChecks >= 2);

            if (isComplete) {
                console.log('🎉 All players confirmed finished!');
                clearInterval(pollInterval);

                // Final wait for any last updates
                await new Promise(resolve => setTimeout(resolve, 1500));

                document.getElementById('questionProgress').textContent = 'Loading final results...';
                await new Promise(resolve => setTimeout(resolve, 1000));
                endGame();
                gameEnded = true;
                return;
            }

            // Update waiting message with accurate count
            const waitingFor = totalPlayers - currentFinishedCount;
            if (waitingFor > 0) {
                let message = `✅ You're done! Waiting for ${waitingFor} player${waitingFor === 1 ? '' : 's'}`;
                document.getElementById('questionProgress').textContent = message + '...';
            } else {
                document.getElementById('questionProgress').textContent = 'Verifying all players finished...';
            }

        } catch (error) {
            console.error(`Poll error:`, error);
        }
    }, 1500); // Poll every 1.5 seconds

    // Safety timeout - prevent infinite waiting
    setTimeout(() => {
        if (!gameEnded && pollInterval) {
            clearInterval(pollInterval);
            console.log('⏰ Maximum wait time reached - ending game');

            // Try to force complete
            fetch(`/api/bible-games/${gameId}/force-complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guestId: currentPlayerId })
            }).finally(() => {
                endGame();
            });
        }
    }, 20000); // 20 seconds max wait
}

// Professional name prompt for game joining
async function showProfessionalNamePrompt() {
    // Don't show name prompt if we're in the middle of creating a game
    const createModal = document.getElementById('createMultiplayerModal');
    if (createModal && createModal.classList.contains('active')) {
        console.log('🔒 Create game modal is active, skipping name prompt');
        return null;
    }

    return new Promise((resolve) => {
        // Create professional modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'professional-modal-overlay';
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            backdrop-filter: blur(5px);
        `;

        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.className = 'professional-modal-container';
        modalContainer.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 450px;
            width: 90%;
            text-align: center;
            color: white;
            position: relative;
            animation: modalSlideIn 0.3s ease-out;
        `;

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-50px) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
        `;
        document.head.appendChild(style);

        // Create modal content
        modalContainer.innerHTML = `
            <div style="margin-bottom: 30px;">
                <div style="font-size: 60px; margin-bottom: 20px;">🎮</div>
                <h2 style="margin: 0 0 15px 0; font-size: 28px; font-weight: 600;">Join Bible Trivia</h2>
                <p style="margin: 0 0 30px 0; font-size: 16px; opacity: 0.9; line-height: 1.5;">
                    Enter your name to join this exciting multiplayer Bible trivia game!
                </p>
            </div>

            <div style="margin-bottom: 30px;">
                <input type="text"
                       id="professionalNameInput"
                       placeholder="Your display name"
                       style="
                           width: 100%;
                           padding: 16px 20px;
                           border: none;
                           border-radius: 12px;
                           font-size: 16px;
                           text-align: center;
                           background: rgba(255, 255, 255, 0.95);
                           color: #333;
                           box-sizing: border-box;
                           outline: none;
                           transition: all 0.3s ease;
                       "
                       maxlength="20">
            </div>

            <div style="display: flex; gap: 15px; justify-content: center;">
                <button id="professionalNameJoin"
                        style="
                            padding: 14px 30px;
                            background: #4CAF50;
                            color: white;
                            border: none;
                            border-radius: 12px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            min-width: 100px;
                        ">
                    Join Game
                </button>
                <button id="professionalNameCancel"
                        style="
                            padding: 14px 30px;
                            background: rgba(255, 255, 255, 0.2);
                            color: white;
                            border: 2px solid rgba(255, 255, 255, 0.3);
                            border-radius: 12px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            min-width: 100px;
                        ">
                    Cancel
                </button>
            </div>

            <div style="margin-top: 25px; font-size: 14px; opacity: 0.8;">
                <p>Choose a name that will be visible to other players</p>
            </div>
        `;

        modalOverlay.appendChild(modalContainer);
        document.body.appendChild(modalOverlay);

        // Add button hover effects
        const joinBtn = modalContainer.querySelector('#professionalNameJoin');
        const cancelBtn = modalContainer.querySelector('#professionalNameCancel');
        const nameInput = modalContainer.querySelector('#professionalNameInput');

        joinBtn.addEventListener('mouseenter', () => {
            joinBtn.style.background = '#45a049';
            joinBtn.style.transform = 'translateY(-2px)';
        });

        joinBtn.addEventListener('mouseleave', () => {
            joinBtn.style.background = '#4CAF50';
            joinBtn.style.transform = 'translateY(0)';
        });

        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.background = 'rgba(255, 255, 255, 0.3)';
            cancelBtn.style.transform = 'translateY(-2px)';
        });

        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.background = 'rgba(255, 255, 255, 0.2)';
            cancelBtn.style.transform = 'translateY(0)';
        });

        // Focus on input
        setTimeout(() => nameInput.focus(), 100);

        // Handle input events
        nameInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            joinBtn.style.opacity = value ? '1' : '0.6';
            joinBtn.disabled = !value;
        });

        // Handle Enter key
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && nameInput.value.trim()) {
                handleJoin();
            }
        });

        // Handle Join button
        joinBtn.addEventListener('click', handleJoin);

        // Handle Cancel button
        cancelBtn.addEventListener('click', handleCancel);

        function handleJoin() {
            const name = nameInput.value.trim();
            if (name) {
                cleanup();
                resolve(name);
            }
        }

        function handleCancel() {
            cleanup();
            resolve(null);
        }

        function cleanup() {
            modalOverlay.remove();
            style.remove();
        }

        // Close on background click
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                handleCancel();
            }
        });
    });
}

// Helper functions for Cloudflare compatibility
function showInlineNamePrompt() {
    // Create a simple inline prompt as fallback for when native prompt fails
    const promptContainer = document.createElement('div');
    promptContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    const promptBox = document.createElement('div');
    promptBox.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        max-width: 400px;
        width: 90%;
        text-align: center;
    `;

    promptBox.innerHTML = `
        <h3 style="margin-bottom: 20px; color: #764ba2;">Enter Your Name</h3>
        <p style="margin-bottom: 20px;">Please enter your name to join the game:</p>
        <input type="text" id="inlineNameInput" placeholder="Your name" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; margin-bottom: 20px; font-size: 16px;">
        <div style="display: flex; gap: 10px;">
            <button id="inlineNameOk" style="flex: 1; padding: 12px; background: #764ba2; color: white; border: none; border-radius: 8px; cursor: pointer;">OK</button>
            <button id="inlineNameCancel" style="flex: 1; padding: 12px; background: #ccc; color: #333; border: none; border-radius: 8px; cursor: pointer;">Cancel</button>
        </div>
    `;

    promptContainer.appendChild(promptBox);
    document.body.appendChild(promptContainer);

    return new Promise((resolve) => {
        const input = document.getElementById('inlineNameInput');
        const okBtn = document.getElementById('inlineNameOk');
        const cancelBtn = document.getElementById('inlineNameCancel');

        const cleanup = () => {
            document.body.removeChild(promptContainer);
        };

        okBtn.addEventListener('click', () => {
            const name = input.value.trim();
            cleanup();
            resolve(name);
        });

        cancelBtn.addEventListener('click', () => {
            cleanup();
            resolve(null);
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const name = input.value.trim();
                cleanup();
                resolve(name);
            }
        });

        input.focus();
    });
}

function showInlineMessage(message) {
    // Create a simple inline message as fallback for when alert fails
    const messageContainer = document.createElement('div');
    messageContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        max-width: 300px;
        font-size: 14px;
        line-height: 1.4;
    `;

    messageContainer.textContent = message;
    document.body.appendChild(messageContainer);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageContainer.parentNode) {
            messageContainer.parentNode.removeChild(messageContainer);
        }
    }, 5000);
}

// Make joinGame function global so it can be called from onclick
window.joinGame = joinGame;

// Handle URL parameters for direct game joining
function handleUrlJoin() {
    // Only handle URL joining if we're not in the middle of creating a game
    if (document.getElementById('createMultiplayerModal').classList.contains('active')) {
        console.log('🔒 Create game modal is active, skipping URL join handling');
        return;
    }

    let gameId = null;
    try {
        const urlParams = new URLSearchParams(window.location.search);
        gameId = urlParams.get('join');
    } catch (e) {
        // Fallback for environments where URLSearchParams might not work
        console.warn('URLSearchParams failed, using fallback:', e);
        const search = window.location.search || '';
        const match = search.match(/[?&]join=([^&]+)/);
        gameId = match ? match[1] : null;
    }

    if (gameId) {
        console.log('🔗 Direct join detected for game ID:', gameId);
        console.log('🔗 Current URL:', window.location.href);

        // Switch to multiplayer lobby (login section removed for trivia1)
        multiplayerLobbySection.classList.add('section-active');

        // Try to join the game directly
        setTimeout(() => {
            joinGame(gameId);
        }, 1000); // Small delay to ensure page is loaded
    }
}

// Set up MutationObserver to detect when support container is removed
function setupSupportContainerObserver() {
    try {

        const observer = new MutationObserver((mutations) => {
            let supportContainerRemoved = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // Check if support container was removed from body
                    mutation.removedNodes.forEach((node) => {
                        if (node.nodeType === 1 && node.classList && node.classList.contains('support-container')) {
                            console.log('⚠️ Support container was removed from DOM, recreating...');
                            supportContainerRemoved = true;
                        }
                    });

                    // Also check if support container was moved or hidden
                    if (!supportContainerRemoved) {
                        const supportContainer = document.querySelector('.support-container');
                        if (supportContainer && (supportContainer.parentNode !== document.body ||
                        supportContainer.style.display === 'none' ||
                        supportContainer.style.visibility === 'hidden' ||
                        supportContainer.style.opacity === '0')) {
                            supportContainerRemoved = true;
                        }
                    }
                }
            });

            // If support container was removed, moved, or hidden, recreate/fix it immediately
            if (supportContainerRemoved) {
                ensureSupportContainerExists();
            }
        });

        // Start observing the body for changes with more comprehensive options
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });

    } catch (error) {
        console.error('❌ Error setting up support container observer:', error);
        // Fallback: use periodic checks if MutationObserver fails
        console.log('🔄 Falling back to periodic DOM checks...');
        setInterval(() => {
            const supportContainer = document.querySelector('.support-container');
            if (!supportContainer || supportContainer.parentNode !== document.body ||
                supportContainer.style.display === 'none' ||
                supportContainer.style.visibility === 'hidden' ||
                supportContainer.style.opacity === '0') {
                console.log('🔧 Periodic check: Support container missing or hidden, recreating...');
                ensureSupportContainerExists();
            }
        }, 3000); // Check every 3 seconds as fallback
    }
}

// Enhanced initialization function for support button
function initializeSupportButton() {

    // Check if we're currently in any non-lobby section
    const isInNonLobbySection = document.querySelector('.game-section.section-active') ||
                               document.querySelector('.results-section.section-active') ||
                               document.querySelector('.loading-section.section-active');

    if (isInNonLobbySection) {
        console.log('🎮 Non-lobby section detected - skipping support button initialization');
        return;
    }

    // Ensure support container exists immediately on page load
    const supportContainer = ensureSupportContainerExists();

    if (supportContainer) {

        // Set up observer to detect when support container is removed
        setupSupportContainerObserver();

        // Start the support button cycle only if not in gameplay
        startSupportButtonCycle();

    } else {
        console.error('❌ Failed to initialize support button system');
    }
}

// Check for join parameter on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize lobby filters
    initializeLobbyFilters();

    // Load available games for lobby
    loadAvailableGames();

    // Start periodic refresh of games list
    setInterval(loadAvailableGames, 30000); // Refresh every 30 seconds
});

// Initialize lobby filter event listeners
function initializeLobbyFilters() {
    const difficultyFilter = document.getElementById('difficultyFilter');
    const playersFilter = document.getElementById('playersFilter');
    const sortBy = document.getElementById('sortBy');

    if (difficultyFilter) {
        difficultyFilter.addEventListener('change', applyFiltersAndSort);
    }
    if (playersFilter) {
        playersFilter.addEventListener('change', applyFiltersAndSort);
    }
    if (sortBy) {
        sortBy.addEventListener('change', applyFiltersAndSort);
    }
}

// Set up section change observer for support button visibility
function setupSectionChangeObserver() {

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
                // Check if section-active class has changed
                const wasInGameplay = mutation.oldValue && (mutation.oldValue.includes('game-section section-active') ||
                                                          mutation.oldValue.includes('loading-section section-active') ||
                                                          mutation.oldValue.includes('results-section section-active'));
                const isInGameplay = document.querySelector('.game-section.section-active') ||
                                   document.querySelector('.results-section.section-active') ||
                                   (document.querySelector('.loading-section.section-active') && gameState.gameActive);

                if (wasInGameplay !== isInGameplay) {
                    updateSupportButtonVisibility();
                }
            }
        });
    });

    // Observe the container for section changes
    const container = document.querySelector('.container');
    if (container) {
        observer.observe(container, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class'],
            attributeOldValue: true
        });
    } else {
        console.error('❌ Container not found for section observer');
    }
}

window.addEventListener('load', () => {
    // Pre-populate player name from localStorage (removed for trivia1)
    // prePopulatePlayerName();

    // Initialize support button system
    initializeSupportButton();

    // Set up section change observer
    setupSectionChangeObserver();

    // Handle direct game joining via URL
    handleUrlJoin();

    // Start periodic cleanup for expired game rooms
    //startPeriodicCleanup();

    // Load global leaderboard
    loadGlobalLeaderboard();
});

// Stop support button cycle and cleanup when page unloads to prevent memory leaks
window.addEventListener('beforeunload', () => {
    stopSupportButtonCycle();
    stopPeriodicCleanup();
});

// Frontend cleanup for expired game rooms
let cleanupInterval = null;
let availableGamesCache = []; // Cache for available games list

// Function to cleanup expired game rooms from frontend
async function cleanupExpiredGameRoomsFrontend() {
    try {

        // Call the backend cleanup endpoint
        const response = await fetch('/api/bible-games/cleanup-expired', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                hoursOld: 2 // Clean up rooms older than 2 hours
            })
        });

        const result = await response.json();

        if (result.success) {
            const cleanup = result.cleanup;

            // Detailed logging of what was cleaned up
            if (cleanup.gamesDeleted > 0) {
                console.log(`🗑️ Deleted ${cleanup.gamesDeleted} expired game rooms`);
                console.log(`👥 Deleted ${cleanup.participantsDeleted} participant records`);
                console.log(`❓ Deleted ${cleanup.questionsDeleted} question records`);
                console.log(`📝 Deleted ${cleanup.historyDeleted} history records`);
            } else {
                console.log('✅ No expired game rooms found to clean up');
            }

            // If we're in the multiplayer lobby, refresh the available games list
            if (multiplayerLobbySection.classList.contains('section-active')) {
                await loadAvailableGames();
            }

            // Verify cleanup worked by checking if there are still old games
            try {
                const statusResponse = await fetch('/api/bible-games/cleanup-status');
                const statusResult = await statusResponse.json();

                if (statusResult.success && statusResult.cleanup) {
                    const remainingGames = statusResult.cleanup.gamesToDelete || 0;
                    if (remainingGames === 0) {
                        console.log('✅ Verification: No old games remaining - cleanup was successful!');
                    } else {
                        console.log(`⚠️ Warning: ${remainingGames} old games still remain - manual check needed`);
                    }
                }
            } catch (verifyError) {
                console.warn('⚠️ Could not verify cleanup status:', verifyError.message);
            }

            return cleanup;
        } else {
            console.error('❌ Frontend cleanup failed:', result.error);
            console.error('❌ Error details:', result);
            return null;
        }
    } catch (error) {
        console.error('❌ Error during frontend cleanup:', error);
        console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
        return null;
    }
}

// Optimized periodic cleanup with reduced frequency and logging
function startPeriodicCleanup() {
    if (cleanupInterval) {
        clearInterval(cleanupInterval);
    }

    logger.log('Starting optimized periodic cleanup system');

    // Reduced frequency for better performance - every 15 minutes instead of 10
    cleanupInterval = setInterval(async () => {
        await cleanupExpiredGameRoomsFrontend();
    }, 900000); // 15 minutes

    // Run cleanup after longer delay on start
    setTimeout(async () => {
        await cleanupExpiredGameRoomsFrontend();
    }, 10000); // Wait 10 seconds after page load
}

// Function to stop periodic cleanup
function stopPeriodicCleanup() {
    if (cleanupInterval) {
        console.log('⏹️ Stopping periodic cleanup system...');
        clearInterval(cleanupInterval);
        cleanupInterval = null;
        console.log('✅ Periodic cleanup stopped successfully');
    } else {
        console.log('ℹ️ Periodic cleanup was not running');
    }
}

// Function to manually trigger cleanup (can be called from UI)
async function manualCleanupExpiredRooms() {
    try {
        console.log('🧹 Manual cleanup triggered by user...');
        console.log('🕐 Starting manual cleanup process...');

        const result = await cleanupExpiredGameRoomsFrontend();

        if (result) {
            // Show detailed success message to user
            let message = '🧹 Cleanup completed successfully!';

            if (result.gamesDeleted > 0) {
                message += `\n📊 Removed: ${result.gamesDeleted} games, ${result.participantsDeleted} participants, ${result.questionsDeleted} questions, ${result.historyDeleted} history records.`;
            } else {
                message += '\n✅ No expired game rooms found to clean up.';
            }

            console.log('✅ Manual cleanup completed:', result);
            showInlineMessage(message);

            // Refresh available games list if in multiplayer lobby
            if (multiplayerLobbySection.classList.contains('section-active')) {
                console.log('🔄 Refreshing games list after manual cleanup...');
                await loadAvailableGames();
                console.log('✅ Games list refreshed after manual cleanup');
            }
        } else {
            console.error('❌ Manual cleanup returned null result');
            showInlineMessage('❌ Cleanup failed. Please try again later.');
        }
    } catch (error) {
        console.error('❌ Manual cleanup error:', error);
        console.error('❌ Error details:', error.message);
        console.error('❌ Stack trace:', error.stack);
        showInlineMessage('❌ Cleanup failed. Please try again later.');
    }
}

// Function to get cleanup status (preview what would be cleaned)
async function getCleanupStatus() {
    try {
        console.log('🔍 Getting cleanup status preview...');
        console.log('🔍 Checking what would be cleaned up...');

        const response = await fetch('/api/bible-games/cleanup-status');
        const result = await response.json();

        if (result.success) {
            const cleanup = result.cleanup;
            console.log('✅ Cleanup status retrieved successfully');
            console.log('📊 Preview of what would be cleaned:', cleanup);

            if (cleanup.gamesToDelete && cleanup.gamesToDelete.length > 0) {
                console.log(`🎯 Would delete ${cleanup.gamesToDelete.length} expired game rooms`);
                console.log('📋 Games to delete:', cleanup.gamesToDelete.map(g => `${g.id}("${g.name}" - ${g.status})`));
            } else {
            }

            return cleanup;
        } else {
            console.error('❌ Failed to get cleanup status:', result.error);
            console.error('❌ Error details:', result);
            return null;
        }
    } catch (error) {
        console.error('❌ Error getting cleanup status:', error);
        console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
        return null;
    }
}

// Make manual cleanup function available globally
window.manualCleanupExpiredRooms = manualCleanupExpiredRooms;
window.getCleanupStatus = getCleanupStatus;

// Make performance monitor available globally for debugging
window.getPerformanceReport = () => performanceMonitor.logReport();
window.resetPerformanceMetrics = () => {
    performanceMonitor.metrics = {
        apiCalls: 0,
        cacheHits: 0,
        domOperations: 0,
        memoryUsage: 0,
        pollingOperations: 0
    };
    performanceMonitor.startTime = Date.now();
    logger.log('📊 Performance metrics reset');
};

// Function to manually check and restore support button
function checkAndRestoreSupportButton() {
    console.log('🔍 Manual support button check requested...');

    const supportContainer = document.querySelector('.support-container');
    if (!supportContainer) {
        console.log('🔧 Support button missing, recreating...');
        ensureSupportContainerExists();
    } else {
        console.log('✅ Support button found and appears to be working');
        // Ensure it's visible
        supportContainer.style.opacity = '1';
        supportContainer.style.transform = 'translateY(0) scale(1)';
        supportContainer.style.display = 'flex';
    }

    return supportContainer !== null;
}

// Make support button check function available globally
window.checkAndRestoreSupportButton = checkAndRestoreSupportButton;

// Enhanced loadAvailableGames with caching and filtering
let allGamesCache = [];
let filteredGamesCache = [];

async function loadAvailableGames() {
    try {
        const response = await fetch('/api/bible-games?status=waiting');
        const result = await response.json();

        if (result.success) {
            // Update cache
            allGamesCache = result.games;
            filteredGamesCache = [...allGamesCache]; // Initialize filtered cache

            updateLobbyStats();
            displayFilteredGames();
        } else {
            console.error('Error loading games:', result.error);
            const gamesList = document.getElementById('activeGamesList');
            if (gamesList) {
                gamesList.innerHTML = '<div class="empty-games"><h4>⚠️ Error Loading Games</h4><p>Please try refreshing the page.</p></div>';
            }
        }
    } catch (error) {
        console.error('Error loading games:', error);
        const gamesList = document.getElementById('activeGamesList');
        if (gamesList) {
            gamesList.innerHTML = '<div class="empty-games"><h4>⚠️ Connection Error</h4><p>Unable to load games. Please check your connection.</p></div>';
        }
    }
}

function updateLobbyStats() {
    // Ensure allGamesCache is defined
    if (!allGamesCache || !Array.isArray(allGamesCache)) {
        console.warn('⚠️ allGamesCache not available for lobby stats update');
        return;
    }

    const totalGames = allGamesCache.length;
    const totalPlayers = allGamesCache.reduce((sum, game) => sum + game.current_players, 0);

    // Calculate games completed today (mock data for now)
    const gamesToday = Math.floor(totalGames * 0.3);

    const activeGamesCount = document.getElementById('activeGamesCount');
    if (activeGamesCount && activeGamesCount.textContent !== undefined) {
        activeGamesCount.textContent = totalGames;
    }

    const waitingPlayersCount = document.getElementById('waitingPlayersCount');
    if (waitingPlayersCount && waitingPlayersCount.textContent !== undefined) {
        waitingPlayersCount.textContent = totalPlayers;
    }

    const gamesCompletedToday = document.getElementById('gamesCompletedToday');
    if (gamesCompletedToday && gamesCompletedToday.textContent !== undefined) {
        gamesCompletedToday.textContent = gamesToday;
    }
}

function applyFiltersAndSort() {
    const difficultyFilter = document.getElementById('difficultyFilter').value;
    const playersFilter = document.getElementById('playersFilter').value;
    const sortBy = document.getElementById('sortBy').value;

    // Apply filters
    filteredGamesCache = allGamesCache.filter(game => {
        // Difficulty filter
        if (difficultyFilter && game.difficulty !== difficultyFilter) {
            return false;
        }

        // Players filter
        if (playersFilter) {
            const maxPlayers = parseInt(playersFilter);
            if (game.current_players >= maxPlayers) {
                return false;
            }
        }

        return true;
    });

    // Apply sorting
    filteredGamesCache.sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            case 'oldest':
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            case 'most_players':
                return b.current_players - a.current_players;
            case 'difficulty':
                const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3, 'expert': 4 };
                return difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty];
            default:
                return 0;
        }
    });

    displayFilteredGames();
}

function displayFilteredGames() {
    const gamesList = document.getElementById('activeGamesList');

    if (!gamesList) {
        console.error('❌ Active games list container not found');
        return;
    }

    if (filteredGamesCache.length === 0) {
        gamesList.innerHTML = '<div class="empty-games"><h4>🏟️ No Active Games</h4><p>Be the first to create a game and start the battle!</p></div>';
        return;
    }

    const gamesHTML = filteredGamesCache.map(game => {
        const difficultyClass = `difficulty-${game.difficulty}`;
        const canJoin = game.current_players < game.max_players;
        const isFull = game.current_players >= game.max_players;

        return `
            <div class="game-card ${isFull ? 'game-full' : ''}" onclick="${canJoin ? `joinGame(${game.id})` : ''}" ${!canJoin ? 'style="opacity: 0.6; cursor: not-allowed;"' : ''}>
                <div class="game-card-header">
                    <div class="game-name">${game.name}</div>
                    <div class="game-difficulty ${difficultyClass}">${game.difficulty.toUpperCase()}</div>
                </div>
                <div class="game-info">
                    <div class="info-item">
                        <div class="info-label">Players</div>
                        <div class="info-value">${game.current_players}/${game.max_players}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Questions</div>
                        <div class="info-value">${game.questions_per_game}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Created</div>
                        <div class="info-value">${new Date(game.created_at).toLocaleTimeString()}</div>
                    </div>
                </div>
                <div class="game-info">
                    <div class="info-item">
                        <div class="info-label">Creator</div>
                        <div class="info-value">${game.created_by_name}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Status</div>
                        <div class="info-value">${isFull ? '🔴 Full' : '🟢 Waiting'}</div>
                    </div>
                </div>
                <div class="game-actions">
                    ${canJoin ?
                        `<button class="join-game-btn" onclick="event.stopPropagation(); joinGame(${game.id})">⚔️ Join Battle</button>` :
                        `<button class="join-game-btn" disabled>🏟️ Arena Full</button>`
                    }
                </div>
            </div>
        `;
    }).join('');

    // Double-check container still exists before setting innerHTML
    if (gamesList) {
        gamesList.innerHTML = gamesHTML;
    }
}

// Enhanced lobby refresh function
async function refreshLobby() {
    const refreshBtn = document.getElementById('refreshGamesBtn');
    const originalText = refreshBtn.textContent;

    refreshBtn.textContent = '🔄 Refreshing...';
    refreshBtn.disabled = true;

    try {
        await loadAvailableGames();
        showInlineMessage('✅ Lobby refreshed successfully!');
    } catch (error) {
        console.error('Error refreshing lobby:', error);
        showInlineMessage('❌ Failed to refresh lobby');
    }

    setTimeout(() => {
        refreshBtn.textContent = originalText;
        refreshBtn.disabled = false;
    }, 1000);
}

// Page reload detection - different behavior based on game status
window.addEventListener('beforeunload', async (e) => {
    // Only handle if user is in a multiplayer game and has a participant record
    if (gameState.isMultiplayer && gameState.currentGame && gameState.currentParticipant) {
        console.log('🔄 Player detected page reload...');
        console.log('🔄 Current game status:', gameState.currentGame.status);
        console.log('🔄 Is game creator:', gameState.isGameCreator);

        try {
            // Check if game has started (status is 'starting' or questions are generating)
            const gameHasStarted = gameState.currentGame.status === 'starting' ||
                                  (gameState.currentGame.status === 'waiting' && window.progressInterval);

            if (gameHasStarted) {
                // Game has started - only remove current player, don't end game for others
                console.log('🔄 Game has started - only removing current player, others continue...');

                await fetch(`/api/bible-games/${gameState.currentGame.id}/leave`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        guestId: gameState.currentParticipant.guest_id,
                        reason: 'player_reloaded_after_start'
                    })
                });

                console.log('✅ Player left game successfully due to reload (game continues for others)');
            } else {
                // Game hasn't started yet - use original behavior (end game for everyone)
                console.log('🔄 Game not started - ending game for all players...');

                await fetch(`/api/bible-games/${gameState.currentGame.id}/leave`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        guestId: gameState.currentParticipant.guest_id,
                        reason: 'player_reloaded_before_start'
                    })
                });

                console.log('✅ Player left game successfully due to reload (game ended for all)');
            }
        } catch (error) {
            console.error('❌ Error leaving game on player reload:', error);
            // Don't prevent the reload, just log the error
        }
    }
});

// Login functions removed for trivia1 - users go directly to multiplayer lobby
/*
async function handleLogin() {
    const username = document.getElementById('username').value;
    const difficulty = document.getElementById('difficulty').value;

    if (!username.trim()) {
        alert('Please enter your name');
        return;
    }

    savePlayerName(username.trim());

    gameState.currentUser = {
        name: username.trim(),
        difficulty: difficulty,
        score: 0,
        correctAnswers: 0
    };

    gameState.contestants.push(gameState.currentUser);

    multiplayerLobbySection.classList.add('section-active');
}

async function handleSoloLogin() {
    const username = document.getElementById('username').value;
    const difficulty = document.getElementById('difficulty').value;

    if (!username.trim()) {
        alert('Please enter your name');
        return;
    }

    savePlayerName(username.trim());

    gameState.currentUser = {
        name: username.trim(),
        difficulty: difficulty,
        score: 0,
        correctAnswers: 0
    };

    try {
        await startSoloGameFromLogin();
    } catch (error) {
        console.error('❌ Error starting solo game:', error);

        const errorMessage = document.getElementById('errorMessage');
        errorMessage.style.display = 'block';
        errorMessage.textContent = `Failed to start solo game: ${error.message}`;

        stopFaithVerses();

        setTimeout(() => {
            loadingSection.classList.remove('section-active');
            multiplayerLobbySection.classList.add('section-active');
            errorMessage.style.display = 'none';
        }, 5000);
    }
}
*/

function simulateContestants() {
    // Clear any existing simulation interval
    if (window.contestantSimulationInterval) {
        clearInterval(window.contestantSimulationInterval);
    }

    const names = ['Sarah', 'John', 'Mary', 'Peter', 'Ruth', 'David', 'Esther', 'Paul', 'Martha'];
    let count = 0;

    window.contestantSimulationInterval = setInterval(() => {
        if (gameState.contestants.length >= 10 || count >= 5) {
            clearInterval(window.contestantSimulationInterval);
            window.contestantSimulationInterval = null;
            document.getElementById('startContestBtn').disabled = false;
            document.getElementById('startContestBtn').textContent = 'Start Contest';
            return;
        }

        const randomName = names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 100);
        gameState.contestants.push({
            name: randomName,
            difficulty: gameState.currentUser.difficulty,
            score: 0,
            correctAnswers: 0,
            isBot: true
        });

        updateLobby();
        count++;
    }, 2000);
}

function updateLobby() {
    document.getElementById('contestantCount').textContent = gameState.contestants.length;
    const listContainer = document.getElementById('contestantsList');

    listContainer.innerHTML = gameState.contestants.map(contestant => `
        <div class="contestant-item">
            <span>${contestant.name}</span>
            <span class="contestant-status"></span>
        </div>
    `).join('');
}

async function startContest() {
    lobbySection.classList.remove('section-active');
    loadingSection.classList.add('section-active');

    // Hide support button when entering loading section for gameplay
    updateSupportButtonVisibility();

    try {
        const questionsPerGame = parseInt(document.getElementById('soloQuestions').value);

        const createResponse = await fetch('/api/bible-games/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: `Solo Game - ${gameState.currentUser.name}`,
                difficulty: gameState.currentUser.difficulty,
                playerName: gameState.currentUser.name,
                maxPlayers: 1,
                questionsPerGame: questionsPerGame,
                timePerQuestion: 10,
                isSolo: true  // Add flag to indicate solo game
            })
        });

        const createResult = await createResponse.json();

        if (!createResult.success) {
            throw new Error(createResult.error || 'Failed to create solo game');
        }

        // For solo games, create a simplified participant object
        const participant = createResult.participant || {
            guest_id: 0,
            player_name: gameState.currentUser.name,
            is_creator: true,
            score: 0,
            correct_answers: 0,
            finished_questions: 0
        };

        gameState.currentParticipant = participant;
        gameState.currentGame = createResult.game;
        gameState.isMultiplayer = false; // Explicitly set to false
        gameState.isSoloMode = true; // Set explicit solo mode flag

        // Start progress simulation now that we have the gameId
        startProgressSimulation(createResult.game.id);

        // Start the game (this will generate questions server-side)
        const startResponse = await fetch(`/api/bible-games/${createResult.game.id}/start-guest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                guestId: participant.guest_id
            })
        });

        const startResult = await startResponse.json();
        if (!startResult.success) {
            throw new Error('Failed to start solo game');
        }

        // Fetch the game with questions
        const gameResponse = await fetch(`/api/bible-games/${createResult.game.id}`);
        const gameResult = await gameResponse.json();

        if (!gameResult.success || !gameResult.questions || gameResult.questions.length === 0) {
            throw new Error('Failed to load questions');
        }

        // Set up game state
        gameState.questions = gameResult.questions.map(q => ({
            id: q.id,
            text: q.question_text,
            correctAnswer: q.correct_answer,
            options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]'),
            reference: q.bible_reference,
            difficulty: q.difficulty,
            points: q.points,
            aiGenerated: q.ai_generated,
            questionNumber: q.question_number,
            uniqueId: `server-${q.id}`
        }));

        loadingSection.classList.remove('section-active');

        showCountdown(() => {
            gameSection.classList.add('section-active');
            loadQuestion();
            gameState.gameActive = true;
        });

    } catch (error) {
        console.error('Error starting contest:', error);
        document.getElementById('errorMessage').style.display = 'block';
        document.getElementById('errorMessage').textContent = 'Error generating questions. Please try again.';

        // Stop faith verses on error
        stopFaithVerses();

        setTimeout(() => {
            loadingSection.classList.remove('section-active');
            lobbySection.classList.add('section-active');
        }, 2000);
    }
}

// Optimized faith verses system with reduced DOM manipulation and animations
function showRandomFaithVerse() {
    // Limit active verses to prevent memory buildup
    const existingVerses = document.querySelectorAll('.faith-verse-pill');
    if (existingVerses.length >= 3) {
        // Remove oldest verse if we have too many
        const oldest = existingVerses[0];
        if (oldest) oldest.remove();
    }

    // Get random verse
    const randomVerse = faithVerses[Math.floor(Math.random() * faithVerses.length)];

    // Simplified positioning - use corners only for better performance
    const positions = [
        { x: 20, y: 20, align: 'top-left' },
        { x: window.innerWidth - 320, y: 20, align: 'top-right' },
        { x: 20, y: window.innerHeight - 140, align: 'bottom-left' },
        { x: window.innerWidth - 320, y: window.innerHeight - 140, align: 'bottom-right' }
    ];

    const position = positions[verseCounter % positions.length];
    const verseX = position.x;
    const verseY = position.y;

    // Create optimized pill verse element with reduced styling complexity
    const pillVerse = document.createElement('div');
    pillVerse.className = 'faith-verse-pill';
    pillVerse.textContent = randomVerse;

    // Simplified styling for better performance
    pillVerse.style.cssText = `
        position: fixed;
        left: ${verseX}px;
        top: ${verseY}px;
        width: 280px;
        height: 120px;
        background: linear-gradient(135deg, #00ff88 0%, #0088ff 50%, #ff0088 100%);
        border-radius: 60px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 0 20px rgba(0, 255, 136, 0.4);
        color: #ffffff;
        font-size: 14px;
        font-weight: 600;
        font-family: Courier New, monospace;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 20px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        z-index: 1001;
        cursor: pointer;
        opacity: 0;
        transform: translateY(20px) scale(0.8);
        transition: all 0.3s ease;
    `;

    // Add simplified hover effect
    pillVerse.addEventListener('mouseenter', () => {
        pillVerse.style.transform = 'scale(1.05) translateY(-5px)';
        pillVerse.style.boxShadow = '0 0 30px rgba(0, 255, 136, 0.6)';
    });

    pillVerse.addEventListener('mouseleave', () => {
        pillVerse.style.transform = 'scale(1) translateY(0)';
        pillVerse.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.4)';
    });

    // Add to page
    document.body.appendChild(pillVerse);

    // Show verse with simple animation
    setTimeout(() => {
        pillVerse.style.opacity = '1';
        pillVerse.style.transform = 'translateY(0) scale(1)';
    }, 100);

    // Increment counter for next verse position
    verseCounter++;

    // Reduced display duration for better performance
    setTimeout(() => {
        if (pillVerse.parentNode) {
            pillVerse.style.opacity = '0';
            pillVerse.style.transform = 'translateY(-20px) scale(0.8)';
            setTimeout(() => {
                pillVerse.remove();
            }, 300);
        }
    }, 30000); // Reduced from 45 seconds to 30 seconds
}

function startFaithVerses() {
    // Show first pill verse immediately
    showRandomFaithVerse();

    // Reduced frequency for better performance - every 12 seconds instead of 8
    verseInterval = setInterval(() => {
        showRandomFaithVerse();
    }, 12000); // Optimized timing for better performance
}

function stopFaithVerses() {
    if (verseInterval) {
        clearInterval(verseInterval);
        verseInterval = null;
    }
    // Remove any remaining verses
    const existingVerses = document.querySelectorAll('.faith-verse');
    existingVerses.forEach(verse => verse.remove());
}

function handleNoAnswer() {
    const question = gameState.questions[gameState.currentQuestionIndex];

    // Show correct answer
    document.querySelectorAll('.option-btn').forEach(btn => {
        if (btn.getAttribute('data-option') === question.correctAnswer) {
            btn.classList.add('correct');
        }
        btn.disabled = true;
    });

    // Move to next question after delay
    setTimeout(() => {
        gameState.currentQuestionIndex++;
        loadQuestion();
    }, 2000);
}

function cleanupGameState() {
    // Production: Removed console logs for cleaner output
    // console.log('🧹 Starting comprehensive cleanup...');

    // Clear all intervals
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
        // console.log('🧹 Cleared question timer interval');
    }

    if (gameState.gameUpdateInterval) {
        clearInterval(gameState.gameUpdateInterval);
        gameState.gameUpdateInterval = null;
        // console.log('🧹 Cleared game room update interval');
    }

    if (window.progressInterval) {
        clearInterval(window.progressInterval);
        window.progressInterval = null;
        // console.log('🧹 Cleared progress simulation interval');
    }

    // Clear contestant simulation interval
    if (window.contestantSimulationInterval) {
        clearInterval(window.contestantSimulationInterval);
        window.contestantSimulationInterval = null;
        // console.log('🧹 Cleared contestant simulation interval');
    }

    // Stop faith verses
    if (verseInterval) {
        clearInterval(verseInterval);
        verseInterval = null;
        // console.log('🧹 Cleared faith verses interval');
    }

    // Remove any remaining faith verses and decorations
    const existingVerses = document.querySelectorAll('.faith-verse');
    existingVerses.forEach(verse => {
        verse.remove();
        // console.log('🧹 Removed faith verse element');
    });
    const existingDecorations = document.querySelectorAll('.verse-decorations');
    existingDecorations.forEach(decoration => {
        decoration.remove();
        // console.log('🧹 Removed verse decorations');
    });

    // Clear any countdown overlays
    const countdownOverlay = document.getElementById('countdownOverlay');
    if (countdownOverlay) {
        countdownOverlay.style.display = 'none';
        // console.log('🧹 Cleared countdown overlay');
    }

    // Clear any light flash effects
    const lightFlashes = document.querySelectorAll('.light-flash');
    lightFlashes.forEach(flash => {
        flash.remove();
        // console.log('🧹 Removed light flash effect');
    });

    // Clear any error messages
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
        // console.log('🧹 Cleared error messages');
    }

    // Clear loading section text
    const questionProgress = document.getElementById('questionProgress');
    if (questionProgress) {
        questionProgress.textContent = '';
        // console.log('🧹 Cleared question progress text');
    }

    // Stop support button cycle
    stopSupportButtonCycle();

    // Clear error recovery interval
    if (window.errorRecoveryInterval) {
        clearInterval(window.errorRecoveryInterval);
        window.errorRecoveryInterval = null;
    }

    // console.log('🧹 Comprehensive cleanup completed');
}

function updateLoadingProgress() {
    // Animate the loading progress bar with a smooth, tech-like progression
    const progressFill = document.getElementById('loadingProgressFill');
    const progressText = document.querySelector('.loading-progress-text');

    if (progressFill && progressText) {
        // Create a more dynamic progress animation
        const currentTime = Date.now();
        const baseProgress = Math.min(95, (currentTime % 8000) / 80); // 0-95% over 8 seconds
        const fluctuation = Math.sin(currentTime / 500) * 3; // Small fluctuation
        const progress = Math.max(0, Math.min(95, baseProgress + fluctuation));

        progressFill.style.width = progress + '%';
        progressText.textContent = Math.round(progress) + '%';
    }
}

function startProgressSimulation(gameId) {
    // Stop any existing faith verses first to prevent overlap
    stopFaithVerses();

    // Initialize loading progress
    const progressFill = document.getElementById('loadingProgressFill');
    const progressText = document.querySelector('.loading-progress-text');
    if (progressFill) progressFill.style.width = '0%';
    if (progressText) progressText.textContent = '0%';

    // Initialize loading state
    gameState.loadingState = {
        gameId: gameId,
        totalQuestions: gameState.currentGame?.questions_per_game || 10,
        generatedQuestions: 0,
        lastKnownCount: 0,
        isGenerating: true,
        errorCount: 0,
        maxErrors: 5,
        retryCount: 0,
        maxRetries: 3,
        canRetry: true
    };

    // Start the new database-driven progress tracking
    startDatabaseProgressTracking();
}

function startDatabaseProgressTracking() {
    logger.log('Starting optimized database progress tracking for game:', gameState.loadingState.gameId);

    // Clear any existing intervals
    if (window.progressInterval) {
        clearInterval(window.progressInterval);
        window.progressInterval = null;
    }

    // Initial status for batch generation
    const gameMode = gameState.isSoloMode ? 'Solo' : 'Multiplayer';
    const totalQuestions = gameState.loadingState.totalQuestions;
    const progressElement = document.getElementById('questionProgress');
    if (progressElement) {
        progressElement.textContent = `${gameMode} Game: Generating all ${totalQuestions} questions...`;
    }

    // Optimized batch generation polling - less frequent for better performance
    setTimeout(async () => {
        await checkDatabaseProgress();
        window.progressInterval = setInterval(async () => {
            await checkDatabaseProgress();
        }, PERFORMANCE_CONFIG.maxProgressPollingFrequency);
    }, 2000);

    // Reduced error recovery frequency
    window.errorRecoveryInterval = setInterval(async () => {
        await handleErrorRecovery();
    }, 20000);

    // Single initial check
    setTimeout(() => {
        checkDatabaseProgress();
    }, 200);
}

async function checkDatabaseProgress() {
    if (!gameState.loadingState.isGenerating) {
        return;
    }

    try {
        // Query the database for current question count
        const response = await fetch(`/api/bible-games/${gameState.loadingState.gameId}/progress`);

        // Enhanced status code handling for progress polling
        if (response.status === 524) {
            console.error('🚫 Cloudflare 524 Timeout Error - server timed out during progress check');
            console.error('Response details:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });
            updateProgressDisplay(gameState.loadingState.lastKnownCount, gameState.loadingState.totalQuestions, 'Server timed out - waiting for recovery...');

            // Don't increment error count for 524, as it's temporary
            // Continue polling but with longer delays
            if (gameState.loadingState.errorCount >= gameState.loadingState.maxErrors) {
                showRetryModal('Server Timeout (524)', 'The server is overloaded and timing out. This is a known Cloudflare issue. Click retry to wait for server recovery and try again.');
                return;
            }
            return;
        }

        if (response.status === 500) {
            console.error('🚫 Server 500 Error - internal server error during progress check');
            console.error('Response details:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });
            updateProgressDisplay(gameState.loadingState.lastKnownCount, gameState.loadingState.totalQuestions, 'Server error - waiting for recovery...');

            gameState.loadingState.errorCount++;
            if (gameState.loadingState.errorCount >= gameState.loadingState.maxErrors) {
                showRetryModal('Server Error (500)', 'The server encountered an internal error. This might be due to "too many subrequests" limitation. Click retry to try again in 2-3 minutes.');
                return;
            }
            return;
        }

        if (response.status === 502 || response.status === 503) {
            console.error(`🚫 Server ${response.status} Error: Bad Gateway/Service Unavailable during progress check`);
            console.error('Response details:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });
            updateProgressDisplay(gameState.loadingState.lastKnownCount, gameState.loadingState.totalQuestions, 'Server temporarily unavailable - waiting...');

            gameState.loadingState.errorCount++;
            if (gameState.loadingState.errorCount >= gameState.loadingState.maxErrors) {
                showRetryModal(`Server Error (${response.status})`, 'The server is temporarily unavailable. Click retry to try again when the site recovers.');
                return;
            }
            return;
        }

        if (!response.ok) {
            console.error(`🚫 HTTP ${response.status} Error during progress check`);
            console.error('Response details:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });
            updateProgressDisplay(gameState.loadingState.lastKnownCount, gameState.loadingState.totalQuestions, 'Connection issues - retrying...');

            gameState.loadingState.errorCount++;
            if (gameState.loadingState.errorCount >= gameState.loadingState.maxErrors) {
                showRetryModal(`Server Error (${response.status})`, `Unexpected server response (${response.status}). The server is overloaded or having issues. Click retry to try again later.`);
                return;
            }
            return;
        }

        // Add proper error handling for JSON parsing
        let result;
        try {
            const responseText = await response.text();
            if (!responseText || responseText.trim() === '') {
                console.warn('⚠️ Empty progress response - continuing...');
                updateProgressDisplay(gameState.loadingState.lastKnownCount, gameState.loadingState.totalQuestions, 'Empty response - continuing...');
                return; // Skip this poll cycle but continue polling
            }

            // Check content type
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.warn('⚠️ Non-JSON progress response - continuing...');
                console.warn('Response content:', responseText.substring(0, 200) + '...');
                updateProgressDisplay(gameState.loadingState.lastKnownCount, gameState.loadingState.totalQuestions, 'Invalid response - continuing...');
                return; // Skip this poll cycle but continue polling
            }

            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ JSON parse error in progress polling:', parseError);
            console.error('Response that failed to parse:', responseText?.substring(0, 200) + '...');
            updateProgressDisplay(gameState.loadingState.lastKnownCount, gameState.loadingState.totalQuestions, 'Parse error - continuing...');
            return; // Skip this poll cycle but continue polling
        }

        if (!result.success) {
            gameState.loadingState.errorCount++;
            console.warn('⚠️ Database query returned error:', result.error);

            // Handle specific server errors
            if (result.error && result.error.includes('Too many subrequests')) {
                console.error('🚫 Cloudflare "Too many subrequests" error - continuing with reduced frequency...');
                updateProgressDisplay(gameState.loadingState.lastKnownCount, gameState.loadingState.totalQuestions, 'Server overload - continuing...');
            } else {
                console.error('🚫 Server error:', result.error);
                updateProgressDisplay(gameState.loadingState.lastKnownCount, gameState.loadingState.totalQuestions, 'Server processing - continuing...');
            }

            if (gameState.loadingState.errorCount >= gameState.loadingState.maxErrors) {
                showRetryModal('Server error', 'The server encountered an error. Click retry to continue.');
                return;
            }

            // Continue polling even on server errors
            return;
        }

        // Reset error count on successful response
        gameState.loadingState.errorCount = 0;

        const { generated, total, isReady } = result.progress;
        const currentCount = generated || 0;

        // Update our tracking
        gameState.loadingState.generatedQuestions = currentCount;
        gameState.loadingState.lastKnownCount = currentCount;

        // Update display for batch generation
        if (currentCount >= total) {
            updateProgressDisplay(currentCount, total, `✅ Generated all ${total} questions! Starting game...`);
        } else {
            updateProgressDisplay(currentCount, total, `🔄 Generating all ${total} questions... (${currentCount}/${total} completed)`);
        }

        // Check if all questions are ready
        if (isReady && currentCount >= total) {
            console.log('✅ All questions generated, starting game...');
            await startGameFromDatabase();
            return;
        }

        // Check for server failure (no progress for extended period)
        // For batch generation, we expect faster completion, so reduce the stall timeout
        if (currentCount === 0 && gameState.loadingState.totalQuestions > 0) {
            const noProgressTime = Date.now() - (gameState.loadingState.startTime || Date.now());
            if (noProgressTime > 45000) { // 45 seconds of no progress for batch generation
                showRetryModal('Generation stalled', 'Batch question generation appears to have stalled. Click retry to try again.');
                return;
            }
        }

    } catch (error) {
        gameState.loadingState.errorCount++;
        console.error('❌ Database progress check error:', error);

        // Handle specific error types
        if (error.message && error.message.includes('NetworkError')) {
            console.error('🚫 Network error - connection lost');
            updateProgressDisplay(gameState.loadingState.lastKnownCount, gameState.loadingState.totalQuestions, 'Network error - reconnecting...');
        } else if (error.message && error.message.includes('fetch')) {
            console.error('🚫 Fetch error - request failed');
            updateProgressDisplay(gameState.loadingState.lastKnownCount, gameState.loadingState.totalQuestions, 'Request failed - retrying...');
        } else {
            console.error('🚫 Unknown error:', error.message);
            updateProgressDisplay(gameState.loadingState.lastKnownCount, gameState.loadingState.totalQuestions, 'Unknown error - continuing...');
        }

        if (gameState.loadingState.errorCount >= gameState.loadingState.maxErrors) {
            showRetryModal('Connection lost', 'Lost connection to server. Click retry to reconnect and continue.');
        } else {
            // Continue polling even on errors
        }
    }
}

function updateProgressDisplay(generated, total, message) {
    const progressFill = document.getElementById('loadingProgressFill');
    const progressText = document.querySelector('.loading-progress-text');
    const questionProgress = document.getElementById('questionProgress');

    if (progressFill && progressText) {
        // For batch generation, show 0% until complete, then 100%
        const progressPercent = generated >= total ? 100 : (generated > 0 ? 50 : 0);
        progressFill.style.width = progressPercent + '%';
        progressText.textContent = generated >= total ? '100%' : (generated > 0 ? '50%' : '0%');
    }

    if (questionProgress) {
        questionProgress.textContent = message;
    }
}

async function startGameFromDatabase() {
    console.log('🎮 Starting game from database...');

    // Stop all intervals
    if (window.progressInterval) {
        clearInterval(window.progressInterval);
        window.progressInterval = null;
    }
    if (window.errorRecoveryInterval) {
        clearInterval(window.errorRecoveryInterval);
        window.errorRecoveryInterval = null;
    }

    // Reset loading state
    gameState.loadingState.isGenerating = false;
    gameState.loadingState.errorCount = 0;
    gameState.loadingState.retryCount = 0;

    try {
        // Fetch the complete game data with all questions
        const response = await fetch(`/api/bible-games/${gameState.loadingState.gameId}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch game data: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error('Failed to load game data from database');
        }

        if (!result.questions || result.questions.length === 0) {
            throw new Error('No questions found in database');
        }

        // Convert server questions to client format
        gameState.questions = result.questions.map(q => ({
            id: q.id,
            text: q.question_text,
            correctAnswer: q.correct_answer,
            options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]'),
            reference: q.bible_reference,
            difficulty: q.difficulty,
            points: q.points,
            aiGenerated: q.ai_generated,
            questionNumber: q.question_number,
            uniqueId: `server-${q.id}`
        }));

        console.log(`✅ Loaded ${gameState.questions.length} questions from database`);

        // Stop faith verses immediately and force cleanup
        stopFaithVerses();

        // Force removal of any remaining faith verses on page
        const existingVerses = document.querySelectorAll('.faith-verse-pill');
        existingVerses.forEach(verse => {
            verse.remove();
        });

        // Clear any faith verse intervals as extra insurance
        if (verseInterval) {
            clearInterval(verseInterval);
            verseInterval = null;
        }

        // Transition to game
        setTimeout(() => {
            loadingSection.classList.remove('section-active');
            showCountdown(() => {
                gameSection.classList.add('section-active');
                loadQuestion();
                gameState.gameActive = true;
                updateSupportButtonVisibility(); // Hide support button when entering gameplay
            });
        }, 500); // Reduced delay from 1000ms to 500ms

    } catch (error) {
        console.error('❌ Error starting game from database:', error);
        showRetryModal('Failed to load game', 'Could not load the generated questions. Click retry to try again.');
        // Don't return to lobby - let user retry
    }
}

async function handleErrorRecovery() {
    if (gameState.loadingState.errorCount > 0 && gameState.loadingState.errorCount < gameState.loadingState.maxErrors) {
        console.log('🔄 Attempting error recovery...');
        // Try to resume progress checking
        await checkDatabaseProgress();
    }
}

// Retry Modal System
function showRetryModal(title, message, canRetry = true) {
    console.log('⚠️ Showing retry modal:', title, message);

    gameState.loadingState.canRetry = canRetry;
    gameState.loadingState.isGenerating = false;

    // Stop intervals temporarily
    if (window.progressInterval) {
        clearInterval(window.progressInterval);
        window.progressInterval = null;
    }
    if (window.errorRecoveryInterval) {
        clearInterval(window.errorRecoveryInterval);
        window.errorRecoveryInterval = null;
    }

    // Create retry modal if it doesn't exist
    if (!document.getElementById('retryModal')) {
        createRetryModal();
    }

    const modal = document.getElementById('retryModal');
    const modalTitle = document.getElementById('retryModalTitle');
    const modalMessage = document.getElementById('retryModalMessage');
    const retryBtn = document.getElementById('retryBtn');
    const cancelBtn = document.getElementById('cancelRetryBtn');

    modalTitle.textContent = title;
    modalMessage.textContent = message;

    if (canRetry) {
        retryBtn.style.display = 'inline-block';
        cancelBtn.textContent = 'Cancel';
        retryBtn.onclick = handleRetry;
    } else {
        retryBtn.style.display = 'none';
        cancelBtn.textContent = 'Back to Lobby';
        cancelBtn.onclick = returnToLobby;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function createRetryModal() {
    const modalHTML = `
        <div id="retryModal" class="modal-overlay retry-modal">
            <div class="modal-content retry-modal-content">
                <div class="modal-header">
                    <h3 id="retryModalTitle">Generation Error</h3>
                    <button class="modal-close" onclick="closeRetryModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="error-icon">⚠️</div>
                    <p id="retryModalMessage">An error occurred during question generation.</p>
                    <div class="retry-info">
                        <p><strong>What happened:</strong> The server may be experiencing issues or the generation process was interrupted.</p>
                        <p><strong>What to do:</strong> Click "Retry" to resume checking progress and continue the game.</p>
                    </div>
                    <div class="modal-actions">
                        <button id="retryBtn" class="btn btn-primary">🔄 Retry</button>
                        <button id="cancelRetryBtn" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const container = document.querySelector('.container');
    if (container) {
        container.insertAdjacentHTML('beforeend', modalHTML);
    }
}

function handleRetry() {
    console.log('🔄 User clicked retry, restarting game...');

    // Close modal
    closeRetryModal();

    // Reset error state
    gameState.loadingState.errorCount = 0;
    gameState.loadingState.retryCount++;
    gameState.loadingState.isGenerating = true;

    // Update display
    const gameMode = gameState.isSoloMode ? 'Solo' : 'Multiplayer';
    document.getElementById('questionProgress').textContent = `${gameMode} Game: Restarting...`;

    // For multiplayer games, restart the entire start process
    if (gameState.isMultiplayer && !gameState.isSoloMode) {
        console.log('🔄 Retrying multiplayer game start...');
        // Restart the multiplayer game start process
        if (gameState.gameRoomId && gameState.currentParticipant) {
            startMultiplayerGame();
        } else {
            console.error('❌ Cannot retry multiplayer game - missing game data');
            returnToLobby();
        }
    } else {
        // For solo games, resume progress simulation like multiplayer does
        console.log('🔄 Retrying solo game - resuming progress simulation...');
        if (gameState.loadingState.gameId) {
            // Resume progress simulation where it left off
            startProgressSimulation(gameState.loadingState.gameId);
        } else if (gameState.currentGame && gameState.currentGame.id) {
            // Fallback: use current game ID if loading state doesn't have it
            startProgressSimulation(gameState.currentGame.id);
        } else {
            console.error('❌ Cannot retry solo game - no game ID available');
            returnToLobby();
        }
    }
}

function returnToLobby() {
    console.log('🏠 User chose to return to lobby');

    // Close modal
    closeRetryModal();

    // Reset game state
    cleanupGameState();
    resetGameState();

    // Return to lobby
    loadingSection.classList.remove('section-active');
    multiplayerLobbySection.classList.add('section-active');
}

function closeRetryModal() {
    const modal = document.getElementById('retryModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close retry modal on escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const retryModal = document.getElementById('retryModal');
        if (retryModal && retryModal.classList.contains('active')) {
            closeRetryModal();
        }
    }
});

// Close retry modal when clicking outside
document.addEventListener('click', (e) => {
    const retryModal = document.getElementById('retryModal');
    if (retryModal && retryModal.classList.contains('active') && e.target === retryModal) {
        closeRetryModal();
    }
});

function showCountdown(callback) {
    const overlay = document.getElementById('countdownOverlay');
    const number = document.getElementById('countdownNumber');

    // Add active class for enhanced styling
    overlay.classList.add('active');

    let count = 5;
    number.textContent = count;

    const countInterval = setInterval(() => {
        count--;
        if (count > 0) {
            number.textContent = count;
            // Remove and re-add animation class for smooth retriggers
            number.classList.remove('countdown-pulse');
            setTimeout(() => {
                number.classList.add('countdown-pulse');
            }, 10);
        } else {
            clearInterval(countInterval);

            // Remove active class with fade out effect
            overlay.classList.remove('active');

            // Wait for fade out animation to complete before hiding
            setTimeout(() => {
                overlay.style.display = 'none';

                // Auto-scroll to bottom on mobile devices when game starts
                const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window);
                if (isMobile) {
                    setTimeout(() => {
                        window.scrollTo({
                            top: document.body.scrollHeight,
                            behavior: 'smooth'
                        });
                    }, 500); // Small delay to ensure game section is rendered
                }

                callback();
            }, 300); // Match the CSS fade out transition duration
        }
    }, 1000);
}

function shuffleArray(array) {
    // Fisher-Yates shuffle algorithm
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function loadQuestion() {
    if (gameState.currentQuestionIndex >= gameState.questions.length) {
        // Check solo mode first for clarity
        if (gameState.isSoloMode || (!gameState.isMultiplayer && gameState.currentGame)) {
            endGame();
        } else if (gameState.isMultiplayer && gameState.currentGame && gameState.currentParticipant) {
            waitForAllPlayersToFinish();
        } else {
            endGame();
        }
        return;
    }

    gameState.answerLocked = false;
    gameState.selectedAnswer = null;
    document.getElementById('answerLockedOverlay').style.display = 'none';
    document.getElementById('lockIndicator').style.display = 'none';

    // Get the raw question and randomize option order
    const rawQuestion = gameState.questions[gameState.currentQuestionIndex];
    const shuffledOptions = shuffleArray(rawQuestion.options);
    const correctAnswerPosition = shuffledOptions.indexOf(rawQuestion.correctAnswer) + 1; // 1-based for letter conversion

    // Create question object with shuffled options
    const question = {
        ...rawQuestion,
        options: shuffledOptions,
        // Store the original correct answer for submission checking
        originalCorrectAnswer: rawQuestion.correctAnswer,
        // The new correct answer letter (A, B, C, D) based on shuffled position
        shuffledCorrectLetter: String.fromCharCode(64 + correctAnswerPosition) // 65=A, 66=B, etc.
    };

    // Store shuffled question data for question review
    gameState.questions[gameState.currentQuestionIndex] = question;

    document.getElementById('currentQuestion').textContent = question.questionNumber || (gameState.currentQuestionIndex + 1);
    // In loadQuestion function - use dynamic question count consistently
    const totalQuestionsDisplay = gameState.currentGame?.questions_per_game || gameState.questions.length;
    document.getElementById('questionNumber').textContent =
        `Question ${gameState.currentQuestionIndex + 1} of ${totalQuestionsDisplay}`;
    document.getElementById('questionText').textContent = question.text;

    if (question.verse) {
        document.getElementById('verseText').style.display = 'block';
        document.getElementById('verseText').textContent = question.verse;
    } else {
        document.getElementById('verseText').style.display = 'none';
    }

    document.getElementById('verseReference').innerHTML =
        `${question.reference} <span style="color: #ff6b6b; font-size: 0.8em;">🤖 AI Generated</span>`;

    const badge = document.getElementById('difficultyBadge');
    badge.textContent = question.difficulty.toUpperCase();
    badge.className = `difficulty-badge difficulty-${question.difficulty}`;

    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = question.options.map((option, index) => `
        <button class="option-btn" data-option="${option.replace(/"/g, '"')}" onclick="selectOption(this)">
            ${String.fromCharCode(65 + index)}. ${option}
        </button>
    `).join('');

    const submitBtn = document.getElementById('submitAnswer');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Lock Answer';
    submitBtn.classList.remove('locked');

    startTimer();

    // In loadQuestion function
    const totalQuestions = gameState.currentGame?.questions_per_game || gameState.questions.length;
    const progress = ((gameState.currentQuestionIndex + 1) / totalQuestions) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
}

function selectOption(element) {
    if (gameState.answerLocked) return;

    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });

    element.classList.add('selected');
    gameState.selectedAnswer = element.getAttribute('data-option');

    document.getElementById('submitAnswer').disabled = false;
}

function lockAnswer() {
    if (gameState.answerLocked || !gameState.selectedAnswer) return;

    gameState.answerLocked = true;

    const submitBtn = document.getElementById('submitAnswer');
    submitBtn.classList.add('locked');
    submitBtn.textContent = '🔒 Locked!';
    submitBtn.disabled = true;

    document.getElementById('lockIndicator').style.display = 'inline-block';

    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.add('locked');
    });

    const overlay = document.getElementById('answerLockedOverlay');
    overlay.style.display = 'flex';
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 500);
}

function startTimer() {
    // Dynamic system: Different timer durations based on difficulty
    const question = gameState.questions[gameState.currentQuestionIndex];
    const difficulty = question?.difficulty || 'easy';

    switch (difficulty) {
        case 'easy': gameState.timeLeft = 12; break;
        case 'medium': gameState.timeLeft = 16.5; break;
        case 'hard': gameState.timeLeft = 21; break;
        case 'expert': gameState.timeLeft = 25.5; break;
        default: gameState.timeLeft = 12; break;
    }

    updateTimerDisplay();

    // Clear any existing timer
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }

    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        updateTimerDisplay();

        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
            submitAnswer();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerElement = document.getElementById('timer');
    timerElement.textContent = gameState.timeLeft;

    timerElement.classList.remove('normal', 'warning', 'danger');

    if (gameState.timeLeft <= 3) {
        timerElement.classList.add('danger');
    } else if (gameState.timeLeft <= 5) {
        timerElement.classList.add('warning');
    } else {
        timerElement.classList.add('normal');
    }
}

async function submitAnswer() {
    if (!gameState.gameActive) return;

    clearInterval(gameState.timerInterval);

    const question = gameState.questions[gameState.currentQuestionIndex];

    // Record user answer for question review
    if (!gameState.selectedAnswer || gameState.selectedAnswer.trim() === '') {
        // Timeout - record as null
        gameState.userAnswers[gameState.currentQuestionIndex] = null;
        handleNoAnswer();
        return;
    } else {
        // Record the selected answer
        gameState.userAnswers[gameState.currentQuestionIndex] = gameState.selectedAnswer;
    }

    const isCorrect = gameState.answerLocked && gameState.selectedAnswer === question.correctAnswer;

    if (isCorrect) {
        // Dynamic scoring system: Points based on difficulty and question count
        const difficulty = question?.difficulty || 'easy';

        // Get total questions for this difficulty in the current game
        const totalQuestionsInDifficulty = gameState.questions.filter(q => q.difficulty === difficulty).length;
        const pointsPerQuestion = getPointsForDifficulty(difficulty, totalQuestionsInDifficulty);

        // Calculate time bonus based on difficulty-specific max time
        let maxTime;
        switch (difficulty) {
            case 'easy': maxTime = 12; break;
            case 'medium': maxTime = 16.5; break;
            case 'hard': maxTime = 21; break;
            case 'expert': maxTime = 25.5; break;
            default: maxTime = 12; break;
        }

        const timePercentage = gameState.timeLeft / maxTime;
        const timeBonus = Math.floor(timePercentage * pointsPerQuestion); // Time bonus up to points per question
        const points = pointsPerQuestion + timeBonus; // Total: pointsPerQuestion to 2*pointsPerQuestion

        gameState.score += points;
        gameState.correctAnswers++;
        gameState.currentUser.score = gameState.score;
        gameState.currentUser.correctAnswers = gameState.correctAnswers;
    }

    // Record answer to server if multiplayer
    if (gameState.isMultiplayer && gameState.currentGame && gameState.currentParticipant) {
        try {
            console.log('=== MULTIPLAYER ANSWER SUBMISSION DEBUG ===');
            console.log('Submitting answer for question:', question.id, 'Question object:', question);
            console.log('Current game ID:', gameState.currentGame.id);
            console.log('Current participant:', gameState.currentParticipant);
            console.log('Guest ID being sent:', gameState.currentParticipant.guest_id || gameState.currentParticipant.id);
            console.log('Selected answer:', gameState.selectedAnswer || '');
            console.log('Time taken:', 10 - gameState.timeLeft);
            console.log('Is multiplayer:', gameState.isMultiplayer);
            console.log('Game state:', gameState.currentGame);

            // Use the correct endpoint format with question ID
            const requestUrl = `/api/bible-games/${gameState.currentGame.id}/questions/${question.id}/answer-guest`;
            console.log('Request URL:', requestUrl);

            // CRITICAL FIX: Use the correct guest_id based on participant role
            // - Game creators have guest_id: 0
            // - Guest players have guest_id: 1, 2, 3, etc.
            let guestId;
            if (gameState.currentParticipant.is_creator) {
                // Creator always uses guest_id 0
                guestId = 0;
                console.log('Creator detected - using guest_id: 0');
            } else {
                // Guest players use their assigned guest_id
                guestId = parseInt(gameState.currentParticipant.guest_id || 1);
                console.log('Guest player detected - using guest_id:', guestId);
            }
            // Handle empty answers (timeout) - treat as wrong answer but skip API submission
            if (!gameState.selectedAnswer || gameState.selectedAnswer.trim() === '') {
                console.log('⚠️ No answer selected (timeout) - treating as wrong answer');
                console.log('⏭️ Recording 0 points and moving to next question');

                // Treat as wrong answer - no points, no correct answer
                const isCorrect = false;

                // Show the correct answer feedback
                document.querySelectorAll('.option-btn').forEach(btn => {
                    const optionValue = btn.getAttribute('data-option');
                    if (optionValue === question.correctAnswer) {
                        btn.classList.add('correct');
                    }
                    btn.disabled = true;
                });

                // Update score and correct answers count (no change since it's wrong)
                document.getElementById('currentScore').textContent = gameState.score;
                document.getElementById('correctAnswers').textContent = gameState.correctAnswers;

                setTimeout(() => {
                    gameState.currentQuestionIndex++;
                    loadQuestion();
                }, 2000);
                return; // Exit early - don't submit empty answer to avoid 400 error
            }

            // Calculate time taken based on difficulty-specific timer
            const difficulty = question?.difficulty || 'easy';
            let maxTime;
            switch (difficulty) {
                case 'easy': maxTime = 12; break;
                case 'medium': maxTime = 16.5; break;
                case 'hard': maxTime = 21; break;
                case 'expert': maxTime = 25.5; break;
                default: maxTime = 12; break;
            }

            const requestBody = {
                selectedAnswer: gameState.selectedAnswer,
                timeTaken: maxTime - gameState.timeLeft, // Dynamic time taken based on difficulty
                guestId: guestId
            };
            console.log('Request body:', requestBody);
            console.log('Full participant object:', gameState.currentParticipant);
            console.log('Guest ID type:', typeof guestId, 'Value:', guestId);

            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                console.error('❌ Answer submission failed with status:', response.status);
                const errorText = await response.text();
                console.error('❌ Error response text:', errorText);

                try {
                    const errorJson = JSON.parse(errorText);
                    console.error('❌ Error response JSON:', errorJson);
                } catch (parseError) {
                    console.error('❌ Could not parse error response as JSON');
                }
            } else {
                console.log('✅ Answer submitted successfully');
                const responseText = await response.text();
                console.log('✅ Response text:', responseText);
            }
        } catch (error) {
            console.error('Error recording multiplayer answer:', error);
        }
    }

    document.querySelectorAll('.option-btn').forEach(btn => {
        const optionValue = btn.getAttribute('data-option');
        if (optionValue === question.correctAnswer) {
            btn.classList.add('correct');
        } else if (btn.classList.contains('selected') && !isCorrect) {
            btn.classList.add('incorrect');
        }
        btn.disabled = true;
    });

    document.getElementById('currentScore').textContent = gameState.score;
    document.getElementById('correctAnswers').textContent = gameState.correctAnswers;

    setTimeout(() => {
        gameState.currentQuestionIndex++;
        loadQuestion();
    }, 2000);
}

async function saveAuthenticatedUserGameData(finalRank = null) {
    // Only save data for authenticated users, not guests
    if (!window.authenticatedUser || !window.authenticatedUser.id) {
        console.log('👤 Guest user detected - skipping game data save');
        return;
    }

    try {
        console.log('💾 Saving authenticated user game data...');
        console.log('🔍 DEBUG: Authenticated user:', window.authenticatedUser);
        console.log('🔍 DEBUG: Game state score:', gameState.score);
        console.log('🔍 DEBUG: Game state correct answers:', gameState.correctAnswers);
        console.log('🔍 DEBUG: Current game:', gameState.currentGame);
        console.log('🔍 DEBUG: Final rank:', finalRank);

        const gameData = {
            userId: window.authenticatedUser.id,
            gameId: gameState.currentGame.id,
            score: gameState.score,
            correctAnswers: gameState.correctAnswers,
            totalQuestions: gameState.currentGame?.questions_per_game || gameState.questions.length,
            difficulty: gameState.currentGame?.difficulty,
            gameType: 'multiplayer',
            finishingPosition: finalRank,
            finishedAt: new Date().toISOString()
        };

        console.log('🔍 DEBUG: Game data to save:', gameData);

        const response = await fetch('/api/bible-games/save-user-game-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gameData)
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ Authenticated user game data saved successfully');
            console.log('🔍 DEBUG: Save result:', result);
        } else {
            console.error('❌ Failed to save authenticated user game data:', result.error);
        }
    } catch (error) {
        console.error('❌ Error saving authenticated user game data:', error);
        // Don't throw - we don't want to break the leaderboard display if saving fails
    }
}

async function showMultiplayerLeaderboard() {
    console.log('🏆 MULTIPLAYER LEADERBOARD: Fetching multiplayer results...');
    console.log('🔍 DEBUG: Game ID:', gameState.currentGame.id);
    console.log('🔍 DEBUG: Current user:', gameState.currentUser?.name);
    console.log('🔍 DEBUG: Current participant:', gameState.currentParticipant);
    console.log('🔍 DEBUG: Current game state score:', gameState.score);
    console.log('🔍 DEBUG: Current game state correct answers:', gameState.correctAnswers);
    console.log('🔍 DEBUG: Current participant score:', gameState.currentParticipant?.score);
    console.log('🔍 DEBUG: Current participant correct answers:', gameState.currentParticipant?.correct_answers);
    console.log('🔍 DEBUG: Questions length:', gameState.questions?.length);
    console.log('🔍 DEBUG: Total questions in game:', gameState.currentGame?.questions_per_game);

    // Save authenticated user game data after getting results (will be called later with rank)

    try {
        const response = await fetch(`/api/bible-games/${gameState.currentGame.id}/results`);

        console.log('🔍 DEBUG: API Response status:', response.status);
        console.log('🔍 DEBUG: API Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error response:', errorText);
            console.error('🔍 DEBUG: Score mismatch analysis - API failed, comparing local state:');
            console.error('🔍 DEBUG: Local gameState score:', gameState.score);
            console.error('🔍 DEBUG: Local gameState correct answers:', gameState.correctAnswers);
            console.error('🔍 DEBUG: Participant score:', gameState.currentParticipant?.score);
            console.error('🔍 DEBUG: Participant correct answers:', gameState.currentParticipant?.correct_answers);
            throw new Error(`Failed to fetch multiplayer results: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('🔍 DEBUG: Full API result:', result);
        console.log('🔍 DEBUG: Score mismatch analysis - comparing API vs local state:');
        console.log('🔍 DEBUG: API result success:', result.success);
        console.log('🔍 DEBUG: API result error:', result.error);

        if (result.success) {
            const gameResults = result.results;
            const leaderboard = gameResults.leaderboard;
            console.log('✅ Multiplayer results fetched successfully. Leaderboard:', leaderboard);
            console.log('🔍 DEBUG: Leaderboard length:', leaderboard.length);
            console.log('🔍 DEBUG: Leaderboard contents:', JSON.stringify(leaderboard, null, 2));

            // Debug the leaderboard data
            debugLeaderboardData(leaderboard);

            // Check if leaderboard is empty
            if (!leaderboard || leaderboard.length === 0) {
                console.warn('⚠️ Leaderboard is empty! This might indicate a server-side issue.');
                console.log('🔍 DEBUG: Attempting to fetch game data directly...');

                // Try to fetch the game data directly to see what's available
                try {
                    const gameResponse = await fetch(`/api/bible-games/${gameState.currentGame.id}`);
                    const gameData = await gameResponse.json();
                    console.log('🔍 DEBUG: Direct game data:', gameData);

                    if (gameData.success && gameData.participants) {
                        console.log('🔍 DEBUG: Found participants in game data:', gameData.participants);
                        // Use participants data as fallback
                        await showMultiplayerLeaderboardFallback(gameData.participants);
                        return;
                    }
                } catch (fallbackError) {
                    console.error('❌ Fallback fetch failed:', fallbackError);
                }

                // If we get here, show error message but don't throw
                console.error('❌ Empty leaderboard - no fallback data available');
                showEmptyLeaderboardError();
                return;
            }

            // More robust user identification - try multiple field names and variations
            const currentUserResult = leaderboard.find(p => {
                const playerName = p.player_name || p.user_name || '';
                const currentUserName = gameState.currentUser?.name || '';

                // Try exact match first
                if (playerName === currentUserName) return true;

                // Try case-insensitive match
                if (playerName.toLowerCase() === currentUserName.toLowerCase()) return true;

                // Try trimmed match
                if (playerName.trim() === currentUserName.trim()) return true;

                // Try case-insensitive trimmed match
                if (playerName.trim().toLowerCase() === currentUserName.trim().toLowerCase()) return true;

                // Check if current user name contains player name or vice versa
                if (currentUserName.toLowerCase().includes(playerName.toLowerCase()) ||
                    playerName.toLowerCase().includes(currentUserName.toLowerCase())) return true;

                return false;
            });

            console.log('🔍 DEBUG: Current user result:', currentUserResult);
            console.log('🔍 DEBUG: Current user name:', gameState.currentUser?.name);
            console.log('🔍 DEBUG: Available player names:', leaderboard.map(p => p.player_name || p.user_name));
            console.log('🔍 DEBUG: Score comparison analysis:');
            console.log('🔍 DEBUG: Local gameState score:', gameState.score);
            console.log('🔍 DEBUG: Local gameState correct answers:', gameState.correctAnswers);
            console.log('🔍 DEBUG: API current user score:', currentUserResult?.score);
            console.log('🔍 DEBUG: API current user correct answers:', currentUserResult?.correct_answers);
            console.log('🔍 DEBUG: Participant score:', gameState.currentParticipant?.score);
            console.log('🔍 DEBUG: Participant correct answers:', gameState.currentParticipant?.correct_answers);
            console.log('🔍 DEBUG: Score differences:');
            console.log('🔍 DEBUG: Local vs API score diff:', (gameState.score - (currentUserResult?.score || 0)));
            console.log('🔍 DEBUG: Local vs API correct diff:', (gameState.correctAnswers - (currentUserResult?.correct_answers || 0)));
            console.log('🔍 DEBUG: API vs Participant score diff:', ((currentUserResult?.score || 0) - (gameState.currentParticipant?.score || 0)));
            console.log('🔍 DEBUG: API vs Participant correct diff:', ((currentUserResult?.correct_answers || 0) - (gameState.currentParticipant?.correct_answers || 0)));

            // Save authenticated user game data with finishing position
            const finalRank = currentUserResult?.rank || 1;
            await saveAuthenticatedUserGameData(finalRank);

            // Update stats with current user's results
            const finalScore = currentUserResult?.score || gameState.score;
            const finalCorrect = currentUserResult?.correct_answers || gameState.correctAnswers;
            const totalQuestions = gameState.currentGame?.questions_per_game || gameState.questions.length;

            console.log('🔍 DEBUG: Final stats assignment:');
            console.log('🔍 DEBUG: Final score to display:', finalScore);
            console.log('🔍 DEBUG: Final correct answers to display:', finalCorrect);
            console.log('🔍 DEBUG: Total questions for accuracy:', totalQuestions);
            console.log('🔍 DEBUG: Calculated accuracy:', Math.round((finalCorrect / totalQuestions) * 100) + '%');
            console.log('🔍 DEBUG: Final rank:', `#${finalRank}`);

            // Log which data source is being used for final stats
            if (currentUserResult) {
                console.log('🔍 DEBUG: Using API data for final stats');
                console.log('🔍 DEBUG: API score vs local score:', currentUserResult.score, 'vs', gameState.score);
                console.log('🔍 DEBUG: API correct vs local correct:', currentUserResult.correct_answers, 'vs', gameState.correctAnswers);
            } else {
                console.log('🔍 DEBUG: Using local gameState data for final stats (no API match found)');
            }

            document.getElementById('finalScore').textContent = finalScore;
            document.getElementById('finalCorrect').textContent = finalCorrect;
            const dynamicTotalQuestions = gameState.currentGame?.questions_per_game || gameState.questions.length;
            document.getElementById('finalAccuracy').textContent =
                Math.round((finalCorrect / dynamicTotalQuestions) * 100) + '%';
            document.getElementById('finalRank').textContent = `#${currentUserResult?.rank || 1}`;

            // Generate multiplayer leaderboard HTML
            const leaderboardHTML = leaderboard.map((participant, index) => {
                const rankNumberClass = `rank-${index + 1}`;

                // More robust current user detection for display
                const isCurrentUser = (() => {
                    const playerName = participant.player_name || participant.user_name || '';
                    const currentUserName = gameState.currentUser?.name || '';

                    // Try exact match first
                    if (playerName === currentUserName) return true;

                    // Try case-insensitive match
                    if (playerName.toLowerCase() === currentUserName.toLowerCase()) return true;

                    // Try trimmed match
                    if (playerName.trim() === currentUserName.trim()) return true;

                    // Try case-insensitive trimmed match
                    if (playerName.trim().toLowerCase() === currentUserName.trim().toLowerCase()) return true;

                    return false;
                })();

                console.log('🔍 DEBUG: Leaderboard player', index + 1, ':', {
                    name: participant.player_name,
                    score: participant.score,
                    correct_answers: participant.correct_answers,
                    rank: participant.rank,
                    isCurrentUser: isCurrentUser
                });

                // Set background based on rank and current user status
                let backgroundStyle = '';
                const isTopThree = index <= 2; // Top 3 positions get special backgrounds

                if (isCurrentUser && !isTopThree) {
                    // Current user gets special highlight if not in top 3
                    backgroundStyle = 'background: linear-gradient(135deg, #f0fffe 0%, #e6f7f5 100%); border: 2px solid var(--primary-teal);';
        } else if (!isTopThree) {
            // Non-top-3 get clean white background to match question review styling
            backgroundStyle = 'background: var(--primary-white);';
        }
                // For top 3 ranks, let CSS handle the special gradient backgrounds

                const rankNumber = index + 1;

            return `
                <div class="leaderboard-item ${rankNumberClass}" style="${backgroundStyle} ${isCurrentUser ? 'border-color: var(--primary-teal); box-shadow: 0 0 25px rgba(32, 178, 170, 0.25);' : ''}" ${isCurrentUser ? 'data-current-user="true"' : ''}>
                    <div class="rank">${rankNumber}</div>
                    <div class="player-info">
                        <div class="player-name">${participant.player_name} ${isCurrentUser ? '(You)' : ''}</div>
                        <div class="player-score">Score: ${participant.score} | Correct: ${participant.correct_answers}/${totalQuestions}</div>
                    </div>
                    <div class="final-score">${participant.score} pts</div>
                </div>
            `;
            }).join('');

            console.log('🔍 DEBUG: Final leaderboard HTML generated with', leaderboard.length, 'players');
            console.log('🔍 DEBUG: Leaderboard data summary:');
            leaderboard.forEach((p, i) => {
                console.log(`  ${i + 1}. ${p.player_name}: Score=${p.score}, Correct=${p.correct_answers}, Rank=${p.rank}`);
            });

            document.getElementById('leaderboardContainer').innerHTML = leaderboardHTML;
            console.log('✅ Multiplayer leaderboard displayed successfully with', leaderboard.length, 'players');

            // Generate question review with a small delay to ensure DOM is ready
            setTimeout(() => {
                generateQuestionReview();
            }, 100);
        } else {
            console.error('❌ Failed to fetch multiplayer results:', result.error);
            console.error('🔍 DEBUG: API result details:', result);
            console.error('🔍 DEBUG: Score mismatch analysis - API failed, comparing local state:');
            console.error('🔍 DEBUG: Local gameState score:', gameState.score);
            console.error('🔍 DEBUG: Local gameState correct answers:', gameState.correctAnswers);
            console.error('🔍 DEBUG: Participant score:', gameState.currentParticipant?.score);
            console.error('🔍 DEBUG: Participant correct answers:', gameState.currentParticipant?.correct_answers);
            throw new Error('Failed to fetch multiplayer results');
        }
    } catch (error) {
        console.error('❌ Error fetching multiplayer results:', error);
        console.error('🔍 DEBUG: Error occurred, attempting fallback leaderboard creation');
        console.error('🔍 DEBUG: Error details:', error.message);
        console.error('🔍 DEBUG: Error stack:', error.stack);
        // Try to create a basic leaderboard from current game state
        console.log('🔄 Attempting to create basic leaderboard from game state...');
        await createBasicLeaderboardFromGameState();
    }
}

async function showMultiplayerLeaderboardFallback(participants) {
    console.log('🔄 Using fallback leaderboard with participants data:', participants);
    console.log('🔍 DEBUG: Fallback participants count:', participants.length);
    console.log('🔍 DEBUG: Fallback participants data:', participants.map(p => ({
        name: p.player_name,
        score: p.score,
        correct_answers: p.correct_answers,
        finished_questions: p.finished_questions
    })));

    const totalQuestions = gameState.currentGame?.questions_per_game || gameState.questions.length;
    console.log('🔍 DEBUG: Fallback total questions:', totalQuestions);

    // Sort participants by score
    const sortedParticipants = participants.sort((a, b) => b.score - a.score);
    console.log('🔍 DEBUG: Sorted participants by score:', sortedParticipants.map(p => ({
        name: p.player_name,
        score: p.score,
        rank: sortedParticipants.indexOf(p) + 1
    })));

    // Find current user with robust matching
    const currentUserResult = sortedParticipants.find(p => {
        const playerName = p.player_name || '';
        const currentUserName = gameState.currentUser?.name || '';

        // Try exact match first
        if (playerName === currentUserName) return true;

        // Try case-insensitive match
        if (playerName.toLowerCase() === currentUserName.toLowerCase()) return true;

        // Try trimmed match
        if (playerName.trim() === currentUserName.trim()) return true;

        // Try case-insensitive trimmed match
        if (playerName.trim().toLowerCase() === currentUserName.trim().toLowerCase()) return true;

        return false;
    });

    // Save authenticated user game data with finishing position for fallback
    const fallbackRank = currentUserResult?.rank || sortedParticipants.findIndex(p => {
        const playerName = p.player_name || '';
        const currentUserName = gameState.currentUser?.name || '';
        return playerName === currentUserName ||
               playerName.toLowerCase() === currentUserName.toLowerCase() ||
               playerName.trim() === currentUserName.trim() ||
               playerName.trim().toLowerCase() === currentUserName.trim().toLowerCase();
    }) + 1 || 1;

    await saveAuthenticatedUserGameData(fallbackRank);

    // Update stats
    document.getElementById('finalScore').textContent = currentUserResult?.score || gameState.score;
    document.getElementById('finalCorrect').textContent = currentUserResult?.correct_answers || gameState.correctAnswers;
    const dynamicTotalQuestions = gameState.currentGame?.questions_per_game || gameState.questions.length;
    document.getElementById('finalAccuracy').textContent =
        Math.round(((currentUserResult?.correct_answers || gameState.correctAnswers) / dynamicTotalQuestions) * 100) + '%';
    document.getElementById('finalRank').textContent = `#${fallbackRank}`;

    // Generate fallback leaderboard HTML
    const leaderboardHTML = sortedParticipants.map((participant, index) => {
        const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
        const rankNumberClass = `rank-${index + 1}`;

        // More robust current user detection for display
        const isCurrentUser = (() => {
            const playerName = participant.player_name || '';
            const currentUserName = gameState.currentUser?.name || '';

            // Try exact match first
            if (playerName === currentUserName) return true;

            // Try case-insensitive match
            if (playerName.toLowerCase() === currentUserName.toLowerCase()) return true;

            // Try trimmed match
            if (playerName.trim() === currentUserName.trim()) return true;

            // Try case-insensitive trimmed match
            if (playerName.trim().toLowerCase() === currentUserName.trim().toLowerCase()) return true;

            return false;
        })();

        // Set background based on rank and current user status
        let backgroundStyle = '';
        const isTopThree = rankNumberClass === 'rank-1' || rankNumberClass === 'rank-2' || rankNumberClass === 'rank-3';

        if (isCurrentUser && !isTopThree) {
            // Current user gets special highlight if not in top 3 - match question review styling
            backgroundStyle = 'background: linear-gradient(135deg, #f0fffe 0%, #e6f7f5 100%); border: 2px solid var(--primary-teal);';
        } else if (!isTopThree) {
            // Non-top-3 get clean white background to match question review styling
            backgroundStyle = 'background: var(--primary-white);';
        }
        // For top 3 ranks, let CSS handle the trophy backgrounds

        // In showMultiplayerLeaderboard() - around line 2817
return `
    <div class="leaderboard-item ${rankNumberClass}" style="${backgroundStyle} ${isCurrentUser ? 'border-color: var(--cyber-cyan); box-shadow: 0 0 25px var(--cyber-cyan);' : ''}" ${isCurrentUser ? 'data-current-user="true"' : ''}>
                <div class="rank ${rankClass}">#${index + 1}</div>
                <div class="player-info">
                    <div class="player-name">${participant.player_name} ${isCurrentUser ? '(You)' : ''}</div>
                    <div class="player-score">Score: ${participant.score} | Correct: ${participant.correct_answers}/${totalQuestions}</div>
                </div>
                <div class="final-score">${participant.score} pts</div>
            </div>
        `;
    }).join('');

    document.getElementById('leaderboardContainer').innerHTML = leaderboardHTML;
    console.log('✅ Fallback multiplayer leaderboard displayed successfully with', sortedParticipants.length, 'players');
}

async function createBasicLeaderboardFromGameState() {
    console.log('🔄 Creating basic leaderboard from current game state...');
    console.log('🔍 DEBUG: Current game state:', gameState.currentGame);
    console.log('🔍 DEBUG: Current user:', gameState.currentUser);
    console.log('🔍 DEBUG: Current participant:', gameState.currentParticipant);

    try {
        // Fetch current game data to get participant information
        const response = await fetch(`/api/bible-games/${gameState.currentGame.id}`);
        const result = await response.json();

        console.log('🔍 DEBUG: Game data fetch result:', result);

        if (result.success && result.participants && result.participants.length > 0) {
            console.log('✅ Found participants data, creating leaderboard from it');
            console.log('🔍 DEBUG: Participants data:', result.participants);
            await showMultiplayerLeaderboardFallback(result.participants);
        } else {
            console.log('⚠️ No participants data available, showing error message');
            console.log('🔍 DEBUG: Result success:', result.success);
            console.log('🔍 DEBUG: Participants available:', result.participants?.length || 0);
            showEmptyLeaderboardError();
        }
    } catch (error) {
        console.error('❌ Error creating basic leaderboard:', error);
        console.error('🔍 DEBUG: Error details:', error.message);
        console.error('🔍 DEBUG: Error stack:', error.stack);
        showEmptyLeaderboardError();
    }
}

function showEmptyLeaderboardError() {
    console.error('❌ Empty leaderboard detected - showing error message');
    console.log('🔍 DEBUG: Current game state:', gameState.currentGame);
    console.log('🔍 DEBUG: Current user:', gameState.currentUser);
    console.log('🔍 DEBUG: Questions length:', gameState.questions?.length);
    console.log('🔍 DEBUG: Current participant:', gameState.currentParticipant);
    console.log('🔍 DEBUG: Game state score:', gameState.score);
    console.log('🔍 DEBUG: Game state correct answers:', gameState.correctAnswers);
    console.log('🔍 DEBUG: Participant score:', gameState.currentParticipant?.score);
    console.log('🔍 DEBUG: Participant correct answers:', gameState.currentParticipant?.correct_answers);

    // Show error message to user
    const leaderboardContainer = document.getElementById('leaderboardContainer');
    const totalQuestions = gameState.currentGame?.questions_per_game || gameState.questions.length;

    console.log('🔍 DEBUG: Error display - total questions:', totalQuestions);
    console.log('🔍 DEBUG: Error display - showing score:', gameState.score);
    console.log('🔍 DEBUG: Error display - showing correct answers:', gameState.correctAnswers);

    leaderboardContainer.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #f44336;">
            <h3>⚠️ Leaderboard Unavailable</h3>
            <p>The multiplayer results could not be loaded at this time.</p>
            <p>This might be due to a server-side issue or the game not being completed properly.</p>
            <p>Your final score: <strong>${gameState.score} points</strong></p>
            <p>Correct answers: <strong>${gameState.correctAnswers}/${totalQuestions}</strong></p>
            <button onclick="resetAndRestart()" class="btn" style="margin-top: 15px;">Play Again</button>
        </div>
    `;

    // Update stats with current game state
    console.log('🔍 DEBUG: Setting final stats from game state:');
    console.log('🔍 DEBUG: Setting final score:', gameState.score);
    console.log('🔍 DEBUG: Setting final correct:', gameState.correctAnswers);
    console.log('🔍 DEBUG: Setting final accuracy:', Math.round((gameState.correctAnswers / totalQuestions) * 100) + '%');

    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalCorrect').textContent = gameState.correctAnswers;
    const dynamicTotalQuestions = gameState.currentGame?.questions_per_game || gameState.questions.length;
    document.getElementById('finalAccuracy').textContent =
        Math.round((gameState.correctAnswers / dynamicTotalQuestions) * 100) + '%';
    document.getElementById('finalRank').textContent = '#1';
}

function debugLeaderboardData(leaderboard) {
    console.log('🔍 LEADERBOARD DEBUG INFO:');
    console.log('Total players in leaderboard:', leaderboard.length);
    console.log('Current user name:', gameState.currentUser?.name);
    console.log('Current user name type:', typeof gameState.currentUser?.name);
    console.log('Current user name length:', gameState.currentUser?.name?.length);

    console.log('All player names in leaderboard:');
    leaderboard.forEach((player, index) => {
        console.log(`  Player ${index + 1}:`, {
            player_name: player.player_name,
            user_name: player.user_name,
            id: player.id,
            score: player.score,
            rank: player.rank,
            type_player_name: typeof player.player_name,
            type_user_name: typeof player.user_name
        });
    });

    // Test different matching scenarios
    const testMatches = leaderboard.map(player => {
        const playerName = player.player_name || player.user_name || '';
        const currentUserName = gameState.currentUser?.name || '';

        return {
            player_name: playerName,
            exact_match: playerName === currentUserName,
            case_insensitive: playerName.toLowerCase() === currentUserName.toLowerCase(),
            trimmed_exact: playerName.trim() === currentUserName.trim(),
            trimmed_case_insensitive: playerName.trim().toLowerCase() === currentUserName.trim().toLowerCase(),
            contains_current: currentUserName.toLowerCase().includes(playerName.toLowerCase()),
            contains_player: playerName.toLowerCase().includes(currentUserName.toLowerCase())
        };
    });

    console.log('Match test results:', testMatches);
}

async function endGame() {
    try {
        // Clear all intervals
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
            gameState.timerInterval = null;
        }
        if (gameState.gameUpdateInterval) {
            clearInterval(gameState.gameUpdateInterval);
            gameState.gameUpdateInterval = null;
        }
        if (window.progressInterval) {
            clearInterval(window.progressInterval);
            window.progressInterval = null;
        }

        // Stop faith verses
        if (verseInterval) {
            clearInterval(verseInterval);
            verseInterval = null;
        }

        // Remove any remaining faith verses and decorations
        const existingVerses = document.querySelectorAll('.faith-verse');
        existingVerses.forEach(verse => verse.remove());
        const existingDecorations = document.querySelectorAll('.verse-decorations');
        existingDecorations.forEach(decoration => decoration.remove());

        // Clear any countdown overlays
        const countdownOverlay = document.getElementById('countdownOverlay');
        if (countdownOverlay) {
            countdownOverlay.style.display = 'none';
        }

        // Clear any light flash effects
        const lightFlashes = document.querySelectorAll('.light-flash');
        lightFlashes.forEach(flash => flash.remove());

        // Clear any error messages
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.style.display = 'none';
            errorMessage.textContent = '';
        }

        // Clear loading section text
        const questionProgress = document.getElementById('questionProgress');
        if (questionProgress) {
            questionProgress.textContent = '';
        }

        // Hide loading section
        loadingSection.classList.remove('section-active');

        // Reset game state flags
        gameState.gameActive = false;
        gameState.answerLocked = false;
        gameState.selectedAnswer = null;

        // Check if multiplayer game
        if (gameState.isMultiplayer && gameState.currentGame && gameState.currentParticipant) {
            // Use the robust multiplayer leaderboard function
            try {
                await showMultiplayerLeaderboard();
            } catch (error) {
                console.error('❌ Error in multiplayer leaderboard, falling back to basic results:', error);
                showBasicResults();
            }
        } else {
            // Solo game results
            showBasicResults();
        }

        // Activate results section
        gameSection.classList.remove('section-active');
        resultsSection.classList.add('section-active');
        updateSupportButtonVisibility(); // Hide support button for results section

    } catch (error) {
        console.error('❌ Error in endGame function:', error);
        // Fallback: try to show basic results even if there's an error
        try {
            showBasicResults();
            gameSection.classList.remove('section-active');
            resultsSection.classList.add('section-active');
        } catch (fallbackError) {
            console.error('❌ Fallback also failed:', fallbackError);
            alert('Error displaying game results. Please refresh and try again.');
        }
    }
}

function showBasicResults() {
    const dynamicTotalQuestions = gameState.currentGame?.questions_per_game || gameState.questions.length;

    // Ensure we have valid data before displaying results
    const finalScore = gameState.score || 0;
    const finalCorrect = gameState.correctAnswers || 0;
    const userName = gameState.currentUser?.name || 'Player';

    document.getElementById('finalScore').textContent = finalScore;
    document.getElementById('finalCorrect').textContent = finalCorrect;
    document.getElementById('finalAccuracy').textContent =
        Math.round((finalCorrect / dynamicTotalQuestions) * 100) + '%';
    document.getElementById('finalRank').textContent = '#1';

    const leaderboardHTML = `
        <div class="leaderboard-item" style="background: var(--primary-white);">
            <div class="rank rank-1">#1</div>
            <div class="player-info">
                <div class="player-name">${userName} (You)</div>
                <div class="player-score">Score: ${finalScore} | Correct: ${finalCorrect}/${dynamicTotalQuestions}</div>
            </div>
            <div class="final-score">${finalScore} pts</div>
        </div>
    `;

    document.getElementById('leaderboardContainer').innerHTML = leaderboardHTML;

    // Generate question review with error handling
    try {
        setTimeout(() => {
            generateQuestionReview();
        }, 100);
    } catch (error) {
        const container = document.getElementById('questionReviewContainer');
        if (container) {
            container.innerHTML = '<p>Error loading question review.</p>';
        }
    }
}

function generateQuestionReview() {
    let container = document.getElementById('questionReviewContainer');

    if (!container) {
        // Create the container if it doesn't exist
        const resultsSection = document.querySelector('.results-section');
        if (resultsSection) {
            const reviewDiv = document.createElement('div');
            reviewDiv.id = 'questionReviewContainer';
            reviewDiv.className = 'question-review-container';

            // Insert it into the results section - the container should be inside the question-review div
            const questionReviewDiv = resultsSection.querySelector('.question-review');
            if (questionReviewDiv) {
                // Replace the existing container or add it if missing
                const existingContainer = questionReviewDiv.querySelector('#questionReviewContainer');
                if (existingContainer) {
                    // Container already exists, just use it
                    container = existingContainer;
                } else {
                    // Add the container to the question-review div
                    questionReviewDiv.appendChild(reviewDiv);
                    container = reviewDiv;
                }
            } else {
                // Fallback: create the entire question-review section
                const questionReviewSection = document.createElement('div');
                questionReviewSection.className = 'question-review';
                questionReviewSection.innerHTML = `
                    <h3>📝 Question Review & Answers</h3>
                    <p class="review-subtitle">See where you went right and where you can improve!</p>
                `;
                questionReviewSection.appendChild(reviewDiv);
                resultsSection.appendChild(questionReviewSection);
                container = reviewDiv;
            }
        } else {
            return;
        }
    }

    if (!gameState.questions || gameState.questions.length === 0) {
        container.innerHTML = '<p>No questions available for review.</p>';
        return;
    }

    try {
        const reviewHTML = gameState.questions.map((question, index) => {
            const questionNumber = question.questionNumber || (index + 1);
            const difficultyClass = `difficulty-${question.difficulty || 'easy'}`;
            const difficultyText = question.difficulty ? question.difficulty.toUpperCase() : 'EASY';

            // Ensure we have valid question data
            const questionText = question.text || 'Question text not available';
            const correctAnswer = question.correctAnswer || '';
            const options = Array.isArray(question.options) ? question.options : [];

            // Get user's answer for this question
            const userAnswer = gameState.userAnswers[index];
            const wasTimeout = userAnswer === null;
            const wasWrong = userAnswer !== null && userAnswer !== correctAnswer;

            return `
                <div class="question-review-item">
                    <div class="question-review-header">
                        <div class="question-review-number">Question ${questionNumber}</div>
                        <div class="question-review-difficulty ${difficultyClass}">
                            ${difficultyText}
                        </div>
                        ${wasTimeout ? '<div class="timeout-indicator">⏰ Timeout</div>' : ''}
                    </div>
                    <div class="question-review-content">
                        <div class="question-review-text">${questionText}</div>
                        ${question.reference ? `<div class="question-review-reference">${question.reference}</div>` : ''}
                        <div class="question-review-answers">
                            <div class="question-review-options">
                                ${options.map((option, optionIndex) => {
                                    const isCorrect = option === correctAnswer;
                                    const isUserChoice = option === userAnswer;
                                    const optionLetter = String.fromCharCode(65 + optionIndex);
                                    const optionText = option || `Option ${optionLetter}`;

                                    let optionClass = '';
                                    let indicator = '';

                                    if (isCorrect) {
                                        optionClass = 'correct';
                                        indicator = '<span class="correct-indicator">✓ Correct Answer</span>';
                                    } else if (isUserChoice && wasWrong) {
                                        optionClass = 'wrong';
                                        indicator = '<span class="wrong-indicator">✗ Your Choice</span>';
                                    }

                                    return `
                                        <div class="question-review-option ${optionClass}">
                                            <span class="option-letter">${optionLetter}.</span>
                                            <span class="option-text">${optionText}</span>
                                            ${indicator}
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = reviewHTML;
    } catch (error) {
        container.innerHTML = '<p>Error loading question review.</p>';
    }
}

function showSinglePlayerResults() {
    const totalQuestions = gameState.currentGame?.questions_per_game || gameState.questions.length;

    gameState.contestants.forEach(contestant => {
        if (contestant.isBot) {
            // Dynamic system: Max score varies by difficulty
            const difficulty = gameState.currentUser?.difficulty || 'easy';
            const totalQuestionsInDifficulty = gameState.questions.filter(q => q.difficulty === difficulty).length;
            const pointsPerQuestion = getPointsForDifficulty(difficulty, totalQuestionsInDifficulty);
            const maxScorePerQuestion = pointsPerQuestion * 2; // Max possible with time bonus
            contestant.score = Math.floor(Math.random() * (totalQuestions * maxScorePerQuestion));
            contestant.correctAnswers = Math.floor(Math.random() * totalQuestions);
        }
    });

    gameState.contestants.sort((a, b) => b.score - a.score);

    const userRank = gameState.contestants.findIndex(c => c.name === gameState.currentUser.name) + 1;

    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalCorrect').textContent = gameState.correctAnswers;
    const dynamicTotalQuestions = gameState.currentGame?.questions_per_game || gameState.questions.length;
    document.getElementById('finalAccuracy').textContent =
        Math.round((gameState.correctAnswers / dynamicTotalQuestions) * 100) + '%';
    document.getElementById('finalRank').textContent = `#${userRank}`;

    const leaderboardHTML = gameState.contestants.map((contestant, index) => {
        const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
        const rankNumberClass = `rank-${index + 1}`;
        const isCurrentUser = contestant.name === gameState.currentUser.name;

        // Set background based on rank and current user status
        let backgroundStyle = '';
        const isTopThree = rankNumberClass === 'rank-1' || rankNumberClass === 'rank-2' || rankNumberClass === 'rank-3';

        if (isCurrentUser && !isTopThree) {
            // Current user gets cyan gradient only if not in top 3
            backgroundStyle = 'background: linear-gradient(135deg, var(--cyber-dark-gray) 0%, rgba(0, 255, 255, 0.3) 100%);';
        } else if (!isTopThree) {
            // Non-current users get default background if not in top 3
            backgroundStyle = 'background: #1a1a1a;';
        }
        // For top 3 ranks, let CSS handle the trophy backgrounds

        // In showMultiplayerLeaderboard() - around line 2817
return `
    <div class="leaderboard-item ${rankNumberClass}" style="${backgroundStyle} ${isCurrentUser ? 'border-color: var(--cyber-cyan); box-shadow: 0 0 25px var(--cyber-cyan);' : ''}" ${isCurrentUser ? 'data-current-user="true"' : ''}>
                <div class="rank ${rankClass}">#${index + 1}</div>
                <div class="player-info">
                    <div class="player-name">${contestant.name} ${isCurrentUser ? '(You)' : ''}</div>
                    <div class="player-score">Score: ${contestant.score} | Correct: ${contestant.correctAnswers}/${totalQuestions}</div>
                </div>
                <div class="final-score">${contestant.score} pts</div>
            </div>
        `;
    }).join('');

    document.getElementById('leaderboardContainer').innerHTML = leaderboardHTML;
}

function resetAndRestart() {
    // Comprehensive cleanup before restart
    cleanupGameState();

    // Complete reset with new session ID
    gameState = {
        currentUser: null,
        contestants: [],
        questions: [],
        sessionId: Date.now() + Math.random(), // New unique session
        currentQuestionIndex: 0,
        score: 0,
        correctAnswers: 0,
        selectedAnswer: null,
        answerLocked: false,
        timeLeft: 10,
        timerInterval: null,
        gameActive: false,
        usedQuestions: new Set(),

        // Reset multiplayer state
        isMultiplayer: false,
        currentGame: null,
        currentParticipant: null,
        gameRoomId: null,
        gameUpdateInterval: null,
        isGameCreator: false,
        pendingJoinGameId: null,
    
        // Reset loading state
        loadingState: {
            gameId: null,
            totalQuestions: 10,
            generatedQuestions: 0,
            lastKnownCount: 0,
            isGenerating: false,
            errorCount: 0,
            maxErrors: 5,
            retryCount: 0,
            maxRetries: 3,
            canRetry: true,
            startTime: null
        }
    };

    // All AI processing moved to server-side

    resultsSection.classList.remove('section-active');
    multiplayerLobbySection.classList.add('section-active');

    // Login form removed for trivia1
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('questionProgress').textContent = '';

    // Load global leaderboard when returning to lobby
    loadGlobalLeaderboard();

    // Show support button when returning to lobby
    updateSupportButtonVisibility();
}

window.addEventListener('load', () => {
    // Production: Removed console logs for cleaner output
    // console.log('GospelWays Bible Trivia - Server-side AI Generation');
    // console.log('Session ID:', gameState.sessionId);
});

// Modal Functions
function openCreateMultiplayerModal() {
    // Open the modal first
    openModal('createMultiplayerModal');

    // Small delay to ensure modal is fully rendered before manipulating elements
    setTimeout(() => {
        // Check if user is authenticated
        if (window.authenticatedUser && window.authenticatedUser.name) {
            console.log('🔐 Authenticated user detected for multiplayer create, showing locked name field');
            // Show the name field but make it readonly for authenticated users
            const nameGroup = document.getElementById('multiplayerPlayerNameGroup');
            if (nameGroup) {
                nameGroup.style.display = 'block';
            }
            const nameInput = document.getElementById('multiplayerPlayerName');
            if (nameInput) {
                nameInput.value = window.authenticatedUser.name;
                nameInput.readOnly = true; // Lock the field for authenticated users (still submits with form)
                nameInput.required = false; // Remove required for authenticated users
                nameInput.style.backgroundColor = '#f0f0f0';
                nameInput.style.color = '#666';
                nameInput.style.border = '2px solid #4CAF50';
                nameInput.style.cursor = 'not-allowed';
                nameInput.placeholder = 'Authenticated - cannot edit';
            }
            // Update label to indicate it's locked
            if (nameGroup) {
                const label = nameGroup.querySelector('label');
                if (label) {
                    label.textContent = 'Your Name (Authenticated)';
                }
            }
        } else {
            // Show the name field as editable for guest users
            const nameGroup = document.getElementById('multiplayerPlayerNameGroup');
            if (nameGroup) {
                nameGroup.style.display = 'block';
            }
            const nameInput = document.getElementById('multiplayerPlayerName');
            if (nameInput) {
                nameInput.readOnly = false;
                nameInput.required = true; // Ensure required for guest users
                nameInput.style.backgroundColor = '';
                nameInput.style.color = '';
                nameInput.value = loadPlayerName() || ''; // Pre-populate with saved name if available
                nameInput.placeholder = 'Enter your name';
            }
            // Reset label
            if (nameGroup) {
                const label = nameGroup.querySelector('label');
                if (label) {
                    label.textContent = 'Your Name';
                }
            }
        }
    }, 100); // 100ms delay should be sufficient
}

function openModal(modalId) {
    // Prevent opening multiple modals at once
    const activeModal = document.querySelector('.modal-overlay.active');
    if (activeModal && activeModal.id !== modalId) {
        console.log('🔒 Another modal is already active, closing it first');
        closeModal(activeModal.id);
    }

    const modal = document.getElementById(modalId);
    if (modal) {
        console.log(`🔓 Opening modal: ${modalId}`);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        console.error(`❌ Modal not found: ${modalId}`);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Return to Game Lobby function
function returnToLobby() {
    console.log('🏠 Returning to game lobby from results page');

    // Hide results section
    resultsSection.classList.remove('section-active');

    // Show multiplayer lobby section
    multiplayerLobbySection.classList.add('section-active');

    // Update support button visibility
    updateSupportButtonVisibility();

    // Optional: Load fresh leaderboard data
    loadGlobalLeaderboard();
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        const modalId = e.target.id;
        closeModal(modalId);
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) {
            closeModal(activeModal.id);
        }
    }
});

// Button Event Listeners for Modals
document.getElementById('createGameBtn').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openCreateMultiplayerModal();
});
document.getElementById('joinGameBtn').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔗 Join Game button clicked');
    openModal('joinGameModal');
});
document.getElementById('playSoloBtn').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openModal('playSoloModal');
});

// Form Submissions
document.addEventListener('DOMContentLoaded', function() {

    const createForm = document.getElementById('createMultiplayerForm');
    if (createForm) {

        // Add form validation
        const gameNameInput = document.getElementById('multiplayerGameName');
        const difficultySelect = document.getElementById('multiplayerDifficulty');
        const maxPlayersSelect = document.getElementById('multiplayerMaxPlayers');
        const questionsSelect = document.getElementById('multiplayerQuestions');

        if (gameNameInput && difficultySelect && maxPlayersSelect && questionsSelect) {
        } else {
            console.error('❌ Some form elements missing:', {
                gameNameInput: !!gameNameInput,
                difficultySelect: !!difficultySelect,
                maxPlayersSelect: !!maxPlayersSelect,
                questionsSelect: !!questionsSelect
            });
        }

        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent any other event listeners from firing

            console.log('🎮 Create multiplayer form submitted');

            const gameName = document.getElementById('multiplayerGameName').value.trim();
            let playerName;

            // Check if user is authenticated
            if (window.authenticatedUser && window.authenticatedUser.name) {
                playerName = window.authenticatedUser.name;
                console.log('🔐 Using authenticated user name:', playerName);
            } else {
                playerName = document.getElementById('multiplayerPlayerName').value.trim();
                console.log('👤 Using form input name:', playerName);
            }

            const difficulty = document.getElementById('multiplayerDifficulty').value;
            const maxPlayers = parseInt(document.getElementById('multiplayerMaxPlayers').value);
            const questions = parseInt(document.getElementById('multiplayerQuestions').value);

            // Validate question count to prevent timeouts
            if (questions > 15) {
                alert('⚠️ Warning: More than 15 questions may cause timeouts. Please select 15 or fewer questions for best performance.');
                return;
            }

            console.log('📝 Form values:', { gameName, playerName, difficulty, maxPlayers, questions });

            if (!gameName) {
                console.log('⚠️ Game name validation failed');
                alert('Please enter a game name');
                return;
            }

            if (!playerName) {
                console.log('⚠️ Player name validation failed');
                alert('Please enter your name');
                return;
            }

            console.log('🔒 Closing create multiplayer modal');
            closeModal('createMultiplayerModal');

            // Set user with entered name
            gameState.currentUser = {
                name: playerName,
                difficulty: difficulty,
                score: 0,
                correctAnswers: 0
            };
            savePlayerName(playerName);
            console.log('✅ User name set:', gameState.currentUser.name);

            console.log('🚀 Creating multiplayer game...');

            // Create the game
            try {
                const response = await fetch('/api/bible-games/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: gameName,
                        difficulty: difficulty,
                        maxPlayers: maxPlayers,
                        questionsPerGame: questions,
                        timePerQuestion: 15,
                        playerName: gameState.currentUser.name
                    })
                });

                const result = await response.json();
                console.log('📡 Create game API response:', result);

                if (result.success) {
                    console.log('✅ Multiplayer game created successfully:', result.game.id);
                    gameState.isMultiplayer = true;
                    gameState.currentGame = result.game;
                    gameState.isGameCreator = true;
                    gameState.gameRoomId = result.game.id;

                    console.log('🔗 Joining game as creator...');

                    // Join as creator
                    const joinResponse = await fetch(`/api/bible-games/${result.game.id}/join-guest`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ playerName: gameState.currentUser.name })
                    });

                    const joinResult = await joinResponse.json();
                    console.log('📡 Join game API response:', joinResult);

                    if (joinResult.success) {
                        console.log('✅ Successfully joined game as creator');
                        gameState.currentParticipant = joinResult.participant;
                        showGameRoom(result.game, result.participants || []);
                        startGameRoomUpdates();
                    } else {
                        console.error('❌ Failed to join game:', joinResult.error);
                        alert('Failed to join game: ' + joinResult.error);
                    }
                } else {
                    console.error('❌ Failed to create game:', result.error);
                    alert('Failed to create game: ' + result.error);
                }
            } catch (error) {
                console.error('❌ Error creating multiplayer game:', error);
                alert('Failed to create game. Please try again.');
            }
        });
    } else {
        console.error('❌ Create multiplayer form not found!');
    }

    // Also add a direct click listener to the submit button as backup
    const submitButton = document.querySelector('#createMultiplayerForm button[type="submit"]');
    if (submitButton) {

        // Remove any existing click listeners to prevent conflicts
        const newSubmitButton = submitButton.cloneNode(true);
        submitButton.parentNode.replaceChild(newSubmitButton, submitButton);

        // Use the new button for the event listener
        newSubmitButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            // If the form submission didn't work, try to handle it directly
            const gameName = document.getElementById('multiplayerGameName').value.trim();
            let playerName;

            // Check if user is authenticated
            if (window.authenticatedUser && window.authenticatedUser.name) {
                playerName = window.authenticatedUser.name;
                console.log('🔐 Direct button click - Using authenticated user name:', playerName);
            } else {
                playerName = document.getElementById('multiplayerPlayerName').value.trim();
            }

            const difficulty = document.getElementById('multiplayerDifficulty').value;
            const maxPlayers = parseInt(document.getElementById('multiplayerMaxPlayers').value);
            const questions = parseInt(document.getElementById('multiplayerQuestions').value);


            if (!gameName) {
                console.log('⚠️ Direct button click - Game name validation failed');
                alert('Please enter a game name');
                return;
            }

            if (!playerName) {
                console.log('⚠️ Direct button click - Player name validation failed');
                alert('Please enter your name');
                return;
            }

            closeModal('createMultiplayerModal');

            // Set user with entered name
            gameState.currentUser = {
                name: playerName,
                difficulty: difficulty,
                score: 0,
                correctAnswers: 0
            };
            savePlayerName(playerName);


            // Create the game
            try {
                const response = await fetch('/api/bible-games/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: gameName,
                        difficulty: difficulty,
                        maxPlayers: maxPlayers,
                        questionsPerGame: questions,
                        timePerQuestion: 15,
                        playerName: gameState.currentUser.name
                    })
                });

                const result = await response.json();

                if (result.success) {
                    gameState.isMultiplayer = true;
                    gameState.currentGame = result.game;
                    gameState.isGameCreator = true;
                    gameState.gameRoomId = result.game.id;


                    // Join as creator
                    const joinResponse = await fetch(`/api/bible-games/${result.game.id}/join-guest`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ playerName: gameState.currentUser.name })
                    });

                    const joinResult = await joinResponse.json();

                    if (joinResult.success) {
                        gameState.currentParticipant = joinResult.participant;
                        showGameRoom(result.game, result.participants || []);
                        startGameRoomUpdates();
                    } else {
                        console.error('❌ Direct button click - Failed to join game:', joinResult.error);
                        alert('Failed to join game: ' + joinResult.error);
                    }
                } else {
                    console.error('❌ Direct button click - Failed to create game:', result.error);
                    alert('Failed to create game: ' + result.error);
                }
            } catch (error) {
                console.error('❌ Direct button click - Error creating multiplayer game:', error);
                alert('Failed to create game. Please try again.');
            }
        });
    } else {
        console.error('❌ Submit button not found!');
    }
});

document.getElementById('playSoloForm').addEventListener('submit', startSoloGame);

// Join Game Options
document.getElementById('quickJoinBtn').addEventListener('click', async () => {
    closeModal('joinGameModal');

    // Check if user has a name set
    if (!gameState.currentUser || !gameState.currentUser.name) {
        const playerName = await showProfessionalNamePrompt();
        if (!playerName || !playerName.trim()) {
            return;
        }
        gameState.currentUser = {
            name: playerName.trim(),
            difficulty: 'easy',
            score: 0,
            correctAnswers: 0
        };
        savePlayerName(playerName.trim());
    }

    // Load available games and join the first one
    try {
        const response = await fetch('/api/bible-games?status=waiting');
        const result = await response.json();

        if (result.success && result.games.length > 0) {
            const availableGame = result.games.find(game => game.current_players < game.max_players);
            if (availableGame) {
                joinGame(availableGame.id);
            } else {
                alert('No available games to join. Try creating a new game!');
            }
        } else {
            alert('No games available. Try creating a new game!');
        }
    } catch (error) {
        console.error('Error finding games:', error);
        alert('Failed to find games. Please try again.');
    }
});

document.getElementById('browseGamesBtn').addEventListener('click', async () => {
    console.log('🔍 Browse Games button clicked');

    // Create the browse games modal dynamically to avoid caching issues
    createBrowseGamesModal();

    // Open the browse games modal
    openModal('browseGamesModal');
    console.log('🔍 Browse Games modal opened');

    // Small delay to ensure modal is fully rendered
    setTimeout(async () => {
        console.log('🔍 Starting loadBrowseGames after delay');
        await loadBrowseGames();
    }, 150);
});

// Function to create the browse games modal dynamically
function createBrowseGamesModal() {
    // Check if modal already exists
    if (document.getElementById('browseGamesModal')) {
        console.log('🔍 Browse games modal already exists');
        return;
    }

    console.log('🔍 Creating browse games modal dynamically');

    const modalHTML = `
        <div id="browseGamesModal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🔍 Available Battle Arenas</h3>
                    <button class="modal-close" onclick="closeModal('browseGamesModal')">✕</button>
                </div>
                <div class="modal-body">
                    <div class="games-filter-section">
                        <div class="filter-controls">
                            <div class="filter-group">
                                <label for="browseDifficultyFilter">Difficulty:</label>
                                <select id="browseDifficultyFilter">
                                    <option value="">All Difficulties</option>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                    <option value="expert">Expert</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label for="browsePlayersFilter">Players:</label>
                                <select id="browsePlayersFilter">
                                    <option value="">Any Size</option>
                                    <option value="2">2 Players</option>
                                    <option value="4">Up to 4</option>
                                    <option value="6">Up to 6</option>
                                    <option value="10">Up to 10</option>
                                </select>
                            </div>
                            <button id="refreshBrowseGamesBtn" class="btn refresh-btn">🔄 Refresh</button>
                        </div>
                    </div>
                    <div id="browseGamesList" class="games-list">
                        <div class="loading-games">Loading available games...</div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn cancel-btn" onclick="closeModal('browseGamesModal')">Back</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Insert the modal at the end of the container
    const container = document.querySelector('.container');
    if (container) {
        container.insertAdjacentHTML('beforeend', modalHTML);
        console.log('✅ Browse games modal created successfully');

        // Re-attach event listeners for the newly created elements
        attachBrowseGamesEventListeners();
    } else {
        console.error('❌ Container not found for modal insertion');
    }
}

// Function to attach event listeners for browse games modal
function attachBrowseGamesEventListeners() {
    // Browse Games Modal Event Listeners
    const refreshBtn = document.getElementById('refreshBrowseGamesBtn');
    const difficultyFilter = document.getElementById('browseDifficultyFilter');
    const playersFilter = document.getElementById('browsePlayersFilter');

    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            // Only load if modal is actually open
            if (document.getElementById('browseGamesModal').classList.contains('active')) {
                await loadBrowseGames();
            }
        });
    }

    if (difficultyFilter) {
        difficultyFilter.addEventListener('change', async () => {
            // Only load if modal is actually open
            if (document.getElementById('browseGamesModal').classList.contains('active')) {
                await loadBrowseGames();
            }
        });
    }

    if (playersFilter) {
        playersFilter.addEventListener('change', async () => {
            // Only load if modal is actually open
            if (document.getElementById('browseGamesModal').classList.contains('active')) {
                await loadBrowseGames();
            }
        });
    }
}

document.getElementById('joinByCodeBtn').addEventListener('click', async () => {
    const gameCode = document.getElementById('gameCodeInput').value.trim();
    if (!gameCode) {
        alert('Please enter a game code');
        return;
    }

    closeModal('joinGameModal');

    // Check if user has a name set
    if (!gameState.currentUser || !gameState.currentUser.name) {
        const playerName = await showProfessionalNamePrompt();
        if (!playerName || !playerName.trim()) {
            return;
        }
        gameState.currentUser = {
            name: playerName.trim(),
            difficulty: 'easy',
            score: 0,
            correctAnswers: 0
        };
        savePlayerName(playerName.trim());
    }

    // Try to join the game by ID
    try {
        joinGame(gameCode);
    } catch (error) {
        console.error('Error joining game by code:', error);
        alert('Invalid game code or game not found.');
    }
});

// Browse games event listeners are now attached dynamically in attachBrowseGamesEventListeners()
