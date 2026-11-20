import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { changePin } from '../api/me';
import { MaddAppBar } from '../components/MaddAppBar';
import { KeypadKey, MaddKeypad } from '../components/MaddKeypad';
import { PinDots } from '../components/PinDots';
import { StepBars } from '../components/profile/StepBars';
import { isWeakPin } from '../utils/pin';
import { colors, fonts, spacing } from '../theme';

const PIN_LENGTH = 6;

type Step = 1 | 2 | 3;

/** Title for each step: current PIN, new PIN, new PIN again. */
const TITLES: Record<Step, string> = {
  1: 'Enter your current PIN',
  2: 'Enter your new PIN',
  3: 'Enter your new PIN again',
};

/** Change PIN screen (design 43): current PIN, new PIN, then the new PIN again. The server checks the current PIN. */
export default function ChangePinScreen() {
  const [step, setStep] = useState<Step>(1);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const insets = useSafeAreaInsets();

  /** Adds or removes a digit; when 6 digits are typed, moves on to the next step. */
  function onKey(key: KeypadKey) {
    if (sending || done || key === '.') return;
    setError('');
    const next = key === 'delete' ? pin.slice(0, -1) : (pin + key).slice(0, PIN_LENGTH);
    setPin(next);
    if (next.length === PIN_LENGTH) finishStep(next);
  }

  /** Handles a full PIN for the current step. */
  function finishStep(value: string) {
    setPin('');
    if (step === 1) {
      setCurrentPin(value);
      setStep(2);
    } else if (step === 2) {
      if (isWeakPin(value)) return setError('This PIN is too easy to guess. Try another.');
      if (value === currentPin) return setError('Choose a PIN different from your current one.');
      setNewPin(value);
      setStep(3);
    } else if (value !== newPin) {
      setError("The PINs don't match. Enter your new PIN again.");
      setStep(2);
    } else {
      send(value);
    }
  }

  /** Asks the server to change the PIN. A wrong current PIN starts again from step 1. */
  async function send(value: string) {
    setSending(true);
    const result = await changePin(currentPin, value);
    setSending(false);
    if (result.ok) {
      setDone(true);
      setTimeout(() => router.back(), 1200);
      return;
    }
    setError(result.message);
    setStep(result.wrongPin ? 1 : 2);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.top}>
        <MaddAppBar title="Change PIN" onBack={() => router.back()} />
        <StepBars step={step} total={3} />
        <View style={styles.heading}>
          <Text style={styles.stepText}>STEP {step} OF 3</Text>
          <Text style={styles.title}>{done ? 'PIN changed' : TITLES[step]}</Text>
          <Text style={styles.subtitle}>First your current PIN, then the new one twice.</Text>
        </View>
        <PinDots length={done ? PIN_LENGTH : pin.length} error={Boolean(error)} />
        {sending ? (
          <ActivityIndicator color={colors.blue} />
        ) : (
          <Text style={[styles.hint, error ? styles.error : null, done ? styles.success : null]}>
            {done ? 'Use your new PIN from now on.' : error || 'Avoid easy PINs like 123456 or your birthday.'}
          </Text>
        )}
      </View>
      <View style={[styles.keypad, { paddingBottom: insets.bottom + spacing.lg }]}>
        <MaddKeypad mode="pin" onKey={onKey} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  top: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: 24 },
  heading: { alignItems: 'center', gap: 8 },
  stepText: { fontFamily: fonts.bold, fontSize: 13, letterSpacing: 1.2, color: colors.muted },
  title: { fontFamily: fonts.extrabold, fontSize: 28, letterSpacing: -1, color: colors.ink, textAlign: 'center' },
  subtitle: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted, textAlign: 'center' },
  hint: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, textAlign: 'center' },
  error: { fontFamily: fonts.semibold, color: colors.dangerText },
  success: { fontFamily: fonts.semibold, color: '#15803D' },
  keypad: { paddingHorizontal: spacing.xl },
});
