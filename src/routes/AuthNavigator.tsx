// src/routes/AuthNavigator.tsx
// Authentication flow navigator
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import { AuthStackParamList } from './types';

// Zone B: Import real auth screens
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { SignupScreen } from '@/features/auth/screens/SignupScreen';
import { ForgotPasswordScreen } from '@/features/auth/screens/ForgotPasswordScreen';

// Placeholder screens for screens not yet implemented
const VerifyEmailScreen = () => (
  <View className="flex-1 items-center justify-center bg-background">
    <Text className="text-foreground">Verify Email Screen</Text>
    <Text className="text-muted-foreground">Check your email for verification link</Text>
  </View>
);

const OnboardingSurveyScreen = () => (
  <View className="flex-1 items-center justify-center bg-background">
    <Text className="text-foreground">Onboarding Survey Screen</Text>
    <Text className="text-muted-foreground">TODO: Implement onboarding</Text>
  </View>
);

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="SignIn" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <Stack.Screen name="OnboardingSurvey" component={OnboardingSurveyScreen} />
    </Stack.Navigator>
  );
}
