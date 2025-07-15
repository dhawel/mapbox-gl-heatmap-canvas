import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";

import { inject } from "@vercel/analytics";
import { InterpolateHeatmap } from "mapbox-gl-heatmap-canvas";

inject();
const KEY = import.meta.env.VITE_MAPBOX_KEY;
const mapContainerStyle = {
  position: "absolute",
  top: "0",
  bottom: "0",
  width: "100%",
} as React.CSSProperties;
const appStyle = {
  width: "100%",
  height: "100%",
};

mapboxgl.accessToken = KEY;
function App() {
  const mapContainer = useRef(null);
  const points: [number, number, number][] = [
    [54.62234595439645, 24.431402930764484, 33],
    [54.62242642066531, 24.431339437806912, 34],
    [54.622512251352084, 24.43127594481738, 15],
    [54.62258735320302, 24.43123443015309, 15],
  ];
  const canvasConers: [number, number][] = [
    [54.6, 24.445],
    [54.644, 24.445],
    [54.644, 24.405],
    [54.6, 24.405],
  ];
  const temperatureColors: [number, string][] = [
    [15, "#1e09bb"],
    [20, "#0f25ef"],
    [25, "#1668af"],
    [32, "#0092d0"],
    [35, "#a0ddd0"],
  ];
  const canvasRef = useRef(null);

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
    heatmap.drawHeatmap(points, temperatureColors, 50000);

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

export default App;
