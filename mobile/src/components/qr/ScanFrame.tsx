import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';

const SIZE = 260;
const CORNER = 56;

/** The square camera window from design 15: white rounded corners and the blue scan line across the middle. */
export function ScanFrame({ children }: { children: ReactNode }) {
  return (
    <View style={styles.frame}>
      <View style={styles.window}>{children}</View>
      <View style={[styles.corner, styles.topLeft]} />
      <View style={[styles.corner, styles.topRight]} />
      <View style={[styles.corner, styles.bottomLeft]} />
      <View style={[styles.corner, styles.bottomRight]} />
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: SIZE, height: SIZE, alignSelf: 'center' },
  window: { flex: 1, overflow: 'hidden', borderRadius: 24, backgroundColor: '#1B2338' },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: colors.white },
  topLeft: { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 26 },
  topRight: { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 26 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 26 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 26 },
  line: { position: 'absolute', left: 24, right: 24, top: SIZE / 2 - 1.5, height: 3, borderRadius: 2, backgroundColor: colors.blue },
});
