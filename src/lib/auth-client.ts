import { expoClient } from '@better-auth/expo/client';
import { emailOTPClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

/** The unive-v2 web app, which also serves the API. Override with EXPO_PUBLIC_API_URL. */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://unive.ai';

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({ scheme: 'unive', storagePrefix: 'unive', storage: SecureStore }),
    emailOTPClient(),
  ],
});

/**
 * The backend doesn't run better-auth's expo() plugin, so it rejects sign-out
 * (a POST with a session but no Origin header). The client still wipes the
 * stored session before sending, so this only signs out on this device; the
 * server session lives until it expires.
 */
export async function signOutOnDevice() {
  await authClient.signOut().catch(() => {});
}
