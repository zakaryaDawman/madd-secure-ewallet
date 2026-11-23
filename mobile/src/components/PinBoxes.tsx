import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

/**
 * Six PIN boxes from the PIN sheet (design 08): a dot in each filled box, blue border so far, red when wrong.
 * With `digits` (the emailed code, which isn't secret on screen) the boxes show the digits instead of dots.
 */
export function PinBoxes({ length, error = false, digits }: { length: number; error?: boolean; digits?: string }) {
  return (
    <View style={styles.row} accessibilityLabel={`${length} of 6 digits entered`}>
      {Array.from({ length: 6 }, (_, i) => {
        const filled = i < length;
        const border = error ? colors.danger : filled ? colors.blue : colors.line;
        return (
          <View key={i} style={[styles.box, { borderColor: border }]}>
            {filled && digits !== undefined && <Text style={[styles.digit, error && { color: colors.danger }]}>{digits[i]}</Text>}
            {filled && digits === undefined && <View style={[styles.dot, error && { backgroundColor: colors.danger }]} />}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  box: { width: 44, height: 52, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.ink },
  digit: { fontFamily: fonts.bold, fontSize: 22, color: colors.ink },
});
