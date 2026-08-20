import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ReactNode, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Card } from '@/components/mira/card';
import { EditProfileModal } from '@/components/mira/edit-profile-modal';
import { IconCircle } from '@/components/mira/icon-circle';
import { LanguagePickerModal } from '@/components/mira/language-picker-modal';
import { ScreenContainer } from '@/components/mira/screen-container';
import { SettingsRow } from '@/components/mira/settings-row';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/utils/api';

type Preferences = { pushNotifications: boolean; checkinReminders: boolean };

type ProfileData = {
  userId: string;
  name: string;
  email: string;
  preferredLanguage: string;
  preferences: Preferences;
};

export default function ProfileScreen() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // UI-only for now, same as the rest of this edit flow — there's no photo field on the real
  // profile model yet, so this just lives here for the mockup rather than inside ProfileData.
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    apiRequest<ProfileData>('/profile/me')
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err) => {
        console.error('[profile] failed to load /profile/me:', err);
        if (!cancelled) setError("Couldn't load your profile.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /** Flips the switch immediately, saves in the background, rolls back if the save fails. */
  const updatePreference = async (patch: Partial<Preferences>) => {
    if (!profile) return;
    const previous = profile.preferences;
    const next = { ...previous, ...patch };
    setProfile({ ...profile, preferences: next });

    try {
      await apiRequest('/profile/me', { method: 'PUT', body: { preferences: next } });
    } catch (err) {
      console.error('[profile] failed to save preference, rolling back:', err);
      setProfile((p) => (p ? { ...p, preferences: previous } : p));
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  /** Same optimistic-save/rollback shape as updatePreference — preferredLanguage is already a
   *  real, saved field on the backend profile (see profileController.js), just never had a UI to
   *  set it before now. */
  const handleSelectLanguage = async (language: string) => {
    setLanguageModalVisible(false);
    if (!profile || profile.preferredLanguage === language) return;
    const previous = profile.preferredLanguage;
    setProfile({ ...profile, preferredLanguage: language });

    try {
      await apiRequest('/profile/me', { method: 'PUT', body: { preferredLanguage: language } });
    } catch (err) {
      console.error('[profile] failed to save language, rolling back:', err);
      setProfile((p) => (p ? { ...p, preferredLanguage: previous } : p));
    }
  };

  /**
   * UI-only save, per profile.tsx's doc comment on this edit flow — updates what's shown on this
   * page immediately, same "optimistic" feel as updatePreference above, but doesn't PUT anything
   * to `/profile/me` yet. Wire this up to the backend once there's a name/email/photo endpoint.
   */
  const handleSaveProfile = (details: { name: string; email: string; photoUri: string | null }) => {
    setProfile((p) => (p ? { ...p, name: details.name, email: details.email } : p));
    setAvatarUri(details.photoUri);
    setEditModalVisible(false);
  };

  const avatarInitial = profile?.name?.trim().charAt(0).toUpperCase() || '?';

  return (
    <ScreenContainer tabBar>
      <AppText variant="h1" style={styles.pageTitle}>
        Profile
      </AppText>

      <Card style={styles.profileCard}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
        ) : (
          <IconCircle color={Colors.tint100} size={64}>
            <AppText variant="h1" color={Colors.primary}>
              {avatarInitial}
            </AppText>
          </IconCircle>
        )}
        <View style={{ flex: 1 }}>
          {loading ? (
            <AppText variant="small">Loading…</AppText>
          ) : error ? (
            <AppText variant="small" color={Colors.primary}>
              {error}
            </AppText>
          ) : (
            <>
              <AppText variant="h3">{profile?.name}</AppText>
              <AppText variant="small" style={{ marginTop: 2 }}>
                {profile?.email}
              </AppText>
            </>
          )}
        </View>
        <Pressable style={styles.editButton} hitSlop={8} onPress={() => setEditModalVisible(true)} disabled={!profile}>
          <Ionicons name="create-outline" size={17} color={Colors.primary} />
        </Pressable>
      </Card>

      <SectionCard title="Preferences" delay={60}>
        <SettingsRow
          icon="language-outline"
          color={Colors.lavender}
          tint={Colors.lavenderTint}
          label="Language"
          value={profile?.preferredLanguage ?? 'English'}
          onPress={() => profile && setLanguageModalVisible(true)}
        />
        <Divider />
        <SettingsRow
          icon="notifications-outline"
          color={Colors.info}
          tint={Colors.infoTint}
          label="Push notifications"
          toggle={profile?.preferences.pushNotifications ?? true}
          onToggle={(value) => updatePreference({ pushNotifications: value })}
        />
        <Divider />
        <SettingsRow
          icon="alarm-outline"
          color={Colors.peach}
          tint={Colors.peachTint}
          label="Daily check-in reminders"
          toggle={profile?.preferences.checkinReminders ?? true}
          onToggle={(value) => updatePreference({ checkinReminders: value })}
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
          onPress={handleLogout}
        />
      </SectionCard>

      <AppText variant="caption" center style={styles.version}>
        Mira v1.0.0 · Made with care for first-time menstruators
      </AppText>

      {profile && (
        <>
          <EditProfileModal
            visible={editModalVisible}
            name={profile.name}
            email={profile.email}
            photoUri={avatarUri}
            onCancel={() => setEditModalVisible(false)}
            onSave={handleSaveProfile}
          />
          <LanguagePickerModal
            visible={languageModalVisible}
            value={profile.preferredLanguage}
            onSelect={handleSelectLanguage}
            onClose={() => setLanguageModalVisible(false)}
          />
        </>
      )}
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
  avatarImage: { width: 64, height: 64, borderRadius: 32 },
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
