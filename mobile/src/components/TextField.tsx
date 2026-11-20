import { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, fonts, radius } from '../theme';

/** What a screen can call on a field, e.g. focus(). */
export type TextInputHandle = React.ComponentRef<typeof TextInput>;

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  prefix?: string; // e.g. "+60" shown in its own box before the input
  ref?: React.Ref<TextInputHandle>; // lets a screen move focus to this field
};

/** Labelled text input from the design, with a blue border while typing and a red message underneath when there's an error. */
export function TextField({ label, error, prefix, ref, ...inputProps }: Props) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.blue : colors.line;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {prefix && (
          <View style={[styles.box, styles.prefix, { borderColor: colors.line }]}>
            <Text style={styles.prefixText}>{prefix}</Text>
          </View>
        )}
        <TextInput
          {...inputProps}
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor="#9AA6C2"
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          style={[styles.box, styles.input, { borderColor }]}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  row: { flexDirection: 'row', gap: 8 },
  box: { borderWidth: 1.5, borderRadius: radius.field, paddingHorizontal: 16, minHeight: 52, justifyContent: 'center' },
  input: { flex: 1, fontFamily: fonts.medium, fontSize: 16, color: colors.ink },
  prefix: { paddingHorizontal: 14 },
  prefixText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  error: { fontFamily: fonts.semibold, fontSize: 13, color: colors.dangerText },
});
