import { type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import logo from '@/brand/logo-paths.json';
import { colors } from '@/theme';

type LogoProps = {
  /** Height in points; the width follows the artwork. */
  height?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

function ratio(viewBox: string) {
  const [, , w, h] = viewBox.split(' ').map(Number);
  return w / h;
}

/**
 * The wordmark, traced from the hand-drawn artwork. The logo is drawn,
 * never typed: don't rebuild it in Averia or any other font.
 */
export function Wordmark({ height = 28, color = colors.text, style }: LogoProps) {
  return (
    <Svg
      accessibilityRole="image"
      accessibilityLabel="Unive"
      viewBox={logo.wordmark.viewBox}
      height={height}
      width={height * ratio(logo.wordmark.viewBox)}
      style={style}>
      <Path d={logo.wordmark.d} fill={color} fillRule="evenodd" />
    </Svg>
  );
}

/** The "un" mark on its own. It never has a dot. */
export function Mark({ height = 24, color = colors.text, style }: LogoProps) {
  return (
    <Svg
      accessibilityRole="image"
      accessibilityLabel="Unive"
      viewBox={logo.mark.viewBox}
      height={height}
      width={height * ratio(logo.mark.viewBox)}
      style={style}>
      <Path d={logo.mark.d} fill={color} fillRule="evenodd" />
    </Svg>
  );
}
