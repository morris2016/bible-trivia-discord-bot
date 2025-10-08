import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';

export class TriviaGameManager {
    constructor(apiService, logger) {
        this.apiService = apiService;
        this.logger = logger;

        // Game storage
        this.activeGames = new Map(); // gameId -> game state
        this.playerGames = new Map(); // userId -> gameId
        this.gameTimers = new Map(); // gameId -> timer instance
        this.progressTimers = new Map(); // gameId -> progress poll timer

        // Difficulty configurations
        this.difficultyConfig = {
            easy: { time: 12, points: 1 },
            medium: { time: 16.5, points: 2 },
            hard: { time: 21, points: 3 },
            expert: { time: 25.5, points: 4 }
        };
    }

    /**
     * Start a new multiplayer game
     */
    async startMultiplayerGame(interaction, options) {
        const { difficulty, questions } = options;
        const creatorId = interaction.user.id;
        const creatorName = interaction.user.username;

        try {
            this.logger.game(`Creating multiplayer game for ${creatorName} (${creatorId})`);

            const createResult = await this.apiService.createGame({
                name: `${creatorName}'s Bible Trivia Game`,
                difficulty: difficulty,
                maxPlayers: 10,
                questionsPerGame: questions || 10,
                timePerQuestion: 15,
                playerName: creatorName
            });

            if (!createResult.success) {
                throw new Error(createResult.error || 'Failed to create game');
            }

            const gameId = createResult.game.id;
            this.logger.game(`Game created with ID: ${gameId}`);

            // Initialize game state
            const gameState = {
                id: gameId,
                creatorId: creatorId,
                creatorName: creatorName,
                difficulty: difficulty,
                totalQuestions: questions || 10,
                createdAt: new Date(),
                status: 'waiting',
                channelId: interaction.channelId,
                guildId: interaction.guildId,
                players: new Map(),
                gameData: createResult.game,
                participants: createResult.participants || []
            };

            this.activeGames.set(gameId, gameState);

            // Add creator as player
            gameState.players.set(creatorId, {
                userId: creatorId,
                username: creatorName,
                joinedAt: new Date(),
                score: 0,
                correctAnswers: 0,
                participantId: createResult.participant?.guest_id || 0
            });

            this.playerGames.set(creatorId, gameId);

            this.logger.game(`Player ${creatorName} joined game ${gameId}`);

            return {
                success: true,
                game: gameState,
                message: `🎮 **Bible Trivia Game Created!**\n\n` +
                        `**Game ID:** ${gameId}\n` +
                        `**Difficulty:** ${this.capitalizeFirst(difficulty)}\n` +
                        `**Questions:** ${questions || 10}\n\n` +
                        `Share this game with others using the share link, or wait for players to join!\n\n` +
                        `Players can use \`/trivia-join\` to join your game.`
            };

        } catch (error) {
            this.logger.error('Error creating multiplayer game:', error);
            return {
                success: false,
                message: `❌ Failed to create game: ${error.message}`
            };
        }
    }

    /**
     * Join an existing game
     */
    async joinGame(interaction, gameId) {
        const userId = interaction.user.id;
        const username = interaction.user.username;

        try {
            this.logger.game(`Player ${username} (${userId}) attempting to join game ${gameId}`);

            // Check if user is already in a game
            if (this.playerGames.has(userId)) {
                const currentGameId = this.playerGames.get(userId);
                if (currentGameId !== gameId) {
                    return {
                        success: false,
                        message: 'You are already in another game. Use `/trivia-quit` to leave your current game first.'
                    };
                }
            }

            // Get game state
            let gameState = this.activeGames.get(gameId);
            if (!gameState) {
                // Try to join via API first
                const joinResult = await this.apiService.joinGame(gameId, {
                    playerName: username
                });

                if (!joinResult.success) {
                    throw new Error(joinResult.error || 'Failed to join game');
                }

                // Create game state if it doesn't exist
                gameState = {
                    id: gameId,
                    channelId: interaction.channelId,
                    guildId: interaction.guildId,
                    players: new Map(),
                    gameData: joinResult.game,
                    participants: joinResult.participants || []
                };
                this.activeGames.set(gameId, gameState);
            }

            // Add player to game
            gameState.players.set(userId, {
                userId: userId,
                username: username,
                joinedAt: new Date(),
                score: 0,
                correctAnswers: 0,
                participantId: gameState.participants.find(p => p.player_name === username)?.guest_id
            });

            this.playerGames.set(userId, gameId);
            this.logger.game(`Player ${username} successfully joined game ${gameId}`);

            return {
                success: true,
                message: `✅ **Joined Game!**\n\n` +
                        `Welcome to the Bible trivia game, ${username}!\n` +
                        `The game will start when the creator begins it.`
            };

        } catch (error) {
            this.logger.error('Error joining game:', error);
            return {
                success: false,
                message: `❌ Failed to join game: ${error.message}`
            };
        }
    }

