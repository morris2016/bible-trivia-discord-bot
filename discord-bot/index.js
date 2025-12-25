import { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } from 'discord.js';
import { TriviaGameManager } from './services/TriviaGameManager.js';
import { APIService } from './services/API.js';
import { CommandHandler } from './commands/CommandHandler.js';
import { Logger } from './utils/Logger.js';
import express from 'express';
import axios from 'axios';

// Initialize logger
const logger = new Logger();

// Start health check server
const app = express();
const HEALTH_PORT = process.env.PORT || 8000;

app.get('/health', (req, res) => {
    res.status(200).send('Bot is running!');
});

app.listen(HEALTH_PORT, () => {
    logger.log(`🚀 Health check server running on port ${HEALTH_PORT}`);
});

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ],
});

// Initialize services
const apiService = new APIService({
    baseURL: process.env.API_GAME_URL || 'https://gospelways.pages.dev/api/bible-games',
});

const gameManager = new TriviaGameManager(apiService, logger);
gameManager.client = client; // Set the Discord client reference
const commandHandler = new CommandHandler(client, gameManager, apiService, logger);

// Register commands
const commands = [
    {
        name: 'trivia-start',
        description: 'Start a new Bible trivia game',
        options: [
            {
                name: 'difficulty',
                description: 'Difficulty level (easy, medium, hard, expert)',
                type: 3, // STRING
                required: true,
                choices: [
                    { name: 'Easy - Basic Bible Stories', value: 'easy' },
                    { name: 'Medium - Bible Books & Context', value: 'medium' },
                    { name: 'Hard - Deep Scripture Knowledge', value: 'hard' },
                    { name: 'Expert - Biblical Languages & Exegesis', value: 'expert' },
                ],
            },
            {
                name: 'questions',
                description: 'Number of questions',
                type: 3, // STRING
                required: true,
                choices: [
                    { name: '5 Questions', value: '5' },
                    { name: '10 Questions', value: '10' },
                    { name: '15 Questions', value: '15' },
                    { name: '20 Questions', value: '20' },
                ],
            },
        ],
    },
    {
        name: 'trivia-join',
        description: 'Join a waiting trivia game',
        options: [
            {
                name: 'game_id',
                description: 'Specific game ID to join (optional)',
                type: 3, // STRING
                required: false,
            },
        ],
    },
    {
        name: 'trivia-quit',
        description: 'Quit the current trivia game',
    },
    {
        name: 'trivia-status',
        description: 'Check your current game status',
    },
    {
        name: 'trivia-leaderboard',
        description: 'View global trivia leaderboard',
        options: [
            {
                name: 'difficulty',
                description: 'Difficulty to view leaderboard for',
                type: 3, // STRING
                required: false,
                choices: [
                    { name: 'Easy', value: 'easy' },
                    { name: 'Medium', value: 'medium' },
                    { name: 'Hard', value: 'hard' },
                    { name: 'Expert', value: 'expert' },
                ],
            },
            {
                name: 'limit',
                description: 'Number of players to show (1-10)',
                type: 4, // INTEGER
                required: false,
                min_value: 1,
                max_value: 10,
            },
        ],
    },
    {
        name: 'trivia-solo',
        description: 'Start a solo Bible trivia game',
        options: [
            {
                name: 'difficulty',
                description: 'Difficulty level (easy, medium, hard, expert)',
                type: 3, // STRING
                required: true,
                choices: [
                    { name: 'Easy - Basic Bible Stories', value: 'easy' },
                    { name: 'Medium - Bible Books & Context', value: 'medium' },
                    { name: 'Hard - Deep Scripture Knowledge', value: 'hard' },
                    { name: 'Expert - Biblical Languages & Exegesis', value: 'expert' },
                ],
            },
            {
                name: 'questions',
                description: 'Number of questions',
                type: 3, // STRING
                required: true,
                choices: [
                    { name: '5 Questions', value: '5' },
                    { name: '10 Questions', value: '10' },
                    { name: '15 Questions', value: '15' },
                    { name: '20 Questions', value: '20' },
                ],
            },
        ],
    },
    {
        name: 'help',
        description: 'Show Bible Trivia Bot help information',
    },
];

// Deploy commands
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// Register slash commands
async function registerCommands() {
    try {
        logger.log('🔄 Started refreshing application (/) commands.');

        const data = await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
            { body: commands },
        );

        logger.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error('❌ Failed to register commands:', error);
    }
}

// Keep-alive mechanism for Railway
function startKeepAlive() {
    const keepAliveInterval = 4 * 60 * 1000; // 4 minutes (more frequent for Railway)
    const internalHealthUrl = `http://localhost:${HEALTH_PORT}/health`;

    // Use Railway's public URL for external keep-alive requests
    const railwayUrl = process.env.RAILWAY_STATIC_URL ||
                      process.env.RAILWAY_PUBLIC_DOMAIN ||
                      process.env.RAILWAY_PUBLIC_URL; // Add this as manual env var
    const externalHealthUrl = railwayUrl ? `${railwayUrl}/health` : null;

    logger.log('🔄 Starting Railway keep-alive mechanism (4-minute intervals)');
    logger.log(`🔗 External URL: ${externalHealthUrl || 'Not available'}`);

    setInterval(async () => {
        try {
            // Internal health check (for logging)
            const internalResponse = await axios.get(internalHealthUrl, { timeout: 5000 });
            logger.debug(`💓 Keep-alive: Internal health - ${internalResponse.status}`);

            // External keep-alive request (if Railway URL is available)
            if (externalHealthUrl) {
                const externalResponse = await axios.get(externalHealthUrl, { timeout: 10000 });
                logger.debug(`🌐 Keep-alive: External ping - ${externalResponse.status}`);
            }

            // Check API service health
            const apiHealth = await apiService.healthCheck();
            logger.debug(`💓 Keep-alive: API health - ${apiHealth ? 'OK' : 'FAIL'}`);

            // Check Discord connection
            const discordPing = client.ws.ping;
            logger.debug(`💓 Keep-alive: Discord ping - ${discordPing}ms`);

            // Log memory usage
            const memUsage = process.memoryUsage();
            logger.debug(`💓 Keep-alive: Memory - ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB used`);

        } catch (error) {
            logger.warn('💓 Keep-alive: Error during health check:', error.message);
        }
    }, keepAliveInterval);
}

