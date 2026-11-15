import {
  OPENROUTER_MODELS,
  SERVER_CONFIG,
  SUPPORTED_LANGUAGES,
  isOpenRouterKeyConfigured,
  type OpenRouterModelId,
  type SupportedLanguageId,
} from './config.ts';

export type LearningActionMode =
  | 'ask'
  | 'simpler'
  | 'example'
  | 'summarise'
  | 'switch_hindi'
  | 'switch_english';

export interface ConversationMessage {
  role: 'child' | 'buddy';
  text: string;
}

export interface TutorResponsePayload {
  subject: string;
  detectedLanguage: string;
  needsClarification: boolean;
  clarificationQuestion: string;
  answerTitle: string;
  explanation: string;
  steps: string[];
  everydayExample: string;
  followUpSuggestions: string[];
  modelUsed: string;
}

export interface QuizQuestionPayload {
  subject: string;
  question: string;
  options: string[];
  correctIndex: number;
  encouragingFeedback: string;
  explanation: string;
  modelUsed: string;
}

export class ApiServiceError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * Creates the reusable BoloBuddy educational system prompt.
 * Consistently applied across all 5 free OpenRouter models.
 */
export function buildEducationalSystemInstruction(targetLangInstruction: string): string {
  return `You are BoloBuddy AI, a calm, patient, encouraging learning teacher and voice-first companion for children aged 6–14 across India.

Core Educational Principles:
- Use easy, age-appropriate language with short, clear, friendly sentences.
- Break difficult ideas down step by step so children can easily grasp them.
- Always use familiar real-life examples (from home, kitchen, playground, nature, monsoon, food, or school).
- Mathematics: Break problems into simple steps and clearly explain calculations.
- Science: Use everyday relatable observations (like steam from hot milk, shadows on a sunny day).
- Tone: Warm, curious, and confidence-building. Never patronise, never use unnecessary technical jargon.
- Mistakes: Never shame or judge a child for mistakes or imperfect grammar; warmly praise their curiosity!
- Language: Respond in ${targetLangInstruction}. Support Hindi, English, Hinglish, Bengali, Tamil, Telugu, and Marathi where appropriate. If asked in Hinglish, respond in natural, friendly Hinglish.

Uncertainty & Clarification Handling:
- Children may hesitate, pause ("..."), mix words, or have muffled speech marked as "[unclear]".
- NEVER invent missing facts or pretend to know something uncertain.
- If the core question is incomplete or has "[unclear]" making it ambiguous (e.g. "Why does the [unclear] shine?"), set "needsClarification": true, ask ONE gentle, specific clarification question (e.g. "I caught most of your question! Which thing shines?"), and provide a brief helpful note without wild guessing.
- If the meaning IS clear despite minor slips or Hinglish mixing, set "needsClarification": false and answer directly!

Format Requirement:
You MUST respond with a single valid JSON object matching this schema exactly:
{
  "subject": "Mathematics | Science | English | Social Studies | General Knowledge | Basic Computer Science",
  "detectedLanguage": "string (e.g. English, Hindi, Hinglish, Bengali, Tamil, Telugu, Marathi)",
  "needsClarification": false,
  "clarificationQuestion": "",
  "answerTitle": "Short catchy concept title (4-8 words)",
  "explanation": "Clear 2-4 sentence explanation for children",
  "steps": ["Step 1", "Step 2", "Step 3"],
  "everydayExample": "One relatable everyday life example",
  "followUpSuggestions": ["Short curious question 1?", "Short curious question 2?"]
}`;
}

/**
 * Robust JSON parser that handles code blocks, prelude/postlude text, and malformed strings.
 */
export function extractAndParseJson<T>(rawText: string, fallback: T): T {
  if (!rawText || !rawText.trim()) return fallback;

  let cleaned = rawText.trim();

  // Strip markdown code fences if present (e.g. ```json ... ```)
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Try direct parse
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Attempt to isolate the outer balanced JSON object {...}
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const slice = cleaned.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(slice) as T;
      } catch {
        // Fall through to heuristic extraction
      }
    }
  }

  return fallback;
}

