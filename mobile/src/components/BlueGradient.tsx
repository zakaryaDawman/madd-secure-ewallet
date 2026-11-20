import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';

/** Full-size MADD blue gradient, placed behind a screen's content (splash, receive, headers). */
export function BlueGradient() {
  return (
    <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="madd" x1="0" y1="0" x2="0.6" y2="1">
          <Stop offset="0" stopColor={colors.blueLight} />
          <Stop offset="0.45" stopColor={colors.blue} />
          <Stop offset="1" stopColor={colors.blueDark} />
        </LinearGradient>
      </Defs>
      <Rect width="100" height="100" fill="url(#madd)" />
    </Svg>
  );
}
