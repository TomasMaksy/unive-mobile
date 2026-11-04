import { apiFetch } from '@/lib/api';
import { type Academics, type Knowledge, refreshKnowledge, saveAcademics } from '@/lib/knowledge';

// About you: education, where you live, scores and study interests, saved the
// way the website's dialogs save them (unive-v2's /api/mobile/knowledge/{kind}
// wraps the same actions). Schools, universities and fields of study are
// searched with the website's own search routes.

export const HIGH_SCHOOL_STAGES = ['high-school-9th-grade', 'high-school-10th-grade', 'high-school-11th-grade', 'high-school-12th-grade'];

/** College and postgraduate stages also ask for a university. */
export const needsUniversity = (stage: string | null) => stage != null && !HIGH_SCHOOL_STAGES.includes(stage);

export type CustomInstitution = { name: string; country: string; state?: string; city?: string };

/** A school as the app holds it while editing: `name` and `detail` are for showing it. */
export type School =
  | { type: 'listed'; nces: string; name: string; detail: string | null }
  | { type: 'homeSchooled' }
  | { type: 'custom'; custom: CustomInstitution };

export type StudyInterest = { cipCode: string; name: string };

export type AboutDraft = {
  stage: string | null;
  highSchool: School | null;
  university: School | null;
  country: string | null;
  state: string | null;
  interests: StudyInterest[];
};

type Shape = Knowledge['static']['education']['highSchool'];

/** The library's school shape (from the website) as one the app can edit. */
export function toSchool(shape: Shape): School | null {
  if (!shape) return null;
  if (shape.type === 'homeSchooled') return { type: 'homeSchooled' };
  if (shape.type === 'custom' && shape.custom) return { type: 'custom', custom: shape.custom as CustomInstitution };
  if (shape.type === 'listed' && typeof shape.nces === 'string') {
    return { type: 'listed', nces: shape.nces, name: String(shape.name ?? ''), detail: place(shape.city as string, shape.state as string) };
  }
  return null;
}

export function schoolLabel(school: School | null) {
  if (!school) return null;
  if (school.type === 'homeSchooled') return 'Homeschooled';
  if (school.type === 'custom') return school.custom.name;
  return titleCase(school.name);
}

const place = (city?: string | null, state?: string | null) => [city && titleCase(city), state].filter(Boolean).join(', ') || null;

// The school lists are in capitals (BRONX HIGH SCHOOL OF SCIENCE); shown in title case.
export function titleCase(text: string) {
  if (text !== text.toUpperCase()) return text;
  return text.toLowerCase().replace(/\b([a-z])/g, (letter) => letter.toUpperCase());
}

// Field-of-study names are stored like "BUSINESS, MANAGEMENT, MARKETING." (the website's titleCaseCipName).
export function interestName(name: string) {
  const trimmed = name.trim().replace(/\.+$/, '');
  return trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase() : trimmed;
}

export function aboutDraft(knowledge: Knowledge): AboutDraft {
  const { education, location } = knowledge.static;
  return {
    stage: education.educationStage ?? null,
    highSchool: toSchool(education.highSchool),
    university: toSchool(education.university),
    country: location.country,
    state: location.state ?? null,
    interests: knowledge.studyInterests.map((interest) => ({ cipCode: interest.cipCode, name: interestName(interest.name) })),
  };
}

const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function schoolInput(school: School) {
  if (school.type === 'listed') return { type: 'listed', nces: school.nces };
  return school;
}

/** What's missing before the draft can be saved, or null. */
export function aboutProblem(draft: AboutDraft): string | null {
  if (!draft.stage) return 'Choose your stage of education.';
  if (!draft.highSchool) return 'Choose your high school, or Homeschooled.';
  if (needsUniversity(draft.stage) && !draft.university) return 'Choose your university.';
  if (!draft.country) return 'Choose your country.';
  if (draft.country === 'US' && !draft.state) return 'Choose your state.';
  return null;
}

async function patch(kind: string, body: unknown) {
  await apiFetch(`/api/mobile/knowledge/${kind}`, { method: 'PATCH', body: JSON.stringify(body) });
}

/** Saves only the parts that changed, then reloads the library once. */
export async function saveAbout(before: AboutDraft, after: AboutDraft, scores: { before: Academics; after: Academics }) {
  const educationChanged =
    before.stage !== after.stage ||
    !sameJson(before.highSchool, after.highSchool) ||
    (needsUniversity(after.stage) && !sameJson(before.university, after.university));
  if (educationChanged) {
    await patch('education', {
      educationStage: after.stage,
      highSchool: schoolInput(after.highSchool!),
      ...(needsUniversity(after.stage) ? { university: schoolInput(after.university!) } : {}),
    });
  }
  if (before.country !== after.country || (after.country === 'US' && before.state !== after.state)) {
    await patch('location', after.country === 'US' ? { country: 'US', state: after.state } : { country: after.country });
  }
  if (!sameJson(before.interests.map((i) => i.cipCode), after.interests.map((i) => i.cipCode))) {
    await patch('interests', { codes: after.interests.map((interest) => interest.cipCode) });
  }
  await saveAcademics(scores.before, scores.after, { reload: false });
  // Once, so every change shows (and the completion score moves).
  await refreshKnowledge();
}

// Searching.

export type SchoolResult = { nces: string; name: string; detail: string | null };

export async function searchSchools(kind: 'highSchool' | 'university', query: string, state: string | null) {
  const params = new URLSearchParams();
  if (query.trim()) params.set('query', query.trim());
  if (state) params.set('state', state);
  if (kind === 'highSchool') {
    const { items } = await apiFetch<{ items: { nces: string; name: string; city: string; state: string }[] }>(`/api/schools/search?${params}`);
    return items.map((item): SchoolResult => ({ nces: item.nces, name: titleCase(item.name), detail: place(item.city, item.state) }));
  }
  const { items } = await apiFetch<{ items: { nces: string; label: string; city: string; state: string }[] }>(
    `/api/institutions/universities/search?${params}`,
  );
  return items.map((item): SchoolResult => ({ nces: item.nces, name: titleCase(item.label), detail: place(item.city, item.state) }));
}

export async function searchInterests(query: string) {
  const params = new URLSearchParams({ mode: 'interest' });
  if (query.trim()) params.set('query', query.trim());
  const { items } = await apiFetch<{ items: { cipCode: string; name: string; path: string[] }[] }>(`/api/fields-of-study/lookup?${params}`);
  return items.slice(0, 40).map((item) => ({
    cipCode: item.cipCode,
    name: interestName(item.name),
    // The broader fields it sits under, like "Engineering › Computer engineering".
    detail: item.path.slice(0, -1).map(interestName).join(' › ') || null,
  }));
}

export type Place = { code: string; name: string };
let places: { countries: Place[]; states: Place[] } | null = null;

/** Every country and US state, with names (loaded once). */
export async function loadPlaces() {
  places ??= await apiFetch<{ countries: Place[]; states: Place[] }>('/api/mobile/places');
  return places;
}

export function placeName(kind: 'country' | 'state', code: string | null) {
  if (!code) return null;
  const list = kind === 'country' ? places?.countries : places?.states;
  return list?.find((entry) => entry.code === code)?.name ?? null;
}
