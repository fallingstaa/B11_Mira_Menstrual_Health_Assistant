import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

type Props = {
  /** Short caps label, e.g. "DAY TYPE" or "PERIOD STATUS". */
  label: string;
  confirmed: boolean;
  confirmedText?: string;
  unconfirmedText?: string;
  /** The chip row (or whatever picker) being confirmed. */
  children: ReactNode;
  style?: ViewStyle;
};

/**
 * A small label + status badge wrapped around a chip picker whose options must be *chosen*, not
 * silently defaulted to whichever one happens to render first/selected. Originally built for
 * PeriodDayEditor's "Day type" (Period day / Spotting / End day) — pulled out into its own
 * component so checkin.tsx's "Period status" (the same 3 options, same wording) gets the exact
 * same treatment: nothing reads as pre-chosen for the user until they've actually tapped one.
 */
export function ConfirmChipGroup({ label, confirmed, confirmedText = 'Confirmed', unconfirmedText = 'Confirm below', children, style }: Props) {
  return (
    <View style={[styles.box, !confirmed && styles.boxUnconfirmed, style]}>
      <View style={styles.labelRow}>
        <AppText variant="caption" numberOfLines={1} style={styles.label}>
          {label}
        </AppText>
        <View style={[styles.badge, confirmed ? styles.badgeDone : styles.badgeNeeded]}>
          <Ionicons name={confirmed ? 'checkmark-circle' : 'alert-circle'} size={12} color={confirmed ? Colors.primary : Colors.textOnPrimary} />
          <AppText variant="caption" color={confirmed ? Colors.primary : Colors.textOnPrimary} numberOfLines={1} style={styles.badgeText}>
            {confirmed ? confirmedText : unconfirmedText}
          </AppText>
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // Deliberately styled to stand apart from plain "· optional" fields around it — this represents
  // a real fact the user needs to actively confirm, not something the UI should quietly assume.
  // Kept compact on purpose — a small label + badge, not a tall bordered card.
  box: {
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: 'transparent',
  },
  // Same "needs your attention" treatment used elsewhere in the app (e.g. the emphasized option
  // on period-setup.tsx) — the brand pink, not an off-brand yellow/warning color.
  boxUnconfirmed: { backgroundColor: Colors.tint50 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm, marginBottom: Spacing.sm },
  label: { flexShrink: 1 },
  badge: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  badgeNeeded: { backgroundColor: Colors.primary },
  badgeDone: { backgroundColor: Colors.tint100 },
  // flexShrink (not just the parent badge's) is what actually prevents the last letter of
  // "Confirm below" from clipping — without it, Text next to an icon in a row can overflow past
  // the pill's rounded edge instead of shrinking or wrapping to fit.
  badgeText: { flexShrink: 1 },
});
