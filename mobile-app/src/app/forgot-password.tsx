import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';

import { AppText } from '@/components/mira/app-text';
import { Button } from '@/components/mira/button';
import { IconCircle } from '@/components/mira/icon-circle';
import { ScreenContainer } from '@/components/mira/screen-container';
import { ScreenHeader } from '@/components/mira/screen-header';
import { TextField } from '@/components/mira/text-field';
import { Colors, Spacing } from '@/constants/theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [resent, setResent] = useState(false);

  const handleSend = () => {
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Enter a valid email address');
      return;
    }
    setError('');
    setSent(true);
  };

  const handleResend = () => {
    setResent(true);
  };

  if (sent) {
    return (
      <ScreenContainer scroll={false} edges={['top', 'left', 'right']}>
        <ScreenHeader title="" onBack={() => setSent(false)} />

        <View style={styles.sentWrap}>
          <Animated.View entering={ZoomIn.duration(420).springify().damping(14)}>
            <IconCircle color={Colors.tint50} size={88}>
              <Ionicons name="mail-open-outline" size={38} color={Colors.primary} />
            </IconCircle>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(400).delay(100)} style={styles.sentTextWrap}>
            <AppText variant="h1" center style={styles.sentTitle}>
              Check your email
            </AppText>
            <AppText variant="body" color={Colors.textSecondary} center style={styles.sentSubtitle}>
              We&apos;ve sent password reset instructions to
            </AppText>
            <AppText variant="bodyMedium" center>
              {email}
            </AppText>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(400).delay(180)} style={styles.sentActions}>
            <Button
              label="Back to Log In"
              onPress={() => router.replace('/login')}
              style={styles.backToLoginButton}
            />

            <View style={styles.resendRow}>
              <AppText variant="small" color={Colors.textSecondary}>
                {resent ? 'Email resent — ' : "Didn't get the email? "}
              </AppText>
              <Pressable hitSlop={6} onPress={handleResend} disabled={resent}>
                <AppText variant="small" color={resent ? Colors.textMuted : Colors.primary}>
                  {resent ? 'Sent!' : 'Resend'}
                </AppText>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="" />

      <Animated.View entering={FadeInDown.duration(450)} style={styles.header}>
        <IconCircle color={Colors.tint50} size={72}>
          <Ionicons name="lock-closed-outline" size={30} color={Colors.primary} />
        </IconCircle>
        <AppText variant="h1" style={styles.headerTitle}>
          Forgot your password?
        </AppText>
        <AppText variant="body" color={Colors.textSecondary} center style={styles.headerSubtitle}>
          No worries — enter the email linked to your account and we&apos;ll send you a reset link.
        </AppText>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(450).delay(120)}>
        <TextField
          label="Email"
          icon="mail-outline"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (error) setError('');
          }}
          error={error}
        />

        <Button label="Send Reset Link" onPress={handleSend} style={styles.sendButton} />
      </Animated.View>

      <View style={styles.footer}>
        <AppText variant="body" color={Colors.textSecondary}>
          Remembered your password?{' '}
        </AppText>
        <Pressable hitSlop={6} onPress={() => router.replace('/login')}>
          <AppText variant="bodyMedium" color={Colors.primary}>
            Log in
          </AppText>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingTop: Spacing.lg, paddingBottom: Spacing.xxxl, gap: Spacing.md },
  headerTitle: { marginTop: Spacing.sm, textAlign: 'center' },
  headerSubtitle: { paddingHorizontal: Spacing.md },
  sendButton: { marginTop: Spacing.sm, marginBottom: Spacing.xxl },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
  sentWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.xxl, paddingBottom: Spacing.huge },
  sentTextWrap: { alignItems: 'center', gap: Spacing.xs },
  sentTitle: { marginTop: Spacing.sm },
  sentSubtitle: { paddingHorizontal: Spacing.xl, marginBottom: 2 },
  sentActions: { width: '100%', alignItems: 'center', marginTop: Spacing.lg },
  backToLoginButton: { marginBottom: Spacing.lg },
  resendRow: { flexDirection: 'row', alignItems: 'center' },
});
