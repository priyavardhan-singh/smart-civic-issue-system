import { useCallback, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  router,
  useFocusEffect,
} from 'expo-router';
import * as SecureStore from 'expo-secure-store';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function ProfileScreen() {
  const [user, setUser] =
    useState<User | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  // Re-check login state every time Profile opens
  useFocusEffect(
    useCallback(() => {
      const loadUser = async () => {
        setIsLoading(true);

        const token =
          await SecureStore.getItemAsync(
            'access_token'
          );

        const storedUser =
          await SecureStore.getItemAsync(
            'user'
          );

        if (token && storedUser) {
          try {
            setUser(
              JSON.parse(storedUser)
            );
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }

        setIsLoading(false);
      };

      loadUser();
    }, [])
  );

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync(
      'access_token'
    );

    await SecureStore.deleteItemAsync(
      'user'
    );

    setUser(null);

    // App remains public after logout
    router.replace('/');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          Profile
        </Text>

        <Text style={styles.loadingText}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Profile
      </Text>

      {/* LOGGED OUT */}
      {!user ? (
        <>
          <Text style={styles.subtitle}>
            Login or create an account to manage
            your reports and profile.
          </Text>

          <View style={styles.guestCard}>
            <Text style={styles.guestTitle}>
              Welcome to Smart Civic
            </Text>

            <Text style={styles.guestText}>
              Login to submit and track your civic
              reports.
            </Text>
          </View>

          <Pressable
            style={styles.loginButton}
            onPress={() =>
              router.push('/login')
            }
          >
            <Text style={styles.loginButtonText}>
              Login
            </Text>
          </Pressable>

          <Pressable
            style={styles.registerButton}
            onPress={() =>
              router.push('/register')
            }
          >
            <Text
              style={
                styles.registerButtonText
              }
            >
              Create Account
            </Text>
          </Pressable>
        </>
      ) : (
        <>
          {/* LOGGED IN */}

          <Text style={styles.subtitle}>
            Manage your Smart Civic account.
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>
              Name
            </Text>

            <Text style={styles.value}>
              {user.name}
            </Text>

            <Text style={styles.label}>
              Email
            </Text>

            <Text style={styles.value}>
              {user.email}
            </Text>

            <Text style={styles.label}>
              Account Type
            </Text>

            <Text style={styles.value}>
              {user.role === 'citizen'
                ? 'Citizen'
                : user.role}
            </Text>
          </View>

          <Pressable
            style={styles.updateButton}
            onPress={() => {
              // Real Edit Profile screen/API
              // will be connected later.
            }}
          >
            <Text
              style={
                styles.updateButtonText
              }
            >
              Edit Profile
            </Text>
          </Pressable>

          <Pressable
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text
              style={
                styles.logoutButtonText
              }
            >
              Logout
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 20,
    paddingTop: 40,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
  },

  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#6b7280',
  },

  loadingText: {
    marginTop: 20,
    color: '#6b7280',
  },

  guestCard: {
    marginTop: 28,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  guestTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  guestText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#6b7280',
  },

  loginButton: {
    marginTop: 24,
    minHeight: 52,
    borderRadius: 10,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  registerButton: {
    marginTop: 12,
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1d4ed8',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  registerButtonText: {
    color: '#1d4ed8',
    fontSize: 16,
    fontWeight: '700',
  },

  card: {
    marginTop: 28,
    padding: 18,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  label: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },

  value: {
    marginTop: 4,
    fontSize: 16,
    color: '#111827',
  },

  updateButton: {
    marginTop: 24,
    minHeight: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  updateButtonText: {
    color: '#1d4ed8',
    fontSize: 15,
    fontWeight: '700',
  },

  logoutButton: {
    marginTop: 12,
    minHeight: 50,
    borderRadius: 10,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});