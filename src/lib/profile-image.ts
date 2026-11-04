import { useEffect, useSyncExternalStore } from 'react';

import { ApiError, apiFetch, authHeaders } from '@/lib/api';
import { API_URL } from '@/lib/auth-client';

// Your profile picture, the same one the website shows. unive-v2 keeps it
// private, so the app asks for a signed link that expires
// (src/app/api/mobile/profile-image/route.ts there).

type ProfileImage = { url: string | null };

let current: string | null | undefined; // undefined: not loaded yet
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function set(url: string | null) {
  current = url;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Loads the link once and shares it: the tab avatar and the profile show the same picture. */
export function useProfileImage() {
  const url = useSyncExternalStore(subscribe, () => current);
  useEffect(() => {
    if (current === undefined) void refreshProfileImage();
  }, []);
  return url ?? null;
}

export function refreshProfileImage() {
  loading ??= apiFetch<ProfileImage>('/api/mobile/profile-image')
    .then(({ url }) => set(url))
    .catch(() => {}) // No picture shown; the initial stands in.
    .finally(() => {
      loading = null;
    });
  return loading;
}

/** Uploads a picture from the photo library or camera (a local file). */
export async function uploadProfileImage(uri: string, mimeType = 'image/jpeg') {
  const form = new FormData();
  // React Native's FormData sends a local file given its uri, name and type.
  form.append('file', { uri, name: `avatar.${mimeType.split('/')[1] ?? 'jpg'}`, type: mimeType } as unknown as Blob);

  const response = await fetch(`${API_URL}/api/mobile/profile-image`, {
    method: 'POST',
    body: form,
    credentials: 'omit',
    headers: await authHeaders(), // fetch sets the multipart Content-Type itself.
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(body.error ?? 'Could not upload your picture.', response.status);
  set(body.url);
}

export async function removeProfileImage() {
  await apiFetch<ProfileImage>('/api/mobile/profile-image', { method: 'DELETE' });
  set(null);
}

/**
 * Signed links change each time, but the file behind one doesn't (a new
 * picture gets a new file name), so the image cache can key on the path.
 */
export function profileImageCacheKey(url: string) {
  return url.split('?')[0];
}
