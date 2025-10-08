import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { registerUser, loginUser, authMiddleware, setAuthCookie, clearAuthCookie, getLoggedInUser } from './auth';
import { authenticate, requirePermission, requireContentCreator, hasPermission } from './auth-middleware';
import {
  rateLimitMiddleware,
  securityHeadersMiddleware,
  inputValidationMiddleware,
  csrfProtectionMiddleware,
  generateCSRFToken,
  validateFileUpload,
  logSecurityEvent,
  apiKeyValidationMiddleware
} from './security-middleware';
import commentsApi from './comments-api';

import {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  getCategories,
  setGlobalEnv,
  getSiteSettings,

  toggleLike,
  getLikeCount,
  getUserLikeStatus,

  suspendUser,
  banUser,
  logActivity,
  User
} from './database-neon';

const api = new Hono();

// Security middleware - apply early in the pipeline
// Apply rate limiting with admin bypass for admin routes
api.use('*', rateLimitMiddleware({ skipForAdmins: true }));
api.use('*', securityHeadersMiddleware());
api.use('*', inputValidationMiddleware({ excludePaths: ['/api/auth/login', '/api/auth/register', '/api/auth/verify-email', '/api/auth/resend-verification', '/api/auth/request-password-reset', '/api/auth/reset-password', '/api/admin/security/dashboard', '/api/admin/security/events', '/api/admin/security/alerts', '/api/admin/security/threats'] }));

// Enable CORS for API routes
api.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'https://*.pages.dev', 'https://*.e2b.dev', 'https://gospelways.com'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-API-Key'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// CSRF protection for state-changing operations (excluding login for now)
api.use('/api/auth/register', csrfProtectionMiddleware());
api.use('/api/auth/verify-email', csrfProtectionMiddleware());
api.use('/api/auth/resend-verification', csrfProtectionMiddleware());
api.use('/api/auth/request-password-reset', csrfProtectionMiddleware());
api.use('/api/auth/reset-password', csrfProtectionMiddleware());
api.use('/api/admin/*', csrfProtectionMiddleware());

// Mount comments API
api.route('/api/comments', commentsApi);

// Bible Game Multiplayer API Routes
// Global Bible Trivia Leaderboard endpoint - must come before /:id route
api.get('/bible-games/leaderboard', async (c) => {
  try {
    const { getGlobalLeaderboard } = await import('./database-neon');

    const difficulties = ['easy', 'medium', 'hard', 'expert'] as const;
    const leaderboard: { [key: string]: any[] } = {};

    for (const difficulty of difficulties) {
      leaderboard[difficulty] = await getGlobalLeaderboard(difficulty, 5);
    }

    return c.json({
      success: true,
      leaderboard: leaderboard
    });
  } catch (error) {
    console.error('Error fetching global leaderboard:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch leaderboard'
    }, 500);
  }
});

api.post('/bible-games/create', async (c) => {
  try {
    const { name, difficulty, maxPlayers, questionsPerGame, timePerQuestion, playerName } = await c.req.json();

    if (!name || !difficulty || !playerName) {
      return c.json({
        success: false,
        error: 'Game name, difficulty, and player name are required'
      }, 400);
    }

    const { createBibleGame } = await import('./database-neon');

    // For guest users, create a temporary user ID
    const guestUserId = null; // null indicates guest user
    const guestUserName = playerName;

    const game = await createBibleGame(
      name,
      difficulty,
      guestUserId,
      guestUserName,
      {
        maxPlayers: maxPlayers || 10,
        questionsPerGame: questionsPerGame || 10,
        timePerQuestion: timePerQuestion || 10
      }
    );

    // Get the game with participants to return complete data
    const { getBibleGameById, getBibleGameParticipants } = await import('./database-neon');
    const gameWithParticipants = await getBibleGameById(game.id);
    const participants = await getBibleGameParticipants(game.id);

    return c.json({
      success: true,
      message: 'Bible game created successfully',
      game: gameWithParticipants,
      participants: participants
    });
  } catch (error) {
    console.error('Error creating Bible game:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create game'
    }, 500);
  }
});

api.get('/bible-games', async (c) => {
  try {
    const status = c.req.query('status');
    const { getBibleGames } = await import('./database-neon');

    const games = await getBibleGames(status);

    return c.json({
      success: true,
      games: games
    });
  } catch (error) {
    console.error('Error fetching Bible games:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch games'
    }, 500);
  }
});

api.post('/bible-games/:id/join', authMiddleware, async (c) => {
  try {
    const user = (c as any).get('user') as User;
    const gameId = parseInt(c.req.param('id'));

    if (isNaN(gameId)) {
      return c.json({ success: false, error: 'Invalid game ID' }, 400);
    }

    const { joinBibleGame } = await import('./database-neon');

    const participant = await joinBibleGame(gameId, user.id, user.name, user.email);

    return c.json({
      success: true,
      message: 'Joined game successfully',
      participant: participant
    });
  } catch (error) {
    console.error('Error joining Bible game:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to join game'
    }, 400);
  }
});

api.post('/bible-games/:id/join-guest', async (c) => {
  try {
    const gameId = parseInt(c.req.param('id'));
    const { playerName } = await c.req.json();

    if (isNaN(gameId) || !playerName) {
      return c.json({
        success: false,
        error: 'Valid game ID and player name are required'
      }, 400);
    }

    const { joinBibleGameAsGuest, getBibleGameById } = await import('./database-neon');

    // Get the game first to return it in the response
    const game = await getBibleGameById(gameId);
    if (!game) {
      return c.json({
        success: false,
        error: 'Game not found'
      }, 404);
    }

    const participant = await joinBibleGameAsGuest(gameId, playerName);

    return c.json({
      success: true,
      message: 'Joined game as guest successfully',
      game: game,
      participant: participant
    });
  } catch (error) {
    console.error('Error joining Bible game as guest:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to join game'
    }, 400);
  }
});

api.get('/bible-games/:id', async (c) => {
  try {
    const gameId = parseInt(c.req.param('id'));

    if (isNaN(gameId)) {
      return c.json({ success: false, error: 'Invalid game ID' }, 400);
    }

    const { getBibleGameById, getBibleGameParticipants, getBibleGameQuestions } = await import('./database-neon');

    const game = await getBibleGameById(gameId);
    if (!game) {
      return c.json({ success: false, error: 'Game not found' }, 404);
    }

    const participants = await getBibleGameParticipants(gameId);
    const questions = await getBibleGameQuestions(gameId);

    return c.json({
      success: true,
      game: game,
      participants: participants,
      questions: questions
    });
  } catch (error) {
    console.error('Error fetching Bible game:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch game'
    }, 500);
  }
});

