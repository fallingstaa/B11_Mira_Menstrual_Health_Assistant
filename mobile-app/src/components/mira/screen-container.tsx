import { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: ViewStyle;
  style?: ViewStyle;
  footer?: ReactNode;
};

/** Standard full-screen wrapper: safe area, optional scroll, web-friendly centered max width. */
export function ScreenContainer({
  children,
  scroll = true,
  edges = ['top', 'left', 'right'],
  contentStyle,
  style,
  footer,
}: Props) {
  return (
    <SafeAreaView style={[styles.safe, style]} edges={edges}>
      <View style={styles.centerer}>
        {scroll ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, contentStyle]}>
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flexContent, contentStyle]}>{children}</View>
        )}
      </View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centerer: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? MaxContentWidth : undefined,
    alignSelf: 'center',
  },
  scrollContent: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.huge },
  flexContent: { flex: 1, paddingHorizontal: Spacing.xxl },
  footer: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? MaxContentWidth : undefined,
    alignSelf: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
});
