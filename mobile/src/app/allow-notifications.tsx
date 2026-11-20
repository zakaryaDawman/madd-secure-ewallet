import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaddButton } from '../components/MaddButton';
import { NotificationPreviewArt } from '../components/NotificationPreviewArt';
import { askForNotifications } from '../utils/pushSetup';
import { replaceScreen } from '../utils/navigation';
import { colors, fonts, spacing } from '../theme';

/**
 * "Turn on alerts to stay protected" (design 47): shown after logging in while Android has never been asked.
 * Allow asks Android and registers this phone for push alerts; Not now goes on to Home (it asks again next login).
 */
export default function AllowNotificationsScreen() {
  const [asking, setAsking] = useState(false);
  const insets = useSafeAreaInsets();

  /** Asks Android for permission (the phone's own dialog), then opens Home whatever the answer. */
  async function onAllow() {
    setAsking(true);
    await askForNotifications().catch(() => false); // a push setup problem must never block the user
    setAsking(false);
    replaceScreen('/home');
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <NotificationPreviewArt />
        <Text style={styles.title}>Turn on alerts to stay protected</Text>
        <Text style={styles.text}>
          We&apos;ll alert you the moment a transfer needs your OK or someone logs in on a new phone. Without alerts, paused
          transfers may be cancelled before you see them.
        </Text>
      </ScrollView>
      <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.lg }]}>
        <MaddButton label="Allow notifications" onPress={onAllow} loading={asking} />
        <Pressable accessibilityRole="button" onPress={() => replaceScreen('/home')} hitSlop={8} style={styles.notNow}>
          <Text style={styles.notNowText}>Not now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  content: { paddingHorizontal: spacing.xl, paddingTop: 48, gap: 18 },
  title: { fontFamily: fonts.extrabold, fontSize: 32, lineHeight: 38, letterSpacing: -1.2, color: colors.ink, marginTop: 24 },
  text: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 25, color: colors.muted },
  actions: { paddingHorizontal: spacing.xl, gap: 8 },
  notNow: { alignItems: 'center', paddingVertical: 12 },
  notNowText: { fontFamily: fonts.bold, fontSize: 16, color: colors.blue },
});
