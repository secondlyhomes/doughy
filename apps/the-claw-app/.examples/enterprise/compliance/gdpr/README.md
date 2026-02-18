## GDPR Compliance Guide

Complete GDPR compliance implementation for React Native mobile applications.

## Overview

The General Data Protection Regulation (GDPR) is a comprehensive data protection law that applies to any organization processing personal data of EU residents. This guide provides a complete implementation of GDPR requirements for mobile applications.

### What is GDPR?

- **Regulation**: EU Regulation 2016/679
- **Effective Date**: May 25, 2018
- **Scope**: Any organization processing EU residents' personal data
- **Penalties**: Up to €20 million or 4% of global annual turnover

## Data Subject Rights

The GDPR grants individuals eight key rights regarding their personal data:

### 1. Right to Access (Article 15)

Users can request a copy of all personal data you hold about them.

**Implementation:**

```typescript
import { GDPRService } from '.examples/enterprise/compliance/gdpr/GDPRService'

const gdpr = GDPRService.getInstance()

// Export all user data
const exportData = await gdpr.exportUserData(userId)

// Download as file
const fileUri = await gdpr.downloadUserDataExport(userId)
```

**What to include:**
- User profile information
- All user-generated content
- Activity logs and history
- Consent records
- Communication history
- Payment information (if applicable)
- Any automated decision-making results

**Response Time**: Within 1 month (extendable to 3 months for complex requests)

### 2. Right to Rectification (Article 16)

Users can correct inaccurate or incomplete personal data.

**Implementation:**

```typescript
// Update user data
await gdpr.updateUserData(userId, {
  name: 'Corrected Name',
  email: 'corrected@email.com',
  phone: '+1-555-0100',
})
```

**Requirements:**
- Provide easy self-service data correction
- Update data across all systems
- Notify third parties of corrections
- Log all rectification requests

### 3. Right to Erasure / "Right to be Forgotten" (Article 17)

Users can request deletion of their personal data.

**Implementation:**

```typescript
// Delete user data
await gdpr.deleteUserData(userId, 'User requested deletion via settings')

// Or anonymize (recommended for audit trail)
await gdpr.anonymizeUserData(userId)
```

**Important Considerations:**

1. **When you CAN'T delete:**
   - Legal obligation to retain (e.g., financial records)
   - Public interest or scientific research
   - Legal claims defense

2. **Recommended Approach:**
   - **Anonymize** instead of hard delete
   - Keep minimal data for legal compliance
   - Document reasons for retained data

3. **What to delete:**
   - User profile
   - User-generated content
   - Activity logs (except where legally required)
   - Cached data
   - Backups (within reasonable timeframe)

### 4. Right to Restrict Processing (Article 18)

Users can request that you stop processing their data while maintaining storage.

**Implementation:**

```typescript
// Restrict processing
await gdpr.restrictProcessing(userId, 'User contests data accuracy')

// Check if restricted
const isRestricted = await gdpr.isProcessingRestricted(userId)

// Lift restriction
await gdpr.liftProcessingRestriction(userId)
```

**Use Cases:**
- User contests data accuracy
- Processing is unlawful but user doesn't want deletion
- Data no longer needed but user needs it for legal claims
- User objects to processing pending verification

### 5. Right to Data Portability (Article 20)

Users can receive their data in a structured, machine-readable format and transmit it to another controller.

**Implementation:**

```typescript
// Export in portable format (JSON or CSV)
const portableData = await gdpr.exportPortableData(userId, 'json')

// Share with another service
await shareWithService(portableData, 'https://another-service.com/import')
```

**Requirements:**
- Structured format (JSON, XML, CSV)
- Machine-readable
- Commonly used format
- Includes all user-provided data

### 6. Right to Object (Article 21)

Users can object to processing based on legitimate interests or for direct marketing.

**Implementation:**

```typescript
// Object to marketing
await gdpr.withdrawConsent(userId, 'marketing')

// Object to profiling
await gdpr.withdrawConsent(userId, 'personalization')
```

### 7. Right to Notification (Article 19)

Users must be notified of any rectification, erasure, or restriction of their data.

**Implementation:**

