import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Button } from '@/components/mira/button';
import { Card } from '@/components/mira/card';
import { CycleRing } from '@/components/mira/cycle-ring';
import { EducationTopicCard } from '@/components/mira/education/topic-card';
import { GettingStartedCard, GettingStartedStep } from '@/components/mira/getting-started-card';
import { HealthTipCard } from '@/components/mira/health-tip-card';
import { IconCircle } from '@/components/mira/icon-circle';
import { MascotMini } from '@/components/mira/mascot';
import { QuickAction } from '@/components/mira/quick-action';
import { ScreenContainer } from '@/components/mira/screen-container';
import { SectionHeader } from '@/components/mira/section-header';
import { educationTopics } from '@/constants/education-hub';
import { healthTips } from '@/constants/mock-data';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { useAvatarAuthHeader } from '@/hooks/use-avatar-header';
import { apiRequest } from '@/utils/api';
import { daysBetween, greeting, parseIsoDate } from '@/utils/date';

type HomeProfile = { name: string; avatarUrl: string | null };

const featuredTopics = educationTopics.slice(1, 3);

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
  if (remaining === 0) return 'Today';
  if (remaining > 0) return `In ${remaining} day${remaining === 1 ? '' : 's'}`;
  const daysLate = Math.abs(remaining);
  return `${daysLate} day${daysLate === 1 ? '' : 's'} late`;
}

