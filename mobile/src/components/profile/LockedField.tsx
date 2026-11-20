import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '../icons';
import { colors, fonts, radius } from '../../theme';

/** A grey read-only field with a lock icon (design 42), for details the user can't change themselves. */
export function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.box} accessibilityLabel={`${label}, ${value}, locked`}>
        <Text style={styles.value}>{value}</Text>
        <Icon name="lock" size={20} color={colors.muted} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  box: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.background, borderRadius: radius.field, paddingHorizontal: 16, paddingVertical: 15 },
  value: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 16, color: '#2E3A59' },
});
