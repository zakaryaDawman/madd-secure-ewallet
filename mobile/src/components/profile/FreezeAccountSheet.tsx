import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { freezeMyAccount } from '../../api/me';
import { clearSession } from '../../auth/session';
import { SheetBackdrop } from '../devices/SheetBackdrop';
import { Icon } from '../icons';
import { MaddButton } from '../MaddButton';
import { PinBoxes } from '../PinBoxes';
import type { TextInputHandle } from '../TextField';
import { restartAt } from '../../utils/navigation';
import { colors, fonts, radius, spacing } from '../../theme';

const PIN_LENGTH = 6;
const POINTS = ['No one can send money from your wallet', 'Every device will be signed out', 'Only MADD support can unfreeze it'];

type Props = { pinLocked: boolean; onCancel: () => void };

/**
 * "Freeze your account?" (design 30). Asks for the PIN, or only for this confirmation while the PIN is locked.
 * The server checks everything; once frozen this phone shows "Your account is frozen" (design 14).
 */
export function FreezeAccountSheet({ pinLocked, onCancel }: Props) {
  const [pin, setPin] = useState('');
  const [locked, setLocked] = useState(pinLocked);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const input = useRef<TextInputHandle>(null);
  const insets = useSafeAreaInsets();

  /** Sends the freeze; on success logs out here and opens Frozen. If the PIN locks meanwhile, no PIN is needed any more. */
  async function onFreeze() {
    if (!locked && pin.length < PIN_LENGTH) {
      setError('Enter all 6 digits of your PIN');
      return;
    }
    setSending(true);
    const result = await freezeMyAccount(locked ? undefined : pin);
    setSending(false);
    setPin('');
    if (result.ok) {
      await clearSession();
      restartAt('/frozen');
    } else if (result.reason === 'pin_locked') {
      setLocked(true);
      setError('Your PIN is now locked. You can still freeze with this confirmation.');
    } else {
      setError(result.message);
    }
  }

  return (
    <>
      <SheetBackdrop onPress={onCancel} />
      <KeyboardAvoidingView behavior="padding" style={styles.holder}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.handle} />
          <View style={styles.icon}>
            <Icon name="snowflake" size={30} color={colors.danger} strokeWidth={2.4} />
          </View>
          <Text style={styles.title}>Freeze your account?</Text>
          <View style={styles.points}>
            {POINTS.map((point) => (
              <Text key={point} style={styles.point}>
                <Text style={styles.bullet}>•  </Text>
                {point}
              </Text>
            ))}
          </View>
          {!locked && (
            <Pressable accessibilityRole="button" accessibilityLabel="Enter your PIN" onPress={() => input.current?.focus()} style={styles.pinArea}>
              <Text style={styles.label}>Enter your PIN to confirm</Text>
              <PinBoxes length={pin.length} error={Boolean(error)} />
              <TextInput
                ref={input}
                value={pin}
                onChangeText={(text) => {
                  setError('');
                  setPin(text.replace(/\D/g, '').slice(0, PIN_LENGTH));
                }}
                keyboardType="number-pad"
                secureTextEntry
                autoFocus
                style={styles.hiddenInput}
              />
            </Pressable>
          )}
          <Text style={[styles.note, error ? styles.error : null]}>
            {error || 'If your PIN is locked, you can still freeze with this confirmation alone.'}
          </Text>
          <View style={styles.actions}>
            <MaddButton label="Freeze now" variant="dangerSolid" onPress={onFreeze} loading={sending} />
            <Pressable accessibilityRole="button" onPress={onCancel} hitSlop={8} style={styles.keep}>
              <Text style={styles.keepText}>Keep my account active</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  holder: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingHorizontal: spacing.xl, paddingTop: 12, gap: 14, alignItems: 'center' },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.line },
  icon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.dangerBg, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.extrabold, fontSize: 24, letterSpacing: -0.8, color: colors.ink },
  points: { alignSelf: 'stretch', backgroundColor: colors.background, borderRadius: radius.card, padding: 16, gap: 8 },
  point: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.ink },
  bullet: { color: colors.danger },
  pinArea: { alignItems: 'center', gap: 10 },
  label: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  note: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.muted, textAlign: 'center' },
  error: { fontFamily: fonts.semibold, color: colors.dangerText },
  actions: { alignSelf: 'stretch', gap: 4 },
  keep: { alignItems: 'center', paddingVertical: 12 },
  keepText: { fontFamily: fonts.bold, fontSize: 16, color: colors.blue },
});
