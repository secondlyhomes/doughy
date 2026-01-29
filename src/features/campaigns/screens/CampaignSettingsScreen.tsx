// src/features/campaigns/screens/CampaignSettingsScreen.tsx
// Campaign Settings - PostGrid, Meta OAuth, opt-out management

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { ThemedSafeAreaView } from '@/components';
import {
  Input,
  Button,
  TAB_BAR_SAFE_PADDING,
  LoadingSpinner,
} from '@/components/ui';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Mail,
  Send,
  Facebook,
  Instagram,
  CheckCircle,
  XCircle,
  ExternalLink,
  CreditCard,
  AlertTriangle,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMailCredits, formatCredits } from '../hooks/useMailCredits';
import type { PostGridCredentials, MetaDMCredentials } from '../types';

// =============================================================================
// PostGrid Settings Section
// =============================================================================

function PostGridSettingsSection() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [returnName, setReturnName] = useState('');
  const [returnCompany, setReturnCompany] = useState('');
  const [returnAddress1, setReturnAddress1] = useState('');
  const [returnAddress2, setReturnAddress2] = useState('');
  const [returnCity, setReturnCity] = useState('');
  const [returnState, setReturnState] = useState('');
  const [returnZip, setReturnZip] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Fetch existing settings
  const { data: postgridSettings, isLoading } = useQuery({
    queryKey: ['postgrid-settings', user?.id],
    queryFn: async (): Promise<PostGridCredentials | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('postgrid_credentials')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const typed = data as unknown as PostGridCredentials | null;
      if (typed) {
        setReturnName(typed.return_name || '');
        setReturnCompany(typed.return_company || '');
        setReturnAddress1(typed.return_address_line1 || '');
        setReturnAddress2(typed.return_address_line2 || '');
        setReturnCity(typed.return_city || '');
        setReturnState(typed.return_state || '');
        setReturnZip(typed.return_zip || '');
      }

      return typed;
    },
    enabled: !!user?.id,
  });

  const saveSettings = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const settings = {
        user_id: user.id,
        return_name: returnName,
        return_company: returnCompany,
        return_address_line1: returnAddress1,
        return_address_line2: returnAddress2,
        return_city: returnCity,
        return_state: returnState,
        return_zip: returnZip,
        is_active: true,
      };

      if (postgridSettings?.id) {
        const { error } = await supabase
          .from('postgrid_credentials')
          .update(settings as Record<string, unknown>)
          .eq('id', postgridSettings.id);
        if (error) throw error;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from('postgrid_credentials')
          .insert(settings);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postgrid-settings'] });
      setIsEditing(false);
      Alert.alert('Success', 'Return address saved');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to save settings');
    },
  });

  const isConfigured = !!postgridSettings?.return_address_line1;

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Send size={20} color={colors.primary} />
          <Text className="ml-2 text-lg font-semibold" style={{ color: colors.foreground }}>
            Direct Mail (PostGrid)
          </Text>
        </View>
        {isConfigured ? (
          <CheckCircle size={20} color={colors.success} />
        ) : (
          <XCircle size={20} color={colors.mutedForeground} />
        )}
      </View>

      <View className="rounded-xl p-4" style={{ backgroundColor: colors.card }}>
        {isLoading ? (
          <LoadingSpinner />
        ) : isEditing || !isConfigured ? (
          <>
            <Text className="text-sm mb-3" style={{ color: colors.mutedForeground }}>
              Set your return address for direct mail pieces.
            </Text>

            <Input
              label="Your Name"
              value={returnName}
              onChangeText={setReturnName}
              placeholder="John Doe"
              className="mb-2"
            />

            <Input
              label="Company (Optional)"
              value={returnCompany}
              onChangeText={setReturnCompany}
              placeholder="ABC Investments"
              className="mb-2"
            />

            <Input
              label="Address Line 1"
              value={returnAddress1}
              onChangeText={setReturnAddress1}
              placeholder="123 Main St"
              className="mb-2"
            />

            <Input
              label="Address Line 2 (Optional)"
              value={returnAddress2}
              onChangeText={setReturnAddress2}
              placeholder="Suite 100"
              className="mb-2"
            />

            <View className="flex-row gap-2 mb-4">
              <View className="flex-1">
                <Input
                  label="City"
                  value={returnCity}
                  onChangeText={setReturnCity}
                  placeholder="Miami"
                />
              </View>
              <View className="w-20">
                <Input
                  label="State"
                  value={returnState}
                  onChangeText={setReturnState}
                  placeholder="FL"
                  maxLength={2}
                />
              </View>
              <View className="w-24">
                <Input
                  label="ZIP"
                  value={returnZip}
                  onChangeText={setReturnZip}
                  placeholder="33101"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View className="flex-row gap-2">
              {isConfigured && (
                <Button
                  variant="outline"
                  onPress={() => setIsEditing(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
              <Button
                onPress={() => saveSettings.mutate()}
                disabled={!returnAddress1 || !returnCity || !returnState || !returnZip || saveSettings.isPending}
                className="flex-1"
              >
                {saveSettings.isPending ? 'Saving...' : 'Save Address'}
              </Button>
            </View>
          </>
        ) : (
          <>
            <View className="mb-3">
              <Text style={{ color: colors.foreground }}>
                {returnName}
              </Text>
              {returnCompany && (
                <Text style={{ color: colors.mutedForeground }}>
                  {returnCompany}
                </Text>
              )}
              <Text style={{ color: colors.mutedForeground }}>
                {returnAddress1}
              </Text>
              {returnAddress2 && (
                <Text style={{ color: colors.mutedForeground }}>
                  {returnAddress2}
                </Text>
              )}
              <Text style={{ color: colors.mutedForeground }}>
                {returnCity}, {returnState} {returnZip}
              </Text>
            </View>
            <Button variant="outline" onPress={() => setIsEditing(true)}>
              Edit Address
            </Button>
          </>
        )}
      </View>
    </View>
  );
}

// =============================================================================
// Meta OAuth Section
// =============================================================================

function MetaOAuthSection() {
  const colors = useThemeColors();
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  // Fetch existing credentials
  const { data: metaCredentials, isLoading } = useQuery({
    queryKey: ['meta-credentials', user?.id],
    queryFn: async (): Promise<MetaDMCredentials | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('meta_dm_credentials')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as unknown as MetaDMCredentials | null;
    },
    enabled: !!user?.id,
  });

  const disconnectMeta = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!metaCredentials?.id) throw new Error('No credentials to disconnect');

      const { error } = await supabase
        .from('meta_dm_credentials')
        .delete()
        .eq('id', metaCredentials.id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-credentials'] });
      Alert.alert('Success', 'Facebook disconnected');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to disconnect');
    },
  });

  const handleConnectFacebook = useCallback(() => {
    // Facebook OAuth flow would be handled here
    // For now, show instructions
    Alert.alert(
      'Connect Facebook',
      'To connect Facebook/Instagram DM, you need to:\n\n1. Have a Facebook Page\n2. Link your Instagram Business account\n3. Grant messaging permissions\n\nThis feature requires Facebook Business verification.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Learn More',
          onPress: () => Linking.openURL('https://developers.facebook.com/docs/messenger-platform/'),
        },
      ]
    );
  }, []);

  const isConnected = !!metaCredentials?.is_active;

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Facebook size={20} color="#1877F2" />
          <Text className="ml-2 text-lg font-semibold" style={{ color: colors.foreground }}>
            Facebook / Instagram
          </Text>
        </View>
        {isConnected ? (
          <CheckCircle size={20} color={colors.success} />
        ) : (
          <XCircle size={20} color={colors.mutedForeground} />
        )}
      </View>

      <View className="rounded-xl p-4" style={{ backgroundColor: colors.card }}>
        {isLoading ? (
          <LoadingSpinner />
        ) : isConnected ? (
          <>
            <View className="flex-row items-center mb-3">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: withOpacity('#1877F2', 'light') }}
              >
                <Facebook size={20} color="#1877F2" />
              </View>
              <View className="flex-1">
                <Text className="font-medium" style={{ color: colors.foreground }}>
                  {metaCredentials?.page_name || 'Facebook Page'}
                </Text>
                {metaCredentials?.instagram_username && (
                  <View className="flex-row items-center mt-1">
                    <Instagram size={12} color={colors.mutedForeground} />
                    <Text className="text-sm ml-1" style={{ color: colors.mutedForeground }}>
                      @{metaCredentials.instagram_username}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View className="flex-row items-center mb-3 p-2 rounded-lg" style={{ backgroundColor: colors.muted }}>
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                DMs today: {metaCredentials?.daily_dm_count || 0}/1000
              </Text>
            </View>

            <Button
              variant="outline"
              onPress={() => {
                Alert.alert(
                  'Disconnect Facebook',
                  'Are you sure you want to disconnect your Facebook Page?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Disconnect', style: 'destructive', onPress: () => disconnectMeta.mutate() },
                  ]
                );
              }}
            >
              Disconnect
            </Button>
          </>
        ) : (
          <>
            <Text className="text-sm mb-3" style={{ color: colors.mutedForeground }}>
              Connect your Facebook Page to send DMs to leads via Facebook and Instagram.
            </Text>
            <Button onPress={handleConnectFacebook}>
              <Facebook size={16} color={colors.primaryForeground} />
              <Text className="ml-2">Connect Facebook</Text>
            </Button>
          </>
        )}
      </View>
    </View>
  );
}

