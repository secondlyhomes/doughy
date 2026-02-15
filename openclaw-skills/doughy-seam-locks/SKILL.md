# Doughy Seam Locks Skill

## Purpose

Smart lock integration via [Seam API](https://docs.seam.co/latest). Enables landlords to:
- Connect smart locks from multiple brands (August, Yale, Schlage, Kwikset, etc.)
- Auto-generate access codes for confirmed bookings
- Send codes to guests via AI responder
- Remote lock/unlock
- Audit trail of all lock operations

## Supported Brands

Via Seam's unified API:
- August
- Yale (Home/Assure)
- Schlage
- Kwikset
- Igloo
- Nuki
- Wyze
- TTLock
- SmartThings-connected locks

## Architecture

```
                    ┌─────────────────────────────────────┐
                    │         SEAM API                    │
                    │  Unified Smart Lock Interface       │
                    │  https://connect.getseam.com        │
                    └─────────────────┬───────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE EDGE FUNCTION                   │
│                       seam-locks                            │
│                                                             │
│  Actions:                                                   │
│  - list_devices      - sync_devices                         │
│  - lock/unlock       - get_connect_webview                  │
│  - create/delete_access_code                                │
└─────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE TABLES                          │
│                                                             │
│  seam_connected_devices  - User's connected locks           │
│  seam_access_codes       - Codes for bookings/guests        │
│  seam_lock_events        - Audit log                        │
│  seam_workspaces         - Seam workspace per user          │
└─────────────────────────────────────────────────────────────┘
```

## Actions

### GET_CONNECT_WEBVIEW
Opens Seam's Connect Webview for users to connect their smart lock accounts.

**Request:**
```json
{
  "action": "get_connect_webview"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://connect.getseam.com/connect_webviews/view?...",
  "webview_id": "cwv_..."
}
```

### SYNC_DEVICES
Syncs all connected devices from Seam to local database.

**Request:**
```json
{
  "action": "sync_devices"
}
```

**Response:**
```json
{
  "success": true,
  "synced": 3,
  "devices": [
    {
      "id": "uuid",
      "device_name": "Front Door Lock",
      "manufacturer": "August",
      "model": "August Wi-Fi Smart Lock",
      "is_online": true,
      "battery_level": 85
    }
  ]
}
```

### LIST_DEVICES
List all connected smart locks.

**Request:**
```json
{
  "action": "list_devices"
}
```

### GET_DEVICE
Get details and fresh status for a specific device.

**Request:**
```json
{
  "action": "get_device",
  "device_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "device": {
    "id": "uuid",
    "device_name": "Front Door Lock",
    "is_online": true,
    "is_locked": true,
    "battery_level": 85,
    "property": {
      "name": "Ocean View Condo",
      "address": "123 Beach Dr"
    }
  }
}
```

### LOCK
Remotely lock a door.

**Request:**
```json
{
  "action": "lock",
  "device_id": "uuid"
}
```

### UNLOCK
Remotely unlock a door.

**Request:**
```json
{
  "action": "unlock",
  "device_id": "uuid"
}
```

### CREATE_ACCESS_CODE
Create an access code for a guest or booking.

**Request:**
```json
{
  "action": "create_access_code",
  "device_id": "uuid",
  "booking_id": "uuid",
  "payload": {
    "code": "123456",
    "name": "Sarah Johnson - Jan 15-22",
    "starts_at": "2026-01-15T15:00:00Z",
    "ends_at": "2026-01-22T11:00:00Z",
    "code_type": "time_bound"
  }
}
```

**Response:**
```json
{
  "success": true,
  "access_code": {
    "id": "uuid",
    "code": "123456",
    "name": "Sarah Johnson - Jan 15-22",
    "status": "set",
    "starts_at": "2026-01-15T15:00:00Z",
    "ends_at": "2026-01-22T11:00:00Z"
  }
}
```

### DELETE_ACCESS_CODE
Remove an access code.

**Request:**
```json
{
  "action": "delete_access_code",
  "access_code_id": "uuid"
}
```

### LIST_ACCESS_CODES
List all access codes (optionally filtered by device).

**Request:**
```json
{
  "action": "list_access_codes",
  "device_id": "uuid"
}
```

## Auto-Generated Codes

When a booking is confirmed (`status = 'confirmed'`), a database trigger automatically:

1. Finds a connected lock for the property
2. Generates a random 6-digit code
3. Creates an access code record with:
   - `starts_at`: Check-in date at 3 PM
   - `ends_at`: Check-out date at 11 AM
   - `status`: 'pending'

The `seam-locks` function then picks up pending codes and programs them to the actual lock via Seam API.

## AI Responder Integration

The AI responder can include lock codes in welcome messages:

```typescript
// In ai-responder, when generating confirmed booking response:
const accessCode = await getBookingAccessCode(bookingId);
if (accessCode) {
  responseContext.lockCode = accessCode.code;
  responseContext.lockInstructions = `Your door code is: ${accessCode.code}`;
}
```

**Welcome Message Template:**
```
Hi {first_name}!

Your booking at {property_name} is confirmed for {check_in_date} - {check_out_date}.

🔐 Door Code: {lock_code}
(Valid from 3 PM on check-in to 11 AM on check-out)

Check-in Instructions:
1. Use the keypad on the front door
2. Enter your code: {lock_code}
3. Turn the handle to enter

Let me know if you have any questions!
```

## Security Considerations

1. **Code Generation**: Random 6-digit codes, unique per booking
2. **Time-Bound**: Codes only work during booking window
3. **Audit Trail**: All lock operations logged to `seam_lock_events`
4. **RLS**: Users can only see/manage their own devices and codes
5. **Automatic Expiry**: Codes auto-expire after checkout time

## Event Types

Logged to `seam_lock_events`:

| Event Type | Description |
|------------|-------------|
| `locked` | Door was locked |
| `unlocked` | Door was unlocked |
| `code_used` | Access code was used to enter |
| `code_created` | New access code programmed |
| `code_deleted` | Access code removed |
| `tamper` | Tamper alert from device |
| `battery_low` | Battery level critical |

## Webhook Events (Future)

Seam can send webhooks for lock events:

```json
{
  "event_type": "device.low_battery",
  "device_id": "...",
  "event_payload": {
    "battery_level": 15
  }
}
```

Planned webhook handlers:
- `device.low_battery` → Push notification to landlord
- `access_code.entry_detected` → Log guest arrival
- `device.disconnected` → Alert landlord

## Environment Variables

```
SEAM_API_KEY=seam_...     # Seam API key
```

## Testing

### Seam Sandbox

Seam provides sandbox virtual devices for testing:

```bash
# Create test access code
curl -X POST https://your-project.supabase.co/functions/v1/seam-locks \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create_access_code",
    "device_id": "sandbox-device-id",
    "payload": {
      "code": "123456",
      "name": "Test Code",
      "code_type": "ongoing"
    }
  }'
```

## Database Schema

### seam_connected_devices

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner |
| seam_device_id | TEXT | Seam's device ID |
| device_name | TEXT | Display name |
| device_type | TEXT | 'lock', etc. |
| manufacturer | TEXT | August, Yale, etc. |
| property_id | UUID | Linked property |
| is_online | BOOLEAN | Connection status |
| battery_level | NUMERIC | Battery % |
| capabilities | JSONB | Supported features |

### seam_access_codes

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| device_id | UUID | Which lock |
| booking_id | UUID | Associated booking |
| code | TEXT | The door code |
| name | TEXT | "Guest Name - Dates" |
| code_type | TEXT | 'ongoing', 'time_bound' |
| starts_at | TIMESTAMPTZ | When code activates |
| ends_at | TIMESTAMPTZ | When code expires |
| status | TEXT | 'setting', 'set', 'removed' |
| sent_to_guest | BOOLEAN | Was code sent? |

## Mobile App Integration

The Doughy mobile app can:

1. **Device List Screen**: Show all connected locks with status
2. **Quick Actions**: Lock/unlock buttons
3. **Access Code Manager**: Create, view, delete codes
4. **Event History**: See who entered and when
5. **Battery Alerts**: Push notification when low

## Setup Flow

1. User goes to Settings → Integrations → Smart Locks
2. Clicks "Connect Smart Lock"
3. Opens Seam Connect Webview
4. User logs into their lock brand account
5. Authorizes Seam to access devices
6. Redirects back to app
7. App calls `sync_devices` to import locks
8. User assigns locks to properties

---

**Last Updated:** January 28, 2026

Sources:
- [Seam Smart Locks Guide](https://docs.seam.co/latest/capability-guides/smart-locks)
- [Seam API Documentation](https://docs.seam.co/latest)
- [Seam Getting Started](https://docs.seam.co/latest/device-and-system-integration-guides/get-started-with-smartlocks-api)
