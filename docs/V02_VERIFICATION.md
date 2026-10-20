# V0.2 verification

## Automated evidence

`npm run check` passes: ESLint, all **17 tests**, TypeScript checking and the Vite production build. Coverage includes the existing physics/seed/streaming tests plus noise derivatives, 3D tangent/pitch agreement, grades under 5%, continuous district weights, terrain edge positions/normals, bridge clearances, descriptor variation, structure/vegetation exclusion and bounded buffer recycling.

The added endurance test executes **36,000 fixed steps / 600 simulated seconds**, generates/renders/retires chunk geometry across all three district types, travels over 2.98 km, maintains nine complete neighboring chunks, retires more than 30 chunks and reuses more than 100 instance batches. It passes. This is an accelerated Node/Three.js simulation-and-streaming test; it does not draw WebGL frames and is not a ten-minute browser run.

## Browser evidence

The production build was exercised through `vite preview` in the desktop in-app Chromium browser on October 20, 2026. Screenshots were captured at the browser's ordinary 1280×720 and 764×764 panel sizes; no mobile-device benchmark is claimed.

- Marigold, Willow and Azure render with distinct terrain/scenery. Captures show the narrower stone-paved town, hills/woods, canal-side route and bridges.
- Follow, cab and orbit views were inspected. Pointer dragging changed the orbit. Wheel zoom and double-click recenter actions completed. Follow distance/height controls changed to 22 m / 9 m and persisted through reloads.
- Camera cycling was checked through the rendered DOM. A stale orbit when returning to Follow was found and fixed; mode targets now recenter smoothly.
- Pause changes the control to Resume and shows the pause overlay; Continue wandering resumes. Settings pauses travel and its Azure shortcut opens the same seeded world at route position 920.
- H hides/restores the interface. Optional journey details expand. The bell action displays its feedback without errors; audible output was not independently evaluated.
- Console checks on the inspected scenes returned no warnings or errors.
- Seed/location navigation reproduces deterministic scenery. The mathematical determinism and past-chunk regeneration are also tested independently.

## Performance and endurance limit

Warm-up/active snapshots reached **60 FPS** on Gentle, Balanced and Lush during inspection. Other snapshots fell to **2–15 FPS**, and the embedded test host repeatedly suspended and eventually discarded tabs. These readings are not a reliable sustained hardware benchmark.

On the final attempted continuous run, an initial snapshot reported 9 chunks, 95 uploaded geometries, 0 missing-current-chunk events, 0.35 simulated seconds and no host suspensions. Subsequent snapshots still reported 9 chunks and 0 missing-current-chunk events, with 133 uploaded geometries and 16 recycled batches, but only 49.27 simulated seconds and 131 host suspensions. The maximum recorded construction time was 87.9 ms, **including startup**, rather than a steady-state frame budget. Upload counts increase as additional scenery types first enter the frustum; an extended GPU memory plateau has not been established.

**A clean, uninterrupted ten-minute rendered browser endurance run remains unverified.** The automated 600-second simulation/streaming check passes, but it does not substitute for that acceptance criterion. Repeat the rendered run in a continuously foreground desktop browser before production promotion. Inspect chunk seams, transitions, bridges, camera continuity, FPS and GPU-resource counts during that run.

## Review delivery

Implementation branch: `feat/v02-world-experience`. Draft PR: https://github.com/smba11/slowerr/pull/1. The Vercel feature preview builds successfully; `main` and the stable production release are unchanged. Before/after and district screenshots plus raw browser snapshots are retained in the ignored local `artifacts/v02/` folder. No V0.3 work was started.

## Scope and limits

Desktop WebGL2 is the target. Three.js continues to produce a non-blocking approximately 509 kB vendor-chunk advisory (about 130 kB gzip). The world uses procedural 3D artwork and a locally generated stucco brush texture, not authored film assets. Canals follow the graded stylized landscape; water is decorative, without fluid simulation. Free-look remains attached to the tram, with conservative building-footprint avoidance rather than full physical collision. No multiplayer, accounts, backend, API keys or paid services were added.
