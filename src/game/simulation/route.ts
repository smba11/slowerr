import { hashSeed, random } from "./random";
export interface RoutePoint {
  x: number;
  z: number;
  dx: number;
  dz: number;
  heading: number;
  stretch: number;
}
export class Route {
  private phases: number[];
  constructor(readonly seed: string) {
    const rng = random(hashSeed(seed));
    this.phases = [rng() * 6.28, rng() * 6.28, rng() * 6.28];
  }
  sample(z: number, offset = 0): RoutePoint {
    const [a, b, c] = this.phases;
    const x =
      24 * Math.sin(z / 110 + a) +
      9 * Math.sin(z / 51 + b) +
      48 * Math.sin(z / 430 + c);
    const slope =
      (24 / 110) * Math.cos(z / 110 + a) +
      (9 / 51) * Math.cos(z / 51 + b) +
      (48 / 430) * Math.cos(z / 430 + c);
    const stretch = Math.hypot(slope, 1);
    return {
      x: x + offset / stretch,
      z: z - (offset * slope) / stretch,
      dx: slope / stretch,
      dz: 1 / stretch,
      heading: Math.atan(slope),
      stretch,
    };
  }
}
