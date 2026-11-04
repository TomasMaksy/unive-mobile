import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import type { SearchBarCommands } from 'react-native-screens';

import { PageTitle } from '@/components/page-title';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { loadPlaces, type Place, searchInterests, searchSchools } from '@/features/knowledge/about';
import { finishPick, type Picked, type PickKind } from '@/features/knowledge/picker';

const COPY: Record<Exclude<PickKind, 'stage'>, { title: string; placeholder: string }> = {
  highSchool: { title: 'High school', placeholder: 'Search high schools' },
  university: { title: 'University', placeholder: 'Search universities' },
  country: { title: 'Country', placeholder: 'Search countries' },
  state: { title: 'State', placeholder: 'Search states' },
  interest: { title: 'Study interest', placeholder: 'Search subjects, like biology' },
};

type Row = { key: string; title: string; detail?: string | null; value: Picked; accent?: boolean };


const CUSTOM_NAME_MAX = 50;
/** Lists longer than this open with the search field focused, ready to type. */
const FOCUS_SEARCH_OVER = 12;
// Waits for the page to finish sliding in, or the keyboard can't come up.
const FOCUS_DELAY_MS = 450;

/**
 * Choosing a school, place or study interest: a search field and the
 * matches, like picking a country in the Settings app. Opened from About you.
 */
