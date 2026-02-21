/**
 * Default Connections — canonical source of truth for connection metadata
 *
 * Used to initialize new users and as fallback when DB is unavailable.
 */

export type DefaultConnection = {
  service: string
  name: string
  status: string
  summary: string
  permissions: Record<string, Record<string, boolean>>
  config?: Record<string, unknown>
}

export const DEFAULT_CONNECTIONS: DefaultConnection[] = [
  {
    service: 'doughy', name: 'Doughy', status: 'connected',
    summary: 'CRM access for leads, deals, properties, and tenant management.',
    permissions: {
      'Real Estate Investor': {
        read_leads: true, read_deals: true, read_properties: true, read_documents: true,
        draft_messages: true, send_messages: false, update_lead_status: false,
        update_deal_stage: false, create_new_leads: false, delete_records: false,
      },
      'Landlord': {
        read_bookings: true, read_maintenance: true, read_tenants: true,
        draft_messages: true, send_messages: false, dispatch_vendors: false,
        create_maintenance_req: false, delete_records: false,
      },
    },
  },
  {
    service: 'whatsapp', name: 'WhatsApp', status: 'connected',
    summary: 'Receive drafts, briefings, and approval requests via WhatsApp.',
    permissions: {
      'Messages': { receive_claw: true, receive_drafts: true, receive_briefings: true, receive_approvals: true },
    },
  },
  {
    service: 'discord', name: 'Discord', status: 'connected',
    summary: 'Receive notifications and drafts in your Discord channels.',
    permissions: {
      'Channels': { receive_claw: true, receive_drafts: true, receive_briefings: true },
    },
  },
  {
    service: 'bland', name: 'Bland AI', status: 'connected',
    summary: 'AI-powered phone calls for lead follow-up and scheduling.',
    permissions: {
      'Calls': { view_logs: true, make_calls: false },
    },
    config: {
      bland: {
        maxCallsPerDay: 10,
        maxSpendPerDayCents: 2000,
        queueDelaySeconds: 30,
        voice: 'nat',
        language: 'en-US',
      },
    },
  },
  {
    service: 'sms', name: 'SMS (Twilio)', status: 'warning',
    summary: 'SMS messaging via Twilio. Verification pending.',
    permissions: {
      'Messages': { read_sms: true, send_sms: false },
    },
  },
  { service: 'slack', name: 'Slack', status: 'disconnected', summary: 'Team notifications and approvals via Slack.', permissions: {} },
  { service: 'hubspot', name: 'HubSpot', status: 'disconnected', summary: 'Sync contacts and deals with HubSpot CRM.', permissions: {} },
  { service: 'gmail', name: 'Gmail', status: 'disconnected', summary: 'Draft and send emails on your behalf.', permissions: {} },
]
