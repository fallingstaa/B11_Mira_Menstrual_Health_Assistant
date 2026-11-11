import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { forwardRef } from 'react';
import { Image, StyleSheet, View, type HostInstance } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/yumi/app-text';
import { Mascot, MascotMini } from '@/components/yumi/mascot';
import type { ShareCardKind } from '@/constants/share-card-content';
import { Colors } from '@/constants/theme';

export type ShareCardTemplate = 'blush' | 'sticker' | 'baddie' | 'dreamy' | 'merry' | 'frosty' | 'cozy';
export type ShareCardFormat = 'story' | 'square';
export const SHARE_CARD_TEMPLATES: ShareCardTemplate[] = ['blush', 'sticker', 'baddie', 'dreamy'];
/** Used instead of the everyday templates while Christmas mode is on. */
export const CHRISTMAS_TEMPLATES: ShareCardTemplate[] = ['merry', 'frosty', 'cozy'];

type Props = {
  template: ShareCardTemplate;
  format: ShareCardFormat;
  /** On-screen width in points; everything inside scales from it, so a capture looks identical. */
  width: number;
  kind: ShareCardKind;
  text: string;
  sub?: string;
  name: string;
  avatarUri: string | null;
  avatarHeaders?: { Authorization: string };
  dateLabel: string;
  onAvatarLoad?: () => void;
};

type Decor =
  | { icon: keyof typeof Ionicons.glyphMap; mci?: false; top: number; left: number; size: number; rotate?: number; color?: string }
  | { icon: keyof typeof MaterialCommunityIcons.glyphMap; mci: true; top: number; left: number; size: number; rotate?: number; color?: string };

type Theme = {
  gradient: [string, string, ...string[]];
  text: string;
  subText: string;
  accent: string;
  pillBg: string;
  pillText: string;
  ring: string;
  decorColor: string;
  decor: Decor[];
  /** Big mascot peeking from the corner (Story format only). */
  mascot: boolean;
  /** Text sits on a white rounded panel instead of straight on the background. */
  panel: boolean;
};