/**
 * Calls OpenRouter chat completions endpoint with single API key and timeout.
 */
async function callOpenRouter(
  model: OpenRouterModelId,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  maxTokens = 850
): Promise<{ content: string; model: string }> {
  const apiKey = SERVER_CONFIG.openRouterApiKey;
  if (!apiKey) {
    throw new ApiServiceError(
      503,
      'MISSING_API_KEY',
      'OPENROUTER_API_KEY is not configured yet. Please open your .env file and paste your OpenRouter API key.'
    );
  }

  const endpoint = `${SERVER_CONFIG.openRouterBaseUrl}/chat/completions`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SERVER_CONFIG.requestTimeoutMs);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://bolobuddy.ai',
        'X-Title': 'BoloBuddy AI',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.5,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Authentication failure: do NOT retry across other models since key is shared
    if (res.status === 401 || res.status === 403) {
      throw new ApiServiceError(
        401,
        'INVALID_API_KEY',
        'The configured OpenRouter API key could not be authenticated. Please paste a valid OPENROUTER_API_KEY in your .env file.'
      );
    }

    // Billing / credit limit: do NOT retry
    if (res.status === 402) {
      throw new ApiServiceError(
        402,
        'INSUFFICIENT_CREDITS',
        'OpenRouter account credit limit reached or account requires verification.'
      );
    }

    if (!res.ok) {
      let errMessage = `HTTP ${res.status}`;
      try {
        const errJson = (await res.json()) as any;
        errMessage = errJson?.error?.message || errMessage;
      } catch {
        // ignore parse error
      }
      throw new ApiServiceError(res.status, 'PROVIDER_ERROR', errMessage);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      model?: string;
    };
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new ApiServiceError(502, 'EMPTY_RESPONSE', 'Model returned an empty completion.');
    }

    return {
      content,
      model: data.model || model,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof ApiServiceError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiServiceError(504, 'TIMEOUT', `Request to model ${model} timed out.`);
    }
    throw new ApiServiceError(
      502,
      'NETWORK_ERROR',
      `Failed to reach OpenRouter: ${(err as Error).message}`
    );
  }
}

/**
 * Executes educational Q&A using the 5-model automatic fallback sequence.
 * 1. baidu/ernie-5.5-flash-preview:free (Primary)
 * 2. inclusionai/ling-3.2-flash:free (Fallback 1)
 * 3. nvidia/nemotron-3.5-lightning:free (Fallback 2)
 * 4. nvidia/nemotron-3-ultra-550b-a55b:free (Fallback 3)
 * 5. nvidia/nemotron-3.5-super-vl:free (Fallback 4)
 */
