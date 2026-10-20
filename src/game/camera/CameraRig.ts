import * as THREE from "three";
import type { Route } from "../simulation/route";
import type { CameraMode } from "../types";
export class CameraRig {
  private look = new THREE.Vector3();
  private desired = new THREE.Vector3();
  private target = new THREE.Vector3();
  private forward = new THREE.Vector3();
  private right = new THREE.Vector3();
  private initialized = false;
  private previousMode: CameraMode | null = null;
  private yaw = 0;
  private tilt = 0;
  private zoom = 1;
  constructor(readonly camera: THREE.PerspectiveCamera) {}
  rebase(delta: THREE.Vector3) {
    this.camera.position.sub(delta);
    this.look.sub(delta);
  }
  orbit(dx: number, dy: number) {
    this.yaw -= dx * 0.005;
    this.tilt = THREE.MathUtils.clamp(this.tilt + dy * 0.006, -0.65, 0.85);
  }
  dolly(delta: number) {
    this.zoom = THREE.MathUtils.clamp(
      this.zoom * Math.exp(delta * 0.001),
      0.65,
      1.7,
    );
  }
  resetLook() {
    this.yaw = 0;
    this.tilt = 0;
    this.zoom = 1;
  }
  update(
    route: Route,
    progress: number,
    origin: THREE.Vector3,
    mode: CameraMode,
    dt: number,
    time: number,
    options: {
      distance: number;
      height: number;
      avoid?: (camera: THREE.Vector3, target: THREE.Vector3) => void;
    } = { distance: 21, height: 8 },
  ) {
    if (this.previousMode !== null && mode !== this.previousMode)
      this.resetLook();
    this.previousMode = mode;
    const p = route.sample(progress);
    this.forward.set(p.dx, p.dy, p.dz);
    this.right.set(Math.cos(p.heading), 0, -Math.sin(p.heading));
    this.target.set(p.x, p.y + 1.7, p.z).sub(origin);
    const distance = options.distance * this.zoom;
    if (mode === "cab") {
      this.desired.copy(this.target).addScaledVector(this.forward, 2.25);
      this.desired.y = p.y + 2.72;
      const direction = new THREE.Vector3(
        Math.sin(p.heading + this.yaw),
        Math.tan(p.pitch - this.tilt),
        Math.cos(p.heading + this.yaw),
      ).normalize();
      this.target.copy(this.desired).addScaledVector(direction, 35);
    } else if (mode === "cinematic") {
      this.desired
        .copy(this.target)
        .addScaledVector(this.forward, -16 + Math.sin(time * 0.035) * 6)
        .addScaledVector(this.right, -18);
      this.desired.y = p.y + 35;
      this.target.addScaledVector(this.forward, 6);
    } else {
      const angle = p.heading + this.yaw + (mode === "free" ? -0.55 : 0);
      this.desired.copy(this.target);
      this.desired.x -= Math.sin(angle) * distance;
      this.desired.z -= Math.cos(angle) * distance;
      this.desired.y =
        p.y +
        Math.max(
          3.2,
          options.height + this.tilt * 19 + (mode === "free" ? 6 : 0),
        );
      this.target.addScaledVector(this.forward, mode === "free" ? 0 : 5);
      options.avoid?.(this.desired, this.target);
    }
    if (!this.initialized) {
      this.camera.position.copy(this.desired);
      this.look.copy(this.target);
      this.initialized = true;
    } else {
      const alpha = 1 - Math.exp(-dt * (mode === "cab" ? 7 : 3.6));
      this.camera.position.lerp(this.desired, alpha);
      this.look.lerp(this.target, alpha);
    }
    const fov = mode === "cab" ? 65 : 49;
    if (Math.abs(this.camera.fov - fov) > 0.01) {
      this.camera.fov += (fov - this.camera.fov) * (1 - Math.exp(-dt * 5));
      this.camera.updateProjectionMatrix();
    }
    this.camera.lookAt(this.look);
  }
}
