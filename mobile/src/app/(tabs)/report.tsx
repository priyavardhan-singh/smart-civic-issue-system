import { File } from 'expo-file-system';
import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import MapView, { Marker } from 'react-native-maps';

type LocationData = {
  latitude: number;
  longitude: number;    
};


const DEFAULT_LOCATION: LocationData = {
  latitude: 28.6139,
  longitude: 77.209,
};

const CATEGORIES = [
  { value: 'road', label: 'Road Damage / Pothole' },
  { value: 'streetlight', label: 'Streetlight Problem' },
  { value: 'garbage', label: 'Garbage / Waste' },
  { value: 'water', label: 'Water / Drainage' },
  { value: 'sewage', label: 'Sewage Problem' },
  { value: 'other', label: 'Other' },
];

const REPORT_DRAFT_KEY = 'report_draft';
const API_URL = process.env.EXPO_PUBLIC_API_URL;


export default function ReportIssue() {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const mapRef = useRef<MapView>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const [location, setLocation] = useState<LocationData | null>(null);
  const [address, setAddress] = useState('');
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  useEffect(() => {
    const restoreReportDraft = async () => {
    try {
      const savedDraft =
        await SecureStore.getItemAsync(
          REPORT_DRAFT_KEY
        );

      if (!savedDraft) {
        return;
      }

      const draft = JSON.parse(savedDraft);

      setCategory(draft.category || '');
      setDescription(draft.description || '');

      setAddress(draft.address || '');

      setLocation(
        draft.location || null
      );

      setLocationConfirmed(
        draft.locationConfirmed || false
      );

      setSearchQuery(
        draft.searchQuery || ''
      );

      if (draft.photoUri) {
        setSelectedImage(
          draft.photoUri
        );

        setSelectedFile({
          uri: draft.photoUri,
        });
      }
    } catch (error) {
      console.log(
        'Draft restore error:',
        error
      );
    }
  };

    restoreReportDraft();
  }, []);

  const saveReportDraft = async () => {
  try {
    const draft = {
      category,
      description,
      location,
      address,
      locationConfirmed,
      searchQuery,
      photoUri:
        selectedFile?.uri ||
        selectedImage ||
        null,
    };

    await SecureStore.setItemAsync(
      REPORT_DRAFT_KEY,
      JSON.stringify(draft)
    );
  } catch (error) {
    console.log(
      'Draft save error:',
      error
    );
  }
};
 

  // ------------------------------------------------------------
  // PHOTO: CAMERA
  // ------------------------------------------------------------

  const handleTakePhoto = async () => {
    setErrorMessage('');

    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Camera Permission',
        'Camera permission is required to take a photo.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];

      setSelectedImage(asset.uri);
      setSelectedFile(asset);
    }
  };

  // ------------------------------------------------------------
  // PHOTO: GALLERY
  // ------------------------------------------------------------

  const handleChoosePhoto = async () => {
    setErrorMessage('');

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Gallery Permission',
        'Gallery permission is required to select a photo.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];

      setSelectedImage(asset.uri);
      setSelectedFile(asset);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedImage(null);
    setSelectedFile(null);
  };

  // ------------------------------------------------------------
  // REVERSE GEOCODING
  // Coordinates → readable address
  // ------------------------------------------------------------

  const fetchAddress = async (
  latitude: number,
  longitude: number
) => {
  try {
    setAddress('Fetching address...');

    const token =
      await SecureStore.getItemAsync(
        'access_token'
      );

    if (!token) {
      throw new Error(
        'Login required for address lookup.'
      );
    }

    const response = await fetch(
      `${API_URL}/reverse-geocode?latitude=${latitude}&longitude=${longitude}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    console.log(
      'Reverse geocoding response:',
      response.status,
      data
    );

    if (
      response.ok &&
      data?.address
    ) {
      setAddress(data.address);
      return;
    }

    const detail =
      typeof data?.detail === 'string'
        ? data.detail
        : JSON.stringify(data?.detail);

    throw new Error(
      detail ||
        'Unable to fetch address.'
    );
  } catch (error) {
    console.log(
      'Reverse geocoding error:',
      error
    );

    setAddress(
      `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    );
  }
};
  // ------------------------------------------------------------
  // UPDATE LOCATION
  // Used by GPS, search and marker drag
  // ------------------------------------------------------------

  const updateLocation = async (
    latitude: number,
    longitude: number
  ) => {
    const newLocation = {
      latitude,
      longitude,
    };

    setLocation(newLocation);

    // Location changed → previous confirmation is no longer valid
    setLocationConfirmed(false);

    setErrorMessage('');


    mapRef.current?.animateCamera(
  {
    center: {
      latitude,
      longitude,
    },
    zoom: 16,
  },
  {
    duration: 1000,
  }
);

    await fetchAddress(latitude, longitude);
  };

  // ------------------------------------------------------------
  // GPS
  // ------------------------------------------------------------

  const handleCurrentLocation = async () => {
    setErrorMessage('');
    setIsGettingLocation(true);

    try {
      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        setErrorMessage(
          'Location permission is required. Please allow location access.'
        );
        setIsGettingLocation(false);
        return;
      }

      const currentLocation =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      const { latitude, longitude } =
        currentLocation.coords;

      await updateLocation(latitude, longitude);
    } catch (error) {
      console.log('GPS error:', error);

      setErrorMessage(
        'Unable to get your current location. Please try again.'
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  // ------------------------------------------------------------
  // LOCATION SEARCH
  // Uses the same Nominatim approach as the web version
  // ------------------------------------------------------------

  const handleSearchLocation = async () => {
  setErrorMessage('');

  if (!searchQuery.trim()) {
    setErrorMessage(
      'Please enter an address or landmark to search.'
    );
    return;
  }

  setIsSearching(true);

  try {
    const results =
      await Location.geocodeAsync(searchQuery.trim());

    if (results.length === 0) {
      setErrorMessage(
        'Location not found. Please try another search.'
      );
      return;
    }

    const firstResult = results[0];

    await updateLocation(
      firstResult.latitude,
      firstResult.longitude
    );

    setSearchQuery('');
  } catch (error) {
    console.log(
      'Location search error:',
      error
    );

    setErrorMessage(
      'Unable to search for the location. Please try again.'
    );
  } finally {
    setIsSearching(false);
  }
};
  

  // ------------------------------------------------------------
  // DRAG MARKER
  // ------------------------------------------------------------

  const handleMarkerDragEnd = async (event: any) => {
    const coordinate = event.nativeEvent.coordinate;

    await updateLocation(
      coordinate.latitude,
      coordinate.longitude
    );
  };

  // ------------------------------------------------------------
  // CONFIRM LOCATION
  // ------------------------------------------------------------

  const handleConfirmLocation = () => {
    if (!location) {
      setErrorMessage(
        'Please select a location first.'
      );
      return;
    }

    setLocationConfirmed(true);
    setErrorMessage('');
  };

  // ------------------------------------------------------------
  // SUBMIT
  // Submit report to FastAPI backend
  // ------------------------------------------------------------

  const handleSubmit = async () => {
  setErrorMessage('');
  setSubmitSuccess(false);

  if (!category) {
    setErrorMessage(
      'Please select an issue category.'
    );
    return;
  }

  if (!description.trim()) {
    setErrorMessage(
      'Please describe the issue.'
    );
    return;
  }

  if (!selectedFile) {
    setErrorMessage(
      'Please add a photo of the issue.'
    );
    return;
  }

  if (!location) {
    setErrorMessage(
      'Please select the issue location.'
    );
    return;
  }

  if (!locationConfirmed) {
    setErrorMessage(
      'Please confirm the issue location.'
    );
    return;
  }

  setIsSubmitting(true);

  try {
    const token =
      await SecureStore.getItemAsync(
        'access_token'
      );

    if (!token) {
      Alert.alert(
        'Login Required',
        'Please login or create an account before submitting your report.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Login',
            onPress: async () => {
              await saveReportDraft();
              router.push('/login?from=report');
            },
          },
          {
            text: 'Register',
            onPress: async () => {
              await saveReportDraft();
              router.push('/register?from=report');
            },
          },
        ]
      );

      return;
    }

    const formData = new FormData();

    formData.append(
      'category',
      category
    );

    formData.append(
      'description',
      description.trim()
    );

    formData.append(
      'latitude',
      String(location.latitude)
    );

    formData.append(
      'longitude',
      String(location.longitude)
    );

    formData.append(
      'address',
      address
    );

    const photoFile =
      new File(selectedFile.uri);

    formData.append(
      'photo',
      photoFile
    );

    const response = await fetch(
      `${API_URL}/reports`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

   const data = await response.json();

console.log(
  'Report submission response:',
  response.status,
  data
);

if (!response.ok) {
  const detail =
    typeof data.detail === 'string'
      ? data.detail
      : JSON.stringify(data.detail);

  throw new Error(
    detail ||
      'Failed to submit report.'
  );
}

    console.log(
      'Report submitted successfully:',
      data
    );

    await SecureStore.deleteItemAsync(
      REPORT_DRAFT_KEY
    );

    setSubmitSuccess(true);

    // Reset form only after successful submission
    setCategory('');
    setDescription('');
    setSelectedImage(null);
    setSelectedFile(null);

    setLocation(null);
    setAddress('');
    setLocationConfirmed(false);

    setSearchQuery('');
  } catch (error) {
    console.log(
      'Report submission error:',
      error
    );

    setErrorMessage(
      error instanceof Error
        ? error.message
        : 'Unable to submit report. Please try again.'
    );
  } finally {
    setIsSubmitting(false);
  }
};

  // ------------------------------------------------------------
  // SELECTED CATEGORY LABEL
  // ------------------------------------------------------------

  const selectedCategoryLabel =
    CATEGORIES.find(
      (item) => item.value === category
    )?.label || 'Select an issue';

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Text style={styles.title}>
            Report an Issue
          </Text>

          <Text style={styles.subtitle}>
            Help improve your city by reporting a
            civic problem.
          </Text>
        </View>

        {/* CATEGORY */}

        <View style={styles.section}>
          <Text style={styles.label}>
            Issue Category
          </Text>

          <Pressable
            style={styles.selectButton}
            onPress={() =>
              setCategoryModalVisible(true)
            }
          >
            <Text
              style={[
                styles.selectText,
                !category &&
                  styles.placeholderText,
              ]}
            >
              {selectedCategoryLabel}
            </Text>

            <Text style={styles.arrow}>
              ▼
            </Text>
          </Pressable>
        </View>

        {/* CATEGORY MODAL */}

        <Modal
          visible={categoryModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setCategoryModalVisible(false)
          }
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() =>
              setCategoryModalVisible(false)
            }
          >
            <View style={styles.categoryModal}>
              <Text style={styles.modalTitle}>
                Select Issue
              </Text>

              {CATEGORIES.map((item) => (
                <Pressable
                  key={item.value}
                  style={[
                    styles.categoryOption,
                    category === item.value &&
                      styles.categoryOptionSelected,
                  ]}
                  onPress={() => {
                    setCategory(item.value);
                    setCategoryModalVisible(false);
                    setErrorMessage('');
                  }}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      category === item.value &&
                        styles.categoryOptionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>

                  {category === item.value && (
                    <Text style={styles.check}>
                      ✓
                    </Text>
                  )}
                </Pressable>
              ))}

              <Pressable
                style={styles.cancelButton}
                onPress={() =>
                  setCategoryModalVisible(false)
                }
              >
                <Text style={styles.cancelText}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* DESCRIPTION */}

        <View style={styles.section}>
          <Text style={styles.label}>
            Describe the Issue
          </Text>

          <TextInput
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              setErrorMessage('');
            }}
            placeholder="Describe the problem in detail..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            style={styles.descriptionInput}
          />
        </View>

        {/* PHOTO */}

        <View style={styles.section}>
          <Text style={styles.label}>
            Add a Photo
          </Text>

          <View style={styles.photoButtons}>
            <Pressable
              style={styles.photoButton}
              onPress={handleTakePhoto}
            >
              <Text style={styles.photoIcon}>
                📷
              </Text>

              <Text style={styles.photoButtonText}>
                Take Photo
              </Text>
            </Pressable>

            <Pressable
              style={styles.photoButton}
              onPress={handleChoosePhoto}
            >
              <Text style={styles.photoIcon}>
                🖼️
              </Text>

              <Text style={styles.photoButtonText}>
                Gallery
              </Text>
            </Pressable>
          </View>

          {selectedImage && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>
                Selected Photo
              </Text>

              <Image
                source={{
                  uri: selectedImage,
                }}
                style={styles.previewImage}
                resizeMode="contain"
              />

              <Pressable
                style={styles.removeButton}
                onPress={handleRemovePhoto}
              >
                <Text style={styles.removeButtonText}>
                  Remove Photo
                </Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.helperText}>
            Take a new photo or choose an existing
            image.
          </Text>
        </View>

        {/* LOCATION */}

        <View style={styles.section}>
          <Text style={styles.label}>
            Issue Location
          </Text>

          {/* GPS BUTTON */}

          <Pressable
            style={[
              styles.locationButton,
              isGettingLocation &&
                styles.disabledButton,
            ]}
            onPress={handleCurrentLocation}
            disabled={isGettingLocation}
          >
            {isGettingLocation ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.locationButtonText}>
                📍 Use Current Location
              </Text>
            )}
          </Pressable>

          {/* SEARCH */}

          <View style={styles.searchContainer}>
            <TextInput
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setErrorMessage('');
              }}
              placeholder="Enter address or landmark"
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={
                handleSearchLocation
              }
            />

            <Pressable
              style={styles.searchButton}
              onPress={handleSearchLocation}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator
                  color="#ffffff"
                  size="small"
                />
              ) : (
                <Text style={styles.searchButtonText}>
                  Search
                </Text>
              )}
            </Pressable>
          </View>

          {/* MAP */}

          <View style={styles.mapContainer}>
            <MapView
            ref={mapRef}
              style={styles.map}
              initialRegion={{
  latitude: DEFAULT_LOCATION.latitude,
  longitude: DEFAULT_LOCATION.longitude,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
}}

              showsUserLocation
              showsMyLocationButton={false}
              mapType="standard"
            >
              {location && (
                <Marker
                  coordinate={{
                    latitude:
                      location.latitude,
                    longitude:
                      location.longitude,
                  }}
                  draggable
                  onDragEnd={
                    handleMarkerDragEnd
                  }
                  title="Issue Location"
                  description="Drag the marker to adjust the exact location"
                />
              )}
            </MapView>

            {!location && (
              <View style={styles.mapHint}>
                <Text style={styles.mapHintText}>
                  Use your location or search for a
                  place to select the issue location.
                </Text>
              </View>
            )}
          </View>

          {/* LOCATION INFORMATION */}

          {location && (
            <View
              style={[
                styles.locationCard,
                locationConfirmed &&
                  styles.locationConfirmedCard,
              ]}
            >
              <Text style={styles.locationSuccess}>
                {locationConfirmed
                  ? '✓ Location confirmed'
                  : '✓ Location selected'}
              </Text>

              {address ? (
                <View style={styles.addressContainer}>
                  <Text style={styles.infoLabel}>
                    Address
                  </Text>

                  <Text style={styles.addressText}>
                    {address}
                  </Text>
                </View>
              ) : null}

              <View style={styles.coordinates}>
                <View style={styles.coordinateBox}>
                  <Text style={styles.infoLabel}>
                    Latitude
                  </Text>

                  <Text style={styles.coordinateText}>
                    {location.latitude.toFixed(6)}
                  </Text>
                </View>

                <View style={styles.coordinateBox}>
                  <Text style={styles.infoLabel}>
                    Longitude
                  </Text>

                  <Text style={styles.coordinateText}>
                    {location.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>

              {!locationConfirmed && (
                <Pressable
                  style={styles.confirmButton}
                  onPress={
                    handleConfirmLocation
                  }
                >
                  <Text
                    style={
                      styles.confirmButtonText
                    }
                  >
                    Confirm Location
                  </Text>
                </Pressable>
              )}

              {locationConfirmed && (
                <Text
                  style={styles.confirmedText}
                >
                  This location will be attached
                  to your report.
                </Text>
              )}
            </View>
          )}

          <Text style={styles.helperText}>
            You can drag the marker to adjust the
            exact location.
          </Text>
        </View>

        {/* ERROR */}

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {/* SUBMIT */}

        <Pressable
          style={[
            styles.submitButton,
            isSubmitting &&
              styles.disabledButton,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <View style={styles.submitLoading}>
              <ActivityIndicator color="#ffffff" />

              <Text
                style={styles.submitButtonText}
              >
                Submitting...
              </Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>
              Submit Report
            </Text>
          )}
        </Pressable>

        {/* SUCCESS */}

        {submitSuccess && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>
              ✓ Report submitted successfully
            </Text>
          </View>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ============================================================
// STYLES
// ============================================================

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

  header: {
    marginBottom: 10,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
  },

  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 23,
    color: '#6b7280',
  },

  section: {
    marginTop: 24,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 9,
  },

  // CATEGORY

  selectButton: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },

  placeholderText: {
    color: '#9ca3af',
  },

  arrow: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },

  categoryModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },

  categoryOption: {
    minHeight: 50,
    paddingHorizontal: 12,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
  },

  categoryOptionSelected: {
    backgroundColor: '#eff6ff',
  },

  categoryOptionText: {
    fontSize: 15,
    color: '#374151',
  },

  categoryOptionTextSelected: {
    color: '#1d4ed8',
    fontWeight: '600',
  },

  check: {
    fontSize: 18,
    color: '#1d4ed8',
    fontWeight: '700',
  },

  cancelButton: {
    marginTop: 12,
    paddingVertical: 13,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },

  cancelText: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '600',
  },

  // DESCRIPTION

  descriptionInput: {
    minHeight: 130,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingTop: 14,
    fontSize: 15,
    color: '#374151',
  },

  // PHOTO

  photoButtons: {
    flexDirection: 'row',
    gap: 10,
  },

  photoButton: {
    flex: 1,
    minHeight: 105,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  photoIcon: {
    fontSize: 30,
  },

  photoButtonText: {
    marginTop: 7,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },

  previewContainer: {
    marginTop: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },

  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },

  previewImage: {
    width: '100%',
    height: 240,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },

  removeButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 9,
    paddingVertical: 11,
    alignItems: 'center',
  },

  removeButtonText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 14,
  },

  helperText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: '#6b7280',
  },

  // LOCATION

  locationButton: {
    minHeight: 50,
    borderRadius: 10,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  locationButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },

  searchContainer: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },

  searchInput: {
    flex: 1,
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#374151',
  },

  searchButton: {
    minWidth: 78,
    minHeight: 50,
    borderRadius: 10,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  searchButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },

  mapContainer: {
    marginTop: 14,
    height: 320,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d1d5db',
    position: 'relative',
  },

  map: {
    width: '100%',
    height: '100%',
  },

  mapHint: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 9,
    padding: 12,
  },

  mapHintText: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    color: '#4b5563',
  },

  locationCard: {
    marginTop: 14,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },

  locationConfirmedCard: {
    backgroundColor: '#ecfdf5',
    borderColor: '#86efac',
  },

  locationSuccess: {
    fontSize: 15,
    fontWeight: '700',
    color: '#166534',
  },

  addressContainer: {
    marginTop: 12,
  },

  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 3,
  },

  addressText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#374151',
  },

  coordinates: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },

  coordinateBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
  },

  coordinateText: {
    fontSize: 13,
    color: '#374151',
  },

  confirmButton: {
    marginTop: 14,
    minHeight: 48,
    borderRadius: 9,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },

  confirmedText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 13,
    color: '#15803d',
  },

  // ERROR

  errorContainer: {
    marginTop: 18,
    padding: 12,
    borderRadius: 9,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },

  errorText: {
    color: '#b91c1c',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },

  // SUBMIT

  submitButton: {
    marginTop: 22,
    minHeight: 52,
    borderRadius: 10,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  submitLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  disabledButton: {
    opacity: 0.65,
  },

  successContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 9,
    backgroundColor: '#f0fdf4',
  },

  successText: {
    textAlign: 'center',
    color: '#15803d',
    fontSize: 14,
    fontWeight: '600',
  },

  bottomSpace: {
    height: 20,
  },
});