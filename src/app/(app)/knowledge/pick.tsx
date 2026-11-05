import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import type { SearchBarCommands } from 'react-native-screens';

import { PageTitle } from '@/components/page-title';
import { Loading, Text } from '@/components/ui';
import { colors, haptics, shape, space } from '@/theme';
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
    haptics.tick();
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
        tintColor={colors.accent}
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
              <Text variant="headline" color={item.accent ? 'accent' : 'text'}>
                {item.title}
              </Text>
              {item.detail ? (
                <Text variant="small" color="textSecondary">
                  {item.detail}
                </Text>
              ) : null}
            </View>
            {item.key === selected ? (
              <SymbolView name="checkmark" size={17} weight="semibold" tintColor={colors.accent} accessibilityLabel="Selected" />
            ) : null}
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
                  <Text variant="headline" color="accent">{`Add “${query.trim()}”`}</Text>
                  <Text variant="small" color="textSecondary">
                    Not in the list? Add it by name.
                  </Text>
                </View>
              </Pressable>
            ) : null}
            {results === null && !failed ? <Loading fill={false} /> : null}
            {failed ? (
              <Text color="textSecondary" align="center" style={styles.status}>
                Couldn’t search right now. Check your connection.
              </Text>
            ) : null}
            {results?.length === 0 && !canAddCustom && query ? (
              <Text color="textSecondary" align="center" style={styles.status}>
                {`No results for “${query}”.`}
              </Text>
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
  content: { paddingHorizontal: space[4], paddingBottom: space[16] },
  title: { paddingHorizontal: space[1], marginBottom: space[4] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    gap: space[2],
  },
  rowText: { flex: 1, gap: space[0.5] },
  first: { borderTopLeftRadius: shape.card.borderRadius, borderTopRightRadius: shape.card.borderRadius, borderCurve: 'continuous' },
  last: { borderBottomLeftRadius: shape.card.borderRadius, borderBottomRightRadius: shape.card.borderRadius, borderCurve: 'continuous' },
  addRow: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  pressed: { backgroundColor: colors.fill },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: space[4] },
  status: { marginTop: space[6] },
});
