import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Button } from '@/components/mira/button';
import { Card } from '@/components/mira/card';
import { CycleRing } from '@/components/mira/cycle-ring';
import { EducationCard } from '@/components/mira/education-card';
import { IconCircle } from '@/components/mira/icon-circle';
import { MascotMini } from '@/components/mira/mascot';
import { QuickAction } from '@/components/mira/quick-action';
import { ScreenContainer } from '@/components/mira/screen-container';
import { SectionHeader } from '@/components/mira/section-header';
import { articles, cycleStats, mockUser, notifications, today } from '@/constants/mock-data';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { daysBetween, formatRange } from '@/utils/date';

function cyclePhase(day: number): string {
  if (day <= 5) return 'Menstrual phase';
  if (day <= 13) return 'Follicular phase';
  if (day <= 16) return 'Ovulation phase';
  return 'Luteal phase';
}

export default function HomeScreen() {
  const unreadCount = notifications.filter((n) => !n.read).length;
  const daysUntilNext = daysBetween(today, cycleStats.nextPeriodStart);

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <IconCircle color={Colors.tint100} size={46}>
            <AppText variant="h3" color={Colors.primary}>
              {mockUser.avatarInitial}
            </AppText>
          </IconCircle>
          <View>
            <AppText variant="h2">Hi, {mockUser.name} 👋</AppText>
            <AppText variant="small">
              Day {cycleStats.currentDay} · {cyclePhase(cycleStats.currentDay)}
            </AppText>
          </View>
        </View>
        <Pressable style={styles.bellButton} onPress={() => router.push('/notifications')} hitSlop={8}>
          <Ionicons name="notifications-outline" size={21} color={Colors.text} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <AppText variant="caption" color={Colors.textOnPrimary} style={styles.badgeText}>
                {unreadCount}
              </AppText>
            </View>
          )}
        </Pressable>
      </View>

      <Card padded={false} style={styles.heroCard} noShadow delay={0}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}>
          <View style={styles.heroTop}>
            <CycleRing currentDay={cycleStats.currentDay} cycleLength={cycleStats.averageCycleLength} />
            <View style={styles.heroStats}>
              <HeroStat label="Avg. cycle length" value={`${cycleStats.averageCycleLength} days`} />
              <HeroStat label="Avg. period length" value={`${cycleStats.averagePeriodLength} days`} />
            </View>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroBottom}>
            <View style={{ flex: 1 }}>
              <AppText variant="small" color="rgba(255,255,255,0.85)">
                Next period estimated
              </AppText>
              <AppText variant="h3" color={Colors.textOnPrimary} style={{ marginTop: 2 }}>
                {formatRange(cycleStats.nextPeriodStart, cycleStats.nextPeriodEnd)} · in {daysUntilNext} days
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

      <View style={styles.section}>
        <SectionHeader title="Quick actions" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsRow}>
          <QuickAction label="Record Period" icon="water" color={Colors.primary} tint={Colors.tint50} onPress={() => router.push('/record')} />
          <QuickAction label="Calendar" icon="calendar" color={Colors.teal} tint={Colors.tealTint} onPress={() => router.push('/(tabs)/calendar')} />
          <QuickAction label="Education" icon="book" color={Colors.lavender} tint={Colors.lavenderTint} onPress={() => router.push('/(tabs)/education')} />
          <QuickAction label="AI Assistant" icon="chatbubble-ellipses" color={Colors.peach} tint={Colors.peachTint} onPress={() => router.push('/(tabs)/assistant')} />
          <QuickAction label="Reminders" icon="alarm" color={Colors.info} tint={Colors.infoTint} onPress={() => router.push('/notifications')} />
        </ScrollView>
      </View>

      <Card style={styles.checkinCard} delay={80}>
        <MascotMini size={40} />
        <View style={{ flex: 1 }}>
          <AppText variant="h3">How are you feeling today?</AppText>
          <AppText variant="small" style={{ marginTop: 2 }}>
            You haven&apos;t checked in yet — it only takes a few seconds.
          </AppText>
        </View>
      </Card>
      <Button label="Check in now" variant="secondary" onPress={() => router.push('/checkin')} style={styles.checkinButton} />

      <View style={styles.section}>
        <SectionHeader title="Learn something new" actionLabel="See all" onAction={() => router.push('/(tabs)/education')} />
        {articles.slice(0, 2).map((article, i) => (
          <EducationCard key={article.id} article={article} delay={i * 60} onPress={() => router.push({ pathname: '/article/[id]', params: { id: article.id } })} />
        ))}
      </View>
    </ScreenContainer>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Colors.tint50,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  section: { marginBottom: Spacing.xxl },
  quickActionsRow: { gap: Spacing.md, paddingRight: Spacing.md },
  checkinCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  checkinButton: { marginBottom: Spacing.xxl },
});
