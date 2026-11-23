import type { ComponentRef, Ref } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from './icons';
import { MaddWordmark } from './MaddWordmark';
import { colors, fonts, radius } from '../theme';

/** What the shared picture shows. Names and phones come already masked; the balance is never included. */
export type ReceiptFacts = {
  direction: 'out' | 'in';
  amount: string; // e.g. "RM 800.00"
  otherName: string; // masked, e.g. "Ahm*** Ali"
  rows: { label: string; value: string }[]; // For, Date, Reference, phone…
};

/**
 * The receipt drawn only for "Share receipt" (task G6): MADD wordmark, tick, amount, who, and the facts card.
 * Rendered off-screen by the screen that shares it, then captured as a PNG, so it has no buttons or keyboard in it.
 */
export function ReceiptImage({ facts, ref }: { facts: ReceiptFacts; ref: Ref<ComponentRef<typeof View>> }) {
  const sent = facts.direction === 'out';
  return (
    <View ref={ref} collapsable={false} style={styles.offscreen}>
      <View style={styles.page}>
        <View style={styles.brand}>
          <MaddWordmark width={96} letterColor={colors.blue} waveColor={colors.sky} />
        </View>
        <View style={styles.tick}>
          <Icon name="check" size={36} color={colors.white} strokeWidth={2.6} />
        </View>
        <Text style={styles.title}>{sent ? 'Money sent' : 'Money received'}</Text>
        <Text style={styles.amount}>{facts.amount}</Text>
        <Text style={styles.who}>{sent ? `to ${facts.otherName}` : `from ${facts.otherName}`}</Text>
        <View style={styles.card}>
          {facts.rows.map((row, i) => (
            <View key={row.label} style={[styles.row, i < facts.rows.length - 1 && styles.rowLine]}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.footer}>Sent with MADD · Your money, watched over.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Far off the left edge: drawn (so it can be captured) but never seen.
  offscreen: { position: 'absolute', left: -10000, top: 0, width: 360 },
  page: { backgroundColor: colors.white, padding: 28, alignItems: 'center', gap: 12 },
  brand: { marginBottom: 8 },
  tick: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.ink },
  amount: { fontFamily: fonts.extrabold, fontSize: 36, letterSpacing: -1, color: colors.ink },
  who: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  card: { alignSelf: 'stretch', backgroundColor: colors.background, borderRadius: radius.card, paddingHorizontal: 16, paddingVertical: 4, marginTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, gap: 12 },
  rowLine: { borderBottomWidth: 1, borderBottomColor: colors.line },
  rowLabel: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  rowValue: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 13, color: colors.ink, textAlign: 'right' },
  footer: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted, marginTop: 8 },
});