    /**
     * Start a solo game
     */
    async startSoloGame(interaction, options) {
        const { difficulty, questions } = options;
        const userId = interaction.user.id;
        const username = interaction.user.username;

        try {
            this.logger.game(`Starting solo game for ${username} (${userId})`);

            // Check if user is already in a game
            if (this.playerGames.has(userId)) {
                return {
                    success: false,
                    message: 'You are already in a game. Use `/trivia-quit` to leave first.'
                };
            }

            const createResult = await this.apiService.createGame({
                name: `${username}'s Solo Bible Trivia`,
                difficulty: difficulty,
                maxPlayers: 1,
                questionsPerGame: questions || 10,
                timePerQuestion: this.difficultyConfig[difficulty].time,
                playerName: username,
                isSolo: true
            });

            if (!createResult.success) {
                throw new Error(createResult.error || 'Failed to create solo game');
            }

            const gameId = createResult.game.id;

            const gameState = {
                id: gameId,
                creatorId: userId,
                creatorName: username,
                difficulty: difficulty,
                totalQuestions: questions || 10,
                createdAt: new Date(),
                status: 'starting',
                channelId: interaction.channelId,
                guildId: interaction.guildId,
                players: new Map(),
                gameData: createResult.game,
                isSolo: true,
                interaction: interaction, // Store interaction for ephemeral messages
                participants: createResult.participants || [],
                questionReviews: [] // Store answers for each question for review
            };

            // Add player
            gameState.players.set(userId, {
                userId: userId,
                username: username,
                joinedAt: new Date(),
                score: 0,
                correctAnswers: 0,
                participantId: createResult.participant?.guest_id || 0
            });

            this.activeGames.set(gameId, gameState);
            this.playerGames.set(userId, gameId);

            // Start progress simulation
            await this.startGameProgress(gameState, interaction);

            return {
                success: true,
                game: gameState
            };

        } catch (error) {
            this.logger.error('Error starting solo game:', error);
            return {
                success: false,
                message: `❌ Failed to start solo game: ${error.message}`
            };
        }
    }

    /**
     * Start game progress monitoring
     */
    async startGameProgress(gameState, interaction) {
        const gameId = gameState.id;

        // Start progress polling
        const progressInterval = setInterval(async () => {
            try {
                this.logger.debug(`Polling progress for game ${gameId}`);
                const progressResult = await this.apiService.getGameProgress(gameId);

                this.logger.debug(`Progress result for game ${gameId}:`, progressResult);

                if (progressResult.success && progressResult.progress?.isReady) {
                    this.logger.game(`Questions ready for game ${gameId}, starting gameplay`);
                    clearInterval(progressInterval);
                    this.progressTimers.delete(gameId);

                    // Start actual gameplay
                    await this.startGameplay(gameState, interaction);
                } else if (progressResult.success && progressResult.progress) {
                    this.logger.debug(`Questions not ready yet for game ${gameId}. Status: ${JSON.stringify(progressResult.progress)}`);
                }
            } catch (error) {
                this.logger.error(`Progress polling error for game ${gameId}:`, error);
                this.logger.debug(`Full error details:`, error.response?.data || error.message);
            }
        }, 3000);

        this.progressTimers.set(gameId, progressInterval);

        // Send initial message (ephemeral for solo games)
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🎯 Bible Trivia Game Starting!')
            .setDescription('🔄 Generating personalized Bible questions...\n⏳ Please wait while our AI creates unique questions for you!');

        // Get game state to check if solo
        const soloGameId = this.playerGames.get(interaction.user.id);
        const isSoloGame = soloGameId ? this.activeGames.get(soloGameId)?.isSolo : false;

        await interaction.followUp({ embeds: [embed], flags: isSoloGame ? MessageFlags.Ephemeral : undefined });

        // Add timeout to prevent infinite waiting
        setTimeout(() => {
            if (this.progressTimers.has(gameId)) {
                this.logger.warn(`Game ${gameId} timed out waiting for questions`);
                clearInterval(progressInterval);
                this.progressTimers.delete(gameId);

                // Try to start gameplay anyway or show error
                this.handleGameTimeout(gameState, interaction);
            }
        }, 60000); // 60 second timeout
    }

