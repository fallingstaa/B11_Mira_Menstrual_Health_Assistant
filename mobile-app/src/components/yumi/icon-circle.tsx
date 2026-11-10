import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';

type Props = {
  children: ReactNode;
  color: string;
  size?: number;
};

/** Circular tinted background behind an icon/emoji — used for quick actions, nav, list rows. */
export function IconCircle({ children, color, size = 44 }: Props) {
  return (
    <View
      style={[
        styles.circle,
        { backgroundColor: color, width: size, height: size, borderRadius: size },
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
});