```typescript
// Automatically handled by audit logging
await auditLogger.log({
  action: 'rectification',
  resourceType: 'users',
  resourceId: userId,
  complianceTags: ['gdpr'],
})

// Send notification to user
await sendEmail(userEmail, 'Data Updated', 'Your personal data has been updated as requested.')
```

### 8. Right to Complain

Users can file complaints with their local Data Protection Authority (DPA).

**Implementation:**

Provide clear information about:
- How to contact your Data Protection Officer (DPO)
- How to file a complaint with DPA
- Links to relevant DPAs

## Consent Management

### Legal Bases for Processing

GDPR requires a legal basis for processing personal data:

1. **Consent**: User has given clear consent
2. **Contract**: Processing is necessary for a contract
3. **Legal Obligation**: Processing is required by law
4. **Vital Interests**: Processing protects someone's life
5. **Public Task**: Processing is necessary for public interest
6. **Legitimate Interests**: Processing is necessary for legitimate interests

### Consent Requirements

Valid consent must be:
- **Freely given**: Not a condition of service (for non-essential processing)
- **Specific**: Separate consent for different purposes
- **Informed**: Clear information about what user is consenting to
- **Unambiguous**: Clear affirmative action (no pre-ticked boxes)
- **Withdrawable**: Easy to withdraw as it was to give

### Implementation

```typescript
// Grant consent
await gdpr.grantConsent(userId, 'analytics', 'consent')
await gdpr.grantConsent(userId, 'marketing', 'consent')

// Withdraw consent
await gdpr.withdrawConsent(userId, 'marketing')

// Check consent status
const hasConsent = await gdpr.hasConsent(userId, 'analytics')
```

### Consent Types

Implement the `ConsentManager` component:

```typescript
import { ConsentManager } from '.examples/enterprise/compliance/gdpr/ConsentManager'

function SettingsScreen() {
  return <ConsentManager />
}
```

This provides UI for:
- **Essential**: Required for app functionality
- **Analytics**: App analytics and performance monitoring
- **Marketing**: Promotional emails and updates
- **Personalization**: Customized content and recommendations
- **Third-Party**: External integrations and services

## Privacy by Design

GDPR requires "Privacy by Design" - building privacy into systems from the start.

### Principles

1. **Data Minimization**: Collect only what you need
   ```typescript
   // ❌ DON'T collect everything
   interface User {
     name, email, phone, address, birthday, gender, income, occupation, ...
   }

   // ✅ DO collect only what's needed
   interface User {
     name, email  // Minimum for account creation
   }
   ```

2. **Purpose Limitation**: Use data only for stated purposes
   ```typescript
   // Clearly state purpose in consent request
   await gdpr.grantConsent(userId, 'analytics', 'consent')
   // Can only use for analytics, not marketing
   ```

3. **Storage Limitation**: Delete data when no longer needed
   ```typescript
   // Implement retention policies
   await gdpr.applyRetentionPolicies()
   ```

4. **Accuracy**: Keep data accurate and up-to-date
   ```typescript
   // Provide easy data correction
   await gdpr.updateUserData(userId, corrections)
   ```

5. **Integrity & Confidentiality**: Secure data appropriately
   ```typescript
   // Encrypt sensitive data
   import { EncryptionService } from '.examples/enterprise/encryption/EncryptionService'
   const encrypted = await EncryptionService.getInstance().encrypt(data)
   ```

## Required Documentation

### Privacy Policy

Your privacy policy must include:

1. **Controller Information**
   - Company name and contact details
   - Data Protection Officer (DPO) contact

2. **Data Processed**
   - What data you collect
   - How you collect it
   - Why you collect it (legal basis)

3. **Data Usage**
   - How you use the data
   - Automated decision-making / profiling
   - Third-party sharing

4. **Data Retention**
   - How long you keep data
   - Criteria for determining retention periods

5. **User Rights**
   - Clear explanation of all 8 rights
   - How to exercise each right

6. **Data Security**
   - Security measures in place
   - Breach notification procedures

7. **International Transfers**
   - If you transfer data outside EU
   - Safeguards in place

8. **Contact Information**
   - How to contact you about privacy
   - How to file complaints

### Data Processing Agreement (DPA)

If you use third-party processors (e.g., Supabase, AWS, SendGrid), you need DPAs with each.

