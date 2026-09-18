import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type Report = {
  _id: string;
  category: string;
  description: string;
  address?: string;
  status: string;
  created_at?: string;
};

export default function OfficerScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    checkOfficerAndLoadReports();
  }, []);

  const checkOfficerAndLoadReports = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const storedUser = await SecureStore.getItemAsync('user');

      if (!token || !storedUser) {
        router.replace('/login');
        return;
      }

      const user = JSON.parse(storedUser);

      if (user.role !== 'officer') {
        router.replace('/');
        return;
      }

      await fetchReports();
    } catch (error) {
      console.log('Officer auth check error:', error);
      router.replace('/login');
    }
  };

  const fetchReports = async () => {
    setErrorMessage('');

    try {
      const token = await SecureStore.getItemAsync('access_token');

      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch(`${API_URL}/officer/reports`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401) {
        await handleLogout();
        return;
      }

      if (response.status === 403) {
        router.replace('/');
        return;
      }

      if (!response.ok) {
        throw new Error(data.detail || 'Unable to load assigned reports.');
      }

      setReports(data);
    } catch (error) {
      console.log('Officer reports error:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load assigned reports.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchReports();
  }, []);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('user');
    router.replace('/login');
  };

  const formatStatus = (status: string) =>
    status
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const formatCategory = (category: string) => {
    const categories: Record<string, string> = {
      road: 'Road Damage / Pothole',
      streetlight: 'Streetlight Problem',
      garbage: 'Garbage / Waste',
      water: 'Water / Drainage',
      sewage: 'Sewage Problem',
      other: 'Other',
    };

    return categories[category] || category;
  };

  const formatDate = (
  value?: string
) => {
  if (!value) {
    return '';
  }

  const hasTimezone =
    /Z$|[+-]\d{2}:\d{2}$/.test(value);

  const normalizedValue =
    hasTimezone
      ? value
      : `${value}Z`;

  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(
    'en-IN',
    {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }
  );
};

  const shortText = (text: string, limit = 90) => {
    if (text.length <= limit) return text;
    return `${text.slice(0, limit)}...`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading assigned reports...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Officer Dashboard</Text>
          <Text style={styles.subtitle}>Manage reports assigned to you.</Text>
        </View>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      {errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable style={styles.retryButton} onPress={fetchReports}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      ) : null}

      {!errorMessage && reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Assigned Reports</Text>
          <Text style={styles.emptyText}>
            Reports assigned to you will appear here.
          </Text>
        </View>
      ) : null}

      {reports.map((report) => (
        <View key={report._id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.category}>
              {formatCategory(report.category)}
            </Text>

            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {formatStatus(report.status)}
              </Text>
            </View>
          </View>

          <Text style={styles.description}>
            {shortText(report.description)}
          </Text>

          <Text style={styles.info} numberOfLines={2}>
            Address: {report.address || 'Address unavailable'}
          </Text>

          {report.created_at ? (
            <Text style={styles.info}>
              Reported: {formatDate(report.created_at)}
            </Text>
          ) : null}

          <Pressable
            style={styles.viewButton}
            onPress={() =>
              router.push({
                pathname: '/officer/report/[id]',
                params: { id: report._id },
              })
            }
          >
            <Text style={styles.viewButtonText}>View Complete Report</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  container: { padding: 18, paddingBottom: 50 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: { marginTop: 12, color: '#6b7280' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#111827' },
  subtitle: { marginTop: 6, fontSize: 14, color: '#6b7280' },
  logoutButton: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#b91c1c',
  },
  logoutText: { color: '#ffffff', fontWeight: '700' },
  errorContainer: {
    marginBottom: 18,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
  },
  errorText: { color: '#b91c1c' },
  retryButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#b91c1c',
  },
  retryText: { color: '#ffffff', fontWeight: '600' },
  emptyContainer: {
    padding: 28,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 19, fontWeight: '700', color: '#111827' },
  emptyText: { marginTop: 8, textAlign: 'center', color: '#6b7280' },
  card: {
    marginBottom: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  category: { flex: 1, fontSize: 17, fontWeight: '700', color: '#111827' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignSelf: 'flex-start',
  },
  statusText: { fontSize: 12, fontWeight: '700', color: '#1d4ed8' },
  description: { marginTop: 10, fontSize: 14, lineHeight: 20, color: '#374151' },
  info: { marginTop: 7, fontSize: 13, lineHeight: 18, color: '#6b7280' },
  viewButton: {
    marginTop: 14,
    minHeight: 46,
    borderRadius: 9,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonText: { color: '#ffffff', fontWeight: '700' },
});
