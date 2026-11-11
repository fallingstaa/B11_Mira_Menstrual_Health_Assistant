import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, useWindowDimensions, View, type HostInstance } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';

import { AppText } from '@/components/yumi/app-text';
import { Button } from '@/components/yumi/button';
import { ModalHeader } from '@/components/yumi/modal-header';
import { ScreenContainer } from '@/components/yumi/screen-container';
import {
  CHRISTMAS_TEMPLATES,
  SHARE_CARD_TEMPLATES,
  ShareCard,
  type ShareCardFormat,
  type ShareCardTemplate,
} from '@/components/yumi/share-card/share-card';
import { daySeed, seededRandom, SHARE_CARD_ITEMS } from '@/constants/share-card-content';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useSeasonalTheme } from '@/context/seasonal-theme';
import { useAvatarAuthHeader } from '@/hooks/use-avatar-header';
import { apiRequest } from '@/utils/api';
import { formatShort } from '@/utils/date';

type Profile = { name: string; avatarUrl: string | null };

// Indexes into SHARE_CARD_ITEMS, split by season.
const EVERYDAY_ITEMS = SHARE_CARD_ITEMS.flatMap((item, i) => (item.season ? [] : [i]));
const CHRISTMAS_ITEMS = SHARE_CARD_ITEMS.flatMap((item, i) => (item.season === 'christmas' ? [i] : []));

/**
 * Picks a message and design using `rand` (0–1). In Christmas mode, half the messages are
 * festive and only the Christmas templates are used. `avoid` skips the current card so
 * "New card" always changes something.
 */
function pick(rand: () => number, christmas: boolean, avoid?: { itemIndex: number; template: ShareCardTemplate }) {
  const items = christmas && rand() < 0.5 ? CHRISTMAS_ITEMS : EVERYDAY_ITEMS;
  const templates = christmas ? CHRISTMAS_TEMPLATES : SHARE_CARD_TEMPLATES;
  const choose = <T,>(list: T[], current?: T) => {
    const options = list.length > 1 && current !== undefined ? list.filter((x) => x !== current) : list;
    return options[Math.floor(rand() * options.length)];
  };
  return { itemIndex: choose(items, avoid?.itemIndex), template: choose(templates, avoid?.template) };
}

/** Today's card: the same message and design all day, a different one tomorrow. */
function todaysPick(christmas: boolean) {
  return pick(seededRandom(daySeed()), christmas);
}

/**
 * Daily Personal Share Card — a personalised, shareable image for Stories (9:16) or posts (1:1):
 * the user's photo and name, one short daily message (quote, fact, tip, myth vs. fact, or
 * self-care) and Yumi branding. Never shows cycle records or dates. The card is rendered as a
 * normal view and captured to a PNG with react-native-view-shot for saving and sharing.
 */
