import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, Mask, Path, Rect } from 'react-native-svg';
import { colors } from '../../theme';

export const WINDOW_SIZE = 250;
const RADIUS = 32;
const ARM = 34; // length of each corner mark

/** Where the scan window sits: centred across, a little above the middle. */
export function windowTop(screenHeight: number): number {
  return Math.round(screenHeight * 0.42 - WINDOW_SIZE / 2);
}

/**
 * Darkens the full-screen camera everywhere except a rounded window, draws the 4 corner marks and a blue line that
 * sweeps up and down (Scan, option 2 + 5). When a MADD code is found the corners turn green and the line stops.
 */
export function ScanOverlay({ found }: { found: boolean }) {
  const { width, height } = useWindowDimensions();
  const left = (width - WINDOW_SIZE) / 2;
  const top = windowTop(height);
  const sweep = useSweep(!found);
  const corner = found ? colors.success : colors.white;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <Mask id="window">
            <Rect width={width} height={height} fill="white" />
            <Rect x={left} y={top} width={WINDOW_SIZE} height={WINDOW_SIZE} rx={RADIUS} fill="black" />
          </Mask>
        </Defs>
        <Rect width={width} height={height} fill={colors.scrim} mask="url(#window)" />
        <Path d={cornerPaths(left, top)} stroke={corner} strokeWidth={found ? 6 : 5} strokeLinecap="round" fill="none" />
      </Svg>
      {!found && (
        <Animated.View
          style={[
            styles.line,
            { left: left + 20, width: WINDOW_SIZE - 40, top: top + 16, transform: [{ translateY: sweep.interpolate({ inputRange: [0, 1], outputRange: [0, WINDOW_SIZE - 32] }) }] },
          ]}
        />
      )}
    </View>
  );
}

/** The 4 rounded corner marks around the window, as one SVG path. */
function cornerPaths(x: number, y: number): string {
  const s = WINDOW_SIZE;
  const r = RADIUS;
  return [
    `M${x} ${y + ARM + r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}H${x + ARM + r}`,
    `M${x + s - ARM - r} ${y}H${x + s - r}A${r} ${r} 0 0 1 ${x + s} ${y + r}V${y + ARM + r}`,
    `M${x + s} ${y + s - ARM - r}V${y + s - r}A${r} ${r} 0 0 1 ${x + s - r} ${y + s}H${x + s - ARM - r}`,
    `M${x + ARM + r} ${y + s}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + s - r}V${y + s - ARM - r}`,
  ].join('');
}

/** A 0 → 1 → 0 value that loops while `running`, for the scan line. */
function useSweep(running: boolean): Animated.Value {
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!running) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [running, value]);
  return value;
}

const styles = StyleSheet.create({
  line: { position: 'absolute', height: 3, borderRadius: 2, backgroundColor: colors.blueLight, shadowColor: colors.blueLight, shadowOpacity: 1, shadowRadius: 8, elevation: 6 },
});
