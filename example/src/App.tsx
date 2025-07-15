import mapboxgl from "mapbox-gl";
import { InterpolateHeatmap } from "mapbox-gl-heatmap-canvas";
import { useEffect, useRef } from "react";
import { objArr } from "./dataPoints";

const KEY = import.meta.env.VITE_MAPBOX_KEY;
mapboxgl.accessToken = KEY;

const MAP_CENTER: [number, number] = [54.62234595439645, 24.431402930764484];
const CANVAS_CORNERS: [number, number][] = [
  [54.6, 24.445],
  [54.644, 24.445],
  [54.644, 24.405],
  [54.6, 24.405],
];
const TEMPERATURE_COLORS: [number, string][] = [
  [15, "#1e09bb"],
  [20, "#0f25ef"],
  [25, "#1668af"],
  [32, "#0092d0"],
  [35, "#a0ddd0"],
  [40, "#f7b32b"],
  [45, "#ff5e13"],
  [50, "#d7263d"],
];

function App() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    let heatmap: InterpolateHeatmap | null = null;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "mapbox-streets": {
            type: "vector",
            url: "mapbox://mapbox.mapbox-streets-v8",
          },
        },
        layers: [
          {
            id: "background",
            type: "background",
            paint: {
              "background-color": "#f8f8f8",
            },
          },
          {
            id: "water",
            type: "fill",
            source: "mapbox-streets",
            "source-layer": "water",
            paint: {
              "fill-color": "#a0c4ff",
            },
          },
          {
            id: "roads",
            type: "line",
            source: "mapbox-streets",
            "source-layer": "road",
            paint: {
              "line-color": "#ffffff",
              "line-width": 1,
            },
          },
          {
            id: "buildings",
            type: "fill",
            source: "mapbox-streets",
            "source-layer": "building",
            paint: {
              "fill-color": "#e0e0e0",
              "fill-outline-color": "#d0d0d0",
            },
          },
        ],
      },
      center: MAP_CENTER,
      zoom: 15.5,
      attributionControl: false,
    });

    const points = objArr
      .filter(
        (p) =>
          typeof p.lon === "number" &&
          typeof p.lat === "number" &&
          typeof p.temperature === "number"
      )
      .map((p) => [p.lon, p.lat, p.temperature] as [number, number, number]);

    const updateHeatmap = () => {
      if (!heatmap || !canvas) return;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        heatmap.arr = [];
        heatmap.drawHeatmap(points, TEMPERATURE_COLORS, 50000);
      }
    };

    map.on("load", () => {
      map.addSource("canvas-source", {
        type: "canvas",
        canvas: canvas,
        coordinates: CANVAS_CORNERS,
      });

      map.addLayer({
        id: "canvas-layer",
        type: "raster",
        source: "canvas-source",
        paint: {
          "raster-opacity": 0.8,
        },
      });

      heatmap = new InterpolateHeatmap(canvas, CANVAS_CORNERS, map);
      heatmap.drawHeatmap(points, TEMPERATURE_COLORS, 50000);
    });

    map.on("moveend", updateHeatmap);
    map.on("zoomend", updateHeatmap);

    return () => map.remove();
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8f9fa",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          maxWidth: 900,
          maxHeight: 700,
          flex: 1,
          boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <canvas
          ref={canvasRef}
          width={1200}
          height={900}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            visibility: "hidden",
            pointerEvents: "none",
          }}
        />
        <div
          ref={mapContainer}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 24,
            zIndex: 3,
            background: "rgba(255,255,255,0.9)",
            borderRadius: 8,
            padding: "12px 20px",
            fontWeight: 600,
            fontSize: 18,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          Mapbox GL Heatmap Canvas Demo
        </div>
      </div>
    </div>
  );
}

export default App;
