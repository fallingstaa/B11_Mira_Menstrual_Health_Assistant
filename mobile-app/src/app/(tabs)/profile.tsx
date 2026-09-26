import { Ionicons } from '@expo/vector-icons';
import { File } from 'expo-file-system';
import { router } from 'expo-router';
import { ReactNode, useEffect, useState } from 'react';
import { Alert, Image, Pressable, Share, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Card } from '@/components/mira/card';
import { EditProfileModal } from '@/components/mira/edit-profile-modal';
import { IconCircle } from '@/components/mira/icon-circle';
import { LanguagePickerModal } from '@/components/mira/language-picker-modal';
import { ScreenContainer } from '@/components/mira/screen-container';
import { SettingsRow } from '@/components/mira/settings-row';
import { auth } from '@/config/firebase';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { apiRequest, apiUpload } from '@/utils/api'; //specail part 

type Preferences = { pushNotifications: boolean; checkinReminders: boolean };

type ProfileData = {
  userId: string;
  name: string;
  email: string;
  preferredLanguage: string;
  avatarUrl: string | null;
  preferences: Preferences;
};

/** Guesses a photo's MIME type from its picked file's extension — good enough to match one of
 *  the 3 types POST /api/profile/avatar accepts (jpeg/png/webp); expo-image-picker's URIs always
 *  carry a real extension. Defaults to jpeg, the overwhelmingly common case, if it doesn't recognize one. */
