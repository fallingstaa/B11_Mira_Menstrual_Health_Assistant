import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/yumi/app-text';
import { Button } from '@/components/yumi/button';
import { Card } from '@/components/yumi/card';
import { ChristmasBanner } from '@/components/yumi/christmas/christmas-banner';
import { CycleRing } from '@/components/yumi/cycle-ring';
import { EducationTopicCard } from '@/components/yumi/education/topic-card';
import { GettingStartedCard, GettingStartedStep } from '@/components/yumi/getting-started-card';
import { HealthTipCard } from '@/components/yumi/health-tip-card';
import { IconCircle } from '@/components/yumi/icon-circle';
import { MascotMini } from '@/components/yumi/mascot';
import { QuickAction } from '@/components/yumi/quick-action';
import { ScreenContainer } from '@/components/yumi/screen-container';
import { SectionHeader } from '@/components/yumi/section-header';
import { getEducationTopics } from '@/constants/education-hub';
import { healthTips } from '@/constants/mock-data';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { useSeasonalTheme } from '@/context/seasonal-theme';
import i18n, { formatDays, phaseName } from '@/i18n';
import { useAvatarAuthHeader } from '@/hooks/use-avatar-header';
import { apiRequest } from '@/utils/api';
import { daysBetween, greeting, parseIsoDate } from '@/utils/date';

type HomeProfile = { name: string; avatarUrl: string | null };


/**
 * Shape of `GET /api/menstrual/prediction` this screen actually reads — currentDay/phase are
 * null until a first period's ever been logged (see predictionService.js). `phase` is already
 * the full label ("Menstrual phase", "Luteal phase", ...) — no client-side re-derivation needed,
 * unlike the old local `cyclePhase()` this replaced (that duplication is exactly what this
 * endpoint's own doc comment invited replacing — see menstrualController.js).
 */
type HomePrediction = {
  currentDay: number | null;
  averageCycleLength: number;
  averagePeriodLength: number;
  phase: string | null;
  nextPeriodStart: string | null;
};

/** "In 5 days" / "Today" / "2 days late" — the ONLY thing shown for the prediction, per spec (no date range). */
function relativePeriodText(nextPeriodStartDate: Date): string {
  const remaining = daysBetween(new Date(), nextPeriodStartDate);
  if (remaining === 0) return i18n.t('home.today');
  if (remaining > 0) return i18n.t(remaining === 1 ? 'home.inDaysOne' : 'home.inDaysOther', { n: remaining });
  const late = Math.abs(remaining);
  return i18n.t(late === 1 ? 'home.daysLateOne' : 'home.daysLateOther', { n: late });
}

