import mapboxgl from "mapbox-gl";
import { InterpolateHeatmap } from "mapbox-gl-heatmap-canvas";
import { useCallback, useEffect, useRef, useState } from "react";
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

const COLOR_SCHEMES = {
  temperature: [
    [15, "#1e09bb"],
    [20, "#0f25ef"],
    [25, "#1668af"],
    [32, "#0092d0"],
    [35, "#a0ddd0"],
    [40, "#f7b32b"],
    [45, "#ff5e13"],
    [50, "#d7263d"],
  ] as [number, string][],
  heatmap: [
    [15, "#000080"],
    [25, "#0000ff"],
    [35, "#00ffff"],
    [40, "#00ff00"],
    [45, "#ffff00"],
    [50, "#ff0000"],
  ] as [number, string][],
  rainbow: [
    [15, "#9400d3"],
    [25, "#0000ff"],
    [30, "#00ff00"],
    [35, "#ffff00"],
    [45, "#ff7f00"],
    [50, "#ff0000"],
  ] as [number, string][],
};

function App() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [intensity, setIntensity] = useState(50000);
  const [colorScheme, setColorScheme] =
    useState<keyof typeof COLOR_SCHEMES>("temperature");
  const [showControls, setShowControls] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const heatmapRef = useRef<InterpolateHeatmap | null>(null);
  const updateTimeoutRef = useRef<number | null>(null);
  const isUserInteractingRef = useRef(false);

  const points = useRef(
    objArr
      .filter(
        (p) =>
          typeof p.lon === "number" &&
          typeof p.lat === "number" &&
          typeof p.temperature === "number"
      )
      .map((p) => [p.lon, p.lat, p.temperature] as [number, number, number])
  );

  const debouncedUpdateHeatmap = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(
      () => {
        if (!heatmapRef.current || !canvasRef.current) return;

        setIsUpdating(true);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          requestAnimationFrame(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            heatmapRef.current!.arr = [];
            heatmapRef.current!.drawHeatmap(
              points.current,
              COLOR_SCHEMES[colorScheme],
              intensity
            );
            setIsUpdating(false);
            isUserInteractingRef.current = false;
          });
        }
      },
      isUserInteractingRef.current ? 150 : 50
    );
  }, [colorScheme, intensity]);

  useEffect(() => {
    if (!mapContainer.current || !canvasRef.current) return;
    const canvas = canvasRef.current;

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
      minZoom: 13,
      maxZoom: 18,
      attributionControl: false,
      boxZoom: false,
      doubleClickZoom: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchZoomRotate: false,
    });

    map.addControl(
      new mapboxgl.NavigationControl({
        showCompass: false,
        showZoom: true,
        visualizePitch: false,
      }),
      "top-right"
    );

    const handleMoveStart = () => {
      isUserInteractingRef.current = true;
    };

    const handleMoveEnd = () => {
      debouncedUpdateHeatmap();
    };

    const handleZoomStart = () => {
      isUserInteractingRef.current = true;
    };

    const handleZoomEnd = () => {
      debouncedUpdateHeatmap();
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

      heatmapRef.current = new InterpolateHeatmap(canvas, CANVAS_CORNERS, map);
      heatmapRef.current.drawHeatmap(
        points.current,
        COLOR_SCHEMES[colorScheme],
        intensity
      );
    });

    map.on("movestart", handleMoveStart);
    map.on("moveend", handleMoveEnd);
    map.on("zoomstart", handleZoomStart);
    map.on("zoomend", handleZoomEnd);

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      map.remove();
    };
  }, [debouncedUpdateHeatmap, colorScheme, intensity]);

  useEffect(() => {
    if (heatmapRef.current && !isUserInteractingRef.current) {
      const canvas = canvasRef.current;
      if (canvas) {
        setIsUpdating(true);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          requestAnimationFrame(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            heatmapRef.current!.arr = [];
            heatmapRef.current!.drawHeatmap(
              points.current,
              COLOR_SCHEMES[colorScheme],
              intensity
            );
            setIsUpdating(false);
          });
        }
      }
    }
  }, [intensity, colorScheme]);

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
          maxWidth: 1200,
          maxHeight: 800,
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

        {isUpdating && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 4,
              background: "rgba(255,255,255,0.9)",
              borderRadius: 8,
              padding: "12px 20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 16,
                  height: 16,
                  border: "2px solid #ddd",
                  borderTop: "2px solid #007bff",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              ></div>
              Updating heatmap...
            </div>
          </div>
        )}

        <div
          style={{
            position: "absolute",
            top: 24,
            left: 24,
            zIndex: 3,
            background: "rgba(255,255,255,0.95)",
            borderRadius: 12,
            padding: "20px 24px",
            fontWeight: 600,
            fontSize: 20,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            maxWidth: 300,
          }}
        >
          <div style={{ marginBottom: 8 }}>🌡️ Temperature Heatmap</div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 400,
              color: "#666",
              lineHeight: 1.4,
            }}
          >
            Interpolated temperature data (15°C - 50°C) overlaid on Mapbox GL
            using the <strong>mapbox-gl-heatmap-canvas</strong> package
          </div>
        </div>

        <div style={{ position: "absolute", top: 24, right: 50, zIndex: 3 }}>
          <button
            onClick={() => setShowControls(!showControls)}
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "none",
              borderRadius: 8,
              padding: "12px 16px",
              cursor: "pointer",
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            {showControls ? "Hide" : "Show"} Controls
          </button>
        </div>

        {showControls && (
          <div
            style={{
              position: "absolute",
              bottom: 24,
              right: 24,
              zIndex: 3,
              background: "rgba(255,255,255,0.95)",
              borderRadius: 12,
              padding: "20px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              minWidth: 280,
            }}
          >
            <div style={{ marginBottom: 16, fontWeight: 600, fontSize: 16 }}>
              Package Capabilities
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Color Scheme:
              </label>
              <select
                value={colorScheme}
                onChange={(e) =>
                  setColorScheme(e.target.value as keyof typeof COLOR_SCHEMES)
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  fontSize: 14,
                }}
              >
                <option value="temperature">Temperature (Blue to Red)</option>
                <option value="heatmap">Classic Heatmap</option>
                <option value="rainbow">Rainbow Spectrum</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Interpolation Intensity: {(intensity / 1000).toFixed(0)}k
              </label>
              <input
                type="range"
                min="10000"
                max="100000"
                step="5000"
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ fontSize: 12, color: "#666", lineHeight: 1.4 }}>
              • Drag to pan, scroll to zoom
              <br />
              • Heatmap updates dynamically
              <br />• {points.current.length} data points interpolated
              <br />• Canvas overlays on Mapbox GL
            </div>
          </div>
        )}

        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 24,
            zIndex: 3,
            background: "rgba(255,255,255,0.95)",
            borderRadius: 8,
            padding: "12px 16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            fontSize: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 16,
                height: 3,
                background:
                  "linear-gradient(to right, #1e09bb, #0092d0, #f7b32b, #d7263d)",
                borderRadius: 2,
              }}
            ></div>
            <span style={{ fontSize: 12, color: "#666" }}>15°C → 50°C</span>
          </div>
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default App;
