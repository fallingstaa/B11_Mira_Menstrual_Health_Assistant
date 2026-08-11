import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { AppText } from '@/components/mira/app-text';
import { Button } from '@/components/mira/button';
import { MascotMini } from '@/components/mira/mascot';
import { ScreenContainer } from '@/components/mira/screen-container';
import { SocialButton } from '@/components/mira/social-button';
import { TextField } from '@/components/mira/text-field';
import { Colors, Spacing } from '@/constants/theme';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

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
          label="Email"
          icon="mail-outline"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextField label="Password" icon="lock-closed-outline" placeholder="At least 8 characters" isPassword value={password} onChangeText={setPassword} />
        <TextField label="Confirm password" icon="lock-closed-outline" placeholder="Re-enter password" isPassword value={confirm} onChangeText={setConfirm} />

        <AppText variant="small" color={Colors.textMuted} style={styles.terms}>
          By continuing, you agree to Mira&apos;s Terms of Service and Privacy Policy. Your data always stays private.
        </AppText>

        <Button label="Create Account" onPress={() => router.replace('/(tabs)/home')} style={styles.registerButton} />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <AppText variant="small">or continue with</AppText>
          <View style={styles.dividerLine} />
        </View>

        <SocialButton label="Continue with Google" onPress={() => router.replace('/(tabs)/home')} />
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
