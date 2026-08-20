import { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { TAB_BAR_CLEARANCE } from '@/components/mira/bottom-nav';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: ViewStyle;
  style?: ViewStyle;
  footer?: ReactNode;
  /**
   * Set true on screens that live inside the floating bottom tab bar (Home, Calendar,
   * Education, Profile) — adds enough extra bottom padding for the last item to actually clear
   * it, not just sit visibly above it. Without this, content in that gap isn't merely covered —
   * it's unreachable, because the tab bar's own rounded rect (not just its buttons) still
   * intercepts touches. Screens pushed on top of the tab navigator (record, checkin, prediction,
   * etc.) don't need it — the tab bar isn't rendered at all there.
   */
  tabBar?: boolean;
};

/** Standard full-screen wrapper: safe area, optional scroll, web-friendly centered max width. */
export function ScreenContainer({
  children,
  scroll = true,
  edges = ['top', 'left', 'right'],
  contentStyle,
  style,
  footer,
  tabBar = false,
}: Props) {
  return (
    <SafeAreaView style={[styles.safe, style]} edges={edges}>
      <View style={styles.centerer}>
        {scroll ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, tabBar && styles.scrollContentTabBar, contentStyle]}>
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flexContent, tabBar && styles.flexContentTabBar, contentStyle]}>{children}</View>
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
  scrollContentTabBar: { paddingBottom: Spacing.huge + TAB_BAR_CLEARANCE },
  flexContent: { flex: 1, paddingHorizontal: Spacing.xxl },
  flexContentTabBar: { paddingBottom: TAB_BAR_CLEARANCE },
  footer: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? MaxContentWidth : undefined,
    alignSelf: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
});
