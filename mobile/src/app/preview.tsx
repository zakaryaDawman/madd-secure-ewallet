// TEMPORARY (task A4): shows every shared component so they can be checked on the phone. Removed in task B2.
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaddAppBar } from '../components/MaddAppBar';
import { MaddButton } from '../components/MaddButton';
import { KeypadKey, MaddKeypad } from '../components/MaddKeypad';
import { MaddTabBar, Tab } from '../components/MaddTabBar';
import { colors, fonts, spacing } from '../theme';

/** Preview of MaddButton, MaddAppBar, MaddKeypad and MaddTabBar with working interactions. */
export default function ComponentsPreview() {
  const [pin, setPin] = useState('');
  const [amount, setAmount] = useState('');
  const [tab, setTab] = useState<Tab>('home');

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <MaddAppBar title="Components preview" onBack={() => router.back()} />

        <Section title="MaddButton">
          <MaddButton label="Primary" />
          <MaddButton label="Secondary" variant="secondary" />
          <MaddButton label="Danger" variant="danger" />
          <MaddButton label="Dark" variant="dark" />
          <MaddButton label="Disabled" disabled />
          <MaddButton label="Loading" loading />
        </Section>

        <Section title="MaddAppBar">
          <MaddAppBar title="Transfer details" onBack={() => {}} />
          <MaddAppBar title="Send money" icon="close" onBack={() => {}} />
        </Section>

        <Section title={`MaddKeypad · PIN: ${'●'.repeat(pin.length) || '(empty)'}`}>
          <MaddKeypad mode="pin" onKey={(k) => setPin((v) => applyKey(v, k, 6))} onCancel={() => setPin('')} />
        </Section>

        <Section title={`MaddKeypad · amount: RM ${amount || '0'}`}>
          <MaddKeypad mode="amount" onKey={(k) => setAmount((v) => applyKey(v, k, 8))} />
        </Section>

        <Section title={`MaddTabBar · selected: ${tab}`}>
          <View style={styles.tabFrame}>
            <MaddTabBar active={tab} onSelect={setTab} hasUnread />
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Adds a key press to the typed value: digits and '.' append (up to maxLength), 'delete' removes the last character. */
function applyKey(value: string, key: KeypadKey, maxLength: number): string {
  if (key === 'delete') return value.slice(0, -1);
  if (key === '.' && value.includes('.')) return value;
  return value.length < maxLength ? value + key : value;
}

/** A titled block in the preview list. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  content: { padding: spacing.xl, gap: spacing.xxl, paddingBottom: 60 },
  section: { gap: spacing.md },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.muted, letterSpacing: 0.6, textTransform: 'uppercase' },
  tabFrame: { marginHorizontal: -spacing.xl, paddingTop: 30, backgroundColor: colors.background },
});
