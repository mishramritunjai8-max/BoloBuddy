import type {
  HealthStatus,
  LearningActionMode,
  QuizQuestionPayload,
  TranscriptionResponse,
  TutorResponsePayload,
  WorkspaceLanguageId,
} from '../types/learning';

export interface ApiErrorInfo {
  code: string;
  message: string;
  status: number;
}

export class ApiClientError extends Error {
  code: string;
  status: number;

  constructor({ code, message, status }: ApiErrorInfo) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function parseErrorResponse(res: Response, fallbackMsg: string): Promise<ApiClientError> {
  try {
    const data = await res.json();
    if (data?.error?.message) {
      return new ApiClientError({
        code: data.error.code || 'API_ERROR',
        message: data.error.message,
        status: res.status,
      });
    }
  } catch {
    // Ignore non-JSON body
  }

  if (res.status >= 500) {
    return new ApiClientError({
      code: 'BACKEND_UNAVAILABLE',
      message: 'The BoloBuddy server could not complete this request right now. Please try again shortly.',
      status: res.status,
    });
  }

  return new ApiClientError({
    code: 'REQUEST_FAILED',
    message: fallbackMsg,
    status: res.status,
  });
}

export async function fetchHealthStatus(): Promise<HealthStatus> {
  try {
    const res = await fetch('/api/health', {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      throw await parseErrorResponse(res, 'Could not reach the BoloBuddy server.');
    }
    return (await res.json()) as HealthStatus;
  } catch (err) {
    if (err instanceof ApiClientError) throw err;
    throw new ApiClientError({
      code: 'NETWORK_ERROR',
      message: 'Cannot reach the BoloBuddy backend. Check your connection and try again.',
      status: 0,
    });
  }
}

export async function transcribeAudioBlob(params: {
  blob: Blob;
  mimeType: string;
  languageHint: WorkspaceLanguageId;
}): Promise<TranscriptionResponse> {
  const { blob, mimeType, languageHint } = params;

  try {
    const res = await fetch('/api/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': mimeType || 'audio/webm',
        'X-Audio-Mime-Type': mimeType || 'audio/webm',
        'X-Language-Hint': languageHint,
      },
      body: blob,
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      throw await parseErrorResponse(res, 'Transcription failed. Please try speaking again.');
    }

    return (await res.json()) as TranscriptionResponse;
  } catch (err) {
    if (err instanceof ApiClientError) throw err;
    const isTimeout = err instanceof Error && err.name === 'TimeoutError';
    throw new ApiClientError({
      code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      message: isTimeout
        ? 'Transcription took too long. Please try a shorter question or type directly.'
        : 'Network connection failed while sending audio for transcription.',
      status: 0,
    });
  }
}

export async function askBoloBuddyQuestion(params: {
  transcript: string;
  language: WorkspaceLanguageId;
  history: Array<{ role: 'child' | 'buddy'; text: string }>;
  actionMode?: LearningActionMode;
}): Promise<TutorResponsePayload> {
  const endpoint =
    params.actionMode && params.actionMode !== 'ask' ? '/api/learning/explain' : '/api/ask';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript: params.transcript,
        language: params.language,
        history: params.history,
        actionMode: params.actionMode ?? 'ask',
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      throw await parseErrorResponse(res, 'BoloBuddy could not answer right now.');
    }

    return (await res.json()) as TutorResponsePayload;
  } catch (err) {
    if (err instanceof ApiClientError) throw err;
    const isTimeout = err instanceof Error && err.name === 'TimeoutError';
    throw new ApiClientError({
      code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      message: isTimeout
        ? 'BoloBuddy took a bit too long to respond. Please try asking again!'
        : 'Network connection failed while talking to BoloBuddy.',
      status: 0,
    });
  }
}

export async function fetchLearningQuiz(params: {
  topic: string;
  language: WorkspaceLanguageId;
  history: Array<{ role: 'child' | 'buddy'; text: string }>;
}): Promise<QuizQuestionPayload> {
  try {
    const res = await fetch('/api/learning/quiz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      throw await parseErrorResponse(res, 'Could not generate a quiz question right now.');
    }

    return (await res.json()) as QuizQuestionPayload;
  } catch (err) {
    if (err instanceof ApiClientError) throw err;
    const isTimeout = err instanceof Error && err.name === 'TimeoutError';
    throw new ApiClientError({
      code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      message: isTimeout
        ? 'Quiz generation timed out. Please try again.'
        : 'Network connection failed while generating a quiz question.',
      status: 0,
    });
  }
}
