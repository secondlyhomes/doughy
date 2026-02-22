// src/features/campaigns/components/MetaOAuthSection.tsx
// Facebook/Instagram OAuth connection for Meta DM campaigns

import React, { useCallback } from 'react';
import { View, Text, Alert, Linking } from 'react-native';
import { Button, LoadingSpinner } from '@/components/ui';
import {
  Facebook,
  Instagram,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { MetaDMCredentials } from '../types';

export function MetaOAuthSection() {
  const colors = useThemeColors();
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  // Fetch existing credentials
  const { data: metaCredentials, isLoading } = useQuery({
    queryKey: ['meta-credentials', user?.id],
    queryFn: async (): Promise<MetaDMCredentials | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('integration_meta_credentials')
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
        .from('integration_meta_credentials')
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
