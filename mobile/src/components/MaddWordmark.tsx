import Svg, { G, Path, Circle } from 'react-native-svg';
import { colors } from '../theme';

type Props = {
  width?: number;
  letterColor?: string;
  waveColor?: string;
};

/** The "madd" logo: hand-drawn letters with the madda wave over the m. */
export function MaddWordmark({ width = 168, letterColor = colors.white, waveColor = colors.sky }: Props) {
  return (
    <Svg width={width} height={(width * 100) / 258} viewBox="0 0 258 100" accessibilityLabel="madd">
      <Path d="M10 30 C20 18 30 18 38 25 S56 32 70 20" fill="none" stroke={waveColor} strokeWidth={9} strokeLinecap="round" />
      <G fill="none" stroke={letterColor} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 90 V60 a14 14 0 0 1 28 0 V90 M40 60 a14 14 0 0 1 28 0 V90" />
        <Circle cx={108} cy={67} r={22} />
        <Path d="M130 46 V90" />
        <Circle cx={171} cy={67} r={22} />
        <Path d="M193 12 V90" />
        <Circle cx={227} cy={67} r={22} />
        <Path d="M249 12 V90" />
      </G>
    </Svg>
  );
}
