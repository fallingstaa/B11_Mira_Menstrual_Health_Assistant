import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { AppText } from '@/components/mira/app-text';
import { IconCircle } from '@/components/mira/icon-circle';
import { ScreenContainer } from '@/components/mira/screen-container';
import { ScreenHeader } from '@/components/mira/screen-header';
import { NotificationItem, notifications as initialNotifications } from '@/constants/mock-data';
import { Colors, Radius, Spacing } from '@/constants/theme';

const TYPE_META: Record<NotificationItem['type'], { icon: keyof typeof Ionicons.glyphMap; color: string; tint: string }> = {
  period: { icon: 'water', color: Colors.primary, tint: Colors.tint50 },
  record: { icon: 'create', color: Colors.teal, tint: Colors.tealTint },
  checkin: { icon: 'heart', color: Colors.peach, tint: Colors.peachTint },
  education: { icon: 'book', color: Colors.lavender, tint: Colors.lavenderTint },
};

export default function NotificationsScreen() {
  const [items, setItems] = useState<NotificationItem[]>(initialNotifications);
  const unreadCount = items.filter((n) => !n.read).length;

  const markRead = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        right={
          unreadCount > 0 ? (
            <Pressable onPress={() => setItems((prev) => prev.map((n) => ({ ...n, read: true })))} hitSlop={8}>
              <AppText variant="small" color={Colors.primary}>
                Mark all
              </AppText>
            </Pressable>
          ) : null
        }
      />

      <View style={styles.list}>
        {items.map((item, i) => {
          const meta = TYPE_META[item.type];
          return (
            <Animated.View key={item.id} entering={FadeInUp.duration(360).delay(i * 50)}>
              <Pressable onPress={() => markRead(item.id)} style={[styles.row, !item.read && styles.rowUnread]}>
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
                    {item.time}
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
