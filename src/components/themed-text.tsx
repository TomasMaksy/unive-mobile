import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'subtitle' | 'wordmark' | 'small' | 'smallBold' | 'link';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return <Text style={[{ color: theme[themeColor ?? 'text'] }, styles[type], style]} {...rest} />;
}

// Headings use Averia Serif Libre with the website's tight tracking (-0.03em).
const styles = StyleSheet.create({
  default: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1.1,
  },
  subtitle: {
    fontFamily: Fonts.heading,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.9,
  },
  wordmark: {
    fontFamily: Fonts.headingBold,
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: -1.2,
  },
  small: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  smallBold: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    textDecorationLine: 'underline',
  },
});
