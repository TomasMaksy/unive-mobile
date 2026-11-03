import { ProfileList } from '@/components/profile-list';
import { ThemedView } from '@/components/themed-view';
import { API_URL, authClient, signOut } from '@/lib/auth-client';

/** Zooms out of the avatar at the top left of every tab (see screen-header.tsx). */
export default function ProfileScreen() {
  const { data: session } = authClient.useSession();

  return (
    <ThemedView style={{ flex: 1 }}>
      <ProfileList
        name={session?.user.name ?? ''}
        email={session?.user.email ?? ''}
        backend={__DEV__ ? API_URL : undefined}
        onSignOut={signOut}
      />
    </ThemedView>
  );
}
