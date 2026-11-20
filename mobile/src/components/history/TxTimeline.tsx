import { StyleSheet, Text, View } from 'react-native';
import type { TransactionDetail } from '../../api/transactions';
import { colors, fonts } from '../../theme';

type Step = { label: string; at: string; done: boolean };

/** Time with seconds, e.g. "8:05:02 PM". */
function exactTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
}

/** The steps this transfer went through, built from when it was created and when it completed. */
function stepsFor(tx: TransactionDetail): Step[] {
  const arrived = tx.direction === 'in' ? 'Money received' : 'Money arrived';
  if (tx.status === 'COMPLETED') {
    return [
      { label: 'Safety checks passed', at: tx.createdAt, done: true },
      { label: arrived, at: tx.completedAt ?? tx.createdAt, done: true },
    ];
  }
  if (tx.status === 'PENDING') return [{ label: 'Held for your OK', at: tx.createdAt, done: false }];
  return [{ label: tx.status === 'EXPIRED' ? 'Expired · no money moved' : 'Cancelled · no money moved', at: tx.createdAt, done: false }];
}

/** "TIMELINE" list on Transfer details (design 26): a dot, what happened and the exact time. */
export function TxTimeline({ tx }: { tx: TransactionDetail }) {
  return (
    <View style={styles.root}>
      <Text style={styles.heading}>TIMELINE</Text>
      {stepsFor(tx).map((step) => (
        <View key={step.label} style={styles.step}>
          <View style={[styles.dot, { backgroundColor: step.done ? colors.success : colors.warning }]} />
          <View>
            <Text style={styles.label}>{step.label}</Text>
            <Text style={styles.time}>{exactTime(step.at)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 14 },
  heading: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.2, color: colors.muted },
  step: { flexDirection: 'row', gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  label: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  time: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
});
