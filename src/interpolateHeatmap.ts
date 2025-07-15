import * as mapboxgl from "mapbox-gl";

interface HeatmapElement {
  x: number;
  y: number;
  v: number[];
}
interface Point {
  x: number;
  y: number;
}
interface HeatmapArr extends Array<HeatmapElement> {}

class InterpolateHeatmap {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  canvasConers: [number, number][];

  rawData: Uint8ClampedArray;
  map: mapboxgl.Map;
  arr: HeatmapArr;
  imageData: ImageData;

  constructor(
    canvas: HTMLCanvasElement,
    canvasConers: [number, number][],
    map: mapboxgl.Map
  ) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.map = map;
    this.canvasConers = canvasConers;
    this.ctx = canvas.getContext("2d")!;
    this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    this.arr = [];

    this.rawData = this.imageData.data;
  }

  private metric(x1: number, y1: number, x2: number, y2: number): number {
    let f = this.width / this.height;

    let x = x2 - x1;
    let y = y2 - y1;

    x = x * x * f;

    y = (y * y) / f;

    return 1 / (x + y);
  }

  private calRgba(imageData: ImageData, intensity: number) {
    // Pre-calculate some values for performance
    const widthRatio = 1 / this.width;
    const heightRatio = 1 / this.height;

    // Calculating r,g,b,a for each pixel
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const px = x * widthRatio;
        const py = y * heightRatio;

        // Calculate distances and weights for this pixel
        const weights = this.calculatePixelWeights(px, py, intensity);

        let r = 0;
        let g = 0;
        let b = 0;
        let a = 0;

        // Apply weighted interpolation
        for (let i = 0; i < this.arr.length; i++) {
          const weight = weights[i];
          r += this.arr[i].v[0] * weight;
          g += this.arr[i].v[1] * weight;
          b += this.arr[i].v[2] * weight;
          a += this.arr[i].v[3] * weight;
        }

        // Clamp values to valid range
        r = Math.floor(Math.min(255, Math.max(0, r)));
        g = Math.floor(Math.min(255, Math.max(0, g)));
        b = Math.floor(Math.min(255, Math.max(0, b)));
        a = Math.floor(Math.min(255, Math.max(0, a)));

        const index = (x + y * this.width) * 4;

        this.rawData[index] = r;
        this.rawData[index + 1] = g;
        this.rawData[index + 2] = b;
        this.rawData[index + 3] = a;
      }
    }
    this.ctx.putImageData(imageData, 0, 0);
  }

  private calculatePixelWeights(
    px: number,
    py: number,
    intensity: number
  ): number[] {
    let sumDist = intensity;
    const distances: number[] = [];

    // Calculate distances from this pixel to all data points
    for (let i = 0; i < this.arr.length; i++) {
      const distance = this.metric(px, py, this.arr[i].x, this.arr[i].y);
      distances[i] = distance + 0.001; // Add small value to avoid division by zero
      sumDist += distances[i];
    }

    // Calculate normalized weights
    const weights: number[] = [];
    for (let i = 0; i < distances.length; i++) {
      weights[i] = distances[i] / sumDist;
    }

    return weights;
  }

  public drawHeatmap(
    points: [number, number, number][],
    valueColors: [number, string][],
    intensity: number = 50000
  ) {
    this.ctx.fillRect(0, 0, this.width, this.height);
    const point1 = this.map.project(
      this.canvasConers[0] as mapboxgl.LngLatLike
    );
    const point2 = this.map.project(
      this.canvasConers[1] as mapboxgl.LngLatLike
    );
    const point3 = this.map.project(
      this.canvasConers[2] as mapboxgl.LngLatLike
    );
    const point4 = this.map.project(
      this.canvasConers[3] as mapboxgl.LngLatLike
    );

    const width = Math.abs(point1.x - point2.x);
    //Canvas height calculating
    const height = Math.abs(point1.y - point4.y);

    points.forEach((point) => {
      const lngLatPoint: mapboxgl.LngLatLike = [point[0], point[1]];
      const pointProject = this.map.project(lngLatPoint);

      //Lat&Lon converting to canvas values
      const xx = (pointProject.x - point1.x) / width;
      const yy = (pointProject.y - point1.y) / height;
      let value = point[2];

      const vertex = this.calVertex(value, valueColors);

      this.arr.push({
        x: xx,
        y: yy,
        v: vertex,
      });
    });

    this.calRgba(this.imageData, intensity);
  }
  /*
This code converts a hexadecimal color value to an RGB color value.
The code starts by defining a hexadecimal color value.
The code then defines a shorthandRegex variable and sets it to the shorthand form of the hexadecimal color value.
The code then defines a result variable and sets it to the full form of the hexadecimal color value.
The code will return the full form of the hexadecimal color value.
*/
  private hexToRgb(hex: string) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }
  private calVertex(value: number, valueColors: [number, string][]): number[] {
    let color: string = "";

    // Sort valueColors by threshold to ensure proper ordering
    const sortedColors = [...valueColors].sort((a, b) => a[0] - b[0]);

    // Find the appropriate color for the value
    for (let i = 0; i < sortedColors.length; i++) {
      const [threshold, colorHex] = sortedColors[i];

      if (value <= threshold) {
        color = colorHex;
        break;
      }

      // If we're between two thresholds, use interpolation or pick the higher one
      if (i < sortedColors.length - 1) {
        const [nextThreshold] = sortedColors[i + 1];
        if (value > threshold && value <= nextThreshold) {
          color = sortedColors[i + 1][1];
          break;
        }
      }
    }

    // Fallback to the highest color range if value exceeds all thresholds
    if (!color && sortedColors.length > 0) {
      color = sortedColors[sortedColors.length - 1][1];
    }

    // Final fallback to prevent errors
    if (!color) {
      color = "#000000";
    }

    const rgb = this.hexToRgb(color);
    if (rgb === null) {
      throw new Error(`Invalid color hex code: ${color}`);
    }

    return [rgb.r, rgb.g, rgb.b, 255];
  }
}

export { InterpolateHeatmap };
