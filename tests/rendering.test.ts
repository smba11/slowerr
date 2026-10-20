import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { Route } from "../src/game/simulation/route";
import { CameraRig } from "../src/game/camera/CameraRig";
import { AssetLibrary } from "../src/game/rendering/library";
import { renderChunk, disposeChunk } from "../src/game/rendering/town";
import { CHUNK_LENGTH, generateChunk } from "../src/game/world/chunks";

test("floating origin preserves camera position across streaming boundaries", () => {
  const camera = new THREE.PerspectiveCamera(),
    rig = new CameraRig(camera),
    route = new Route("camera");
  const origin = new THREE.Vector3();
  rig.update(route, 72, origin, "follow", 1 / 60, 10);
  const before = camera.position.clone(),
    nextOrigin = new THREE.Vector3(route.sample(72).x, 0, 72);
  rig.rebase(nextOrigin);
  rig.update(route, 72, nextOrigin, "follow", 1 / 60, 10);
  assert.ok(camera.position.clone().add(nextOrigin).distanceTo(before) < 1e-9);
});

test("rendered road seams meet and retiring chunks release only owned resources", () => {
  const assets = new AssetLibrary(),
    route = new Route("seams");
  const a = renderChunk(generateChunk("seams", 0), route, assets),
    b = renderChunk(generateChunk("seams", 1), route, assets);
  const roadA = a.children[2] as THREE.Mesh,
    roadB = b.children[2] as THREE.Mesh;
  const posA = roadA.geometry.getAttribute("position"),
    posB = roadB.geometry.getAttribute("position");
  for (let edge = 0; edge < 2; edge++) {
    const i = posA.count - 2 + edge;
    assert.ok(Math.abs(posA.getX(i) - posB.getX(edge)) < 1e-4);
    assert.ok(Math.abs(posA.getZ(i) - posB.getZ(edge) - CHUNK_LENGTH) < 1e-4);
  }
  let batches = 0,
    ownedDisposed = false,
    sharedDisposed = false;
  a.traverse((o) => {
    if (o instanceof THREE.InstancedMesh) {
      batches++;
      assert.equal(o.instanceColor?.count, o.count);
    }
  });
  assert.ok(
    batches <= 5,
    `expected at most five geometry batches, got ${batches}`,
  );
  roadA.geometry.addEventListener("dispose", () => {
    ownedDisposed = true;
  });
  assets.geometries.get("box")!.addEventListener("dispose", () => {
    sharedDisposed = true;
  });
  disposeChunk(a);
  assert.equal(ownedDisposed, true);
  assert.equal(sharedDisposed, false);
  disposeChunk(b);
  assets.dispose();
  assert.equal(sharedDisposed, true);
});
