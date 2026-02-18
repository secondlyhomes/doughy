// src/features/smart-home/types/index.ts
// Type definitions for smart home / Seam integration

/** Device types supported */
export type SmartDeviceType = 'lock' | 'thermostat' | 'sensor' | 'other';

/** Device brand */
export type SmartDeviceBrand = 'schlage' | 'yale' | 'august' | 'kwikset' | 'other';

/** Device connection status */
export type DeviceConnectionStatus = 'online' | 'offline' | 'unknown';

/** Lock state */
export type LockState = 'locked' | 'unlocked' | 'unknown';

/** Access code status */
export type AccessCodeStatus = 'active' | 'expired' | 'scheduled' | 'revoked';

/** Smart device record */
export interface SmartDevice {
  id: string;
  user_id: string;
  property_id: string;
  seam_device_id: string;
  name: string;
  device_type: SmartDeviceType;
  brand: SmartDeviceBrand;
  model?: string;
  location?: string;
  connection_status: DeviceConnectionStatus;
  lock_state?: LockState;
  battery_level?: number;
  last_seen_at?: string;
  capabilities?: DeviceCapabilities;
  created_at: string;
  updated_at: string;
}

/** Device capabilities */
export interface DeviceCapabilities {
  canLock: boolean;
  canUnlock: boolean;
  canCreateAccessCode: boolean;
  hasKeypad: boolean;
  hasBattery: boolean;
}

/** Access code record */
export interface AccessCode {
  id: string;
  user_id: string;
  device_id: string;
  seam_access_code_id?: string;
  booking_id?: string;
  code: string;
  name: string;
  status: AccessCodeStatus;
  starts_at?: string;
  ends_at?: string;
  created_at: string;
  updated_at: string;
}

/** Access code with relations */
export interface AccessCodeWithRelations extends AccessCode {
  device?: SmartDevice;
  booking?: {
    id: string;
    contact?: {
      first_name: string;
      last_name: string;
    };
    start_date: string;
    end_date: string;
  };
}

/** Create access code input */
export interface CreateAccessCodeInput {
  device_id: string;
  booking_id?: string;
  name: string;
  code?: string; // Auto-generate if not provided
  starts_at?: string;
  ends_at?: string;
}

/** Device action result */
export interface DeviceActionResult {
  success: boolean;
  action: 'lock' | 'unlock';
  device_id: string;
  error?: string;
}

/** Smart home summary for a property */
export interface SmartHomeSummary {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  lockedDevices: number;
  unlockedDevices: number;
  lowBatteryDevices: number;
  activeAccessCodes: number;
}

/** Device status configuration */
export interface DeviceStatusConfig {
  label: string;
  color: 'success' | 'destructive' | 'warning' | 'muted';
}

export const DEVICE_CONNECTION_STATUS_CONFIG: Record<DeviceConnectionStatus, DeviceStatusConfig> = {
  online: { label: 'Online', color: 'success' },
  offline: { label: 'Offline', color: 'destructive' },
  unknown: { label: 'Unknown', color: 'muted' },
};

export const LOCK_STATE_CONFIG: Record<LockState, DeviceStatusConfig> = {
  locked: { label: 'Locked', color: 'success' },
  unlocked: { label: 'Unlocked', color: 'warning' },
  unknown: { label: 'Unknown', color: 'muted' },
};

export const DEVICE_BRAND_CONFIG: Record<SmartDeviceBrand, { label: string; icon: string }> = {
  schlage: { label: 'Schlage', icon: 'lock' },
  yale: { label: 'Yale', icon: 'lock' },
  august: { label: 'August', icon: 'lock' },
  kwikset: { label: 'Kwikset', icon: 'lock' },
  other: { label: 'Other', icon: 'lock' },
};