export async function askBoloBuddyWithOpenRouter(params: {
  transcript: string;
  language: SupportedLanguageId;
  history: ConversationMessage[];
  actionMode: LearningActionMode;
}): Promise<TutorResponsePayload> {
  if (!isOpenRouterKeyConfigured()) {
    throw new ApiServiceError(
      503,
      'MISSING_API_KEY',
      'OPENROUTER_API_KEY is not configured yet. Please open your .env file and paste your OpenRouter API key.'
    );
  }

  const { transcript, language, history, actionMode } = params;

  if (!transcript || !transcript.trim()) {
    throw new ApiServiceError(
      400,
      'EMPTY_QUESTION',
      'Please record or type a question before asking BoloBuddy.'
    );
  }

  const targetLangInstruction =
    actionMode === 'switch_hindi'
      ? 'Hindi (हिन्दी in Devanagari script, simple everyday words for children)'
      : actionMode === 'switch_english'
        ? 'simple, warm English for children'
        : language === 'auto'
          ? 'the same language (or Hinglish) used in the child’s question'
          : SUPPORTED_LANGUAGES[language]?.promptName || 'simple language';

  const modeDirectives: Record<LearningActionMode, string> = {
    ask: 'Answer the child’s question clearly and warmly. Only set needsClarification=true if the question is genuinely ambiguous or incomplete. Never repeatedly ask them to repeat an understandable sentence.',
    simpler:
      'Re-explain the concept even more simply, as if explaining to a curious 7-year-old using short sentences and one clear everyday image.',
    example:
      'Give a fresh, vivid everyday example from daily life (home, kitchen, playground, monsoon, food, or school) that makes the idea click immediately.',
    summarise:
      'Summarise what the child has learned in this conversation into 2–3 short, encouraging takeaway points.',
    switch_hindi:
      'Explain the same answer warmly in simple Hindi (Devanagari script) while keeping familiar school science/math words clear.',
    switch_english:
      'Explain the same answer warmly in simple, encouraging English.',
  };

  const systemInstruction = buildEducationalSystemInstruction(targetLangInstruction);

  const recentHistory = history
    .slice(-6)
    .map((m) => `${m.role === 'child' ? 'Child' : 'BoloBuddy'}: ${m.text}`)
    .join('\n');

  const userPrompt = [
    recentHistory ? `Recent conversation context:\n${recentHistory}\n` : '',
    `Child's question/transcript: "${transcript.trim()}"`,
    `Requested learning mode: ${modeDirectives[actionMode] || modeDirectives.ask}`,
    'Return your entire response as a valid JSON object matching the schema.',
  ]
    .filter(Boolean)
    .join('\n\n');

  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: systemInstruction },
    { role: 'user', content: userPrompt },
  ];

  let lastModelError: Error | null = null;
  let allRateLimited = true;

  // Sequential Fallback Execution over the 5 exact free models
  for (let i = 0; i < OPENROUTER_MODELS.length; i++) {
    const candidateModel = OPENROUTER_MODELS[i];
    try {
      const { content, model: reportedModel } = await callOpenRouter(candidateModel, messages, 850);

      const parsed = extractAndParseJson<Partial<TutorResponsePayload>>(content, {});

      // Validate and provide safe fallbacks for children
      const safeExplanation =
        parsed.explanation && typeof parsed.explanation === 'string'
          ? parsed.explanation
          : content.slice(0, 350).trim();

      const safeTitle =
        parsed.answerTitle && typeof parsed.answerTitle === 'string'
          ? parsed.answerTitle
          : 'Learning Concept';

      const safeSubject =
        parsed.subject && typeof parsed.subject === 'string'
          ? parsed.subject
          : 'General Knowledge';

      const safeDetectedLang =
        parsed.detectedLanguage && typeof parsed.detectedLanguage === 'string'
          ? parsed.detectedLanguage
          : language === 'auto'
            ? 'Auto-Detect'
            : SUPPORTED_LANGUAGES[language]?.label || 'English';

      const safeSteps = Array.isArray(parsed.steps)
        ? parsed.steps.filter((s) => typeof s === 'string').slice(0, 4)
        : [];

      const safeFollowUps = Array.isArray(parsed.followUpSuggestions)
        ? parsed.followUpSuggestions.filter((s) => typeof s === 'string').slice(0, 3)
        : [];

      return {
        subject: safeSubject,
        detectedLanguage: safeDetectedLang,
        needsClarification: Boolean(parsed.needsClarification),
        clarificationQuestion: parsed.clarificationQuestion || '',
        answerTitle: safeTitle,
        explanation: safeExplanation,
        steps: safeSteps,
        everydayExample: parsed.everydayExample || '',
        followUpSuggestions: safeFollowUps,
        modelUsed: reportedModel || candidateModel,
      };
    } catch (err) {
      lastModelError = err as Error;

      // Do NOT fall back on invalid API key or account billing issues
      if (err instanceof ApiServiceError && (err.status === 401 || err.status === 402)) {
        throw err;
      }

      if (err instanceof ApiServiceError && err.status !== 429) {
        allRateLimited = false;
      }

      // Log fallback transition (without printing credentials)
      const isLastModel = i === OPENROUTER_MODELS.length - 1;
      if (!isLastModel) {
        console.warn(
          `[BoloBuddy Fallback] Model ${candidateModel} failed: ${(err as Error).message}. Attempting fallback to ${OPENROUTER_MODELS[i + 1]}...`
        );
      }
    }
  }

  if (allRateLimited) {
    throw new ApiServiceError(
      429,
      'RATE_LIMITED',
      'The OpenRouter free-tier rate limit was reached across available models. Please wait a moment and try again.'
    );
  }

  throw new ApiServiceError(
    503,
    'ALL_MODELS_UNAVAILABLE',
    `All configured free OpenRouter models are temporarily busy or unavailable (${lastModelError?.message || 'unknown error'}). Please try again shortly.`
  );
}

