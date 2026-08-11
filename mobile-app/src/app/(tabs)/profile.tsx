import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Card } from '@/components/mira/card';
import { IconCircle } from '@/components/mira/icon-circle';
import { ScreenContainer } from '@/components/mira/screen-container';
import { SettingsRow } from '@/components/mira/settings-row';
import { mockUser } from '@/constants/mock-data';
import { Colors, Radius, Spacing } from '@/constants/theme';

export default function ProfileScreen() {
  const [notifOn, setNotifOn] = useState(true);
  const [checkinRemindersOn, setCheckinRemindersOn] = useState(true);

  return (
    <ScreenContainer>
      <AppText variant="h1" style={styles.pageTitle}>
        Profile
      </AppText>

      <Card style={styles.profileCard}>
        <IconCircle color={Colors.tint100} size={64}>
          <AppText variant="h1" color={Colors.primary}>
            {mockUser.avatarInitial}
          </AppText>
        </IconCircle>
        <View style={{ flex: 1 }}>
          <AppText variant="h3">{mockUser.name}</AppText>
          <AppText variant="small" style={{ marginTop: 2 }}>
            {mockUser.email}
          </AppText>
        </View>
        <Pressable style={styles.editButton} hitSlop={8}>
          <Ionicons name="create-outline" size={17} color={Colors.primary} />
        </Pressable>
      </Card>

      <SectionCard title="Preferences" delay={60}>
        <SettingsRow icon="language-outline" color={Colors.lavender} tint={Colors.lavenderTint} label="Language" value={mockUser.language} />
        <Divider />
        <SettingsRow
          icon="notifications-outline"
          color={Colors.info}
          tint={Colors.infoTint}
          label="Push notifications"
          toggle={notifOn}
          onToggle={setNotifOn}
        />
        <Divider />
        <SettingsRow
          icon="alarm-outline"
          color={Colors.peach}
          tint={Colors.peachTint}
          label="Daily check-in reminders"
          toggle={checkinRemindersOn}
          onToggle={setCheckinRemindersOn}
        />
      </SectionCard>

      <SectionCard title="Privacy" delay={100}>
        <SettingsRow icon="lock-closed-outline" color={Colors.teal} tint={Colors.tealTint} label="Privacy policy" onPress={() => {}} />
        <Divider />
        <SettingsRow icon="shield-checkmark-outline" color={Colors.teal} tint={Colors.tealTint} label="Data & privacy" onPress={() => {}} />
      </SectionCard>

      <SectionCard title="About" delay={140}>
        <SettingsRow icon="heart-outline" label="About Mira" onPress={() => {}} />
        <Divider />
        <SettingsRow icon="help-circle-outline" label="Help & support" onPress={() => {}} />
        <Divider />
        <SettingsRow
          icon="log-out-outline"
          destructive
          label="Log out"
          onPress={() => router.replace('/login')}
        />
      </SectionCard>

      <AppText variant="caption" center style={styles.version}>
        Mira v1.0.0 · Made with care for first-time menstruators
      </AppText>
    </ScreenContainer>
  );
}

function SectionCard({ title, delay, children }: { title: string; delay?: number; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="h3" style={styles.sectionTitle}>
        {title}
      </AppText>
      <Card delay={delay} style={styles.sectionCard}>
        {children}
      </Card>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  pageTitle: { marginTop: Spacing.md, marginBottom: Spacing.lg },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xl },
  editButton: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    backgroundColor: Colors.tint50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { marginBottom: Spacing.md },
  sectionCard: { paddingVertical: Spacing.sm },
  divider: { height: 1, backgroundColor: Colors.border },
  version: { marginTop: Spacing.md, marginBottom: Spacing.xxxl },
});
