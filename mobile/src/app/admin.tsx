import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function AdminScreen() {
  const handleLogout = async () => {
    await SecureStore.deleteItemAsync(
      'access_token'
    );

    await SecureStore.deleteItemAsync(
      'user'
    );

    router.replace('/login');
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={
        styles.container
      }
    >
      <Text style={styles.title}>
        Admin Dashboard
      </Text>

      <Text style={styles.subtitle}>
        Manage civic reports,
        departments and officers.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Reports
        </Text>

        <Text style={styles.cardText}>
          View, search, filter and assign
          citizen reports.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Departments & Officers
        </Text>

        <Text style={styles.cardText}>
          Manage departments and officer
          accounts.
        </Text>
      </View>

      <Pressable
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>
          Logout
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    fontSize: 15,
    lineHeight: 22,
    color: '#6b7280',
  },

  card: {
    marginBottom: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  cardText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#6b7280',
  },

  logoutButton: {
    marginTop: 20,
    minHeight: 52,
    borderRadius: 10,
    backgroundColor: '#b91c1c',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});