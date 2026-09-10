import { useState } from 'react';
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
  useLocalSearchParams,
} from 'expo-router';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL;

export default function RegisterScreen() {
  const { from } =
    useLocalSearchParams<{
      from?: string;
    }>();

  const [name, setName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const handleRegister = async () => {
    setErrorMessage('');

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

    if (!password) {
      setErrorMessage(
        'Please enter a password.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${API_URL}/register`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Registration failed.'
        );
      }

      if (from === 'report') {
        router.replace(
          '/login?from=report'
        );
      } else {
        router.replace('/login');
      }
    } catch (error) {
      console.log(
        'Registration error:',
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to register.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Create Account
      </Text>

      <Text style={styles.subtitle}>
        Register as a citizen.
      </Text>

      <Text style={styles.label}>
        Name
      </Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Enter your name"
        placeholderTextColor="#9ca3af"
        style={styles.input}
      />

      <Text style={styles.label}>
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

      <Text style={styles.label}>
        Password
      </Text>

      <View
        style={
          styles.passwordContainer
        }
      >
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Create a password"
          placeholderTextColor="#9ca3af"
          secureTextEntry={
            !showPassword
          }
          autoCapitalize="none"
          autoCorrect={false}
          style={
            styles.passwordInput
          }
        />

        <Pressable
          onPress={() =>
            setShowPassword(
              !showPassword
            )
          }
          style={
            styles.showPasswordButton
          }
        >
          <Text
            style={
              styles.showPasswordText
            }
          >
            {showPassword
              ? 'Hide'
              : 'Show'}
          </Text>
        </Pressable>
      </View>

      {errorMessage ? (
        <Text style={styles.error}>
          {errorMessage}
        </Text>
      ) : null}

      <Pressable
        style={[
          styles.button,
          isSubmitting &&
            styles.disabledButton,
        ]}
        onPress={handleRegister}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator
            color="#ffffff"
          />
        ) : (
          <Text
            style={
              styles.buttonText
            }
          >
            Register
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => {
          if (from === 'report') {
            router.replace(
              '/login?from=report'
            );
          } else {
            router.replace(
              '/login'
            );
          }
        }}
      >
        <Text
          style={styles.loginText}
        >
          Already have an account?
          Login
        </Text>
      </Pressable>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f9fafb',
      paddingHorizontal: 20,
      paddingTop: 60,
    },

    title: {
      fontSize: 30,
      fontWeight: '700',
      color: '#111827',
    },

    subtitle: {
      marginTop: 8,
      marginBottom: 30,
      fontSize: 15,
      color: '#6b7280',
    },

    label: {
      marginTop: 16,
      marginBottom: 8,
      fontSize: 14,
      fontWeight: '600',
      color: '#374151',
    },

    input: {
      minHeight: 52,
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 10,
      backgroundColor: '#ffffff',
      paddingHorizontal: 14,
      fontSize: 15,
      color: '#111827',
    },

    passwordContainer: {
      minHeight: 52,
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 10,
      backgroundColor: '#ffffff',
      flexDirection: 'row',
      alignItems: 'center',
    },

    passwordInput: {
      flex: 1,
      minHeight: 52,
      paddingHorizontal: 14,
      fontSize: 15,
      color: '#111827',
    },

    showPasswordButton: {
      paddingHorizontal: 14,
      paddingVertical: 14,
      justifyContent: 'center',
    },

    showPasswordText: {
      color: '#1d4ed8',
      fontSize: 14,
      fontWeight: '600',
    },

    error: {
      marginTop: 16,
      color: '#b91c1c',
      fontSize: 14,
    },

    button: {
      marginTop: 24,
      minHeight: 52,
      borderRadius: 10,
      backgroundColor: '#1d4ed8',
      alignItems: 'center',
      justifyContent: 'center',
    },

    disabledButton: {
      opacity: 0.65,
    },

    buttonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '700',
    },

    loginText: {
      marginTop: 20,
      textAlign: 'center',
      color: '#1d4ed8',
      fontWeight: '600',
    },
  });