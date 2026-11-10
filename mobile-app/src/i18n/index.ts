/* eslint-disable import/no-named-as-default-member -- i18n.t / i18n.changeLanguage on the
   configured instance is the intended i18next API here, not the standalone named exports. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from './locales/en';
import { km } from './locales/km';

export type AppLanguage = 'en' | 'km';

const STORAGE_KEY = 'yumi.language';

/**
 * The backend's `preferredLanguage` is a free-text display name ("English"/"Khmer", see
 * language-picker-modal.tsx) — these two helpers translate between that and i18next's codes.
 */
export const toLanguageName = (lang: AppLanguage) => (lang === 'km' ? 'Khmer' : 'English');
export const fromLanguageName = (name?: string | null): AppLanguage => (name === 'Khmer' ? 'km' : 'en');

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, km: { translation: km } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes rendered text
  returnNull: false,
});

/**
 * The device's own choice is the source of truth (so pre-login screens — onboarding,
 * login, register — can already be in Khmer). Called once at startup before the first
 * screen renders; a missing/unreadable value just leaves English.
 */
export async function loadSavedLanguage(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'km') await i18n.changeLanguage(saved);
  } catch (err) {
    console.warn('[i18n] could not read saved language, using English:', err);
  }
}

export async function setAppLanguage(lang: AppLanguage): Promise<void> {
  await i18n.changeLanguage(lang);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  } catch (err) {
    console.warn('[i18n] could not save language choice:', err);
  }
}

export const currentLanguage = (): AppLanguage => (i18n.language === 'km' ? 'km' : 'en');

/**
 * "1 day" / "5 days" (Khmer: "1 ថ្ងៃ" / "5 ថ្ងៃ"). Deliberately not i18next's `count` plurals —
 * those need Intl.PluralRules, which Hermes doesn't reliably ship.
 */
export const formatDays = (n: number) => i18n.t(n === 1 ? 'common.daysOne' : 'common.daysOther', { n });

/**
 * In-app reminders (GET /api/reminders) are written in English by the backend's
 * notificationService.js, from a small fixed set of messages. This recognises those and
 * returns them in the current language; anything unrecognised is shown as sent.
 */
export function localizeReminder(r: { type: string; title: string; body: string }): { title: string; body: string } {
  if (i18n.language !== 'km') return r;
  switch (r.type) {
    case 'period': {
      const days = r.body.match(/start in (\d+) day/);
      const body = /start today/.test(r.body)
        ? i18n.t('reminders.periodToday')
        : days
          ? i18n.t('reminders.periodInDays', { n: Number(days[1]) })
          : r.body;
      return { title: i18n.t('reminders.periodTitle'), body };
    }
    case 'checkin':
      return { title: i18n.t('reminders.checkinTitle'), body: i18n.t('reminders.checkinBody') };
    case 'record':
      return { title: i18n.t('reminders.recordTitle'), body: i18n.t('reminders.recordBody') };
    default:
      return r;
  }
}

const PHASE_KEYS = ['menstrual', 'follicular', 'ovulation', 'luteal'] as const;

/**
 * The backend sends cycle phases as English labels ("Menstrual phase") or keys ("menstrual");
 * this turns either into the current language's name. Unknown values pass through as-is.
 */
export function phaseName(labelOrKey: string): string {
  const key = PHASE_KEYS.find((k) => labelOrKey.toLowerCase().startsWith(k));
  return key ? i18n.t(`phases.${key}`) : labelOrKey;
}

export default i18n;
