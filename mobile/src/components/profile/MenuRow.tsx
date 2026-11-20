import { Pressable, StyleSheet, Text } from 'react-native';
import { Icon } from '../icons';
import { colors, fonts } from '../../theme';

/** One tappable line in the Account card (design 19), with a chevron on the right. `danger` makes it red. */
export function MenuRow({ label, onPress, danger = false }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Text style={[styles.label, danger && styles.danger]}>{label}</Text>
      <Icon name="chevronRight" size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18 },
  pressed: { opacity: 0.6 },
  label: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  danger: { color: colors.dangerText },
});
