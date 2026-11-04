import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { MentorCard } from '@/components/mentor-card';
import { ThemedText } from '@/components/themed-text';
import { Colors, Shape, Spacing } from '@/constants/theme';
import { bookMentor, fetchMentors, type Mentors } from '@/lib/mentors';

/** Unive's tutors to book a 1-on-1 with, like the website's Mentors page. Opened from the profile. */
export default function MentorsScreen() {
  const [mentors, setMentors] = useState<Mentors | null>(null);
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
      <ThemedText themeColor="textSecondary" style={styles.intro}>
        Sometimes you want a human in the loop. Book a 1-on-1 with a Unive tutor to pressure-test your school list, talk
        through programs, sharpen your essays, or get a final read before you submit.
      </ThemedText>

      <View style={styles.guarantee}>
        <SymbolView name="checkmark.seal.fill" size={18} tintColor={Colors.olive} style={styles.guaranteeIcon} />
        <ThemedText type="small" style={styles.guaranteeText}>
          <ThemedText type="smallBold">100% satisfaction guarantee.</ThemedText> Session wasn’t helpful? We’ll give you a
          full refund.
        </ThemedText>
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
                  regularPrice={mentors.regularPrice}
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
                regularPrice={mentors.regularPrice}
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
          {title.toUpperCase()}
        </ThemedText>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  intro: {
    paddingHorizontal: Spacing.one,
  },
  guarantee: {
    ...Shape.card,
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.three,
    backgroundColor: Colors.backgroundElement,
  },
  guaranteeIcon: {
    width: 18,
    height: 20,
  },
  guaranteeText: {
    flex: 1,
  },
  sections: {
    gap: Spacing.four,
    marginTop: Spacing.two,
  },
  section: {
    gap: Spacing.three,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.one,
    letterSpacing: 0.4,
  },
  status: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingTop: Spacing.five,
  },
});
