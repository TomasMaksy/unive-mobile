import type { Academics } from '@/lib/knowledge';
import type { Draft, FormSpec } from '@/lib/knowledge-fields';

// Your test scores, edited together. Same ranges as the website's.

export const ACADEMICS_FORM: FormSpec['sections'] = [
  {
    title: 'Scores',
    footer: 'Leave a score empty if you haven’t taken the test.',
    fields: [
      { key: 'gpa', label: 'GPA', type: 'text', keyboard: 'decimal-pad', placeholder: '0.00 – 4.00' },
      { key: 'actComposite', label: 'ACT', type: 'text', keyboard: 'numeric', placeholder: '1 – 36' },
      { key: 'satReading', label: 'SAT Reading & Writing', type: 'text', keyboard: 'numeric', placeholder: '200 – 800' },
      { key: 'satMath', label: 'SAT Math', type: 'text', keyboard: 'numeric', placeholder: '200 – 800' },
    ],
  },
];

const RANGES: Record<keyof Academics, [number, number]> = {
  gpa: [0, 4],
  actComposite: [1, 36],
  satReading: [200, 800],
  satMath: [200, 800],
};

export function academicsDraft(academics: Academics): Draft {
  return Object.fromEntries(Object.entries(academics).map(([key, value]) => [key, value == null ? '' : String(value)]));
}

/** The scores as numbers, or null where one is out of range. */
export function parseAcademics(draft: Draft): Academics | null {
  const result = {} as Academics;
  for (const key of Object.keys(RANGES) as (keyof Academics)[]) {
    const raw = typeof draft[key] === 'string' ? (draft[key] as string).trim().replace(',', '.') : '';
    if (!raw) {
      result[key] = null;
      continue;
    }
    const value = Number(raw);
    const [min, max] = RANGES[key];
    const whole = key !== 'gpa';
    if (!Number.isFinite(value) || value < min || value > max || (whole && !Number.isInteger(value))) return null;
    result[key] = key === 'gpa' ? Math.round(value * 100) / 100 : value;
  }
  return result;
}
