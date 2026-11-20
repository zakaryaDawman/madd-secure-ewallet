import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Recipient } from '../../api/recipients';
import { Icon } from '../icons';
import { PersonAvatar } from '../PersonAvatar';
import { colors, fonts } from '../../theme';

/** One "MADD users" row (design 06): initials, masked name and masked phone, and a chevron. */
export function RecipientRow({ recipient, onPress }: { recipient: Recipient; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Send to ${recipient.maskedName}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <PersonAvatar name={recipient.maskedName.replace(/\*/g, '')} />
      <View style={styles.middle}>
        <Text style={styles.name}>{recipient.maskedName}</Text>
        <Text style={styles.phone}>{recipient.maskedPhone}</Text>
      </View>
      <Icon name="chevronRight" size={18} color="#7A86A6" strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEF2FA' },
  pressed: { opacity: 0.6 },
  middle: { flex: 1 },
  name: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  phone: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
});
