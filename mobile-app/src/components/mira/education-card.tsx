import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Card } from '@/components/mira/card';
import { IconCircle } from '@/components/mira/icon-circle';
import { Article } from '@/constants/mock-data';
import { Colors, Spacing } from '@/constants/theme';

type Props = {
  article: Article;
  onPress?: () => void;
  delay?: number;
};

/** Horizontal article preview card used on Home and the Education list. */
export function EducationCard({ article, onPress, delay = 0 }: Props) {
  return (
    <Card delay={delay} style={styles.card}>
      <Pressable onPress={onPress} style={styles.row}>
        <IconCircle color={article.tint} size={54}>
          <Ionicons name={article.icon} size={24} color={article.color} />
        </IconCircle>
        <View style={styles.textWrap}>
          <AppText variant="caption" color={article.color}>
            {article.category.toUpperCase()}
          </AppText>
          <AppText variant="h3" numberOfLines={2} style={styles.title}>
            {article.title}
          </AppText>
          <AppText variant="small" numberOfLines={1} style={styles.summary}>
            {article.readTime}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  textWrap: { flex: 1 },
  title: { marginTop: 2 },
  summary: { marginTop: 2 },
});
