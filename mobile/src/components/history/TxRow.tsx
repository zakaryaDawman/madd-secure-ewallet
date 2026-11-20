import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { RecentTransaction } from '../../api/wallet';
import { formatRM } from '../../utils/money';
import { timeOfDay } from '../../utils/dateGroups';
import { PersonAvatar } from '../PersonAvatar';
import { colors, fonts } from '../../theme';

type Line = { text: string; tone: 'normal' | 'warning' | 'danger' };

/** Second line under the name: "Waiting for you" when held, red when it never went through, otherwise "note · time". */
function secondLine(item: RecentTransaction): Line {
  if (item.status === 'PENDING') return { text: 'Waiting for you', tone: 'warning' };
  if (item.status === 'CANCELLED') return { text: 'Cancelled · not confirmed', tone: 'danger' };
  if (item.status === 'EXPIRED') return { text: 'Expired · not confirmed', tone: 'danger' };
  return { text: [item.note, timeOfDay(item.createdAt)].filter(Boolean).join(' · '), tone: 'normal' };
}

/** One History row (design 17): avatar, name, status or note, and the signed amount. Tapping opens the details. */
export function TxRow({ item, onPress }: { item: RecentTransaction; onPress: () => void }) {
  const line = secondLine(item);
  const failed = line.tone === 'danger';
  const isIn = item.direction === 'in';
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <PersonAvatar name={item.otherName} />
      <View style={styles.middle}>
        <Text style={styles.name} numberOfLines={1}>{item.otherName}</Text>
        <Text style={[styles.detail, styles[line.tone]]} numberOfLines={1}>{line.text}</Text>
      </View>
      <Text style={[styles.amount, isIn && styles.amountIn, failed && styles.amountFailed]}>
        {failed ? '' : isIn ? '+ ' : '− '}
        {formatRM(item.amountSen)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E3E9F5' },
  pressed: { opacity: 0.6 },
  middle: { flex: 1 },
  name: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  detail: { fontFamily: fonts.regular, fontSize: 13 },
  normal: { color: colors.muted },
  warning: { fontFamily: fonts.semibold, color: colors.warningText },
  danger: { fontFamily: fonts.semibold, color: colors.dangerText },
  amount: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink, fontVariant: ['tabular-nums'] },
  amountIn: { color: '#15803D' },
  amountFailed: { color: colors.muted, textDecorationLine: 'line-through' },
});
