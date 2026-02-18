## Audit Logging System

Comprehensive audit logging solution for enterprise React Native applications built with Expo and Supabase.

## Overview

This audit logging system provides complete traceability of all user actions, data changes, and system events in your mobile application. It's designed to meet compliance requirements for SOC 2, ISO 27001, GDPR, HIPAA, and other regulatory frameworks.

### Key Features

- **Comprehensive Event Tracking**: Automatically log all user actions, data modifications, and system events
- **Real-time Monitoring**: Stream audit logs in real-time with Supabase Realtime
- **Compliance-Ready**: Tagged events for GDPR, HIPAA, SOC 2, and ISO 27001 compliance
- **Sensitive Data Tracking**: Specialized logging for PHI/PII access
- **Security Event Detection**: Dedicated logging for security incidents
- **Retention Policies**: Configurable data retention per organization
- **Export Capabilities**: CSV export for audits and reporting

## Architecture

### Database Schema

The audit system uses four main tables:

1. **`audit_logs`**: Main audit log table for all events
2. **`sensitive_data_access_logs`**: HIPAA/GDPR compliant PHI/PII access tracking
3. **`security_events`**: Security-specific events (login failures, breaches, etc.)
4. **`audit_retention_policies`**: Per-organization retention configuration

### Core Components

```
.examples/enterprise/audit/
├── database/
│   └── schema.sql           # Database schema and functions
├── components/
│   └── AuditLogViewer.tsx   # React Native audit log UI
├── AuditLogger.ts           # Main audit logger service
└── README.md                # This file
```

## Quick Start

### 1. Set Up Database

Apply the database schema to your Supabase project:

```bash
supabase db push < .examples/enterprise/audit/database/schema.sql
```

### 2. Initialize Audit Logger

```typescript
import { AuditLogger } from '.examples/enterprise/audit/AuditLogger'

// Initialize on app startup
const auditLogger = AuditLogger.getInstance()
```

### 3. Log Events

```typescript
// Log a task creation
await auditLogger.logTaskCreated(task)

// Log a task update
await auditLogger.logTaskUpdated(taskId, beforeState, afterState)

// Log user login
await auditLogger.logUserLogin(userId, 'password')

// Log custom event
await auditLogger.log({
  action: 'custom_action',
  resourceType: 'custom_resource',
  resourceId: 'resource-123',
  severity: 'info',
  complianceTags: ['gdpr'],
  metadata: {
    customField: 'value',
  },
})
```

### 4. Use React Hooks

```typescript
import { useAuditLog } from '.examples/enterprise/audit/AuditLogger'

function MyComponent() {
  const { logAction } = useAuditLog()

  const handleDelete = async () => {
    await deleteItem(itemId)

    logAction({
      action: 'delete',
      resourceType: 'items',
      resourceId: itemId,
      severity: 'warning',
    })
  }
}
```

### 5. View Audit Logs

```typescript
import { AuditLogViewer } from '.examples/enterprise/audit/components/AuditLogViewer'

function AuditDashboard() {
  return <AuditLogViewer />
}
```

## What to Log

### Required Events (SOC 2 / ISO 27001)

- **Authentication Events**
  - Login (successful and failed)
  - Logout
  - Password reset
  - MFA enabled/disabled
  - Session timeout

- **Authorization Events**
  - Permission granted/revoked
  - Role changed
  - Access denied

- **Data Operations**
  - Create, Read, Update, Delete (CRUD) on sensitive data
  - Data export
  - Data import
  - Bulk operations

- **Administrative Actions**
  - User creation/deletion
  - Organization changes
  - System configuration changes
  - Integration enable/disable

- **Security Events**
  - Failed login attempts (brute force detection)
  - Suspicious activity
  - Data breach attempts
  - API key rotation
  - Certificate renewal

### HIPAA-Required Events

When handling Protected Health Information (PHI):

- **All PHI Access**
  - Who accessed PHI
  - What PHI was accessed
  - When it was accessed
  - Why it was accessed (access reason)
  - From where (IP address, device)

- **PHI Modifications**
  - Changes to medical records
  - Prescription updates
  - Diagnosis modifications
  - Treatment plan changes

Use the specialized `logSensitiveAccess()` method:

```typescript
await auditLogger.logSensitiveAccess({
  dataType: 'phi',
  resourceType: 'medical_records',
  resourceId: patientId,
  fieldsAccessed: ['diagnosis', 'prescriptions'],
  accessReason: 'Patient consultation on 2025-01-15',
})
```

### GDPR-Required Events

For GDPR compliance, log:

- **Data Subject Rights**
  - Data export requests (Art. 15)
  - Data deletion requests (Art. 17)
  - Data rectification (Art. 16)
  - Processing restriction (Art. 18)

- **Consent Management**
  - Consent granted
  - Consent withdrawn
  - Consent purpose changed

- **Data Processing**
  - Automated decision-making
  - Profiling activities
  - Third-party data sharing

