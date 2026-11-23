import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeypadKey, MaddKeypad } from '../MaddKeypad';
import { PinBoxes } from '../PinBoxes';
import { ResendCodeButton } from './ResendCodeButton';
import { colors, fonts, radius, spacing } from '../../theme';

const LENGTH = 6;

/** Which part of the sheet is showing: the emailed code first, then the PIN. */
export type ReleaseStep = 'code' | 'pin';

type Props = {
  summary: string; // e.g. "RM 800.00 to Ahm*** Ali will be sent now"
  codeSentTo: string; // masked email, e.g. "z******@gmail.com"
  error: { step: ReleaseStep; message: string } | null; // the server's message after a wrong code or PIN
  sending: boolean;
  onSubmit: (code: string, pin: string) => void;
  onResend: () => Promise<{ ok: boolean; message?: string; secondsLeft?: number }>;
  onCancel: () => void;
};

/**
 * "Enter PIN to release" sheet over the Held screen and Inbox (design 29), now in two steps (task G4):
 * first the 6-digit code emailed to the owner, then the PIN. Hands both to the screen; the server checks them.
 * After a wrong code it opens on the code step again; after a wrong PIN, on the PIN step.
 */
export function ReleasePinSheet({ summary, codeSentTo, error, sending, onSubmit, onResend, onCancel }: Props) {
  const [step, setStep] = useState<ReleaseStep>(error?.step ?? 'code');
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [typingError, setTypingError] = useState('');
  const [shownError, setShownError] = useState(error);
  const insets = useSafeAreaInsets();

  // A new server error moves the sheet back to the step it is about (adjusting state while rendering, as React advises).
  if (error !== shownError) {
    setShownError(error);
    if (error) setStep(error.step);
    if (error?.step === 'code') setCode('');
  }

  const typed = step === 'code' ? code : pin;
  const message = typingError || (typed.length === 0 && error?.step === step ? error.message : '');

  /** Adds or removes one digit of the code or the PIN. */
  function onKey(key: KeypadKey) {
    if (key === '.' || sending) return;
    setTypingError('');
    const next = (value: string) => (key === 'delete' ? value.slice(0, -1) : (value + key).slice(0, LENGTH));
    if (step === 'code') setCode(next);
    else setPin(next);
  }

  /** Code step: moves on to the PIN. PIN step: sends both, then clears the PIN from the screen (the code stays for a retry). */
  function onConfirm() {
    if (sending) return;
    if (typed.length < LENGTH) {
      setTypingError(step === 'code' ? 'Enter all 6 digits of the code' : 'Enter all 6 digits of your PIN');
      return;
    }
    if (step === 'code') {
      setStep('pin');
      return;
    }
    onSubmit(code, pin);
    setPin('');
  }

  const isCode = step === 'code';
  return (
    <>
      <View style={styles.dim} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 28 }]}>
        <View style={styles.handle} />
        <View style={styles.head}>
          <Text style={styles.title}>{isCode ? 'Enter the email code' : 'Enter PIN to release'}</Text>
          <Text style={styles.text}>{isCode ? `We sent a 6-digit code to ${codeSentTo}` : summary}</Text>
        </View>
        <PinBoxes length={typed.length} error={Boolean(message)} digits={isCode ? code : undefined} />
        <Text style={[styles.hint, message ? styles.error : null]}>
          {message || (isCode ? 'Never share this code. MADD will never ask for it.' : 'We check your balance again before sending.')}
        </Text>
        {isCode && <ResendCodeButton onResend={onResend} />}
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
  error: { fontFamily: fonts.semibold, fontSize: 13, color: colors.dangerText, textAlign: 'center' },
});
