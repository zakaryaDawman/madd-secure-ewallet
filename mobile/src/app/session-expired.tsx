import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/icons';
import { MaddButton } from '../components/MaddButton';
import { replaceScreen } from '../utils/navigation';
import { colors, fonts, radius, spacing } from '../theme';

/** "You were logged out" sheet (design 28): shown when the server refuses the session token. The only way on is Log in again. */
export default function SessionExpiredScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.handle} />
        <View style={styles.icon}>
          <Icon name="timer" size={34} color={colors.blue} strokeWidth={2.4} />
        </View>
        <Text style={styles.title}>You were logged out</Text>
        <Text style={styles.text}>For your safety, MADD logs you out after 30 minutes. Log in again to continue.</Text>
        <View style={styles.button}>
          <MaddButton label="Log in again" onPress={() => replaceScreen('/login')} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(11,27,63,0.48)' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingHorizontal: spacing.xl, paddingTop: 12, alignItems: 'center', gap: 16 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.line, marginBottom: 8 },
  icon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.extrabold, fontSize: 24, letterSpacing: -0.8, color: colors.ink },
  text: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: colors.muted, textAlign: 'center' },
  button: { alignSelf: 'stretch', marginTop: 8 },
});
