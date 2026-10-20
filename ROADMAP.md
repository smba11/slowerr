# Roadmap

## V0 — playable foundation (complete)

- [x] Modular React + TypeScript + Three.js project
- [x] Seeded curved route, acceleration and braking
- [x] Follow, cinematic, and cab cameras
- [x] Pastel town, trees, sidewalks, lights, canal
- [x] Bounded chunk streaming and floating origin
- [x] Polished controls, pause, graphics, seed sharing
- [x] Logic tests, lint, production build, browser verification
- [x] GitHub milestone commit and Vercel-ready static configuration

Validation details and limits: [VERIFICATION.md](VERIFICATION.md).

## V0.2 — world and experience overhaul (verification)

- [x] Audit V0 and preserve its shell, branding, controls and hosting
- [x] Nonperiodic 3D track, grade limits, pitch alignment and interpolated motion
- [x] Smooth camera transitions, drag free-look, zoom and adjustable follow offsets
- [x] Sculpted terrain, seamless normals and gradual district blending
- [x] Marigold architecture/gardens benchmark and reusable art grammars
- [x] Willow countryside, Azure canals and stone bridges
- [x] Bounded buffer recycling, detail LOD and real-time diagnostics
- [x] Expanded 16-test suite, lint and production build
- [ ] Final browser controls/visual checks and uninterrupted travel measurement
- [ ] Feature preview for review; stable production unchanged

V0.2 [audit](docs/V02_AUDIT.md) and [verification](docs/V02_VERIFICATION.md). Do not begin V0.3 before the user reviews the core world, movement and visual benchmark.

## V1 — a town with stories

Stations and optional stops, bridges and intersecting streets, authored district grammars, richer façade shapes, pedestrians and flower gardens.

## V2 — changing skies

Day/night, weather, original ambient soundscape, accessibility options, photo mode and more art-directed scenery.

## Performance follow-up

Measure across integrated/discrete GPUs; consider worker-based chunk descriptors and mesh LOD when district complexity warrants them. Desktop is the V0 target; touch controls are provided but mobile GPU support is not a V0 guarantee.
