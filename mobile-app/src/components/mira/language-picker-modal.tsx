import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';

/** The two languages Profile's Language row can be set to — matches the free-text
 *  `preferredLanguage` field the backend already stores and PUTs (see profile.tsx). */
export const LANGUAGE_OPTIONS = [
  { value: 'English', label: 'English', native: 'English' },
  { value: 'Khmer', label: 'Khmer', native: 'ខ្មែរ' },
] as const;

type Props = {
  visible: boolean;
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
};

/**
 * "Choose Language" popup off Profile's Language row. Only adds the option for now — picking
 * Khmer saves the preference (same optimistic PUT /profile/me pattern as the toggles above it on
 * Profile) but doesn't retranslate the app's own UI text yet; that's a separate, larger effort.
 * Selecting a row applies immediately and closes, same one-tap feel as a toggle switch — no
 * separate "Save" step for a two-option pick like this.
 */
export function LanguagePickerModal({ visible, value, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, Shadow.raised]}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <AppText variant="h2">Choose Language</AppText>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </Pressable>
          </View>

          {LANGUAGE_OPTIONS.map((opt, i) => {
            const selected = opt.value === value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => onSelect(opt.value)}
                style={[styles.row, i !== 0 && styles.rowBorder, selected && styles.rowSelected]}>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyMedium">{opt.label}</AppText>
                  <AppText variant="small" color={Colors.textMuted} style={styles.native}>
                    {opt.native}
                  </AppText>
                </View>
                {selected && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
              </Pressable>
            );
          })}

          <View style={styles.noteBox}>
            <Ionicons name="information-circle-outline" size={15} color={Colors.textMuted} />
            <AppText variant="small" color={Colors.textMuted} style={styles.noteText}>
              More of the app will be translated into Khmer soon — for now this just saves your preference.
            </AppText>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.overlay },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  rowSelected: { backgroundColor: Colors.tint50 },
  native: { marginTop: 2 },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  noteText: { flex: 1, lineHeight: 17 },
});
