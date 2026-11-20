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
  phone: ['M9 2h6a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3z', 'M11 18h2'],
  check: ['M5 12l5 5 9-10'],
  eye: ['M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z', 'M15 12a3 3 0 1 1-6 0a3 3 0 0 1 6 0z'],
  eyeOff: ['M3 3l18 18', 'M10.6 5.1A10.6 10.6 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6C3.9 8.3 2 12 2 12s4 7 10 7a9.8 9.8 0 0 0 5.4-1.6', 'M9.9 9.9a3 3 0 0 0 4.2 4.2'],
  send: ['M7 17L17 7M9 7h8v8'],
  receive: ['M17 7L7 17M15 17H7V9'],
  search: ['M17 11a6 6 0 1 1-12 0a6 6 0 0 1 12 0z', 'M20 20l-4.3-4.3'],
  chevronRight: ['M9 6l6 6-6 6'],
  info: ['M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0z', 'M12 8h.01M11 12h1v4h1'],
  wifiOff: ['M2 8.8a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 20h.01M3 3l18 18'],
  timer: ['M10 2h4', 'M20 14a8 8 0 1 1-16 0a8 8 0 0 1 16 0z', 'M12 14l-2.5-3'],
  hourglass: ['M7 3h10M7 21h10', 'M8 3v2.5a4 4 0 0 0 1.6 3.2L12 12l2.4-3.3A4 4 0 0 0 16 5.5V3', 'M8 21v-2.5a4 4 0 0 1 1.6-3.2L12 12l2.4 3.3a4 4 0 0 1 1.6 3.2V21'],
  clockOff: ['M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0z', 'M12 7v5l3 2', 'M4 4l16 16'],
  alert: ['M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0z', 'M12 7.5v5.5', 'M12 16.5h.01'],
  snowflake: ['M12 2v20M3.3 7l17.4 10M20.7 7L3.3 17', 'M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5'],
  phones: ['M5 3h5a1.5 1.5 0 0 1 1.5 1.5v10A1.5 1.5 0 0 1 10 16H5a1.5 1.5 0 0 1-1.5-1.5v-10A1.5 1.5 0 0 1 5 3z', 'M14 8h5a1.5 1.5 0 0 1 1.5 1.5v10A1.5 1.5 0 0 1 19 21h-5a1.5 1.5 0 0 1-1.5-1.5v-10A1.5 1.5 0 0 1 14 8z', 'M7.5 13h.01M16.5 18h.01'],
  lock: ['M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z', 'M8 11V8a4 4 0 0 1 8 0v3'],
  chevronDown: ['M6 9l6 6 6-6'],
  copy: ['M10 9h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z', 'M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5'],
  flash: ['M13 2L4 14h7l-1 8 9-12h-7z'],
  image: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M10 9a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0z', 'M21 15l-5-5L5 21'],
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
