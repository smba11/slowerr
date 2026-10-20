# Architecture — V0.2

React owns settings and low-frequency telemetry. The imperative Three.js runtime owns animation, streaming, input and GPU resources. Simulation/world descriptors remain independent of rendering. The existing V0 shell, tram, controls and Vercel configuration are preserved.

## Modules

- `simulation/random.ts`, `noise.ts`: stable hash streams and C2 quintic value noise with analytic derivatives.
- `simulation/route.ts`: authoritative nonperiodic 3D route sampler with lateral offsets, normalized tangent, heading, pitch and arc-length derivative. Graded height stays below a 5% design limit.
- `simulation/tram.ts`: pure fixed 60 Hz acceleration/braking and midpoint arc-length integration. The runtime interpolates progress between simulation steps.
- `world/geography.ts`: continuous district weights, graded terrain, canal offsets and bridge corridors. Transitions span 110 meters, independent of chunk boundaries.
- `world/chunks.ts`: seeded serializable descriptors for irregular buildings, four roof families, four tree species and gardens. Structures/planting exclude bridge corridors and each other. Seed/position pairs reproduce identically.
- `rendering/terrain.ts`: shared-sampler road/rail strips, vertex-colored sculpted terrain and water. Boundary normals use central differences across seams to prevent lighting cracks.
- `rendering/architecture.ts`, `vegetation.ts`: reusable facade, roof, arch, balcony, shutter, planter, tree and flower grammars. Stucco has a deterministic locally generated brush texture; no external assets are fetched.
- `rendering/library.ts`, `InstancePool.ts`: shared primitives/materials and instance colors. GPU instance buffers use power-of-two capacities and an 18-entry bounded reuse pool.
- `rendering/town.ts`: assembles terrain, three scenery grammars, stone paving, track furniture, quays and bridges. Small flower/grass/paving batches have a separate distance LOD.
- `camera/CameraRig.ts`: terrain-relative chase, cab, cinematic and orbit views. Position/look/FOV damping, adjustable follow offsets, drag orbit, wheel zoom and double-click recenter. Mode changes smoothly reset orbit targets. Conservative footprint checks raise orbit views above buildings.
- `environment/environment.ts`: gradient sky, warm sunlight, rounded clouds, closed seeded distant ridgelines and haze. Environment cleanup includes shadow targets and materials.
- `performance/quality.ts`: bounded view distances, pixel-ratio caps and shadow resolutions.
- `Game.ts`: simulation interpolation, origin shifts, streaming/recycling, pointer input and real-time diagnostics.
- `ui/`: existing identity/keyboard controls with compact HUD, optional details, graphics/camera settings, district entry points and position-aware seed sharing.

## Streaming and lifecycle

Chunks remain 72 route meters. Current/adjacent chunks are ready at startup; farther chunks fill one per frame. Retention plans update only on center-chunk or quality changes. Low/Balanced/High retain at most 7/9/11 chunks. Fog ends before the retained forward horizon. Retired terrain/strip geometries are disposed; instance buffers are recycled; shared primitives/materials live until shutdown.

The origin shifts to the current chunk, moving camera position and smoothed look target by the same delta. GPU coordinates stay near zero. Hidden tabs stop simulation and clear catch-up time. Suspended browser hosts resume without fast-forwarding. Disposal removes listeners, animation callbacks, audio, shadow maps, pooled buffers and textures.

## Measurement and extensions

FPS uses uncapped real frame intervals; physics separately caps catch-up time. Canvas `data-*` diagnostics expose travel time/progress, active chunks/geometries, recycled batches, missing-current-chunk events, host suspensions and frame/streaming timings for QA. Diagnostics do not control gameplay.

Future districts extend geography and serializable descriptors. Stations, weather, day/night and authored assets belong in their existing module boundaries. No V0.3 work is included. See `docs/V02_AUDIT.md` and `docs/V02_VERIFICATION.md` for findings and evidence.
