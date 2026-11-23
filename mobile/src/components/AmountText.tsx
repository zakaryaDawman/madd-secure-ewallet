import { StyleSheet, Text } from 'react-native';
import type { RecentTransaction } from '../api/wallet';
import { formatRM } from '../utils/money';
import { colors, fonts } from '../theme';

/**
 * A transfer's signed amount, coloured the same on Home and History (task G7): money in "+ RM" green,
 * money out "− RM" red, a held transfer stays ink, and one that never went through is grey and struck out.
 */
export function AmountText({ item, size = 15 }: { item: RecentTransaction; size?: number }) {
  const failed = item.status === 'CANCELLED' || item.status === 'EXPIRED';
  const held = item.status === 'PENDING';
  const isIn = item.direction === 'in';
  const tone = failed ? styles.failed : held ? null : isIn ? styles.moneyIn : styles.moneyOut;
  return (
    <Text style={[styles.amount, { fontSize: size }, tone]}>
      {failed ? '' : isIn ? '+ ' : '− '}
      {formatRM(item.amountSen)}
    </Text>
  );
}

const styles = StyleSheet.create({
  amount: { fontFamily: fonts.bold, color: colors.ink, fontVariant: ['tabular-nums'], flexShrink: 0 },
  moneyIn: { color: colors.moneyIn },
  moneyOut: { color: colors.dangerText },
  failed: { color: colors.muted, textDecorationLine: 'line-through' },
});
