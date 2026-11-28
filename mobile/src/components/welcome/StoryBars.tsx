import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors } from '../../theme';

/** Progress bars at the top of the welcome tips: past tips full, the current one fills as it opens. */
export function StoryBars({ total, active }: { total: number; active: number }) {
  const [fill] = useState(() => new Animated.Value(0));

  // The current bar grows from the left while the tip animates in.
  useEffect(() => {
    const run = Animated.timing(fill, { toValue: 1, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: true });
    run.start();
    return () => run.stop();
  }, [fill]);

  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={styles.track}>
          {i < active && <View style={styles.full} />}
          {i === active && <Animated.View style={[styles.full, { transform: [{ scaleX: fill }] }]} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  track: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: colors.glass },
  full: { height: 4, backgroundColor: colors.white, transformOrigin: 'left' },
});
