// TEMPORARY (task B3): proves login works. Replaced by the real Home screen (design 05) in task B4.
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { replaceScreen } from '../utils/navigation';
import { clearSession, getSavedName, getToken } from '../auth/session';
import { MaddButton } from '../components/MaddButton';
import { colors, fonts, spacing } from '../theme';

/** Placeholder home: greets the logged-in user and lets them log out. */
export default function HomePlaceholder() {
  const [name, setName] = useState('');
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    getSavedName().then((n) => setName(n ?? ''));
    getToken().then((t) => setHasToken(Boolean(t)));
  }, []);

  /** Deletes the session from the phone and goes back to the splash screen. */
  async function onLogout() {
    await clearSession();
    replaceScreen('/');
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.center}>
        <Text style={styles.title}>Logged in as {name}</Text>
        <Text style={styles.text}>{hasToken ? 'Session token saved in secure storage.' : 'No session token found.'}</Text>
        <Text style={styles.text}>The real Home screen arrives in task B4.</Text>
      </View>
      <MaddButton label="Log out" variant="dark" onPress={onLogout} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, padding: spacing.xl, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { fontFamily: fonts.extrabold, fontSize: 26, letterSpacing: -0.8, color: colors.ink, textAlign: 'center' },
  text: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted, textAlign: 'center' },
});
