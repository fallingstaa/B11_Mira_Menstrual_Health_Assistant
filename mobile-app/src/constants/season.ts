import * as SecureStore from 'expo-secure-store';

/**
 * Whether Christmas mode is on — read once, synchronously, when the app starts.
 *
 * It has to be known *before* theme.ts builds its colours, because every StyleSheet in the app
 * captures colours when its file first loads. That's why this uses SecureStore's synchronous
 * getItem (AsyncStorage would be too late) and why switching the mode restarts the app
 * (see context/seasonal-theme.tsx).
 */
export const CHRISTMAS_STORAGE_KEY = 'yumi_christmas_mode';

function readChristmasMode(): boolean {
  try {
    return SecureStore.getItem(CHRISTMAS_STORAGE_KEY) === 'on';
  } catch {
    return false; // e.g. web, or storage unavailable — just use the normal look
  }
}

export const CHRISTMAS_AT_STARTUP = readChristmasMode();

export function saveChristmasMode(on: boolean) {
  try {
    SecureStore.setItem(CHRISTMAS_STORAGE_KEY, on ? 'on' : 'off');
  } catch (err) {
    console.warn('[season] could not save Christmas mode:', err);
  }
}
