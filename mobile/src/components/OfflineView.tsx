import { StyleSheet, Text, View } from 'react-native';
import { Icon } from './icons';
import { MaddButton } from './MaddButton';
import { colors, fonts, radius, spacing } from '../theme';

/** "You're offline" message with Try again (design 46). Shown when the phone can't reach the server. */
export function OfflineView({ onRetry, retrying = false }: { onRetry: () => void; retrying?: boolean }) {
  return (
    <View style={styles.root}>
      <View style={styles.center}>
        <View style={styles.icon}>
          <Icon name="wifiOff" size={44} color={colors.muted} />
        </View>
        <Text style={styles.title}>You&apos;re offline</Text>
        <Text style={styles.text}>We can&apos;t reach MADD right now. Check your Wi-Fi or mobile data and try again.</Text>
        <View style={styles.note}>
          <Icon name="check" size={20} color={colors.success} strokeWidth={2.4} />
          <Text style={styles.noteText}>Your money is safe. No transfer is sent unless our server confirms it.</Text>
        </View>
      </View>
      <MaddButton label="Try again" onPress={onRetry} loading={retrying} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.xl, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  icon: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#EEF2FA', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.extrabold, fontSize: 28, letterSpacing: -0.8, color: colors.ink },
  text: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: colors.muted, textAlign: 'center' },
  note: { flexDirection: 'row', gap: 12, backgroundColor: colors.background, borderRadius: radius.card, padding: spacing.lg, marginTop: 8 },
  noteText: { flex: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: '#344262' },
});
