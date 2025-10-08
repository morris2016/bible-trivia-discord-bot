// Bible Trivia Game Logic - Modularized from bible-contest.html

// Configuration - All AI processing moved to server-side for security

// Inspiring faith verses for loading screen - Complete NKJV verses
const faithVerses = [
    "For we walk by faith, not by sight. - 2 Corinthians 5:7 NKJV",
    "Now faith is the substance of things hoped for, the evidence of things not seen. - Hebrews 11:1 NKJV",
    "But without faith it is impossible to please Him, for he who comes to God must believe that He is, and that He is a rewarder of those who diligently seek Him. - Hebrews 11:6 NKJV",
    "Trust in the Lord with all your heart, and lean not on your own understanding; In all your ways acknowledge Him, and He shall direct your paths. - Proverbs 3:5-6 NKJV",
    "I can do all things through Christ who strengthens me. - Philippians 4:13 NKJV",
    "Have I not commanded you? Be strong and of good courage; do not be afraid, nor be dismayed, for the Lord your God is with you wherever you go. - Joshua 1:9 NKJV",
    "The Lord is my strength and my shield; My heart trusted in Him, and I am helped; Therefore my heart greatly rejoices, and with my song I will praise Him. - Psalm 28:7 NKJV",
    "But those who wait on the Lord shall renew their strength; They shall mount up with wings like eagles, they shall run and not be weary, they shall walk and not faint. - Isaiah 40:31 NKJV",
    "So then faith comes by hearing, and hearing by the word of God. - Romans 10:17 NKJV",
    "For by grace you have been saved through faith, and that not of yourselves; it is the gift of God, not of works, lest anyone should boast. - Ephesians 2:8-9 NKJV",
    "Let us hold fast the confession of our hope without wavering, for He who promised is faithful. - Hebrews 10:23 NKJV",
    "For in it the righteousness of God is revealed from faith to faith; as it is written, 'The just shall live by faith.' - Romans 1:17 NKJV",
    "I have fought the good fight, I have finished the race, I have kept the faith. Finally, there is laid up for me the crown of righteousness, which the Lord, the righteous Judge, will give to me on that Day, and not to me only but also to all who have loved His appearing. - 2 Timothy 4:7-8 NKJV",
    "Watch, stand fast in the faith, be brave, be strong. - 1 Corinthians 16:13 NKJV",
    "For whatever is born of God overcomes the world. And this is the victory that has overcome the world—our faith. - 1 John 5:4 NKJV",
    "Therefore, having been justified by faith, we have peace with God through our Lord Jesus Christ. - Romans 5:1 NKJV",
    "But let him ask in faith, with no doubting, for he who doubts is like a wave of the sea driven and tossed by the wind. - James 1:6 NKJV",
    "And the apostles said to the Lord, 'Increase our faith.' - Luke 17:5 NKJV",
    "For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life. - John 3:16 NKJV",
    "Jesus said to him, 'If you can believe, all things are possible to him who believes.' - Mark 9:23 NKJV"
];

let verseInterval;
let verseCounter = 0; // Track verse alternation

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

    // Multiplayer additions
    isMultiplayer: false,
    currentGame: null, // Current multiplayer game
    currentParticipant: null, // Current player's participant record
    gameRoomId: null,
    gameUpdateInterval: null, // For polling game updates
    isGameCreator: false,
    isSoloMode: false,  // Add explicit solo mode flag
    pendingJoinGameId: null  // For direct URL joining
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

// DOM Elements
const loginSection = document.querySelector('.login-section');
const loadingSection = document.querySelector('.loading-section');
const lobbySection = document.querySelector('.lobby-section');
const gameSection = document.querySelector('.game-section');
const resultsSection = document.querySelector('.results-section');
const multiplayerLobbySection = document.querySelector('.multiplayer-lobby-section');

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

// Homepage Navigation
function goHome() {
    window.location.href = '/';
}

// Support Button Functionality
function openSupport() {
    window.open('https://buymeacoffee.com/siagmoo26i', '_blank');
}

let supportButtonInterval;

// Function to hide and show support button AND message together
function toggleSupportElements() {
    // Ensure support container exists before trying to manipulate it
    const supportContainer = ensureSupportContainerExists();

    if (supportContainer) {
        console.log('🎭 Toggling support elements visibility...');

        // Hide both button and message with smooth transition
        supportContainer.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        supportContainer.style.opacity = '0';
        supportContainer.style.transform = 'translateY(-20px) scale(0.9)';
        supportContainer.style.pointerEvents = 'none';

        // Show both button and message again after 20 seconds
        setTimeout(() => {
            const containerCheck = ensureSupportContainerExists();
            if (containerCheck) {
                console.log('🎭 Restoring support elements visibility...');
                containerCheck.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                containerCheck.style.opacity = '1';
                containerCheck.style.transform = 'translateY(0) scale(1)';
                containerCheck.style.pointerEvents = 'auto';
            } else {
                console.warn('⚠️ Support container not found when trying to restore visibility');
            }
        }, 20000); // 20 seconds hidden
    } else {
        console.error('❌ Support container not available for toggle operation');
    }
}

