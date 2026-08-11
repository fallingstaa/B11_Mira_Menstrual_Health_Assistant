import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

type Props = { title: string; subtitle?: string };

/** Header for modally-presented screens (Record, Check-in): title + close button. */
export function ModalHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.dragHandle} />
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <AppText variant="h1">{title}</AppText>
          {subtitle ? (
            <AppText variant="small" style={{ marginTop: 2 }}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        <Pressable style={styles.closeButton} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={20} color={Colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingTop: Spacing.sm, marginBottom: Spacing.xl },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.xl,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Colors.tint50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
