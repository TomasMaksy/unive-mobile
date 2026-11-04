import * as Haptics from 'expo-haptics';
import { Stack, useNavigation, usePreventRemove, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { SettingsForm } from '@/components/settings-form';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { authClient } from '@/lib/auth-client';
import { refreshProfileImage } from '@/lib/profile-image';
import { useEditProfilePhoto } from '@/lib/use-edit-profile-photo';
import {
  type CalendarStatus,
  changeEmail,
  connectGoogleCalendar,
  eraseEverything,
  fetchCalendarStatus,
  fetchSettings,
  linkGoogleCalendar,
  type ProfileChanges,
  type Settings,
  saveProfile,
  unlinkGoogleCalendar,
} from '@/lib/settings';

function changesOf(settings: Settings): ProfileChanges {
  const { name, lastName, phone, gender, birthDate } = settings.profile;
  return { name, lastName, phone, gender, birthDate };
}

function sameChanges(a: ProfileChanges, b: ProfileChanges) {
  return (
    a.name.trim() === b.name.trim() &&
    a.lastName.trim() === b.lastName.trim() &&
    (a.phone ?? '').trim() === (b.phone ?? '').trim() &&
    a.gender === b.gender &&
    a.birthDate === b.birthDate
  );
}

/** Your details and account, like the website's Settings page. Opened from the profile. */
export default function SettingsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [draft, setDraft] = useState<ProfileChanges | null>(null);
  const [saving, setSaving] = useState(false);
  const [calendar, setCalendar] = useState<CalendarStatus | null>(null);
  const [calendarScope, setCalendarScope] = useState<string | null>(null);
  const [calendarBusy, setCalendarBusy] = useState(false);
  const [erasing, setErasing] = useState(false);
  const photo = useEditProfilePhoto();

  const load = useCallback(() => {
    const settingsLoaded = fetchSettings().then(
      (next) => {
        setSettings(next);
        setDraft(changesOf(next));
      },
      () => setLoadError(true),
    );
    fetchCalendarStatus()
      .then(({ scope, ...status }) => {
        setCalendar(status);
        setCalendarScope(scope);
      })
      .catch(() => {});
    return settingsLoaded;
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = settings !== null && draft !== null && !sameChanges(draft, changesOf(settings));
  const canSave = dirty && !saving && draft.name.trim().length > 0;

  async function save() {
    if (!draft || !settings || !canSave) return false;
    setSaving(true);
    try {
      await saveProfile(draft);
      setSettings({ ...settings, profile: { ...settings.profile, ...draft } });
      // The name shows elsewhere too (the AI's greeting, the profile), from the session.
      authClient.$store.notify('$sessionSignal');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch (error) {
      Alert.alert("Couldn't save your changes", error instanceof Error ? error.message : 'Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  // Leaving with edits that aren't saved: ask first, like the website does. Discard and
  // Save first clear the edits, so leaving isn't stopped again, then leave (below).
  const [leaveAction, setLeaveAction] = useState<Parameters<typeof navigation.dispatch>[0] | null>(null);
  usePreventRemove(dirty, ({ data }) => {
    Alert.alert('Unsaved changes', 'Save your changes before leaving, or discard them.', [
      { text: 'Keep Editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          setDraft(changesOf(settings!));
          setLeaveAction(data.action);
        },
      },
      {
        text: 'Save',
        isPreferred: true,
        onPress: async () => {
          if (await save()) setLeaveAction(data.action);
        },
      },
    ]);
  });
  useEffect(() => {
    if (leaveAction && !dirty) navigation.dispatch(leaveAction);
  }, [leaveAction, dirty, navigation]);

  function editEmail() {
    if (!settings) return;
    if (Platform.OS !== 'ios') {
      Alert.alert('Change your email', 'You can change your sign-in email in Settings on unive.ai.');
      return;
    }
    Alert.prompt(
      'Change Email',
      'You’ll sign in to Unive with this address.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Next',
          isPreferred: true,
          onPress: (value?: string) => {
            const next = value?.trim().toLowerCase();
            if (!next || next === settings.profile.email) return;
            confirmEmail(next);
          },
        },
      ],
      'plain-text',
      settings.profile.email,
      'email-address',
    );
  }

  function confirmEmail(next: string) {
    Alert.alert('Change email address?', `Your new sign-in email will be ${next}.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Change',
        isPreferred: true,
        onPress: async () => {
          try {
            await changeEmail(next);
            setSettings((current) => current && { ...current, profile: { ...current.profile, email: next } });
            authClient.$store.notify('$sessionSignal');
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (error) {
            Alert.alert("Couldn't change your email", error instanceof Error ? error.message : 'Please try again.');
          }
        },
      },
    ]);
  }

  async function linkCalendar() {
    if (!calendarScope) return;
    setCalendarBusy(true);
    try {
      await linkGoogleCalendar(calendarScope);
      setCalendar(await connectGoogleCalendar());
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Couldn't link Google Calendar", error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setCalendarBusy(false);
    }
  }

  function unlinkCalendar() {
    Alert.alert('Unlink Google Calendar?', 'The Unive deadlines calendar will be removed from this Google account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unlink',
        style: 'destructive',
        onPress: async () => {
          setCalendarBusy(true);
          try {
            setCalendar(await unlinkGoogleCalendar());
          } catch {
            Alert.alert("Couldn't unlink Google Calendar", 'Please try again.');
          } finally {
            setCalendarBusy(false);
          }
        },
      },
    ]);
  }

  function erase() {
    Alert.alert(
      'Erase all stored data?',
      'This permanently removes your profile, all knowledge and notes, extracurricular analyses, AI chats, uploads, saved schools and scholarships, essays and onboarding progress. Your sign-in email and account stay the same. This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Erase Everything',
          style: 'destructive',
          onPress: async () => {
            setErasing(true);
            try {
              await eraseEverything();
              authClient.$store.notify('$sessionSignal');
              void refreshProfileImage();
              await load();
              Alert.alert('Data erased', 'Your account has been reset. You can set it up again on unive.ai.');
            } catch {
              Alert.alert("Couldn't erase your data", 'Please try again.');
            } finally {
              setErasing(false);
            }
          },
        },
      ],
    );
  }

  if (!settings || !draft) {
    return (
      <View style={styles.center}>
        {loadError ? (
          <Pressable
            onPress={() => {
              setLoadError(false);
              void load();
            }}
            style={styles.retry}>
            <ThemedText themeColor="textSecondary">Couldn’t load your settings.</ThemedText>
            <ThemedText themeColor="olive">Try again</ThemedText>
          </Pressable>
        ) : (
          <ActivityIndicator color={Colors.textSecondary} />
        )}
      </View>
    );
  }

  return (
    <>
      {dirty && (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button variant="prominent" tintColor={Colors.olive} disabled={!canSave} onPress={() => void save()}>
            {saving ? 'Saving…' : 'Save'}
          </Stack.Toolbar.Button>
        </Stack.Toolbar>
      )}
      <SettingsForm
        name={[draft.name, draft.lastName].filter(Boolean).join(' ') || settings.profile.email}
        imageUrl={photo.imageUrl}
        uploadingPhoto={photo.uploading}
        onEditPhoto={photo.editPhoto}
        draft={draft}
        onChange={(changes) => setDraft((current) => current && { ...current, ...changes })}
        email={settings.profile.email}
        onEditEmail={editEmail}
        subscribed={settings.subscribed}
        calendar={calendar}
        calendarBusy={calendarBusy}
        onLinkCalendar={() => void linkCalendar()}
        onUnlinkCalendar={unlinkCalendar}
        onOpenKnowledge={() => router.push('/knowledge')}
        erasing={erasing}
        onErase={erase}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundGrouped,
  },
  retry: {
    alignItems: 'center',
    gap: Spacing.one,
  },
});
