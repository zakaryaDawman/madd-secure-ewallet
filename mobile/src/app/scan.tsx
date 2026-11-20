import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BarcodeScanningResult, CameraView, scanFromURLAsync, useCameraPermissions } from 'expo-camera';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { lookupRecipient } from '../api/recipients';
import { startTransfer } from '../auth/transferDraft';
import { Icon } from '../components/icons';
import { ScanFrame } from '../components/qr/ScanFrame';
import { ScanReceiveSwitch } from '../components/qr/ScanReceiveSwitch';
import { MaddButton } from '../components/MaddButton';
import { phoneFromQr } from '../utils/qrPayload';
import { replaceScreen } from '../utils/navigation';
import { colors, fonts, radius, spacing } from '../theme';

const NOT_MADD = "This isn't a MADD QR code.";

/** Scan to send screen (design 15): camera, flash and scan-from-gallery. A good QR opens the normal Amount screen. */
export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [message, setMessage] = useState('');
  const [checking, setChecking] = useState(false);
  const busy = useRef(false); // the camera reports the same QR many times a second; handle only one at a time
  const insets = useSafeAreaInsets();

  /**
   * Handles a scanned QR: reads the phone number, asks the server who it is (same lookup as typing the number),
   * then opens Amount. The PIN and every server check still happen later; the QR only fills in the recipient.
   */
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
      startTransfer(result.recipient);
      replaceScreen('/amount');
      return;
    }
    setMessage(result.message);
    busy.current = false;
  }

  /** Lets the user pick a photo of a QR and reads it. */
  async function scanFromGallery() {
    const picked = await launchImageLibraryAsync({ mediaTypes: ['images'] });
    if (picked.canceled) return;
    const found = await scanFromURLAsync(picked.assets[0].uri, ['qr']);
    if (found.length === 0) setMessage('No QR code found in this photo.');
    else onQr(found[0].data);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.bar}>
        <RoundButton icon="close" label="Close" onPress={() => router.back()} />
        <Text style={styles.title}>Scan to send</Text>
        <RoundButton icon="flash" label={torch ? 'Turn flash off' : 'Turn flash on'} active={torch} onPress={() => setTorch((on) => !on)} />
      </View>

      <View style={styles.middle}>
        <ScanFrame>
          {permission?.granted && (
            <CameraView
              style={styles.camera}
              facing="back"
              enableTorch={torch}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={(scan: BarcodeScanningResult) => onQr(scan.data)}
            />
          )}
        </ScanFrame>
        {permission && !permission.granted ? (
          <View style={styles.permission}>
            <Text style={styles.hint}>MADD needs your camera to scan QR codes.</Text>
            <MaddButton label="Allow camera" onPress={requestPermission} />
          </View>
        ) : (
          <Text style={[styles.hint, message ? styles.error : null]}>{message || 'Point your camera at a MADD QR code'}</Text>
        )}
        {checking ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Pressable accessibilityRole="button" onPress={scanFromGallery} style={styles.gallery}>
            <Icon name="image" size={22} color={colors.white} />
            <Text style={styles.galleryText}>Scan from gallery</Text>
          </Pressable>
        )}
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}>
        <ScanReceiveSwitch value="scan" onChange={() => replaceScreen('/receive')} trackColor="#283247" />
      </View>
    </SafeAreaView>
  );
}

/** Round grey button in the top bar (close, flash). Turns white when switched on. */
function RoundButton({ icon, label, active = false, onPress }: { icon: 'close' | 'flash'; label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={8} style={[styles.round, active && styles.roundActive]}>
      <Icon name={icon} size={20} color={active ? colors.ink : colors.white} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111A2E' },
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  title: { flex: 1, textAlign: 'center', fontFamily: fonts.bold, fontSize: 17, color: colors.white },
  round: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: '#2A3346', alignItems: 'center', justifyContent: 'center' },
  roundActive: { backgroundColor: colors.white },
  middle: { flex: 1, justifyContent: 'center', gap: 28, paddingHorizontal: spacing.xl },
  camera: { flex: 1 },
  hint: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: '#B9C3DC', textAlign: 'center', paddingHorizontal: 40 },
  error: { fontFamily: fonts.semibold, color: '#FCA5A5' },
  permission: { gap: 16 },
  gallery: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#2A3346', borderRadius: radius.pill, paddingHorizontal: 20, paddingVertical: 12 },
  galleryText: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },
  bottom: { paddingHorizontal: spacing.xl },
});
