import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';

/**
 * Education Hub content — the six grounded topics, kept as plain data so the screens/components
 * only decide *how* to present it. Every paragraph below is the supplied source text verbatim;
 * a paragraph is only ever split at a sentence boundary (into steps / wheel phases / two
 * paragraphs) so it reads better in a card, never reworded or shortened.
 */

export type IconName = keyof typeof Ionicons.glyphMap;

export type Source = { label: string; url: string };

export type PhaseSlide = { title: string; icon: IconName; color: string; tint: string; text: string };

/** How a section's text is presented once its accordion is opened. */
export type Section =
  | { id: string; title: string; icon: IconName; kind: 'text'; paragraphs: string[] }
  // `intro` first, then each `steps` entry as its own numbered card.
  | { id: string; title: string; icon: IconName; kind: 'steps'; intro: string; steps: string[] }
  // `intro` first, then one entry per phase (the cycle wheel reads these).
  | { id: string; title: string; icon: IconName; kind: 'phases'; intro: string; slides: PhaseSlide[] };

export type MythItem = { myth: string; fact: string };

export type Topic = {
  id: string;
  title: string;
  icon: IconName;
  color: string;
  tint: string;
  /** Sections rendered as animated accordions. */
  sections: Section[];
  /** Topic 5 only — rendered as tap-to-reveal myth/fact cards instead of accordions. */
  myths?: MythItem[];
  sources: Source[];
};

// NOTE on source URLs: three of the links supplied in the spreadsheet did not resolve when checked
// (2026-09-27) and are corrected below to the working page for the same source —
//   www.int/news-room/...                         -> www.who.int/news-room/...
//   clevelandclinic.org/health/articles/10132-... -> my.clevelandclinic.org/health/articles/10132-...
//   nhs.uk/conditions/periods/period-pain/        -> nhs.uk/symptoms/period-pain/ (NHS moved the page)
const ACOG_VITAL_SIGN: Source = {
  label: 'ACOG Clinical Guidance',
  url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2015/12/menstruation-in-girls-and-adolescents-using-the-menstrual-cycle-as-a-vital-sign',
};
const NHS_STARTING_PERIODS: Source = {
  label: 'NHS Teen Health Advisory',
  url: 'https://www.nhs.uk/conditions/periods/starting-periods/',
};
const CLEVELAND_CYCLE: Source = {
  label: 'Cleveland Clinic',
  url: 'https://my.clevelandclinic.org/health/articles/10132-menstrual-cycle',
};
const WHO_MENSTRUAL_HEALTH: Source = {
  label: 'WHO Menstrual Health Guidelines',
  url: 'https://www.who.int/news-room/fact-sheets/detail/menstrual-health',
};

