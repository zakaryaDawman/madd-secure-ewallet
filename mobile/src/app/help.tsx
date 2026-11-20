import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaddAppBar } from '../components/MaddAppBar';
import { FaqItem } from '../components/profile/FaqItem';
import { colors, fonts, radius, spacing } from '../theme';

/** Questions and answers shown on Help (design 44). The first one starts open. */
const FAQ = [
  {
    question: 'Why was my transfer paused?',
    answer: "It was larger than usual, one of many in a short time, or sent from a new device. Confirm it within 5 minutes, or it's cancelled with no money moved.",
  },
  {
    question: 'How do I trust a new phone?',
    answer: 'Open Profile on a phone you already trust and tap Trust next to the new phone. Until then, transfers from the new phone wait for your OK.',
  },
  {
    question: 'I froze my account. What now?',
    answer: 'All transfers and logins are stopped. Contact MADD support; only our team can unfreeze your account after checking it is really you.',
  },
  {
    question: 'I forgot my PIN',
    answer: "Contact MADD support. For your safety we can't show or reset your PIN inside the app.",
  },
];

/** Help and support screen (design 44): common questions and how to reach MADD support. */
export default function HelpScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.bar}>
        <MaddAppBar title="Help and support" onBack={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>How can we help?</Text>
        <View>
          {FAQ.map((item, i) => (
            <FaqItem key={item.question} question={item.question} answer={item.answer} startOpen={i === 0} />
          ))}
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact MADD support</Text>
          <Text style={styles.cardText}>support@madd.my</Text>
          <Text style={styles.cardText}>+60 3-1234 5678 · 9am to 6pm</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  bar: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xxl, gap: 20 },
  title: { fontFamily: fonts.extrabold, fontSize: 32, letterSpacing: -1.2, color: colors.ink },
  card: { backgroundColor: colors.background, borderRadius: radius.card, padding: 20, gap: 6, marginTop: 12 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  cardText: { fontFamily: fonts.regular, fontSize: 15, color: '#2E3A59' },
});
