import { hashSeed } from "./random";
import { noise1 } from "./noise";
export interface RoutePoint {
  x: number;
  y: number;
  z: number;
  dx: number;
  dy: number;
  dz: number;
  heading: number;
  pitch: number;
  stretch: number;
}
export class Route {
  readonly salt: number;
  constructor(readonly seed: string) {
    this.salt = hashSeed(seed);
  }
  sample(z: number, offset = 0): RoutePoint {
    const broad = noise1(this.salt, z / 530 + 0.37);
    const bend = noise1(this.salt ^ 83291, z / 145 + 0.21);
    const valley = noise1(this.salt ^ 71341, z / 600 + 0.65);
    const grade = noise1(this.salt ^ 92317, z / 220 + 0.12);
    const x = broad.value * 76 + bend.value * 7;
    const slope = (broad.derivative * 76) / 530 + (bend.derivative * 7) / 145;
    const y = 12 + valley.value * 4.5 + grade.value * 0.8;
    const rise =
      (valley.derivative * 4.5) / 600 + (grade.derivative * 0.8) / 220;
    const horizontal = Math.hypot(slope, 1),
      stretch = Math.hypot(slope, rise, 1);
    return {
      x: x + offset / horizontal,
      y,
      z: z - (offset * slope) / horizontal,
      dx: slope / stretch,
      dy: rise / stretch,
      dz: 1 / stretch,
      heading: Math.atan(slope),
      pitch: Math.atan2(rise, horizontal),
      stretch,
    };
  }
}
