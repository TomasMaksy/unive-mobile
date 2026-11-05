import { MarkdownStream, type MarkdownStyleMap } from '@ronradtke/react-native-markdown-display';
import * as WebBrowser from 'expo-web-browser';
// A plain Text on purpose: the renderer nests these (bold inside a heading, a
// link inside a list item) and each one must inherit its parent's type, which
// <Text variant> would reset to body. The type itself comes from the styles below.
// eslint-disable-next-line no-restricted-imports -- Markdown's nested text inherits its parent's type
import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, fonts, shape, space, type } from '@/theme';
import { API_URL } from '@/lib/auth-client';

type MarkdownTextProps = {
  children: string;
  /** The text is still arriving: half-written Markdown is closed off and a cursor shows. */
  streaming?: boolean;
};

/** AI replies are Markdown, like on the website (which renders them with streamdown). */
export function MarkdownText({ children, streaming = false }: MarkdownTextProps) {
  return (
    <MarkdownStream
      streaming={streaming}
      style={styles}
      textcomponent={SelectableText}
      cursorColor={colors.textMuted}
      onLinkPress={openLink}>
      {children}
    </MarkdownStream>
  );
}

// Replies are worth copying, so their text can be selected.
function SelectableText(props: TextProps) {
  return <Text selectable {...props} />;
}

// Relative links point at pages of the website; open them there.
function openLink(url: string) {
  WebBrowser.openBrowserAsync(url.startsWith('/') ? `${API_URL}${url}` : url);
  return false;
}

// Code is set in a monospace face, the one font outside the brand's two.
// eslint-disable-next-line no-restricted-syntax -- monospace for code
const mono = { fontFamily: 'Menlo' };

// Bold inside running text changes the weight only; the size comes from the line it's in.
// Each Inter weight is its own font, so it's a family, not a fontWeight (which would
// fall back to the system font). Medium, like the brand's emphasis.
// eslint-disable-next-line no-restricted-syntax -- weight only, size inherited from the surrounding text
const medium = { fontFamily: fonts.sansMedium };

const styles = StyleSheet.create({
  body: {
    ...type.body,
    color: colors.textSecondary,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: space[2],
  },
  strong: {
    ...medium,
    // The markdown library sets bold here; reset it so iOS keeps the Inter file instead of faking bold.
    // eslint-disable-next-line no-restricted-syntax
    fontWeight: 'normal',
    color: colors.text,
  },
  em: {
    fontStyle: 'italic',
  },
  heading1: {
    ...type.title,
    color: colors.text,
    marginTop: space[2],
    marginBottom: space[1],
  },
  heading2: {
    ...type.lead,
    color: colors.text,
    marginTop: space[2],
    marginBottom: space[1],
  },
  heading3: {
    ...type.headline,
    color: colors.text,
    marginTop: space[2],
  },
  link: {
    color: colors.accent,
    textDecorationLine: 'underline',
  },
  bullet_list: {
    marginBottom: space[2],
  },
  ordered_list: {
    marginBottom: space[2],
  },
  list_item: {
    marginBottom: space[1],
  },
  code_inline: {
    ...type.small,
    ...mono,
    backgroundColor: colors.fill,
  },
  fence: {
    ...shape.card,
    ...type.small,
    ...mono,
    padding: space[4],
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    marginBottom: space[2],
  },
  code_block: {
    ...shape.card,
    ...type.small,
    ...mono,
    padding: space[4],
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  blockquote: {
    backgroundColor: colors.transparent,
    borderLeftColor: colors.border,
    borderLeftWidth: 3,
    paddingLeft: space[4],
    marginLeft: 0,
  },
  hr: {
    backgroundColor: colors.border,
    marginVertical: space[4],
  },
  // Tables: a white squircle card with hairline rows, like the website's.
  table: {
    ...shape.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    marginBottom: space[4],
  },
  thead: {
    backgroundColor: colors.fill,
  },
  tr: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  // Smaller text and tighter cells, so words in narrow columns don't break mid-word.
  th: {
    ...type.small,
    paddingHorizontal: 10,
    paddingVertical: space[2],
  },
  td: {
    ...type.small,
    paddingHorizontal: 10,
    paddingVertical: space[2],
  },
}) as MarkdownStyleMap;
