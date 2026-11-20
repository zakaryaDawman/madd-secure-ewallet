import { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import type { RegisterField } from '../api/auth';
import { MaddButton } from '../components/MaddButton';
import { StepHeader } from '../components/StepHeader';
import { TextField, TextInputHandle } from '../components/TextField';
import { getSignupDraft, updateSignupDraft } from '../auth/signupDraft';
import { passwordStrength } from '../utils/password';
import { colors, fonts, spacing } from '../theme';

type Errors = Partial<Record<RegisterField, string>>;

/** Create account screen (design 03): name, email, phone and password. Continue goes to the PIN step. */
export default function RegisterScreen() {
  const [form, setForm] = useState(() => {
    const { fullName, email, phone, password } = getSignupDraft();
    return { fullName, email, phone, password };
  });
  const [errors, setErrors] = useState<Errors>({});
  const emailRef = useRef<TextInputHandle>(null);
  const phoneRef = useRef<TextInputHandle>(null);
  const passwordRef = useRef<TextInputHandle>(null);

  // When coming back from the PIN step, show any errors the server found.
  useFocusEffect(
    useCallback(() => {
      setErrors(getSignupDraft().errors);
    }, []),
  );

  /** Updates one field and clears its error as soon as the user edits it. */
  function setField(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined, form: undefined }));
  }

  /** Checks the fields; if they look right, saves them in memory and opens the PIN step. */
  function onContinue() {
    const found = checkFields(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    updateSignupDraft({ ...form, errors: {} });
    router.push('/create-pin');
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={styles.flex} behavior="height">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <StepHeader step={1} total={2} onBack={() => router.back()} />
          <View style={styles.heading}>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Your wallet opens with RM 1,000 of demo money.</Text>
          </View>
          {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}
          <View style={styles.fields}>
            <TextField label="Full name" value={form.fullName} onChangeText={(v) => setField('fullName', v)} error={errors.fullName} autoCapitalize="words" autoComplete="name" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => emailRef.current?.focus()} />
            <TextField ref={emailRef} label="Email" value={form.email} onChangeText={(v) => setField('email', v)} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoComplete="email" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => phoneRef.current?.focus()} />
            <TextField ref={phoneRef} label="Phone number" prefix="+60" value={form.phone} onChangeText={(v) => setField('phone', v)} error={errors.phone} keyboardType="phone-pad" placeholder="12 345 6789" autoComplete="tel" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => passwordRef.current?.focus()} />
            <TextField ref={passwordRef} label="Password" value={form.password} onChangeText={(v) => setField('password', v)} error={errors.password} secureTextEntry autoCapitalize="none" autoComplete="new-password" returnKeyType="done" onSubmitEditing={onContinue} />
            <StrengthBar password={form.password} />
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <MaddButton label="Continue" onPress={onContinue} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Quick checks on the phone before moving on (the server checks everything again). Returns one message per wrong field. */
function checkFields(form: { fullName: string; email: string; phone: string; password: string }): Errors {
  const errors: Errors = {};
  if (form.fullName.trim().length < 2) errors.fullName = 'Enter your full name';
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Enter a valid email address';
  if (!/^(\+?60|0)?1\d{8,9}$/.test(form.phone.replace(/[\s-]/g, ''))) errors.phone = 'Enter a Malaysian mobile number, e.g. 12 345 6789';
  if (form.password.length < 8) errors.password = 'Use at least 8 characters';
  else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) errors.password = 'Use letters and at least one number';
  return errors;
}

/** Four-segment password strength bar with a label, e.g. "Strong password". */
function StrengthBar({ password }: { password: string }) {
  const { score, label } = passwordStrength(password);
  if (!password) return null;
  const color = score >= 3 ? colors.success : score === 2 ? colors.warning : colors.danger;
  return (
    <View style={styles.strength}>
      <View style={styles.segments}>
        {[1, 2, 3, 4].map((n) => (
          <View key={n} style={[styles.segment, { backgroundColor: n <= score ? color : colors.line }]} />
        ))}
      </View>
      <Text style={[styles.strengthLabel, { color }]}>{label} password</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl, gap: spacing.xl },
  heading: { gap: 8 },
  title: { fontFamily: fonts.extrabold, fontSize: 30, letterSpacing: -1, color: colors.ink },
  subtitle: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted },
  formError: { fontFamily: fonts.semibold, fontSize: 14, color: colors.dangerText, backgroundColor: colors.dangerBg, borderRadius: 12, padding: 12 },
  fields: { gap: 14 },
  strength: { gap: 6 },
  segments: { flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 4, borderRadius: 4 },
  strengthLabel: { fontFamily: fonts.semibold, fontSize: 13 },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, paddingTop: spacing.sm },
});
