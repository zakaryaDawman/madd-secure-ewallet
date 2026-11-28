import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { BlueGradient } from '../../components/BlueGradient';
import { Icon } from '../../components/icons';
import { CountUp } from '../../components/welcome/CountUp';
import { KineticWords } from '../../components/welcome/KineticWords';
import { StoryBars } from '../../components/welcome/StoryBars';
import { openScreen } from '../../utils/navigation';
import { colors, fonts, radius, spacing } from '../../theme';

/** The 3 welcome tips (designs 36–38, new moving look chosen 28 Nov 2026: option C). */
const SLIDES = [
  { count: 0, label: 'FEES TO SEND', words: ['Send', 'money', 'in', 'seconds.'], text: 'Pay anyone on MADD with their phone number or QR code.' },
  { count: 4, label: 'LIVE CHECKS ON EVERY TRANSFER', words: ['Every', 'transfer', 'is', 'checked.'], text: 'If something looks unusual, we pause it, ask you first and tell you why.' },
  { count: 1, label: 'PHONE HAS THE FINAL SAY', words: ['Only', 'your', 'phone', 'says yes.'], text: 'If someone logs in on another device, your usual phone gets the alert.' },
];

/** Welcome tip 1, 2 or 3, chosen by the URL (/welcome/1 …). Skip and the last button go to Create account. */
export default function WelcomeSlide() {
  const index = clampStep(useLocalSearchParams<{ step: string }>().step);
  const { count, label, words, text } = SLIDES[index];
  const isLast = index === SLIDES.length - 1;
  const textIn = useFadeIn();

  return (
    <SafeAreaView style={styles.root}>
      <BlueGradient />
      <View style={styles.top}>
        <StoryBars total={SLIDES.length} active={index} />
        <Pressable accessibilityRole="button" onPress={() => openScreen('/register')} hitSlop={10} style={styles.skipBox}>
          {!isLast && <Text style={styles.skip}>Skip</Text>}
        </Pressable>
      </View>
      <CountUp to={count} label={label} />
      <View style={styles.spacer} />
      <KineticWords words={words} />
      <Animated.Text style={[styles.text, { opacity: textIn }]}>{text}</Animated.Text>
      <Pressable
        accessibilityRole="button"
        style={styles.next}
        onPress={() => openScreen(isLast ? '/register' : `/welcome/${index + 2}`)}
      >
        <Text style={styles.nextText}>{isLast ? 'Create my account' : 'Next'}</Text>
        <Icon name="arrowRight" size={18} color={colors.white} strokeWidth={2.4} />
      </Pressable>
    </SafeAreaView>
  );
}

/** Fades the small text in after the headline has risen. */
function useFadeIn(): Animated.Value {
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const run = Animated.timing(value, { toValue: 1, duration: 500, delay: 900, useNativeDriver: true });
    run.start();
    return () => run.stop();
  }, [value]);
  return value;
}

/** Turns the URL value into a slide index 0–2 (anything odd shows slide 1). */
function clampStep(step: string | undefined): number {
  const n = Number(step) - 1;
  return Number.isInteger(n) && n >= 0 && n < SLIDES.length ? n : 0;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.blue, paddingHorizontal: spacing.xl, paddingBottom: 32 },
  top: { marginTop: spacing.md, gap: 14 },
  skipBox: { alignSelf: 'flex-end', height: 22 },
  skip: { fontFamily: fonts.bold, fontSize: 15, color: colors.sky },
  spacer: { flex: 1 },
  text: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 24, color: colors.sky, marginTop: 14, marginBottom: 28 },
  next: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.ink, borderRadius: radius.pill, paddingVertical: 17 },
  nextText: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
});
