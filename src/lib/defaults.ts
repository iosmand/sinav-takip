import type { ExamConfig } from './types';

export const DEFAULT_CONFIGS: ExamConfig[] = [
  {
    id: 'yks',
    name: 'YKS (TYT/AYT)',
    correctMultiplier: 1,
    wrongMultiplier: -0.25,
    blankMultiplier: 0,
    isDefault: true,
  },
  {
    id: 'kpss',
    name: 'KPSS',
    correctMultiplier: 1,
    wrongMultiplier: -0.25,
    blankMultiplier: 0,
    isDefault: true,
  },
  {
    id: 'ales',
    name: 'ALES',
    correctMultiplier: 1,
    wrongMultiplier: -0.25,
    blankMultiplier: 0,
    isDefault: true,
  },
  {
    id: 'dgs',
    name: 'DGS',
    correctMultiplier: 1,
    wrongMultiplier: -0.25,
    blankMultiplier: 0,
    isDefault: true,
  },
];

export const SUBJECTS = [
  'Matematik',
  'Geometri',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Türkçe',
  'Edebiyat',
  'Tarih',
  'Coğrafya',
  'Felsefe',
  'Din Kültürü',
  'İngilizce',
  'Diğer',
];

export const APP_VERSION = '0.3.1';
