// AI Bible Question Generator 1 - Professional Grade
// Optimized for performance, reliability, and minimal database load
// API key is loaded from environment variables for security
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const AI_MODEL = 'x-ai/grok-4-fast:free';

// Window interface for DOM events
interface WindowInterface {
  dispatchEvent: (event: Event) => boolean;
}

declare const window: WindowInterface;

export interface BibleQuestion {
  text: string;
  correctAnswer: string;
  options: string[];
  reference: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  points: number;
  aiGenerated: boolean;
  uniqueId: string;
  questionType?: string;
  verseContext?: string;
}

export interface GenerationProgress {
  generated: number;
  total: number;
  isReady: boolean;
  errors: string[];
  retryCount: number;
}

export interface RetryModalOptions {
  showModal: boolean;
  title: string;
  message: string;
  canRetry: boolean;
  maxRetries: number;
  currentRetry: number;
}

export class AIBibleQuestionGenerator1 {
  private sessionId: number;
  private generatedQuestions: Map<string, number>;
  private generatedCount: number;
  private attemptCount: number;
  private maxAttempts: number;
  private apiKey: string;
  private usedBooks: Set<string>;
  private questionTypeHistory: string[];
  private creativitySeed: number;
  private verseUsageTracker: Map<string, number>;
  private globalVerseUsage: Map<string, number>;
  private usedVersesInBatch: Set<string>;
  private similarityCache: Map<string, Set<string>>;
  private generationProgress: GenerationProgress;
  private retryModal: RetryModalOptions;

  // Optimized delay configuration - reduced by 60-70% for faster generation
  private delayConfig: {
    baseQuestionDelay: number;
    retryBackoffMultiplier: number;
    maxRetryDelay: number;
    rateLimitDelay: number;
    parallelBatchSize: number;
    interBatchDelay: number;
    adaptiveDelay: boolean;
    minDelay: number;
    maxDelay: number;
  };

  // Performance tracking
  private performanceMetrics: {
    totalGenerationTime: number;
    averageQuestionTime: number;
    successRate: number;
    duplicateRate: number;
    apiCallCount: number;
    errorCount: number;
  };

  constructor(sessionId: number, apiKey: string) {
    this.sessionId = sessionId;
    this.apiKey = apiKey;
    this.generatedQuestions = new Map();
    this.generatedCount = 0;
    this.attemptCount = 0;
    this.maxAttempts = 40;
    this.usedBooks = new Set();
    this.questionTypeHistory = [];
    this.creativitySeed = Math.random() * 1000;
    this.verseUsageTracker = new Map();
    this.globalVerseUsage = new Map();
    this.usedVersesInBatch = new Set();
    this.similarityCache = new Map();

    this.generationProgress = {
      generated: 0,
      total: 0,
      isReady: false,
      errors: [],
      retryCount: 0
    };

    this.retryModal = {
      showModal: false,
      title: '',
      message: '',
      canRetry: true,
      maxRetries: 3,
      currentRetry: 0
    };

    this.performanceMetrics = {
      totalGenerationTime: 0,
      averageQuestionTime: 0,
      successRate: 0,
      duplicateRate: 0,
      apiCallCount: 0,
      errorCount: 0
    };

    // OPTIMIZED: Reduced delays by 60-70% for faster generation
    this.delayConfig = {
      baseQuestionDelay: parseInt(process.env.AI_QUESTION_BASE_DELAY || '250'), // Was 800, now 250
      retryBackoffMultiplier: parseFloat(process.env.AI_RETRY_BACKOFF_MULTIPLIER || '1.5'), // Was 1.8
      maxRetryDelay: parseInt(process.env.AI_MAX_RETRY_DELAY || '2000'), // Was 4000
      rateLimitDelay: parseInt(process.env.AI_RATE_LIMIT_DELAY || '1500'), // Was 2500
      parallelBatchSize: parseInt(process.env.AI_PARALLEL_BATCH_SIZE || '8'), // Was 5, now 8
      interBatchDelay: parseInt(process.env.AI_INTER_BATCH_DELAY || '100'), // Was 300
      adaptiveDelay: true,
      minDelay: 150, // Was 500
      maxDelay: 1500 // Was 3000
    };
  }

  async loadGlobalVerseUsage(): Promise<void> {
    try {
      // Import database functions dynamically
      const { getVerseUsageStats, getAllVerseUsage, cleanupOldVerseData } = await import('./database-neon');

      // Auto-cleanup: Remove verse usage data older than 3 days
      const cleanedCount = await cleanupOldVerseData(3);
      if (cleanedCount > 0) {
        console.log(`[Generator1] Auto-cleanup: Removed ${cleanedCount} verse usage records older than 3 days`);
      }

      // Load verse usage statistics
      const stats = await getVerseUsageStats();
      console.log(`[Generator1] Loaded recent verse usage: ${stats.totalVerses} verses used in last 3 days, ${stats.totalUsages} total usages`);

      // Load ALL verses from the database that have been used in generation (all recent verses before cleanup)
      const allUsedVerses = await getAllVerseUsage(10000); // Get all verses currently in database
      allUsedVerses.forEach(verse => {
        this.globalVerseUsage.set(verse.verse_reference, verse.frequency);
      });

      console.log(`[Generator1] Loaded ${this.globalVerseUsage.size} verses from database to avoid during question generation`);
    } catch (error) {
      console.error('[Generator1] Error loading verse usage from database:', error);
      // Continue without global data if loading fails
    }
  }