export default function HomeScreen() {
  const { firstPeriodRecorded, firstQuestionAsked, hydrated } = useAppState();
  const { t } = useTranslation();
  const { christmas } = useSeasonalTheme();
  const educationTopics = getEducationTopics();
  const featuredTopics = educationTopics.slice(1, 3);
  const [profile, setProfile] = useState<HomeProfile | null>(null);
  const [prediction, setPrediction] = useState<HomePrediction | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  const onboardingDone = firstPeriodRecorded && firstQuestionAsked;
  const avatarAuthHeader = useAvatarAuthHeader(profile?.avatarUrl);

  // Refetches every time Home regains focus, not just on first mount — otherwise recording a
  // period on Calendar/checkin/etc. and tabbing back here would keep showing whatever the hero
  // card last loaded instead of the day/phase/prediction that write just changed. Same reason
  // the bell badge is refetched here too, not read off a static import — reading/marking-all-read
  // on the Notifications screen should be reflected the moment you come back to Home.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all([
        apiRequest<HomeProfile>('/profile/me'),
        apiRequest<HomePrediction>('/menstrual/prediction'),
        apiRequest<{ read: boolean }[]>('/reminders'),
      ])
        .then(([profileData, predictionData, reminders]) => {
          if (cancelled) return;
          setProfile(profileData);
          setPrediction(predictionData);
          setUnreadCount(reminders.filter((r) => !r.read).length);
        })
        .catch((err) => {
          console.error('[home] failed to load /profile/me, /menstrual/prediction, or /reminders:', err);
        })
        .finally(() => {
          if (!cancelled) setDataLoaded(true);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const avatarInitial = profile?.name?.trim().charAt(0).toUpperCase() || '?';
  const nextPeriodStartDate = prediction?.nextPeriodStart ? parseIsoDate(prediction.nextPeriodStart) : null;

  const steps: GettingStartedStep[] = [
    { key: 'account', label: t('home.steps.account'), sublabel: t('home.steps.done'), done: true },
    { key: 'onboarding', label: t('home.steps.onboarding'), sublabel: t('home.steps.completed'), done: true },
    {
      key: 'period',
      label: t('home.steps.period'),
      sublabel: firstPeriodRecorded ? t('home.steps.completed') : t('home.steps.periodHint'),
      done: firstPeriodRecorded,
      onPress: () => router.push('/period-setup'),
    },
    {
      key: 'question',
      label: t('home.steps.question'),
      sublabel: firstQuestionAsked ? t('home.steps.completed') : t('home.steps.questionHint'),
      done: firstQuestionAsked,
      onPress: () => router.push('/(tabs)/assistant'),
    },
  ];

  // Waiting on either app-state's own hydration (periodEntries, which firstPeriodRecorded is
  // derived from) or this screen's own profile/prediction fetch would otherwise flash the
  // "Welcome to Yumi!" first-time layout for a returning user for a moment before flipping to
  // their real hero card the instant real data lands — this gate skips straight past that flash.
  if (!hydrated || !dataLoaded) {
    return (
      <ScreenContainer tabBar>
        <View style={styles.loadingWrap}>
          <MascotMini size={40} />
          <AppText variant="small" color={Colors.textMuted} style={{ marginTop: Spacing.sm }}>
            {t('home.loading')}
          </AppText>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer tabBar>
      {firstPeriodRecorded ? (
        <>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              {/* Real photo once it's loaded and its auth header is ready — see profile.tsx for
                  why the header is needed and why this can't just render immediately. */}
              {profile?.avatarUrl && avatarAuthHeader ? (
                <Image source={{ uri: profile.avatarUrl, headers: avatarAuthHeader }} style={styles.avatarImage} />
              ) : (
                <IconCircle color={Colors.tint100} size={46}>
                  <AppText variant="h3" color={Colors.primary}>
                    {avatarInitial}
                  </AppText>
                </IconCircle>
              )}
              <View>
                <AppText variant="h2">{t('home.hi', { name: profile?.name ?? '' })}</AppText>
                <AppText variant="small">
                  {prediction?.currentDay ? t('home.day', { day: prediction.currentDay }) : t('home.dayUnknown')}
                  {prediction?.phase ? ` · ${phaseName(prediction.phase)}` : ''}
                </AppText>
              </View>
            </View>
            <NotificationBell unreadCount={unreadCount} />
          </View>

          <Card padded={false} style={styles.heroCard} noShadow delay={0}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}>
              <View style={styles.heroTop}>
                <CycleRing currentDay={prediction?.currentDay ?? 1} cycleLength={prediction?.averageCycleLength ?? 28} />
                <View style={styles.heroStats}>
                  <HeroStat label={t('home.avgCycle')} value={formatDays(prediction?.averageCycleLength ?? 28)} />
                  <HeroStat label={t('home.avgPeriod')} value={formatDays(prediction?.averagePeriodLength ?? 5)} />
                </View>
              </View>

              <View style={styles.heroDivider} />

              <View style={styles.heroBottom}>
                <View style={{ flex: 1 }}>
                  <AppText variant="small" color="rgba(255,255,255,0.85)">
                    {t('home.nextPeriod')}
                  </AppText>
                  {/* From GET /api/menstrual/prediction's nextPeriodStart — relative days only, no date range. */}
                  <AppText variant="h3" color={Colors.textOnPrimary} style={{ marginTop: 2 }}>
                    {nextPeriodStartDate ? relativePeriodText(nextPeriodStartDate) : '—'}
                  </AppText>
                </View>
                <Pressable style={styles.heroCta} onPress={() => router.push('/prediction')}>
                  <AppText variant="bodyMedium" color={Colors.primary}>
                    {t('home.details')}
                  </AppText>
                </Pressable>
              </View>
            </LinearGradient>
          </Card>
        </>
      ) : (
        <Card padded={false} style={styles.welcomeCard} noShadow delay={0}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.welcomeGradient}>
            <View style={styles.welcomeHeaderRow}>
              <View>
                <AppText variant="bodyLarge" color="rgba(255,255,255,0.85)">
                  {greeting()},
                </AppText>
                <AppText variant="h1" color={Colors.textOnPrimary} style={{ marginTop: 2 }}>
                  {profile?.name}
                </AppText>
              </View>
              <NotificationBell unreadCount={unreadCount} onColor />
            </View>

            <IconCircle color="rgba(255,255,255,0.22)" size={48}>
              <Ionicons name="water" size={22} color={Colors.textOnPrimary} />
            </IconCircle>
            <AppText variant="h2" color={Colors.textOnPrimary} style={{ marginTop: Spacing.md }}>
              {t('home.welcomeTitle')}
            </AppText>
            <AppText variant="bodyMedium" color="rgba(255,255,255,0.85)" style={{ marginTop: 2 }}>
              {t('home.welcomeSubtitle')}
            </AppText>
            <AppText variant="body" color="rgba(255,255,255,0.85)" style={styles.welcomeParagraph}>
              {t('home.welcomeBody')}
            </AppText>
            <Button
              label={t('home.recordFirstPeriod')}
              variant="secondary"
              icon={<Ionicons name="water" size={16} color={Colors.primary} />}
              onPress={() => router.push('/period-setup')}
              style={styles.welcomeCta}
            />
          </LinearGradient>
        </Card>
      )}

      {christmas ? <ChristmasBanner name={profile?.name} /> : null}

      <CycleBasicsBanner />

      <View style={styles.section}>
        <SectionHeader title={t('home.quickActions')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsRow}>
          <QuickAction
            label={t('home.actions.record')}
            icon="water"
            color={Colors.primary}
            tint={Colors.tint50}
            // Routes into Calendar instead of the old standalone /record screen — Calendar's own
            // day editor (tap a day → same Record/Update Record flow) already covers this, so
            // there's no separate flow to keep in sync anymore.
            onPress={() => router.push(firstPeriodRecorded ? '/(tabs)/calendar' : '/period-setup')}
          />
          <QuickAction label={t('tabs.calendar')} icon="calendar" color={Colors.teal} tint={Colors.tealTint} onPress={() => router.push('/(tabs)/calendar')} />
          <QuickAction label={t('home.actions.education')} icon="book" color={Colors.lavender} tint={Colors.lavenderTint} onPress={() => router.push('/(tabs)/education')} />
          <QuickAction label={t('home.actions.assistant')} icon="chatbubble-ellipses" color={Colors.peach} tint={Colors.peachTint} onPress={() => router.push('/(tabs)/assistant')} />
          <QuickAction label={t('home.actions.reminders')} icon="alarm" color={Colors.info} tint={Colors.infoTint} onPress={() => router.push('/notifications')} />
          <QuickAction label={t('home.actions.shareCard')} icon="sparkles" color={Colors.lavender} tint={Colors.lavenderTint} onPress={() => router.push('/share-card')} />
          <QuickAction label={t('home.actions.checkins')} icon="heart" color={Colors.success} tint={Colors.successTint} onPress={() => router.push('/checkin-history')} />
        </ScrollView>
      </View>

      {!onboardingDone && (
        <View style={styles.section}>
          <GettingStartedCard steps={steps} delay={80} />
        </View>
      )}

      {!firstPeriodRecorded && (
        <View style={styles.section}>
          <SectionHeader title={t('home.healthTips')} actionLabel={t('common.seeAll')} onAction={() => router.push('/(tabs)/education')} />
          <View style={styles.tipsRow}>
            {healthTips.map((tip, i) => (
              <HealthTipCard key={tip.id} tip={tip} delay={i * 60} />
            ))}
          </View>
        </View>
      )}

      {firstPeriodRecorded && (
        <>
          <Card style={styles.checkinCard} delay={80}>
            <MascotMini size={40} />
            <View style={{ flex: 1 }}>
              <AppText variant="h3">{t('home.checkinPromptTitle')}</AppText>
              <AppText variant="small" style={{ marginTop: 2 }}>
                {t('home.checkinPromptBody')}
              </AppText>
            </View>
          </Card>
          <Button
            label={t('home.checkinNow')}
            variant="secondary"
            onPress={() => router.push('/checkin')}
            style={styles.checkinButton}
          />

          <View style={styles.section}>
            <SectionHeader title={t('home.learnSomething')} actionLabel={t('common.seeAll')} onAction={() => router.push('/(tabs)/education')} />
            {/* Topics 2 & 3 (Understanding Your Cycle, Period Hygiene) — more relevant here than
                Topic 1 (Your First Period), since this section only shows once that's already logged. */}
            {featuredTopics.map((topic, i) => (
              <EducationTopicCard
                key={topic.id}
                topic={topic}
                number={educationTopics.indexOf(topic) + 1}
                delay={i * 60}
                onPress={() => router.push({ pathname: '/education/[topicId]', params: { topicId: topic.id } })}
              />
            ))}
          </View>
        </>
      )}
    </ScreenContainer>
  );
}

