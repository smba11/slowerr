import * as THREE from "three";
export const PALETTE = [
  "#eccb8c",
  "#dca397",
  "#e2dfb5",
  "#9ebeb2",
  "#eac4a3",
  "#bbc6d0",
  "#d3b4b0",
];
export class AssetLibrary {
  geometries = new Map<string, THREE.BufferGeometry>();
  materials = new Map<string, THREE.MeshStandardMaterial>();
  textures: THREE.Texture[] = [];
  constructor() {
    this.geometries.set("box", new THREE.BoxGeometry(1, 1, 1));
    this.geometries.set("sphere", new THREE.IcosahedronGeometry(1, 1));
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
  }
  material(color: string) {
    if (!this.materials.has(color))
      this.materials.set(
        color,
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.95,
          flatShading: true,
        }),
      );
    return this.materials.get(color)!;
  }
  dispose() {
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
      const mesh = new THREE.InstancedMesh(
        this.assets.geometries.get(geometry)!,
        this.assets.material("#ffffff"),
        matrices.length,
      );
      matrices.forEach((m, i) => {
        mesh.setMatrixAt(i, m);
        mesh.setColorAt(i, tint.set(colors[i]));
      });
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.computeBoundingSphere();
      group.add(mesh);
    }
    return group;
  }
}
