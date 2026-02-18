# Analytics Plugin

Multi-provider analytics tracking with offline support, event batching, and automatic lifecycle tracking.

## Features

- **Multi-Provider Support**: Segment, Mixpanel, Amplitude, Firebase, and custom providers
- **Offline Queue**: Automatically queues events when offline and sends when connection restored
- **Event Batching**: Batch events to reduce network requests
- **Auto-Tracking**: Automatic screen views and app lifecycle events
- **User Identification**: Track user identity and properties
- **Type-Safe**: Full TypeScript support

## Installation

```typescript
import { PluginManager } from '../../core/PluginManager';
import { createAnalyticsPlugin } from './analytics-plugin';

const pluginManager = new PluginManager(config, appConfig);
await pluginManager.initialize();

const analyticsPlugin = createAnalyticsPlugin();
await pluginManager.registerPlugin(analyticsPlugin);
```

## Configuration

```typescript
const config: AnalyticsConfig = {
  providers: [
    {
      name: 'segment',
      type: 'segment',
      apiKey: 'YOUR_SEGMENT_KEY',
      enabled: true,
    },
    {
      name: 'mixpanel',
      type: 'mixpanel',
      apiKey: 'YOUR_MIXPANEL_TOKEN',
      enabled: true,
    },
  ],
  debug: false,
  autoTrackScreens: true,
  autoTrackLifecycle: true,
  enableBatching: true,
  batchSize: 20,
  batchInterval: 5000,
  offlineQueue: true,
  maxOfflineEvents: 1000,
  defaultProperties: {
    app_version: '1.0.0',
    platform: 'ios',
  },
  excludeEvents: ['Debug Event'],
};
```

## Usage

### Track Events

```typescript
// Get plugin instance
const analytics = pluginManager.getPlugin('com.blueprint.analytics') as AnalyticsPlugin;

// Track a simple event
await analytics.track('Button Clicked');

// Track with properties
await analytics.track('Product Viewed', {
  product_id: '123',
  product_name: 'Widget',
  price: 29.99,
});

// Track screen view
await analytics.screen('Home Screen', {
  referrer: 'Login',
});
```

### User Identification

```typescript
// Identify user
await analytics.identify('user-123', {
  email: 'user@example.com',
  name: 'John Doe',
  plan: 'premium',
});

// Set user properties
await analytics.setUserProperties({
  subscription_status: 'active',
  total_purchases: 5,
});

// Reset on logout
await analytics.reset();
```

### Manual Flushing

```typescript
// Flush pending events immediately
await analytics.flush();
```

## Auto-Tracking

### Screen Views

When `autoTrackScreens` is enabled, screen views are automatically tracked on navigation:

```typescript
// Automatically tracked as "Screen Viewed" with screen_name property
navigation.navigate('Profile');
```

### App Lifecycle

When `autoTrackLifecycle` is enabled, these events are automatically tracked:

- `App Opened` - When app starts
- `App Backgrounded` - When app goes to background
- `App Foregrounded` - When app returns to foreground

## Offline Support

Events are automatically queued when offline and sent when connection is restored:

```typescript
// Event is queued when offline
await analytics.track('Offline Event');

// Events automatically sent when online again
```

Queue is persisted to storage and survives app restarts.

## Batching

Events are batched to reduce network requests:

```typescript
{
  enableBatching: true,
  batchSize: 20,        // Send after 20 events
  batchInterval: 5000,  // Or send every 5 seconds
}
```

## Custom Providers

Add custom analytics providers:

```typescript
class CustomAdapter implements ProviderAdapter {
  async track(event: AnalyticsEvent): Promise<void> {
    // Send to your custom endpoint
    await fetch('https://api.example.com/track', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  async identify(userId: string, traits?: Record<string, unknown>): Promise<void> {
    // Send user identification
  }
}
```

## Best Practices

1. **Use Meaningful Event Names**: Use clear, descriptive names like "Product Purchased" instead of "click"
2. **Include Context**: Add relevant properties to events for better analysis
3. **Batch Events**: Enable batching for better performance
4. **Handle Offline**: Enable offline queue for reliable tracking
5. **Exclude Debug Events**: Use `excludeEvents` to filter out development events
6. **Set Default Properties**: Add common properties to all events

## API Reference

### Methods

- `track(name, properties?)` - Track an event
- `screen(name, properties?)` - Track a screen view
- `identify(userId, traits?)` - Identify a user
- `setUserProperties(properties)` - Set user properties
- `reset()` - Reset analytics state (on logout)
- `flush()` - Flush pending events immediately

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `providers` | `AnalyticsProvider[]` | `[]` | Analytics providers to enable |
| `debug` | `boolean` | `false` | Enable debug logging |
| `autoTrackScreens` | `boolean` | `true` | Auto-track screen views |
| `autoTrackLifecycle` | `boolean` | `true` | Auto-track app lifecycle |
| `enableBatching` | `boolean` | `true` | Batch events before sending |
| `batchSize` | `number` | `20` | Events per batch |
| `batchInterval` | `number` | `5000` | Batch interval (ms) |
| `offlineQueue` | `boolean` | `true` | Enable offline queue |
| `maxOfflineEvents` | `number` | `1000` | Max offline events to queue |
| `defaultProperties` | `object` | `{}` | Properties added to all events |
| `excludeEvents` | `string[]` | `[]` | Events to exclude from tracking |

## Examples

### E-commerce Tracking

```typescript
// Product viewed
await analytics.track('Product Viewed', {
  product_id: 'SKU-123',
  product_name: 'Blue Widget',
  category: 'Widgets',
  price: 29.99,
  currency: 'USD',
});

// Add to cart
await analytics.track('Product Added', {
  product_id: 'SKU-123',
  quantity: 2,
  cart_total: 59.98,
});

// Purchase completed
await analytics.track('Order Completed', {
  order_id: 'ORDER-456',
  revenue: 59.98,
  products: ['SKU-123'],
  payment_method: 'credit_card',
});
```

### User Journey Tracking

```typescript
// Onboarding
await analytics.track('Onboarding Started');
await analytics.track('Onboarding Step Completed', { step: 1 });
await analytics.track('Onboarding Completed');

// Feature usage
await analytics.track('Feature Used', {
  feature_name: 'Export PDF',
  success: true,
});

// Errors
await analytics.track('Error Occurred', {
  error_type: 'validation',
  error_message: 'Invalid email format',
  screen: 'SignUp',
});
```
