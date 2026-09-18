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
  useLocalSearchParams,
} from 'expo-router';
import {
  useCallback,
  useState,
} from 'react';
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

export default function MyReportDetailsScreen() {
  const { id } =
    useLocalSearchParams<{
      id?: string;
    }>();

  const [report, setReport] =
    useState<Report | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState('');

  useFocusEffect(
    useCallback(() => {
      loadReport();
    }, [id])
  );

  const loadReport = async () => {
    setErrorMessage('');
    setIsLoading(true);

    try {
      const token =
        await SecureStore.getItemAsync(
          'access_token'
        );

      if (!token) {
        router.replace('/login');
        return;
      }

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

        router.replace('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Unable to load report.'
        );
      }

      const selectedReport =
        data.find(
          (item: Report) =>
            item._id === id
        );

      if (!selectedReport) {
        throw new Error(
          'Report not found.'
        );
      }

      setReport(selectedReport);
    } catch (error) {
      console.log(
        'Report details error:',
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load report.'
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

  const getActivityHistory = (
    currentReport: Report
  ): ActivityItem[] => {
    if (
      Array.isArray(
        currentReport.activity_history
      ) &&
      currentReport.activity_history.length > 0
    ) {
      return [
        ...currentReport.activity_history,
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

    if (currentReport.created_at) {
      fallback.push({
        type: 'reported',
        message:
          'Report submitted successfully',
        created_at:
          currentReport.created_at,
      });
    }

    if (currentReport.assigned_at) {
      fallback.push({
        type: 'assigned',
        message:
          currentReport.assigned_to
            ? `Report assigned to ${currentReport.assigned_to}`
            : 'Report assigned to an officer',
        created_at:
          currentReport.assigned_at,
      });
    }

    if (currentReport.work_started_at) {
      fallback.push({
        type: 'in_progress',
        message:
          'Officer started working on the report',
        created_at:
          currentReport.work_started_at,
      });
    }

    if (currentReport.resolved_at) {
      fallback.push({
        type: 'resolved',
        message:
          'Issue resolved with officer proof',
        created_at:
          currentReport.resolved_at,
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
      <View
        style={
          styles.centerContainer
        }
      >
        <ActivityIndicator size="large" />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading report...
        </Text>
      </View>
    );
  }

  const activityHistory =
    report
      ? getActivityHistory(report)
      : [];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={
        styles.container
      }
    >
      <Pressable
        style={
          styles.backButton
        }
        onPress={() =>
          router.back()
        }
      >
        <Text
          style={
            styles.backButtonText
          }
        >
          ← Back to My Reports
        </Text>
      </Pressable>

      {errorMessage ? (
        <View
          style={
            styles.errorContainer
          }
        >
          <Text
            style={
              styles.errorText
            }
          >
            {errorMessage}
          </Text>

          <Pressable
            style={
              styles.retryButton
            }
            onPress={
              loadReport
            }
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
      report ? (
        <>
          <View
            style={
              styles.header
            }
          >
            <Text
              style={
                styles.title
              }
            >
              Complete Report
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

          <View
            style={styles.card}
          >
            {report.photo_url ? (
              <Image
                source={{
                  uri: `${API_URL}${report.photo_url}`,
                }}
                style={
                  styles.image
                }
                resizeMode="contain"
              />
            ) : null}

            <Text
              style={
                styles.category
              }
            >
              {formatCategory(
                report.category
              )}
            </Text>

            <Text
              style={styles.label}
            >
              Description
            </Text>

            <Text
              style={styles.value}
            >
              {report.description}
            </Text>

            <Text
              style={styles.label}
            >
              Address
            </Text>

            <Text
              style={styles.value}
            >
              {report.address ||
                'Address unavailable'}
            </Text>

            <Text
              style={styles.label}
            >
              Report ID
            </Text>

            <Text
              style={styles.value}
            >
              {report._id}
            </Text>

            {report.created_at ? (
              <>
                <Text
                  style={styles.label}
                >
                  Reported
                </Text>

                <Text
                  style={styles.value}
                >
                  {formatDate(
                    report.created_at
                  )}
                </Text>
              </>
            ) : null}

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
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },

  container: {
    padding: 18,
    paddingBottom: 50,
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

  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 18,
  },

  backButtonText: {
    color: '#1d4ed8',
    fontSize: 15,
    fontWeight: '700',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },

  title: {
    flex: 1,
    fontSize: 28,
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

  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  image: {
    width: '100%',
    height: 230,
    marginBottom: 16,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },

  category: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  label: {
    marginTop: 16,
    marginBottom: 5,
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
  },

  value: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },

  timelineSection: {
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },

  sectionTitle: {
    fontSize: 17,
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
    marginTop: 22,
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