// =============================================================================
// Mail Credits Section
// =============================================================================

function MailCreditsSection() {
  const colors = useThemeColors();
  const router = useRouter();
  const { data: credits, isLoading } = useMailCredits();

  const isLowBalance = (credits?.balance || 0) <= (credits?.low_balance_threshold || 50);

  return (
    <View className="mb-6">
      <View className="flex-row items-center mb-3">
        <CreditCard size={20} color={colors.primary} />
        <Text className="ml-2 text-lg font-semibold" style={{ color: colors.foreground }}>
          Mail Credits
        </Text>
      </View>

      <View className="rounded-xl p-4" style={{ backgroundColor: colors.card }}>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <View className="flex-row items-center justify-between mb-3">
              <Text style={{ color: colors.mutedForeground }}>Current Balance</Text>
              <Text className="text-2xl font-bold" style={{ color: colors.foreground }}>
                {formatCredits(credits?.balance || 0)}
              </Text>
            </View>

            {isLowBalance && (
              <View
                className="flex-row items-center p-2 rounded-lg mb-3"
                style={{ backgroundColor: withOpacity(colors.warning, 'light') }}
              >
                <AlertTriangle size={16} color={colors.warning} />
                <Text className="ml-2 text-sm" style={{ color: colors.warning }}>
                  Low balance - consider purchasing more credits
                </Text>
              </View>
            )}

            <View className="flex-row gap-2">
              <Button
                onPress={() => router.push('/(tabs)/settings/mail-credits')}
                className="flex-1"
              >
                Buy Credits
              </Button>
              <Button
                variant="outline"
                onPress={() => router.push('/(tabs)/settings/mail-history')}
                className="flex-1"
              >
                History
              </Button>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

// =============================================================================
// Main Screen
// =============================================================================

export function CampaignSettingsScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b" style={{ borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>
          Campaign Settings
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}
      >
        <MailCreditsSection />
        <PostGridSettingsSection />
        <MetaOAuthSection />
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

export default CampaignSettingsScreen;
