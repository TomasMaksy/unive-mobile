import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { KNOWLEDGE_TABS, type KnowledgeListProps } from '@/components/knowledge-list-types';
import { PageTitle } from '@/components/page-title';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

export type { KnowledgeListProps } from '@/components/knowledge-list-types';

/** Android and web: a simple version (iOS gets a native list, see knowledge-list.ios.tsx). */
export function KnowledgeList({ knowledge, tab, onTabChange, onOpen, onRefresh }: KnowledgeListProps) {
  const groups =
    tab === 'activities'
      ? ([
          ['experiences', 'Activities', knowledge.experiences.map((e) => [e.id, e.title])],
          ['professions', 'Work experience', knowledge.professions.map((p) => [p.id, p.name])],
          ['achievements', 'Achievements', knowledge.achievements.map((a) => [a.id, a.title])],
          ['references', 'References', knowledge.references.map((r) => [r.id, r.fullName])],
        ] as const)
      : tab === 'other'
        ? ([
            ['notes', 'Notes', knowledge.notes.map((n) => [n.id, n.content])],
            ['languages', 'Languages', knowledge.languages.map((l) => [l.language, l.language])],
          ] as const)
        : [];

  return (
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={false} onRefresh={() => void onRefresh()} />}>
      <PageTitle>Knowledge Library</PageTitle>
      <ThemedText type="subtitle">{Math.round(knowledge.completion.displayPercent)}% complete</ThemedText>
      <View style={styles.tabs}>
        {KNOWLEDGE_TABS.map((option) => (
          <Pressable key={option.value} onPress={() => onTabChange(option.value)}>
            <ThemedText themeColor={tab === option.value ? 'olive' : 'textSecondary'}>{option.label}</ThemedText>
          </Pressable>
        ))}
      </View>
      {groups.map(([kind, title, items]) => (
        <View key={kind} style={styles.group}>
          <ThemedText type="smallBold">{title}</ThemedText>
          {items.map(([id, label]) => (
            <Pressable key={id} onPress={() => onOpen(kind, id)}>
              <ThemedText numberOfLines={1}>{label}</ThemedText>
            </Pressable>
          ))}
          <Pressable onPress={() => onOpen(kind)}>
            <ThemedText themeColor="olive">Add</ThemedText>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.three, backgroundColor: Colors.backgroundGrouped },
  tabs: { flexDirection: 'row', gap: Spacing.four },
  group: { gap: Spacing.two },
});
