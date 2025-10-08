// Cloudflare Durable Object for Background AI Question Generation
// Handles the actual AI API calls and reports progress to the Progress Tracker

import { AIBibleQuestionGenerator1 } from './ai-bible-question-generator-1';

interface GenerateRequest {
  gameId: string;
  totalQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
}

export class AIGenerationDO {
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

    console.log(`[AI-DO] ${method} ${path}`);

    try {
      if (path === '/generate' && method === 'POST') {
        return await this.handleGenerateQuestions(request);
      }

      return new Response('Not found', { status: 404 });
    } catch (error) {
      console.error('[AI-DO] Error processing request:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleGenerateQuestions(request: Request): Promise<Response> {
    try {
      const body: GenerateRequest = await request.json();
      const { gameId, totalQuestions, difficulty } = body;

      if (!gameId || !totalQuestions || !difficulty) {
        return new Response(JSON.stringify({ error: 'Missing required parameters: gameId, totalQuestions, difficulty' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      console.log(`[AI-DO] Starting AI generation for game ${gameId}: ${totalQuestions} ${difficulty} questions`);

      // Get API key from environment
      const apiKey = this.env?.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY not configured');
      }

      // Initialize progress in the Progress Tracker DO
      const progressTrackerId = this.env.PROGRESS_TRACKER.idFromName(gameId);
      const progressTracker = this.env.PROGRESS_TRACKER.get(progressTrackerId);

      // Start progress tracking
      const startResponse = await progressTracker.fetch(new Request('http://internal/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, totalQuestions })
      }));

      if (!startResponse.ok) {
        throw new Error('Failed to initialize progress tracking');
      }

      // Generate questions using the enhanced generator
      const generator = new AIBibleQuestionGenerator1(Date.now(), apiKey);

      let generatedQuestions: any[] = [];
      let errors: string[] = [];

      try {
        console.log(`[AI-DO] Beginning question batch generation...`);

        // Cast gameId to number as expected
        const questions = await generator.generateQuestionBatch(difficulty, totalQuestions, parseInt(gameId));

        if (questions && questions.length > 0) {
          generatedQuestions = questions.map(q => ({
            text: q.text,
            correctAnswer: q.correctAnswer,
            options: q.options,
            reference: q.reference,
            points: q.points,
            aiGenerated: true
          }));

          console.log(`[AI-DO] Successfully generated ${generatedQuestions.length} questions`);
        } else {
          throw new Error('No questions were generated');
        }

        // Update progress as completed
        await progressTracker.fetch(new Request('http://internal/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId })
        }));

      } catch (genError) {
        console.error('[AI-DO] Generation error:', genError);
        errors.push(`Generation failed: ${genError instanceof Error ? genError.message : String(genError)}`);

        // Report error to progress tracker
        await progressTracker.fetch(new Request('http://internal/error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId, error: errors.join('; ') })
        }));

        return new Response(JSON.stringify({
          success: false,
          error: 'Question generation failed',
          details: errors
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      console.log(`[AI-DO] Generation completed for game ${gameId}`);

      return new Response(JSON.stringify({
        success: true,
        gameId,
        questionsGenerated: generatedQuestions.length,
        totalRequested: totalQuestions,
        questions: generatedQuestions
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('[AI-DO] Error in handleGenerateQuestions:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal error during question generation'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    // This is just a fallback - the DO should be called directly
    return new Response('AI Generation Durable Object', { status: 200 });
  }
};
