import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';

import { AppText } from '@/components/mira/app-text';
import { Button } from '@/components/mira/button';
import { IconCircle } from '@/components/mira/icon-circle';
import { ScreenContainer } from '@/components/mira/screen-container';
import { Colors, Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { useAuth } from '@/context/auth-context';

/**
 * Gate screen between "Firebase account exists" and "can actually use the app" — the
 * backend rejects every protected endpoint with EMAIL_NOT_VERIFIED until this passes
 * (see authMiddleware.js), and api.ts redirects here automatically the moment any
 * screen hits that error, so this is reachable from both a fresh registration and an
 * old unverified account logging back in later.
 */
export default function VerifyEmailScreen() {
  const { user, logout, resendVerificationEmail, refreshEmailVerified } = useAuth();
  const { refreshHydration } = useAppState();
  // Where to go once verified — register.tsx sends new sign-ups on to Cycle Basics;
  // anyone else (a returning unverified login, or api.ts's own redirect) lands on Home.
  const { next } = useLocalSearchParams<{ next?: string }>();
  const destination = next ?? '/(tabs)/home';

  const [checking, setChecking] = useState(false);
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  const [notYetVerified, setNotYetVerified] = useState(false);

  const handleCheckAgain = async () => {
    setChecking(true);
    setNotYetVerified(false);
    try {
      const verified = await refreshEmailVerified();
      if (verified) {
        // Now that the backend will actually accept this account's requests, pull real
        // profile/cycle/record data in immediately — otherwise Home/Calendar would
        // still show the blank local session app-state.tsx fell back to while this
        // account sat unverified (see its EMAIL_NOT_VERIFIED handling).
        refreshHydration();
        router.replace(destination as never);
      } else {
        setNotYetVerified(true);
      }
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerificationEmail();
      setResent(true);
    } catch {
      // Most likely auth/too-many-requests from spamming this button — the button
      // itself just stays as "Resend email" so they can try again in a moment.
    } finally {
      setResending(false);
    }
  };

  return (
    <ScreenContainer scroll={false} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.wrap}>
        <Animated.View entering={ZoomIn.duration(420).springify().damping(14)}>
          <IconCircle color={Colors.tint50} size={88}>
            <Ionicons name="mail-unread-outline" size={38} color={Colors.primary} />
          </IconCircle>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(100)} style={styles.textWrap}>
          <AppText variant="h1" center style={styles.title}>
            Verify your email
          </AppText>
          <AppText variant="body" color={Colors.textSecondary} center style={styles.subtitle}>
            We sent a verification link to
          </AppText>
          <AppText variant="bodyMedium" center>
            {user?.email}
          </AppText>
          <AppText variant="body" color={Colors.textSecondary} center style={styles.subtitle}>
            Tap the link in that email, then come back here.
          </AppText>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(180)} style={styles.actions}>
          {notYetVerified && (
            <AppText variant="small" color={Colors.warning} center style={styles.notYetText}>
              Still not verified — check your inbox (and spam folder) for the link.
            </AppText>
          )}

          <Button label="I've verified — Continue" onPress={handleCheckAgain} loading={checking} style={styles.continueButton} />

          <View style={styles.resendRow}>
            <AppText variant="small" color={Colors.textSecondary}>
              {resent ? 'Email resent — ' : "Didn't get the email? "}
            </AppText>
            <Pressable hitSlop={6} onPress={handleResend} disabled={resending}>
              <AppText variant="small" color={Colors.primary}>
                {resending ? 'Sending…' : 'Resend'}
              </AppText>
            </Pressable>
          </View>

          <Pressable
            hitSlop={6}
            style={styles.logoutRow}
            onPress={() => {
              logout();
              router.replace('/login');
            }}>
            <AppText variant="small" color={Colors.textMuted}>
              Wrong account? Log out
            </AppText>
          </Pressable>
        </Animated.View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.xxl },
  textWrap: { alignItems: 'center', gap: Spacing.xs },
  title: { marginTop: Spacing.sm },
  subtitle: { paddingHorizontal: Spacing.md, marginTop: Spacing.xs },
  actions: { width: '100%', alignItems: 'center', marginTop: Spacing.lg },
  notYetText: { marginBottom: Spacing.md, paddingHorizontal: Spacing.md },
  continueButton: { marginBottom: Spacing.lg },
  resendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl },
  logoutRow: { paddingVertical: Spacing.sm },
});
