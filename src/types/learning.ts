export type WorkspaceLanguageId =
  | 'auto'
  | 'hinglish'
  | 'hindi'
  | 'english'
  | 'bengali'
  | 'tamil'
  | 'telugu'
  | 'marathi';

export type LearningActionMode =
  | 'ask'
  | 'simpler'
  | 'example'
  | 'summarise'
  | 'switch_hindi'
  | 'switch_english';

export interface UncertaintyCheckResult {
  needsClarification: boolean;
  reasons: string[];
  checkMethod: 'heuristic';
  note: string;
}

export interface TranscriptionResponse {
  transcript: string;
  detectedLanguage: string;
  uncertainty: UncertaintyCheckResult;
  modelUsed: string;
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

export interface SessionConversationTurn {
  id: string;
  childText: string;
  languageLabel: string;
  actionMode: LearningActionMode;
  response: TutorResponsePayload;
  timestamp: string;
}

export interface HealthStatus {
  status: string;
  openRouterConfigured?: boolean;
  geminiConfigured?: boolean;
  primaryModel?: string;
  fallbackModels?: readonly string[] | string[];
  models?: {
    primary?: string;
    fallbacks?: readonly string[] | string[];
    allConfigured?: readonly string[] | string[];
    transcribe?: string;
    tutor?: string;
  };
}
