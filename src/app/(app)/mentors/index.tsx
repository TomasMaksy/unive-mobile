import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { MentorCard } from '@/components/mentor-card';
import { PageTitle } from '@/components/page-title';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { bookMentor, fetchMentors, loadedMentors, type Mentors } from '@/lib/mentors';

/** Unive's tutors to book a 1-on-1 with, like the website's Mentors page. Opened from the profile. */
export default function MentorsScreen() {
  const [mentors, setMentors] = useState<Mentors | null>(loadedMentors);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMentors().then(setMentors, () => setFailed(true));
  }, []);

  function reload() {
    setFailed(false);
    setRefreshing(true);
    fetchMentors()
      .then(setMentors, () => setFailed(true))
      .finally(() => setRefreshing(false));
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} />}>
      <View style={styles.header}>
        <PageTitle>Mentors</PageTitle>
        <ThemedText themeColor="textSecondary">
          A 1-on-1 with a tutor from Harvard, MIT, Stanford and more, for your list, essays or a final read.
        </ThemedText>
        <View style={styles.guarantee}>
          <SymbolView name="checkmark.seal.fill" size={15} tintColor={Colors.olive} style={styles.guaranteeIcon} />
          <ThemedText type="small" themeColor="textSecondary">
            Not helpful? Full refund.
          </ThemedText>
        </View>
      </View>

      {mentors ? (
        <Animated.View entering={FadeIn} style={styles.sections}>
          {mentors.recommended.length > 0 && (
            <Section title="Recommended for you">
              {mentors.recommended.map((mentor, index) => (
                <MentorCard
                  key={mentor.name}
                  mentor={mentor}
                  index={index}
                  price={mentors.price}
                  onBook={() => void bookMentor(mentor, mentors.prefill)}
                />
              ))}
            </Section>
          )}
          <Section title={mentors.recommended.length > 0 ? 'All mentors' : undefined}>
            {mentors.others.map((mentor, index) => (
              <MentorCard
                key={mentor.name}
                mentor={mentor}
                index={mentors.recommended.length + index}
                price={mentors.price}
                onBook={() => void bookMentor(mentor, mentors.prefill)}
              />
            ))}
          </Section>
        </Animated.View>
      ) : failed ? (
        <Pressable onPress={reload} style={styles.status}>
          <ThemedText themeColor="textSecondary">Couldn’t load the mentors.</ThemedText>
          <ThemedText themeColor="olive">Try again</ThemedText>
        </Pressable>
      ) : (
        <ActivityIndicator style={styles.status} color={Colors.textSecondary} />
      )}
    </ScrollView>
  );
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      {title ? (
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
          {title}
        </ThemedText>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  header: {
    paddingHorizontal: Spacing.one,
    gap: Spacing.two,
  },
  guarantee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  guaranteeIcon: {
    width: 16,
    height: 16,
  },
  sections: {
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.one,
  },
  status: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingTop: Spacing.five,
  },
});
