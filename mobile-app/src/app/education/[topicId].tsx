import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/yumi/app-text';
import { EducationAccordion, EducationParagraph } from '@/components/yumi/education/accordion';
import { CycleWheel } from '@/components/yumi/education/cycle-wheel';
import { FirstPeriodActivity } from '@/components/yumi/education/first-period-activity';
import { HygieneActivity } from '@/components/yumi/education/hygiene-activity';
import { YUMI_CLEARANCE, YumiProvider } from '@/components/yumi/education/yumi-companion';
import { MythStack } from '@/components/yumi/education/myth-stack';
import { EducationSources } from '@/components/yumi/education/sources';
import { EducationSteps } from '@/components/yumi/education/steps';
import { SymptomActivity } from '@/components/yumi/education/symptom-activity';
import { TrafficLight } from '@/components/yumi/education/traffic-light';
import { IconCircle } from '@/components/yumi/icon-circle';
import { ScreenContainer } from '@/components/yumi/screen-container';
import { ScreenHeader } from '@/components/yumi/screen-header';
import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { educationTopics, getEducationTopic, Section, Topic } from '@/constants/education-hub';

// Yumi Drop's opening line for each topic — friendly, no medical claims.
const GREETINGS: Record<string, string> = {
  'first-period': "Hi, I'm Yumi Drop! Drag the timeline and tap the cards. I'll be right here.",
  'understanding-your-cycle': "Hi, I'm Yumi Drop! Tap a phase and watch the wheel spin.",
  'period-hygiene': "Hi, I'm Yumi Drop! Let's pack a school kit together.",
  'period-symptoms': "Hi, I'm Yumi Drop! Pick a symptom to see what's going on.",
  'myths-and-facts': "Hi, I'm Yumi Drop! Ready to bust some myths? Swipe the cards!",
  'when-to-ask-for-help': "Hi, I'm Yumi Drop! Tap a light. Asking for help is always okay.",
};

/** The one interactive widget that opens each topic. */
function Activity({ topic }: { topic: Topic }) {
  switch (topic.id) {
    case 'first-period':
      return <FirstPeriodActivity />;
    case 'understanding-your-cycle':
      return <CycleWheel />;
    case 'period-hygiene':
      return <HygieneActivity />;
    case 'period-symptoms':
      return <SymptomActivity />;
    case 'myths-and-facts':
      return <MythStack />;
    case 'when-to-ask-for-help':
      return <TrafficLight />;
    default:
      return null;
  }
}

export default function EducationTopicScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const topic = getEducationTopic(topicId) ?? educationTopics[0];
  const number = educationTopics.indexOf(topic) + 1;

  return (
    <YumiProvider greeting={GREETINGS[topic.id] ?? "Hi, I'm Yumi Drop!"}>
      {/* Pinned outside the scroll area, so the back button is always reachable — even at the very end of a long topic. */}
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.headerSafe}>
        <View style={styles.headerInner}>
          <ScreenHeader title="Education Hub" />
        </View>
      </SafeAreaView>

      <ScreenContainer edges={['left', 'right']} contentStyle={{ paddingBottom: YUMI_CLEARANCE + Spacing.xl }}>
        <View style={[styles.hero, { backgroundColor: topic.tint }]}>
          <IconCircle color={Colors.surface} size={64}>
            <Ionicons name={topic.icon} size={30} color={topic.color} />
          </IconCircle>
          <View style={styles.heroText}>
            <AppText variant="caption" color={topic.color}>
              TOPIC {number} OF {educationTopics.length}
            </AppText>
            <AppText variant="h1">{topic.title}</AppText>
          </View>
        </View>

        <Activity topic={topic} />

        {/* Topic 5's cards already carry all of its text; every other topic keeps the full write-up. */}
        {topic.sections.length > 0 ? (
          <View style={styles.details}>
            <AppText variant="h3" style={styles.detailsTitle}>
              Full details
            </AppText>
            {topic.sections.map((section, i) => (
              <EducationAccordion key={section.id} title={section.title} icon={section.icon} color={topic.color} tint={topic.tint} delay={i * 60}>
                <SectionBody section={section} color={topic.color} tint={topic.tint} />
              </EducationAccordion>
            ))}
          </View>
        ) : null}

        <AppText variant="h3" style={styles.sourcesTitle}>
          Sources &amp; Citations
        </AppText>
        <EducationSources sources={topic.sources} color={topic.color} />
      </ScreenContainer>
    </YumiProvider>
  );
}

function SectionBody({ section, color, tint }: { section: Section; color: string; tint: string }) {
  switch (section.kind) {
    case 'steps':
      return <EducationSteps intro={section.intro} steps={section.steps} color={color} tint={tint} />;
    case 'phases':
      return (
        <>
          <EducationParagraph>{section.intro}</EducationParagraph>
          {section.slides.map((s) => (
            <EducationParagraph key={s.title}>{s.text}</EducationParagraph>
          ))}
        </>
      );
    case 'text':
      return (
        <>
          {section.paragraphs.map((p, i) => (
            <EducationParagraph key={i}>{p}</EducationParagraph>
          ))}
        </>
      );
  }
}

const styles = StyleSheet.create({
  headerSafe: { backgroundColor: Colors.background },
  headerInner: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? MaxContentWidth : undefined,
    alignSelf: 'center',
    paddingTop: Spacing.sm,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    marginBottom: Spacing.xl,
  },
  heroText: { flex: 1 },
  details: { marginTop: Spacing.xxl },
  detailsTitle: { marginBottom: Spacing.md },
  sourcesTitle: { marginTop: Spacing.xl, marginBottom: Spacing.md },
});
