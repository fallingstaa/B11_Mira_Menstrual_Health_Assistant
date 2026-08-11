import { Tabs } from 'expo-router/tabs';

import { BottomNav } from '@/components/mira/bottom-nav';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="education" />
      <Tabs.Screen name="assistant" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
