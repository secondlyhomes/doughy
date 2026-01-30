// src/features/rental-properties/components/RoomsList.tsx
// List of rooms for a property (from rental_rooms table)
// Shows name, rate, and current occupancy status

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  BedDouble,
  Plus,
  ChevronRight,
  Bath,
  DoorOpen,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FONT_SIZES } from '@/constants/design-tokens';
import { Badge, Button } from '@/components/ui';
import { Room, RoomStatus } from '@/stores/rental-rooms-store';

interface RoomsListProps {
  rooms: Room[];
  isLoading?: boolean;
  onRoomPress?: (room: Room) => void;
  onAddRoom?: () => void;
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Get status badge variant and label
function getStatusBadge(status: RoomStatus): {
  label: string;
  variant: 'success' | 'destructive' | 'warning' | 'secondary';
} {
  switch (status) {
    case 'available':
      return { label: 'Available', variant: 'success' };
    case 'occupied':
      return { label: 'Occupied', variant: 'destructive' };
    case 'maintenance':
      return { label: 'Maintenance', variant: 'warning' };
    case 'unavailable':
      return { label: 'Unavailable', variant: 'secondary' };
    default:
      return { label: status, variant: 'secondary' };
  }
}

interface RoomCardProps {
  room: Room;
  onPress?: () => void;
}

function RoomCard({ room, onPress }: RoomCardProps) {
  const colors = useThemeColors();
  const statusBadge = getStatusBadge(room.status);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="p-3 rounded-xl mb-2"
      style={{ backgroundColor: colors.card }}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          {/* Room Name */}
          <View className="flex-row items-center gap-2">
            <BedDouble size={18} color={colors.primary} />
            <Text
              style={{
                color: colors.foreground,
                fontSize: FONT_SIZES.base,
                fontWeight: '600',
              }}
              numberOfLines={1}
            >
              {room.name}
            </Text>
          </View>

          {/* Room Details */}
          <View className="flex-row items-center gap-3 mt-2">
            {/* Monthly Rate */}
            <Text
              style={{
                color: colors.success,
                fontSize: FONT_SIZES.sm,
                fontWeight: '600',
              }}
            >
              {formatCurrency(room.monthly_rate)}/mo
            </Text>

            {/* Private Bath indicator */}
            {room.is_private_bath && (
              <View className="flex-row items-center gap-1">
                <Bath size={12} color={colors.mutedForeground} />
                <Text
                  style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.xs }}
                >
                  Private Bath
                </Text>
              </View>
            )}

            {/* Private Entrance indicator */}
            {room.is_private_entrance && (
              <View className="flex-row items-center gap-1">
                <DoorOpen size={12} color={colors.mutedForeground} />
                <Text
                  style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.xs }}
                >
                  Private Entry
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Status Badge & Chevron */}
        <View className="flex-row items-center gap-2">
          <Badge variant={statusBadge.variant} size="sm">
            {statusBadge.label}
          </Badge>
          {onPress && <ChevronRight size={18} color={colors.mutedForeground} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function RoomsList({
  rooms,
  isLoading,
  onRoomPress,
  onAddRoom,
}: RoomsListProps) {
  const colors = useThemeColors();

  // Calculate occupancy stats
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length;
  const availableRooms = rooms.filter((r) => r.status === 'available').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  return (
    <View>
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text
            style={{
              color: colors.foreground,
              fontSize: FONT_SIZES.lg,
              fontWeight: '600',
            }}
          >
            Rooms
          </Text>
          {totalRooms > 0 && (
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: FONT_SIZES.sm,
                marginTop: 2,
              }}
            >
              {occupiedRooms}/{totalRooms} occupied ({occupancyRate}%)
            </Text>
          )}
        </View>

        {onAddRoom && (
          <Button
            variant="outline"
            size="sm"
            onPress={onAddRoom}
            className="flex-row items-center gap-1"
          >
            <Plus size={14} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: FONT_SIZES.sm, fontWeight: '500' }}>
              Add Room
            </Text>
          </Button>
        )}
      </View>

      {/* Loading State */}
      {isLoading && (
        <View className="py-8 items-center">
          <Text style={{ color: colors.mutedForeground }}>Loading rooms...</Text>
        </View>
      )}

      {/* Empty State */}
      {!isLoading && rooms.length === 0 && (
        <View
          className="py-8 items-center rounded-xl"
          style={{ backgroundColor: colors.muted }}
        >
          <BedDouble size={32} color={colors.mutedForeground} />
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: FONT_SIZES.sm,
              marginTop: 8,
            }}
          >
            No rooms configured
          </Text>
          {onAddRoom && (
            <Button
              variant="outline"
              size="sm"
              onPress={onAddRoom}
              className="mt-4"
            >
              Add First Room
            </Button>
          )}
        </View>
      )}

      {/* Rooms List */}
      {!isLoading && rooms.length > 0 && (
        <View>
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onPress={onRoomPress ? () => onRoomPress(room) : undefined}
            />
          ))}
        </View>
      )}

      {/* Summary Stats */}
      {!isLoading && rooms.length > 0 && (
        <View
          className="flex-row justify-around py-3 mt-2 rounded-xl"
          style={{ backgroundColor: colors.muted }}
        >
          <View className="items-center">
            <Text
              style={{
                color: colors.success,
                fontSize: FONT_SIZES.lg,
                fontWeight: '700',
              }}
            >
              {availableRooms}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES['2xs'] }}>
              Available
            </Text>
          </View>
          <View className="items-center">
            <Text
              style={{
                color: colors.destructive,
                fontSize: FONT_SIZES.lg,
                fontWeight: '700',
              }}
            >
              {occupiedRooms}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES['2xs'] }}>
              Occupied
            </Text>
          </View>
          <View className="items-center">
            <Text
              style={{
                color:
                  occupancyRate >= 80
                    ? colors.success
                    : occupancyRate >= 50
                    ? colors.warning
                    : colors.mutedForeground,
                fontSize: FONT_SIZES.lg,
                fontWeight: '700',
              }}
            >
              {occupancyRate}%
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES['2xs'] }}>
              Occupancy
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

export default RoomsList;