  private getVersePreferenceScore(verseReference: string): number {
    const globalFreq = this.globalVerseUsage.get(verseReference) || 0;
    const sessionFreq = this.verseUsageTracker.get(verseReference) || 0;
    const globalScore = Math.log(globalFreq + 1) * 2;
    const sessionScore = sessionFreq * 15;
    const batchScore = this.usedVersesInBatch.has(verseReference) ? 50 : 0;
    return globalScore + sessionScore + batchScore;
  }

  private selectBestVerseForQuestion(availableBooks: string[], difficulty: 'easy' | 'medium' | 'hard' | 'expert'): string {
    // AI THINKS FOR ITSELF: Dynamic book and verse selection using global verse usage data
    // RULE: Avoid ALL verses currently stored in database (all recent verses before auto-cleanup)
    // Database auto-cleans verses older than 3 days, so all stored verses are "recent"
    // Allow using any other verses in the Bible

    // Step 1: Filter books based on usage patterns and ensure variety
    const availableBooksFiltered = availableBooks.filter(book => {
      const bookUsageCount = Array.from(this.usedVersesInBatch).filter(verse =>
        verse.startsWith(book + ' ')
      ).length;
      const overuseRatio = bookUsageCount / this.usedVersesInBatch.size;
      return overuseRatio <= 0.25 || this.usedVersesInBatch.size < 4; // Max 25% per book
    });

    if (availableBooksFiltered.length === 0) {
      console.log('[Generator1] All available books overused, using fallback selection');
      availableBooksFiltered.push(...availableBooks);
    }

    // Step 2: AI decides which book to use based on difficulty and variety
    const selectedBook = this.selectBookIntelligently(availableBooksFiltered, difficulty);

    // Step 3: Generate verse candidates that have NOT been used in the last 3 days
    const maxAttempts = 20; // Try up to 20 times to find an available verse
    let attempts = 0;
    let selectedVerse: string | null = null;

    while (attempts < maxAttempts && !selectedVerse) {
      attempts++;
      let candidateVerse: string;

      if (attempts === 1) {
        candidateVerse = this.generateDynamicVerseReference(selectedBook, difficulty);
      } else {
        candidateVerse = this.generateAlternativeVerse(selectedBook, difficulty, attempts);
      }

      // Check if verse has been used in current batch (session duplicate)
      if (this.usedVersesInBatch.has(candidateVerse)) {
        continue; // Try another verse
      }

      // CRITICAL: Check if verse has been used recently (stored in database)
      // Database contains ALL verses used in recent generations before auto-cleanup
      const globalUsage = this.globalVerseUsage.get(candidateVerse);
      if (globalUsage && globalUsage > 0) {
        console.log(`[Generator1] Verse ${candidateVerse} has been used recently (${globalUsage} times), skipping`);
        continue; // This verse has been used recently, try another
      }

      // Verse is available! Use it
      selectedVerse = candidateVerse;
      console.log(`[Generator1] Found available verse after ${attempts} attempts: ${selectedVerse}`);
    }

    // If we couldn't find any available verses after many attempts, we have a problem
    if (!selectedVerse) {
      console.error(`[Generator1] CRITICAL: Could not find any available verses after ${maxAttempts} attempts in book ${selectedBook}`);
      console.error('[Generator1] This suggests most verses in this book have been used recently. Consider expanding to other books or waiting for cleanup.');

      // Emergency fallback: Use a verse but mark it as a problem
      selectedVerse = this.generateDynamicVerseReference(selectedBook, difficulty);
      console.error(`[Generator1] EMERGENCY FALLBACK: Using ${selectedVerse} despite recent usage`);
    }

    // Step 4: Track usage in current session and batch
    this.usedVersesInBatch.add(selectedVerse);
    this.verseUsageTracker.set(selectedVerse, (this.verseUsageTracker.get(selectedVerse) || 0) + 1);

    // CRITICAL FIX: Update global verse usage in real-time during batch generation
    // This prevents subsequent batches from selecting the same recently used verses
    // BUG FIX: Previously, global verse usage was only loaded once at the start,
    // causing subsequent batches to potentially reuse verses from earlier batches
    this.globalVerseUsage.set(selectedVerse, (this.globalVerseUsage.get(selectedVerse) || 0) + 1);

    console.log(`[Generator1] AI selected AVAILABLE verse: ${selectedVerse} from ${selectedBook} (difficulty: ${difficulty}) - Batch usage: ${this.usedVersesInBatch.size}`);
    return selectedVerse;
  }