Tag GDPR events with compliance tag:

```typescript
await auditLogger.log({
  action: 'export',
  resourceType: 'users',
  resourceId: userId,
  complianceTags: ['gdpr'],
  metadata: {
    gdprArticle: 'Article 15 - Right to Access',
  },
})
```

## Audit Log Entry Structure

Each audit log entry contains:

```typescript
{
  id: 'uuid',                           // Unique identifier
  organization_id: 'uuid',              // Organization context
  user_id: 'uuid',                      // User who performed action

  // Action details
  action: 'create',                     // create, update, delete, etc.
  action_category: 'data',              // data, auth, security, admin, system

  // Resource information
  resource_type: 'tasks',               // Type of resource
  resource_id: 'uuid',                  // Resource identifier
  resource_name: 'Task Title',          // Human-readable name

  // Change tracking
  changes: {
    before: { /* old state */ },
    after: { /* new state */ }
  },

  // Context
  ip_address: '192.168.1.1',
  user_agent: 'Mozilla/5.0...',
  request_id: 'uuid',
  session_id: 'uuid',

  // Classification
  severity: 'info',                     // info, warning, error, critical
  compliance_tags: ['gdpr', 'hipaa'],   // Compliance framework tags

  // Additional data
  metadata: {
    app_version: '1.0.0',
    platform: 'ios',
    device: { /* device info */ }
  },

  // Timestamp
  created_at: '2025-01-15T10:30:00Z'
}
```

## Best Practices

### 1. Log Enough (But Not Too Much)

**DO:**
- Log all access to sensitive data
- Log all administrative actions
- Log security events
- Log consent changes
- Log data exports/deletions

**DON'T:**
- Log the actual sensitive data (only metadata)
- Log every single read operation on non-sensitive data
- Log UI interactions (button clicks, page views)
- Log verbose debug information in production

### 2. Use Appropriate Severity Levels

- **`info`**: Normal operations (user login, data read)
- **`warning`**: Elevated importance (permission change, data export)
- **`error`**: Failed operations (login failure, access denied)
- **`critical`**: Security incidents (breach attempt, data leak)

### 3. Provide Context

Always include relevant metadata:

```typescript
await auditLogger.log({
  action: 'delete',
  resourceType: 'tasks',
  resourceId: taskId,
  metadata: {
    deleteReason: 'User request via support ticket #12345',
    relatedTasks: [task1Id, task2Id],
    cascade: true,
  },
})
```

### 4. Batch Logging for Performance

When logging multiple events, use batch logging:

```typescript
const entries = tasks.map(task => ({
  action: 'create',
  resourceType: 'tasks',
  resourceId: task.id,
}))

await auditLogger.logBatch(entries)
```

### 5. Tag for Compliance

Always tag events relevant to compliance frameworks:

```typescript
// GDPR data export
complianceTags: ['gdpr']

// HIPAA PHI access
complianceTags: ['hipaa']

// SOC 2 security control
complianceTags: ['soc2']

// Multiple frameworks
complianceTags: ['gdpr', 'hipaa', 'soc2']
```

## Retention Policies

Configure retention policies per organization:

```sql
INSERT INTO audit_retention_policies (
  organization_id,
  general_retention_days,      -- 365 days (1 year)
  security_retention_days,     -- 730 days (2 years)
  compliance_retention_days,   -- 2555 days (7 years)
  auto_delete_enabled
) VALUES (
  'org-uuid',
  365,
  730,
  2555,
  false  -- Disable auto-delete for safety
);
```

### Industry Standards

- **GDPR**: No specific retention requirement, but data should be deleted when no longer needed
- **HIPAA**: 6 years minimum for medical records
- **SOC 2**: Typically 1-2 years for audit logs
- **PCI-DSS**: 1 year minimum, 3 months immediately accessible
- **ISO 27001**: Varies by organization's security policy

## Querying Audit Logs

### Using the Service

```typescript
const logger = AuditLogger.getInstance()

// Get recent logs
const logs = await logger.getRecentLogs(50)

// Get logs for specific user
const userLogs = await logger.getLogsByUser(userId, 100)

// Get logs for specific resource
const resourceLogs = await logger.getLogsByResource('tasks', taskId)

// Get security events
const securityEvents = await logger.getSecurityEvents(50)

// Get failed login attempts
const failedLogins = await logger.getFailedLoginAttempts(24)
```

### Using SQL (Direct Database Access)

