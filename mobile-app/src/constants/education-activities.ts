import { Colors } from '@/constants/theme';
import { educationTopics, type IconName } from '@/constants/education-hub';

/**
 * Data behind each topic's interactive activity. Like education-hub.ts, every educational sentence
 * here is the supplied source text verbatim — the activities only decide how it is grouped and
 * revealed. Short UI labels (tile names, button text) and Mira Drop's encouragement lines are the
 * only original copy, and none of them make a medical claim.
 */

/* ------------------------------------------------------------------ Topic 1: puberty timeline */

export const PUBERTY_TIMELINE = {
  ages: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
  // Bands are exactly the ranges stated in the source: 12–13 average, 10–15 normal, 8–17 broad.
  typical: { from: 12, to: 13 },
  normal: { from: 10, to: 15 },
  broad: { from: 8, to: 17 },
  menarche: `A teenager's very first menstrual period is called menarche.`,
  range: `On average, most girls get their first period between ages 12 and 13, but starting anytime between ages 10 and 15 (or more broadly between ages 8 and 17) is clinically normal.`,
};

export type Milestone = { id: string; title: string; icon: IconName; color: string; tint: string; text: string[]; chips?: { label: string; icon: IconName }[] };

export const PUBERTY_MILESTONES: Milestone[] = [
  {
    id: 'signs',
    title: 'Your body gets ready',
    icon: 'flower',
    color: Colors.lavender,
    tint: Colors.lavenderTint,
    chips: [
      { label: 'Breast growth (thelarche)', icon: 'flower-outline' },
      { label: 'Pubic & underarm hair', icon: 'leaf-outline' },
      { label: 'Clear or white discharge', icon: 'water-outline' },
    ],
    text: [
      `Signs that your body is preparing for its first period include breast growth (thelarche), growing pubic and underarm hair, and experiencing clear or white vaginal discharge.`,
    ],
  },
  {
    id: 'two-years',
    title: 'About 2 years later',
    icon: 'time',
    color: Colors.peach,
    tint: Colors.peachTint,
    text: [`Typically, a first period arrives about 2 years after breasts begin developing.`],
  },
  {
    id: 'menarche',
    title: 'Menarche arrives!',
    icon: 'water',
    color: Colors.primary,
    tint: Colors.tint50,
    text: [
      `First periods are often very light and may look like brownish spotting rather than bright red blood.`,
      `For teenagers during the first 1 to 3 years after their first period, normal cycle length ranges between 21 and 45 days because the body's hormonal system is still maturing.`,
    ],
  },
];

export const LEAK_CARD = {
  title: 'Oh no, a leak at school?',
  intro: `Accidental blood leaks on clothing happen to almost everyone and are nothing to feel ashamed about.`,
  steps: [
    `If a leak occurs at school, tying a sweater or jacket around your waist covers the spot until you can change.`,
    `Keep a spare pair of underwear and extra pads in your bag.`,
    `Talking about periods with a parent, trusted teacher, or school nurse helps you get comfortable asking for products or advice whenever you feel unprepared.`,
  ],
};

/* ------------------------------------------------------------------ Topic 3: school kit + products */

export type KitItem = { id: string; label: string; icon: IconName; text: string[] };

export const KIT_ITEMS: KitItem[] = [
  {
    id: 'pads',
    label: 'Extra pads',
    icon: 'bandage-outline',
    text: [
      `To manage periods comfortably at school or away from home, prepare a small discreet kit with extra pads, a plastic disposal bag, and spare underwear.`,
    ],
  },
  {
    id: 'bag',
    label: 'Plastic disposal bag',
    icon: 'bag-handle-outline',
    text: [
      `Used disposable pads should be wrapped securely in toilet paper or their original wrapper and thrown into a trash bin.`,
      `Never flush sanitary pads down the toilet, as they cause plumbing blockages.`,
    ],
  },
  {
    id: 'underwear',
    label: 'Spare underwear',
    icon: 'shirt-outline',
    text: [`Keep a spare pair of underwear and extra pads in your bag.`],
  },
  {
    id: 'cotton',
    label: 'Cotton undies',
    icon: 'happy-outline',
    text: [`Wearing breathable cotton underwear helps keep the genital area dry and reduces moisture buildup.`],
  },
];

export const PRODUCT_COMPARE = {
  title: 'Pad vs. Tampon / Cup',
  paragraphs: [
    `Menstrual products come in different absorbencies and styles to match individual flow levels and daily activities.`,
    `External options like sanitary pads attach to underwear and are easiest for beginners.`,
    `Internal options like tampons and menstrual cups fit inside the vagina and allow swimming or active sports without leaks.`,
    `Choosing the right product depends on comfort, accessibility, flow heaviness, and personal preference, and teenagers can safely use any method they feel comfortable with.`,
  ],
};

