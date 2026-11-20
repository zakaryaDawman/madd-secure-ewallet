import { StyleSheet, Text, View } from 'react-native';
import { minutesAndSeconds, useCountdown } from '../../utils/useCountdown';
import { colors, fonts } from '../../theme';

/** The amber "WAITING FOR YOU · 4:59" pill (design 11). Calls `onDone` when the time is up. */
export function HoldCountdown({ secondsLeft, onDone }: { secondsLeft: number; onDone: () => void }) {
  const left = useCountdown(secondsLeft, onDone);
  return (
    <View style={styles.pill}>
      <Text style={styles.text}>WAITING FOR YOU · {minutesAndSeconds(left)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999, backgroundColor: colors.warningBg },
  text: { fontFamily: fonts.bold, fontSize: 13, letterSpacing: 1.2, color: colors.warningText, fontVariant: ['tabular-nums'] },
});