  private selectBookIntelligently(availableBooks: string[], difficulty: 'easy' | 'medium' | 'hard' | 'expert'): string {
    // 50/50 Old Testament/New Testament distribution with AI freedom within each testament
    const newTestamentBooks = ['Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'];
    const oldTestamentBooks = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'];

    const ntCount = Array.from(this.usedVersesInBatch).filter(verse =>
      newTestamentBooks.some(book => verse.startsWith(book + ' '))
    ).length;

    const otCount = Array.from(this.usedVersesInBatch).filter(verse =>
      oldTestamentBooks.some(book => verse.startsWith(book + ' '))
    ).length;

    const totalUsed = this.usedVersesInBatch.size;
    const currentNtRatio = totalUsed > 0 ? ntCount / totalUsed : 0.5;

    // 50/50 distribution: Balance between Old and New Testament
    const shouldPrioritizeNT = currentNtRatio < 0.5 && totalUsed > 0;
    const shouldPrioritizeOT = currentNtRatio > 0.5 && totalUsed > 0;

    let candidateBooks = availableBooks;

    if (shouldPrioritizeNT) {
      const ntBooks = availableBooks.filter(book => newTestamentBooks.includes(book));
      if (ntBooks.length > 0) candidateBooks = ntBooks;
    } else if (shouldPrioritizeOT) {
      const otBooks = availableBooks.filter(book => oldTestamentBooks.includes(book));
      if (otBooks.length > 0) candidateBooks = otBooks;
    }

    const bookWeights = candidateBooks.map(book => {
      let weight = 1.0;

      // Only apply usage-based weighting to ensure variety within the current batch
      const bookUsage = Array.from(this.usedVersesInBatch).filter(verse =>
        verse.startsWith(book + ' ')
      ).length;

      // Slight preference for unused books to maintain variety
      if (bookUsage === 0) weight *= 1.2;
      else if (bookUsage > 3) weight *= 0.8; // Reduce weight for overused books in current batch

      return { book, weight };
    });

    const totalWeight = bookWeights.reduce((sum, b) => sum + b.weight, 0);
    let random = Math.random() * totalWeight;

    for (const bookWeight of bookWeights) {
      random -= bookWeight.weight;
      if (random <= 0) return bookWeight.book;
    }

    return candidateBooks[0] || 'Genesis';
  }

  private generateDynamicVerseReference(bookName: string, difficulty: 'easy' | 'medium' | 'hard' | 'expert'): string {
    const bookChapterInfo: { [key: string]: { chapters: number, versesPerChapter: number[] } } = {
      'Genesis': { chapters: 50, versesPerChapter: [31, 25, 24, 26, 32, 22, 24, 22, 29, 32, 32, 20, 18, 24, 21, 16, 27, 33, 38, 18, 34, 24, 20, 67, 34, 35, 46, 22, 35, 43, 55, 32, 20, 31, 29, 43, 36, 30, 23, 23, 57, 38, 34, 34, 28, 34, 31, 22, 33, 26] },
      'Exodus': { chapters: 40, versesPerChapter: [22, 25, 22, 31, 23, 30, 25, 32, 35, 29, 10, 51, 22, 31, 27, 36, 16, 27, 25, 26, 36, 31, 33, 18, 40, 37, 21, 43, 46, 38, 18, 35, 23, 35, 35, 38, 29, 31, 43, 38] },
      'Psalms': { chapters: 150, versesPerChapter: [6, 12, 8, 8, 12, 10, 17, 9, 20, 18, 7, 8, 6, 7, 5, 11, 15, 50, 14, 9, 13, 31, 6, 10, 22, 12, 14, 9, 11, 12, 24, 11, 22, 22, 28, 12, 40, 22, 13, 17, 13, 11, 5, 26, 17, 11, 9, 14, 20, 23, 19, 9, 6, 7, 23, 13, 11, 11, 17, 12, 8, 12, 11, 10, 13, 20, 7, 35, 36, 5, 24, 20, 28, 23, 10, 12, 20, 72, 13, 19, 16, 27, 15, 18, 14, 19, 21, 26, 18, 16, 17, 22, 23, 15, 17, 14, 14, 19, 17, 18, 8, 21, 18, 16, 18, 22, 11, 22, 17, 19, 12, 17, 17, 18, 17, 21, 14, 21, 22, 18, 16, 21, 8, 19, 15, 19, 21, 24, 17, 12, 14, 14, 18, 9, 21, 17, 18, 17, 19, 21, 5, 27, 14, 22, 18, 20, 21, 22, 18, 20, 19, 20, 24, 16, 18, 20, 22, 21, 20] },
      'Proverbs': { chapters: 31, versesPerChapter: [33, 22, 35, 27, 23, 35, 27, 36, 18, 32, 31, 28, 25, 35, 33, 33, 28, 24, 29, 30, 31, 29, 35, 34, 28, 28, 27, 28, 27, 33, 31] },
      'Matthew': { chapters: 28, versesPerChapter: [25, 23, 17, 25, 48, 34, 29, 34, 38, 42, 30, 50, 58, 36, 39, 28, 27, 35, 30, 34, 46, 46, 39, 51, 46, 75, 66, 20] },
      'Mark': { chapters: 16, versesPerChapter: [45, 28, 35, 41, 43, 56, 37, 38, 50, 52, 33, 44, 37, 72, 47, 20] },
      'Luke': { chapters: 24, versesPerChapter: [80, 52, 38, 44, 39, 49, 50, 56, 62, 42, 54, 59, 35, 35, 32, 31, 37, 43, 48, 47, 38, 71, 56, 53] },
      'John': { chapters: 21, versesPerChapter: [51, 25, 36, 54, 47, 71, 53, 59, 41, 42, 57, 50, 38, 31, 27, 33, 26, 40, 42, 31, 25] },
      'Acts': { chapters: 28, versesPerChapter: [26, 47, 26, 37, 42, 15, 60, 40, 43, 48, 30, 25, 52, 28, 41, 40, 34, 28, 41, 38, 40, 30, 35, 27, 27, 32, 44, 31] },
      'Romans': { chapters: 16, versesPerChapter: [32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33, 27] },
      '1 Corinthians': { chapters: 16, versesPerChapter: [31, 16, 23, 21, 13, 20, 40, 13, 27, 33, 34, 31, 13, 40, 58, 24] },
      '2 Corinthians': { chapters: 13, versesPerChapter: [24, 17, 18, 18, 21, 18, 16, 24, 15, 18, 33, 21, 14] },
      'Galatians': { chapters: 6, versesPerChapter: [24, 21, 29, 31, 26, 18] },
      'Ephesians': { chapters: 6, versesPerChapter: [23, 22, 21, 32, 33, 24] },
      'Philippians': { chapters: 4, versesPerChapter: [30, 30, 21, 23] },
      'Colossians': { chapters: 4, versesPerChapter: [29, 23, 25, 18] },
      '1 Thessalonians': { chapters: 5, versesPerChapter: [10, 20, 13, 18, 28] },
      '2 Thessalonians': { chapters: 3, versesPerChapter: [12, 17, 18] },
      '1 Timothy': { chapters: 6, versesPerChapter: [20, 15, 16, 16, 25, 21] },
      '2 Timothy': { chapters: 4, versesPerChapter: [18, 26, 17, 22] },
      'Titus': { chapters: 3, versesPerChapter: [16, 15, 15] },
      'Philemon': { chapters: 1, versesPerChapter: [25] },
      'Hebrews': { chapters: 13, versesPerChapter: [14, 18, 19, 16, 14, 20, 28, 13, 28, 39, 40, 29, 25] },
      'James': { chapters: 5, versesPerChapter: [27, 26, 18, 17, 20] },
      '1 Peter': { chapters: 5, versesPerChapter: [25, 25, 22, 19, 14] },
      '2 Peter': { chapters: 3, versesPerChapter: [21, 22, 18] },
      '1 John': { chapters: 5, versesPerChapter: [10, 29, 24, 21, 21] },
      '2 John': { chapters: 1, versesPerChapter: [13] },
      '3 John': { chapters: 1, versesPerChapter: [14] },
      'Jude': { chapters: 1, versesPerChapter: [25] },
      'Revelation': { chapters: 22, versesPerChapter: [20, 29, 22, 11, 14, 17, 17, 13, 21, 11, 19, 17, 18, 20, 8, 21, 18, 24, 21, 15, 27, 21] }
    };

    const bookInfo = bookChapterInfo[bookName];
    if (!bookInfo) {
      const chapter = Math.floor(Math.random() * 20) + 1;
      const verse = Math.floor(Math.random() * 30) + 1;
      return `${bookName} ${chapter}:${verse}`;
    }

    const chapterWeights = bookInfo.versesPerChapter.map((verses, index) => ({
      chapter: index + 1,
      verses,
      weight: Math.max(1, verses / 8) // Remove difficulty-based weighting
    }));

    const totalWeight = chapterWeights.reduce((sum, ch) => sum + ch.weight, 0);
    let random = Math.random() * totalWeight;

    let selectedChapter = 1;
    for (const ch of chapterWeights) {
      random -= ch.weight;
      if (random <= 0) {
        selectedChapter = ch.chapter;
        break;
      }
    }

    const maxVerses = bookInfo.versesPerChapter[selectedChapter - 1];
    const selectedVerse = Math.floor(Math.random() * maxVerses) + 1;

    return `${bookName} ${selectedChapter}:${selectedVerse}`;
  }


