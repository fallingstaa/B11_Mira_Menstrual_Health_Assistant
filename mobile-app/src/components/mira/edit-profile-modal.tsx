import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Button } from '@/components/mira/button';
import { IconCircle } from '@/components/mira/icon-circle';
import { Colors, Fonts, Radius, Shadow, Spacing } from '@/constants/theme';

type Props = {
  visible: boolean;
  name: string;
  email: string;
  photoUri: string | null;
  /** Auth header for `photoUri` when it's still the original remote avatar (GET /api/profile/avatar
   *  requires it, like every other endpoint) — not needed once a fresh local photo's been picked,
   *  see the `isRemotePhoto` check below. */
  photoHeaders?: { Authorization: string };
  onCancel: () => void;
  onSave: (details: { name: string; email: string; photoUri: string | null }) => void;
};

const AVATAR_SIZE = 92;

/**
 * "Edit Profile" popup — rename, change email, and set a profile photo. `onSave` hands back
 * whatever's currently in each field; profile.tsx is what actually decides which fields changed
 * and PUTs/POSTs only those to the backend (see its handleSaveProfile).
 */
export function EditProfileModal({ visible, name, email, photoUri, photoHeaders, onCancel, onSave }: Props) {
  const [nameInput, setNameInput] = useState(name);
  const [emailInput, setEmailInput] = useState(email);
  const [photo, setPhoto] = useState(photoUri);
  // Whether `photo` is still the original avatar handed in via props (needs photoHeaders to
  // load, since it's our own authenticated GET /api/profile/avatar) or a fresh pick from this
  // device's photo library (a plain local file:// URI, loads with no headers at all).
  const isRemotePhoto = photo === photoUri;

  // Reset to whatever's currently saved every time this opens — otherwise a cancelled edit's
  // half-typed changes would still be sitting there the next time it's reopened.
  useEffect(() => {
    if (visible) {
      setNameInput(name);
      setEmailInput(email);
      setPhoto(photoUri);
    }
  }, [visible, name, email, photoUri]);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Mira needs permission to your photos to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    const trimmedName = nameInput.trim();
    const trimmedEmail = emailInput.trim();
    if (!trimmedName) {
      Alert.alert('Name required', "Your name can't be empty.");
      return;
    }
    if (!trimmedEmail.includes('@')) {
      Alert.alert('Check your email', "That doesn't look like a valid email address.");
      return;
    }
    onSave({ name: trimmedName, email: trimmedEmail, photoUri: photo });
  };

  const initial = nameInput.trim().charAt(0).toUpperCase() || '?';

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, Shadow.raised]}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <AppText variant="h2">Edit Profile</AppText>
            <Pressable onPress={onCancel} hitSlop={8}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <View style={styles.avatarSection}>
              <Pressable onPress={pickPhoto} style={styles.avatarWrap}>
                {photo ? (
                  <Image
                    source={{ uri: photo, headers: isRemotePhoto ? photoHeaders : undefined }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <IconCircle color={Colors.tint100} size={AVATAR_SIZE}>
                    <AppText variant="h1" color={Colors.primary}>
                      {initial}
                    </AppText>
                  </IconCircle>
                )}
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={14} color={Colors.textOnPrimary} />
                </View>
              </Pressable>
              <Pressable onPress={pickPhoto} hitSlop={8}>
                <AppText variant="small" color={Colors.primary} style={styles.changePhotoText}>
                  {photo ? 'Change photo' : 'Add a photo'}
                </AppText>
              </Pressable>
              {photo && (
                <Pressable onPress={() => setPhoto(null)} hitSlop={8}>
                  <AppText variant="small" color={Colors.textMuted}>
                    Remove photo
                  </AppText>
                </Pressable>
              )}
            </View>

            <AppText variant="caption" style={styles.fieldLabel}>
              NAME
            </AppText>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Your name"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
            />

            <AppText variant="caption" style={styles.fieldLabel}>
              EMAIL
            </AppText>
            <TextInput
              value={emailInput}
              onChangeText={setEmailInput}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />

            <Button label="Save Changes" onPress={handleSave} style={styles.saveButton} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.overlay },
  sheet: {
    maxHeight: '85%',
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  scroll: { paddingBottom: Spacing.xxxl },
  avatarSection: { alignItems: 'center', marginBottom: Spacing.xl, gap: 4 },
  avatarWrap: { marginBottom: Spacing.sm },
  avatarImage: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoText: { marginTop: 2 },
  fieldLabel: { marginBottom: Spacing.sm, marginTop: Spacing.lg },
  input: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    color: Colors.text,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  saveButton: { marginTop: Spacing.xl },
});
