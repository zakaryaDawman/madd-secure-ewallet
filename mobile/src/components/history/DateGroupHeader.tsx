import { StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../../theme';

/** Small capital heading above a day's transactions, e.g. "TODAY" or "16 NOVEMBER". */
export function DateGroupHeader({ title }: { title: string }) {
  return <Text style={styles.title}>{title.toUpperCase()}</Text>;
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.2, color: colors.muted, marginTop: 18, marginBottom: 4 },
});
