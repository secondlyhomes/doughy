// Lead Card Component - React Native
// Converted from web app lead card components

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  Star,
  Phone,
  Mail,
  Building2,
  ChevronRight,
  MapPin
} from 'lucide-react-native';

// Zone A UI Components
import { Card, Badge } from '@/components/ui';

import { Lead } from '../types';

interface LeadCardProps {
  lead: Lead;
  onPress: () => void;
}

export function LeadCard({ lead, onPress }: LeadCardProps) {
  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'new': return 'bg-green-500';
      case 'active': return 'bg-blue-500';
      case 'follow-up': return 'bg-amber-500';
      case 'prospect': return 'bg-purple-500';
      case 'inactive': return 'bg-gray-400';
      case 'do_not_contact': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const formatStatus = (status: string | undefined) => {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <Card className="p-4">
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
      >
      {/* Header Row */}
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-base font-semibold text-foreground flex-1" numberOfLines={1}>
              {lead.name || 'Unnamed Lead'}
            </Text>
            {lead.starred && (
              <Star size={16} color="#f59e0b" fill="#f59e0b" />
            )}
          </View>
          {lead.company && (
            <View className="flex-row items-center mt-1">
              <Building2 size={12} color="#6b7280" />
              <Text className="text-sm text-muted-foreground ml-1" numberOfLines={1}>
                {lead.company}
              </Text>
            </View>
          )}
        </View>
        <ChevronRight size={20} color="#9ca3af" />
      </View>

      {/* Contact Info */}
      <View className="mb-3">
        {lead.email && (
          <View className="flex-row items-center mb-1">
            <Mail size={12} color="#6b7280" />
            <Text className="text-sm text-muted-foreground ml-2" numberOfLines={1}>
              {lead.email}
            </Text>
          </View>
        )}
        {lead.phone && (
          <View className="flex-row items-center mb-1">
            <Phone size={12} color="#6b7280" />
            <Text className="text-sm text-muted-foreground ml-2">
              {lead.phone}
            </Text>
          </View>
        )}
        {(lead.city || lead.state) && (
          <View className="flex-row items-center">
            <MapPin size={12} color="#6b7280" />
            <Text className="text-sm text-muted-foreground ml-2" numberOfLines={1}>
              {[lead.city, lead.state].filter(Boolean).join(', ')}
            </Text>
          </View>
        )}
      </View>

        {/* Footer Row */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            {/* Status Badge */}
            <Badge
              variant={
                lead.status === 'new' ? 'default' :
                lead.status === 'active' ? 'secondary' :
                lead.status === 'follow-up' ? 'outline' :
                'default'
              }
            >
              {formatStatus(lead.status)}
            </Badge>

            {/* Score */}
            {lead.score !== undefined && (
              <View className="flex-row items-center">
                <Text className={`text-sm font-medium ${getScoreColor(lead.score)}`}>
                  {lead.score}
                </Text>
                <Text className="text-xs text-muted-foreground ml-0.5">pts</Text>
              </View>
            )}
          </View>

          {/* Tags */}
          {lead.tags && lead.tags.length > 0 && (
            <View className="flex-row items-center gap-1">
              {lead.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="outline" size="sm">
                  {tag}
                </Badge>
              ))}
              {lead.tags.length > 2 && (
                <Text className="text-xs text-muted-foreground">
                  +{lead.tags.length - 2}
                </Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Card>
  );
}

export default LeadCard;