export default function PickScreen() {
  const { kind, pick, country, state, selected } = useLocalSearchParams<{
    kind: PickKind;
    pick: string;
    country?: string;
    state?: string;
    /** What's chosen now, ticked in the list. */
    selected?: string;
  }>();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);
  const copy = COPY[kind as Exclude<PickKind, 'stage'>];
  const searchBar = useRef<SearchBarCommands>(null);
  const focused = useRef(false);

  // A long list (schools, countries, states, subjects) is quicker to search
  // than to scroll, so the keyboard comes up ready. Short ones (stages) don't.
  useEffect(() => {
    if (focused.current || !results || results.length <= FOCUS_SEARCH_OVER) return;
    focused.current = true;
    const timer = setTimeout(() => searchBar.current?.focus(), FOCUS_DELAY_MS);
    return () => clearTimeout(timer);
  }, [results]);

  // Closing without a choice tells the page that asked.
  useEffect(() => () => finishPick(pick), [pick]);

  useEffect(() => {
    let cancelled = false;
    // Waits for a pause in typing before searching.
    const timer = setTimeout(
      async () => {
        try {
          const rows = await search(kind as Exclude<PickKind, 'stage'>, query, state ?? null);
          if (!cancelled) {
            setResults(rows);
            setFailed(false);
          }
        } catch {
          if (!cancelled) setFailed(true);
        }
      },
      query ? 250 : 0,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [kind, query, state]);

  function choose(value: Picked) {
    void Haptics.selectionAsync();
    finishPick(pick, value);
    router.back();
  }

  // A school that isn't in the lists, added by name like on the website.
  function addCustom() {
    const name = query.trim().slice(0, CUSTOM_NAME_MAX);
    const where = country ?? 'US';
    if (where !== 'US') {
      choose({ type: 'custom', custom: { name, country: where } });
      return;
    }
    if (!state) {
      Alert.alert('Choose your state first', 'Set your state under Location, then add your school.');
      return;
    }
    Alert.prompt(
      'Which city is it in?',
      `${name}, ${state}`,
      (city) => {
        if (city?.trim()) choose({ type: 'custom', custom: { name, country: 'US', state, city: city.trim().slice(0, CUSTOM_NAME_MAX) } });
      },
      'plain-text',
    );
  }

  const rows = useMemo(() => {
    const list = [...(results ?? [])];
    if (kind === 'highSchool' && !query) list.unshift({ key: 'home', title: 'Homeschooled', value: { type: 'homeSchooled' }, accent: true });
    return list;
  }, [results, kind, query]);
  const canAddCustom = (kind === 'highSchool' || kind === 'university') && query.trim().length >= 2;

  return (
    <>
      <Stack.Screen options={{ headerBackTitle: 'Back' }} />
      <Stack.SearchBar
        placeholder={copy.placeholder}
        ref={searchBar}
        hideWhenScrolling={false}
        autoCapitalize="none"
        tintColor={Colors.olive}
        onChangeText={(event) => setQuery(event.nativeEvent.text)}
      />
      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        ListHeaderComponent={<PageTitle style={styles.title}>{copy.title}</PageTitle>}
        renderItem={({ item, index }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => choose(item.value)}
            style={({ pressed }) => [
              styles.row,
              index === 0 && styles.first,
              index === rows.length - 1 && !canAddCustom && styles.last,
              pressed && styles.pressed,
            ]}>
            <View style={styles.rowText}>
              <ThemedText style={[styles.rowTitle, item.accent && { color: Colors.olive }]}>{item.title}</ThemedText>
              {item.detail ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {item.detail}
                </ThemedText>
              ) : null}
            </View>
            {item.key === selected ? <ThemedText style={styles.tick}>✓</ThemedText> : null}
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={
          <>
            {canAddCustom ? (
              <Pressable
                accessibilityRole="button"
                onPress={addCustom}
                style={({ pressed }) => [styles.row, styles.last, rows.length === 0 && styles.first, styles.addRow, pressed && styles.pressed]}>
                <View style={styles.rowText}>
                  <ThemedText style={[styles.rowTitle, { color: Colors.olive }]}>{`Add “${query.trim()}”`}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Not in the list? Add it by name.
                  </ThemedText>
                </View>
              </Pressable>
            ) : null}
            {results === null && !failed ? <ActivityIndicator style={styles.status} color={Colors.textSecondary} /> : null}
            {failed ? (
              <ThemedText themeColor="textSecondary" style={styles.status}>
                Couldn’t search right now. Check your connection.
              </ThemedText>
            ) : null}
            {results?.length === 0 && !canAddCustom && query ? (
              <ThemedText themeColor="textSecondary" style={styles.status}>
                {`No results for “${query}”.`}
              </ThemedText>
            ) : null}
          </>
        }
      />
    </>
  );
}

async function search(kind: Exclude<PickKind, 'stage'>, query: string, state: string | null): Promise<Row[]> {
  if (kind === 'country' || kind === 'state') {
    const list: Place[] = await loadPlaces().then((places) => (kind === 'country' ? places.countries : places.states));
    const needle = query.trim().toLowerCase();
    return list
      .filter((place) => !needle || place.name.toLowerCase().includes(needle) || place.code.toLowerCase() === needle)
      .map((place) => ({ key: place.code, title: place.name, value: place }));
  }
  if (kind === 'interest') {
    const items = await searchInterests(query);
    return items.map((item) => ({
      key: item.cipCode,
      title: item.name,
      detail: item.detail,
      value: { cipCode: item.cipCode, name: item.name },
    }));
  }
  const items = await searchSchools(kind, query, state);
  return items.map((item) => ({
    key: item.nces,
    title: item.name,
    detail: item.detail,
    value: { type: 'listed', nces: item.nces, name: item.name, detail: item.detail },
  }));
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.six },
  title: { paddingHorizontal: Spacing.one, marginBottom: Spacing.three },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundElement,
    paddingVertical: Spacing.two + Spacing.one,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  rowText: { flex: 1, gap: 2 },
  tick: { fontFamily: Fonts.sansSemiBold, fontSize: 17, color: Colors.olive },
  first: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderCurve: 'continuous' },
  last: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20, borderCurve: 'continuous' },
  addRow: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  pressed: { backgroundColor: Colors.backgroundSelected },
  rowTitle: { fontFamily: Fonts.sansMedium, fontSize: 16, lineHeight: 22 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginLeft: Spacing.three },
  status: { textAlign: 'center', marginTop: Spacing.four },
});