  private generateAlternativeVerse(bookName: string, difficulty: 'easy' | 'medium' | 'hard' | 'expert', attempt: number): string {
    return this.generateDynamicVerseReference(bookName, difficulty);
  }

  private generateEmergencyVerseReference(bookName: string, difficulty: 'easy' | 'medium' | 'hard' | 'expert'): string {
    const timestamp = Date.now();
    const chapter = ((timestamp % 50) + 1);
    const verse = ((timestamp % 30) + 1);
    return `${bookName} ${chapter}:${verse}`;
  }

  private isSimilarToExistingQuestions(verseReference: string): boolean {
    for (const existingVerse of this.usedVersesInBatch) {
      if (this.calculateVerseSimilarity(existingVerse, verseReference) > 0.8) {
        return true;
      }
    }
    return false;
  }

  private calculateVerseSimilarity(verse1: string, verse2: string): number {
    const parts1 = verse1.split(' ');
    const parts2 = verse2.split(' ');

    if (parts1[0] !== parts2[0]) return 0;

    const chapter1 = parseInt(parts1[1].split(':')[0]);
    const chapter2 = parseInt(parts2[1].split(':')[0]);

    const chapterDiff = Math.abs(chapter1 - chapter2);
    return Math.max(0, 1 - (chapterDiff / 10));
  }

