import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  router,
  useFocusEffect,
} from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type Report = {
  _id: string;
  category: string;
  description: string;
  address: string;
  status: string;
  created_at?: string;
};

export default function MyReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchMyReports();
    }, [])
  );

  const fetchMyReports = async () => {
    setErrorMessage('');
    setIsLoading(true);

    try {
      const token =
        await SecureStore.getItemAsync(
          'access_token'
        );

      if (!token) {
        setIsLoggedIn(false);
        setReports([]);
        return;
      }

      setIsLoggedIn(true);

      const response = await fetch(
        `${API_URL}/my-reports`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        await SecureStore.deleteItemAsync(
          'access_token'
        );

        await SecureStore.deleteItemAsync(
          'user'
        );

        setIsLoggedIn(false);
        setReports([]);
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Unable to load reports.'
        );
      }

      setReports(data);
    } catch (error) {
      console.log(
        'My reports error:',
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load your reports.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatCategory = (
    category: string
  ) => {
    const categories: Record<
      string,
      string
    > = {
      road: 'Road Damage / Pothole',
      streetlight: 'Streetlight Problem',
      garbage: 'Garbage / Waste',
      water: 'Water / Drainage',
      sewage: 'Sewage Problem',
      other: 'Other',
    };

    return categories[category] || category;
  };

  const formatStatus = (
    status: string
  ) => {
    if (!status) {
      return 'Unknown';
    }

    return status
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
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

  const shortText = (
    text: string,
    limit = 90
  ) => {
    if (text.length <= limit) {
      return text;
    }

    return `${text.slice(
      0,
      limit
    )}...`;
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading your reports...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={
        styles.container
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          My Reports
        </Text>

        <Text style={styles.subtitle}>
          Track the civic issues you have
          reported.
        </Text>
      </View>

      {!isLoggedIn && (
        <View style={styles.loginContainer}>
          <Text style={styles.loginTitle}>
            Login to view your reports
          </Text>

          <Text style={styles.loginText}>
            Your reported civic issues are
            linked to your Smart Civic account.
          </Text>

          <Pressable
            style={styles.loginButton}
            onPress={() =>
              router.push('/login')
            }
          >
            <Text
              style={
                styles.loginButtonText
              }
            >
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
        </View>
      )}

      {isLoggedIn && (
        <>
          {errorMessage ? (
            <View
              style={
                styles.errorContainer
              }
            >
              <Text
                style={styles.errorText}
              >
                {errorMessage}
              </Text>

              <Pressable
                style={styles.retryButton}
                onPress={fetchMyReports}
              >
                <Text
                  style={
                    styles.retryButtonText
                  }
                >
                  Try Again
                </Text>
              </Pressable>
            </View>
          ) : null}

          {!errorMessage &&
            reports.length === 0 && (
              <View
                style={
                  styles.emptyContainer
                }
              >
                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  No reports yet
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  You have not submitted any
                  civic issues yet.
                </Text>

                <Pressable
                  style={
                    styles.reportButton
                  }
                  onPress={() =>
                    router.push('/report')
                  }
                >
                  <Text
                    style={
                      styles.reportButtonText
                    }
                  >
                    Report an Issue
                  </Text>
                </Pressable>
              </View>
            )}

          {reports.map((report) => (
            <View
              key={report._id}
              style={styles.card}
            >
              <View
                style={
                  styles.cardHeader
                }
              >
                <Text
                  style={
                    styles.category
                  }
                >
                  {formatCategory(
                    report.category
                  )}
                </Text>

                <View
                  style={
                    styles.statusBadge
                  }
                >
                  <Text
                    style={
                      styles.statusText
                    }
                  >
                    {formatStatus(
                      report.status
                    )}
                  </Text>
                </View>
              </View>

              <Text
                style={
                  styles.description
                }
              >
                {shortText(
                  report.description
                )}
              </Text>

              <Text
                style={styles.info}
                numberOfLines={2}
              >
                Address:{' '}
                {report.address ||
                  'Address unavailable'}
              </Text>

              {report.created_at ? (
                <Text
                  style={styles.info}
                >
                  Reported:{' '}
                  {formatDate(
                    report.created_at
                  )}
                </Text>
              ) : null}

              <Pressable
                style={
                  styles.viewButton
                }
                onPress={() =>
                  router.push(
                    `/my-report/${report._id}`
                  )
                }
              >
                <Text
                  style={
                    styles.viewButtonText
                  }
                >
                  View Complete Report
                </Text>
              </Pressable>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },

  container: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 40,
  },

  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },

  loadingText: {
    marginTop: 12,
    color: '#6b7280',
  },

  header: {
    marginBottom: 20,
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

  loginContainer: {
    marginTop: 20,
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  loginTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  loginText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#6b7280',
  },

  loginButton: {
    marginTop: 20,
    minHeight: 50,
    borderRadius: 9,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loginButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },

  registerButton: {
    marginTop: 10,
    minHeight: 50,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#1d4ed8',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  registerButtonText: {
    color: '#1d4ed8',
    fontWeight: '700',
  },

  errorContainer: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
  },

  errorText: {
    color: '#b91c1c',
  },

  retryButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#b91c1c',
  },

  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },

  emptyContainer: {
    marginTop: 20,
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#6b7280',
  },

  reportButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 9,
    backgroundColor: '#1d4ed8',
  },

  reportButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },

  card: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  category: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignSelf: 'flex-start',
  },

  statusText: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '700',
  },

  description: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },

  info: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 18,
    color: '#6b7280',
  },

  viewButton: {
    marginTop: 14,
    minHeight: 46,
    borderRadius: 9,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  viewButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
