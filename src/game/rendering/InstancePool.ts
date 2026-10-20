import * as THREE from "three";
/** A small bounded pool recycles GPU instance buffers as old chunks retire. */
export class InstancePool {
  private idle: THREE.InstancedMesh[] = [];
  reused = 0;
  acquire(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    count: number,
  ): THREE.InstancedMesh {
    const index = this.idle.findIndex(
      (mesh) =>
        mesh.geometry === geometry &&
        mesh.instanceMatrix.count >= count &&
        mesh.instanceMatrix.count <= Math.max(16, count * 2),
    );
    let mesh: THREE.InstancedMesh;
    if (index >= 0) {
      mesh = this.idle.splice(index, 1)[0];
      this.reused++;
    } else
      mesh = new THREE.InstancedMesh(
        geometry,
        material,
        2 ** Math.ceil(Math.log2(Math.max(1, count))),
      );
    mesh.material = material;
    mesh.count = count;
    mesh.visible = true;
    return mesh;
  }
  release(mesh: THREE.InstancedMesh) {
    mesh.removeFromParent();
    if (this.idle.length < 18) this.idle.push(mesh);
    else mesh.dispose();
  }
  get size() {
    return this.idle.length;
  }
  dispose() {
    for (const mesh of this.idle) mesh.dispose();
    this.idle.length = 0;
  }
}
