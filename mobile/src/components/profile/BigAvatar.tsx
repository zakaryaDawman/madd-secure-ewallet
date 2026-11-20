import { StyleSheet, Text, View } from 'react-native';
import { initials } from '../../utils/dates';
import { colors, fonts } from '../../theme';

/** Solid blue circle with my initials (designs 19 and 42). */
export function BigAvatar({ name, size = 64 }: { name: string; size?: number }) {
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.text, { fontSize: size * 0.34 }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: fonts.extrabold, color: colors.white },
});
