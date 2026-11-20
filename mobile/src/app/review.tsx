import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { getTransferDraft, updateTransferDraft } from '../auth/transferDraft';
import { KeypadKey, MaddKeypad } from '../components/MaddKeypad';
import { PinBoxes } from '../components/PinBoxes';
import { formatRM } from '../utils/money';
import { openScreen } from '../utils/navigation';
import { colors, fonts, radius, spacing } from '../theme';

const PIN_LENGTH = 6;

/** Review transfer screen with the PIN sheet on top (design 08). The arrow sends the PIN on to the Checking screen. */
export default function ReviewScreen() {
  const { recipient, amountSen, note } = getTransferDraft();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const insets = useSafeAreaInsets();

  // Coming back after a wrong PIN: show the server's message and start the PIN again.
  useFocusEffect(
    useCallback(() => {
      const { pinError } = getTransferDraft();
      if (pinError) {
        setError(pinError);
        setPin('');
        updateTransferDraft({ pinError: '' });
      }
    }, []),
  );

  /** Adds or removes one PIN digit. */
  function onKey(key: KeypadKey) {
    if (key === '.') return;
    setError('');
    setPin((p) => (key === 'delete' ? p.slice(0, -1) : (p + key).slice(0, PIN_LENGTH)));
  }

  /** Hands the PIN to the Checking screen, which sends the transfer. */
  function onConfirm() {
    if (pin.length < PIN_LENGTH) {
      setError('Enter all 6 digits of your PIN');
      return;
    }
    updateTransferDraft({ pin });
    setPin('');
    openScreen('/checking');
  }

  if (!recipient) return null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.summary}>
        <Text style={styles.title}>Review transfer</Text>
        <View style={styles.card}>
          <SummaryRow label="To" value={recipient.maskedName} />
          <SummaryRow label="Amount" value={formatRM(amountSen)} />
          <SummaryRow label="Fee" value="Free" />
          <SummaryRow label="For" value={note || '—'} last />
        </View>
      </View>

      <View style={styles.dim} />

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 28 }]}>
        <View style={styles.handle} />
        <View style={styles.sheetHead}>
          <Text style={styles.sheetTitle}>Enter your PIN</Text>
          <Text style={styles.sheetText}>To send {formatRM(amountSen)} to {recipient.maskedName}</Text>
        </View>
        <PinBoxes length={pin.length} error={Boolean(error)} />
        <Text style={[styles.hint, error ? styles.errorText : null]}>
          {error || 'Transfers are checked for your safety and may need an extra confirmation.'}
        </Text>
        <MaddKeypad mode="pin" onKey={onKey} onCancel={() => router.back()} onConfirm={onConfirm} />
      </View>
    </SafeAreaView>
  );
}

/** One label/value line in the review card. */
function SummaryRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowLine]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  summary: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: 22 },
  title: { fontFamily: fonts.extrabold, fontSize: 28, letterSpacing: -0.8, color: colors.ink },
  card: { backgroundColor: colors.background, borderRadius: radius.card, paddingHorizontal: 18, paddingVertical: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, gap: 12 },
  rowLine: { borderBottomWidth: 1, borderBottomColor: '#E3E9F5' },
  rowLabel: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted },
  rowValue: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 15, color: colors.ink, textAlign: 'right' },
  dim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(11,27,63,0.45)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.white, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingHorizontal: spacing.xl, paddingTop: 12, gap: 18 },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.line },
  sheetHead: { alignItems: 'center', gap: 6 },
  sheetTitle: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.ink },
  sheetText: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, textAlign: 'center' },
  hint: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.muted, textAlign: 'center' },
  errorText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.dangerText },
});
