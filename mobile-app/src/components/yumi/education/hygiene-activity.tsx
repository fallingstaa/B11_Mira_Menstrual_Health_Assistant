import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  FadeIn,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { AppText } from '@/components/yumi/app-text';
import { FlipCard } from '@/components/yumi/education/flip-card';
import { HeartBurst, useYumi } from '@/components/yumi/education/yumi-companion';
import { IconCircle } from '@/components/yumi/icon-circle';
import { getActivities } from '@/constants/education-activities';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';

// Yumi's reactions to each thing you pack — encouragement only, the facts come from the source text.
const PACK_CHEERS: Record<string, 'education.hygiene.cheers.pads' | 'education.hygiene.cheers.bag' | 'education.hygiene.cheers.underwear' | 'education.hygiene.cheers.cotton'> = {
  pads: 'education.hygiene.cheers.pads',
  bag: 'education.hygiene.cheers.bag',
  underwear: 'education.hygiene.cheers.underwear',
  cotton: 'education.hygiene.cheers.cotton',
};

/** Topic 3: pack-your-school-kit game, plus flip cards for product choice and TSS safety. */
export function HygieneActivity() {
  return (
    <View style={styles.stack}>
      <KitGame />
      <ProductFlip />
      <TssFlip />
    </View>
  );
}

