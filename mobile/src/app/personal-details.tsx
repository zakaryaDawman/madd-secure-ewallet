import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { getProfile, Profile, saveName } from '../api/me';
import { MaddAppBar } from '../components/MaddAppBar';
import { MaddButton } from '../components/MaddButton';
import { TextField } from '../components/TextField';
import { BigAvatar } from '../components/profile/BigAvatar';
import { LockedField } from '../components/profile/LockedField';
import { formatPhone } from '../utils/qrPayload';
import { openScreen } from '../utils/navigation';
import { colors, fonts, spacing } from '../theme';

/** Personal details screen (design 42): change my name; email is locked; the phone number changes on its own screen (task G11). */
export default function PersonalDetailsScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();

  // Load my details each time the screen shows (e.g. back from Change phone number). `active` ignores a late reply.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getProfile()
        .then((data) => {
          if (!active) return;
          setProfile(data);
          setName(data.fullName);
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, []),
  );

  /** Sends the new name to the server; goes back to Profile when saved, or shows the server's message. */
  async function onSave() {
    setSaving(true);
    const result = await saveName(name);
    setSaving(false);
    if (result.ok) router.back();
    else setError(result.message);
  }

  const memberSince = profile ? new Date(profile.memberSince).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.bar}>
        <MaddAppBar title="Personal details" onBack={() => router.back()} />
      </View>
      {!profile ? (
        <ActivityIndicator style={styles.spinner} color={colors.blue} />
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.top}>
              <BigAvatar name={name || profile.fullName} size={80} />
              <Text style={styles.since}>Member since {memberSince}</Text>
            </View>
            <TextField
              label="Full name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setError('');
              }}
              error={error}
              autoCapitalize="words"
              autoComplete="name"
            />
            <LockedField label="Email" value={profile.email} />
            <LockedField label="Phone number" value={formatPhone(profile.phone)} />
            <Text style={styles.link} onPress={() => openScreen('/change-phone')}>
              Change phone number
            </Text>
            <Text style={styles.note}>Changing your number needs your PIN and a code sent to your email. To change your email, contact support.</Text>
          </ScrollView>
          <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.xl }]}>
            <MaddButton label="Save changes" onPress={onSave} loading={saving} disabled={name.trim() === profile.fullName} />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  bar: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  spinner: { marginTop: 48 },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xl, gap: 18 },
  top: { alignItems: 'center', gap: 12, marginBottom: 8 },
  since: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  link: { fontFamily: fonts.bold, fontSize: 15, color: colors.blue },
  note: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: colors.muted },
  actions: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
});
