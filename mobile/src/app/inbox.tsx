import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { confirmHeldTransfer, rejectHeldTransfer } from '../api/holds';
import { freezeMyAccount } from '../api/me';
import { getInbox, InboxPage, InboxTab, markTabRead, PendingCard } from '../api/notifications';
import { clearSession } from '../auth/session';
import { updateTransferDraft } from '../auth/transferDraft';
import { ReleasePinSheet } from '../components/hold/ReleasePinSheet';
import { InboxRow } from '../components/inbox/InboxRow';
import { InboxSwitch } from '../components/inbox/InboxSwitch';
import { PendingTransferCard } from '../components/inbox/PendingTransferCard';
import { MaddTabBar, Tab } from '../components/MaddTabBar';
import { formatRM } from '../utils/money';
import { backToHome, openScreen, replaceScreen, restartAt } from '../utils/navigation';
import { colors, fonts, spacing } from '../theme';

/**
 * Inbox (designs 32 and 18): All (money, held transfers) and Security (waiting transfer with Yes / No on top,
 * new devices, locks, confirmed holds). The server words every item; opening a tab marks it read.
 */
export default function InboxScreen() {
  const [tab, setTab] = useState<InboxTab>('all');
  const { page, reload } = useInbox(tab);
  const [releasing, setReleasing] = useState<PendingCard | null>(null);
  const [pinError, setPinError] = useState('');
  const [busy, setBusy] = useState(false);

  /** "Yes, it was me" with the PIN (design 29): the server sends the money and the receipt opens. */
  async function onRelease(pin: string) {
    if (!releasing) return;
    setBusy(true);
    const result = await confirmHeldTransfer(releasing.transactionId, pin);
    setBusy(false);
    if (result.ok) {
      updateTransferDraft({ receipt: result.receipt });
      replaceScreen('/sent');
    } else if (result.reason === 'pin_locked') replaceScreen('/pin-locked');
    else if (result.reason === 'expired') {
      setReleasing(null);
      reload();
    } else setPinError(result.message);
  }

  /** "No, freeze": the server cancels the transfer, freezes the account and logs out every phone. */
  async function onReject(card: PendingCard) {
    setBusy(true);
    const result = await rejectHeldTransfer(card.transactionId);
    setBusy(false);
    if (!result.ok) return Alert.alert('Not done', result.message);
    await clearSession();
    restartAt({ pathname: '/frozen', params: { cancelledAmountSen: String(result.cancelledAmountSen) } });
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Inbox</Text>
        <InboxSwitch tab={tab} securityCount={page?.unread.security ?? 0} onChange={setTab} />
      </View>
      {!page ? (
        <ActivityIndicator style={styles.loading} color={colors.blue} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={false} onRefresh={reload} colors={[colors.blue]} />}>
          {page.pending.map((card) => (
            <PendingTransferCard key={card.transactionId} card={card} busy={busy} onYes={() => setReleasing(card)} onNo={() => onReject(card)} onTimeUp={reload} />
          ))}
          {page.items.map((item) => (
            <InboxRow key={item.id} item={item} onFreeze={confirmFreeze} />
          ))}
          {page.items.length === 0 && page.pending.length === 0 && <Text style={styles.empty}>Nothing here yet.</Text>}
        </ScrollView>
      )}
      <MaddTabBar active="inbox" onSelect={onTabSelect} />
      {releasing && (
        <ReleasePinSheet
          summary={`${formatRM(releasing.amountSen)} to ${releasing.otherName} will be sent now`}
          error={pinError}
          sending={busy}
          onSubmit={onRelease}
          onCancel={() => {
            setReleasing(null);
            setPinError('');
          }}
        />
      )}
    </SafeAreaView>
  );
}

/** Loads one Inbox tab each time it is shown, then tells the server it was read. `reload` loads it again. */
function useInbox(tab: InboxTab) {
  const [page, setPage] = useState<InboxPage | null>(null);

  const reload = useCallback(() => {
    getInbox(tab)
      .then((data) => {
        setPage(data);
        return markTabRead(tab);
      })
      .catch(() => undefined); // offline: keep what is shown
  }, [tab]);

  useFocusEffect(reload);
  return { page, reload };
}

/** "Freeze my account" on a lock item: asks first, then the server freezes and logs out every phone. */
function confirmFreeze() {
  Alert.alert('Freeze your account?', 'No one can send money from it until MADD support unfreezes it. All your phones will be logged out.', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Freeze',
      style: 'destructive',
      onPress: async () => {
        const result = await freezeMyAccount();
        if (!result.ok) return Alert.alert('Not done', result.message);
        await clearSession();
        restartAt('/frozen');
      },
    },
  ]);
}

/** Tab bar taps from the Inbox. */
function onTabSelect(tab: Tab) {
  if (tab === 'home') backToHome();
  if (tab === 'history' || tab === 'scan' || tab === 'profile') openScreen(`/${tab}`);
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.lg, gap: 18 },
  title: { fontFamily: fonts.extrabold, fontSize: 34, letterSpacing: -1.2, color: colors.ink },
  loading: { flex: 1, backgroundColor: colors.background },
  list: { backgroundColor: colors.background, padding: spacing.xl, paddingTop: spacing.lg, gap: 14, flexGrow: 1 },
  empty: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: 40 },
});
