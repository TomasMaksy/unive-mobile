import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { KnowledgeList } from '@/components/knowledge-list';
import type { KnowledgeTab } from '@/components/knowledge-list-types';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { deleteItem, type KnowledgeKind, refreshKnowledge, useKnowledge } from '@/lib/knowledge';
import { FORMS } from '@/lib/knowledge-fields';

/** Everything the AI knows about you, like the website's Knowledge Library. Opened from the profile. */
export default function KnowledgeScreen() {
  const router = useRouter();
  const knowledge = useKnowledge();
  const [tab, setTab] = useState<KnowledgeTab>('general');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    refreshKnowledge().catch(() => setFailed(true));
  }, []);

  function open(kind: KnowledgeKind | 'academics', id?: string) {
    router.push({ pathname: '/knowledge/[kind]', params: id ? { kind, id } : { kind } });
  }

  function remove(kind: KnowledgeKind, id: string) {
    const noun = FORMS[kind].noun;
    Alert.alert(`Delete ${noun.toLowerCase()}?`, 'The AI will no longer know about it.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteItem(kind, id);
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {
            Alert.alert(`Couldn't delete this ${noun.toLowerCase()}`, 'Please try again.');
          }
        },
      },
    ]);
  }

  if (!knowledge) {
    return (
      <View style={styles.center}>
        {failed ? (
          <Pressable
            onPress={() => {
              setFailed(false);
              refreshKnowledge().catch(() => setFailed(true));
            }}
            style={styles.retry}>
            <ThemedText themeColor="textSecondary">Couldn’t load your Knowledge Library.</ThemedText>
            <ThemedText themeColor="olive">Try again</ThemedText>
          </Pressable>
        ) : (
          <ActivityIndicator color={Colors.textSecondary} />
        )}
      </View>
    );
  }

  return (
    <KnowledgeList
      knowledge={knowledge}
      tab={tab}
      onTabChange={(next) => {
        void Haptics.selectionAsync();
        setTab(next);
      }}
      onOpen={open}
      onDelete={remove}
      onEditAcademics={() => open('academics')}
      onRefresh={() => refreshKnowledge().catch(() => {})}
    />
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
