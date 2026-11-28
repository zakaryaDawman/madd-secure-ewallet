import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BarcodeScanningResult, CameraView, scanFromURLAsync, useCameraPermissions } from 'expo-camera';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { lookupRecipient, type Recipient } from '../api/recipients';
import { startTransfer } from '../auth/transferDraft';
import { Icon } from '../components/icons';
import { FoundCard } from '../components/qr/FoundCard';
import { RoundAction } from '../components/qr/RoundAction';
import { ScanOverlay } from '../components/qr/ScanOverlay';
import { ScanReceiveSwitch } from '../components/qr/ScanReceiveSwitch';
import { MaddButton } from '../components/MaddButton';
import { phoneFromQr } from '../utils/qrPayload';
import { replaceScreen } from '../utils/navigation';
import { colors, fonts, radius, spacing } from '../theme';

const NOT_MADD = "This isn't a MADD QR code.";
const TIP = 'Align the QR code inside the frame';

/**
 * Scan to pay (design 15, new look chosen 28 Nov 2026: options 2 + 5). The camera fills the screen with a window and a
 * moving scan line. A MADD code is looked up on the server and shown as a card (masked name and number) with Pay, so
 * the owner checks who it is before Amount opens. Flash and gallery stay one tap away; my own QR is on the Receive side.
 */
export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [message, setMessage] = useState('');
  const [checking, setChecking] = useState(false);
  const [found, setFound] = useState<Recipient | null>(null);
  const busy = useRef(false); // the camera reports the same QR many times a second; handle only one at a time
  const insets = useSafeAreaInsets();

  /** Reads the phone number from a QR and asks the server who it is (same lookup as typing the number). */
  async function onQr(text: string) {
    if (busy.current) return;
    busy.current = true;
    const phone = phoneFromQr(text);
    if (!phone) {
      setMessage(NOT_MADD);
      busy.current = false;
      return;
    }
    setChecking(true);
    const result = await lookupRecipient(phone);
    setChecking(false);
    if (result.ok) {
      setMessage('');
      setFound(result.recipient); // busy stays on until Pay or ✕
      return;
    }
    setMessage(result.message);
    busy.current = false;
  }

  /** Pay on the found card: the recipient is filled in and the normal Amount → Review → PIN flow starts. */
  function pay() {
    if (!found) return;
    startTransfer(found);
    replaceScreen('/amount');
  }

  /** ✕ on the found card: back to scanning. */
  function scanAgain() {
    setFound(null);
    busy.current = false;
  }

  /** Lets the user pick a photo of a QR and reads it. */
  async function scanFromGallery() {
    const picked = await launchImageLibraryAsync({ mediaTypes: ['images'] });
    if (picked.canceled) return;
    const codes = await scanFromURLAsync(picked.assets[0].uri, ['qr']);
    if (codes.length === 0) setMessage('No QR code found in this photo.');
    else onQr(codes[0].data);
  }

  if (permission && !permission.granted) {
    return (
      <SafeAreaView style={[styles.root, styles.ask]}>
        <Icon name="scan" size={48} color={colors.white} />
        <Text style={styles.askText}>MADD needs your camera to scan QR codes.</Text>
        <MaddButton label="Allow camera" onPress={requestPermission} />
        <Text style={styles.link} onPress={() => router.back()}>
          Not now
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      {permission?.granted && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={(scan: BarcodeScanningResult) => onQr(scan.data)}
        />
      )}
      <ScanOverlay found={found !== null} />

      <SafeAreaView style={styles.layer} edges={['top']}>
        <View style={styles.bar}>
          <TopButton icon="close" label="Close" onPress={() => router.back()} />
          <Text style={styles.title}>Scan to pay</Text>
          <TopButton icon="flash" label={torch ? 'Turn flash off' : 'Turn flash on'} active={torch} onPress={() => setTorch((on) => !on)} />
        </View>
        <View style={[styles.chip, message ? styles.chipError : null]}>
          {checking ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.chipText}>{message || TIP}</Text>}
        </View>
      </SafeAreaView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}>
        {found ? (
          <FoundCard recipient={found} onPay={pay} onCancel={scanAgain} />
        ) : (
          <View style={styles.actions}>
            <RoundAction icon="image" label="Gallery" onPress={scanFromGallery} />
          </View>
        )}
        <ScanReceiveSwitch value="scan" onChange={() => replaceScreen('/receive')} trackColor={colors.shade} />
      </View>
    </View>
  );
}

/** Round button in the top bar (close, flash). Turns white when switched on. */
function TopButton({ icon, label, active = false, onPress }: { icon: 'close' | 'flash'; label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={8} style={[styles.round, active && styles.roundActive]}>
      <Icon name={icon} size={20} color={active ? colors.ink : colors.white} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  layer: { position: 'absolute', top: 0, left: 0, right: 0 },
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  title: { flex: 1, textAlign: 'center', fontFamily: fonts.bold, fontSize: 17, color: colors.white },
  round: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.shade, alignItems: 'center', justifyContent: 'center' },
  roundActive: { backgroundColor: colors.white },
  chip: { alignSelf: 'center', marginTop: 18, minHeight: 34, justifyContent: 'center', backgroundColor: colors.shade, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 8 },
  chipError: { backgroundColor: colors.dangerText },
  chipText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.white, textAlign: 'center' },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.xl, gap: 22 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 28 },
  ask: { justifyContent: 'center', paddingHorizontal: spacing.xl, gap: 20, alignItems: 'center' },
  askText: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 24, color: colors.white, textAlign: 'center' },
  link: { fontFamily: fonts.bold, fontSize: 15, color: colors.sky },
});
