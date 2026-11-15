import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  SERVER_CONFIG,
  SUPPORTED_LANGUAGES,
  isGeminiKeyConfigured,
  isSupportedLanguage,
  normalizeAudioMimeType,
  type SupportedLanguageId,
} from './server/config.ts';
import {
  ApiServiceError,
  askBoloBuddy,
  generateQuizQuestion,
  transcribeChildAudio,
  type ConversationMessage,
  type LearningActionMode,
} from './server/geminiService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple in-memory sliding-window rate limiter per IP
const requestLog = new Map<string, number[]>();

function apiRateLimiter(req: Request, res: Response, next: NextFunction) {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowStart = now - SERVER_CONFIG.rateLimitWindowMs;

  const recent = (requestLog.get(clientIp) || []).filter((ts) => ts > windowStart);
  if (recent.length >= SERVER_CONFIG.rateLimitMaxRequests) {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests in a short time. Please pause for a few seconds and try again.',
      },
    });
    return;
  }

  recent.push(now);
  requestLog.set(clientIp, recent);
  next();
}

function sendErrorResponse(res: Response, err: unknown) {
  if (err instanceof ApiServiceError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong on the server. Please try again.',
    },
  });
}

function sanitizeHistory(raw: unknown): ConversationMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is ConversationMessage =>
        Boolean(item) &&
        typeof item === 'object' &&
        (item.role === 'child' || item.role === 'buddy') &&
        typeof item.text === 'string' &&
        item.text.trim().length > 0
    )
    .slice(-10)
    .map((item) => ({
      role: item.role,
      text: item.text.trim().slice(0, 1200),
    }));
}

async function createServer() {
  const app = express();

  app.disable('x-powered-by');

  // Health check endpoint (does not count toward rate limit)
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      geminiConfigured: isGeminiKeyConfigured(),
      models: {
        transcribe: SERVER_CONFIG.transcribeModel,
        tutor: SERVER_CONFIG.tutorModel,
      },
      supportedLanguages: Object.values(SUPPORTED_LANGUAGES).map((l) => ({
        id: l.id,
        label: l.label,
      })),
    });
  });

  // Raw binary audio parser exclusively for /api/transcribe (processed strictly in memory, never saved to disk)
  app.post(
    '/api/transcribe',
    apiRateLimiter,
    express.raw({
      type: ['audio/*', 'application/octet-stream'],
      limit: SERVER_CONFIG.maxAudioBytes,
    }),
    async (req: Request, res: Response) => {
      try {
        const audioBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);

        if (audioBuffer.length < SERVER_CONFIG.minAudioBytes) {
          throw new ApiServiceError(
            400,
            'EMPTY_RECORDING',
            'The recording was too short or empty. Please speak your question clearly after clicking the microphone.'
          );
        }

        if (audioBuffer.length > SERVER_CONFIG.maxAudioBytes) {
          throw new ApiServiceError(
            413,
            'AUDIO_TOO_LARGE',
            'The audio clip is too large. Please keep voice recordings under 45 seconds.'
          );
        }

        const headerMime =
          (req.headers['x-audio-mime-type'] as string | undefined) ||
          req.headers['content-type'];
        const normalizedMime = normalizeAudioMimeType(headerMime);

        if (!normalizedMime) {
          throw new ApiServiceError(
            415,
            'UNSUPPORTED_AUDIO_FORMAT',
            'This audio format is not supported for transcription. Try recording directly with your browser microphone.'
          );
        }

        const rawLang = req.headers['x-language-hint'];
        const languageHint: SupportedLanguageId = isSupportedLanguage(rawLang)
          ? rawLang
          : 'auto';

        const result = await transcribeChildAudio({
          audioBuffer,
          mimeType: normalizedMime,
          languageHint,
        });

        res.json(result);
      } catch (err) {
        sendErrorResponse(res, err);
      }
    }
  );

  // JSON parser for educational QA & learning endpoints
  app.use('/api', express.json({ limit: '512kb' }));

  async function handleAskOrExplain(
    req: Request,
    res: Response,
    forcedMode?: LearningActionMode
  ) {
    try {
      const { transcript, language, history, actionMode } = req.body ?? {};

      if (typeof transcript !== 'string' || transcript.trim().length === 0) {
        throw new ApiServiceError(
          400,
          'EMPTY_QUESTION',
          'Please record or type a question before asking BoloBuddy.'
        );
      }

      if (transcript.trim().length > 1500) {
        throw new ApiServiceError(
          400,
          'QUESTION_TOO_LONG',
          'Please keep your question under 1,500 characters so BoloBuddy can answer clearly.'
        );
      }

      const selectedLanguage: SupportedLanguageId = isSupportedLanguage(language)
        ? language
        : 'auto';

      const allowedModes = new Set<LearningActionMode>([
        'ask',
        'simpler',
        'example',
        'summarise',
        'switch_hindi',
        'switch_english',
      ]);
      const mode: LearningActionMode =
        forcedMode ??
        (typeof actionMode === 'string' && allowedModes.has(actionMode as LearningActionMode)
          ? (actionMode as LearningActionMode)
          : 'ask');

      const result = await askBoloBuddy({
        transcript: transcript.trim(),
        language: selectedLanguage,
        history: sanitizeHistory(history),
        actionMode: mode,
      });

      res.json(result);
    } catch (err) {
      sendErrorResponse(res, err);
    }
  }

  app.post('/api/ask', apiRateLimiter, (req: Request, res: Response) => {
    void handleAskOrExplain(req, res);
  });

  app.post('/api/learning/explain', apiRateLimiter, (req: Request, res: Response) => {
    void handleAskOrExplain(req, res);
  });

  app.post('/api/learning/quiz', apiRateLimiter, async (req: Request, res: Response) => {
    try {
      const { topic, language, history } = req.body ?? {};
      const selectedLanguage: SupportedLanguageId = isSupportedLanguage(language)
        ? language
        : 'auto';

      const safeTopic =
        typeof topic === 'string' && topic.trim().length > 0
          ? topic.trim().slice(0, 400)
          : 'Everyday science curiosity';

      const quiz = await generateQuizQuestion({
        topic: safeTopic,
        language: selectedLanguage,
        history: sanitizeHistory(history),
      });

      res.json(quiz);
    } catch (err) {
      sendErrorResponse(res, err);
    }
  });

  // Handle payload-too-large / malformed JSON errors cleanly
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err && typeof err === 'object' && 'type' in err && err.type === 'entity.too.large') {
      res.status(413).json({
        error: {
          code: 'AUDIO_TOO_LARGE',
          message: 'Audio recording exceeds the 8 MB limit. Please try a shorter question.',
        },
      });
      return;
    }
    next(err);
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const server = app.listen(SERVER_CONFIG.port, '0.0.0.0', () => {
    console.log(`\n🎉 BoloBuddy AI server is running!`);
    console.log(`👉 Open http://localhost:${SERVER_CONFIG.port} in your browser\n`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n⚠️  Port ${SERVER_CONFIG.port} is already in use!`);
      console.error(`This usually means BoloBuddy is already running in another terminal window.`);
      console.error(`To fix this:`);
      console.error(`1. Check your open terminal windows and stop the existing process with Ctrl+C, OR`);
      console.error(`2. Set PORT=${SERVER_CONFIG.port + 1} in your .env file.\n`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

createServer().catch((err) => {
  console.error('Failed to start BoloBuddy AI server:', err instanceof Error ? err.message : err);
  process.exit(1);
});
