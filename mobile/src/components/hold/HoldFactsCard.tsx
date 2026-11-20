import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../../theme';

export type HoldFact = { label: string; value: string; struckOut?: boolean };

/** The grey To / Amount / Device (or Balance) card on the Held and Cancelled screens (designs 11 and 35). */
export function HoldFactsCard({ facts }: { facts: HoldFact[] }) {
  return (
    <View style={styles.card}>
      {facts.map((fact, i) => (
        <View key={fact.label} style={[styles.row, i < facts.length - 1 && styles.rowLine]}>
          <Text style={styles.label}>{fact.label}</Text>
          <Text style={[styles.value, fact.struckOut && styles.struckOut]}>{fact.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignSelf: 'stretch', backgroundColor: colors.background, borderRadius: radius.card, paddingHorizontal: 18, paddingVertical: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13, gap: 12 },
  rowLine: { borderBottomWidth: 1, borderBottomColor: colors.line },
  label: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  value: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 14, color: colors.ink, textAlign: 'right' },
  struckOut: { color: colors.muted, textDecorationLine: 'line-through' },
});
