import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Chip } from '@/components/mira/chip';
import { Colors, Spacing } from '@/constants/theme';

type Option = { key: string; label: string };

type Props = {
  /** Short label, e.g. "Symptoms" or "Mood" — "· optional" and the caps styling are added here. */
  label: string;
  options: Option[];
  selectedKeys: string[];
  onToggle: (key: string) => void;
  /** No top margin by default (a caller that puts this alone in its own Card doesn't want extra
   * space above it) — pass e.g. `{ marginTop: Spacing.lg }` when stacking several of these
   * directly on one card, the way PeriodDayEditor does. */
  style?: ViewStyle;
};

/**
 * A "· optional" chip field that starts collapsed behind a small "+ Add" button instead of
 * dumping every option (18 for Symptoms, 15 for Mood) straight onto the screen. Tapping the
 * header expands it into the usual chip grid; tapping again tucks it back away. Starts already
 * expanded if this day already has a selection — reopening something with data shouldn't hide
 * it, only a genuinely untouched field starts closed.
 *
 * Render with `key={dayKey}` from a caller that reuses one instance across multiple days (e.g.
 * PeriodDayEditor browsing different dates) — that forces a fresh instance (and correctly
 * recomputed initial expanded state) per day, instead of one day's expand/collapse carrying over
 * to the next.
 */
export function CollapsibleChipField({ label, options, selectedKeys, onToggle, style }: Props) {
  const [expanded, setExpanded] = useState(selectedKeys.length > 0);

  return (
    <View style={style}>
      <Pressable onPress={() => setExpanded((e) => !e)} style={styles.header}>
        <AppText variant="caption" numberOfLines={1} style={styles.label}>
          {label.toUpperCase()} · OPTIONAL
        </AppText>
        <View style={styles.trigger}>
          {selectedKeys.length > 0 && (
            <AppText variant="small" numberOfLines={1} color={Colors.primary}>
              {selectedKeys.length} selected
            </AppText>
          )}
          <Ionicons name={expanded ? 'chevron-up-circle' : 'add-circle'} size={20} color={Colors.primary} />
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.chipRow}>
          {options.map((o) => (
            <Chip key={o.key} label={o.label} selected={selectedKeys.includes(o.key)} onPress={() => onToggle(o.key)} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  label: { flexShrink: 1 },
  trigger: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
