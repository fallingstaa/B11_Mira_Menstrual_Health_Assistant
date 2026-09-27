/**
 * Static mock data powering the UI-only Mira prototype.
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
  { key: 'spotting', label: 'Spotting', color: '#F8C2CF' },
  { key: 'light', label: 'Light', color: '#F0A0B5' },
  { key: 'medium', label: 'Medium', color: '#D94667' },
  { key: 'heavy', label: 'Heavy', color: '#AD0E38' },
] as const;

// Final list (locked 2026-08-20) — text-only, no icons/emoji by design. Keys are the values
// actually stored/sent (kebab-case); labels are what's shown. Mirrored on the backend as
// SYMPTOM_OPTIONS in utils/constants.js — update both together if this list ever changes.
export const symptomOptions = [
  { key: 'everything-is-fine', label: 'Everything is fine' },
  { key: 'cramps', label: 'Cramps' },
  { key: 'tender-breasts', label: 'Tender breasts' },
  { key: 'headache', label: 'Headache' },
  { key: 'acne', label: 'Acne' },
  { key: 'backache', label: 'Backache' },
  { key: 'fatigue', label: 'Fatigue' },
  { key: 'cravings', label: 'Cravings' },
  { key: 'insomnia', label: 'Insomnia' },
  { key: 'abdominal-pain', label: 'Abdominal pain' },
  { key: 'vaginal-itching', label: 'Vaginal itching' },
  { key: 'vaginal-dryness', label: 'Vaginal dryness' },
  { key: 'hot-flashes', label: 'Hot flashes' },
  { key: 'night-sweats', label: 'Night sweats' },
  { key: 'joint-pain', label: 'Joint pain' },
  { key: 'brain-fog', label: 'Brain fog' },
  { key: 'dry-skin', label: 'Dry skin' },
  { key: 'dry-eyes', label: 'Dry eyes' },
];

// Final list (locked 2026-08-20) — text-only, no icons/emoji by design. Keys are the values
// actually stored/sent (kebab-case); labels are what's shown. Mirrored on the backend as
// MOOD_OPTIONS in utils/constants.js — update both together if this list ever changes.
export const moodOptions = [
  { key: 'calm', label: 'Calm' },
  { key: 'happy', label: 'Happy' },
  { key: 'energetic', label: 'Energetic' },
  { key: 'frisky', label: 'Frisky' },
  { key: 'mood-swings', label: 'Mood swings' },
  { key: 'irritated', label: 'Irritated' },
  { key: 'sad', label: 'Sad' },
  { key: 'anxious', label: 'Anxious' },
  { key: 'depressed', label: 'Depressed' },
  { key: 'feeling-guilty', label: 'Feeling guilty' },
  { key: 'obsessive-thoughts', label: 'Obsessive thoughts' },
  { key: 'low-energy', label: 'Low energy' },
  { key: 'apathetic', label: 'Apathetic' },
  { key: 'confused', label: 'Confused' },
  { key: 'very-self-critical', label: 'Very self-critical' },
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
    tag: 'Wellness',
    tagColor: '#3B82F6',
    tagTint: '#EAF1FE',
    icon: 'water-outline',
    iconColor: '#3B82F6',
    iconTint: '#EAF1FE',
    title: 'Stay hydrated!',
    body: 'Drink 8 glasses of water to help reduce bloating.',
  },
  {
    id: 'h2',
    tag: 'Pain',
    tagColor: '#E8A23A',
    tagTint: '#FDF3E3',
    icon: 'thermometer-outline',
    iconColor: '#E8A23A',
    iconTint: '#FDF3E3',
    title: 'Cramp relief',
    body: 'A warm compress on your lower abdomen eases cramps.',
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
  from: 'user' | 'mira';
  text: string;
  time: string;
  /** Only ever set on a real `from: 'mira'` reply that actually cited something — see assistant.tsx. */
  sources?: ChatSource[];
};

export const chatSuggestions = [
  'Why do I get cramps?',
  'Is my flow normal?',
  'How do I use a tampon?',
  'Why am I moody today?',
];
