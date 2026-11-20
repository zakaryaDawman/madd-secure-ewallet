import { ComponentRef, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import { getWallet } from '../api/wallet';
import { BlueGradient } from '../components/BlueGradient';
import { Icon } from '../components/icons';
import { CopiedToast } from '../components/qr/CopiedToast';
import { QrLogo } from '../components/qr/QrLogo';
import { ScanReceiveSwitch } from '../components/qr/ScanReceiveSwitch';
import { formatPhone, toQrText } from '../utils/qrPayload';
import { replaceScreen } from '../utils/navigation';
import { colors, fonts, radius, spacing } from '../theme';

const TOAST_MS = 2000;
const TOAST_ABOVE_BUTTONS = 170; // the toast floats just above Share QR / Save image

type Me = { fullName: string; phone: string };

/** Receive money screen (design 16): my QR (phone number only), copy number, share and save the QR. */
export default function ReceiveScreen() {
  const me = useMe();
  const insets = useSafeAreaInsets();
  const cardRef = useRef<ComponentRef<typeof View>>(null);
  const [toast, setToast] = useState('');

  /** Shows the dark toast for two seconds. */
  function showToast(text: string) {
    setToast(text);
    setTimeout(() => setToast(''), TOAST_MS);
  }

  /** Copies my phone number and shows "Number copied". */
  async function copyNumber() {
    if (!me) return;
    await Clipboard.setStringAsync(me.phone);
    showToast('Number copied');
  }

  /** Opens Android's share menu with my number, so someone can pay me. */
  function shareQr() {
    if (me) Share.share({ message: `Pay me on MADD: ${formatPhone(me.phone)}` });
  }

  /** Takes a picture of the QR card and saves it to the phone's gallery (asks for permission first). */
  async function saveImage() {
    const permission = await requestPermissionsAsync(true, ['photo']);
    if (!permission.granted) {
      Alert.alert('Allow photos', 'MADD needs permission to save the QR to your gallery.');
      return;
    }
    const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
    await Asset.create(uri);
    showToast('QR saved to gallery');
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <BlueGradient />
      <View style={styles.bar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} style={styles.close} hitSlop={8}>
          <Icon name="close" size={20} color={colors.white} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.title}>Receive money</Text>
        <View style={styles.spacer} />
      </View>

      <View ref={cardRef} collapsable={false} style={styles.card}>
        <Text style={styles.name}>{me?.fullName ?? ' '}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Copy number" onPress={copyNumber} style={styles.phonePill}>
          <Text style={styles.phone}>{me ? formatPhone(me.phone) : ' '}</Text>
          <Icon name="copy" size={18} color={colors.blue} />
        </Pressable>
        <View style={styles.qr}>
          {me && <QRCode value={toQrText(me.phone)} size={200} color={colors.ink} backgroundColor={colors.white} ecl="H" />}
          <View style={styles.logo}>{me && <QrLogo />}</View>
        </View>
        <Text style={styles.hint}>Anyone with MADD can scan this to send you money. It only shares your phone number.</Text>
      </View>

      {toast ? (
        <View style={[styles.toast, { bottom: insets.bottom + TOAST_ABOVE_BUTTONS }]}>
          <CopiedToast text={toast} />
        </View>
      ) : null}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.buttons}>
          <Pressable accessibilityRole="button" onPress={shareQr} style={[styles.button, styles.buttonWhite]}>
            <Text style={[styles.buttonText, styles.buttonTextBlue]}>Share QR</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={saveImage} style={[styles.button, styles.buttonGlass]}>
            <Text style={styles.buttonText}>Save image</Text>
          </Pressable>
        </View>
        <ScanReceiveSwitch value="receive" onChange={() => replaceScreen('/scan')} trackColor="rgba(11,27,63,0.35)" />
      </View>
    </SafeAreaView>
  );
}

/** Loads my name and phone number from the server (the QR is built from the server's copy, not typed on the phone). */
function useMe(): Me | null {
  const [me, setMe] = useState<Me | null>(null);

  // `active` ignores a late reply if the user already left the screen.
  useEffect(() => {
    let active = true;
    getWallet()
      .then((wallet) => active && setMe({ fullName: wallet.fullName, phone: wallet.phone }))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return me;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.blue },
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  close: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  spacer: { width: 44 },
  title: { flex: 1, textAlign: 'center', fontFamily: fonts.bold, fontSize: 17, color: colors.white },
  card: { marginTop: 28, backgroundColor: colors.white, borderRadius: 32, paddingHorizontal: spacing.xl, paddingVertical: 24, alignItems: 'center', gap: 12 },
  name: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.ink },
  phonePill: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.background, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 8 },
  phone: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  qr: { width: 200, height: 200, marginVertical: 6, alignItems: 'center', justifyContent: 'center' },
  logo: { position: 'absolute' },
  hint: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.muted, textAlign: 'center' },
  bottom: { flex: 1, justifyContent: 'flex-end', paddingTop: spacing.lg, paddingHorizontal: spacing.xl, gap: 14 },
  toast: { position: 'absolute', left: 0, right: 0 },
  buttons: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, alignItems: 'center', paddingVertical: 15, borderRadius: radius.pill },
  buttonWhite: { backgroundColor: colors.white },
  buttonGlass: { backgroundColor: 'rgba(255,255,255,0.18)' },
  buttonText: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
  buttonTextBlue: { color: colors.blueDark },
});
