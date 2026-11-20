import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PendingCard } from '../../api/notifications';
import { Icon } from '../icons';
import { formatRM } from '../../utils/money';
import { minutesAndSeconds, useCountdown } from '../../utils/useCountdown';
import { colors, fonts, radius } from '../../theme';

/** "Confirm your transfer" on Home (design 05): a held transfer waiting for my decision. Tap to open "Was this you?". */
export function HeldBanner({ card, onPress, onTimeUp }: { card: PendingCard; onPress: () => void; onTimeUp: () => void }) {
  const left = useCountdown(card.secondsLeft, onTimeUp);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.banner}>
      <View style={styles.icon}>
        <Icon name="clock" size={22} color={colors.white} strokeWidth={2.4} />
      </View>
      <View style={styles.texts}>
        <Text style={styles.title}>Confirm your transfer</Text>
        <Text style={styles.line}>
          {formatRM(card.amountSen)} to {card.otherName} · {minutesAndSeconds(left)} left
        </Text>
      </View>
      <Icon name="chevronRight" size={20} color={colors.warningText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radius.card, borderWidth: 1.5, borderColor: colors.warningBorder, backgroundColor: colors.warningSurface },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.warning, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.bold, fontSize: 16, color: colors.warningText },
  line: { fontFamily: fonts.regular, fontSize: 14, color: colors.warningText, fontVariant: ['tabular-nums'] },
});