    /**
     * Handle game timeout when questions don't generate
     */
    async handleGameTimeout(gameState, interaction) {
        try {
            const embed = new EmbedBuilder()
                .setColor(0xFFAA00)
                .setTitle('⏰ Generation Timeout')
                .setDescription('Question generation is taking longer than expected. Attempting to start with available questions...');

            const isSoloGame = gameState.isSolo || false;
            await interaction.followUp({ embeds: [embed], flags: isSoloGame ? MessageFlags.Ephemeral : undefined });

            // Try to start gameplay anyway
            await this.startGameplay(gameState, interaction);
        } catch (error) {
            this.logger.error('Error handling game timeout:', error);

            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Generation Failed')
                .setDescription('Failed to generate questions. Please try again.');

            try {
                const isSoloGame = gameState.isSolo || false;
                await interaction.followUp({ embeds: [embed], flags: isSoloGame ? MessageFlags.Ephemeral : undefined });
            } catch (followUpError) {
                this.logger.error('Failed to send timeout error message:', followUpError);
            }
        }
    }

    /**
     * Start the actual gameplay
     */
    async startGameplay(gameState, interaction) {
        try {
            this.logger.game(`Starting gameplay for game ${gameState.id}`);

            // Use local question generation for speed (like bible-trivia1)
            const localQuestions = this.apiService.generateQuestionsLocally(
                gameState.difficulty,
                gameState.totalQuestions,
                gameState.guildId
            );

            this.logger.game(`Generated ${localQuestions.length} local questions for game ${gameState.id}`);

            // Update game state with local questions
            gameState.questions = localQuestions;
            gameState.currentQuestionIndex = 0;
            gameState.status = 'active';

            // Check if we have questions
            if (gameState.questions.length === 0) {
                this.logger.warn(`No questions generated for game ${gameState.id}, ending game`);

                const embed = new EmbedBuilder()
                    .setColor(0xFFAA00)
                    .setTitle('📖 No Questions Available')
                    .setDescription('Sorry, no Bible questions are currently available for this game. Please try again later or contact an administrator.');

                try {
                    const isSoloGame = gameState.isSolo || false;
                    await interaction.followUp({ embeds: [embed], flags: isSoloGame ? MessageFlags.Ephemeral : undefined });
                } catch (followUpError) {
                    this.logger.error('Failed to send no questions message:', followUpError);
                }

                // End the game immediately
                await this.endGame(gameState);
                return;
            }

            // Show countdown
            await this.showCountdown(gameState.channelId, interaction);

            // Start first question
            await this.displayQuestion(gameState);

        } catch (error) {
            this.logger.error('Error starting gameplay:', error);

            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Game Start Failed')
                .setDescription('Failed to start the trivia game. Please try again.');

            try {
                const isSoloGame = gameState.isSolo || false;
                await interaction.followUp({ embeds: [embed], flags: isSoloGame ? MessageFlags.Ephemeral : undefined });
            } catch (followUpError) {
                this.logger.error('Failed to send follow-up:', followUpError);
            }
        }
    }

