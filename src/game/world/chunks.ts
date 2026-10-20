import { hashSeed, random } from "../simulation/random";
import { geographyAt, bridgeInfluence } from "./geography";
import { Route } from "../simulation/route";
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
  variant: number;
  garden: boolean;
}
export interface TreeData {
  z: number;
  offset: number;
  scale: number;
  blossom: boolean;
  species: number;
  variation: number;
}
export interface GardenData {
  z: number;
  offset: number;
  scale: number;
  color: number;
}
export interface ChunkData {
  id: number;
  district: string;
  buildings: BuildingData[];
  trees: TreeData[];
  gardens: GardenData[];
}
export function districtAt(id: number): string {
  return geographyAt(id * CHUNK_LENGTH + CHUNK_LENGTH / 2).name;
}
export function generateChunk(seed: string, id: number): ChunkData {
  const rng = random(hashSeed(`${seed}:v02:chunk:${id}`));
  const buildings: BuildingData[] = [],
    trees: TreeData[] = [],
    gardens: GardenData[] = [];
  const start = id * CHUNK_LENGTH;
  for (const side of [-1, 1]) {
    let cursor = start + 2.4;
    while (cursor < start + CHUNK_LENGTH - 7) {
      const width = 4.8 + rng() * 4.2,
        z = cursor + width / 2;
      const geo = geographyAt(z),
        pick = rng();
      const waterBank = side < 0 && geo.water > 0.5;
      const cottage = geo.country > 0.55;
      if (pick < geo.town * 0.98 + geo.water * 0.87 + geo.country * 0.16) {
        buildings.push({
          z,
          side,
          offset:
            side *
            (waterBank
              ? 35 + rng() * 4
              : cottage
                ? 15 + rng() * 15
                : 8.5 + rng() * 2.5),
          width,
          depth: 5 + rng() * 2,
          floors: cottage
            ? 1 + Math.floor(rng() * 2)
            : 2 + Math.floor(rng() * 3),
          color: Math.floor(rng() * 9),
          roof: Math.floor(rng() * 4),
          shop: !cottage && rng() > 0.45,
          variant: Math.floor(rng() * 6),
          garden: rng() > 0.25,
        });
        if (geo.town > 0.6 && side > 0 && rng() > 0.55)
          buildings.push({
            z: z + 0.5,
            side,
            offset: 23 + rng() * 4,
            width: width * 0.85,
            depth: 6,
            floors: 2 + Math.floor(rng() * 3),
            color: Math.floor(rng() * 9),
            roof: Math.floor(rng() * 4),
            shop: false,
            variant: Math.floor(rng() * 6),
            garden: true,
          });
      }
      cursor += width + 1.8 + rng() * 3.6 + geo.country * 10;
    }
    // Irregular roadside planting leaves sightlines and the narrow rail lane clear.
    for (let i = 0; i < 9; i++) {
      const z = start + rng() * CHUNK_LENGTH,
        geo = geographyAt(z);
      const off =
        side * (geo.country > 0.5 ? 7 + rng() * 11 : 4.9 + rng() * 0.9);
      if (rng() < 0.55 + geo.country * 0.4)
        trees.push({
          z,
          offset: off,
          scale: 0.7 + rng() * 0.6,
          blossom: rng() > 0.7,
          species: Math.floor(rng() * 4),
          variation: rng(),
        });
    }
    for (let i = 0; i < 18; i++) {
      const z = start + rng() * CHUNK_LENGTH,
        geo = geographyAt(z);
      let offset = side * (21 + rng() * 65);
      if (side < 0 && geo.water > 0.2) offset = -43 - rng() * 40;
      if (geo.country > rng() * 0.9 || i < 5)
        trees.push({
          z,
          offset,
          scale: 1 + rng() * 1.3,
          blossom: rng() > 0.82,
          species: Math.floor(rng() * 4),
          variation: rng(),
        });
    }
    for (let i = 0; i < 21; i++) {
      const z = start + rng() * CHUNK_LENGTH,
        geo = geographyAt(z);
      let offset = side * (4.8 + rng() * (geo.country > 0.3 ? 31 : 0.9));
      if (
        side < 0 &&
        geo.water > 0.5 &&
        Math.abs(offset) > 9 &&
        Math.abs(offset) < 32
      )
        offset = -6;
      gardens.push({
        z,
        offset,
        scale: 0.6 + rng() * 0.9,
        color: Math.floor(rng() * 5),
      });
    }
  }
  const route = new Route(seed),
    houses = buildings.filter((b) => bridgeInfluence(route, b.z) < 0.1);
  const occupied = (z: number, offset: number, padding: number) =>
    houses.some(
      (h) =>
        Math.abs(h.z - z) < h.width / 2 + padding &&
        Math.abs(h.offset - offset) < h.depth / 2 + padding,
    );
  return {
    id,
    district: districtAt(id),
    buildings: houses,
    trees: trees.filter(
      (t) =>
        bridgeInfluence(route, t.z) < 0.15 && !occupied(t.z, t.offset, 1.8),
    ),
    gardens: gardens.filter(
      (g) =>
        bridgeInfluence(route, g.z) < 0.15 && !occupied(g.z, g.offset, 0.1),
    ),
  };
}
export function requiredChunks(progress: number, radius: number): number[] {
  const center = Math.floor(progress / CHUNK_LENGTH);
  return Array.from(
    { length: radius * 2 + 1 },
    (_, i) => center - radius + i,
  ).sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
}
