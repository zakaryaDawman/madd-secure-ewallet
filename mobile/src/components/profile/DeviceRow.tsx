import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MyDevice } from '../../api/me';
import { Icon } from '../icons';
import { timeOfDay, dayTitle } from '../../utils/dateGroups';
import { colors, fonts, radius } from '../../theme';

/** Second line under a device name: "This phone · since 16 Nov" or "Last seen today, 9:46 PM". */
function deviceDetail(device: MyDevice): string {
  if (device.thisDevice) {
    const since = new Date(device.firstSeen).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    return `This phone · since ${since}`;
  }
  return `Last seen ${dayTitle(device.lastSeen).toLowerCase()}, ${timeOfDay(device.lastSeen)}`;
}

/** One row in My devices (design 19): phone icon, name, detail line, and a green "Trusted" badge or a "Trust" button. */
export function DeviceRow({ device, onTrust }: { device: MyDevice; onTrust?: () => void }) {
  return (
    <View style={styles.row}>
      <Icon name="phone" size={26} color={device.thisDevice ? colors.blue : colors.muted} />
      <View style={styles.middle}>
        <Text style={styles.name} numberOfLines={2}>{device.name}</Text>
        <Text style={styles.detail}>{deviceDetail(device)}</Text>
      </View>
      {device.trusted && <Text style={styles.trusted}>Trusted</Text>}
      {onTrust && (
        <Pressable accessibilityRole="button" onPress={onTrust} hitSlop={8} style={styles.trustButton}>
          <Text style={styles.trustText}>Trust</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  middle: { flex: 1 },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  detail: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  trustButton: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.tint },
  trustText: { fontFamily: fonts.bold, fontSize: 14, color: colors.blueDark },
  trusted: { overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.successBg, color: '#15803D', fontFamily: fonts.bold, fontSize: 14 },
});