function guessImageMimeType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export default function ProfileScreen() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // The signed-in user's avatar, as a URL pointing at this API's own GET /api/profile/avatar
  // (set by profileController.js's uploadAvatar) — null until a photo's ever been uploaded.
  // Kept as its own bit of state (not just read off `profile.avatarUrl`) so it can update
  // optimistically the moment a new photo's picked, same pattern as the rest of this screen.
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  // GET /api/profile/avatar is authenticated like every other endpoint here — a bare <Image
  // uri=.../> can't attach an Authorization header, so this is fetched alongside the avatar URL
  // and handed to <Image source={{ uri, headers }}> instead.
  const [avatarAuthHeader, setAvatarAuthHeader] = useState<{ Authorization: string } | undefined>(undefined);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    apiRequest<ProfileData>('/profile/me')
      .then((data) => {
        if (!cancelled) {
          setProfile(data);
          setAvatarUri(data.avatarUrl);
        }
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

  useEffect(() => {
    let cancelled = false;
    if (!avatarUri) {
      setAvatarAuthHeader(undefined);
      return;
    }
    auth.currentUser?.getIdToken().then((token) => {
      if (!cancelled && token) setAvatarAuthHeader({ Authorization: `Bearer ${token}` });
    });
    return () => {
      cancelled = true;
    };
  }, [avatarUri]);

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

  /** GET /api/profile/export returns the full JSON payload (profile fields + every logged
   *  MenstrualRecord) directly in the response body — there's no file sitting on the server to
   *  link to, so handing it to the OS share sheet (Save to Files, email, AirDrop, ...) is the
   *  actual "download" here, not a URL. */
  const handleExportData = async () => {
    try {
      const data = await apiRequest('/profile/export');
      await Share.share({
        title: `mira-export-${new Date().toISOString().slice(0, 10)}.json`,
        message: JSON.stringify(data, null, 2),
      });
    } catch (err) {
      console.error('[profile] failed to export data:', err);
      Alert.alert("Couldn't export your data", err instanceof Error ? err.message : 'Please try again.');
    }
  };

  /** DELETE /api/profile/me is irreversible (see profileController.js's deleteMe) — everything
   *  personal (period history, AI chats, reminders, the account itself) is gone the instant this
   *  succeeds, so this always confirms first. Signs out locally right after — the Firebase ID
   *  token is invalidated server-side the moment the account's deleted anyway, so there's nothing
   *  left for a session to point at. */
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete your account?',
      "This permanently deletes your account and everything in it — period history, chat history, reminders. This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRequest('/profile/me', { method: 'DELETE' });
              await logout();
              router.replace('/login');
            } catch (err) {
              console.error('[profile] failed to delete account:', err);
              Alert.alert("Couldn't delete your account", err instanceof Error ? err.message : 'Please try again.');
            }
          },
        },
      ],
    );
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
   * Same optimistic-save/rollback shape as updatePreference/handleSelectLanguage above, just
   * across up to 3 independent backend calls instead of 1 — each only fires for the field that
   * actually changed:
   *  - name → PUT /profile/me (the generic partial-update endpoint)
   *  - email → PUT /profile/email (its own endpoint — see profileController.js's changeEmail for
   *    why changing the login email can't just go through PUT /profile/me)
   *  - photo → POST /profile/avatar (new/changed photo) or DELETE /profile/avatar (removed),
   *    never PUT /profile/me's own avatarUrl field, which is for pointing at an externally-hosted
   *    URL instead — not what an in-app photo picker produces.
   * Each field rolls back independently on its own failure (not "any failure reverts all three")
   * — these are 3 separate, unrelated backend calls, so e.g. a 409 on email (already in use)
   * shouldn't also throw away a name change that already saved successfully.
   */
  const handleSaveProfile = async (details: { name: string; email: string; photoUri: string | null }) => {
    if (!profile) return;
    const previousProfile = profile;
    const previousAvatarUri = avatarUri;
    const photoChanged = details.photoUri !== previousAvatarUri;
    const failures: string[] = [];

    setEditModalVisible(false);
    setProfile({ ...profile, name: details.name, email: details.email });
    if (photoChanged) setAvatarUri(details.photoUri);

    if (details.name !== previousProfile.name) {
      try {
        await apiRequest('/profile/me', { method: 'PUT', body: { name: details.name } });
      } catch (err) {
        console.error('[profile] failed to save name, rolling back:', err);
        failures.push(err instanceof Error ? err.message : 'Name');
        setProfile((p) => (p ? { ...p, name: previousProfile.name } : p));
      }
    }

    if (details.email !== previousProfile.email) {
      try {
        await apiRequest('/profile/email', { method: 'PUT', body: { email: details.email } });
      } catch (err) {
        console.error('[profile] failed to save email, rolling back:', err);
        failures.push(err instanceof Error ? err.message : 'Email');
        setProfile((p) => (p ? { ...p, email: previousProfile.email } : p));
      }
    }

    if (photoChanged) {
      try {
        if (details.photoUri === null) {
          await apiRequest('/profile/avatar', { method: 'DELETE' });
        } else {
          const formData = new FormData();
          // Expo's fetch (the global one since SDK 57) no longer accepts React Native's old
          // {uri,name,type} file shape — it throws "Unsupported FormDataPart implementation".
          // expo-file-system's File is a Blob-compatible object it can read directly.
          // apiUpload leaves Content-Type unset so fetch generates the multipart boundary itself.
          const mimeType = guessImageMimeType(details.photoUri);
          formData.append('photo', new File(details.photoUri), `avatar.${mimeType.split('/')[1]}`);
          const { avatarUrl } = await apiUpload<{ avatarUrl: string }>('/profile/avatar', formData);
          // Point at the backend's own proxy URL, not the local file:// URI just uploaded from —
          // that local file won't exist on this device forever, and only the backend's URL is
          // ever authenticated/reachable again later (e.g. after an app restart).
          setAvatarUri(avatarUrl);
        }
      } catch (err) {
        console.error('[profile] failed to save photo, rolling back:', err);
        failures.push(err instanceof Error ? err.message : 'Photo');
        setAvatarUri(previousAvatarUri);
      }
    }

    if (failures.length > 0) {
      Alert.alert("Couldn't save everything", failures.join('\n'));
    }
  };

  const avatarInitial = profile?.name?.trim().charAt(0).toUpperCase() || '?';

  return (
    <ScreenContainer tabBar>
      <AppText variant="h1" style={styles.pageTitle}>
        Profile
      </AppText>

      <Card style={styles.profileCard}>
        {/* Only mounted once the auth header is ready — an <Image> that fires its first request
            without it gets a 401 from GET /api/profile/avatar, and iOS then caches that failure
            by URL, so the photo stays blank even after the header arrives a moment later. */}
        {avatarUri && avatarAuthHeader ? (
          <Image source={{ uri: avatarUri, headers: avatarAuthHeader }} style={styles.avatarImage} />
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
        <SettingsRow icon="download-outline" color={Colors.teal} tint={Colors.tealTint} label="Export my data" onPress={handleExportData} />
        <Divider />
        <SettingsRow icon="trash-outline" destructive label="Delete my account" onPress={handleDeleteAccount} />
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
            photoHeaders={avatarAuthHeader}
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
