import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { getTransaction, TransactionDetail } from '../api/transactions';
import { HoldCountdown } from '../components/hold/HoldCountdown';
import { HoldFactsCard } from '../components/hold/HoldFactsCard';
import { HoldReason } from '../components/hold/HoldReason';
import { Icon } from '../components/icons';
import { formatRM } from '../utils/money';
import { replaceScreen } from '../utils/navigation';
import { colors, fonts, spacing } from '../theme';

/**
 * "Was this you?" (design 11): a transfer the server paused because rule R1 or R2 fired. Shows the server's reason and
 * counts down 5 minutes. When time is up it asks the server again, which cancels the transfer, and opens "Transfer cancelled".
 * The Yes / No buttons arrive in task D3.
 */
export default function HeldScreen() {
  const { id, fromSend } = useLocalSearchParams<{ id: string; fromSend?: string }>();
  const [tx, setTx] = useState<TransactionDetail | null>();

  /** Asks the server for the transfer; once it is no longer waiting, moves to the right screen. */
  const refresh = useCallback(() => {
    getTransaction(Number(id))
      .then((latest) => {
        if (latest?.status === 'EXPIRED') replaceScreen({ pathname: '/hold-expired', params: { id, fromSend } });
        else if (latest && latest.status !== 'PENDING') replaceScreen({ pathname: '/transaction', params: { id } });
        else setTx(latest);
      })
      .catch(() => setTx(null));
  }, [id, fromSend]);

  useEffect(refresh, [refresh]);

  if (tx === undefined) return <ActivityIndicator style={styles.loading} color={colors.blue} />;
  if (tx === null || !tx.hold) return <Text style={styles.loading}>We couldn&apos;t load this transfer.</Text>;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.icon}>
          <Icon name="hourglass" size={40} color={colors.warning} strokeWidth={2.4} />
        </View>
        <HoldCountdown secondsLeft={tx.hold.secondsLeft} onDone={refresh} />
        <Text style={styles.title}>Was this you?</Text>
        <Text style={styles.text}>We paused this transfer. No money has left your wallet.</Text>
        <HoldFactsCard
          facts={[
            { label: 'To', value: tx.otherNameMasked },
            { label: 'Amount', value: formatRM(tx.amountSen) },
            { label: 'Device', value: tx.hold.thisDevice ? 'This phone' : 'Another phone' },
          ]}
        />
        <HoldReason reasons={tx.hold.reasons} />
      </ScrollView>
      <Text style={styles.footer}>If you do nothing, the transfer is cancelled in 5 minutes.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  loading: { flex: 1, textAlign: 'center', textAlignVertical: 'center', fontFamily: fonts.regular, color: colors.muted, backgroundColor: colors.white },
  content: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 56, paddingBottom: spacing.xl, gap: 18 },
  icon: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.warningBg, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.extrabold, fontSize: 30, letterSpacing: -1, color: colors.ink },
  text: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: colors.muted, textAlign: 'center' },
  footer: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, textAlign: 'center', padding: spacing.xl, paddingTop: 8 },
});
