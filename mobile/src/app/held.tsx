import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { confirmHeldTransfer, rejectHeldTransfer } from '../api/holds';
import { getTransaction, TransactionDetail } from '../api/transactions';
import { clearSession } from '../auth/session';
import { updateTransferDraft } from '../auth/transferDraft';
import { HoldCountdown } from '../components/hold/HoldCountdown';
import { HoldFactsCard } from '../components/hold/HoldFactsCard';
import { HoldReason } from '../components/hold/HoldReason';
import { ReleasePinSheet } from '../components/hold/ReleasePinSheet';
import { Icon } from '../components/icons';
import { MaddButton } from '../components/MaddButton';
import { formatRM } from '../utils/money';
import { redirectTo, replaceScreen, restartAt } from '../utils/navigation';
import { colors, fonts, spacing } from '../theme';

/**
 * "Was this you?" (design 11): a transfer the server paused because rule R1 or R2 fired. Shows the server's reason and
 * counts down 5 minutes. When time is up it asks the server again, which cancels the transfer, and opens "Transfer cancelled".
 * "Yes" asks for the PIN (design 29) and the server sends the money; "No" freezes the account (design 14).
 */
export default function HeldScreen() {
  const { id, fromSend } = useLocalSearchParams<{ id: string; fromSend?: string }>();
  const [tx, setTx] = useState<TransactionDetail | null>();
  const [pinOpen, setPinOpen] = useState(false);
  const [pinError, setPinError] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  /** Asks the server for the transfer; once it is no longer waiting (or this phone can't decide), moves to the right screen. */
  const refresh = useCallback(() => {
    getTransaction(Number(id))
      .then((latest) => {
        if (latest?.status === 'EXPIRED') redirectTo({ pathname: '/hold-expired', params: { id, fromSend } });
        else if (latest && latest.status !== 'PENDING') redirectTo({ pathname: '/transaction', params: { id } });
        else if (latest?.hold && !latest.hold.canDecide) redirectTo({ pathname: '/new-device', params: { id } });
        else setTx(latest);
      })
      .catch(() => setTx(null));
  }, [id, fromSend]);

  useEffect(refresh, [refresh]);

  /** "Yes, it was me": the server checks the PIN and the balance again, then sends the money and the receipt opens. */
  async function onRelease(pin: string) {
    setBusy(true);
    const result = await confirmHeldTransfer(Number(id), pin);
    setBusy(false);
    if (result.ok) {
      updateTransferDraft({ receipt: result.receipt });
      replaceScreen('/sent');
    } else if (result.reason === 'pin_locked') {
      replaceScreen('/pin-locked');
    } else if (result.reason === 'expired') {
      replaceScreen({ pathname: '/hold-expired', params: { id, fromSend } });
    } else {
      setPinError(result.message);
    }
  }

  /** "No, freeze my account": the server cancels the transfer, freezes the account and logs out every phone. */
  async function onFreeze() {
    setBusy(true);
    const result = await rejectHeldTransfer(Number(id));
    setBusy(false);
    if (!result.ok) {
      setActionError(result.message);
      return;
    }
    await clearSession();
    restartAt({ pathname: '/frozen', params: { cancelledAmountSen: String(result.cancelledAmountSen) } });
  }

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
      <View style={styles.actions}>
        {actionError ? <Text style={styles.error}>{actionError}</Text> : null}
        <MaddButton label="Yes, it was me" onPress={() => setPinOpen(true)} disabled={busy} />
        <MaddButton label="No, freeze my account" variant="danger" onPress={onFreeze} loading={busy && !pinOpen} />
        <Text style={styles.footer}>If you do nothing, the transfer is cancelled in 5 minutes.</Text>
      </View>
      {pinOpen && (
        <ReleasePinSheet
          summary={`${formatRM(tx.amountSen)} to ${tx.otherNameMasked} will be sent now`}
          error={pinError}
          sending={busy}
          onSubmit={onRelease}
          onCancel={() => {
            setPinOpen(false);
            setPinError('');
          }}
        />
      )}
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
  actions: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: 12 },
  error: { fontFamily: fonts.semibold, fontSize: 13, color: colors.dangerText, textAlign: 'center' },
  footer: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, textAlign: 'center' },
});
