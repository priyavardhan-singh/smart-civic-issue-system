import { useEffect, useRef } from 'react';
import {
  Stack,
  router,
  useRootNavigationState,
} from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function RootLayout() {
  const rootNavigationState =
    useRootNavigationState();

  const hasCheckedRole =
    useRef(false);

  useEffect(() => {
    // Wait until Expo Router is ready.
    if (!rootNavigationState?.key) {
      return;
    }

    // Check saved login only once
    // when the app starts.
    if (hasCheckedRole.current) {
      return;
    }

    hasCheckedRole.current = true;

    const restoreUserRoute = async () => {
      try {
        const token =
          await SecureStore.getItemAsync(
            'access_token'
          );

        const storedUser =
          await SecureStore.getItemAsync(
            'user'
          );

        // No logged-in user.
        if (!token || !storedUser) {
          return;
        }

        const user =
          JSON.parse(storedUser);

        console.log(
          'Restored user role:',
          user.role
        );

        if (user.role === 'officer') {
          router.replace('/officer');
          return;
        }

        if (user.role === 'admin') {
          router.replace('/admin');
          return;
        }

        // Citizen stays in normal citizen tabs.
      } catch (error) {
        console.log(
          'Role restore error:',
          error
        );
      }
    };

    restoreUserRoute();
  }, [rootNavigationState?.key]);

  return (
    <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="login"
        options={{
          title: 'Login',
        }}
      />

      <Stack.Screen
        name="register"
        options={{
          title: 'Register',
        }}
      />

      <Stack.Screen
        name="admin"
        options={{
          title: 'Admin Dashboard',
          headerBackVisible: false,
        }}
      />

      <Stack.Screen
        name="officer"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}