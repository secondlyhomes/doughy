// src/stores/smart-home-store.ts
// Zustand store for smart home / Seam integration

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type {
  SmartDevice,
  AccessCode,
  AccessCodeWithRelations,
  CreateAccessCodeInput,
  DeviceActionResult,
  SmartHomeSummary,
  LockState,
} from '@/features/smart-home/types';

interface SmartHomeState {
  // State
  devices: SmartDevice[];
  accessCodes: AccessCodeWithRelations[];
  isLoading: boolean;
  error: string | null;

  // Actions - Devices
  fetchDevicesByProperty: (propertyId: string) => Promise<SmartDevice[]>;
  fetchDeviceById: (deviceId: string) => Promise<SmartDevice | null>;
  syncDevicesFromSeam: (propertyId: string) => Promise<void>;
  refreshDeviceStatus: (deviceId: string) => Promise<SmartDevice | null>;

  // Actions - Lock Control
  lockDevice: (deviceId: string) => Promise<DeviceActionResult>;
  unlockDevice: (deviceId: string) => Promise<DeviceActionResult>;

  // Actions - Access Codes
  fetchAccessCodesByDevice: (deviceId: string) => Promise<AccessCodeWithRelations[]>;
  fetchAccessCodesByProperty: (propertyId: string) => Promise<AccessCodeWithRelations[]>;
  createAccessCode: (input: CreateAccessCodeInput) => Promise<AccessCode>;
  revokeAccessCode: (accessCodeId: string) => Promise<void>;

  // Helpers
  getPropertySummary: (propertyId: string) => SmartHomeSummary;
  clearError: () => void;
  reset: () => void;
}

