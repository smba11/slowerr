import * as THREE from "three";
import { AssetLibrary, Batch } from "../rendering/library";
import { hashSeed, random } from "../simulation/random";
import { noise2 } from "../simulation/noise";
export class Environment {
  readonly sun = new THREE.DirectionalLight("#ffe2a5", 2.8);
  private clouds: THREE.Group;
  private sky: THREE.Mesh;
  private hills = new THREE.Group();
  private ground: THREE.Mesh;
  private ownedMaterials: THREE.Material[] = [];
  constructor(
    readonly scene: THREE.Scene,
    assets: AssetLibrary,
    seed: string,
  ) {
    scene.background = new THREE.Color("#b6d7dc");
    scene.fog = new THREE.Fog("#bdcfc4", 190, 310);
    scene.add(new THREE.HemisphereLight("#e3edf3", "#929459", 1.45));
    this.sun.position.set(-45, 80, 25);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    Object.assign(this.sun.shadow.camera, {
      left: -55,
      right: 55,
      top: 55,
      bottom: -55,
      near: 1,
      far: 220,
    });
    this.sun.shadow.bias = -0.0003;
    this.sun.shadow.normalBias = 0.13;
    scene.add(this.sun, this.sun.target);
    const skyMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {},
      vertexShader:
        "varying vec3 vSky; void main(){vSky=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader:
        "varying vec3 vSky; void main(){float h=clamp(normalize(vSky).y*1.5,0.,1.);vec3 horizon=vec3(.79,.87,.79);vec3 zenith=vec3(.28,.59,.76);vec3 col=mix(horizon,zenith,pow(h,.6));float glow=pow(max(0.,dot(normalize(vSky),normalize(vec3(-.6,.45,.4)))),28.);col+=vec3(.15,.1,.01)*glow;gl_FragColor=vec4(col,1.);}",
    });
    this.sky = new THREE.Mesh(
      new THREE.SphereGeometry(1600, 24, 16),
      skyMaterial,
    );
    this.sky.renderOrder = -10;
    this.sky.frustumCulled = false;
    scene.add(this.sky);
    this.ownedMaterials.push(skyMaterial);
    const rng = random(hashSeed(`${seed}:v02:sky`)),
      b = new Batch(assets);
    for (let i = 0; i < 24; i++) {
      const angle = rng() * Math.PI * 2,
        distance = 210 + rng() * 340,
        x = Math.sin(angle) * distance,
        z = Math.cos(angle) * distance,
        y = 75 + rng() * 60;
      for (let puff = 0; puff < 5; puff++)
        b.add(
          "leaf",
          puff % 2 ? "#f8efd5" : "#e6e8d7",
          x + puff * 6.5,
          y + Math.sin(puff) * 4,
          z + Math.cos(puff) * 2,
          10 + rng() * 8,
          5 + rng() * 5,
          7 + rng() * 6,
        );
    }
    this.clouds = b.finish();
    const cloudMaterial = new THREE.MeshBasicMaterial({
      color: "#ffffff",
      fog: false,
    });
    this.ownedMaterials.push(cloudMaterial);
    this.clouds.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.material = cloudMaterial;
        o.castShadow = false;
        o.receiveShadow = false;
      }
    });
    scene.add(this.clouds);
    const salt = hashSeed(`${seed}:horizon`);
    for (let layer = 0; layer < 3; layer++) {
      const positions: number[] = [],
        indices: number[] = [],
        segments = 128,
        radius = 370 + layer * 120;
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const h =
          50 +
          layer * 15 +
          noise2(
            salt ^ (layer * 4919),
            Math.sin(angle) * 3,
            Math.cos(angle) * 3,
          ) *
            18 +
          noise2(salt ^ 8221, Math.sin(angle) * 7, Math.cos(angle) * 7) * 5;
        positions.push(
          Math.sin(angle) * radius,
          -100,
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          h,
          Math.cos(angle) * radius,
        );
        if (i < segments) {
          const a = i * 2;
          indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      g.setIndex(indices);
      const m = new THREE.MeshBasicMaterial({
        color: ["#8cae9c", "#9bb9b0", "#abc7c1"][layer],
        side: THREE.DoubleSide,
        fog: false,
      });
      this.ownedMaterials.push(m);
      const ridge = new THREE.Mesh(g, m);
      ridge.renderOrder = -3 - layer;
      this.hills.add(ridge);
    }
    scene.add(this.hills);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: "#8aab78",
      roughness: 1,
    });
    this.ownedMaterials.push(groundMaterial);
    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(4000, 4000),
      groundMaterial,
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -18;
    scene.add(this.ground);
  }
  update(position: THREE.Vector3) {
    this.sky.position.set(position.x, 0, position.z);
    this.clouds.position.set(position.x * 0.96, 0, position.z * 0.96);
    this.hills.position.set(position.x, 0, position.z);
    this.ground.position.set(position.x, -18, position.z);
    this.sun.position.set(position.x - 45, position.y + 80, position.z + 25);
    this.sun.target.position.copy(position);
  }
  dispose() {
    this.clouds.traverse((o) => {
      if (o instanceof THREE.InstancedMesh) o.dispose();
    });
    this.hills.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    this.sky.geometry.dispose();
    this.ground.geometry.dispose();
    this.sun.shadow.dispose();
    this.ownedMaterials.forEach((m) => m.dispose());
  }
}