    /**
     * Display question to the channel
     */
    async displayQuestion(gameState) {
        if (gameState.currentQuestionIndex >= gameState.questions.length) {
            await this.endGame(gameState);
            return;
        }

        const question = gameState.questions[gameState.currentQuestionIndex];
        const timeLimit = question.time_left || this.difficultyConfig[gameState.difficulty].time;

        this.logger.game(`Displaying question ${gameState.currentQuestionIndex + 1}/${gameState.questions.length} for game ${gameState.id}`);

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`📖 Bible Trivia - Question ${gameState.currentQuestionIndex + 1}`)
            .setDescription(`**${question.question_text}**`)
            .addFields(
                {
                    name: 'A',
                    value: question.options[0] || 'Option A',
                    inline: false
                },
                {
                    name: 'B',
                    value: question.options[1] || 'Option B',
                    inline: false
                },
                {
                    name: 'C',
                    value: question.options[2] || 'Option C',
                    inline: false
                },
                {
                    name: 'D',
                    value: question.options[3] || 'Option D',
                    inline: false
                }
            )
            .setFooter({
                text: `⏰ ${timeLimit} seconds | Difficulty: ${this.capitalizeFirst(gameState.difficulty)}`
            })
            .setTimestamp();

        if (question.bible_reference) {
            embed.addFields({
                name: '📚 Reference',
                value: question.bible_reference,
                inline: true
            });
        }

