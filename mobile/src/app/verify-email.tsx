import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { resendSignupCode, verifyEmail } from '../api/auth';
import { MaddButton } from '../components/MaddButton';
import { KeypadKey, MaddKeypad } from '../components/MaddKeypad';
import { PinBoxes } from '../components/PinBoxes';
import { ResendCodeButton } from '../components/ResendCodeButton';
import { replaceScreen } from '../utils/navigation';
import { colors, fonts, spacing } from '../theme';

const CODE_LENGTH = 6;

/**
 * "Check your email" (task G4b): after Create PIN, or when an unverified account tries to log in. The owner types the
 * 6-digit code we emailed; the server checks it, and the account can then log in ("Account created").
 */
export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  /** Adds or removes one digit of the code. */
  function onKey(key: KeypadKey) {
    if (sending || key === '.') return;
    setError('');
    setCode((c) => (key === 'delete' ? c.slice(0, -1) : (c + key).slice(0, CODE_LENGTH)));
  }

  /** Sends the code; on success the account is ready and "Account created" opens. */
  async function onConfirm() {
    setSending(true);
    const result = await verifyEmail(email, code);
    setSending(false);
    if (result.ok) {
      replaceScreen('/account-created');
      return;
    }
    setError(result.message);
    setCode('');
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.heading}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>We sent a 6-digit code to {email}. Enter it to finish creating your account.</Text>
      </View>
      <PinBoxes length={code.length} error={Boolean(error)} digits={code} />
      <Text style={[styles.hint, error ? styles.error : null]}>{error || 'Check your spam folder if you can’t see it.'}</Text>
      <ResendCodeButton onResend={() => resendSignupCode(email)} />
      <View style={styles.spacer} />
      <MaddKeypad mode="pin" onKey={onKey} />
      <MaddButton label="Confirm code" onPress={onConfirm} loading={sending} disabled={code.length < CODE_LENGTH} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.xl, gap: 24 },
  heading: { gap: 8 },
  title: { fontFamily: fonts.extrabold, fontSize: 30, letterSpacing: -1, color: colors.ink },
  subtitle: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.muted },
  hint: { textAlign: 'center', fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  error: { color: colors.dangerText, fontFamily: fonts.semibold },
  spacer: { flex: 1 },
});
