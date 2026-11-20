import { Pressable, StyleSheet } from 'react-native';

/** The dark see-through layer behind a bottom sheet. Tapping it calls `onPress` (e.g. "not now"). */
export function SheetBackdrop({ onPress }: { onPress?: () => void }) {
  return <Pressable style={styles.dim} onPress={onPress} accessibilityLabel="Close" />;
}

const styles = StyleSheet.create({
  dim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(11,27,63,0.45)' },
});
