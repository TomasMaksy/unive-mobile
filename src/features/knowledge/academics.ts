import type { KeyboardTypeOptions } from 'react-native';

import { apiFetch } from '@/lib/api';
import { type Academics, refreshKnowledge } from '@/lib/knowledge';

// Your test scores, each edited on its own. Same ranges as the website's.

export const SCORES: { key: keyof Academics; label: string; min: number; max: number; keyboard: KeyboardTypeOptions }[] = [
  { key: 'gpa', label: 'GPA', min: 0, max: 4, keyboard: 'decimal-pad' },
  { key: 'actComposite', label: 'ACT', min: 1, max: 36, keyboard: 'number-pad' },
  { key: 'satReading', label: 'SAT Reading & Writing', min: 200, max: 800, keyboard: 'number-pad' },
  { key: 'satMath', label: 'SAT Math', min: 200, max: 800, keyboard: 'number-pad' },
];

export function formatScore(key: keyof Academics, value: number | null) {
  if (value == null) return null;
  return key === 'gpa' ? value.toFixed(2) : String(value);
}

/** The typed score as a number, null for empty, or undefined when it's out of range. */
export function parseScore(key: keyof Academics, raw: string): number | null | undefined {
  const text = raw.trim().replace(',', '.');
  if (!text) return null;
  const value = Number(text);
  const field = SCORES.find((score) => score.key === key)!;
  if (!Number.isFinite(value) || value < field.min || value > field.max) return undefined;
  if (key !== 'gpa' && !Number.isInteger(value)) return undefined;
  return key === 'gpa' ? Math.round(value * 100) / 100 : value;
}

export async function saveScore(key: keyof Academics, value: number | null) {
  await apiFetch('/api/mobile/knowledge/academics', { method: 'PATCH', body: JSON.stringify({ field: key, value: value ?? '' }) });
  await refreshKnowledge();
}