export const TSS_WARNING = {
  title: 'TSS safety',
  paragraphs: [
    `Toxic Shock Syndrome (TSS) is a rare but serious bacterial infection linked to menstrual product use, particularly high-absorbency tampons.`,
    `To minimize TSS risk, use the lowest absorbency tampon necessary for your flow, never leave a single tampon inserted for longer than 8 hours, and alternate between tampons and sanitary pads (especially overnight).`,
    `If you develop a sudden high fever, vomiting, dizziness, or a sunburn-like rash while using a tampon, remove it immediately and seek medical care.`,
  ],
};

/* ------------------------------------------------------------------ Topic 4: symptoms + relief */

export type SymptomCard = { id: string; label: string; icon: IconName; color: string; tint: string; why: string[] };

export const SYMPTOM_CARDS: SymptomCard[] = [
  {
    id: 'cramps',
    label: 'Cramps',
    icon: 'flash',
    color: Colors.primary,
    tint: Colors.tint50,
    why: [
      `Period cramps (dysmenorrhea) are a common symptom caused by muscle contractions in the uterus.`,
      `During your period, the body produces chemical signals called prostaglandins that cause the uterine muscles to squeeze and tighten to help shed its lining.`,
      `Higher levels of prostaglandins can lead to stronger, more uncomfortable cramps in the lower abdomen or lower back.`,
      `Mild to moderate cramping on the first few days of a period is normal.`,
    ],
  },
  {
    id: 'bloating',
    label: 'Bloating',
    icon: 'cloud',
    color: Colors.info,
    tint: Colors.infoTint,
    why: [
      `What you eat and drink around your period can influence how severe your cramps and bloating feel.`,
      `Staying well-hydrated by drinking water reduces fluid retention and bloating.`,
      `Reducing high-sodium (salty) snacks, caffeine, and sugary foods in the days leading up to your period helps minimize inflammation and abdominal discomfort.`,
    ],
  },
  {
    id: 'headaches',
    label: 'Headaches',
    icon: 'thunderstorm',
    color: Colors.lavender,
    tint: Colors.lavenderTint,
    why: [
      `In addition to bleeding, common symptoms include abdominal cramps, lower back pain, headaches, fatigue, and mood changes linked to hormonal shifts.`,
      `Menstrual pain is extremely common worldwide, affecting more than 2 out of 3 adolescent girls and women.`,
    ],
  },
  {
    id: 'fatigue',
    label: 'Fatigue',
    icon: 'battery-half',
    color: Colors.peach,
    tint: Colors.peachTint,
    why: [
      `In addition to bleeding, common symptoms include abdominal cramps, lower back pain, headaches, fatigue, and mood changes linked to hormonal shifts.`,
      `Drinking warm liquids and getting enough rest further support cramp relief.`,
    ],
  },
];

export const RELIEF = {
  warmth: {
    label: 'Warm water bottle',
    text: `Placing a warm water bottle or heating pad on your lower stomach or back helps relax contracting uterine muscles.`,
  },
  movement: {
    label: 'Gentle movement',
    text: `Taking a warm bath, engaging in light exercise like walking or stretching, and massaging your lower abdomen can also ease discomfort.`,
  },
  snacks: {
    label: 'Magnesium-rich snacks',
    chips: ['Leafy greens', 'Nuts', 'Seeds'] as const,
    text: `Choosing foods rich in magnesium and omega-3 fatty acids, such as leafy greens, nuts, and seeds, can also support natural muscle relaxation during uterine contractions.`,
  },
  exercise: {
    label: 'Exercise',
    text: `Exercising during your period is safe, healthy, and helpful for managing menstrual symptoms.`,
  },
};

/* ------------------------------------------------------------------ Topic 5: myth-busting stack */

export type MythCard = {
  statement: string;
  isMyth: boolean;
  /** The myth this card is (or, for a true statement, the myth it busts) — shown above the explanation. */
  myth: string;
  explanation: string;
};


// The four myths and their full fact explanations live in education-hub.ts (Topic 5) — read from
// there so the text exists in exactly one place.
const mythsTopic = educationTopics.find((t) => t.id === 'myths-and-facts');
const [{ myth: MYTH_1, fact: FACT_1 }, { myth: MYTH_2, fact: FACT_2 }, { myth: MYTH_3, fact: FACT_3 }, { myth: MYTH_4, fact: FACT_4 }] =
  mythsTopic?.myths ?? [];

