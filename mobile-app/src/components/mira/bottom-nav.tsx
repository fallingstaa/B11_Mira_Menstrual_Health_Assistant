import { Ionicons } from '@expo/vector-icons';
// expo-router/tabs stopped re-exporting this type at the expo-router version paired
// with SDK 54 — it lives in @react-navigation/bottom-tabs directly, which expo-router
// depends on anyway (so this resolves to an already-installed, version-matched copy).
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/mira/app-text';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';

/**
 * How much bottom clearance a scrolling tab screen needs to keep its last item from ending up
 * underneath this floating bar. `wrap` below only claims touches inside `bar`'s own rounded
 * rect (`pointerEvents="box-none"` lets taps in the surrounding padding fall through) — but
 * `bar` itself has no such exemption, so anything visually sitting underneath it (not just the
 * icon buttons — the whole rounded rect, including the gaps between them) is unreachable, not
 * just visually covered. ~75 (bar's own height: paddingVertical + icon pill + label) + up to
 * ~40 (safe-area bottom inset on devices with a home indicator) + a little breathing room above
 * the bar so content doesn't sit flush against it. See screen-container.tsx's `tabBar` prop.
 */
export const TAB_BAR_CLEARANCE = 130;

const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap; label: string }> = {
  home: { on: 'home', off: 'home-outline', label: 'Home' },
  calendar: { on: 'calendar', off: 'calendar-outline', label: 'Calendar' },
  education: { on: 'book', off: 'book-outline', label: 'Learn' },
  assistant: { on: 'chatbubble-ellipses', off: 'chatbubble-ellipses-outline', label: 'Mira AI' },
  profile: { on: 'person', off: 'person-outline', label: 'Profile' },
};

/** Custom floating bottom tab bar matching the Mira design system. */
export function BottomNav({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]} pointerEvents="box-none">
      <View style={[styles.bar, Shadow.raised]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const meta = ICONS[route.name] ?? ICONS.home;

          return (
            <TabButton
              key={route.key}
              focused={focused}
              icon={focused ? meta.on : meta.off}
              label={meta.label}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabButton({
  focused,
  icon,
  label,
  onPress,
}: {
  focused: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => (scale.value = withSpring(0.88, { damping: 12, stiffness: 300 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 10, stiffness: 260 }))}
      style={styles.item}
      hitSlop={4}>
      <Animated.View style={[styles.iconPill, focused && styles.iconPillActive, animatedStyle]}>
        <Ionicons name={icon} size={20} color={focused ? Colors.textOnPrimary : Colors.textMuted} />
      </Animated.View>
      <AppText variant="caption" color={focused ? Colors.primary : Colors.textMuted}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', paddingHorizontal: Spacing.lg },
  bar: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 480,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    justifyContent: 'space-between',
  },
  item: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: Spacing.xs },
  iconPill: {
    width: 40,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: { backgroundColor: Colors.primary },
});