function KitGame() {
  const say = useYumi();
  const { t } = useTranslation();
  const { KIT_ITEMS } = getActivities();
  const [packed, setPacked] = useState<Set<string>>(new Set());
  const [lastTapped, setLastTapped] = useState<string | null>(null);
  const [burst, setBurst] = useState(0);
  const done = packed.size === KIT_ITEMS.length;

  const toggle = (id: string) => {
    const adding = !packed.has(id);
    const next = new Set(packed);
    if (adding) next.add(id);
    else next.delete(id);
    setPacked(next);
    setLastTapped(id);

    if (adding && next.size === KIT_ITEMS.length) {
      setBurst((n) => n + 1);
      say(t('education.hygiene.sayReady'), 'cheer');
    } else if (adding) {
      say(t(PACK_CHEERS[id]), 'cheer');
    }
  };

  const item = KIT_ITEMS.find((k) => k.id === lastTapped);

  return (
    <View style={styles.card}>
      <AppText variant="h3">{t('education.hygiene.kitTitle')}</AppText>
      <AppText variant="small" style={styles.hint}>
        {t('education.hygiene.kitHint')}
      </AppText>

      <View style={styles.grid}>
        {KIT_ITEMS.map((k) => (
          <KitTile key={k.id} label={k.label} icon={k.icon} packed={packed.has(k.id)} onPress={() => toggle(k.id)} />
        ))}
      </View>

      <View style={[styles.pouch, done && styles.pouchDone]}>
        <View style={styles.pouchHead}>
          <Ionicons name={done ? 'checkmark-circle' : 'bag-handle'} size={22} color={done ? Colors.success : Colors.primary} />
          <AppText variant="bodyMedium" style={styles.flex}>
            {done ? t('education.hygiene.packed') : t('education.hygiene.pouch')}
          </AppText>
          <AppText variant="caption">
            {t('home.stepsProgress', { done: packed.size, total: KIT_ITEMS.length })}
          </AppText>
        </View>
        <View style={styles.pouchItems}>
          {KIT_ITEMS.filter((k) => packed.has(k.id)).map((k) => (
            <Animated.View key={k.id} entering={ZoomIn.springify().damping(9)} style={styles.pouchItem}>
              <Ionicons name={k.icon} size={20} color={Colors.primary} />
            </Animated.View>
          ))}
          {packed.size === 0 ? (
            <AppText variant="small" color={Colors.textMuted}>
              {t('education.hygiene.empty')}
            </AppText>
          ) : null}
        </View>
        <HeartBurst trigger={burst} />
      </View>

      {item && packed.has(item.id) ? (
        <View key={item.id} style={styles.fact}>
          <AppText variant="caption" color={Colors.primary}>
            WHY {item.label.toUpperCase()}
          </AppText>
          {item.text.map((t, i) => (
            <AppText key={i} variant="body" style={styles.text}>
              {t}
            </AppText>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function KitTile({ label, icon, packed, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; packed: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSequence(withSpring(1.12, { damping: 6, stiffness: 300 }), withSpring(1, { damping: 8 }));
  }, [packed, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: packed }} accessibilityLabel={label} style={styles.tileWrap}>
      <Animated.View style={[styles.tile, packed && styles.tilePacked, style]}>
        <IconCircle color={packed ? Colors.surface : Colors.tint50} size={44}>
          <Ionicons name={icon} size={22} color={Colors.primary} />
        </IconCircle>
        <AppText variant="bodyMedium" center numberOfLines={2}>
          {label}
        </AppText>
        {packed ? (
          <Animated.View entering={ZoomIn.springify().damping(7)} style={styles.check}>
            <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
          </Animated.View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

function ProductFlip() {
  const say = useYumi();
  const { t } = useTranslation();
  const { PRODUCT_COMPARE } = getActivities();
  const [flipped, setFlipped] = useState(false);

  return (
    <FlipCard
      height={400}
      flipped={flipped}
      onFlip={() => {
        if (!flipped) say(t('education.hygiene.sayProduct'));
        setFlipped((f) => !f);
      }}
      frontColor={Colors.tealTint}
      backColor={Colors.surface}
      accent={Colors.teal}
      front={
        <>
          <IconCircle color={Colors.surface} size={64}>
            <Ionicons name="swap-horizontal" size={30} color={Colors.teal} />
          </IconCircle>
          <AppText variant="h2" center>
            {PRODUCT_COMPARE.title}
          </AppText>
          <AppText variant="small" center>
            {t('education.tapToFlip')}
          </AppText>
        </>
      }
      back={
        <>
          <AppText variant="h3" color={Colors.teal}>
            {PRODUCT_COMPARE.title}
          </AppText>
          {PRODUCT_COMPARE.paragraphs.map((p, i) => (
            <AppText key={i} variant="body" style={styles.text}>
              {p}
            </AppText>
          ))}
        </>
      }
    />
  );
}

function TssFlip() {
  const say = useYumi();
  const { t } = useTranslation();
  const { TSS_WARNING } = getActivities();
  const [flipped, setFlipped] = useState(false);

  return (
    <FlipCard
      height={400}
      flipped={flipped}
      onFlip={() => {
        if (!flipped) say(t('education.hygiene.sayTss'));
        setFlipped((f) => !f);
      }}
      frontColor={Colors.warningTint}
      backColor={Colors.surface}
      accent={Colors.warning}
      front={
        <>
          <IconCircle color={Colors.surface} size={64}>
            <Ionicons name="warning" size={30} color={Colors.warning} />
          </IconCircle>
          <AppText variant="h2" center>
            {TSS_WARNING.title}
          </AppText>
          <AppText variant="small" center>
            {t('education.tapToFlip')}
          </AppText>
        </>
      }
      back={
        <>
          <Animated.View entering={FadeIn} style={styles.tssHead}>
            <Ionicons name="warning" size={18} color={Colors.warning} />
            <AppText variant="h3" color={Colors.warning}>
              {TSS_WARNING.title}
            </AppText>
          </Animated.View>
          {TSS_WARNING.paragraphs.map((p, i) => (
            <AppText key={i} variant="body" style={styles.text}>
              {p}
            </AppText>
          ))}
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.xl },
  flex: { flex: 1 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, ...Shadow.card },
  hint: { marginTop: 2, marginBottom: Spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  tileWrap: { width: '47.5%' },
  tile: {
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minHeight: 112,
    justifyContent: 'center',
  },
  tilePacked: { backgroundColor: Colors.successTint, borderColor: Colors.success },
  check: { position: 'absolute', top: 6, right: 6 },
  pouch: { marginTop: Spacing.lg, borderRadius: Radius.lg, backgroundColor: Colors.tint50, padding: Spacing.lg, gap: Spacing.md, borderWidth: 1.5, borderColor: Colors.tint200 },
  pouchDone: { backgroundColor: Colors.successTint, borderColor: Colors.success },
  pouchHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pouchItems: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, minHeight: 36, alignItems: 'center' },
  pouchItem: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  fact: { marginTop: Spacing.lg, gap: Spacing.sm, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.lg, padding: Spacing.lg },
  text: { lineHeight: 23 },
  tssHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
