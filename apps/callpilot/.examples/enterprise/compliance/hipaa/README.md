## HIPAA Compliance Guide

Comprehensive guide for building HIPAA-compliant React Native mobile applications.

## Overview

The Health Insurance Portability and Accountability Act (HIPAA) establishes national standards for protecting sensitive patient health information (PHI) in the United States.

### What is HIPAA?

- **Enacted**: 1996 (Privacy Rule: 2000, Security Rule: 2003)
- **Scope**: Healthcare providers, health plans, healthcare clearinghouses, and their business associates
- **Protected Data**: Protected Health Information (PHI)
- **Penalties**: Up to $1.5 million per violation category per year

### Do You Need HIPAA Compliance?

You need HIPAA compliance if you:
- Are a covered entity (healthcare provider, health plan, clearinghouse)
- Are a business associate of a covered entity
- Store, process, or transmit PHI
- Provide services to HIPAA-covered entities involving PHI

## What is PHI?

Protected Health Information (PHI) is any information about health status, healthcare provision, or healthcare payment that can be linked to an individual.

### 18 PHI Identifiers

1. Names
2. Dates (birth, admission, discharge, death)
3. Telephone numbers
4. Fax numbers
5. Email addresses
6. Social Security numbers
7. Medical record numbers
8. Health plan beneficiary numbers
9. Account numbers
10. Certificate/license numbers
11. Vehicle identifiers
12. Device identifiers and serial numbers
13. URLs
14. IP addresses
15. Biometric identifiers (fingerprints, voiceprints)
16. Full-face photos
17. Geographic subdivisions smaller than state
18. Any other unique identifying number or code

### Implementation

```typescript
// Flag PHI fields in your data model
interface PatientRecord {
  // PHI
  name: string                    // PHI Identifier #1
  dateOfBirth: Date              // PHI Identifier #2
  ssn: string                    // PHI Identifier #6
  medicalRecordNumber: string    // PHI Identifier #7
  email: string                  // PHI Identifier #5
  phone: string                  // PHI Identifier #3

  // Also PHI (health information)
  diagnosis: string
  medications: string[]
  treatmentPlan: string

  // Not PHI (when alone)
  id: string // UUID - not PHI if can't be linked to individual
}
```

## HIPAA Rules

### 1. Privacy Rule

Establishes standards for protecting PHI.

**Key Requirements:**
- **Minimum Necessary**: Access only minimum PHI needed
- **Patient Rights**: Access, amendment, accounting of disclosures
- **Notice of Privacy Practices**: Inform patients how PHI is used
- **Authorization**: Obtain consent for uses not covered by TPO
- **Administrative Safeguards**: Policies and procedures

**Implementation:**

```typescript
// Minimum necessary - only request needed fields
async function getPatientForAppointment(patientId: string) {
  // ✅ Only fetch necessary fields
  const { data } = await supabase
    .from('patients')
    .select('id, name, dateOfBirth') // Minimum necessary
    .eq('id', patientId)
    .single()

  // ❌ Don't fetch everything
  // .select('*')

  return data
}
```

### 2. Security Rule

Establishes standards for protecting electronic PHI (ePHI).

**Three Types of Safeguards:**

#### A. Administrative Safeguards

**Required:**
- Security Management Process
- Security Personnel
- Information Access Management
- Workforce Training
- Evaluation

**Implementation:**

```typescript
// Role-based access control
enum HealthcareRole {
  PHYSICIAN = 'physician',
  NURSE = 'nurse',
  ADMIN = 'admin',
  PATIENT = 'patient',
}

const PHI_PERMISSIONS = {
  [HealthcareRole.PHYSICIAN]: ['phi:read', 'phi:write', 'phi:delete'],
  [HealthcareRole.NURSE]: ['phi:read', 'phi:write'],
  [HealthcareRole.ADMIN]: ['phi:read'],
  [HealthcareRole.PATIENT]: ['phi:read_own'],
}

async function canAccessPHI(userId: string, patientId: string): Promise<boolean> {
  const userRole = await getUserRole(userId)
  const permissions = PHI_PERMISSIONS[userRole]

  // Patients can only access their own PHI
  if (userRole === HealthcareRole.PATIENT) {
    return userId === patientId
  }

  // Healthcare providers need explicit permission
  return permissions.includes('phi:read')
}
```

#### B. Physical Safeguards

