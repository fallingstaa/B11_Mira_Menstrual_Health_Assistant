import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { AppText } from '@/components/mira/app-text';
import { Button } from '@/components/mira/button';
import { MascotMini } from '@/components/mira/mascot';
import { ScreenContainer } from '@/components/mira/screen-container';
import { SocialButton } from '@/components/mira/social-button';
import { TextField } from '@/components/mira/text-field';
import { Colors, Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { useAuth } from '@/context/auth-context';

const MIN_AGE = 9;
const MAX_AGE = 100;

function registerErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code;
  // AUTH-011: checked first, and matched before 'auth/invalid-email' below — a genuinely
  // duplicate email is a distinct Firebase error code from a malformed one, never both at once,
  // so this can't fall through to the "looks off" message for a real duplicate.
  if (code === 'auth/email-already-in-use') return 'This email is already registered. Please log in instead.';
  if (code === 'auth/invalid-email') return 'That email address looks off — check for a typo.';
  if (code === 'auth/weak-password') return 'Password must be at least 8 characters.';
  return 'Something went wrong creating your account. Please try again.';
}

export default function RegisterScreen() {
  const { register } = useAuth();
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
      setError('Please fill in all fields.');
      return;
    }
    const parsedAge = parseInt(age, 10);
    if (Number.isNaN(parsedAge) || parsedAge < MIN_AGE || parsedAge > MAX_AGE) {
      setError(`Please enter a valid age between ${MIN_AGE} and ${MAX_AGE}.`);
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords don\'t match.');
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
      <Animated.View entering={FadeInDown.duration(450)} style={styles.header}>
        <MascotMini size={44} />
        <AppText variant="h1" style={styles.headerTitle}>
          Create your account
        </AppText>
        <AppText variant="body" color={Colors.textSecondary} center>
          A safe, private space just for you.
        </AppText>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(450).delay(120)}>
        <TextField label="Name" icon="person-outline" placeholder="What should we call you?" value={name} onChangeText={setName} />
        <TextField
          label="Age"
          icon="gift-outline"
          placeholder="How old are you?"
          keyboardType="number-pad"
          maxLength={3}
          value={age}
          onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
        />
        <TextField
          label="Email"
          icon="mail-outline"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label="Password"
          icon="lock-closed-outline"
          placeholder="At least 8 characters"
          isPassword
          value={password}
          onChangeText={setPassword}
        />
        <TextField
          label="Confirm password"
          icon="lock-closed-outline"
          placeholder="Re-enter password"
          isPassword
          value={confirm}
          onChangeText={setConfirm}
          error={error}
        />

        <AppText variant="small" color={Colors.textMuted} style={styles.terms}>
          By continuing, you agree to Mira&apos;s Terms of Service and Privacy Policy. Your data always stays private.
        </AppText>

        <Button label="Create Account" onPress={handleRegister} loading={loading} style={styles.registerButton} />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <AppText variant="small">or continue with</AppText>
          <View style={styles.dividerLine} />
        </View>

        {/* Google sign-in needs an OAuth client set up in Firebase/Google Cloud
            Console first — not wired to real auth yet. */}
        <SocialButton
          label="Continue with Google"
          onPress={() => Alert.alert('Coming soon', 'Google sign-in isn\'t set up yet — create an account with email for now.')}
        />
      </Animated.View>

      <View style={styles.footer}>
        <AppText variant="body" color={Colors.textSecondary}>
          Already have an account?{' '}
        </AppText>
        <Link href="/login" replace>
          <AppText variant="bodyMedium" color={Colors.primary}>
            Log in
          </AppText>
        </Link>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingTop: Spacing.xxl, paddingBottom: Spacing.xxl, gap: Spacing.sm },
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
