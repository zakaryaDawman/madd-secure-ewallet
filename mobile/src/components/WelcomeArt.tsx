import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors, fonts, radius } from '../theme';

/** Slide 1 art (design 36): a mini balance card with a "+ RM 50.00" chip. */
export function SendArt() {
  return (
    <View style={[styles.stage, { backgroundColor: colors.tint }]}>
      <View style={styles.card}>
        <Text style={styles.small}>Total balance</Text>
        <Text style={styles.balance}>RM 1,000</Text>
        <View style={styles.pills}>
          <View style={[styles.pill, { backgroundColor: colors.blue }]} />
          <View style={[styles.pill, { backgroundColor: colors.tint }]} />
        </View>
      </View>
      <View style={styles.chip}>
        <Text style={styles.chipText}>+ RM 50.00</Text>
      </View>
    </View>
  );
}

/** Slide 2 art (design 37): a usual transfer sent straight away vs an unusual one paused. */
export function CheckedArt() {
  return (
    <View style={[styles.stage, { backgroundColor: colors.warningBg, gap: 12 }]}>
      <StatusRow tone="ok" title="Usual amount" detail="Sent straight away" />
      <StatusRow tone="warn" title="Unusual amount" detail="Paused until you confirm" />
    </View>
  );
}

/** Slide 3 art (design 38): your trusted phone approving, a new phone waiting. */
export function TrustedPhoneArt() {
  return (
    <View style={[styles.stage, { backgroundColor: colors.successBg, flexDirection: 'row', gap: 18 }]}>
      <View style={[styles.phone, { borderColor: colors.success }]}>
        <Svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={colors.success} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M5 12l5 5 9-10" />
        </Svg>
        <Text style={[styles.phoneLabel, { color: '#15803D' }]}>Your phone</Text>
      </View>
      <Svg width={34} height={20} viewBox="0 0 34 20" fill="none" stroke="#15803D" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M30 10H4M10 4l-6 6 6 6" />
      </Svg>
      <View style={[styles.phone, { borderColor: '#9AA6C2', borderStyle: 'dashed' }]}>
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Rect x={4} y={10} width={16} height={11} rx={2} />
          <Path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </Svg>
        <Text style={[styles.phoneLabel, { color: colors.muted }]}>New phone</Text>
      </View>
    </View>
  );
}

/** One card on slide 2: a green tick or amber clock, with a title and detail line. */
function StatusRow({ tone, title, detail }: { tone: 'ok' | 'warn'; title: string; detail: string }) {
  const color = tone === 'ok' ? colors.success : colors.warning;
  return (
    <View style={[styles.statusCard, tone === 'warn' && { borderWidth: 2, borderColor: colors.warning }]}>
      <View style={[styles.statusIcon, { backgroundColor: color }]}>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.white} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
          {tone === 'ok' ? <Path d="M5 12l5 5 9-10" /> : <><Circle cx={12} cy={12} r={9} /><Path d="M12 7v5l3 2" /></>}
        </Svg>
      </View>
      <View>
        <Text style={styles.statusTitle}>{title}</Text>
        <Text style={styles.statusDetail}>{detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { height: 300, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  card: { width: 210, backgroundColor: colors.white, borderRadius: 24, padding: 18, gap: 10, elevation: 6 },
  small: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted },
  balance: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.ink, letterSpacing: -0.8 },
  pills: { flexDirection: 'row', gap: 8 },
  pill: { flex: 1, height: 30, borderRadius: radius.pill },
  chip: { position: 'absolute', right: 30, top: 40, backgroundColor: colors.success, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 6 },
  chipText: { fontFamily: fonts.bold, fontSize: 12, color: colors.white },
  statusCard: { width: 240, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderRadius: 20, padding: 14 },
  statusIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  statusDetail: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  phone: { width: 92, height: 160, borderRadius: 20, borderWidth: 3, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', gap: 8 },
  phoneLabel: { fontFamily: fonts.bold, fontSize: 12 },
});
