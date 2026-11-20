import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getRecentRecipients, lookupRecipient, Recipient, RecentRecipient } from '../api/recipients';
import { startTransfer } from '../auth/transferDraft';
import { Icon } from '../components/icons';
import { openScreen } from '../utils/navigation';
import { RecentRecipients } from '../components/send/RecentRecipients';
import { RecipientRow } from '../components/send/RecipientRow';
import { colors, fonts, radius, spacing } from '../theme';

const SEARCH_DELAY_MS = 400;

/** Choose recipient screen (design 06): type a phone number, see the masked MADD user, or pick someone recent. Errors from design 34. */
export default function RecipientScreen() {
  const [phone, setPhone] = useState('');
  const { result, error, searching } = usePhoneLookup(phone);
  const recent = useRecentRecipients();

  /** Starts a new transfer to the chosen person and opens the Amount screen. */
  function choose(recipient: Recipient) {
    startTransfer(recipient);
    openScreen('/amount');
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} style={styles.close} hitSlop={8}>
            <Icon name="close" size={20} strokeWidth={2.2} />
          </Pressable>
          {/* Scan opens the camera in task B8. */}
          <Pressable accessibilityRole="button" style={styles.scanPill}>
            <Icon name="scan" size={18} color={colors.blueDark} strokeWidth={2.2} />
            <Text style={styles.scanText}>Scan QR</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>Who are you sending to?</Text>

        <View style={styles.searchBlock}>
          <View style={[styles.search, { borderColor: error ? colors.danger : colors.blue }]}>
            <Icon name="search" size={20} color={colors.muted} />
            <TextInput
              accessibilityLabel="Phone number"
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number, e.g. 012 345 6789"
              placeholderTextColor="#9AA6C2"
              keyboardType="phone-pad"
              autoFocus
              style={styles.input}
            />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        {recent.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Recent</Text>
            <RecentRecipients people={recent} onPick={choose} />
          </View>
        )}

        {(result || searching) && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>MADD users</Text>
            {searching && !result ? <Text style={styles.searching}>Searching…</Text> : null}
            {result ? <RecipientRow recipient={result} onPress={() => choose(result)} /> : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Looks up the typed number once it is long enough, waiting briefly after the last key so we don't search on every digit. */
function usePhoneLookup(phone: string) {
  const [result, setResult] = useState<Recipient | null>(null);
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);
  const digits = phone.replace(/\D/g, '');
  const ready = digits.length >= 10;

  useEffect(() => {
    if (!ready) return;
    let active = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      const found = await lookupRecipient(phone);
      if (!active) return;
      setSearching(false);
      if (found.ok) {
        setResult(found.recipient);
        setError('');
      } else {
        setResult(null);
        setError(found.message);
      }
    }, SEARCH_DELAY_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [phone, ready]);

  // While the number is still too short, nothing is shown.
  return ready ? { result, error, searching } : { result: null, error: '', searching: false };
}

/** Loads the people the user paid recently, once. */
function useRecentRecipients(): RecentRecipient[] {
  const [recent, setRecent] = useState<RecentRecipient[]>([]);
  useEffect(() => {
    let active = true;
    getRecentRecipients().then((list) => active && setRecent(list));
    return () => {
      active = false;
    };
  }, []);
  return recent;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: 22 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  scanPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.tint, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 10 },
  scanText: { fontFamily: fonts.bold, fontSize: 14, color: colors.blueDark },
  title: { fontFamily: fonts.extrabold, fontSize: 30, letterSpacing: -1, color: colors.ink },
  searchBlock: { gap: 8 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: radius.field, paddingHorizontal: 16 },
  input: { flex: 1, fontFamily: fonts.medium, fontSize: 16, color: colors.ink, paddingVertical: 15 },
  error: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 19, color: colors.dangerText },
  section: { gap: 10 },
  sectionLabel: { fontFamily: fonts.bold, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: colors.muted },
  searching: { fontFamily: fonts.medium, fontSize: 14, color: colors.muted, paddingVertical: 12 },
});
