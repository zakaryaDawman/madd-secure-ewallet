import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme';

/** Line paths for every icon the components use, copied from the MADD design (24×24 grid). */
const paths = {
  back: ['M15 6l-6 6 6 6'],
  close: ['M6 6l12 12M18 6L6 18'],
  arrowRight: ['M5 12h14M13 6l6 6-6 6'],
  delete: ['M20 5H9l-6 7 6 7h11a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z', 'M16 10l-4 4M12 10l4 4'],
  home: ['M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z'],
  history: ['M4 6h16M4 12h16M4 18h10'],
  scan: ['M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16'],
  bell: ['M6 9a6 6 0 0 1 12 0c0 6 3 7 3 7H3s3-1 3-7', 'M10 20a2 2 0 0 0 4 0'],
  user: ['M4 21a8 8 0 0 1 16 0'],
} as const;

export type IconName = keyof typeof paths;

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

/** Draws one MADD line icon by name, e.g. <Icon name="back" />. */
export function Icon({ name, size = 22, color = colors.ink, strokeWidth = 2 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {name === 'user' && <Circle cx={12} cy={8} r={4} />}
      {paths[name].map((d) => (
        <Path key={d} d={d} />
      ))}
    </Svg>
  );
}
