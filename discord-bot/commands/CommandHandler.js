import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { TriviaStartCommand } from './TriviaStartCommand.js';
import { TriviaJoinCommand } from './TriviaJoinCommand.js';
import { TriviaSoloCommand } from './TriviaSoloCommand.js';
import { TriviaLeaderboardCommand } from './TriviaLeaderboardCommand.js';
import { HelpCommand } from './HelpCommand.js';

export class CommandHandler {
    constructor(client, gameManager, apiService, logger) {
        this.client = client;
        this.gameManager = gameManager;
        this.apiService = apiService;
        this.logger = logger;

        // Initialize command handlers
        this.commands = {
            'trivia-start': new TriviaStartCommand(client, gameManager, apiService, logger),
            'trivia-join': new TriviaJoinCommand(client, gameManager, apiService, logger),
            'trivia-quit': new TriviaQuitCommand(client, gameManager, apiService, logger),
            'trivia-status': new TriviaStatusCommand(client, gameManager, apiService, logger),
            'trivia-leaderboard': new TriviaLeaderboardCommand(client, gameManager, apiService, logger),
            'trivia-solo': new TriviaSoloCommand(client, gameManager, apiService, logger),
            'help': new HelpCommand(client, gameManager, apiService, logger),
        };
    }

    async handleCommand(interaction) {
        const commandName = interaction.commandName;

        this.logger.debug(`Handling command: ${commandName} from ${interaction.user.tag} (${interaction.user.id})`);

        // Check if command exists
        if (!this.commands[commandName]) {
            this.logger.warn(`Unknown command: ${commandName}`);
            await this.sendErrorMessage(interaction, 'Unknown Command', 'This command is not recognized.');
            return;
        }

        try {
            // Handler will manage its own responses
            await this.commands[commandName].execute(interaction);
        } catch (error) {
            this.logger.error(`Error executing command ${commandName}:`, error);
            await this.sendErrorMessage(interaction, 'Command Error', 'An error occurred while processing your command.');
        }
    }

    async sendErrorMessage(interaction, title, description, ephemeral = true) {
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle(`❌ ${title}`)
            .setDescription(description)
            .setTimestamp();

        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [embed], ephemeral });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral });
            }
        } catch (error) {
            this.logger.error('Failed to send error message:', error);
        }
    }

    async sendSuccessMessage(interaction, title, description, ephemeral = true) {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle(`✅ ${title}`)
            .setDescription(description)
            .setTimestamp();

        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [embed], ephemeral });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral });
            }
        } catch (error) {
            this.logger.error('Failed to send success message:', error);
        }
    }
}

// Individual command handlers (implemented as separate classes)

// TriviaStartCommand implementation will be created separately
// For now, provide stub implementations

class TriviaQuitCommand {
    constructor(client, gameManager, apiService, logger) {
        this.client = client;
        this.gameManager = gameManager;
        this.apiService = apiService;
        this.logger = logger;
    }

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const userId = interaction.user.id;
            const quitResult = await this.gameManager.quitGame(userId);

            if (quitResult.success) {
                await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('✅ Left Game')
                        .setDescription(quitResult.message)
                    ]
                });
            } else {
                await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor(0xFFA500)
                        .setTitle('⚠️ Not in Game')
                        .setDescription(quitResult.message)
                    ]
                });
            }
        } catch (error) {
            this.logger.error('Error in trivia-quit command:', error);
            await interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Error')
                    .setDescription('Failed to quit the game.')
                ]
            });
        }
    }
}

class TriviaStatusCommand {
    constructor(client, gameManager, apiService, logger) {
        this.client = client;
        this.gameManager = gameManager;
        this.apiService = apiService;
        this.logger = logger;
    }

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const userId = interaction.user.id;
            const statusResult = await this.gameManager.getPlayerStatus(userId);

            if (statusResult.inGame) {
                const embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle('📊 Your Game Status')
                    .addFields(
                        { name: 'Game ID', value: statusResult.gameId, inline: true },
                        { name: 'Status', value: statusResult.gameStatus, inline: true },
                        { name: 'Your Score', value: statusResult.playerScore.toString(), inline: true },
                        { name: 'Current Question', value: `${statusResult.currentQuestion}/${statusResult.totalQuestions}`, inline: true },
                        { name: 'Difficulty', value: statusResult.difficulty, inline: true }
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor(0xFFA500)
                        .setTitle('📊 Not in a Game')
                        .setDescription('You are not currently participating in any trivia games.')
                    ]
                });
            }
        } catch (error) {
            this.logger.error('Error in trivia-status command:', error);
            await interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Error')
                    .setDescription('Failed to get your game status.')
                ]
            });
        }
    }
}
