import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Icon } from '../components/icons';
import { MaddButton } from '../components/MaddButton';
import { formatRM } from '../utils/money';
import { restartAt } from '../utils/navigation';
import { FROZEN_MESSAGE } from '../utils/support';
import { colors, fonts, radius, spacing } from '../theme';

/**
 * "Your account is frozen" (design 14). Shown after "No, freeze my account", and on any other phone the next time
 * it talks to the server. The phone is already logged out; OK goes to Log in.
 */
export default function FrozenScreen() {
  const { cancelledAmountSen } = useLocalSearchParams<{ cancelledAmountSen?: string }>();
  const insets = useSafeAreaInsets();
  const done = [
    ...(cancelledAmountSen ? [`The held transfer of ${formatRM(Number(cancelledAmountSen))} was cancelled.`] : []),
    'All devices have been signed out.',
    'Our team has been told and will review it.',
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.center}>
        <View style={styles.icon}>
          <Icon name="snowflake" size={40} color={colors.danger} strokeWidth={2.4} />
        </View>
        <Text style={styles.title}>Your account is frozen</Text>
        <Text style={styles.text}>Your money is safe. No one can send money from this wallet until it is unfrozen.</Text>
        <View style={styles.card}>
          {done.map((line) => (
            <View key={line} style={styles.line}>
              <Icon name="check" size={20} color={colors.success} strokeWidth={2.6} />
              <Text style={styles.lineText}>{line}</Text>
            </View>
          ))}
        </View>
        <View style={styles.support}>
          <Text style={styles.supportTitle}>To unfreeze, contact support</Text>
          <Text style={styles.supportText}>{FROZEN_MESSAGE}</Text>
        </View>
      </View>
      <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.xl }]}>
        <MaddButton label="OK" variant="dark" onPress={() => restartAt('/login')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 56, gap: 18 },
  icon: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.dangerBg, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.extrabold, fontSize: 28, letterSpacing: -1, color: colors.ink, textAlign: 'center' },
  text: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: colors.muted, textAlign: 'center' },
  card: { alignSelf: 'stretch', backgroundColor: colors.background, borderRadius: radius.card, padding: 18, gap: 14 },
  line: { flexDirection: 'row', gap: 12 },
  lineText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.ink },
  support: { alignSelf: 'stretch', borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.card, padding: 16, gap: 4 },
  supportTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  supportText: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  actions: { paddingHorizontal: spacing.xl },
});