/**
 * High-visibility entry point into the "Cycle Basics 101" guide — pinned near the top of the
 * feed (not tucked into Quick Actions) so it's noticed rather than found. Always available,
 * regardless of firstPeriodRecorded, so both a brand-new user who skipped the auto-shown guide
 * and a returning one can reopen it any time. Opens as a modal, so Home stays right where it is.
 */
function CycleBasicsBanner() {
  const { t } = useTranslation();
  return (
    <Pressable onPress={() => router.push({ pathname: '/cycle-basics', params: { mode: 'review' } })}>
      <Card style={styles.basicsBanner} delay={20}>
        <View style={styles.basicsHeaderRow}>
          <IconCircle color={Colors.surface} size={44}>
            <Ionicons name="school" size={20} color={Colors.warning} />
          </IconCircle>
          <View style={{ flex: 1 }}>
            <AppText variant="h3">{t('home.basicsTitle')}</AppText>
            <AppText variant="small" color={Colors.textSecondary} style={{ marginTop: 2 }}>
              {t('home.basicsSubtitle')}
            </AppText>
          </View>
        </View>
        <View style={styles.basicsPill}>
          <AppText variant="small" color={Colors.textOnPrimary}>
            {t('home.tapToLearn')}
          </AppText>
          <Ionicons name="arrow-forward" size={12} color={Colors.textOnPrimary} />
        </View>
      </Card>
    </Pressable>
  );
}

