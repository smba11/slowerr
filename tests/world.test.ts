import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { Route } from "../src/game/simulation/route";
import {
  geographyAt,
  groundHeight,
  bridgeCenter,
  bridgeInfluence,
} from "../src/game/world/geography";
import { noise1 } from "../src/game/simulation/noise";
import { generateChunk } from "../src/game/world/chunks";
import { terrainGeometry } from "../src/game/rendering/terrain";
import { AssetLibrary } from "../src/game/rendering/library";
import { renderChunk, disposeChunk } from "../src/game/rendering/town";
import { createTramState, stepTram } from "../src/game/simulation/tram";
import { requiredChunks, CHUNK_LENGTH } from "../src/game/world/chunks";

test("noise derivatives match finite differences and remain continuous at lattice edges", () => {
  for (const x of [-10, -0.2, 0, 0.48, 0.9999, 1, 200.27]) {
    const e = 1e-5,
      sample = noise1(7231, x),
      numeric =
        (noise1(7231, x + e).value - noise1(7231, x - e).value) / (2 * e);
    assert.ok(Math.abs(numeric - sample.derivative) < 1e-6);
  }
});
test("rail grades stay below 5% and 3D tram orientation agrees with track tangent", () => {
  for (const seed of ["amberline", "clementine", "mountains", "7"]) {
    const route = new Route(seed);
    for (let z = -5000; z < 10000; z += 13.7) {
      const p = route.sample(z);
      assert.ok(Math.abs(Math.tan(p.pitch)) < 0.05);
      const direction = new THREE.Vector3(0, 0, 1).applyEuler(
        new THREE.Euler(-p.pitch, p.heading, 0, "YXZ"),
      );
      assert.ok(
        direction.distanceTo(new THREE.Vector3(p.dx, p.dy, p.dz)) < 1e-10,
      );
      assert.ok(Math.abs(Math.hypot(p.dx, p.dy, p.dz) - 1) < 1e-12);
    }
  }
});
test("district weights are continuous and include three genuinely distinct grammars", () => {
  assert.equal(geographyAt(12).town, 1);
  assert.equal(geographyAt(490).country, 1);
  assert.equal(geographyAt(920).water, 1);
  for (let z = -1500; z < 5000; z += 1.1) {
    const a = geographyAt(z),
      b = geographyAt(z + 0.01);
    assert.ok(Math.abs(a.town + a.country + a.water - 1) < 1e-12);
    for (const key of ["town", "country", "water"] as const)
      assert.ok(Math.abs(a[key] - b[key]) < 0.001);
  }
  const town = generateChunk("amberline", 1),
    country = generateChunk("amberline", 7),
    water = generateChunk("amberline", 13);
  assert.ok(town.buildings.length > country.buildings.length);
  assert.ok(water.buildings.some((b) => b.offset < -30));
  assert.ok(country.trees.some((t) => Math.abs(t.offset) > 25));
});
test("terrain positions and lighting normals agree exactly at shared chunk edges", () => {
  const route = new Route("terrain");
  for (const start of [0, 360, 792, 1008, -72]) {
    const a = terrainGeometry(route, start),
      b = terrainGeometry(route, start + 72);
    const pa = a.getAttribute("position"),
      pb = b.getAttribute("position"),
      na = a.getAttribute("normal"),
      nb = b.getAttribute("normal");
    for (let i = 0; i <= 64; i++) {
      const k = pa.count - 65 + i;
      assert.ok(Math.abs(pa.getX(k) - pb.getX(i)) < 1e-4);
      assert.ok(Math.abs(pa.getY(k) - pb.getY(i)) < 1e-4);
      assert.ok(Math.abs(pa.getZ(k) - pb.getZ(i) - 72) < 1e-4);
      assert.ok(
        Math.hypot(
          na.getX(k) - nb.getX(i),
          na.getY(k) - nb.getY(i),
          na.getZ(k) - nb.getZ(i),
        ) < 1e-5,
      );
    }
    a.dispose();
    b.dispose();
  }
});
test("bridge corridors expose water below supported rails and clear structures", () => {
  const route = new Route("amberline"),
    z = bridgeCenter(route, 2);
  assert.equal(bridgeInfluence(route, z), 1);
  assert.ok(groundHeight(route, z, 0) < route.sample(z).y - 2.5);
  const chunk = generateChunk("amberline", Math.floor(z / 72));
  assert.ok(chunk.buildings.every((b) => bridgeInfluence(route, b.z) < 0.1));
});
test("streamed scenery reuses instance buffers and the recycling pool stays bounded", () => {
  const assets = new AssetLibrary(),
    route = new Route("reuse");
  for (let id = 0; id < 12; id++) {
    const chunk = renderChunk(generateChunk("reuse", id), route, assets);
    disposeChunk(chunk, assets);
    assert.ok(assets.pool.size <= 18);
  }
  assert.ok(assets.pool.reused > 30);
  assets.dispose();
  assert.equal(assets.pool.size, 0);
});
test("building silhouettes and planting vary while descriptors reproduce out of order", () => {
  const roofs = new Set<number>(),
    species = new Set<number>(),
    widths = new Set<number>();
  for (let id = 0; id < 30; id++) {
    const data = generateChunk("flowers", id);
    data.buildings.forEach((b) => {
      roofs.add(b.roof);
      widths.add(b.width);
    });
    data.trees.forEach((t) => species.add(t.species));
    for (const t of data.trees)
      assert.ok(
        !data.buildings.some(
          (b) =>
            Math.abs(b.z - t.z) < b.width / 2 + 1.7 &&
            Math.abs(b.offset - t.offset) < b.depth / 2 + 1.7,
        ),
      );
    assert.deepEqual(data, generateChunk("flowers", id));
  }
  assert.equal(roofs.size, 4);
  assert.equal(species.size, 4);
  assert.ok(widths.size > 100);
});

test("600 seconds of cruising crosses all districts with bounded complete chunk coverage", () => {
  const route = new Route("amberline"),
    assets = new AssetLibrary(),
    state = createTramState();
  const active = new Map<number, THREE.Group>(),
    visited = new Set<string>();
  let previousCenter = Infinity,
    retired = 0;
  for (let step = 0; step < 36000; step++) {
    stepTram(state, route, 18, 1 / 60);
    const center = Math.floor(state.progress / CHUNK_LENGTH);
    if (center !== previousCenter) {
      const needed = requiredChunks(state.progress, 4),
        keep = new Set(needed);
      for (const [id, chunk] of active)
        if (!keep.has(id)) {
          disposeChunk(chunk, assets);
          active.delete(id);
          retired++;
        }
      for (const id of needed)
        if (!active.has(id))
          active.set(
            id,
            renderChunk(generateChunk(route.seed, id), route, assets),
          );
      assert.equal(active.size, 9);
      assert.ok(
        active.has(center - 1) && active.has(center) && active.has(center + 1),
      );
      assert.ok(assets.pool.size <= 18);
      visited.add(geographyAt(state.progress).name);
      previousCenter = center;
    }
    assert.ok(Number.isFinite(state.progress));
    assert.ok(Math.abs(route.sample(state.progress).pitch) < 0.05);
  }
  assert.ok(state.elapsed > 599.99);
  assert.ok(state.distance > 2980);
  assert.equal(visited.size, 3);
  assert.ok(retired > 30);
  assert.ok(assets.pool.reused > 100);
  active.forEach((chunk) => disposeChunk(chunk, assets));
  assets.dispose();
});
