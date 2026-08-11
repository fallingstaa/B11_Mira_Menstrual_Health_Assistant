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
  { key: 'light', label: 'Light', color: '#F0A0B5' },
  { key: 'medium', label: 'Medium', color: '#D94667' },
  { key: 'heavy', label: 'Heavy', color: '#AD0E38' },
] as const;

export const symptomOptions = [
  { key: 'cramps', label: 'Cramps', icon: '🤕' },
  { key: 'headache', label: 'Headache', icon: '🤯' },
  { key: 'bloating', label: 'Bloating', icon: '🎈' },
  { key: 'fatigue', label: 'Fatigue', icon: '😴' },
  { key: 'acne', label: 'Acne', icon: '🌱' },
  { key: 'backache', label: 'Backache', icon: '🦴' },
  { key: 'nausea', label: 'Nausea', icon: '🤢' },
  { key: 'tender', label: 'Tender chest', icon: '💗' },
];

export const moodOptions = [
  { key: 'happy', label: 'Happy', icon: '😊' },
  { key: 'calm', label: 'Calm', icon: '😌' },
  { key: 'sad', label: 'Sad', icon: '😢' },
  { key: 'anxious', label: 'Anxious', icon: '😟' },
  { key: 'irritable', label: 'Irritable', icon: '😤' },
  { key: 'tired', label: 'Tired', icon: '🥱' },
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

export type Article = {
  id: string;
  category: 'Basics' | 'Hygiene' | 'Symptoms' | 'Myths';
  title: string;
  summary: string;
  readTime: string;
  emoji: string;
  color: string;
  tint: string;
  body: string[];
};

export const articles: Article[] = [
  {
    id: 'a1',
    category: 'Basics',
    title: 'What Actually Happens During Your Period?',
    summary: 'A simple, judgement-free walkthrough of the menstrual cycle.',
    readTime: '4 min read',
    emoji: '🩸',
    color: '#AD0E38',
    tint: '#FDF1F4',
    body: [
      'Your menstrual cycle is your body\'s natural, healthy monthly process — it is not something to be embarrassed about.',
      'On average a cycle lasts about 28 days, but anywhere from 21 to 35 days is completely normal, especially in your first few years of getting your period.',
      'The "period" itself — when you bleed — usually lasts 3 to 7 days. Mira tracks this for you automatically once you start logging.',
    ],
  },
  {
    id: 'a2',
    category: 'Hygiene',
    title: 'Pad, Tampon, or Cup? Finding What Works',
    summary: 'A friendly comparison of period products for beginners.',
    readTime: '5 min read',
    emoji: '🧼',
    color: '#2FB8A6',
    tint: '#E7F8F5',
    body: [
      'There is no single "right" period product — it is about what feels comfortable and safe for you.',
      'Pads are the easiest to start with: stick them to your underwear and change every 4–6 hours.',
      'Tampons and cups take a little practice but can be great for sports or swimming once you feel ready.',
    ],
  },
  {
    id: 'a3',
    category: 'Hygiene',
    title: 'How Often Should You Change Your Pad?',
    summary: 'Simple rules to stay fresh, comfortable, and healthy.',
    readTime: '3 min read',
    emoji: '🕒',
    color: '#2FB8A6',
    tint: '#E7F8F5',
    body: [
      'As a rule of thumb, change your pad every 4–6 hours, even on lighter days.',
      'Always wash your hands before and after, and dispose of used products wrapped in tissue or a bag.',
      'If in doubt — change it. There is no such thing as "too often".',
    ],
  },
  {
    id: 'a4',
    category: 'Symptoms',
    title: 'Cramps 101: Why They Happen & What Helps',
    summary: 'Understand period pain and gentle ways to ease it.',
    readTime: '4 min read',
    emoji: '🤕',
    color: '#E8A23A',
    tint: '#FDF3E3',
    body: [
      'Cramps happen because your uterus contracts to help shed its lining — that muscle activity can feel like a dull ache or sharp pinch.',
      'A warm compress, gentle stretching, staying hydrated, and light movement can all help.',
      'If pain ever stops you from going about your day, it is worth talking to a trusted adult or doctor.',
    ],
  },
  {
    id: 'a5',
    category: 'Symptoms',
    title: 'Mood Swings Are Real — Here\'s Why',
    summary: 'The hormone science behind feeling extra emotional.',
    readTime: '3 min read',
    emoji: '💗',
    color: '#E8A23A',
    tint: '#FDF3E3',
    body: [
      'Hormones like estrogen and progesterone rise and fall throughout your cycle, and that can affect your mood.',
      'Feeling extra sensitive, tired, or irritable before your period is common and has a name: PMS.',
      'Logging your mood in Mira helps you notice your own patterns over time.',
    ],
  },
  {
    id: 'a6',
    category: 'Myths',
    title: '5 Period Myths You Should Stop Believing',
    summary: 'Busting common misconceptions with real facts.',
    readTime: '4 min read',
    emoji: '🚫',
    color: '#8B7CF6',
    tint: '#F0EDFE',
    body: [
      'Myth: you can\'t swim on your period. Fact: you absolutely can, with the right product.',
      'Myth: periods should always be exactly 28 days apart. Fact: cycles vary, especially in your first couple of years.',
      'Myth: period blood is "dirty". Fact: it is simply blood and tissue from your uterine lining.',
    ],
  },
];

export type ChatMessage = {
  id: string;
  from: 'user' | 'mira';
  text: string;
  time: string;
};

export const initialChat: ChatMessage[] = [
  {
    id: 'c1',
    from: 'mira',
    text: "Hi Amara! I'm Mira 🩷 I'm here to answer any period or body questions — no question is too weird!",
    time: '9:41 AM',
  },
  {
    id: 'c2',
    from: 'user',
    text: 'Is it normal for my cycle to be a bit different every month?',
    time: '9:42 AM',
  },
  {
    id: 'c3',
    from: 'mira',
    text: 'Totally normal! Especially in your first few years of getting your period, cycles can range from 21–35 days. Mira will keep learning your pattern the more you log 💫',
    time: '9:42 AM',
  },
];

export const chatSuggestions = [
  'Why do I get cramps?',
  'Is my flow normal?',
  'How do I use a tampon?',
  'Why am I moody today?',
];
