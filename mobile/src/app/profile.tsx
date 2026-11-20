import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { postLogout } from '../api/client';
import { getProfile, Profile } from '../api/me';
import { clearSession } from '../auth/session';
import { MaddTabBar, Tab } from '../components/MaddTabBar';
import { BigAvatar } from '../components/profile/BigAvatar';
import { DeviceRow } from '../components/profile/DeviceRow';
import { ListCard } from '../components/profile/ListCard';
import { MenuRow } from '../components/profile/MenuRow';
import { formatPhone } from '../utils/qrPayload';
import { backToHome, openScreen, restartAt } from '../utils/navigation';
import { colors, fonts, spacing } from '../theme';

/** Profile screen (design 19): me, My devices (this phone first), account links and Log out. */
export default function ProfileScreen() {
  const profile = useProfile();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {!profile ? (
        <ActivityIndicator style={styles.spinner} color={colors.blue} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.me}>
            <BigAvatar name={profile.fullName} />
            <View style={styles.meText}>
              <Text style={styles.name} numberOfLines={1}>{profile.fullName}</Text>
              <Text style={styles.phone}>{formatPhone(profile.phone)}</Text>
            </View>
          </View>

          <ListCard title="MY DEVICES">
            {[...profile.devices]
              .sort((a, b) => Number(b.thisDevice) - Number(a.thisDevice))
              .map((device) => (
                <DeviceRow key={device.deviceId} device={device} />
              ))}
          </ListCard>

          <ListCard title="ACCOUNT">
            <MenuRow label="Personal details" onPress={() => openScreen('/personal-details')} />
            <MenuRow label="Change PIN" onPress={() => openScreen('/change-pin')} />
            <MenuRow label="Help and support" onPress={() => openScreen('/help')} />
          </ListCard>

          <Pressable accessibilityRole="button" onPress={confirmLogout} hitSlop={8} style={styles.logout}>
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </ScrollView>
      )}
      <MaddTabBar active="profile" onSelect={onTabSelect} />
    </SafeAreaView>
  );
}

/** Loads my profile each time the screen comes into view (so a new name shows after Personal details). */
function useProfile(): Profile | null {
  const [profile, setProfile] = useState<Profile | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getProfile()
        .then((data) => active && setProfile(data))
        .catch(() => {});
      return () => {
        active = false;
      };
    }, []),
  );

  return profile;
}

/** Tab bar taps from Profile. Inbox arrives in task D6. */
function onTabSelect(tab: Tab) {
  if (tab === 'home') backToHome();
  if (tab === 'history' || tab === 'scan') openScreen(`/${tab}`);
}

/** Asks first, then cancels this session on the server, forgets it on the phone and goes back to the start. */
function confirmLogout() {
  Alert.alert('Log out?', 'You will need your password to log in again.', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Log out',
      style: 'destructive',
      onPress: async () => {
        await postLogout();
        await clearSession();
        restartAt('/');
      },
    },
  ]);
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  spinner: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: spacing.xxl, paddingBottom: spacing.xl, gap: 28 },
  me: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  meText: { flex: 1 },
  name: { fontFamily: fonts.extrabold, fontSize: 24, letterSpacing: -0.6, color: colors.ink },
  phone: { fontFamily: fonts.regular, fontSize: 16, color: colors.muted },
  logout: { alignSelf: 'center', padding: 8 },
  logoutText: { fontFamily: fonts.bold, fontSize: 17, color: colors.blue },
});