**Required:**
- Facility Access Controls
- Workstation Use
- Workstation Security
- Device and Media Controls

**Mobile App Considerations:**

```typescript
// Device security checks
async function checkDeviceSecurity(): Promise<boolean> {
  // Check if device is jailbroken/rooted
  const isJailbroken = await checkJailbreak()
  if (isJailbroken) {
    throw new Error('Cannot run on jailbroken device')
  }

  // Check if device has passcode/biometric lock
  const hasDeviceLock = await checkDeviceLock()
  if (!hasDeviceLock) {
    Alert.alert(
      'Security Required',
      'Please enable device passcode or biometric lock to use this app.'
    )
    return false
  }

  // Check for recent OS updates
  const isOSCurrent = await checkOSVersion()
  if (!isOSCurrent) {
    Alert.alert('Update Required', 'Please update your device OS.')
  }

  return true
}
```

#### C. Technical Safeguards

**Required:**
- Access Control
- Audit Controls
- Integrity Controls
- Transmission Security

**Implementation:**

```typescript
// 1. Access Control
// Unique user identification
import { supabase } from './supabase'

async function authenticateUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Log failed authentication attempt
    await logSecurityEvent('authentication_failure', { email })
    throw error
  }

  // Log successful authentication
  await logSecurityEvent('authentication_success', { userId: data.user.id })

  return data
}

// 2. Audit Controls
import { AuditLogger } from '../../audit/AuditLogger'

async function logPHIAccess(
  userId: string,
  patientId: string,
  fieldsAccessed: string[],
  reason: string
) {
  const logger = AuditLogger.getInstance()

  await logger.logSensitiveAccess({
    dataType: 'phi',
    resourceType: 'patients',
    resourceId: patientId,
    fieldsAccessed,
    accessReason: reason, // Required by HIPAA
  })
}

// 3. Integrity Controls
import { EncryptionService } from '../../encryption/EncryptionService'

async function ensureDataIntegrity(data: any): Promise<boolean> {
  const encryption = EncryptionService.getInstance()

  // Generate hash for integrity verification
  const hash = await encryption.hash(JSON.stringify(data))

  // Store hash for later verification
  await storeIntegrityHash(data.id, hash)

  return true
}

// 4. Transmission Security
// Use TLS/SSL for all network communications
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'mobile-app-hipaa',
    },
  },
  // Enforce HTTPS
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})
```

### 3. Breach Notification Rule

Requires notification of breaches affecting 500+ individuals.

**Timeline:**
- **Discovery**: As soon as possible
- **Notification**: Within 60 days
  - Affected individuals
  - HHS (Department of Health and Human Services)
  - Media (if 500+ in same state)

**Implementation:**

```typescript
interface BreachNotification {
  discoveredAt: Date
  affectedIndividuals: string[]
  breachType: string
  phiInvolved: string[]
  causeOfBreach: string
  mitigationSteps: string[]
}

async function handleDataBreach(breach: BreachNotification) {
  // 1. Log the breach
  await logSecurityEvent('data_breach', {
    discoveredAt: breach.discoveredAt,
    affectedCount: breach.affectedIndividuals.length,
    breachType: breach.breachType,
  })

  // 2. Notify affected individuals (within 60 days)
  if (breach.affectedIndividuals.length > 0) {
    await notifyAffectedIndividuals(breach)
  }

  // 3. Notify HHS if 500+ affected
  if (breach.affectedIndividuals.length >= 500) {
    await notifyHHS(breach)
  }

  // 4. Notify media if 500+ in same state
  const byState = groupByState(breach.affectedIndividuals)
  for (const [state, individuals] of Object.entries(byState)) {
    if (individuals.length >= 500) {
      await notifyMedia(state, breach)
    }
  }

  // 5. Document breach
  await documentBreach(breach)
}
```

### 4. Omnibus Rule (2013)

Extended HIPAA to business associates.

**Key Changes:**
- Business associates directly liable
- Business associate agreements (BAAs) required
- Stricter breach notification requirements
- Increased penalties

## Business Associate Agreement (BAA)

If you process PHI on behalf of a covered entity, you need a BAA.

### Required Elements

1. **Permitted Uses**: How BAG can use PHI
2. **Safeguards**: Security measures BA will implement
3. **Reporting**: Breach and security incident reporting
4. **Subcontractors**: Obtaining BAAs from subcontractors
5. **Access**: Providing PHI access to covered entity
6. **Amendment**: Supporting amendment of PHI
7. **Accounting**: Tracking disclosures
8. **Return/Destruction**: PHI return or destruction upon termination

