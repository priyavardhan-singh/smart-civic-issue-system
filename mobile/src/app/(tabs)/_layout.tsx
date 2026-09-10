import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="index"
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

        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',

          tabBarIcon: ({ color }) => (
            <Text
              style={{
                color,
                fontSize: 25,
              }}
            >
              🏠
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="report"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="my-reports"
        options={{
          title: 'My Reports',

          tabBarIcon: ({ color }) => (
            <Text
              style={{
                color,
                fontSize: 25,
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
                fontSize: 25,
              }}
            >
              👤
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}