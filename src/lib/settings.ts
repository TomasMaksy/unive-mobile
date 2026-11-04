import { apiFetch } from '@/lib/api';
import { authClient } from '@/lib/auth-client';

// Settings, the same as the website's settings page (unive-v2's
// src/app/api/mobile/settings and google-calendar routes wrap its actions).

export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
] as const;

export type Gender = (typeof GENDERS)[number]['value'];

export type Profile = {
  name: string;
  lastName: string;
  email: string;
  phone: string | null;
  gender: Gender | null;
  /** YYYY-MM-DD */
  birthDate: string | null;
  country: string | null;
};

export type Settings = {
  profile: Profile;
  /** Paid for on the website; changing or cancelling the plan happens there. */
  subscribed: boolean;
};

export type CalendarStatus = { linked: boolean; syncError: string | null };

export type ProfileChanges = Pick<Profile, 'name' | 'lastName' | 'phone' | 'gender' | 'birthDate'>;

export function fetchSettings() {
  return apiFetch<Settings>('/api/mobile/settings');
}

export function saveProfile(changes: ProfileChanges) {
  return apiFetch<{ success: true }>('/api/mobile/settings', {
    method: 'PATCH',
    body: JSON.stringify({
      name: changes.name.trim(),
      lastName: changes.lastName.trim() || null,
      phone: changes.phone?.trim() || null,
      gender: changes.gender,
      birthDate: changes.birthDate,
    }),
  });
}

export function changeEmail(email: string) {
  return apiFetch<{ success: true }>('/api/mobile/settings/email', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
}

/** Removes everything Unive stores about you except your sign-in email. */
export function eraseEverything() {
  return apiFetch<{ success: true }>('/api/mobile/settings/erase', { method: 'POST' });
}

export function fetchCalendarStatus() {
  return apiFetch<CalendarStatus & { scope: string }>('/api/mobile/google-calendar');
}

/**
 * Asks Google for access to a calendar of Unive's own, in a browser sheet
 * (better-auth's Expo client opens it and waits). Then call
 * connectGoogleCalendar, which creates the "Unive deadlines" calendar, or
 * reports that Google didn't grant access (e.g. you closed the sheet).
 */
export async function linkGoogleCalendar(scope: string) {
  const { error } = await authClient.linkSocial({
    provider: 'google',
    // Back to this screen when Google is done (the app's own link).
    callbackURL: '/settings',
    errorCallbackURL: '/settings',
    scopes: [scope],
    additionalParams: { prompt: 'consent select_account' },
  });
  if (error) throw new Error(error.message ?? "Google Calendar couldn't be linked. Try again.");
}

export function connectGoogleCalendar() {
  return apiFetch<CalendarStatus>('/api/mobile/google-calendar', { method: 'POST' });
}

export function unlinkGoogleCalendar() {
  return apiFetch<CalendarStatus>('/api/mobile/google-calendar', { method: 'DELETE' });
}

/** "2008-03-14" ⇄ a Date at local midnight, which is what the date picker shows. */
export function parseIsoDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
