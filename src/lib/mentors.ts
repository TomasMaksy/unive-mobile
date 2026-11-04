import * as WebBrowser from 'expo-web-browser';

import { Colors } from '@/constants/theme';
import { apiFetch } from '@/lib/api';
import { API_URL } from '@/lib/auth-client';

// Unive's tutors, the same as the website's Mentors page (unive-v2's
// src/app/api/mobile/mentors wraps its data and recommendations).

export type Mentor = {
  name: string;
  description: string;
  university: string;
  major: string;
  /** A path on unive-v2; see mentorImageUrl. */
  imagePath: string;
  /** The Cal.com page to book a session (discounted with a plan). */
  bookingUrl: string;
  /** Why it's recommended to you (only for recommended mentors). */
  why?: string;
};

export type Mentors = {
  recommended: Mentor[];
  others: Mentor[];
  /** Per session, in USD: discounted with a plan. */
  price: number;
  regularPrice: number;
  prefill: { name: string; email: string };
};

export function fetchMentors() {
  return apiFetch<Mentors>('/api/mobile/mentors');
}

export function mentorImageUrl(mentor: Mentor) {
  return `${API_URL}${mentor.imagePath}`;
}

/**
 * Opens the mentor's Cal.com page in Safari, in a sheet over the app, with
 * your name and email filled in, like the website's booking dialog. Booking a
 * session with a person is paid on Cal.com, which App Store rules allow.
 */
export function bookMentor(mentor: Mentor, prefill: Mentors['prefill']) {
  const url = new URL(mentor.bookingUrl);
  if (prefill.name) url.searchParams.set('name', prefill.name);
  if (prefill.email) url.searchParams.set('email', prefill.email);
  return WebBrowser.openBrowserAsync(url.toString(), {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    controlsColor: Colors.olive,
    dismissButtonStyle: 'close',
  });
}
