import type { Quality } from "../types";
export const PRESETS: Record<
  Quality,
  {
    radius: number;
    pixelRatio: number;
    shadows: boolean;
    shadowSize: number;
    fogNear: number;
    fogFar: number;
  }
> = {
  low: {
    radius: 3,
    pixelRatio: 1,
    shadows: false,
    shadowSize: 512,
    fogNear: 125,
    fogFar: 200,
  },
  balanced: {
    radius: 4,
    pixelRatio: 1.5,
    shadows: true,
    shadowSize: 1024,
    fogNear: 190,
    fogFar: 285,
  },
  high: {
    radius: 5,
    pixelRatio: 2,
    shadows: true,
    shadowSize: 2048,
    fogNear: 245,
    fogFar: 355,
  },
};
export const FIXED_STEP = 1 / 60;
export const MAX_FRAME_TIME = 0.1;
