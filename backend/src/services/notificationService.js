/**
 * TODO: Firebase Cloud Messaging integration for delivering NotificationReminder
 * documents as real push notifications, plus the scheduling logic that decides when
 * a "period starting soon" / "check in today" reminder should be created.
 *
 * Not required for the basic reminders API (list / markRead / markAllRead) — those
 * just read and write Mongo directly today; this service only matters once reminders
 * need to be *pushed* rather than just listed.
 */
