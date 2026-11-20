import { StyleSheet, Text, View } from 'react-native';
import type { PendingCard } from '../../api/notifications';
import { Icon } from '../icons';
import { MaddButton } from '../MaddButton';
import { minutesAndSeconds, useCountdown } from '../../utils/useCountdown';
import { formatRM } from '../../utils/money';
import { colors, fonts, radius } from '../../theme';

type Props = { card: PendingCard; busy: boolean; onYes: () => void; onNo: () => void; onTimeUp: () => void };

/**
 * "Transfer waiting for you" at the top of Security (design 18): amount, who, the server's reason, time left,
 * and Yes / No on a trusted phone. A new phone only sees that it must wait for the usual phone.
 */
export function PendingTransferCard({ card, busy, onYes, onNo, onTimeUp }: Props) {
  const left = useCountdown(card.secondsLeft, onTimeUp);
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.icon}>
          <Icon name="clock" size={24} color={colors.warning} strokeWidth={2.4} />
        </View>
        <View style={styles.texts}>
          <Text style={styles.title}>Transfer waiting for you</Text>
          <Text style={styles.body}>
            {formatRM(card.amountSen)} to {card.otherName}. {card.reasons.join(' ')}
          </Text>
          <Text style={styles.time}>{minutesAndSeconds(left)} left</Text>
        </View>
      </View>
      {card.canDecide && (
        <View style={styles.buttons}>
          <View style={styles.button}>
            <MaddButton label="Yes, it was me" onPress={onYes} disabled={busy} />
          </View>
          <View style={styles.button}>
            <MaddButton label="No, freeze" variant="danger" onPress={onNo} disabled={busy} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.card, borderWidth: 1.5, borderColor: colors.warningBorder, padding: 18, gap: 16 },
  top: { flexDirection: 'row', gap: 14 },
  icon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.warningBg, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1, gap: 4 },
  title: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.ink },
  time: { fontFamily: fonts.bold, fontSize: 14, color: colors.warningText, fontVariant: ['tabular-nums'] },
  buttons: { flexDirection: 'row', gap: 12 },
  button: { flex: 1 },
});
