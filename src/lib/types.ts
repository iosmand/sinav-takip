export interface ExamConfig {
  id: string;
  name: string;
  correctMultiplier: number;
  wrongMultiplier: number;
  blankMultiplier: number;
  totalQuestions?: number;
  isDefault?: boolean;
}

export interface ExamResult {
  id: string;
  configId: string;
  configName: string;
  examName: string;
  subject: string;
  correct: number;
  wrong: number;
  blank: number;
  netScore: number;
  date: string;
}

export interface AppData {
  configs: ExamConfig[];
  results: ExamResult[];
  version: string;
}

export interface DaySummary {
  date: string;
  totalQuestions: number;
  correct: number;
  wrong: number;
  blank: number;
  netScore: number;
  examCount: number;
}

export type Theme = 'light' | 'dark';
export type View = 'counter' | 'calendar' | 'settings';
export type CalendarMode = 'yearly' | 'monthly' | 'weekly' | 'daily';
