import { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { resendSignupCode, type RegisterField } from '../api/auth';
import { MaddButton } from '../components/MaddButton';
import { ResendCodeButton } from '../components/ResendCodeButton';
import { StepHeader } from '../components/StepHeader';
import { TextField, TextInputHandle } from '../components/TextField';
import { getSignupDraft, updateSignupDraft } from '../auth/signupDraft';
import { openScreen } from '../utils/navigation';
import { colors, fonts, spacing } from '../theme';

type Form = { email: string; code: string; password: string };
type Errors = Partial<Record<RegisterField | 'code', string>>;

/**
 * "I have an invite" (task G10, styled like design 03): a customer added by an admin types the email the invite went
 * to, the 6-digit code and a new password. Continue goes to Create PIN, which sends everything to the server.
 */
export default function AcceptInviteScreen() {
  const [form, setForm] = useState<Form>(() => {
    const { email, inviteCode, password } = getSignupDraft();
    return { email, code: inviteCode, password };
  });
  const [errors, setErrors] = useState<Errors>({});
  const codeRef = useRef<TextInputHandle>(null);
  const passwordRef = useRef<TextInputHandle>(null);

  // When coming back from the PIN step, show what the server refused (e.g. a wrong or old code).
  useFocusEffect(
    useCallback(() => {
      setErrors(getSignupDraft().errors);
    }, []),
  );

  /** Updates one field and clears its error as soon as the user edits it. */
  function setField(field: keyof Form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined, form: undefined }));
  }

  /** Checks the fields; if they look right, keeps them in memory and opens the PIN step. */
  function onContinue() {
    const found = checkFields(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    updateSignupDraft({ email: form.email.trim().toLowerCase(), inviteCode: form.code, password: form.password, errors: {} });
    openScreen('/create-pin');
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={styles.flex} behavior="height">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <StepHeader step={1} total={2} onBack={() => router.back()} />
          <View style={styles.heading}>
            <Text style={styles.title}>Accept your invite</Text>
            <Text style={styles.subtitle}>MADD staff added your account. Enter the code from your email and choose your own password.</Text>
          </View>
          {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}
          <View style={styles.fields}>
            <TextField label="Email" value={form.email} onChangeText={(v) => setField('email', v)} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoComplete="email" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => codeRef.current?.focus()} />
            <TextField ref={codeRef} label="Invite code" value={form.code} onChangeText={(v) => setField('code', v.replace(/\D/g, '').slice(0, 6))} error={errors.code} keyboardType="number-pad" placeholder="6 digits" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => passwordRef.current?.focus()} />
            <TextField ref={passwordRef} label="New password" value={form.password} onChangeText={(v) => setField('password', v)} error={errors.password} secureTextEntry autoCapitalize="none" autoComplete="new-password" returnKeyType="done" onSubmitEditing={onContinue} />
          </View>
          {/^\S+@\S+\.\S+$/.test(form.email.trim()) && <ResendCodeButton onResend={() => resendSignupCode(form.email.trim().toLowerCase(), true)} />}
        </ScrollView>
        <View style={styles.footer}>
          <MaddButton label="Continue" onPress={onContinue} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Quick checks on the phone before moving on (the server checks everything again). Returns one message per wrong field. */
function checkFields(form: Form): Errors {
  const errors: Errors = {};
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Enter a valid email address';
  if (!/^\d{6}$/.test(form.code)) errors.code = 'Enter the 6-digit code from your email';
  if (form.password.length < 8) errors.password = 'Use at least 8 characters';
  else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) errors.password = 'Use letters and at least one number';
  return errors;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl, gap: spacing.xl },
  heading: { gap: 8 },
  title: { fontFamily: fonts.extrabold, fontSize: 30, letterSpacing: -1, color: colors.ink },
  subtitle: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.muted },
  formError: { fontFamily: fonts.semibold, fontSize: 14, color: colors.dangerText, backgroundColor: colors.dangerBg, borderRadius: 12, padding: 12 },
  fields: { gap: 14 },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, paddingTop: spacing.sm },
});
