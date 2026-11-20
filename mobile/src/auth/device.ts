import * as SecureStore from 'expo-secure-store';
import { randomUUID } from 'expo-crypto';
import * as Device from 'expo-device';

const DEVICE_ID_KEY = 'madd.device.id';

/** This phone's MADD id: made once with a random UUID, then kept in secure storage (it survives logout). */
export async function getDeviceId(): Promise<string> {
  const saved = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (saved) return saved;
  const id = randomUUID();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  return id;
}

/** A readable name for this phone, e.g. "HONOR REA-NX9", shown in My devices. */
export function getDeviceName(): string {
  return [Device.manufacturer, Device.modelName].filter(Boolean).join(' ') || 'Android phone';
}
