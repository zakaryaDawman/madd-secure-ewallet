import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../theme';

/** The blue rounded "m" with the madda wave, placed in the middle of the Receive QR. */
export function QrLogo({ size = 68 }: { size?: number }) {
  return (
    <View style={[styles.box, { width: size, height: size, borderRadius: size * 0.24 }]}>
      <Svg width={size * 0.66} height={size * 0.66} viewBox="0 6 80 92">
        <Path d="M10 30 C20 18 30 18 38 25 S56 32 70 20" fill="none" stroke={colors.sky} strokeWidth={9} strokeLinecap="round" />
        <Path d="M12 90 V60 a14 14 0 0 1 28 0 V90 M40 60 a14 14 0 0 1 28 0 V90" fill="none" stroke={colors.white} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
});