  async generateQuestionBatch(difficulty: 'easy' | 'medium' | 'hard' | 'expert', count = 10, gameId?: number): Promise<BibleQuestion[]> {
    const questions: BibleQuestion[] = [];
    this.generatedCount = 0;
    this.attemptCount = 0;

    this.usedBooks.clear();
    this.questionTypeHistory = [];
    this.creativitySeed = Math.random() * 1000;
    this.usedVersesInBatch.clear();
    this.generationProgress = {
      generated: 0,
      total: count,
      isReady: false,
      errors: [],
      retryCount: 0
    };

    await this.loadGlobalVerseUsage();
    this.verseUsageTracker.clear();

    // OPTIMIZED: Check for existing questions to resume
    if (gameId) {
      const existingQuestions = await this.loadExistingQuestions(gameId);
      if (existingQuestions.length > 0) {
        console.log(`[Generator1] Resuming with ${existingQuestions.length} existing questions`);
        questions.push(...existingQuestions);
        this.generatedCount = existingQuestions.length;
        this.generationProgress.generated = existingQuestions.length;

        existingQuestions.forEach(q => {
          this.usedBooks.add(q.reference.split(' ')[0]);
          this.usedVersesInBatch.add(q.reference);
          this.verseUsageTracker.set(q.reference, (this.verseUsageTracker.get(q.reference) || 0) + 1);
          // CRITICAL FIX: Also update global verse usage for existing questions to prevent reuse
          // BUG FIX: Previously, existing questions were only added to session tracking but not global tracking,
          // allowing subsequent batches to potentially reuse verses from existing questions
          this.globalVerseUsage.set(q.reference, (this.globalVerseUsage.get(q.reference) || 0) + 1);
        });
      }
    }

    // OPTIMIZED: Increased parallel batch size from 5 to 8
    const parallelBatchSize = Math.min(this.delayConfig.parallelBatchSize, count);
    console.log(`[Generator1] Generating ${count} questions (${parallelBatchSize} parallel)`);

    // OPTIMIZED: Batch accumulator for database writes
    const batchAccumulator: BibleQuestion[] = [];
    const BATCH_SAVE_SIZE = 5;

    while (questions.length < count && this.attemptCount < this.maxAttempts) {
      this.attemptCount++;

      const questionPromises: Promise<BibleQuestion | null>[] = [];
      for (let i = 0; i < parallelBatchSize && questions.length + questionPromises.length < count; i++) {
        const questionNumber = questions.length + questionPromises.length + 1;
        const questionPromise = this.generateUniqueQuestion(difficulty, questionNumber, count, questions);
        questionPromises.push(questionPromise);
      }

      const batchResults = await Promise.all(questionPromises);

      for (const question of batchResults) {
        if (question && questions.length < count) {
          if (!this.isDuplicate(question, questions)) {
            questions.push(question);
            this.generatedQuestions.set(this.hashQuestion(question.text), (this.generatedQuestions.get(this.hashQuestion(question.text)) || 0) + 1);
            this.usedBooks.add(question.reference.split(' ')[0]);
            this.questionTypeHistory.push(question.text.split(' ')[0]);
            this.generatedCount++;
            this.generationProgress.generated = questions.length;

            // OPTIMIZED: Batch database saves
            if (gameId) {
              batchAccumulator.push(question);
              
              if (batchAccumulator.length >= BATCH_SAVE_SIZE) {
                await this.saveBatchToDatabase(gameId, [...batchAccumulator]);
                batchAccumulator.length = 0;
              }
            }
          }
        }
      }

      // OPTIMIZED: Reduced inter-batch delay from 300ms to 100ms
      if (questions.length < count) {
        const adaptiveDelay = this.calculateAdaptiveDelay();
        await this.delay(adaptiveDelay);
      }
    }

    // OPTIMIZED: Save remaining batch
    if (gameId && batchAccumulator.length > 0) {
      await this.saveBatchToDatabase(gameId, batchAccumulator);
    }

    if (questions.length < count) {
      const errorMsg = `Generated ${questions.length}/${count} questions`;
      console.error(`[Generator1] ${errorMsg}`);
      this.generationProgress.errors.push(errorMsg);
      throw new Error(errorMsg);
    }

    this.generationProgress.isReady = true;
    console.log(`[Generator1] Successfully generated ${questions.length} questions`);
    return questions;
  }

