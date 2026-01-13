/**
 * PropertyDetailScreen
 *
 * Detailed view of a single property with tabbed navigation for different sections:
 * Overview, Analysis, Comps, Financing, Repairs, and Documents.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Edit2, Trash2, MoreHorizontal } from 'lucide-react-native';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import {
  PropertyHeader,
  PropertyQuickStats,
  PropertyOverviewTab,
  PropertyAnalysisTab,
  PropertyCompsTab,
  PropertyFinancingTab,
  PropertyRepairsTab,
  PropertyDocsTab,
  PropertyActionsSheet,
} from '../components';
import { useProperty, usePropertyMutations } from '../hooks/useProperties';

type RootStackParamList = {
  PropertyList: undefined;
  PropertyDetail: { id: string };
  EditProperty: { id: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PropertyDetail'>;
type PropertyDetailRouteProp = RouteProp<RootStackParamList, 'PropertyDetail'>;

const TAB_IDS = {
  OVERVIEW: 'overview',
  ANALYSIS: 'analysis',
  COMPS: 'comps',
  FINANCING: 'financing',
  REPAIRS: 'repairs',
  DOCS: 'docs',
} as const;

export function PropertyDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PropertyDetailRouteProp>();
  const { id: propertyId } = route.params;

  const { property, isLoading, error, refetch } = useProperty(propertyId);
  const { deleteProperty, isLoading: isDeleting } = usePropertyMutations();

  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(TAB_IDS.OVERVIEW);
  const [showActionsSheet, setShowActionsSheet] = useState(false);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleEdit = useCallback(() => {
    navigation.navigate('EditProperty', { id: propertyId });
  }, [navigation, propertyId]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Property',
      'Are you sure you want to delete this property? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteProperty(propertyId);
            if (success) {
              navigation.goBack();
            } else {
              Alert.alert('Error', 'Failed to delete property. Please try again.');
            }
          },
        },
      ]
    );
  }, [deleteProperty, propertyId, navigation]);

  const handleShare = useCallback(() => {
    setShowActionsSheet(true);
  }, []);

  const handleMore = useCallback(() => {
    setShowActionsSheet(true);
  }, []);

  const handleStatusChange = useCallback(() => {
    refetch();
  }, [refetch]);

  const toggleFavorite = useCallback(() => {
    setIsFavorite(prev => !prev);
    // TODO: Persist favorite status
  }, []);


  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" className="text-primary" />
        <Text className="text-muted-foreground mt-4">Loading property...</Text>
      </View>
    );
  }

  if (error || !property) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-4">
        <Text className="text-destructive text-center mb-4">
          {error?.message || 'Property not found'}
        </Text>
        <TouchableOpacity onPress={handleBack} className="bg-primary px-4 py-2 rounded-lg">
          <Text className="text-primary-foreground font-medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#6366f1" />
        }
        stickyHeaderIndices={[1]} // Make tabs sticky
      >
        {/* Property Header with Image and Basic Info */}
        <PropertyHeader
          property={property}
          onBack={handleBack}
          onShare={handleShare}
          onFavorite={toggleFavorite}
          onMore={handleMore}
          isFavorite={isFavorite}
        />

        {/* Tabs Navigation - Sticky */}
        <View className="bg-background px-4 pt-2 pb-0">
          <PropertyQuickStats property={property} />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TabsList className="flex-row bg-muted">
                <TabsTrigger value={TAB_IDS.OVERVIEW}>Overview</TabsTrigger>
                <TabsTrigger value={TAB_IDS.ANALYSIS}>Analysis</TabsTrigger>
                <TabsTrigger value={TAB_IDS.COMPS}>Comps</TabsTrigger>
                <TabsTrigger value={TAB_IDS.FINANCING}>Financing</TabsTrigger>
                <TabsTrigger value={TAB_IDS.REPAIRS}>Repairs</TabsTrigger>
                <TabsTrigger value={TAB_IDS.DOCS}>Docs</TabsTrigger>
              </TabsList>
            </ScrollView>
          </Tabs>
        </View>

        {/* Tab Content */}
        <View className="px-4 pb-24">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value={TAB_IDS.OVERVIEW}>
              <PropertyOverviewTab property={property} />
            </TabsContent>

            <TabsContent value={TAB_IDS.ANALYSIS}>
              <PropertyAnalysisTab property={property} />
            </TabsContent>

            <TabsContent value={TAB_IDS.COMPS}>
              <PropertyCompsTab property={property} onPropertyUpdate={refetch} />
            </TabsContent>

            <TabsContent value={TAB_IDS.FINANCING}>
              <PropertyFinancingTab property={property} />
            </TabsContent>

            <TabsContent value={TAB_IDS.REPAIRS}>
              <PropertyRepairsTab property={property} onPropertyUpdate={refetch} />
            </TabsContent>

            <TabsContent value={TAB_IDS.DOCS}>
              <PropertyDocsTab property={property} />
            </TabsContent>
          </Tabs>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="flex-row gap-3 p-4 bg-background border-t border-border">
        <TouchableOpacity
          onPress={handleEdit}
          className="flex-1 bg-primary py-3 rounded-xl flex-row items-center justify-center"
        >
          <Edit2 size={20} color="white" />
          <Text className="text-primary-foreground font-semibold ml-2">Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowActionsSheet(true)}
          className="bg-muted py-3 px-4 rounded-xl"
        >
          <MoreHorizontal size={20} className="text-foreground" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDelete}
          disabled={isDeleting}
          className="bg-destructive py-3 px-4 rounded-xl"
        >
          {isDeleting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Trash2 size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>

      {/* Property Actions Sheet */}
      <PropertyActionsSheet
        property={property}
        isOpen={showActionsSheet}
        onClose={() => setShowActionsSheet(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
      />
    </View>
  );
}
