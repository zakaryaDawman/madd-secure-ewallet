import { Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';

/**
 * Makes the PDF and opens Android's share menu (WhatsApp, Gmail, Drive, Files…) (task G12). The file gets a readable
 * name, e.g. "MADD-statement-2026-11-01-to-2026-11-30.pdf", and is always deleted from the phone afterwards.
 */
export async function sharePdf(html: string, fileName: string): Promise<void> {
  let file: File | null = null;
  try {
    const { uri } = await Print.printToFileAsync({ html });
    file = new File(uri);
    const named = new File(Paths.cache, fileName);
    if (named.exists) named.delete();
    await file.move(named);
    await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Share statement', UTI: 'com.adobe.pdf' });
  } catch {
    Alert.alert("Couldn't share", 'Something went wrong making the statement. Please try again.');
  } finally {
    if (file?.exists) file.delete();
  }
}

/** Opens Android's print screen, where "Save as PDF" downloads the statement to the phone. */
export async function savePdf(html: string): Promise<void> {
  try {
    await Print.printAsync({ html });
  } catch {
    Alert.alert("Couldn't save", 'Something went wrong making the statement. Please try again.');
  }
}