api.post('/bible-games/:id/start', authMiddleware, async (c) => {
  try {
    const user = (c as any).get('user') as User;
    const gameId = parseInt(c.req.param('id'));

    if (isNaN(gameId)) {
      return c.json({ success: false, error: 'Invalid game ID' }, 400);
    }

    const { canStartGame, startBibleGame, getRandomQuestionsByDifficulty, createBibleGameQuestions, getBibleGameQuestions } = await import('./database-neon');

    const canStart = await canStartGame(gameId, user.id);
    if (!canStart.canStart) {
      return c.json({
        success: false,
        error: canStart.reason || 'Cannot start game'
      }, 403);
    }

    // Generate questions for the game from database
    const { getBibleGameById } = await import('./database-neon');
    const game = await getBibleGameById(gameId);

    if (!game) {
      return c.json({ success: false, error: 'Game not found' }, 404);
    }

    console.log(`Starting database question generation for authenticated game ${gameId}, difficulty: ${game.difficulty}, questions needed: ${game.questions_per_game}`);

    // Check if questions already exist for this game
    const existingQuestions = await getBibleGameQuestions(gameId);

    let questions;
    if (existingQuestions.length >= game.questions_per_game) {
      console.log(`All questions already exist: ${existingQuestions.length}/${game.questions_per_game}`);
      questions = existingQuestions.map((q: any) => ({
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
    } else {
      console.log(`Getting ${game.questions_per_game} random questions from database for difficulty: ${game.difficulty}`);

      // Get random questions from database instead of generating with AI
      const dbQuestions = await getRandomQuestionsByDifficulty(game.difficulty as 'easy' | 'medium' | 'hard' | 'expert', game.questions_per_game);

      if (dbQuestions.length === 0) {
        return c.json({
          success: false,
          error: `No questions available for difficulty level: ${game.difficulty}`
        }, 500);
      }

      console.log(`Retrieved ${dbQuestions.length} questions from database`);

      // Save these database questions to the game
      const gameQuestions = dbQuestions.map((q, index) => ({
        questionText: q.text,
        correctAnswer: q.correctAnswer,
        options: q.options,
        bibleReference: q.reference,
        difficulty: q.difficulty,
        points: q.points,
        questionNumber: index + 1
      }));

      // Insert questions into bible_game_questions table
      const insertedQuestions = await createBibleGameQuestions(gameId, gameQuestions);

      console.log(`Inserted ${insertedQuestions.length} questions into game ${gameId}`);

      // Return the inserted questions in the expected format
      questions = insertedQuestions.map((q: any) => ({
        id: q.id,
        text: q.question_text,
        correctAnswer: q.correct_answer,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]'),
        reference: q.bible_reference,
        difficulty: q.difficulty,
        points: q.points,
        aiGenerated: false, // These are from database, not AI generated
        questionNumber: q.question_number,
        uniqueId: `db-${q.id}`
      }));
    }

    console.log('Generated questions:', questions.length);

    if (questions.length === 0) {
      return c.json({
        success: false,
        error: 'Failed to generate questions for the game'
      }, 500);
    }

    console.log('Recording verse usage in batch...');

    // Use batch verse usage recording to reduce database calls
    const { recordVerseUsageBatch } = await import('./database-neon');
    await recordVerseUsageBatch(questions.map(q => q.reference));

    // Questions are already saved to database during generation
    // No need to save again - just get the count
    const savedQuestions = await getBibleGameQuestions(gameId);

    console.log('Saved questions:', savedQuestions.length);

    console.log('Starting the game...');

    // Log current game status before starting
    const currentGame = await getBibleGameById(gameId);
    console.log('Game status before starting:', currentGame?.status);

    // Start the game
    const started = await startBibleGame(gameId);

    if (!started) {
      console.error('Failed to start game - startBibleGame returned false');
      return c.json({
        success: false,
        error: 'Failed to start game'
      }, 500);
    }

    // Verify the game status was actually updated
    const updatedGame = await getBibleGameById(gameId);
    console.log('Game status after starting:', updatedGame?.status);

    if (updatedGame?.status !== 'starting') {
      console.error('Game status not updated correctly:', {
        expected: 'starting',
        actual: updatedGame?.status
      });
      return c.json({
        success: false,
        error: 'Game status not updated correctly'
      }, 500);
    }

    console.log('Game started successfully');

    return c.json({
      success: true,
      message: 'Game started successfully',
      questionsCount: savedQuestions.length
    });
  } catch (error) {
    console.error('Error starting Bible game:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start game'
    }, 500);
  }
});

api.post('/bible-games/:id/start-guest', async (c) => {
  try {
    console.log('Start guest game request received');
    const gameId = parseInt(c.req.param('id'));
    console.log('Parsed gameId:', gameId);

    const requestBody = await c.req.json();
    console.log('Request body:', requestBody);

    const { guestId } = requestBody;

    console.log('Extracted guest data:', { guestId });

    if (isNaN(gameId) || guestId === undefined || guestId === null || guestId < 0) {
      console.log('Validation failed:', { gameId, isNaN: isNaN(gameId), guestId, guestIdType: typeof guestId });
      return c.json({
        success: false,
        error: 'Valid game ID and guest ID are required'
      }, 400);
    }

    const { getBibleGameById, getBibleGameParticipants, canStartGame, startBibleGame } = await import('./database-neon');
    const { AIBibleQuestionGenerator } = await import('./ai-bible-question-generator');
    const { AIBibleQuestionGenerator1 } = await import('./ai-bible-question-generator-1');

    // Get the game
    console.log('Getting game by ID:', gameId);
    const game = await getBibleGameById(gameId);
    console.log('Game found:', game);
    if (!game) {
      return c.json({ success: false, error: 'Game not found' }, 404);
    }

    // Check if this player can start the game
    console.log('Getting participants for game:', gameId);
    const participants = await getBibleGameParticipants(gameId);
    console.log('Start game participants:', participants);
    console.log('Start game request:', { guestId });

    let playerParticipant = participants.find(p => p.guest_id === guestId);
    console.log('Found player participant:', playerParticipant);

    // If not found in the complex query, try a simpler direct query
    if (!playerParticipant) {
      console.log('Participant not found in complex query, trying simple direct lookup...');

      // Use a simpler, direct query without complex JOINs
      const { getDB } = await import('./database-neon');
      const sql = getDB();

      const simpleResult = await sql`
        SELECT * FROM bible_game_participants
        WHERE game_id = ${gameId} AND guest_id = ${guestId}
      `;

      console.log('Simple direct lookup result:', simpleResult);

      if (simpleResult.length > 0) {
        playerParticipant = simpleResult[0] as any; // Cast to match the expected type
        console.log('Found participant with simple query:', playerParticipant);
      } else {
        console.log('Participant not found even with simple query - checking all participants in game');

        // Debug: Check all participants in the game
        const allParticipants = await sql`
          SELECT * FROM bible_game_participants WHERE game_id = ${gameId}
        `;
        console.log('All participants in game:', allParticipants);

        // SPECIAL HANDLING FOR SOLO GAMES: If this is a solo game and guestId is 0, allow it
        if (game.max_players === 1 && guestId === 0) {
          console.log('Solo game creator with guest_id 0 - allowing start despite participant lookup failure');
          // This is a valid solo game creator, allow them to proceed
          playerParticipant = {
            id: 0,
            game_id: gameId,
            guest_id: 0,
            player_name: 'Solo Player',
            is_creator: true,
            is_active: true,
            score: 0,
            correct_answers: 0,
            total_questions: 0
          } as any;
        } else {
          console.log('Participant not found even with simple query - returning 403');
          return c.json({
            success: false,
            error: 'You are not a participant in this game'
          }, 403);
        }
      }
    }

    // For authenticated games, only allow the creator to start
    // For guest games, allow the creator (guest_id = 0) to start
    if (game.created_by !== null && playerParticipant && game.created_by !== playerParticipant.user_id) {
      console.log('Creator check failed for authenticated game:', { gameCreator: game.created_by, playerUserId: playerParticipant.user_id });
      return c.json({
        success: false,
        error: 'Only the game creator can start the game'
      }, 403);
    }

    // For guest games, ensure the requesting guest is the creator (guest_id = 0)
    if (game.created_by === null && playerParticipant && playerParticipant.guest_id !== 0) {
      console.log('Guest creator check failed:', { gameCreator: game.created_by, guestId: playerParticipant.guest_id });
      return c.json({
        success: false,
        error: 'Only the game creator can start the game'
      }, 403);
    }

    // Additional check: For solo games, if participant lookup failed but guestId is 0, allow it
    if (game.max_players === 1 && guestId === 0 && !playerParticipant) {
      console.log('Solo game creator with guest_id 0 - allowing start despite participant lookup failure');
      // This is a valid solo game creator, allow them to proceed
    }

    // Special handling for solo games - allow creator to start immediately
    if (game.max_players === 1 && playerParticipant && playerParticipant.guest_id === 0) {
      console.log('Solo game creator detected, allowing start without further checks');
      // Skip the canStartGame check for solo games as it's designed for multiplayer
    } else if (game.max_players === 1 && guestId === 0) {
      // Handle case where participant lookup failed but this is a solo game creator
      console.log('Solo game creator with guest_id 0 detected - allowing start even if participant lookup failed');
      // Skip the canStartGame check for solo games as it's designed for multiplayer
    }

    // For guest games, we already checked that the player is the creator above
    // The canStartGame function is designed for authenticated users
    // For guests, we trust the participant.is_creator check

    console.log('Starting question generation for game', gameId);

    // Generate questions for the game from database
    const { getBibleGameQuestions, getRandomQuestionsByDifficulty } = await import('./database-neon');

    console.log(`Starting database question generation for game ${gameId}, difficulty: ${game.difficulty}, questions needed: ${game.questions_per_game}`);

    // Check if questions already exist for this game
    const existingQuestions = await getBibleGameQuestions(gameId);

    let questions;
    if (existingQuestions.length >= game.questions_per_game) {
      console.log(`All questions already exist: ${existingQuestions.length}/${game.questions_per_game}`);
      questions = existingQuestions.map((q: any) => ({
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
    } else {
      console.log(`Getting ${game.questions_per_game} random questions from database for difficulty: ${game.difficulty}`);

      // Get random questions from database instead of generating with AI
      const dbQuestions = await getRandomQuestionsByDifficulty(game.difficulty as 'easy' | 'medium' | 'hard' | 'expert', game.questions_per_game);

      if (dbQuestions.length === 0) {
        return c.json({
          success: false,
          error: `No questions available for difficulty level: ${game.difficulty}`
        }, 500);
      }

      console.log(`Retrieved ${dbQuestions.length} questions from database`);

      // Save these database questions to the game
      const gameQuestions = dbQuestions.map((q, index) => ({
        questionText: q.text,
        correctAnswer: q.correctAnswer,
        options: q.options,
        bibleReference: q.reference,
        difficulty: q.difficulty,
        points: q.points,
        questionNumber: index + 1
      }));

      // Insert questions into bible_game_questions table
      const { createBibleGameQuestions } = await import('./database-neon');
      const insertedQuestions = await createBibleGameQuestions(gameId, gameQuestions);

      console.log(`Inserted ${insertedQuestions.length} questions into game ${gameId}`);

      // Return the inserted questions in the expected format
      questions = insertedQuestions.map((q: any) => ({
        id: q.id,
        text: q.question_text,
        correctAnswer: q.correct_answer,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]'),
        reference: q.bible_reference,
        difficulty: q.difficulty,
        points: q.points,
        aiGenerated: false, // These are from database, not AI generated
        questionNumber: q.question_number,
        uniqueId: `db-${q.id}`
      }));
    }

    console.log('Generated questions:', questions.length);

    if (questions.length === 0) {
      return c.json({
        success: false,
        error: 'Failed to generate questions for the game'
      }, 500);
    }

    console.log('Recording verse usage in batch...');

    // Use batch verse usage recording to reduce database calls
    const { recordVerseUsageBatch } = await import('./database-neon');
    await recordVerseUsageBatch(questions.map(q => q.reference));

    // Questions are already saved to database during generation
    // No need to save again - just get the count
    const savedQuestions = await getBibleGameQuestions(gameId);

    console.log('Saved questions:', savedQuestions.length);

    console.log('Starting the game...');

    // Log current game status before starting
    const currentGame = await getBibleGameById(gameId);
    console.log('Game status before starting:', currentGame?.status);

    // Start the game
    const started = await startBibleGame(gameId);

    if (!started) {
      console.error('Failed to start game - startBibleGame returned false');
      return c.json({
        success: false,
        error: 'Failed to start game'
      }, 500);
    }

    // Verify the game status was actually updated
    const updatedGame = await getBibleGameById(gameId);
    console.log('Game status after starting:', updatedGame?.status);

    if (updatedGame?.status !== 'starting') {
      console.error('Game status not updated correctly:', {
        expected: 'starting',
        actual: updatedGame?.status
      });
      return c.json({
        success: false,
        error: 'Game status not updated correctly'
      }, 500);
    }

    console.log('Game started successfully');

    return c.json({
      success: true,
      message: 'Game started successfully',
      questionsCount: savedQuestions.length
    });
  } catch (error) {
    console.error('Error starting Bible game as guest:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start game'
    }, 500);
  }
});

api.post('/bible-games/:gameId/questions/:questionId/answer', authMiddleware, async (c) => {
  try {
    const user = (c as any).get('user') as User;
    const gameId = parseInt(c.req.param('gameId'));
    const questionId = parseInt(c.req.param('questionId'));
    const { selectedAnswer, timeTaken } = await c.req.json();

    if (isNaN(gameId) || isNaN(questionId) || !selectedAnswer) {
      return c.json({
        success: false,
        error: 'Valid game ID, question ID, and selected answer are required'
      }, 400);
    }

    // Find participant's record for this game
    const { getBibleGameParticipants, recordBibleGameAnswer } = await import('./database-neon');
    const participants = await getBibleGameParticipants(gameId);
    const participant = participants.find(p => p.user_id === user.id);

    if (!participant) {
      return c.json({
        success: false,
        error: 'You are not a participant in this game'
      }, 403);
    }

    const answer = await recordBibleGameAnswer(
      gameId,
      participant.id,
      questionId,
      selectedAnswer,
      timeTaken || 10
    );

    return c.json({
      success: true,
      answer: answer
    });
  } catch (error) {
    console.error('Error recording Bible game answer:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record answer'
    }, 500);
  }
});

// Guest version of answer submission endpoint
api.post('/bible-games/:gameId/questions/:questionId/answer-guest', async (c) => {
  try {
    const gameId = parseInt(c.req.param('gameId'));
    const questionId = parseInt(c.req.param('questionId'));
    const { selectedAnswer, timeTaken, guestId } = await c.req.json();

    if (isNaN(gameId) || isNaN(questionId) || !selectedAnswer || guestId === undefined || guestId === null) {
      return c.json({
        success: false,
        error: 'Valid game ID, question ID, selected answer, and guest ID are required'
      }, 400);
    }

    // Find participant's record for this game using guest_id
    const { getBibleGameParticipantByGuestId, recordBibleGameAnswer, getBibleGameParticipants } = await import('./database-neon');

    console.log('=== GUEST ANSWER SUBMISSION DEBUG ===');
    console.log('Game ID:', gameId);
    console.log('Question ID:', questionId);
    console.log('Guest ID:', guestId);
    console.log('Selected answer:', selectedAnswer);
    console.log('Time taken:', timeTaken);

    // Debug: Get all participants for this game
    const allParticipants = await getBibleGameParticipants(gameId);
    console.log('All participants in game:', allParticipants.map(p => ({
      id: p.id,
      guest_id: p.guest_id,
      player_name: p.player_name,
      is_creator: p.is_creator
    })));

    const participant = await getBibleGameParticipantByGuestId(gameId, guestId);
    console.log('Found participant by guest_id:', participant);

    if (!participant) {
      console.error('❌ Participant not found with guest_id:', guestId);
      return c.json({
        success: false,
        error: 'You are not a participant in this game'
      }, 403);
    }

    const answer = await recordBibleGameAnswer(
      gameId,
      participant.id,
      questionId,
      selectedAnswer,
      timeTaken || 10
    );

    return c.json({
      success: true,
      answer: answer
    });
  } catch (error) {
    console.error('Error recording Bible game answer (guest):', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record answer'
    }, 500);
  }
});

