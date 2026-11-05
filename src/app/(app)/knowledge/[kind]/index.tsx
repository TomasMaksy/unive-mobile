import { Image } from "expo-image";
import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useRef } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  LinearTransition,
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { PageTitle } from "@/components/page-title";
import { Button, PressableScale, Text } from "@/components/ui";
import { colors, pressScale, riseIn, shape, space } from "@/theme";
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
          <Text variant="small" color="textSecondary">
            {section.blurb}
          </Text>
        </View>

        {items.length === 0 ? (
          <Animated.View
            entering={riseIn(0)}
            style={[styles.card, styles.empty]}
          >
            <Image
              source={{ uri: SECTION_ICON(kind) }}
              style={styles.emptyArt}
              contentFit="contain"
            />
            <Text color="textSecondary" align="center">
              Nothing here yet. The more Unive knows, the better its advice.
            </Text>
            <Button
              label={section.addLabel}
              variant="accent"
              inline
              style={styles.centerSelf}
              onPress={add}
            />
          </Animated.View>
        ) : (
          <View style={styles.list}>
            {items.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={riseIn(Math.min(index, 8))}
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
            pressedScale={pressScale.card}
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
              <Text variant={isNote ? "callout" : "headline"}>
                {item.title}
              </Text>
              {item.subtitle ? (
                <Text variant="small" color="textSecondary">
                  {item.subtitle}
                </Text>
              ) : null}
              {item.detail ? (
                <Text variant="caption" color="textMuted">
                  {item.detail}
                </Text>
              ) : null}
              {item.body ? (
                <Text
                  variant="small"
                  color="textSecondary"
                  numberOfLines={2}
                  style={styles.body}
                >
                  {item.body}
                </Text>
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
        <Text variant="label" color="textInverse">
          Delete
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space[4],
    paddingBottom: space[16],
    gap: space[6],
  },
  header: { paddingHorizontal: space[1], gap: space[1] },
  list: { gap: space[3] },
  card: {
    ...shape.card,
    backgroundColor: colors.surface,
  },
  swipe: { ...shape.card, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space[4],
    padding: space[4],
  },
  icon: { width: ICON_SIZE, height: ICON_SIZE },
  text: { flex: 1, gap: space[0.5] },
  body: { marginTop: space[1] },
  delete: {
    flex: 1,
    width: 96,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.danger,
  },
  empty: { alignItems: "center", padding: space[6], gap: space[4] },
  emptyArt: { width: 96, height: 96 },
  centerSelf: { alignSelf: "center" },
});

// One style object: Link passes it down, and it can't take a list.
const CARD = StyleSheet.flatten([styles.card, styles.row]);
