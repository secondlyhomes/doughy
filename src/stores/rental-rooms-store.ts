// src/stores/rental-rooms-store.ts
// Zustand store for Landlord platform room management
// Part of Zone 3: UI scaffolding for the Doughy architecture refactor

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

// Room status types
export type RoomStatus = 'available' | 'occupied' | 'hold' | 'maintenance' | 'unavailable';

// Room interface based on Contract A from architecture doc
export interface Room {
  id: string;
  property_id: string;
  name: string;
  description: string | null;
  size_sqft: number | null;
  has_private_bath: boolean;
  has_private_entrance: boolean;
  bed_type: string | null;
  amenities: string[];
  weekly_rate: number | null;
  monthly_rate: number;
  utilities_included: boolean;
  status: RoomStatus;
  available_date: string | null;
  current_booking_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface RentalRoomsState {
  // Data
  rooms: Room[];
  roomsByProperty: Record<string, Room[]>;

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  isSaving: boolean;

  // Error state
  error: string | null;

  // Actions
  fetchRoomsByProperty: (propertyId: string) => Promise<void>;
  fetchRoomById: (id: string) => Promise<Room | null>;
  createRoom: (data: Partial<Room>) => Promise<Room | null>;
  updateRoom: (id: string, data: Partial<Room>) => Promise<Room | null>;
  deleteRoom: (id: string) => Promise<boolean>;
  updateRoomStatus: (id: string, status: RoomStatus) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  rooms: [],
  roomsByProperty: {},
  isLoading: false,
  isRefreshing: false,
  isSaving: false,
  error: null,
};

export const useRentalRoomsStore = create<RentalRoomsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchRoomsByProperty: async (propertyId: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('rental_rooms')
            .select('*')
            .eq('property_id', propertyId)
            .order('name', { ascending: true });

          if (error) throw error;

          const rooms = (data || []) as Room[];

          set((state) => ({
            rooms: [
              ...state.rooms.filter((r) => r.property_id !== propertyId),
              ...rooms,
            ],
            roomsByProperty: {
              ...state.roomsByProperty,
              [propertyId]: rooms,
            },
            isLoading: false,
          }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch rooms';
          set({ error: message, isLoading: false });
        }
      },

      fetchRoomById: async (id: string) => {
        try {
          const { data, error } = await supabase
            .from('rental_rooms')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;

          const room = data as Room;

          // Update the room in local state
          set((state) => {
            const updatedRooms = state.rooms.map((r) => (r.id === id ? room : r));
            const propertyRooms = state.roomsByProperty[room.property_id] || [];

            return {
              rooms: updatedRooms.some((r) => r.id === id)
                ? updatedRooms
                : [...updatedRooms, room],
              roomsByProperty: {
                ...state.roomsByProperty,
                [room.property_id]: propertyRooms.some((r) => r.id === id)
                  ? propertyRooms.map((r) => (r.id === id ? room : r))
                  : [...propertyRooms, room],
              },
            };
          });

          return room;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch room';
          set({ error: message });
          return null;
        }
      },

      createRoom: async (data: Partial<Room>) => {
        set({ isSaving: true, error: null });
        try {
          const { data: newRoom, error } = await supabase
            .from('rental_rooms')
            .insert(data)
            .select()
            .single();

          if (error) throw error;

          const room = newRoom as Room;

          set((state) => ({
            rooms: [...state.rooms, room],
            roomsByProperty: {
              ...state.roomsByProperty,
              [room.property_id]: [
                ...(state.roomsByProperty[room.property_id] || []),
                room,
              ],
            },
            isSaving: false,
          }));

          return room;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create room';
          set({ error: message, isSaving: false });
          return null;
        }
      },

      updateRoom: async (id: string, data: Partial<Room>) => {
        set({ isSaving: true, error: null });
        try {
          const { data: updatedRoom, error } = await supabase
            .from('rental_rooms')
            .update(data)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          const room = updatedRoom as Room;

          set((state) => ({
            rooms: state.rooms.map((r) => (r.id === id ? room : r)),
            roomsByProperty: {
              ...state.roomsByProperty,
              [room.property_id]: (state.roomsByProperty[room.property_id] || []).map((r) =>
                r.id === id ? room : r
              ),
            },
            isSaving: false,
          }));

          return room;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update room';
          set({ error: message, isSaving: false });
          return null;
        }
      },

      deleteRoom: async (id: string) => {
        set({ isSaving: true, error: null });
        try {
          // Get the room first to know which property to update
          const room = get().rooms.find((r) => r.id === id);

          const { error } = await supabase
            .from('rental_rooms')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            rooms: state.rooms.filter((r) => r.id !== id),
            roomsByProperty: room
              ? {
                  ...state.roomsByProperty,
                  [room.property_id]: (state.roomsByProperty[room.property_id] || []).filter(
                    (r) => r.id !== id
                  ),
                }
              : state.roomsByProperty,
            isSaving: false,
          }));

          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete room';
          set({ error: message, isSaving: false });
          return false;
        }
      },

      updateRoomStatus: async (id: string, status: RoomStatus) => {
        set({ isSaving: true, error: null });
        try {
          const { error } = await supabase
            .from('rental_rooms')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id);

          if (error) throw error;

          set((state) => {
            const room = state.rooms.find((r) => r.id === id);
            if (!room) return { isSaving: false };

            const updatedRoom = { ...room, status };

            return {
              rooms: state.rooms.map((r) => (r.id === id ? updatedRoom : r)),
              roomsByProperty: {
                ...state.roomsByProperty,
                [room.property_id]: (state.roomsByProperty[room.property_id] || []).map((r) =>
                  r.id === id ? updatedRoom : r
                ),
              },
              isSaving: false,
            };
          });

          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update room status';
          set({ error: message, isSaving: false });
          return false;
        }
      },

      clearError: () => set({ error: null }),

      reset: () => set(initialState),
    }),
    {
      name: 'rental-rooms-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        rooms: state.rooms,
        roomsByProperty: state.roomsByProperty,
      }),
    }
  )
);

// Selectors
export const selectRooms = (state: RentalRoomsState) => state.rooms;
export const selectRoomsByProperty = (propertyId: string) => (state: RentalRoomsState) =>
  state.roomsByProperty[propertyId] || [];
export const selectAvailableRooms = (propertyId: string) => (state: RentalRoomsState) =>
  (state.roomsByProperty[propertyId] || []).filter((r) => r.status === 'available');
export const selectRoomById = (id: string) => (state: RentalRoomsState) =>
  state.rooms.find((r) => r.id === id);
