import i18n from '@/i18n';

// Labels below are getters, not plain strings, so they're looked up in the current language
// every time a screen reads them (see i18n/locales) — no caller needs to translate them itself.

/**
 * Static mock data powering the UI-only Yumi prototype.
 * Nothing here touches the backend — swap for real API/state once endpoints exist.
 */

export const mockUser = {
  name: 'Amara',
  email: 'amara.teen@example.com',
  avatarInitial: 'A',
  language: 'English',
};

// A fixed "today" so the whole prototype stays consistent between renders.
export const today = new Date(2026, 7, 10); // 10 Aug 2026

export const cycleStats = {
  currentDay: 18,
  averageCycleLength: 28,
  averagePeriodLength: 5,
  lastPeriodStart: new Date(2026, 6, 24), // 24 Jul 2026
  lastPeriodEnd: new Date(2026, 6, 28),
  nextPeriodStart: new Date(2026, 7, 21), // 21 Aug 2026
  nextPeriodEnd: new Date(2026, 7, 25),
  fertileWindowStart: new Date(2026, 7, 6),
  fertileWindowEnd: new Date(2026, 7, 10),
};

export const pastPeriods: { start: Date; end: Date }[] = [
  { start: new Date(2026, 4, 27), end: new Date(2026, 5, 1) },
  { start: new Date(2026, 5, 25), end: new Date(2026, 5, 29) },
  { start: new Date(2026, 6, 24), end: new Date(2026, 6, 28) },
];

export const flowLevels = [
  { key: 'spotting', get label() { return i18n.t('flow.spotting'); }, color: '#F8C2CF' },
  { key: 'light', get label() { return i18n.t('flow.light'); }, color: '#F0A0B5' },
  { key: 'medium', get label() { return i18n.t('flow.medium'); }, color: '#D94667' },
  { key: 'heavy', get label() { return i18n.t('flow.heavy'); }, color: '#AD0E38' },
] as const;

// Final list (locked 2026-08-20) — text-only, no icons/emoji by design. Keys are the values
// actually stored/sent (kebab-case); labels are what's shown. Mirrored on the backend as
// SYMPTOM_OPTIONS in utils/constants.js — update both together if this list ever changes.
export const symptomOptions = [
  { key: 'everything-is-fine', get label() { return i18n.t('symptoms.everything-is-fine'); } },
  { key: 'cramps', get label() { return i18n.t('symptoms.cramps'); } },
  { key: 'tender-breasts', get label() { return i18n.t('symptoms.tender-breasts'); } },
  { key: 'headache', get label() { return i18n.t('symptoms.headache'); } },
  { key: 'acne', get label() { return i18n.t('symptoms.acne'); } },
  { key: 'backache', get label() { return i18n.t('symptoms.backache'); } },
  { key: 'fatigue', get label() { return i18n.t('symptoms.fatigue'); } },
  { key: 'cravings', get label() { return i18n.t('symptoms.cravings'); } },
  { key: 'insomnia', get label() { return i18n.t('symptoms.insomnia'); } },
  { key: 'abdominal-pain', get label() { return i18n.t('symptoms.abdominal-pain'); } },
  { key: 'vaginal-itching', get label() { return i18n.t('symptoms.vaginal-itching'); } },
  { key: 'vaginal-dryness', get label() { return i18n.t('symptoms.vaginal-dryness'); } },
  { key: 'hot-flashes', get label() { return i18n.t('symptoms.hot-flashes'); } },
  { key: 'night-sweats', get label() { return i18n.t('symptoms.night-sweats'); } },
  { key: 'joint-pain', get label() { return i18n.t('symptoms.joint-pain'); } },
  { key: 'brain-fog', get label() { return i18n.t('symptoms.brain-fog'); } },
  { key: 'dry-skin', get label() { return i18n.t('symptoms.dry-skin'); } },
  { key: 'dry-eyes', get label() { return i18n.t('symptoms.dry-eyes'); } },
];

