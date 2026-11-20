import { Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTransferDraft } from '../auth/transferDraft';
import { Icon } from '../components/icons';
import { MaddButton } from '../components/MaddButton';
import { formatRM } from '../utils/money';
import { backToHome } from '../utils/navigation';
import { colors, fonts, radius, spacing } from '../theme';

/** "Money sent" receipt (design 10): amount, recipient, note, date, reference and new balance, with Share and Done. */
export default function SentScreen() {
  const receipt = getTransferDraft().receipt;
  const insets = useSafeAreaInsets();
  if (!receipt) return null;

  const when = new Date(receipt.createdAt).toLocaleString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

  /** Opens Android's share menu with a short text receipt. */
  function onShare() {
    Share.share({
      message: `MADD receipt ${receipt!.reference}\n${formatRM(receipt!.amountSen)} sent to ${receipt!.recipientName}\n${when}`,
    });
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.top}>
        <View style={styles.tick}>
          <Icon name="check" size={44} color={colors.white} strokeWidth={2.6} />
        </View>
        <Text style={styles.title}>Money sent</Text>
        <Text style={styles.amount}>{formatRM(receipt.amountSen)}</Text>
        <Text style={styles.to}>to {receipt.recipientName}</Text>
      </View>

      <View style={styles.card}>
        <Row label="For" value={receipt.note || '—'} />
        <Row label="Date" value={when} />
        <Row label="Reference" value={receipt.reference} />
        <Row label="New balance" value={formatRM(receipt.newBalanceSen)} last />
      </View>

      <View style={styles.spacer} />
      <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.xl }]}>
        <MaddButton label="Share receipt" variant="secondary" onPress={onShare} />
        <MaddButton label="Done" onPress={backToHome} />
      </View>
    </SafeAreaView>
  );
}

/** One label/value line in the receipt card. */
function Row({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowLine]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, paddingHorizontal: spacing.xl, paddingTop: 72, gap: 28 },
  top: { alignItems: 'center', gap: 14 },
  tick: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.extrabold, fontSize: 28, letterSpacing: -0.8, color: colors.ink },
  amount: { fontFamily: fonts.extrabold, fontSize: 44, letterSpacing: -1.4, color: colors.ink, fontVariant: ['tabular-nums'] },
  to: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted },
  card: { backgroundColor: colors.background, borderRadius: radius.card, paddingHorizontal: 18, paddingVertical: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13, gap: 12 },
  rowLine: { borderBottomWidth: 1, borderBottomColor: '#E3E9F5' },
  rowLabel: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  rowValue: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 14, color: colors.ink, textAlign: 'right' },
  spacer: { flex: 1 },
  actions: { gap: 12 },
});
