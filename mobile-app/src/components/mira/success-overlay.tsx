import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { AppText } from '@/components/mira/app-text';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';

type Props = { message: string };

/** Full-screen confirmation shown briefly after a successful save. */
export function SuccessOverlay({ message }: Props) {
  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
      <Animated.View entering={ZoomIn.duration(380).springify().damping(14)} style={[styles.card, Shadow.raised]}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={30} color={Colors.textOnPrimary} />
        </View>
        <AppText variant="h3" center style={styles.message}>
          {message}
        </AppText>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.huge,
    alignItems: 'center',
    gap: Spacing.lg,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { maxWidth: 200 },
});
