import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '../icons';
import { colors, fonts, radius } from '../../theme';

/** A round see-through button with a label under it, over the camera (Gallery). */
export function RoundAction({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.item}>
      <View style={styles.circle}>
        <Icon name={icon} size={24} color={colors.white} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: { alignItems: 'center', gap: 8 },
  circle: { width: 58, height: 58, borderRadius: radius.pill, backgroundColor: colors.glass, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.semibold, fontSize: 12, color: colors.white },
});