### Supabase BAA

Supabase offers BAAs for Pro and Enterprise plans:

```typescript
// Supabase HIPAA Configuration

// 1. Sign BAA with Supabase
// Contact Supabase sales for Enterprise plan with BAA

// 2. Enable additional security features
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  db: {
    schema: 'public',
  },
})

// 3. Implement Row Level Security (RLS)
// See database schema section below
```

## Database Configuration

### Row Level Security (RLS)

**Critical**: RLS must be enabled on all PHI tables.

```sql
-- Enable RLS on patients table
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Policy: Patients can only see their own data
CREATE POLICY "patients_select_own"
  ON patients FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Healthcare providers can see patients they're treating
CREATE POLICY "providers_select_patients"
  ON patients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM care_relationships
      WHERE patient_id = patients.id
        AND provider_id = auth.uid()
        AND active = true
    )
  );

-- Policy: Only authorized providers can update
CREATE POLICY "providers_update_patients"
  ON patients FOR UPDATE
  USING (
    has_permission(auth.uid(), 'phi:write')
    AND EXISTS (
      SELECT 1 FROM care_relationships
      WHERE patient_id = patients.id
        AND provider_id = auth.uid()
        AND active = true
    )
  );
```

### Encryption

Encrypt PHI at rest and in transit:

```sql
-- Use pgcrypto for column-level encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt sensitive PHI columns
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),

  -- Encrypted PHI
  name_encrypted BYTEA,
  ssn_encrypted BYTEA,
  diagnosis_encrypted BYTEA,
  medications_encrypted BYTEA,

  -- Encrypted using application-level encryption
  encryption_key_version INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Audit Logging

Log ALL PHI access:

```sql
-- Comprehensive PHI access logging
CREATE TABLE phi_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who accessed
  user_id UUID REFERENCES auth.users(id),
  user_role TEXT NOT NULL,

  -- What was accessed
  patient_id UUID NOT NULL,
  phi_type TEXT NOT NULL,  -- 'diagnosis', 'medications', 'treatment_plan'
  fields_accessed TEXT[],

  -- Why accessed (REQUIRED for HIPAA minimum necessary)
  access_reason TEXT NOT NULL,

  -- When accessed
  accessed_at TIMESTAMPTZ DEFAULT now(),

  -- Where accessed from
  ip_address INET,
  user_agent TEXT,
  device_id TEXT,

  -- How accessed
  access_method TEXT,  -- 'view', 'edit', 'export', 'share'

  CONSTRAINT valid_phi_type CHECK (
    phi_type IN ('demographics', 'diagnosis', 'medications', 'treatment_plan', 'billing')
  )
);

-- Index for reporting
CREATE INDEX idx_phi_access_patient ON phi_access_log(patient_id, accessed_at DESC);
CREATE INDEX idx_phi_access_user ON phi_access_log(user_id, accessed_at DESC);
```

## Minimum Necessary Standard

Access only the minimum PHI necessary to accomplish the intended purpose.

### Implementation

```typescript
// Define access levels
enum PHIAccessLevel {
  BASIC = 'basic',           // Name, DOB only
  CLINICAL = 'clinical',     // Medical information
  BILLING = 'billing',       // Financial information
  FULL = 'full',            // All information
}

// Map roles to access levels
const ROLE_ACCESS_LEVELS = {
  [HealthcareRole.PHYSICIAN]: PHIAccessLevel.FULL,
  [HealthcareRole.NURSE]: PHIAccessLevel.CLINICAL,
  [HealthcareRole.ADMIN]: PHIAccessLevel.BILLING,
  [HealthcareRole.PATIENT]: PHIAccessLevel.FULL, // Own data only
}

