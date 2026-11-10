import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { AppText } from '@/components/yumi/app-text';
import { Button } from '@/components/yumi/button';
import { LanguageToggle } from '@/components/yumi/language-toggle';
import { MascotMini } from '@/components/yumi/mascot';
import { ScreenContainer } from '@/components/yumi/screen-container';
import { SocialButton } from '@/components/yumi/social-button';
import { TextField } from '@/components/yumi/text-field';
import { Colors, Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { useAuth } from '@/context/auth-context';
import i18n from '@/i18n';

const MIN_AGE = 9;
const MAX_AGE = 100;

function registerErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code;
  // AUTH-011: checked first, and matched before 'auth/invalid-email' below — a genuinely
  // duplicate email is a distinct Firebase error code from a malformed one, never both at once,
  // so this can't fall through to the "looks off" message for a real duplicate.
  if (code === 'auth/email-already-in-use') return i18n.t('auth.errors.emailInUse');
  if (code === 'auth/invalid-email') return i18n.t('auth.errors.invalidEmail');
  if (code === 'auth/weak-password') return i18n.t('auth.errors.passwordTooShort');
  return i18n.t('auth.register.genericError');
}

export default function RegisterScreen() {
  const { register } = useAuth();
  const { t } = useTranslation();
  const { setUserAge } = useAppState();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !age.trim() || !email.trim() || !password) {
      setError(t('auth.register.fillAllFields'));
      return;
    }
    const parsedAge = parseInt(age, 10);
    if (Number.isNaN(parsedAge) || parsedAge < MIN_AGE || parsedAge > MAX_AGE) {
      setError(t('auth.register.invalidAge', { min: MIN_AGE, max: MAX_AGE }));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.errors.passwordTooShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.register.passwordsDontMatch'));
      return;
    }

    setError('');
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      setUserAge(parsedAge);
      // A brand-new account is never verified yet — gate on verify-email first (see
      // authMiddleware.js's EMAIL_NOT_VERIFIED check). Cycle Basics 101 is *after* that,
      // passed along as `next` so verify-email knows where to send a freshly-verified
      // sign-up instead of the generic Home fallback it uses otherwise.
      router.replace({ pathname: '/verify-email' as never, params: { next: '/cycle-basics' } });
    } catch (err) {
      setError(registerErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.languageRow}>
        <LanguageToggle />
      </View>
      <Animated.View entering={FadeInDown.duration(450)} style={styles.header}>
        <MascotMini size={44} />
        <AppText variant="h1" style={styles.headerTitle}>
          {t('auth.register.title')}
        </AppText>
        <AppText variant="body" color={Colors.textSecondary} center>
          {t('auth.register.subtitle')}
        </AppText>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(450).delay(120)}>
        <TextField label={t('auth.register.name')} icon="person-outline" placeholder={t('auth.register.namePlaceholder')} value={name} onChangeText={setName} />
        <TextField
          label={t('auth.register.age')}
          icon="gift-outline"
          placeholder={t('auth.register.agePlaceholder')}
          keyboardType="number-pad"
          maxLength={3}
          value={age}
          onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
        />
        <TextField
          label={t('auth.email')}
          icon="mail-outline"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label={t('auth.password')}
          icon="lock-closed-outline"
          placeholder={t('auth.register.passwordPlaceholder')}
          isPassword
          value={password}
          onChangeText={setPassword}
        />
        <TextField
          label={t('auth.register.confirmPassword')}
          icon="lock-closed-outline"
          placeholder={t('auth.register.confirmPlaceholder')}
          isPassword
          value={confirm}
          onChangeText={setConfirm}
          error={error}
        />

        <AppText variant="small" color={Colors.textMuted} style={styles.terms}>
          {t('auth.register.terms')}
        </AppText>

        <Button label={t('auth.register.submit')} onPress={handleRegister} loading={loading} style={styles.registerButton} />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <AppText variant="small">{t('auth.orContinueWith')}</AppText>
          <View style={styles.dividerLine} />
        </View>

        {/* Google sign-in needs an OAuth client set up in Firebase/Google Cloud
            Console first — not wired to real auth yet. */}
        <SocialButton
          label={t('auth.continueWithGoogle')}
          onPress={() => Alert.alert(t('common.comingSoon'), t('auth.googleNotReady'))}
        />
      </Animated.View>

      <View style={styles.footer}>
        <AppText variant="body" color={Colors.textSecondary}>
          {t('auth.register.haveAccount')}{' '}
        </AppText>
        <Link href="/login" replace>
          <AppText variant="bodyMedium" color={Colors.primary}>
            {t('auth.logIn')}
          </AppText>
        </Link>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  languageRow: { alignItems: 'flex-end', paddingTop: Spacing.sm },
  header: { alignItems: 'center', paddingTop: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.sm },
  headerTitle: { marginTop: Spacing.sm },
  terms: { lineHeight: 17, marginBottom: Spacing.xl },
  registerButton: { marginBottom: Spacing.xxl },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xxl },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
});
