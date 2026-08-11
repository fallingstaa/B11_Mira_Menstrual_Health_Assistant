import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppText } from '@/components/mira/app-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

/** Google "G" mark, inline so the app has zero external icon-font dependency for it. */
function GoogleMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.6,20.5H42V20.5H24v7h11.3c-1.6,4.6-6,7.9-11.3,7.9c-6.6,0-12-5.4-12-12s5.4-12,12-12c3.1,0,5.9,1.2,8,3.1l5.7-5.7C34.5,5.7,29.5,3.5,24,3.5c-11.3,0-20.5,9.2-20.5,20.5S12.7,44.5,24,44.5S44.5,35.3,44.5,24C44.5,22.8,44.4,21.6,43.6,20.5z"
      />
      <Path
        fill="#FF3D00"
        d="M6.3,14.7l5.7,4.2C13.6,15.1,18.4,12,24,12c3.1,0,5.9,1.2,8,3.1l5.7-5.7C34.5,5.7,29.5,3.5,24,3.5C16.3,3.5,9.6,7.9,6.3,14.7z"
      />
      <Path
        fill="#4CAF50"
        d="M24,44.5c5.4,0,10.3-2.1,14-5.4l-6.5-5.5c-2,1.4-4.6,2.4-7.5,2.4c-5.3,0-9.7-3.3-11.3-7.9l-6.6,5.1C9.5,40,16.2,44.5,24,44.5z"
      />
      <Path
        fill="#1976D2"
        d="M43.6,20.5H42V20.5H24v7h11.3c-0.8,2.2-2.2,4.1-4,5.5l6.5,5.5c-0.5,0.4,6.7-4.9,6.7-14.5C44.5,22.8,44.4,21.6,43.6,20.5z"
      />
    </Svg>
  );
}

export function SocialButton({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <View style={styles.iconWrap}>
        <GoogleMark />
      </View>
      <AppText variant="bodyMedium">{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  iconWrap: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
});
