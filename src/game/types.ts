export type CameraMode = "follow" | "cinematic" | "cab" | "free";
export type Quality = "low" | "balanced" | "high";
export interface Settings {
  paused: boolean;
  targetSpeed: number;
  camera: CameraMode;
  quality: Quality;
  followDistance: number;
  followHeight: number;
}
export interface Telemetry {
  speed: number;
  distance: number;
  elapsed: number;
  fps: number;
  chunks: number;
  district: string;
  progress?: number;
  drawCalls?: number;
  geometries?: number;
  recycled?: number;
  frameMs?: number;
}
export const CAMERA_MODES: CameraMode[] = [
  "follow",
  "cinematic",
  "cab",
  "free",
];
export const DEFAULT_SETTINGS: Settings = {
  paused: false,
  targetSpeed: 18,
  camera: "follow",
  quality: "balanced",
  followDistance: 21,
  followHeight: 8,
};
