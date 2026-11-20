import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/icons';
import { MaddButton } from '../components/MaddButton';
import { FreezeAccountSheet } from '../components/profile/FreezeAccountSheet';
import { backToHome } from '../utils/navigation';
import { colors, fonts, spacing } from '../theme';

/**
 * "Transfers locked" (design 31, state 2): shown when the server refuses a transfer after 5 wrong PINs in a row.
 * "Not you? Freeze account" opens design 30 without the PIN, since it is locked.
 */
export default function PinLockedScreen() {
  const insets = useSafeAreaInsets();
  const [freezing, setFreezing] = useState(false);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.center}>
        <View style={styles.icon}>
          <Icon name="lock" size={40} color={colors.danger} strokeWidth={2.4} />
        </View>
        <Text style={styles.title}>Transfers locked for 15 minutes</Text>
        <Text style={styles.text}>You can still see your balance and history. We alerted your registered phone.</Text>
      </View>
      <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.xl }]}>
        <MaddButton label="Not you? Freeze account" variant="danger" onPress={() => setFreezing(true)} />
        <MaddButton label="Back to home" onPress={backToHome} />
      </View>
      {freezing && <FreezeAccountSheet pinLocked onCancel={() => setFreezing(false)} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: 16 },
  icon: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.dangerBg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 34, letterSpacing: -1, color: colors.ink, textAlign: 'center' },
  text: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: colors.muted, textAlign: 'center' },
  actions: { paddingHorizontal: spacing.xl, gap: 12 },
});