**Required Elements:**
- Subject matter and duration of processing
- Nature and purpose of processing
- Type of personal data
- Categories of data subjects
- Processor's obligations and rights
- Sub-processor provisions

### Data Protection Impact Assessment (DPIA)

Required for high-risk processing activities:
- Large-scale profiling
- Processing sensitive data
- Systematic monitoring
- Automated decision-making with legal effects

**Template:**

1. **Description**: What processing activities?
2. **Necessity**: Why is it necessary?
3. **Risks**: What risks to individuals?
4. **Measures**: How will you mitigate risks?
5. **Consultation**: Have you consulted DPO?

## Data Breach Response

GDPR requires breach notification within **72 hours** of becoming aware.

### Breach Response Plan

1. **Detection** (0-24 hours)
   ```typescript
   // Automatically log security events
   await auditLogger.logSecurityEvent({
     eventType: 'data_breach_attempt',
     severity: 'critical',
     description: 'Unauthorized data access detected',
     details: { affectedUsers: userIds },
   })
   ```

2. **Containment** (0-24 hours)
   - Stop the breach
   - Secure affected systems
   - Preserve evidence

3. **Assessment** (24-48 hours)
   - Number of affected individuals
   - Type of data exposed
   - Potential consequences
   - Risk to individuals

4. **Notification** (within 72 hours)
   - Notify supervisory authority (DPA)
   - Notify affected individuals if high risk
   - Document the breach

5. **Remediation** (ongoing)
   - Fix vulnerabilities
   - Implement preventive measures
   - Update security procedures

### Notification Template

```
Subject: Important Security Notice

Dear [User],

We are writing to inform you of a security incident that may have affected your personal data.

What Happened:
[Brief description of incident]

What Data Was Affected:
[List of data types: email, name, etc.]

When It Happened:
[Date/time of incident]

What We're Doing:
[Steps taken to address the issue]

What You Should Do:
[Recommended actions for users]

Contact:
[DPO contact information]

We sincerely apologize for this incident and any concern it may cause.
```

## International Data Transfers

If you transfer data outside the EU/EEA, you need appropriate safeguards:

### Options

1. **Adequacy Decision**: Transfer to countries with adequate protection
   - UK, Switzerland, Japan, etc.
   - List maintained by EU Commission

2. **Standard Contractual Clauses (SCCs)**: Use EU-approved contract terms
   - Required for transfers to USA, most countries
   - Updated SCCs effective June 2021

3. **Binding Corporate Rules (BCRs)**: For intra-group transfers
   - Requires DPA approval
   - Complex and time-consuming

4. **Explicit Consent**: User consents to transfer
   - Limited to occasional, non-systematic transfers
   - Not recommended for regular operations

### Implementation

```typescript
// Document transfers in privacy policy
const THIRD_PARTY_SERVICES = {
  supabase: {
    name: 'Supabase',
    location: 'USA',
    purpose: 'Database and authentication',
    safeguards: 'Standard Contractual Clauses',
  },
  aws: {
    name: 'Amazon Web Services',
    location: 'USA',
    purpose: 'Cloud hosting',
    safeguards: 'Standard Contractual Clauses',
  },
}
```

## Children's Data

Special protections for children under 16 (varies by country):

1. **Parental Consent**: Required for children under age threshold
2. **Age Verification**: Implement reasonable age verification
3. **Child-Specific Privacy Policy**: Clear, age-appropriate language

```typescript
// Age verification
async function verifyAge(birthdate: Date): Promise<boolean> {
  const age = calculateAge(birthdate)
  const ageThreshold = 16 // Varies by country

  if (age < ageThreshold) {
    // Request parental consent
    await requestParentalConsent(userEmail)
    return false
  }

  return true
}
```

## Compliance Checklist

### Before Launch

- [ ] Privacy policy written and accessible
- [ ] Cookie consent banner implemented
- [ ] Consent management system in place
- [ ] Data processing agreements with third parties
- [ ] Privacy by design implemented
- [ ] Data minimization practiced
- [ ] Security measures documented
- [ ] DPO appointed (if required)
- [ ] Data retention policies defined
- [ ] Breach response plan prepared

### Ongoing Compliance

