import { StyleSheet, Text, View } from 'react-native';
import { MaddWordmark } from './MaddWordmark';
import { colors, fonts, radius } from '../theme';

/** The light-blue picture on design 47: a "Was this you?" alert on top of a "Money received" one. */
export function NotificationPreviewArt() {
  return (
    <View style={styles.panel}>
      <View style={[styles.alert, styles.front]}>
        <View style={styles.appIcon}>
          <MaddWordmark width={30} />
        </View>
        <View style={styles.texts}>
          <Text style={styles.title}>Was this you?</Text>
          <Text style={styles.body}>RM 800 transfer is waiting for you</Text>
        </View>
      </View>
      <View style={[styles.alert, styles.back]}>
        <View style={[styles.appIcon, styles.faded]} />
        <View style={styles.texts}>
          <Text style={[styles.title, styles.mutedText]}>Money received</Text>
          <Text style={[styles.body, styles.mutedText]}>Sara Lim sent you RM 50.00</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { alignSelf: 'stretch', backgroundColor: colors.tint, borderRadius: 36, paddingHorizontal: 12, paddingVertical: 56, gap: 14 },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.card, padding: 14 },
  front: { backgroundColor: colors.white, shadowColor: colors.blue, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 },
  back: { backgroundColor: colors.background },
  appIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  faded: { opacity: 0.8 },
  texts: { flex: 1 },
  title: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink },
  mutedText: { color: colors.muted },
});