export default function HomeScreen() {
  const { firstPeriodRecorded, firstQuestionAsked, hydrated } = useAppState();
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
    { key: 'account', label: 'Create your account', sublabel: 'Done!', done: true },
    { key: 'onboarding', label: 'Complete onboarding', sublabel: 'Completed', done: true },
    {
      key: 'period',
      label: 'Record your first period',
      sublabel: firstPeriodRecorded ? 'Completed' : 'Unlock cycle tracking',
      done: firstPeriodRecorded,
      onPress: () => router.push('/period-setup'),
    },
    {
      key: 'question',
      label: 'Ask Mira your first question',
      sublabel: firstQuestionAsked ? 'Completed' : 'Try the AI assistant',
      done: firstQuestionAsked,
      onPress: () => router.push('/(tabs)/assistant'),
    },
  ];

  // Waiting on either app-state's own hydration (periodEntries, which firstPeriodRecorded is
  // derived from) or this screen's own profile/prediction fetch would otherwise flash the
  // "Welcome to Mira!" first-time layout for a returning user for a moment before flipping to
  // their real hero card the instant real data lands — this gate skips straight past that flash.
  if (!hydrated || !dataLoaded) {
    return (
      <ScreenContainer tabBar>
        <View style={styles.loadingWrap}>
          <MascotMini size={40} />
          <AppText variant="small" color={Colors.textMuted} style={{ marginTop: Spacing.sm }}>
            Loading your cycle…
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
                <AppText variant="h2">Hi, {profile?.name}</AppText>
                <AppText variant="small">
                  {prediction?.currentDay ? `Day ${prediction.currentDay}` : 'Day —'}
                  {prediction?.phase ? ` · ${prediction.phase}` : ''}
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
                  <HeroStat label="Avg. cycle length" value={`${prediction?.averageCycleLength ?? 28} days`} />
                  <HeroStat label="Avg. period length" value={`${prediction?.averagePeriodLength ?? 5} days`} />
                </View>
              </View>

              <View style={styles.heroDivider} />

              <View style={styles.heroBottom}>
                <View style={{ flex: 1 }}>
                  <AppText variant="small" color="rgba(255,255,255,0.85)">
                    Next period estimated
                  </AppText>
                  {/* From GET /api/menstrual/prediction's nextPeriodStart — relative days only, no date range. */}
                  <AppText variant="h3" color={Colors.textOnPrimary} style={{ marginTop: 2 }}>
                    {nextPeriodStartDate ? relativePeriodText(nextPeriodStartDate) : '—'}
                  </AppText>
                </View>
                <Pressable style={styles.heroCta} onPress={() => router.push('/prediction')}>
                  <AppText variant="bodyMedium" color={Colors.primary}>
                    Details
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
              Welcome to Mira!
            </AppText>
            <AppText variant="bodyMedium" color="rgba(255,255,255,0.85)" style={{ marginTop: 2 }}>
              Your health journey starts here
            </AppText>
            <AppText variant="body" color="rgba(255,255,255,0.85)" style={styles.welcomeParagraph}>
              Record your first period to unlock cycle tracking, predictions, and personalized insights made just
              for you.
            </AppText>
            <Button
              label="Record My First Period"
              variant="secondary"
              icon={<Ionicons name="water" size={16} color={Colors.primary} />}
              onPress={() => router.push('/period-setup')}
              style={styles.welcomeCta}
            />
          </LinearGradient>
        </Card>
      )}

      <CycleBasicsBanner />

      <View style={styles.section}>
        <SectionHeader title="Quick actions" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsRow}>
          <QuickAction
            label="Record Period"
            icon="water"
            color={Colors.primary}
            tint={Colors.tint50}
            // Routes into Calendar instead of the old standalone /record screen — Calendar's own
            // day editor (tap a day → same Record/Update Record flow) already covers this, so
            // there's no separate flow to keep in sync anymore.
            onPress={() => router.push(firstPeriodRecorded ? '/(tabs)/calendar' : '/period-setup')}
          />
          <QuickAction label="Calendar" icon="calendar" color={Colors.teal} tint={Colors.tealTint} onPress={() => router.push('/(tabs)/calendar')} />
          <QuickAction label="Education" icon="book" color={Colors.lavender} tint={Colors.lavenderTint} onPress={() => router.push('/(tabs)/education')} />
          <QuickAction label="AI Assistant" icon="chatbubble-ellipses" color={Colors.peach} tint={Colors.peachTint} onPress={() => router.push('/(tabs)/assistant')} />
          <QuickAction label="Reminders" icon="alarm" color={Colors.info} tint={Colors.infoTint} onPress={() => router.push('/notifications')} />
          <QuickAction label="Check-ins" icon="heart" color={Colors.success} tint={Colors.successTint} onPress={() => router.push('/checkin-history')} />
        </ScrollView>
      </View>

      {!onboardingDone && (
        <View style={styles.section}>
          <GettingStartedCard steps={steps} delay={80} />
        </View>
      )}

      {!firstPeriodRecorded && (
        <View style={styles.section}>
          <SectionHeader title="Health Tips" actionLabel="See all" onAction={() => router.push('/(tabs)/education')} />
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
              <AppText variant="h3">How are you feeling today?</AppText>
              <AppText variant="small" style={{ marginTop: 2 }}>
                You haven&apos;t checked in yet — it only takes a few seconds.
              </AppText>
            </View>
          </Card>
          <Button
            label="Check in now"
            variant="secondary"
            onPress={() => router.push('/checkin')}
            style={styles.checkinButton}
          />

          <View style={styles.section}>
            <SectionHeader title="Learn something new" actionLabel="See all" onAction={() => router.push('/(tabs)/education')} />
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
  return (
    <Pressable onPress={() => router.push({ pathname: '/cycle-basics', params: { mode: 'review' } })}>
      <Card style={styles.basicsBanner} delay={20}>
        <View style={styles.basicsHeaderRow}>
          <IconCircle color={Colors.surface} size={44}>
            <Ionicons name="school" size={20} color={Colors.warning} />
          </IconCircle>
          <View style={{ flex: 1 }}>
            <AppText variant="h3">Cycle Basics 101</AppText>
            <AppText variant="small" color={Colors.textSecondary} style={{ marginTop: 2 }}>
              Periods vs. cycles, explained in under 2 minutes
            </AppText>
          </View>
        </View>
        <View style={styles.basicsPill}>
          <AppText variant="small" color={Colors.textOnPrimary}>
            Tap to learn
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
