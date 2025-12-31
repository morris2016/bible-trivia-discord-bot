import { EmbedBuilder } from 'discord.js';

export class HelpCommand {
    constructor(client, gameManager, apiService, logger) {
        this.client = client;
        this.gameManager = gameManager;
        this.apiService = apiService;
        this.logger = logger;
    }

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const helpEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('📖 GospelWays Bible Trivia Bot - Help')
                .setDescription('**Challenge your biblical knowledge with interactive trivia games!**\n\n' +
                    'This bot integrates with our AI-powered Bible question generator to create personalized trivia games.')
                .addFields(
                    {
                        name: '🎮 Game Commands',
                        value: [
                            '**`/trivia-start`** - Create a new multiplayer game',
                            '• Choose difficulty (beginner/advanced)',
                            '• Set number of questions (5-20)',
                            '• Invite friends to join!',
                            '',
                            '**`/trivia-join`** - Join an available multiplayer game',
                            '• Browse waiting games',
                            '• Quick join or select specific game',
                            '',
                            '**`/trivia-solo`** - Start a practice game alone',
                            '• Perfect for studying',
                            '• Same question quality as multiplayer',
                            '',
                            '**Message Commands** (during games):',
                            '• `!pause` - Pause the current question',
                            '• `!next` - Skip to next question',
                            '• `!stop` - End the game immediately'
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '📊 Information Commands',
                        value: [
                            '**`/trivia-status`** - Check your current game status',
                            '**`/trivia-leaderboard`** - View global rankings',
                            '• See top players per difficulty',
                            '• Track your ranking',
                            '**`/trivia-quit`** - Leave your current game',
                            '**`/help`** - Show this help message'
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '🎯 How to Play',
                        value: [
                            '1. **Join or Create** a game using `/trivia-start` or `/trivia-join`',
                            '2. **Wait** for questions to generate (AI-powered!)',
                            '3. **Answer Fast!** Questions have time limits based on difficulty:',
                            '   • Beginner: 12 seconds',
                            '   • Advanced: 16.5 seconds',
                            '4. **Score Points** for correct answers + speed bonus!',
                            '5. **Race to Victory!** in multiplayer games'
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '🏆 Scoring System',
                        value: [
                            '**Base Points** (difficulty-based):',
                            '• Beginner: 1 point',
                            '• Advanced: 2 points',
                            '',
                            '**Speed Bonus**: Up to full question value',
                            '**Time-based**: Faster = higher bonus!',
                            '',
                            '**Perfect Score**: Question value + full speed bonus'
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: 'ℹ️ Important Notes',
                        value: [
                            '• Games use **AI-generated questions** from Bible text',
                            '• All 66 Bible books covered',
                            '• Beginner level: Basic Bible stories',
                            '• Advanced level: In-depth Bible knowledge',
                            '• Features automatic game cleanup (2+ hours old)',
                            '• Max players: 10 per game',
                            '• Questions: 5-20 per game (more = longer wait time)'
                        ].join('\n'),
                        inline: false
                    }
                )
                .setFooter({
                    text: 'GospelWays Bible Trivia Bot - Defending the Faith Through Knowledge',
                    iconURL: this.client.user?.avatarURL()
                })
                .setTimestamp();

            // Add bot info
            const botInfo = await this.getBotInfo();
            if (botInfo) {
                helpEmbed.addFields({
                    name: '🤖 Bot Stats',
                    value: botInfo,
                    inline: true
                });
            }

            await interaction.editReply({ embeds: [helpEmbed] });

        } catch (error) {
            this.logger.error('Error in help command:', error);

            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Help Unavailable')
                .setDescription('Sorry, the help system is currently unavailable. Please try again later.');

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }

    async getBotInfo() {
        try {
            // Get basic bot stats
            const guildCount = this.client.guilds.cache.size;
            const userCount = this.client.users.cache.size;
            const activeGames = this.gameManager.activeGames.size;
            const totalPlayers = Array.from(this.gameManager.activeGames.values())
                .reduce((sum, game) => sum + game.players.size, 0);

            return [
                `🌐 **${guildCount}** servers`,
                `👥 **${totalPlayers}** players in games`,
                `🎮 **${activeGames}** active games`
            ].join('\n');

        } catch (error) {
            this.logger.warn('Could not get bot info for help:', error.message);
            return null;
        }
    }
}