// Function to ensure support container exists in DOM
function ensureSupportContainerExists() {
    let supportContainer = document.querySelector('.support-container');

    if (!supportContainer) {
        console.log('🔧 Support container not found, recreating...');

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

        // Insert at the beginning of body using a more robust method
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = containerHTML;
        const newContainer = tempDiv.firstElementChild;

        // Remove any existing support container first
        const existingContainer = document.querySelector('.support-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        // Insert the new container at the beginning of body
        document.body.insertBefore(newContainer, document.body.firstChild);

        supportContainer = document.querySelector('.support-container');

        // Make sure it's visible and properly styled
        if (supportContainer) {
            supportContainer.style.opacity = '1';
            supportContainer.style.transform = 'translateY(0) scale(1)';
            supportContainer.style.display = 'flex';
            supportContainer.style.position = 'fixed';
            supportContainer.style.top = '20px';
            supportContainer.style.right = '20px';
            supportContainer.style.zIndex = '1000';
            supportContainer.style.pointerEvents = 'auto';
            supportContainer.style.visibility = 'visible';

            console.log('✅ Support container recreated successfully');
        } else {
            console.error('❌ Failed to recreate support container');
        }
    }

    return supportContainer;
}

// Start the support elements toggle cycle
function startSupportButtonCycle() {
    console.log('🎭 Starting support button cycle...');

    // Ensure support container exists before starting
    const initialCheck = ensureSupportContainerExists();
    if (!initialCheck) {
        console.error('❌ Cannot start support button cycle - container creation failed');
        return;
    }

    console.log('✅ Support button cycle started successfully');

    // Initial toggle after 20 seconds (visible for 20s, then hide for 20s)
    setTimeout(() => {
        console.log('🎭 Initial toggle scheduled in 20 seconds...');
        toggleSupportElements();
    }, 20000);

    // Then repeat every 40 seconds (20s visible + 20s hidden)
    supportButtonInterval = setInterval(() => {
        console.log('🎭 Running scheduled toggle cycle...');
        toggleSupportElements();
    }, 40000); // 40 seconds total cycle

    // Add periodic DOM check every 5 seconds to ensure support container persists
    setInterval(() => {
        const supportContainer = document.querySelector('.support-container');
        if (!supportContainer || supportContainer.parentNode !== document.body) {
            console.log('🔧 Periodic check: Support container missing or moved, recreating...');
            ensureSupportContainerExists(); // Recreate if missing or moved
        } else {
            // Ensure it's properly styled and visible
            const computedStyle = window.getComputedStyle(supportContainer);
            const isVisible = supportContainer.style.display !== 'none' &&
                             supportContainer.style.visibility !== 'hidden' &&
                             computedStyle.display !== 'none' &&
                             computedStyle.visibility !== 'hidden' &&
                             supportContainer.style.opacity !== '0' &&
                             computedStyle.opacity !== '0';

            if (!isVisible || supportContainer.style.position !== 'fixed') {
                console.log('🔧 Periodic check: Support container visibility or positioning issues detected, fixing...');
                supportContainer.style.opacity = '1';
                supportContainer.style.transform = 'translateY(0) scale(1)';
                supportContainer.style.display = 'flex';
                supportContainer.style.visibility = 'visible';
                supportContainer.style.position = 'fixed';
                supportContainer.style.top = '20px';
                supportContainer.style.right = '20px';
                supportContainer.style.zIndex = '1000';
                supportContainer.style.pointerEvents = 'auto';
                console.log('✅ Support container visibility and positioning fixed');
            }
        }
    }, 5000); // Check every 5 seconds for faster response
}

// Stop the support elements cycle
function stopSupportButtonCycle() {
    console.log('⏹️ Stopping support button cycle...');

    if (supportButtonInterval) {
        clearInterval(supportButtonInterval);
        supportButtonInterval = null;
        console.log('✅ Support button cycle stopped successfully');
    } else {
        console.log('ℹ️ Support button cycle was not running');
    }

    // Make sure elements are visible when stopping
    const supportContainer = ensureSupportContainerExists();
    if (supportContainer) {
        supportContainer.style.opacity = '1';
        supportContainer.style.transform = 'translateY(0) scale(1)';
        console.log('✅ Support elements made visible');
    } else {
        console.warn('⚠️ Support container not found when stopping cycle');
    }
}

// Player Name Persistence Functions
function savePlayerName(name) {
    try {
        localStorage.setItem('bibleTriviaPlayerName', name);
        console.log('✅ Player name saved to localStorage:', name);
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

// Add event listener for manual name changes (removed for trivia1)
// document.getElementById('username').addEventListener('input', (e) => {
//     const name = e.target.value.trim();
//     if (name) {
//         // Update saved name when user types
//         savePlayerName(name);
//         // Update UI indicators
//         setTimeout(() => {
//             addClearNameButton();
//             addSavedNameIndicator();
//         }, 100);
//     } else {
//         // Remove indicators if name is cleared
//         const clearBtn = document.getElementById('clearNameBtn');
//         const savedIndicator = document.getElementById('savedNameIndicator');
//         if (clearBtn) clearBtn.remove();
//         if (savedIndicator) savedIndicator.remove();
//     }
// });

document.getElementById('startContestBtn').addEventListener('click', startContest);
document.getElementById('submitAnswer').addEventListener('click', lockAnswer);

// Multiplayer Event Listeners
document.getElementById('createGameBtn').addEventListener('click', showCreateGameForm);
document.getElementById('joinGameBtn').addEventListener('click', showJoinGameForm);
document.getElementById('playSoloBtn').addEventListener('click', showSoloGameForm);
document.getElementById('newGameForm').addEventListener('submit', createNewGame);
document.getElementById('cancelCreateBtn').addEventListener('click', hideCreateGameForm);
document.getElementById('cancelJoinBtn').addEventListener('click', hideJoinGameForm);
document.getElementById('cancelSoloBtn').addEventListener('click', hideSoloGameForm);
document.getElementById('newSoloGameForm').addEventListener('submit', startSoloGame);
document.getElementById('startGameBtn').addEventListener('click', startMultiplayerGame);
document.getElementById('shareGameBtn').addEventListener('click', showShareLink);
document.getElementById('copyShareLinkBtn').addEventListener('click', copyShareLink);
document.getElementById('leaveGameBtn').addEventListener('click', leaveGameRoom);

// Multiplayer Functions
async function showCreateGameForm() {
    document.getElementById('createGameForm').style.display = 'block';
    document.getElementById('joinGameForm').style.display = 'none';
    document.querySelector('.game-mode-selection').style.display = 'none';
}

async function showJoinGameForm() {
    document.getElementById('createGameForm').style.display = 'none';
    document.getElementById('joinGameForm').style.display = 'block';
    document.querySelector('.game-mode-selection').style.display = 'none';
    await loadAvailableGames();
}

function hideCreateGameForm() {
    document.getElementById('createGameForm').style.display = 'none';
    document.querySelector('.game-mode-selection').style.display = 'flex';
}

function hideJoinGameForm() {
    document.getElementById('joinGameForm').style.display = 'none';
    document.querySelector('.game-mode-selection').style.display = 'flex';
}

async function showSoloGameForm() {
    document.getElementById('createGameForm').style.display = 'none';
    document.getElementById('joinGameForm').style.display = 'none';
    document.getElementById('soloGameForm').style.display = 'block';
    document.querySelector('.game-mode-selection').style.display = 'none';
}

function hideSoloGameForm() {
    document.getElementById('soloGameForm').style.display = 'none';
    document.querySelector('.game-mode-selection').style.display = 'flex';
}

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

        if (result.success && result.games.length > 0) {
            const gamesHTML = result.games.map(game => `
                <div class="game-item" onclick="joinGame(${game.id})">
                    <h4>${game.name}</h4>
                    <p><strong>Difficulty:</strong> ${game.difficulty}</p>
                    <p><strong>Players:</strong> ${game.current_players}/${game.max_players}</p>
                    <p><strong>Created by:</strong> ${game.created_by_name}</p>
                </div>
            `).join('');

            gamesContainer.innerHTML = `
                <div class="available-games-list">
                    ${gamesHTML}
                </div>
            `;
        } else {
            gamesContainer.innerHTML = '<p>No games available. Create a new game to get started!</p>';
        }
    } catch (error) {
        console.error('Error loading games:', error);
        document.getElementById('availableGames').innerHTML = '<p>Error loading games. Please try again.</p>';
    }
}

async function joinGame(gameId) {
    try {
        // Check if user has a name set
        if (!gameState.currentUser || !gameState.currentUser.name) {
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

    document.getElementById('createGameForm').style.display = 'none';
    document.getElementById('joinGameForm').style.display = 'none';
    document.getElementById('gameRoom').style.display = 'block';

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
    console.log('Starting game room updates for gameId:', gameState.gameRoomId);
    console.log('Current user is creator:', gameState.isGameCreator);

    // Set up a fallback timeout for guests (in case status doesn't update properly)
    if (!gameState.isGameCreator) {
        console.log('⏰ Setting up fallback timeout for guest transition (3 seconds)...');
        setTimeout(() => {
            console.log('⏰ Fallback timeout triggered - checking if guest should transition...');
            if (gameState.gameRoomId && !gameState.gameActive) {
                console.log('⏰ Fallback: Transitioning guest to loading screen after timeout');
                clearInterval(gameState.gameUpdateInterval);
                multiplayerLobbySection.classList.remove('section-active');
                loadingSection.classList.add('section-active');
                startProgressSimulation(gameState.gameRoomId);
            }
        }, 3000); // 3 second fallback
    }

    // Poll for game updates every 500ms for even faster synchronization
    gameState.gameUpdateInterval = setInterval(async () => {
        // Don't run if interval has been cleared or if game is already starting
        if (!gameState.gameUpdateInterval || gameState.gameActive) {
            return;
        }

        if (gameState.gameRoomId) {
            try {
                console.log('📡 Polling for game updates...');
                const response = await fetch(`/api/bible-games/${gameState.gameRoomId}`);
                const result = await response.json();

                console.log('📡 Poll response:', result);

                if (result.success) {
                    const game = result.game;
                    const participants = result.participants;

                    console.log('📊 Game status from server:', game.status);
                    console.log('👥 Participants from server:', participants);

                    // Update game status
                    document.getElementById('roomStatus').textContent = game.status;

                    // Update players list using the centralized function
                    updatePlayersList(game, participants);

                    // Check question generation progress but DON'T stop polling yet
                    // Keep polling until game is actually completed to ensure all results are available
                    if (game.status === 'starting' && game.questions_per_game) {
                        try {
                            const progressResponse = await fetch(`/api/bible-games/${gameState.gameRoomId}/progress`);
                            const progressResult = await progressResponse.json();

                            if (progressResult.success && progressResult.progress) {
                                const { generated, total, isReady } = progressResult.progress;
                                // Production: Removed console logs for cleaner output
                                // console.log(`📈 Question progress: ${generated}/${total}, ready: ${isReady}`);

                                // Only stop polling if game is actually completed, not just when questions are ready
                                // This ensures all players finish and results are properly aggregated
                                if (game.status === 'completed') {
                                    // console.log(`🏁 Game completed - stopping room polling`);
                                    clearInterval(gameState.gameUpdateInterval);
                                    gameState.gameUpdateInterval = null;
                                }
                            }
                        } catch (progressError) {
                            console.error('❌ Error checking question progress:', progressError);
                        }
                    }

                    // Check if game has started - but don't stop polling immediately
                    // Keep polling running to allow more players to join
                    if (game.status === 'starting') {
                        // Production: Removed console logs for cleaner output
                        // console.log(`🎉 Game started, continuing polling to allow more players to join...`);
                        // console.log('📊 Game room polling continues - will stop when questions are nearly ready');
                    }

                    // Also check for any status change that indicates game is starting
                    if (game.status !== 'waiting' && game.status !== 'completed') {
                        // console.log(`🔄 Game status changed from waiting, continuing polling for ${gameState.isGameCreator ? 'creator' : 'guest'}...`);
                        // console.log('Current status:', game.status);

                        // Continue polling until game is actually completed
                        // This ensures all players finish and results are properly aggregated
                        // console.log('📊 Room polling continues - will stop only when game is completed');
                    }

                    // Check if game was cancelled by creator leaving
                    if (game.status === 'cancelled') {
                        // Production: Removed console logs for cleaner output
                        // console.log('🚫 Game was cancelled by creator - notifying player and redirecting to lobby...');

                        // Clear polling interval
                        clearInterval(gameState.gameUpdateInterval);
                        gameState.gameUpdateInterval = null;

                        // Show notification to user
                        alert('The game has been cancelled by the creator. You will be redirected back to the lobby.');

                        // Reset game state
                        gameState.currentGame = null;
                        gameState.currentParticipant = null;
                        gameState.gameRoomId = null;
                        gameState.isGameCreator = false;
                        gameState.isMultiplayer = false;

                        // Hide game room and show lobby
                        document.getElementById('gameRoom').style.display = 'none';
                        document.querySelector('.game-mode-selection').style.display = 'flex';

                        // Hide share link container
                        document.getElementById('shareLinkContainer').style.display = 'none';

                        return; // Exit polling function
                    }
                } else {
                    console.error('❌ Poll failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error updating game room:', error);
            }
        } else {
            console.log('No game room ID, stopping updates');
            clearInterval(gameState.gameUpdateInterval);
            gameState.gameUpdateInterval = null;
        }
    }, 500); // Even faster polling for immediate synchronization

    // Add a safety mechanism to ensure polling stops after reasonable time
    // This will force-stop polling if it continues running too long
    const SAFETY_TIMEOUT_MS = 30000; // 30 seconds - gives players time to join
    setTimeout(() => {
        if (gameState.gameUpdateInterval) {
            console.log('⏰ Safety timeout: Force stopping game room polling after 30 seconds...');
            clearInterval(gameState.gameUpdateInterval);
            gameState.gameUpdateInterval = null;
            console.log('⏰ Safety timeout: Game room polling force stopped - allowing players to join');
        }
    }, SAFETY_TIMEOUT_MS);
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

    try {
        // Use guest start endpoint for multiplayer games
        // console.log('📡 Calling start-guest API endpoint...');
        const response = await fetch(`/api/bible-games/${gameState.gameRoomId}/start-guest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                guestId: gameState.currentParticipant.guest_id
            })
        });

        // console.log('📡 Start game API response status:', response.status);
        const result = await response.json();
        // console.log('📡 Start game API result:', result);

        if (result.success) {
            // Let the progress simulation handle the transition for both creators and guests
            // console.log('✅ Game started successfully, waiting for progress simulation to complete...');
            // Don't call startMultiplayerGameplay directly - let progress simulation handle it
        } else {
            console.error('❌ Failed to start game:', result.error);
            alert('Failed to start game: ' + result.error);
            // Go back to lobby
            stopFaithVerses();
            loadingSection.classList.remove('section-active');
            multiplayerLobbySection.classList.add('section-active');
        }
    } catch (error) {
        console.error('❌ Error starting game:', error);
        alert('Failed to start game. Please try again.');
        // Go back to lobby
        stopFaithVerses();
        loadingSection.classList.remove('section-active');
        multiplayerLobbySection.classList.add('section-active');
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
        alert('Failed to start game. Please try again.');
        loadingSection.classList.remove('section-active');
        multiplayerLobbySection.classList.add('section-active');
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
        const pathname = window.location.pathname || '/bible-trivia.html';
        shareUrl = `${origin}${pathname}?join=${gameState.gameRoomId}`;
    } catch (e) {
        // Fallback for environments where window.location might not work
        shareUrl = `${window.location.protocol || 'https:'}//${window.location.hostname || 'localhost'}${window.location.pathname || '/bible-trivia.html'}?join=${gameState.gameRoomId}`;
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

    // Get form values
    const playerName = document.getElementById('soloPlayerName').value.trim();
    const difficulty = document.getElementById('soloDifficulty').value;
    const questionsPerGame = parseInt(document.getElementById('soloQuestions').value);

    // Validate input
    if (!playerName) {
        alert('Please enter your name');
        return;
    }

    // Set user info
    gameState.currentUser = {
        name: playerName,
        difficulty: difficulty,
        score: 0,
        correctAnswers: 0
    };

    // Save player name to localStorage
    savePlayerName(playerName);

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

    // Hide login and go directly to loading
    loginSection.classList.remove('section-active');
    loadingSection.classList.add('section-active');

    // Start solo game directly
    startSoloGameDirectly(questionsPerGame);
}

async function startSoloGameDirectly(questionsPerGame) {
    // Clean up any existing game state before starting new solo game
    cleanupGameState();

    loadingSection.classList.add('section-active');

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

        // Show specific error message
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.style.display = 'block';
        errorMessage.textContent = `Solo Game Error: ${error.message}`;

        // Log additional debugging info
        console.error('🔍 Debug info:', {
            user: gameState.currentUser,
            isSoloMode: gameState.isSoloMode,
            isMultiplayer: gameState.isMultiplayer,
            questionsPerGame: questionsPerGame
        });

        // Stop faith verses on error
        stopFaithVerses();

        // Go back to login screen after showing error
        setTimeout(() => {
            loadingSection.classList.remove('section-active');
            loginSection.classList.add('section-active');
            errorMessage.style.display = 'none';
        }, 5000);
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

        // Switch to multiplayer lobby
        loginSection.classList.remove('section-active');
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
        console.log('🔍 Setting up support container observer...');

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
                            console.log('⚠️ Support container was moved or hidden, fixing...');
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

        console.log('✅ Support container observer set up successfully');
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
    console.log('🚀 Initializing support button system...');

    // Ensure support container exists immediately on page load
    const supportContainer = ensureSupportContainerExists();

    if (supportContainer) {
        console.log('✅ Support container initialized successfully');

        // Set up observer to detect when support container is removed
        setupSupportContainerObserver();

        // Start the support button cycle
        startSupportButtonCycle();

        console.log('✅ Support button system fully initialized');
    } else {
        console.error('❌ Failed to initialize support button system');
    }
}

// Check for join parameter on page load
window.addEventListener('load', () => {
    // Pre-populate player name from localStorage (removed for trivia1)
    // prePopulatePlayerName();

    // Initialize support button system
    initializeSupportButton();

    // Handle direct game joining via URL
    handleUrlJoin();

    // Start periodic cleanup for expired game rooms
    startPeriodicCleanup();
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
        console.log('🧹 Starting frontend cleanup of game rooms older than 2 hours...');
        console.log('📡 Calling backend cleanup endpoint...');

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
            console.log('✅ Frontend cleanup completed successfully!');
            console.log('📊 Cleanup Summary:', cleanup);

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
                console.log('🔄 Refreshing available games list in multiplayer lobby...');
                await loadAvailableGames();
                console.log('✅ Available games list refreshed');
            }

            // Verify cleanup worked by checking if there are still old games
            try {
                console.log('🔍 Verifying cleanup effectiveness...');
                const statusResponse = await fetch('/api/bible-games/cleanup-status?hoursOld=2');
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

// Function to start periodic cleanup
function startPeriodicCleanup() {
    if (cleanupInterval) {
        clearInterval(cleanupInterval);
    }

    console.log('⏰ Starting periodic cleanup system...');
    console.log('⏰ Cleanup will run every 10 minutes (600,000 ms)');

    // Run cleanup every 10 minutes (600,000 ms)
    cleanupInterval = setInterval(async () => {
        console.log('🧹 Running scheduled periodic frontend cleanup...');
        console.log('🕐 Next cleanup in 10 minutes...');
        await cleanupExpiredGameRoomsFrontend();
        console.log('✅ Scheduled cleanup cycle completed');
    }, 600000); // 10 minutes

    // Also run cleanup immediately on start
    setTimeout(async () => {
        console.log('🧹 Running initial frontend cleanup on page load...');
        console.log('🕐 First cleanup starting in 5 seconds...');
        await cleanupExpiredGameRoomsFrontend();
        console.log('✅ Initial cleanup completed');
    }, 5000); // Wait 5 seconds after page load
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

        const response = await fetch('/api/bible-games/cleanup-status?hoursOld=2');
        const result = await response.json();

        if (result.success) {
            const cleanup = result.cleanup;
            console.log('✅ Cleanup status retrieved successfully');
            console.log('📊 Preview of what would be cleaned:', cleanup);

            if (cleanup.gamesToDelete && cleanup.gamesToDelete.length > 0) {
                console.log(`🎯 Would delete ${cleanup.gamesToDelete.length} expired game rooms`);
                console.log('📋 Games to delete:', cleanup.gamesToDelete.map(g => `${g.id}("${g.name}" - ${g.status})`));
            } else {
                console.log('✅ No expired game rooms found to clean up');
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

// Enhanced loadAvailableGames with caching
async function loadAvailableGames() {
    try {
        const response = await fetch('/api/bible-games?status=waiting');
        const result = await response.json();

        if (result.success && result.games.length > 0) {
            // Update cache
            availableGamesCache = result.games;

            const gamesContainer = document.getElementById('availableGames');

            const gamesHTML = result.games.map(game => `
                <div class="game-item" onclick="joinGame(${game.id})">
                    <h4>${game.name}</h4>
                    <p><strong>Difficulty:</strong> ${game.difficulty}</p>
                    <p><strong>Players:</strong> ${game.current_players}/${game.max_players}</p>
                    <p><strong>Created by:</strong> ${game.created_by_name}</p>
                    <p><strong>Created:</strong> ${new Date(game.created_at).toLocaleTimeString()}</p>
                </div>
            `).join('');

            gamesContainer.innerHTML = `
                <div class="available-games-list">
                    ${gamesHTML}
                </div>
            `;
        } else {
            availableGamesCache = [];
            document.getElementById('availableGames').innerHTML = '<p>No games available. Create a new game to get started!</p>';
        }
    } catch (error) {
        console.error('Error loading games:', error);
        document.getElementById('availableGames').innerHTML = '<p>Error loading games. Please try again.</p>';
    }
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

async function handleLogin() {
    const username = document.getElementById('username').value;
    const difficulty = document.getElementById('difficulty').value;

    // Validate input
    if (!username.trim()) {
        alert('Please enter your name');
        return;
    }

    // Save the player name to localStorage
    savePlayerName(username.trim());

    gameState.currentUser = {
        name: username.trim(),
        difficulty: difficulty,
        score: 0,
        correctAnswers: 0
    };

    gameState.contestants.push(gameState.currentUser);

    loginSection.classList.remove('section-active');
    multiplayerLobbySection.classList.add('section-active');
}

async function handleSoloLogin() {
    const username = document.getElementById('username').value;
    const difficulty = document.getElementById('difficulty').value;

    // Validate input
    if (!username.trim()) {
        alert('Please enter your name');
        return;
    }

    // Save the player name to localStorage
    savePlayerName(username.trim());

    gameState.currentUser = {
        name: username.trim(),
        difficulty: difficulty,
        score: 0,
        correctAnswers: 0
    };

    // Production: Removed console logs for cleaner output
    // console.log('🎯 Starting solo game for user:', gameState.currentUser.name);

    // For solo mode, we don't need to add to contestants list
    // Just start the solo game directly
    try {
        await startSoloGameFromLogin();
    } catch (error) {
        console.error('❌ Error starting solo game:', error);

        // Show user-friendly error message
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.style.display = 'block';
        errorMessage.textContent = `Failed to start solo game: ${error.message}`;

        // Stop any faith verses that might be running
        stopFaithVerses();

        // Go back to login screen after showing error
        setTimeout(() => {
            loadingSection.classList.remove('section-active');
            loginSection.classList.add('section-active');
            errorMessage.style.display = 'none';
        }, 5000);
    }
}

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

function showRandomFaithVerse() {
    // Remove any existing verses and decorations
    const existingVerses = document.querySelectorAll('.faith-verse');
    existingVerses.forEach(verse => verse.remove());
    const existingDecorations = document.querySelectorAll('.verse-decorations');
    existingDecorations.forEach(decoration => decoration.remove());

    // Get random verse
    const randomVerse = faithVerses[Math.floor(Math.random() * faithVerses.length)];

    // Get screen dimensions with fallbacks for Cloudflare compatibility
    let screenWidth, screenHeight;
    try {
        screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || 1920;
        screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || 1080;
    } catch (e) {
        // Fallback dimensions if window properties are not available
        screenWidth = 1920;
        screenHeight = 1080;
        console.warn('Using fallback screen dimensions:', e);
    }

    // Calculate main container position (approximately center of screen)
    const containerTop = Math.max(50, (screenHeight - 600) / 2);
    const containerBottom = containerTop + 600;

    // Responsive positions: alternate between above and below with percentage-based margins
    const verseWidth = 300;
    const verseHeight = 100;

    let verseX, verseY;

    // Alternate between top and bottom positions - responsive approach
    if (verseCounter % 2 === 0) {
        // Top position - responsive approach
        verseX = (screenWidth - verseWidth) / 2;

        // Responsive top margin based on screen height
        let topMargin;
        if (screenHeight < 600) {
            // Small screens (most phones in landscape)
            topMargin = 40;
        } else if (screenHeight < 800) {
            // Medium screens (most phones in portrait)
            topMargin = 50;
        } else {
            // Large screens (tablets, desktops)
            topMargin = 60;
        }

        const maxTopY = containerTop - verseHeight - topMargin;
        const desiredTopY = 30; // Minimum 30px from top
        verseY = Math.max(desiredTopY, maxTopY);
    } else {
        // Bottom position - percentage-based for all screens (higher position)
        verseX = (screenWidth - verseWidth) / 2;

        // Use 3% of screen height as bottom margin (smaller margin = higher position)
        const bottomMargin = Math.max(30, screenHeight * 0.1); // Minimum 30px, or 3% of screen height

        const maxBottomY = screenHeight - verseHeight - bottomMargin;
        const desiredBottomY = containerBottom + 15; // Reduced from 25px to 15px for higher position
        verseY = Math.min(desiredBottomY, maxBottomY);
    }

    // Final safety check - ensure verse is fully visible on screen
    verseX = Math.max(20, Math.min(verseX, screenWidth - verseWidth - 20));
    verseY = Math.max(20, Math.min(verseY, screenHeight - verseHeight - 20));

    // Create bright white flashlight effect at the verse position
    const lightFlash = document.createElement('div');
    lightFlash.className = 'light-flash';
    lightFlash.style.left = (verseX + verseWidth / 2) + 'px';
    lightFlash.style.top = (verseY + verseHeight / 2) + 'px';
    document.body.appendChild(lightFlash);

    // Remove light flash after animation completes
    setTimeout(() => {
        if (lightFlash.parentNode) {
            lightFlash.parentNode.removeChild(lightFlash);
        }
    }, 2000); // Extended to match new animation duration

    // Randomly choose red or white theme
    const themes = ['red-theme', 'white-theme'];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];

    // Create container for verse and decorations
    const containerElement = document.createElement('div');
    containerElement.className = 'verse-decorations';
    containerElement.style.position = 'fixed';

    // Position the container at the calculated verse position
    containerElement.style.left = verseX + 'px';
    containerElement.style.top = verseY + 'px';

    // Create verse element with random theme
    const verseElement = document.createElement('div');
    verseElement.className = `faith-verse ${randomTheme}`;
    verseElement.textContent = randomVerse;

    // Don't show immediately - wait for light flash effect

    // Add celebratory decorations within screen bounds
    const flowers = ['🌸', '🌺', '🌻', '🌷', '🌹'];
    const arrows = ['⬆️', '⬇️', '👆', '👇'];
    const sparkles = ['✨', '⭐', '🌟', '💫'];
    const celebrations = ['🎉', '🎊', '🙌', '👏', '💃', '🕺', '🙏', '😇'];

    // Add flowers closer to the verse (smaller offset)
    flowers.forEach((flower, index) => {
        const flowerElement = document.createElement('div');
        const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        flowerElement.className = `flower ${positions[index]}`;
        flowerElement.textContent = flower;
        containerElement.appendChild(flowerElement);
    });

    // Add directional arrows pointing to verse
    // Alternate arrow direction based on position
    if (verseCounter % 2 === 0) {
        // For top position, add downward arrows
        const downArrow = document.createElement('div');
        downArrow.className = 'arrow-pointer bottom';
        downArrow.textContent = '👇';
        containerElement.appendChild(downArrow);
    } else {
        // For bottom position, add upward arrows
        const upArrow = document.createElement('div');
        upArrow.className = 'arrow-pointer top';
        upArrow.textContent = '👆';
        containerElement.appendChild(upArrow);
    }

    // Add sparkles closer to the verse
    const topSparkle = document.createElement('div');
    topSparkle.className = 'sparkle top';
    topSparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
    containerElement.appendChild(topSparkle);

    const bottomSparkle = document.createElement('div');
    bottomSparkle.className = 'sparkle bottom';
    bottomSparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
    containerElement.appendChild(bottomSparkle);

    // Add celebration emojis closer to the verse
    celebrations.forEach((celebration, index) => {
        const celebrationElement = document.createElement('div');
        const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        celebrationElement.className = `celebration-emoji ${positions[index]}`;
        celebrationElement.textContent = celebration;
        containerElement.appendChild(celebrationElement);
    });

    // Add verse to container
    containerElement.appendChild(verseElement);

    // Add to page
    document.body.appendChild(containerElement);

    // Show verse after light flash starts (delay to let light flash be visible first)
    setTimeout(() => {
        verseElement.classList.add('show');
    }, 200); // Show verse after 200ms when light flash is building up

    // Increment counter for next verse alternation
    verseCounter++;

    // Remove after animation completes
    setTimeout(() => {
        if (containerElement.parentNode) {
            containerElement.remove();
        }
    }, 12500); // Slightly longer than animation duration (12s + 0.5s buffer)
}

function startFaithVerses() {
    // Show first verse immediately
    showRandomFaithVerse();

    // Show new verses every 10-14 seconds (increased by 2 seconds)
    verseInterval = setInterval(() => {
        showRandomFaithVerse();
    }, 10000 + Math.random() * 4000); // 10-14 seconds
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

    // console.log('🧹 Comprehensive cleanup completed');
}

function startProgressSimulation(gameId) {
    // Start showing faith verses
    startFaithVerses();

    // Poll for real progress from the server
    document.getElementById('questionProgress').textContent = 'Starting question generation...';

    // Start polling after a short delay to allow game to start
    setTimeout(() => {
        // Use dynamic question count from game settings instead of hardcoded 10
        const totalQuestions = gameState.currentGame?.questions_per_game || 10;
        const gameMode = gameState.isSoloMode ? 'Solo' : 'Multiplayer';
        document.getElementById('questionProgress').textContent = `${gameMode} Game: Generating 0 of ${totalQuestions} unique Bible questions...`;

        // Clear any existing progress interval first
        if (window.progressInterval) {
            clearInterval(window.progressInterval);
            window.progressInterval = null;
        }

        let questionsLoaded = false; // Flag to prevent multiple transitions

        window.progressInterval = setInterval(async () => {
            // Prevent multiple calls if questions are already loaded
            if (questionsLoaded) {
                return;
            }

            try {
                // Production: Removed console logs for cleaner output
                // console.log('Checking progress for gameId:', gameId);

                // FIRST: Check the main game endpoint for status (including cancelled)
                const gameResponse = await fetch(`/api/bible-games/${gameId}`);
                if (gameResponse.ok) {
                    const gameResult = await gameResponse.json();
                    // console.log('Game status check result:', gameResult);

                    // CRITICAL FIX: Check if game was cancelled by creator leaving
                    if (gameResult.success && gameResult.game && gameResult.game.status === 'cancelled') {
                        console.log('🚫 Game was cancelled by creator - stopping progress polling and redirecting to lobby...');

                        // Clear progress polling interval
                        if (window.progressInterval) {
                            clearInterval(window.progressInterval);
                            window.progressInterval = null;
                        }

                        // Stop faith verses
                        stopFaithVerses();

                        // Show notification to user
                        alert('The game has been cancelled by the creator. You will be redirected back to the lobby.');

                        // Reset game state
                        gameState.currentGame = null;
                        gameState.currentParticipant = null;
                        gameState.gameRoomId = null;
                        gameState.isGameCreator = false;
                        gameState.isMultiplayer = false;

                        // Hide loading section and show multiplayer lobby
                        loadingSection.classList.remove('section-active');
                        multiplayerLobbySection.classList.add('section-active');

                        // Hide share link container if visible
                        const shareContainer = document.getElementById('shareLinkContainer');
                        if (shareContainer) {
                            shareContainer.style.display = 'none';
                        }

                        return; // Exit polling function
                    }
                }

                // SECOND: Check progress only if game is not cancelled
                const progressResponse = await fetch(`/api/bible-games/${gameId}/progress`);

                if (!progressResponse.ok) {
                    console.warn(`⚠️ Progress API returned ${progressResponse.status}, continuing to poll...`);
                    return; // Continue polling even if there's an error
                }

                const result = await progressResponse.json();
                // console.log('Progress API result:', result);

                if (result.success && result.progress) {
                    const { generated, total, isReady } = result.progress;
                    // console.log('Progress data:', { generated, total, isReady });
                    document.getElementById('questionProgress').textContent = `Generated ${generated} of ${total} unique questions...`;

                    if (isReady && !questionsLoaded) {
                        questionsLoaded = true; // Set flag to prevent further calls

                        // Clear the interval immediately to prevent further calls
                        clearInterval(window.progressInterval);
                        window.progressInterval = null;

                        stopFaithVerses(); // Stop verses when ready
                        document.getElementById('questionProgress').textContent = 'Questions ready! Loading game...';

                        // Both creators and guests need to fetch questions from the server
                        // and follow the same transition flow
                        try {
                            const response = await fetch(`/api/bible-games/${gameId}`);

                            if (!response.ok) {
                                throw new Error(`Failed to fetch game data: ${response.status}`);
                            }

                            const result = await response.json();

                            if (result.success && result.questions && result.questions.length > 0) {
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

                                // Questions are loaded, transition to game for both creators and guests
                                setTimeout(() => {
                                    loadingSection.classList.remove('section-active');
                                    showCountdown(() => {
                                        gameSection.classList.add('section-active');
                                        loadQuestion();
                                        gameState.gameActive = true;
                                    });
                                }, 1000);
                            } else {
                                console.error(`${gameState.isGameCreator ? 'Game creator' : 'Guest'} failed to load questions from server`);
                                questionsLoaded = false; // Reset flag to retry
                                // Retry after a delay
                                setTimeout(() => {
                                    document.getElementById('questionProgress').textContent = 'Retrying to load questions...';
                                }, 2000);
                            }
                        } catch (error) {
                            console.error(`❌ Error loading questions for ${gameState.isGameCreator ? 'game creator' : 'guest'}:`, error);
                            questionsLoaded = false; // Reset flag to retry

                            // Retry after a delay with exponential backoff
                            const retryDelay = Math.min(2000 * Math.pow(2, 0), 10000); // Max 10 seconds
                            console.log(`⏳ Retrying in ${retryDelay}ms...`);

                            setTimeout(() => {
                                document.getElementById('questionProgress').textContent = 'Retrying to load questions...';
                            }, retryDelay);
                        }
                    }

                    // Also check if all players have finished their questions
                    if (result.game && result.participants) {
                        const allPlayersFinished = result.participants.every(p => {
                            const hasFinishedQuestions = p.finished_questions >= result.game.questions_per_game;
                            const hasSubmittedAnswers = p.correct_answers > 0 || p.total_questions > 0;
                            const hasFinishedAllQuestions = p.finished_all_questions === true;

                            // A player is considered finished if:
                            // 1. They have finished all questions, OR
                            // 2. They have submitted answers, OR
                            // 3. They have the finished_all_questions flag set (fallback)
                            return hasFinishedQuestions || hasSubmittedAnswers || hasFinishedAllQuestions;
                        });

                        if (allPlayersFinished) {
                            console.log(`🏁 All players finished - stopping progress polling and ending game`);
                            if (window.progressInterval) {
                                clearInterval(window.progressInterval);
                                window.progressInterval = null;
                            }
                            stopFaithVerses();
                            document.getElementById('questionProgress').textContent = 'All players finished! Loading results...';

                            // Set game as completed and transition to results
                            result.game.status = 'completed';
                            gameState.currentGame = result.game;

                            setTimeout(() => {
                                loadingSection.classList.remove('section-active');
                                gameSection.classList.remove('section-active');
                                resultsSection.classList.add('section-active');
                            }, 1000);
                        } else {
                            // FIX: Update progress display to count current player as finished
                            const finishedCount = result.participants.filter(p => {
                                const hasFinishedQuestions = p.finished_questions >= result.game.questions_per_game;
                                const hasSubmittedAnswers = p.correct_answers > 0 || p.total_questions > 0;
                                const hasFinishedAllQuestions = p.finished_all_questions === true;

                                // A player is considered finished if:
                                // 1. They have finished all questions, OR
                                // 2. They have submitted answers, OR
                                // 3. They have the finished_all_questions flag set (fallback)
                                return hasFinishedQuestions || hasSubmittedAnswers || hasFinishedAllQuestions;
                            }).length;
                            const totalPlayers = result.participants.length;

                            // If finishedCount is 0, it means only current player is finished, so show 1/totalPlayers
                            const displayFinishedCount = finishedCount === 0 ? 1 : finishedCount;
                            const displayTotalPlayers = totalPlayers;

                            // Update progress display with correct count
                            document.getElementById('questionProgress').textContent =
                                `Generated ${generated} of ${total} unique questions... (${displayFinishedCount}/${displayTotalPlayers} players finished)`;
                        }
                    }

                    // Also check if game is completed - this ensures all players finish before showing results
                    if (result.game && result.game.status === 'completed') {
                        console.log(`🏁 Game completed detected in progress check - stopping progress polling`);
                        if (window.progressInterval) {
                            clearInterval(window.progressInterval);
                            window.progressInterval = null;
                        }
                        stopFaithVerses();
                        document.getElementById('questionProgress').textContent = 'Game completed! Loading results...';

                        // Game is completed, transition to results
                        setTimeout(() => {
                            loadingSection.classList.remove('section-active');
                            gameSection.classList.remove('section-active');
                            resultsSection.classList.add('section-active');
                        }, 1000);
                    }

                    // CRITICAL FIX: Check if game was cancelled by creator leaving
                    if (result.game && result.game.status === 'cancelled') {
                        console.log('🚫 Game was cancelled by creator - stopping progress polling and redirecting to lobby...');

                        // Clear progress polling interval
                        if (window.progressInterval) {
                            clearInterval(window.progressInterval);
                            window.progressInterval = null;
                        }

                        // Stop faith verses
                        stopFaithVerses();

                        // Show notification to user
                        alert('The game has been cancelled by the creator. You will be redirected back to the lobby.');

                        // Reset game state
                        gameState.currentGame = null;
                        gameState.currentParticipant = null;
                        gameState.gameRoomId = null;
                        gameState.isGameCreator = false;
                        gameState.isMultiplayer = false;

                        // Hide loading section and show multiplayer lobby
                        loadingSection.classList.remove('section-active');
                        multiplayerLobbySection.classList.add('section-active');

                        // Hide share link container if visible
                        const shareContainer = document.getElementById('shareLinkContainer');
                        if (shareContainer) {
                            shareContainer.style.display = 'none';
                        }

                        return; // Exit polling function
                    }
                } else {
                    console.error('Progress API returned error:', result);
                }
            } catch (error) {
                console.error('Error checking progress:', error);
                // Continue polling even if there's an error
            }
        }, 1000); // Check every 1 second for faster updates

        // Safety timeout - clear interval after 5 minutes
        setTimeout(() => {
            if (window.progressInterval) {
                clearInterval(window.progressInterval);
                window.progressInterval = null;
            }
            stopFaithVerses();
        }, 300000);
    }, 500); // Wait 500ms before starting polling
}

function showCountdown(callback) {
    const overlay = document.getElementById('countdownOverlay');
    const number = document.getElementById('countdownNumber');
    overlay.style.display = 'flex';

    let count = 5;
    number.textContent = count;

    const countInterval = setInterval(() => {
        count--;
        if (count > 0) {
            number.textContent = count;
            number.style.animation = 'none';
            setTimeout(() => {
                number.style.animation = 'countdownPulse 1s ease-in-out';
            }, 10);
        } else {
            clearInterval(countInterval);
            overlay.style.display = 'none';
            callback();
        }
    }, 1000);
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

    const question = gameState.questions[gameState.currentQuestionIndex];

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

    // Handle timeout/no answer FIRST
    if (!gameState.selectedAnswer || gameState.selectedAnswer.trim() === '') {
        handleNoAnswer();
        return;
    }

    const question = gameState.questions[gameState.currentQuestionIndex];

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

            // Update stats with current user's results
            const finalScore = currentUserResult?.score || gameState.score;
            const finalCorrect = currentUserResult?.correct_answers || gameState.correctAnswers;
            const totalQuestions = gameState.currentGame?.questions_per_game || gameState.questions.length;

            console.log('🔍 DEBUG: Final stats assignment:');
            console.log('🔍 DEBUG: Final score to display:', finalScore);
            console.log('🔍 DEBUG: Final correct answers to display:', finalCorrect);
            console.log('🔍 DEBUG: Total questions for accuracy:', totalQuestions);
            console.log('🔍 DEBUG: Calculated accuracy:', Math.round((finalCorrect / totalQuestions) * 100) + '%');
            console.log('🔍 DEBUG: Final rank:', `#${currentUserResult?.rank || 1}`);

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
                const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';

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

                return `
                    <div class="leaderboard-item" ${isCurrentUser ? 'style="background: #f0f0ff;"' : ''}>
                        <div class="rank ${rankClass}">#${participant.rank}</div>
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

    // Update stats
    document.getElementById('finalScore').textContent = currentUserResult?.score || gameState.score;
    document.getElementById('finalCorrect').textContent = currentUserResult?.correct_answers || gameState.correctAnswers;
    const dynamicTotalQuestions = gameState.currentGame?.questions_per_game || gameState.questions.length;
    document.getElementById('finalAccuracy').textContent =
        Math.round(((currentUserResult?.correct_answers || gameState.correctAnswers) / dynamicTotalQuestions) * 100) + '%';
    document.getElementById('finalRank').textContent = `#${currentUserResult?.rank || 1}`;

    // Generate fallback leaderboard HTML
    const leaderboardHTML = sortedParticipants.map((participant, index) => {
        const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';

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

        return `
            <div class="leaderboard-item" ${isCurrentUser ? 'style="background: #f0f0ff;"' : ''}>
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
        <div class="leaderboard-item" style="background: #f0f0ff;">
            <div class="rank gold">#1</div>
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

            return `
                <div class="question-review-item">
                    <div class="question-review-header">
                        <div class="question-review-number">Question ${questionNumber}</div>
                        <div class="question-review-difficulty ${difficultyClass}">
                            ${difficultyText}
                        </div>
                    </div>
                    <div class="question-review-content">
                        <div class="question-review-text">${questionText}</div>
                        ${question.reference ? `<div class="question-review-reference">${question.reference}</div>` : ''}
                        <div class="question-review-answers">
                            <div class="question-review-options">
                                ${options.map((option, optionIndex) => {
                                    const isCorrect = option === correctAnswer;
                                    const optionLetter = String.fromCharCode(65 + optionIndex);
                                    const optionText = option || `Option ${optionLetter}`;
                                    return `
                                        <div class="question-review-option ${isCorrect ? 'correct' : ''}">
                                            <span class="option-letter">${optionLetter}.</span>
                                            <span class="option-text">${optionText}</span>
                                            ${isCorrect ? '<span class="correct-indicator">✓ Correct Answer</span>' : ''}
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
        const isCurrentUser = contestant.name === gameState.currentUser.name;

        return `
            <div class="leaderboard-item" ${isCurrentUser ? 'style="background: #f0f0ff;"' : ''}>
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
        pendingJoinGameId: null
    };

    // All AI processing moved to server-side

    resultsSection.classList.remove('section-active');
    multiplayerLobbySection.classList.add('section-active');

    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('questionProgress').textContent = '';
}

window.addEventListener('load', () => {
    // Production: Removed console logs for cleaner output
    // console.log('GospelWays Bible Trivia - Server-side AI Generation');
    // console.log('Session ID:', gameState.sessionId);
});