export default function ShareCardScreen() {
  const { t, i18n } = useTranslation();
  const { christmas } = useSeasonalTheme();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const cardRef = useRef<HostInstance>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const avatarHeaders = useAvatarAuthHeader(profile?.avatarUrl);
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  const [{ itemIndex, template }, setPick] = useState<{ itemIndex: number; template: ShareCardTemplate }>(() => todaysPick(christmas));
  const [format, setFormat] = useState<ShareCardFormat>('story');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState<'save' | 'share' | null>(null);

  useEffect(() => {
    apiRequest<Profile>('/profile/me')
      .then(setProfile)
      .catch((err) => {
        console.warn('[share-card] could not load profile, using a plain card:', err);
        setProfile({ name: '', avatarUrl: null });
      });
  }, []);

  const item = SHARE_CARD_ITEMS[itemIndex];
  const content = i18n.language === 'km' ? item.km : item.en;
  const name = profile?.name?.trim() || t('shareCard.you');
  // Same rule as Profile: only render the photo once its auth header is ready.
  const avatarUri = profile?.avatarUrl && avatarHeaders ? profile.avatarUrl : null;
  const ready = !!profile && (!profile.avatarUrl || avatarLoaded);

  // Biggest card that fits: full width for Square; for Story, also capped by screen height.
  const previewWidth = useMemo(() => {
    const maxW = screenW - Spacing.xl * 2;
    return format === 'story' ? Math.min(maxW, (screenH * 0.55 * 9) / 16) : Math.min(maxW, screenH * 0.42);
  }, [format, screenW, screenH]);
  const bigWidth = format === 'story' ? Math.min(screenW - 32, ((screenH - 180) * 9) / 16) : screenW - 32;

  const cardProps = {
    template,
    format,
    kind: item.kind,
    text: content.text,
    sub: content.sub,
    name,
    avatarUri,
    avatarHeaders,
    dateLabel: formatShort(new Date()),
  };

  const generateAnother = () => {
    setPick((prev) => pick(Math.random, christmas, prev));
  };

  /** Renders the on-screen card to a full-resolution PNG (1080 wide, Story 1080×1920). */
  const capture = () =>
    captureRef(cardRef, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
      width: 1080,
      height: format === 'story' ? 1920 : 1080,
    });

  const handleSave = async () => {
    setBusy('save');
    try {
      const permission = await MediaLibrary.requestPermissionsAsync(true);
      if (!permission.granted) {
        Alert.alert(t('shareCard.permissionTitle'), t('shareCard.permissionBody'));
        return;
      }
      await MediaLibrary.Asset.create(await capture());
      Alert.alert(t('shareCard.savedTitle'), t('shareCard.savedBody'));
    } catch (err) {
      console.error('[share-card] save failed:', err);
      Alert.alert(t('shareCard.errorTitle'), t('common.tryAgain'));
    } finally {
      setBusy(null);
    }
  };

  const handleShare = async () => {
    setBusy('share');
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(t('shareCard.errorTitle'), t('shareCard.shareUnavailable'));
        return;
      }
      await Sharing.shareAsync(await capture(), { mimeType: 'image/png', dialogTitle: t('shareCard.shareTitle') });
    } catch (err) {
      console.error('[share-card] share failed:', err);
      Alert.alert(t('shareCard.errorTitle'), t('common.tryAgain'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <ScreenContainer
      edges={['top', 'left', 'right', 'bottom']}
      footer={
        <View style={styles.footerRow}>
          <Button
            label={t('shareCard.save')}
            variant="outline"
            icon={<Ionicons name="download-outline" size={16} color={Colors.primary} />}
            onPress={handleSave}
            loading={busy === 'save'}
            disabled={!ready || busy !== null}
            style={styles.footerButton}
          />
          <Button
            label={t('shareCard.share')}
            icon={<Ionicons name="share-social" size={16} color={Colors.textOnPrimary} />}
            onPress={handleShare}
            loading={busy === 'share'}
            disabled={!ready || busy !== null}
            style={styles.footerButton}
          />
        </View>
      }>
      <ModalHeader title={t('shareCard.title')} subtitle={t('shareCard.subtitle')} />

      <View style={styles.formatRow}>
        {(['story', 'square'] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFormat(f)}
            style={[styles.formatOption, format === f && styles.formatOptionActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: format === f }}>
            <Ionicons
              name={f === 'story' ? 'phone-portrait-outline' : 'square-outline'}
              size={15}
              color={format === f ? Colors.textOnPrimary : Colors.textSecondary}
            />
            <AppText variant="bodyMedium" color={format === f ? Colors.textOnPrimary : Colors.textSecondary}>
              {t(f === 'story' ? 'shareCard.story' : 'shareCard.square')}
            </AppText>
          </Pressable>
        ))}
      </View>

      <Animated.View key={`${itemIndex}-${template}-${format}`} entering={ZoomIn.duration(280)} style={styles.cardWrap}>
        <Pressable onPress={() => setPreviewOpen(true)} accessibilityRole="button" accessibilityLabel={t('shareCard.preview')}>
          <ShareCard ref={cardRef} width={previewWidth} {...cardProps} onAvatarLoad={() => setAvatarLoaded(true)} />
        </Pressable>
      </Animated.View>

      <View style={styles.actionsRow}>
        <Button
          label={t('shareCard.another')}
          variant="secondary"
          icon={<Ionicons name="shuffle" size={16} color={Colors.primary} />}
          onPress={generateAnother}
          style={styles.footerButton}
        />
        <Button
          label={t('shareCard.preview')}
          variant="ghost"
          icon={<Ionicons name="eye-outline" size={16} color={Colors.primary} />}
          onPress={() => setPreviewOpen(true)}
          style={styles.footerButton}
        />
      </View>

      <View style={styles.note}>
        <Ionicons name="lock-closed-outline" size={13} color={Colors.textMuted} />
        <AppText variant="small" color={Colors.textMuted} style={{ flex: 1 }}>
          {t('shareCard.privacyNote')}
        </AppText>
      </View>

      <Modal visible={previewOpen} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setPreviewOpen(false)}>
        <View style={styles.previewOverlay}>
          <Animated.View entering={FadeIn.duration(200)}>
            <ShareCard width={bigWidth} {...cardProps} />
          </Animated.View>
          <View style={styles.previewActions}>
            <Pressable onPress={() => setPreviewOpen(false)} style={styles.previewClose} hitSlop={8} accessibilityLabel={t('common.close')}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  formatRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.pill,
    padding: 4,
    gap: 4,
    marginBottom: Spacing.lg,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
  formatOptionActive: { backgroundColor: Colors.primary },
  cardWrap: { alignItems: 'center', marginBottom: Spacing.lg },
  actionsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  footerRow: { flexDirection: 'row', gap: Spacing.md },
  footerButton: { flex: 1 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: Spacing.xl },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 4, 10, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewActions: { position: 'absolute', top: 56, right: 20 },
  previewClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
