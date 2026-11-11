import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppText } from '@/components/yumi/app-text';
import { CHRISTMAS_GREEN, FairyLights } from '@/components/yumi/christmas/decorations';
import { MascotMini } from '@/components/yumi/mascot';
import { Radius, Spacing } from '@/constants/theme';

/** Home's festive greeting card while Christmas mode is on: twinkling lights + a cosy message. */
export function ChristmasBanner({ name }: { name?: string }) {
  const { t } = useTranslation();
  const firstName = name?.trim().split(' ')[0];

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.wrap}>
      <LinearGradient colors={[CHRISTMAS_GREEN, '#145C38']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <FairyLights style={styles.lights} />
        <View style={styles.row}>
          <View style={styles.mascot}>
            <MascotMini size={40} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="h3" color="#FFFFFF">
              {firstName ? t('christmas.greeting', { name: firstName }) : t('christmas.greetingNoName')}
            </AppText>
            <AppText variant="small" color="rgba(255,255,255,0.85)" style={{ marginTop: 2 }}>
              {t('christmas.message')}
            </AppText>
          </View>
          <Ionicons name="gift" size={26} color="#FFD27A" />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.lg },
  card: { borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, overflow: 'hidden' },
  lights: { marginTop: Spacing.sm, marginBottom: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  mascot: { backgroundColor: '#FFFFFF', borderRadius: 99, padding: 4 },
});
