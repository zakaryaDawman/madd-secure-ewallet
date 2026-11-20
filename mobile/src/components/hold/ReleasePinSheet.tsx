import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeypadKey, MaddKeypad } from '../MaddKeypad';
import { PinBoxes } from '../PinBoxes';
import { colors, fonts, radius, spacing } from '../../theme';

const PIN_LENGTH = 6;

type Props = {
  summary: string; // e.g. "RM 800.00 to Ahm*** Ali will be sent now"
  error: string; // the server's message after a wrong PIN, or ''
  sending: boolean;
  onSubmit: (pin: string) => void;
  onCancel: () => void;
};

/** "Enter PIN to release" sheet over the Held screen (design 29). Hands the PIN to the screen; the server checks it. */
export function ReleasePinSheet({ summary, error, sending, onSubmit, onCancel }: Props) {
  const [pin, setPin] = useState('');
  const [typingError, setTypingError] = useState('');
  const insets = useSafeAreaInsets();
  const message = typingError || (pin.length === 0 ? error : '');

  /** Adds or removes one PIN digit. */
  function onKey(key: KeypadKey) {
    if (key === '.' || sending) return;
    setTypingError('');
    setPin((p) => (key === 'delete' ? p.slice(0, -1) : (p + key).slice(0, PIN_LENGTH)));
  }

  /** Sends the PIN once all 6 digits are typed, then clears it from the screen. */
  function onConfirm() {
    if (sending) return;
    if (pin.length < PIN_LENGTH) {
      setTypingError('Enter all 6 digits of your PIN');
      return;
    }
    onSubmit(pin);
    setPin('');
  }

  return (
    <>
      <View style={styles.dim} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 28 }]}>
        <View style={styles.handle} />
        <View style={styles.head}>
          <Text style={styles.title}>Enter PIN to release</Text>
          <Text style={styles.text}>{summary}</Text>
        </View>
        <PinBoxes length={pin.length} error={Boolean(message)} />
        <Text style={[styles.hint, message ? styles.error : null]}>{message || 'We check your balance again before sending.'}</Text>
        <MaddKeypad mode="pin" onKey={onKey} onCancel={onCancel} onConfirm={onConfirm} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  dim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(11,27,63,0.45)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.white, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingHorizontal: spacing.xl, paddingTop: 12, gap: 18 },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.line },
  head: { alignItems: 'center', gap: 6 },
  title: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.ink },
  text: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, textAlign: 'center' },
  hint: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.muted, textAlign: 'center' },
  error: { fontFamily: fonts.semibold, fontSize: 13, color: colors.dangerText },
});
