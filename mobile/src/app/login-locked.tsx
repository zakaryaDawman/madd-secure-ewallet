import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Icon } from '../components/icons';
import { MaddButton } from '../components/MaddButton';
import { minutesAndSeconds, useCountdown } from '../utils/useCountdown';
import { colors, fonts, radius, spacing } from '../theme';

/**
 * "Too many wrong passwords" (design 27): the server paused sign-in for 15 minutes (rule R4).
 * Counts down from the server's time left. OK goes back to Log in.
 */
export default function LoginLockedScreen() {
  const { seconds } = useLocalSearchParams<{ seconds: string }>();
  const [over, setOver] = useState(false);
  const left = useCountdown(Number(seconds) || 0, useCallback(() => setOver(true), []));
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.center}>
        <View style={styles.icon}>
          <Icon name="lock" size={40} color={colors.danger} strokeWidth={2.4} />
        </View>
        <Text style={styles.title}>Too many wrong passwords</Text>
        <Text style={styles.text}>For your safety, sign-in is paused for this account.</Text>
        <Text style={styles.timer}>{minutesAndSeconds(left)}</Text>
        <Text style={styles.small}>{over ? 'You can try again now' : 'until you can try again'}</Text>
        <View style={styles.info}>
          <Icon name="info" size={20} color={colors.blue} />
          <Text style={styles.infoText}>We sent an alert to your registered phone. If this wasn&apos;t you, you can freeze your account from there.</Text>
        </View>
      </View>
      <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.xl }]}>
        <MaddButton label="OK" variant="secondary" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 72, gap: 14 },
  icon: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.dangerBg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 34, letterSpacing: -1, color: colors.ink, textAlign: 'center' },
  text: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: colors.muted, textAlign: 'center' },
  timer: { fontFamily: fonts.extrabold, fontSize: 52, letterSpacing: -1.5, color: colors.ink, fontVariant: ['tabular-nums'], marginTop: 8 },
  small: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  info: { alignSelf: 'stretch', flexDirection: 'row', gap: 12, backgroundColor: colors.background, borderRadius: radius.card, padding: 16, marginTop: 12 },
  infoText: { flex: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.ink },
  actions: { paddingHorizontal: spacing.xl },
});