api.post('/bible-games/:id/leave', async (c) => {
  try {
    const gameId = parseInt(c.req.param('id'));
    const { guestId } = await c.req.json();

    if (isNaN(gameId) || guestId === undefined || guestId === null) {
      return c.json({
        success: false,
        error: 'Valid game ID and guest ID are required'
      }, 400);
    }

    const { leaveBibleGame } = await import('./database-neon');

    const success = await leaveBibleGame(gameId, guestId);

    if (!success) {
      return c.json({
        success: false,
        error: 'Failed to leave game or participant not found'
      }, 400);
    }

    return c.json({
      success: true,
      message: guestId === 0 ? 'Game destroyed - creator left' : 'Left game successfully'
    });
  } catch (error) {
    console.error('Error leaving Bible game:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to leave game'
    }, 500);
  }
});

api.get('/bible-games/:id/progress', async (c) => {
  try {
    const gameId = parseInt(c.req.param('id'));

    if (isNaN(gameId)) {
      return c.json({
        success: false,
        error: 'Invalid game ID',
        progress: {
          total: 0,
          generated: 0,
          status: 'error',
          isReady: false
        }
      }, 400);
    }

    const { getBibleGameById, getBibleGameQuestions } = await import('./database-neon');

    // Add timeout and error handling for database calls
    let game, questions;
    
    try {
      game = await getBibleGameById(gameId);
    } catch (error) {
      console.error('Error fetching game:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch game data',
        progress: {
          total: 0,
          generated: 0,
          status: 'error',
          isReady: false
        }
      }, 500);
    }

    if (!game) {
      return c.json({
        success: false,
        error: 'Game not found',
        progress: {
          total: 0,
          generated: 0,
          status: 'not_found',
          isReady: false
        }
      }, 404);
    }

    try {
      questions = await getBibleGameQuestions(gameId);
    } catch (error) {
      console.error('Error fetching questions:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch questions data',
        progress: {
          total: game.questions_per_game || 0,
          generated: 0,
          status: game.status,
          isReady: false
        }
      }, 500);
    }

    const progress = {
      total: game.questions_per_game || 0,
      generated: questions.length,
      status: game.status,
      isReady: questions.length >= (game.questions_per_game || 0) && game.status === 'starting'
    };

    return c.json({
      success: true,
      progress: progress
    });
  } catch (error) {
    console.error('Error checking game progress:', error);
    return c.json({
      success: false,
      error: 'Internal server error',
      progress: {
        total: 0,
        generated: 0,
        status: 'error',
        isReady: false
      }
    }, 500);
  }
});

api.get('/bible-games/:id/results', async (c) => {
  try {
    const gameId = parseInt(c.req.param('id'));

    if (isNaN(gameId)) {
      return c.json({ success: false, error: 'Invalid game ID' }, 400);
    }

    const { getBibleGameResults } = await import('./database-neon');

    const results = await getBibleGameResults(gameId);

    return c.json({
      success: true,
      results: results
    });
  } catch (error) {
    console.error('Error fetching Bible game results:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch results'
    }, 500);
  }
});

// Set player as finished with all questions (with deadlock detection)
api.post('/bible-games/:id/set-finished', async (c) => {
  try {
    const gameId = parseInt(c.req.param('id'));
    const { guestId } = await c.req.json();

    if (isNaN(gameId) || guestId === undefined || guestId === null) {
      return c.json({
        success: false,
        error: 'Valid game ID and guest ID are required'
      }, 400);
    }

    const { setPlayerFinishedAllQuestions } = await import('./database-neon');

    // Use the enhanced version with retry logic and deadlock detection
    const success = await setPlayerFinishedAllQuestions(gameId, guestId);

    return c.json({
      success: true,
      message: success ? 'Player marked as finished' : 'Player was already finished or not found'
    });
  } catch (error) {
    console.error('Error setting player finished status:', error);
    return c.json({
      success: false,
      error: 'Failed to set finished status'
    }, 500);
  }
});