// Positions are % of the card, so the same arrangement works for Story and Square.
const THEMES: Record<ShareCardTemplate, Theme> = {
  blush: {
    gradient: [Colors.primaryLight, Colors.primary, Colors.primaryDark],
    text: '#FFFFFF',
    subText: 'rgba(255,255,255,0.85)',
    accent: '#FFE3EA',
    pillBg: 'rgba(255,255,255,0.22)',
    pillText: '#FFFFFF',
    ring: '#FFFFFF',
    decorColor: 'rgba(255,255,255,0.55)',
    decor: [
      { icon: 'sparkles', top: 6, left: 8, size: 26 },
      { icon: 'heart', top: 12, left: 82, size: 20, rotate: 15 },
      { icon: 'star', top: 44, left: 4, size: 14 },
      { icon: 'sparkles', top: 52, left: 86, size: 18 },
      { icon: 'heart', top: 80, left: 10, size: 16, rotate: -12 },
    ],
    mascot: true,
    panel: false,
  },
  sticker: {
    gradient: [Colors.tint50, Colors.tint100],
    text: Colors.primaryDark,
    subText: Colors.textSecondary,
    accent: Colors.primary,
    pillBg: Colors.primary,
    pillText: '#FFFFFF',
    ring: '#FFFFFF',
    decorColor: Colors.tint300,
    decor: [
      { icon: 'heart', top: 4, left: 6, size: 22, rotate: -15 },
      { icon: 'star', top: 8, left: 84, size: 20, rotate: 12 },
      { icon: 'flower', top: 30, left: 88, size: 18 },
      { icon: 'heart', top: 70, left: 4, size: 18, rotate: 10 },
      { icon: 'sparkles', top: 86, left: 82, size: 22 },
      { icon: 'happy', top: 90, left: 8, size: 16 },
    ],
    mascot: false,
    panel: true,
  },
  baddie: {
    gradient: ['#2A0610', Colors.primaryDark, '#1A0409'],
    text: '#FFFFFF',
    subText: 'rgba(255,255,255,0.75)',
    accent: '#FFD27A',
    pillBg: '#FFD27A',
    pillText: '#2A0610',
    ring: '#FFD27A',
    decorColor: '#FFD27A',
    decor: [
      { icon: 'star', top: 5, left: 10, size: 16 },
      { icon: 'sparkles', top: 9, left: 80, size: 26 },
      { icon: 'star', top: 38, left: 90, size: 12 },
      { icon: 'diamond', top: 62, left: 5, size: 16 },
      { icon: 'sparkles', top: 84, left: 86, size: 18 },
    ],
    mascot: false,
    panel: false,
  },
  dreamy: {
    gradient: [Colors.lavenderTint, Colors.tint100, Colors.tint200],
    text: Colors.primaryDark,
    subText: Colors.textSecondary,
    accent: Colors.lavender,
    pillBg: Colors.lavender,
    pillText: '#FFFFFF',
    ring: Colors.lavender,
    decorColor: '#FFFFFF',
    decor: [
      { icon: 'cloud', top: 5, left: 6, size: 34 },
      { icon: 'star', top: 10, left: 84, size: 18 },
      { icon: 'cloud', top: 40, left: 82, size: 26 },
      { icon: 'heart', top: 60, left: 6, size: 16 },
      { icon: 'moon', top: 82, left: 84, size: 18 },
    ],
    mascot: true,
    panel: false,
  },

  // ---------------- Christmas mode templates ----------------
  merry: {
    gradient: ['#D7263D', '#A3172B', '#6E0F1D'],
    text: '#FFFFFF',
    subText: 'rgba(255,255,255,0.85)',
    accent: '#FFE08A',
    pillBg: '#1E7A4C',
    pillText: '#FFFFFF',
    ring: '#FFE08A',
    decorColor: 'rgba(255,255,255,0.7)',
    decor: [
      { icon: 'pine-tree', mci: true, top: 4, left: 6, size: 30, color: '#3FA968' },
      { icon: 'gift', mci: true, top: 8, left: 82, size: 24, color: '#FFE08A', rotate: 10 },
      { icon: 'snowflake', mci: true, top: 40, left: 5, size: 16 },
      { icon: 'candycane', mci: true, top: 50, left: 86, size: 22, color: '#FFFFFF', rotate: -15 },
      { icon: 'star-four-points', mci: true, top: 80, left: 8, size: 16, color: '#FFE08A' },
    ],
    mascot: true,
    panel: false,
  },
  frosty: {
    gradient: ['#F4FAFF', '#DCEEFC', '#C3E1F7'],
    text: '#165B33',
    subText: '#4A6B5A',
    accent: '#C41E3A',
    pillBg: '#C41E3A',
    pillText: '#FFFFFF',
    ring: '#FFFFFF',
    decorColor: '#8DC3EC',
    decor: [
      { icon: 'snowflake', mci: true, top: 4, left: 8, size: 26 },
      { icon: 'ornament', mci: true, top: 6, left: 82, size: 24, color: '#C41E3A' },
      { icon: 'snowflake', mci: true, top: 32, left: 88, size: 16 },
      { icon: 'pine-tree-variant', mci: true, top: 70, left: 4, size: 22, color: '#1E7A4C' },
      { icon: 'snowflake', mci: true, top: 88, left: 84, size: 20 },
    ],
    mascot: false,
    panel: true,
  },
  cozy: {
    gradient: ['#0F3D24', '#165B33', '#0B2E1B'],
    text: '#FFFFFF',
    subText: 'rgba(255,255,255,0.78)',
    accent: '#F2C14E',
    pillBg: '#F2C14E',
    pillText: '#0F3D24',
    ring: '#F2C14E',
    decorColor: '#F2C14E',
    decor: [
      { icon: 'string-lights', mci: true, top: 3, left: 6, size: 30 },
      { icon: 'star-four-points', mci: true, top: 9, left: 84, size: 20 },
      { icon: 'ornament', mci: true, top: 42, left: 88, size: 18, color: '#D7263D' },
      { icon: 'coffee', mci: true, top: 66, left: 5, size: 18, color: '#FFFFFF' },
      { icon: 'gift', mci: true, top: 86, left: 84, size: 20, color: '#D7263D' },
    ],
    mascot: true,
    panel: false,
  },
};

const KIND_ICON: Record<ShareCardKind, keyof typeof Ionicons.glyphMap> = {
  quote: 'sparkles',
  fact: 'bulb',
  tip: 'water',
  myth: 'help-circle',
  selfcare: 'heart',
};

/**
 * The shareable card itself — purely presentational, so the screen can render it scaled for
 * preview and capture the exact same view as an image (react-native-view-shot via the ref).
 * Shows only the user's name/photo, a daily message and Yumi branding — never cycle data.
 */