```sql
-- Recent critical events
SELECT * FROM audit_logs
WHERE severity = 'critical'
  AND created_at > now() - interval '24 hours'
ORDER BY created_at DESC;

-- User activity summary
SELECT
  user_id,
  COUNT(*) as total_actions,
  COUNT(DISTINCT action) as unique_actions,
  MAX(created_at) as last_activity
FROM audit_logs
WHERE created_at > now() - interval '30 days'
GROUP BY user_id
ORDER BY total_actions DESC;

-- Compliance-tagged events
SELECT * FROM audit_logs
WHERE 'hipaa' = ANY(compliance_tags)
  AND created_at > now() - interval '7 days';

-- Failed login attempts by user
SELECT
  user_id,
  COUNT(*) as failed_attempts,
  MAX(occurred_at) as last_attempt
FROM security_events
WHERE event_type = 'login_failure'
  AND occurred_at > now() - interval '24 hours'
GROUP BY user_id
HAVING COUNT(*) >= 3;
```

### Using Materialized Views

The schema includes a pre-aggregated summary view:

```sql
-- Daily audit statistics
SELECT * FROM audit_log_summaries
WHERE date >= CURRENT_DATE - 30
ORDER BY date DESC;

-- Refresh the materialized view
SELECT refresh_audit_summaries();
```

## Export and Reporting

### CSV Export

The `AuditLogViewer` component includes CSV export functionality:

```typescript
// Export from UI component
<AuditLogViewer />
// User clicks "Export CSV" button
```

### Custom Export

```typescript
async function exportAuditLogs(organizationId: string, startDate: Date, endDate: Date) {
  const { data } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false })

  // Convert to CSV
  const csv = convertToCSV(data)

  // Save or share file
  await FileSystem.writeAsStringAsync(fileUri, csv)
  await Sharing.shareAsync(fileUri)
}
```

## Real-Time Monitoring

Subscribe to audit log changes for real-time monitoring:

```typescript
const subscription = supabase
  .channel('audit_logs_realtime')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'audit_logs',
      filter: `severity=eq.critical`,
    },
    (payload) => {
      // Alert on critical events
      sendSecurityAlert(payload.new)
    }
  )
  .subscribe()
```

## Security Considerations

### 1. Audit Log Integrity

Audit logs are **immutable** - they cannot be updated or deleted by normal users:

```sql
-- RLS policies prevent updates and deletes
CREATE POLICY "audit_logs_no_update" ON audit_logs FOR UPDATE USING (false);
CREATE POLICY "audit_logs_no_delete" ON audit_logs FOR DELETE USING (false);
```

### 2. Access Control

Only users with specific permissions can view audit logs:

```sql
-- Must have 'audit:read' permission
CREATE POLICY "audit_logs_select_policy" ON audit_logs FOR SELECT
USING (
  has_permission(auth.uid(), organization_id, 'audit:read')
);
```

### 3. Sensitive Data

Never log the actual sensitive data, only metadata:

```typescript
// ❌ DON'T
await auditLogger.log({
  action: 'update',
  metadata: {
    ssn: '123-45-6789',  // Don't log actual SSN
    password: 'secret',  // Don't log passwords
  },
})

// ✅ DO
await auditLogger.log({
  action: 'update',
  metadata: {
    fieldsUpdated: ['ssn', 'password'],  // Log what changed, not the values
  },
})
```

### 4. Encryption

Audit logs should be encrypted at rest (Supabase default) and in transit (TLS/SSL).

## Troubleshooting

### Audit logs not appearing

1. Check RLS policies are correctly configured
2. Verify user has correct organization_id set
3. Check that triggers are enabled on relevant tables
4. Ensure audit logger is initialized before use

### Performance issues

1. Use indexes on commonly queried columns
2. Implement pagination for large result sets
3. Use materialized views for aggregate queries
4. Consider archiving old logs to separate storage

### Missing context (IP address, device info)

1. Ensure network permissions are granted
2. Check that device info is properly initialized
3. Verify Supabase session context is available

## Compliance Checklist

### SOC 2

- [x] All administrative actions logged
- [x] All data access logged
- [x] Audit logs are immutable
- [x] Access to logs is restricted
- [x] Logs retained per policy
- [x] Security events monitored

### HIPAA

- [x] All PHI access logged with reason
- [x] Audit logs retained for 6+ years
- [x] Access logs include who, what, when, where, why
- [x] Unsuccessful access attempts logged
- [x] Emergency access logged

### GDPR

- [x] Data export events logged
- [x] Data deletion events logged
- [x] Consent changes logged
- [x] Automated decision-making logged
- [x] Third-party data sharing logged

### ISO 27001

- [x] Security events logged
- [x] Access control changes logged
- [x] Configuration changes logged
- [x] Log integrity protected
- [x] Regular log reviews possible

## Related Documentation

- [Security Best Practices](../security/README.md)
- [GDPR Compliance](../compliance/gdpr/README.md)
- [HIPAA Compliance](../compliance/hipaa/README.md)
- [Data Encryption](../encryption/README.md)

## Support

For questions or issues:
1. Check the troubleshooting section above
2. Review the example implementations
3. Consult the database schema documentation
4. File an issue in the repository

---

**Last Updated**: 2025-01-15
**Version**: 1.0.0
**Compliance**: SOC 2, ISO 27001, GDPR, HIPAA
