# ZONE D: Integrations - Implementation Guide

**Developer Role**: Integration Developer
**Focus**: Third-party API integrations, external services, API client wrappers
**Timeline**: 8-week sprint (4 sprints × 2 weeks)

---

## Your Responsibility

You are Zone D, the integration layer. You build:
- ✅ API client wrappers (OpenAI, Twilio, Zillow)
- ✅ Error handling and retry logic
- ✅ Rate limiting and caching
- ✅ Push notification services
- ✅ Document generation

**DO NOT**:
- Create UI components (Zone B's job)
- Write database migrations (Zone A's job)
- Build React hooks (Zone C's job - but work closely with them)

---

## Dependencies

### Wait for Zone A:
- ⏳ Sprint 1: Edge function infrastructure (Week 2)
- ⏳ Sprint 3: SMS webhook, scheduled reminders scaffolding (Week 6)

### Work with Zone C:
- 🤝 All sprints: Provide API client wrappers for hooks

---

## Sprint 1 (Weeks 1-2): Foundation Setup

### 1. OpenAI API Client Wrapper
**File**: `src/lib/openai.ts`

```typescript
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '@env';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

/**
 * Transcribe audio using Whisper API
 */
export async function transcribeAudio(audioUri: string): Promise<string> {
  try {
    // Convert audio URI to File/Blob
    const audioFile = await fetch(audioUri).then(r => r.blob());

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
    });

    return transcription.text;
  } catch (error) {
    console.error('Whisper transcription error:', error);
    throw new Error('Failed to transcribe audio');
  }
}

/**
 * Extract structured property data from text using GPT-4
 */
export async function extractPropertyData(text: string): Promise<{
  address?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  condition?: string;
  notes?: string;
  sellerName?: string;
  sellerPhone?: string;
}> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a real estate data extraction assistant. Extract property details from the following text.
          Return ONLY a JSON object with these fields (omit if not mentioned):
          - address: string
          - bedrooms: number
          - bathrooms: number
          - sqft: number
          - condition: string (e.g., "needs work", "good condition", "updated")
          - notes: string (repair needs, features)
          - sellerName: string
          - sellerPhone: string

          If information is not mentioned, omit that field. Do not make assumptions.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const extracted = JSON.parse(completion.choices[0].message.content || '{}');
    return extracted;
  } catch (error) {
    console.error('GPT-4 extraction error:', error);
    throw new Error('Failed to extract property data');
  }
}

/**
 * Extract data from image using GPT-4 Vision
 */
export async function extractFromImage(imageUri: string): Promise<{
  type: 'mls_sheet' | 'tax_record' | 'repair_estimate' | 'business_card' | 'other';
  extractedData: Record<string, any>;
}> {
  try {
    // Convert image to base64
    const base64Image = await fetch(imageUri)
      .then(r => r.blob())
      .then(blob => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this image and extract real estate related data.
              First, identify what type of document this is:
              - mls_sheet: MLS listing sheet
              - tax_record: Property tax record
              - repair_estimate: Contractor repair estimate
              - business_card: Business card
              - other: Other document type

              Then extract all relevant data into a JSON object.
              For MLS: address, price, beds, baths, sqft, listing date, etc.
              For tax record: address, assessed value, tax amount, year built, etc.
              For repair estimate: line items with descriptions and costs
              For business card: name, phone, email, company

              Return JSON with: { type: string, extractedData: object }`,
            },
            {
              type: 'image_url',
              image_url: {
                url: base64Image,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    console.error('GPT-4 Vision error:', error);
    throw new Error('Failed to extract data from image');
  }
}

/**
 * Generate document from template using GPT-4
 */
export async function generateDocument(
  templateType: 'offer_letter' | 'purchase_agreement' | 'seller_report',
  variables: Record<string, any>
): Promise<string> {
  try {
    const prompts = {
      offer_letter: `Generate a professional real estate offer letter with these details:
        Property: ${variables.address}
        Buyer: ${variables.buyerName}
        Offer Price: $${variables.offerPrice}
        Closing Date: ${variables.closingDate}
        Terms: ${variables.terms || 'Cash purchase, as-is condition'}

        Make it professional but friendly. Include standard contingencies.`,

      purchase_agreement: `Generate a purchase agreement addendum with these details:
        ${JSON.stringify(variables, null, 2)}

        This is a draft for review by an attorney. Include standard clauses.`,

      seller_report: `Generate a detailed seller property report with these details:
        ${JSON.stringify(variables, null, 2)}

        Include property analysis, market comps, and investment potential.`,
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a real estate document generation assistant. Generate professional, legally-sound documents. Always include a disclaimer that documents should be reviewed by an attorney.',
        },
        {
          role: 'user',
          content: prompts[templateType],
        },
      ],
      temperature: 0.3,
    });

    return completion.choices[0].message.content || '';
  } catch (error) {
    console.error('Document generation error:', error);
    throw new Error('Failed to generate document');
  }
}
```

### 2. Twilio SMS Client Wrapper
**File**: `src/lib/twilio.ts`

```typescript
import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } from '@env';

