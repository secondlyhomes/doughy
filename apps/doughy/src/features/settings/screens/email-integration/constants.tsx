// src/features/settings/screens/email-integration/constants.ts
// Platform display information for email integration

import React from 'react';
import { Building2, Home, Plane } from 'lucide-react-native';

export const PLATFORM_INFO: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
  airbnb: { name: 'Airbnb', icon: <Home size={16} />, color: '#FF5A5F' },
  furnishedfinder: { name: 'Furnished Finder', icon: <Building2 size={16} />, color: '#4A90A4' },
  zillow: { name: 'Zillow', icon: <Building2 size={16} />, color: '#006AFF' },
  turbotenant: { name: 'TurboTenant', icon: <Building2 size={16} />, color: '#00B5AD' },
  hotpads: { name: 'HotPads', icon: <Building2 size={16} />, color: '#6B4EFF' },
  craigslist: { name: 'Craigslist', icon: <Building2 size={16} />, color: '#5A3D8A' },
  vrbo: { name: 'VRBO', icon: <Plane size={16} />, color: '#3B5998' },
};
