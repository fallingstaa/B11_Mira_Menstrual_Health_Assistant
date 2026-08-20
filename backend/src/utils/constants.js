module.exports = {
  // One value per screen that can write a MenstrualRecord — kept in sync with
  // mobile-app's app/(tabs)/calendar.tsx, app/checkin.tsx, app/record.tsx,
  // app/record-first-period.tsx (Path A of the setup flow), and
  // app/last-period-one-date.tsx (Path B). Path C (app/last-period-unknown.tsx) never
  // writes a record at all — see PUT /api/menstrual/cycle-setup instead.
  MENSTRUAL_RECORD_SOURCES: ["calendar", "checkin", "record", "record_first_period", "last_period_one_date"],
  MENSTRUAL_STATUS: ["on", "spotting", "off"],
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
};