// Check if all players have finished (with deadlock detection)
api.get('/bible-games/:id/check-finished', async (c) => {
  try {
    const gameId = parseInt(c.req.param('id'));

    if (isNaN(gameId)) {
      return c.json({ success: false, error: 'Invalid game ID' }, 400);
    }

    const { checkAllPlayersFinishedWithDeadlockDetection } = await import('./database-neon');

    const result = await checkAllPlayersFinishedWithDeadlockDetection(gameId);

    console.log('Check finished result (with deadlock detection):', {
      gameId,
      allFinished: result.allFinished,
      finishedCount: result.finishedCount,
      totalPlayers: result.totalPlayers,
      finishedPlayersCount: result.finishedPlayers.length,
      forceCompleted: result.forceCompleted,
      deadlockDetected: result.deadlockDetected
    });

    return c.json({
      success: true,
      allFinished: result.allFinished,
      finishedCount: result.finishedCount,
      totalPlayers: result.totalPlayers,
      finishedPlayers: result.finishedPlayers,
      forceCompleted: result.forceCompleted,
      deadlockDetected: result.deadlockDetected
    });
  } catch (error) {
    console.error('Error checking if all players finished:', error);
    return c.json({
      success: false,
      error: 'Failed to check finished status'
    }, 500);
  }
});

// NEW: Get finished players JSON for efficient multiplayer sync
api.get('/bible-games/:id/finished-players', async (c) => {
  try {
    const gameId = parseInt(c.req.param('id'));

    if (isNaN(gameId)) {
      return c.json({ success: false, error: 'Invalid game ID' }, 400);
    }

    const { getBibleGameById, getBibleGameParticipants } = await import('./database-neon');

    // Get game and participants
    const game = await getBibleGameById(gameId);
    if (!game) {
      return c.json({ success: false, error: 'Game not found' }, 404);
    }

    const participants = await getBibleGameParticipants(gameId);

    // Create finished players JSON structure
    const finishedPlayersData = {
      gameId: gameId,
      totalPlayers: participants.length,
      questionsPerGame: game.questions_per_game,
      finishedPlayers: participants
        .filter(p => p.finished_all_questions === true)
        .map(p => ({
          guestId: p.guest_id,
          playerName: p.player_name,
          finishedAt: p.last_activity || new Date().toISOString(),
          score: p.score || 0,
          correctAnswers: p.correct_answers || 0
        })),
      lastUpdated: new Date().toISOString()
    };

    return c.json({
      success: true,
      finishedPlayersData: finishedPlayersData
    });
  } catch (error) {
    console.error('Error getting finished players data:', error);
    return c.json({
      success: false,
      error: 'Failed to get finished players data'
    }, 500);
  }
});

// NEW: Register player as finished in JSON (more efficient than polling)
api.post('/bible-games/:id/register-finished', async (c) => {
  try {
    const gameId = parseInt(c.req.param('id'));
    const { guestId, playerName } = await c.req.json();

    if (isNaN(gameId) || guestId === undefined || guestId === null) {
      return c.json({
        success: false,
        error: 'Valid game ID and guest ID are required'
      }, 400);
    }

    const { setPlayerFinishedAllQuestions, getBibleGameById, getBibleGameParticipants } = await import('./database-neon');

    // Verify the game exists
    const game = await getBibleGameById(gameId);
    if (!game) {
      return c.json({ success: false, error: 'Game not found' }, 404);
    }

    // Mark player as finished
    const success = await setPlayerFinishedAllQuestions(gameId, guestId);

    if (!success) {
      return c.json({
        success: false,
        error: 'Failed to register player as finished'
      }, 400);
    }

    // Get updated finished players data
    const participants = await getBibleGameParticipants(gameId);
    const finishedPlayers = participants.filter(p => p.finished_all_questions === true);

    const finishedPlayersData = {
      gameId: gameId,
      totalPlayers: participants.length,
      questionsPerGame: game.questions_per_game,
      finishedPlayers: finishedPlayers.map(p => ({
        guestId: p.guest_id,
        playerName: p.player_name,
        finishedAt: p.last_activity || new Date().toISOString(),
        score: p.score || 0,
        correctAnswers: p.correct_answers || 0
      })),
      lastUpdated: new Date().toISOString()
    };

    console.log(`✅ Player ${playerName} (guestId: ${guestId}) registered as finished in game ${gameId}`);

    return c.json({
      success: true,
      message: 'Player registered as finished successfully',
      finishedPlayersData: finishedPlayersData
    });
  } catch (error) {
    console.error('Error registering player as finished:', error);
    return c.json({
      success: false,
      error: 'Failed to register player as finished'
    }, 500);
  }
});

// NEW: Force complete game (admin endpoint)
api.post('/bible-games/:id/force-complete', async (c) => {
  try {
    const gameId = parseInt(c.req.param('id'));
    const { guestId } = await c.req.json();

    if (isNaN(gameId)) {
      return c.json({ success: false, error: 'Invalid game ID' }, 400);
    }

    const { forceCompleteBibleGame } = await import('./database-neon');

    const success = await forceCompleteBibleGame(gameId, guestId);

    if (!success) {
      return c.json({
        success: false,
        error: 'Failed to force complete game'
      }, 400);
    }

    console.log(`🔧 Game ${gameId} force completed by guest ${guestId}`);

    return c.json({
      success: true,
      message: 'Game force completed successfully'
    });
  } catch (error) {
    console.error('Error force completing game:', error);
    return c.json({
      success: false,
      error: 'Failed to force complete game'
    }, 500);
  }
});

// NEW: Cleanup expired game rooms (admin endpoint)
api.post('/bible-games/cleanup-expired', async (c) => {
  try {
    const { cleanupExpiredGameRooms } = await import('./database-neon');

    const result = await cleanupExpiredGameRooms();

    console.log(`🧹 Game room cleanup completed:`, result);

    return c.json({
      success: true,
      message: `Game room cleanup completed successfully`,
      cleanup: result
    });
  } catch (error) {
    console.error('Error cleaning up expired game rooms:', error);
    return c.json({
      success: false,
      error: 'Failed to cleanup expired game rooms'
    }, 500);
  }
});


// NEW: Get cleanup status (admin endpoint)
api.get('/bible-games/cleanup-status', async (c) => {
  try {
    const { getDB } = await import('./database-neon');
    const sql = getDB();

    // Get games that should be deleted based on TWO conditions:
    // 1. Games that have expired based on their individual expires_at timestamp
    // 2. Games that have been completed and are older than 10 minutes
    const expiredGames = await sql`
      SELECT id, name, status, created_at, expires_at, completed_at, max_players,
             EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as age_hours,
             CASE
               WHEN max_players > 1 THEN 'Multiplayer (1h expiration)'
               ELSE 'Solo (30min expiration)'
             END as game_type,
             'expired' as deletion_reason,
             NULL as completed_age_minutes
      FROM bible_games
      WHERE expires_at < CURRENT_TIMESTAMP
    `;

    const completedGames = await sql`
      SELECT id, name, status, created_at, expires_at, completed_at, max_players,
             EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as age_hours,
             CASE
               WHEN max_players > 1 THEN 'Multiplayer (1h expiration)'
               ELSE 'Solo (30min expiration)'
             END as game_type,
             'completed_10min' as deletion_reason,
             EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - completed_at))/60 as completed_age_minutes
      FROM bible_games
      WHERE completed_at IS NOT NULL
        AND EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - completed_at)) / 60 > 10
    `;

    // Combine the results and remove duplicates (games that are both expired and completed)
    const gamesToDelete = [...expiredGames, ...completedGames].filter((game, index, self) =>
      index === self.findIndex(g => g.id === game.id)
    );

    // Get total counts
    const totalGames = await sql`SELECT COUNT(*) as count FROM bible_games`;
    const totalParticipants = await sql`SELECT COUNT(*) as count FROM bible_game_participants`;
    const totalQuestions = await sql`SELECT COUNT(*) as count FROM bible_game_questions`;
    const totalHistory = await sql`SELECT COUNT(*) as count FROM bible_game_history`;

    // Breakdown by deletion reason
    const expiredCount = gamesToDelete.filter(g => g.deletion_reason === 'expired').length;
    const completedCount = gamesToDelete.filter(g => g.deletion_reason === 'completed_10min').length;

    return c.json({
      success: true,
      cleanupStatus: {
        currentTime: new Date().toISOString(),
        gamesToDelete: gamesToDelete.length,
        expiredGames: expiredCount,
        completedGamesOver10Min: completedCount,
        gamesToDeleteList: gamesToDelete,
        totalCounts: {
          games: parseInt(totalGames[0].count),
          participants: parseInt(totalParticipants[0].count),
          questions: parseInt(totalQuestions[0].count),
          history: parseInt(totalHistory[0].count)
        },
        deletionPolicy: {
          expirationBased: {
            multiplayerGames: '1 hour',
            soloGames: '30 minutes'
          },
          completionBased: '10 minutes after game completion'
        }
      }
    });
  } catch (error) {
    console.error('Error getting cleanup status:', error);
    return c.json({
      success: false,
      error: 'Failed to get cleanup status'
    }, 500);
  }
});



// Health check
api.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});


