import axios from 'axios';
import { Logger } from '../utils/Logger.js';
import { BIBLE_QUESTIONS } from '../src/bible-questions-data.js';

export class APIService {
    constructor(options = {}) {
        this.baseURL = options.baseURL || 'https://gospelways.com/api/bible-games';
        this.logger = new Logger();

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
     */
    generateQuestionsLocally(difficulty, count) {
        try {
            this.logger.debug(`Generating ${count} ${difficulty} questions locally from database`);

            // Filter questions by difficulty
            const difficultyQuestions = BIBLE_QUESTIONS.filter(q => q.difficulty === difficulty);

            if (difficultyQuestions.length === 0) {
                this.logger.warn(`No questions found for difficulty: ${difficulty}`);
                return [];
            }

            // Shuffle and select questions
            const shuffled = [...difficultyQuestions].sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, Math.min(count, shuffled.length));

            this.logger.debug(`Generated ${selected.length} questions for difficulty ${difficulty}`);

            // Convert to the format expected by the game manager
            return selected.map((q, index) => {
                // Create a copy of options and shuffle them
                const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);

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
