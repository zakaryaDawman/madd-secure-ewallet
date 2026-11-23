import { type ComponentRef, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getTransaction, TransactionDetail } from '../api/transactions';
import { StatusBadge } from '../components/history/StatusBadge';
import { TxTimeline } from '../components/history/TxTimeline';
import { MaddAppBar } from '../components/MaddAppBar';
import { MaddButton } from '../components/MaddButton';
import { PersonAvatar } from '../components/PersonAvatar';
import { ReceiptImage, type ReceiptFacts } from '../components/ReceiptImage';
import { shareViewAsImage } from '../utils/shareImage';
import { timeOfDay } from '../utils/dateGroups';
import { formatRM } from '../utils/money';
import { colors, fonts, radius, spacing } from '../theme';

/** Full date and time, e.g. "18 Nov 2026, 8:05 PM". */
function fullDate(iso: string): string {
  const day = new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${day}, ${timeOfDay(iso)}`;
}

/** Transfer details screen (design 26): who, how much, status, the facts card, the timeline and Share receipt. */
export default function TransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tx = useTransaction(Number(id));
  const insets = useSafeAreaInsets();
  const imageRef = useRef<ComponentRef<typeof View>>(null);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.bar}>
        <MaddAppBar title="Transfer details" onBack={() => router.back()} />
      </View>
      {tx === undefined && <ActivityIndicator style={styles.message} color={colors.blue} />}
      {tx === null && <Text style={[styles.message, styles.messageText]}>We couldn&apos;t find this transaction.</Text>}
      {tx && (
        <>
          <ReceiptImage ref={imageRef} facts={receiptFacts(tx)} />
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.top}>
              <PersonAvatar name={tx.otherName} size={64} />
              <Text style={styles.who}>{tx.direction === 'out' ? `You sent to ${tx.otherName}` : `${tx.otherName} sent you`}</Text>
              <Text style={styles.amount}>{formatRM(tx.amountSen)}</Text>
              <StatusBadge status={tx.status} />
            </View>
            <View style={styles.card}>
              <Row label="For" value={tx.note || '—'} />
              <Row label={tx.direction === 'out' ? 'Recipient phone' : 'Sender phone'} value={tx.otherPhone} />
              <Row label="Date" value={fullDate(tx.createdAt)} />
              {tx.sentFrom && <Row label="Sent from" value={`${tx.sentFrom.name}${tx.sentFrom.thisDevice ? ' (this phone)' : ''}`} />}
              <Row label="Reference" value={tx.reference} last />
            </View>
            <TxTimeline tx={tx} />
          </ScrollView>
          <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.xl }]}>
            <MaddButton label="Share receipt" variant="secondary" onPress={() => shareViewAsImage(imageRef, 'Share receipt')} />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

/** Loads one transaction: undefined while loading, null if it isn't found or can't be loaded. */
function useTransaction(id: number): TransactionDetail | null | undefined {
  const [tx, setTx] = useState<TransactionDetail | null | undefined>(undefined);

  // `active` ignores a late reply if the user already left the screen.
  useEffect(() => {
    let active = true;
    getTransaction(id)
      .then((data) => active && setTx(data))
      .catch(() => active && setTx(null));
    return () => {
      active = false;
    };
  }, [id]);

  return tx;
}

/** What the shared receipt picture shows (task G6): masked name and phone, never the balance. */
function receiptFacts(tx: TransactionDetail): ReceiptFacts {
  return {
    direction: tx.direction,
    amount: formatRM(tx.amountSen),
    otherName: tx.otherNameMasked,
    rows: [
      { label: 'For', value: tx.note || '—' },
      { label: tx.direction === 'out' ? 'Recipient phone' : 'Sender phone', value: tx.otherPhone },
      { label: 'Date', value: fullDate(tx.createdAt) },
      { label: 'Reference', value: tx.reference },
    ],
  };
}

/** One label/value line in the details card. */
function Row({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowLine]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  bar: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  message: { marginTop: 48 },
  messageText: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, textAlign: 'center' },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xl, gap: 28 },
  top: { alignItems: 'center', gap: 10 },
  who: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted, marginTop: 4 },
  amount: { fontFamily: fonts.extrabold, fontSize: 40, letterSpacing: -1.4, color: colors.ink, fontVariant: ['tabular-nums'] },
  card: { backgroundColor: colors.background, borderRadius: radius.card, paddingHorizontal: 18, paddingVertical: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, gap: 12 },
  rowLine: { borderBottomWidth: 1, borderBottomColor: '#E3E9F5' },
  rowLabel: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  rowValue: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 14, color: colors.ink, textAlign: 'right' },
  actions: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
});
