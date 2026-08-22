import AsyncStorage from '@react-native-async-storage/async-storage';
import * as aesjs from 'aes-js';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

/**
 * Firebase Auth's React Native persistence (see `getReactNativePersistence(...)` in
 * config/firebase.ts) just needs something shaped like AsyncStorage —
 * getItem/setItem/removeItem. Handing it plain AsyncStorage means the signed-in
 * session (ID + refresh tokens) sits in the app's normal, unencrypted on-device
 * storage — readable by anything with filesystem access to the device/backup, no
 * Keychain/Keystore protection at all.
 *
 * expo-secure-store (backed by iOS Keychain / Android Keystore) is the right place for
 * that, but can't be used as the persistence target directly: Android's SecureStore
 * backend caps individual values at ~2048 bytes, and Firebase's persisted auth blob
 * (ID token + refresh token + metadata JSON) regularly runs longer than that — writes
 * would start silently failing the moment a session grew past the limit.
 *
 * Standard fix for this exact AsyncStorage-vs-SecureStore size mismatch (same pattern
 * Supabase's own Expo integration guide recommends): keep the actual value in
 * AsyncStorage — unlimited size, but now as ciphertext — encrypted under a fresh
 * random AES-256 key that's small enough to live in SecureStore on its own. Recovering
 * a value needs *both* halves (SecureStore for the key, AsyncStorage for the
 * ciphertext); the ciphertext alone, sitting in plain AsyncStorage, is useless without
 * the key that never leaves the Keychain/Keystore.
 */
class LargeSecureStore {
  // expo-secure-store only allows [A-Za-z0-9.-_] in key names, but Firebase's own
  // persistence keys look like "firebase:authUser:<apiKey>:[DEFAULT]" — colons and
  // brackets included — which SecureStore rejects outright. Hex-encoding the key's
  // UTF-8 bytes maps it onto exactly [0-9a-f] (a subset of what's allowed) without
  // losing anything: same input always maps to the same safe key, different inputs
  // never collide. Only used for the SecureStore side — AsyncStorage has no such
  // restriction, so it keeps using the original key untouched.
  private secureKeyFor(key: string): string {
    return aesjs.utils.hex.fromBytes(aesjs.utils.utf8.toBytes(key));
  }

  private async encrypt(key: string, value: string): Promise<string> {
    // A fresh 256-bit key every write — CTR mode is only safe when a given key is
    // never reused across two different messages, and never reusing one across writes
    // side-steps that entirely rather than requiring careful counter management.
    const encryptionKey = await Crypto.getRandomBytesAsync(32);

    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));

    // Overwrites whatever key (if any) was stored under this name — the old key and
    // old ciphertext are replaced together in this same write, so there's never a
    // moment where a stale key could decrypt anything meaningful.
    await SecureStore.setItemAsync(this.secureKeyFor(key), aesjs.utils.hex.fromBytes(encryptionKey));

    return aesjs.utils.hex.fromBytes(encryptedBytes);
  }

  private async decrypt(key: string, value: string): Promise<string | null> {
    const encryptionKeyHex = await SecureStore.getItemAsync(this.secureKeyFor(key));
    // No key on this device (never written, or SecureStore was cleared independently
    // of AsyncStorage) — the ciphertext is permanently unrecoverable; treat it the same
    // as "nothing stored" rather than throwing.
    if (!encryptionKeyHex) return null;

    const cipher = new aesjs.ModeOfOperation.ctr(aesjs.utils.hex.toBytes(encryptionKeyHex), new aesjs.Counter(1));
    const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(value));

    return aesjs.utils.utf8.fromBytes(decryptedBytes);
  }

  async getItem(key: string): Promise<string | null> {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;

    return this.decrypt(key, encrypted);
  }

  async setItem(key: string, value: string): Promise<void> {
    const encrypted = await this.encrypt(key, value);
    await AsyncStorage.setItem(key, encrypted);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(this.secureKeyFor(key));
  }
}

/** Drop-in AsyncStorage-shaped persistence backend — see class doc above for why. */
export const secureStorage = new LargeSecureStore();
