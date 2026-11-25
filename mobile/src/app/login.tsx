import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { openScreen, replaceScreen } from "../utils/navigation";
import { router } from "expo-router";
import { login } from "../api/auth";
import { clearSession, saveSession } from "../auth/session";
import { postLogout } from "../api/client";
import { notificationsNeverAsked, registerForPush } from "../utils/pushSetup";
import { Icon } from "../components/icons";
import { MaddAppBar } from "../components/MaddAppBar";
import { MaddButton } from "../components/MaddButton";
import { TextField, TextInputHandle } from "../components/TextField";
import { colors, fonts, radius, spacing } from "../theme";

type Errors = { email?: string; password?: string; form?: string };

/** Log in screen (design 02): email + password, then the session token is saved in secure storage. */
export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const passwordRef = useRef<TextInputHandle>(null);

  /**
   * Sends the details to the server; on success saves the session and opens Home (or "Turn on alerts", design 47, if
   * Android was never asked). After 5 wrong passwords: design 27.
   */
  async function onLogin() {
    setSending(true);
    const result = await login(email.trim(), password);
    setSending(false);
    if (!result.ok && "lockedSeconds" in result) {
      setPassword("");
      openScreen({
        pathname: "/login-locked",
        params: { seconds: String(result.lockedSeconds) },
      });
      return;
    }
    if (!result.ok && "unverified" in result) {
      setPassword("");
      openScreen({ pathname: "/verify-email", params: { email: email.trim().toLowerCase() } });
      return;
    }
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    await saveSession(result.token, result.fullName);
    setPassword("");
    if (result.role === "admin") {
      // Staff use the admin web console, never the wallet: end this session at once (the server blocks it too).
      await postLogout();
      await clearSession();
      setErrors({
        form: "Admin accounts use the MADD admin console, not the app.",
      });
      return;
    }
    if (await notificationsNeverAsked().catch(() => false)) {
      replaceScreen("/allow-notifications");
      return;
    }
    registerForPush().catch(() => undefined); // refreshes this phone's push token in the background
    replaceScreen("/home");
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={styles.flex} behavior="height">
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <MaddAppBar onBack={() => router.back()} />
          <View style={styles.heading}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Log in to your MADD wallet.</Text>
          </View>
          {errors.form ? (
            <Text style={styles.formError}>{errors.form}</Text>
          ) : null}
          <View style={styles.fields}>
            <TextField
              label="Email"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setErrors({});
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <TextField
              ref={passwordRef}
              label="Password"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setErrors({});
              }}
              error={errors.password}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              returnKeyType="done"
              onSubmitEditing={onLogin}
            />
            <Pressable
              accessibilityRole="link"
              onPress={() => openScreen("/forgot-password")}
              style={styles.forgot}
              hitSlop={8}
            >
              <Text style={styles.link}>Forgot password?</Text>
            </Pressable>
          </View>
          {/* Inside the scroll area, so the focused field can scroll above the keyboard instead of being hidden. */}
          <View style={styles.footer}>
            <View style={styles.info}>
              <Icon name="phone" size={18} color={colors.blue} />
              <Text style={styles.infoText}>
                Logging in on a new phone? We will ask your usual phone to
                approve it first.
              </Text>
            </View>
            <MaddButton label="Log in" onPress={onLogin} loading={sending} />
            <Text style={styles.bottomText}>
              New to MADD?{" "}
              <Text
                style={styles.linkBold}
                onPress={() => openScreen("/register")}
              >
                Create account
              </Text>
            </Text>
            <Text style={styles.bottomText}>
              Added by MADD staff?{" "}
              <Text
                style={styles.linkBold}
                onPress={() => openScreen("/accept-invite")}
              >
                I have an invite
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.xxl,
  },
  heading: { gap: 8 },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 34,
    letterSpacing: -1.2,
    color: colors.ink,
  },
  subtitle: { fontFamily: fonts.regular, fontSize: 16, color: colors.muted },
  formError: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.dangerText,
    backgroundColor: colors.dangerBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: -spacing.md,
  },
  fields: { gap: spacing.lg },
  forgot: { alignSelf: "flex-end" },
  link: { fontFamily: fonts.semibold, fontSize: 14, color: colors.blue },
  footer: { marginTop: "auto", paddingBottom: spacing.xl, gap: spacing.lg }, // pushed to the bottom when there's room
  info: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: colors.background,
    borderRadius: radius.field,
    padding: 14,
  },
  infoText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  },
  bottomText: {
    textAlign: "center",
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.muted,
  },
  linkBold: { fontFamily: fonts.bold, color: colors.blue },
});
