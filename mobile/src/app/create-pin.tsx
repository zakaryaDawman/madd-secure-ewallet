import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { replaceScreen } from '../utils/navigation';
import { router } from 'expo-router';
import { acceptInvite, register } from '../api/auth';
import { MaddButton } from '../components/MaddButton';
import { KeypadKey, MaddKeypad } from '../components/MaddKeypad';
import { PinDots } from '../components/PinDots';
import { StepHeader } from '../components/StepHeader';
import { clearSignupDraft, getSignupDraft, updateSignupDraft } from '../auth/signupDraft';
import { isWeakPin } from '../utils/pin';
import { colors, fonts, spacing } from '../theme';

const PIN_LENGTH = 6;

/**
 * Create PIN screen (design 04): type a PIN, type it again, then the whole account is sent to the server and the emailed
 * code is asked for. After "I have an invite" (task G10) it accepts the invite instead, and the account is ready at once.
 */
export default function CreatePinScreen() {
  const [firstPin, setFirstPin] = useState<string | null>(null); // set once the first PIN is accepted
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const confirming = firstPin !== null;

  /** Adds or removes a digit. When the first PIN is complete, checks it and moves to "confirm". */
  function onKey(key: KeypadKey) {
    if (sending || key === '.') return;
    setError('');
    const next = key === 'delete' ? pin.slice(0, -1) : (pin + key).slice(0, PIN_LENGTH);
    setPin(next);
    if (!confirming && next.length === PIN_LENGTH) acceptFirstPin(next);
  }

  /** Rejects easy PINs; otherwise remembers the PIN and asks for it again. */
  function acceptFirstPin(value: string) {
    if (isWeakPin(value)) {
      setError('This PIN is too easy to guess. Try another.');
      setPin('');
      return;
    }
    setFirstPin(value);
    setPin('');
  }

  /** Checks both PINs match, then creates the account. Field errors send the user back to fix them. */
  async function onConfirm() {
    if (pin !== firstPin) {
      setError("The PINs don't match. Create your PIN again.");
      setFirstPin(null);
      setPin('');
      return;
    }
    setSending(true);
    const { fullName, email, phone, password, inviteCode } = getSignupDraft();
    const result = inviteCode ? await acceptInvite(email, inviteCode, password, pin) : await register({ fullName, email, phone, password, pin });
    setSending(false);

    if (result.ok) {
      clearSignupDraft();
      if (inviteCode) replaceScreen('/account-created');
      else replaceScreen({ pathname: '/verify-email', params: { email } });
      return;
    }
    if (result.errors.pin) {
      setError(result.errors.pin);
      setFirstPin(null);
      setPin('');
      return;
    }
    updateSignupDraft({ errors: result.errors });
    router.back();
  }

  return (
    <SafeAreaView style={styles.root}>
      <StepHeader step={2} total={2} onBack={() => router.back()} />
      <View style={styles.heading}>
        <Text style={styles.title}>{confirming ? 'Enter your PIN again' : 'Create a 6-digit PIN'}</Text>
        <Text style={styles.subtitle}>You will use it to approve every transfer.</Text>
      </View>
      <PinDots length={pin.length} error={Boolean(error)} />
      <Text style={[styles.hint, error ? styles.error : null]}>{error || 'Avoid easy PINs like 123456 or 111111.'}</Text>
      <View style={styles.spacer} />
      <MaddKeypad mode="pin" onKey={onKey} />
      <MaddButton
        label="Confirm PIN"
        onPress={onConfirm}
        loading={sending}
        disabled={!confirming || pin.length < PIN_LENGTH}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl, gap: 24 },
  heading: { gap: 8 },
  title: { fontFamily: fonts.extrabold, fontSize: 30, letterSpacing: -1, color: colors.ink },
  subtitle: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.muted },
  hint: { textAlign: 'center', fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  error: { color: colors.dangerText, fontFamily: fonts.semibold },
  spacer: { flex: 1 },
});
