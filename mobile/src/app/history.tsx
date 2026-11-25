import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OfflineError } from '../api/client';
import { getTransactions, TransactionFilter } from '../api/transactions';
import type { RecentTransaction } from '../api/wallet';
import { DateGroupHeader } from '../components/history/DateGroupHeader';
import { FilterChips } from '../components/history/FilterChips';
import { TxRow } from '../components/history/TxRow';
import { MaddTabBar, Tab } from '../components/MaddTabBar';
import { OfflineView } from '../components/OfflineView';
import { groupByDay } from '../utils/dateGroups';
import { backToHome, openScreen } from '../utils/navigation';
import { useInboxDot } from '../utils/useInboxDot';
import { colors, fonts, spacing } from '../theme';

type LoadState = 'loading' | 'ready' | 'offline';

/** What to say when a filter has nothing to show. */
const EMPTY_TEXT: Record<TransactionFilter, string> = {
  all: 'No transactions yet. Your transfers will show up here.',
  in: 'No money received yet.',
  out: "You haven't sent any money yet.",
  held: 'Nothing is waiting for your OK.',
};

/** History screen (design 17): filter chips and the user's transactions grouped by day. Tap a row for its details; Export PDF opens the statement (G12). */
export default function HistoryScreen() {
  const [filter, setFilter] = useState<TransactionFilter>('all');
  const { items, state, refreshing, reload } = useTransactions(filter);
  const hasUnread = useInboxDot();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.body}>
        <View style={styles.head}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>History</Text>
            <Text style={styles.export} onPress={() => openScreen('/statement')} accessibilityRole="button">
              Export PDF
            </Text>
          </View>
          <FilterChips value={filter} onChange={setFilter} />
        </View>
        {state === 'offline' && <OfflineView onRetry={() => reload()} retrying={refreshing} />}
        {state === 'loading' && <ActivityIndicator style={styles.spinner} color={colors.blue} />}
        {state === 'ready' && (
          <ScrollView
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} colors={[colors.blue]} />}
          >
            {items.length === 0 && <Text style={styles.empty}>{EMPTY_TEXT[filter]}</Text>}
            {groupByDay(items).map((group) => (
              <View key={group.title}>
                <DateGroupHeader title={group.title} />
                {group.items.map((item) => (
                  <TxRow key={item.id} item={item} onPress={() => openTransaction(item)} />
                ))}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
      <MaddTabBar active="history" hasUnread={hasUnread} onSelect={onTabSelect} />
    </SafeAreaView>
  );
}

/** Tab bar taps from History: Home goes back to Home; Scan, Inbox and Profile open. */
function onTabSelect(tab: Tab) {
  if (tab === 'home') backToHome();
  if (tab === 'scan' || tab === 'inbox' || tab === 'profile') openScreen(`/${tab}`);
}

/** Loads the transactions for the chosen filter and tracks loading / ready / offline. `reload()` refreshes (pull-down or Try again). */
function useTransactions(filter: TransactionFilter) {
  const [items, setItems] = useState<RecentTransaction[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [refreshing, setRefreshing] = useState(false);

  /** Refreshes the list with the spinner showing. */
  const reload = useCallback(async () => {
    setRefreshing(true);
    try {
      setItems(await getTransactions(filter));
      setState('ready');
    } catch (err) {
      if (err instanceof OfflineError) setState('offline');
    }
    setRefreshing(false);
  }, [filter]);

  // Load again whenever the filter changes. `active` ignores a late reply for an old filter.
  useEffect(() => {
    let active = true;
    getTransactions(filter)
      .then((data) => {
        if (!active) return;
        setItems(data);
        setState('ready');
      })
      .catch((err) => {
        if (active && err instanceof OfflineError) setState('offline');
      });
    return () => {
      active = false;
    };
  }, [filter]);

  return { items, state, refreshing, reload };
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  body: { flex: 1 },
  head: { paddingHorizontal: 20, paddingTop: spacing.xxl, gap: 18 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  export: { fontFamily: fonts.bold, fontSize: 15, color: colors.blue },
  title: { fontFamily: fonts.extrabold, fontSize: 34, letterSpacing: -1.2, color: colors.ink },
  spinner: { marginTop: 48 },
  list: { paddingHorizontal: 20, paddingBottom: spacing.xl },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 48 },
});

/** Opens a transaction: my own held transfer goes to "Was this you?" (design 11), anything else to its details. */
function openTransaction(item: RecentTransaction) {
  const pathname = item.status === 'PENDING' && item.direction === 'out' ? '/held' : '/transaction';
  openScreen({ pathname, params: { id: String(item.id) } });
}