// Event handlers
client.once('ready', () => {
    logger.log(`✅ Bible Trivia Bot is online as ${client.user.tag}!`);
    logger.log(`🎮 Serving ${client.guilds.cache.size} servers`);

    // Set bot status
    client.user.setActivity('📖 Bible Trivia', { type: 'PLAYING' });

    // Register commands
    registerCommands();

    // Start keep-alive mechanism
    startKeepAlive();
});

client.on('interactionCreate', async (interaction) => {
    try {
        // Handle different interaction types
        if (interaction.isChatInputCommand()) {
            await commandHandler.handleCommand(interaction);
        } else if (interaction.isButton()) {
            // Handle button interactions for game answering
            if (interaction.customId.startsWith('answer_')) {
                const parts = interaction.customId.split('_');
                const gameId = parts[1]; // Keep as string for solo games
                const answer = parts[2]; // A, B, C, or D

                await gameManager.handleInteraction(interaction, gameId, answer);
            } else if (interaction.customId.startsWith('join_game_')) {
                // Handle join game button from TriviaJoinCommand
                await interaction.deferUpdate();
                const gameId = interaction.customId.split('_')[2]; // Keep as string for local games
                await commandHandler.commands['trivia-join'].joinSpecificGame(interaction, gameId);
            } else if (interaction.customId === 'join_quick') {
                // Handle quick join
                await interaction.deferUpdate();
                const gamesResult = await apiService.getWaitingGames();
                if (gamesResult.success && gamesResult.games.length > 0) {
                    const availableGames = gamesResult.games.filter(game => game.current_players < game.max_players);
                    if (availableGames.length > 0) {
                        await commandHandler.commands['trivia-join'].joinSpecificGame(interaction, availableGames[0].id);
                        return;
                    }
                }
                await interaction.update({
                    content: '❌ No available games to join right now.',
                    embeds: [],
                    components: []
                });
            } else if (interaction.customId.startsWith('start_game_')) {
                // Handle start game button from TriviaStartCommand
                await interaction.deferUpdate();
                const gameId = interaction.customId.split('_')[2]; // Keep as string for local games

                // Check if the user is the creator of this game
                const gameState = gameManager.activeGames.get(gameId);
                if (gameState && gameState.creatorId === interaction.user.id) {
                    // Start the game
                    await gameManager.startGameProgress(gameState, interaction);
                } else {
                    await interaction.update({
                        content: '❌ Only the game creator can start the game.',
                        embeds: [],
                        components: []
                    });
                }
            } else {
                // Unknown button - ignore
                logger.debug(`Unknown button interaction: ${interaction.customId}`);
            }
        } else if (interaction.isStringSelectMenu()) {
            // Handle select menu interactions if added in future
            logger.debug(`String select menu interaction: ${interaction.customId}`);
        }
    } catch (error) {
        logger.error('Error handling interaction:', error);

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('❌ Error')
            .setDescription('An error occurred while processing your interaction. Please try again.');

        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [embed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        } catch (followUpError) {
            logger.error('Failed to send interaction error:', followUpError);
        }
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    // Don't respond to bot's own reactions
    if (user.bot) return;

    try {
        await gameManager.handleReaction(reaction, user);
    } catch (error) {
        logger.error('Error handling reaction:', error);
    }
});

// Handle process termination gracefully
process.on('SIGINT', () => {
    logger.log('⏹️ Received SIGINT, shutting down gracefully...');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.log('⏹️ Received SIGTERM, shutting down gracefully...');
    client.destroy();
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    logger.error('❌ Uncaught Exception:', error);
    client.destroy();
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Login to Discord
logger.log('🚀 GospelWays Bible Trivia Bot starting up...');

// Debug: Check if token exists and is valid format
const token = process.env.DISCORD_TOKEN;
logger.log(`🔍 Token check: ${token ? 'Token exists' : 'No token found'}`);
logger.log(`🔍 Token length: ${token ? token.length : 0} characters`);
logger.log(`🔍 Token prefix: ${token ? token.substring(0, 20) + '...' : 'N/A'}`);

if (!token) {
    logger.error('❌ No Discord token found in environment variables');
    process.exit(1);
}

if (token.length < 50) {
    logger.error('❌ Discord token appears to be too short');
    process.exit(1);
}

// Try to login with the token
logger.log('🔗 Attempting to login to Discord...');
client.login(token).catch(error => {
    logger.error('❌ Failed to login to Discord:', error);
    logger.error('🔍 Token being used:', token.substring(0, 30) + '...');
    logger.error('🔍 Full error details:', error.message);

    // Don't exit immediately - let PM2 handle restarts
    logger.error('🔄 Bot will retry connection in next restart cycle...');
});
