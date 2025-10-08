import { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } from 'discord.js';

// Bible Questions Database - Embedded directly for Cloudflare Workers
const BIBLE_QUESTIONS = [
  {
    question: "Who created the heavens and the earth?",
    correctAnswer: "God",
    options: ["God", "Jesus", "Abraham", "Moses"],
    reference: "Genesis 1:1",
    difficulty: "easy",
    category: "Basic Facts",
    subcategory: "Creation",
    questionType: "who",
    points: 10,
    tags: ["creation", "genesis", "beginning"],
    verseContext: "In the beginning God created the heavens and the earth.",
    explanation: "The first verse of the Bible clearly states that God is the creator of everything."
  },
  {
    question: "How many days did God take to create the world?",
    correctAnswer: "6",
    options: ["6", "7", "5", "8"],
    reference: "Genesis 1:31",
    difficulty: "easy",
    category: "Basic Facts",
    subcategory: "Creation",
    questionType: "how_many",
    points: 10,
    tags: ["creation", "genesis", "days"],
    verseContext: "And God saw every thing that he had made, and, behold, it was very good. And the evening and the morning were the sixth day.",
    explanation: "God created the world in six days and rested on the seventh day."
  },
  {
    question: "Who was swallowed by a great fish?",
    correctAnswer: "Jonah",
    options: ["Jonah", "Moses", "David", "Solomon"],
    reference: "Jonah 1:17",
    difficulty: "easy",
    category: "People & Characters",
    subcategory: "Prophets",
    questionType: "who",
    points: 10,
    tags: ["jonah", "prophet", "fish", "whale"],
    verseContext: "Now the LORD had prepared a great fish to swallow up Jonah. And Jonah was in the belly of the fish three days and three nights.",
    explanation: "Jonah was swallowed by a great fish after trying to flee from God's command."
  },
  {
    question: "Who built the ark?",
    correctAnswer: "Noah",
    options: ["Noah", "Abraham", "Moses", "David"],
    reference: "Genesis 6:14",
    difficulty: "easy",
    category: "People & Characters",
    subcategory: "Patriarchs",
    questionType: "who",
    points: 10,
    tags: ["noah", "ark", "flood"],
    verseContext: "Make thee an ark of gopher wood; rooms shalt thou make in the ark, and shalt pitch it within and without with pitch.",
    explanation: "Noah built the ark at God's command to save his family and animals from the flood."
  },
  {
    question: "How many disciples did Jesus have?",
    correctAnswer: "12",
    options: ["12", "10", "11", "13"],
    reference: "Matthew 10:1",
    difficulty: "easy",
    category: "Numbers & Counting",
    subcategory: "New Testament",
    questionType: "how_many",
    points: 10,
    tags: ["disciples", "apostles", "jesus"],
    verseContext: "And when he had called unto him his twelve disciples, he gave them power against unclean spirits, to cast them out, and to heal all manner of sickness and all manner of disease.",
    explanation: "Jesus chose twelve disciples who became known as the apostles."
  },
  {
    question: "Where was Jesus born?",
    correctAnswer: "Bethlehem",
    options: ["Bethlehem", "Jerusalem", "Nazareth", "Capernaum"],
    reference: "Matthew 2:1",
    difficulty: "easy",
    category: "Places & Locations",
    subcategory: "Jesus' Life",
    questionType: "where",
    points: 10,
    tags: ["jesus", "birth", "bethlehem"],
    verseContext: "Now when Jesus was born in Bethlehem of Judaea in the days of Herod the king, behold, there came wise men from the east to Jerusalem.",
    explanation: "Jesus was born in Bethlehem, fulfilling the prophecy from Micah 5:2."
  },
  {
    question: "Who baptized Jesus?",
    correctAnswer: "John the Baptist",
    options: ["John the Baptist", "Peter", "James", "Andrew"],
    reference: "Matthew 3:13",
    difficulty: "easy",
    category: "People & Characters",
    subcategory: "Jesus' Life",
    questionType: "who",
    points: 10,
    tags: ["jesus", "baptism", "john"],
    verseContext: "Then cometh Jesus from Galilee to Jordan unto John, to be baptized of him.",
    explanation: "John the Baptist baptized Jesus in the Jordan River at the beginning of Jesus' ministry."
  },
  {
    question: "What did Jesus turn water into?",
    correctAnswer: "Wine",
    options: ["Wine", "Bread", "Fish", "Oil"],
    reference: "John 2:9",
    difficulty: "easy",
    category: "Events & Stories",
    subcategory: "Miracles",
    questionType: "what",
    points: 10,
    tags: ["jesus", "miracle", "wedding", "cana"],
    verseContext: "When the ruler of the feast had tasted the water that was made wine, and knew not whence it was: (but the servants which drew the water knew;) the governor of the feast called the bridegroom.",
    explanation: "Jesus performed his first miracle at a wedding in Cana, turning water into wine."
  },
  {
    question: "Who denied Jesus three times?",
    correctAnswer: "Peter",
    options: ["Peter", "Judas", "Thomas", "John"],
    reference: "Matthew 26:75",
    difficulty: "easy",
    category: "People & Characters",
    subcategory: "Disciples",
    questionType: "who",
    points: 10,
    tags: ["peter", "denial", "jesus", "trial"],
    verseContext: "And Peter remembered the word of Jesus, which said unto him, Before the cock crow, thou shalt deny me thrice. And he went out, and wept bitterly.",
    explanation: "Peter denied knowing Jesus three times before the rooster crowed, just as Jesus had predicted."
  },
  {
    question: "How many days was Jesus in the tomb?",
    correctAnswer: "3",
    options: ["3", "2", "4", "1"],
    reference: "Matthew 12:40",
    difficulty: "easy",
    category: "Numbers & Counting",
    subcategory: "Resurrection",
    questionType: "how_many",
    points: 10,
    tags: ["jesus", "resurrection", "tomb"],
    verseContext: "For as Jonas was three days and three nights in the whale's belly; so shall the Son of man be three days and three nights in the heart of the earth.",
    explanation: "Jesus was in the tomb for three days before his resurrection."
  },
  {
    question: "Who was the first king of Israel?",
    correctAnswer: "Saul",
    options: ["Saul", "David", "Solomon", "Samuel"],
    reference: "1 Samuel 10:1",
    difficulty: "easy",
    category: "People & Characters",
    subcategory: "Kings",
    questionType: "who",
    points: 10,
    tags: ["saul", "king", "israel"],
    verseContext: "Then Samuel took a vial of oil, and poured it upon his head, and kissed him, and said, Is it not because the LORD hath anointed thee to be captain over his inheritance?",
    explanation: "Saul was the first king of Israel, anointed by Samuel the prophet."
  },
  {
    question: "What did Moses' rod turn into?",
    correctAnswer: "A serpent",
    options: ["A serpent", "A fish", "A bird", "A tree"],
    reference: "Exodus 4:3",
    difficulty: "easy",
    category: "Events & Stories",
    subcategory: "Moses",
    questionType: "what",
    points: 10,
    tags: ["moses", "rod", "serpent", "miracle"],
    verseContext: "And he said, Cast it on the ground. And he cast it on the ground, and it became a serpent; and Moses fled from before it.",
    explanation: "Moses' rod turned into a serpent as a sign from God to Pharaoh."
  },
  {
    question: "Who interpreted Pharaoh's dreams?",
    correctAnswer: "Joseph",
    options: ["Joseph", "Moses", "Daniel", "Abraham"],
    reference: "Genesis 41:16",
    difficulty: "easy",
    category: "People & Characters",
    subcategory: "Patriarchs",
    questionType: "who",
    points: 10,
    tags: ["joseph", "dreams", "pharaoh"],
    verseContext: "And Joseph answered Pharaoh, saying, It is not in me: God shall give Pharaoh an answer of peace.",
    explanation: "Joseph interpreted Pharaoh's dreams about seven years of plenty and seven years of famine."
  },
  {
    question: "How many plagues did God send on Egypt?",
    correctAnswer: "10",
    options: ["10", "7", "12", "8"],
    reference: "Exodus 12:29",
    difficulty: "easy",
    category: "Numbers & Counting",
    subcategory: "Exodus",
    questionType: "how_many",
    points: 10,
    tags: ["plagues", "egypt", "moses"],
    verseContext: "And it came to pass, that at midnight the LORD smote all the firstborn in the land of Egypt, from the firstborn of Pharaoh that sat on his throne unto the firstborn of the captive that was in the dungeon; and all the firstborn of cattle.",
    explanation: "God sent ten plagues on Egypt to convince Pharaoh to let the Israelites go."
  },
  {
    question: "Who led the Israelites across the Red Sea?",
    correctAnswer: "Moses",
    options: ["Moses", "Joshua", "Aaron", "Caleb"],
    reference: "Exodus 14:21",
    difficulty: "easy",
    category: "People & Characters",
    subcategory: "Moses",
    questionType: "who",
    points: 10,
    tags: ["moses", "red sea", "exodus"],
    verseContext: "And Moses stretched out his hand over the sea; and the LORD caused the sea to go back by a strong east wind all that night, and made the sea dry land, and the waters were divided.",
    explanation: "Moses led the Israelites across the Red Sea on dry ground."
  },
  {
    question: "What did David use to defeat Goliath?",
    correctAnswer: "A stone",
    options: ["A stone", "A sword", "A spear", "His bare hands"],
    reference: "1 Samuel 17:49",
    difficulty: "easy",
    category: "Events & Stories",
    subcategory: "David",
    questionType: "what",
    points: 10,
    tags: ["david", "goliath", "stone"],
    verseContext: "And David put his hand in his bag, and took thence a stone, and slang it, and smote the Philistine in his forehead, that the stone sunk into his forehead; and he fell upon his face to the earth.",
    explanation: "David defeated Goliath with a single stone from his slingshot."
  },
  {
    question: "Who was thrown into the lions' den?",
    correctAnswer: "Daniel",
    options: ["Daniel", "Shadrach", "Meshach", "Abednego"],
    reference: "Daniel 6:16",
    difficulty: "easy",
    category: "People & Characters",
    subcategory: "Prophets",
    questionType: "who",
    points: 10,
    tags: ["daniel", "lions", "den"],
    verseContext: "Then the king commanded, and they brought Daniel, and cast him into the den of lions. Now the king spake and said unto Daniel, Thy God whom thou servest continually, he will deliver thee.",
    explanation: "Daniel was thrown into the lions' den because he continued to pray to God despite the king's decree."
  },
  {
    question: "How many days and nights did it rain during the flood?",
    correctAnswer: "40",
    options: ["40", "30", "50", "7"],
    reference: "Genesis 7:12",
    difficulty: "easy",
    category: "Numbers & Counting",
    subcategory: "Flood",
    questionType: "how_many",
    points: 10,
    tags: ["flood", "noah", "rain"],
    verseContext: "And the rain was upon the earth forty days and forty nights.",
    explanation: "It rained for forty days and forty nights during Noah's flood."
  },
  {
    question: "Who was Jesus' mother?",
    correctAnswer: "Mary",
    options: ["Mary", "Elizabeth", "Martha", "Ruth"],
    reference: "Matthew 1:18",
    difficulty: "easy",
    category: "People & Characters",
    subcategory: "Jesus' Family",
    questionType: "who",
    points: 10,
    tags: ["jesus", "mary", "mother"],
    verseContext: "Now the birth of Jesus Christ was on this wise: When as his mother Mary was espoused to Joseph, before they came together, she was found with child of the Holy Ghost.",
    explanation: "Mary was the mother of Jesus, chosen by God to bear His son."
  },
  {
    question: "What did Jesus say are the two greatest commandments?",
    correctAnswer: "Love God and love your neighbor",
    options: ["Love God and love your neighbor", "Pray and fast", "Give and forgive", "Study and teach"],
    reference: "Matthew 22:37-39",
    difficulty: "easy",
    category: "Quotes & Sayings",
    subcategory: "Commandments",
    questionType: "what",
    points: 10,
    tags: ["jesus", "commandments", "love"],
    verseContext: "Jesus said unto him, Thou shalt love the Lord thy God with all thy heart, and with all thy soul, and with all thy mind. This is the first and great commandment. And the second is like unto it, Thou shalt love thy neighbour as thyself.",
    explanation: "Jesus summarized the law with two commandments: love God and love your neighbor."
  }
];

