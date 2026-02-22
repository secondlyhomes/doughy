// src/features/teams/screens/team-settings-helpers.tsx
// Role display helpers for team settings

import React from 'react';
import { Crown, Shield } from 'lucide-react-native';

export const getRoleIcon = (role: string, colors: { warning: string; primary: string }) => {
  switch (role) {
    case 'owner':
      return <Crown size={14} color={colors.warning} />;
    case 'admin':
      return <Shield size={14} color={colors.primary} />;
    default:
      return null;
  }
};

export const getRoleLabel = (role: string) => {
  switch (role) {
    case 'owner':
      return 'Owner';
    case 'admin':
      return 'Admin';
    default:
      return 'Member';
  }
};
