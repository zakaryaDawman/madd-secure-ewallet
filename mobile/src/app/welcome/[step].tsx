import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { openScreen } from '../../utils/navigation';
import { useLocalSearchParams } from 'expo-router';
import { Icon } from '../../components/icons';
import { MaddButton } from '../../components/MaddButton';
import { CheckedArt, SendArt, TrustedPhoneArt } from '../../components/WelcomeArt';
import { colors, fonts, radius, spacing } from '../../theme';

/** Content of the 3 welcome slides (designs 36, 37, 38). */
const SLIDES = [
  { Art: SendArt, title: 'Send money in seconds', text: 'Pay anyone on MADD with their phone number or QR code. No fees.' },
  { Art: CheckedArt, title: 'Every transfer is checked', text: 'If something looks unusual, we pause it and ask you first. We always tell you why.' },
  { Art: TrustedPhoneArt, title: 'Only your phone can say yes', text: 'If someone logs in on another device, your phone gets the alert and the final say.' },
];

/** Welcome slide 1, 2 or 3, chosen by the URL (/welcome/1 …). Skip and the last button go to Create account. */
export default function WelcomeSlide() {
  const index = clampStep(useLocalSearchParams<{ step: string }>().step);
  const { Art, title, text } = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.top}>
        {!isLast && (
          <Pressable accessibilityRole="button" onPress={() => openScreen('/register')} hitSlop={10}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        )}
      </View>
      <Art />
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>{text}</Text>
      </View>
      <View style={styles.spacer} />
      {isLast ? (
        <View style={styles.lastActions}>
          <Dots active={index} />
          <MaddButton label="Create my account" onPress={() => openScreen('/register')} />
        </View>
      ) : (
        <View style={styles.actions}>
          <Dots active={index} />
          <Pressable accessibilityRole="button" style={styles.next} onPress={() => openScreen(`/welcome/${index + 2}`)}>
            <Text style={styles.nextText}>Next</Text>
            <Icon name="arrowRight" size={18} color={colors.white} strokeWidth={2.4} />
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

/** Turns the URL value into a slide index 0–2 (anything odd shows slide 1). */
function clampStep(step: string | undefined): number {
  const n = Number(step) - 1;
  return Number.isInteger(n) && n >= 0 && n < SLIDES.length ? n : 0;
}

/** Progress dots: the current slide's dot is long and blue. */
function Dots({ active }: { active: number }) {
  return (
    <View style={styles.dots}>
      {SLIDES.map((_, i) => (
        <View key={i} style={[styles.dot, i === active && styles.dotActive]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, paddingHorizontal: spacing.xl, paddingBottom: 36, gap: 28 },
  top: { height: 44, alignItems: 'flex-end', justifyContent: 'center', marginTop: spacing.md },
  skip: { fontFamily: fonts.bold, fontSize: 15, color: colors.blue },
  copy: { gap: 10 },
  title: { fontFamily: fonts.extrabold, fontSize: 34, lineHeight: 37, letterSpacing: -1.2, color: colors.ink },
  text: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 25, color: colors.muted },
  spacer: { flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lastActions: { gap: spacing.lg },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.line },
  dotActive: { width: 24, backgroundColor: colors.blue },
  next: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.blue, borderRadius: radius.pill, paddingVertical: 15, paddingHorizontal: 26 },
  nextText: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
});