// Final list (locked 2026-08-20) — text-only, no icons/emoji by design. Keys are the values
// actually stored/sent (kebab-case); labels are what's shown. Mirrored on the backend as
// MOOD_OPTIONS in utils/constants.js — update both together if this list ever changes.
export const moodOptions = [
  { key: 'calm', get label() { return i18n.t('moods.calm'); } },
  { key: 'happy', get label() { return i18n.t('moods.happy'); } },
  { key: 'energetic', get label() { return i18n.t('moods.energetic'); } },
  { key: 'frisky', get label() { return i18n.t('moods.frisky'); } },
  { key: 'mood-swings', get label() { return i18n.t('moods.mood-swings'); } },
  { key: 'irritated', get label() { return i18n.t('moods.irritated'); } },
  { key: 'sad', get label() { return i18n.t('moods.sad'); } },
  { key: 'anxious', get label() { return i18n.t('moods.anxious'); } },
  { key: 'depressed', get label() { return i18n.t('moods.depressed'); } },
  { key: 'feeling-guilty', get label() { return i18n.t('moods.feeling-guilty'); } },
  { key: 'obsessive-thoughts', get label() { return i18n.t('moods.obsessive-thoughts'); } },
  { key: 'low-energy', get label() { return i18n.t('moods.low-energy'); } },
  { key: 'apathetic', get label() { return i18n.t('moods.apathetic'); } },
  { key: 'confused', get label() { return i18n.t('moods.confused'); } },
  { key: 'very-self-critical', get label() { return i18n.t('moods.very-self-critical'); } },
];

export type HealthTip = {
  id: string;
  tag: string;
  tagColor: string;
  tagTint: string;
  icon: string;
  iconColor: string;
  iconTint: string;
  title: string;
  body: string;
};

// Shown on the first-time Home screen while a new user has no cycle data of their own yet.
export const healthTips: HealthTip[] = [
  {
    id: 'h1',
    get tag() {
      return i18n.t('healthTips.tags.wellness');
    },
    tagColor: '#3B82F6',
    tagTint: '#EAF1FE',
    icon: 'water-outline',
    iconColor: '#3B82F6',
    iconTint: '#EAF1FE',
    get title() {
      return i18n.t('healthTips.h1.title');
    },
    get body() {
      return i18n.t('healthTips.h1.body');
    },
  },
  {
    id: 'h2',
    get tag() {
      return i18n.t('healthTips.tags.pain');
    },
    tagColor: '#E8A23A',
    tagTint: '#FDF3E3',
    icon: 'thermometer-outline',
    iconColor: '#E8A23A',
    iconTint: '#FDF3E3',
    get title() {
      return i18n.t('healthTips.h2.title');
    },
    get body() {
      return i18n.t('healthTips.h2.body');
    },
  },
];

export type NotificationItem = {
  id: string;
  type: 'period' | 'record' | 'checkin' | 'education';
  title: string;
  body: string;
  time: string;
  read: boolean;
};

export const notifications: NotificationItem[] = [
  {
    id: 'n1',
    type: 'period',
    title: 'Period starting soon',
    body: 'Your next period is estimated to start in 11 days, around Aug 21.',
    time: 'Today · 8:00 AM',
    read: false,
  },
  {
    id: 'n2',
    type: 'checkin',
    title: "How are you feeling today?",
    body: "You haven't checked in yet today — it only takes a few seconds.",
    time: 'Today · 7:00 AM',
    read: false,
  },
  {
    id: 'n3',
    type: 'education',
    title: 'New article for you',
    body: '"5 Period Myths You Should Stop Believing" is ready to read.',
    time: 'Yesterday · 6:15 PM',
    read: false,
  },
  {
    id: 'n4',
    type: 'record',
    title: 'Reminder to log your period',
    body: "Don't forget to record when your last period ended.",
    time: 'Jul 28 · 9:00 AM',
    read: true,
  },
  {
    id: 'n5',
    type: 'education',
    title: 'Hygiene tip of the week',
    body: 'Learn how often you should change your pad or tampon.',
    time: 'Jul 26 · 12:00 PM',
    read: true,
  },
];

export type ChatSource = { sourceId: string; sourceName: string; sourceUrl: string };

export type ChatMessage = {
  id: string;
  from: 'user' | 'yumi';
  text: string;
  time: string;
  /** Only ever set on a real `from: 'yumi'` reply that actually cited something — see assistant.tsx. */
  sources?: ChatSource[];
};

export const chatSuggestions = [
  'Why do I get cramps?',
  'Is my flow normal?',
  'How do I use a tampon?',
  'Why am I moody today?',
];
