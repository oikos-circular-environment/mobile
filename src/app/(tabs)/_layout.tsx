import { Tabs } from 'expo-router';
import React from 'react';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BookOpenIcon, CoinsIcon, EarthIcon, ShieldUserIcon, SproutIcon } from 'lucide-react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  console.log('colorScheme', colorScheme);
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors['light'].tint,
        headerShown: false,
        // tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="market"
        options={{
          title: 'Mercado',
          tabBarIcon: ({ color }) => <CoinsIcon size={22}  color={color} />,
        }}
      />
      <Tabs.Screen
        name="complaints"
        options={{
          title: 'Denunciar',
          tabBarIcon: ({ color }) => <ShieldUserIcon size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <SproutIcon  size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="donations"
        options={{
          title: 'Doações',
          tabBarIcon: ({ color }) => <EarthIcon size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Aprender',
          tabBarIcon: ({ color }) => <BookOpenIcon size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
