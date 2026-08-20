import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { IconCircle } from '@/components/mira/icon-circle';
import { ScreenContainer } from '@/components/mira/screen-container';
import { ScreenHeader } from '@/components/mira/screen-header';
import { articles } from '@/constants/mock-data';
import { Colors, Spacing } from '@/constants/theme';

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const article = articles.find((a) => a.id === id) ?? articles[0];

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScreenHeader title="Article" />

      <View style={[styles.hero, { backgroundColor: article.tint }]}>
        <IconCircle color={Colors.surface} size={64}>
          <Ionicons name={article.icon} size={30} color={article.color} />
        </IconCircle>
      </View>

      <AppText variant="caption" color={article.color} style={styles.category}>
        {article.category.toUpperCase()} · {article.readTime}
      </AppText>
      <AppText variant="h1" style={styles.title}>
        {article.title}
      </AppText>
      <AppText variant="bodyLarge" color={Colors.textSecondary} style={styles.summary}>
        {article.summary}
      </AppText>

      <View style={styles.divider} />

      {article.body.map((paragraph, i) => (
        <AppText key={i} variant="bodyLarge" style={styles.paragraph}>
          {paragraph}
        </AppText>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 140,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  category: { marginBottom: Spacing.sm },
  title: { marginBottom: Spacing.sm },
  summary: { marginBottom: Spacing.lg, lineHeight: 24 },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.lg },
  paragraph: { marginBottom: Spacing.lg, lineHeight: 25 },
});