// Generate a random 4-6 digit code
function generateAccessCode(): string {
  const length = Math.random() > 0.5 ? 6 : 4;
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

export const useSmartHomeStore = create<SmartHomeState>((set, get) => ({
  devices: [],
  accessCodes: [],
  isLoading: false,
  error: null,

  fetchDevicesByProperty: async (propertyId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .schema('integrations')
        .from('seam_connected_devices')
        .select('*')
        .eq('property_id', propertyId)
        .order('name');

      if (error) throw error;

      const devices = (data || []) as SmartDevice[];
      set({ devices, isLoading: false });
      return devices;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch devices';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  fetchDeviceById: async (deviceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .schema('integrations')
        .from('seam_connected_devices')
        .select('*')
        .eq('id', deviceId)
        .single();

      if (error) throw error;

      set({ isLoading: false });
      return data as SmartDevice;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch device';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  syncDevicesFromSeam: async (propertyId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Call edge function to sync devices from Seam
      const { data, error } = await supabase.functions.invoke('seam-sync-devices', {
        body: { propertyId },
      });

      if (error) throw error;

      // Refresh local device list
      await get().fetchDevicesByProperty(propertyId);

      set({ isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sync devices from Seam';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  refreshDeviceStatus: async (deviceId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Call edge function to get current device status from Seam
      const { data, error } = await supabase.functions.invoke('seam-device-status', {
        body: { deviceId },
      });

      if (error) throw error;

      // Update local state
      const updatedDevice = data as SmartDevice;
      set((state) => ({
        devices: state.devices.map((d) =>
          d.id === deviceId ? { ...d, ...updatedDevice } : d
        ),
        isLoading: false,
      }));

      return updatedDevice;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to refresh device status';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  lockDevice: async (deviceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.functions.invoke('seam-lock-action', {
        body: { deviceId, action: 'lock' },
      });

      if (error) throw error;

      // Update local state
      set((state) => ({
        devices: state.devices.map((d) =>
          d.id === deviceId ? { ...d, lock_state: 'locked' as LockState } : d
        ),
        isLoading: false,
      }));

      return { success: true, action: 'lock', device_id: deviceId } as DeviceActionResult;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to lock device';
      set({ error: message, isLoading: false });
      return { success: false, action: 'lock', device_id: deviceId, error: message } as DeviceActionResult;
    }
  },

  unlockDevice: async (deviceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.functions.invoke('seam-lock-action', {
        body: { deviceId, action: 'unlock' },
      });

      if (error) throw error;

      // Update local state
      set((state) => ({
        devices: state.devices.map((d) =>
          d.id === deviceId ? { ...d, lock_state: 'unlocked' as LockState } : d
        ),
        isLoading: false,
      }));

      return { success: true, action: 'unlock', device_id: deviceId } as DeviceActionResult;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unlock device';
      set({ error: message, isLoading: false });
      return { success: false, action: 'unlock', device_id: deviceId, error: message } as DeviceActionResult;
    }
  },

  fetchAccessCodesByDevice: async (deviceId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Use RPC function for cross-schema join
      const { getAccessCodesWithBooking, mapAccessCodeRPC } = await import('@/lib/rpc');
      const data = await getAccessCodesWithBooking({ deviceId });

      const codes = data.map(mapAccessCodeRPC) as AccessCodeWithRelations[];
      set({ accessCodes: codes, isLoading: false });
      return codes;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch access codes';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  fetchAccessCodesByProperty: async (propertyId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Use RPC function for cross-schema join (handles the device lookup internally)
      const { getAccessCodesByProperty, mapAccessCodeRPC } = await import('@/lib/rpc');
      const data = await getAccessCodesByProperty(propertyId);

      const codes = data.map(mapAccessCodeRPC) as AccessCodeWithRelations[];
      set({ accessCodes: codes, isLoading: false });
      return codes;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch access codes';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  createAccessCode: async (input: CreateAccessCodeInput) => {
    set({ isLoading: true, error: null });
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const code = input.code || generateAccessCode();

      // Create in local database
      const { data, error } = await supabase
        .schema('integrations')
        .from('seam_access_codes')
        .insert({
          user_id: userData.user.id,
          device_id: input.device_id,
          booking_id: input.booking_id || null,
          code,
          name: input.name,
          status: input.starts_at ? 'scheduled' : 'active',
          starts_at: input.starts_at || null,
          ends_at: input.ends_at || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Also create in Seam via edge function - this MUST succeed for the code to work on the lock
      const { error: seamError } = await supabase.functions.invoke('seam-create-access-code', {
        body: {
          accessCodeId: data.id,
          deviceId: input.device_id,
          code,
          name: input.name,
          startsAt: input.starts_at,
          endsAt: input.ends_at,
        },
      });

      if (seamError) {
        // CRITICAL: The code exists in our DB but NOT on the actual lock.
        // Delete the local record to prevent user from thinking the code works.
        await supabase
          .schema('integrations')
          .from('seam_access_codes')
          .delete()
          .eq('id', data.id);

        console.error('[SmartHome] Failed to sync access code to Seam - local record deleted:', seamError);
        throw new Error('Failed to create access code on smart lock. Please try again.');
      }

      // Refresh access codes list
      await get().fetchAccessCodesByDevice(input.device_id);

      set({ isLoading: false });
      return data as AccessCode;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create access code';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  revokeAccessCode: async (accessCodeId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Get the code first
      const { data: codeData } = await supabase
        .schema('integrations')
        .from('seam_access_codes')
        .select('*, device:seam_connected_devices!integrations_seam_access_codes_device_id_fkey(id)')
        .eq('id', accessCodeId)
        .single();

      // Update status to revoked
      const { error } = await supabase
        .schema('integrations')
        .from('seam_access_codes')
        .update({ status: 'revoked', updated_at: new Date().toISOString() })
        .eq('id', accessCodeId);

      if (error) throw error;

      // Also revoke in Seam if it has a seam_access_code_id
      // CRITICAL: If this fails, the code is marked revoked locally but still works on the lock
      if (codeData?.seam_access_code_id) {
        const { error: seamError } = await supabase.functions.invoke('seam-revoke-access-code', {
          body: { seamAccessCodeId: codeData.seam_access_code_id },
        });

        if (seamError) {
          // Revert the local status change since we couldn't revoke on the lock
          await supabase
            .schema('integrations')
            .from('seam_access_codes')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', accessCodeId);

          console.error('[SmartHome] SECURITY: Failed to revoke access code in Seam - local status reverted:', seamError);
          throw new Error('Failed to revoke access code on smart lock. The code is still active. Please try again.');
        }
      }

      // Update local state
      set((state) => ({
        accessCodes: state.accessCodes.map((c) =>
          c.id === accessCodeId ? { ...c, status: 'revoked' } : c
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to revoke access code';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  getPropertySummary: (propertyId: string) => {
    const devices = get().devices.filter((d) => d.property_id === propertyId);
    const accessCodes = get().accessCodes;

    return {
      totalDevices: devices.length,
      onlineDevices: devices.filter((d) => d.connection_status === 'online').length,
      offlineDevices: devices.filter((d) => d.connection_status === 'offline').length,
      lockedDevices: devices.filter((d) => d.lock_state === 'locked').length,
      unlockedDevices: devices.filter((d) => d.lock_state === 'unlocked').length,
      lowBatteryDevices: devices.filter((d) => (d.battery_level || 100) < 20).length,
      activeAccessCodes: accessCodes.filter((c) => c.status === 'active').length,
    };
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      devices: [],
      accessCodes: [],
      isLoading: false,
      error: null,
    }),
}));

// Selectors
export const selectDevicesByProperty = (propertyId: string) => (state: SmartHomeState) =>
  state.devices.filter((d) => d.property_id === propertyId);

export const selectOnlineDevices = (propertyId: string) => (state: SmartHomeState) =>
  state.devices.filter((d) => d.property_id === propertyId && d.connection_status === 'online');

export const selectActiveAccessCodes = (state: SmartHomeState) =>
  state.accessCodes.filter((c) => c.status === 'active');
