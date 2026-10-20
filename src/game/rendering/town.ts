import * as THREE from "three";
import type { Route } from "../simulation/route";
import {
  CHUNK_LENGTH,
  type ChunkData,
  type BuildingData,
} from "../world/chunks";
import { AssetLibrary, Batch, PALETTE } from "./library";

function building(b: Batch, data: BuildingData) {
  const { width: w, depth: d, floors, color } = data;
  const h = floors * 2.65;
  const wall = PALETTE[color];
  const roof = ["#bc7756", "#b76a50", "#cf8b60"][data.roof];
  b.add("box", "#c8c3a9", 0, 0.2, 0, w + 0.4, 0.4, d + 0.4);
  b.add("box", wall, 0, h / 2 + 0.4, 0, w, h, d);
  b.add("roof", roof, 0, h + 0.55, 0, w + 0.8, 2.05, d + 0.8);
  b.add("box", "#d39770", 0, h + 2.63, 0, 0.17, 0.12, d + 0.95);
  for (const side of [-1, 1])
    for (let tile = 1; tile < 7; tile++) {
      const t = tile / 7;
      b.add(
        "box",
        "#ad7154",
        (side * t * (w + 0.8)) / 2,
        h + 0.57 + 2.05 * (1 - t),
        0,
        0.035,
        0.035,
        d + 0.84,
      );
    }
  b.add("box", "#eed9b2", 0, h + 0.35, 0, w + 0.45, 0.24, d + 0.4);
  b.add("box", "#b28772", w * 0.28, h + 1.2, -d * 0.2, 0.65, 1.8, 0.7);
  b.add("box", "#e6c3a1", w * 0.28, h + 2.15, -d * 0.2, 0.85, 0.18, 0.9);
  // Small trim courses give the simple volumes an illustrated architectural rhythm.
  for (let floor = 0; floor < floors; floor++) {
    const y = floor * 2.65 + 1.9;
    if (floor > 0)
      b.add("box", "#e9d7b9", 0, y - 1.25, d / 2 + 0.08, w + 0.1, 0.12, 0.15);
    for (let col = -1; col <= 1; col++) {
      const x = (col * w) / 3.5;
      b.add("box", "#f4e8cc", x, y, d / 2 + 0.08, 1.25, 1.65, 0.16);
      b.add("box", "#527c78", x, y, d / 2 + 0.18, 0.95, 1.35, 0.09);
      b.add("box", "#e6d6b5", x, y, d / 2 + 0.24, 0.065, 1.4, 0.06);
      b.add("box", "#e6d6b5", x, y - 0.05, d / 2 + 0.24, 1, 0.06, 0.06);
      for (const side of [-1, 1])
        b.add(
          "box",
          "#698c7a",
          x + side * 0.78,
          y,
          d / 2 + 0.12,
          0.33,
          1.45,
          0.12,
        );
      b.add("box", "#eee1c2", x, y - 0.9, d / 2 + 0.23, 1.5, 0.13, 0.45);
      if ((floor + col + color) % 3 === 0) {
        b.add("box", "#ae7356", x, y - 0.7, d / 2 + 0.4, 1.15, 0.3, 0.35);
        b.add("sphere", "#749467", x, y - 0.5, d / 2 + 0.43, 0.7, 0.27, 0.28);
        for (const flower of [-0.35, 0, 0.35])
          b.add(
            "sphere",
            "#dc9c9e",
            x + flower,
            y - 0.37,
            d / 2 + 0.48,
            0.14,
            0.14,
            0.14,
          );
      }
    }
  }
  b.add("box", "#e8dbc0", 0, 1.4, d / 2 + 0.2, 1.5, 2.6, 0.2);
  b.add("box", "#4c6f65", 0, 1.35, d / 2 + 0.34, 1.15, 2.3, 0.14);
  b.add("sphere", "#d9bb75", 0.35, 1.2, d / 2 + 0.45, 0.065, 0.065, 0.065);
  if (data.shop) {
    for (let i = 0; i < 9; i++)
      b.add(
        "box",
        i % 2 ? "#f1dfb8" : "#738f77",
        ((i - 4) * w) / 10,
        2.65,
        d / 2 + 0.9,
        w / 10,
        0.12,
        1.8,
        -0.16,
      );
    b.add("box", "#f0dfbc", 0, 3.28, d / 2 + 0.23, w * 0.68, 0.5, 0.2);
  }
  // Side windows are visible between neighboring houses.
  for (const side of [-1, 1])
    for (let floor = 1; floor < floors; floor++) {
      b.add(
        "box",
        "#f2e1bf",
        side * (w / 2 + 0.06),
        floor * 2.65 + 1.8,
        0,
        0.15,
        1.6,
        1.2,
      );
      b.add(
        "box",
        "#668987",
        side * (w / 2 + 0.15),
        floor * 2.65 + 1.8,
        0,
        0.06,
        1.3,
        0.9,
      );
    }
}

function tree(b: Batch, scale: number, blossom: boolean) {
  b.add(
    "cylinder",
    "#8f7960",
    0,
    1.6 * scale,
    0,
    0.17 * scale,
    3.2 * scale,
    0.17 * scale,
  );
  b.add("box", "#c8c0a0", 0, 0.1, 0, 1.7 * scale, 0.2, 1.7 * scale);
  const leaf = blossom ? "#dcaead" : "#829b68";
  b.add(
    "sphere",
    leaf,
    0,
    3.7 * scale,
    0,
    1.65 * scale,
    1.7 * scale,
    1.5 * scale,
  );
  b.add(
    "sphere",
    blossom ? "#eac3b6" : "#9caf7b",
    0.8 * scale,
    3.4 * scale,
    0.3 * scale,
    1.15 * scale,
    1.25 * scale,
    1.25 * scale,
  );
  b.add(
    "sphere",
    blossom ? "#c9959d" : "#6b8960",
    -0.75 * scale,
    3.2 * scale,
    -0.1 * scale,
    1.2 * scale,
    1.3 * scale,
    1.25 * scale,
  );
}

