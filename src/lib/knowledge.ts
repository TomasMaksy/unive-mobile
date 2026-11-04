import { useSyncExternalStore } from 'react';

import { apiFetch } from '@/lib/api';

// The Knowledge Library: everything the AI knows about you, the same as the
// website's /dashboard/knowledge. unive-v2's /api/mobile/knowledge loads it
// all, and /api/mobile/knowledge/{kind} wraps the website's save actions.

export const EXPERIENCE_KINDS = [
  { value: 'extracurricular', label: 'Extracurricular' },
  { value: 'volunteer', label: 'Volunteering' },
  { value: 'research', label: 'Research' },
  { value: 'personal_project', label: 'Personal project' },
] as const;
export type ExperienceKind = (typeof EXPERIENCE_KINDS)[number]['value'];

export const PROFICIENCIES = [
  { value: 'native', label: 'Native' },
  { value: 'fluent', label: 'Fluent' },
  { value: 'proficient', label: 'Proficient' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'beginner', label: 'Beginner' },
] as const;
export type Proficiency = (typeof PROFICIENCIES)[number]['value'];

export const CONNECTION_ROLES = [
  { value: 'teacher', label: 'Teacher' },
  { value: 'counselor', label: 'Counselor' },
  { value: 'professor', label: 'Professor' },
  { value: 'manager', label: 'Manager' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'co-worker', label: 'Co-worker' },
  { value: 'tutor', label: 'Tutor' },
] as const;
export type ConnectionRole = (typeof CONNECTION_ROLES)[number]['value'];

export const EDUCATION_STAGES: Record<string, string> = {
  'high-school-9th-grade': 'High school, 9th grade',
  'high-school-10th-grade': 'High school, 10th grade',
  'high-school-11th-grade': 'High school, 11th grade',
  'high-school-12th-grade': 'High school, 12th grade',
  'college-year-1': 'College, year 1',
  'college-year-2': 'College, year 2',
  'college-year-3': 'College, year 3',
  'college-year-4': 'College, year 4',
  'college-year-5-plus': 'College, year 5+',
  'masters-student': 'Master’s student',
  'doctoral-student': 'Doctoral student',
};

/** Same limits as the website's forms (src/features/knowledge/field-limits.ts there). */
export const LIMITS = {
  title: 120,
  description: 1000,
  achievementTitle: 160,
  referenceDetails: 2000,
  language: 80,
  certification: 200,
  note: 500,
  skills: 12,
} as const;

/** "YYYY-MM-DD", as stored. */
type IsoDate = string;

export type Experience = {
  id: string;
  title: string;
  organization: string | null;
  kind: ExperienceKind;
  startDate: IsoDate | null;
  endDate: IsoDate | null;
  description: string;
  skills: string[];
  iconImage: string;
};

export type Achievement = {
  id: string;
  title: string;
  issuerOrEvent: string | null;
  achievementDate: IsoDate | null;
  description: string | null;
  experienceId: string | null;
};

export type Profession = {
  id: string;
  name: string;
  company: string | null;
  startDate: IsoDate;
  endDate: IsoDate | null;
  isCurrent: boolean;
  description: string | null;
};

export type Reference = {
  id: string;
  fullName: string;
  organization: string | null;
  email: string | null;
  phone: string | null;
  relationship: string | null;
  connectionRole: ConnectionRole | null;
  agreedToWriteRecLetter: boolean;
  experienceId: string | null;
};

export type Language = {
  language: string;
  proficiency: Proficiency;
  certificationOrCourse: string | null;
};

export type Note = { id: string; content: string; createdBy: 'user' | 'agent'; updatedAt: string };

type SchoolShape =
  | null
  | { type: 'homeSchooled' }
  | { type?: string; name?: string; custom?: { name?: string }; [key: string]: unknown };

export type Academics = {
  gpa: number | null;
  actComposite: number | null;
  satReading: number | null;
  satMath: number | null;
};

export type Knowledge = {
  static: {
    location: { country: string | null; state?: string | null };
    education: { educationStage?: string | null; highSchool: SchoolShape; university: SchoolShape };
    academics: Academics;
  };
  experiences: Experience[];
  achievements: Achievement[];
  professions: Profession[];
  references: Reference[];
  languages: Language[];
  notes: Note[];
  studyInterests: { cipCode: string; name: string }[];
  completion: {
    general: { earned: number; max: number };
    extracurriculars: { earned: number; max: number };
    other: { earned: number; max: number };
    displayPercent: number;
  };
};

// One shared copy, so the library and its edit sheets show the same data.
let current: Knowledge | null = null;
const listeners = new Set<() => void>();

function set(next: Knowledge) {
  current = next;
  listeners.forEach((listener) => listener());
}

export function useKnowledge() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
}

// Postgres sends decimals (like GPA) as text; the app works with numbers.
function toNumber(value: unknown) {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export async function refreshKnowledge() {
  const loaded = await apiFetch<Knowledge>('/api/mobile/knowledge');
  const { academics } = loaded.static;
  loaded.static.academics = {
    gpa: toNumber(academics.gpa),
    actComposite: toNumber(academics.actComposite),
    satReading: toNumber(academics.satReading),
    satMath: toNumber(academics.satMath),
  };
  set(loaded);
}

export type KnowledgeKind = 'experiences' | 'achievements' | 'professions' | 'references' | 'languages' | 'notes';

async function write(kind: KnowledgeKind | 'academics', method: 'POST' | 'PATCH' | 'DELETE', body: unknown) {
  await apiFetch(`/api/mobile/knowledge/${kind}`, { method, body: JSON.stringify(body) });
  // Reload, so the completion score moves too.
  await refreshKnowledge();
}

export function addItem(kind: KnowledgeKind, data: unknown) {
  return write(kind, 'POST', data);
}

export function updateItem(kind: KnowledgeKind, id: string, data: unknown) {
  return write(kind, 'PATCH', kind === 'notes' ? { id, content: (data as { content: string }).content } : { id, data });
}

export function deleteItem(kind: KnowledgeKind, id: string) {
  return write(kind, 'DELETE', { id });
}

/** Saves each changed score (the website saves them one at a time too). */
export async function saveAcademics(before: Academics, after: Academics) {
  const fields = (Object.keys(after) as (keyof Academics)[]).filter((field) => before[field] !== after[field]);
  for (const field of fields) {
    await apiFetch('/api/mobile/knowledge/academics', {
      method: 'PATCH',
      body: JSON.stringify({ field, value: after[field] ?? '' }),
    });
  }
  if (fields.length) await refreshKnowledge();
}

// Dates: stored "YYYY-MM-DD", sent as "YYYY-MM" (month precision, like the website).

export function toYearMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function isoToDate(iso: string) {
  const [year, month] = iso.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, 1);
}

const MONTH = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });

export function formatMonth(iso: string | null | undefined) {
  return iso ? MONTH.format(isoToDate(iso)) : null;
}

export function formatRange(start: string | null, end: string | null, ongoing = false) {
  const from = formatMonth(start);
  const to = ongoing ? 'Present' : formatMonth(end);
  if (from && to) return `${from} – ${to}`;
  return from ?? to ?? null;
}

export function schoolName(school: SchoolShape) {
  if (!school) return null;
  if (school.type === 'homeSchooled') return 'Homeschooled';
  const named = school as { name?: string; custom?: { name?: string } };
  return named.name ?? named.custom?.name ?? null;
}

export function labelOf<T extends string>(options: readonly { value: T; label: string }[], value: T | null | undefined) {
  return options.find((option) => option.value === value)?.label ?? null;
}
