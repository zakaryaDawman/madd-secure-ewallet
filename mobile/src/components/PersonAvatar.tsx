import { StyleSheet, Text, View } from 'react-native';
import { initials } from '../utils/dates';
import { colors, fonts } from '../theme';

/** Colour pairs for people's avatars. */
const PALETTE = [
  { bg: colors.tint, fg: colors.blueDark },
  { bg: colors.successBg, fg: '#15803D' },
  { bg: '#F1E6FF', fg: '#6B21A8' },
  { bg: colors.warningBg, fg: colors.warningText },
];

/** Picks a colour from the name, so the same person always gets the same colour. */
function colorFor(name: string) {
  const sum = [...name].reduce((total, ch) => total + ch.charCodeAt(0), 0);
  return PALETTE[sum % PALETTE.length];
}

/** Round avatar with a person's initials, e.g. "SL" for Sara Lim. */
export function PersonAvatar({ name, size = 44 }: { name: string; size?: number }) {
  const { bg, fg } = colorFor(name);
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg, fontSize: size * 0.32 }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: fonts.extrabold },
});
