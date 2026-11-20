import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';

type Props = {
  length: number; // how many digits are typed
  total?: number;
  error?: boolean;
};

/** Row of PIN dots: filled for typed digits, outlined for the rest, red when the PIN was rejected. */
export function PinDots({ length, total = 6, error = false }: Props) {
  return (
    <View style={styles.row} accessibilityLabel={`${length} of ${total} digits entered`}>
      {Array.from({ length: total }, (_, i) => {
        const filled = i < length;
        const color = error ? colors.danger : colors.blue;
        return <View key={i} style={[styles.dot, filled ? { backgroundColor: color } : { borderColor: error ? colors.danger : '#C5D3F0', borderWidth: 2 }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingVertical: 8 },
  dot: { width: 16, height: 16, borderRadius: 8 },
});
