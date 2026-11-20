import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from './icons';
import { colors, fonts, radius } from '../theme';

type Props = {
  step: number;
  total: number;
  onBack: () => void;
};

/** Sign-up header from the design: round back button, progress bar and "1 of 2". */
export function StepHeader({ step, total, onBack }: Props) {
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} hitSlop={8} style={styles.back}>
        <Icon name="back" size={20} strokeWidth={2.2} />
      </Pressable>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(step / total) * 100}%` }]} />
      </View>
      <Text style={styles.count}>
        {step} of {total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  back: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  track: { flex: 1, height: 6, borderRadius: radius.pill, backgroundColor: colors.tint, overflow: 'hidden' },
  fill: { height: 6, borderRadius: radius.pill, backgroundColor: colors.blue },
  count: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
});
