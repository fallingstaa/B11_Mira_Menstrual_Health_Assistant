import * as Notifications from 'expo-notifications';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DEV_TITLE = '[TEST] Mira';
const FIRE_DELAY_SECONDS = 3;

/**
 * PAUSED (2026-08-20): flipped to `false` on request — the floating panel was getting
 * in the way of normal testing. Component, buttons, and firing logic below are all
 * untouched; flip back to `true` any time to bring the panel back.
 */
const IS_TESTER_ENABLED = false;

type TestButton = { key: string; label: string; body: string };

/**
 * Same 10 bodies as the production queue in utils/notifications.ts, copied here as plain
 * strings rather than imported — deliberate, per the separation rule: this file must never
 * import from, call into, or otherwise risk altering that module. If the real copy changes,
 * these need updating by hand too.
 */
const TEST_BUTTONS: TestButton[] = [
  { key: 'confirm', label: 'Test #1: Log Confirmed', body: "Dates logged! We recalculated your cycle timeline so you don't have to." },
  { key: 'midcycle', label: 'Test #2: Mid-Cycle', body: 'Mid-cycle check-in. Time to see how your body is feeling today.' },
  { key: 'prepms', label: 'Test #3: Pre-PMS', body: 'One week out from your period. Low energy or mood shifts? Completely normal.' },
  { key: 'prep', label: 'Test #4: Prep Alert', body: 'Heads up: Your period is due in 2 days. Restock your bag real quick.' },
  { key: 'dayof', label: 'Test #5: Day-Of Check', body: 'Is your period here today? Tap to log it real quick.' },
  { key: 'late1', label: 'Test #6: Late #1 (+3d)', body: "Cycles do their own thing sometimes. Log it whenever you're ready, no stress." },
  { key: 'late2', label: 'Test #7: Late #2 (+5d)', body: 'Still waiting on your period? It happens. Update your dates when it pulls up.' },
  { key: 'late3', label: 'Test #8: Late #3 (+7d)', body: 'Quick cycle vibe check. Tap here so we can keep your predictions accurate.' },
  { key: 'late4', label: 'Test #9: Late #4 (+10d)', body: "We paused your predictions for now! Tap to log your start date whenever you're ready." },
  { key: 'late5', label: 'Test #10: Late #5 (+14d)', body: 'Still waiting or missed a log? Drop your dates in the app to get your timeline back on track.' },
];

async function ensurePermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  if (status === 'denied') return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

async function fireTestNotification(body: string) {
  const granted = await ensurePermission();
  if (!granted) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: DEV_TITLE, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: FIRE_DELAY_SECONDS },
  });
}

/**
 * Dev-only floating panel that fires each of the 10 production notification bodies directly,
 * `FIRE_DELAY_SECONDS` out, completely independent of any real prediction/log state — so every
 * message can be eyeballed on a real device in seconds instead of waiting on real cycle math.
 * Purely a manual-testing convenience sitting *alongside* utils/notifications.ts, not a stand-in
 * for it — the real 10-alert queue and its schedule/cancel rules live there, untouched.
 *
 * Mounted once at the root layout; the `__DEV__` guard is what actually keeps it out of
 * production builds (React Native strips `__DEV__`-guarded branches at bundle time), so it's
 * safe to render unconditionally from the layout itself.
 */
export function DevNotificationTester() {
  const insets = useSafeAreaInsets();
  const [collapsed, setCollapsed] = useState(true);

  if (!__DEV__ || !IS_TESTER_ENABLED) return null;

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom }]} pointerEvents="box-none">
      <Pressable onPress={() => setCollapsed((c) => !c)} style={styles.header}>
        <Text style={styles.headerText}>DEV · NOTIF TESTER</Text>
        <Text style={styles.chevron}>{collapsed ? 'show' : 'hide'}</Text>
      </Pressable>

      {!collapsed && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {TEST_BUTTONS.map((btn) => (
            <Pressable key={btn.key} onPress={() => fireTestNotification(btn.body)} style={styles.button}>
              <Text style={styles.buttonText}>{btn.label}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => Notifications.cancelAllScheduledNotificationsAsync()}
            style={[styles.button, styles.cancelButton]}>
            <Text style={styles.buttonText}>Cancel All Scheduled</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1E1E2C',
    zIndex: 9999,
    elevation: 9999,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerText: {
    color: '#8A8AA3',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  chevron: {
    color: '#2FE6A5',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  row: {
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  button: {
    backgroundColor: '#2FE6A5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#1E1E2C',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#FF4D6D',
  },
});
