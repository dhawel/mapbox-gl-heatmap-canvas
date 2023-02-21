interface HeatmapElement {
  x: number;
  y: number;
  v: number[];
  dist: number;
  weight: number;
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
  canvasConers: number[][];

  rawData: Uint8ClampedArray;
  map: mapboxgl.Map;
  arr: HeatmapArr;
  imageData: ImageData;

  constructor(
    canvas: HTMLCanvasElement,
    canvasConers: number[][],
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

  private calculateDist(p: any, intensity = 50000): void {
    //Gradient point distance area value
    let sumDist = intensity;

    // let maxDist = 10000;

    for (let i = 0; i < this.arr.length; i++) {
      let d = this.metric(p.x, p.y, this.arr[i].x, this.arr[i].y);
      d += 0.001;
      this.arr[i].dist = d;
    }

    for (let i = 0; i < this.arr.length; i++) {
      sumDist += this.arr[i].dist;
    }

    for (let i = 0; i < this.arr.length; i++) {
      this.arr[i].weight = this.arr[i].dist / sumDist;
    }
  }

  private calRgba(p: Point, imageData: ImageData, intensity: number) {
    //Calculating r,g,b,a
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        p.x = x / this.width;
        p.y = y / this.height;

        this.calculateDist(p, intensity);

        let r = 0;
        let g = 0;
        let b = 0;
        let a = 0; //intensity  Value

        for (let i = 0; i < this.arr.length; i++) {
          r += this.arr[i].v[0] * this.arr[i].weight;
          g += this.arr[i].v[1] * this.arr[i].weight;
          b += this.arr[i].v[2] * this.arr[i].weight;
          a += this.arr[i].v[3] * this.arr[i].weight;
        }

        r = Math.floor(Math.min(255, r));
        g = Math.floor(Math.min(255, g));
        b = Math.floor(Math.min(255, b));
        a = Math.floor(Math.min(255, a));

        let index = (x + y * this.width) * 4;

        this.rawData[index] = r;
        this.rawData[index + 1] = g;
        this.rawData[index + 2] = b;
        this.rawData[index + 3] = a;
      }
    }
    this.ctx.putImageData(imageData, 0, 0);
  }

  public drawHeatmap(
    points: number[][],
    valueColors: (string | number)[][],
    intensity?: number
  ) {
    this.ctx.fillRect(0, 0, this.width, this.height);
    const point1 = this.map.project(<mapboxgl.LngLatLike>this.canvasConers[0]);
    const point2 = this.map.project(<mapboxgl.LngLatLike>this.canvasConers[1]);
    const point3 = this.map.project(<mapboxgl.LngLatLike>this.canvasConers[2]);
    const point4 = this.map.project(<mapboxgl.LngLatLike>this.canvasConers[3]);

    const width = Math.abs(point1.x - point2.x);
    //Canvas height calculating
    const height = Math.abs(point1.y - point4.y);

    points.map((point) => {
      let lgLatPoint = <mapboxgl.LngLatLike>[point[0], point[1]];
      const pointProject = this.map.project(lgLatPoint);

      //Lat&Lon converting to canvas values
      const xx = (pointProject.x - point1.x) / width;
      const yy = (pointProject.y - point1.y) / height;
      let value = point[2];

      let vertex = this.calVertex(value, valueColors);

      this.arr.push({
        x: xx,
        y: yy,
        v: vertex,
        dist: 0,
        weight: 0,
      });
    });

    let p: Point = { x: 0, y: 0 };

    this.calRgba(p, this.imageData, intensity as number);
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
  private calVertex(value: number, valueColors: (string | number)[][]) {
    let color: string = "";
    let colorRangeArr = valueColors.map((data) => data[0]);

    for (let i = 0; i < colorRangeArr.length; i++) {
      if (colorRangeArr[i] <= value && colorRangeArr[i + 1] >= value) {
        color = <string>valueColors[i + 1][1];
        break;
      }
    }

    let rgb = this.hexToRgb(color);
    if (rgb === null) {
      throw new Error("Color hex code unknown");
    }

    let vertex = [rgb?.r, rgb?.g, rgb?.b, 255];
    return vertex;
  }
}

export { InterpolateHeatmap };
