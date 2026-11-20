import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { BlueGradient } from '../components/BlueGradient';
import { MaddWordmark } from '../components/MaddWordmark';
import { checkServer } from '../api/health';
import { colors, fonts, fontSizes, radius, spacing } from '../theme';

type ServerState = 'checking' | 'up' | 'down';

/** Splash screen (design 01-Main): logo, tagline, and the Create account / Log in buttons. */
export default function SplashScreen() {
  const serverState = useServerState();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <BlueGradient />
      <SafeAreaView style={styles.content}>
        <ServerBadge state={serverState} />
        <View style={styles.brand}>
          <MaddWordmark width={168} />
          <Text style={styles.tagline}>Your money, watched over.</Text>
        </View>
        <View style={styles.actions}>
          <Pressable style={[styles.button, styles.buttonWhite]} accessibilityRole="button" onPress={() => router.push('/welcome/1')}>
            <Text style={[styles.buttonText, { color: colors.blueDark }]}>Create account</Text>
          </Pressable>
          {/* Log in is connected in task B3. */}
          <Pressable style={[styles.button, styles.buttonGlass]} accessibilityRole="button">
            <Text style={[styles.buttonText, { color: colors.white }]}>Log in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

/** Checks the server once when the screen opens and reports checking / up / down. */
function useServerState(): ServerState {
  const [state, setState] = useState<ServerState>('checking');
  useEffect(() => {
    checkServer().then((up) => setState(up ? 'up' : 'down'));
  }, []);
  return state;
}

/** Small development-only label showing whether the phone can reach the server. */
function ServerBadge({ state }: { state: ServerState }) {
  const label = { checking: 'Checking server…', up: 'Server connected', down: 'Server not reachable' }[state];
  const dot = { checking: colors.sky, up: '#4ADE80', down: '#FCA5A5' }[state];
  return (
    <View style={styles.badge}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, justifyContent: 'space-between', paddingHorizontal: spacing.xxl, paddingVertical: spacing.xl },
  brand: { alignItems: 'center', gap: 28 },
  tagline: { fontFamily: fonts.medium, fontSize: 16, color: '#DCE6FF' },
  actions: { gap: spacing.md },
  button: { borderRadius: radius.pill, paddingVertical: 17, alignItems: 'center' },
  buttonWhite: { backgroundColor: colors.white },
  buttonGlass: { backgroundColor: 'rgba(255,255,255,0.14)' },
  buttonText: { fontFamily: fonts.bold, fontSize: fontSizes.button },  badge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(11,27,63,0.25)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  badgeText: { fontFamily: fonts.semibold, fontSize: fontSizes.caption, color: colors.white },
});
