import * as THREE from "three";
import { AssetLibrary, Batch } from "../rendering/library";
import { hashSeed, random } from "../simulation/random";
export class Environment {
  readonly sun = new THREE.DirectionalLight("#ffedc6", 2.6);
  private scenery: THREE.Group;
  constructor(
    readonly scene: THREE.Scene,
    assets: AssetLibrary,
    seed: string,
  ) {
    scene.background = new THREE.Color("#d5e2d9");
    scene.fog = new THREE.Fog("#d5e2d9", 95, 190);
    scene.add(new THREE.HemisphereLight("#f5f0d7", "#8c9d79", 2.1));
    this.sun.position.set(-35, 65, -25);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, {
      left: -55,
      right: 55,
      top: 55,
      bottom: -55,
      near: 1,
      far: 180,
    });
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.15;
    scene.add(this.sun, this.sun.target);
    const b = new Batch(assets);
    const rng = random(hashSeed(`${seed}:sky`));
    for (let i = 0; i < 22; i++) {
      const angle = (i / 22) * Math.PI * 2;
      b.add(
        "sphere",
        i % 2 ? "#a6b9a1" : "#b9c8ae",
        Math.sin(angle) * 250,
        -8,
        Math.cos(angle) * 250,
        55 + rng() * 60,
        22 + rng() * 40,
        65 + rng() * 35,
      );
    }
    for (let i = 0; i < 18; i++) {
      const x = (rng() - 0.5) * 500,
        z = (rng() - 0.5) * 500;
      for (let j = 0; j < 3; j++)
        b.add(
          "sphere",
          "#ecede0",
          x + j * 8,
          55 + rng() * 16,
          z,
          12,
          4 + rng() * 3,
          7,
        );
    }
    this.scenery = b.finish();
    this.scenery.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = false;
        o.receiveShadow = false;
      }
    });
    scene.add(this.scenery);
  }
  update(position: THREE.Vector3) {
    this.scenery.position.set(position.x, 0, position.z);
    this.sun.position.set(position.x - 35, 65, position.z - 25);
    this.sun.target.position.copy(position);
  }
  dispose() {
    this.scenery.traverse((o) => {
      if (o instanceof THREE.InstancedMesh) o.dispose();
    });
  }
}
