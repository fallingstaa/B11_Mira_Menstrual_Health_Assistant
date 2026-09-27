import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/mira/app-text';
import { useMira } from '@/components/mira/education/mira-companion';
import {
  LightLevel,
  TRAFFIC_LIGHTS,
  TRAFFIC_LIGHT_EMERGENCY,
  TRAFFIC_LIGHT_FOOTER,
} from '@/constants/education-activities';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';

// Mira's line for each light — gentle and non-diagnostic; the guidance itself is the source text.
const MIRA_LINES: Record<LightLevel['id'], string> = {
  green: 'Lots of what your body does is completely normal.',
  yellow: 'Keeping track is a great habit. It helps you notice patterns.',
  red: 'Asking a doctor for help is always okay. Nobody will judge you.',
};

/** Topic 6: tap Green / Yellow / Red to see which signs fit where and what to do about them. */
export function TrafficLight() {
  const say = useMira();
  const [open, setOpen] = useState<LightLevel['id'] | null>(null);

  const choose = (id: LightLevel['id']) => {
    const next = open === id ? null : id;
    setOpen(next);
    if (next) say(MIRA_LINES[next]);
  };

  const active = TRAFFIC_LIGHTS.find((l) => l.id === open);

  return (
    <View>
      <AppText variant="h3">Traffic light checker</AppText>
      <AppText variant="small" style={styles.hint}>
        Tap a light to see what fits where.
      </AppText>

      <View style={styles.lights}>
        {TRAFFIC_LIGHTS.map((l) => (
          <Light key={l.id} level={l} active={open === l.id} dimmed={open !== null && open !== l.id} onPress={() => choose(l.id)} />
        ))}
      </View>

      {active ? (
        <View style={[styles.panel, { backgroundColor: active.tint, borderColor: active.color }]}>
          <View style={styles.panelHead}>
            <Ionicons name={active.icon} size={22} color={active.color} />
            <AppText variant="h3" color={active.color}>
              {active.headline}
            </AppText>
          </View>

          {active.id === 'red' ? <DoctorPrompt /> : null}

          {active.points.map((p, i) => (
            <View key={i} style={styles.point}>
              <View style={[styles.bullet, { backgroundColor: active.color }]} />
              <AppText variant="body" style={[styles.text, styles.flex]}>
                {p}
              </AppText>
            </View>
          ))}

          {active.id === 'red' ? (
            <>
              <View style={styles.emergency}>
                <Ionicons name="warning" size={18} color={Colors.primary} />
                <AppText variant="bodyMedium" style={[styles.text, styles.flex]}>
                  {TRAFFIC_LIGHT_EMERGENCY}
                </AppText>
              </View>
              <AppText variant="small" style={styles.text}>
                {TRAFFIC_LIGHT_FOOTER}
              </AppText>
            </>
          ) : null}
        </View>
      ) : (
        <View style={styles.idle}>
          <Ionicons name="hand-left-outline" size={20} color={Colors.textMuted} />
          <AppText variant="small">Pick a light above.</AppText>
        </View>
      )}
    </View>
  );
}

function Light({ level, active, dimmed, onPress }: { level: LightLevel; active: boolean; dimmed: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(active ? 1.08 : 1, { damping: 10, stiffness: 200 });
    glow.value = active ? withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0.3, { duration: 900 })), -1) : withTiming(0);
  }, [active, scale, glow]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: 0.15 + glow.value * 0.45,
    opacity: dimmed ? 0.5 : 1,
  }));

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={`${level.label}: ${level.headline}`} style={styles.lightWrap}>
      <Animated.View style={[styles.light, { backgroundColor: level.color, shadowColor: level.color }, style]}>
        <Ionicons name={level.icon} size={28} color="#FFFFFF" />
      </Animated.View>
      <AppText variant="bodyMedium" color={level.color} center>
        {level.label}
      </AppText>
      <AppText variant="caption" center numberOfLines={2}>
        {level.headline}
      </AppText>
    </Pressable>
  );
}

/** A prominent "talk to a doctor" banner shown at the top of the red panel. */
function DoctorPrompt() {
  return (
    <View style={styles.doctor}>
      <Ionicons name="medkit" size={22} color="#FFFFFF" />
      <AppText variant="bodyMedium" color="#FFFFFF" style={styles.flex}>
        If any of these sound like you, talk to a doctor.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hint: { marginTop: 2, marginBottom: Spacing.lg },
  lights: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  lightWrap: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  light: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    elevation: 4,
  },
  panel: { borderRadius: Radius.xl, borderWidth: 1.5, padding: Spacing.lg, gap: Spacing.md, ...Shadow.card },
  panelHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  bullet: { width: 8, height: 8, borderRadius: 4, marginTop: 8 },
  text: { lineHeight: 23 },
  doctor: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md },
  emergency: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md },
  idle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.lg },
});
