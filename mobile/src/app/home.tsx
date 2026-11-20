import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getWallet, WalletSummary } from '../api/wallet';
import { OfflineError } from '../api/client';
import { clearSession } from '../auth/session';
import { ActivityList } from '../components/home/ActivityList';
import { BalanceBlock } from '../components/home/BalanceBlock';
import { HomeHeader } from '../components/home/HomeHeader';
import { HomeSkeleton } from '../components/home/HomeSkeleton';
import { QuickActions } from '../components/home/QuickActions';
import { WelcomeCard } from '../components/home/WelcomeCard';
import { MaddTabBar } from '../components/MaddTabBar';
import { OfflineView } from '../components/OfflineView';
import { openScreen, replaceScreen } from '../utils/navigation';
import { colors, fonts, spacing } from '../theme';

type LoadState = 'loading' | 'ready' | 'offline';

/** Home screen (design 05): balance, Send/Receive/Scan, recent activity and the tab bar. Shows designs 39/40/46 for new, loading and offline. */
export default function HomeScreen() {
  const { wallet, state, refreshing, reload } = useWallet();
  const [hidden, setHidden] = useState(false);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.body}>
        {state === 'offline' && <OfflineView onRetry={() => reload()} retrying={refreshing} />}
        {state === 'loading' && (
          <View style={styles.content}>
            <HomeSkeleton />
          </View>
        )}
        {state === 'ready' && wallet && (
          <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} colors={[colors.blue]} />}
          >
            <HomeHeader fullName={wallet.fullName} onAvatarPress={confirmLogout} onBellPress={() => {}} />
            <BalanceBlock balanceSen={wallet.balanceSen} hidden={hidden} onToggleHidden={() => setHidden((h) => !h)} />
            {/* Receive and Scan open their screens in task B8. */}
            <QuickActions onPress={(action) => action === 'send' && openScreen('/recipient')} />
            {wallet.recent.length === 0 && <WelcomeCard />}
            <Text style={styles.sectionTitle}>Recent activity</Text>
            <ActivityList items={wallet.recent} onSendPress={() => openScreen('/recipient')} />
          </ScrollView>
        )}
      </View>
      {/* Other tabs open their screens in later tasks (Scan B8, Profile C2, Inbox D6). */}
      <MaddTabBar active="home" onSelect={(tab) => tab === 'history' && openScreen('/history')} />
    </SafeAreaView>
  );
}

/** Loads the wallet from the server and tracks loading / ready / offline. `reload()` refreshes it (pull-down or Try again). */
function useWallet() {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [refreshing, setRefreshing] = useState(false);

  /** Asks the server for the wallet and shows it, or the offline view if the server can't be reached. */
  const fetchWallet = useCallback(async () => {
    try {
      const data = await getWallet();
      setWallet(data);
      setState('ready');
    } catch (err) {
      if (err instanceof OfflineError) setState('offline');
    }
  }, []);

  /** Refreshes with the spinner showing (pull-down or Try again). */
  const reload = useCallback(async () => {
    setRefreshing(true);
    await fetchWallet();
    setRefreshing(false);
  }, [fetchWallet]);

  // First load when Home opens. `active` ignores a late reply if the user already left the screen.
  useEffect(() => {
    let active = true;
    getWallet()
      .then((data) => {
        if (!active) return;
        setWallet(data);
        setState('ready');
      })
      .catch((err) => {
        if (active && err instanceof OfflineError) setState('offline');
      });
    return () => {
      active = false;
    };
  }, []);

  return { wallet, state, refreshing, reload };
}

/** Temporary way to log out (until the Profile screen in task C2): asks first, then clears the session. */
function confirmLogout() {
  Alert.alert('Log out?', 'You will need your password to log in again.', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Log out',
      style: 'destructive',
      onPress: async () => {
        await clearSession();
        replaceScreen('/');
      },
    },
  ]);
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  body: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: spacing.md, paddingBottom: spacing.xl, gap: 22 },
  sectionTitle: { fontFamily: fonts.extrabold, fontSize: 20, letterSpacing: -0.4, color: colors.ink, marginBottom: -10 },
});
