import * as THREE from "three";
import type { Route } from "../simulation/route";
import { noise2 } from "../simulation/noise";
import {
  geographyAt,
  groundHeight,
  canalOffset,
  bridgeInfluence,
} from "../world/geography";
import { CHUNK_LENGTH } from "../world/chunks";

export function terrainGeometry(
  route: Route,
  start: number,
): THREE.BufferGeometry {
  const rows = 36,
    cols = 64,
    vertices: number[] = [],
    colors: number[] = [],
    indices: number[] = [];
  const grass = new THREE.Color("#91ab66"),
    meadow = new THREE.Color("#b8bd76"),
    shadow = new THREE.Color("#698d59"),
    stone = new THREE.Color("#b7b48b"),
    tint = new THREE.Color();
  for (let row = 0; row <= rows; row++)
    for (let col = 0; col <= cols; col++) {
      const z = start + (row / rows) * CHUNK_LENGTH,
        offset = (col / cols - 0.5) * 220;
      const p = route.sample(z, offset),
        geo = geographyAt(z),
        n = noise2(route.salt ^ 4017, p.x / 17, p.z / 23);
      vertices.push(p.x, groundHeight(route, z, offset), p.z - start);
      tint
        .copy(grass)
        .lerp(n > 0 ? meadow : shadow, Math.abs(n) * 0.65)
        .lerp(stone, geo.town * 0.18 + geo.water * 0.2);
      const field = noise2(route.salt ^ 7732, p.x / 21, p.z / 31);
      if (Math.abs(offset) > 12 && geo.country > 0.3 && field > 0.18)
        tint.lerp(
          new THREE.Color(field > 0.5 ? "#b7a0bd" : "#c8bd70"),
          geo.country * Math.min(0.6, field),
        );
      colors.push(tint.r, tint.g, tint.b);
      if (row < rows && col < cols) {
        const a = row * (cols + 1) + col;
        indices.push(a, a + cols + 1, a + 1, a + 1, a + cols + 1, a + cols + 2);
      }
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  const normals = g.getAttribute("normal"),
    forward = new THREE.Vector3(),
    across = new THREE.Vector3(),
    normal = new THREE.Vector3();
  for (const row of [0, rows])
    for (let col = 0; col <= cols; col++) {
      const z = start + (row / rows) * CHUNK_LENGTH,
        offset = (col / cols - 0.5) * 220,
        e = 0.05;
      const a = route.sample(z - e, offset),
        b = route.sample(z + e, offset),
        left = route.sample(z, offset - e),
        right = route.sample(z, offset + e);
      forward.set(
        b.x - a.x,
        groundHeight(route, z + e, offset) - groundHeight(route, z - e, offset),
        b.z - a.z,
      );
      across.set(
        right.x - left.x,
        groundHeight(route, z, offset + e) - groundHeight(route, z, offset - e),
        right.z - left.z,
      );
      normal.crossVectors(forward, across).normalize();
      normals.setXYZ(row * (cols + 1) + col, normal.x, normal.y, normal.z);
    }
  return g;
}
export function ribbon(
  route: Route,
  start: number,
  offset: number | ((z: number) => number),
  width: number | ((z: number) => number),
  height: number,
  color?: (z: number) => THREE.Color,
): THREE.BufferGeometry {
  const positions: number[] = [],
    indices: number[] = [],
    colors: number[] = [];
  const steps = 72;
  for (let i = 0; i <= steps; i++) {
    const z = start + (CHUNK_LENGTH * i) / steps,
      o = typeof offset === "function" ? offset(z) : offset,
      w = typeof width === "function" ? width(z) : width;
    for (const edge of [-1, 1]) {
      const p = route.sample(z, o + (edge * w) / 2);
      positions.push(p.x, p.y + height, p.z - start);
      if (color) {
        const c = color(z);
        colors.push(c.r, c.g, c.b);
      }
    }
    if (i < steps) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  if (color)
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
export function waterRibbons(
  route: Route,
  start: number,
): THREE.BufferGeometry[] {
  return [
    ribbon(
      route,
      start,
      (z) => canalOffset(route, z),
      (z) => geographyAt(z).water * 20,
      -1.42,
    ),
    ribbon(route, start, 0, (z) => bridgeInfluence(route, z) * 76, -1.45),
  ];
}
