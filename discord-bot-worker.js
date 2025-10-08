import { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } from 'discord.js';
import { config } from 'dotenv';
import { TriviaGameManager } from './services/TriviaGameManager.js';
import { APIService } from './services/API.js';
import { CommandHandler } from './commands/CommandHandler.js';
import { Logger } from './utils/Logger.js';

// Load environment variables
config();

export default {
  async fetch(request, env) {
    // Initialize logger
    const logger = new Logger();

    // Create Discord client
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
      ],
    });

    // Initialize services with environment variables
    const apiService = new APIService({
      baseURL: env.API_BASE_URL || 'https://993964a5.gospelways.pages.dev/api/bible-games',
    });

    const gameManager = new TriviaGameManager(apiService, logger);
    gameManager.client = client;
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
            type: 3,
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
            description: 'Number of questions (5-20)',
            type: 4,
            required: false,
            min_value: 5,
            max_value: 20,
          },
        ],
      },
      {
        name: 'trivia-join',
        description: 'Join a waiting trivia game',
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
            type: 3,
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
            type: 4,
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
            type: 3,
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
            description: 'Number of questions (5-20)',
            type: 4,
            required: false,
            min_value: 5,
            max_value: 20,
          },
        ],
      },
      {
        name: 'help',
        description: 'Show Bible Trivia Bot help information',
      },
    ];

    // Deploy commands
    const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

    // Event handlers
    client.once('ready', () => {
      logger.log(`✅ Bible Trivia Bot is online as ${client.user.tag}!`);
      logger.log(`🎮 Serving ${client.guilds.cache.size} servers`);

      // Set bot status
      client.user.setActivity('📖 Bible Trivia', { type: 'PLAYING' });

      // Register commands
      registerCommands();
    });

    async function registerCommands() {
      try {
        logger.log('🔄 Started refreshing application (/) commands.');

        const data = await rest.put(
          Routes.applicationCommands(env.DISCORD_CLIENT_ID),
          { body: commands },
        );

        logger.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
      } catch (error) {
        console.error('❌ Failed to register commands:', error);
      }
    }

    client.on('interactionCreate', async (interaction) => {
      try {
        // Handle different interaction types
        if (interaction.isChatInputCommand()) {
          await commandHandler.handleCommand(interaction);
        } else if (interaction.isButton()) {
          // Handle button interactions for game answering
          if (interaction.customId.startsWith('answer_')) {
            const parts = interaction.customId.split('_');
            const gameId = parseInt(parts[1]);
            const answer = parts[2];

            await gameManager.handleInteraction(interaction, gameId, answer);
          } else if (interaction.customId.startsWith('join_game_')) {
            await interaction.deferUpdate();
            const gameId = interaction.customId.split('_')[2];
            await commandHandler.commands['trivia-join'].joinSpecificGame(interaction, parseInt(gameId));
          } else if (interaction.customId === 'join_quick') {
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
            await interaction.deferUpdate();
            const gameId = parseInt(interaction.customId.split('_')[2]);

            const gameState = gameManager.activeGames.get(gameId);
            if (gameState && gameState.creatorId === interaction.user.id) {
              await gameManager.startGameProgress(gameState, interaction);
            } else {
              await interaction.update({
                content: '❌ Only the game creator can start the game.',
                embeds: [],
                components: []
              });
            }
          }
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
      if (user.bot) return;

      try {
        await gameManager.handleReaction(reaction, user);
      } catch (error) {
        logger.error('Error handling reaction:', error);
      }
    });

    // Login to Discord
    logger.log('🚀 GospelWays Bible Trivia Bot starting up...');

    const token = env.DISCORD_TOKEN;
    if (!token) {
      logger.error('❌ No Discord token found in environment variables');
      return new Response('Discord token not configured', { status: 500 });
    }

    try {
      await client.login(token);
      logger.log('🔗 Discord bot logged in successfully');
    } catch (error) {
      logger.error('❌ Failed to login to Discord:', error);
      return new Response('Failed to login to Discord', { status: 500 });
    }

    // Return a simple response for the worker
    return new Response('Discord Bible Trivia Bot is running!', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
