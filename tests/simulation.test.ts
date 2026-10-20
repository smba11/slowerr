import { test } from "node:test";
import assert from "node:assert/strict";
import { Route } from "../src/game/simulation/route";
import { hashSeed, random } from "../src/game/simulation/random";
import { createTramState, stepTram } from "../src/game/simulation/tram";
import {
  CHUNK_LENGTH,
  generateChunk,
  requiredChunks,
} from "../src/game/world/chunks";

test("seed streams are repeatable, independent and in [0, 1)", () => {
  const a = random(hashSeed("amberline")),
    b = random(hashSeed("amberline")),
    c = random(hashSeed("different"));
  const first = Array.from({ length: 1000 }, a);
  assert.deepEqual(first, Array.from({ length: 1000 }, b));
  assert.notDeepEqual(first, Array.from({ length: 1000 }, c));
  assert.ok(first.every((n) => n >= 0 && n < 1));
});
test("chunk descriptors are identical after unloading and out-of-order generation", () => {
  const first = generateChunk("town", 14);
  for (let i = -10; i < 50; i++) generateChunk("town", i);
  assert.deepEqual(first, generateChunk("town", 14));
  assert.notDeepEqual(first, generateChunk("other", 14));
  assert.ok(
    first.buildings.every(
      (b) => b.z >= 14 * CHUNK_LENGTH && b.z < 15 * CHUNK_LENGTH,
    ),
  );
});
test("route tangents and rail offsets remain continuous across chunk boundaries", () => {
  const route = new Route("amberline");
  for (let i = -100; i <= 100; i++) {
    const z = i * CHUNK_LENGTH,
      before = route.sample(z - 0.0001),
      after = route.sample(z + 0.0001);
    assert.ok(Math.abs(before.x - after.x) < 0.001);
    assert.ok(Math.abs(before.heading - after.heading) < 0.001);
    const left = route.sample(z, -0.74),
      right = route.sample(z, 0.74);
    assert.ok(
      Math.abs(Math.hypot(left.x - right.x, left.z - right.z) - 1.48) < 1e-10,
    );
    assert.deepEqual(after, new Route("amberline").sample(z + 0.0001));
  }
});
test("tram accelerates smoothly, reaches target, brakes and never reverses", () => {
  const state = createTramState(),
    route = new Route("test");
  stepTram(state, route, 36, 1 / 60);
  assert.ok(Math.abs(state.speed - 0.8 / 60) < 1e-12);
  for (let i = 0; i < 1200; i++) stepTram(state, route, 18, 1 / 60);
  assert.equal(state.speed, 5);
  const distance = state.distance;
  for (let i = 0; i < 600; i++) stepTram(state, route, 0, 1 / 60);
  assert.equal(state.speed, 0);
  assert.ok(state.distance > distance);
  const stopped = state.distance;
  stepTram(state, route, -10, 1);
  assert.equal(state.distance, stopped);
  stepTram(state, route, 99, 100);
  assert.equal(state.speed, 10);
});
test("simulation travel follows arc length rather than route parameter speed", () => {
  const route = new Route("arc-length"),
    state = { ...createTramState(), speed: 5 };
  let measured = 0;
  for (let i = 0; i < 10000; i++) {
    const before = route.sample(state.progress);
    stepTram(state, route, 18, 1 / 60);
    const after = route.sample(state.progress);
    measured += Math.hypot(after.x - before.x, after.z - before.z);
  }
  assert.ok(Math.abs(measured - state.distance) < 0.01);
});
test("chunk retention stays bounded over 100,000 km and at negative coordinates", () => {
  for (const z of [-10000, -1, 0, 71.999, 72, 20000, 1e8]) {
    const ids = requiredChunks(z, 3),
      center = Math.floor(z / CHUNK_LENGTH);
    assert.equal(ids.length, 7);
    assert.equal(new Set(ids).size, 7);
    assert.equal(ids[0], center);
    assert.ok(ids.every((id) => Math.abs(id - center) <= 3));
    const data = generateChunk("endless", center);
    assert.ok(data.trees.length <= 36);
    const p = new Route("endless").sample(z);
    assert.ok(Number.isFinite(p.x));
    assert.ok(Number.isFinite(p.heading));
  }
});
test("identical fixed steps produce identical journeys and invalid dt does nothing", () => {
  const a = createTramState(),
    b = createTramState(),
    route = new Route("fixed");
  for (let i = 0; i < 3600; i++) {
    const target = i < 1800 ? 18 : 9;
    stepTram(a, route, target, 1 / 60);
    stepTram(b, route, target, 1 / 60);
  }
  assert.deepEqual(a, b);
  stepTram(a, route, 18, NaN);
  stepTram(a, route, 18, -1);
  assert.deepEqual(a, b);
});
