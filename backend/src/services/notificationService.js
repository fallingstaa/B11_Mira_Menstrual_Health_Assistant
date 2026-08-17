const NotificationReminder = require("../models/NotificationReminder");
const MenstrualRecord = require("../models/MenstrualRecord");
const { toDayKey, daysBetween } = require("../utils/dateHelper");

// How many days out a "period starting soon" reminder should first appear.
const PERIOD_SOON_WINDOW_DAYS = 3;

/**
 * Creates (or refreshes) a "period starting soon" reminder once the predicted start
 * date is within PERIOD_SOON_WINDOW_DAYS. Deduped on (userId, type, scheduledFor) —
 * `scheduledFor` is the predicted date itself, so a *new* prediction (the cache moved
 * because new records came in) naturally produces a distinct reminder instead of
 * silently overwriting the old one. `read` is only ever set on insert — re-running
 * this on a day the reminder already exists just refreshes the "in N days" wording,
 * it never un-reads something the user already dismissed.
 *
 * Also clears out any *stale* period reminder before (re)creating the current one —
 * without this, a reminder generated while the predicted date was approaching would
 * keep sitting there with outdated wording (still saying "starting today") days after
 * that date silently passed with nothing logged, or after new records shifted the
 * prediction to a different date entirely. Deliberately a hard delete rather than an
 * "expired" flag — this list is "what's currently relevant", not a permanent history
 * log, so losing an already-read stale entry is an acceptable tradeoff for never
 * showing a wrong one.
 */
async function ensurePeriodSoonReminder(user, today) {
  const nextStart = user.cycle?.nextPeriodStart;
  const daysUntil = nextStart ? daysBetween(today, nextStart) : null;
  const inWindow = daysUntil !== null && daysUntil >= 0 && daysUntil <= PERIOD_SOON_WINDOW_DAYS;
  const currentScheduledFor = inWindow ? toDayKey(nextStart) : null;

  await NotificationReminder.deleteMany({
    userId: user._id,
    type: "period",
    // Out of window: nuke every period reminder this user has (covers "no prediction
    // at all" and "predicted date passed unlogged"). In window: only nuke ones that
    // don't match today's prediction (covers "prediction moved to a new date"),
    // leaving the current one alone so the upsert below can refresh + preserve it.
    ...(currentScheduledFor ? { scheduledFor: { $ne: currentScheduledFor } } : {}),
  });

  if (!inWindow) return;

  const body =
    daysUntil === 0
      ? "Your next period is estimated to start today."
      : `Your next period is estimated to start in ${daysUntil} day${daysUntil === 1 ? "" : "s"}.`;

  await NotificationReminder.findOneAndUpdate(
    { userId: user._id, type: "period", scheduledFor: currentScheduledFor },
    { $set: { title: "Period starting soon", body, sentAt: new Date() }, $setOnInsert: { read: false } },
    { upsert: true, setDefaultsOnInsert: true }
  );
}

/**
 * Creates today's daily check-in nudge — but only if the user actually hasn't logged
 * anything today yet, and only if they haven't turned check-in reminders off. Deduped
 * on (userId, type, scheduledFor=today), same read-preserving upsert as above.
 */
async function ensureCheckinReminder(user, today) {
  if (user.preferences?.checkinReminders === false) return;

  const loggedToday = await MenstrualRecord.exists({ userId: user._id, date: today });
  if (loggedToday) return;

  await NotificationReminder.findOneAndUpdate(
    { userId: user._id, type: "checkin", scheduledFor: today },
    {
      $set: {
        title: "How are you feeling today?",
        body: "You haven't checked in yet today — it only takes a few seconds.",
        sentAt: new Date(),
      },
      $setOnInsert: { read: false },
    },
    { upsert: true, setDefaultsOnInsert: true }
  );
}

/**
 * Nudges the user to close out a period that's gone on suspiciously long without an
 * explicit end day — e.g. they logged the start via a check-in but never came back to
 * mark when it finished. Only fires once the gap since the last logged day reaches
 * their own average period length, so it doesn't nag mid-period. Deduped on the
 * *start* date of that episode so it fires once per unfinished period, not once per day.
 */
async function ensureRecordReminder(user, today) {
  const { lastPeriodStart, lastPeriodEnd, averagePeriodLength } = user.cycle ?? {};
  if (!lastPeriodStart || !lastPeriodEnd) return;

  const lastLoggedDay = await MenstrualRecord.findOne({ userId: user._id, date: toDayKey(lastPeriodEnd) });
  if (!lastLoggedDay || lastLoggedDay.isPeriodEnd) return; // already explicitly closed out — nothing to remind about

  if (daysBetween(lastPeriodEnd, today) < (averagePeriodLength ?? 5)) return; // still within a normal period length

  await NotificationReminder.findOneAndUpdate(
    { userId: user._id, type: "record", scheduledFor: toDayKey(lastPeriodStart) },
    {
      $set: {
        title: "Reminder to log your period",
        body: "Don't forget to record when your last period ended.",
        sentAt: new Date(),
      },
      $setOnInsert: { read: false },
    },
    { upsert: true, setDefaultsOnInsert: true }
  );
}

/**
 * Lazily generates whatever reminders are currently due for this user, called right
 * before `GET /api/reminders` lists them. There's no scheduler/cron/FCM push here yet
 * (see the TODO this replaces) — this is the simplest thing that makes the endpoint
 * actually populate: reminders appear the next time the app asks for them, rather than
 * the instant they become true. Good enough until push delivery is worth building.
 *
 * "education" reminders (the 4th NotificationReminder type) aren't generated here —
 * there's no seeded EducationalContent yet to link relatedContentId to.
 *
 * `today` defaults to the real current day but can be overridden by the caller — see
 * `?asOf=` on GET /api/reminders (devClock.js) — so the whole "N days before the
 * predicted date" window can be exercised on demand while testing instead of actually
 * waiting for the real calendar to catch up to it.
 */
async function ensureRemindersUpToDate(user, today = toDayKey(new Date())) {
  await Promise.all([ensurePeriodSoonReminder(user, today), ensureCheckinReminder(user, today), ensureRecordReminder(user, today)]);
}

module.exports = { ensureRemindersUpToDate };