// CSRF token endpoint
api.get('/csrf-token', (c) => {
  const token = generateCSRFToken(c);
  return c.json({
    csrfToken: token,
    message: 'CSRF token generated successfully'
  });
});

// Debug environment variables (for production debugging)
api.get('/debug/env', (c) => {
  return c.json({
    hasEnv: !!c.env,
    envKeys: c.env ? Object.keys(c.env).filter(key => !key.includes('SECRET') && !key.includes('PASSWORD')) : [],
    hasDatabaseUrl: !!c.env?.DATABASE_URL,
    hasGoogleClientId: !!c.env?.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!c.env?.GOOGLE_CLIENT_SECRET,
    hasEnvironment: !!c.env?.ENVIRONMENT,
    processEnvHas: {
      databaseUrl: !!process.env.DATABASE_URL,
      googleClientId: !!process.env.GOOGLE_CLIENT_ID
    },
    timestamp: new Date().toISOString()
  });
});

// Test database connection directly
api.get('/debug/db', async (c) => {
  try {
    const { setGlobalEnv, getDB } = await import('./database-neon');
    
    // Set environment first
    setGlobalEnv(c.env);
    
    // Try to get database connection
    const sql = getDB();
    
    // Simple query test
    const result = await sql`SELECT 1 as test`;
    
    // Test if categories table exists and has data
    let categoriesTest = null;
    try {
      categoriesTest = await sql`SELECT COUNT(*) as count FROM categories`;
    } catch (tableError) {
      categoriesTest = { error: tableError.message };
    }
    
    return c.json({
      success: true,
      testQuery: result,
      categoriesTable: categoriesTest,
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5), // First 5 lines of stack
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Test getCategories function directly
api.get('/debug/categories', async (c) => {
  try {
    // Set environment first
    setGlobalEnv(c.env);

    // Try the actual getCategories function
    const categories = await getCategories();

    return c.json({
      success: true,
      categories: categories,
      count: categories.length,
      message: 'getCategories function successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 10),
      timestamp: new Date().toISOString()
    }, 500);
  }
});


// Simple categories endpoint that bypasses initialization
api.get('/categories-simple', async (c) => {
  try {
    // Set environment first
    setGlobalEnv(c.env);
    
    // Get database connection directly without initialization
    const { getDB } = await import('./database-neon');
    const sql = getDB();
    
    // Direct query without any initialization
    const categories = await sql`
      SELECT * FROM categories 
      ORDER BY name ASC
    `;
    
    return c.json({
      success: true,
      categories: categories,
      count: categories.length,
      message: 'Direct query successful - bypassed initialization',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Authentication Routes with enhanced security logging
api.post('/auth/register', async (c) => {
  try {
    // Set global environment for database access
    setGlobalEnv(c.env);
    
    const { email, name, password } = await c.req.json();
    
    // Import email verification functions
    const { createEmailVerification } = await import('./database-neon');
    const { sendVerificationEmail } = await import('./email-service-resend');
    
    // Get client info for security logging
    const ipAddress = c.req.header('cf-connecting-ip') ||
                      c.req.header('x-forwarded-for') ||
                      c.req.header('x-real-ip') || '127.0.0.1';
    const userAgent = c.req.header('user-agent') || 'unknown';
    
    // Log registration attempt
    logSecurityEvent(c, 'USER_REGISTRATION_ATTEMPT', {
      email: email.substring(0, 3) + '***', // Partial email for privacy
      ipAddress,
      userAgent
    });
    
    // Create user but don't log them in yet (email_verified will be false)
    const user = await registerUser(email, name, password, false); // Don't auto-login
    
    // Create email verification record
    const verification = await createEmailVerification(
      user.id,
      email,
      'registration',
      ipAddress,
      userAgent
    );
    
    console.log('About to send verification email:', { email, name, otpCode: verification.otp_code });
    
    // Send verification email
    const emailResult = await sendVerificationEmail(email, name, verification.otp_code, c.env);
    
    console.log('Registration email result:', emailResult);
    
    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Still return success but with a warning
      return c.json({
        success: true,
        message: 'Account created successfully, but verification email failed to send. Please contact support.',
        requiresVerification: true,
        userId: user.id
      });
    }
    
    // Log preview URL for testing
    if (emailResult.previewUrl) {
      console.log('📧 Verification email preview:', emailResult.previewUrl);
    }

    // Log registration activity
    await logActivity(
      user.id,
      'user_registration',
      `New user registered: ${user.name} (email verification required)`,
      'user',
      user.id
    );
    
    // Log successful registration
    logSecurityEvent(c, 'USER_REGISTRATION_SUCCESS', {
      userId: user.id,
      email: email.substring(0, 3) + '***',
      requiresVerification: true
    });

    return c.json({
      success: true,
      message: 'Account created successfully! Please check your email for a verification code.',
      requiresVerification: true,
      userId: user.id
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Log failed registration
    logSecurityEvent(c, 'USER_REGISTRATION_FAILED', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email: c.req.header('content-type')?.includes('application/json') ? 'provided' : 'not provided'
    });
    
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed'
    }, 400);
  }
});

// Verify email with OTP
api.post('/auth/verify-email', async (c) => {
  try {
    // Set global environment for database access
    setGlobalEnv(c.env);
    
    const { userId, otpCode } = await c.req.json();
    
    if (!userId || !otpCode) {
      return c.json({
        success: false,
        error: 'User ID and OTP code are required'
      }, 400);
    }
    
    console.log('Email verification request:', { userId, otpCodeLength: otpCode?.length });
    
    const { verifyEmailOTP, getUserById, logActivity } = await import('./database-neon');
    const { sendWelcomeEmail } = await import('./email-service-resend');
    
    console.log('Attempting to verify OTP...');
    
    // Verify the OTP
    const result = await verifyEmailOTP(userId, otpCode, 'registration');
    
    console.log('OTP verification result:', result);
    
    if (!result.success) {
      console.log('OTP verification failed:', result.message);
      return c.json({
        success: false,
        error: result.message || 'Invalid or expired verification code'
      }, 400);
    }
    
    // Get user details for welcome email
    const user = await getUserById(userId);
    if (user) {
      // Check if welcome email should be sent based on settings
      const settings = await getSiteSettings();
      const shouldSendWelcomeEmail = settings.send_welcome_email !== false;

      if (shouldSendWelcomeEmail) {
        // Send welcome email (don't wait for it)
        sendWelcomeEmail(user.email, user.name).catch(error => {
          console.error('Failed to send welcome email:', error);
        });
      }
      
      // Log successful verification
      await logActivity(
        userId,
        'email_verification',
        `Email verified for user: ${user.name}`,
        'user',
        userId
      );
    }
    
    return c.json({
      success: true,
      message: 'Email verified successfully! You can now sign in to your account.'
    });
    
  } catch (error) {
    console.error('Email verification error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return c.json({
      success: false,
      error: 'Verification failed. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Resend verification code
api.post('/auth/resend-verification', async (c) => {
  try {
    // Set global environment for database access
    setGlobalEnv(c.env);
    
    const { userId } = await c.req.json();
    
    if (!userId) {
      return c.json({
        success: false,
        error: 'User ID is required'
      }, 400);
    }
    
    console.log('Resend verification request for userId:', userId);
    
    const { getUserById, createEmailVerification } = await import('./database-neon');
    const { sendVerificationEmail } = await import('./email-service-resend');
    
    console.log('Modules imported successfully');
    
    // Get user details
    const user = await getUserById(userId);
    console.log('User lookup result:', { found: !!user, email: user?.email, verified: user?.email_verified });
    if (!user) {
      return c.json({
        success: false,
        error: 'User not found'
      }, 404);
    }
    
    if (user.email_verified) {
      return c.json({
        success: false,
        error: 'Email is already verified'
      }, 400);
    }
    
    // Get client info
    const ipAddress = c.req.header('cf-connecting-ip') ||
                      c.req.header('x-forwarded-for') ||
                      c.req.header('x-real-ip') || '127.0.0.1'; // Use localhost IP instead of 'unknown'
    const userAgent = c.req.header('user-agent') || 'unknown';
    
    console.log('Creating new verification code for user:', user.email);
    
    // Create new verification code
    const verification = await createEmailVerification(
      userId,
      user.email,
      'registration',
      ipAddress,
      userAgent
    );
    
    console.log('Verification created:', { id: verification.id, otp_code: verification.otp_code });
    
    // Send new verification email
    console.log('Attempting to send verification email...');
    console.log('Email details:', { 
      email: user.email, 
      name: user.name, 
      otpCode: verification.otp_code,
      hasEnv: !!c.env,
      envKeys: c.env ? Object.keys(c.env) : []
    });
    
    const emailResult = await sendVerificationEmail(user.email, user.name, verification.otp_code, c.env);
    console.log('Email send result:', emailResult);
    
    if (!emailResult.success) {
      return c.json({
        success: false,
        error: 'Failed to send verification email. Please try again later.'
      }, 500);
    }
    
    return c.json({
      success: true,
      message: 'New verification code sent! Please check your email.'
    });
    
  } catch (error) {
    console.error('Resend verification error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      userId: c.req.json?.userId || 'No userId in request'
    });
    return c.json({
      success: false,
      error: 'Failed to resend verification code. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

api.post('/auth/login', async (c) => {
  try {
    // Set global environment for database access
    setGlobalEnv(c.env);

    // Debug: Log the raw request body
    const rawBody = await c.req.text();
    console.log('Login request raw body:', rawBody);

    let bodyData;
    try {
      bodyData = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return c.json({
        success: false,
        error: 'Invalid JSON in request body'
      }, 400);
    }

    const { email, password } = bodyData;
    
    // Log login attempt
    logSecurityEvent(c, 'LOGIN_ATTEMPT', {
      email: email ? email.substring(0, 3) + '***' : 'not provided',
      timestamp: new Date().toISOString()
    });
    
    const user = await loginUser(email, password);
    
    // Set HTTP-only cookie
    if (user.token) {
      setAuthCookie(c, user.token);
    }

    // Log login activity
    await logActivity(
      user.id,
      'user_login',
      `User logged in: ${user.name}`,
      'user',
      user.id
    );
    
    // Log successful login
    logSecurityEvent(c, 'LOGIN_SUCCESS', {
      userId: user.id,
      email: email.substring(0, 3) + '***',
      role: user.role
    });

    // Don't send token in response body for security (except for testing)
    const { token, ...userResponse } = user;

    // For testing purposes, include token in response if requested
    const includeToken = c.req.header('X-Test-Mode') === 'true';

    return c.json({
      success: true,
      message: 'Login successful',
      user: userResponse,
      ...(includeToken && { token })
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Log failed login attempt
    logSecurityEvent(c, 'LOGIN_FAILED', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email: 'provided'
    });
    
    // Handle email not verified error
    if (error instanceof Error && (error as any).code === 'EMAIL_NOT_VERIFIED') {
      return c.json({
        success: false,
        error: error.message,
        requiresVerification: true,
        userId: (error as any).userId
      }, 403);
    }
    
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Login failed'
    }, 401);
  }
});

api.post('/auth/logout', async (c) => {
  clearAuthCookie(c);
  return c.json({
    success: true,
    message: 'Logout successful'
  });
});

// Test email configuration endpoint
api.post('/auth/test-email', async (c) => {
  try {
    // Set global environment for database access
    setGlobalEnv(c.env);
    
    const { testEmailConfig, sendVerificationEmail } = await import('./email-service-resend');
    
    // Test email configuration
    const configTest = await testEmailConfig(c.env);
    
    if (!configTest.success) {
      return c.json({
        success: false,
        error: configTest.error
      }, 500);
    }
    
    // Send test email
    const testEmail = await sendVerificationEmail(
      'hakunamatataministry@gmail.com', 
      'Test User', 
      '123456', 
      c.env
    );
    
    return c.json({
      success: testEmail.success,
      message: testEmail.success ? 'Test email sent successfully!' : 'Failed to send test email',
      error: testEmail.error,
      messageId: testEmail.messageId
    });
    
  } catch (error) {
    console.error('Email test error:', error);
    return c.json({
      success: false,
      error: 'Email test failed'
    }, 500);
  }
});

api.get('/auth/me', async (c) => {
  const user = await getLoggedInUser(c);
  
  if (!user) {
    return c.json({ error: 'Not authenticated' }, 401);
  }

  return c.json({
    success: true,
    user: user
  });
});

// Password Reset Routes
api.post('/auth/request-password-reset', async (c) => {
  try {
    // Set global environment for database access
    setGlobalEnv(c.env);
    
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ success: false, error: 'Email is required' }, 400);
    }
    
    // Import functions
    const { getUserByEmail, createEmailVerification } = await import('./database-neon');
    const { sendPasswordResetEmail } = await import('./email-service-resend');
    
    // Check if user exists
    const user = await getUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return c.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      });
    }
    
    // Skip if user is OAuth user (Google)
    if (user.auth_provider === 'google') {
      return c.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      });
    }
    
    // Create verification record (OTP generated inside the function)
    const verification = await createEmailVerification(
      user.id,
      user.email,
      'password_reset',
      c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || '127.0.0.1',
      c.req.header('User-Agent')
    );
    
    // Get the generated OTP code from the verification record
    const otpCode = verification.otp_code;
    
    // Send password reset email
    const emailResult = await sendPasswordResetEmail(user.email, user.name, otpCode, c.env);
    
    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return c.json({
        success: false,
        error: 'Failed to send password reset email'
      }, 500);
    }
    
    return c.json({
      success: true,
      message: 'Password reset code has been sent to your email address.',
      userId: user.id // Include user ID for the reset form
    });
    
  } catch (error) {
    console.error('Password reset request error:', error);
    return c.json({
      success: false,
      error: 'Password reset request failed'
    }, 500);
  }
});

api.post('/auth/reset-password', async (c) => {
  try {
    // Set global environment for database access
    setGlobalEnv(c.env);
    
    const { userId, otpCode, newPassword } = await c.req.json();
    
    if (!userId || !otpCode || !newPassword) {
      return c.json({ 
        success: false, 
        error: 'User ID, OTP code, and new password are required' 
      }, 400);
    }
    
    if (newPassword.length < 6) {
      return c.json({
        success: false,
        error: 'Password must be at least 6 characters long'
      }, 400);
    }
    
    // Import functions
    const { verifyEmailOTP, getUserById, updateUserPassword } = await import('./database-neon');
    const { hashPassword } = await import('./auth');
    
    // Verify the OTP code
    const result = await verifyEmailOTP(userId, otpCode, 'password_reset');
    
    if (!result.success) {
      return c.json({
        success: false,
        error: result.message
      }, 400);
    }
    
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update the user's password
    const user = await getUserById(userId);
    if (!user) {
      return c.json({
        success: false,
        error: 'User not found'
      }, 404);
    }
    
    await updateUserPassword(userId, hashedPassword);
    
    return c.json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.'
    });
    
  } catch (error) {
    console.error('Password reset error:', error);
    return c.json({
      success: false,
      error: 'Password reset failed'
    }, 500);
  }
});

// Change Password (for logged-in users)
api.post('/auth/change-password', async (c) => {
  try {
    const { currentPassword, newPassword } = await c.req.json();
    
    if (!currentPassword || !newPassword) {
      return c.json({ 
        success: false, 
        error: 'Current password and new password are required' 
      }, 400);
    }
    
    if (newPassword.length < 6) {
      return c.json({
        success: false,
        error: 'New password must be at least 6 characters long'
      }, 400);
    }
    
    // Get logged in user
    const user = await getLoggedInUser(c);
    if (!user) {
      return c.json({ error: 'Not authenticated' }, 401);
    }
    
    // Check if user is OAuth user (can't change password)
    if (user.auth_provider === 'google') {
      return c.json({
        success: false,
        error: 'Cannot change password for Google OAuth accounts. Manage your password through Google.'
      }, 400);
    }
    
    // Import functions
    const { getUserByEmail, updateUserPassword } = await import('./database-neon');
    const { verifyPassword, hashPassword } = await import('./auth');
    
    // Get user with password hash
    const userWithHash = await getUserByEmail(user.email);
    if (!userWithHash) {
      return c.json({
        success: false,
        error: 'User not found'
      }, 404);
    }
    
    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, userWithHash.password_hash);
    if (!isValidPassword) {
      return c.json({
        success: false,
        error: 'Current password is incorrect'
      }, 400);
    }
    
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update the password
    await updateUserPassword(user.id, hashedPassword);
    
    return c.json({
      success: true,
      message: 'Password changed successfully.'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    return c.json({
      success: false,
      error: 'Failed to change password'
    }, 500);
  }
});

// Articles Routes
api.get('/articles', async (c) => {
  try {
    // Ensure environment is set for database access
    setGlobalEnv(c.env);
    
    const articles = await getArticles(true); // Only published articles
    return c.json({
      success: true,
      articles: articles
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch articles'
    }, 500);
  }
});

api.get('/articles/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid article ID' }, 400);
    }

    const article = await getArticleById(id);
    if (!article) {
      return c.json({ success: false, error: 'Article not found' }, 404);
    }

    return c.json({
      success: true,
      article: article
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch article'
    }, 500);
  }
});

