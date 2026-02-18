# Amplitude Integration Setup

Complete guide for integrating Amplitude analytics.

## Overview

Amplitude provides:
- Product analytics
- User behavior tracking
- Cohort analysis
- Funnel tracking
- Retention analysis

## Installation

```bash
npm install @amplitude/analytics-react-native
```

## Environment Variables

```env
EXPO_PUBLIC_AMPLITUDE_API_KEY=your_amplitude_key
```

## Configuration

```typescript
// services/analytics/amplitude.ts
import { init, track, identify } from '@amplitude/analytics-react-native';

init(process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY!, {
  trackingOptions: {
    ipAddress: false,
    language: true,
    platform: true,
  },
});

export { track, identify };
```

## Usage

```typescript
// Track events
import { track } from '@/services/analytics/amplitude';

track('Task Created', {
  category: 'Work',
  priority: 'High',
  source: 'mobile',
});

// Identify user
import { identify } from '@/services/analytics/amplitude';

identify('user-123', {
  email: 'user@example.com',
  plan: 'premium',
});
```

## Resources

- [Amplitude Documentation](https://www.docs.developers.amplitude.com)
- [React Native SDK](https://www.docs.developers.amplitude.com/data/sdks/react-native)
