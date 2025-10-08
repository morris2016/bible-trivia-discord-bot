import { EmbedBuilder } from 'discord.js';

export class TriviaLeaderboardCommand {
    constructor(client, gameManager, apiService, logger) {
        this.client = client;
        this.gameManager = gameManager;
        this.apiService = apiService;
        this.logger = logger;
    }

    async execute(interaction) {
        const difficulty = interaction.options.getString('difficulty') || null;
        const limit = Math.min(interaction.options.getInteger('limit') || 10, 10); // Max 10

        await interaction.deferReply();

        try {
            const leaderboardResult = await this.apiService.getLeaderboard();

            if (!leaderboardResult.success) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Leaderboard Error')
                    .setDescription('Failed to load leaderboard data. Please try again later.');

                await interaction.editReply({ embeds: [embed] });
                return;
            }

            const leaderboard = leaderboardResult.leaderboard || {};

            // If specific difficulty requested
            if (difficulty) {
                await this.showDifficultyLeaderboard(interaction, leaderboard, difficulty, limit);
            } else {
                // Show overview with top players from each difficulty
                await this.showLeaderboardOverview(interaction, leaderboard, limit);
            }

        } catch (error) {
            this.logger.error('Error in trivia-leaderboard command:', error);

            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Error')
                .setDescription('An error occurred while fetching the leaderboard. Please try again.');

            await interaction.editReply({ embeds: [embed] });
        }
    }

    async showLeaderboardOverview(interaction, leaderboard, limit) {
        const difficulties = ['easy', 'medium', 'hard', 'expert'];
        const embeds = [];

        // Create overview embed
        const overviewEmbed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🏆 Bible Trivia Global Leaderboard')
            .setDescription('**Top Players Across All Difficulties**\n\n*Click the buttons below to view specific difficulty leaderboards*')
            .setTimestamp();

        // Add stats for each difficulty
        difficulties.forEach(difficulty => {
            const players = leaderboard[difficulty] || [];
            const topPlayers = players.slice(0, 3); // Show top 3 per difficulty

            if (topPlayers.length > 0) {
                const playerList = topPlayers.map((player, index) =>
                    `${['🥇', '🥈', '🥉'][index]} **${player.player_name || player.name}** - ${player.wins || player.multiplayer_wins} wins`
                ).join('\n');

                overviewEmbed.addFields({
                    name: `${this.capitalizeFirst(difficulty)} Difficulty`,
                    value: playerList,
                    inline: true
                });
            }
        });

        overviewEmbed.setFooter({ text: `Use /trivia-leaderboard difficulty:XXX to see full rankings` });

        // Create difficulty selection buttons
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import('discord.js');

        const row = new ActionRowBuilder()
            .addComponents(
                difficulties.map(difficulty =>
                    new ButtonBuilder()
                        .setCustomId(`leaderboard_${difficulty}`)
                        .setLabel(`${this.capitalizeFirst(difficulty)}`)
                        .setStyle(ButtonStyle.Secondary)
                )
            );

        await interaction.editReply({
            embeds: [overviewEmbed],
            components: [row]
        });

        // Set up collector for difficulty selection
        const filter = (btnInteraction) => btnInteraction.user.id === interaction.user.id;

        const collector = interaction.followUp.createMessageComponentCollector({
            filter,
            time: 300000 // 5 minutes timeout
        });

        collector.on('collect', async (btnInteraction) => {
            await btnInteraction.deferUpdate();

            const selectedDifficulty = btnInteraction.customId.split('_')[1];
            await this.showDifficultyLeaderboard(btnInteraction, leaderboard, selectedDifficulty, limit);
            collector.stop();
        });

        collector.on('end', () => {
            // Cleanup buttons after timeout
            try {
                interaction.editReply({ components: [] }).catch(() => {});
            } catch (error) {
                this.logger.warn('Failed to cleanup leaderboard buttons:', error.message);
            }
        });
    }

    async showDifficultyLeaderboard(interaction, leaderboard, difficulty, limit) {
        const players = leaderboard[difficulty] || [];

        if (players.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle(`🏆 ${this.capitalizeFirst(difficulty)} Difficulty Leaderboard`)
                .setDescription('No players have completed games in this difficulty yet.\n\nBe the first to start a multiplayer game!')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed], components: [] });
            return;
        }

        const topPlayers = players.slice(0, limit);

        const leaderboardText = topPlayers.map((player, index) => {
            const rank = index + 1;
            const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
            const displayName = player.player_name || player.name || 'Unknown Player';
            const wins = player.wins || player.multiplayer_wins || 0;

            return `${rankEmoji} **${displayName}** - ${wins} wins`;
        }).join('\n');

        const embed = new EmbedBuilder()
            .setColor(this.getDifficultyColor(difficulty))
            .setTitle(`🏆 ${this.capitalizeFirst(difficulty)} Difficulty Leaderboard`)
            .setDescription(`**Top ${topPlayers.length} Players**\n\n${leaderboardText}`)
            .addFields(
                { name: 'Total Players', value: players.length.toString(), inline: true },
                { name: 'Games Played', value: players.reduce((sum, p) => sum + (p.wins || p.multiplayer_wins || 0), 0).toString(), inline: true }
            )
            .setFooter({ text: `Difficulty: ${difficulty.toLowerCase()} • Showing top ${limit} players` })
            .setTimestamp();

        // Add thumbnail based on difficulty
        embed.setThumbnail(this.getDifficultyThumbnail(difficulty));

        await interaction.editReply({ embeds: [embed], components: [] });
    }

    getDifficultyColor(difficulty) {
        const colors = {
            easy: 0x00FF00,
            medium: 0xFFA500,
            hard: 0xFF0000,
            expert: 0x800080
        };
        return colors[difficulty] || 0x0099FF;
    }

    getDifficultyThumbnail(difficulty) {
        const thumbnails = {
            easy: 'https://cdn.discordapp.com/attachments/1000000000000000000/easy-difficulty.png',
            medium: 'https://cdn.discordapp.com/attachments/1000000000000000000/medium-difficulty.png',
            hard: 'https://cdn.discordapp.com/attachments/1000000000000000000/hard-difficulty.png',
            expert: 'https://cdn.discordapp.com/attachments/1000000000000000000/expert-difficulty.png'
        };
        return thumbnails[difficulty];
    }

    capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    async showInteractiveLeaderboard(interaction, leaderboard) {
        // This could be expanded with pagination and filtering
        // For now, it just shows a simple overview
        await this.showLeaderboardOverview(interaction, leaderboard, 10);
    }
}