- [ ] Regular privacy audits
- [ ] DPIAs for new processing activities
- [ ] Annual privacy policy reviews
- [ ] Consent refresh (yearly)
- [ ] Data retention policy enforcement
- [ ] Security testing and updates
- [ ] Staff training on GDPR
- [ ] Vendor compliance reviews

### User Rights Implementation

- [ ] Right to access - automated export
- [ ] Right to rectification - self-service editing
- [ ] Right to erasure - deletion/anonymization
- [ ] Right to restrict - processing restriction flag
- [ ] Right to portability - JSON/CSV export
- [ ] Right to object - consent withdrawal
- [ ] Response within 1 month

## Testing GDPR Compliance

```typescript
// Test data export
describe('GDPR Right to Access', () => {
  it('should export all user data', async () => {
    const exportData = await gdpr.exportUserData(userId)

    expect(exportData).toHaveProperty('userProfile')
    expect(exportData).toHaveProperty('userData')
    expect(exportData.userData).toHaveProperty('tasks')
    expect(exportData.userData).toHaveProperty('consents')
  })
})

// Test data deletion
describe('GDPR Right to Erasure', () => {
  it('should delete user data', async () => {
    await gdpr.deleteUserData(userId, 'Test deletion')

    const profile = await getProfile(userId)
    expect(profile.email).toContain('deleted-')
    expect(profile.name).toBe('[DELETED]')
  })
})

// Test consent withdrawal
describe('GDPR Right to Withdraw Consent', () => {
  it('should withdraw consent', async () => {
    await gdpr.withdrawConsent(userId, 'marketing')

    const hasConsent = await gdpr.hasConsent(userId, 'marketing')
    expect(hasConsent).toBe(false)
  })
})
```

## Common Mistakes

### ❌ Don't

1. **Pre-tick consent boxes**
   ```tsx
   <Checkbox checked={true} /> {/* ❌ Not valid consent */}
   ```

2. **Bundle consent**
   ```tsx
   <Checkbox /> Accept Terms and Privacy Policy {/* ❌ Must be separate */}
   ```

3. **Make consent mandatory for non-essential processing**
   ```tsx
   if (!acceptedMarketing) {
     return <Text>You must accept marketing to use our app</Text> {/* ❌ */}
   }
   ```

4. **Keep data indefinitely**
   ```typescript
   // ❌ No retention policy
   // Data stored forever
   ```

5. **Hard delete everything immediately**
   ```typescript
   await deleteUser(userId) // ❌ Might violate legal retention requirements
   ```

### ✅ Do

1. **Unchecked consent by default**
   ```tsx
   <Checkbox checked={false} onChange={handleConsent} />
   ```

2. **Separate consent for each purpose**
   ```tsx
   <Checkbox /> Analytics
   <Checkbox /> Marketing
   <Checkbox /> Personalization
   ```

3. **Allow app use with minimal consent**
   ```tsx
   // Only essential consent required
   <Checkbox checked={true} disabled /> Essential (Required)
   <Checkbox /> Marketing (Optional)
   ```

4. **Implement retention policies**
   ```typescript
   await gdpr.applyRetentionPolicies()
   ```

5. **Anonymize when possible**
   ```typescript
   await gdpr.anonymizeUserData(userId) // ✅ Maintains audit trail
   ```

## Resources

### Official GDPR Resources

- [GDPR Full Text](https://gdpr-info.eu/)
- [ICO Guide to GDPR](https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/)
- [European Data Protection Board](https://edpb.europa.eu/)

### Tools & Templates

- [Privacy Policy Generator](https://www.freeprivacypolicy.com/)
- [DPIA Template](https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/accountability-and-governance/data-protection-impact-assessments/)
- [DPA Template](https://ec.europa.eu/info/law/law-topic/data-protection/international-dimension-data-protection/standard-contractual-clauses-scc_en)

### Related Documentation

- [Audit Logging](../../audit/README.md)
- [Data Encryption](../../encryption/README.md)
- [Security Best Practices](../../security/README.md)
- [HIPAA Compliance](../hipaa/README.md)

---

**Last Updated**: 2025-01-15
**Version**: 1.0.0
**Compliance**: GDPR (EU Regulation 2016/679)
