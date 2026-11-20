import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { postLogout } from '../api/client';
import { getProfile, MyDevice, Profile } from '../api/me';
import { clearSession } from '../auth/session';
import { MaddTabBar, Tab } from '../components/MaddTabBar';
import { BigAvatar } from '../components/profile/BigAvatar';
import { DeviceRow } from '../components/profile/DeviceRow';
import { TrustDeviceSheet } from '../components/devices/TrustDeviceSheet';
import { FreezeAccountSheet } from '../components/profile/FreezeAccountSheet';
import { ListCard } from '../components/profile/ListCard';
import { MenuRow } from '../components/profile/MenuRow';
import { formatPhone } from '../utils/qrPayload';
import { backToHome, openScreen, restartAt } from '../utils/navigation';
import { useInboxDot } from '../utils/useInboxDot';
import { colors, fonts, spacing } from '../theme';

/**
 * Profile screen (design 19): me, My devices (this phone first, with Trust for new phones), account links,
 * "Freeze my account" (design 30) and Log out.
 */
export default function ProfileScreen() {
  const [profile, reload] = useProfile();
  const hasUnread = useInboxDot();
  const [toTrust, setToTrust] = useState<MyDevice | null>(null);
  const [freezing, setFreezing] = useState(false);
  // Only a trusted phone can trust another one (the server checks this too).
  const thisPhoneTrusted = profile?.devices.some((d) => d.thisDevice && d.trusted) ?? false;

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
                <DeviceRow
                  key={device.deviceId}
                  device={device}
                  onTrust={thisPhoneTrusted && !device.trusted ? () => setToTrust(device) : undefined}
                />
              ))}
          </ListCard>

          <ListCard title="ACCOUNT">
            <MenuRow label="Personal details" onPress={() => openScreen('/personal-details')} />
            <MenuRow label="Change PIN" onPress={() => openScreen('/change-pin')} />
            <MenuRow label="Help and support" onPress={() => openScreen('/help')} />
            <MenuRow label="Freeze my account" danger onPress={() => setFreezing(true)} />
          </ListCard>

          <Pressable accessibilityRole="button" onPress={confirmLogout} hitSlop={8} style={styles.logout}>
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </ScrollView>
      )}
      <MaddTabBar active="profile" hasUnread={hasUnread} onSelect={onTabSelect} />
      {freezing && profile && <FreezeAccountSheet pinLocked={profile.pinLocked} onCancel={() => setFreezing(false)} />}
      {toTrust && (
        <TrustDeviceSheet
          device={toTrust}
          onCancel={() => setToTrust(null)}
          onTrusted={() => {
            setToTrust(null);
            reload();
          }}
        />
      )}
    </SafeAreaView>
  );
}

/** Loads my profile each time the screen comes into view (so a new name shows after Personal details). `reload` loads it again. */
function useProfile(): [Profile | null, () => void] {
  const [profile, setProfile] = useState<Profile | null>(null);

  /** Asks the server for my profile again (e.g. after trusting a phone). */
  const reload = useCallback(() => {
    getProfile()
      .then(setProfile)
      .catch(() => {});
  }, []);

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

  return [profile, reload];
}

/** Tab bar taps from Profile. */
function onTabSelect(tab: Tab) {
  if (tab === 'home') backToHome();
  if (tab === 'history' || tab === 'scan' || tab === 'inbox') openScreen(`/${tab}`);
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
