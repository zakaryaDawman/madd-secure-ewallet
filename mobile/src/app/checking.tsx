import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { sendTransfer } from '../api/transfers';
import { getTransferDraft, updateTransferDraft } from '../auth/transferDraft';
import { Icon } from '../components/icons';
import { MaddButton } from '../components/MaddButton';
import { MaddWordmark } from '../components/MaddWordmark';
import { replaceScreen } from '../utils/navigation';
import { colors, fonts, spacing } from '../theme';

const MIN_SHOW_MS = 1200; // keep the checks on screen long enough to read
const TICKS_SHOW_MS = 600; // how long the green ticks stay before the receipt opens
const UNCONFIRMED_MESSAGE = "We couldn't confirm this transfer. Check History before trying again.";

type Step = 'sending' | 'failed';

/** "Sending your money safely" screen (design 09): sends the transfer, then opens the receipt or goes back with the reason. */
export default function CheckingScreen() {
  const [step, setStep] = useState<Step>('sending');
  const [passed, setPassed] = useState(false); // ticks turn green only after the server says yes
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    const started = Date.now();
    const { recipient, amountSen, note, pin } = getTransferDraft();
    updateTransferDraft({ pin: '' }); // the PIN is not kept on the phone after this point

    sendTransfer({ recipientPhone: recipient?.phone ?? '', amountSen, note, pin })
      .then(async (result) => {
        await wait(Math.max(0, MIN_SHOW_MS - (Date.now() - started)));
        if (!active) return;
        if (result.ok && 'heldId' in result) {
          replaceScreen({ pathname: '/held', params: { id: String(result.heldId), fromSend: '1' } });
        } else if (result.ok) {
          updateTransferDraft({ receipt: result.receipt });
          setPassed(true);
          await wait(TICKS_SHOW_MS);
          if (active) replaceScreen('/sent');
        } else if (result.reason === 'wrong_pin') {
          updateTransferDraft({ pinError: result.message });
          router.back();
        } else if (result.reason === 'pin_locked') {
          replaceScreen('/pin-locked');
        } else {
          setMessage(result.message);
          setStep('failed');
        }
      })
      .catch(() => {
        // Something unexpected (e.g. a server error): never leave the spinners turning forever.
        if (!active) return;
        setMessage(UNCONFIRMED_MESSAGE);
        setStep('failed');
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.center}>
        <View style={styles.ring}>
          <View style={styles.badge}>
            <MaddWordmark width={50} />
          </View>
        </View>
        <View style={styles.heading}>
          <Text style={styles.title}>{step === 'failed' ? 'Transfer not sent' : 'Sending your money safely'}</Text>
          {step === 'sending' && <Text style={styles.subtitle}>This takes a second.</Text>}
        </View>
        {step === 'sending' ? (
          <View style={styles.checks}>
            <CheckLine label="PIN confirmed" done={passed} />
            <CheckLine label="Recipient verified" done={passed} />
            <CheckLine label="Checking for unusual activity" done={passed} />
          </View>
        ) : (
          <Text style={styles.failed}>{message}</Text>
        )}
      </View>
      {step === 'failed' && <MaddButton label="Back" variant="secondary" onPress={() => router.back()} />}
    </SafeAreaView>
  );
}

/** One line in the checklist: a spinner until the server confirms, then a green tick. */
function CheckLine({ label, done }: { label: string; done: boolean }) {
  return (
    <View style={styles.checkRow}>
      {!done ? (
        <ActivityIndicator color={colors.blue} />
      ) : (
        <View style={styles.tick}>
          <Icon name="check" size={14} color={colors.white} strokeWidth={3} />
        </View>
      )}
      <Text style={styles.checkText}>{label}</Text>
    </View>
  );
}

/** Waits for the given number of milliseconds. */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, padding: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 32 },
  ring: { width: 132, height: 132, borderRadius: 66, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  badge: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  heading: { alignItems: 'center', gap: 8 },
  title: { fontFamily: fonts.extrabold, fontSize: 26, letterSpacing: -0.8, color: colors.ink, textAlign: 'center' },
  subtitle: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted, textAlign: 'center' },
  checks: { alignSelf: 'stretch', gap: 14 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tick: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  checkText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  failed: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.muted, textAlign: 'center' },
});
