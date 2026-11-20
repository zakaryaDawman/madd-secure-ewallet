import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { getTransaction } from '../api/transactions';
import { WaitingForApproval } from '../components/hold/WaitingForApproval';
import { Icon } from '../components/icons';
import { MaddButton } from '../components/MaddButton';
import { backToHome, replaceScreen } from '../utils/navigation';
import { colors, fonts, spacing } from '../theme';

const CHECK_EVERY_MS = 5000;

/**
 * "Approve on your usual phone" (design 12): a transfer from a phone that isn't trusted yet (rule R3).
 * Shows only a general message, never the rule details. Asks the server every few seconds: approved opens the
 * transfer details, ran out opens "Transfer cancelled". If the owner froze the account, the app opens Frozen by itself.
 */
export default function NewDeviceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const insets = useSafeAreaInsets();

  /** Asks the server about the transfer and moves on once it is no longer waiting. */
  const check = useCallback(() => {
    getTransaction(Number(id))
      .then((tx) => {
        if (tx?.status === 'EXPIRED') replaceScreen({ pathname: '/hold-expired', params: { id } });
        else if (tx && tx.status !== 'PENDING') replaceScreen({ pathname: '/transaction', params: { id } });
        else if (tx?.hold) setSecondsLeft((current) => current ?? tx.hold!.secondsLeft);
      })
      .catch(() => undefined); // offline for a moment: the next check tries again
  }, [id]);

  useEffect(() => {
    check();
    const timer = setInterval(check, CHECK_EVERY_MS);
    return () => clearInterval(timer);
  }, [check]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.center}>
        <View style={styles.icon}>
          <Icon name="phones" size={40} color={colors.blue} strokeWidth={2.2} />
        </View>
        <Text style={styles.title}>Approve on your usual phone</Text>
        <Text style={styles.text}>For your security, transfers from a new device need approval from the phone you normally use.</Text>
        {secondsLeft === null ? <ActivityIndicator color={colors.blue} /> : <WaitingForApproval secondsLeft={secondsLeft} onDone={check} />}
        <Text style={styles.text}>Lost your phone? Contact MADD support to verify this device.</Text>
      </View>
      <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.xl }]}>
        <MaddButton label="Back to home" variant="secondary" onPress={backToHome} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 72, gap: 20 },
  icon: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 34, letterSpacing: -1, color: colors.ink, textAlign: 'center' },
  text: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: colors.muted, textAlign: 'center' },
  actions: { paddingHorizontal: spacing.xl },
});
