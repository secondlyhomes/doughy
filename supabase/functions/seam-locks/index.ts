/**
 * Seam Smart Locks Edge Function
 *
 * Manages smart lock operations via Seam API:
 * - Connect devices
 * - Create/delete access codes
 * - Lock/unlock remotely
 * - Sync device status
 *
 * @see https://docs.seam.co/latest
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, handleCors, addCorsHeaders } from "../_shared/cors.ts";

// =============================================================================
// Types
// =============================================================================

type SeamAction =
  | 'list_devices'
  | 'get_device'
  | 'lock'
  | 'unlock'
  | 'create_access_code'
  | 'delete_access_code'
  | 'list_access_codes'
  | 'sync_devices'
  | 'get_connect_webview';

interface SeamRequest {
  action: SeamAction;
  device_id?: string;
  access_code_id?: string;
  booking_id?: string;
  property_id?: string;
  payload?: {
    code?: string;
    name?: string;
    starts_at?: string;
    ends_at?: string;
    code_type?: 'ongoing' | 'time_bound';
  };
}

interface SeamDevice {
  device_id: string;
  device_type: string;
  display_name: string;
  manufacturer?: string;
  model?: string;
  capabilities_supported: string[];
  properties: {
    online: boolean;
    battery?: { level: number };
    locked?: boolean;
  };
}

interface SeamAccessCode {
  access_code_id: string;
  code: string;
  name: string;
  type: string;
  status: string;
  starts_at?: string;
  ends_at?: string;
}

// =============================================================================
// Seam API Client
// =============================================================================

class SeamClient {
  private apiKey: string;
  private baseUrl = 'https://connect.getseam.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string, method = 'GET', body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Seam API error: ${error}`);
    }

    return response.json();
  }

  async listDevices(): Promise<SeamDevice[]> {
    const result = await this.request<{ devices: SeamDevice[] }>('/devices/list', 'POST');
    return result.devices;
  }

  async getDevice(deviceId: string): Promise<SeamDevice> {
    const result = await this.request<{ device: SeamDevice }>('/devices/get', 'POST', {
      device_id: deviceId,
    });
    return result.device;
  }

  async lockDoor(deviceId: string): Promise<{ action_attempt: { status: string } }> {
    return this.request('/locks/lock_door', 'POST', { device_id: deviceId });
  }

  async unlockDoor(deviceId: string): Promise<{ action_attempt: { status: string } }> {
    return this.request('/locks/unlock_door', 'POST', { device_id: deviceId });
  }

  async createAccessCode(
    deviceId: string,
    code: string,
    name: string,
    options?: { starts_at?: string; ends_at?: string; type?: string }
  ): Promise<SeamAccessCode> {
    const body: Record<string, unknown> = {
      device_id: deviceId,
      code,
      name,
    };

    if (options?.starts_at) body.starts_at = options.starts_at;
    if (options?.ends_at) body.ends_at = options.ends_at;
    if (options?.type === 'ongoing') {
      delete body.starts_at;
      delete body.ends_at;
    }

    const result = await this.request<{ access_code: SeamAccessCode }>(
      '/access_codes/create',
      'POST',
      body
    );
    return result.access_code;
  }

  async deleteAccessCode(accessCodeId: string): Promise<void> {
    await this.request('/access_codes/delete', 'POST', {
      access_code_id: accessCodeId,
    });
  }

  async listAccessCodes(deviceId: string): Promise<SeamAccessCode[]> {
    const result = await this.request<{ access_codes: SeamAccessCode[] }>(
      '/access_codes/list',
      'POST',
      { device_id: deviceId }
    );
    return result.access_codes;
  }

  async createConnectWebview(redirectUri?: string): Promise<{ url: string; connect_webview_id: string }> {
    const result = await this.request<{
      connect_webview: { url: string; connect_webview_id: string }
    }>('/connect_webviews/create', 'POST', {
      accepted_providers: ['august', 'yale', 'schlage', 'kwikset', 'igloo', 'nuki', 'wyze', 'ttlock'],
      custom_redirect_url: redirectUri,
    });
    return result.connect_webview;
  }
}

// =============================================================================
// Action Handlers
// =============================================================================

async function handleListDevices(
  supabase: SupabaseClient,
  seam: SeamClient,
  userId: string
): Promise<{ success: boolean; devices: unknown[] }> {
  // Get devices from our database
  const { data: devices, error } = await supabase
    .from('seam_connected_devices')
    .select('*, rental_properties(name, address)')
    .eq('user_id', userId)
    .order('device_name');

  if (error) throw new Error(`Database error: ${error.message}`);

  return { success: true, devices: devices || [] };
}

async function handleGetDevice(
  supabase: SupabaseClient,
  seam: SeamClient,
  userId: string,
  deviceId: string
): Promise<{ success: boolean; device: unknown }> {
  // Get from our database first
  const { data: device, error } = await supabase
    .from('seam_connected_devices')
    .select('*, rental_properties(name, address)')
    .eq('id', deviceId)
    .eq('user_id', userId)
    .single();

  if (error || !device) {
    throw new Error('Device not found');
  }

  // Fetch fresh status from Seam
  try {
    const seamDevice = await seam.getDevice(device.seam_device_id);

    // Update our database with fresh status
    await supabase
      .from('seam_connected_devices')
      .update({
        is_online: seamDevice.properties.online,
        battery_level: seamDevice.properties.battery?.level,
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', deviceId);

    return {
      success: true,
      device: {
        ...device,
        is_online: seamDevice.properties.online,
        is_locked: seamDevice.properties.locked,
        battery_level: seamDevice.properties.battery?.level,
      },
    };
  } catch {
    // Return cached data if Seam API fails
    return { success: true, device };
  }
}

async function handleLock(
  supabase: SupabaseClient,
  seam: SeamClient,
  userId: string,
  deviceId: string
): Promise<{ success: boolean; message: string }> {
  // Get device
  const { data: device, error } = await supabase
    .from('seam_connected_devices')
    .select('seam_device_id')
    .eq('id', deviceId)
    .eq('user_id', userId)
    .single();

  if (error || !device) {
    throw new Error('Device not found');
  }

  // Lock via Seam
  const result = await seam.lockDoor(device.seam_device_id);

  // Log event
  await supabase.rpc('log_lock_event', {
    p_user_id: userId,
    p_device_id: deviceId,
    p_event_type: 'locked',
    p_triggered_by: 'user',
    p_details: { seam_status: result.action_attempt.status },
  });

  return { success: true, message: 'Lock command sent' };
}

async function handleUnlock(
  supabase: SupabaseClient,
  seam: SeamClient,
  userId: string,
  deviceId: string
): Promise<{ success: boolean; message: string }> {
  // Get device
  const { data: device, error } = await supabase
    .from('seam_connected_devices')
    .select('seam_device_id')
    .eq('id', deviceId)
    .eq('user_id', userId)
    .single();

  if (error || !device) {
    throw new Error('Device not found');
  }

  // Unlock via Seam
  const result = await seam.unlockDoor(device.seam_device_id);

  // Log event
  await supabase.rpc('log_lock_event', {
    p_user_id: userId,
    p_device_id: deviceId,
    p_event_type: 'unlocked',
    p_triggered_by: 'user',
    p_details: { seam_status: result.action_attempt.status },
  });

  return { success: true, message: 'Unlock command sent' };
}

async function handleCreateAccessCode(
  supabase: SupabaseClient,
  seam: SeamClient,
  userId: string,
  deviceId: string,
  payload: SeamRequest['payload'],
  bookingId?: string
): Promise<{ success: boolean; access_code: unknown }> {
  // Get device
  const { data: device, error } = await supabase
    .from('seam_connected_devices')
    .select('seam_device_id')
    .eq('id', deviceId)
    .eq('user_id', userId)
    .single();

  if (error || !device) {
    throw new Error('Device not found');
  }

  // Generate code if not provided
  const code = payload?.code || Math.floor(100000 + Math.random() * 900000).toString();
  const name = payload?.name || `Code-${Date.now()}`;

  // Create in Seam
  const seamCode = await seam.createAccessCode(
    device.seam_device_id,
    code,
    name,
    {
      starts_at: payload?.starts_at,
      ends_at: payload?.ends_at,
      type: payload?.code_type,
    }
  );

  // Get contact_id from booking if applicable
  let contactId: string | null = null;
  if (bookingId) {
    const { data: booking } = await supabase
      .from('rental_bookings')
      .select('contact_id')
      .eq('id', bookingId)
      .single();
    contactId = booking?.contact_id || null;
  }

  // Store in our database
  const { data: accessCode, error: insertError } = await supabase
    .from('seam_access_codes')
    .insert({
      user_id: userId,
      device_id: deviceId,
      booking_id: bookingId || null,
      contact_id: contactId,
      seam_access_code_id: seamCode.access_code_id,
      code: seamCode.code,
      name: seamCode.name,
      code_type: seamCode.type === 'ongoing' ? 'ongoing' : 'time_bound',
      starts_at: seamCode.starts_at,
      ends_at: seamCode.ends_at,
      status: seamCode.status === 'set' ? 'set' : 'setting',
    })
    .select()
    .single();

  if (insertError) throw new Error(`Database error: ${insertError.message}`);

  // Log event
  await supabase.rpc('log_lock_event', {
    p_user_id: userId,
    p_device_id: deviceId,
    p_event_type: 'code_created',
    p_triggered_by: 'user',
    p_access_code_id: accessCode.id,
    p_details: { code_name: name },
  });

  return { success: true, access_code: accessCode };
}

async function handleDeleteAccessCode(
  supabase: SupabaseClient,
  seam: SeamClient,
  userId: string,
  accessCodeId: string
): Promise<{ success: boolean; message: string }> {
  // Get access code
  const { data: code, error } = await supabase
    .from('seam_access_codes')
    .select('*, seam_connected_devices(seam_device_id)')
    .eq('id', accessCodeId)
    .eq('user_id', userId)
    .single();

  if (error || !code) {
    throw new Error('Access code not found');
  }

  // Delete from Seam
  if (code.seam_access_code_id) {
    await seam.deleteAccessCode(code.seam_access_code_id);
  }

  // Update status in our database
  await supabase
    .from('seam_access_codes')
    .update({ status: 'removed', updated_at: new Date().toISOString() })
    .eq('id', accessCodeId);

  // Log event
  await supabase.rpc('log_lock_event', {
    p_user_id: userId,
    p_device_id: code.device_id,
    p_event_type: 'code_deleted',
    p_triggered_by: 'user',
    p_access_code_id: accessCodeId,
    p_details: { code_name: code.name },
  });

  return { success: true, message: 'Access code deleted' };
}

async function handleListAccessCodes(
  supabase: SupabaseClient,
  userId: string,
  deviceId?: string
): Promise<{ success: boolean; access_codes: unknown[] }> {
  let query = supabase
    .from('seam_access_codes')
    .select('*, seam_connected_devices(device_name), rental_bookings(check_in_date, check_out_date), crm_contacts(first_name, last_name)')
    .eq('user_id', userId)
    .neq('status', 'removed')
    .order('created_at', { ascending: false });

  if (deviceId) {
    query = query.eq('device_id', deviceId);
  }

  const { data: codes, error } = await query;

  if (error) throw new Error(`Database error: ${error.message}`);

  return { success: true, access_codes: codes || [] };
}

async function handleSyncDevices(
  supabase: SupabaseClient,
  seam: SeamClient,
  userId: string
): Promise<{ success: boolean; synced: number; devices: unknown[] }> {
  // Get all devices from Seam
  const seamDevices = await seam.listDevices();

  const syncedDevices = [];

  for (const device of seamDevices) {
    if (device.device_type !== 'lock') continue;

    // Upsert into our database
    const { data, error } = await supabase
      .from('seam_connected_devices')
      .upsert(
        {
          user_id: userId,
          seam_device_id: device.device_id,
          device_name: device.display_name,
          device_type: device.device_type,
          manufacturer: device.manufacturer,
          model: device.model,
          capabilities: device.capabilities_supported,
          is_online: device.properties.online,
          battery_level: device.properties.battery?.level,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,seam_device_id' }
      )
      .select()
      .single();

    if (!error && data) {
      syncedDevices.push(data);
    }
  }

  return {
    success: true,
    synced: syncedDevices.length,
    devices: syncedDevices,
  };
}

async function handleGetConnectWebview(
  seam: SeamClient
): Promise<{ success: boolean; url: string; webview_id: string }> {
  const result = await seam.createConnectWebview();

  return {
    success: true,
    url: result.url,
    webview_id: result.connect_webview_id,
  };
}

// =============================================================================
// Main Handler
// =============================================================================

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    // Try new SUPABASE_SECRET_KEY first, fall back to legacy SUPABASE_SERVICE_ROLE_KEY
    const supabaseSecretKey = Deno.env.get('SUPABASE_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const seamApiKey = Deno.env.get('SEAM_API_KEY');

    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error('Missing Supabase configuration');
    }

    if (!seamApiKey) {
      throw new Error('Missing Seam API key');
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey);
    const seam = new SeamClient(seamApiKey);

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Invalid or expired token' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    const userId = user.id;

    // Parse request
    const body: SeamRequest = await req.json();
    const { action, device_id, access_code_id, booking_id, payload } = body;

    if (!action) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Missing action' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    let result: unknown;

    switch (action) {
      case 'list_devices':
        result = await handleListDevices(supabase, seam, userId);
        break;

      case 'get_device':
        if (!device_id) throw new Error('device_id required');
        result = await handleGetDevice(supabase, seam, userId, device_id);
        break;

      case 'lock':
        if (!device_id) throw new Error('device_id required');
        result = await handleLock(supabase, seam, userId, device_id);
        break;

      case 'unlock':
        if (!device_id) throw new Error('device_id required');
        result = await handleUnlock(supabase, seam, userId, device_id);
        break;

      case 'create_access_code':
        if (!device_id) throw new Error('device_id required');
        result = await handleCreateAccessCode(supabase, seam, userId, device_id, payload, booking_id);
        break;

      case 'delete_access_code':
        if (!access_code_id) throw new Error('access_code_id required');
        result = await handleDeleteAccessCode(supabase, seam, userId, access_code_id);
        break;

      case 'list_access_codes':
        result = await handleListAccessCodes(supabase, userId, device_id);
        break;

      case 'sync_devices':
        result = await handleSyncDevices(supabase, seam, userId);
        break;

      case 'get_connect_webview':
        result = await handleGetConnectWebview(seam);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return addCorsHeaders(
      new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
      req
    );
  } catch (error) {
    console.error('Seam locks error:', error);
    return addCorsHeaders(
      new Response(
        JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  }
});
