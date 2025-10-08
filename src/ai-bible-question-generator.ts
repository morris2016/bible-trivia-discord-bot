// AI Bible Question Generator - Extracted from HTML for backend use
// API key is now loaded from environment variables for security
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
// Free Grok model - optimized for better JSON generation
const AI_MODEL = 'x-ai/grok-4-fast:free';

export interface BibleQuestion {
  text: string;
  correctAnswer: string;
  options: string[];
  reference: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  points: number;
  aiGenerated: boolean;
  uniqueId: string;
}

export class AIBibleQuestionGenerator {
  private sessionId: number;
  private generatedQuestions: Set<string>;
  private generatedCount: number;
  private attemptCount: number;
  private maxAttempts: number;
  private apiKey: string;
  private usedBooks: Set<string>;
  private questionTypeHistory: string[];
  private creativitySeed: number;
  private verseUsageTracker: Map<string, number>; // Track verse usage in current session
  private globalVerseUsage: Map<string, number>; // Track global verse usage
  private usedVersesInBatch: Set<string>; // Track verses used in current question batch

  // Optimized delay configuration
  private delayConfig: {
    baseQuestionDelay: number;
    retryBackoffMultiplier: number;
    maxRetryDelay: number;
    rateLimitDelay: number;
    parallelBatchSize: number;
    interBatchDelay: number;
  };

  constructor(sessionId: number, apiKey: string) {
    this.sessionId = sessionId;
    this.apiKey = apiKey;
    this.generatedQuestions = new Set();
    this.generatedCount = 0;
    this.attemptCount = 0;
    this.maxAttempts = 30; // Maximum attempts to prevent infinite loops
    this.usedBooks = new Set();
    this.questionTypeHistory = [];
    this.creativitySeed = Math.random() * 1000;
    this.verseUsageTracker = new Map();
    this.globalVerseUsage = new Map();
    this.usedVersesInBatch = new Set();

    // Optimized delay configuration - configurable via environment variables
    this.delayConfig = {
      baseQuestionDelay: parseInt(process.env.AI_QUESTION_BASE_DELAY || '1000'), // 1 second base
      retryBackoffMultiplier: parseFloat(process.env.AI_RETRY_BACKOFF_MULTIPLIER || '2'), // 2x multiplier
      maxRetryDelay: parseInt(process.env.AI_MAX_RETRY_DELAY || '5000'), // 5 seconds max
      rateLimitDelay: parseInt(process.env.AI_RATE_LIMIT_DELAY || '3000'), // 3 seconds for 429
      parallelBatchSize: parseInt(process.env.AI_PARALLEL_BATCH_SIZE || '3'), // 3 questions in parallel
      interBatchDelay: parseInt(process.env.AI_INTER_BATCH_DELAY || '500') // 0.5 seconds between batches
    };
  }

  async loadGlobalVerseUsage(): Promise<void> {
    try {
      // Import database functions dynamically
      const { getVerseUsageStats, getAllVerseUsage } = await import('./database-neon');

      // Load verse usage statistics
      const stats = await getVerseUsageStats();
      console.log(`Loaded recent verse usage: ${stats.totalVerses} verses used in last 5 days, ${stats.totalUsages} total usages`);

      // Load ALL verses from the JSON/database that have been used in the last 5 days
      const allUsedVerses = await getAllVerseUsage(10000); // Get all verses from database
      allUsedVerses.forEach(verse => {
        this.globalVerseUsage.set(verse.verse_reference, verse.frequency);
      });

      console.log(`Loaded ${this.globalVerseUsage.size} verses from JSON to avoid`);
    } catch (error) {
      console.error('Error loading verse usage from JSON:', error);
      // Continue without global data if loading fails
    }
  }

  private getVersePreferenceScore(verseReference: string): number {
    const globalFreq = this.globalVerseUsage.get(verseReference) || 1;
    const sessionFreq = this.verseUsageTracker.get(verseReference) || 0;

    // Prefer verses with lower global frequency and no session usage
    // Score is lower for more preferred verses
    const globalScore = Math.log(globalFreq + 1); // Logarithmic scaling
    const sessionScore = sessionFreq * 10; // Heavy penalty for session reuse

    return globalScore + sessionScore;
  }

  private selectBestVerseForQuestion(availableBooks: string[], difficulty: 'easy' | 'medium' | 'hard' | 'expert'): string {
    // AI THINKS FOR ITSELF: Dynamic book and verse selection using global verse usage data
    // RULE: Avoid verses that have been used in the last 5 days (stored in JSON/database)
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
      console.log('All available books overused, using fallback selection');
      availableBooksFiltered.push(...availableBooks);
    }

    // Step 2: AI decides which book to use based on difficulty and variety
    const selectedBook = this.selectBookIntelligently(availableBooksFiltered, difficulty);

    // Step 3: Generate verse candidates that have NOT been used in the last 5 days
    const maxAttempts = 20; // Try up to 20 times to find an available verse
    let attempts = 0;
    let selectedVerse: string | null = null;

    while (attempts < maxAttempts && !selectedVerse) {
      attempts++;
      let candidateVerse: string;

      if (attempts === 1) {
        candidateVerse = this.generateDynamicVerseReference(selectedBook, difficulty);
      } else {
        candidateVerse = this.generateAlternativeVerse(selectedBook, difficulty);
      }

      // Check if verse has been used in current batch (session duplicate)
      if (this.usedVersesInBatch.has(candidateVerse)) {
        continue; // Try another verse
      }

      // CRITICAL: Check if verse has been used in the last 5 days (stored in JSON)
      const globalUsage = this.globalVerseUsage.get(candidateVerse);
      if (globalUsage && globalUsage > 0) {
        console.log(`Verse ${candidateVerse} has been used in last 5 days (${globalUsage} times), skipping`);
        continue; // This verse has been used recently, try another
      }

      // Verse is available! Use it
      selectedVerse = candidateVerse;
      console.log(`Found available verse after ${attempts} attempts: ${selectedVerse}`);
    }