  // OPTIMIZED: New batch save method to reduce database calls
  private async saveBatchToDatabase(gameId: number, batch: BibleQuestion[]): Promise<void> {
    if (batch.length === 0) return;

    try {
      const { createBibleGameQuestions, recordVerseUsage } = await import('./database-neon');

      const baseQuestionNumber = this.generatedCount - batch.length + 1;
      const questionsData = batch.map((q, index) => ({
        questionText: q.text,
        correctAnswer: q.correctAnswer,
        options: q.options,
        bibleReference: q.reference,
        difficulty: q.difficulty,
        points: q.points,
        questionNumber: baseQuestionNumber + index
      }));

      await createBibleGameQuestions(gameId, questionsData);

      // Use batch verse usage recording to reduce database calls
      const { recordVerseUsageBatch } = await import('./database-neon');
      await recordVerseUsageBatch(batch.map(q => q.reference));

      console.log(`[Generator1] Batch saved: ${batch.length} questions`);
    } catch (error) {
      console.error('[Generator1] Batch save error:', error);
      this.generationProgress.errors.push(`Batch save failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private calculateAdaptiveDelay(): number {
    const baseDelay = this.delayConfig.interBatchDelay;
    const errorRate = this.performanceMetrics.errorCount / Math.max(1, this.performanceMetrics.apiCallCount);
    const duplicateRate = this.performanceMetrics.duplicateRate;
    const adaptiveDelay = baseDelay * (1 + errorRate * 2 + duplicateRate);
    return Math.max(this.delayConfig.minDelay, Math.min(this.delayConfig.maxDelay, adaptiveDelay));
  }

  private isDuplicate(newQuestion: BibleQuestion, existingQuestions: BibleQuestion[]): boolean {
    // Layer 1: Exact text match
    const exactMatch = existingQuestions.some(q =>
      q.text.toLowerCase().trim() === newQuestion.text.toLowerCase().trim()
    );
    if (exactMatch) return true;

    // Layer 2: Hash-based duplicates
    const questionHash = this.hashQuestion(newQuestion.text);
    const hashCount = this.generatedQuestions.get(questionHash) || 0;
    if (hashCount > 1) return true;

    // Layer 3: Verse reuse in batch
    if (this.usedVersesInBatch.has(newQuestion.reference)) return true;

    // Layer 4: Similarity detection
    const similarMatch = existingQuestions.some(q => {
      const similarity = this.calculateQuestionSimilarity(newQuestion, q);
      return similarity > 0.6;
    });
    if (similarMatch) return true;

    // Layer 5: Book overuse prevention
    const bookName = newQuestion.reference.split(' ')[0];
    const bookUsageCount = existingQuestions.filter(q =>
      q.reference.split(' ')[0] === bookName
    ).length;
    const overuseRatio = bookUsageCount / existingQuestions.length;
    if (overuseRatio > 0.25 && existingQuestions.length > 2) return true;

    return false;
  }

  private calculateQuestionSimilarity(q1: BibleQuestion, q2: BibleQuestion): number {
    const text1 = q1.text.toLowerCase();
    const text2 = q2.text.toLowerCase();

    const words1 = new Set(text1.split(' '));
    const words2 = new Set(text2.split(' '));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    const jaccardSimilarity = intersection.size / union.size;

    const sameBook = q1.reference.split(' ')[0] === q2.reference.split(' ')[0];
    const bookFactor = sameBook ? 0.3 : 0.1;

    const sameType = (q1.questionType || this.getQuestionType(q1.text)) === (q2.questionType || this.getQuestionType(q2.text));
    const typeFactor = sameType ? 0.2 : 0.1;

    return jaccardSimilarity + bookFactor + typeFactor;
  }

  private getQuestionType(questionText: string): string {
    const text = questionText.toLowerCase();
    if (text.includes('who')) return 'who';
    if (text.includes('what')) return 'what';
    if (text.includes('where')) return 'where';
    if (text.includes('when')) return 'when';
    if (text.includes('why')) return 'why';
    if (text.includes('how')) return 'how';
    if (text.includes('which')) return 'which';
    if (text.includes('how many')) return 'how_many';
    return 'other';
  }

  private async generateUniqueQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'expert', questionNumber: number, totalCount: number, existingQuestions: BibleQuestion[]): Promise<BibleQuestion | null> {
    const maxRetries = 5;
    const startTime = Date.now();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const randomSeed = Math.random();
        const prompt = this.createEnhancedBibleBasedPrompt(difficulty, questionNumber, randomSeed, totalCount, existingQuestions);

        // OPTIMIZED: Reduced delays
        if (attempt > 1) {
          const delay = Math.min(
            this.delayConfig.baseQuestionDelay * Math.pow(this.delayConfig.retryBackoffMultiplier, attempt - 1),
            this.delayConfig.maxRetryDelay
          );
          await this.delay(delay);
        } else if (this.generatedCount > 0) {
          const delay = this.delayConfig.baseQuestionDelay + Math.random() * 100;
          await this.delay(delay);
        }

        const difficultyParams = {
          easy: { temperature: 0.6, top_p: 0.85, max_tokens: 500 },
          medium: { temperature: 0.7, top_p: 0.9, max_tokens: 600 },
          hard: { temperature: 0.8, top_p: 0.95, max_tokens: 700 },
          expert: { temperature: 0.85, top_p: 0.95, max_tokens: 800 }
        };

        const params = difficultyParams[difficulty] || difficultyParams.easy;

        const response = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://faith-defenders.com',
            'X-Title': 'GospelWays Bible Trivia 1'
          },
          body: JSON.stringify({
            model: AI_MODEL,
            messages: [
              {
                role: 'system',
                content: `You are an advanced Bible expert AI. Generate ONLY objective, factual questions with ONE clear answer from Scripture. ALL answers must be verifiable biblical facts. Focus on: names, numbers, places, direct quotes, exact details. NO interpretation or opinion. Generate valid JSON only.`
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: params.temperature,
            max_tokens: params.max_tokens,
            top_p: params.top_p,
            frequency_penalty: 0.4,
            presence_penalty: 0.3
          })
        });

        this.performanceMetrics.apiCallCount++;

        if (response.status === 429) {
          console.error('[Generator1] Rate limited (429)');
          await this.delay(this.delayConfig.rateLimitDelay);
          continue;
        }

        if (!response.ok) {
          this.performanceMetrics.errorCount++;
          console.error('[Generator1] API error:', response.status);
          
          let smartDelay = this.delayConfig.baseQuestionDelay;
          if (response.status === 429) {
            smartDelay = this.delayConfig.rateLimitDelay;
          } else if (response.status >= 500) {
            smartDelay = this.delayConfig.baseQuestionDelay * 1.5;
          }
          
          await this.delay(smartDelay);
          continue;
        }

        const data: any = await response.json();

        if (data.error) {
          console.error('[Generator1] API error response:', data.error);
          this.performanceMetrics.errorCount++;
          continue;
        }

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          console.error('[Generator1] Invalid response structure');
          this.performanceMetrics.errorCount++;
          continue;
        }

        const choice = data.choices[0];
        if (choice.finish_reason === 'length') {
          console.error('[Generator1] Response truncated');
          continue;
        }

        const content = choice.message.content || '';
        if (!content || content.trim() === '') {
          console.error('[Generator1] Empty response');
          this.performanceMetrics.errorCount++;
          continue;
        }

        const question = this.parseEnhancedAIResponse(content, difficulty);

        if (question) {
          const generationTime = Date.now() - startTime;
          this.performanceMetrics.totalGenerationTime += generationTime;
          this.performanceMetrics.averageQuestionTime = this.performanceMetrics.totalGenerationTime / this.generatedCount;
          return question;
        }

        console.error(`[Generator1] Parse failed (attempt ${attempt}/${maxRetries})`);

      } catch (error) {
        console.error(`[Generator1] Error (attempt ${attempt}):`, error);
        this.performanceMetrics.errorCount++;
      }
    }

    console.error(`[Generator1] Failed after ${maxRetries} attempts`);
    return null;
  }

  private createEnhancedBibleBasedPrompt(difficulty: 'easy' | 'medium' | 'hard' | 'expert', questionNumber: number, seed: number, totalCount: number, existingQuestions: BibleQuestion[]): string {
    // 50/50 Old Testament/New Testament distribution with AI freedom within each testament
    const oldTestamentBooks = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'];
    const newTestamentBooks = ['Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'];

    const totalQuestions = totalCount || 10;
    const targetNTQuestions = Math.ceil(totalQuestions * 0.5); // 50% New Testament
    const targetOTQuestions = totalQuestions - targetNTQuestions; // 50% Old Testament

    const ntCount = existingQuestions.filter(q =>
      newTestamentBooks.includes(q.reference.split(' ')[0])
    ).length;
    const otCount = existingQuestions.filter(q =>
      oldTestamentBooks.includes(q.reference.split(' ')[0])
    ).length;

    const useNewTestament = ntCount < targetNTQuestions || (otCount >= targetOTQuestions && ntCount < targetNTQuestions);

    const availableBooks = useNewTestament ? newTestamentBooks : oldTestamentBooks;
    const selectedVerse = this.selectBestVerseForQuestion(availableBooks, difficulty);

    const questionTypes = {
      easy: ['who', 'what', 'where', 'how many', 'what happened', 'which person'],
      medium: ['why', 'what did', 'who said', 'what was', 'how did', 'when did'],
      hard: ['what does this mean', 'why did', 'what was the result', 'what can we learn', 'how does this relate', 'what happened next'],
      expert: ['what is the significance', 'how does this compare', 'what theological concept', 'what does the original language reveal', 'what is the deeper meaning', 'what is the context']
    };

    const difficultyQuestionTypes = questionTypes[difficulty] || questionTypes.easy;
    const questionType = difficultyQuestionTypes[Math.floor((seed * 100) % difficultyQuestionTypes.length)];

    const difficultyPrompts = {
      easy: `EASY: Simple factual Bible question with ONE clear answer from Scripture. Basic facts only.
Examples: "Who built the ark?", "What did David use to defeat Goliath?", "Where was Jesus born?"
Requirements: ONE correct answer explicitly stated in biblical text. Simple fact: name, number, place, or direct quote. No interpretation.`,

      medium: `MEDIUM: Bible question requiring context with ONE clear answer from Scripture.
Examples: "What was Paul's occupation?", "Where was Jesus born?", "What did Jesus say about the Sabbath?"
Requirements: ONE correct answer verified from biblical text. Based on clear biblical facts or direct statements.`,

      hard: `HARD: Challenging Bible question requiring specific passage knowledge with ONE clear answer.
Examples: "What were the names of the three Hebrew men in the fiery furnace?", "What was the exact wording of the Great Commission?"
Requirements: ONE correct answer explicitly stated in Scripture. Based on careful reading of specific passages.`,

      expert: `EXPERT: Advanced Bible question requiring detailed Scripture knowledge with ONE clear answer.
Examples: "What are the exact words of the Lord's Prayer?", "What does 'Abba' mean in Aramaic?"
Requirements: ONE correct answer precisely verified from Scripture. Based on exact biblical wording or specific counts.`
    };

    const difficultyInstruction = difficultyPrompts[difficulty] || difficultyPrompts.easy;

    const testamentInfo = useNewTestament ? 'NEW TESTAMENT' : 'OLD TESTAMENT';

    return `${difficultyInstruction}

AI DECISION: You have freedom to choose from books within the ${testamentInfo} and think for yourself about which verses to use.
TESTAMENT DISTRIBUTION: System maintains 50/50 balance between Old Testament and New Testament
VERSE AVOIDANCE: System avoids ALL verses currently stored in database (recently used verses before auto-cleanup)
AUTO-CLEANUP: Database automatically removes verse usage data older than 3 days
DIFFICULTY LEVEL: ${difficulty}
QUESTION TYPE: ${questionType}
VARIETY SEED: ${seed}

Generate a Bible question as a valid JSON object.

Format: {"question": "Question text here?", "correct": "Correct answer", "wrong1": "Wrong answer 1", "wrong2": "Wrong answer 2", "wrong3": "Wrong answer 3", "reference": "Book Chapter:Verse"}

Requirements:
- You have freedom to choose from books within the ${testamentInfo} selected by the system
- System maintains balanced 50/50 Old Testament/New Testament distribution
- All answers must be different and plausible
- Correct answer must be OBJECTIVELY TRUE and directly verifiable from Scripture
- Answer must be a simple fact: name, number, place, direct quote, or exact detail
- NO interpretation, opinion, or subjective questions
- Reference must include specific book, chapter, and verse
- Question type: ${questionType}
- Difficulty: ${difficulty}
- Make unique with seed: ${seed}
- Be creative but stay true to biblical text
- Avoid repeating common questions
- Think for yourself about interesting biblical facts from the ${testamentInfo}
- System will automatically avoid all verses currently in database (recently used before auto-cleanup)
- Database auto-cleans verse usage data older than 3 days, allowing verse reuse after cleanup

Output ONLY the JSON object, no other text.`;
  }

  private parseEnhancedAIResponse(content: string, difficulty: 'easy' | 'medium' | 'hard' | 'expert'): BibleQuestion | null {
    try {
      let cleanContent = content.trim();
      cleanContent = cleanContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

      const startIndex = cleanContent.indexOf('{');
      const lastIndex = cleanContent.lastIndexOf('}');

      if (startIndex === -1 || lastIndex === -1 || startIndex >= lastIndex) {
        console.error('[Generator1] No valid JSON found');
        return null;
      }

      let jsonStr = cleanContent.substring(startIndex, lastIndex + 1);
      jsonStr = jsonStr.replace(/([^\\])\\"/g, '$1"');
      jsonStr = jsonStr.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match, content) => {
        const escaped = content.replace(/([^\\])"/g, '$1\\"');
        return `"${escaped}"`;
      });

      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('[Generator1] JSON parse error:', parseError);
        return null;
      }

      if (!parsed.question || !parsed.correct) {
        console.error('[Generator1] Missing required fields');
        return null;
      }

      const options = [parsed.correct];
      if (parsed.wrong1) options.push(parsed.wrong1);
      if (parsed.wrong2) options.push(parsed.wrong2);
      if (parsed.wrong3) options.push(parsed.wrong3);

      if (options.length < 2) {
        console.error('[Generator1] Not enough options');
        return null;
      }

      const uniqueOptions = Array.from(new Set(options));
      const shuffled = this.shuffleArray(uniqueOptions);

      const question: BibleQuestion = {
        text: parsed.question,
        correctAnswer: parsed.correct,
        options: shuffled,
        reference: parsed.reference || 'Scripture',
        difficulty: difficulty,
        points: this.getPointsForDifficulty(difficulty),
        aiGenerated: true,
        uniqueId: `${this.sessionId}-${Date.now()}-${Math.random()}`,
        questionType: this.getQuestionType(parsed.question)
      };

      return question;

    } catch (error) {
      console.error('[Generator1] Parse error:', error);
      return null;
    }
  }

  private hashQuestion(text: string): string {
    let hash = 0;
    const str = text.toLowerCase().trim();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `${this.sessionId}-${hash}`;
  }

  private shuffleArray(array: string[]): string[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getPointsForDifficulty(difficulty: 'easy' | 'medium' | 'hard' | 'expert'): number {
    const points = { 'easy': 10, 'medium': 20, 'hard': 30, 'expert': 50 };
    return points[difficulty] || 10;
  }

  private async loadExistingQuestions(gameId: number): Promise<BibleQuestion[]> {
    try {
      const { getBibleGameQuestions } = await import('./database-neon');
      const existingQuestions = await getBibleGameQuestions(gameId);

      if (existingQuestions.length > 0) {
        return existingQuestions.map((q: any) => ({
          id: q.id,
          text: q.question_text,
          correctAnswer: q.correct_answer,
          options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]'),
          reference: q.bible_reference,
          difficulty: q.difficulty,
          points: q.points,
          aiGenerated: q.ai_generated,
          questionNumber: q.question_number,
          uniqueId: `server-${q.id}`
        }));
      }

      return [];
    } catch (error) {
      console.error('[Generator1] Error loading existing questions:', error);
      return [];
    }
  }

  showRetryModal(error: string, canRetry: boolean = true): void {
    this.retryModal.showModal = true;
    this.retryModal.title = 'Question Generation Error';
    this.retryModal.message = error;
    this.retryModal.canRetry = canRetry;
    this.retryModal.currentRetry++;

    window.dispatchEvent(new CustomEvent('generatorRetryModal', {
      detail: this.retryModal
    }));
  }

  hideRetryModal(): void {
    this.retryModal.showModal = false;
    window.dispatchEvent(new CustomEvent('generatorRetryModal', {
      detail: this.retryModal
    }));
  }

  async retryGeneration(): Promise<boolean> {
    if (this.retryModal.currentRetry >= this.retryModal.maxRetries) {
      this.showRetryModal('Maximum retry attempts reached', false);
      return false;
    }

    this.generationProgress.retryCount++;
    this.hideRetryModal();
    return true;
  }

  getPerformanceMetrics(): typeof this.performanceMetrics {
    return { ...this.performanceMetrics };
  }

  getGenerationProgress(): GenerationProgress {
    return { ...this.generationProgress };
  }

  cleanup(): void {
    this.generatedQuestions.clear();
    this.usedBooks.clear();
    this.questionTypeHistory = [];
    this.verseUsageTracker.clear();
    this.usedVersesInBatch.clear();
    this.similarityCache.clear();
    this.generationProgress.errors = [];
    this.performanceMetrics = {
      totalGenerationTime: 0,
      averageQuestionTime: 0,
      successRate: 0,
      duplicateRate: 0,
      apiCallCount: 0,
      errorCount: 0
    };
  }
}

export async function cleanupOldVerseUsageData(daysOld: number = 3): Promise<number> {
  try {
    const { cleanupOldVerseData } = await import('./database-neon');
    const deletedCount = await cleanupOldVerseData(daysOld);
    console.log(`[Generator1] Cleanup: Removed ${deletedCount} records older than ${daysOld} days`);
    return deletedCount;
  } catch (error) {
    console.error('[Generator1] Cleanup error:', error);
    return 0;
  }
}