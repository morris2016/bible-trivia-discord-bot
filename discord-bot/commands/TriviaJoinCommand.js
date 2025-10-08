import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export class TriviaJoinCommand {
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
                .setDescription('You are already participating in a trivia game. Use `/trivia-status` to check your current game, or `/trivia-quit` to leave it.');

            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        await interaction.deferReply();

        try {
            // Get available games
            const gamesResult = await this.apiService.getWaitingGames();

            if (!gamesResult.success || !gamesResult.games || gamesResult.games.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(0xFFA500)
                    .setTitle('🎯 No Games Available')
                    .setDescription('There are no active games waiting for players right now.\n\nYou can create your own game with `/trivia-start`!')
                    .setFooter({ text: 'Games automatically clean up after 2 hours of inactivity' });

                await interaction.editReply({ embeds: [embed] });
                return;
            }

            // Filter games that have space
            const availableGames = gamesResult.games.filter(game =>
                game.current_players < game.max_players
            );

            if (availableGames.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(0xFFA500)
                    .setTitle('🎮 No Available Slots')
                    .setDescription('All available games are currently full.\n\nTry again in a few minutes or create your own game with `/trivia-start`!');

                await interaction.editReply({ embeds: [embed] });
                return;
            }

            // Show game selection if multiple games
            if (availableGames.length > 1) {
                await this.showGameSelection(interaction, availableGames);
            } else {
                // Join the only available game
                const game = availableGames[0];
                await this.joinSpecificGame(interaction, game.id);
            }

        } catch (error) {
            this.logger.error('Error in trivia-join command:', error);

            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Error')
                .setDescription('An error occurred while fetching available games. Please try again.');

            await interaction.editReply({ embeds: [embed] });
        }
    }

    async showGameSelection(interaction, games) {
        const gameOptions = games.slice(0, 5).map((game, index) => ({
            label: `${game.name} (${game.current_players}/${game.max_players})`,
            description: `${this.capitalizeFirst(game.difficulty)} • ${game.questions_per_game} questions • By ${game.created_by_name}`,
            value: game.id.toString(),
            emoji: ['🎯', '🎲', '🎮', '🎪', '🎨'][index]
        }));

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('join_quick')
                    .setLabel('🎯 Quick Join (First Available)')
                    .setStyle(ButtonStyle.Primary),
                ...gameOptions.slice(0, 4).map(option =>
                    new ButtonBuilder()
                        .setCustomId(`join_game_${option.value}`)
                        .setLabel(`${option.emoji} ${option.label.split(' (')[0]}`)
                        .setStyle(ButtonStyle.Secondary)
                )
            );

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🎮 Choose a Game to Join')
            .setDescription('Select a game from the options below or click "Quick Join" for the first available game.')
            .addFields(
                {
                    name: 'Available Games',
                    value: gameOptions.map(option =>
                        `${option.emoji} **${option.label.split(' (')[0]}**\n${option.description}`
                    ).join('\n\n')
                }
            )
            .setTimestamp();

        await interaction.editReply({
            embeds: [embed],
            components: [row]
        });

        // Note: Button interactions will be handled by the main interaction handler in index.js
        // The buttons will trigger the same interaction handler that called this method
    }

    async joinSpecificGame(interaction, gameId) {
        try {
            const result = await this.gameManager.joinGame(interaction, gameId);

            const embed = new EmbedBuilder()
                .setColor(result.success ? 0x00FF00 : 0xFF0000)
                .setTitle(result.success ? '✅ Joined Game!' : '❌ Failed to Join')
                .setDescription(result.message);

            if (result.success) {
                // Simple join message
                embed.setDescription(`${interaction.user.username} joined the game!`);
            }

            await interaction.editReply({ embeds: [embed], components: [] });

        } catch (error) {
            this.logger.error('Error joining specific game:', error);

            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Join Error')
                .setDescription('Failed to join the selected game. It may no longer be available or is already full.');

            await interaction.editReply({ embeds: [embed], components: [] });
        }
    }

    capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}
