import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { EducationTopicCard } from '@/components/mira/education/topic-card';
import { ScreenContainer } from '@/components/mira/screen-container';
import { educationTopics } from '@/constants/education-hub';
import { Colors, Spacing } from '@/constants/theme';

export default function EducationScreen() {
  return (
    <ScreenContainer tabBar>
      <AppText variant="h1" style={styles.pageTitle}>
        Education Hub
      </AppText>
      <AppText variant="body" color={Colors.textSecondary} style={styles.subtitle}>
        Judgement-free answers, written for you.
      </AppText>

      <View style={styles.list}>
        {educationTopics.map((topic, i) => (
          <EducationTopicCard
            key={topic.id}
            topic={topic}
            number={i + 1}
            delay={i * 60}
            onPress={() => router.push({ pathname: '/education/[topicId]', params: { topicId: topic.id } })}
          />
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  pageTitle: { marginTop: Spacing.md },
  subtitle: { marginTop: 2, marginBottom: Spacing.lg },
  list: { marginTop: Spacing.xs },
});
