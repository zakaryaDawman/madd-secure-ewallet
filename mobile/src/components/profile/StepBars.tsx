import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';

/** Three short progress bars under the title (design 43): blue up to the current step. */
export function StepBars({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.bar, { backgroundColor: i < step ? colors.blue : colors.tint }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  bar: { flex: 1, height: 5, borderRadius: 3 },
});