        // Create reaction buttons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`answer_${gameState.id}_A`)
                    .setLabel('A')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`answer_${gameState.id}_B`)
                    .setLabel('B')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`answer_${gameState.id}_C`)
                    .setLabel('C')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`answer_${gameState.id}_D`)
                    .setLabel('D')
                    .setStyle(ButtonStyle.Primary)
            );

        // For solo games, send ephemerally to the solo player
        if (gameState.isSolo) {
            await gameState.interaction.followUp({
                embeds: [embed],
                components: [row],
                ephemeral: true
            });
        } else {
            // For multiplayer, send to channel
            const channel = await this.client.channels.fetch(gameState.channelId);
            const message = await channel.send({
                embeds: [embed],
                components: [row]
            });

            // Store message for cleanup
            gameState.currentMessage = message;
        }

        // Start timer
        this.startQuestionTimer(gameState, Math.floor(timeLimit));
    }

    /**
     * Handle reaction-based answer selection
     */
    async handleInteraction(interaction, gameId, selectedAnswer) {
        const userId = interaction.user.id;
        const gameState = this.activeGames.get(gameId);

        if (!gameState) {
            return;
        }

        const player = gameState.players.get(userId);
        if (!player) {
            await interaction.reply({
                content: 'You are not part of this game!',
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        // Update player's answer
        player.selectedAnswer = selectedAnswer;
        player.answeredAt = new Date();

        await interaction.reply({
            content: `✅ Answer ${selectedAnswer} recorded!`,
            flags: MessageFlags.Ephemeral
        });
    }

    /**
     * Start question timer
     */
    startQuestionTimer(gameState, timeLimit) {
        const gameId = gameState.id;

        // Clear existing timer
        if (this.gameTimers.has(gameId)) {
            clearTimeout(this.gameTimers.get(gameId));
        }

        const timer = setTimeout(async () => {
            await this.evaluateAnswers(gameState);
        }, timeLimit * 1000);

        this.gameTimers.set(gameId, timer);
    }

    /**
     * Evaluate answers when time runs out
     */
    async evaluateAnswers(gameState) {
        // Clear timer
        if (this.gameTimers.has(gameState.id)) {
            clearTimeout(this.gameTimers.get(gameState.id));
            this.gameTimers.delete(gameState.id);
        }

        const question = gameState.questions[gameState.currentQuestionIndex];
        const correctAnswerLetter = String.fromCharCode(65 + question.correct_answer_index);
        const questionIndex = gameState.currentQuestionIndex;

        this.logger.debug(`Evaluating answers for game ${gameState.id}, question ${questionIndex + 1}`);
        this.logger.debug(`Correct answer should be: ${correctAnswerLetter} (${question.correct_answer})`);
        this.logger.debug(`Correct answer index: ${question.correct_answer_index}`);

        // Initialize questionReviews for this question if needed
        if (!gameState.questionReviews) {
            gameState.questionReviews = [];
        }
        if (!gameState.questionReviews[questionIndex]) {
            gameState.questionReviews[questionIndex] = {};
        }

        // Prepare results
        const results = [];
        let correctCount = 0;

        for (const [userId, player] of gameState.players) {
            this.logger.debug(`Player ${player.username}: selectedAnswer="${player.selectedAnswer}"`);

            let isCorrect = false;
            let points = 0;

            if (player.selectedAnswer === correctAnswerLetter) {
                isCorrect = true;
                correctCount++;
                points = question.points || this.difficultyConfig[gameState.difficulty].points;
                this.logger.debug(`Player ${player.username} got it RIGHT! +${points} points`);
            } else {
                this.logger.debug(`Player ${player.username} got it WRONG. Expected: ${correctAnswerLetter}, Got: ${player.selectedAnswer}`);
            }

            // Store answer for question review (before clearing it)
            gameState.questionReviews[questionIndex][userId] = {
                username: player.username,
                answer: player.selectedAnswer || 'No Answer',
                isCorrect: isCorrect
            };

            player.score += points;
            if (isCorrect) player.correctAnswers++;

            results.push({
                player: player.username,
                answer: player.selectedAnswer || 'No Answer',
                correct: isCorrect,
                points: points,
                totalScore: player.score
            });

            // Clear player's answer AFTER evaluation
            player.selectedAnswer = null;
            player.answeredAt = null;
        }

        // Send results
        const resultEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('⏰ Time\'s Up!')
            .setDescription(`**Correct Answer: ${correctAnswerLetter}** - ${question.correct_answer}`)
            .addFields(
                { name: 'Question', value: question.question_text, inline: false },
                { name: 'Results', value: results.map(r =>
                    `${r.player}: ${r.answer} ${r.correct ? '✅' : '❌'} (+${r.points} pts, Total: ${r.totalScore})`
                ).join('\n'), inline: false }
            );

        // For solo games, send ephemerally to the solo player
        if (gameState.isSolo) {
            await gameState.interaction.followUp({
                embeds: [resultEmbed],
                flags: MessageFlags.Ephemeral
            });
        } else {
            // Send results to channel for multiplayer games
            const channel = await this.client.channels.fetch(gameState.channelId);
            await channel.send({ embeds: [resultEmbed] });
        }

        // Move to next question after delay
        setTimeout(async () => {
            gameState.currentQuestionIndex++;
            await this.displayQuestion(gameState);
        }, 5000);
    }

    /**
     * End the game
     */
    async endGame(gameState) {
        this.logger.game(`Ending game ${gameState.id}`);

        gameState.status = 'finished';

        // Clear timers
        if (this.gameTimers.has(gameState.id)) {
            clearTimeout(this.gameTimers.get(gameState.id));
            this.gameTimers.delete(gameState.id);
        }

        // Mark game as completed in the database
        try {
            await this.apiService.post(`/${gameState.id}/force-complete`, {
                guestId: gameState.creatorId === Object.keys(gameState.players)[0] ? 0 : 1
            });
            this.logger.game(`Marked game ${gameState.id} as completed in database`);
        } catch (error) {
            this.logger.warn(`Failed to mark game ${gameState.id} as completed:`, error.message);
        }

        // Calculate final standings
        const playersArray = Array.from(gameState.players.values())
            .sort((a, b) => b.score - a.score);

        // Send final results
        const resultEmbed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🏆 Game Over!')
            .setDescription('**Final Results:**')
            .addFields(
                {
                    name: 'Leaderboard',
                    value: playersArray.map((p, i) =>
                        `${i + 1}. **${p.username}** - ${p.score} pts (${p.correctAnswers}/${gameState.totalQuestions} correct)`
                    ).join('\n'),
                    inline: false
                }
            )
            .setTimestamp();

        // Determine winner
        if (playersArray.length > 0) {
            const winner = playersArray[0];
            resultEmbed.setDescription(`👑 **${winner.username}** wins with ${winner.score} points!\n\n**Final Results:**`);
        }

        // For solo games, send ephemerally to the solo player
        if (gameState.isSolo) {
            await gameState.interaction.followUp({
                embeds: [resultEmbed],
                flags: MessageFlags.Ephemeral
            });

            // Send question review after a short delay
            setTimeout(async () => {
                await this.sendQuestionReview(gameState);
            }, 2000);
        } else {
            // Send to channel for multiplayer games
            const channel = await this.client.channels.fetch(gameState.channelId);
            const playerMentions = Array.from(gameState.players.keys()).map(id => `<@${id}>`).join(' ');
            await channel.send({
                embeds: [resultEmbed],
                content: `${playerMentions} - Game complete! 🎉`
            });

            // Send question review after a short delay
            setTimeout(async () => {
                await this.sendQuestionReview(gameState, channel, playerMentions);
            }, 2000);
        }

        // Clean up
        this.cleanupGame(gameState.id);
    }

    /**
     * Quit a game
     */
    async quitGame(userId) {
        try {
            const gameId = this.playerGames.get(userId);

            if (!gameId) {
                return {
                    success: false,
                    message: 'You are not currently in any game.'
                };
            }

            const gameState = this.activeGames.get(gameId);
            if (!gameState) {
                this.playerGames.delete(userId);
                return {
                    success: true,
                    message: 'You have left the game.'
                };
            }

            // Remove player from game
            gameState.players.delete(userId);
            this.playerGames.delete(userId);

            // If player was the creator and no other players, end the game
            if (gameState.creatorId === userId && gameState.players.size === 0) {
                this.cleanupGame(gameId);
                return {
                    success: true,
                    message: 'You have left the game and it has been ended since you were the only player.'
                };
            }

            // If other players remain, just remove this player
            return {
                success: true,
                message: 'You have successfully left the game.'
            };

        } catch (error) {
            this.logger.error('Error quitting game:', error);
            return {
                success: false,
                message: 'Failed to quit the game.'
            };
        }
    }

    /**
     * Get player status
     */
    async getPlayerStatus(userId) {
        try {
            const gameId = this.playerGames.get(userId);

            if (!gameId) {
                return {
                    inGame: false,
                    message: 'You are not currently in any game.'
                };
            }

            const gameState = this.activeGames.get(gameId);
            if (!gameState) {
                this.playerGames.delete(userId);
                return {
                    inGame: false,
                    message: 'Your game was not found. You have been removed from the game.'
                };
            }

            const player = gameState.players.get(userId);
            if (!player) {
                this.playerGames.delete(userId);
                return {
                    inGame: false,
                    message: 'You were not found in the game. You have been removed.'
                };
            }

            return {
                inGame: true,
                gameId: gameId,
                gameStatus: gameState.status,
                playerScore: player.score,
                currentQuestion: gameState.currentQuestionIndex ? gameState.currentQuestionIndex + 1 : 1,
                totalQuestions: gameState.totalQuestions,
                difficulty: gameState.difficulty,
                isSolo: gameState.isSolo || false
            };

        } catch (error) {
            this.logger.error('Error getting player status:', error);
            return {
                inGame: false,
                message: 'Error retrieving game status.'
            };
        }
    }

    /**
     * Clean up game resources
     */
    cleanupGame(gameId) {
        const gameState = this.activeGames.get(gameId);
        if (gameState) {
            // Clear timers
            if (this.gameTimers.has(gameId)) {
                clearTimeout(this.gameTimers.get(gameId));
                this.gameTimers.delete(gameId);
            }

            if (this.progressTimers.has(gameId)) {
                clearInterval(this.progressTimers.get(gameId));
                this.progressTimers.delete(gameId);
            }

            // Clear current message
            if (gameState.currentMessage) {
                try {
                    gameState.currentMessage.delete();
                } catch (error) {
                    this.logger.warn('Failed to delete game message:', error.message);
                }
            }

            // Remove players
            for (const [userId] of gameState.players) {
                this.playerGames.delete(userId);
            }

            // Remove game
            this.activeGames.delete(gameId);
        }

        this.logger.game(`Cleaned up game ${gameId}`);
    }

    // Helper methods

    capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    async showCountdown(channelId, interaction) {
        if (!this.client) {
            this.logger.error('Discord client not available for countdown');
            return;
        }

        // Get game state from interaction to check if solo
        const gameId = this.playerGames.get(interaction.user.id);
        const gameState = gameId ? this.activeGames.get(gameId) : null;

        // Skip countdown for solo games (send ephemerally instead)
        if (gameState && gameState.isSolo) {
            const countdownEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('🚀 Get Ready!')
                .setDescription('**GO! Questions starting now...** 🎯');

            await gameState.interaction.followUp({
                embeds: [countdownEmbed],
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const channel = await this.client.channels.fetch(channelId);

        const countdownEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🚀 Get Ready!')
            .setDescription('Starting in...');

        let countdown = 3;
        const message = await channel.send({
            embeds: [countdownEmbed.setDescription(`Starting in...\n\n**${countdown}**`)]
        });

        const countdownInterval = setInterval(async () => {
            countdown--;
            if (countdown > 0) {
                await message.edit({
                    embeds: [countdownEmbed.setDescription(`Starting in...\n\n**${countdown}**`)]
                });
            } else {
                clearInterval(countdownInterval);
                await message.edit({
                    embeds: [countdownEmbed.setDescription('🎯 **GO!**')]
                });

                setTimeout(() => {
                    try {
                        message.delete();
                    } catch (error) {
                        this.logger.warn('Failed to delete countdown message:', error.message);
                    }
                }, 3000);
            }
        }, 1000);
    }

    /**
     * Send question review after game completion
     */
    async sendQuestionReview(gameState, channel, playerMentions) {
        try {
            this.logger.game(`Sending question review for game ${gameState.id}`);

            // Create review embed
            const reviewEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('📝 Question Review & Answers')
                .setDescription('See where you went right and where you can improve!')
                .setTimestamp();

            // Create review content
            let reviewContent = '';
            for (let i = 0; i < gameState.questions.length; i++) {
                const question = gameState.questions[i];
                const questionNumber = i + 1;
                const correctAnswerLetter = String.fromCharCode(65 + question.correct_answer_index);

                // Get player answers for this question from stored review data
                const playerAnswers = [];
                const questionReview = gameState.questionReviews && gameState.questionReviews[i];

                if (questionReview) {
                    // Use stored answers from question review
                    for (const [userId, reviewData] of Object.entries(questionReview)) {
                        const isCorrect = reviewData.isCorrect;
                        playerAnswers.push(`${reviewData.username}: ${reviewData.answer} ${isCorrect ? '✅' : '❌'}`);
                    }
                } else {
                    // Fallback: if no review data, show current player data (will be cleared)
                    for (const [userId, player] of gameState.players) {
                        const playerAnswer = player.selectedAnswer || 'No Answer';
                        const isCorrect = playerAnswer === correctAnswerLetter;
                        playerAnswers.push(`${player.username}: ${playerAnswer} ${isCorrect ? '✅' : '❌'}`);
                    }
                }

                reviewContent += `**Q${questionNumber}:** ${question.question_text}\n`;
                reviewContent += `**Correct:** ${correctAnswerLetter} - ${question.correct_answer}\n`;
                reviewContent += `**Answers:** ${playerAnswers.join(', ')}\n\n`;
            }

            // Split content if too long (Discord embed limit)
            const chunks = this.splitMessage(reviewContent, 1000);

            for (let i = 0; i < chunks.length; i++) {
                const embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle(i === 0 ? '📝 Question Review & Answers' : '📝 Question Review (Continued)')
                    .setDescription(chunks[i])
                    .setTimestamp();

                // For solo games, send ephemerally to the solo player
                if (gameState.isSolo) {
                    await gameState.interaction.followUp({
                        embeds: [embed],
                        flags: MessageFlags.Ephemeral
                    });
                } else {
                    // For multiplayer games, send to channel
                    await channel.send({
                        embeds: [embed],
                        content: i === 0 ? `${playerMentions} - Here's your detailed question review! 📚` : null
                    });
                }
            }

            this.logger.game(`Question review sent for game ${gameState.id}`);

        } catch (error) {
            this.logger.error('Error sending question review:', error);
        }
    }

    /**
     * Split long message into chunks for Discord
     */
    splitMessage(message, chunkSize) {
        const chunks = [];
        let currentChunk = '';

        const lines = message.split('\n');

        for (const line of lines) {
            if ((currentChunk + line).length > chunkSize && currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = line + '\n';
            } else {
                currentChunk += line + '\n';
            }
        }

        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }

    get client() {
        return this._client;
    }

    set client(client) {
        this._client = client;
    }
}
