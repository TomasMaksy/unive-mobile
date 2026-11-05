import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { MentorCard } from '@/components/mentor-card';
import { PageTitle } from '@/components/page-title';
import { ErrorState, Skeleton, Text } from '@/components/ui';
import { colors, duration, easeUnive, space } from '@/theme';
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
        <Text color="textSecondary">
          A 1-on-1 with a tutor from Harvard, MIT, Stanford and more, for your list, essays or a final read.
        </Text>
        <View style={styles.guarantee}>
          <SymbolView name="checkmark.seal.fill" size={15} tintColor={colors.accent} style={styles.guaranteeIcon} />
          <Text variant="small" color="textSecondary">
            Not helpful? Full refund.
          </Text>
        </View>
      </View>

      {mentors ? (
        <Animated.View entering={FadeIn.duration(duration.standard).easing(easeUnive)} style={styles.sections}>
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
        <ErrorState message="Couldn’t load the mentors." onRetry={reload} fill={false} />
      ) : (
        <View style={styles.section}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} shape="block" height={92} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      {title ? (
        <Text variant="label" color="textSecondary" style={styles.sectionTitle}>
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space[4],
    paddingBottom: space[16],
    gap: space[6],
  },
  header: {
    paddingHorizontal: space[1],
    gap: space[2],
  },
  guarantee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
  },
  guaranteeIcon: {
    width: 16,
    height: 16,
  },
  sections: {
    gap: space[6],
  },
  section: {
    gap: space[2],
  },
  sectionTitle: {
    paddingHorizontal: space[1],
  },
});