api.post('/articles', authMiddleware, requirePermission('CREATE_ARTICLE'), async (c) => {
  try {
    const user = (c as any).get('user') as User;
    const { title, content, excerpt } = await c.req.json();
    
    // Double-check permissions (belt and suspenders approach)
    if (!hasPermission(user.role, 'CREATE_ARTICLE')) {
      return c.json({
        success: false,
        error: 'Only admins and moderators can create articles',
        code: 'INSUFFICIENT_PERMISSIONS'
      }, 403);
    }
    
    if (!title || !content) {
      return c.json({
        success: false,
        error: 'Title and content are required'
      }, 400);
    }

    const article = await createArticle(title, content, excerpt || '', user.id);
    
    // Log article creation activity
    await logActivity(
      user.id,
      'article_created',
      `Article published: "${article.title}"`,
      'article',
      article.id
    );
    
    return c.json({
      success: true,
      message: 'Article created successfully',
      article: article
    });
  } catch (error) {
    console.error('Error creating article:', error);
    return c.json({
      success: false,
      error: 'Failed to create article'
    }, 500);
  }
});

api.put('/articles/:id', authMiddleware, async (c) => {
  try {
    const user = (c as any).get('user') as User;
    const id = parseInt(c.req.param('id'));
    const { title, content, excerpt, published } = await c.req.json();
    
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid article ID' }, 400);
    }

    // Check if article exists and user owns it (or is admin)
    const existingArticle = await getArticleById(id);
    if (!existingArticle) {
      return c.json({ success: false, error: 'Article not found' }, 404);
    }

    // Moderators can only edit their own articles, admins can edit any
    if (existingArticle.author_id !== user.id && user.role !== 'admin') {
      return c.json({ success: false, error: 'Permission denied' }, 403);
    }

    const updatedArticle = await updateArticle(id, title, content, excerpt || '', published || false);
    
    return c.json({
      success: true,
      message: 'Article updated successfully',
      article: updatedArticle
    });
  } catch (error) {
    console.error('Error updating article:', error);
    return c.json({
      success: false,
      error: 'Failed to update article'
    }, 500);
  }
});

