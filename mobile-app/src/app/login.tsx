import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { AppText } from '@/components/mira/app-text';
import { Button } from '@/components/mira/button';
import { MascotMini } from '@/components/mira/mascot';
import { ScreenContainer } from '@/components/mira/screen-container';
import { SocialButton } from '@/components/mira/social-button';
import { TextField } from '@/components/mira/text-field';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

/** Firebase's auth/xxx-yyy error codes turned into copy a first-time user won't be confused by. */
function loginErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code;
  if (code === 'auth/invalid-email') return 'That email address looks off — check for a typo.';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Email or password is incorrect.';
  }
  if (code === 'auth/too-many-requests') return 'Too many attempts — try again in a moment.';
  return 'Something went wrong logging in. Please try again.';
}

export default function LoginScreen() {
  const { login } = useAuth();
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
      router.replace('/(tabs)/home');
    } catch (err) {
      setError(loginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Animated.View entering={FadeInDown.duration(450)} style={styles.header}>
        <MascotMini size={44} />
        <AppText variant="h1" style={styles.headerTitle}>
          Welcome back
        </AppText>
        <AppText variant="body" color={Colors.textSecondary}>
          Log in to keep up with your cycle.
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
        />
        <TextField
          label="Password"
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
              Remember me
            </AppText>
          </Pressable>
          <Pressable hitSlop={6} onPress={() => router.push('/forgot-password')}>
            <AppText variant="small" color={Colors.primary}>
              Forgot password?
            </AppText>
          </Pressable>
        </View>

        <Button label="Log In" onPress={handleLogin} loading={loading} style={styles.loginButton} />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <AppText variant="small">or continue with</AppText>
          <View style={styles.dividerLine} />
        </View>

        {/* Google sign-in needs an OAuth client set up in Firebase/Google Cloud
            Console first (see chat notes) — not wired to real auth yet, so this
            just says so instead of silently faking a login. */}
        <SocialButton
          label="Continue with Google"
          onPress={() => Alert.alert('Coming soon', 'Google sign-in isn\'t set up yet — log in with email for now.')}
        />
      </Animated.View>

      <View style={styles.footer}>
        <AppText variant="body" color={Colors.textSecondary}>
          New to Mira?{' '}
        </AppText>
        <Link href="/register" replace>
          <AppText variant="bodyMedium" color={Colors.primary}>
            Create an account
          </AppText>
        </Link>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingTop: Spacing.xxl, paddingBottom: Spacing.xxxl, gap: Spacing.sm },
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
