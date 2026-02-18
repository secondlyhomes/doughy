// src/routes/types.ts
// Navigation type definitions for React Native

import { NavigatorScreenParams } from '@react-navigation/native';

// Auth Stack
export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  VerifyEmail: undefined;
  OnboardingSurvey: undefined;
  ResetPassword: { token?: string } | undefined;
  MFASetup: undefined;
  MFAVerify: { factorId?: string } | undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Dashboard: undefined;
  Properties: undefined;
  Leads: undefined;
  Conversations: undefined;
  Settings: undefined;
};

// Properties Stack (nested in Main)
export type PropertiesStackParamList = {
  PropertyList: undefined;
  PropertyDetail: { propertyId: string };
  PropertyEdit: { propertyId: string };
  AddProperty: undefined;
};

// Leads Stack (nested in Main)
export type LeadsStackParamList = {
  LeadList: undefined;
  LeadDetail: { leadId: string };
  LeadEdit: { leadId: string };
  AddLead: undefined;
};

// Conversations Stack (nested in Main)
export type ConversationsStackParamList = {
  ConversationList: undefined;
  ConversationDetail: { conversationId: string };
};

// Settings Stack (nested in Main)
export type SettingsStackParamList = {
  SettingsHome: undefined;
  Profile: undefined;
  ChangePassword: undefined;
  Appearance: undefined;
  NotificationsSettings: undefined;
  Security: undefined;
  About: undefined;
  Analytics: undefined;
};

// Admin Stack
export type AdminStackParamList = {
  AdminDashboard: undefined;
  AdminUsers: undefined;
  UserDetail: { userId: string };
  AdminIntegrations: undefined;
  AdminLogs: undefined;
  AdminAnalytics: undefined;
  AdminSettings: undefined;
};

// Root Stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Admin: NavigatorScreenParams<AdminStackParamList>;
  // Modal screens that can be accessed from anywhere
  PropertyDetailModal: { propertyId: string };
  LeadDetailModal: { leadId: string };
  AssistantModal: undefined;
};

// Utility types for navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
