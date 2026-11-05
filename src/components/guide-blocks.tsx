import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';

import { Text } from '@/components/ui';
import { alpha, colors, fonts, shape, space } from '@/theme';
import type { GuideBlock, GuideSpan } from '@/lib/guide';

/** A lesson's content, drawn natively: paragraphs, lists, callouts and tables. */
export function GuideBlocks({ blocks }: { blocks: GuideBlock[] }) {
  return (
    <View style={styles.blocks}>
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </View>
  );
}

function Block({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case 'paragraph':
      return <Spans spans={block.spans} />;
    case 'list':
      return (
        <View style={styles.list}>
          {block.items.map((item, index) => (
            <View key={index} style={styles.item}>
              <Text color="textSecondary" style={styles.marker}>
                {block.ordered ? `${index + 1}.` : '•'}
              </Text>
              <Spans spans={item} style={styles.itemText} />
            </View>
          ))}
        </View>
      );
    case 'callout':
      return (
        <View style={[styles.note, styles.callout]}>
          <View style={styles.noteTitle}>
            <SymbolView name="lightbulb.fill" size={16} tintColor={colors.accent} style={styles.noteIcon} />
            <Text variant="headline" style={styles.noteTitleText}>
              {block.title}
            </Text>
          </View>
          <GuideBlocks blocks={block.blocks} />
        </View>
      );
    case 'intlNote':
      return (
        <View style={[styles.note, styles.intl]}>
          <View style={styles.noteTitle}>
            <SymbolView name="globe" size={16} tintColor={colors.accent} style={styles.noteIcon} />
            <Text variant="headline" style={styles.noteTitleText}>
              International note
            </Text>
          </View>
          <GuideBlocks blocks={block.blocks} />
        </View>
      );
    case 'table':
      return (
        // Wider than the screen: it scrolls sideways, like tables in Notes.
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.table}>
          <View>
            <View style={[styles.row, styles.headerRow]}>
              {block.headers.map((header) => (
                <Text key={header} variant="callout" style={[styles.cell, styles.bold]}>
                  {header}
                </Text>
              ))}
            </View>
            {block.rows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((cell, cellIndex) => (
                  <Text key={cellIndex} variant="callout" style={styles.cell}>
                    {cell}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      );
  }
}

function Spans({ spans, style }: { spans: GuideSpan[]; style?: StyleProp<TextStyle> }) {
  return (
    <Text style={style} selectable>
      {spans.map((span, index) => (
        <Text key={index} style={[span.bold && styles.bold, span.italic && styles.italic]}>
          {span.text}
        </Text>
      ))}
    </Text>
  );
}

const styles = StyleSheet.create({
  blocks: {
    gap: space[4],
  },
  // eslint-disable-next-line no-restricted-syntax -- inline bold within a type step; the scale has no weight-only style
  bold: { fontFamily: fonts.sansMedium },
  italic: {
    fontStyle: 'italic',
  },
  list: {
    gap: space[2],
  },
  item: {
    flexDirection: 'row',
    gap: space[2],
    paddingLeft: space[1],
  },
  marker: {
    minWidth: 16,
  },
  itemText: {
    flex: 1,
  },
  note: {
    gap: space[2],
    ...shape.bubble,
    padding: space[4],
  },
  callout: {
    backgroundColor: alpha('meadow', 0.09),
  },
  intl: {
    backgroundColor: colors.accentSoft,
  },
  noteTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  noteIcon: {
    width: 18,
    height: 18,
  },
  noteTitleText: {
    flex: 1,
  },
  table: {
    ...shape.tile,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  headerRow: {
    borderTopWidth: 0,
    backgroundColor: colors.fill,
  },
  cell: {
    width: 170,
    padding: space[3],
  },
});
