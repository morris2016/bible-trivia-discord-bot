import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { Logger } from '../utils/Logger.js';
import { bibleQuestionsData } from '../bible-questions-data.js';
const BIBLE_QUESTIONS_JSON = bibleQuestionsData;

export class APIService {
    constructor(options = {}) {
        this.baseURL = options.baseURL || 'https://gospelways.com/api/bible-games';
        this.logger = new Logger();
        this.questionTrackingDir = path.join(process.cwd(), 'discord-bot', 'data', 'question-tracking');

        // Ensure question tracking directory exists
        try {
            if (!fs.existsSync(this.questionTrackingDir)) {
                fs.mkdirSync(this.questionTrackingDir, { recursive: true });
                this.logger.info('Created question tracking directory:', this.questionTrackingDir);
            }
        } catch (error) {
            this.logger.warn('Failed to create question tracking directory:', error.message);
        }

        // Create axios instance
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 30000, // 30 seconds timeout
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Discord-Bible-Trivia-Bot/1.0'
            },
        });

        // Add response interceptor for logging
        this.client.interceptors.response.use(
            (response) => {
                this.logger.debug(`📡 API Response: ${response.config.method.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
                return response;
            },
            (error) => {
                this.logger.error(`📡 API Error: ${error.config?.method?.toUpperCase() || 'GET'} ${error.config?.url || 'unknown'} - Status: ${error.response?.status || 'Unknown'}`);
                return Promise.reject(error);
            }
        );
    }

    // Game Management APIs

    /**
     * Create a new multiplayer game
     */
    async createGame(payload) {
        try {
            const response = await this.client.post('/create', payload);
            return response.data;
        } catch (error) {
            this.logger.error('Failed to create game:', error.message);
            throw error;
        }
    }

    /**
     * Get game details by ID
     */
    async getGame(gameId) {
        try {
            const response = await this.client.get(`/${gameId}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to get game ${gameId}:`, error.message);
            throw error;
        }
    }

    /**
     * Get all waiting games
     */
    async getWaitingGames() {
        try {
            const response = await this.client.get('', {
                params: { status: 'waiting' }
            });
            return response.data;
        } catch (error) {
            this.logger.error('Failed to get waiting games:', error.message);
            throw error;
        }
    }

    /**
     * Join a game (guest)
     */
    async joinGame(gameId, payload) {
        try {
            const response = await this.client.post(`/${gameId}/join-guest`, payload);
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to join game ${gameId}:`, error.message);
            throw error;
        }
    }

    /**
     * Start a game (invite-only endpoint for creators)
     */
    async startGame(gameId, payload) {
        try {
            const response = await this.client.post(`/${gameId}/start-guest`, payload);
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to start game ${gameId}:`, error.message);
            throw error;
        }
    }

    /**
     * Get game progress (for question generation status)
     */
    async getGameProgress(gameId) {
        try {
            const response = await this.client.get(`/${gameId}/progress`);
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to get game progress ${gameId}:`, error.message);
            throw error;
        }
    }

    /**
     * Submit an answer for a question
     */
    async submitAnswer(gameId, questionId, payload) {
        try {
            const response = await this.client.post(`/${gameId}/questions/${questionId}/answer-guest`, payload);
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to submit answer for game ${gameId}, question ${questionId}:`, error.message);
            throw error;
        }
    }

    /**
     * Mark local player as finished with the game
     */
    async markFinished(gameId, payload) {
        try {
            const response = await this.client.post(`/${gameId}/set-finished`, payload);
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to mark finished for game ${gameId}:`, error.message);
            throw error;
        }
    }

    /**
     * Register player in finished players JSON
     */
    async registerFinishedPlayer(gameId, payload) {
        try {
            const response = await this.client.post(`/${gameId}/register-finished`, payload);
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to register finished player for game ${gameId}:`, error.message);
            throw error;
        }
    }

    /**
     * Get finished players list
     */
    async getFinishedPlayers(gameId) {
        try {
            const response = await this.client.get(`/${gameId}/finished-players`);
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to get finished players for game ${gameId}:`, error.message);
            throw error;
        }
    }

    /**
     * Get game results/leaderboard
     */
    async getGameResults(gameId) {
        try {
            const response = await this.client.get(`/${gameId}/results`);
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to get game results for ${gameId}:`, error.message);
            throw error;
        }
    }

    /**
     * Leave a game
     */
    async leaveGame(gameId, payload) {
        try {
            const response = await this.client.post(`/${gameId}/leave`, payload);
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to leave game ${gameId}:`, error.message);
            throw error;
        }
    }

    // Leaderboard APIs

    /**
     * Get global leaderboard
     */
    async getLeaderboard() {
        try {
            const response = await this.client.get('/leaderboard');
            return response.data;
        } catch (error) {
            this.logger.error('Failed to get leaderboard:', error.message);
            throw error;
        }
    }

    // Utility methods

    /**
     * Generic GET request
     */
    async get(url, params = {}) {
        try {
            const response = await this.client.get(url, { params });
            return response.data;
        } catch (error) {
            this.logger.error(`GET ${url} failed:`, error.message);
            throw error;
        }
    }

    /**
     * Generic POST request
     */
    async post(url, data = {}) {
        try {
            const response = await this.client.post(url, data);
            return response.data;
        } catch (error) {
            this.logger.error(`POST ${url} failed:`, error.message);
            throw error;
        }
    }

    /**
     * Check if API is reachable
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/health', { timeout: 5000 });
            return response.status === 200;
        } catch (error) {
            this.logger.warn('API health check failed:', error.message);
            return false;
        }
    }

    /**
     * Generate questions locally from database (fast method like bible-trivia1)
     * Now includes per-guild question tracking to prevent repeats for 5 days
     */
    generateQuestionsLocally(difficulty, count, guildId = null) {
        try {
            this.logger.debug(`Generating ${count} ${difficulty} questions locally from database${guildId ? ` for guild ${guildId}` : ''}`);

            // Filter questions by difficulty
            let availableQuestions = BIBLE_QUESTIONS_JSON.filter(q => q.difficulty === difficulty);

            if (availableQuestions.length === 0) {
                this.logger.warn(`No questions found for difficulty: ${difficulty}`);
                return [];
            }

            // If guild ID provided, filter out recently asked questions
            if (guildId) {
                const recentlyAskedIds = this.getRecentlyAskedQuestionIds(guildId);
                const originalCount = availableQuestions.length;

                availableQuestions = availableQuestions.filter(q => !recentlyAskedIds.has(q.id));

                this.logger.debug(`Guild ${guildId}: Filtered ${originalCount} -> ${availableQuestions.length} questions (excluded ${recentlyAskedIds.size} recently asked)`);

                // If we don't have enough questions after filtering, warn but continue
                if (availableQuestions.length < count) {
                    this.logger.warn(`Guild ${guildId}: Only ${availableQuestions.length} fresh questions available for ${difficulty} difficulty`);
                }
            }

            // Shuffle and select questions using Fisher-Yates algorithm
            const shuffled = this.shuffleArray([...availableQuestions]);
            const selected = shuffled.slice(0, Math.min(count, shuffled.length));

            this.logger.debug(`Generated ${selected.length} questions for difficulty ${difficulty}`);

            // Record these questions as asked for this guild (if guildId provided)
            if (guildId && selected.length > 0) {
                this.recordAskedQuestions(guildId, selected.map(q => q.id));
            }

            // Convert to the format expected by the game manager
            return selected.map((q, index) => {
                // Create a copy of options and shuffle them using Fisher-Yates algorithm
                const shuffledOptions = this.shuffleArray([...q.options]);

                // Find the new index of the correct answer after shuffling
                const correctAnswerIndex = shuffledOptions.findIndex(option => option === q.correctAnswer);

                this.logger.debug(`Question ${index + 1}: correctAnswer="${q.correctAnswer}", originalOptions=${JSON.stringify(q.options)}, shuffledOptions=${JSON.stringify(shuffledOptions)}, correctAnswerIndex=${correctAnswerIndex}`);

                return {
                    id: q.id || `local-${Date.now()}-${index}`,
                    question_text: q.question,
                    correct_answer: q.correctAnswer,
                    correct_answer_index: correctAnswerIndex !== -1 ? correctAnswerIndex : 0,
                    options: shuffledOptions,
                    bible_reference: q.reference,
                    difficulty: q.difficulty,
                    points: q.points,
                    ai_generated: false,
                    question_number: index + 1,
                    uniqueId: `local-${Date.now()}-${index}`
                };
            });
        } catch (error) {
            this.logger.error('Error generating questions locally:', error);
            return [];
        }
    }

    /**
     * Get set of question IDs that were asked in this guild within the last 5 days
     */
    getRecentlyAskedQuestionIds(guildId) {
        try {
            const trackingFile = path.join(this.questionTrackingDir, `guild-${guildId}.json`);
            const recentlyAsked = new Set();

            // Check if tracking file exists
            if (!fs.existsSync(trackingFile)) {
                this.logger.debug(`No tracking file found for guild ${guildId}, creating new one`);
                return recentlyAsked;
            }

            // Load existing tracking data
            const trackingData = JSON.parse(fs.readFileSync(trackingFile, 'utf8'));
            const now = Date.now();
            const fiveDaysAgo = now - (5 * 24 * 60 * 60 * 1000); // 5 days in milliseconds

            // Filter out entries older than 5 days and collect recent question IDs
            const validEntries = [];
            trackingData.forEach(entry => {
                if (entry.timestamp >= fiveDaysAgo) {
                    recentlyAsked.add(entry.questionId);
                    validEntries.push(entry);
                }
            });

            // If we removed old entries, update the file
            if (validEntries.length !== trackingData.length) {
                fs.writeFileSync(trackingFile, JSON.stringify(validEntries, null, 2));
                this.logger.debug(`Cleaned up ${trackingData.length - validEntries.length} old entries for guild ${guildId}`);
            }

            this.logger.debug(`Guild ${guildId}: Found ${recentlyAsked.size} recently asked questions`);
            return recentlyAsked;

        } catch (error) {
            this.logger.warn(`Error reading question tracking for guild ${guildId}:`, error.message);
            return new Set(); // Return empty set on error
        }
    }

    /**
     * Record newly asked questions for this guild
     */
    recordAskedQuestions(guildId, questionIds) {
        try {
            const trackingFile = path.join(this.questionTrackingDir, `guild-${guildId}.json`);
            const now = Date.now();

            // Load existing data or create empty array
            let trackingData = [];
            if (fs.existsSync(trackingFile)) {
                trackingData = JSON.parse(fs.readFileSync(trackingFile, 'utf8'));
            }

            // Add new entries
            const newEntries = questionIds.map(questionId => ({
                questionId,
                timestamp: now
            }));

            trackingData.push(...newEntries);

            // Save updated data
            fs.writeFileSync(trackingFile, JSON.stringify(trackingData, null, 2));
            this.logger.debug(`Recorded ${newEntries.length} questions as asked for guild ${guildId}`);

        } catch (error) {
            this.logger.warn(`Error recording question tracking for guild ${guildId}:`, error.message);
            // Continue - tracking failure shouldn't break the game
        }
    }

    /**
     * Fisher-Yates shuffle algorithm for uniform randomization
     * This is the same algorithm used by the website version for fair randomization
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Get game with locally generated questions (fallback method)
     */
    async getGameWithLocalQuestions(gameId, difficulty, questionCount) {
        try {
            this.logger.debug(`Getting game ${gameId} with locally generated questions`);

            // First try to get the actual game from API
            const gameResult = await this.getGame(gameId);

            if (gameResult.success && gameResult.questions && gameResult.questions.length > 0) {
                this.logger.debug(`Game ${gameId} already has ${gameResult.questions.length} questions from API`);
                return gameResult;
            }

            // If no questions from API, generate locally
            this.logger.debug(`No questions from API for game ${gameId}, generating locally`);
            const localQuestions = this.generateQuestionsLocally(difficulty, questionCount);

            // Return game data with local questions
            return {
                success: true,
                game: gameResult.game,
                participants: gameResult.participants || [],
                questions: localQuestions
            };
        } catch (error) {
            this.logger.error(`Error getting game with local questions:`, error);

            // Return error with empty questions array
            return {
                success: false,
                error: error.message,
                questions: []
            };
        }
    }

    /**
     * Format error response consistently
     */
    formatError(error) {
        if (error.response) {
            // API responded with error status
            return {
                success: false,
                status: error.response.status,
                message: error.response.data?.error || error.response.data?.message || 'API Error',
                data: error.response.data
            };
        } else if (error.request) {
            // Network error
            return {
                success: false,
                status: 0,
                message: 'Network Error - Unable to connect to API',
                data: null
            };
        } else {
            // Other error
            return {
                success: false,
                status: 0,
                message: error.message || 'Unknown Error',
                data: null
            };
        }
    }
}
