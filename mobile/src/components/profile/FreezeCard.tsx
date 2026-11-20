import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../icons';
import { colors, fonts, radius } from '../../theme';

/** The pink "Freeze my account" card on Profile (design 19). Opens the freeze confirmation (design 30). */
export function FreezeCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Icon name="snowflake" size={24} color={colors.danger} strokeWidth={2.4} />
      <View style={styles.texts}>
        <Text style={styles.title}>Freeze my account</Text>
        <Text style={styles.line}>Stops all transfers. Needs your PIN.</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: radius.card, borderWidth: 1.5, borderColor: colors.dangerBorder, backgroundColor: colors.dangerSurface },
  pressed: { opacity: 0.7 },
  texts: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.bold, fontSize: 16, color: colors.dangerText },
  line: { fontFamily: fonts.regular, fontSize: 14, color: colors.dangerText },
});
