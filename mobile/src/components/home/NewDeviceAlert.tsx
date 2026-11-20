import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getPendingDevice, PendingDevice, rejectDevice } from '../../api/devices';
import { clearSession } from '../../auth/session';
import { NewDeviceSheet } from '../devices/NewDeviceSheet';
import { TrustDeviceSheet } from '../devices/TrustDeviceSheet';
import { restartAt } from '../../utils/navigation';

// Phones the owner closed with "not now" while the app is open, so the sheet doesn't pop up again every time Home loads.
const notNow = new Set<string>();

/**
 * Each time Home comes into view, asks the server for a new phone waiting for a decision and, if there is one, shows "New device signed in" (design 13).
 * Yes opens "Trust this device" with the PIN (design 45). No freezes the account. Real push alerts come in task D7.
 */
export function NewDeviceAlert() {
  const [device, setDevice] = useState<PendingDevice | null>(null);
  const [step, setStep] = useState<'alert' | 'pin'>('alert');
  const [freezing, setFreezing] = useState(false);
  const [error, setError] = useState('');

  // Checks each time Home comes into view, not only the first time it opens.
  useFocusEffect(
    useCallback(() => {
      getPendingDevice()
        .then((pending) => setDevice(pending && !notNow.has(pending.deviceId) ? pending : null))
        .catch(() => undefined); // offline: Home already shows the offline view
    }, []),
  );

  /** Hides the sheet until the app is opened again. */
  function close() {
    if (device) notNow.add(device.deviceId);
    setDevice(null);
  }

  /** "No, freeze my account": the server freezes and logs out every phone, then this phone shows Frozen (design 14). */
  async function freeze() {
    if (!device) return;
    setFreezing(true);
    const result = await rejectDevice(device.deviceId);
    setFreezing(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    await clearSession();
    restartAt('/frozen');
  }

  if (!device) return null;
  if (step === 'pin') return <TrustDeviceSheet device={device} onTrusted={() => setDevice(null)} onCancel={() => setStep('alert')} />;
  return <NewDeviceSheet device={device} freezing={freezing} error={error} onTrust={() => setStep('pin')} onFreeze={freeze} onClose={close} />;
}
