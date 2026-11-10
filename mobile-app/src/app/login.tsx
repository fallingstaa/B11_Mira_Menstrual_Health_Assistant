import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { AppText } from '@/components/yumi/app-text';
import { Button } from '@/components/yumi/button';
import { LanguageToggle } from '@/components/yumi/language-toggle';
import { MascotMini } from '@/components/yumi/mascot';
import { ScreenContainer } from '@/components/yumi/screen-container';
import { SocialButton } from '@/components/yumi/social-button';
import { TextField } from '@/components/yumi/text-field';
import { auth } from '@/config/firebase';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import i18n from '@/i18n';

/** Firebase's auth/xxx-yyy error codes turned into copy a first-time user won't be confused by. */
function loginErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code;
  if (code === 'auth/invalid-email') return i18n.t('auth.errors.invalidEmail');
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return i18n.t('auth.errors.wrongCredentials');
  }
  if (code === 'auth/too-many-requests') return i18n.t('auth.errors.tooManyRequests');
  return i18n.t('auth.login.genericError');
}

export default function LoginScreen() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      // An old account that registered before email verification was required, or one
      // that just never clicked the link, still needs to clear that gate before Home —
      // any protected API call would bounce it there anyway (see api.ts), but catching
      // it here avoids a flash of Home before that redirect kicks in.
      if (!auth.currentUser?.emailVerified) {
        router.replace('/verify-email' as never);
        return;
      }
      // Cycle Basics 101 only auto-shows on brand-new sign-up (register.tsx) — a returning user
      // logging in goes straight to Home, and can reopen the guide any time from there.
      router.replace('/(tabs)/home');
    } catch (err) {
      setError(loginErrorMessage(err));
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
          {t('auth.login.title')}
        </AppText>
        <AppText variant="body" color={Colors.textSecondary}>
          {t('auth.login.subtitle')}
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
        />
        <TextField
          label={t('auth.password')}
          icon="lock-closed-outline"
          placeholder="••••••••"
          isPassword
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (error) setError('');
          }}
          error={error}
        />

        <View style={styles.optionsRow}>
          <Pressable style={styles.rememberRow} onPress={() => setRemember((r) => !r)} hitSlop={6}>
            <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
              {remember && <Ionicons name="checkmark" size={13} color={Colors.textOnPrimary} />}
            </View>
            <AppText variant="small" color={Colors.textSecondary}>
              {t('auth.login.rememberMe')}
            </AppText>
          </Pressable>
          <Pressable hitSlop={6} onPress={() => router.push('/forgot-password')}>
            <AppText variant="small" color={Colors.primary}>
              {t('auth.login.forgotPassword')}
            </AppText>
          </Pressable>
        </View>

        <Button label={t('auth.login.submit')} onPress={handleLogin} loading={loading} style={styles.loginButton} />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <AppText variant="small">{t('auth.orContinueWith')}</AppText>
          <View style={styles.dividerLine} />
        </View>

        {/* Google sign-in needs an OAuth client set up in Firebase/Google Cloud
            Console first (see chat notes) — not wired to real auth yet, so this
            just says so instead of silently faking a login. */}
        <SocialButton
          label={t('auth.continueWithGoogle')}
          onPress={() => Alert.alert(t('common.comingSoon'), t('auth.googleNotReady'))}
        />
      </Animated.View>

      <View style={styles.footer}>
        <AppText variant="body" color={Colors.textSecondary}>
          {t('auth.login.newHere')}{' '}
        </AppText>
        <Link href="/register" replace>
          <AppText variant="bodyMedium" color={Colors.primary}>
            {t('auth.login.createAccount')}
          </AppText>
        </Link>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  languageRow: { alignItems: 'flex-end', paddingTop: Spacing.sm },
  header: { alignItems: 'center', paddingTop: Spacing.lg, paddingBottom: Spacing.xxxl, gap: Spacing.sm },
  headerTitle: { marginTop: Spacing.sm },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  loginButton: { marginBottom: Spacing.xxl },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xxl },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
});
