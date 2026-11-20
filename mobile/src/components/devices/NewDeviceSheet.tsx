import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PendingDevice } from '../../api/devices';
import { HoldFactsCard } from '../hold/HoldFactsCard';
import { Icon } from '../icons';
import { MaddButton } from '../MaddButton';
import { SheetBackdrop } from './SheetBackdrop';
import { dayTitle, timeOfDay } from '../../utils/dateGroups';
import { colors, fonts, radius, spacing } from '../../theme';

type Props = {
  device: PendingDevice;
  freezing: boolean;
  error: string;
  onTrust: () => void;
  onFreeze: () => void;
  onClose: () => void;
};

/** "New device signed in" sheet on the trusted phone (design 13): which phone, its transfers are on hold, Trust or Freeze. */
export function NewDeviceSheet({ device, freezing, error, onTrust, onFreeze, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <>
      <SheetBackdrop onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.head}>
          <View style={styles.icon}>
            <Icon name="phone" size={26} color={colors.blue} />
          </View>
          <View style={styles.titles}>
            <Text style={styles.title}>New device signed in</Text>
            <Text style={styles.when}>
              {dayTitle(device.lastSeen)}, {timeOfDay(device.lastSeen)}
            </Text>
          </View>
        </View>
        <HoldFactsCard
          facts={[
            { label: 'Device', value: device.name },
            { label: 'Transfers from it', value: 'On hold', tone: 'warning' },
          ]}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <MaddButton label="Yes, trust this device" onPress={onTrust} disabled={freezing} />
        <MaddButton label="No, freeze my account" variant="danger" onPress={onFreeze} loading={freezing} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.white, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  titles: { flex: 1 },
  title: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.ink },
  when: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  error: { fontFamily: fonts.semibold, fontSize: 13, color: colors.dangerText, textAlign: 'center' },
});
