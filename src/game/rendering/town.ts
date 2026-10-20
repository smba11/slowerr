import * as THREE from "three";
import type { Route } from "../simulation/route";
import { CHUNK_LENGTH, type ChunkData } from "../world/chunks";
import {
  geographyAt,
  groundHeight,
  bridgeCenter,
  canalOffset,
  bridgeInfluence,
} from "../world/geography";
import { random, hashSeed } from "../simulation/random";
import { AssetLibrary, Batch } from "./library";
import { building } from "./architecture";
import { tree, garden, bloom } from "./vegetation";
import { terrainGeometry, ribbon, waterRibbons } from "./terrain";

export function renderChunk(
  data: ChunkData,
  route: Route,
  assets: AssetLibrary,
): THREE.Group {
  const group = new THREE.Group(),
    batch = new Batch(assets),
    details = new Batch(assets),
    start = data.id * CHUNK_LENGTH;
  const rng = random(hashSeed(`${route.seed}:pavers:${data.id}`));
  const frame = (
    z: number,
    offset: number,
    yaw = 0,
    onGround = false,
    target = batch,
  ) => {
    const p = route.sample(z, offset),
      y = onGround ? groundHeight(route, z, offset) : p.y;
    target.setFrame(p.x, y, p.z - start, p.heading + yaw);
  };
  const addSurface = (
    geometry: THREE.BufferGeometry,
    color: string,
    name: string,
  ) => {
    const mesh = new THREE.Mesh(geometry, assets.material(color));
    mesh.name = name;
    mesh.receiveShadow = true;
    mesh.userData.uniqueGeometry = true;
    group.add(mesh);
    return mesh;
  };
  addSurface(terrainGeometry(route, start), "terrain", "terrain");
  for (const g of waterRibbons(route, start)) addSurface(g, "#4b9da8", "water");
  const roadColor = (z: number) =>
    new THREE.Color("#c5b68d").lerp(
      new THREE.Color("#d6c4a1"),
      geographyAt(z).town,
    );
  addSurface(
    ribbon(
      route,
      start,
      0,
      (z) => 3.4 + geographyAt(z).town * 3.8 + geographyAt(z).water * 2.6,
      0,
      roadColor,
    ),
    "terrain",
    "road",
  );
  for (const side of [-1, 1]) {
    addSurface(
      ribbon(
        route,
        start,
        (z) => side * (3.3 + geographyAt(z).town * 0.8),
        (z) => 0.8 + (geographyAt(z).town + geographyAt(z).water) * 0.9,
        0.08,
      ),
      "#dfcfab",
      "sidewalk",
    );
    addSurface(
      ribbon(
        route,
        start,
        (z) => canalOffset(route, z) + side * 10.5,
        (z) => geographyAt(z).water * 1.2,
        -0.01,
      ),
      "#c3b491",
      "quay",
    );
  }
  for (const side of [-1, 1]) {
    addSurface(
      ribbon(route, start, side * 0.74, 0.11, 0.075),
      "#4c5d57",
      "rail",
    );
    addSurface(
      ribbon(route, start, side * 0.74, 0.035, 0.09),
      "#b6c2ad",
      "rail-top",
    );
  }
  // A consistent global cadence keeps sleepers and paving continuous at seams.
  for (let i = 0; i < 72; i++) {
    const z = start + i,
      geo = geographyAt(z);
    frame(z, 0);
    batch.add(
      "box",
      geo.town > 0.3 ? "#b9ab8b" : "#8c896b",
      0,
      0.014,
      0,
      2.14,
      0.03,
      0.2,
    );
    if (geo.town + geo.water > 0.15 && i % 2 === 0)
      for (const side of [-1, 1]) {
        frame(z, side * (2.6 + geo.town * 0.85));
        batch.add("box", "#ece0bd", 0, 0.11, 0, 0.16, 0.17, 1.9);
      }
    if (geo.town > 0.1)
      for (const offset of [-2.8, -1.85, -0.94, 0, 0.94, 1.85, 2.8]) {
        frame(z + rng() * 0.08, offset, (rng() - 0.5) * 0.025, false, details);
        details.add(
          "box",
          rng() > 0.4 ? "#dccbab" : "#c8b894",
          0,
          0.028,
          0,
          0.72 + rng() * 0.1,
          0.025,
          0.83 + rng() * 0.08,
        );
      }
    if (geo.water > 0.25 && i % 3 === 0) {
      frame(z, canalOffset(route, z) + 10.25);
      batch.add("cylinder", "#4f6f65", 0, 0.6, 0, 0.035, 1.2, 0.035);
      batch.add("box", "#4f6f65", 0, 1.14, 0, 0.06, 0.07, 3.1);
    }
  }
  for (const house of data.buildings) {
    if (bridgeInfluence(route, house.z) > 0.1) continue;
    frame(
      house.z,
      house.offset,
      house.side > 0 ? -Math.PI / 2 : Math.PI / 2,
      true,
    );
    building(batch, house);
  }
  for (const t of data.trees) {
    if (bridgeInfluence(route, t.z) > 0.15) continue;
    if (
      data.buildings.some(
        (h) =>
          Math.abs(h.z - t.z) < h.width / 2 + 1.6 &&
          Math.abs(h.offset - t.offset) < h.depth / 2 + 1.8,
      )
    )
      continue;
    frame(t.z, t.offset, 0, true);
    tree(batch, t);
  }
  for (const plant of data.gardens) {
    if (bridgeInfluence(route, plant.z) > 0.15) continue;
    if (
      data.buildings.some(
        (h) =>
          Math.abs(h.z - plant.z) < h.width / 2 &&
          Math.abs(h.offset - plant.offset) < h.depth / 2,
      )
    )
      continue;
    frame(plant.z, plant.offset, 0, true, details);
    garden(details, plant);
  }
  for (let i = 0; i < 95; i++) {
    const z = start + rng() * CHUNK_LENGTH,
      geo = geographyAt(z);
    if (rng() > geo.country) continue;
    const offset = (rng() > 0.5 ? 1 : -1) * (7 + rng() * 48);
    if (
      data.buildings.some(
        (h) =>
          Math.abs(h.z - z) < h.width / 2 + 1 &&
          Math.abs(h.offset - offset) < h.depth / 2 + 1,
      )
    )
      continue;
    frame(z, offset, rng() * 6.28, true, details);
    for (let blade = 0; blade < 3; blade++)
      details.add(
        "grass",
        blade % 2 ? "#729548" : "#91a957",
        (blade - 1) * 0.15,
        0.22,
        0,
        0.13,
        0.4 + rng() * 0.25,
        0.12,
        0,
        blade,
      );
    if (i % 3 === 0)
      bloom(details, i % 2 ? "#e8c76b" : "#ba9acb", 0, 0.5, 0, 0.15);
  }
  for (let i = 0; i < 4; i++) {
    const z = start + i * 18 + 5,
      geo = geographyAt(z);
    if (geo.town + geo.water < 0.45 || bridgeInfluence(route, z) > 0.1)
      continue;
    for (const side of [-1, 1]) {
      frame(z, side * 4.4);
      batch.add("cylinder", "#40594e", 0, 2.1, 0, 0.055, 4.2, 0.055);
      batch.add("box", "#40594e", -side * 0.28, 4.16, 0, 0.65, 0.06, 0.07);
      batch.add("softbox", "#ead1a0", -side * 0.57, 3.91, 0, 0.31, 0.45, 0.31);
      batch.add("cone", "#40594e", -side * 0.57, 4.25, 0, 0.29, 0.22, 0.29);
      if (i % 2 === 0) {
        frame(z + 5, side * 4.7);
        batch.add("box", "#9c7853", 0, 0.62, 0, 0.62, 0.14, 1.85);
        batch.add("box", "#9c7853", side * 0.29, 1.0, 0, 0.08, 0.63, 1.85);
        for (const end of [-0.65, 0.65])
          batch.add("box", "#4b6255", 0, 0.31, end, 0.45, 0.6, 0.1);
      }
    }
  }
  for (let i = 0; i < 2; i++) {
    const z = start + i * 36 + 8;
    frame(z, 4.5);
    batch.add("cylinder", "#73816a", 0, 3.45, 0, 0.055, 6.9, 0.055);
    batch.add("box", "#73816a", -2.3, 6.82, 0, 4.65, 0.055, 0.055);
  }
  const wire = addSurface(
    ribbon(route, start, 0, 0.025, 6.8),
    "#73816a",
    "wire",
  );
  wire.material.side = THREE.DoubleSide;
  const zone = Math.floor((start + CHUNK_LENGTH / 2) / 420),
    center = bridgeCenter(route, zone);
  if (
    ((zone % 3) + 3) % 3 === 2 &&
    center >= start &&
    center < start + CHUNK_LENGTH
  ) {
    frame(center, 0);
    for (const side of [-1, 1]) {
      batch.add(
        "bridgearch",
        "#b9aa88",
        side * 3.3,
        0,
        0,
        1,
        1,
        1,
        0,
        Math.PI / 2,
      );
      for (let post = -5; post <= 5; post += 1.25)
        batch.add("box", "#b9aa88", side * 3.3, 0.6, post, 0.22, 1.25, 0.22);
      batch.add("box", "#e0cfaa", side * 3.3, 1.22, 0, 0.3, 0.15, 11.5);
    }
    batch.add("box", "#c8b694", 0, -0.2, 0, 6.8, 0.4, 11.4);
    frame(center + 24, canalOffset(route, center + 24));
    for (const side of [-1, 1]) {
      batch.add("bridgearch", "#b9aa88", 0, 0.85, side * 1.2, 1.95, 1, 1);
      for (let post = -10; post <= 10; post += 1.6)
        batch.add(
          "cylinder",
          "#5a7366",
          post,
          1.25,
          side * 1.2,
          0.04,
          1.05,
          0.04,
        );
      batch.add("box", "#5a7366", 0, 1.8, side * 1.2, 21, 0.08, 0.08);
    }
    batch.add("box", "#d6c49e", 0, 0.7, 0, 22, 0.3, 2.6);
  }
  group.add(batch.finish());
  const detailGroup = details.finish();
  detailGroup.name = "details";
  group.add(detailGroup);
  group.userData.chunkId = data.id;
  return group;
}
export function disposeChunk(group: THREE.Group, assets?: AssetLibrary) {
  const instances: THREE.InstancedMesh[] = [];
  group.traverse((object) => {
    if (object instanceof THREE.InstancedMesh) instances.push(object);
    else if (object instanceof THREE.Mesh && object.userData.uniqueGeometry)
      object.geometry.dispose();
  });
  for (const mesh of instances) {
    if (assets) assets.pool.release(mesh);
    else mesh.dispose();
  }
  group.removeFromParent();
}
