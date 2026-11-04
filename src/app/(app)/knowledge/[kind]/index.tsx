import { Image } from "expo-image";
import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useRef } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  FadeInDown,
  LinearTransition,
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { PageTitle } from "@/components/page-title";
import { PressableScale } from "@/components/pressable-scale";
import { ThemedText } from "@/components/themed-text";
import { Colors, Fonts, Shape, Spacing } from "@/constants/theme";
import { confirmDelete } from "@/features/knowledge/delete";
import {
  type ItemSummary,
  SECTION_ICON,
  SECTIONS,
  summaries,
} from "@/features/knowledge/sections";
import { type KnowledgeKind, useKnowledge } from "@/lib/knowledge";

const ICON_SIZE = 48;

/** One section of the Knowledge Library (Activities, Notes…), every item in full. */
export default function KnowledgeSectionScreen() {
  const { kind } = useLocalSearchParams<{ kind: KnowledgeKind }>();
  const router = useRouter();
  const knowledge = useKnowledge();
  const section = SECTIONS[kind];
  if (!knowledge || !section) return null;
  const items = summaries(knowledge, kind);

  const add = () =>
    router.push({ pathname: "/knowledge/[kind]/item", params: { kind } });

  return (
    <>
      <Stack.Screen options={{ headerBackTitle: "Library" }} />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="plus"
          accessibilityLabel={section.addLabel}
          onPress={add}
        />
      </Stack.Toolbar>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <PageTitle>{section.title}</PageTitle>
          <ThemedText type="small" themeColor="textSecondary">
            {section.blurb}
          </ThemedText>
        </View>

        {items.length === 0 ? (
          <Animated.View
            entering={FadeInDown.duration(380)}
            style={[styles.card, styles.empty]}
          >
            <Image
              source={{ uri: SECTION_ICON(kind) }}
              style={styles.emptyArt}
              contentFit="contain"
            />
            <ThemedText themeColor="textSecondary" style={styles.emptyText}>
              Nothing here yet. The more Unive knows, the better its advice.
            </ThemedText>
            <PressableScale
              haptic
              accessibilityRole="button"
              onPress={add}
              style={styles.addButton}
            >
              <ThemedText style={styles.addText}>{section.addLabel}</ThemedText>
            </PressableScale>
          </Animated.View>
        ) : (
          <View style={styles.list}>
            {items.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(
                  380,
                )}
                layout={LinearTransition}
              >
                <Row kind={kind} item={item} />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

// An item as a card: tap to open it, hold it for Edit and Delete (like
// Notes or Mail), or swipe left to delete it.
function Row({ kind, item }: { kind: KnowledgeKind; item: ItemSummary }) {
  const router = useRouter();
  const swipeable = useRef<SwipeableMethods>(null);
  const isNote = kind === "notes";

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      friction={1.6}
      rightThreshold={60}
      overshootRight={false}
      containerStyle={styles.swipe}
      renderRightActions={(progress) => (
        <DeleteAction
          progress={progress}
          onPress={() =>
            confirmDelete(kind, item.id, undefined, () =>
              swipeable.current?.close(),
            )
          }
        />
      )}
    >
      <Link
        href={{
          pathname: "/knowledge/[kind]/item",
          params: { kind, id: item.id },
        }}
        asChild
      >
        <Link.Trigger>
          <PressableScale
            pressedScale={0.98}
            accessibilityRole="button"
            style={CARD}
          >
            {isNote ? null : (
              <Image
                source={{ uri: item.icon }}
                style={styles.icon}
                contentFit="contain"
                transition={200}
              />
            )}
            <View style={styles.text}>
              <ThemedText style={isNote ? styles.note : styles.title}>
                {item.title}
              </ThemedText>
              {item.subtitle ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {item.subtitle}
                </ThemedText>
              ) : null}
              {item.detail ? (
                <ThemedText
                  type="small"
                  themeColor="textMuted"
                  style={styles.detail}
                >
                  {item.detail}
                </ThemedText>
              ) : null}
              {item.body ? (
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  numberOfLines={2}
                  style={styles.body}
                >
                  {item.body}
                </ThemedText>
              ) : null}
            </View>
          </PressableScale>
        </Link.Trigger>
        <Link.Menu>
          <Link.MenuAction
            title="Edit"
            icon="pencil"
            onPress={() =>
              router.push({
                pathname: "/knowledge/[kind]/item",
                params: { kind, id: item.id, edit: "1" },
              })
            }
          />
          <Link.MenuAction
            title="Delete"
            icon="trash"
            destructive
            onPress={() => confirmDelete(kind, item.id)}
          />
        </Link.Menu>
      </Link>
    </ReanimatedSwipeable>
  );
}

// The red Delete behind a card. Hidden until you swipe, so its colour never
// shows around the card's rounded corners.
function DeleteAction({
  progress,
  onPress,
}: {
  progress: SharedValue<number>;
  onPress: () => void;
}) {
  const visible = useAnimatedStyle(() => ({
    opacity: progress.value > 0.01 ? 1 : 0,
  }));
  return (
    <Animated.View style={visible}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Delete"
        onPress={onPress}
        style={styles.delete}
      >
        <ThemedText style={styles.deleteText}>Delete</ThemedText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  header: { paddingHorizontal: Spacing.one, gap: Spacing.one },
  list: { gap: Spacing.two + Spacing.one },
  card: {
    ...Shape.card,
    backgroundColor: Colors.backgroundElement,
  },
  swipe: { ...Shape.card, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.three,
    padding: Spacing.three,
  },
  icon: { width: ICON_SIZE, height: ICON_SIZE },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: Fonts.sansSemiBold, fontSize: 16, lineHeight: 21 },
  note: { fontSize: 15, lineHeight: 22 },
  detail: { fontSize: 13, lineHeight: 18 },
  body: { marginTop: Spacing.one },
  delete: {
    flex: 1,
    width: 96,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.destructive,
  },
  deleteText: { fontFamily: Fonts.sansSemiBold, fontSize: 15, color: "#fff" },
  empty: { alignItems: "center", padding: Spacing.four, gap: Spacing.three },
  emptyArt: { width: 96, height: 96 },
  emptyText: { textAlign: "center" },
  addButton: {
    ...Shape.pill,
    backgroundColor: Colors.olive,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 2,
  },
  addText: { fontFamily: Fonts.sansSemiBold, fontSize: 15, color: "#fff" },
});

// One style object: Link passes it down, and it can't take a list.
const CARD = StyleSheet.flatten([styles.card, styles.row]);
