# Google Maps Integration Setup

Complete guide for integrating Google Maps into your React Native app.

## Overview

Google Maps provides:
- Interactive maps
- Place search
- Directions
- Geocoding
- Street View

## Prerequisites

- Google Cloud account
- Maps API key with appropriate APIs enabled
- React Native app with Expo

## Installation

```bash
npx expo install react-native-maps
```

## Environment Variables

```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXxx
```

## Configuration

### app.json

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "AIzaSyXxx"
        }
      }
    },
    "ios": {
      "config": {
        "googleMapsApiKey": "AIzaSyXxx"
      }
    }
  }
}
```

## Usage

```typescript
import MapView, { Marker } from 'react-native-maps';

function MapScreen() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    >
      <Marker
        coordinate={{ latitude: 37.78825, longitude: -122.4324 }}
        title="San Francisco"
      />
    </MapView>
  );
}
```

## Resources

- [Google Maps Platform](https://developers.google.com/maps)
- [react-native-maps](https://github.com/react-native-maps/react-native-maps)
