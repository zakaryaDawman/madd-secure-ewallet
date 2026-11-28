import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from './icons';
import { colors, fonts } from '../theme';

export type Tab = 'home' | 'history' | 'scan' | 'inbox' | 'profile';

type Props = {
  active: Tab;
  onSelect: (tab: Tab) => void;
  hasUnread?: boolean;
};

const SIDE_TABS: { tab: Tab; label: string; icon: IconName }[] = [
  { tab: 'home', label: 'Home', icon: 'home' },
  { tab: 'history', label: 'History', icon: 'receipt' },
];
const RIGHT_TABS: { tab: Tab; label: string; icon: IconName }[] = [
  { tab: 'inbox', label: 'Inbox', icon: 'bell' },
  { tab: 'profile', label: 'Profile', icon: 'user' },
];

/** Bottom navigation (option 7, chosen 28 Nov 2026): Home, History, a round Scan button rising out of the bar, Inbox (with unread dot), Profile. */
export function MaddTabBar({ active, onSelect, hasUnread = false }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {SIDE_TABS.map((t) => (
        <TabItem key={t.tab} {...t} selected={active === t.tab} onPress={() => onSelect(t.tab)} />
      ))}
      <ScanButton onPress={() => onSelect('scan')} />
      {RIGHT_TABS.map((t) => (
        <TabItem
          key={t.tab}
          {...t}
          selected={active === t.tab}
          showDot={t.tab === 'inbox' && hasUnread}
          onPress={() => onSelect(t.tab)}
        />
      ))}
    </View>
  );
}

type ItemProps = { label: string; icon: IconName; selected: boolean; showDot?: boolean; onPress: () => void };

/** One normal tab: icon + label, blue when selected. */
function TabItem({ label, icon, selected, showDot = false, onPress }: ItemProps) {
  const tint = selected ? colors.blue : colors.muted;
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected }} onPress={onPress} style={styles.item}>
      <View>
        <Icon name={icon} size={24} color={tint} />
        {showDot && <View style={styles.dot} />}
      </View>
      <Text style={[styles.label, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

/** The round blue Scan button that rises out of the middle of the bar, with a white ring so it looks cut out. */
function ScanButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Scan" onPress={onPress} style={styles.item}>
      <View style={styles.scan}>
        <Icon name="scan" size={26} color={colors.white} />
      </View>
      <Text style={[styles.label, { color: colors.ink }]}>Scan</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  item: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontFamily: fonts.bold, fontSize: 11 },
  dot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.white,
  },
  scan: {
    width: 64,
    height: 64,
    marginTop: -36,
    borderRadius: 32,
    borderWidth: 5,
    borderColor: colors.white,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: colors.blue,
  },
});