export const ShareCard = forwardRef<HostInstance, Props>(function ShareCard(
  { template, format, width, kind, text, sub, name, avatarUri, avatarHeaders, dateLabel, onAvatarLoad },
  ref,
) {
  const { t } = useTranslation();
  const theme = THEMES[template];
  const story = format === 'story';
  const height = story ? (width * 16) / 9 : width;
  const u = width / 360; // 1 design unit
  const avatarSize = (story ? 112 : 76) * u;

  // Longer text gets a smaller size so it always fits; Square is tighter than Story.
  const length = text.length + (sub?.length ?? 0);
  const base = kind === 'quote' ? 30 : length > 110 ? 18 : length > 70 ? 21 : 24;
  const fontSize = base * u * (story ? 1 : 0.82);

  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <View ref={ref} collapsable={false} style={{ width, height, overflow: 'hidden', borderRadius: 24 * u }}>
      <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

      {theme.decor.map((d, i) => {
        const style = { position: 'absolute' as const, top: `${d.top}%` as const, left: `${d.left}%` as const, transform: [{ rotate: `${d.rotate ?? 0}deg` }] };
        const color = d.color ?? theme.decorColor;
        return d.mci ? (
          <MaterialCommunityIcons key={i} name={d.icon} size={d.size * u} color={color} style={style} />
        ) : (
          <Ionicons key={i} name={d.icon} size={d.size * u} color={color} style={style} />
        );
      })}

      {theme.mascot && story ? (
        <View style={{ position: 'absolute', right: -18 * u, bottom: 64 * u, opacity: 0.95 }}>
          <Mascot size={96 * u} floating={false} waving={false} mood="wink" />
        </View>
      ) : null}

      <View style={{ flex: 1, padding: 24 * u, paddingTop: (story ? 48 : 22) * u }}>
        {/* Who it's from */}
        <View style={{ alignItems: 'center' }}>
          <View
            style={[
              styles.avatarRing,
              { width: avatarSize + 8 * u, height: avatarSize + 8 * u, borderRadius: avatarSize, borderColor: theme.ring, borderWidth: 3 * u },
              template === 'sticker' && { borderRadius: 10 * u, transform: [{ rotate: '-4deg' }], borderWidth: 6 * u },
            ]}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri, headers: avatarHeaders }}
                onLoad={onAvatarLoad}
                // A failed photo still counts as "done" so Save/Share never stay disabled forever.
                onError={onAvatarLoad}
                style={{ width: avatarSize, height: avatarSize, borderRadius: template === 'sticker' ? 4 * u : avatarSize / 2 }}
              />
            ) : (
              <View style={[styles.initial, { width: avatarSize, height: avatarSize, borderRadius: template === 'sticker' ? 4 * u : avatarSize / 2 }]}>
                <AppText style={{ fontSize: avatarSize * 0.42, lineHeight: avatarSize * 0.55, color: Colors.primary }}>{initial}</AppText>
              </View>
            )}
          </View>
          <AppText
            variant="h2"
            numberOfLines={1}
            style={{ color: theme.text, fontSize: 20 * u, lineHeight: 26 * u, marginTop: 10 * u, maxWidth: width - 60 * u }}>
            {name}
          </AppText>
        </View>

        {/* Today's message */}
        <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 12 * u }}>
          <View
            style={
              theme.panel
                ? [styles.panel, { borderRadius: 22 * u, padding: 20 * u, borderWidth: 2 * u, borderColor: Colors.tint200 }]
                : undefined
            }>
            <View style={[styles.pill, kind === 'quote' && { alignSelf: 'center' }, { backgroundColor: theme.pillBg, borderRadius: 99, paddingHorizontal: 12 * u, paddingVertical: 5 * u, gap: 5 * u, marginBottom: 14 * u }]}>
              <Ionicons name={KIND_ICON[kind]} size={13 * u} color={theme.pillText} />
              <AppText variant="caption" style={{ color: theme.pillText, fontSize: 11 * u, lineHeight: 14 * u, letterSpacing: 0.6 }}>
                {t(`shareCard.kinds.${kind}`)}
              </AppText>
            </View>

            {kind === 'myth' ? (
              <>
                <AppText variant="caption" style={{ color: theme.accent, fontSize: 12 * u, lineHeight: 16 * u }}>
                  {t('shareCard.myth')}
                </AppText>
                <AppText
                  variant="h3"
                  style={{ color: theme.subText, fontSize: fontSize * 0.8, lineHeight: fontSize * 1.05, textDecorationLine: 'line-through', marginTop: 2 * u }}>
                  {text}
                </AppText>
                <AppText variant="caption" style={{ color: theme.accent, fontSize: 12 * u, lineHeight: 16 * u, marginTop: 14 * u }}>
                  {t('shareCard.fact')}
                </AppText>
                <AppText variant="h2" style={{ color: theme.text, fontSize, lineHeight: fontSize * 1.3, marginTop: 2 * u }}>
                  {sub}
                </AppText>
              </>
            ) : (
              <AppText
                variant={kind === 'quote' ? 'display' : 'h2'}
                style={{ color: theme.text, fontSize, lineHeight: fontSize * 1.28, textAlign: kind === 'quote' ? 'center' : 'left' }}>
                {kind === 'quote' ? `“${text}”` : text}
              </AppText>
            )}
          </View>
        </View>

        {/* Branding */}
        <View style={[styles.footer, { gap: 8 * u }]}>
          <View style={[styles.brandBadge, { borderRadius: 99, padding: 3 * u }]}>
            <MascotMini size={26 * u} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyMedium" style={{ color: theme.text, fontSize: 15 * u, lineHeight: 19 * u }}>
              @yumi
            </AppText>
            <AppText variant="small" style={{ color: theme.subText, fontSize: 11 * u, lineHeight: 14 * u }}>
              {t('shareCard.tagline')}
            </AppText>
          </View>
          <AppText variant="small" style={{ color: theme.subText, fontSize: 11 * u, lineHeight: 14 * u }}>
            {dateLabel}
          </AppText>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  avatarRing: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  initial: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.tint100 },
  panel: { backgroundColor: '#FFFFFF' },
  pill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  footer: { flexDirection: 'row', alignItems: 'center' },
  brandBadge: { backgroundColor: '#FFFFFF' },
});
