import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';

const DELAY = 450;

/** The giant number on a welcome tip that counts up from 0, with a small label beside it (e.g. "4 LIVE CHECKS"). */
export function CountUp({ to, label }: { to: number; label: string }) {
  const [shown, setShown] = useState(0);
  const [progress] = useState(() => new Animated.Value(0));

  // Counts 0 → `to` with an easing curve; the listener turns the animated value into the whole number on screen.
  useEffect(() => {
    const id = progress.addListener(({ value }) => setShown(Math.round(value * to)));
    const run = Animated.timing(progress, { toValue: 1, duration: 900, delay: DELAY, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    run.start();
    return () => {
      run.stop();
      progress.removeListener(id);
    };
  }, [progress, to]);

  return (
    <Animated.View style={[styles.row, { opacity: progress.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 1] }) }]}>
      <Text style={styles.number}>{shown}</Text>
      <View style={styles.labelBox}>
        <Text style={styles.label}>{label}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  number: { fontFamily: fonts.extrabold, fontSize: 132, lineHeight: 140, letterSpacing: -8, color: colors.ink },
  labelBox: { maxWidth: 110 },
  label: { fontFamily: fonts.extrabold, fontSize: 13, lineHeight: 17, letterSpacing: 1.5, color: colors.sky },
});
