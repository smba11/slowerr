import * as THREE from "three";
import { Route } from "./simulation/route";
import { createTramState, stepTram } from "./simulation/tram";
import { geographyAt, groundHeight } from "./world/geography";
import { CHUNK_LENGTH, generateChunk, requiredChunks } from "./world/chunks";
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
  private camera = new THREE.PerspectiveCamera(49, 1, 0.1, 2200);
  private rig = new CameraRig(this.camera);
  private assets = new AssetLibrary();
  private route: Route;
  private state = createTramState();
  private previousProgress = this.state.progress;
  private environment: Environment;
  private tram: THREE.Group;
  private chunks = new Map<number, THREE.Group>();
  private planned: number[] = [];
  private plannedCenter = Infinity;
  private plannedRadius = 0;
  private pointer: { x: number; y: number; id: number } | null = null;
  private maxFrameMs = 0;
  private gaps = 0;
  private suspensions = 0;
  private maxStreamMs = 0;
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
    startProgress = 12,
  ) {
    this.settings = { ...settings };
    this.route = new Route(seed);
    this.state.progress = Number.isFinite(startProgress)
      ? Math.max(-1e7, Math.min(1e7, startProgress))
      : 12;
    this.previousProgress = this.state.progress;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor("#d5e2d9");
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
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
    this.renderer.domElement.style.touchAction = "none";
    this.renderer.domElement.addEventListener("pointerdown", this.pointerDown);
    this.renderer.domElement.addEventListener("wheel", this.wheel, {
      passive: false,
    });
    this.renderer.domElement.addEventListener("dblclick", this.resetLook);
    window.addEventListener("pointermove", this.pointerMove);
    window.addEventListener("pointerup", this.pointerUp);
    window.addEventListener("blur", this.pointerUp);
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
    const started = performance.now();
    const data = generateChunk(this.route.seed, id);
    const group = renderChunk(data, this.route, this.assets);
    group.userData.colliders = data.buildings.map((b) => {
      const p = this.route.sample(b.z, b.offset);
      return {
        x: p.x,
        z: p.z,
        top: groundHeight(this.route, b.z, b.offset) + b.floors * 2.75 + 3,
        radius: Math.hypot(b.width, b.depth) / 2 + 0.6,
      };
    });
    group.position.set(-this.origin.x, 0, id * CHUNK_LENGTH - this.origin.z);
    const detail = group.getObjectByName("details");
    if (detail)
      detail.visible =
        Math.abs(id - Math.floor(this.state.progress / CHUNK_LENGTH)) <= 2;
    this.scene.add(group);
    this.chunks.set(id, group);
    this.maxStreamMs = Math.max(this.maxStreamMs, performance.now() - started);
  }
  private stream() {
    const center = Math.floor(this.state.progress / CHUNK_LENGTH),
      radius = PRESETS[this.settings.quality].radius;
    if (center !== this.plannedCenter || radius !== this.plannedRadius) {
      this.planned = requiredChunks(this.state.progress, radius);
      this.plannedCenter = center;
      this.plannedRadius = radius;
      for (const [id, chunk] of this.chunks) {
        if (Math.abs(id - center) > radius) {
          disposeChunk(chunk, this.assets);
          this.chunks.delete(id);
        } else {
          const details = chunk.getObjectByName("details");
          if (details) details.visible = Math.abs(id - center) <= 2;
        }
      }
    }
    const missing = this.planned.find((id) => !this.chunks.has(id));
    if (missing !== undefined) this.addChunk(missing);
    if (!this.chunks.has(center)) this.gaps++;
  }
  private pointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    this.pointer = { x: event.clientX, y: event.clientY, id: event.pointerId };
    this.renderer.domElement.setPointerCapture(event.pointerId);
  };
  private pointerMove = (event: PointerEvent) => {
    if (!this.pointer || event.pointerId !== this.pointer.id) return;
    this.rig.orbit(
      event.clientX - this.pointer.x,
      event.clientY - this.pointer.y,
    );
    this.pointer.x = event.clientX;
    this.pointer.y = event.clientY;
  };
  private pointerUp = () => {
    this.pointer = null;
  };
  private wheel = (event: WheelEvent) => {
    event.preventDefault();
    this.rig.dolly(event.deltaY);
  };
  private resetLook = () => this.rig.resetLook();
  private avoid = (camera: THREE.Vector3, target: THREE.Vector3) => {
    const cx = camera.x + this.origin.x,
      cz = camera.z + this.origin.z,
      tx = target.x + this.origin.x,
      tz = target.z + this.origin.z;
    const dx = cx - tx,
      dz = cz - tz,
      length2 = dx * dx + dz * dz;
    const p = this.route.sample(cz),
      lateral = (cx - p.x) * Math.cos(p.heading);
    camera.y = Math.max(camera.y, groundHeight(this.route, cz, lateral) + 2.8);
    for (const group of this.chunks.values())
      for (const c of group.userData.colliders as {
        x: number;
        z: number;
        top: number;
        radius: number;
      }[]) {
        if (Math.abs(c.z - tz) > 65) continue;
        const t = THREE.MathUtils.clamp(
          ((c.x - tx) * dx + (c.z - tz) * dz) / Math.max(1, length2),
          0.15,
          1,
        );
        if ((tx + dx * t - c.x) ** 2 + (tz + dz * t - c.z) ** 2 < c.radius ** 2)
          camera.y = Math.max(
            camera.y,
            Math.min(75, target.y + (c.top + 0.7 - target.y) / t),
          );
      }
  };
  private frame = (now: number) => {
    if (this.disposed || this.lost) return;
    let realDt = this.lastTime
      ? Math.max(0.001, (now - this.lastTime) / 1000)
      : FIXED_STEP;
    if (realDt > 1) {
      this.suspensions++;
      realDt = FIXED_STEP;
      this.accumulator = 0;
      this.previousProgress = this.state.progress;
      this.reportTime = 0;
      this.frames = 0;
    }
    const dt = Math.min(realDt, MAX_FRAME_TIME);
    this.maxFrameMs = Math.max(this.maxFrameMs, realDt * 1000);
    this.lastTime = now;
    if (!this.settings.paused) {
      this.accumulator += dt;
      while (this.accumulator >= FIXED_STEP) {
        this.previousProgress = this.state.progress;
        stepTram(this.state, this.route, this.settings.targetSpeed, FIXED_STEP);
        this.accumulator -= FIXED_STEP;
      }
    }
    const renderProgress = this.settings.paused
      ? this.state.progress
      : this.previousProgress +
        ((this.state.progress - this.previousProgress) * this.accumulator) /
          FIXED_STEP;
    const originZ = Math.floor(renderProgress / CHUNK_LENGTH) * CHUNK_LENGTH;
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
    const p = this.route.sample(renderProgress);
    this.tram.position.set(
      p.x - this.origin.x,
      p.y + 0.13,
      p.z - this.origin.z,
    );
    this.tram.rotation.set(-p.pitch, p.heading, 0, "YXZ");
    this.tram.visible = this.settings.camera !== "cab";
    this.environment.update(this.tram.position);
    this.rig.update(
      this.route,
      renderProgress,
      this.origin,
      this.settings.camera,
      dt,
      this.state.elapsed,
      {
        distance: this.settings.followDistance,
        height: this.settings.followHeight,
        avoid: this.avoid,
      },
    );
    this.renderer.render(this.scene, this.camera);
    this.frames++;
    this.reportTime += realDt;
    if (this.reportTime >= 0.25) {
      this.report({
        speed: this.state.speed * 3.6,
        distance: this.state.distance,
        elapsed: this.state.elapsed,
        fps: Math.round(this.frames / this.reportTime),
        chunks: this.chunks.size,
        district: geographyAt(this.state.progress).name,
        progress: this.state.progress,
        drawCalls: this.renderer.info.render.calls,
        geometries: this.renderer.info.memory.geometries,
        recycled: this.assets.pool.reused,
        frameMs: Math.round((this.reportTime / this.frames) * 10000) / 10,
      });
      Object.assign(this.renderer.domElement.dataset, {
        progress: this.state.progress.toFixed(2),
        seconds: this.state.elapsed.toFixed(2),
        chunks: String(this.chunks.size),
        fps: String(Math.round(this.frames / this.reportTime)),
        geometries: String(this.renderer.info.memory.geometries),
        recycled: String(this.assets.pool.reused),
        gaps: String(this.gaps),
        maxFrameMs: this.maxFrameMs.toFixed(1),
        maxStreamMs: this.maxStreamMs.toFixed(1),
        suspensions: String(this.suspensions),
        district: geographyAt(this.state.progress).name,
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
    this.chunks.forEach((chunk) => disposeChunk(chunk, this.assets));
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
    this.renderer.domElement.removeEventListener(
      "pointerdown",
      this.pointerDown,
    );
    this.renderer.domElement.removeEventListener("wheel", this.wheel);
    this.renderer.domElement.removeEventListener("dblclick", this.resetLook);
    window.removeEventListener("pointermove", this.pointerMove);
    window.removeEventListener("pointerup", this.pointerUp);
    window.removeEventListener("blur", this.pointerUp);
    this.renderer.dispose();
    this.renderer.domElement.remove();
    void this.audio?.close();
  }
}
