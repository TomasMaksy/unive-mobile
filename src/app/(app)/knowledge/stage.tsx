import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

import { PageTitle } from "@/components/page-title";
import { PressableScale, Text } from "@/components/ui";
import { colors, haptics, pressScale, riseIn, shape, space } from "@/theme";
import { finishPick } from "@/features/knowledge/picker";
import { siteUrl } from "@/lib/guide";
import { EDUCATION_STAGES } from "@/lib/knowledge";

// Your stage of education in two steps: where you are, then which year.
// Saved as the same values as before ("high-school-11th-grade"…).
const LEVELS: {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  years: { value: string; label: string }[];
}[] = [
  {
    id: "high-school",
    title: "High school",
    subtitle: "Grades 9 to 12",
    icon: "/isomorphic-icons/school.webp",
    years: [
      { value: "high-school-9th-grade", label: "9th" },
      { value: "high-school-10th-grade", label: "10th" },
      { value: "high-school-11th-grade", label: "11th" },
      { value: "high-school-12th-grade", label: "12th" },
    ],
  },
  {
    id: "college",
    title: "College",
    subtitle: "Undergraduate",
    icon: "/isomorphic-icons/university.webp",
    years: [
      { value: "college-year-1", label: "1st" },
      { value: "college-year-2", label: "2nd" },
      { value: "college-year-3", label: "3rd" },
      { value: "college-year-4", label: "4th" },
      { value: "college-year-5-plus", label: "5th+" },
    ],
  },
  {
    id: "masters",
    title: "Master’s",
    subtitle: "Graduate student",
    icon: "/isomorphic-icons/cap.webp",
    years: [{ value: "masters-student", label: "" }],
  },
  {
    id: "doctoral",
    title: "Doctoral",
    subtitle: "PhD student",
    icon: "/isomorphic-icons/brain.webp",
    years: [{ value: "doctoral-student", label: "" }],
  },
];

const levelOf = (stage: string | undefined) =>
  LEVELS.find((level) => level.years.some((year) => year.value === stage));

/** Opened from About you (see features/knowledge/picker.ts). */
export default function StageScreen() {
  const { pick, selected } = useLocalSearchParams<{
    pick: string;
    selected?: string;
  }>();
  const router = useRouter();
  const [levelId, setLevelId] = useState(() => levelOf(selected)?.id ?? null);
  const level = LEVELS.find((entry) => entry.id === levelId);
  const hasYears = level && level.years.length > 1;

  // Closing without a choice tells About you.
  useEffect(() => () => finishPick(pick), [pick]);

  function choose(value: string) {
    haptics.tick();
    finishPick(pick, { code: value, name: EDUCATION_STAGES[value] ?? value });
    router.back();
  }

  function chooseLevel(id: string) {
    const next = LEVELS.find((entry) => entry.id === id)!;
    // Master's and doctoral have no years: one tap is enough.
    if (next.years.length === 1) return choose(next.years[0].value);
    haptics.tick();
    setLevelId(id);
  }

  return (
    <>
      <Stack.Screen options={{ headerBackTitle: "Back" }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <PageTitle>Stage</PageTitle>
          <Text variant="small" color="textSecondary">
            Where are you studying now?
          </Text>
        </View>

        <View style={styles.grid}>
          {LEVELS.map((entry) => {
            const active = entry.id === levelId;
            return (
              <View key={entry.id} style={styles.cell}>
                <PressableScale
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => chooseLevel(entry.id)}
                  style={[
                    styles.card,
                    styles.level,
                    active && styles.levelActive,
                  ]}
                >
                  <Image
                    source={{ uri: siteUrl(entry.icon) }}
                    style={styles.levelArt}
                    contentFit="contain"
                    transition={200}
                  />
                  <Text variant="headline">{entry.title}</Text>
                  <Text variant="small" color="textSecondary">
                    {entry.subtitle}
                  </Text>
                </PressableScale>
              </View>
            );
          })}
        </View>

        {hasYears ? (
          <Animated.View
            key={level.id}
            entering={riseIn(0)}
            layout={LinearTransition}
            style={[styles.card, styles.years]}
          >
            <Text variant="headline">
              {level.id === "high-school" ? "Which grade?" : "Which year?"}
            </Text>
            <View style={styles.yearRow}>
              {level.years.map((year) => {
                const active = year.value === selected;
                return (
                  <View key={year.value} style={styles.yearCell}>
                    <PressableScale
                      pressedScale={pressScale.button}
                      accessibilityRole="button"
                      accessibilityLabel={EDUCATION_STAGES[year.value]}
                      accessibilityState={{ selected: active }}
                      onPress={() => choose(year.value)}
                      style={[styles.year, active && styles.yearActive]}
                    >
                      <Text
                        variant="title"
                        color={active ? "textInverse" : "text"}
                      >
                        {year.label}
                      </Text>
                    </PressableScale>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space[4],
    paddingBottom: space[16],
    gap: space[4],
  },
  header: {
    paddingHorizontal: space[1],
    gap: space[1],
    marginBottom: space[1],
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: space[3],
  },
  card: { ...shape.card, backgroundColor: colors.surface },
  cell: { width: "48.5%" },
  level: {
    padding: space[4],
    gap: space[0.5],
    borderWidth: 2,
    borderColor: colors.transparent,
  },
  levelActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  levelArt: { width: 56, height: 56, marginBottom: space[2] },
  years: {
    padding: space[4],
    paddingHorizontal: space[5],
    gap: space[4],
  },
  yearRow: { flexDirection: "row", gap: space[2] },
  yearCell: { flex: 1 },
  year: {
    alignItems: "center",
    paddingVertical: space[4],
    ...shape.tile,
    backgroundColor: colors.backgroundGrouped,
  },
  yearActive: { backgroundColor: colors.accent },
});
