import type { ComponentRef, RefObject } from 'react';
import { Alert, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef, releaseCapture } from 'react-native-view-shot';

/**
 * Captures a view as a PNG and opens Android's share menu with it (receipts, task G6, and the Receive QR).
 * The temporary file is always deleted afterwards, even if sharing was cancelled or failed.
 */
export async function shareViewAsImage(ref: RefObject<ComponentRef<typeof View> | null>, title: string): Promise<void> {
  let uri: string | null = null;
  try {
    uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
    await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: title });
  } catch {
    Alert.alert("Couldn't share", 'Something went wrong making the image. Please try again.');
  } finally {
    if (uri) releaseCapture(uri);
  }
}
