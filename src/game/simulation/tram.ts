import type { Route } from "./route";
export const MAX_SPEED_KMH = 36;
export interface TramState {
  progress: number;
  speed: number;
  distance: number;
  elapsed: number;
}
export function createTramState(): TramState {
  return { progress: 12, speed: 0, distance: 0, elapsed: 0 };
}
/** Fixed-step physics. Target is km/h; internal velocity is m/s. */
export function stepTram(
  state: TramState,
  route: Route,
  targetKmh: number,
  dt: number,
): void {
  if (!Number.isFinite(dt) || dt <= 0) return;
  const target =
    Math.max(
      0,
      Math.min(MAX_SPEED_KMH, Number.isFinite(targetKmh) ? targetKmh : 0),
    ) / 3.6;
  const previous = state.speed;
  const rate = target < previous ? 2.4 : 0.8;
  state.speed =
    previous +
    Math.sign(target - previous) *
      Math.min(Math.abs(target - previous), rate * dt);
  const travel = (previous + state.speed) * 0.5 * dt;
  const midpoint =
    state.progress + (travel / route.sample(state.progress).stretch) * 0.5;
  state.progress += travel / route.sample(midpoint).stretch;
  state.distance += travel;
  state.elapsed += dt;
}
