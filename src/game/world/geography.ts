import { blendRange, noise1, noise2 } from "../simulation/noise";
import type { Route } from "../simulation/route";
export const DISTRICT_NAMES = [
  "Marigold Quarter",
  "Willow Countryside",
  "Azure Waterfront",
] as const;
export type DistrictKind = "town" | "country" | "water";
export interface Geography {
  town: number;
  country: number;
  water: number;
  name: string;
}
/** Weights, including density and terrain, change continuously over 110m. */
export function geographyAt(z: number): Geography {
  const zone = Math.floor(z / 420),
    phase = z - zone * 420;
  const index = ((zone % 3) + 3) % 3,
    next = (index + 1) % 3;
  const blend = blendRange(phase, 310, 420);
  const weights = [0, 0, 0];
  weights[index] = 1 - blend;
  weights[next] = blend;
  return {
    town: weights[0],
    country: weights[1],
    water: weights[2],
    name: DISTRICT_NAMES[blend > 0.5 ? next : index],
  };
}
export function canalOffset(route: Route, z: number): number {
  return -20 + noise1(route.salt ^ 8211, z / 210).value * 2;
}
export function bridgeCenter(route: Route, zone: number): number {
  return zone * 420 + 190 + noise1(route.salt ^ 9182, zone).value * 22;
}
export function bridgeInfluence(route: Route, z: number): number {
  const zone = Math.floor(z / 420);
  if (((zone % 3) + 3) % 3 !== 2) return 0;
  return 1 - blendRange(Math.abs(z - bridgeCenter(route, zone)), 5, 10);
}
/** Curvilinear terrain. A graded rail corridor blends into seeded hills. */
export function groundHeight(route: Route, z: number, offset: number): number {
  const p = route.sample(z, offset),
    geo = geographyAt(z);
  const field = noise2(route.salt ^ 6623, p.x / 44, p.z / 62);
  const detail = noise2(route.salt ^ 3317, p.x / 19, p.z / 28) * 0.6;
  const clearing = 10 + geo.town * 14 + geo.water * 6;
  const hills =
    blendRange(Math.abs(offset), clearing, clearing + 65) *
    (5 + geo.country * 16 + field * (7 + geo.country * 12) + detail);
  const canal =
    (1 - blendRange(Math.abs(offset - canalOffset(route, z)), 7, 12)) *
    geo.water *
    3.2;
  const stream =
    bridgeInfluence(route, z) * blendRange(Math.abs(offset), 0, 3) * 2.7;
  // At a bridge, lower the rail corridor too; the deck carries the track.
  const bridgeCut = bridgeInfluence(route, z) * 2.7;
  return p.y - 0.19 + hills - canal - Math.max(stream, bridgeCut);
}
