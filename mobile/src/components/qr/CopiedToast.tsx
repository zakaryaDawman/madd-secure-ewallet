import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '../icons';
import { colors, fonts, radius } from '../../theme';

/** Small dark pill with a green tick, e.g. "Number copied" (design 16). */
export function CopiedToast({ text }: { text: string }) {
  return (
    <View style={styles.pill} accessibilityLiveRegion="polite">
      <Icon name="check" size={18} color={colors.success} strokeWidth={2.6} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.ink, borderRadius: radius.pill, paddingHorizontal: 20, paddingVertical: 11 },
  text: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },
});
