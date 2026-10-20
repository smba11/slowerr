import * as THREE from "three";
import type { Route } from "../simulation/route";
import type { CameraMode } from "../types";
export class CameraRig {
  private look = new THREE.Vector3();
  private desired = new THREE.Vector3();
  private target = new THREE.Vector3();
  private initialized = false;
  private previousMode: CameraMode = "follow";
  constructor(readonly camera: THREE.PerspectiveCamera) {}
  rebase(delta: THREE.Vector3) {
    this.camera.position.sub(delta);
    this.look.sub(delta);
  }
  update(
    route: Route,
    progress: number,
    origin: THREE.Vector3,
    mode: CameraMode,
    dt: number,
    time: number,
  ) {
    const p = route.sample(progress);
    const forward = new THREE.Vector3(p.dx, 0, p.dz),
      right = new THREE.Vector3(p.dz, 0, -p.dx);
    this.target.set(p.x, 1.7, p.z).sub(origin);
    if (mode === "cab") {
      this.desired.copy(this.target).addScaledVector(forward, 2.25);
      this.desired.y = 2.72;
      this.target.addScaledVector(forward, 35);
      this.target.y = 2.6;
    } else if (mode === "cinematic") {
      this.desired
        .copy(this.target)
        .addScaledVector(forward, -16 + Math.sin(time * 0.035) * 5)
        .addScaledVector(right, -19);
      this.desired.y = 42;
      this.target.addScaledVector(forward, 3);
    } else {
      this.desired
        .copy(this.target)
        .addScaledVector(forward, -20)
        .addScaledVector(right, -2.5);
      this.desired.y = 9.5;
      this.target.addScaledVector(forward, 7);
      this.target.y = 1.8;
    }
    if (!this.initialized || mode !== this.previousMode) {
      this.camera.position.copy(this.desired);
      this.look.copy(this.target);
      this.initialized = true;
    } else {
      const alpha = 1 - Math.exp(-dt * (mode === "cab" ? 12 : 3));
      this.camera.position.lerp(this.desired, alpha);
      this.look.lerp(this.target, alpha);
    }
    this.camera.fov = mode === "cab" ? 68 : 46;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.look);
    this.previousMode = mode;
  }
}
