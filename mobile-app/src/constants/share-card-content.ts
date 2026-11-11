/**
 * Content for the Daily Share Card (app/share-card.tsx). Each entry has English and Khmer text.
 *
 * Rules for anything added here:
 * - Health facts, tips and myth/fact cards must say only what the verified Education Hub content
 *   already says (constants/education-hub.ts) — just shorter and in a friendlier voice. No new
 *   medical claims.
 * - Short enough to read at a glance on a Story; suitable for young teens.
 * - No body shaming, nothing sexual, and never anything from the user's own cycle records.
 */

export type ShareCardKind = 'quote' | 'fact' | 'tip' | 'myth' | 'selfcare';

type Text = {
  /** The main line. For a myth card this is the myth. */
  text: string;
  /** Second line — the fact, for a myth card. */
  sub?: string;
};

/** `season: 'christmas'` items only appear while Christmas mode is on. */
export type ShareCardItem = { id: string; kind: ShareCardKind; en: Text; km: Text; season?: 'christmas' };

export const SHARE_CARD_ITEMS: ShareCardItem[] = [
  // ------------------------------------------------------------------ quotes
  { id: 'q1', kind: 'quote', en: { text: 'Pretty girls know their cycle. 💅' }, km: { text: 'ស្រីស្អាត ស្គាល់វដ្តរដូវខ្លួនឯង។ 💅' } },
  { id: 'q2', kind: 'quote', en: { text: "Period or not, you're still THAT girl." }, km: { text: 'មករដូវ ឬអត់ ក៏អ្នកនៅតែជា THAT girl ដដែល។' } },
  { id: 'q3', kind: 'quote', en: { text: 'Your body, your rules, your glow. ✨' }, km: { text: 'រាងកាយរបស់អ្នក ច្បាប់របស់អ្នក ពន្លឺរបស់អ្នក។ ✨' } },
  { id: 'q4', kind: 'quote', en: { text: 'Being a girl is powerful. Never forget that.' }, km: { text: 'ការកើតជាស្រីគឺខ្លាំងណាស់។ កុំភ្លេចណា។' } },
  { id: 'q5', kind: 'quote', en: { text: 'Main character energy, even on period days.' }, km: { text: 'ថាមពលតួឯក សូម្បីតែថ្ងៃមករដូវ។' } },
  { id: 'q6', kind: 'quote', en: { text: 'A little blood never makes you less beautiful.' }, km: { text: 'ឈាមបន្តិចបន្តួច មិនធ្វើឱ្យអ្នកស្អាតតិចទេ។' } },
  { id: 'q7', kind: 'quote', en: { text: 'Know your body. Own your confidence.' }, km: { text: 'ស្គាល់រាងកាយខ្លួនឯង។ ម្ចាស់លើទំនុកចិត្តខ្លួនឯង។' } },
  { id: 'q8', kind: 'quote', en: { text: "She's not moody, she's just listening to her body." }, km: { text: 'នាងមិនមែនអារម្មណ៍មិនល្អទេ នាងគ្រាន់តែស្តាប់រាងកាយខ្លួនឯង។' } },
  { id: 'q9', kind: 'quote', en: { text: "Periods are natural. Being ashamed isn't." }, km: { text: 'រដូវជារឿងធម្មជាតិ។ ការខ្មាស់អៀន មិនមែនទេ។' } },
  { id: 'q10', kind: 'quote', en: { text: 'Hot girls take care of themselves. 💖' }, km: { text: 'ស្រីឡូយ ចេះថែខ្លួនឯង។ 💖' } },
  { id: 'q11', kind: 'quote', en: { text: 'Soft heart, strong girl.' }, km: { text: 'ចិត្តទន់ តែជាស្រីខ្លាំង។' } },
  { id: 'q12', kind: 'quote', en: { text: 'Cramps? Still slaying. 👑' }, km: { text: 'ឈឺពោះ? នៅតែឡូយដដែល។ 👑' } },

  // ------------------------------------------------------------------ facts (from Education Hub)
  { id: 'f1', kind: 'fact', en: { text: 'A typical period lasts about 3 to 7 days.' }, km: { text: 'រដូវធម្មតាមានរយៈពេលប្រហែល 3 ទៅ 7 ថ្ងៃ។' } },
  {
    id: 'f2',
    kind: 'fact',
    en: { text: 'In the first 1–3 years after your first period, cycles of 21 to 45 days are normal.' },
    km: { text: 'ក្នុង 1–3 ឆ្នាំដំបូងក្រោយមករដូវលើកដំបូង វដ្តពី 21 ទៅ 45 ថ្ងៃ គឺជារឿងធម្មតា។' },
  },
  { id: 'f3', kind: 'fact', en: { text: 'Clear or white discharge with no smell is completely normal.' }, km: { text: 'ទឹករំអិលថ្លា ឬពណ៌ស គ្មានក្លិន គឺធម្មតាទាំងស្រុង។' } },
  {
    id: 'f4',
    kind: 'fact',
    en: { text: 'Cramps happen because your uterus squeezes to shed its lining. Mild cramps on the first days are normal.' },
    km: { text: 'ការឈឺពោះកើតឡើងដោយសារស្បូនរួញ ដើម្បីបញ្ចេញស្រទាប់របស់វា។ ឈឺស្រាលៗនៅថ្ងៃដំបូងៗ គឺធម្មតា។' },
  },
  { id: 'f5', kind: 'fact', en: { text: "Exercise releases endorphins — your body's natural pain relievers." }, km: { text: 'ការហាត់ប្រាណបញ្ចេញអង់ដូហ្វីន — ថ្នាំបំបាត់ការឈឺចាប់ធម្មជាតិរបស់រាងកាយ។' } },
  {
    id: 'f6',
    kind: 'fact',
    en: { text: 'Most girls get their first period at 12–13, but anywhere from 10 to 15 is normal.' },
    km: { text: 'ក្មេងស្រីភាគច្រើនមករដូវដំបូងនៅអាយុ 12–13 ឆ្នាំ ប៉ុន្តែពី 10 ដល់ 15 ឆ្នាំ ក៏ធម្មតាដែរ។' },
  },
  { id: 'f7', kind: 'fact', en: { text: 'The average period is only about 2–3 tablespoons of blood.' }, km: { text: 'ឈាមរដូវជាមធ្យម មានត្រឹមតែប្រហែល 2–3 ស្លាបព្រាបាយប៉ុណ្ណោះ។' } },
  { id: 'f8', kind: 'fact', en: { text: 'Period pain affects more than 2 out of 3 girls and women. You are not alone.' }, km: { text: 'ការឈឺចាប់ពេលមករដូវ ប៉ះពាល់ក្មេងស្រី និងស្ត្រីច្រើនជាង 2 នាក់ក្នុង 3 នាក់។ អ្នកមិននៅម្នាក់ឯងទេ។' } },

  // ------------------------------------------------------------------ hygiene tips (from Education Hub)
  { id: 't1', kind: 'tip', en: { text: 'Change your pad every 4–8 hours — sooner on heavy days.' }, km: { text: 'ប្តូរសំឡីអនាម័យរៀងរាល់ 4–8 ម៉ោង — ឆាប់ជាងនេះនៅថ្ងៃឈាមច្រើន។' } },
  { id: 't2', kind: 'tip', en: { text: 'Always wipe front to back. Your body will thank you.' }, km: { text: 'ជូតពីមុខទៅក្រោយជានិច្ច។ រាងកាយអ្នកនឹងអរគុណ។' } },
  {
    id: 't3',
    kind: 'tip',
    en: { text: 'Wash only the outside with warm water or mild, unscented soap. Your vagina cleans itself.' },
    km: { text: 'លាងតែខាងក្រៅ ដោយទឹកក្តៅឧណ្ហៗ ឬសាប៊ូស្រាលគ្មានក្លិន។ ទ្វារមាសសម្អាតខ្លួនឯងបាន។' },
  },
  { id: 't4', kind: 'tip', en: { text: 'Pack a mini kit: extra pads, a small plastic bag, spare undies. Ready for anything.' }, km: { text: 'រៀបចំកញ្ចប់តូច៖ សំឡីអនាម័យបន្ថែម ថង់ប្លាស្ទិកតូច ខោទ្រនាប់បម្រុង។ ត្រៀមរួចរាល់គ្រប់ពេល។' } },
  { id: 't5', kind: 'tip', en: { text: 'Never flush pads. Wrap them up and bin them.' }, km: { text: 'កុំបង្ហូរសំឡីអនាម័យចូលបង្គន់។ រុំវាឱ្យជិត ហើយបោះចូលធុងសំរាម។' } },
  { id: 't6', kind: 'tip', en: { text: 'Breathable cotton underwear keeps you fresh and dry.' }, km: { text: 'ខោទ្រនាប់កប្បាសដែលខ្យល់ចេញចូលបាន ជួយឱ្យអ្នកស្រស់ និងស្ងួត។' } },

  // ------------------------------------------------------------------ myth vs fact (from Education Hub topic 5)
  {
    id: 'm1',
    kind: 'myth',
    en: { text: 'Cold water or sour fruit stops your period.', sub: "Food can't freeze or block your flow. Cold water and coconut water are totally safe." },
    km: { text: 'ទឹកត្រជាក់ ឬផ្លែឈើជូរ ធ្វើឱ្យឈាមរដូវឈប់។', sub: 'អាហារមិនអាចធ្វើឱ្យឈាមរដូវកក ឬស្ទះបានទេ។ ទឹកត្រជាក់ និងទឹកដូង មានសុវត្ថិភាពទាំងស្រុង។' },
  },
  {
    id: 'm2',
    kind: 'myth',
    en: { text: "You can't wash your hair during your period.", sub: 'Showers and hair washing are completely safe — and they feel amazing.' },
    km: { text: 'មិនអាចកក់សក់ពេលមករដូវទេ។', sub: 'ការងូតទឹក និងកក់សក់ មានសុវត្ថិភាពទាំងស្រុង — ហើយស្រួលខ្លួនទៀតផង។' },
  },
  {
    id: 'm3',
    kind: 'myth',
    en: { text: 'Period blood is dirty.', sub: "It's the healthy lining of your uterus. Nothing dirty about it." },
    km: { text: 'ឈាមរដូវកខ្វក់។', sub: 'វាជាស្រទាប់ស្បូនដែលមានសុខភាពល្អ។ គ្មានអ្វីកខ្វក់ទេ។' },
  },
  {
    id: 'm4',
    kind: 'myth',
    en: { text: 'You should skip school on your period.', sub: 'Pack 2–3 spare pads, go to class, and slay your day.' },
    km: { text: 'គួរឈប់រៀនពេលមករដូវ។', sub: 'យកសំឡីអនាម័យបម្រុង 2–3 ទៅសាលា ហើយធ្វើថ្ងៃនេះឱ្យឡូយ។' },
  },

  // ------------------------------------------------------------------ self-care
  { id: 's1', kind: 'selfcare', en: { text: 'A warm bottle on your tummy = instant cramp comfort.' }, km: { text: 'ដបទឹកក្តៅលើពោះ = បន្ធូរការឈឺពោះភ្លាមៗ។' } },
  { id: 's2', kind: 'selfcare', en: { text: 'Drink your water, queen. Less bloating, more glowing. 💧' }, km: { text: 'ផឹកទឹកឱ្យបានច្រើន ម្ចាស់ក្សត្រី។ ហើមពោះតិច ស្រស់ថ្លាច្រើន។ 💧' } },
  { id: 's3', kind: 'selfcare', en: { text: 'Rest is productive too. Take the nap.' }, km: { text: 'ការសម្រាកក៏សំខាន់ដែរ។ គេងបន្តិចទៅ។' } },
  { id: 's4', kind: 'selfcare', en: { text: 'A little walk or stretch can ease cramps.' }, km: { text: 'ដើរបន្តិច ឬលាតសន្ធឹងខ្លួន អាចជួយបន្ធូរការឈឺពោះ។' } },
  { id: 's5', kind: 'selfcare', en: { text: 'Tracking your cycle is self-love. 📅' }, km: { text: 'ការតាមដានវដ្តរដូវ គឺជាការស្រឡាញ់ខ្លួនឯង។ 📅' } },
  { id: 's6', kind: 'selfcare', en: { text: 'Feeling off? Talk to someone you trust. Asking for help is strong.' }, km: { text: 'មិនស្រួលខ្លួន? និយាយជាមួយអ្នកដែលអ្នកទុកចិត្ត។ ការសុំជំនួយ គឺជាភាពខ្លាំង។' } },

  // ------------------------------------------------------------------ Christmas mode only
  { id: 'x1', kind: 'quote', season: 'christmas', en: { text: 'Sleigh the day. 🎄' }, km: { text: 'ធ្វើថ្ងៃនេះឱ្យឡូយ ដូចរទេះរុញទឹកកក។ 🎄' } },
  { id: 'x2', kind: 'quote', season: 'christmas', en: { text: 'All I want for Christmas is self-care. 💝' }, km: { text: 'អ្វីដែលខ្ញុំចង់បានសម្រាប់បុណ្យណូអែល គឺការថែទាំខ្លួនឯង។ 💝' } },
  { id: 'x3', kind: 'quote', season: 'christmas', en: { text: 'Cozy, cute and confident. That’s the holiday vibe. ✨' }, km: { text: 'កក់ក្តៅ គួរឱ្យស្រឡាញ់ និងមានទំនុកចិត្ត។ នោះហើយជាអារម្មណ៍បុណ្យ។ ✨' } },
  { id: 'x4', kind: 'quote', season: 'christmas', en: { text: 'Jingle all the way — even on period days. 🔔' }, km: { text: 'សប្បាយរីករាយគ្រប់ពេល — សូម្បីតែថ្ងៃមករដូវ។ 🔔' } },
  { id: 'x5', kind: 'quote', season: 'christmas', en: { text: "Santa's list? I'm on the confident list. 🎅" }, km: { text: 'បញ្ជីរបស់សាន់តា? ខ្ញុំនៅក្នុងបញ្ជីអ្នកមានទំនុកចិត្ត។ 🎅' } },
  { id: 'x6', kind: 'quote', season: 'christmas', en: { text: 'The best gift? Loving the body you live in. 🎁' }, km: { text: 'កាដូល្អបំផុត? ការស្រឡាញ់រាងកាយរបស់ខ្លួនឯង។ 🎁' } },
  {
    id: 'x7',
    kind: 'selfcare',
    season: 'christmas',
    en: { text: 'Cramps this season? A warm drink and a warm blanket on your tummy are pure comfort. ☕' },
    km: { text: 'ឈឺពោះរដូវក្នុងរដូវបុណ្យ? ភេសជ្ជៈក្តៅ និងភួយក្តៅលើពោះ ជួយឱ្យស្រួលខ្លួនណាស់។ ☕' },
  },
  {
    id: 'x8',
    kind: 'selfcare',
    season: 'christmas',
    en: { text: 'Holiday busy? Rest is part of the celebration. 🛌' },
    km: { text: 'រវល់ក្នុងរដូវបុណ្យ? ការសម្រាកក៏ជាផ្នែកមួយនៃការអបអរដែរ។ 🛌' },
  },
];

/** Small deterministic random generator, so "today's card" is the same all day on this device. */
export function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A number that changes once per calendar day (local time). */
export function daySeed(date: Date = new Date()): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}
