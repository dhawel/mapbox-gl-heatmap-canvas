# mapbox-gl-heatmap-canvas

A simple JavaScript JavaScript library for rendering temperature maps with Mapbox GL JS.

This library intends to provide a canvas element as a Mapbox GL layer that can be used to overlay colors for the given locations.  Given a canvas element and a set of gradient points, the library uses a distance-based interpolation method to generate a smooth heatmap that transitions between the different gradient points. The library provides an easy-to-use API for generating and rendering heatmaps on Mapbox GL JS maps, making it a useful tool for visualizing spatial data.Interpolation of color are based on bilinear interpolation algorithm.This module use [gradient2d](https://github.com/dismedia/gradient2d) library to implement bilinear interpolation.
# Examples
- Here is alink to alive demo [live demo](https://mapbox-gl-heatmap-canvas.vercel.app/)
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

Following implementation is using Reactjs.

```javascript
import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import { InterpolateHeatmap } from "mapbox-gl-heatmap-canvas";
mapboxgl.accessToken =
  "your-mapbox-access-token";

//Define Styles
const mapContainerStyle = {
  position: "absolute",
  top: "0",
  bottom: "0",
  width: "100%",
};

const appStyle = {
  width: "100%",
  height: "100%",
};

function App() {
  const mapContainer = useRef(null);
  const canvasRef = useRef(null);

  const points = [
    [54.62234595439645, 24.431402930764484, 33],
    [54.62242642066531, 24.431339437806912, 34],
    [54.622512251352084, 24.43127594481738, 15],
    [54.62258735320302, 24.43123443015309, 15],
  ];
  let canvasConers = [
    [54.6, 24.445],
    [54.644, 24.445],
    [54.644, 24.405],
    [54.6, 24.405],
  ];
  let valueColors = [
    [15, "#1e09bb"],
    [20, "#0f25ef"],
    [25, "#1668af"],
    [32, "#0092d0"],
    [35, "#a0ddd0"],
  ];


  useEffect(() => {

    const canvas = canvasRef.current!;

    const map = new mapboxgl.Map({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/light-v10",
      center: [54.62234595439645, 24.431402930764484],
      zoom: 16,
      attributionControl: false,
    });

    map.on("load", () => {


      map.addSource("canvas-source", {
        type: "canvas",
        canvas: canvas,
        coordinates: canvasConers,
      });

      map.addLayer({
        id: "canvas-layer",
        type: "raster",
        source: "canvas-source",
      });
    });

    let heatmap = new InterpolateHeatmap(canvas, canvasConers, map);

    heatmap.drawHeatmap(points, valueColors, 50000);

    // Clean up on unmount
    return () => map.remove();

  }, []);

 return (
    <div style={appStyle} className="App">
      <canvas ref={canvasRef} width="400" height="400" />

      <div className="Map" style={mapContainerStyle} ref={mapContainer} />
    </div>
  );
}

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
