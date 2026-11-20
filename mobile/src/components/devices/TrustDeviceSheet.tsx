import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PendingDevice, trustDevice } from '../../api/devices';
import { Icon } from '../icons';
import { KeypadKey, MaddKeypad } from '../MaddKeypad';
import { PinBoxes } from '../PinBoxes';
import { SheetBackdrop } from './SheetBackdrop';
import { dayTitle, timeOfDay } from '../../utils/dateGroups';
import { replaceScreen } from '../../utils/navigation';
import { colors, fonts, radius, spacing } from '../../theme';

const PIN_LENGTH = 6;

type Props = { device: PendingDevice; onTrusted: () => void; onCancel: () => void };

/** "Trust this device?" with the PIN (design 45). The server checks the PIN and that this phone is trusted. */
export function TrustDeviceSheet({ device, onTrusted, onCancel }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const insets = useSafeAreaInsets();

  /** Adds or removes one PIN digit. */
  function onKey(key: KeypadKey) {
    if (key === '.' || sending) return;
    setError('');
    setPin((p) => (key === 'delete' ? p.slice(0, -1) : (p + key).slice(0, PIN_LENGTH)));
  }

  /** Sends the PIN; on success the device is trusted, after 5 wrong PINs the lock screen opens. */
  async function onConfirm() {
    if (sending) return;
    if (pin.length < PIN_LENGTH) {
      setError('Enter all 6 digits of your PIN');
      return;
    }
    setSending(true);
    const result = await trustDevice(device.deviceId, pin);
    setSending(false);
    setPin('');
    if (result.ok) onTrusted();
    else if (result.reason === 'pin_locked') replaceScreen('/pin-locked');
    else setError(result.message);
  }

  return (
    <>
      <SheetBackdrop onPress={onCancel} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 28 }]}>
        <View style={styles.handle} />
        <View style={styles.head}>
          <View style={styles.icon}>
            <Icon name="phone" size={26} color={colors.blue} />
          </View>
          <View style={styles.titles}>
            <Text style={styles.title} numberOfLines={2}>Trust {device.name}?</Text>
            <Text style={styles.when}>
              First seen {dayTitle(device.firstSeen).toLowerCase()}, {timeOfDay(device.firstSeen)}
            </Text>
          </View>
        </View>
        <View style={styles.note}>
          <Text style={styles.noteText}>This device will be able to send money without waiting for your other phone.</Text>
          <Text style={styles.noteWarning}>Only trust phones you own.</Text>
        </View>
        <Text style={styles.label}>Enter your PIN</Text>
        <PinBoxes length={pin.length} error={Boolean(error)} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <MaddKeypad mode="pin" onKey={onKey} onCancel={onCancel} onConfirm={onConfirm} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.white, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingHorizontal: spacing.xl, paddingTop: 12, gap: 14 },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.line },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  titles: { flex: 1 },
  title: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.ink },
  when: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  note: { backgroundColor: colors.background, borderRadius: radius.card, padding: 16, gap: 8 },
  noteText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.ink },
  noteWarning: { fontFamily: fonts.bold, fontSize: 14, color: colors.warningText },
  label: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink, textAlign: 'center' },
  error: { fontFamily: fonts.semibold, fontSize: 13, color: colors.dangerText, textAlign: 'center' },
});
