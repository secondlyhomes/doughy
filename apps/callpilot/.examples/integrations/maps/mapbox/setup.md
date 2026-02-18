# Mapbox Integration Setup

Complete guide for integrating Mapbox maps.

## Overview

Mapbox provides:
- Customizable maps
- Turn-by-turn navigation
- Geocoding and search
- Custom map styles
- Offline maps

## Installation

```bash
npm install @rnmapbox/maps
```

## Environment Variables

```env
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.xxx
```

## Configuration

### app.json

```json
{
  "expo": {
    "plugins": [
      [
        "@rnmapbox/maps",
        {
          "RNMapboxMapsDownloadToken": "sk.xxx"
        }
      ]
    ]
  }
}
```

## Usage

```typescript
import Mapbox from '@rnmapbox/maps';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

function MapScreen() {
  return (
    <Mapbox.MapView style={{ flex: 1 }}>
      <Mapbox.Camera
        zoomLevel={14}
        centerCoordinate={[-122.4324, 37.78825]}
      />
      <Mapbox.PointAnnotation
        id="marker"
        coordinate={[-122.4324, 37.78825]}
      />
    </Mapbox.MapView>
  );
}
```

## Custom Styles

```typescript
// Use custom map styles
<Mapbox.MapView
  styleURL="mapbox://styles/youruser/yourStyleId"
  style={{ flex: 1 }}
/>
```

## Resources

- [Mapbox Documentation](https://docs.mapbox.com)
- [@rnmapbox/maps](https://github.com/rnmapbox/maps)
