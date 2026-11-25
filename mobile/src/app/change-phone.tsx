import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { confirmPhoneChange, resendPhoneCode, startPhoneChange } from '../api/phoneChange';
import { MaddAppBar } from '../components/MaddAppBar';
import { MaddButton } from '../components/MaddButton';
import { KeypadKey, MaddKeypad } from '../components/MaddKeypad';
import { PinBoxes } from '../components/PinBoxes';
import { PinDots } from '../components/PinDots';
import { ResendCodeButton } from '../components/ResendCodeButton';
import { TextField } from '../components/TextField';
import { colors, fonts, spacing } from '../theme';

const DIGITS = 6;

type Step = 'number' | 'pin' | 'code';

/** The heading and line under it for each step. */
const TEXT: Record<Step, { title: string; subtitle: (sentTo: string) => string }> = {
  number: { title: 'New phone number', subtitle: () => 'People will pay you on this number. Your old number stops working.' },
  pin: { title: 'Enter your PIN', subtitle: () => 'To make sure it’s really you.' },
  code: { title: 'Check your email', subtitle: (sentTo) => `We sent a 6-digit code to ${sentTo}. Enter it to save your new number.` },
};

/**
 * Change phone number (task G11, styled like designs 42 and 29): the new number, my PIN, then the 6-digit code emailed
 * to me. The server checks the PIN and the code and saves the number; the phone only shows what it says.
 */
export default function ChangePhoneScreen() {
  const [step, setStep] = useState<Step>('number');
  const [phone, setPhone] = useState('');
  const [digits, setDigits] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  /** Adds or removes one digit of the PIN or code. */
  function onKey(key: KeypadKey) {
    if (sending || key === '.') return;
    setError('');
    setDigits((d) => (key === 'delete' ? d.slice(0, -1) : (d + key).slice(0, DIGITS)));
  }

  /** Moves on from the number to the PIN (the server checks the number with the PIN). */
  function onNumberDone() {
    if (!/^(\+?60|0)?1\d{8,9}$/.test(phone.replace(/[\s-]/g, ''))) {
      setError('Enter a Malaysian mobile number, e.g. 12 345 6789');
      return;
    }
    setError('');
    setStep('pin');
  }

  /** Sends the PIN (step 1) or the code (step 2). A refused number sends the user back to fix it. */
  async function onConfirm() {
    setSending(true);
    const result = step === 'pin' ? await startPhoneChange(phone, digits) : await confirmPhoneChange(digits);
    setSending(false);
    setDigits('');
    if (result.ok && step === 'pin') {
      setSentTo(result.sentTo ?? 'your email');
      setStep('code');
      return;
    }
    if (result.ok) {
      router.back();
      return;
    }
    setError(result.message);
    if (['same_phone', 'phone_taken', 'validation'].includes(result.error ?? '')) setStep('number');
  }

  const { title, subtitle } = TEXT[step];

  return (
    <SafeAreaView style={styles.root}>
      <MaddAppBar title="Change phone number" onBack={() => router.back()} />
      <View style={styles.heading}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle(sentTo)}</Text>
      </View>
      {step === 'number' ? (
        <>
          <TextField label="Phone number" prefix="+60" value={phone} onChangeText={(v) => { setPhone(v); setError(''); }} error={error} keyboardType="phone-pad" placeholder="12 345 6789" autoComplete="tel" returnKeyType="done" onSubmitEditing={onNumberDone} />
          <View style={styles.spacer} />
          <MaddButton label="Continue" onPress={onNumberDone} disabled={phone.trim() === ''} />
        </>
      ) : (
        <>
          {step === 'pin' ? <PinDots length={digits.length} error={Boolean(error)} /> : <PinBoxes length={digits.length} error={Boolean(error)} digits={digits} />}
          <Text style={[styles.hint, error ? styles.error : null]}>{error || (step === 'code' ? 'Check your spam folder if you can’t see it.' : ' ')}</Text>
          {step === 'code' && <ResendCodeButton onResend={resendPhoneCode} />}
          <View style={styles.spacer} />
          <MaddKeypad mode="pin" onKey={onKey} />
          <MaddButton label={step === 'pin' ? 'Send code' : 'Save new number'} onPress={onConfirm} loading={sending} disabled={digits.length < DIGITS} />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xl, gap: 24 },
  heading: { gap: 8 },
  title: { fontFamily: fonts.extrabold, fontSize: 30, letterSpacing: -1, color: colors.ink },
  subtitle: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.muted },
  hint: { textAlign: 'center', fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  error: { color: colors.dangerText, fontFamily: fonts.semibold },
  spacer: { flex: 1 },
});
