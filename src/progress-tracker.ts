// Cloudflare Durable Objects for Background AI Question Generation
// Handles real-time progress tracking and background processing

export interface GenerationProgress {
  total: number;
  generated: number;
  isReady: boolean;
  status: 'waiting' | 'generating' | 'completed' | 'error';
  errors: string[];
  startTime: number;
  gameId: string;
}

export interface GenRequestBody {
  gameId: string;
  totalQuestions?: number;
  generated?: number;
  total?: number;
  error?: string;
}

declare const DurableObjectState: any;

export class QuestionGenerationTracker {
  state: any;
  env: any;

  constructor(state: any, env: any) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    console.log(`[DO] ${method} ${path}`);

    try {
      switch (path) {
        case '/start':
          if (method !== 'POST') return new Response('Method not allowed', { status: 405 });
          return await this.handleStartGeneration(request);

        case '/progress':
          if (method !== 'GET') return new Response('Method not allowed', { status: 405 });
          return await this.handleGetProgress();

        case '/update':
          if (method !== 'POST') return new Response('Method not allowed', { status: 405 });
          return await this.handleUpdateProgress(request);

        case '/complete':
          if (method !== 'POST') return new Response('Method not allowed', { status: 405 });
          return await this.handleCompleteGeneration(request);

        case '/error':
          if (method !== 'POST') return new Response('Method not allowed', { status: 405 });
          return await this.handleGenerationError(request);

        default:
          return new Response('Not found', { status: 404 });
      }
    } catch (error) {
      console.error('[DO] Error processing request:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async getStorage(): Promise<Map<string, GenerationProgress>> {
    const storage = await this.state.storage.get('progress') as Map<string, GenerationProgress> || new Map();
    return storage;
  }

  private async saveStorage(storage: Map<string, GenerationProgress>): Promise<void> {
    await this.state.storage.put('progress', storage);
  }

  private async handleStartGeneration(request: Request): Promise<Response> {
    try {
      const { gameId, totalQuestions } = await request.json();

      if (!gameId || typeof totalQuestions !== 'number') {
        return new Response(JSON.stringify({ error: 'Invalid gameId or totalQuestions' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const storage = await this.getStorage();

      const progress: GenerationProgress = {
        total: totalQuestions,
        generated: 0,
        isReady: false,
        status: 'waiting',
        errors: [],
        startTime: Date.now(),
        gameId: gameId
      };

      storage.set(gameId, progress);
      await this.saveStorage(storage);

      console.log(`[DO] Started generation for game ${gameId}: ${totalQuestions} questions`);

      // Trigger background generation - this is where we'd spawn the actual AI generation
      this.startBackgroundGeneration(gameId, totalQuestions);

      return new Response(JSON.stringify({
        success: true,
        progress: progress
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('[DO] Error starting generation:', error);
      return new Response(JSON.stringify({ error: 'Failed to start generation' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async startBackgroundGeneration(gameId: string, totalQuestions: number): Promise<void> {
    try {
      console.log(`[DO] Starting background generation for game ${gameId}`);

      // Update status to 'generating'
      const storage = await this.getStorage();
      const progress = storage.get(gameId);
      if (progress) {
        progress.status = 'generating';
        await this.saveStorage(storage);
      }

      // Here we would normally spawn a separate Durable Object or
      // use a queue system to handle the actual AI generation
      // For now, we'll simulate the generation process

      console.log(`[DO] Background generation started for ${gameId}`);

      // In a real implementation, this would:
      // 1. Spawn an AI generation Durable Object
      // 2. Track progress updates
      // 3. Handle retries and errors
      // 4. Update the storage when complete

    } catch (error) {
      console.error(`[DO] Error in background generation for ${gameId}:`, error);

      const storage = await this.getStorage();
      const progress = storage.get(gameId);
      if (progress) {
        progress.status = 'error';
        progress.errors.push(`Background generation failed: ${error}`);
        await this.saveStorage(storage);
      }
    }
  }

  private async handleGetProgress(): Promise<Response> {
    try {
      const url = new URL(request.url);
      const gameId = url.searchParams.get('gameId');

      if (!gameId) {
        return new Response(JSON.stringify({ error: 'gameId parameter required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const storage = await this.getStorage();
      const progress = storage.get(gameId);

      if (!progress) {
        return new Response(JSON.stringify({
          total: 0,
          generated: 0,
          isReady: false,
          status: 'not_found'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Add additional metadata for client
      const responseProgress = {
        ...progress,
        progress: progress.total > 0 ? Math.min(95, (progress.generated / progress.total) * 100) : 0
      };

      return new Response(JSON.stringify(responseProgress), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('[DO] Error getting progress:', error);
      return new Response(JSON.stringify({ error: 'Failed to get progress' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleUpdateProgress(request: Request): Promise<Response> {
    try {
      const { gameId, generated, total, error } = await request.json();

      if (!gameId) {
        return new Response(JSON.stringify({ error: 'gameId required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const storage = await this.getStorage();
      const progress = storage.get(gameId);

      if (progress) {
        if (typeof generated === 'number') {
          progress.generated = generated;
        }
        if (typeof total === 'number') {
          progress.total = total;
        }
        if (error) {
          progress.errors.push(error);
        }

        // Check if generation is complete
        if (progress.generated >= progress.total && progress.total > 0) {
          progress.isReady = true;
          progress.status = 'completed';
          console.log(`[DO] Generation completed for game ${gameId}`);
        }

        await this.saveStorage(storage);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('[DO] Error updating progress:', error);
      return new Response(JSON.stringify({ error: 'Failed to update progress' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleCompleteGeneration(request: Request): Promise<Response> {
    try {
      const { gameId } = await request.json();

      if (!gameId) {
        return new Response(JSON.stringify({ error: 'gameId required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const storage = await this.getStorage();
      const progress = storage.get(gameId);

      if (progress) {
        progress.isReady = true;
        progress.status = 'completed';
        progress.generated = progress.total; // Ensure it's set to total
        await this.saveStorage(storage);

        console.log(`[DO] Generation manually completed for game ${gameId}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('[DO] Error completing generation:', error);
      return new Response(JSON.stringify({ error: 'Failed to complete generation' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleGenerationError(request: Request): Promise<Response> {
    try {
      const { gameId, error } = await request.json();

      if (!gameId || !error) {
        return new Response(JSON.stringify({ error: 'gameId and error required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const storage = await this.getStorage();
      const progress = storage.get(gameId);

      if (progress) {
        progress.status = 'error';
        progress.errors.push(error);
        await this.saveStorage(storage);

        console.error(`[DO] Generation error for game ${gameId}: ${error}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('[DO] Error handling generation error:', error);
      return new Response(JSON.stringify({ error: 'Failed to handle error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Cleanup method called by the runtime
  async alarm(): Promise<void> {
    try {
      const storage = await this.getStorage();
      const now = Date.now();
      const cleanedGames: string[] = [];

      // Clean up old progress data (older than 1 hour)
      for (const [gameId, progress] of storage.entries()) {
        if (now - progress.startTime > 60 * 60 * 1000) { // 1 hour
          cleanedGames.push(gameId);
          storage.delete(gameId);
        }
      }

      if (cleanedGames.length > 0) {
        await this.saveStorage(storage);
        console.log(`[DO] Cleaned up ${cleanedGames.length} old games: ${cleanedGames.join(', ')}`);
      }
    } catch (error) {
      console.error('[DO] Error in cleanup alarm:', error);
    }
  }
}

// Export the Durable Object class for Wrangler
export default {
  async fetch(request: Request, env: any): Promise<Response> {
    // Route to the appropriate DO based on URL path
    const url = new URL(request.url);
    const gameId = url.pathname.split('/')[2]; // Extract gameId from /progress/{gameId}

    if (!gameId) {
      return new Response('Game ID required', { status: 400 });
    }

    // Get the Durable Object for this game
    const id = env.PROGRESS_TRACKER.idFromName(gameId);
    const stub = env.PROGRESS_TRACKER.get(id);

    return stub.fetch(request);
  }
};
