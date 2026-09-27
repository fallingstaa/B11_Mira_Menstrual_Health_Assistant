import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/mira/app-text';
import { IconCircle } from '@/components/mira/icon-circle';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import type { IconName } from '@/constants/education-hub';

type Props = {
  title: string;
  icon: IconName;
  color: string;
  tint: string;
  children: ReactNode;
  defaultOpen?: boolean;
  /** Staggers the entrance of a list of accordions. */
  delay?: number;
};

/** Tap-to-expand section: chevron flips, body fades in, sibling cards glide to make room. */
export function EducationAccordion({ title, icon, color, tint, children, defaultOpen = false, delay = 0 }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const progress = useSharedValue(defaultOpen ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, { duration: 260 });
  }, [open, progress]);

  const chevronStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${progress.value * 180}deg` }] }));

  return (
    <Animated.View
      entering={FadeInUp.duration(380).delay(delay)}
      style={[styles.card, open && { borderColor: color }]}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
        style={styles.header}>
        <IconCircle color={tint} size={40}>
          <Ionicons name={icon} size={20} color={color} />
        </IconCircle>
        <AppText variant="h3" style={styles.title}>
          {title}
        </AppText>
        <Animated.View style={chevronStyle}>
          <Ionicons name="chevron-down" size={20} color={color} />
        </Animated.View>
      </Pressable>

      {open ? (
        <View style={styles.body}>
          {children}
        </View>
      ) : null}
    </Animated.View>
  );
}

/** Plain paragraph inside an accordion body. */
export function EducationParagraph({ children }: { children: string }) {
  return (
    <AppText variant="body" style={styles.paragraph}>
      {children}
    </AppText>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  title: { flex: 1 },
  body: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, gap: Spacing.md },
  paragraph: { lineHeight: 23 },
});
