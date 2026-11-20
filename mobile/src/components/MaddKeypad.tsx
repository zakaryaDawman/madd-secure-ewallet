import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from './icons';
import { colors, fonts } from '../theme';

/** A key press sent to the screen: a digit '0'–'9', '.', or 'delete'. */
export type KeypadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | 'delete';

type Props = {
  mode: 'pin' | 'amount';
  onKey: (key: KeypadKey) => void;
  onCancel?: () => void; // PIN mode: shows "Cancel" bottom-left
  onConfirm?: () => void; // PIN mode: shows a confirm arrow instead of delete
};

const DIGIT_ROWS: KeypadKey[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

/** Number pad for PINs and amounts. Amount mode has a decimal point; PIN mode can show Cancel and Confirm. */
export function MaddKeypad({ mode, onKey, onCancel, onConfirm }: Props) {
  return (
    <View style={styles.pad}>
      {DIGIT_ROWS.map((row) => (
        <View key={row.join('')} style={styles.row}>
          {row.map((digit) => (
            <DigitKey key={digit} digit={digit} onPress={() => onKey(digit)} />
          ))}
        </View>
      ))}
      <View style={styles.row}>
        <BottomLeftKey mode={mode} onKey={onKey} onCancel={onCancel} />
        <DigitKey digit="0" onPress={() => onKey('0')} />
        <BottomRightKey onKey={onKey} onConfirm={onConfirm} />
      </View>
    </View>
  );
}

/** One number key. */
function DigitKey({ digit, onPress }: { digit: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={digit} onPress={onPress} style={({ pressed }) => [styles.key, pressed && styles.pressed]}>
      <Text style={styles.digit}>{digit}</Text>
    </Pressable>
  );
}

/** Bottom-left key: "." for amounts, "Cancel" for PINs when onCancel is given, otherwise empty. */
function BottomLeftKey({ mode, onKey, onCancel }: Pick<Props, 'mode' | 'onKey' | 'onCancel'>) {
  if (mode === 'amount') return <DigitKey digit="." onPress={() => onKey('.')} />;
  if (!onCancel) return <View style={styles.key} />;
  return (
    <Pressable accessibilityRole="button" onPress={onCancel} style={({ pressed }) => [styles.key, pressed && styles.pressed]}>
      <Text style={styles.cancel}>Cancel</Text>
    </Pressable>
  );
}

/** Bottom-right key: a blue confirm arrow when onConfirm is given, otherwise delete. */
function BottomRightKey({ onKey, onConfirm }: Pick<Props, 'onKey' | 'onConfirm'>) {
  const isConfirm = Boolean(onConfirm);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isConfirm ? 'Confirm' : 'Delete'}
      onPress={isConfirm ? onConfirm : () => onKey('delete')}
      style={({ pressed }) => [styles.key, pressed && styles.pressed]}
    >
      <Icon name={isConfirm ? 'arrowRight' : 'delete'} size={26} color={isConfirm ? colors.blue : colors.ink} strokeWidth={isConfirm ? 2.4 : 2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pad: { gap: 4 },
  row: { flexDirection: 'row', gap: 4 },
  key: { flex: 1, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: colors.background },
  digit: { fontFamily: fonts.semibold, fontSize: 26, color: colors.ink },
  cancel: { fontFamily: fonts.bold, fontSize: 15, color: colors.blue },
});
