import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../icons';
import { initials } from '../../utils/dates';
import { colors, fonts, radius } from '../../theme';

type Props = {
  fullName: string;
  hasUnread?: boolean;
  onAvatarPress: () => void;
  onBellPress: () => void;
};

/** Top row of Home (design 05): avatar with initials, green "Protection on" chip, bell with unread dot. */
export function HomeHeader({ fullName, hasUnread = false, onAvatarPress, onBellPress }: Props) {
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel="Profile" onPress={onAvatarPress} style={styles.avatar}>
        <Text style={styles.avatarText}>{initials(fullName)}</Text>
      </Pressable>
      <View style={styles.chip}>
        <Icon name="check" size={15} color="#15803D" strokeWidth={2.4} />
        <Text style={styles.chipText}>Protection on</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Inbox" onPress={onBellPress} style={styles.bell}>
        <Icon name="bell" size={22} />
        {hasUnread && <View style={styles.dot} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.successBg, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { fontFamily: fonts.bold, fontSize: 13, color: '#15803D' },
  bell: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 9, right: 10, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.danger, borderWidth: 2, borderColor: colors.background },
});
