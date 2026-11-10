import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/yumi/app-text';
import { EducationTopicCard } from '@/components/yumi/education/topic-card';
import { ScreenContainer } from '@/components/yumi/screen-container';
import { getEducationTopics } from '@/constants/education-hub';
import { Colors, Spacing } from '@/constants/theme';

export default function EducationScreen() {
  const { t } = useTranslation();
  return (
    <ScreenContainer tabBar>
      <AppText variant="h1" style={styles.pageTitle}>
        {t('education.hubTitle')}
      </AppText>
      <AppText variant="body" color={Colors.textSecondary} style={styles.subtitle}>
        {t('education.hubSubtitle')}
      </AppText>

      <View style={styles.list}>
        {getEducationTopics().map((topic, i) => (
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
