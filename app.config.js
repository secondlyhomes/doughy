const APP_VARIANT = process.env.APP_VARIANT || 'production';

const config = {
  development: {
    name: 'Doughy (Dev)',
    bundleId: 'app.doughy.dev',
    androidPackage: 'app.doughy.dev',
  },
  staging: {
    name: 'Doughy (Stage)',
    bundleId: 'app.doughy.staging',
    androidPackage: 'app.doughy.staging',
  },
  production: {
    name: 'Doughy',
    bundleId: 'app.doughy',
    androidPackage: 'app.doughy',
  },
};

const variant = config[APP_VARIANT];

export default {
  expo: {
    name: variant.name,
    slug: 'doughy-app',
    version: '1.0.0',
    scheme: 'doughy',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: variant.bundleId,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'This app uses your location to show nearby properties on the map.',
        NSCameraUsageDescription:
          'This app uses your camera to take property photos.',
        NSPhotoLibraryUsageDescription:
          'This app accesses your photos to add property images.',
      },
    },
    android: {
      package: variant.androidPackage,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      permissions: [
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.RECORD_AUDIO',
      ],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        },
      },
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [{ scheme: 'doughy' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
      output: 'single',
    },
    plugins: [
      'expo-secure-store',
      [
        'expo-image-picker',
        {
          photosPermission:
            'Allow Doughy AI to access your photos to add property images.',
          cameraPermission:
            'Allow Doughy AI to access your camera to take property photos.',
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'Allow Doughy AI to use your location to show nearby properties.',
        },
      ],
      '@react-native-community/datetimepicker',
      'expo-router',
      'expo-web-browser',
      'expo-font',
    ],
    extra: {
      eas: {
        projectId: 'YOUR_EAS_PROJECT_ID', // Get this after running: eas init
      },
    },
  },
};
