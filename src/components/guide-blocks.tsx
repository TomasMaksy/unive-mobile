import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Spacing } from '@/constants/theme';
import type { GuideBlock, GuideSpan } from '@/lib/guide';

// Reading type for the guide: a bit larger than the app's default, with room
// between lines, like Apple Books.
const BODY_SIZE = 17;
const BODY_LINE = 27;

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
              <Text style={[styles.body, styles.marker]}>{block.ordered ? `${index + 1}.` : '•'}</Text>
              <Spans spans={item} style={styles.itemText} />
            </View>
          ))}
        </View>
      );
    case 'callout':
      return (
        <View style={[styles.note, styles.callout]}>
          <View style={styles.noteTitle}>
            <SymbolView name="lightbulb.fill" size={16} tintColor={Colors.olive} style={styles.noteIcon} />
            <Text style={[styles.body, styles.bold, styles.noteTitleText]}>{block.title}</Text>
          </View>
          <GuideBlocks blocks={block.blocks} />
        </View>
      );
    case 'intlNote':
      return (
        <View style={[styles.note, styles.intl]}>
          <View style={styles.noteTitle}>
            <SymbolView name="globe" size={16} tintColor={Colors.brandBlue} style={styles.noteIcon} />
            <Text style={[styles.body, styles.bold, styles.noteTitleText]}>International note</Text>
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
                <Text key={header} style={[styles.cell, styles.bold]}>
                  {header}
                </Text>
              ))}
            </View>
            {block.rows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((cell, cellIndex) => (
                  <Text key={cellIndex} style={styles.cell}>
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

function Spans({ spans, style }: { spans: GuideSpan[]; style?: object }) {
  return (
    <Text style={[styles.body, style]} selectable>
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
    gap: Spacing.three,
  },
  body: {
    fontFamily: Fonts.sans,
    fontSize: BODY_SIZE,
    lineHeight: BODY_LINE,
    color: Colors.text,
  },
  bold: {
    fontFamily: Fonts.sansSemiBold,
  },
  italic: {
    fontStyle: 'italic',
  },
  list: {
    gap: Spacing.two,
  },
  item: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingLeft: Spacing.one,
  },
  marker: {
    minWidth: 16,
    color: Colors.textSecondary,
  },
  itemText: {
    flex: 1,
  },
  note: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 20,
    borderCurve: 'continuous',
  },
  callout: {
    backgroundColor: 'rgba(111, 118, 68, 0.09)',
  },
  intl: {
    backgroundColor: Colors.brandBlueSoft,
  },
  noteTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  noteIcon: {
    width: 18,
    height: 18,
  },
  noteTitleText: {
    flex: 1,
  },
  table: {
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: Colors.backgroundElement,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  headerRow: {
    borderTopWidth: 0,
    backgroundColor: Colors.backgroundSelected,
  },
  cell: {
    width: 170,
    padding: Spacing.three - Spacing.one,
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 21,
    color: Colors.text,
  },
});
