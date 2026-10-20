import { hashSeed, random } from "../simulation/random";
export const CHUNK_LENGTH = 72;
export interface BuildingData {
  z: number;
  side: number;
  offset: number;
  width: number;
  depth: number;
  floors: number;
  color: number;
  roof: number;
  shop: boolean;
}
export interface TreeData {
  z: number;
  offset: number;
  scale: number;
  blossom: boolean;
}
export interface ChunkData {
  id: number;
  district: string;
  buildings: BuildingData[];
  trees: TreeData[];
}
const DISTRICTS = [
  "Marigold Quarter",
  "Olive Promenade",
  "Apricot Gardens",
  "Old Town",
];
export function districtAt(id: number): string {
  return DISTRICTS[((Math.floor(id / 6) % 4) + 4) % 4];
}
export function generateChunk(seed: string, id: number): ChunkData {
  const rng = random(hashSeed(`${seed}:chunk:${id}`));
  const buildings: BuildingData[] = [];
  const trees: TreeData[] = [];
  for (const side of [-1, 1]) {
    for (let slot = 0; slot < 6; slot++) {
      const z = id * CHUNK_LENGTH + slot * 12 + 6;
      if (rng() > 0.13)
        buildings.push({
          z,
          side,
          offset: side * (11.7 + rng() * 1.4),
          width: 7.3 + rng() * 2.5,
          depth: 5.8 + rng() * 1.8,
          floors: 2 + Math.floor(rng() * 3),
          color: Math.floor(rng() * 7),
          roof: Math.floor(rng() * 3),
          shop: rng() > 0.45,
        });
      if (side === 1 && rng() > 0.28)
        buildings.push({
          z: z + 4,
          side,
          offset: 25 + rng() * 4,
          width: 8 + rng() * 2,
          depth: 7,
          floors: 3 + Math.floor(rng() * 3),
          color: Math.floor(rng() * 7),
          roof: Math.floor(rng() * 3),
          shop: false,
        });
    }
    for (let slot = 0; slot < 9; slot++)
      trees.push({
        z: id * CHUNK_LENGTH + slot * 8 + rng() * 2,
        offset: side * (6.6 + rng() * 0.5),
        scale: 0.8 + rng() * 0.45,
        blossom: rng() > 0.68,
      });
    for (let slot = 0; slot < 9; slot++)
      trees.push({
        z: id * CHUNK_LENGTH + rng() * CHUNK_LENGTH,
        offset: side * (side === 1 ? 36 + rng() * 23 : 33 + rng() * 12),
        scale: 1 + rng() * 1.6,
        blossom: rng() > 0.8,
      });
  }
  return { id, district: districtAt(id), buildings, trees };
}
export function requiredChunks(progress: number, radius: number): number[] {
  const center = Math.floor(progress / CHUNK_LENGTH);
  return Array.from(
    { length: radius * 2 + 1 },
    (_, i) => center - radius + i,
  ).sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
}
