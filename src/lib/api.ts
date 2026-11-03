import { API_URL, authClient } from '@/lib/auth-client';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Headers that authenticate a request to unive-v2 as the signed-in user. */
export async function authHeaders(): Promise<Record<string, string>> {
  const cookie = await authClient.getCookie();
  return cookie ? { Cookie: cookie } : {};
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    // The session is sent by hand; the native cookie jar must not add its own.
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json',
      ...(await authHeaders()),
      ...init.headers,
    },
  });

  // Without a valid session, unive-v2 redirects to an HTML page instead of
  // returning JSON. Re-check the session so the app returns to sign-in.
  if (!response.headers.get('content-type')?.includes('application/json')) {
    authClient.$store.notify('$sessionSignal');
    throw new ApiError('Your session has expired. Please sign in again.', 401);
  }

  const body = await response.json();
  if (!response.ok) {
    throw new ApiError(body?.error ?? `Request failed (${response.status})`, response.status);
  }
  return body as T;
}
