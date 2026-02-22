// src/features/rental-properties/screens/rental-property-detail/PropertyTabContent.tsx
// Renders the active tab content for the property detail screen

import React from 'react';
import { RoomsList } from '../../components/RoomsList';
import { InventoryPreview, type InventoryItem } from '@/features/property-inventory';
import { OverviewTab } from './OverviewTab';
import { FinancialsTab } from './FinancialsTab';
import { ListingsTab } from './ListingsTab';
import type { TabKey } from './detail-types';
import type { RentalProperty } from '../../types';
import type { Room } from '@/stores/rental-rooms-store';

export interface PropertyTabContentProps {
  activeTab: TabKey;
  property: RentalProperty;
  propertyId: string;
  // Overview
  maintenanceCount: number;
  vendorCount: number;
  nextTurnover?: string;
  bookingsCount: number;
  isLoadingHubCounts: boolean;
  onOpenMap: () => void;
  // Rooms
  rooms: Room[];
  isLoadingRooms: boolean;
  onRoomPress: (room: { id: string }) => void;
  onAddRoom: () => void;
  // Inventory
  inventoryItems: InventoryItem[];
  inventoryCount: number;
  isLoadingInventoryItems: boolean;
  onInventorySeeAll: () => void;
  onInventoryItemPress: (item: { id: string }) => void;
}

export function PropertyTabContent({
  activeTab,
  property,
  propertyId,
  maintenanceCount,
  vendorCount,
  nextTurnover,
  bookingsCount,
  isLoadingHubCounts,
  onOpenMap,
  rooms,
  isLoadingRooms,
  onRoomPress,
  onAddRoom,
  inventoryItems,
  inventoryCount,
  isLoadingInventoryItems,
  onInventorySeeAll,
  onInventoryItemPress,
}: PropertyTabContentProps) {
  switch (activeTab) {
    case 'overview':
      return (
        <OverviewTab
          property={property}
          propertyId={propertyId}
          maintenanceCount={maintenanceCount}
          vendorCount={vendorCount}
          nextTurnover={nextTurnover}
          bookingsCount={bookingsCount}
          isLoadingHubCounts={isLoadingHubCounts}
          onOpenMap={onOpenMap}
        />
      );
    case 'financials':
      return <FinancialsTab property={property} />;
    case 'rooms':
      return (
        <RoomsList
          rooms={rooms}
          isLoading={isLoadingRooms}
          onRoomPress={onRoomPress}
          onAddRoom={onAddRoom}
        />
      );
    case 'inventory':
      return (
        <InventoryPreview
          items={inventoryItems}
          totalCount={inventoryCount}
          isLoading={isLoadingInventoryItems}
          onSeeAll={onInventorySeeAll}
          onItemPress={onInventoryItemPress}
        />
      );
    case 'listings':
      return <ListingsTab property={property} />;
    default:
      return null;
  }
}
