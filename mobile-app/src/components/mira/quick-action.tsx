import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AppText } from '@/components/mira/app-text';
import { IconCircle } from '@/components/mira/icon-circle';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';

type Props = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  tint: string;
  onPress?: () => void;
};

/** One tappable quick-action tile on the Home dashboard, with a spring press animation. */
export function QuickAction({ label, icon, color, tint, onPress }: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => (scale.value = withSpring(0.94, { damping: 14, stiffness: 300 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 10, stiffness: 260 }))}
      style={styles.pressable}>
      <Animated.View style={[styles.tile, Shadow.card, animatedStyle]}>
        <IconCircle color={tint} size={46}>
          <Ionicons name={icon} size={22} color={color} />
        </IconCircle>
        <AppText variant="small" color={Colors.text} center numberOfLines={2} style={styles.label}>
          {label}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { width: 82 },
  tile: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: 6,
    gap: Spacing.sm,
  },
  label: {},
});
