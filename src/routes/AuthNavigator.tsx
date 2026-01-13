// src/routes/AuthNavigator.tsx
// Authentication flow navigator
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';

// Zone B: Import all auth screens
import {
  LoginScreen,
  SignupScreen,
  ForgotPasswordScreen,
  VerifyEmailScreen,
  OnboardingScreen,
  ResetPasswordScreen,
  MFASetupScreen,
  MFAVerifyScreen,
} from '@/features/auth/screens';

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
      <Stack.Screen name="OnboardingSurvey" component={OnboardingScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="MFASetup" component={MFASetupScreen} />
      <Stack.Screen name="MFAVerify" component={MFAVerifyScreen} />
    </Stack.Navigator>
  );
}
