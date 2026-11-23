import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { RecentTransaction } from '../../api/wallet';
import { Icon } from '../icons';
import { AmountText } from '../AmountText';
import { shortDate } from '../../utils/dates';
import { PersonAvatar } from '../PersonAvatar';
import { colors, fonts } from '../../theme';

/** "Recent activity" rows (design 05), or the "No activity yet" message for a new user (design 39). */
export function ActivityList({ items, onSendPress }: { items: RecentTransaction[]; onSendPress: () => void }) {
  if (items.length === 0) return <EmptyActivity onSendPress={onSendPress} />;
  return (
    <View>
      {items.map((t) => (
        <ActivityRow key={t.id} item={t} />
      ))}
    </View>
  );
}

/** One compact person row (task G7): coloured initials, name, note and date, and the signed amount (green in, red out). */
function ActivityRow({ item }: { item: RecentTransaction }) {
  const detail = [item.note, shortDate(item.createdAt)].filter(Boolean).join(' · ');
  return (
    <View style={styles.row}>
      <PersonAvatar name={item.otherName} size={36} />
      <View style={styles.middle}>
        <Text style={styles.name} numberOfLines={1}>{item.otherName}</Text>
        <Text style={styles.detail} numberOfLines={1}>{detail}</Text>
      </View>
      <AmountText item={item} size={14} />
    </View>
  );
}

/** Message shown when the user hasn't sent or received anything yet (design 39), with a "Send money" link. */
function EmptyActivity({ onSendPress }: { onSendPress: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name="history" size={32} color="#9AA6C2" />
      </View>
      <Text style={styles.emptyTitle}>No activity yet</Text>
      <Text style={styles.emptyText}>Your transfers will show up here. Send your first one to a friend.</Text>
      <Pressable accessibilityRole="link" onPress={onSendPress} hitSlop={8}>
        <Text style={styles.emptyLink}>Send money</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  middle: { flex: 1 },
  name: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  detail: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 24, paddingHorizontal: 16 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  emptyLink: { fontFamily: fonts.bold, fontSize: 15, color: colors.blue, padding: 6 },
  emptyText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.muted, textAlign: 'center', maxWidth: 260 },
});
