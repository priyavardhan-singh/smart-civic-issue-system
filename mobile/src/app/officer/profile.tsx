import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  router,
  useFocusEffect,
} from 'expo-router';

import {
  useCallback,
  useState,
} from 'react';

import * as SecureStore from 'expo-secure-store';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL;

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function OfficerProfileScreen() {
  const [user, setUser] =
    useState<User | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isEditing, setIsEditing] =
    useState(false);

  const [name, setName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [isSaving, setIsSaving] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  useFocusEffect(
    useCallback(() => {
      const loadUser = async () => {
        setIsLoading(true);

        try {
          const token =
            await SecureStore.getItemAsync(
              'access_token'
            );

          const storedUser =
            await SecureStore.getItemAsync(
              'user'
            );

          if (!token || !storedUser) {
            router.replace('/login');
            return;
          }

          const parsedUser =
            JSON.parse(storedUser);

          if (
            parsedUser.role !==
            'officer'
          ) {
            router.replace('/');
            return;
          }

          setUser(parsedUser);

          setName(
            parsedUser.name || ''
          );

          setEmail(
            parsedUser.email || ''
          );

          setIsEditing(false);
          setErrorMessage('');
          setSuccessMessage('');
        } catch (error) {
          console.log(
            'Officer profile load error:',
            error
          );

          router.replace('/login');
        } finally {
          setIsLoading(false);
        }
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

    router.replace('/login');
  };

  const handleEditProfile = () => {
    if (!user) {
      return;
    }

    setName(user.name);
    setEmail(user.email);

    setErrorMessage('');
    setSuccessMessage('');

    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }

    setErrorMessage('');
    setSuccessMessage('');

    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim()) {
      setErrorMessage(
        'Please enter your name.'
      );
      return;
    }

    if (!email.trim()) {
      setErrorMessage(
        'Please enter your email.'
      );
      return;
    }

    setIsSaving(true);

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
        `${API_URL}/me`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            name: name.trim(),

            email:
              email
                .trim()
                .toLowerCase(),
          }),
        }
      );

      const data =
        await response.json();

      if (response.status === 401) {
        await handleLogout();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Unable to update profile.'
        );
      }

      const updatedUser =
        data.user as User;

      setUser(updatedUser);

      setName(
        updatedUser.name
      );

      setEmail(
        updatedUser.email
      );

      await SecureStore.setItemAsync(
        'user',
        JSON.stringify(
          updatedUser
        )
      );

      setIsEditing(false);

      setSuccessMessage(
        'Profile updated successfully.'
      );
    } catch (error) {
      console.log(
        'Officer profile update error:',
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to update profile.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading profile...
        </Text>
      </View>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <View
      style={
        styles.container
      }
    >
      <Text
        style={styles.title}
      >
        Officer Profile
      </Text>

      <Text
        style={
          styles.subtitle
        }
      >
        Manage your officer account.
      </Text>

      {successMessage ? (
        <View
          style={
            styles.successContainer
          }
        >
          <Text
            style={
              styles.successText
            }
          >
            {successMessage}
          </Text>
        </View>
      ) : null}

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
        </View>
      ) : null}

      {!isEditing ? (
        <>
          <View
            style={styles.card}
          >
            <Text
              style={styles.label}
            >
              Name
            </Text>

            <Text
              style={styles.value}
            >
              {user.name}
            </Text>

            <Text
              style={styles.label}
            >
              Email
            </Text>

            <Text
              style={styles.value}
            >
              {user.email}
            </Text>

            <Text
              style={styles.label}
            >
              Account Type
            </Text>

            <Text
              style={styles.value}
            >
              Officer
            </Text>
          </View>

          <Pressable
            style={
              styles.updateButton
            }
            onPress={
              handleEditProfile
            }
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
            style={
              styles.logoutButton
            }
            onPress={
              handleLogout
            }
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
      ) : (
        <>
          <View
            style={styles.card}
          >
            <Text
              style={styles.label}
            >
              Name
            </Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />

            <Text
              style={styles.label}
            >
              Email
            </Text>

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            <Text
              style={styles.label}
            >
              Account Type
            </Text>

            <Text
              style={styles.value}
            >
              Officer
            </Text>
          </View>

          <Pressable
            style={[
              styles.saveButton,

              isSaving &&
                styles.disabledButton,
            ]}
            onPress={
              handleSaveProfile
            }
            disabled={
              isSaving
            }
          >
            {isSaving ? (
              <ActivityIndicator
                color="#ffffff"
              />
            ) : (
              <Text
                style={
                  styles.saveButtonText
                }
              >
                Save Changes
              </Text>
            )}
          </Pressable>

          <Pressable
            style={
              styles.cancelButton
            }
            onPress={
              handleCancelEdit
            }
            disabled={
              isSaving
            }
          >
            <Text
              style={
                styles.cancelText
              }
            >
              Cancel
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#f9fafb',
      paddingHorizontal: 20,
      paddingTop: 40,
    },

    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        '#f9fafb',
    },

    loadingText: {
      marginTop: 12,
      color: '#6b7280',
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

    card: {
      marginTop: 28,
      padding: 18,
      borderRadius: 12,
      backgroundColor:
        '#ffffff',
      borderWidth: 1,
      borderColor:
        '#e5e7eb',
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

    input: {
      marginTop: 7,
      minHeight: 50,
      borderWidth: 1,
      borderColor:
        '#d1d5db',
      borderRadius: 9,
      backgroundColor:
        '#ffffff',
      paddingHorizontal: 13,
      fontSize: 15,
      color: '#111827',
    },

    successContainer: {
      marginTop: 18,
      padding: 12,
      borderRadius: 9,
      backgroundColor:
        '#f0fdf4',
      borderWidth: 1,
      borderColor:
        '#bbf7d0',
    },

    successText: {
      color: '#15803d',
      fontSize: 14,
      fontWeight: '600',
    },

    errorContainer: {
      marginTop: 18,
      padding: 12,
      borderRadius: 9,
      backgroundColor:
        '#fef2f2',
      borderWidth: 1,
      borderColor:
        '#fecaca',
    },

    errorText: {
      color: '#b91c1c',
      fontSize: 14,
    },

    updateButton: {
      marginTop: 24,
      minHeight: 50,
      borderRadius: 10,
      borderWidth: 1,
      borderColor:
        '#1d4ed8',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    updateButtonText: {
      color: '#1d4ed8',
      fontSize: 15,
      fontWeight: '700',
    },

    saveButton: {
      marginTop: 24,
      minHeight: 50,
      borderRadius: 10,
      backgroundColor:
        '#15803d',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    saveButtonText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '700',
    },

    cancelButton: {
      marginTop: 12,
      minHeight: 50,
      borderRadius: 10,
      borderWidth: 1,
      borderColor:
        '#9ca3af',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    cancelText: {
      color: '#4b5563',
      fontSize: 15,
      fontWeight: '700',
    },

    logoutButton: {
      marginTop: 12,
      minHeight: 50,
      borderRadius: 10,
      backgroundColor:
        '#dc2626',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    logoutButtonText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '700',
    },

    disabledButton: {
      opacity: 0.65,
    },
  });