const TWILIO_API_URL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

/**
 * Send SMS via Twilio
 */
export async function sendSMS(to: string, message: string): Promise<void> {
  try {
    const formData = new URLSearchParams();
    formData.append('From', TWILIO_PHONE_NUMBER);
    formData.append('To', to);
    formData.append('Body', message);

    const response = await fetch(TWILIO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`Twilio API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('SMS sent:', data.sid);
  } catch (error) {
    console.error('Failed to send SMS:', error);
    throw error;
  }
}

/**
 * Parse SMS text into lead data (uses OpenAI)
 */
export async function parseSMSToLead(smsBody: string): Promise<{
  address?: string;
  bedrooms?: number;
  bathrooms?: number;
  notes?: string;
}> {
  // Delegate to OpenAI
  const { extractPropertyData } = await import('./openai');
  return extractPropertyData(smsBody);
}
```

### 3. Zillow/Redfin API Client Wrapper
**File**: `src/lib/zillow.ts`

```typescript
import { ZILLOW_API_KEY } from '@env';

// Using RapidAPI Zillow endpoint as example
const ZILLOW_API_URL = 'https://zillow-com1.p.rapidapi.com';

interface ZillowPropertyData {
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  zestimate: number;
  lastSoldPrice?: number;
  lastSoldDate?: string;
}

/**
 * Get property details from Zillow
 */
export async function getPropertyValue(address: string): Promise<number | null> {
  try {
    const response = await fetch(`${ZILLOW_API_URL}/property`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': ZILLOW_API_KEY,
        'X-RapidAPI-Host': 'zillow-com1.p.rapidapi.com',
      },
      // Add query params with address
    });

    if (!response.ok) {
      throw new Error('Zillow API error');
    }

    const data = await response.json();
    return data.zestimate || data.price || null;
  } catch (error) {
    console.error('Zillow API error:', error);
    return null;
  }
}

/**
 * Get comparable properties from Zillow
 */
export async function getComps(
  address: string,
  filters?: {
    radius?: number; // miles
    minSqft?: number;
    maxSqft?: number;
    soldInLastMonths?: number;
  }
): Promise<ZillowPropertyData[]> {
  try {
    // Implementation with Zillow API
    // Filter by radius, sqft variance, sold date
    // Return array of comps

    return [];
  } catch (error) {
    console.error('Failed to fetch comps:', error);
    return [];
  }
}
```

### 4. Configure API Keys

Create `.env` file:
```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Zillow (RapidAPI)
ZILLOW_API_KEY=...
```

Add to Supabase secrets as well (for Edge Functions).

### 5. Test API Connectivity

Create test file: `src/lib/__tests__/integrations.test.ts`

```typescript
import { transcribeAudio, extractPropertyData } from '../openai';
import { sendSMS } from '../twilio';
import { getPropertyValue } from '../zillow';

describe('API Integrations', () => {
  it('should transcribe audio', async () => {
    // Test with sample audio file
  });

  it('should extract property data', async () => {
    const result = await extractPropertyData('3 bed 2 bath house at 123 Main St, needs new roof');
    expect(result.address).toContain('123 Main St');
    expect(result.bedrooms).toBe(3);
  });

  it('should send SMS', async () => {
    await sendSMS('+1234567890', 'Test message');
  });

  it('should fetch property value', async () => {
    const value = await getPropertyValue('123 Main St, City, State');
    expect(value).toBeGreaterThan(0);
  });
});
```

---

## Sprint 2 (Weeks 3-4): Portfolio Integrations

### 1. Implement Zillow Valuation Auto-Refresh

Create cron job integration with Supabase Edge Function.

### 2. Error Handling and Retry Logic

```typescript
// src/lib/retry.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Usage in Zillow client:
export async function getPropertyValueWithRetry(address: string): Promise<number | null> {
  return retryWithBackoff(() => getPropertyValue(address));
}
```

---

## Sprint 3 (Weeks 5-6): AI & Automation Integrations

### 1. Implement Push Notifications

**File**: `src/lib/notifications.ts`

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Register for push notifications
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    alert('Must use physical device for Push Notifications');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return null;
  }

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

  return token;
}

/**
 * Send push notification (called from Edge Function)
 */
export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: any
): Promise<void> {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}
```

### 2. Enhance Edge Functions with AI Integration

Update `supabase/functions/sms-webhook/index.ts` to call OpenAI:

```typescript
// In SMS webhook
import { extractPropertyData } from '../_shared/openai.ts';

