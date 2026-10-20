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
    radius: 2,
    pixelRatio: 1,
    shadows: false,
    shadowSize: 512,
    fogNear: 65,
    fogFar: 130,
  },
  balanced: {
    radius: 3,
    pixelRatio: 1.5,
    shadows: true,
    shadowSize: 1024,
    fogNear: 95,
    fogFar: 190,
  },
  high: {
    radius: 4,
    pixelRatio: 2,
    shadows: true,
    shadowSize: 2048,
    fogNear: 130,
    fogFar: 260,
  },
};
export const FIXED_STEP = 1 / 60;
export const MAX_FRAME_TIME = 0.1;
