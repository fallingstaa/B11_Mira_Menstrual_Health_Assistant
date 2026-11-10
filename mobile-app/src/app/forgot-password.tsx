import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';

import { AppText } from '@/components/yumi/app-text';
import { Button } from '@/components/yumi/button';
import { IconCircle } from '@/components/yumi/icon-circle';
import { ScreenContainer } from '@/components/yumi/screen-container';
import { ScreenHeader } from '@/components/yumi/screen-header';
import { TextField } from '@/components/yumi/text-field';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError(t('auth.forgot.invalidEmail'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      // Firebase silently no-ops for an unregistered email rather than throwing —
      // that's intentional on Firebase's part, and matches the user-enumeration
      // protection called out in Security Design 14.6 (don't reveal which emails
      // have accounts). Either way this shows the same "check your email" screen.
      await resetPassword(email.trim());
    } catch {
      // Ignore and still show the success screen for the same reason.
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  const handleResend = () => {
    resetPassword(email.trim()).catch(() => {});
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
              {t('auth.forgot.checkEmail')}
            </AppText>
            <AppText variant="body" color={Colors.textSecondary} center style={styles.sentSubtitle}>
              {t('auth.forgot.sentTo')}
            </AppText>
            <AppText variant="bodyMedium" center>
              {email}
            </AppText>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(400).delay(180)} style={styles.sentActions}>
            <Button
              label={t('auth.forgot.backToLogin')}
              onPress={() => router.replace('/login')}
              style={styles.backToLoginButton}
            />

            <View style={styles.resendRow}>
              <AppText variant="small" color={Colors.textSecondary}>
                {resent ? t('auth.emailResent') : t('auth.didntGetEmail')}
              </AppText>
              <Pressable hitSlop={6} onPress={handleResend} disabled={resent}>
                <AppText variant="small" color={resent ? Colors.textMuted : Colors.primary}>
                  {resent ? t('auth.sent') : t('auth.resend')}
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
          {t('auth.forgot.title')}
        </AppText>
        <AppText variant="body" color={Colors.textSecondary} center style={styles.headerSubtitle}>
          {t('auth.forgot.subtitle')}
        </AppText>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(450).delay(120)}>
        <TextField
          label={t('auth.email')}
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

        <Button label={t('auth.forgot.submit')} onPress={handleSend} loading={loading} style={styles.sendButton} />
      </Animated.View>

      <View style={styles.footer}>
        <AppText variant="body" color={Colors.textSecondary}>
          {t('auth.forgot.remembered')}{' '}
        </AppText>
        <Pressable hitSlop={6} onPress={() => router.replace('/login')}>
          <AppText variant="bodyMedium" color={Colors.primary}>
            {t('auth.logIn')}
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
