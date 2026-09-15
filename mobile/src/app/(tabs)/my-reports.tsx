import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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

const API_URL = 'http://192.168.29.11:8000';

type ActivityItem = {
  type: string;
  message?: string;
  created_at?: string;
};

type Report = {
  _id: string;
  user_id: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  photo_url?: string;
  status: string;
  created_at?: string;
  assigned_at?: string;
  assigned_to?: string;
  department?: string;
  work_started_at?: string;
  resolved_at?: string;
  resolution_remarks?: string;
  resolution_photo_url?: string;
  activity_history?: ActivityItem[];
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
            Authorization: `Bearer ${token}`,
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

    return new Date(
      value
    ).toLocaleString();
  };

  const getActivityHistory = (
    report: Report
  ): ActivityItem[] => {
    if (
      Array.isArray(
        report.activity_history
      ) &&
      report.activity_history.length > 0
    ) {
      return [
        ...report.activity_history,
      ].sort((a, b) => {
        const first =
          a.created_at
            ? new Date(
                a.created_at
              ).getTime()
            : 0;

        const second =
          b.created_at
            ? new Date(
                b.created_at
              ).getTime()
            : 0;

        return first - second;
      });
    }

    const fallback: ActivityItem[] = [];

    if (report.created_at) {
      fallback.push({
        type: 'reported',
        message:
          'Report submitted successfully',
        created_at:
          report.created_at,
      });
    }

    if (report.assigned_at) {
      fallback.push({
        type: 'assigned',
        message:
          report.assigned_to
            ? `Report assigned to ${report.assigned_to}`
            : 'Report assigned to an officer',
        created_at:
          report.assigned_at,
      });
    }

    if (report.work_started_at) {
      fallback.push({
        type: 'in_progress',
        message:
          'Officer started working on the report',
        created_at:
          report.work_started_at,
      });
    }

    if (report.resolved_at) {
      fallback.push({
        type: 'resolved',
        message:
          'Issue resolved with officer proof',
        created_at:
          report.resolved_at,
      });
    }

    return fallback;
  };

  const getActivityCircleStyle = (
    type: string
  ) => {
    if (type === 'resolved') {
      return styles.activityCircleResolved;
    }

    if (type === 'in_progress') {
      return styles.activityCircleProgress;
    }

    if (type === 'assigned') {
      return styles.activityCircleAssigned;
    }

    return styles.activityCircleReported;
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

      {/* LOGGED OUT */}
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

      {/* LOGGED IN */}
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

          {reports.map((report) => {
            const activityHistory =
              getActivityHistory(
                report
              );

            return (
              <View
                key={report._id}
                style={styles.card}
              >
                {report.photo_url ? (
                  <Image
                    source={{
                      uri: `${API_URL}${report.photo_url}`,
                    }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                ) : null}

                <View
                  style={
                    styles.cardContent
                  }
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
                    {report.description}
                  </Text>

                  <Text
                    style={styles.info}
                  >
                    Address:{' '}
                    {report.address ||
                      'Address unavailable'}
                  </Text>

                  <Text
                    style={styles.info}
                  >
                    Report ID:{' '}
                    {report._id}
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

                  {/* ACTIVITY TIMELINE */}
                  {activityHistory.length > 0 ? (
                    <View
                      style={
                        styles.timelineSection
                      }
                    >
                      <Text
                        style={
                          styles.sectionTitle
                        }
                      >
                        Activity Timeline
                      </Text>

                      <View
                        style={
                          styles.timelineList
                        }
                      >
                        {activityHistory.map(
                          (
                            activity,
                            index
                          ) => {
                            const isLast =
                              index ===
                              activityHistory.length -
                                1;

                            return (
                              <View
                                key={`${activity.type}-${activity.created_at || index}-${index}`}
                                style={
                                  styles.activityRow
                                }
                              >
                                <View
                                  style={
                                    styles.activityMarkerColumn
                                  }
                                >
                                  <View
                                    style={[
                                      styles.activityCircle,
                                      getActivityCircleStyle(
                                        activity.type
                                      ),
                                    ]}
                                  >
                                    <Text
                                      style={
                                        styles.activityCheck
                                      }
                                    >
                                      ✓
                                    </Text>
                                  </View>

                                  {!isLast ? (
                                    <View
                                      style={
                                        styles.activityLine
                                      }
                                    />
                                  ) : null}
                                </View>

                                <View
                                  style={[
                                    styles.activityContent,
                                    !isLast &&
                                      styles.activityContentWithSpacing,
                                  ]}
                                >
                                  <Text
                                    style={
                                      styles.activityMessage
                                    }
                                  >
                                    {activity.message ||
                                      formatStatus(
                                        activity.type
                                      )}
                                  </Text>

                                  {activity.created_at ? (
                                    <Text
                                      style={
                                        styles.activityDate
                                      }
                                    >
                                      {formatDate(
                                        activity.created_at
                                      )}
                                    </Text>
                                  ) : null}
                                </View>
                              </View>
                            );
                          }
                        )}
                      </View>
                    </View>
                  ) : null}

                  {/* RESOLUTION DETAILS */}
                  {report.status ===
                  'resolved' ? (
                    <View
                      style={
                        styles.resolutionContainer
                      }
                    >
                      <Text
                        style={
                          styles.resolutionTitle
                        }
                      >
                        Resolution Details
                      </Text>

                      {report.resolution_photo_url ? (
                        <View
                          style={
                            styles.resolutionBlock
                          }
                        >
                          <Text
                            style={
                              styles.resolutionLabel
                            }
                          >
                            Resolution Proof
                          </Text>

                          <Image
                            source={{
                              uri: `${API_URL}${report.resolution_photo_url}`,
                            }}
                            style={
                              styles.resolutionImage
                            }
                            resizeMode="contain"
                          />
                        </View>
                      ) : null}

                      {report.resolution_remarks ? (
                        <View
                          style={
                            styles.resolutionBlock
                          }
                        >
                          <Text
                            style={
                              styles.resolutionLabel
                            }
                          >
                            Officer Remarks
                          </Text>

                          <Text
                            style={
                              styles.resolutionText
                            }
                          >
                            {
                              report.resolution_remarks
                            }
                          </Text>
                        </View>
                      ) : null}

                      {report.resolved_at ? (
                        <Text
                          style={
                            styles.resolutionDate
                          }
                        >
                          Resolved:{' '}
                          {formatDate(
                            report.resolved_at
                          )}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
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
    marginBottom: 18,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  image: {
    width: '100%',
    height: 210,
    backgroundColor: '#f3f4f6',
  },

  cardContent: {
    padding: 16,
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
  },

  statusText: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '700',
  },

  description: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 21,
    color: '#374151',
  },

  info: {
    marginTop: 9,
    fontSize: 13,
    lineHeight: 19,
    color: '#6b7280',
  },

  timelineSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  timelineList: {
    marginTop: 14,
  },

  activityRow: {
    flexDirection: 'row',
  },

  activityMarkerColumn: {
    width: 34,
    alignItems: 'center',
  },

  activityCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activityCircleReported: {
    backgroundColor: '#374151',
  },

  activityCircleAssigned: {
    backgroundColor: '#d97706',
  },

  activityCircleProgress: {
    backgroundColor: '#2563eb',
  },

  activityCircleResolved: {
    backgroundColor: '#16a34a',
  },

  activityCheck: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },

  activityLine: {
    width: 2,
    flex: 1,
    minHeight: 38,
    backgroundColor: '#d1d5db',
  },

  activityContent: {
    flex: 1,
    paddingLeft: 10,
  },

  activityContentWithSpacing: {
    paddingBottom: 18,
  },

  activityMessage: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#374151',
  },

  activityDate: {
    marginTop: 4,
    fontSize: 12,
    color: '#9ca3af',
  },

  resolutionContainer: {
    marginTop: 20,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
  },

  resolutionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166534',
  },

  resolutionBlock: {
    marginTop: 14,
  },

  resolutionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },

  resolutionImage: {
    width: '100%',
    height: 220,
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },

  resolutionText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },

  resolutionDate: {
    marginTop: 14,
    fontSize: 13,
    color: '#6b7280',
  },
});
