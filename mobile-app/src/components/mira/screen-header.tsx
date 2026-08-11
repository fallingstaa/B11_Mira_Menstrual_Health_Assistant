import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onBack?: () => void;
};

/** Shared header for pushed screens: back chevron, title, optional trailing action. */
export function ScreenHeader({ title, subtitle, right, onBack }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        hitSlop={8}
        onPress={onBack ?? (() => router.back())}
        style={styles.backButton}>
        <Ionicons name="chevron-back" size={22} color={Colors.text} />
      </Pressable>
      <View style={styles.titleWrap}>
        <AppText variant="h2" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="small" style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Colors.tint50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: { flex: 1 },
  subtitle: { marginTop: 2 },
  right: { minWidth: 40, alignItems: 'flex-end' },
});
