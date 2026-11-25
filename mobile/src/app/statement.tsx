import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getStatement, type StatementFilter } from '../api/statement';
import { MaddAppBar } from '../components/MaddAppBar';
import { MaddButton } from '../components/MaddButton';
import { TextField } from '../components/TextField';
import { ChoiceChips } from '../components/statement/ChoiceChips';
import { statementHtml } from '../utils/statementHtml';
import { savePdf, sharePdf } from '../utils/statementPdf';
import { parseDayMonthYear, presetRange, type RangeChoice } from '../utils/statementRange';
import { colors, fonts, spacing } from '../theme';

const RANGES: { value: RangeChoice; label: string }[] = [
  { value: 'thisMonth', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'last3Months', label: 'Last 3 months' },
  { value: 'custom', label: 'Custom' },
];

const FILTERS: { value: StatementFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'in', label: 'In' },
  { value: 'out', label: 'Out' },
];

type Action = 'share' | 'save';

/**
 * Statement (task G12, styled like History, design 17): pick a period and All / In / Out, then share the PDF
 * (WhatsApp, Gmail, Drive…) or save it to the phone. The server picks the rows; the phone only draws them.
 */
export default function StatementScreen() {
  const [range, setRange] = useState<RangeChoice>('thisMonth');
  const [filter, setFilter] = useState<StatementFilter>('all');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<Action | null>(null);
  const insets = useSafeAreaInsets();

  /** The chosen period as YYYY-MM-DD, or null (with a message) if a custom date is wrong. */
  function chosenDates(): { from: string; to: string } | null {
    if (range !== 'custom') return presetRange(range);
    const from = parseDayMonthYear(custom.from);
    const to = parseDayMonthYear(custom.to);
    if (!from || !to) {
      setError('Type the dates like 01/11/2026.');
      return null;
    }
    return { from, to };
  }

  /** Gets the rows from the server, builds the PDF and shares or saves it. */
  async function run(action: Action) {
    const dates = chosenDates();
    if (!dates) return;
    setError('');
    setBusy(action);
    const result = await getStatement(dates.from, dates.to, filter);
    if (!result.ok) setError(result.message);
    else if (action === 'share') await sharePdf(statementHtml(result.statement), `MADD-statement-${dates.from}-to-${dates.to}.pdf`);
    else await savePdf(statementHtml(result.statement));
    setBusy(null);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.bar}>
        <MaddAppBar title="Statement" onBack={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>Download your transactions as a PDF. Names and numbers are partly hidden, and your balance is not included.</Text>
        <Text style={styles.section}>PERIOD</Text>
        <ChoiceChips choices={RANGES} value={range} onChange={(value) => { setRange(value); setError(''); }} />
        {range === 'custom' && (
          <View style={styles.dates}>
            <TextField label="From" value={custom.from} onChangeText={(from) => setCustom((c) => ({ ...c, from }))} placeholder="01/11/2026" keyboardType="numbers-and-punctuation" />
            <TextField label="To" value={custom.to} onChangeText={(to) => setCustom((c) => ({ ...c, to }))} placeholder="30/11/2026" keyboardType="numbers-and-punctuation" />
          </View>
        )}
        <Text style={styles.section}>TRANSACTIONS</Text>
        <ChoiceChips choices={FILTERS} value={filter} onChange={setFilter} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.xl }]}>
        <MaddButton label="Share PDF" onPress={() => run('share')} loading={busy === 'share'} disabled={busy !== null} />
        <MaddButton label="Save to phone" variant="secondary" onPress={() => run('save')} loading={busy === 'save'} disabled={busy !== null} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  bar: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xl, gap: 16 },
  intro: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.muted },
  section: { marginTop: 8, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.5, color: colors.muted },
  dates: { gap: 12 },
  error: { fontFamily: fonts.semibold, fontSize: 14, color: colors.dangerText, backgroundColor: colors.dangerBg, borderRadius: 12, padding: 12 },
  actions: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: 10 },
});