/**
 * Generates an interactive multiple-choice quiz question using the 5-model fallback sequence.
 */
export async function generateQuizWithOpenRouter(params: {
  topic: string;
  language: SupportedLanguageId;
  history: ConversationMessage[];
}): Promise<QuizQuestionPayload> {
  if (!isOpenRouterKeyConfigured()) {
    throw new ApiServiceError(
      503,
      'MISSING_API_KEY',
      'OPENROUTER_API_KEY is not configured yet. Please open your .env file and paste your OpenRouter API key.'
    );
  }

  const { topic, language, history } = params;

  const targetLang =
    language === 'auto'
      ? 'the same language used in the recent conversation'
      : SUPPORTED_LANGUAGES[language]?.promptName || 'English';

  const recentContext = history
    .slice(-4)
    .map((m) => `${m.role === 'child' ? 'Child' : 'BoloBuddy'}: ${m.text}`)
    .join('\n');

  const systemInstruction = `You create gentle, fun, confidence-building mini-quiz questions for children aged 6–14.
Tone: Warm, encouraging, playful.
Language: ${targetLang}.
Respond with ONLY a valid JSON object matching:
{
  "subject": "Mathematics | Science | English | Social Studies | General Knowledge | Basic Computer Science",
  "question": "Clear, fun multiple choice question",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctIndex": 0,
  "encouragingFeedback": "Warm praise when child answers correctly",
  "explanation": "Friendly 1-2 sentence explanation of why this answer is correct"
}`;

  const prompt = [
    recentContext ? `Recent learning context:\n${recentContext}\n` : '',
    `Topic: ${topic || 'Everyday science curiosity'}`,
    `Create ONE fun check-in question for age 6–14 in ${targetLang}. Return JSON only.`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: systemInstruction },
    { role: 'user', content: prompt },
  ];

  let lastErr: Error | null = null;

  for (let i = 0; i < OPENROUTER_MODELS.length; i++) {
    const candidateModel = OPENROUTER_MODELS[i];
    try {
      const { content, model: reportedModel } = await callOpenRouter(candidateModel, messages, 500);
      const parsed = extractAndParseJson<Partial<QuizQuestionPayload>>(content, {});

      const safeOptions = Array.isArray(parsed.options)
        ? parsed.options.filter((o) => typeof o === 'string').slice(0, 4)
        : ['A', 'B', 'C', 'D'];

      const safeIndex =
        typeof parsed.correctIndex === 'number' &&
        parsed.correctIndex >= 0 &&
        parsed.correctIndex < safeOptions.length
          ? parsed.correctIndex
          : 0;

      return {
        subject: parsed.subject || 'General Knowledge',
        question: parsed.question || 'What did you find most exciting about this topic?',
        options: safeOptions,
        correctIndex: safeIndex,
        encouragingFeedback: parsed.encouragingFeedback || 'Brilliant job exploring this question!',
        explanation: parsed.explanation || 'Keep up your wonderful curiosity!',
        modelUsed: reportedModel || candidateModel,
      };
    } catch (err) {
      lastErr = err as Error;
      if (err instanceof ApiServiceError && (err.status === 401 || err.status === 402)) {
        throw err;
      }
      if (i < OPENROUTER_MODELS.length - 1) {
        console.warn(`[Quiz Fallback] Model ${candidateModel} failed. Trying next model...`);
      }
    }
  }

  throw new ApiServiceError(
    503,
    'ALL_MODELS_UNAVAILABLE',
    `Could not generate a quiz right now (${lastErr?.message || 'all free models busy'}). Please try again.`
  );
}
