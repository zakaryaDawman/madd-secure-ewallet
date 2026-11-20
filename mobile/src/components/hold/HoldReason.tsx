import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '../icons';
import { colors, fonts, radius } from '../../theme';

/** The amber "Why we paused it" box (design 11). Shows the server's reasons word for word. */
export function HoldReason({ reasons }: { reasons: string[] }) {
  return (
    <View style={styles.box}>
      <Icon name="alert" size={20} color={colors.warning} />
      <View style={styles.texts}>
        <Text style={styles.title}>Why we paused it</Text>
        {reasons.map((reason) => (
          <Text key={reason} style={styles.reason}>
            {reason}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignSelf: 'stretch', flexDirection: 'row', gap: 12, padding: 16, borderRadius: radius.card, borderWidth: 1.5, borderColor: colors.warningBorder, backgroundColor: colors.warningSurface },
  texts: { flex: 1, gap: 4 },
  title: { fontFamily: fonts.bold, fontSize: 15, color: colors.warningText },
  reason: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.warningText },
});
