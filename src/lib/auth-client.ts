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
 * Ends the session on the server too: unive-v2 runs better-auth's expo()
 * plugin, which accepts the app's expo-origin header. It trusts unive:// (our
 * own builds) everywhere and Expo Go only in development, so Expo Go against
 * production still signs out on this device only. The client wipes the stored
 * session either way.
 */
export async function signOut() {
  await authClient.signOut().catch(() => {});
}
