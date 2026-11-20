import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../../theme';

/** Grey placeholder shapes shown while Home loads (design 40). */
export function HomeSkeleton() {
  return (
    <View style={styles.root} accessibilityLabel="Loading your wallet" accessibilityState={{ busy: true }}>
      <View style={styles.row}>
        <View style={[styles.block, styles.circle]} />
        <View style={[styles.block, { width: 120, height: 32, borderRadius: radius.pill }]} />
        <View style={[styles.block, styles.circle]} />
      </View>
      <View style={{ gap: 10 }}>
        <View style={[styles.block, { width: 110, height: 14 }]} />
        <View style={[styles.block, { width: 240, height: 48, backgroundColor: '#E6ECF7' }]} />
      </View>
      <View style={styles.row}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.block, { flex: 1, height: 50, borderRadius: radius.pill }]} />
        ))}
      </View>
      <View style={[styles.block, { width: 150, height: 20, marginTop: 8 }]} />
      {[60, 70, 50].map((w) => (
        <View key={w} style={styles.listRow}>
          <View style={[styles.block, styles.circle]} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={[styles.block, { width: `${w}%`, height: 14 }]} />
            <View style={[styles.block, { width: `${w / 2}%`, height: 12, backgroundColor: colors.background }]} />
          </View>
          <View style={[styles.block, { width: 70, height: 14 }]} />
        </View>
      ))}
      <Text style={styles.loading}>Loading your wallet…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 22 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  block: { backgroundColor: '#EEF2FA', borderRadius: 6 },
  circle: { width: 44, height: 44, borderRadius: 22 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  loading: { alignSelf: 'center', fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
});
