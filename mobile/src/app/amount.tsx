import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getWallet } from '../api/wallet';
import { getTransferDraft, updateTransferDraft } from '../auth/transferDraft';
import { Icon } from '../components/icons';
import { MaddButton } from '../components/MaddButton';
import { KeypadKey, MaddKeypad } from '../components/MaddKeypad';
import { RecipientHeader } from '../components/send/RecipientHeader';
import { amountTextToSen, applyAmountKey, displayAmount } from '../utils/amountInput';
import { formatRM } from '../utils/money';
import { openScreen } from '../utils/navigation';
import { colors, fonts, radius, spacing } from '../theme';

const NOTE_LIMIT = 50;
const MIN_SEN = 100;
const MAX_SEN = 5_000_000; // RM 50,000.00, the same limit the server uses

/** Amount screen (design 07): type how much to send and what it's for. Turns red with "Send all" when the balance is too low (design 33). */
export default function AmountScreen() {
  const recipient = getTransferDraft().recipient;
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const balanceSen = useBalance();

  const amountSen = amountTextToSen(text);
  const overLimit = amountSen > MAX_SEN;
  const tooMuch = overLimit || (balanceSen !== null && amountSen > balanceSen);
  const canReview = amountSen >= MIN_SEN && !tooMuch;
  const { main, cents } = displayAmount(text);

  /** Saves the amount and note, then opens the Review screen. */
  function onReview() {
    updateTransferDraft({ amountSen, note: note.trim(), pinError: '' });
    openScreen('/review');
  }

  if (!recipient) return null;

  return (
    <SafeAreaView style={styles.root}>
      {/* The top part scrolls if it needs room, so the keypad and button below always stay on screen. */}
      <ScrollView style={styles.top} contentContainerStyle={styles.topContent} keyboardShouldPersistTaps="handled">
        <RecipientHeader recipient={recipient} onBack={() => router.back()} />
        <View style={styles.tip}>
          <Icon name="info" size={18} color={colors.blue} />
          <Text style={styles.tipText}>Always check the name before you send.</Text>
        </View>

        <View style={styles.amountBlock}>
          <Text style={styles.label}>You send</Text>
          <Text style={[styles.amount, tooMuch && { color: colors.danger }]} adjustsFontSizeToFit numberOfLines={1}>
            {main}
            <Text style={{ color: tooMuch ? '#F0A3A3' : '#B6C1DA' }}>{cents}</Text>
          </Text>
          {overLimit ? (
            <WarningPill text={`The largest transfer is ${formatRM(MAX_SEN)}`} />
          ) : tooMuch && balanceSen !== null ? (
            <LowBalance balanceSen={balanceSen} onSendAll={() => setText(String(balanceSen / 100))} />
          ) : (
            <Text style={styles.balance}>{balanceSen === null ? ' ' : `Balance ${formatRM(balanceSen)}`}</Text>
          )}
        </View>

        <View style={styles.noteBlock}>
          <Text style={styles.noteLabel}>What is it for?</Text>
          <View style={styles.noteBox}>
            <TextInput
              accessibilityLabel="What is it for?"
              value={note}
              onChangeText={(v) => setNote(v.slice(0, NOTE_LIMIT))}
              placeholder="e.g. Lunch"
              placeholderTextColor="#9AA6C2"
              style={styles.noteInput}
            />
            <Text style={styles.counter}>{note.length}/{NOTE_LIMIT}</Text>
          </View>
        </View>

      </ScrollView>
      <MaddKeypad mode="amount" onKey={(k: KeypadKey) => setText((t) => applyAmountKey(t, k))} />
      <MaddButton label="Review transfer" onPress={onReview} disabled={!canReview} />
    </SafeAreaView>
  );
}

/** Red "Not enough balance" message with a "Send all" link (design 33). */
function LowBalance({ balanceSen, onSendAll }: { balanceSen: number; onSendAll: () => void }) {
  return (
    <View style={styles.lowBlock}>
      <WarningPill text={`Not enough balance. You have ${formatRM(balanceSen)}`} />
      <Pressable accessibilityRole="button" onPress={onSendAll} hitSlop={8}>
        <Text style={styles.sendAll}>Send all ({formatRM(balanceSen)})</Text>
      </Pressable>
    </View>
  );
}

/** Red pill with a warning icon, used under the amount. */
function WarningPill({ text }: { text: string }) {
  return (
    <View style={styles.lowPill}>
      <Icon name="info" size={16} color={colors.dangerText} strokeWidth={2.4} />
      <Text style={styles.lowText}>{text}</Text>
    </View>
  );
}

/** Loads the current balance once, so the screen can warn before the server would refuse. */
function useBalance(): number | null {
  const [balance, setBalance] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    getWallet()
      .then((w) => active && setBalance(w.balanceSen))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return balance;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg, gap: 12 },
  top: { flex: 1 },
  topContent: { gap: 16, paddingBottom: 8 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.background, borderRadius: radius.field, paddingHorizontal: 14, paddingVertical: 12 },
  tipText: { fontFamily: fonts.medium, fontSize: 13, color: '#344262' },
  amountBlock: { alignItems: 'center', gap: 6, paddingTop: 12 },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted },
  amount: { fontFamily: fonts.extrabold, fontSize: 52, letterSpacing: -1.6, color: colors.ink, fontVariant: ['tabular-nums'] },
  balance: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  lowBlock: { alignItems: 'center', gap: 8 },
  lowPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.dangerBg, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  lowText: { fontFamily: fonts.bold, fontSize: 13, color: colors.dangerText },
  sendAll: { fontFamily: fonts.bold, fontSize: 14, color: colors.blue },
  noteBlock: { gap: 6 },
  noteLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
  noteBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.field, paddingHorizontal: 14 },
  noteInput: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.ink, paddingVertical: 12 },
  counter: { fontFamily: fonts.medium, fontSize: 12, color: '#7A86A6' },
});
