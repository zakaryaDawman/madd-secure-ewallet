import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../theme';

const COOLDOWN_SECONDS = 60;

type Props = { onResend: () => Promise<{ ok: boolean; message?: string; secondsLeft?: number }> };

/** "Resend code" link: greyed out with a countdown for 60 seconds after each email (the server enforces the same wait). */
export function ResendCodeButton({ onResend }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(COOLDOWN_SECONDS);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  /** Asks for a new code and restarts the countdown (or shows why the server said no). */
  async function onPress() {
    if (secondsLeft > 0) return;
    setSecondsLeft(COOLDOWN_SECONDS);
    const result = await onResend();
    setNote(result.ok ? 'New code sent. Check your email.' : (result.message ?? ''));
    if (!result.ok) setSecondsLeft(result.secondsLeft ?? 0);
  }

  const waiting = secondsLeft > 0;
  return (
    <Pressable onPress={onPress} disabled={waiting} accessibilityRole="button" hitSlop={8}>
      <Text style={[styles.link, waiting && styles.waiting]}>{waiting ? `Resend code in ${secondsLeft}s` : 'Resend code'}</Text>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: { fontFamily: fonts.bold, fontSize: 14, color: colors.blue, textAlign: 'center' },
  waiting: { color: colors.muted },
  note: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 4 },
});