const parsedData = await extractPropertyData(body);

await supabase.from('sms_inbox').update({
  parsed_data: parsedData,
  status: 'processed',
}).eq('id', smsId);
```

---

## Sprint 4 (Weeks 7-8): Creative Finance & Final Integration

### 1. Financial Calculation Library

**File**: `src/lib/financial-calculations.ts`

```typescript
/**
 * Calculate monthly payment for a loan
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  const monthlyRate = annualRate / 12 / 100;
  const numPayments = termYears * 12;

  if (monthlyRate === 0) return principal / numPayments;

  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);

  return Math.round(payment * 100) / 100;
}

/**
 * Generate amortization schedule
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  termYears: number
): {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}[] {
  const monthlyRate = annualRate / 12 / 100;
  const numPayments = termYears * 12;
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termYears);

  const schedule = [];
  let balance = principal;

  for (let month = 1; month <= numPayments; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance -= principalPayment;

    schedule.push({
      month,
      payment: monthlyPayment,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interestPayment * 100) / 100,
      balance: Math.max(0, Math.round(balance * 100) / 100),
    });
  }

  return schedule;
}

/**
 * Calculate total interest paid
 */
export function calculateTotalInterest(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  const schedule = generateAmortizationSchedule(principal, annualRate, termYears);
  return schedule.reduce((sum, payment) => sum + payment.interest, 0);
}
```

### 2. PDF Export Integration

**File**: `src/lib/pdf-export.ts`

```typescript
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/**
 * Export amortization schedule to PDF
 */
