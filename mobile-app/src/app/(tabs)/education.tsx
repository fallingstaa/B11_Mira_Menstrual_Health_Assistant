import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Chip } from '@/components/mira/chip';
import { EducationCard } from '@/components/mira/education-card';
import { ScreenContainer } from '@/components/mira/screen-container';
import { articles, Article } from '@/constants/mock-data';
import { Colors, Spacing } from '@/constants/theme';

const categories: (Article['category'] | 'All')[] = ['All', 'Basics', 'Hygiene', 'Symptoms', 'Myths'];

export default function EducationScreen() {
  const [category, setCategory] = useState<(typeof categories)[number]>('All');

  const filtered = category === 'All' ? articles : articles.filter((a) => a.category === category);

  return (
    <ScreenContainer tabBar>
      <AppText variant="h1" style={styles.pageTitle}>
        Education
      </AppText>
      <AppText variant="body" color={Colors.textSecondary} style={styles.subtitle}>
        Judgement-free answers, written for you.
      </AppText>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {categories.map((c) => (
          <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
        ))}
      </ScrollView>

      <View style={styles.list}>
        {filtered.map((article, i) => (
          <EducationCard
            key={article.id}
            article={article}
            delay={i * 50}
            onPress={() => router.push({ pathname: '/article/[id]', params: { id: article.id } })}
          />
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  pageTitle: { marginTop: Spacing.md },
  subtitle: { marginTop: 2, marginBottom: Spacing.lg },
  filterRow: { gap: Spacing.sm, paddingBottom: Spacing.lg },
  list: { marginTop: Spacing.xs },
});
