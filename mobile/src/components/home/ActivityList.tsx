import { StyleSheet, Text, View } from 'react-native';
import type { RecentTransaction } from '../../api/wallet';
import { Icon } from '../icons';
import { formatRM } from '../../utils/money';
import { initials, shortDate } from '../../utils/dates';
import { colors, fonts, radius } from '../../theme';

/** Avatar colour pairs used for people in lists, picked by name so each person keeps the same colour. */
const AVATAR_COLORS = [
  { bg: colors.tint, fg: colors.blueDark },
  { bg: colors.successBg, fg: '#15803D' },
  { bg: '#F1E6FF', fg: '#6B21A8' },
  { bg: colors.warningBg, fg: colors.warningText },
];

/** "Recent activity" rows (design 05), or the "No activity yet" message for a new user (design 39). */
export function ActivityList({ items }: { items: RecentTransaction[] }) {
  if (items.length === 0) return <EmptyActivity />;
  return (
    <View>
      {items.map((t) => (
        <ActivityRow key={t.id} item={t} />
      ))}
    </View>
  );
}

/** One person row: coloured initials, name, note and date, and the signed amount (green for money in). */
function ActivityRow({ item }: { item: RecentTransaction }) {
  const color = AVATAR_COLORS[item.otherName.length % AVATAR_COLORS.length];
  const isIn = item.direction === 'in';
  const detail = [item.note, shortDate(item.createdAt)].filter(Boolean).join(' · ');
  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: color.bg }]}>
        <Text style={[styles.avatarText, { color: color.fg }]}>{initials(item.otherName)}</Text>
      </View>
      <View style={styles.middle}>
        <Text style={styles.name} numberOfLines={1}>{item.otherName}</Text>
        <Text style={styles.detail} numberOfLines={1}>{detail}</Text>
      </View>
      <Text style={[styles.amount, isIn && { color: '#15803D' }]}>
        {isIn ? '+ ' : '− '}
        {formatRM(item.amountSen)}
      </Text>
    </View>
  );
}

/** Message shown when the user hasn't sent or received anything yet (design 39). */
function EmptyActivity() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name="history" size={32} color="#9AA6C2" />
      </View>
      <Text style={styles.emptyTitle}>No activity yet</Text>
      <Text style={styles.emptyText}>Your transfers will show up here. Send your first one to a friend.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  avatar: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bold, fontSize: 14 },
  middle: { flex: 1 },
  name: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  detail: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  amount: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink, fontVariant: ['tabular-nums'] },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 24, paddingHorizontal: 16 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  emptyText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.muted, textAlign: 'center', maxWidth: 260 },
});
