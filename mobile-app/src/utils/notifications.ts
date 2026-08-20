import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { Colors } from '@/constants/theme';
import { PeriodDayEntry } from '@/context/app-state';
import { addDays, dateKey, daysBetween } from '@/utils/date';

/**
 * Mira's local (on-device) period reminder queue — 10 touchpoints across a cycle, no backend, no
 * push service. Scheduling is entirely derived from lastPeriodStartDate/nextPeriodStartDate/
 * averageCycleLength + periodEntries, so there's nothing here to "save": whoever changes those
 * (Path A/B setup, Calendar, record.tsx, checkin.tsx) just triggers a re-sync and the on-device
 * schedule instantly reflects it.
 *
 * Every sync clears all 10 by their fixed identifier first, then re-derives from scratch — that's
 * what makes the "only if" rules on Alerts 5–10 (and the "cancel #5–#10 once a period's logged on
 * or after the predicted start" rule) correct by construction, rather than by tracking what was
 * previously sent: the moment the underlying condition goes false, the next sync just doesn't
 * (re-)schedule that alert. There's no separate cancel path to keep in sync with the schedule path.
 */

/**
 * TEST MODE — flip to `false` before shipping. When true:
 *  - Every title is prefixed "[TEST]".
 *  - Every alert's trigger is replaced with a short fixed delay (5s for Alert 1, 10s for Alert 2,
 *    ... 50s for Alert 10) instead of its real date-math timing, so the whole 10-alert queue can
 *    be sanity-checked on a real device in under a minute instead of over two weeks.
 * The "only if" conditions on Alerts 5–10 still apply in test mode — logging a period during the
 * test still cancels the late ones, exactly like production.
 *
 * PAUSED (2026-08-20): flipped back to `false` on request — the rapid-fire 5–50s test
 * schedule was getting in the way of normal testing. Nothing else here changed; flip
 * back to `true` any time to resume it.
 */
export const IS_NOTIFICATION_TEST_MODE = false;

const NOTIFICATION_TITLE = IS_NOTIFICATION_TEST_MODE ? '[TEST] Mira' : 'Mira';

// Fixed local send time for every date-anchored alert (Alert 1 is the one exception — it's
// relative to "right now", not a specific day, so it ignores this).
const ALERT_HOUR = 8;
const ALERT_MINUTE = 30;

// Fixed identifiers, indexed by alert number (ALERT_IDS[0] is Alert 1, etc.) — re-scheduling by
// the same identifier always replaces rather than adds, so there's never more than 10 pending.
const ALERT_IDS = [
  'mira-alert-1-confirmation',
  'mira-alert-2-midcycle',
  'mira-alert-3-prepms',
  'mira-alert-4-prep',
  'mira-alert-5-dayof',
  'mira-alert-6-late1',
  'mira-alert-7-late2',
  'mira-alert-8-late3',
  'mira-alert-9-late4',
  'mira-alert-10-late5',
] as const;

/**
 * NOTE on branding: `content.color` below is the one piece of "Mira" branding a notification's
 * *content* can carry from JS, alongside the title text itself. The small app icon shown on the
 * notification banner, and iOS's "delivered by ___" attribution, are both controlled by whichever
 * app process actually delivered it — under Expo Go that's always Expo Go's own icon/name, no
 * matter what's configured here or in app.json. It only becomes Mira's real icon in a standalone
 * build (dev client or production, via `expo run:ios`/EAS) — Expo Go can't render another app's
 * icon for a notification it's technically the one sending, for the same sandboxing reason it
 * can't register for real push notifications either.
 */
const ANDROID_CHANNEL_ID = 'mira-period-reminders';

let handlerConfigured = false;

/** Without this, a notification that fires while Mira is already open in the foreground is silently swallowed. */
function ensureHandler() {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true, // deprecated in favor of the two below, but harmless to also set
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Period reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** `dayOffset` calendar days from `base`, fired at the fixed local ALERT_HOUR:ALERT_MINUTE. */
function atAlertTime(base: Date, dayOffset: number): Date {
  const d = addDays(base, dayOffset);
  d.setHours(ALERT_HOUR, ALERT_MINUTE, 0, 0);
  return d;
}

/** Alert N's real trigger, or — in test mode — `N * 5` seconds from now (5s, 10s, ... 50s). */
function triggerFor(alertNumber: number, realDate: Date): Date {
  return IS_NOTIFICATION_TEST_MODE ? new Date(Date.now() + alertNumber * 5_000) : realDate;
}

async function cancelAllPeriodNotifications() {
  await Promise.all(ALERT_IDS.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
}

async function scheduleIfFuture(identifier: string, date: Date, body: string) {
  if (date.getTime() <= Date.now()) return; // never schedule something already in the past
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: { title: NOTIFICATION_TITLE, body, color: Colors.primary },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: ANDROID_CHANNEL_ID },
  });
}

