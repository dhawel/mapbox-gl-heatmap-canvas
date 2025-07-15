# mapbox-gl-heatmap-canvas

A simple JavaScript library for rendering interpolated heatmaps on a Mapbox GL JS map.

By providing a set of gradient points and their corresponding values, the library uses a distance-based interpolation method to create a smooth heatmap that transitions between the different gradient points. The library provides an easy-to-use API for generating and rendering heatmaps on Mapbox GL JS maps, making it a useful tool for visualizing spatial data.

The interpolation algorithm uses inverse distance weighting to blend colors smoothly across the canvas, creating natural-looking heatmap visualizations.

# Examples

- Here is the link to a demo [live demo](https://mapbox-gl-heatmap-canvas-qfq3.vercel.app/)

# Installing

Using npm:

```bash
$ npm install mapbox-gl-heatmap-canvas
```

Using yarn:

```bash
$ yarn add mapbox-gl-heatmap-canvas
```

## Browser Compatibility

This library is compatible with all modern browsers that support:

- Canvas API
- ES2020 features
- Mapbox GL JS v2.x

## Installation Verification

After installation, you can verify everything is working by running:

```javascript
import { InterpolateHeatmap } from "mapbox-gl-heatmap-canvas";
console.log(InterpolateHeatmap); // Should log the class constructor
```

# Usage

```javascript
import mapboxgl from "mapbox-gl";
import { InterpolateHeatmap } from "mapbox-gl-heatmap-canvas";

mapboxgl.accessToken = "your-mapbox-access-token";

const map = new mapboxgl.Map({
  container: "map-container",
  style: "mapbox://styles/mapbox/light-v10",
  center: [54.62234595439645, 24.431402930764484],
  zoom: 16,
  attributionControl: false,
});

map.on("load", () => {
  // Create canvas element and add it to the map as a layer
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 400;
  map.addSource("canvas-source", {
    type: "canvas",
    canvas: canvas,
    coordinates: [
      [54.6, 24.445],
      [54.644, 24.445],
      [54.644, 24.405],
      [54.6, 24.405],
    ],
  });
  map.addLayer({
    id: "canvas-layer",
    type: "raster",
    source: "canvas-source",
  });

  // Create InterpolateHeatmap instance and draw heatmap on canvas
  const heatmap = new InterpolateHeatmap(
    canvas,
    [
      [54.6, 24.445],
      [54.644, 24.445],
      [54.644, 24.405],
      [54.6, 24.405],
    ],
    map
  );
  heatmap.drawHeatmap(
    [
      [54.62234595439645, 24.431402930764484, 33],
      [54.62242642066531, 24.431339437806912, 34],
      [54.622512251352084, 24.43127594481738, 15],
      [54.62258735320302, 24.43123443015309, 15],
    ],
    [
      [15, "#1e09bb"],
      [20, "#0f25ef"],
      [25, "#1668af"],
      [32, "#0092d0"],
      [35, "#a0ddd0"],
    ],
    50000
  );
});
```

## API Reference

### `new InterpolateHeatmap(canvas, canvasCorners, map)`

#### Parameters

- **`canvas`** (`HTMLCanvasElement`) - HTML canvas element where the heatmap will be rendered
- **`canvasCorners`** (`[number, number][]`) - Four geographical coordinates defining canvas corners as `[longitude, latitude]` pairs
- **`map`** (`mapboxgl.Map`) - Mapbox GL JS Map instance

### `drawHeatmap(points, valueColors, intensity?)`

#### Parameters

- **`points`** (`[number, number, number][]`) - Array of data points as `[longitude, latitude, value]` tuples
- **`valueColors`** (`[number, string][]`) - Color mapping as `[threshold, hexColor]` pairs
- **`intensity`** (`number`, optional) - Interpolation intensity (default: `50000`)

#### Value Colors

The `valueColors` parameter defines color thresholds for different value ranges:

```javascript
const valueColors = [
  [15, "#1e09bb"], // Values ≤ 15 → blue
  [25, "#0f25ef"], // Values 15-25 → light blue
  [35, "#a0ddd0"], // Values 25-35 → cyan
];
```

- Colors are automatically sorted by threshold
- Values below the lowest threshold use the first color
- Values above the highest threshold use the last color
- Smooth interpolation occurs between thresholds

#### Performance Notes

- The algorithm is optimized for real-time rendering
- Larger canvas sizes will impact performance
- Consider reducing `intensity` for better performance with many data points

## Troubleshooting

### Common Issues

**Canvas not appearing on map:**

- Ensure canvas coordinates match your geographical bounds
- Verify Mapbox access token is valid
- Check that canvas layer is added after map load

**Colors not displaying correctly:**

- Verify hex color codes are valid (e.g., "#1e09bb")
- Ensure value thresholds are numbers, not strings
- Check that data point values are within expected ranges

**Performance issues:**

- Reduce canvas size for better performance
- Lower the `intensity` parameter value
- Consider limiting the number of data points

### TypeScript Support

This library is written in TypeScript and provides full type definitions. Import types as needed:

```typescript
import { InterpolateHeatmap } from "mapbox-gl-heatmap-canvas";
import type * as mapboxgl from "mapbox-gl";

const heatmap = new InterpolateHeatmap(canvas, corners, map);
```
