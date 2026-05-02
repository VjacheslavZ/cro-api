export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
}

export enum NativeLanguage {
  RU = 'RU',
  UK = 'UK',
  EN = 'EN',
}

export enum ExerciseType {
  TYPE_THE_ANSWER = 'TYPE_THE_ANSWER',
  FLASHCARDS = 'FLASHCARDS',
  FILL_IN_BLANK = 'FILL_IN_BLANK',
  BUILD_SENTENCE = 'BUILD_SENTENCE',
}

export enum SessionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export enum SubscriptionStatus {
  TRIALING = 'TRIALING',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
}

export enum Platform {
  STRIPE = 'STRIPE',
  APP_STORE = 'APP_STORE',
  GOOGLE_PLAY = 'GOOGLE_PLAY',
}

export enum Currency {
  EUR = 'EUR',
  USD = 'USD',
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  nativeLanguage: NativeLanguage | null;
  xpTotal: number;
  currentStreak: number;
}

export interface ExerciseTopic {
  id: string;
  nameHr: string;
  nameRu: string;
  nameUk: string;
  nameEn: string;
  sortOrder: number;
  isActive: boolean;
  exerciseTypes: ExerciseType[];
  rulesHtmlHr: string | null;
  rulesHtmlRu: string | null;
  rulesHtmlUk: string | null;
  rulesHtmlEn: string | null;
}

export interface TypeTheAnswerItem {
  id: string;
  topicId: string;
  baseForm: string;
  answer: string;
  translationRu: string;
  translationUk: string;
  translationEn: string;
  sortOrder: number;
}

export interface FlashcardItem {
  id: string;
  topicId: string;
  frontText: string;
  translationRu: string;
  translationUk: string;
  translationEn: string;
  sortOrder: number;
}

export interface FillInBlankItem {
  id: string;
  topicId: string;
  sentenceHr: string;
  blankAnswer: string;
  translationRu: string;
  translationUk: string;
  translationEn: string;
  sortOrder: number;
}

export interface BuildSentenceWordOption {
  id: string;
  wordHr: string;
  position: number;
  options: string[];
}

export interface BuildSentenceItem {
  id: string;
  topicId: string;
  translationRu: string;
  translationUk: string;
  translationEn: string;
  sortOrder: number;
  words: BuildSentenceWordOption[];
}

export type ExerciseItem =
  | ({ type: ExerciseType.TYPE_THE_ANSWER } & TypeTheAnswerItem)
  | ({ type: ExerciseType.FLASHCARDS } & FlashcardItem)
  | ({ type: ExerciseType.FILL_IN_BLANK } & FillInBlankItem)
  | ({ type: ExerciseType.BUILD_SENTENCE } & BuildSentenceItem);

export interface CreateSessionRequest {
  topicId: string;
  exerciseType: ExerciseType;
}

export interface SessionResponse {
  id: string;
  exerciseType: ExerciseType;
  topicId: string;
  status: SessionStatus;
  items: ExerciseItem[];
  totalQuestions: number;
  rulesHtmlHr: string | null;
  rulesHtmlRu: string | null;
  rulesHtmlUk: string | null;
  rulesHtmlEn: string | null;
}

export interface FinishSessionRequest {
  answers: {
    itemId: string;
    givenAnswer: string;
    isCorrect: boolean;
  }[];
}

export interface FinishSessionResponse {
  sessionId: string;
  correctAnswers: number;
  totalQuestions: number;
  xpEarned: number;
  newXpTotal: number;
  currentStreak: number;
  longestStreak: number;
}

export interface ResetCycleRequest {
  topicId: string;
  exerciseType: ExerciseType;
}

export interface GamificationStats {
  xpTotal: number;
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate?: string | null;
}

// --- Dictionary types ---

export type VocabularyExerciseType =
  | 'word-to-translate'
  | 'translate-to-word'
  | 'letter-pick'
  | 'matching';

export interface DictionaryWord {
  id: string;
  wordHr: string;
  translation: string;
  translationLanguage: NativeLanguage;
  collectionId: string | null;
  collectionName: string | null;
  progressPercent: number;
  wordToTranslatePercent: number;
  translateToWordPercent: number;
  letterPickPercent: number;
  matchingPercent: number;
  isLearned: boolean;
  createdAt: string;
}

export interface DictionaryCollection {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  sortOrder: number;
  wordCount?: number;
  predefinedWordCount?: number;
  type: 'predefined' | 'personal';
}

export interface PredefinedDictionaryWord {
  id: string;
  collectionId: string;
  wordHr: string;
  translationRu: string;
  translationUk: string;
  translationEn: string;
  sortOrder: number;
}

export interface AddSetRequest {
  wordIds?: string[];
}

export interface AddSetResponse {
  addedCount: number;
  skippedCount: number;
}

export interface TranslationSuggestion {
  translation: string;
  count: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  total: number;
}

export interface DictionaryPracticeItem {
  wordId: string;
  wordHr: string;
  translation: string;
}

export interface DictionaryPracticeSessionResponse {
  sessionId: string;
  items: DictionaryPracticeItem[];
  totalQuestions: number;
}

export interface FinishDictionaryPracticeResponse {
  sessionId: string;
  correctAnswers: number;
  totalQuestions: number;
  xpEarned: number;
  newXpTotal: number;
  currentStreak: number;
  longestStreak: number;
}

export interface SpeedQuizOutcome {
  wordId: string;
  progressTarget: 0 | 100;
}

export interface StartDictionaryPracticeRequest {
  collectionId?: string;
  count?: number;
  wordIds?: string[];
  exerciseType?: VocabularyExerciseType;
  filter?: 'newest' | 'oldest' | 'progress';
  learnedOnly?: boolean;
}

export interface FinishDictionaryPracticeRequest {
  answers: { wordId: string; givenAnswer: string; isCorrect: boolean }[];
  exerciseType?: VocabularyExerciseType;
  speedQuizOutcomes?: SpeedQuizOutcome[];
}
