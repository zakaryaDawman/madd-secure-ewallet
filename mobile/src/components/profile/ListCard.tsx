import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../../theme';

/** A small capital title ("MY DEVICES") above a white rounded card, with thin lines between its rows. */
export function ListCard({ title, children }: { title: string; children: ReactNode }) {
  const rows = Children.toArray(children);
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.card}>
        {rows.map((row, i) => (
          <Fragment key={i}>
            {i > 0 && <View style={styles.line} />}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  title: { fontFamily: fonts.bold, fontSize: 13, letterSpacing: 1.2, color: colors.muted },
  card: { backgroundColor: colors.white, borderRadius: radius.card, paddingHorizontal: 18 },
  line: { height: 1, backgroundColor: '#E8EDF7' },
});