// Fetch only necessary fields
async function getPatientPHI(
  patientId: string,
  accessLevel: PHIAccessLevel,
  reason: string
) {
  let fields: string[]

  switch (accessLevel) {
    case PHIAccessLevel.BASIC:
      fields = ['id', 'name', 'dateOfBirth']
      break
    case PHIAccessLevel.CLINICAL:
      fields = ['id', 'name', 'dateOfBirth', 'diagnosis', 'medications']
      break
    case PHIAccessLevel.BILLING:
      fields = ['id', 'name', 'dateOfBirth', 'insuranceInfo']
      break
    case PHIAccessLevel.FULL:
      fields = ['*']
      break
  }

  // Log the access
  await logPHIAccess(auth.uid(), patientId, fields, reason)

  // Fetch data
  const { data } = await supabase
    .from('patients')
    .select(fields.join(','))
    .eq('id', patientId)
    .single()

  return data
}
```

## Emergency Access

HIPAA allows "break-glass" emergency access to PHI.

```typescript
interface EmergencyAccess {
  patientId: string
  accessReason: string
  emergencyType: 'life_threatening' | 'urgent_care' | 'other'
  approvedBy?: string
}

async function requestEmergencyAccess(
  request: EmergencyAccess
): Promise<boolean> {
  // Log emergency access request
  await logSecurityEvent('emergency_access_requested', {
    patientId: request.patientId,
    reason: request.accessReason,
    emergencyType: request.emergencyType,
  })

  // Grant temporary elevated access
  const tempAccessToken = await grantTemporaryAccess(
    auth.uid(),
    request.patientId,
    '1 hour'
  )

  // Require post-access justification
  scheduleAccessReview(auth.uid(), request.patientId, new Date(Date.now() + 3600000))

  // Alert security team
  await notifySecurityTeam('emergency_access', request)

  return true
}
```

## Data Retention

HIPAA requires retaining records for 6 years.

```typescript
const HIPAA_RETENTION_YEARS = 6

async function applyHIPAARetention() {
  const cutoffDate = new Date()
  cutoffDate.setFullYear(cutoffDate.getFullYear() - HIPAA_RETENTION_YEARS)

  // Archive old records (don't delete - keep for compliance)
  await supabase
    .from('patients')
    .update({ archived: true, archived_at: new Date() })
    .lt('last_active_at', cutoffDate.toISOString())

  // Keep audit logs for 6+ years
  // PHI access logs should NEVER be deleted
}
```

## De-identification

Two methods to remove PHI protections:

### 1. Safe Harbor Method

Remove all 18 identifiers:

```typescript
function deidentifyPatient(patient: PatientRecord) {
  return {
    // Keep general information
    ageRange: getAgeRange(patient.dateOfBirth), // e.g., "45-50"
    gender: patient.gender,
    zipFirst3: patient.zipCode.substring(0, 3), // First 3 digits only

    // Keep clinical data
    diagnosis: patient.diagnosis,
    medications: patient.medications,

    // Remove all 18 identifiers
    // No name, exact date, contact info, etc.
  }
}

function getAgeRange(dob: Date): string {
  const age = calculateAge(dob)

  if (age > 89) return '90+' // Special HIPAA rule

  const rangeStart = Math.floor(age / 5) * 5
  return `${rangeStart}-${rangeStart + 4}`
}
```

### 2. Expert Determination

Have a statistical expert certify the risk of re-identification is very small.

## Mobile App-Specific Considerations

### 1. Device Security

```typescript
// Check device security before allowing PHI access
async function checkDeviceCompliance(): Promise<boolean> {
  const checks = await Promise.all([
    checkJailbreak(),      // No jailbroken/rooted devices
    checkDeviceLock(),     // Require passcode/biometric
    checkOSVersion(),      // Current OS version
    checkAppSignature(),   // Verify app hasn't been modified
  ])

  return checks.every(check => check === true)
}
```

### 2. Session Management

```typescript
// Short session timeouts for PHI access
const PHI_SESSION_TIMEOUT = 15 * 60 * 1000 // 15 minutes

let lastActivity = Date.now()

function resetSessionTimer() {
  lastActivity = Date.now()
}

function checkSessionTimeout() {
  if (Date.now() - lastActivity > PHI_SESSION_TIMEOUT) {
    // Log user out
    logout()
    Alert.alert('Session Expired', 'Please log in again to access PHI.')
  }
}

// Reset timer on user activity
useEffect(() => {
  const interval = setInterval(checkSessionTimeout, 60 * 1000) // Check every minute
  return () => clearInterval(interval)
}, [])
```

### 3. Data at Rest

```typescript
// Encrypt PHI stored on device
import * as SecureStore from 'expo-secure-store'

