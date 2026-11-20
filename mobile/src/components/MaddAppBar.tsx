import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from './icons';
import { colors, fonts, radius } from '../theme';

type Props = {
  title?: string;
  icon?: 'back' | 'close';
  onBack: () => void;
};

/** Top bar for inner screens: a round back (or close) button on the left and a centred title. */
export function MaddAppBar({ title = '', icon = 'back', onBack }: Props) {
  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={icon === 'back' ? 'Back' : 'Close'}
        onPress={onBack}
        hitSlop={8}
        style={({ pressed }) => [styles.circle, pressed && styles.pressed]}
      >
        <Icon name={icon} size={20} strokeWidth={2.2} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  circle: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  title: { flex: 1, textAlign: 'center', fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  spacer: { width: 44 },
});
