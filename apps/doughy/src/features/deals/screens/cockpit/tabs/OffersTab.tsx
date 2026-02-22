// src/features/deals/screens/cockpit/tabs/OffersTab.tsx
// Offers tab content for Deal Cockpit

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight, FileText } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import type { Deal } from '../../../types';

interface OffersTabProps {
  deal: Deal;
  onOfferPress: () => void;
}

export function OffersTab({ deal, onOfferPress }: OffersTabProps) {
  const colors = useThemeColors();

  // Get offer status for badge
  const getOfferStatus = useMemo(() => {
    if (!deal?.offers || deal.offers.length === 0)
      return { label: 'Create', color: undefined };
    const latestOffer = deal.offers[0];
    switch (latestOffer.status) {
      case 'sent':
        return { label: 'Sent', color: colors.info };
      case 'countered':
        return { label: 'Countered', color: colors.warning };
      case 'accepted':
        return { label: 'Accepted', color: colors.success };
      case 'rejected':
        return { label: 'Rejected', color: colors.destructive };
      default:
        return { label: 'Draft', color: undefined };
    }
  }, [deal?.offers, colors]);

  return (
    <>
      {/* Offer Package Card */}
      <TouchableOpacity
        onPress={onOfferPress}
        className="rounded-xl p-4 mb-3"
        style={{ backgroundColor: colors.card }}
      >
        <View className="flex-row items-center">
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}
          >
            <FileText size={20} color={colors.primary} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text
                className="text-base font-semibold"
                style={{ color: colors.foreground }}
              >
                Offer Package
              </Text>
              {getOfferStatus.label && (
                <View
                  className="ml-2 px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor:
                      getOfferStatus.color ||
                      withOpacity(colors.primary, 'light'),
                  }}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{
                      color: getOfferStatus.color
                        ? colors.primaryForeground
                        : colors.primary,
                    }}
                  >
                    {getOfferStatus.label}
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              {deal.offers?.length
                ? `${deal.offers.length} offer(s) created`
                : 'Create and send offers'}
            </Text>
          </View>
          <ChevronRight size={20} color={colors.mutedForeground} />
        </View>
      </TouchableOpacity>

      {/* Offer History */}
      {deal.offers && deal.offers.length > 0 && (
        <View className="mt-4">
          <Text
            className="text-sm font-medium mb-2"
            style={{ color: colors.mutedForeground }}
          >
            OFFER HISTORY
          </Text>
          {deal.offers.map((offer, index) => (
            <View
              key={offer.id || index}
              className="p-3 rounded-lg mb-2"
              style={{ backgroundColor: colors.card }}
            >
              <Text style={{ color: colors.foreground }}>
                Offer #{index + 1}: ${offer.offer_amount?.toLocaleString() || 'N/A'}
              </Text>
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                Status: {offer.status || 'Draft'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </>
  );
}
