import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Recipient } from '../../api/recipients';
import { Icon } from '../icons';
import { colors, fonts, radius } from '../../theme';

type Props = { recipient: Recipient; onPay: () => void; onCancel: () => void };

/**
 * Shown when the camera finds a MADD code (Scan, option 5): who it belongs to (masked, from the server) and a Pay
 * button, so the owner checks the person before the Amount screen opens. ✕ goes back to scanning.
 */
export function FoundCard({ recipient, onPay, onCancel }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.tick}>
        <Icon name="check" size={22} color={colors.moneyIn} strokeWidth={2.6} />
      </View>
      <View style={styles.who}>
        <Text style={styles.name} numberOfLines={1}>
          {recipient.maskedName}
        </Text>
        <Text style={styles.phone}>{recipient.maskedPhone}</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={onPay} style={styles.pay}>
        <Text style={styles.payText}>Pay</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Scan again" onPress={onCancel} hitSlop={10} style={styles.cancel}>
        <Icon name="close" size={16} color={colors.muted} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 22, padding: 14 },
  tick: { width: 46, height: 46, borderRadius: radius.pill, backgroundColor: colors.successBg, alignItems: 'center', justifyContent: 'center' },
  who: { flex: 1 },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  phone: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  pay: { backgroundColor: colors.blue, borderRadius: radius.pill, paddingHorizontal: 20, paddingVertical: 10 },
  payText: { fontFamily: fonts.bold, fontSize: 14, color: colors.white },
  cancel: { padding: 4 },
});
