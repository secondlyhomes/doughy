# Mixpanel Integration Setup

Complete guide for integrating Mixpanel analytics into your React Native app.

## Overview

Mixpanel provides:
- Advanced product analytics
- User segmentation
- Funnel analysis
- Retention tracking
- Push notifications
- A/B testing

## Installation

```bash
npm install mixpanel-react-native
npx expo install @react-native-async-storage/async-storage
```

## Environment Variables

```env
EXPO_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token
```

## Quick Start

```typescript
// services/analytics/mixpanel.ts
import { Mixpanel } from 'mixpanel-react-native';

const mixpanel = new Mixpanel(process.env.EXPO_PUBLIC_MIXPANEL_TOKEN!);
await mixpanel.init();

export { mixpanel };
```

## Usage

```typescript
// Track events
mixpanel.track('Task Created', {
  category: 'Work',
  priority: 'High',
});

// Identify user
mixpanel.identify(userId);
mixpanel.getPeople().set('$email', user.email);

// Track revenue
mixpanel.getPeople().trackCharge(9.99);
```

## Resources

- [Mixpanel Documentation](https://docs.mixpanel.com)
- [React Native SDK](https://github.com/mixpanel/mixpanel-react-native)
