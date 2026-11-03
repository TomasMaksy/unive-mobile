import { MarkdownStream, type MarkdownStyleMap } from '@ronradtke/react-native-markdown-display';
import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { Colors, Fonts, Shape, Spacing } from '@/constants/theme';
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
      cursorColor={Colors.textMuted}
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

const MONO = 'Menlo';

const styles = StyleSheet.create({
  body: {
    color: Colors.text,
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 24,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: Spacing.two,
  },
  // Each Inter weight is its own font; a fontWeight on top would fall back to the system font.
  strong: {
    fontFamily: Fonts.sansSemiBold,
    fontWeight: 'normal',
  },
  em: {
    fontStyle: 'italic',
  },
  heading1: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    lineHeight: 30,
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  heading2: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    lineHeight: 26,
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  heading3: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    lineHeight: 24,
    marginTop: Spacing.two,
  },
  link: {
    color: Colors.brandBlue,
    textDecorationLine: 'underline',
  },
  bullet_list: {
    marginBottom: Spacing.two,
  },
  ordered_list: {
    marginBottom: Spacing.two,
  },
  list_item: {
    marginBottom: Spacing.one,
  },
  code_inline: {
    fontFamily: MONO,
    fontSize: 14,
    backgroundColor: Colors.backgroundSelected,
  },
  fence: {
    ...Shape.card,
    fontFamily: MONO,
    fontSize: 14,
    padding: Spacing.three,
    backgroundColor: Colors.backgroundElement,
    borderColor: Colors.border,
    borderWidth: 1,
    marginBottom: Spacing.two,
  },
  code_block: {
    ...Shape.card,
    fontFamily: MONO,
    fontSize: 14,
    padding: Spacing.three,
    backgroundColor: Colors.backgroundElement,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  blockquote: {
    backgroundColor: 'transparent',
    borderLeftColor: Colors.border,
    borderLeftWidth: 3,
    paddingLeft: Spacing.three,
    marginLeft: 0,
  },
  hr: {
    backgroundColor: Colors.border,
    marginVertical: Spacing.three,
  },
}) as MarkdownStyleMap;