function NotificationBell({ unreadCount, onColor }: { unreadCount: number; onColor?: boolean }) {
  return (
    <Pressable
      style={[styles.bellButton, onColor && styles.bellButtonOnColor]}
      onPress={() => router.push('/notifications')}
      hitSlop={8}>
      <Ionicons name="notifications-outline" size={21} color={onColor ? Colors.textOnPrimary : Colors.text} />
      {unreadCount > 0 && (
        <View style={[styles.badge, onColor && styles.badgeOnColor]}>
          <AppText variant="caption" color={Colors.textOnPrimary} style={styles.badgeText}>
            {unreadCount}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroStat}>
      <AppText variant="small" color="rgba(255,255,255,0.85)">
        {label}
      </AppText>
      <AppText variant="h3" color={Colors.textOnPrimary} style={{ marginTop: 2 }}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: '40%' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatarImage: { width: 46, height: 46, borderRadius: 23 },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Colors.tint50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellButtonOnColor: { backgroundColor: 'rgba(255,255,255,0.22)' },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeOnColor: { borderColor: Colors.primaryDark },
  badgeText: { fontSize: 10, lineHeight: 12 },
  heroCard: { overflow: 'hidden', marginBottom: Spacing.xxl },
  heroGradient: { padding: Spacing.xl, gap: Spacing.lg },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
  heroStats: { flex: 1, gap: Spacing.lg },
  heroStat: {},
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  heroBottom: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  heroCta: {
    backgroundColor: Colors.textOnPrimary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.pill,
  },
  welcomeCard: { overflow: 'hidden', marginBottom: Spacing.xxl, marginTop: Spacing.md },
  welcomeGradient: { padding: Spacing.xl },
  welcomeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xl },
  welcomeParagraph: { marginTop: Spacing.sm, lineHeight: 20, marginBottom: Spacing.lg },
  welcomeCta: { backgroundColor: Colors.textOnPrimary },
  basicsBanner: { backgroundColor: Colors.warningTint, marginBottom: Spacing.xl, gap: Spacing.md },
  basicsHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  basicsPill: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warning,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    marginLeft: 44 + Spacing.md,
  },
  section: { marginBottom: Spacing.xxl },
  quickActionsRow: { gap: Spacing.md, paddingRight: Spacing.md },
  tipsRow: { flexDirection: 'row', gap: Spacing.md },
  checkinCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  checkinButton: { marginBottom: Spacing.xxl },
});
