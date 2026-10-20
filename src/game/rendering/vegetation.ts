import { Batch } from "./library";
import type { TreeData, GardenData } from "../world/chunks";
export function bloom(
  b: Batch,
  color: string,
  x: number,
  y: number,
  z: number,
  size: number,
) {
  for (let petal = 0; petal < 5; petal++) {
    const angle = (petal * Math.PI * 2) / 5;
    b.add(
      "petal",
      color,
      x + Math.sin(angle) * size * 0.52,
      y + Math.cos(angle * 2) * size * 0.11,
      z + Math.cos(angle) * size * 0.52,
      size * 0.59,
      size * 0.22,
      size * 0.62,
      0,
      angle,
    );
  }
  b.add(
    "petal",
    "#f2d38b",
    x,
    y + size * 0.12,
    z,
    size * 0.23,
    size * 0.19,
    size * 0.23,
  );
}

export function tree(b: Batch, data: TreeData) {
  const s = data.scale,
    v = data.variation;
  const trunk = "#785f42";
  b.add(
    "cylinder",
    trunk,
    0,
    1.7 * s,
    0,
    0.13 * s,
    3.4 * s,
    0.16 * s,
    0,
    0,
    (v - 0.5) * 0.12,
  );
  if (data.species === 1) {
    // Slender cypress, with a layered irregular silhouette.
    for (let i = 0; i < 5; i++)
      b.add(
        "leaf",
        i % 2 ? "#456c45" : "#345a3e",
        Math.sin(i + v) * 0.12,
        (2.3 + i * 0.8) * s,
        0,
        (0.85 - i * 0.12) * s,
        (1.7 - i * 0.15) * s,
        (0.75 - i * 0.1) * s,
      );
    return;
  }
  const colors = data.blossom
    ? ["#dc97ac", "#edbac0", "#c97e99"]
    : data.species === 2
      ? ["#879b61", "#a6b278", "#687b50"]
      : ["#527d49", "#74964f", "#3d6847"];
  const height = data.species === 3 ? 4.8 : 3.8;
  for (let branch = 0; branch < 5; branch++) {
    const angle = branch * 2.4 + v * 6,
      radius = (0.7 + v * 0.55) * s;
    const x = Math.sin(angle) * radius,
      z = Math.cos(angle) * radius,
      y = (height + Math.cos(branch * 1.7) * 0.55) * s;
    b.add(
      "cylinder",
      trunk,
      x * 0.5,
      y - 1.4 * s,
      z * 0.5,
      0.065 * s,
      2.2 * s,
      0.065 * s,
      Math.cos(angle) * 0.45,
      0,
      -Math.sin(angle) * 0.45,
    );
    b.add(
      "leaf",
      colors[branch % 3],
      x,
      y,
      z,
      (1.15 + v * 0.4) * s,
      (data.species === 2 ? 0.85 : 1.2) * s,
      (1 + v * 0.4) * s,
    );
    b.add(
      "leaf",
      colors[(branch + 1) % 3],
      x + 0.32 * s,
      y + 0.6 * s,
      z - 0.2 * s,
      0.85 * s,
      0.7 * s,
      0.9 * s,
    );
  }
}
export function garden(b: Batch, data: GardenData) {
  const colors = ["#efb953", "#db779a", "#b49ad3", "#f5d5a5", "#e58560"];
  const s = data.scale;
  for (let i = 0; i < 6; i++) {
    const angle = i * 2.4,
      radius = Math.sqrt(i / 6) * s;
    const x = Math.sin(angle) * radius,
      z = Math.cos(angle) * radius;
    b.add(
      "leaf",
      i % 2 ? "#55794a" : "#76904e",
      x,
      0.3 * s,
      z,
      0.48 * s,
      0.4 * s,
      0.5 * s,
    );
    bloom(
      b,
      colors[data.color % 5],
      x,
      (0.55 + (i % 3) * 0.13) * s,
      z,
      0.2 * s,
    );
    b.add(
      "grass",
      "#658a45",
      x - 0.15,
      0.24 * s,
      z + 0.17,
      0.16 * s,
      0.55 * s,
      0.12 * s,
      0,
      i,
    );
  }
}
