import { StyleSheet, Text } from 'react-native';
import { colors, fonts, radius } from '../../theme';

/** Label and colours for each transaction status. */
const BADGES: Record<string, { label: string; bg: string; fg: string }> = {
  COMPLETED: { label: 'Completed', bg: colors.successBg, fg: '#15803D' },
  PENDING: { label: 'Waiting for you', bg: colors.warningBg, fg: colors.warningText },
  CANCELLED: { label: 'Cancelled', bg: colors.dangerBg, fg: colors.dangerText },
  EXPIRED: { label: 'Expired', bg: colors.dangerBg, fg: colors.dangerText },
};

/** Coloured pill under the amount on Transfer details, e.g. a green "Completed". */
export function StatusBadge({ status }: { status: string }) {
  const badge = BADGES[status] ?? BADGES.COMPLETED;
  return <Text style={[styles.pill, { backgroundColor: badge.bg, color: badge.fg }]}>{badge.label}</Text>;
}

const styles = StyleSheet.create({
  pill: { alignSelf: 'center', overflow: 'hidden', paddingHorizontal: 14, paddingVertical: 5, borderRadius: radius.pill, fontFamily: fonts.bold, fontSize: 14 },
});
