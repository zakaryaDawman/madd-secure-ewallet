import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, radius } from '../../theme';

/** "Welcome to MADD" card shown to a brand-new user (design 39), explaining the RM 1,000 demo money. */
export function WelcomeCard() {
  return (
    <View style={styles.card}>
      <View style={styles.logo}>
        <Svg width={26} height={32} viewBox="0 0 80 100">
          <Path d="M10 30 C20 18 30 18 38 25 S56 32 70 20" fill="none" stroke={colors.sky} strokeWidth={9} strokeLinecap="round" />
          <Path d="M12 90 V60 a14 14 0 0 1 28 0 V90 M40 60 a14 14 0 0 1 28 0 V90" fill="none" stroke={colors.white} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>Welcome to MADD</Text>
        <Text style={styles.body}>We added RM 1,000 of demo money so you can try it.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.tint, borderRadius: radius.card, padding: 16 },
  logo: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.blueDark },
});