// Simple logger for Cloudflare Workers
class Logger {
  log(message) {
    console.log(`[INFO] ${message}`);
  }

  error(message, error) {
    console.error(`[ERROR] ${message}`, error);
  }

  debug(message) {
    console.log(`[DEBUG] ${message}`);
  }

  game(message) {
    console.log(`[GAME] ${message}`);
  }

  warn(message) {
    console.warn(`[WARN] ${message}`);
  }
}

// Simplified API Service for Cloudflare Workers
class APIService {
  constructor(env) {
    this.baseURL = env.API_BASE_URL || 'https://5363a3be.gospelways.pages.dev/api/bible-games';
    this.logger = new Logger();
  }

  generateQuestionsLocally(difficulty, count) {
    try {
      this.logger.debug(`Generating ${count} ${difficulty} questions locally from database`);

      // Filter questions by difficulty
      const difficultyQuestions = BIBLE_QUESTIONS.filter(q => q.difficulty === difficulty);

      if (difficultyQuestions.length === 0) {
        this.logger.warn(`No questions found for difficulty: ${difficulty}`);
        return [];
      }

      // Shuffle and select questions
      const shuffled = [...difficultyQuestions].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(count, shuffled.length));

      this.logger.debug(`Generated ${selected.length} questions for difficulty ${difficulty}`);

      // Convert to the format expected by the game manager
      return selected.map((q, index) => {
        // Create a copy of options and shuffle them
        const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);

        // Find the new index of the correct answer after shuffling
        const correctAnswerIndex = shuffledOptions.findIndex(option => option === q.correctAnswer);

        this.logger.debug(`Question ${index + 1}: correctAnswer="${q.correctAnswer}", originalOptions=${JSON.stringify(q.options)}, shuffledOptions=${JSON.stringify(shuffledOptions)}, correctAnswerIndex=${correctAnswerIndex}`);

        return {
          id: q.id || `local-${Date.now()}-${index}`,
          question_text: q.question,
          correct_answer: q.correctAnswer,
          correct_answer_index: correctAnswerIndex !== -1 ? correctAnswerIndex : 0,
          options: shuffledOptions,
          bible_reference: q.reference,
          difficulty: q.difficulty,
          points: q.points,
          ai_generated: false,
          question_number: index + 1,
          uniqueId: `local-${Date.now()}-${index}`
        };
      });
    } catch (error) {
      this.logger.error('Error generating questions locally:', error);
      return [];
    }
  }

  async createGame(payload) {
    try {
      const response = await fetch(`${this.baseURL}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Discord-Bible-Trivia-Bot/1.0'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Failed to create game:', error.message);
      throw error;
    }
  }

  async getGame(gameId) {
    try {
      const response = await fetch(`${this.baseURL}/${gameId}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Failed to get game ${gameId}:`, error.message);
      throw error;
    }
  }

  async getWaitingGames() {
    try {
      const response = await fetch(`${this.baseURL}?status=waiting`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Failed to get waiting games:', error.message);
      throw error;
    }
  }

  async joinGame(gameId, payload) {
    try {
      const response = await fetch(`${this.baseURL}/${gameId}/join-guest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Discord-Bible-Trivia-Bot/1.0'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Failed to join game ${gameId}:`, error.message);
      throw error;
    }
  }

  async getGameProgress(gameId) {
    try {
      const response = await fetch(`${this.baseURL}/${gameId}/progress`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Failed to get game progress ${gameId}:`, error.message);
      throw error;
    }
  }

  async post(url, data) {
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Discord-Bible-Trivia-Bot/1.0'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`POST ${url} failed:`, error.message);
      throw error;
    }
  }

  async getLeaderboard() {
    try {
      const response = await fetch(`${this.baseURL}/leaderboard`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Failed to get leaderboard:', error.message);
      throw error;
    }
  }
}

// Simplified Trivia Game Manager for Cloudflare Workers
class TriviaGameManager {
  constructor(apiService, logger) {
    this.apiService = apiService;
    this.logger = logger;

    // Game storage
    this.activeGames = new Map();
    this.playerGames = new Map();
    this.gameTimers = new Map();
    this.progressTimers = new Map();

    // Difficulty configurations
    this.difficultyConfig = {
      easy: { time: 12, points: 1 },
      medium: { time: 16.5, points: 2 },
      hard: { time: 21, points: 3 },
      expert: { time: 25.5, points: 4 }
    };
  }

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
        participants: createResult.participants || []
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
        this.logger.debug(`Full error details:`, error.message);
      }
    }, 3000);

    this.progressTimers.set(gameId, progressInterval);

    // Send initial message
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('🎯 Bible Trivia Game Starting!')
      .setDescription('🔄 Generating personalized Bible questions...\n⏳ Please wait while our AI creates unique questions for you!');

    await interaction.followUp({ embeds: [embed] });

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

  async handleGameTimeout(gameState, interaction) {
    try {
      const embed = new EmbedBuilder()
        .setColor(0xFFAA00)
        .setTitle('⏰ Generation Timeout')
        .setDescription('Question generation is taking longer than expected. Attempting to start with available questions...');

      await interaction.followUp({ embeds: [embed] });

      // Try to start gameplay anyway
      await this.startGameplay(gameState, interaction);
    } catch (error) {
      this.logger.error('Error handling game timeout:', error);

      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Generation Failed')
        .setDescription('Failed to generate questions. Please try again.');

      try {
        await interaction.followUp({ embeds: [embed] });
      } catch (followUpError) {
        this.logger.error('Failed to send timeout error message:', followUpError);
      }
    }
  }

  async startGameplay(gameState, interaction) {
    try {
      this.logger.game(`Starting gameplay for game ${gameState.id}`);

      // Use local question generation for speed
      const localQuestions = this.apiService.generateQuestionsLocally(
        gameState.difficulty,
        gameState.totalQuestions
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
          await interaction.followUp({ embeds: [embed] });
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
        await interaction.followUp({ embeds: [embed] });
      } catch (followUpError) {
        this.logger.error('Failed to send follow-up:', followUpError);
      }
    }
  }

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

    // Send to channel
    const channel = await this.client.channels.fetch(gameState.channelId);
    const message = await channel.send({
      embeds: [embed],
      components: [row]
    });

    // Store message for cleanup
    gameState.currentMessage = message;

    // Start timer
    this.startQuestionTimer(gameState, Math.floor(timeLimit));
  }

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
        ephemeral: true
      });
      return;
    }

    // Update player's answer
    player.selectedAnswer = selectedAnswer;
    player.answeredAt = new Date();

    await interaction.reply({
      content: `✅ Answer ${selectedAnswer} recorded!`,
      ephemeral: true
    });
  }

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

  async evaluateAnswers(gameState) {
    // Clear timer
    if (this.gameTimers.has(gameState.id)) {
      clearTimeout(this.gameTimers.get(gameState.id));
      this.gameTimers.delete(gameState.id);
    }

    const question = gameState.questions[gameState.currentQuestionIndex];
    const correctAnswerLetter = String.fromCharCode(65 + question.correct_answer_index);

    this.logger.debug(`Evaluating answers for game ${gameState.id}, question ${gameState.currentQuestionIndex + 1}`);
    this.logger.debug(`Correct answer should be: ${correctAnswerLetter} (${question.correct_answer})`);
    this.logger.debug(`Correct answer index: ${question.correct_answer_index}`);

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

    // Send results to channel
    const channel = await this.client.channels.fetch(gameState.channelId);
    await channel.send({ embeds: [resultEmbed] });

    // Move to next question after delay
    setTimeout(async () => {
      gameState.currentQuestionIndex++;
      await this.displayQuestion(gameState);
    }, 5000);
  }

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

    // Send to channel
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

    // Clean up
    this.cleanupGame(gameState.id);
  }

  async sendQuestionReview(gameState, channel, playerMentions) {
    try {
      this.logger.game(`Sending question review for game ${gameState.id}`);

      // Create review content
      let reviewContent = '';
      for (let i = 0; i < gameState.questions.length; i++) {
        const question = gameState.questions[i];
        const questionNumber = i + 1;
        const correctAnswerLetter = String.fromCharCode(65 + question.correct_answer_index);

        // Get player answers for this question
        const playerAnswers = [];
        for (const [userId, player] of gameState.players) {
          const playerAnswer = player.selectedAnswer || 'No Answer';
          const isCorrect = playerAnswer === correctAnswerLetter;
          playerAnswers.push(`${player.username}: ${playerAnswer} ${isCorrect ? '✅' : '❌'}`);
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

        await channel.send({
          embeds: [embed],
          content: i === 0 ? `${playerMentions} - Here's your detailed question review! 📚` : null
        });
      }

      this.logger.game(`Question review sent for game ${gameState.id}`);

    } catch (error) {
      this.logger.error('Error sending question review:', error);
    }
  }

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

  async showCountdown(channelId, interaction) {
    if (!this.client) {
      this.logger.error('Discord client not available for countdown');
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

  capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  get client() {
    return this._client;
  }

  set client(client) {
    this._client = client;
  }
}

// Simplified Command Handler for Cloudflare Workers
class CommandHandler {
  constructor(client, gameManager, apiService, logger) {
    this.client = client;
    this.gameManager = gameManager;
    this.apiService = apiService;
    this.logger = logger;
  }

  async handleCommand(interaction) {
    const commandName = interaction.commandName;

    this.logger.debug(`Handling command: ${commandName} from ${interaction.user.tag} (${interaction.user.id})`);

    try {
      if (commandName === 'trivia-solo') {
        await this.handleTriviaSolo(interaction);
      } else if (commandName === 'trivia-start') {
        await this.handleTriviaStart(interaction);
      } else if (commandName === 'trivia-join') {
        await this.handleTriviaJoin(interaction);
      } else if (commandName === 'trivia-quit') {
        await this.handleTriviaQuit(interaction);
      } else if (commandName === 'trivia-status') {
        await this.handleTriviaStatus(interaction);
      } else if (commandName === 'trivia-leaderboard') {
        await this.handleTriviaLeaderboard(interaction);
      } else if (commandName === 'help') {
        await this.handleHelp(interaction);
      }
    } catch (error) {
      this.logger.error(`Error executing command ${commandName}:`, error);
      await this.sendErrorMessage(interaction, 'Command Error', 'An error occurred while processing your command.');
    }
  }

  async handleTriviaSolo(interaction) {
    const difficulty = interaction.options.getString('difficulty');
    const questions = interaction.options.getInteger('questions') || 10;

    // Validate question count
    if (questions > 20 || questions < 5) {
      await this.sendErrorMessage(interaction, 'Invalid Question Count', 'Please choose between 5 and 20 questions.');
      return;
    }

    await interaction.deferReply();

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

      await interaction.editReply({ embeds: [embed] });
    } else {
      await this.sendErrorMessage(interaction, 'Failed to Start Solo Game', result.message);
    }
  }

  async handleTriviaStart(interaction) {
    const difficulty = interaction.options.getString('difficulty');
    const questions = interaction.options.getInteger('questions') || 10;

    // Validate question count
    if (questions > 20 || questions < 5) {
      await this.sendErrorMessage(interaction, 'Invalid Question Count', 'Please choose between 5 and 20 questions.');
      return;
    }

    await interaction.deferReply();

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

      // Add join button for other players
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
      await this.sendErrorMessage(interaction, 'Failed to Create Game', result.message);
    }
  }

  async handleTriviaJoin(interaction) {
    const userId = interaction.user.id;

    // Check if user is already in a game
    if (this.gameManager.playerGames.has(userId)) {
      await this.sendErrorMessage(interaction, 'Already in Game', 'You are already participating in a trivia game. Use `/trivia-quit` to leave your current game first.');
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
      await this.sendErrorMessage(interaction, 'Error', 'An error occurred while fetching available games. Please try again.');
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
      await this.sendErrorMessage(interaction, 'Join Error', 'Failed to join the selected game. It may no longer be available or is already full.');
    }
  }

  async handleTriviaQuit(interaction) {
    const userId = interaction.user.id;
    const result = await this.gameManager.quitGame(userId);

    const embed = new EmbedBuilder()
      .setColor(result.success ? 0x00FF00 : 0xFFA500)
      .setTitle(result.success ? '✅ Left Game' : '⚠️ Not in Game')
      .setDescription(result.message);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  async handleTriviaStatus(interaction) {
    const userId = interaction.user.id;
    const result = await this.gameManager.getPlayerStatus(userId);

    if (result.inGame) {
      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('📊 Your Game Status')
        .addFields(
          { name: 'Game ID', value: result.gameId, inline: true },
          { name: 'Status', value: result.gameStatus, inline: true },
          { name: 'Your Score', value: result.playerScore.toString(), inline: true },
          { name: 'Current Question', value: `${result.currentQuestion}/${result.totalQuestions}`, inline: true },
          { name: 'Difficulty', value: result.difficulty, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else {
      const embed = new EmbedBuilder()
        .setColor(0xFFA500)
        .setTitle('📊 Not in a Game')
        .setDescription('You are not currently participating in any trivia games.');

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }

  async handleTriviaLeaderboard(interaction) {
    try {
      const difficulty = interaction.options.getString('difficulty');
      const limit = interaction.options.getInteger('limit') || 10;

      const leaderboardResult = await this.apiService.getLeaderboard();

      if (leaderboardResult.success) {
        const embed = new EmbedBuilder()
          .setColor(0x0099FF)
          .setTitle('🏆 Bible Trivia Leaderboard')
          .setTimestamp();

        if (difficulty) {
          const difficultyData = leaderboardResult.leaderboard[difficulty];
          if (difficultyData && difficultyData.length > 0) {
            embed.setDescription(`**${this.capitalizeFirst(difficulty)} Difficulty**`);
            embed.addFields({
              name: 'Top Players',
              value: difficultyData.slice(0, limit).map((player, i) =>
                `${i + 1}. **${player.player_name}** - ${player.score} pts`
              ).join('\n'),
              inline: false
            });
          } else {
            embed.setDescription(`No scores available for ${difficulty} difficulty yet.`);
          }
        } else {
          embed.setDescription('**Overall Leaderboard**');
          const allPlayers = Object.values(leaderboardResult.leaderboard).flat();
          const topPlayers = allPlayers
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

          embed.addFields({
            name: 'Top Players',
            value: topPlayers.map((player, i) =>
              `${i + 1}. **${player.player_name}** - ${player.score} pts`
            ).join('\n'),
            inline: false
          });
        }

        await interaction.reply({ embeds: [embed] });
      } else {
        await this.sendErrorMessage(interaction, 'Failed to Load Leaderboard', 'Could not retrieve leaderboard data.');
      }
    } catch (error) {
      this.logger.error('Error in trivia-leaderboard command:', error);
      await this.sendErrorMessage(interaction, 'Error', 'Failed to load leaderboard data.');
    }
  }

  async handleHelp(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('📖 Bible Trivia Bot Help')
      .setDescription('Welcome to the GospelWays Bible Trivia Bot!')
      .addFields(
        {
          name: '🎮 Available Commands',
          value: [
            '`/trivia-solo` - Start a solo Bible trivia game',
            '`/trivia-start` - Create a multiplayer game',
            '`/trivia-join` - Join an existing game',
            '`/trivia-quit` - Leave your current game',
            '`/trivia-status` - Check your game status',
            '`/trivia-leaderboard` - View global leaderboard',
            '`/help` - Show this help message'
          ].join('\n'),
          inline: false
        },
        {
          name: '🎯 How to Play',
          value: [
            '• Answer questions by clicking the letter buttons (A, B, C, D)',
            '• You have limited time to answer each question',
            '• Points are awarded based on difficulty and speed',
            '• Review your answers after each game'
          ].join('\n'),
          inline: false
        },
        {
          name: '🏆 Difficulty Levels',
          value: [
            '• **Easy** - Basic Bible stories and facts',
            '• **Medium** - Bible context and understanding',
            '• **Hard** - Deep Scripture knowledge',
            '• **Expert** - Biblical languages and advanced concepts'
          ].join('\n'),
          inline: false
        }
      )
      .setFooter({ text: 'Powered by GospelWays' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }

  async sendErrorMessage(interaction, title, description) {
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle(`❌ ${title}`)
      .setDescription(description)
      .setTimestamp();

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [embed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      this.logger.error('Failed to send error message:', error);
    }
  }

  capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}

// Cloudflare Worker for Discord Bot
export default {
  async fetch(request, env) {
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

    // Initialize services
    const apiService = new APIService(env);
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
            await commandHandler.joinSpecificGame(interaction, parseInt(gameId));
          } else if (interaction.customId === 'join_quick') {
            await interaction.deferUpdate();
            const gamesResult = await apiService.getWaitingGames();
            if (gamesResult.success && gamesResult.games.length > 0) {
              const availableGames = gamesResult.games.filter(game => game.current_players < game.max_players);
              if (availableGames.length > 0) {
                await commandHandler.joinSpecificGame(interaction, availableGames[0].id);
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
