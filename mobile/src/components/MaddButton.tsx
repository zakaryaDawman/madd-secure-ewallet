import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, fontSizes, radius } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'dangerSolid' | 'dark';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
};

/** Background and text colour for each button style, from the design. */
const variantColors: Record<ButtonVariant, { bg: string; fg: string }> = {
  primary: { bg: colors.blue, fg: colors.white },
  secondary: { bg: colors.tint, fg: colors.blueDark },
  danger: { bg: colors.dangerBg, fg: colors.dangerText },
  dangerSolid: { bg: colors.danger, fg: colors.white }, // "Freeze now" (design 30)
  dark: { bg: colors.ink, fg: colors.white },
};

/** Big round button used for every main action (Send, Confirm, Log in). Shows a spinner while loading. */
export function MaddButton({ label, onPress, variant = 'primary', disabled = false, loading = false }: Props) {
  const { bg, fg } = variantColors[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: disabled ? colors.line : bg },
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.label, { color: disabled ? colors.muted : fg }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  label: { fontFamily: fonts.bold, fontSize: fontSizes.button },
});
