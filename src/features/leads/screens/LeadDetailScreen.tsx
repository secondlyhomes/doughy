// Lead Detail Screen - React Native
// Converted from web app src/features/leads/pages/LeadsDetailView.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Star,
  Phone,
  Mail,
  Building2,
  MapPin,
  Edit2,
  Trash2,
  MessageSquare,
  Calendar,
  Tag,
  FileText,
  ChevronRight
} from 'lucide-react-native';

// Zone A UI Components
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, LoadingSpinner } from '@/components/ui';

import { useLead, useUpdateLead, useDeleteLead } from '../hooks/useLeads';
import { RootStackParamList } from '@/types';

type LeadDetailRouteProp = RouteProp<RootStackParamList, 'LeadDetail'>;
type LeadDetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function LeadDetailScreen() {
  const navigation = useNavigation<LeadDetailNavigationProp>();
  const route = useRoute<LeadDetailRouteProp>();
  const { id } = route.params;

  const { lead, isLoading } = useLead(id);
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const [isDeleting, setIsDeleting] = useState(false);

  const handleCall = () => {
    if (lead?.phone) {
      Linking.openURL(`tel:${lead.phone}`);
    }
  };

  const handleEmail = () => {
    if (lead?.email) {
      Linking.openURL(`mailto:${lead.email}`);
    }
  };

  const handleToggleStar = async () => {
    if (lead) {
      await updateLead.mutateAsync({
        id: lead.id,
        data: { starred: !lead.starred }
      });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Lead',
      'Are you sure you want to delete this lead? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteLead.mutateAsync(id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete lead');
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

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

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!lead) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Lead not found</Text>
        <TouchableOpacity
          className="mt-4 bg-primary px-4 py-2 rounded-lg"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-primary-foreground">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-card border-b border-border px-4 py-3">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color="#6b7280" />
            <Text className="text-muted-foreground ml-2">Back</Text>
          </TouchableOpacity>

          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={handleToggleStar}>
              <Star
                size={24}
                color={lead.starred ? '#f59e0b' : '#9ca3af'}
                fill={lead.starred ? '#f59e0b' : 'transparent'}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('EditLead', { id: lead.id })}>
              <Edit2 size={22} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <Trash2 size={22} color="#ef4444" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Lead Header */}
        <View className="bg-card p-4 mb-4">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">
                {lead.name || 'Unnamed Lead'}
              </Text>
              {lead.company && (
                <View className="flex-row items-center mt-1">
                  <Building2 size={14} color="#6b7280" />
                  <Text className="text-muted-foreground ml-1">{lead.company}</Text>
                </View>
              )}
            </View>
            <View className={`${getStatusColor(lead.status)} px-3 py-1 rounded-full`}>
              <Text className="text-white text-sm font-medium">
                {formatStatus(lead.status)}
              </Text>
            </View>
          </View>

          {/* Score */}
          {lead.score !== undefined && (
            <View className="flex-row items-center mb-3">
              <Text className="text-sm text-muted-foreground">Lead Score:</Text>
              <View className="ml-2 bg-primary/10 px-2 py-0.5 rounded">
                <Text className="text-primary font-semibold">{lead.score}</Text>
              </View>
            </View>
          )}

          {/* Quick Actions */}
          <View className="flex-row gap-3">
            {lead.phone && (
              <TouchableOpacity
                className="flex-1 bg-primary rounded-lg py-3 flex-row items-center justify-center"
                onPress={handleCall}
              >
                <Phone size={18} color="white" />
                <Text className="text-primary-foreground font-medium ml-2">Call</Text>
              </TouchableOpacity>
            )}
            {lead.email && (
              <TouchableOpacity
                className="flex-1 bg-secondary rounded-lg py-3 flex-row items-center justify-center"
                onPress={handleEmail}
              >
                <Mail size={18} color="#1f2937" />
                <Text className="text-secondary-foreground font-medium ml-2">Email</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="flex-1 bg-muted rounded-lg py-3 flex-row items-center justify-center"
              onPress={() => {/* TODO: Open SMS */}}
            >
              <MessageSquare size={18} color="#6b7280" />
              <Text className="text-muted-foreground font-medium ml-2">SMS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Information */}
        <View className="bg-card p-4 mb-4">
          <Text className="text-lg font-semibold text-foreground mb-3">Contact Information</Text>

          {lead.email && (
            <View className="flex-row items-center py-3 border-b border-border">
              <Mail size={18} color="#6b7280" />
              <Text className="flex-1 text-foreground ml-3">{lead.email}</Text>
            </View>
          )}

          {lead.phone && (
            <View className="flex-row items-center py-3 border-b border-border">
              <Phone size={18} color="#6b7280" />
              <Text className="flex-1 text-foreground ml-3">{lead.phone}</Text>
            </View>
          )}

          {(lead.address_line_1 || lead.city || lead.state) && (
            <View className="flex-row items-start py-3">
              <MapPin size={18} color="#6b7280" />
              <View className="flex-1 ml-3">
                {lead.address_line_1 && (
                  <Text className="text-foreground">{lead.address_line_1}</Text>
                )}
                {lead.address_line_2 && (
                  <Text className="text-foreground">{lead.address_line_2}</Text>
                )}
                <Text className="text-muted-foreground">
                  {[lead.city, lead.state, lead.zip].filter(Boolean).join(', ')}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Tags */}
        {lead.tags && lead.tags.length > 0 && (
          <View className="bg-card p-4 mb-4">
            <View className="flex-row items-center mb-3">
              <Tag size={18} color="#6b7280" />
              <Text className="text-lg font-semibold text-foreground ml-2">Tags</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {lead.tags.map((tag, index) => (
                <View key={index} className="bg-secondary px-3 py-1.5 rounded-full">
                  <Text className="text-secondary-foreground text-sm">{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Notes Section */}
        <View className="bg-card p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <FileText size={18} color="#6b7280" />
              <Text className="text-lg font-semibold text-foreground ml-2">Notes</Text>
            </View>
            <TouchableOpacity>
              <Text className="text-primary text-sm">Add Note</Text>
            </TouchableOpacity>
          </View>

          {lead.notes && lead.notes.length > 0 ? (
            lead.notes.map((note, index) => (
              <View key={index} className="bg-muted rounded-lg p-3 mb-2">
                <Text className="text-foreground">{note.content}</Text>
                <Text className="text-xs text-muted-foreground mt-2">
                  {note.created_at ? new Date(note.created_at).toLocaleDateString() : ''}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-muted-foreground text-center py-4">
              No notes yet
            </Text>
          )}
        </View>

        {/* Activity Timeline */}
        <View className="bg-card p-4 mb-8">
          <View className="flex-row items-center mb-3">
            <Calendar size={18} color="#6b7280" />
            <Text className="text-lg font-semibold text-foreground ml-2">Activity</Text>
          </View>

          <View className="py-4">
            <Text className="text-muted-foreground text-center">
              Activity timeline coming soon
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default LeadDetailScreen;