function ribbon(
  route: Route,
  start: number,
  offset: number,
  width: number,
  y: number,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const z = start + (CHUNK_LENGTH * i) / steps;
    for (const edge of [-1, 1]) {
      const p = route.sample(z, offset + (edge * width) / 2);
      positions.push(p.x, y, p.z - start);
    }
    if (i < steps) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

export function renderChunk(
  data: ChunkData,
  route: Route,
  assets: AssetLibrary,
): THREE.Group {
  const group = new THREE.Group();
  const batch = new Batch(assets);
  const start = data.id * CHUNK_LENGTH;
  const frame = (z: number, offset: number, yaw = 0) => {
    const p = route.sample(z, offset);
    batch.setFrame(p.x, 0, p.z - start, p.heading + yaw);
  };
  const surfaces: [number, number, number, string][] = [
    [0, 190, -0.12, "#b4be92"],
    [-22, 10.5, -0.04, "#73aaa6"],
    [0, 10, 0, "#bcb8a3"],
    [-6.1, 2.3, 0.06, "#dfd6bc"],
    [6.1, 2.3, 0.06, "#dfd6bc"],
    [-15.8, 1.6, 0.07, "#dfd6bc"],
    [-28.2, 2, 0.05, "#dfd6bc"],
    [-0.74, 0.105, 0.08, "#646b65"],
    [0.74, 0.105, 0.08, "#646b65"],
    [-0.74, 0.035, 0.09, "#c3c9bb"],
    [0.74, 0.035, 0.09, "#c3c9bb"],
  ];
  for (const [offset, width, y, color] of surfaces) {
    const mesh = new THREE.Mesh(
      ribbon(route, start, offset, width, y),
      assets.material(color),
    );
    mesh.receiveShadow = true;
    mesh.userData.uniqueGeometry = true;
    group.add(mesh);
  }
  // Stone setts, ties and promenade railings are instanced, not separate draw calls.
  for (let i = 0; i < 72; i++) {
    const z = start + i;
    frame(z, 0);
    batch.add("box", "#8a8c7c", 0, 0.015, 0, 2.05, 0.035, 0.22);
    if (i % 2 === 0)
      for (const side of [-1, 1]) {
        frame(z, side * 5);
        batch.add("box", "#f0e3c5", 0, 0.11, 0, 0.18, 0.16, 1.84);
        frame(z, -16.65);
        batch.add("cylinder", "#58756c", 0, 0.6, 0, 0.035, 1.1, 0.035);
        batch.add("box", "#58756c", 0, 1.1, 0, 0.06, 0.06, 2.05);
      }
    if (i % 3 === 0) {
      for (const offset of [-3.7, -2.7, 2.7, 3.7]) {
        frame(z, offset);
        batch.add("box", "#c8c2ab", 0, 0.018, 0, 0.07, 0.02, 2.8);
      }
    }
  }
  for (const house of data.buildings) {
    frame(house.z, house.offset, house.side > 0 ? -Math.PI / 2 : Math.PI / 2);
    building(batch, house);
  }
  for (const t of data.trees) {
    frame(t.z, t.offset);
    tree(batch, t.scale, t.blossom);
  }
  for (let i = 0; i < 4; i++) {
    const z = start + i * 18 + 3;
    for (const side of [-1, 1]) {
      frame(z, side * 5.25);
      batch.add("cylinder", "#526a60", 0, 2.35, 0, 0.065, 4.7, 0.065);
      batch.add("box", "#526a60", -side * 0.38, 4.65, 0, 0.85, 0.08, 0.08);
      batch.add("box", "#f2ddb0", -side * 0.75, 4.37, 0, 0.34, 0.52, 0.34);
      batch.add("cone", "#526a60", -side * 0.75, 4.75, 0, 0.32, 0.3, 0.32);
      if (i % 2 === 0) {
        frame(z + 6, side * 6);
        batch.add("box", "#ac8b66", 0, 0.65, 0, 0.65, 0.14, 2);
        batch.add("box", "#ac8b66", side * 0.3, 1.0, 0, 0.1, 0.65, 2);
        for (const end of [-0.7, 0.7])
          batch.add("box", "#526a60", 0, 0.32, end, 0.45, 0.6, 0.1);
      }
    }
    frame(z, -24);
    batch.add("box", "#a5c9bc", 0, -0.015, 0, 0.04, 0.015, 2.5);
    batch.add("box", "#b9d5c2", 2, -0.015, 4, 0.04, 0.015, 1.5);
  }
  // Overhead contact wire, supported every 24 meters.
  for (let i = 0; i < 3; i++) {
    frame(start + i * 24 + 8, 4.8);
    batch.add("cylinder", "#7b8777", 0, 3.45, 0, 0.06, 6.9, 0.06);
    batch.add("box", "#7b8777", -2.45, 6.82, 0, 5, 0.06, 0.06);
  }
  const wire = new THREE.Mesh(
    ribbon(route, start, 0, 0.025, 6.8),
    assets.material("#7b8777"),
  );
  wire.material.side = THREE.DoubleSide;
  wire.userData.uniqueGeometry = true;
  group.add(wire);
  group.add(batch.finish());
  group.userData.chunkId = data.id;
  return group;
}

export function disposeChunk(group: THREE.Group) {
  group.traverse((object) => {
    if (object instanceof THREE.InstancedMesh) object.dispose();
    else if (object instanceof THREE.Mesh && object.userData.uniqueGeometry)
      object.geometry.dispose();
  });
  group.removeFromParent();
}
