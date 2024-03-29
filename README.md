# mapbox-gl-heatmap-canvas

A simple JavaScript library for rendering interpolated heatmaps on a Mapbox GL JS map.

By providing a set of gradient points and their corresponding values, the library uses a distance-based interpolation method to create a smooth heatmap that transitions between the different gradient points.The library provides an easy-to-use API for generating and rendering heatmaps on Mapbox GL JS maps, making it a useful tool for visualizing spatial data.Interpolation of color are based on bilinear interpolation algorithm.This module use [gradient2d](https://github.com/dismedia/gradient2d) library to implement bilinear interpolation.
# Examples
- Here is the link to a demo [live demo](https://mapbox-gl-heatmap-canvas.vercel.app/)

# Installing

Using npm:

```bash
$ npm install mapbox-gl-heatmap-canvas
```

Using yarn:

```bash
$ yarn add mapbox-gl-heatmap-canvas

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
  const heatmap = new InterpolateHeatmap(canvas, [
    [54.6, 24.445],
    [54.644, 24.445],
    [54.644, 24.405],
    [54.6, 24.405],
  ], map);
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

#### `new InterpolateHeatmap()` has following parameters

- `canvas` : HTML canvas element.This should be a ` HTMLCanvasElement` type.

- `canavasConers` : Four geographical coordinates denoting where to place the corners of the canvas, specified in [longitude, latitude] pairs.

- `map` : Mapbox-gl `Map` object.

#### `drawHeatmap()` method has following parameters.

- `points` : An array of points that will be displayed on the canvas, each point specified in [longitude,latitude,value]

- `valueColors` : The color in which each range of values should be denoted.This is specified by [value,color].Color should be a Hex value

Example:

```javascript
valueColors = [
  [15, "#1e09bb"],
  [20, "#0f25ef"],
];
```

Here, point values less than 15 will be denoted by color #1e09bb and point values between 15 and 20 will be denoted by #0f25ef.It's important to notice that each color denotes a range of values.

- `intensity` : A value that corresponds to the intensity of the gradient.Default value of `50000` is suitable for most applications.
