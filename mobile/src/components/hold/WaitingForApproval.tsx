import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../icons';
import { minutesAndSeconds, useCountdown } from '../../utils/useCountdown';
import { colors, fonts, radius } from '../../theme';

/** The grey card on design 12: "Request sent to your registered phone" ✓ and "Waiting for approval · 4:31". */
export function WaitingForApproval({ secondsLeft, onDone }: { secondsLeft: number; onDone: () => void }) {
  const left = useCountdown(secondsLeft, onDone);
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.tick}>
          <Icon name="check" size={14} color={colors.white} strokeWidth={3} />
        </View>
        <Text style={styles.text}>Request sent to your registered phone</Text>
      </View>
      <View style={styles.row}>
        <ActivityIndicator color={colors.blue} />
        <Text style={styles.text}>Waiting for approval · {minutesAndSeconds(left)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignSelf: 'stretch', backgroundColor: colors.background, borderRadius: radius.card, padding: 18, gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tick: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.ink, fontVariant: ['tabular-nums'] },
});
