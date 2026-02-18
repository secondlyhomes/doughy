// src/features/campaigns/screens/CampaignBuilderScreen.tsx
// Testing imports

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ThemedSafeAreaView, ThemedView } from '@/components';
import {
  Input,
  Select,
  Button,
  TAB_BAR_SAFE_PADDING,
} from '@/components/ui';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Trash2,
  MessageSquare,
  Mail,
  Phone,
  Send,
  Instagram,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

import {
  useCreateCampaign,
  useCreateCampaignStep,
  useUpdateCampaign,
} from '../hooks/useCampaigns';
import type { DripLeadType, DripChannel, MailPieceType } from '../types';
import { LEAD_TYPE_CONFIG, CHANNEL_CONFIG, MAIL_PIECE_CONFIG } from '../types';

export function CampaignBuilderScreen() {
  return (
    <View>
      <Text>Campaign Builder - Testing imports</Text>
    </View>
  );
}

export default CampaignBuilderScreen;
