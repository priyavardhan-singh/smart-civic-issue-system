import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { File } from 'expo-file-system';
import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type Report = {
  _id: string;
  category: string;
  description: string;
  address?: string;
  photo_url?: string;
  status: string;
  created_at?: string;
  assigned_at?: string;
  work_started_at?: string;
  resolved_at?: string;
  resolution_remarks?: string;
  resolution_photo_url?: string;
};

export default function OfficerReportDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [remarks, setRemarks] = useState('');
  const [proofImage, setProofImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    setErrorMessage('');

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

      const response = await fetch(`${API_URL}/officer/reports`, {
        headers: { Authorization: `Bearer ${token}` },
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
        throw new Error(data.detail || 'Unable to load report.');
      }

      const selectedReport = data.find(
        (item: Report) => item._id === id
      );

      if (!selectedReport) {
        throw new Error('This report is not assigned to you.');
      }

      setReport(selectedReport);
      setRemarks(selectedReport.resolution_remarks || '');
    } catch (error) {
      console.log('Officer report details error:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to load report.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const startWork = async () => {
    if (!report) return;
    setIsUpdating(true);

    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch(
        `${API_URL}/officer/reports/${report._id}/status`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'in_progress' }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : JSON.stringify(data.detail)
        );
      }

      await loadReport();
    } catch (error) {
      Alert.alert(
        'Unable to Start Work',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const chooseProofImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow photo access to select resolution proof.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) setProofImage(result.assets[0]);
  };

  const takeProofPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Camera Permission Required',
        'Please allow camera access to take resolution proof.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) setProofImage(result.assets[0]);
  };

  const submitResolution = async () => {
    if (!report) return;

    const reportRemarks = remarks.trim();

    if (!reportRemarks) {
      Alert.alert('Remarks Required', 'Please enter resolution remarks.');
      return;
    }

    if (!proofImage) {
      Alert.alert('Proof Required', 'Please add a resolution proof photo.');
      return;
    }

    setIsUpdating(true);

    try {
      const token = await SecureStore.getItemAsync('access_token');

      if (!token) {
        router.replace('/login');
        return;
      }

      const formData = new FormData();
      formData.append('remarks', reportRemarks);

      const file = new File(proofImage.uri);
      formData.append('resolution_photo', file);

      const response = await fetch(
        `${API_URL}/officer/reports/${report._id}/resolve`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const detail =
          typeof data.detail === 'string'
            ? data.detail
            : JSON.stringify(data.detail);
        throw new Error(detail || 'Unable to resolve report.');
      }

      setProofImage(null);
      Alert.alert(
        'Report Resolved',
        'Resolution proof submitted successfully.'
      );
      await loadReport();
    } catch (error) {
      Alert.alert(
        'Unable to Resolve',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setIsUpdating(false);
    }
  };

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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading report...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back to Dashboard</Text>
      </Pressable>

      {errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable style={styles.retryButton} onPress={loadReport}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      ) : null}

      {!errorMessage && report ? (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Complete Report</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{formatStatus(report.status)}</Text>
            </View>
          </View>

          <View style={styles.card}>
            {report.photo_url ? (
              <Image
                source={{ uri: `${API_URL}${report.photo_url}` }}
                style={styles.issueImage}
                resizeMode="contain"
              />
            ) : null}

            <Text style={styles.category}>{formatCategory(report.category)}</Text>

            <Text style={styles.label}>Description</Text>
            <Text style={styles.value}>{report.description}</Text>

            <Text style={styles.label}>Address</Text>
            <Text style={styles.value}>
              {report.address || 'Address unavailable'}
            </Text>

            <Text style={styles.label}>Report ID</Text>
            <Text style={styles.value}>{report._id}</Text>

            {report.created_at ? (
              <>
                <Text style={styles.label}>Reported</Text>
                <Text style={styles.value}>{formatDate(report.created_at)}</Text>
              </>
            ) : null}

            {report.status === 'assigned' ? (
              <Pressable
                style={[styles.startButton, isUpdating && styles.disabledButton]}
                disabled={isUpdating}
                onPress={startWork}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Start Work</Text>
                )}
              </Pressable>
            ) : null}

            {report.status === 'in_progress' ? (
              <View style={styles.resolutionForm}>
                <Text style={styles.sectionTitle}>Submit Resolution</Text>

                <Text style={styles.label}>Resolution Remarks</Text>
                <TextInput
                  value={remarks}
                  onChangeText={setRemarks}
                  placeholder="Explain how the issue was resolved"
                  multiline
                  style={styles.textArea}
                />

                <View style={styles.photoButtons}>
                  <Pressable style={styles.photoButton} onPress={takeProofPhoto}>
                    <Text style={styles.photoButtonText}>Take Photo</Text>
                  </Pressable>
                  <Pressable style={styles.photoButton} onPress={chooseProofImage}>
                    <Text style={styles.photoButtonText}>Gallery</Text>
                  </Pressable>
                </View>

                {proofImage ? (
                  <View style={styles.previewContainer}>
                    <Image
                      source={{ uri: proofImage.uri }}
                      style={styles.previewImage}
                      resizeMode="contain"
                    />
                    <Pressable onPress={() => setProofImage(null)}>
                      <Text style={styles.removeText}>Remove Photo</Text>
                    </Pressable>
                  </View>
                ) : null}

                <Pressable
                  style={[styles.resolveButton, isUpdating && styles.disabledButton]}
                  disabled={isUpdating}
                  onPress={submitResolution}
                >
                  {isUpdating ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.buttonText}>
                      Submit Resolution Proof
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : null}

            {report.status === 'resolved' ? (
              <View style={styles.resolvedContainer}>
                <Text style={styles.resolvedTitle}>Issue Resolved</Text>

                {report.resolution_photo_url ? (
                  <Image
                    source={{ uri: `${API_URL}${report.resolution_photo_url}` }}
                    style={styles.resolutionImage}
                    resizeMode="contain"
                  />
                ) : null}

                {report.resolution_remarks ? (
                  <Text style={styles.resolutionText}>
                    Remarks: {report.resolution_remarks}
                  </Text>
                ) : null}

                {report.resolved_at ? (
                  <Text style={styles.resolutionDate}>
                    Resolved: {formatDate(report.resolved_at)}
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
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  container: { padding: 18, paddingBottom: 50 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: { marginTop: 12, color: '#6b7280' },
  backButton: { alignSelf: 'flex-start', marginBottom: 18 },
  backButtonText: { color: '#1d4ed8', fontSize: 15, fontWeight: '700' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  title: { flex: 1, fontSize: 28, fontWeight: '700', color: '#111827' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
  },
  statusText: { fontSize: 12, fontWeight: '700', color: '#1d4ed8' },
  errorContainer: { padding: 14, borderRadius: 10, backgroundColor: '#fef2f2' },
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
  card: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  issueImage: {
    width: '100%',
    height: 230,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    marginBottom: 16,
  },
  category: { fontSize: 20, fontWeight: '700', color: '#111827' },
  label: { marginTop: 16, marginBottom: 5, fontSize: 13, fontWeight: '700', color: '#6b7280' },
  value: { fontSize: 15, lineHeight: 22, color: '#374151' },
  startButton: {
    marginTop: 20,
    minHeight: 50,
    borderRadius: 9,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#ffffff', fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
  resolutionForm: {
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  textArea: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 9,
    backgroundColor: '#ffffff',
    padding: 12,
    textAlignVertical: 'top',
    color: '#111827',
  },
  photoButtons: { flexDirection: 'row', gap: 10, marginTop: 14 },
  photoButton: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#1d4ed8',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtonText: { color: '#1d4ed8', fontWeight: '700' },
  previewContainer: { marginTop: 14 },
  previewImage: { width: '100%', height: 210, borderRadius: 8, backgroundColor: '#f3f4f6' },
  removeText: { marginTop: 8, textAlign: 'center', color: '#b91c1c', fontWeight: '600' },
  resolveButton: {
    marginTop: 16,
    minHeight: 50,
    borderRadius: 9,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resolvedContainer: {
    marginTop: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    backgroundColor: '#f0fdf4',
  },
  resolvedTitle: { fontSize: 16, fontWeight: '700', color: '#166534' },
  resolutionImage: { width: '100%', height: 220, marginTop: 12, borderRadius: 8, backgroundColor: '#ffffff' },
  resolutionText: { marginTop: 12, fontSize: 14, lineHeight: 20, color: '#374151' },
  resolutionDate: { marginTop: 10, fontSize: 13, color: '#6b7280' },
});
