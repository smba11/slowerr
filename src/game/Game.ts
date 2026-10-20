import * as THREE from "three";
import { Route } from "./simulation/route";
import { createTramState, stepTram } from "./simulation/tram";
import {
  CHUNK_LENGTH,
  districtAt,
  generateChunk,
  requiredChunks,
} from "./world/chunks";
import { AssetLibrary } from "./rendering/library";
import { renderChunk, disposeChunk } from "./rendering/town";
import { createTram } from "./rendering/tram";
import { Environment } from "./environment/environment";
import { CameraRig } from "./camera/CameraRig";
import { FIXED_STEP, MAX_FRAME_TIME, PRESETS } from "./performance/quality";
import type { Settings, Telemetry } from "./types";

export class Game {
  private scene = new THREE.Scene();
  private renderer: THREE.WebGLRenderer;
  private camera = new THREE.PerspectiveCamera(46, 1, 0.1, 600);
  private rig = new CameraRig(this.camera);
  private assets = new AssetLibrary();
  private route: Route;
  private state = createTramState();
  private environment: Environment;
  private tram: THREE.Group;
  private chunks = new Map<number, THREE.Group>();
  private origin = new THREE.Vector3();
  private settings: Settings;
  private frameId = 0;
  private lastTime = 0;
  private accumulator = 0;
  private reportTime = 0;
  private frames = 0;
  private resizeObserver: ResizeObserver;
  private disposed = false;
  private lost = false;
  private audio?: AudioContext;
  constructor(
    private host: HTMLElement,
    seed: string,
    settings: Settings,
    private report: (t: Telemetry) => void,
    private onError: (message: string) => void,
  ) {
    this.settings = { ...settings };
    this.route = new Route(seed);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor("#d5e2d9");
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.setAttribute(
      "aria-label",
      "A golden tram travelling through a pastel town",
    );
    this.renderer.domElement.addEventListener(
      "webglcontextlost",
      this.contextLost,
    );
    host.append(this.renderer.domElement);
    this.environment = new Environment(this.scene, this.assets, seed);
    this.tram = createTram(this.assets);
    this.scene.add(this.tram);
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(host);
    document.addEventListener("visibilitychange", this.visibility);
    this.applySettings(settings);
    this.resize();
    // Keep the first nearby chunks ready; complete the horizon incrementally.
    for (const id of requiredChunks(this.state.progress, 1)) this.addChunk(id);
    this.frameId = requestAnimationFrame(this.frame);
  }
  applySettings(settings: Settings) {
    const changed = this.settings.quality !== settings.quality;
    this.settings = { ...settings };
    const preset = PRESETS[settings.quality];
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, preset.pixelRatio),
    );
    this.renderer.shadowMap.enabled = preset.shadows;
    if (this.environment.sun.shadow.mapSize.x !== preset.shadowSize) {
      this.environment.sun.shadow.map?.dispose();
      this.environment.sun.shadow.map = null;
      this.environment.sun.shadow.mapSize.set(
        preset.shadowSize,
        preset.shadowSize,
      );
    }
    if (changed)
      this.scene.traverse((o) => {
        if (o instanceof THREE.Mesh)
          for (const m of Array.isArray(o.material) ? o.material : [o.material])
            m.needsUpdate = true;
      });
    const fog = this.scene.fog as THREE.Fog;
    fog.near = preset.fogNear;
    fog.far = preset.fogFar;
    if (settings.paused) this.accumulator = 0;
  }
  private resize = () => {
    const { clientWidth: w, clientHeight: h } = this.host;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };
  private contextLost = (event: Event) => {
    event.preventDefault();
    this.lost = true;
    cancelAnimationFrame(this.frameId);
    this.onError(
      "The graphics context was interrupted. Reload to continue your journey.",
    );
  };
  private visibility = () => {
    cancelAnimationFrame(this.frameId);
    this.accumulator = 0;
    this.lastTime = 0;
    this.reportTime = 0;
    this.frames = 0;
    if (!document.hidden && !this.disposed && !this.lost)
      this.frameId = requestAnimationFrame(this.frame);
  };
  private addChunk(id: number) {
    const group = renderChunk(
      generateChunk(this.route.seed, id),
      this.route,
      this.assets,
    );
    group.position.set(-this.origin.x, 0, id * CHUNK_LENGTH - this.origin.z);
    this.scene.add(group);
    this.chunks.set(id, group);
  }
  private stream() {
    const ids = requiredChunks(
      this.state.progress,
      PRESETS[this.settings.quality].radius,
    );
    const keep = new Set(ids);
    for (const [id, chunk] of this.chunks)
      if (!keep.has(id)) {
        disposeChunk(chunk);
        this.chunks.delete(id);
      }
    const missing = ids.find((id) => !this.chunks.has(id));
    if (missing !== undefined) this.addChunk(missing);
  }
  private frame = (now: number) => {
    if (this.disposed || this.lost) return;
    const dt = this.lastTime
      ? Math.min((now - this.lastTime) / 1000, MAX_FRAME_TIME)
      : FIXED_STEP;
    this.lastTime = now;
    if (!this.settings.paused) {
      this.accumulator += dt;
      while (this.accumulator >= FIXED_STEP) {
        stepTram(this.state, this.route, this.settings.targetSpeed, FIXED_STEP);
        this.accumulator -= FIXED_STEP;
      }
    }
    const originZ =
      Math.floor(this.state.progress / CHUNK_LENGTH) * CHUNK_LENGTH;
    if (this.origin.z !== originZ) {
      const nextOrigin = new THREE.Vector3(
        this.route.sample(originZ).x,
        0,
        originZ,
      );
      this.rig.rebase(nextOrigin.clone().sub(this.origin));
      this.origin.copy(nextOrigin);
      for (const [id, group] of this.chunks)
        group.position.set(
          -this.origin.x,
          0,
          id * CHUNK_LENGTH - this.origin.z,
        );
    }
    this.stream();
    const p = this.route.sample(this.state.progress);
    this.tram.position.set(p.x - this.origin.x, 0.13, p.z - this.origin.z);
    this.tram.rotation.y = p.heading;
    this.tram.visible = this.settings.camera !== "cab";
    this.environment.update(this.tram.position);
    this.rig.update(
      this.route,
      this.state.progress,
      this.origin,
      this.settings.camera,
      dt,
      this.state.elapsed,
    );
    this.renderer.render(this.scene, this.camera);
    this.frames++;
    this.reportTime += dt;
    if (this.reportTime >= 0.25) {
      this.report({
        speed: this.state.speed * 3.6,
        distance: this.state.distance,
        elapsed: this.state.elapsed,
        fps: Math.round(this.frames / this.reportTime),
        chunks: this.chunks.size,
        district: districtAt(Math.floor(this.state.progress / CHUNK_LENGTH)),
      });
      this.frames = 0;
      this.reportTime = 0;
    }
    this.frameId = requestAnimationFrame(this.frame);
  };
  async bell() {
    this.audio ??= new AudioContext();
    await this.audio.resume();
    for (const offset of [0, 0.19])
      for (const frequency of [880, 1760, 2360]) {
        const osc = this.audio.createOscillator(),
          gain = this.audio.createGain();
        const start = this.audio.currentTime + offset;
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.055, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.1);
        osc.connect(gain);
        gain.connect(this.audio.destination);
        osc.start(start);
        osc.stop(start + 1.1);
      }
  }
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    this.resizeObserver.disconnect();
    document.removeEventListener("visibilitychange", this.visibility);
    this.renderer.domElement.removeEventListener(
      "webglcontextlost",
      this.contextLost,
    );
    this.chunks.forEach(disposeChunk);
    this.chunks.clear();
    this.environment.dispose();
    this.tram.traverse((o) => {
      if (o instanceof THREE.InstancedMesh) o.dispose();
      if (o instanceof THREE.Mesh && o.userData.uniqueGeometry)
        o.geometry.dispose();
      if (o instanceof THREE.Mesh && o.userData.uniqueMaterial)
        (o.material as THREE.Material).dispose();
    });
    this.assets.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    void this.audio?.close();
  }
}