// Resources Routes
api.get('/resources', async (c) => {
  try {
    // Ensure environment is set for database access
    setGlobalEnv(c.env);
    
    const resources = await getResources();
    return c.json({
      success: true,
      resources: resources
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch resources'
    }, 500);
  }
});

api.get('/resources/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid resource ID' }, 400);
    }

    const resource = await getResourceById(id);
    if (!resource) {
      return c.json({ success: false, error: 'Resource not found' }, 404);
    }

    return c.json({
      success: true,
      resource: resource
    });
  } catch (error) {
    console.error('Error fetching resource:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch resource'
    }, 500);
  }
});

api.post('/resources', authMiddleware, requirePermission('CREATE_RESOURCE'), async (c) => {
  try {
    const user = (c as any).get('user') as User;
    const { title, description, url, resource_type, published } = await c.req.json();
    
    // Double-check permissions
    if (!hasPermission(user.role, 'CREATE_RESOURCE')) {
      return c.json({
        success: false,
        error: 'Only admins and moderators can create resources',
        code: 'INSUFFICIENT_PERMISSIONS'
      }, 403);
    }
    
    if (!title) {
      return c.json({
        success: false,
        error: 'Title is required'
      }, 400);
    }

    const resource = await createResource(
      title, 
      description || '', 
      url || '', 
      resource_type || 'link', 
      user.id,
      undefined, // categoryId
      {
        published: published !== undefined ? published : true,
        isUploadedFile: false
      }
    );
    
    // Log resource creation activity
    await logActivity(
      user.id,
      'resource_created',
      `Resource added: "${resource.title}"`,
      'resource',
      resource.id
    );
    
    return c.json({
      success: true,
      message: 'Resource created successfully',
      resource: resource
    });
  } catch (error) {
    console.error('Error creating resource:', error);
    return c.json({
      success: false,
      error: 'Failed to create resource'
    }, 500);
  }
});

// Enhanced file upload endpoint for resources
api.post('/resources/upload', authMiddleware, requirePermission('CREATE_RESOURCE'), async (c) => {
  try {
    const user = (c as any).get('user') as User;

    // Double-check permissions
    if (!hasPermission(user.role, 'CREATE_RESOURCE')) {
      return c.json({
        success: false,
        error: 'Only admins and moderators can upload resources',
        code: 'INSUFFICIENT_PERMISSIONS'
      }, 403);
    }

    const body = await c.req.formData();

    const title = body.get('title') as string;
    const description = body.get('description') as string || '';
    const resourceType = body.get('resource_type') as string || 'book';
    const published = body.get('published') === 'true';
    const file = body.get('file') as File;

    if (!title) {
      return c.json({
        success: false,
        error: 'Title is required'
      }, 400);
    }

    if (!file) {
      return c.json({
        success: false,
        error: 'File is required'
      }, 400);
    }

    // Import file storage utilities
    const { uploadFileToR2, validateFile, generateFileMetadata } = await import('./file-storage');

    // Enhanced file validation with security checks
    const allowedTypes = ['application/pdf', 'audio/mpeg', 'audio/wav', 'audio/mp3', 'text/plain'];
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    const validation = validateFileUpload(file, allowedTypes, maxSize);
    if (!validation.valid) {
      logSecurityEvent(c, 'FILE_UPLOAD_VALIDATION_FAILED', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        errors: validation.errors,
        userId: user.id
      });
      
      return c.json({
        success: false,
        error: validation.errors.join(', ')
      }, 400);
    }
    
    // Log successful file validation
    logSecurityEvent(c, 'FILE_UPLOAD_VALIDATED', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      userId: user.id
    });

    // Upload file to R2
    let uploadResult;
    try {
      uploadResult = await uploadFileToR2(c.env, file, file.name, file.type);
    } catch (uploadError) {
      console.error('Error uploading to R2:', uploadError);
      return c.json({
        success: false,
        error: 'Failed to upload file to storage. Please try again.'
      }, 500);
    }

    // Handle content for different file types
    let extractedContent = '';
    let contentPreview = '';

    if (file.type === 'application/pdf') {
      // PDF document - simple text description only
      contentPreview = `PDF document "${file.name}" (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
      extractedContent = `PDF document uploaded successfully. Use the download button above to view the PDF.`;
    } else if (file.type.startsWith('audio/')) {
      contentPreview = `Audio file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    } else {
      contentPreview = `${description.substring(0, 200)}...`;
    }

    // Generate metadata
    const metadata = JSON.stringify(generateFileMetadata(file, extractedContent));

    // Create resource record
    const resource = await createResource(
      title,
      description,
      '', // No external URL for uploaded files
      resourceType,
      user.id,
      undefined, // categoryId
      {
        filePath: uploadResult.key,
        fileName: file.name,
        fileSize: uploadResult.size,
        extractedContent,
        contentPreview,
        downloadUrl: uploadResult.url,
        viewUrl: resourceType === 'book' ? `/resources/${title.toLowerCase().replace(/\s+/g, '-')}/view` : undefined,
        metadata,
        isUploadedFile: true,
        published
      }
    );

    return c.json({
      success: true,
      message: 'File uploaded successfully',
      resource: resource
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return c.json({
      success: false,
      error: 'Failed to upload file'
    }, 500);
  }
});

// Update resource endpoint
api.put('/resources/:id', authMiddleware, async (c) => {
  try {
    const user = (c as any).get('user') as User;
    const id = parseInt(c.req.param('id'));
    const { title, description, url, resource_type, published } = await c.req.json();
    
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid resource ID' }, 400);
    }

    // Check if resource exists and user owns it (or is admin)
    const existingResource = await getResourceById(id);
    if (!existingResource) {
      return c.json({ success: false, error: 'Resource not found' }, 404);
    }

    // Moderators can only edit their own resources, admins can edit any
    if (existingResource.author_id !== user.id && user.role !== 'admin') {
      return c.json({ success: false, error: 'Permission denied' }, 403);
    }

    const updatedResource = await updateResource(
      id,
      title,
      description || '',
      url || '',
      resource_type || 'link',
      undefined, // categoryId
      {
        published: published !== undefined ? published : true
      }
    );
    
    return c.json({
      success: true,
      message: 'Resource updated successfully',
      resource: updatedResource
    });
  } catch (error) {
    console.error('Error updating resource:', error);
    return c.json({
      success: false,
      error: 'Failed to update resource'
    }, 500);
  }
});

// Delete resource endpoint
api.delete('/resources/:id', authMiddleware, async (c) => {
  try {
    const user = (c as any).get('user') as User;
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid resource ID' }, 400);
    }

    // Check if resource exists and user owns it (or is admin)
    const existingResource = await getResourceById(id);
    if (!existingResource) {
      return c.json({ success: false, error: 'Resource not found' }, 404);
    }

    // Moderators can only delete their own resources, admins can delete any
    if (existingResource.author_id !== user.id && user.role !== 'admin') {
      return c.json({ success: false, error: 'Permission denied' }, 403);
    }

    const success = await deleteResource(id);
    
    if (success) {
      return c.json({
        success: true,
        message: 'Resource deleted successfully'
      });
    } else {
      return c.json({
        success: false,
        error: 'Failed to delete resource'
      }, 500);
    }
  } catch (error) {
    console.error('Error deleting resource:', error);
    return c.json({
      success: false,
      error: 'Failed to delete resource'
    }, 500);
  }
});

// Categories Routes (Public endpoint for frontend filtering)
api.get('/categories', async (c) => {
  try {
    // Ensure environment is set for database access
    setGlobalEnv(c.env);

    // Get database connection directly without full initialization
    const { getDB } = await import('./database-neon');
    const sql = getDB();

    // Direct query to bypass initialization overhead
    const categories = await sql`
      SELECT * FROM categories
      ORDER BY name ASC
    `;

    return c.json({
      success: true,
      categories: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch categories'
    }, 500);
  }
});

