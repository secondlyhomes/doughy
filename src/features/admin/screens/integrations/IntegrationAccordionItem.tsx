// src/features/admin/screens/integrations/IntegrationAccordionItem.tsx
// Accordion item for a single integration with API key form fields

import React from 'react';
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { ExternalLink } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/Accordion';
import { ApiKeyFormItem } from '../../components/ApiKeyFormItem';
import { KeyAgeIndicator } from '../../components/KeyAgeIndicator';
import { StatusBadge } from './StatusBadge';
import type { IntegrationHealth, ApiKeyRecord } from '../../types/integrations';
import type { IntegrationWithHealth } from './types';

export interface IntegrationAccordionItemProps {
  item: IntegrationWithHealth;
  expandedIntegration: string;
  setExpandedIntegration: (value: string) => void;
  healthStatuses: Map<string, IntegrationHealth>;
  apiKeys: Map<string, ApiKeyRecord>;
  handleHealthResult: (service: string, health: IntegrationHealth) => void;
  setApiKeyRefreshTrigger: React.Dispatch<React.SetStateAction<number>>;
  loadApiKeys: () => Promise<void>;
}

export const IntegrationAccordionItem = React.memo(function IntegrationAccordionItem({
  item,
  expandedIntegration,
  setExpandedIntegration,
  healthStatuses,
  apiKeys,
  handleHealthResult,
  setApiKeyRefreshTrigger,
  loadApiKeys,
}: IntegrationAccordionItemProps) {
  const colors = useThemeColors();
  const isExpanded = expandedIntegration === item.id;

  return (
    <View
      className="mx-4 mb-3 rounded-xl"
      style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
    >
      <Accordion
        type="single"
        collapsible
        value={isExpanded ? item.id : ''}
        onValueChange={setExpandedIntegration}
      >
        <AccordionItem value={item.id} className="border-b-0">
          <AccordionTrigger className="px-4">
            <View className="flex-row items-center flex-1 pr-2">
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-base font-semibold" style={{ color: colors.foreground }}>
                    {item.name}
                  </Text>
                  <StatusBadge status={item.overallStatus} colors={colors} />
                  {item.overallStatus !== 'not-configured' && (item.updatedAt || item.createdAt) && (
                    <KeyAgeIndicator
                      updatedAt={item.updatedAt ?? null}
                      createdAt={item.createdAt ?? null}
                      compact
                    />
                  )}
                </View>
                <Text
                  className="text-sm mt-0.5"
                  style={{ color: colors.mutedForeground }}
                  numberOfLines={1}
                >
                  {item.description}
                </Text>
              </View>
            </View>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <View className="gap-3 pt-2">
              {item.fields.map((field) => {
                const fieldKey = apiKeys.get(field.key);
                return (
                  <ApiKeyFormItem
                    key={field.key}
                    service={field.key}
                    label={field.label}
                    type={field.type}
                    required={field.required}
                    options={field.options}
                    placeholder={field.placeholder}
                    description={field.description}
                    healthStatus={healthStatuses.get(field.key)?.status}
                    updatedAt={fieldKey?.updated_at}
                    createdAt={fieldKey?.created_at}
                    showAgeIndicator={true}
                    onSaved={(healthResult) => {
                      if (healthResult) {
                        handleHealthResult(healthResult.service, healthResult);
                        if (healthResult.service !== item.service) {
                          handleHealthResult(item.service, healthResult);
                        }
                      }
                      setApiKeyRefreshTrigger((prev) => prev + 1);
                      loadApiKeys();
                    }}
                  />
                );
              })}
            </View>

            {item.docsUrl && (
              <TouchableOpacity
                className="flex-row items-center mt-3 pt-3"
                style={{ borderTopWidth: 1, borderTopColor: colors.border }}
                onPress={async () => {
                  try {
                    const canOpen = await Linking.canOpenURL(item.docsUrl!);
                    if (canOpen) {
                      await Linking.openURL(item.docsUrl!);
                    } else {
                      Alert.alert('Cannot Open', 'Unable to open the documentation link on this device.');
                    }
                  } catch (error) {
                    console.error('[IntegrationsScreen] Failed to open docs URL:', error);
                    Alert.alert('Error', 'Failed to open the documentation link.');
                  }
                }}
              >
                <ExternalLink size={14} color={colors.primary} />
                <Text className="text-sm ml-1.5 font-medium" style={{ color: colors.primary }}>
                  View Documentation
                </Text>
              </TouchableOpacity>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </View>
  );
});
