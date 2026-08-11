import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { AppText } from '@/components/mira/app-text';
import { Mascot } from '@/components/mira/mascot';
import { Colors, Spacing } from '@/constants/theme';

/** Mira's animated splash screen — mascot fades/floats/waves in, then routes onward. */
export default function SplashRoute() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/onboarding');
    }, 2400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.mascotWrap}>
        <Mascot size={168} />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(350)}>
        <AppText variant="display" center style={{ color: Colors.primary }}>
          Mira
        </AppText>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(500)}>
        <AppText variant="bodyLarge" center color={Colors.textSecondary} style={styles.tagline}>
          Your friendly period companion
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  mascotWrap: { marginBottom: Spacing.sm },
  tagline: { paddingHorizontal: Spacing.xxxl, marginTop: -Spacing.sm },
});
