import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { getTransaction, TransactionDetail } from '../api/transactions';
import { getWallet } from '../api/wallet';
import { getTransferDraft, startTransfer } from '../auth/transferDraft';
import { HoldFactsCard } from '../components/hold/HoldFactsCard';
import { Icon } from '../components/icons';
import { MaddButton } from '../components/MaddButton';
import { formatRM } from '../utils/money';
import { backTo, backToHome, openScreen } from '../utils/navigation';
import { colors, fonts, spacing } from '../theme';

type Loaded = { tx: TransactionDetail; balanceSen: number };

/** "Transfer cancelled" (design 35): a held transfer was not confirmed within 5 minutes, so the server cancelled it. */
export default function HoldExpiredScreen() {
  const { id, fromSend } = useLocalSearchParams<{ id: string; fromSend?: string }>();
  const [loaded, setLoaded] = useState<Loaded | null>();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Promise.all([getTransaction(Number(id)), getWallet()])
      .then(([tx, wallet]) => setLoaded(tx ? { tx, balanceSen: wallet.balanceSen } : null))
      .catch(() => setLoaded(null));
  }, [id]);

  if (loaded === undefined) return <ActivityIndicator style={styles.loading} color={colors.blue} />;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.center}>
        <View style={styles.icon}>
          <Icon name="clockOff" size={40} color={colors.muted} strokeWidth={2.4} />
        </View>
        <Text style={styles.title}>Transfer cancelled</Text>
        <Text style={styles.text}>You didn&apos;t confirm within 5 minutes, so we cancelled it. No money left your wallet.</Text>
        {loaded && (
          <HoldFactsCard
            facts={[
              { label: 'To', value: loaded.tx.otherNameMasked },
              { label: 'Amount', value: formatRM(loaded.tx.amountSen), struckOut: true },
              { label: 'Balance', value: formatRM(loaded.balanceSen) },
            ]}
          />
        )}
      </View>
      <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.xl }]}>
        <MaddButton label="Try again" onPress={() => tryAgain(fromSend === '1')} />
        <MaddButton label="Back to home" variant="secondary" onPress={backToHome} />
      </View>
    </SafeAreaView>
  );
}

/**
 * Starts the transfer again. Straight after sending, it goes back to Amount with the same recipient;
 * from History (where the recipient isn't in memory) it opens Choose recipient.
 */
function tryAgain(fromSend: boolean) {
  const recipient = getTransferDraft().recipient;
  if (fromSend && recipient) {
    startTransfer(recipient);
    backTo('/amount');
  } else {
    openScreen('/recipient');
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  loading: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 72, gap: 18 },
  icon: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.extrabold, fontSize: 28, letterSpacing: -1, color: colors.ink },
  text: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: colors.muted, textAlign: 'center' },
  actions: { paddingHorizontal: spacing.xl, gap: 12 },
});
