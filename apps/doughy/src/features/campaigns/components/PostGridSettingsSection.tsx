// src/features/campaigns/components/PostGridSettingsSection.tsx
// PostGrid return address configuration for direct mail campaigns

import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { Input, Button, LoadingSpinner } from '@/components/ui';
import { Send, CheckCircle, XCircle } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { PostGridCredentials } from '../types';

export function PostGridSettingsSection() {
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
        .from('integration_postgrid_credentials')
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
          .from('integration_postgrid_credentials')
          .update(settings as Record<string, unknown>)
          .eq('id', postgridSettings.id);
        if (error) throw error;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from('integration_postgrid_credentials')
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
