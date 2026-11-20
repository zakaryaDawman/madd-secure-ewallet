import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { InboxItem } from '../../api/notifications';
import { Icon, IconName } from '../icons';
import { PersonAvatar } from '../PersonAvatar';
import { dayTitle, timeOfDay } from '../../utils/dateGroups';
import { formatRM } from '../../utils/money';
import { colors, fonts, radius } from '../../theme';

/** Icon and colours for each kind of Inbox item (money items show the other person's initials instead). */
const LOOK: Record<string, { icon: IconName; color: string; bg: string }> = {
  TRANSFER_HELD: { icon: 'clock', color: colors.warning, bg: colors.warningBg },
  HOLD_CONFIRMED: { icon: 'check', color: colors.success, bg: colors.successBg },
  NEW_DEVICE: { icon: 'phone', color: colors.blue, bg: colors.tint },
  LOGIN_LOCKED: { icon: 'lock', color: colors.danger, bg: colors.dangerBg },
  PIN_LOCKED: { icon: 'lock', color: colors.danger, bg: colors.dangerBg },
  WELCOME: { icon: 'arrowUp', color: colors.blue, bg: colors.tint },
};

/**
 * One Inbox card (designs 18 and 32): icon or initials, title, the server's line and when. Money items show the day
 * on the same line and the amount on the right, as in design 32.
 */
export function InboxRow({ item, onFreeze }: { item: InboxItem; onFreeze: () => void }) {
  const look = LOOK[item.kind];
  const isMoney = item.amountSen !== null;
  const received = item.kind === 'MONEY_RECEIVED';
  return (
    <View style={styles.card}>
      {isMoney ? (
        <PersonAvatar name={item.otherName ?? '?'} size={52} />
      ) : (
        <View style={[styles.icon, { backgroundColor: look.bg }]}>
          <Icon name={look.icon} size={24} color={look.color} strokeWidth={2.4} />
        </View>
      )}
      <View style={styles.middle}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={[styles.body, isMoney && styles.moneyBody]}>{isMoney ? `${item.body} · ${dayTitle(item.createdAt)}` : item.body}</Text>
        {item.canFreeze && (
          <Pressable accessibilityRole="button" onPress={onFreeze} hitSlop={8}>
            <Text style={styles.freeze}>Freeze my account</Text>
          </Pressable>
        )}
        {!isMoney && (
          <Text style={styles.when}>
            {dayTitle(item.createdAt)}, {timeOfDay(item.createdAt)}
          </Text>
        )}
      </View>
      {isMoney && (
        <Text style={[styles.amount, received && styles.received]}>
          {received ? '+' : '–'} {formatRM(item.amountSen ?? 0)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: colors.white, borderRadius: radius.card, padding: 18 },
  icon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  middle: { flex: 1, gap: 3 },
  title: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.ink },
  moneyBody: { color: colors.muted },
  freeze: { fontFamily: fonts.bold, fontSize: 15, color: colors.dangerText, marginTop: 2 },
  when: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  amount: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.ink, fontVariant: ['tabular-nums'] },
  received: { color: colors.success },
});