export const educationTopics: Topic[] = [
  {
    id: 'first-period',
    title: 'Your First Period',
    icon: 'water',
    color: Colors.primary,
    tint: Colors.tint50,
    sections: [
      {
        id: 'menarche',
        title: 'Menarche & Normal Age Range',
        icon: 'calendar-outline',
        kind: 'text',
        paragraphs: [
          `A teenager's very first menstrual period is called menarche. On average, most girls get their first period between ages 12 and 13, but starting anytime between ages 10 and 15 (or more broadly between ages 8 and 17) is clinically normal.`,
        ],
      },
      {
        id: 'puberty-signs',
        title: 'Puberty Signs & Timeline',
        icon: 'flower-outline',
        kind: 'text',
        paragraphs: [
          `Signs that your body is preparing for its first period include breast growth (thelarche), growing pubic and underarm hair, and experiencing clear or white vaginal discharge. Typically, a first period arrives about 2 years after breasts begin developing.`,
        ],
      },
      {
        id: 'what-first-periods-look-like',
        title: 'What First Periods Look Like',
        icon: 'eye-outline',
        kind: 'text',
        paragraphs: [
          `First periods are often very light and may look like brownish spotting rather than bright red blood. For teenagers during the first 1 to 3 years after their first period, normal cycle length ranges between 21 and 45 days because the body's hormonal system is still maturing.`,
        ],
      },
      {
        id: 'leaks-at-school',
        title: 'Handling Leaks at School',
        icon: 'school-outline',
        kind: 'steps',
        intro: `Accidental blood leaks on clothing happen to almost everyone and are nothing to feel ashamed about.`,
        steps: [
          `If a leak occurs at school, tying a sweater or jacket around your waist covers the spot until you can change.`,
          `Keep a spare pair of underwear and extra pads in your bag.`,
          `Talking about periods with a parent, trusted teacher, or school nurse helps you get comfortable asking for products or advice whenever you feel unprepared.`,
        ],
      },
    ],
    sources: [ACOG_VITAL_SIGN, NHS_STARTING_PERIODS],
  },
  {
    id: 'understanding-your-cycle',
    title: 'Understanding Your Cycle',
    icon: 'calendar',
    color: Colors.lavender,
    tint: Colors.lavenderTint,
    sections: [
      {
        id: 'cycle-basics',
        title: 'Cycle Definition & Basics',
        icon: 'sync-outline',
        kind: 'text',
        paragraphs: [
          `The menstrual cycle is the monthly sequence of changes a body undergoes to prepare for a possible pregnancy. Each month, an ovary releases an egg, and hormones cause the lining of the uterus (womb) to thicken. If the egg is not fertilized, the body sheds this extra uterine lining through the vagina as a menstrual period. Day 1 of your cycle is the very first day your period bleeding begins. A typical menstrual period usually lasts between 3 and 7 days, and average blood loss is around 2 to 3 tablespoons (30 to 45 milliliters), though this varies from person to person.`,
        ],
      },
      {
        id: 'four-phases',
        title: 'The Four Phases',
        icon: 'moon-outline',
        kind: 'phases',
        intro: `The menstrual cycle is divided into four distinct phases: the menstrual phase, the follicular phase, ovulation, and the luteal phase.`,
        slides: [
          {
            title: 'Menstrual phase',
            icon: 'water',
            color: Colors.primary,
            tint: Colors.tint50,
            text: `The menstrual phase begins on Day 1 when period bleeding starts as the uterine lining sheds.`,
          },
          {
            title: 'Follicular phase',
            icon: 'leaf',
            color: Colors.lavender,
            tint: Colors.lavenderTint,
            text: `During the follicular phase, hormones signal the ovaries to develop a fluid-filled sac containing an egg while the uterine lining thickens.`,
          },
          {
            title: 'Ovulation',
            icon: 'sunny',
            color: Colors.peach,
            tint: Colors.peachTint,
            text: `Ovulation occurs mid-cycle when the mature egg is released from the ovary into the fallopian tube.`,
          },
          {
            title: 'Luteal phase',
            icon: 'moon',
            color: Colors.teal,
            tint: Colors.tealTint,
            text: `Finally, during the luteal phase, hormones maintain the thick lining; if pregnancy does not occur, hormone levels drop, triggering the start of the next period.`,
          },
        ],
      },
      {
        id: 'discharge',
        title: 'Vaginal Discharge Fluctuations',
        icon: 'water-outline',
        kind: 'text',
        paragraphs: [
          `Vaginal discharge changes in color, texture, and amount throughout different phases of your menstrual cycle. Immediately after your period, discharge is typically minimal. Mid-cycle near ovulation, increased estrogen causes discharge to become clear, slippery, and stretchy (similar to raw egg whites). During the luteal phase, discharge becomes thicker and white. Experiencing clear or white, odorless discharge is completely normal.`,
        ],
      },
      {
        id: 'tracking-tools',
        title: 'Tracking Tools',
        icon: 'phone-portrait-outline',
        kind: 'text',
        paragraphs: [
          `Digital period tracking apps and paper calendars are effective tools for monitoring menstrual health. Logging the start and end dates of your bleeding each month allows you to calculate your personal average cycle length and predict upcoming periods. Additionally, recording symptom severity, flow heaviness, and mood changes over time provides valuable data to share with a doctor or parent if you ever suspect your cycle is irregular or abnormally painful.`,
        ],
      },
    ],
    sources: [CLEVELAND_CYCLE, NHS_STARTING_PERIODS],
  },
  {
    id: 'period-hygiene',
    title: 'Period Hygiene',
    icon: 'sparkles',
    color: Colors.teal,
    tint: Colors.tealTint,
    sections: [
      {
        id: 'daily-washing',
        title: 'Daily Washing & Vulva Care',
        icon: 'water-outline',
        kind: 'text',
        paragraphs: [
          `Proper daily hygiene during your period protects against bacterial infections and skin irritation. Wash the external genital area (the vulva) once or twice daily with clean, warm water or a mild, unscented soap. Never use harsh soaps, scented body washes, or douching products, and never clean inside the vagina. The vagina is self-cleaning, and internal washing alters natural pH levels, increasing the risk of yeast infections and bacterial vaginosis.`,
        ],
      },
      {
        id: 'pad-changing',
        title: 'Pad Changing & Hand Hygiene',
        icon: 'hand-left-outline',
        kind: 'text',
        paragraphs: [
          `Sanitary pads should be changed every 4 to 8 hours, or sooner if the flow is heavy, to prevent odor buildup and bacterial growth. Always wash your hands before and after changing any menstrual product. When using the bathroom or changing a pad, wipe strictly from front to back (from the vagina toward the anus). Wiping from back to front can transfer harmful intestinal bacteria into the urethra or vagina, causing urinary tract infections (UTIs).`,
        ],
      },
      {
        id: 'disposal-kits',
        title: 'Disposal & School Kits',
        icon: 'bag-handle-outline',
        kind: 'text',
        paragraphs: [
          `To manage periods comfortably at school or away from home, prepare a small discreet kit with extra pads, a plastic disposal bag, and spare underwear. Used disposable pads should be wrapped securely in toilet paper or their original wrapper and thrown into a trash bin. Never flush sanitary pads down the toilet, as they cause plumbing blockages. Wearing breathable cotton underwear helps keep the genital area dry and reduces moisture buildup.`,
        ],
      },
      {
        id: 'product-types-tss',
        title: 'Product Types & TSS Safety',
        icon: 'shield-checkmark-outline',
        kind: 'text',
        paragraphs: [
          `Menstrual products come in different absorbencies and styles to match individual flow levels and daily activities. External options like sanitary pads attach to underwear and are easiest for beginners. Internal options like tampons and menstrual cups fit inside the vagina and allow swimming or active sports without leaks. Choosing the right product depends on comfort, accessibility, flow heaviness, and personal preference, and teenagers can safely use any method they feel comfortable with.`,
          `Toxic Shock Syndrome (TSS) is a rare but serious bacterial infection linked to menstrual product use, particularly high-absorbency tampons. To minimize TSS risk, use the lowest absorbency tampon necessary for your flow, never leave a single tampon inserted for longer than 8 hours, and alternate between tampons and sanitary pads (especially overnight). If you develop a sudden high fever, vomiting, dizziness, or a sunburn-like rash while using a tampon, remove it immediately and seek medical care.`,
        ],
      },
      {
        id: 'reusable-products',
        title: 'Reusable Products Care',
        icon: 'refresh-circle-outline',
        kind: 'text',
        paragraphs: [
          `Reusable menstrual products, such as reusable cloth pads or silicone menstrual cups, require strict cleaning procedures to prevent infections. Reusable pads should be rinsed in cold water first, washed thoroughly with soap and warm water, and dried completely in direct sunlight or a well-ventilated area before reuse. Menstrual cups must be emptied every 8 to 12 hours, washed with clean water and mild unscented soap during your period, and boiled in water between cycles to sanitize them completely.`,
        ],
      },
    ],
    sources: [
      { label: 'CDC Menstrual Hygiene Guidelines', url: 'https://www.cdc.gov/hygiene/about/menstrual-hygiene.html' },
      WHO_MENSTRUAL_HEALTH,
    ],
  },
  {
    id: 'period-symptoms',
    title: 'Period Symptoms',
    icon: 'bandage',
    color: Colors.peach,
    tint: Colors.peachTint,
    sections: [
      {
        id: 'cramps',
        title: 'Cramps & Prostaglandins',
        icon: 'flash-outline',
        kind: 'text',
        paragraphs: [
          `Period cramps (dysmenorrhea) are a common symptom caused by muscle contractions in the uterus. During your period, the body produces chemical signals called prostaglandins that cause the uterine muscles to squeeze and tighten to help shed its lining. Higher levels of prostaglandins can lead to stronger, more uncomfortable cramps in the lower abdomen or lower back. Mild to moderate cramping on the first few days of a period is normal.`,
        ],
      },
      {
        id: 'prevalence-pms',
        title: 'Global Prevalence & PMS',
        icon: 'globe-outline',
        kind: 'text',
        paragraphs: [
          `Menstrual pain is extremely common worldwide, affecting more than 2 out of 3 adolescent girls and women. In addition to bleeding, common symptoms include abdominal cramps, lower back pain, headaches, fatigue, and mood changes linked to hormonal shifts.`,
          `Premenstrual Syndrome (PMS) involves physical and emotional changes that happen in the days before your period starts. While mild mood swings, irritability, and sadness are common due to fluctuating progesterone and estrogen levels, severe emotional distress that interferes with daily life or relationships may indicate Premenstrual Dysphoric Disorder (PMDD). Tracking mood changes alongside physical symptoms for 2 to 3 consecutive cycles helps healthcare providers distinguish normal PMS from conditions requiring support.`,
        ],
      },
      {
        id: 'home-relief',
        title: 'Home Relief Methods',
        icon: 'flame-outline',
        kind: 'steps',
        intro: `Mild to moderate period cramps can be managed at home using simple warmth and gentle movement.`,
        steps: [
          `Placing a warm water bottle or heating pad on your lower stomach or back helps relax contracting uterine muscles.`,
          `Taking a warm bath, engaging in light exercise like walking or stretching, and massaging your lower abdomen can also ease discomfort.`,
          `Drinking warm liquids and getting enough rest further support cramp relief.`,
        ],
      },
      {
        id: 'diet-nutrition',
        title: 'Diet & Nutrition',
        icon: 'nutrition-outline',
        kind: 'text',
        paragraphs: [
          `What you eat and drink around your period can influence how severe your cramps and bloating feel. Staying well-hydrated by drinking water reduces fluid retention and bloating. Reducing high-sodium (salty) snacks, caffeine, and sugary foods in the days leading up to your period helps minimize inflammation and abdominal discomfort. Choosing foods rich in magnesium and omega-3 fatty acids, such as leafy greens, nuts, and seeds, can also support natural muscle relaxation during uterine contractions.`,
        ],
      },
      {
        id: 'exercise',
        title: 'Exercise Benefits',
        icon: 'walk-outline',
        kind: 'text',
        paragraphs: [
          `Exercising during your period is safe, healthy, and helpful for managing menstrual symptoms. Physical activity causes your brain to release endorphins, which act as natural pain relievers and mood boosters. Gentle exercises like walking, swimming, cycling, or yoga can relieve pelvic pressure and ease cramp intensity. You do not need to rest continuously or avoid sports during your period unless severe pain or dizziness prevents safe physical movement.`,
        ],
      },
    ],
    sources: [
      CLEVELAND_CYCLE,
      { label: 'ACOG Clinical Guidance', url: 'https://www.acog.org/womens-health/faqs/premenstrual-syndrome' },
      NHS_STARTING_PERIODS,
      { label: 'NHS Teen Health Advisory (period pain)', url: 'https://www.nhs.uk/symptoms/period-pain/' },
      WHO_MENSTRUAL_HEALTH,
    ],
  },
  {
    id: 'myths-and-facts',
    title: 'Myths & Facts',
    icon: 'help-circle',
    color: Colors.primaryLight,
    tint: Colors.tint100,
    sections: [],
    myths: [
      {
        myth: `Common local beliefs in Cambodia suggest that eating sour or cold foods—such as green mangoes, pickles, or ice water—during your period will freeze or stop your menstrual flow.`,
        fact: `Medical science confirms this is untrue. What you eat and drink does not freeze or block blood flow in the uterus. Drinking fresh coconut water or cold water is completely safe, healthy, and helps keep your body hydrated during menstruation. You can eat your regular diet without fear during your period.`,
      },
      {
        myth: `Menstrual blood is "dirty," "toxic," or dangerous body waste.`,
        fact: `Menstrual blood is not "dirty," "toxic," or dangerous body waste—it is simply the natural shedding of the healthy lining that your body built up to support a potential pregnancy. Having a period is a normal sign that your reproductive system is healthy. Bathing, washing your hair, playing sports, and interacting with friends or boys during your period will not cause illness, disease, or unexpected pregnancy. Menstruation is a normal biological process, not something shameful to hide.`,
      },
      {
        myth: `Bathing or washing your hair causes illness or abnormal flow.`,
        fact: `A widespread misconception is that washing your hair or taking a full shower during your period will cause blood clotting, illness, or abnormal flow. Medical science confirms that water touching your body or scalp has no effect on internal uterine bleeding or hormone levels. Taking warm baths or showers during your period is completely safe, helps keep your body clean, prevents unpleasant odors, and relaxes sore muscles.`,
      },
      {
        myth: `You must stay home and miss school during your period.`,
        fact: `Many teenage girls miss school during their periods due to fear of unexpected blood stains, lack of changing facilities, or cramps. You do not need to stay home from school when you have your period. Carrying 2 to 3 spare pads and a small plastic bag in your school bag ensures you are prepared. If you experience cramps or feel unwell during class, speak privately with a trusted female teacher or school nurse for support so you can continue your education comfortably without falling behind. Breaking the silence around menstruation starts with open, supportive communication.`,
      },
    ],
    sources: [{ label: 'UNICEF Cambodia MHM Program', url: 'https://www.unicef.org/cambodia/stories/lets-talk-about-periods' }],
  },
  {
    id: 'when-to-ask-for-help',
    title: 'When Should I Ask for Help?',
    icon: 'alert-circle',
    color: Colors.warning,
    tint: Colors.warningTint,
    sections: [
      {
        id: 'irregularity',
        title: 'Irregularity & Cycle Red Flags',
        icon: 'calendar-clear-outline',
        kind: 'text',
        paragraphs: [
          `An irregular period means cycle timing, duration, or flow heaviness changes unpredictably from month to month. Common forms of irregularity include amenorrhea and oligomenorrhea. Amenorrhea is the complete absence of periods—either not starting your first period by age 15, or missing periods for 3 consecutive months when not pregnant. Oligomenorrhea refers to infrequent periods that occur more than 35 days apart. For teenagers, irregular cycles are very common during the first few years after menarche as body hormones balance out, but frequent missed periods should be discussed with a doctor.`,
          `Clinical criteria for evaluating teenage menstrual health require contacting a doctor if any of the following occur: periods consistently occurring less than 21 days apart or more than 45 days apart; periods lasting longer than 7 consecutive days; missing periods for more than 90 days (3 months).`,
        ],
      },
      {
        id: 'heavy-bleeding',
        title: 'Heavy Bleeding & Anemia Red Flags',
        icon: 'water',
        kind: 'text',
        paragraphs: [
          `Abnormally Heavy Menstrual Bleeding (menorrhagia) is defined as blood loss requiring product change every 1-2 hours. Medical red flags include bleeding so heavily that you soak through one or more sanitary pads or tampons every hour for consecutive hours, passing large blood clots, or experiencing periods that last longer than 7 days. Bleeding between periods or after sexual activity is also abnormal.`,
          `Heavy menstrual bleeding can significantly drain body iron stores over time, increasing the risk of microcytic iron deficiency anemia. Globally, anemia affects nearly one-third of women and adolescent girls. Key symptoms of anemia include ongoing fatigue, pale skin, weakness, dizziness, and shortness of breath during daily activities. Adolescents experiencing unusually heavy flow alongside constant exhaustion should be evaluated by a healthcare professional.`,
        ],
      },
      {
        id: 'pain-infection',
        title: 'Severe Pain Red Flags',
        icon: 'medkit-outline',
        kind: 'text',
        paragraphs: [
          `If severe menstrual pain (refractory dysmenorrhea) prevents you from attending school or carrying out daily activities despite rest, you should consult a doctor. Menstrual health is a matter of human rights, personal dignity, and gender equality.`,
        ],
      },
    ],
    sources: [
      { label: 'Cleveland Clinic', url: 'https://my.clevelandclinic.org/health/diseases/14633-abnormal-menstruation-periods' },
      ACOG_VITAL_SIGN,
      WHO_MENSTRUAL_HEALTH,
      NHS_STARTING_PERIODS,
    ],
  },
];

export function getEducationTopic(id: string | undefined): Topic | undefined {
  return educationTopics.find((t) => t.id === id);
}
