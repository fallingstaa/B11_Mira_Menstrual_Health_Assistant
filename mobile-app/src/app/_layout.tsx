import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DevNotificationTester } from '@/components/DevNotificationTester';
import { Colors, FontsToLoad } from '@/constants/theme';
import { AppStateProvider } from '@/context/app-state';
import { Snowfall } from '@/components/yumi/christmas/snowfall';
import { AuthProvider } from '@/context/auth-context';
import { SeasonalThemeProvider } from '@/context/seasonal-theme';
import { loadSavedLanguage } from '@/i18n';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FontsToLoad);
  const [languageReady, setLanguageReady] = useState(false);

  useEffect(() => {
    loadSavedLanguage().finally(() => setLanguageReady(true));
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && languageReady) {
      // The Yumi splash route takes over from here with its own animated mascot.
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, languageReady]);

  // Waiting on the saved language too, so a Khmer user never sees a flash of English first.
  if ((!fontsLoaded && !fontError) || !languageReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SeasonalThemeProvider>
        <AuthProvider>
          <AppStateProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background },
                animation: 'slide_from_right',
              }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="login" options={{ animation: 'fade' }} />
              <Stack.Screen name="register" />
              <Stack.Screen name="verify-email" />
              <Stack.Screen name="cycle-basics" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
              <Stack.Screen name="forgot-password" />
              <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
              <Stack.Screen name="record" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
              <Stack.Screen name="record-first-period" />
              <Stack.Screen name="checkin" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
              <Stack.Screen name="prediction" />
              <Stack.Screen name="notifications" />
              <Stack.Screen name="checkin-history" />
              <Stack.Screen name="education/[topicId]" />
              <Stack.Screen name="share-card" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            </Stack>
            <DevNotificationTester />
            <Snowfall />
          </AppStateProvider>
        </AuthProvider>
        </SeasonalThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