// Each myth is paired with a true statement taken word-for-word from the matching fact, so the swipe
// game has both answers to guess between. The alternating order keeps it from being guessable.
export const MYTH_DECK: MythCard[] = [
  { statement: MYTH_1, isMyth: true, myth: MYTH_1, explanation: FACT_1 },
  {
    statement: `Having a period is a normal sign that your reproductive system is healthy.`,
    isMyth: false,
    myth: MYTH_2,
    explanation: FACT_2,
  },
  { statement: MYTH_3, isMyth: true, myth: MYTH_3, explanation: FACT_3 },
  {
    statement: `You do not need to stay home from school when you have your period.`,
    isMyth: false,
    myth: MYTH_4,
    explanation: FACT_4,
  },
  { statement: MYTH_2, isMyth: true, myth: MYTH_2, explanation: FACT_2 },
  {
    statement: `Drinking fresh coconut water or cold water is completely safe, healthy, and helps keep your body hydrated during menstruation.`,
    isMyth: false,
    myth: MYTH_1,
    explanation: FACT_1,
  },
  { statement: MYTH_4, isMyth: true, myth: MYTH_4, explanation: FACT_4 },
  {
    statement: `Taking warm baths or showers during your period is completely safe, helps keep your body clean, prevents unpleasant odors, and relaxes sore muscles.`,
    isMyth: false,
    myth: MYTH_3,
    explanation: FACT_3,
  },
];

/* ------------------------------------------------------------------ Topic 6: traffic light */

export type LightLevel = {
  id: 'green' | 'yellow' | 'red';
  label: string;
  headline: string;
  color: string;
  tint: string;
  icon: IconName;
  /** Sentences shown when this light is opened — all verbatim from the topics above. */
  points: string[];
};

export const TRAFFIC_LIGHTS: LightLevel[] = [
  {
    id: 'green',
    label: 'Green',
    headline: 'Normal fluctuations',
    color: Colors.success,
    tint: Colors.successTint,
    icon: 'happy',
    points: [
      `For teenagers during the first 1 to 3 years after their first period, normal cycle length ranges between 21 and 45 days because the body's hormonal system is still maturing.`,
      `A typical menstrual period usually lasts between 3 and 7 days, and average blood loss is around 2 to 3 tablespoons (30 to 45 milliliters), though this varies from person to person.`,
      `Experiencing clear or white, odorless discharge is completely normal.`,
      `Mild to moderate cramping on the first few days of a period is normal.`,
    ],
  },
  {
    id: 'yellow',
    label: 'Yellow',
    headline: 'Track and monitor',
    color: Colors.warning,
    tint: Colors.warningTint,
    icon: 'eye',
    points: [
      `An irregular period means cycle timing, duration, or flow heaviness changes unpredictably from month to month.`,
      `Oligomenorrhea refers to infrequent periods that occur more than 35 days apart.`,
      `For teenagers, irregular cycles are very common during the first few years after menarche as body hormones balance out, but frequent missed periods should be discussed with a doctor.`,
      `Logging the start and end dates of your bleeding each month allows you to calculate your personal average cycle length and predict upcoming periods.`,
      `Additionally, recording symptom severity, flow heaviness, and mood changes over time provides valuable data to share with a doctor or parent if you ever suspect your cycle is irregular or abnormally painful.`,
      `Tracking mood changes alongside physical symptoms for 2 to 3 consecutive cycles helps healthcare providers distinguish normal PMS from conditions requiring support.`,
    ],
  },
  {
    id: 'red',
    label: 'Red',
    headline: 'Talk to a doctor',
    color: Colors.primary,
    tint: Colors.tint50,
    icon: 'medkit',
    points: [
      `Clinical criteria for evaluating teenage menstrual health require contacting a doctor if any of the following occur: periods consistently occurring less than 21 days apart or more than 45 days apart; periods lasting longer than 7 consecutive days; missing periods for more than 90 days (3 months).`,
      `Amenorrhea is the complete absence of periods—either not starting your first period by age 15, or missing periods for 3 consecutive months when not pregnant.`,
      `Abnormally Heavy Menstrual Bleeding (menorrhagia) is defined as blood loss requiring product change every 1-2 hours.`,
      `Medical red flags include bleeding so heavily that you soak through one or more sanitary pads or tampons every hour for consecutive hours, passing large blood clots, or experiencing periods that last longer than 7 days.`,
      `Bleeding between periods or after sexual activity is also abnormal.`,
      `Key symptoms of anemia include ongoing fatigue, pale skin, weakness, dizziness, and shortness of breath during daily activities. Adolescents experiencing unusually heavy flow alongside constant exhaustion should be evaluated by a healthcare professional.`,
      `If severe menstrual pain (refractory dysmenorrhea) prevents you from attending school or carrying out daily activities despite rest, you should consult a doctor.`,
    ],
  },
];

export const TRAFFIC_LIGHT_EMERGENCY = `If you develop a sudden high fever, vomiting, dizziness, or a sunburn-like rash while using a tampon, remove it immediately and seek medical care.`;
export const TRAFFIC_LIGHT_FOOTER = `Menstrual health is a matter of human rights, personal dignity, and gender equality.`;
