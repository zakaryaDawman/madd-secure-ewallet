import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Recipient } from '../../api/recipients';
import { Icon } from '../icons';
import { PersonAvatar } from '../PersonAvatar';
import { colors, fonts, radius } from '../../theme';

/** Top of the Amount screen (design 07): back button, then who the money is going to. */
export function RecipientHeader({ recipient, onBack }: { recipient: Recipient; onBack: () => void }) {
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} hitSlop={8} style={styles.back}>
        <Icon name="back" size={20} strokeWidth={2.2} />
      </Pressable>
      <PersonAvatar name={recipient.maskedName.replace(/\*/g, '')} />
      <View>
        <Text style={styles.name}>{recipient.maskedName}</Text>
        <Text style={styles.phone}>{recipient.maskedPhone}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  phone: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
});
