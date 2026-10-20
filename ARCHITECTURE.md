# Architecture

The React shell owns user settings and a low-frequency telemetry snapshot. The imperative game runtime owns its requestAnimationFrame loop and Three.js resources. React never renders individual world objects.

- `src/game/simulation/`: framework-free seeded RNG, continuous route, fixed-step tram physics. All coordinates use meters, speed uses m/s.
- `src/game/world/`: deterministic chunk descriptors and retention planning, independent of Three.js. Chunks have stable IDs and per-chunk random streams.
- `src/game/rendering/`: shared primitive/material library, instanced scenery, procedural tram, curved roads and rails, GPU ownership.
- `src/game/camera/`: damped follow, cinematic, and cab camera controller.
- `src/game/environment/`: sky, sunlight, fog, distant hills and clouds.
- `src/game/performance/`: graphics presets, capped pixel ratio, fixed timestep budget.
- `src/game/Game.ts`: lifecycle, streaming queue, input, simulation/render coordination and disposal.
- `src/ui/`: HUD and settings. Settings persist locally; seed lives in URL.
- `tests/`: deterministic generation, route continuity, physics, chunk retention, long-travel tests.

The route is an analytic seeded sum of smooth waves. Sampled tangents align the tram, buildings, sidewalks, rails and canal. Simulation advances route parameter by local arc-length derivative at 1/60s, independently from rendering. No route history or ever-growing cache is required.

Chunks cover 72 route meters. The current chunk and its immediate neighbors are ready before travel; farther chunks are generated one per frame. Missing chunks are prioritized by proximity. Retired chunks dispose their unique road geometry and instance buffers; shared geometry/materials survive until shutdown. A floating origin aligned to the current chunk keeps GPU coordinates small during long travel.

Scenery uses per-chunk InstancedMesh batches keyed by geometry/material with shared primitives. Fog hides streaming boundaries. Graphics presets change draw distance, pixel ratio and shadows. Runtime stops on hidden tabs, resets the accumulator on visibility changes, clears held keys on blur, and releases GPU/event/audio resources on unmount.

Extension points: enrich serializable ChunkData for district-specific props; replace primitive batches with art-directed assets; add station events to simulation; alter environment without coupling physics. V0 has no server or network runtime dependencies.