async function cachePatientData(patient: Patient) {
  const encrypted = await EncryptionService.getInstance().encrypt(
    JSON.stringify(patient)
  )

  await SecureStore.setItemAsync(
    `patient_${patient.id}`,
    JSON.stringify(encrypted)
  )
}

// Clear cache on logout
async function clearPHICache() {
  const keys = await SecureStore.getAllKeys()
  const phiKeys = keys.filter(key => key.startsWith('patient_'))

  await Promise.all(phiKeys.map(key => SecureStore.deleteItemAsync(key)))
}
```

### 4. Clipboard Security

```typescript
// Prevent PHI from being copied to clipboard
import * as Clipboard from 'expo-clipboard'

function SecurePHIText({ value }: { value: string }) {
  return (
    <Text
      selectable={false}  // Disable text selection
      onLongPress={() => {
        Alert.alert('Security', 'Cannot copy PHI to clipboard')
      }}
    >
      {value}
    </Text>
  )
}
```

### 5. Screenshot Prevention

```typescript
// Prevent screenshots of PHI screens
import { preventScreenCapture, allowScreenCapture } from 'expo-screen-capture'

function PHIScreen() {
  useEffect(() => {
    // Disable screenshots when screen is active
    preventScreenCapture()

    return () => {
      // Re-enable when leaving screen
      allowScreenCapture()
    }
  }, [])

  return (
    <View>{/* PHI content */}</View>
  )
}
```

## Compliance Checklist

### Technical Safeguards
- [ ] End-to-end encryption for PHI
- [ ] TLS/SSL for all network traffic
- [ ] Encrypted backups
- [ ] Secure authentication (MFA recommended)
- [ ] Automatic logout after inactivity
- [ ] Audit logging of all PHI access
- [ ] Access controls (RBAC)
- [ ] Data integrity verification

### Administrative Safeguards
- [ ] Security policies documented
- [ ] Workforce training program
- [ ] Designated security official
- [ ] Risk assessment completed
- [ ] Incident response plan
- [ ] Business Associate Agreements
- [ ] Vendor management process

### Physical Safeguards
- [ ] Device encryption required
- [ ] Secure device storage
- [ ] Device loss/theft procedures
- [ ] Media disposal procedures

### Privacy Requirements
- [ ] Notice of Privacy Practices
- [ ] Patient authorization forms
- [ ] Minimum necessary policies
- [ ] Breach notification procedures
- [ ] Patient access procedures
- [ ] Amendment procedures

## Testing

```typescript
describe('HIPAA Compliance', () => {
  it('should log all PHI access', async () => {
    await getPatientPHI(patientId, PHIAccessLevel.CLINICAL, 'Annual checkup')

    const logs = await supabase
      .from('phi_access_log')
      .select('*')
      .eq('patient_id', patientId)

    expect(logs.data?.length).toBeGreaterThan(0)
    expect(logs.data?.[0].access_reason).toBe('Annual checkup')
  })

  it('should enforce minimum necessary', async () => {
    const data = await getPatientPHI(patientId, PHIAccessLevel.BASIC, 'Check-in')

    expect(data).toHaveProperty('name')
    expect(data).toHaveProperty('dateOfBirth')
    expect(data).not.toHaveProperty('diagnosis') // Not included in BASIC
  })

  it('should timeout inactive sessions', async () => {
    // Simulate 15 minutes of inactivity
    jest.advanceTimersByTime(15 * 60 * 1000)

    expect(isSessionActive()).toBe(false)
  })
})
```

## Resources

### Official HIPAA Resources
- [HHS HIPAA Page](https://www.hhs.gov/hipaa/index.html)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [Breach Notification Rule](https://www.hhs.gov/hipaa/for-professionals/breach-notification/index.html)

### Tools & Frameworks
- [HIPAA Security Rule Toolkit](https://www.healthit.gov/topic/privacy-security-and-hipaa/security-risk-assessment-tool)
- [OCR Audit Protocol](https://www.hhs.gov/hipaa/for-professionals/compliance-enforcement/audit/protocol/index.html)

### Related Documentation
- [Audit Logging](../../audit/README.md)
- [Data Encryption](../../encryption/README.md)
- [GDPR Compliance](../gdpr/README.md)

---

**Last Updated**: 2025-01-15
**Version**: 1.0.0
**Compliance**: HIPAA (45 CFR Parts 160, 162, and 164)
**Important**: This guide is for informational purposes. Consult with legal counsel for compliance verification.