    // If we couldn't find any available verses after many attempts, we have a problem
    if (!selectedVerse) {
      console.error(`CRITICAL: Could not find any available verses after ${maxAttempts} attempts in book ${selectedBook}`);
      console.error('This suggests most verses in this book have been used recently. Consider expanding to other books or waiting for cleanup.');

      // Emergency fallback: Use a verse but mark it as a problem
      selectedVerse = this.generateDynamicVerseReference(selectedBook, difficulty);
      console.error(`EMERGENCY FALLBACK: Using ${selectedVerse} despite recent usage`);
    }

    // Step 4: Track usage in current session and batch
    this.usedVersesInBatch.add(selectedVerse);
    this.verseUsageTracker.set(selectedVerse, (this.verseUsageTracker.get(selectedVerse) || 0) + 1);

    console.log(`AI selected AVAILABLE verse: ${selectedVerse} from ${selectedBook} (difficulty: ${difficulty}) - Batch usage: ${this.usedVersesInBatch.size}/${this.getBatchVerseUsageSummary().totalAvailable || '∞'}`);
    return selectedVerse;
  }

  private selectBookIntelligently(availableBooks: string[], difficulty: 'easy' | 'medium' | 'hard' | 'expert'): string {
    // AI makes intelligent decisions about which book to use
    // Based on difficulty, variety, and previous usage patterns

    const newTestamentBooks = ['Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'];
    const oldTestamentBooks = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'];

    // Calculate current testament distribution in this batch
    const ntCount = Array.from(this.usedVersesInBatch).filter(verse =>
      newTestamentBooks.some(book => verse.startsWith(book + ' '))
    ).length;

    const otCount = Array.from(this.usedVersesInBatch).filter(verse =>
      oldTestamentBooks.some(book => verse.startsWith(book + ' '))
    ).length;

    const totalUsed = this.usedVersesInBatch.size;
    const currentNtRatio = totalUsed > 0 ? ntCount / totalUsed : 0;

    // Apply 60% New Testament rule: if we're below 60% NT, prioritize NT books
    const shouldPrioritizeNT = currentNtRatio < 0.6 && totalUsed > 0;

    let candidateBooks = availableBooks;

    if (shouldPrioritizeNT) {
      // Prioritize New Testament books to reach 60% target
      const ntBooks = availableBooks.filter(book => newTestamentBooks.includes(book));
      if (ntBooks.length > 0) {
        candidateBooks = ntBooks;
        console.log(`Prioritizing NT books to reach 60% target (current: ${(currentNtRatio * 100).toFixed(1)}%)`);
      }
    }

    // Select book based on difficulty preferences and variety
    const bookWeights = candidateBooks.map(book => {
      let weight = 1.0;

      // Difficulty-based preferences
      switch (difficulty) {
        case 'easy':
          // Easy questions: prefer narrative books
          if (['Genesis', 'Exodus', 'Matthew', 'Mark', 'Luke', 'John'].includes(book)) weight *= 1.5;
          break;
        case 'medium':
          // Medium questions: prefer teaching books
          if (['Psalms', 'Proverbs', 'Romans', 'Ephesians', 'James'].includes(book)) weight *= 1.3;
          break;
        case 'hard':
          // Hard questions: prefer prophetic and wisdom books
          if (['Isaiah', 'Jeremiah', 'Ezekiel', 'Hebrews', 'Revelation'].includes(book)) weight *= 1.4;
          break;
        case 'expert':
          // Expert questions: prefer complex theological books
          if (['Job', 'Ecclesiastes', 'Romans', 'Hebrews', 'Revelation'].includes(book)) weight *= 1.6;
          break;
      }

      // Variety bonus: slightly prefer less used books
      const bookUsage = Array.from(this.usedVersesInBatch).filter(verse =>
        verse.startsWith(book + ' ')
      ).length;

      if (bookUsage === 0) weight *= 1.2; // Bonus for unused books

      return { book, weight };
    });

    // Select book using weighted random selection
    const totalWeight = bookWeights.reduce((sum, b) => sum + b.weight, 0);
    let random = Math.random() * totalWeight;

    for (const bookWeight of bookWeights) {
      random -= bookWeight.weight;
      if (random <= 0) {
        console.log(`AI selected book: ${bookWeight.book} (weight: ${bookWeight.weight.toFixed(2)}, total weight: ${totalWeight.toFixed(2)})`);
        return bookWeight.book;
      }
    }

    // Fallback to first book if something goes wrong
    return candidateBooks[0];
  }

  private generateDynamicVerseReference(bookName: string, difficulty: 'easy' | 'medium' | 'hard' | 'expert'): string {
    // COMPLETE BIBLE VERSE DATABASE - All 31,102 verses across all 66 books
    // This ensures the AI can access ANY verse in the entire Bible
    // Generates valid verse references for any book in the canonical Bible

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
      // Fallback for books not in our detailed list
      const chapter = Math.floor(Math.random() * 20) + 1;
      const verse = Math.floor(Math.random() * 30) + 1;
      return `${bookName} ${chapter}:${verse}`;
    }

    // Select a random chapter (weighted towards earlier chapters for most books)
    const chapterWeights = bookInfo.versesPerChapter.map((verses, index) => ({
      chapter: index + 1,
      verses,
      weight: Math.max(1, verses / 10) // Weight based on verses in chapter
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

    // Select a random verse from the chosen chapter
    const maxVerses = bookInfo.versesPerChapter[selectedChapter - 1];
    const selectedVerse = Math.floor(Math.random() * maxVerses) + 1;

    return `${bookName} ${selectedChapter}:${selectedVerse}`;
  }

  private generateAlternativeVerse(bookName: string, difficulty: 'easy' | 'medium' | 'hard' | 'expert'): string {
    // Generate a different verse from the same book
    // COMPLETE BIBLE VERSE DATABASE - All 31,102 verses across all 66 books
    // This ensures the AI can access ANY verse in the entire Bible
    const bookChapterInfo: { [key: string]: { chapters: number, versesPerChapter: number[] } } = {
      // OLD TESTAMENT - Complete verse structures for all 39 books
      'Genesis': { chapters: 50, versesPerChapter: [31, 25, 24, 26, 32, 22, 24, 22, 29, 32, 32, 20, 18, 24, 21, 16, 27, 33, 38, 18, 34, 24, 20, 67, 34, 35, 46, 22, 35, 43, 55, 32, 20, 31, 29, 43, 36, 30, 23, 23, 57, 38, 34, 34, 28, 34, 31, 22, 33, 26] },
      'Exodus': { chapters: 40, versesPerChapter: [22, 25, 22, 31, 23, 30, 25, 32, 35, 29, 10, 51, 22, 31, 27, 36, 16, 27, 25, 26, 36, 31, 33, 18, 40, 37, 21, 43, 46, 38, 18, 35, 23, 35, 35, 38, 29, 31, 43, 38] },
      'Leviticus': { chapters: 27, versesPerChapter: [17, 16, 17, 35, 26, 23, 38, 36, 24, 20, 47, 8, 59, 57, 33, 34, 16, 30, 37, 27, 24, 33, 44, 23, 55, 46, 34] },
      'Numbers': { chapters: 36, versesPerChapter: [54, 34, 51, 49, 31, 27, 89, 26, 23, 36, 35, 16, 33, 45, 41, 50, 13, 32, 22, 29, 35, 41, 30, 25, 18, 65, 23, 31, 40, 16, 54, 42, 56, 29, 34, 13] },
      'Deuteronomy': { chapters: 34, versesPerChapter: [46, 37, 29, 49, 33, 25, 26, 20, 29, 22, 32, 32, 18, 29, 23, 22, 20, 22, 21, 20, 23, 30, 25, 22, 19, 19, 26, 68, 29, 20, 30, 52, 29, 12] },
      'Joshua': { chapters: 24, versesPerChapter: [18, 24, 17, 24, 15, 27, 26, 35, 27, 43, 23, 24, 33, 15, 63, 10, 18, 28, 51, 9, 45, 34, 16, 33] },
      'Judges': { chapters: 21, versesPerChapter: [36, 23, 31, 24, 31, 40, 25, 35, 57, 18, 40, 15, 25, 20, 20, 31, 13, 31, 30, 48, 25] },
      'Ruth': { chapters: 4, versesPerChapter: [22, 23, 18, 22] },
      '1 Samuel': { chapters: 31, versesPerChapter: [28, 36, 21, 22, 12, 21, 17, 22, 27, 27, 15, 25, 23, 52, 35, 23, 58, 30, 24, 42, 15, 23, 29, 22, 44, 25, 12, 25, 11, 31, 13] },
      '2 Samuel': { chapters: 24, versesPerChapter: [27, 32, 39, 12, 25, 23, 29, 18, 13, 19, 27, 31, 39, 33, 37, 23, 29, 33, 43, 26, 22, 51, 39, 25] },
      '1 Kings': { chapters: 22, versesPerChapter: [53, 46, 28, 34, 18, 38, 51, 66, 28, 29, 43, 33, 34, 31, 34, 34, 24, 46, 21, 43, 29, 53] },
      '2 Kings': { chapters: 25, versesPerChapter: [18, 25, 27, 44, 27, 33, 20, 29, 37, 36, 21, 21, 25, 29, 38, 20, 41, 37, 37, 21, 26, 20, 37, 20, 30] },
      '1 Chronicles': { chapters: 29, versesPerChapter: [54, 55, 24, 43, 26, 81, 40, 40, 44, 14, 47, 40, 14, 17, 29, 43, 27, 17, 19, 8, 30, 19, 32, 31, 31, 32, 34, 21, 30] },
      '2 Chronicles': { chapters: 36, versesPerChapter: [17, 18, 17, 22, 14, 42, 22, 18, 31, 19, 23, 16, 22, 15, 19, 14, 19, 34, 11, 37, 20, 12, 21, 27, 28, 23, 9, 27, 36, 27, 21, 33, 25, 33, 27, 23] },
      'Ezra': { chapters: 10, versesPerChapter: [11, 70, 13, 24, 17, 22, 28, 36, 15, 44] },
      'Nehemiah': { chapters: 13, versesPerChapter: [11, 20, 32, 23, 19, 19, 73, 18, 38, 39, 36, 47, 31] },
      'Esther': { chapters: 10, versesPerChapter: [22, 23, 15, 17, 14, 14, 10, 17, 32, 3] },
      'Job': { chapters: 42, versesPerChapter: [22, 13, 26, 21, 27, 30, 21, 22, 35, 22, 20, 25, 28, 22, 35, 22, 16, 21, 29, 29, 34, 30, 17, 25, 6, 14, 23, 28, 25, 31, 40, 22, 33, 37, 16, 33, 24, 41, 30, 24, 34, 17] },
      'Psalms': { chapters: 150, versesPerChapter: [6, 12, 8, 8, 12, 10, 17, 9, 20, 18, 7, 8, 6, 7, 5, 11, 15, 50, 14, 9, 13, 31, 6, 10, 22, 12, 14, 9, 11, 12, 24, 11, 22, 22, 28, 12, 40, 22, 13, 17, 13, 11, 5, 26, 17, 11, 9, 14, 20, 23, 19, 9, 6, 7, 23, 13, 11, 11, 17, 12, 8, 12, 11, 10, 13, 20, 7, 35, 36, 5, 24, 20, 28, 23, 10, 12, 20, 72, 13, 19, 16, 27, 15, 18, 14, 19, 21, 26, 18, 16, 17, 22, 23, 15, 17, 14, 14, 19, 17, 18, 8, 21, 18, 16, 18, 22, 11, 22, 17, 19, 12, 17, 17, 18, 17, 21, 14, 21, 22, 18, 16, 21, 8, 19, 15, 19, 21, 24, 17, 12, 14, 14, 18, 9, 21, 17, 18, 17, 19, 21, 5, 27, 14, 22, 18, 20, 21, 22, 18, 20, 19, 20, 24, 16, 18, 20, 22, 21, 20] },
      'Proverbs': { chapters: 31, versesPerChapter: [33, 22, 35, 27, 23, 35, 27, 36, 18, 32, 31, 28, 25, 35, 33, 33, 28, 24, 29, 30, 31, 29, 35, 34, 28, 28, 27, 28, 27, 33, 31] },
      'Ecclesiastes': { chapters: 12, versesPerChapter: [18, 26, 22, 16, 20, 12, 29, 17, 18, 20, 10, 14] },
      'Song of Solomon': { chapters: 8, versesPerChapter: [17, 17, 11, 16, 16, 13, 13, 14] },
      'Isaiah': { chapters: 66, versesPerChapter: [31, 22, 26, 6, 30, 13, 25, 22, 21, 34, 16, 6, 22, 32, 9, 14, 14, 7, 25, 6, 17, 25, 18, 23, 12, 21, 13, 29, 24, 33, 9, 20, 24, 17, 10, 22, 38, 22, 8, 31, 29, 25, 28, 28, 25, 13, 15, 22, 26, 11, 23, 15, 12, 17, 13, 12, 21, 14, 21, 22, 11, 12, 19, 12, 25, 24] },
      'Jeremiah': { chapters: 52, versesPerChapter: [19, 37, 25, 31, 31, 30, 34, 22, 26, 25, 23, 17, 27, 22, 21, 21, 27, 23, 15, 18, 14, 30, 40, 10, 38, 24, 22, 17, 32, 24, 40, 44, 26, 22, 19, 32, 21, 28, 18, 16, 18, 22, 13, 30, 5, 28, 7, 47, 39, 46, 64, 34] },
      'Lamentations': { chapters: 5, versesPerChapter: [22, 22, 66, 22, 22] },
      'Ezekiel': { chapters: 48, versesPerChapter: [28, 10, 27, 17, 17, 14, 27, 18, 11, 22, 25, 28, 23, 23, 8, 63, 24, 32, 14, 49, 32, 31, 49, 27, 17, 21, 36, 26, 21, 26, 18, 32, 33, 31, 15, 38, 28, 23, 29, 49, 26, 20, 27, 31, 25, 24, 23, 35] },
      'Daniel': { chapters: 12, versesPerChapter: [21, 49, 30, 37, 31, 28, 28, 27, 27, 21, 45, 13] },
      'Hosea': { chapters: 14, versesPerChapter: [11, 23, 5, 19, 15, 11, 16, 14, 17, 15, 12, 14, 16, 9] },
      'Joel': { chapters: 3, versesPerChapter: [20, 32, 21] },
      'Amos': { chapters: 9, versesPerChapter: [15, 16, 15, 13, 27, 14, 17, 14, 15, 15] },
      'Obadiah': { chapters: 1, versesPerChapter: [21] },
      'Jonah': { chapters: 4, versesPerChapter: [17, 10, 10, 11] },
      'Micah': { chapters: 7, versesPerChapter: [16, 13, 12, 13, 15, 14, 14, 16] },
      'Nahum': { chapters: 3, versesPerChapter: [15, 13, 19] },
      'Habakkuk': { chapters: 3, versesPerChapter: [17, 20, 19] },
      'Zephaniah': { chapters: 3, versesPerChapter: [18, 15, 20] },
      'Haggai': { chapters: 2, versesPerChapter: [15, 23] },
      'Zechariah': { chapters: 14, versesPerChapter: [21, 13, 10, 14, 11, 15, 14, 23, 17, 12, 17, 14, 9, 21] },
      'Malachi': { chapters: 4, versesPerChapter: [16, 17, 10, 6] },

      // NEW TESTAMENT - Complete verse structures for all 27 books
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
      // This should never happen now that all 66 books are included
      console.error(`CRITICAL: Book ${bookName} not found in complete Bible database!`);
      throw new Error(`Book ${bookName} not found in Bible database`);
    }

    // Select a different chapter than the previous one
    const chapterWeights = bookInfo.versesPerChapter.map((verses, index) => ({
      chapter: index + 1,
      verses,
      weight: Math.max(1, verses / 10)
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

    // Select a random verse from the chosen chapter
    const maxVerses = bookInfo.versesPerChapter[selectedChapter - 1];
    const selectedVerse = Math.floor(Math.random() * maxVerses) + 1;

    return `${bookName} ${selectedChapter}:${selectedVerse}`;
  }

  async generateQuestionBatch(difficulty: 'easy' | 'medium' | 'hard' | 'expert', count = 10, gameId?: number): Promise<BibleQuestion[]> {
    const questions: BibleQuestion[] = [];
    this.generatedCount = 0;
    this.attemptCount = 0;

    // Reset variety tracking for new batch
    this.usedBooks.clear();
    this.questionTypeHistory = [];
    this.creativitySeed = Math.random() * 1000;
    this.usedVersesInBatch.clear(); // Reset verse tracking for new batch

    // Load global verse usage data
    await this.loadGlobalVerseUsage();

    // Reset session verse usage for new batch
    this.verseUsageTracker.clear();

    // Smart batch processing: Generate questions in parallel for better performance
    const parallelBatchSize = Math.min(this.delayConfig.parallelBatchSize, count); // Configurable parallel batch size

    while (questions.length < count && this.attemptCount < this.maxAttempts) {
      this.attemptCount++;
      console.log(`Batch ${this.attemptCount}: Generating up to ${parallelBatchSize} questions in parallel (${questions.length}/${count} completed)`);

      // Generate multiple questions in parallel
      const questionPromises: Promise<BibleQuestion | null>[] = [];
      for (let i = 0; i < parallelBatchSize && questions.length + questionPromises.length < count; i++) {
        const questionNumber = questions.length + questionPromises.length + 1;
        const questionPromise = this.generateUniqueQuestion(difficulty, questionNumber, count, questions);
        questionPromises.push(questionPromise);
      }

      // Wait for all questions in this batch to complete
      const batchResults = await Promise.all(questionPromises);

      // Process the results
      for (const question of batchResults) {
        if (question && questions.length < count) {
          console.log(`Question generated: "${question.text.substring(0, 50)}..."`);
          if (!this.isDuplicate(question, questions)) {
            questions.push(question);
            // Mark this question as generated only after it's accepted
            this.generatedQuestions.add(this.hashQuestion(question.text));
            this.usedBooks.add(question.reference.split(' ')[0]); // Track used books
            this.questionTypeHistory.push(question.text.split(' ')[0]); // Track question patterns
            this.generatedCount++;
            console.log(`Question added! Now have ${questions.length}/${count} questions`);
            this.updateProgress(this.generatedCount, count);

            // Save to database immediately if gameId is provided
            if (gameId) {
              await this.saveQuestionToDatabase(gameId, question, questions.length);
            }
          } else {
            console.log(`Question rejected as duplicate`);
          }
        }
      }

      // Add a shorter delay between parallel batches
      if (questions.length < count) {
        const interBatchDelay = this.delayConfig.interBatchDelay + Math.random() * 200; // Configurable + random
        console.log(`Waiting ${interBatchDelay}ms before next parallel batch...`);
        await this.delay(interBatchDelay);
      }
    }

    // If we couldn't generate enough questions, return what we have (may be fewer than requested)
    if (questions.length < count) {
      console.error(`Failed to generate ${count} questions, only got ${questions.length}`);
      throw new Error(`Could not generate enough questions. Generated ${questions.length} out of ${count} required.`);
    }

    return questions;
  }

  private isDuplicate(newQuestion: BibleQuestion, existingQuestions: BibleQuestion[]): boolean {
    // Check if this exact question already exists
    const exactMatch = existingQuestions.some(q =>
      q.text.toLowerCase().trim() === newQuestion.text.toLowerCase().trim()
    );

    if (exactMatch) {
      console.log('Exact duplicate found:', newQuestion.text);
      return true;
    }

    // Check hash-based duplicates
    const questionHash = this.hashQuestion(newQuestion.text);
    const hashExists = this.generatedQuestions.has(questionHash);

    if (hashExists) {
      console.log('Hash duplicate found:', newQuestion.text, 'Hash:', questionHash);
      return true;
    }

    // CRITICAL: Check if verse is already used in this batch
    const verseAlreadyUsed = this.usedVersesInBatch.has(newQuestion.reference);
    if (verseAlreadyUsed) {
      console.log('Verse already used in this batch:', newQuestion.reference, 'Question:', newQuestion.text);
      return true;
    }

    // Enhanced duplicate detection: Check for similar questions
    const similarMatch = existingQuestions.some(q => {
      // Check if questions have similar structure or ask about same topic
      const newWords = newQuestion.text.toLowerCase().split(' ');
      const existingWords = q.text.toLowerCase().split(' ');

      // Check for common words (more than 40% overlap)
      const commonWords = newWords.filter(word =>
        existingWords.includes(word) && word.length > 3
      );

      const similarityRatio = commonWords.length / Math.max(newWords.length, existingWords.length);

      // Check if same book and similar question type
      const sameBook = newQuestion.reference.split(' ')[0] === q.reference.split(' ')[0];
      const similarType = this.getQuestionType(newQuestion.text) === this.getQuestionType(q.text);

      return similarityRatio > 0.4 && (sameBook || similarType);
    });

    if (similarMatch) {
      console.log('Similar question found, generating different one:', newQuestion.text);
      return true;
    }

    // Check for book overuse (don't use same book more than 20% of the time)
    const bookName = newQuestion.reference.split(' ')[0];
    const bookUsageCount = existingQuestions.filter(q =>
      q.reference.split(' ')[0] === bookName
    ).length;

    const overuseRatio = bookUsageCount / existingQuestions.length;
    if (overuseRatio > 0.2 && existingQuestions.length > 3) {
      console.log(`Book ${bookName} overused (${Math.round(overuseRatio * 100)}%), trying different book`);
      return true;
    }

    return false;
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
    return 'other';
  }

  private updateProgress(current: number, total: number): void {
    console.log(`Generated ${current} of ${total} unique questions...`);
  }

  private async generateUniqueQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'expert', questionNumber: number, totalCount: number, existingQuestions: BibleQuestion[]): Promise<BibleQuestion | null> {
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // Create a unique prompt with random seed to ensure variety
      const randomSeed = Math.random();
      const prompt = this.createBibleBasedPrompt(difficulty, questionNumber, randomSeed, totalCount, existingQuestions);

      try {
        // Add optimized delay between requests to avoid rate limiting
        if (attempt > 1) {
          const delay = Math.min(
            this.delayConfig.baseQuestionDelay * Math.pow(this.delayConfig.retryBackoffMultiplier, attempt - 1),
            this.delayConfig.maxRetryDelay
          );
          console.log(`Waiting ${delay}ms before retry attempt ${attempt}`);
          await this.delay(delay);
        } else if (this.generatedCount > 0) {
          // Reduced delay between different questions for faster generation
          const delay = this.delayConfig.baseQuestionDelay + Math.random() * 500; // 1-1.5 seconds between questions
          console.log(`Waiting ${delay}ms before generating question ${questionNumber}`);
          await this.delay(delay);
        }

        // Adjust parameters based on difficulty for optimal creativity vs accuracy
        const difficultyParams = {
          easy: { temperature: 0.7, top_p: 0.9, max_tokens: 600 },
          medium: { temperature: 0.8, top_p: 0.95, max_tokens: 700 },
          hard: { temperature: 0.85, top_p: 0.95, max_tokens: 750 },
          expert: { temperature: 0.9, top_p: 0.95, max_tokens: 800 }
        };

        const params = difficultyParams[difficulty] || difficultyParams.easy;

        const response = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://faith-defenders.com',
            'X-Title': 'GospelWays Bible Trivia'
          },
          body: JSON.stringify({
            model: AI_MODEL,
            messages: [
              {
                role: 'system',
                content: `You are an intelligent Bible expert who thinks for yourself about which books and verses to use. You generate ONLY objective, factual questions with ONE clear answer directly from Scripture. ALL questions must be verifiable facts from the biblical text. You decide which book and verse to focus on, but the system avoids verses used in the last 5 days and ensures 60% New Testament distribution. Focus on: names, numbers, places, direct quotes, exact details, teachings. NO interpretation, opinion, or subjective questions. Generate in VALID JSON format only. Avoid semantics or asking questions based on a certain translation. for example, in one question i saw "den of thieves" and "den of robbers" being in the same question which is a semantics based on translations. Avoid confusing answers that are all correct although the wrong answers must be tricky. The difficulty level is essential. If the level is easy, ask easy questions and if level is expert ask expert level questions.`
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: params.temperature,
            max_tokens: params.max_tokens,
            top_p: params.top_p,
            frequency_penalty: 0.3, // Reduce repetition
            presence_penalty: 0.2   // Encourage variety
          })
        });

        if (response.status === 429) {
          console.error('API Error: 429 (Rate Limited)');
          // Optimized rate limit handling using configurable delay
          const rateLimitDelay = this.delayConfig.rateLimitDelay + Math.random() * 1000; // Configurable + random
          console.log(`Rate limited, waiting ${rateLimitDelay}ms before retry`);
          await this.delay(rateLimitDelay);
          continue; // Retry on rate limit
        }

        if (!response.ok) {
          // Check for rate limit headers and adjust delays accordingly
          const retryAfter = response.headers.get('Retry-After');
          const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
          const rateLimitReset = response.headers.get('X-RateLimit-Reset');

          console.error('API Error:', response.status, {
            retryAfter,
            rateLimitRemaining,
            rateLimitReset
          });

          // Use header information for smarter delay calculation
          let smartDelay = this.delayConfig.baseQuestionDelay; // Default from config
          if (retryAfter) {
            smartDelay = parseInt(retryAfter) * 1000; // Convert seconds to milliseconds
          } else if (response.status === 429) {
            smartDelay = this.delayConfig.rateLimitDelay + Math.random() * 1000; // Use config + random
          } else if (response.status >= 500) {
            smartDelay = this.delayConfig.baseQuestionDelay + Math.random() * 500; // Use config for server errors
          }

          console.log(`Smart delay calculated: ${smartDelay}ms for status ${response.status}`);
          await this.delay(smartDelay);
          continue; // Retry on API error
        }

        const data: any = await response.json();
        console.log('API Response data:', data);

        // Check for API errors
        if (data.error) {
          console.error('API Error in response:', data.error);
          continue; // Retry
        }

        // Check if we got a response
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          console.error('Invalid API response structure:', data);
          continue; // Retry
        }

        // Check for truncated responses
        const choice = data.choices[0];
        if (choice.finish_reason === 'length') {
          console.error('AI response was truncated due to length limit');
          continue; // Retry with different prompt
        }

        const content = choice.message.content || '';
        console.log(`AI Response for question ${questionNumber} (attempt ${attempt}):`, content.substring(0, 100));

        if (!content || content.trim() === '') {
          console.error('Empty AI response');
          continue; // Retry
        }

        const question = this.parseAIResponse(content, difficulty);

        if (question) {
          // Don't add hash here - it will be added after the question is accepted
          return question;
        }

        // If parsing failed, continue to retry
        console.error(`Parse failed for question ${questionNumber}, attempt ${attempt}/${maxRetries}`);

      } catch (error) {
        console.error(`Error generating question ${questionNumber}, attempt ${attempt}:`, error);
      }
    }

    // All retries failed
    console.error(`Failed to generate question ${questionNumber} after ${maxRetries} attempts`);
    return null;
  }

  private createBibleBasedPrompt(difficulty: 'easy' | 'medium' | 'hard' | 'expert', questionNumber: number, seed: number, totalCount: number, existingQuestions: BibleQuestion[]): string {
    // All 66 canonical books organized by testament
    const oldTestamentBooks = [
      'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
      'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
      '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
      'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
      'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
      'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel',
      'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
      'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
    ];

    const newTestamentBooks = [
      'Matthew', 'Mark', 'Luke', 'John', 'Acts',
      'Romans', '1 Corinthians', '2 Corinthians', 'Galatians',
      'Ephesians', 'Philippians', 'Colossians',
      '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy',
      'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
      '1 John', '2 John', '3 John', 'Jude', 'Revelation'
    ];

    // Determine which testament to use based on 60% NT / 40% OT distribution
    // Calculate target distribution based on total batch size
    const totalQuestions = totalCount || 10; // Use the count parameter from generateQuestionBatch
    const targetNTQuestions = Math.ceil(totalQuestions * 0.6); // 60% of total questions
    const targetOTQuestions = totalQuestions - targetNTQuestions; // 40% of total questions

    // Calculate how many NT and OT questions we've already generated in this batch
    const ntCount = existingQuestions.length > 0 ? existingQuestions.filter(q => {
      const bookName = q.reference.split(' ')[0];
      return newTestamentBooks.includes(bookName);
    }).length : 0;

    const otCount = existingQuestions.length > 0 ? existingQuestions.filter(q => {
      const bookName = q.reference.split(' ')[0];
      return oldTestamentBooks.includes(bookName);
    }).length : 0;

    // Determine if we should use NT for this question
    // Prioritize NT if we haven't reached our target, otherwise use OT
    let useNewTestament = true;
    if (ntCount >= targetNTQuestions) {
      // We've reached our NT target, use OT
      useNewTestament = false;
    } else if (otCount >= targetOTQuestions) {
      // We've reached our OT target, use NT
      useNewTestament = true;
    } else {
      // We haven't reached either target yet, use NT (since we want 60% NT)
      useNewTestament = true;
    }

    console.log(`Testament distribution - Target: ${targetNTQuestions} NT / ${targetOTQuestions} OT, Current: ${ntCount} NT / ${otCount} OT, Using: ${useNewTestament ? 'NT' : 'OT'}`);

    const availableBooks = useNewTestament ? newTestamentBooks : oldTestamentBooks;

    // Select the best verse based on usage tracking from available books only
    const selectedVerse = this.selectBestVerseForQuestion(availableBooks, difficulty);

    // Extract book name from verse reference
    const bookName = selectedVerse.split(' ')[0];

    // Create variety in question types based on difficulty and seed
    const questionTypes = {
      easy: ['who', 'what', 'where', 'how many', 'what happened'],
      medium: ['why', 'what did', 'who said', 'what was', 'how did'],
      hard: ['what does this mean', 'why did', 'what was the result', 'what can we learn', 'how does this relate'],
      expert: ['what is the significance', 'how does this compare', 'what theological concept', 'what does the original language reveal', 'what is the deeper meaning']
    };

    const difficultyQuestionTypes = questionTypes[difficulty] || questionTypes.easy;
    const questionType = difficultyQuestionTypes[Math.floor((seed * 100) % difficultyQuestionTypes.length)];

    // Create detailed, level-specific prompts with objective answers
    const difficultyPrompts = {
      easy: `EASY LEVEL: Create a simple, factual Bible question from ${bookName} that has ONE clear, objective answer directly stated in Scripture. Focus on basic facts only.

Examples: "Who built the ark?", "What did David use to defeat Goliath?", "How many disciples did Jesus choose?"

Requirements:
- Question must have ONE correct answer that is explicitly stated in the biblical text
- Answer should be a simple fact: name, number, place, or direct quote
- Avoid any interpretation, opinion, or "why" questions
- Make it accessible to beginners
- Focus on: people, places, numbers, direct events, exact quotes
- Answer must be objective and unambiguous`,

      medium: `MEDIUM LEVEL: Create a Bible question from ${bookName} that requires understanding of biblical context but has ONE clear, objective answer based on Scripture.

Examples: "What was Paul's occupation before his conversion?", "Where was Jesus born?", "How many chapters are in the book of ${bookName}?"

Requirements:
- Question must have ONE correct answer that can be verified from biblical text
- Answer should be based on clear biblical facts or direct statements
- Include some biblical context but avoid subjective interpretation
- Focus on: biblical facts, historical details, book structure, character backgrounds
- Answer must be objective and unambiguous`,

      hard: `HARD LEVEL: Create a challenging Bible question from ${bookName} that requires knowledge of specific passages and has ONE clear, objective answer from Scripture.

Examples: "What were the names of the three Hebrew men thrown into the fiery furnace?", "How many times did Jesus predict His death in the Gospels?", "What was the exact wording of the Great Commission?"

Requirements:
- Question must have ONE correct answer that is explicitly stated in Scripture
- Answer should be based on careful reading of specific biblical passages
- Include connections between related passages but avoid subjective analysis
- Focus on: specific details, exact wording, numerical facts, direct biblical statements
- Answer must be objective and unambiguous`,

      expert: `EXPERT LEVEL: Create an advanced Bible question from ${bookName} that requires detailed knowledge of Scripture and has ONE clear, objective answer from the biblical text.

Examples: "What are the exact words of the Lord's Prayer?", "How many books in the Bible mention the Holy Spirit?", "What was the specific command given to Adam in the Garden of Eden?"

Requirements:
- Question must have ONE correct answer that can be precisely verified from Scripture
- Answer should be based on exact biblical wording, specific counts, or direct commands
- Include detailed biblical knowledge but avoid theological interpretation
- Focus on: exact quotations, precise numbers, specific commands, direct biblical statements
- Answer must be objective and unambiguous`
    };

    const difficultyInstruction = difficultyPrompts[difficulty] || difficultyPrompts.easy;

    const testamentInfo = useNewTestament ? 'NEW TESTAMENT' : 'OLD TESTAMENT';
    const prompt = `${difficultyInstruction}

AI DECISION: You are thinking for yourself about which books and verses to use from the Bible.
VERSE AVOIDANCE: System avoids verses used in the last 5 days (stored in database)
TESTAMENT DISTRIBUTION: 60% New Testament, 40% Old Testament (enforced by system)
DIFFICULTY LEVEL: ${difficulty}
QUESTION TYPE: ${questionType}
VARIETY SEED: ${seed}

Generate a Bible question as a valid JSON object.

Format: {"question": "Question text here?", "correct": "Correct answer", "wrong1": "Wrong answer 1", "wrong2": "Wrong answer 2", "wrong3": "Wrong answer 3", "reference": "Book Chapter:Verse"}

Requirements:
- You decide which book and verse to use (system handles testament distribution and recent usage avoidance)
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
- Think for yourself about interesting biblical facts
- System will automatically avoid verses used in the last 5 days

Output ONLY the JSON object, no other text.`;

    return prompt;
  }

  private parseAIResponse(content: string, difficulty: 'easy' | 'medium' | 'hard' | 'expert'): BibleQuestion | null {
    try {
      // Clean the content
      let cleanContent = content.trim();

      // Remove markdown code blocks if present
      cleanContent = cleanContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

      // Remove any text before the first { and after the last }
      const startIndex = cleanContent.indexOf('{');
      const lastIndex = cleanContent.lastIndexOf('}');

      if (startIndex === -1 || lastIndex === -1 || startIndex >= lastIndex) {
        console.error('No valid JSON object found in response');
        return null;
      }

      let jsonStr = cleanContent.substring(startIndex, lastIndex + 1);

      // Fix common Grok JSON issues
      // 1. Remove incorrect escaping in keys: {"question\": "value"} -> {"question": "value"}
      jsonStr = jsonStr.replace(/([^\\])\\"/g, '$1"');

      // 2. Fix unescaped quotes in values by properly escaping them
      // This regex finds string values and escapes unescaped quotes within them
      jsonStr = jsonStr.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match, content) => {
        // Escape unescaped quotes in the content
        const escaped = content.replace(/([^\\])"/g, '$1\\"');
        return `"${escaped}"`;
      });

      // 3. Handle any remaining malformed quotes
      jsonStr = jsonStr.replace(/([^\\])\\"/g, '$1"'); // Remove double escaping

      console.log('Cleaned JSON string:', jsonStr);

      // Try to parse the JSON
      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('JSON parse error after cleaning:', parseError, 'JSON string:', jsonStr);
        console.error('Original content:', content);
        return null;
      }

      // Validate required fields
      if (!parsed.question || !parsed.correct) {
        console.error('Missing required fields in parsed JSON:', parsed);
        return null;
      }

      // Build options array
      const options = [parsed.correct];
      if (parsed.wrong1) options.push(parsed.wrong1);
      if (parsed.wrong2) options.push(parsed.wrong2);
      if (parsed.wrong3) options.push(parsed.wrong3);

      // Ensure we have at least 2 options
      if (options.length < 2) {
        console.error('Not enough options provided:', options);
        return null;
      }

      // Remove duplicates and shuffle
      const uniqueOptions = Array.from(new Set(options));
      const shuffled = this.shuffleArray(uniqueOptions);

      return {
        text: parsed.question,
        correctAnswer: parsed.correct,
        options: shuffled,
        reference: parsed.reference || 'Scripture',
        difficulty: difficulty,
        points: this.getPointsForDifficulty(difficulty),
        aiGenerated: true,
        uniqueId: `${this.sessionId}-${Date.now()}-${Math.random()}`
      };

    } catch (error) {
      console.error('Parse error:', error, 'Content:', content.substring(0, 200));
      return null;
    }
  }

  private hashQuestion(text: string): string {
    // Create a unique hash for the question text
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
    const points = {
      'easy': 10,
      'medium': 20,
      'hard': 30,
      'expert': 50
    };
    return points[difficulty] || 10;
  }

  private async saveQuestionToDatabase(gameId: number, question: BibleQuestion, questionNumber: number): Promise<void> {
    try {
      // Import database function dynamically to avoid circular dependencies
      const { createBibleGameQuestions, recordVerseUsage } = await import('./database-neon');

      // Save this single question to database with the correct question number
      const savedQuestions = await createBibleGameQuestions(gameId, [{
        questionText: question.text,
        correctAnswer: question.correctAnswer,
        options: question.options,
        bibleReference: question.reference,
        difficulty: question.difficulty,
        points: question.points,
        questionNumber: questionNumber  // Pass the question number explicitly
      }]);

      // Record verse usage for variety tracking
      await recordVerseUsage(question.reference);

      console.log(`Question ${questionNumber} saved to database successfully`);
    } catch (error) {
      console.error(`Error saving question ${questionNumber} to database:`, error);
      // Don't throw error - continue generation even if saving fails
    }
  }

  async cleanupOldVerseData(daysOld: number = 15): Promise<number> {
    try {
      const { cleanupOldVerseData } = await import('./database-neon');
      const deletedCount = await cleanupOldVerseData(daysOld);
      console.log(`Cleaned up ${deletedCount} old verse usage records`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old verse data:', error);
      return 0;
    }
  }

  getVerseUsageStats(): { sessionUsage: number; globalVerses: number; batchVerses: number } {
    return {
      sessionUsage: this.verseUsageTracker.size,
      globalVerses: this.globalVerseUsage.size,
      batchVerses: this.usedVersesInBatch.size
    };
  }

  isVerseUsedInBatch(verseReference: string): boolean {
    return this.usedVersesInBatch.has(verseReference);
  }

  getBatchVerseUsageSummary(): { usedVerses: string[], totalUsed: number, totalAvailable: number } {
    return {
      usedVerses: Array.from(this.usedVersesInBatch),
      totalUsed: this.usedVersesInBatch.size,
      totalAvailable: this.usedVersesInBatch.size // This would need to be calculated based on available books
    };
  }

}

// Standalone function for scheduled cleanup of old verse data
export async function cleanupOldVerseUsageData(daysOld: number = 15): Promise<number> {
  try {
    const { cleanupOldVerseData } = await import('./database-neon');
    const deletedCount = await cleanupOldVerseData(daysOld);
    console.log(`Scheduled cleanup: Removed ${deletedCount} verse usage records older than ${daysOld} days`);
    return deletedCount;
  } catch (error) {
    console.error('Error during scheduled verse cleanup:', error);
    return 0;
  }
}