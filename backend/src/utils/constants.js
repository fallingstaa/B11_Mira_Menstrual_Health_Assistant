module.exports = {
  // One value per screen that can write a MenstrualRecord — kept in sync with
  // mobile-app's app/(tabs)/calendar.tsx, app/checkin.tsx, app/record.tsx,
  // app/record-first-period.tsx (Path A of the setup flow), and
  // app/last-period-one-date.tsx (Path B). Path C (app/last-period-unknown.tsx) never
  // writes a record at all — see PUT /api/menstrual/cycle-setup instead.
  MENSTRUAL_RECORD_SOURCES: ["calendar", "checkin", "record", "record_first_period", "last_period_one_date"],
  NOTIFICATION_TYPES: ["period", "record", "checkin", "education"],
  // Mirrors MIN_CYCLE_LENGTH/MAX_CYCLE_LENGTH in
  // mobile-app/src/components/mira/cycle-length-question.tsx — the shared "do you know
  // your cycle length" stepper used by both onboarding paths that ask for it.
  MIN_MANUAL_CYCLE_LENGTH: 21,
  MAX_MANUAL_CYCLE_LENGTH: 45,
  MIN_MANUAL_PERIOD_LENGTH: 1,
  MAX_MANUAL_PERIOD_LENGTH: 14,
  MIN_AGE: 9,
  MAX_AGE: 100,
  // Final, locked list (2026-08-20) — mirrors mobile-app's symptomOptions in
  // constants/mock-data.ts. These are the *keys* the app actually sends (kebab-case),
  // not the display labels — e.g. "Mood swings" is sent/stored as "mood-swings". Update
  // both places together if this list ever changes; previously these were free strings
  // specifically because the option set wasn't finalized yet (see the comment this
  // replaced on MenstrualRecord.js) — now that it is, both are enum-constrained.
  SYMPTOM_OPTIONS: [
    "everything-is-fine",
    "cramps",
    "tender-breasts",
    "headache",
    "acne",
    "backache",
    "fatigue",
    "cravings",
    "insomnia",
    "abdominal-pain",
    "vaginal-itching",
    "vaginal-dryness",
    "hot-flashes",
    "night-sweats",
    "joint-pain",
    "brain-fog",
    "dry-skin",
    "dry-eyes",
  ],
  // Final, locked list (2026-08-20) — mirrors mobile-app's moodOptions in
  // constants/mock-data.ts. Same key-not-label convention as SYMPTOM_OPTIONS above.
  MOOD_OPTIONS: [
    "calm",
    "happy",
    "energetic",
    "frisky",
    "mood-swings",
    "irritated",
    "sad",
    "anxious",
    "depressed",
    "feeling-guilty",
    "obsessive-thoughts",
    "low-energy",
    "apathetic",
    "confused",
    "very-self-critical",
  ],
};
