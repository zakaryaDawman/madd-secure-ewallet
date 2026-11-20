import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Icon } from '../components/icons';
import { MaddAppBar } from '../components/MaddAppBar';
import { MaddButton } from '../components/MaddButton';
import { TextField } from '../components/TextField';
import { colors, fonts, radius, spacing } from '../theme';

/** Forgot password screen (design 41). Sending the reset email is future work, so this only shows the confirmation. */
export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  /** Checks the email looks valid, then shows the "check your inbox" message (the same message whether or not the account exists). */
  function onSend() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address');
      return;
    }
    setSent(true);
  }

  return (
    <SafeAreaView style={styles.root}>
      <MaddAppBar onBack={() => router.back()} />
      <View style={styles.heading}>
        <Text style={styles.title}>Reset your password</Text>
        <Text style={styles.subtitle}>Enter your email. If it matches an account, we&apos;ll send a reset link.</Text>
      </View>
      <TextField
        label="Email"
        value={email}
        onChangeText={(v) => { setEmail(v); setError(''); setSent(false); }}
        error={error}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      {sent && (
        <View style={styles.notice}>
          <Icon name="check" size={20} color={colors.success} strokeWidth={2.4} />
          <Text style={styles.noticeText}>
            <Text style={styles.bold}>Check your inbox.</Text> The link works for 15 minutes. After you reset, every device is signed out.
          </Text>
        </View>
      )}
      <View style={styles.spacer} />
      <MaddButton label="Send reset link" onPress={onSend} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl, gap: 28 },
  heading: { gap: 8 },
  title: { fontFamily: fonts.extrabold, fontSize: 32, letterSpacing: -1.1, color: colors.ink },
  subtitle: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: colors.muted },
  notice: { flexDirection: 'row', gap: 12, backgroundColor: colors.successBg, borderRadius: radius.card, padding: spacing.lg },
  noticeText: { flex: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: '#14532D' },
  bold: { fontFamily: fonts.bold },
  spacer: { flex: 1 },
});
