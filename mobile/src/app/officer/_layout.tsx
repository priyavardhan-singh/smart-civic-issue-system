import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function OfficerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: '#1d4ed8',
        tabBarInactiveTintColor: '#6b7280',

        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          backgroundColor: '#ffffff',
        },

        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',

          tabBarIcon: ({ color }) => (
            <Text
              style={{
                color,
                fontSize: 24,
              }}
            >
              📋
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',

          tabBarIcon: ({ color }) => (
            <Text
              style={{
                color,
                fontSize: 24,
              }}
            >
              👤
            </Text>
          ),
        }}
      />

      <Tabs.Screen
  name="report/[id]"
  options={{
    href: null,
  }}
/>
    </Tabs>
  );
}