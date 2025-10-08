import { EmbedBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export class TriviaSoloCommand {
    constructor(client, gameManager, apiService, logger) {
        this.client = client;
        this.gameManager = gameManager;
        this.apiService = apiService;
        this.logger = logger;
    }

    async execute(interaction) {
        const userId = interaction.user.id;

        // Check if user is already in a game
        if (this.gameManager.playerGames.has(userId)) {
            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('⚠️ Already in Game')
                .setDescription('You are already participating in a trivia game. Use `/trivia-quit` to leave your current game first.');

            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        const difficulty = interaction.options.getString('difficulty');
        const questions = interaction.options.getInteger('questions') || 10;

        // Validate question count
        if (questions > 20 || questions < 5) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Invalid Question Count')
                .setDescription('Please choose between 5 and 20 questions.');

            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        try {
            this.logger.game(`Starting solo game for ${interaction.user.username} (${userId})`);

            const result = await this.gameManager.startSoloGame(interaction, {
                difficulty: difficulty,
                questions: questions
            });

            if (result.success) {
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('🎯 Solo Game Started!')
                    .setDescription(`Your Bible trivia game is starting!\n\n` +
                        `**Difficulty:** ${this.capitalizeFirst(difficulty)}\n` +
                        `**Questions:** ${questions}\n\n` +
                        `⏳ Please wait while our AI generates personalized Bible questions for you...`)
                    .addFields(
                        { name: 'Game Mode', value: 'Solo Practice', inline: true },
                        { name: 'Difficulty', value: this.capitalizeFirst(difficulty), inline: true },
                        { name: 'Questions', value: questions.toString(), inline: true }
                    )
                    .setFooter({ text: 'Questions will appear in this channel shortly' })
                    .setTimestamp();

                // Create support button
                const supportRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('solo_support_help')
                            .setLabel('❓ Need Help?')
                            .setStyle(ButtonStyle.Secondary)
                    );

                await interaction.reply({ embeds: [embed], components: [supportRow], ephemeral: true });

                // Continue with solo gameplay after sending initial reply
                const gameState = result.game;
                setTimeout(() => {
                    this.startSoloGameplay(gameState, interaction);
                }, 500);

            } else {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Failed to Start Solo Game')
                    .setDescription(result.message);

                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        } catch (error) {
            this.logger.error('Error in trivia-solo command:', error);

            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Error')
                .setDescription('An error occurred while starting the solo game. Please try again.');

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }

    /**
     * Continue with solo gameplay after initial reply
     */
    async startSoloGameplay(gameState, interaction) {
        try {
            this.logger.game(`Continuing solo gameplay for game ${gameState.id}`);

            // Use the existing game manager to start the solo gameplay
            await this.gameManager.startSoloGameplay(gameState, interaction);

        } catch (error) {
            this.logger.error('Error starting solo gameplay:', error);

            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Solo Game Start Failed')
                .setDescription('Failed to start the solo trivia game. Please try again.');

            await interaction.followUp({ embeds: [embed], ephemeral: true });
        }
    }

    capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}