// Analytics API (Admin only)
api.get('/settings', async (c) => {
  try {
    setGlobalEnv(c.env);
    const settings = await getSiteSettings();
    return c.json({
      success: true,
      settings: settings
    });
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch settings'
    }, 500);
  }
});

api.get('/analytics', authMiddleware, requirePermission('MANAGE_USERS'), async (c) => {
  try {
    const { getAnalyticsData } = await import('./database-neon');
    const analyticsData = await getAnalyticsData();
    
    return c.json({
      success: true,
      ...analyticsData
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch analytics data'
    }, 500);
  }
});



// Like Routes - Available to all authenticated users
api.post('/articles/:id/like', authMiddleware, requirePermission('LIKE_CONTENT'), async (c) => {
  try {
    const user = (c as any).get('user') as User;
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid article ID' }, 400);
    }
    
    // Verify article exists
    const article = await getArticleById(id);
    if (!article) {
      return c.json({ success: false, error: 'Article not found' }, 404);
    }

    const result = await toggleLike(user.id, id, undefined);
    
    return c.json({
      success: true,
      liked: result.liked,
      likeCount: result.count,
      message: result.liked ? 'Article liked' : 'Article unliked'
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    return c.json({
      success: false,
      error: 'Failed to update like status'
    }, 500);
  }
});

api.post('/resources/:id/like', authMiddleware, requirePermission('LIKE_CONTENT'), async (c) => {
  try {
    const user = (c as any).get('user') as User;
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid resource ID' }, 400);
    }
    
    // Verify resource exists
    const resource = await getResourceById(id);
    if (!resource) {
      return c.json({ success: false, error: 'Resource not found' }, 404);
    }

    const result = await toggleLike(user.id, undefined, id);
    
    return c.json({
      success: true,
      liked: result.liked,
      likeCount: result.count,
      message: result.liked ? 'Resource liked' : 'Resource unliked'
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    return c.json({
      success: false,
      error: 'Failed to update like status'
    }, 500);
  }
});

// Get like status and count
api.get('/articles/:id/likes', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid article ID' }, 400);
    }

    const count = await getLikeCount(id, undefined);
    
    // If user is authenticated, also get their like status
    let userLiked = false;
    try {
      const user = await getLoggedInUser(c);
      if (user) {
        userLiked = await getUserLikeStatus(user.id, id, undefined);
      }
    } catch (error) {
      // User not authenticated, that's okay
    }
    
    return c.json({
      success: true,
      likeCount: count,
      userLiked: userLiked
    });
  } catch (error) {
    console.error('Error fetching like data:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch like data'
    }, 500);
  }
});

api.get('/resources/:id/likes', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid resource ID' }, 400);
    }

    const count = await getLikeCount(undefined, id);
    
    // If user is authenticated, also get their like status
    let userLiked = false;
    try {
      const user = await getLoggedInUser(c);
      if (user) {
        userLiked = await getUserLikeStatus(user.id, undefined, id);
      }
    } catch (error) {
      // User not authenticated, that's okay
    }
    
    return c.json({
      success: true,
      likeCount: count,
      userLiked: userLiked
    });
  } catch (error) {
    console.error('Error fetching like data:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch like data'
    }, 500);
  }
});



// File download endpoint - serves files from R2 through our API with CORS support
api.get('/files/*', async (c) => {
  try {
    // Get the full path after /files/
    const fullPath = c.req.url.split('/files/')[1];
    if (!fullPath) {
      return c.json({ success: false, error: 'File path is required' }, 400);
    }
    
    // Decode the path in case it's URL encoded
    const key = decodeURIComponent(fullPath);

    // Import R2 utilities
    const { getR2Client } = await import('./file-storage');

    // Get R2 client
    const client = getR2Client(c.env);
    if (!client) {
      return c.json({ success: false, error: 'R2 client not available' }, 500);
    }

    let response;
    
    // Check if using Wrangler R2 binding
    if (c.env?.FILES_BUCKET && typeof client.get === 'function') {
      // Using Wrangler R2 binding
      console.log('Getting file via Wrangler R2 binding:', key);
      const object = await c.env.FILES_BUCKET.get(key);
      if (!object) {
        return c.json({ success: false, error: 'File not found' }, 404);
      }
      response = {
        Body: object.body,
        ContentType: object.httpMetadata?.contentType || 'application/octet-stream',
        ContentLength: object.size,
        LastModified: new Date(object.uploaded)
      };
    } else {
      // Using manual S3 client
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const command = new GetObjectCommand({
        Bucket: c.env?.FILES_BUCKET_NAME || 'faith-defenders-files',
        Key: key
      });

      response = await client.send(command);
    }

    if (!response.Body) {
      return c.json({ success: false, error: 'File not found' }, 404);
    }

    // Set appropriate headers with CORS support
    const headers = new Headers();

    // CORS headers for file access
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Range, Content-Type');
    headers.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
    
    if (response.ContentType) {
      headers.set('Content-Type', response.ContentType);
    }
    if (response.ContentLength) {
      headers.set('Content-Length', response.ContentLength.toString());
    }
    if (response.LastModified) {
      headers.set('Last-Modified', response.LastModified.toISOString());
    }

    // Support range requests for PDFs
    headers.set('Accept-Ranges', 'bytes');

    // For PDFs, set inline disposition so they display in browser
    if (response.ContentType === 'application/pdf') {
      headers.set('Content-Disposition', 'inline');
    } else {
      headers.set('Content-Disposition', 'attachment');
    }

    // Return the file
    return new Response(response.Body, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error serving file:', error);
    return c.json({
      success: false,
      error: 'Failed to serve file'
    }, 500);
  }
});

// Handle OPTIONS requests for CORS preflight
api.options('/files/*', (c) => {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Range, Content-Type');
  headers.set('Access-Control-Max-Age', '86400');

  return new Response(null, {
    status: 204,
    headers
  });
});

// Bible Trivia Questions Database Endpoint - Simple fetch from database
api.get('/bible-trivia/questions', async (c) => {
  try {
    const { getRandomQuestionsByDifficulty } = await import('./database-neon');
    const difficulty = c.req.query('difficulty') || 'easy';
    const count = parseInt(c.req.query('count') || '10');

    if (count < 1 || count > 50) {
      return c.json({
        success: false,
        error: 'Count must be between 1 and 50'
      }, 400);
    }

    const allowedDifficulties = ['easy', 'medium', 'hard', 'expert'];
    if (!allowedDifficulties.includes(difficulty)) {
      return c.json({
        success: false,
        error: 'Invalid difficulty. Must be one of: easy, medium, hard, expert'
      }, 400);
    }

    const questions = await getRandomQuestionsByDifficulty(difficulty as any, count);

    return c.json({
      success: true,
      questions: questions,
      difficulty: difficulty,
      count: questions.length,
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching Bible trivia questions:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch questions'
    }, 500);
  }
});

// Security Alert endpoint for client-side security events
api.post('/security/alert', async (c) => {
  try {
    const alertData = await c.req.json();

    // Validate required fields
    if (!alertData.type || !alertData.timestamp) {
      return c.json({
        success: false,
        error: 'Invalid alert data: type and timestamp are required'
      }, 400);
    }

    // Get client info for security logging
    const ipAddress = c.req.header('cf-connecting-ip') ||
                      c.req.header('x-forwarded-for') ||
                      c.req.header('x-real-ip') || '127.0.0.1';
    const userAgent = c.req.header('user-agent') || 'unknown';

    // Import database logging function
    const { logSecurityEvent } = await import('./security-db');

    // Log to database for persistent storage
    await logSecurityEvent(
      alertData.type,
      alertData.severity || 'warning',
      alertData.message || `Security alert: ${alertData.type}`,
      {
        ipAddress,
        userAgent,
        url: alertData.url,
        method: c.req.method,
        requestData: alertData.details || {},
        headers: {
          'user-agent': userAgent,
          'referer': c.req.header('referer'),
          'origin': c.req.header('origin')
        }
      }
    );

    // Log to console for immediate visibility
    console.log('Security Alert Received and Logged:', {
      type: alertData.type,
      timestamp: new Date(alertData.timestamp).toISOString(),
      userAgent: alertData.userAgent,
      url: alertData.url,
      ipAddress,
      details: alertData.details || 'No additional details'
    });

    // For critical alerts, you might want to send notifications
    const criticalAlertTypes = [
      'account_locked',
      'suspicious_input_detected',
      'devtools_opened',
      'suspicious_dom_manipulation',
      'external_request_detected'
    ];

    if (criticalAlertTypes.includes(alertData.type)) {
      // Here you could integrate with external monitoring services
      // like Sentry, DataDog, or send email notifications
      console.warn('CRITICAL SECURITY ALERT:', alertData.type, alertData);
    }

    return c.json({
      success: true,
      message: 'Security alert logged successfully'
    });

  } catch (error) {
    console.error('Error processing security alert:', error);
    return c.json({
      success: false,
      error: 'Failed to process security alert'
    }, 500);
  }
});


export default api;
