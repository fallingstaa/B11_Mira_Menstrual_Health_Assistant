import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

type Props = {
  label: string;
  icon?: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  tint?: string;
  /** Override the default content-sized width — e.g. `{ flex: 1 }` to make a small, fixed set of
   * chips (Day type, Period status) always divide one row evenly instead of wrapping/scrolling. */
  style?: ViewStyle;
};

/**
 * Selectable pill chip — used for symptoms, moods, flow level, categories, period status.
 * Label is always one line, on every device size — `numberOfLines={1}` is the unconditional
 * guarantee (matters most for the longer labels, e.g. "Not on my period", "Very self-critical");
 * `flexShrink: 0` is the default sizing (content-width, never squeezed by a crowded row) but
 * `style` can override it, e.g. to `flex: 1` for a small fixed row that should divide evenly.
 */
export function Chip({ label, icon, selected, onPress, color = Colors.primary, tint = Colors.tint50, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: selected ? color : tint, borderColor: selected ? color : Colors.border },
        style,
      ]}>
      {icon ? <AppText style={styles.icon}>{icon}</AppText> : null}
      <AppText variant="bodyMedium" numberOfLines={1} color={selected ? Colors.textOnPrimary : Colors.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function Dot({ color, active }: { color: string; active?: boolean }) {
  return <View style={[styles.legendDot, { backgroundColor: color, opacity: active ? 1 : 0.35 }]} />;
}

const styles = StyleSheet.create({
  chip: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    // Only matters when `style` overrides width (e.g. flex: 1) — centers the label instead of it
    // hugging the left edge once the pill is wider than its content.
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
  },
  icon: { fontSize: 15 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
});
