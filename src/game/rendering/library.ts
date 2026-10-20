import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { InstancePool } from "./InstancePool";
import { random } from "../simulation/random";
export const PALETTE = [
  "#edc66c",
  "#d98668",
  "#f0e1b3",
  "#97b5ad",
  "#e8b48c",
  "#93b7c5",
  "#c58e92",
  "#d9dbb2",
  "#daae6b",
];
export class AssetLibrary {
  readonly pool = new InstancePool();
  geometries = new Map<string, THREE.BufferGeometry>();
  materials = new Map<string, THREE.MeshStandardMaterial>();
  textures: THREE.Texture[] = [];
  private paint?: THREE.CanvasTexture;
  constructor() {
    this.geometries.set("box", new THREE.BoxGeometry(1, 1, 1));
    this.geometries.set("sphere", new THREE.SphereGeometry(1, 10, 7));
    this.geometries.set("leaf", new THREE.SphereGeometry(1, 12, 8));
    this.geometries.set("petal", new THREE.SphereGeometry(1, 5, 3));
    this.geometries.set("grass", new THREE.ConeGeometry(1, 1, 3, 1, true));
    this.geometries.set("softbox", new RoundedBoxGeometry(1, 1, 1, 2, 0.07));
    this.geometries.set("hip", new THREE.ConeGeometry(1, 1, 4));
    this.geometries.set("cone", new THREE.ConeGeometry(1, 1, 8));
    this.geometries.set("cylinder", new THREE.CylinderGeometry(1, 1, 1, 8));
    const shape = new THREE.Shape();
    shape.moveTo(-0.5, 0);
    shape.lineTo(0, 1);
    shape.lineTo(0.5, 0);
    shape.closePath();
    const roof = new THREE.ExtrudeGeometry(shape, {
      depth: 1,
      bevelEnabled: false,
    });
    roof.translate(0, 0, -0.5);
    this.geometries.set("roof", roof);
    const archShape = new THREE.Shape();
    archShape.moveTo(-0.5, -0.65);
    archShape.lineTo(0.5, -0.65);
    archShape.lineTo(0.5, 0);
    archShape.absarc(0, 0, 0.5, 0, Math.PI, false);
    archShape.closePath();
    const arch = new THREE.ExtrudeGeometry(archShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSize: 0.025,
      bevelThickness: 0.025,
      bevelSegments: 2,
      steps: 1,
      curveSegments: 10,
    });
    this.geometries.set("arch", arch);
    const bridge = new THREE.Shape();
    bridge.moveTo(-5.6, -2.9);
    bridge.lineTo(-5.6, 0.1);
    bridge.lineTo(5.6, 0.1);
    bridge.lineTo(5.6, -2.9);
    bridge.lineTo(4.5, -2.9);
    bridge.bezierCurveTo(3.5, -0.65, -3.5, -0.65, -4.5, -2.9);
    bridge.closePath();
    this.geometries.set(
      "bridgearch",
      new THREE.ExtrudeGeometry(bridge, {
        depth: 0.35,
        bevelEnabled: false,
        curveSegments: 14,
      }),
    );
    this.materials.set(
      "terrain",
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        vertexColors: true,
        roughness: 1,
      }),
    );
    if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 256;
      const ctx = canvas.getContext("2d")!,
        rng = random(57119);
      ctx.fillStyle = "#fffef7";
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 1200; i++) {
        ctx.fillStyle =
          i % 3
            ? `rgba(123,115,91,${0.012 + rng() * 0.045})`
            : "rgba(255,255,255,0.2)";
        ctx.beginPath();
        ctx.ellipse(
          rng() * 256,
          rng() * 256,
          2 + rng() * 15,
          0.5 + rng() * 2.5,
          rng() * 0.4,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      this.paint = new THREE.CanvasTexture(canvas);
      this.paint.colorSpace = THREE.SRGBColorSpace;
      this.paint.wrapS = this.paint.wrapT = THREE.RepeatWrapping;
      this.textures.push(this.paint);
    }
    this.materials.set(
      "painted",
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        map: this.paint ?? null,
        roughness: 1,
      }),
    );
  }
  material(color: string) {
    if (!this.materials.has(color))
      this.materials.set(
        color,
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.95,
          flatShading: false,
        }),
      );
    return this.materials.get(color)!;
  }
  dispose() {
    this.pool.dispose();
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.textures.forEach((t) => t.dispose());
  }
}
/** Collect local transforms into GPU instance batches; shared assets belong to the library. */
export class Batch {
  private entries = new Map<
    string,
    { geometry: string; colors: string[]; matrices: THREE.Matrix4[] }
  >();
  private frame = new THREE.Matrix4();
  private dummy = new THREE.Object3D();
  constructor(private assets: AssetLibrary) {}
  setFrame(x: number, y: number, z: number, yaw = 0) {
    this.frame.makeRotationY(yaw);
    this.frame.setPosition(x, y, z);
  }
  add(
    geometry: string,
    color: string,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    rx = 0,
    ry = 0,
    rz = 0,
  ) {
    const key = geometry;
    if (!this.entries.has(key))
      this.entries.set(key, { geometry, colors: [], matrices: [] });
    this.dummy.position.set(x, y, z);
    this.dummy.scale.set(sx, sy, sz);
    this.dummy.rotation.set(rx, ry, rz);
    this.dummy.updateMatrix();
    this.entries
      .get(key)!
      .matrices.push(
        new THREE.Matrix4().multiplyMatrices(this.frame, this.dummy.matrix),
      );
    this.entries.get(key)!.colors.push(color);
  }
  finish(): THREE.Group {
    const group = new THREE.Group();
    const tint = new THREE.Color();
    for (const { geometry, colors, matrices } of this.entries.values()) {
      const mesh = this.assets.pool.acquire(
        this.assets.geometries.get(geometry)!,
        this.assets.material(geometry === "softbox" ? "painted" : "#ffffff"),
        matrices.length,
      );
      matrices.forEach((m, i) => {
        mesh.setMatrixAt(i, m);
        mesh.setColorAt(i, tint.set(colors[i]));
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.computeBoundingSphere();
      group.add(mesh);
    }
    return group;
  }
}
