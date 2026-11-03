// Its own file so both profile-list.tsx and profile-list.ios.tsx can import it:
// on iOS, '@/components/profile-list' resolves to the .ios file itself.

/** The screens the profile links to, in order (see src/app/(app)). */
export const PROFILE_LINKS = [
  { screen: 'knowledge', title: 'Knowledge Library', systemImage: 'books.vertical.fill' },
  { screen: 'guide', title: 'Application Guide', systemImage: 'map.fill' },
  { screen: 'mentors', title: 'Mentors', systemImage: 'person.2.fill' },
  { screen: 'settings', title: 'Settings', systemImage: 'gearshape.fill' },
] as const;

export type ProfileScreen = (typeof PROFILE_LINKS)[number]['screen'];
