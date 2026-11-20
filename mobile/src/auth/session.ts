import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'madd.session.token';
const NAME_KEY = 'madd.session.name';

/** Saves the session token (and the name to greet the user) in Android's encrypted Keystore storage. */
export async function saveSession(token: string, fullName: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(NAME_KEY, fullName);
}

/** Returns the saved session token, or null if the user is logged out. */
export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

/** Returns the saved user's name, or null. Only for display; the server never trusts it. */
export async function getSavedName(): Promise<string | null> {
  return SecureStore.getItemAsync(NAME_KEY);
}

/** Deletes the session from the phone (log out). */
export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(NAME_KEY);
}