/**
 * Re-derives and (re)schedules Mira's 10 local period reminders. Call this any time
 * `lastPeriodStartDate`, `nextPeriodStartDate`, `averageCycleLength`, or `periodEntries` changes.
 */
export async function syncPeriodNotifications(
  lastPeriodStartDate: Date | null,
  nextPeriodStartDate: Date | null,
  averageCycleLength: number,
  periodEntries: Record<string, PeriodDayEntry>,
): Promise<void> {
  ensureHandler();
  await cancelAllPeriodNotifications();
  if (!lastPeriodStartDate || !nextPeriodStartDate) return;

  const { status } = await Notifications.getPermissionsAsync();
  let granted = status === 'granted';
  if (!granted && status !== 'denied') {
    const requested = await Notifications.requestPermissionsAsync();
    granted = requested.status === 'granted';
  }
  if (!granted) return;

  await ensureAndroidChannel();

  // Alert 5's condition: has the *predicted* day specifically been logged (not just "today" at
  // sync time — sync can run days before nextPeriodStartDate actually arrives).
  const loggedOnPredictedDay = !!periodEntries[dateKey(nextPeriodStartDate)];
  // Alerts 6–10's shared condition, and the trigger for the auto-cancellation rule: has anything
  // been logged on or after the predicted start at all.
  const loggedOnOrAfterNextStart = Object.values(periodEntries).some(
    (entry) => daysBetween(nextPeriodStartDate, entry.date) >= 0,
  );

  // Alert 1 (Period Confirmation) — 1 hour after this sync, i.e. after the user just finished
  // logging. Unconditional.
  await scheduleIfFuture(
    ALERT_IDS[0],
    triggerFor(1, new Date(Date.now() + 60 * 60 * 1000)),
    "Dates logged! We recalculated your cycle timeline so you don't have to.",
  );

  // Alert 2 (Mid-Cycle Check-In) — (cycle length - 14) days after the start. Unconditional.
  // Clamped at 0 so an unusually short real-derived cycle length can never land before the start.
  const midCycleOffset = Math.max(0, Math.round(averageCycleLength) - 14);
  await scheduleIfFuture(
    ALERT_IDS[1],
    triggerFor(2, atAlertTime(lastPeriodStartDate, midCycleOffset)),
    'Mid-cycle check-in. Time to see how your body is feeling today.',
  );

  // Alert 3 (Pre-PMS Heads-Up) — 7 days before. Unconditional.
  await scheduleIfFuture(
    ALERT_IDS[2],
    triggerFor(3, atAlertTime(nextPeriodStartDate, -7)),
    'One week out from your period. Low energy or mood shifts? Completely normal.',
  );

  // Alert 4 (Preparation) — 2 days before. Unconditional.
  await scheduleIfFuture(
    ALERT_IDS[3],
    triggerFor(4, atAlertTime(nextPeriodStartDate, -2)),
    'Heads up: Your period is due in 2 days. Restock your bag real quick.',
  );

  // Alert 5 (Day-Of Check-In) — only if nothing's logged for the predicted day itself.
  if (!loggedOnPredictedDay) {
    await scheduleIfFuture(
      ALERT_IDS[4],
      triggerFor(5, atAlertTime(nextPeriodStartDate, 0)),
      'Is your period here today? Tap to log it real quick.',
    );
  }

  // Alerts 6–10 (Late Check-Ins) — only if nothing's logged on/after the predicted start. This is
  // also the Auto-Cancellation Rule: the moment the user logs a period on/after nextPeriodStartDate,
  // `loggedOnOrAfterNextStart` goes true and the next sync (triggered by that same log) simply
  // omits all five instead of scheduling them — equivalent to cancelling #5 through #10 at once.
  if (!loggedOnOrAfterNextStart) {
    await scheduleIfFuture(
      ALERT_IDS[5],
      triggerFor(6, atAlertTime(nextPeriodStartDate, 3)),
      "Cycles do their own thing sometimes. Log it whenever you're ready, no stress.",
    );
    await scheduleIfFuture(
      ALERT_IDS[6],
      triggerFor(7, atAlertTime(nextPeriodStartDate, 5)),
      'Still waiting on your period? It happens. Update your dates when it pulls up.',
    );
    await scheduleIfFuture(
      ALERT_IDS[7],
      triggerFor(8, atAlertTime(nextPeriodStartDate, 7)),
      'Quick cycle vibe check. Tap here so we can keep your predictions accurate.',
    );
    await scheduleIfFuture(
      ALERT_IDS[8],
      triggerFor(9, atAlertTime(nextPeriodStartDate, 10)),
      "We paused your predictions for now! Tap to log your start date whenever you're ready.",
    );
    await scheduleIfFuture(
      ALERT_IDS[9],
      triggerFor(10, atAlertTime(nextPeriodStartDate, 14)),
      'Still waiting or missed a log? Drop your dates in the app to get your timeline back on track.',
    );
  }
}
