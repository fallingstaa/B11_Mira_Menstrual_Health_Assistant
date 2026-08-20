import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/mira/app-text';
import { flowLevels } from '@/constants/mock-data';
import { Colors, Radius, Spacing } from '@/constants/theme';

type Props = {
  value: string;
  onChange: (key: string) => void;
};

const HILL_WIDTH = 40;
// Shared baseline for every *unselected* hill — same height regardless of level, so nothing
// about a level is implied before it's actually picked.
const HILL_MIN_HEIGHT = 12;
// How tall each level's hill grows *once selected* — its own height, not a shared max. Spotting
// barely rises, Heavy grows the most, same relative intensity feel as the pill order itself.
const HILL_MAX_HEIGHTS: Record<string, number> = {
  spotting: 18,
  light: 28,
  medium: 35,
  heavy: 40,
};

/**
 * Flow Level picker — the usual row of pills, plus a small row of rounded hills beneath it, one
 * per level. All four start at the same short, neutral height; picking one animates just that
 * hill growing taller (to a height specific to that level — Heavy grows more than Spotting) and
 * turning brand-pink, like a bar chart filling in. Nothing is implied about a level before it's
 * actually chosen — the height difference only shows up once you've picked one. Shared by every
 * screen that asks for Flow Level (record.tsx, checkin.tsx, PeriodDayEditor) so it looks and
 * animates identically everywhere.
 */
export function FlowLevelPicker({ value, onChange }: Props) {
  return (
    <View>
      {/* Fixed 4-way row, not wrap or scroll — each pill is flex: 1, so all four always divide
          one line evenly no matter the device width, shrinking together instead of wrapping or
          needing a swipe. */}
      <View style={styles.pillRow}>
        {flowLevels.map((f) => (
          <Pressable key={f.key} onPress={() => onChange(f.key)} style={[styles.pill, value === f.key && styles.pillSelected]}>
            <AppText variant="bodyMedium" numberOfLines={1} color={value === f.key ? Colors.textOnPrimary : Colors.text}>
              {f.label}
            </AppText>
          </Pressable>
        ))}
      </View>
      <View style={styles.hillRow}>
        {flowLevels.map((f) => (
          <Hill key={f.key} active={value === f.key} maxHeight={HILL_MAX_HEIGHTS[f.key] ?? 32} />
        ))}
      </View>
    </View>
  );
}

function Hill({ active, maxHeight }: { active: boolean; maxHeight: number }) {
  const height = useSharedValue(active ? maxHeight : HILL_MIN_HEIGHT);

  useEffect(() => {
    height.value = withTiming(active ? maxHeight : HILL_MIN_HEIGHT, { duration: 220 });
  }, [active, maxHeight, height]);

  const animatedStyle = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <View style={styles.hillSlot}>
      <Animated.View style={[styles.hill, active && styles.hillActive, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  pillRow: { flexDirection: 'row', gap: Spacing.xs },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.pill,
    backgroundColor: Colors.tint50,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  pillSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  // Clustered together with a small gap, not spread edge-to-edge across the full row — reads as
  // one connected "skyline" sitting under the pills, not four unrelated bars.
  hillRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  hillSlot: { width: HILL_WIDTH, alignItems: 'center', justifyContent: 'flex-end' },
  hill: {
    width: HILL_WIDTH,
    borderTopLeftRadius: HILL_WIDTH / 2,
    borderTopRightRadius: HILL_WIDTH / 2,
    backgroundColor: Colors.tint100,
  },
  hillActive: { backgroundColor: Colors.primary },
});