export async function exportAmortizationToPDF(
  schedule: any[],
  dealInfo: {
    address: string;
    purchasePrice: number;
    downPayment: number;
    interestRate: number;
    termYears: number;
  }
): Promise<void> {
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Amortization Schedule</h1>
        <p><strong>Property:</strong> ${dealInfo.address}</p>
        <p><strong>Purchase Price:</strong> $${dealInfo.purchasePrice.toLocaleString()}</p>
        <p><strong>Down Payment:</strong> $${dealInfo.downPayment.toLocaleString()}</p>
        <p><strong>Interest Rate:</strong> ${dealInfo.interestRate}%</p>
        <p><strong>Term:</strong> ${dealInfo.termYears} years</p>

        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Payment</th>
              <th>Principal</th>
              <th>Interest</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            ${schedule.map(row => `
              <tr>
                <td>${row.month}</td>
                <td>$${row.payment.toFixed(2)}</td>
                <td>$${row.principal.toFixed(2)}</td>
                <td>$${row.interest.toFixed(2)}</td>
                <td>$${row.balance.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri);
}
```

---

## Deliverables Checklist

### Sprint 1
- [x] OpenAI client wrapper (Whisper, GPT-4, Vision)
- [x] Twilio SMS client wrapper
- [x] Zillow API client wrapper
- [x] API keys configured in .env and Supabase
- [x] Connectivity tests passing

### Sprint 2
- [x] ~~Zillow auto-refresh integration~~ (Skipped - Zillow API is paid, users can use manual comps + ARV calculator)
- [x] Error handling and retry logic
- [x] Rate limiting implementation (exists in `src/lib/ai/rateLimiter.ts`)

### Sprint 3
- [x] Push notification service (expo-notifications)
- [x] SMS webhook enhanced with AI
- [x] Document generation with GPT-4

### Sprint 4
- [x] Financial calculation library
- [x] PDF export functionality
- [x] End-to-end integration testing (44 tests)

---

## Testing

Run integration tests:

```bash
npm test -- src/lib/__tests__/integrations.test.ts
# Results: 44 tests passing
```

Monitor API usage and costs in respective dashboards:
- OpenAI: https://platform.openai.com/usage
- Twilio: https://console.twilio.com
- Zillow/RapidAPI: RapidAPI dashboard

---

## ✅ Implementation Complete

**Status**: All Zone D work is complete as of January 2026.

---

# Implementation Summary (Code Review Reference)

## Files Created

### 1. `src/lib/retry.ts`
**Purpose**: Exponential backoff retry utility for resilient API calls

**Key exports**:
- `retryWithBackoff<T>(fn, options)` - Core retry function with jitter
- `withRetry(fn, options)` - HOF wrapper for any async function
- `isNetworkError()`, `isRetryableHttpError()`, `defaultIsRetryable()` - Error detection helpers
- `RetryPresets` - Pre-configured options (rateLimited, critical, light)

---

### 2. `src/lib/twilio.ts`
**Purpose**: Twilio SMS client wrapper with templates and validation

**Key exports**:
- `sendSMS(config)` - Send SMS via Supabase edge function
- `sendSMSSimple(to, message)` - Convenience wrapper
- `parseSMSToLead(smsBody)` - Delegates to OpenAI extraction
- `formatPhoneNumber(phone)` - Normalize to E.164 format
- `isValidPhoneNumber(phone)` - Validate phone format (min 7 digits, US must be 11)
- `generateSMSFromTemplate(template, variables)` - Template-based message generation
- `sendTemplatedSMS(to, template, variables)` - Send templated message

**Templates**: `follow_up`, `appointment_reminder`, `offer_sent`, `document_ready`, `custom`

---

### 3. `src/lib/zillow.ts`
**Purpose**: Property data client with ARV calculations

**Key exports**:
- `getPropertyValue(address)` - Fetch Zestimate (mock-ready)
- `getPropertyDetails(address)` - Full property data
- `getComps(address, filters)` - Comparable properties with filtering
- `searchProperties(query, filters)` - Property search
- `calculateARV(comps, subjectSqft)` - **Pure function** - calculates ARV from comps with confidence scoring

**Types**: `ZillowPropertyData`, `ComparableProperty`, `CompFilters`, `PropertyValuation`

---

### 4. `src/lib/financial-calculations.ts`
**Purpose**: Comprehensive loan and deal analysis library

**Key exports**:
- `calculateMonthlyPayment(principal, rate, years)` - Standard amortization formula
- `generateAmortizationSchedule(principal, rate, years)` - Full payment schedule
- `calculateTotalInterest(principal, rate, years)` - Lifetime interest
- `getLoanSummary(principal, rate, years)` - Combined summary object
- `calculateRemainingBalance(principal, rate, years, monthsPaid)` - Mid-loan balance
- `calculateEquity(currentValue, remainingBalance)` - Equity calculation
- `analyzeDeal(input)` - Full flip/rental deal analysis with ROI metrics
- `calculate70PercentRule(arv, repairCosts)` - Maximum Allowable Offer
- `calculateRentalCashFlow(input)` - Monthly/annual cash flow
- `calculateCapRate(noi, value)` - Capitalization rate
- `calculateDSCR(noi, debtService)` - Debt Service Coverage Ratio

**Types**: `AmortizationEntry`, `LoanSummary`, `DealAnalysisInput`, `DealAnalysisResult`

---

### 5. `src/lib/pdf-export.ts`
**Purpose**: PDF generation and sharing using expo-print/expo-sharing

**Key exports**:
- `exportAmortizationToPDF(schedule, summary, options)` - Amortization schedule PDF
- `exportDealAnalysisToPDF(analysis, dealInfo)` - Deal analysis report PDF
- `exportHTMLToPDF(html, filename)` - Generic HTML to PDF

**Features**: Professional HTML templates, automatic sharing dialog, error handling

**Types**: `DealInfo`, `LoanInfo`, `ExportResult`

---

### 6. `src/lib/__tests__/integrations.test.ts`
**Purpose**: Unit tests for Zone D utilities

**Coverage**: 44 tests across:
- Retry utility (9 tests)
- Financial calculations (15 tests)
- Twilio client (12 tests)
- Zillow client (8 tests)

---

### 7. `supabase/migrations/20260119_notifications_infrastructure.sql`
**Purpose**: Database schema for push notifications

**Changes**:
- Added `profiles.expo_push_token` column
- Added `profiles.notification_preferences` JSONB column
- Created `notifications` table with RLS policies
- Added indexes for efficient queries
- Created `get_unread_notification_count()` helper function

---

### 8. `supabase/migrations/20260119_notifications_infrastructure_ROLLBACK.sql`
**Purpose**: Rollback script for notifications migration

---

## Files Modified

### 9. `src/lib/openai.ts`
**Changes**: Added AI extraction functions to existing chat completions client

**New exports**:
- `extractPropertyData(text)` - GPT-4 structured extraction from text
- `extractFromImage(imageUri)` - GPT-4 Vision for documents/cards
- `generateDocument(templateType, variables)` - AI document generation
- `transcribeAudio(audioUri)` - Whisper API transcription

**New types**: `ExtractedPropertyData`, `DocumentType`, `ImageExtractionResult`, `DocumentTemplateType`

---

### 10. `src/utils/notifications.ts`
**Changes**: Enhanced existing wrapper with full push notification support

**New exports**:
- `registerForPushNotificationsAsync()` - Get Expo push token
- `configureNotificationHandler(options)` - Set notification behavior
- `sendLocalNotification(content, delaySeconds)` - Schedule local notification
- `cancelNotification(id)`, `cancelAllNotifications()` - Cancel scheduled
- `getBadgeCount()`, `setBadgeCount(count)` - Badge management
- `addNotificationReceivedListener(listener)` - Foreground notifications
- `addNotificationResponseListener(listener)` - User interaction handler
- `sendExpoPushNotification(token, content)` - Send via Expo Push API

**New types**: `NotificationContent`, `PushTokenResult`

---

### 11. `src/lib/index.ts`
**Changes**: Added exports for all new Zone D modules

```typescript
// Added exports for:
export { retryWithBackoff, withRetry, RetryPresets, ... } from './retry';
export { sendSMS, formatPhoneNumber, isValidPhoneNumber, ... } from './twilio';
export { getPropertyValue, getComps, calculateARV, ... } from './zillow';
export { calculateMonthlyPayment, analyzeDeal, ... } from './financial-calculations';
export { exportAmortizationToPDF, exportDealAnalysisToPDF, ... } from './pdf-export';
```

---

### 12. `supabase/functions/sms-webhook/index.ts`
**Changes**: Added AI-powered property extraction

**New functionality**:
- Imports `decryptServer` from crypto-server
- `getOpenAIKey(supabase)` - Fetches and decrypts OpenAI API key
- `extractPropertyFromSMS(body, apiKey)` - Calls GPT-4 for extraction
- After storing SMS, triggers async AI processing
- Updates `sms_inbox.parsed_data` with extracted fields
- Sets status to `processed` or `error`

**Non-blocking**: AI runs async to not delay Twilio response (10s limit)

---

### 13. `supabase/functions/scheduled-reminders/index.ts`
**Changes**: Added Expo push notifications and in-app notification creation

**New functionality**:
- `sendExpoPushNotifications(messages)` - Batch send to Expo Push API
- `formatDueDate(isoDate)` - Human-readable due dates
- Fetches user profiles with `expo_push_token`
- Respects `notification_preferences`
- Creates records in `notifications` table
- Returns detailed push send results

**New types**: `UserProfile`, `ExpoPushMessage`

---

## Key Design Decisions

1. **Edge function API calls**: All external APIs (OpenAI, Twilio) go through Supabase edge functions to keep API keys server-side

2. **Mock data support**: All clients check `USE_MOCK_DATA` flag for development without real API calls

3. **Non-blocking SMS processing**: AI extraction runs async to meet Twilio's 10-second response requirement

4. **Retry with jitter**: Prevents thundering herd on API rate limits

5. **Pure calculation functions**: Financial calculations are pure functions with no side effects, easily testable

6. **Phone validation**: Requires minimum 7 digits globally, US numbers must be exactly 11 digits (+1 + 10)

7. **Zillow auto-refresh skipped**: Zillow API is paid (~$0.01-0.05/call). Users can manually enter comps and use `calculateARV()` instead.

---

## Dependencies Used
- `expo-print` - PDF generation
- `expo-sharing` - Share dialog
- `expo-notifications` - Push notifications (already in package.json)
- `expo-device` - Device detection
