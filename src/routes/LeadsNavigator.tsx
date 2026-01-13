// src/routes/LeadsNavigator.tsx
// Leads feature stack navigator - Zone D
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LeadsStackParamList } from './types';

// Leads screens
import { LeadsListScreen } from '@/features/leads/screens/LeadsListScreen';
import { LeadDetailScreen } from '@/features/leads/screens/LeadDetailScreen';
import { AddLeadScreen } from '@/features/leads/screens/AddLeadScreen';
import { EditLeadScreen } from '@/features/leads/screens/EditLeadScreen';

const Stack = createNativeStackNavigator<LeadsStackParamList>();

export function LeadsNavigator() {
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
        name="LeadList"
        component={LeadsListScreen}
        options={{
          title: 'Leads',
        }}
      />
      <Stack.Screen
        name="LeadDetail"
        component={LeadDetailScreen}
        options={{
          headerShown: false, // Has custom header
        }}
      />
      <Stack.Screen
        name="AddLead"
        component={AddLeadScreen}
        options={{
          title: 'Add Lead',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="LeadEdit"
        component={EditLeadScreen}
        options={{
          title: 'Edit Lead',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}
