import type { ExamConfig, ExamResult, AppData, Theme, DaySummary } from './types';
import { DEFAULT_CONFIGS, APP_VERSION } from './defaults';

const STORAGE_KEY = 'sinav-takip-data';
const THEME_KEY = 'sinav-takip-theme';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data: AppData = JSON.parse(raw);
      const defaultIds = DEFAULT_CONFIGS.map((c) => c.id);
      const hasAllDefaults = defaultIds.every((id) =>
        data.configs.some((c) => c.id === id)
      );
      if (!hasAllDefaults) {
        const missingDefaults = DEFAULT_CONFIGS.filter(
          (dc) => !data.configs.some((c) => c.id === dc.id)
        );
        data.configs = [...missingDefaults, ...data.configs];
      }
      return data;
    }
  } catch {
    // corrupted data
  }
  return {
    configs: [...DEFAULT_CONFIGS],
    results: [],
    version: APP_VERSION,
  };
}

function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch { /* ignore */ }
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function saveTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.setAttribute('data-theme', theme);
}

// --- Configs ---

export function getConfigs(): ExamConfig[] {
  return loadData().configs;
}

export function addConfig(config: Omit<ExamConfig, 'id'>): ExamConfig {
  const data = loadData();
  const newConfig: ExamConfig = { ...config, id: generateId() };
  data.configs.push(newConfig);
  saveData(data);
  return newConfig;
}

export function deleteConfig(id: string): boolean {
  const data = loadData();
  const config = data.configs.find((c) => c.id === id);
  if (!config || config.isDefault) return false;
  data.configs = data.configs.filter((c) => c.id !== id);
  saveData(data);
  return true;
}

// --- Results ---

export function getResults(): ExamResult[] {
  return loadData().results;
}

export function addResult(result: Omit<ExamResult, 'id' | 'date'>): ExamResult {
  const data = loadData();
  const newResult: ExamResult = {
    ...result,
    id: generateId(),
    date: new Date().toISOString(),
  };
  data.results.unshift(newResult);
  saveData(data);
  return newResult;
}

export function updateResult(id: string, updates: Partial<Omit<ExamResult, 'id' | 'date'>>): ExamResult | null {
  const data = loadData();
  const idx = data.results.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  data.results[idx] = { ...data.results[idx], ...updates };
  saveData(data);
  return data.results[idx];
}

export function deleteResult(id: string): void {
  const data = loadData();
  data.results = data.results.filter((r) => r.id !== id);
  saveData(data);
}

export function clearResults(): void {
  const data = loadData();
  data.results = [];
  saveData(data);
}

// --- Import/Export ---

export function exportData(): AppData {
  return loadData();
}

export function exportResults(): ExamResult[] {
  return loadData().results;
}

export function importData(json: string): boolean {
  try {
    const data: AppData = JSON.parse(json);
    if (!data.configs || !data.results || !data.version) return false;
    const defaultIds = DEFAULT_CONFIGS.map((c) => c.id);
    const hasAllDefaults = defaultIds.every((id) =>
      data.configs.some((c) => c.id === id)
    );
    if (!hasAllDefaults) {
      const missingDefaults = DEFAULT_CONFIGS.filter(
        (dc) => !data.configs.some((c) => c.id === dc.id)
      );
      data.configs = [...missingDefaults, ...data.configs];
    }
    saveData(data);
    return true;
  } catch {
    return false;
  }
}

// --- Net Score Calculation ---

export function calculateNet(
  config: ExamConfig,
  correct: number,
  wrong: number,
  blank: number
): number {
  const net =
    correct * config.correctMultiplier +
    wrong * config.wrongMultiplier +
    blank * config.blankMultiplier;
  return Math.round(net * 100) / 100;
}

// --- Calendar Helpers ---

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function getDaySummaries(results: ExamResult[]): Map<string, DaySummary> {
  const map = new Map<string, DaySummary>();
  for (const r of results) {
    const key = r.date.slice(0, 10);
    const existing = map.get(key);
    if (existing) {
      existing.totalQuestions += r.correct + r.wrong + r.blank;
      existing.correct += r.correct;
      existing.wrong += r.wrong;
      existing.blank += r.blank;
      existing.netScore += r.netScore;
      existing.netScore = Math.round(existing.netScore * 100) / 100;
      existing.examCount++;
    } else {
      map.set(key, {
        date: key,
        totalQuestions: r.correct + r.wrong + r.blank,
        correct: r.correct,
        wrong: r.wrong,
        blank: r.blank,
        netScore: r.netScore,
        examCount: 1,
      });
    }
  }
  return map;
}

export function getResultsForDate(results: ExamResult[], dateKey: string): ExamResult[] {
  return results.filter((r) => r.date.slice(0, 10) === dateKey);
}

export function getStreak(summaries: Map<string, DaySummary>): number {
  let streak = 0;
  const today = new Date();
  const d = new Date(today);
  while (true) {
    const key = toDateKey(d);
    if (summaries.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
