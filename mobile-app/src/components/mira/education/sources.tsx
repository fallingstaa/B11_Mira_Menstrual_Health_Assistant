import { Ionicons } from '@expo/vector-icons';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { Source } from '@/constants/education-hub';

async function openSource(source: Source) {
  try {
    await Linking.openURL(source.url);
  } catch {
    Alert.alert('Could not open the link', `Please try ${source.label} again later.`);
  }
}

/** Tappable citation list. Shows only each source's name — the link itself opens on tap, never on screen. */
export function EducationSources({ sources, color }: { sources: Source[]; color: string }) {
  return (
    <View style={styles.list}>
      {sources.map((s) => (
        <Pressable
          key={`${s.label}-${s.url}`}
          onPress={() => openSource(s)}
          accessibilityRole="link"
          accessibilityLabel={`${s.label}, opens in your browser`}
          style={styles.row}>
          <Ionicons name="book-outline" size={18} color={color} />
          <AppText variant="bodyMedium" style={styles.label}>
            {s.label}
          </AppText>
          <Ionicons name="open-outline" size={16} color={Colors.textMuted} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceAlt,
  },
  label: { flex: 1 },
});
