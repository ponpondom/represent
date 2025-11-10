import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, Text } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/providers/AuthProvider';

export default function TabLayout(): React.ReactElement | null {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect unauthenticated users to the login screen
      router.replace('/login');
    }
  }, [loading, user, router]);

  // While restoring auth state or redirecting, render nothing (or return a loader view)
  if (loading || !user) return null;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Headquarters',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, fontWeight: 'bold', color }}>HQ</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'My Reps',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="building.columns.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'VoterID',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
