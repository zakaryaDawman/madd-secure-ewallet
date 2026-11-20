import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TransactionFilter } from '../../api/transactions';
import { colors, fonts, radius } from '../../theme';

const CHIPS: { filter: TransactionFilter; label: string }[] = [
  { filter: 'all', label: 'All' },
  { filter: 'in', label: 'In' },
  { filter: 'out', label: 'Out' },
  { filter: 'held', label: 'Held' },
];

/** The All / In / Out / Held chips at the top of History (design 17). The selected one is dark. */
export function FilterChips({ value, onChange }: { value: TransactionFilter; onChange: (filter: TransactionFilter) => void }) {
  return (
    <View style={styles.row}>
      {CHIPS.map(({ filter, label }) => {
        const selected = filter === value;
        return (
          <Pressable
            key={filter}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(filter)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.background },
  chipSelected: { backgroundColor: colors.ink },
  label: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  labelSelected: { color: colors.white },
});
