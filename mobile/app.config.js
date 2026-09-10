module.exports = ({ config }) => ({
  ...config,

  plugins: [
    'expo-router',
    'expo-secure-store',

    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],

    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey:
          process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    ],
  ],
});