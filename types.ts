
export enum QuestDifficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export enum QuestType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  LOCATION = 'LOCATION',
  CHOICE = 'CHOICE'
}

export type Language = 'en' | 'sr' | 'es' | 'fr';

export interface Quest {
  id: string;
  title: string;
  description: string;
  difficulty: QuestDifficulty;
  type: QuestType;
  options?: string[];
  locationRange?: { lat: number; lng: number; radius: number };
  completed: boolean;
  saved: boolean;
  points: number;
  timestamp: number;
  userSubmission?: string;
  aiFeedback?: string;
}

export interface UserStats {
  completedCount: number;
  completedEasy: number;
  completedMedium: number;
  completedHard: number;
  lostCount: number;
  currentStreak: number;
  bestStreak: number;
  totalPoints: number;
}

export interface UserProfile {
  username: string;
  stats: UserStats;
  isPremium: boolean;
  dailySkips: number;
  language: Language;
  lastRefreshTimestamp: number;
  history: Quest[];
}
