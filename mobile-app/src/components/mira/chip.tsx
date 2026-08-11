import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

type Props = {
  label: string;
  icon?: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  tint?: string;
};

/** Selectable pill chip — used for symptoms, moods, flow level, categories. */
export function Chip({ label, icon, selected, onPress, color = Colors.primary, tint = Colors.tint50 }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: selected ? color : tint, borderColor: selected ? color : Colors.border },
      ]}>
      {icon ? <AppText style={styles.icon}>{icon}</AppText> : null}
      <AppText variant="bodyMedium" color={selected ? Colors.textOnPrimary : Colors.text}>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
  },
  icon: { fontSize: 15 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
});
