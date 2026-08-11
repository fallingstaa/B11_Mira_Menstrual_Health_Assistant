import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Card } from '@/components/mira/card';
import { IconCircle } from '@/components/mira/icon-circle';
import { HealthTip } from '@/constants/mock-data';
import { Radius, Spacing } from '@/constants/theme';

type Props = {
  tip: HealthTip;
  delay?: number;
};

/** Small tagged tip card shown in a row on the first-time Home screen. */
export function HealthTipCard({ tip, delay = 0 }: Props) {
  return (
    <Card delay={delay} style={styles.card}>
      <IconCircle color={tip.iconTint} size={40}>
        <Ionicons name={tip.icon as keyof typeof Ionicons.glyphMap} size={18} color={tip.iconColor} />
      </IconCircle>
      <View style={[styles.tag, { backgroundColor: tip.tagTint }]}>
        <AppText variant="caption" color={tip.tagColor}>
          {tip.tag}
        </AppText>
      </View>
      <AppText variant="bodyMedium" style={styles.title}>
        {tip.title}
      </AppText>
      <AppText variant="small" numberOfLines={3} style={styles.body}>
        {tip.body}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, gap: Spacing.sm },
  tag: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.pill },
  title: {},
  body: { lineHeight: 17 },
});
