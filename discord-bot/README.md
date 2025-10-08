# 📖 GospelWays Bible Trivia Discord Bot

An interactive Discord bot that brings Bible trivia gameplay directly to Discord servers. This bot integrates seamlessly with the existing GospelWays Bible Trivia API to provide AI-generated questions from all 66 books of the Bible.

## 🎯 Features

- **🎮 Multiplayer & Solo Games**: Create games for friends or practice solo
- **🧠 AI-Generated Questions**: Powered by the same AI that generates questions for the website
- **⏱️ Dynamic Timing**: Difficulty-based time limits for fair challenges
- **🏆 Scoring System**: Points based on difficulty + speed bonuses
- **📊 Global Leaderboards**: Track rankings across all difficulties
- **✨ Interactive UI**: Rich Discord embeds with reaction-based answering
- **🔄 Real-time Updates**: Live game progress and player status

## 📋 Requirements

- Node.js 18.0.0 or higher
- Discord Bot Token
- Access to your existing Bible Trivia API
- Discord.js v14

## 🚀 Quick Setup

### 1. Discord Bot Creation

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to the "Bot" section and create a bot
4. Copy the bot token from the "Token" section
5. Go to the "General Information" section and copy the "Application ID"

### 2. Bot Permissions

The bot needs the following permissions for full functionality:

#### Required Permissions:
- **Send Messages** - Send trivia questions and results
- **Use Slash Commands** - Register and respond to `/trivia-*` commands
- **Embed Links** - Display rich embeds with questions and leaderboards
- **Read Message History** - Access channels for game management
- **Read Messages/View Channels** - View channels where games are started

#### Optional But Recommended:
- **Add Reactions** - Legacy support (bot primarily uses buttons now)
- **Mention Everyone** - Mention players when games end (not required)
- **Manage Messages** - Clean up old game messages (optional)

#### Bot Permissions Integer:
```
Send Messages: 2048
Use Slash Commands: 2147483648
Embed Links: 16384
Read Message History: 65536
Read Messages/View Channels: 1024
```

**Total Integer**: `2148609040` (for essential permissions)

Or use this URL (replace YOUR_CLIENT_ID):
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2148609040&scope=bot%20applications.commands
```



### 4. Installation & Configuration

1. **Clone and navigate to the bot directory:**
```bash
cd discord-bot
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_application_id_here

# API Configuration (point to your Bible Trivia API)
API_BASE_URL=http://localhost:8787
API_GAME_URL=http://localhost:8787/api/bible-games

# Environment
NODE_ENV=development
```

4. **Start the bot:**
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## 🎮 Commands

### Game Commands

| Command | Description |
|---------|-------------|
| `/trivia-start difficulty:X questions:N` | Create a new multiplayer game |
| `/trivia-join` | Join an available multiplayer game |
| `/trivia-solo difficulty:X questions:N` | Start a solo practice game |
| `/trivia-quit` | Leave your current game |
| `/trivia-status` | Check your current game status |

### Information Commands

| Command | Description |
|---------|-------------|
| `/trivia-leaderboard difficulty:X limit:N` | View global leaderboards |
| `/help` | Show comprehensive help information |

### Difficulty Levels

- **Easy**: Basic Bible stories (12 seconds)
- **Medium**: Bible books & context (16.5 seconds)
- **Hard**: Deep scripture knowledge (21 seconds)
- **Expert**: Biblical languages & exegesis (25.5 seconds)

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DISCORD_TOKEN` | Your Discord bot token | ✅ |
| `DISCORD_CLIENT_ID` | Your Discord application ID | ✅ |
| `API_GAME_URL` | URL to your Bible Trivia API endpoint | ✅ |
| `NODE_ENV` | Environment (development/production) | ❌ |
| `LOG_LEVEL` | Logging level (error/warn/info/debug) | ❌ |
| `BOT_PREFIX` | Legacy command prefix | ❌ |
| `GUILD_TEST_ID` | Guild ID for testing slash commands | ❌ |

### API Requirements

Your Bible Trivia API must provide these endpoints:

- `POST /api/bible-games/create` - Create new games
- `GET /api/bible-games/ID` - Get game details
- `GET /api/bible-games?status=waiting` - List waiting games
- `POST /api/bible-games/ID/join-guest` - Join games
- `POST /api/bible-games/ID/start-guest` - Start games
- `GET /api/bible-games/ID/progress` - Check question generation progress
- `POST /api/bible-games/ID/questions/QID/answer-guest` - Submit answers
- `GET /api/bible-games/ID/results` - Get game results
- `GET /api/bible-games/leaderboard` - Global leaderboards

## 🎯 How to Play

### For Players:
1. Use `/trivia-start` to create a game or `/trivia-join` to join one
2. Wait for AI question generation (usually 30-60 seconds)
3. Answer questions by clicking the A, B, C, D buttons
4. Faster correct answers get speed bonuses!
5. Check your ranking at the end

### For Game Creators:
1. Use `/trivia-start` with your preferred difficulty
2. Share the game announcement with friends
3. Use `/trivia-start` length to set how many questions
4. Start the game when everyone is ready

### Scoring System:
- **Base Points**: Easy=1, Medium=2, Hard=3, Expert=4
- **Speed Bonus**: Up to full question value for fast answers
- **Perfect Score**: Question value + full speed bonus

## 🛠️ Development

### Project Structure

```
discord-bot/
├── index.js              # Main bot entry point
├── services/
│   ├── TriviaGameManager.js  # Core game logic & state
│   └── API.js                # API integration
├── commands/
│   ├── CommandHandler.js     # Command routing
│   ├── TriviaStartCommand.js # Game creation
│   ├── TriviaJoinCommand.js  # Game joining
│   └── ...                   # Other commands
├── utils/
│   └── Logger.js             # Logging utility
├── package.json
├── .env.example
└── README.md
```

### Adding New Commands

1. Create a new command file in `commands/`
2. Export a class with an `execute(interaction)` method
3. Import and register it in `CommandHandler.js`
4. Add the command definition to the commands array in `index.js`

### Debugging

- Set `LOG_LEVEL=debug` for detailed logging
- Check the console output for API errors
- Use `/trivia-status` to check individual player state
- Monitor Discord bot logs for interaction errors

## ❓ Troubleshooting

### Common Issues:

**Bot doesn't respond to commands:**
- Ensure slash commands are registered (check console on startup)
- Make sure the bot has permission to use slash commands

**API connection errors:**
- Verify `API_GAME_URL` is correct and accessible
- Check if your Bible Trivia API is running
- Look for CORS or network issues

**Questions not generating:**
- Check API logs for AI generation errors
- Verify the difficulty and question count are within limits
- Try with fewer questions (max 20)

**Leaderboard not loading:**
- Ensure API leaderboard endpoint is working
- Check for database connectivity issues

## 📊 Monitoring & Logs

The bot uses a structured logging system:

- **ERROR**: Critical errors only
- **WARN**: Warning conditions
- **INFO**: General information (default)
- **DEBUG**: Detailed debugging information

Logs include timestamps and are prefixed with the bot name for easy filtering.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Submit a pull request

### Development Guidelines:
- Use ES6 modules (`.js` extensions)
- Follow existing code style and error handling
- Add proper logging for new features
- Test commands in a development Discord server
- Document any new configuration options

## 📜 License

ISC License - See package.json for details.

## 🙏 About GospelWays

GospelWays is dedicated to defending the faith through knowledge and understanding of scripture. This Discord bot brings interactive Bible study and trivia to Discord communities worldwide.

---

**Need help?** Use `/help` in Discord for in-bot assistance, or check the console logs for technical issues.
