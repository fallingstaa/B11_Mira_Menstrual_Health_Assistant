import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Chip } from '@/components/mira/chip';
import { flowLevels, moodOptions, symptomOptions } from '@/constants/mock-data';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { PeriodDayEntry } from '@/context/app-state';
import { dateKey, eachDayInRange, formatLong, formatRange } from '@/utils/date';

export type RecapCycle = { start: Date; end: Date; cycleLength: number | null };

type Props = {
  visible: boolean;
  cycle: RecapCycle | null;
  entries: Record<string, PeriodDayEntry>;
  onClose: () => void;
};

const flowLabel = (key: string) => flowLevels.find((f) => f.key === key)?.label ?? key;
const symptomLabel = (key: string) => symptomOptions.find((s) => s.key === key)?.label ?? key;
const moodLabelOf = (key: string) => moodOptions.find((m) => m.key === key)?.label ?? key;

/**
 * "Read this cycle back" popup — opened by tapping a row in Prediction's Cycle History. A plain,
 * friendly recap of exactly what was logged for that one cycle: every symptom and mood noticed
 * across it, then a day-by-day breakdown. Nothing here is editable — it's a look-back note, not
 * another editor; PeriodDayEditor (Calendar) is still the only place any of this actually changes.
 *
 * Built straight from `periodEntries`, so a demo/example cycle (before the user has logged
 * anything real) naturally has no matching entries and falls through to the "nothing logged"
 * message below instead of needing its own special case.
 */
export function CycleRecapModal({ visible, cycle, entries, onClose }: Props) {
  const days = cycle
    ? eachDayInRange(cycle.start, cycle.end)
        .map((date) => entries[dateKey(date)])
        .filter((entry): entry is PeriodDayEntry => !!entry)
    : [];

  const symptomKeys = Array.from(new Set(days.flatMap((d) => d.symptoms)));
  const moodKeys = Array.from(new Set(days.flatMap((d) => d.mood)));

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, Shadow.raised]}>
          <View style={styles.handle} />
          {cycle && (
            <>
              <View style={styles.headerRow}>
                <View style={styles.headerIcon}>
                  <Ionicons name="reader-outline" size={20} color={Colors.primary} />
                </View>
                <View style={styles.headerText}>
                  <AppText variant="h2" numberOfLines={1}>
                    {formatRange(cycle.start, cycle.end)}, {cycle.start.getFullYear()}
                  </AppText>
                  <AppText variant="small" numberOfLines={1} color={Colors.textMuted} style={styles.headerSubtitle}>
                    {days.length} day{days.length === 1 ? '' : 's'} logged
                    {cycle.cycleLength ? ` · ${cycle.cycleLength}-day cycle` : ' · First recorded cycle'}
                  </AppText>
                </View>
                <Pressable onPress={onClose} hitSlop={8}>
                  <Ionicons name="close" size={22} color={Colors.textMuted} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {days.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="document-text-outline" size={18} color={Colors.textMuted} />
                    <AppText variant="small" color={Colors.textMuted} style={styles.emptyText}>
                      No day-by-day details were logged for this cycle — just the dates above.
                    </AppText>
                  </View>
                ) : (
                  <>
                    {symptomKeys.length > 0 && (
                      <View style={styles.tagSection}>
                        <AppText variant="caption" numberOfLines={1} style={styles.tagLabel}>
                          SYMPTOMS NOTICED
                        </AppText>
                        <View style={styles.tagRow}>
                          {symptomKeys.map((key) => (
                            <Chip key={key} label={symptomLabel(key)} selected />
                          ))}
                        </View>
                      </View>
                    )}

                    {moodKeys.length > 0 && (
                      <View style={styles.tagSection}>
                        <AppText variant="caption" numberOfLines={1} style={styles.tagLabel}>
                          MOOD NOTICED
                        </AppText>
                        <View style={styles.tagRow}>
                          {moodKeys.map((key) => (
                            <Chip key={key} label={moodLabelOf(key)} color={Colors.lavender} selected />
                          ))}
                        </View>
                      </View>
                    )}

                    <AppText variant="caption" numberOfLines={1} style={styles.tagLabel}>
                      DAY BY DAY
                    </AppText>
                    <View style={styles.dayList}>
                      {days.map((entry, i) => {
                        const details = [
                          entry.flow ? flowLabel(entry.flow) : null,
                          entry.symptoms.length ? entry.symptoms.map(symptomLabel).join(', ') : null,
                          entry.mood.length ? entry.mood.map(moodLabelOf).join(', ') : null,
                        ]
                          .filter(Boolean)
                          .join(' · ');
                        return (
                          <View key={dateKey(entry.date)} style={[styles.dayRow, i !== 0 && styles.dayRowBorder]}>
                            <View style={styles.dayHeaderRow}>
                              <AppText variant="bodyMedium" numberOfLines={1} style={styles.dayDate}>
                                {formatLong(entry.date)}
                              </AppText>
                              {entry.isEnd && (
                                <View style={styles.endTag}>
                                  <Ionicons name="flag" size={9} color={Colors.primaryDark} />
                                  <AppText variant="caption" color={Colors.primaryDark}>
                                    End
                                  </AppText>
                                </View>
                              )}
                            </View>
                            <AppText variant="small" numberOfLines={2} color={Colors.textMuted} style={styles.dayDetails}>
                              {details || 'No extra details logged'}
                            </AppText>
                          </View>
                        );
                      })}
                    </View>
                  </>
                )}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.overlay },
  sheet: {
    maxHeight: '85%',
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.lg },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Colors.tint50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  headerSubtitle: { marginTop: 2 },
  scroll: { paddingBottom: Spacing.xxxl },
  emptyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.lg,
  },
  emptyText: { flex: 1, lineHeight: 18 },
  tagSection: { marginBottom: Spacing.lg },
  tagLabel: { color: Colors.textMuted, marginBottom: Spacing.sm },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  dayList: {
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceAlt,
    // Dashed top border where the "day by day" list starts — the one small nod to this being a
    // note/receipt-style recap rather than another data-entry card.
    borderStyle: 'dashed',
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  dayRow: { paddingVertical: Spacing.sm + 2 },
  dayRowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  dayHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dayDate: { flex: 1 },
  dayDetails: { marginTop: 2 },
  endTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.tint50,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
});
