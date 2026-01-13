// src/routes/ConversationsNavigator.tsx
// Conversations feature stack navigator - Zone D
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ConversationsStackParamList } from './types';

// Conversations screens
import { ConversationsListScreen } from '@/features/conversations/screens/ConversationsListScreen';
// Use AssistantScreen as the chat interface
import { AssistantScreen } from '@/features/assistant/screens/AssistantScreen';

const Stack = createNativeStackNavigator<ConversationsStackParamList>();

export function ConversationsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerTintColor: '#1f2937',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="ConversationList"
        component={ConversationsListScreen}
        options={{
          headerShown: false, // Has custom header
        }}
      />
      <Stack.Screen
        name="ConversationDetail"
        component={AssistantScreen}
        options={{
          title: 'AI Chat',
        }}
      />
    </Stack.Navigator>
  );
}
