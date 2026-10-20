export type CameraMode = "follow" | "cinematic" | "cab";
export type Quality = "low" | "balanced" | "high";
export interface Settings {
  paused: boolean;
  targetSpeed: number;
  camera: CameraMode;
  quality: Quality;
}
export interface Telemetry {
  speed: number;
  distance: number;
  elapsed: number;
  fps: number;
  chunks: number;
  district: string;
}
export const CAMERA_MODES: CameraMode[] = ["follow", "cinematic", "cab"];
export const DEFAULT_SETTINGS: Settings = {
  paused: false,
  targetSpeed: 18,
  camera: "follow",
  quality: "balanced",
};
