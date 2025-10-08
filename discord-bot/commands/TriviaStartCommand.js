import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export class TriviaStartCommand {
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

        await interaction.deferReply();

        try {
            const result = await this.gameManager.startMultiplayerGame(interaction, {
                difficulty: difficulty,
                questions: questions
            });

            if (result.success) {
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('🎮 Multiplayer Game Created!')
                    .setDescription(result.message)
                    .addFields(
                        { name: 'Game Creator', value: interaction.user.username, inline: true },
                        { name: 'Difficulty', value: this.capitalizeFirst(difficulty), inline: true },
                        { name: 'Questions', value: questions.toString(), inline: true }
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });

                // Send a public message to the channel about the game with join button
                const publicEmbed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle('🎯 Bible Trivia Game Started!')
                    .setDescription(`${interaction.user.username} has created a Bible trivia game!`)
                    .addFields(
                        { name: 'Difficulty', value: this.capitalizeFirst(difficulty), inline: true },
                        { name: 'Questions', value: `${questions} Questions`, inline: true },
                        { name: 'Status', value: 'Waiting for players to join', inline: true }
                    )
                    .setFooter({ text: 'Game created just now' })
                    .setTimestamp();

                // Add join button and support button for other players
                const joinButton = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`join_game_${result.game.id}`)
                            .setLabel('🎮 Join Game')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setURL('https://buymeacoffee.com/siagmoo26i')
                            .setLabel('☕ Support')
                            .setStyle(ButtonStyle.Link)
                    );

                await interaction.followUp({
                    embeds: [publicEmbed],
                    components: [joinButton]
                });

                // Send private message to creator with start button
                const privateEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('🎮 Your Game is Ready!')
                    .setDescription('You can start the game whenever players have joined.')
                    .addFields(
                        { name: 'Game ID', value: result.game.id.toString(), inline: true },
                        { name: 'Players Joined', value: '1 (You)', inline: true },
                        { name: 'Status', value: 'Waiting for players', inline: true }
                    );

                const startButton = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`start_game_${result.game.id}`)
                            .setLabel('🚀 Start Game')
                            .setStyle(ButtonStyle.Success)
                    );

                await interaction.followUp({
                    embeds: [privateEmbed],
                    components: [startButton],
                    ephemeral: true
                });

            } else {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Failed to Create Game')
                    .setDescription(result.message);

                await interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            this.logger.error('Error in trivia-start command:', error);

            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Error')
                .setDescription('An error occurred while creating the game. Please try again.');

            await interaction.editReply({ embeds: [embed] });
        }
    }

    capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}
