import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Card } from '@/components/mira/card';
import { IconCircle } from '@/components/mira/icon-circle';
import { Colors, Spacing } from '@/constants/theme';
import type { Topic } from '@/constants/education-hub';

type Props = { topic: Topic; number: number; delay?: number; onPress: () => void };

/** One of the six Education Hub topics on the hub screen. */
export function EducationTopicCard({ topic, number, delay = 0, onPress }: Props) {
  // Teaser = the topic's own section titles (or "N myths to bust"), so nothing here is new copy.
  const teaser = topic.myths
    ? `${topic.myths.length} myths to bust`
    : topic.sections.map((s) => s.title).join(' · ');

  return (
    <Card delay={delay} style={[styles.card, { backgroundColor: topic.tint }]} noShadow>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={topic.title} style={styles.row}>
        <IconCircle color={Colors.surface} size={56}>
          <Ionicons name={topic.icon} size={26} color={topic.color} />
        </IconCircle>
        <View style={styles.textWrap}>
          <AppText variant="caption" color={topic.color}>
            TOPIC {number}
          </AppText>
          <AppText variant="h3" style={styles.title}>
            {topic.title}
          </AppText>
          <AppText variant="small" numberOfLines={2}>
            {teaser}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={topic.color} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  textWrap: { flex: 1 },
  title: { marginTop: 2, marginBottom: 2 },
});
