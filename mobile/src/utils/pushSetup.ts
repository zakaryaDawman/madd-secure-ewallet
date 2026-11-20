import { isRunningInExpoGo } from 'expo';
import {
  AndroidImportance,
  getDevicePushTokenAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
} from 'expo-notifications';
import { savePushToken } from '../api/me';

const CHANNEL_ID = 'security'; // the server sends every alert on this channel

/** True if Android has never been asked about notifications for MADD (then the app shows design 47 once). */
export async function notificationsNeverAsked(): Promise<boolean> {
  const { status } = await getPermissionsAsync();
  return status === 'undetermined';
}

/** "Allow notifications": asks Android, and if allowed, gets this phone ready for push alerts. Returns whether allowed. */
export async function askForNotifications(): Promise<boolean> {
  const { granted } = await requestPermissionsAsync();
  if (granted) await registerForPush();
  return granted;
}

/**
 * Creates the "Security alerts" channel and sends this phone's Firebase token to the server.
 * Skipped in Expo Go, which cannot receive push on Android; the real MADD build can.
 */
export async function registerForPush(): Promise<void> {
  if (isRunningInExpoGo()) return;
  const { granted } = await getPermissionsAsync();
  if (!granted) return;
  await setNotificationChannelAsync(CHANNEL_ID, { name: 'Security alerts', importance: AndroidImportance.MAX });
  const { data } = await getDevicePushTokenAsync();
  await savePushToken(String(data));
}
