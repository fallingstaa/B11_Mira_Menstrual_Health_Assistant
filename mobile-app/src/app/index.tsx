import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { AppText } from '@/components/mira/app-text';
import { Mascot } from '@/components/mira/mascot';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

/**
 * Mira's animated splash screen — mascot fades/floats/waves in, then routes onward.
 *
 * AUTH-008: this used to route to /onboarding unconditionally, regardless of Firebase's own
 * persisted session — so a returning, already-logged-in user was sent through onboarding and
 * dumped on the login screen every single cold start, even though `auth` (config/firebase.ts)
 * was persisting the session correctly the whole time. Firebase was never the problem; nothing
 * here was ever checking it. Waits for `initializing` (Firebase resolving whatever session is on
 * disk) before deciding, then a logged-in user skips onboarding *and* login entirely.
 */
export default function SplashRoute() {
  const { user, initializing } = useAuth();

  useEffect(() => {
    if (initializing) return;
    const timer = setTimeout(() => {
      router.replace(user ? '/(tabs)/home' : '/onboarding');
    }, 2400);
    return () => clearTimeout(timer);
  }, [initializing, user]);

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
