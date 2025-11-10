import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import 'react-native-reanimated';

import SplashOverlay from '@/components/SplashOverlay';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/providers/AuthProvider';

export default function RootLayout(): React.ReactElement | null {
  const colorScheme = useColorScheme();
  const [loadedAll] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    MagnoliaScript: require('../assets/fonts/Magnolia Script.otf'),
  });

  // Always render AuthProvider so child routes can use auth context.

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {!loadedAll ? (
          // While fonts are loading, show only the splash route inside the app stack.
          <Stack initialRouteName="splash" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="splash" />
          </Stack>
        ) : (
          <Stack
            initialRouteName="splash"
            screenOptions={{
              headerShown: false,
              animation: 'fade',
            }}>
            <Stack.Screen name="splash" />
            {/* ensure splash is the initial route when the full stack is rendered */}
            {/* initialRouteName is set here too to be explicit */}
            {/* Note: expo-router maps route names to files in the app/ folder (app/splash.tsx) */}
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
          </Stack>
        )}

    <StatusBar style="auto" />

    {/* React splash overlay (shows our custom SVG overlay and hides native splash) */}
    <SplashOverlay />
      </ThemeProvider>
    </AuthProvider>
  );
}
