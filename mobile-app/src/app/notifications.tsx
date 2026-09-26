import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { AppText } from '@/components/mira/app-text';
import { IconCircle } from '@/components/mira/icon-circle';
import { ScreenContainer } from '@/components/mira/screen-container';
import { ScreenHeader } from '@/components/mira/screen-header';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { apiRequest } from '@/utils/api';
import { addDays, formatShort, isSameDay } from '@/utils/date';

/** One `GET /api/reminders` entry — see NotificationReminder.js/notificationService.js for how/when these get created. */
type Reminder = {
  _id: string;
  type: 'period' | 'record' | 'checkin' | 'education';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

const TYPE_META: Record<Reminder['type'], { icon: keyof typeof Ionicons.glyphMap; color: string; tint: string }> = {
  period: { icon: 'water', color: Colors.primary, tint: Colors.tint50 },
  record: { icon: 'create', color: Colors.teal, tint: Colors.tealTint },
  checkin: { icon: 'heart', color: Colors.peach, tint: Colors.peachTint },
  education: { icon: 'book', color: Colors.lavender, tint: Colors.lavenderTint },
};

/** "Today · 8:00 AM" / "Yesterday · 6:15 PM" / "Jul 28 · 9:00 AM" — same shape the old mock `time` strings used. */
function formatReminderTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (isSameDay(date, now)) return `Today · ${timeStr}`;
  if (isSameDay(date, addDays(now, -1))) return `Yesterday · ${timeStr}`;
  return `${formatShort(date)} · ${timeStr}`;
}

export default function NotificationsScreen() {
  const [items, setItems] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const unreadCount = items.filter((n) => !n.read).length;

  // Refetches on every focus (not just first mount) — GET /reminders also lazily *generates*
  // whatever's newly due server-side (see notificationService.js), so revisiting this screen is
  // when a fresh "period starting soon"/check-in nudge would actually show up.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      apiRequest<Reminder[]>('/reminders')
        .then((data) => {
          if (!cancelled) setItems(data);
        })
        .catch((err) => {
          console.error('[notifications] failed to load /reminders:', err);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  /** Optimistic mark-read, same rollback-on-failure shape as profile.tsx's updatePreference. */
  const markRead = (id: string) => {
    const target = items.find((n) => n._id === id);
    if (!target || target.read) return; // already read — tapping again shouldn't re-fire the request
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));

    apiRequest(`/reminders/${id}/read`, { method: 'PATCH' }).catch((err) => {
      console.error('[notifications] failed to mark read, rolling back:', err);
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: false } : n)));
    });
  };

  const markAllRead = () => {
    const previous = items;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));

    apiRequest('/reminders/read-all', { method: 'PATCH' }).catch((err) => {
      console.error('[notifications] failed to mark all read, rolling back:', err);
      setItems(previous);
    });
  };

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Notifications"
        subtitle={loading ? 'Loading…' : unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        right={
          unreadCount > 0 ? (
            <Pressable onPress={markAllRead} hitSlop={8}>
              <AppText variant="small" color={Colors.primary}>
                Mark all
              </AppText>
            </Pressable>
          ) : null
        }
      />

      {!loading && items.length === 0 && (
        <View style={styles.emptyWrap}>
          <IconCircle color={Colors.tint50} size={56}>
            <Ionicons name="notifications-outline" size={24} color={Colors.primary} />
          </IconCircle>
          <AppText variant="bodyMedium" color={Colors.textSecondary} style={{ marginTop: Spacing.md }}>
            Nothing here yet
          </AppText>
          <AppText variant="small" color={Colors.textMuted} center style={{ marginTop: 4 }}>
            Period reminders and check-in nudges will show up here as they become relevant.
          </AppText>
        </View>
      )}

      <View style={styles.list}>
        {items.map((item, i) => {
          const meta = TYPE_META[item.type];
          return (
            <Animated.View key={item._id} entering={FadeInUp.duration(360).delay(i * 50)}>
              <Pressable onPress={() => markRead(item._id)} style={[styles.row, !item.read && styles.rowUnread]}>
                <IconCircle color={meta.tint} size={44}>
                  <Ionicons name={meta.icon} size={19} color={meta.color} />
                </IconCircle>
                <View style={styles.textWrap}>
                  <View style={styles.titleRow}>
                    <AppText variant="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>
                      {item.title}
                    </AppText>
                    {!item.read && <View style={styles.unreadDot} />}
                  </View>
                  <AppText variant="small" numberOfLines={2} style={{ marginTop: 2 }}>
                    {item.body}
                  </AppText>
                  <AppText variant="caption" style={{ marginTop: Spacing.sm }}>
                    {formatReminderTime(item.createdAt)}
                  </AppText>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.sm },
  emptyWrap: { alignItems: 'center', paddingVertical: Spacing.xxxl, paddingHorizontal: Spacing.xl },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
  },
  rowUnread: { backgroundColor: Colors.tint50 },
  textWrap: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginLeft: Spacing.sm },
});
