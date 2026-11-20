// TEMPORARY (task B2): confirms sign-up worked. Replaced by "Allow notifications" + Home in later tasks.
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { replaceScreen } from '../utils/navigation';
import Svg, { Path } from 'react-native-svg';
import { MaddButton } from '../components/MaddButton';
import { colors, fonts, spacing } from '../theme';

/** Simple success screen shown after the account is created. */
export default function AccountCreatedScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.center}>
        <View style={styles.tick}>
          <Svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke={colors.white} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 12l5 5 9-10" />
          </Svg>
        </View>
        <Text style={styles.title}>Account created</Text>
        <Text style={styles.text}>Your wallet is ready with RM 1,000 of demo money. Log in to start.</Text>
      </View>
      <MaddButton label="Log in" onPress={() => replaceScreen('/login')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, padding: spacing.xl, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  tick: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.extrabold, fontSize: 28, letterSpacing: -0.8, color: colors.ink },
  text: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.muted, textAlign: 'center' },
});
