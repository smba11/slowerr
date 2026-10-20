# Tram Game Development Rules

Read GAME_DESIGN.md, ARCHITECTURE.md, and ROADMAP.md before major feature work.
Use TypeScript, React, Vite, and Three.js. No paid services, API keys, accounts, multiplayer, or backend infrastructure.
Keep simulation independent from rendering; separate movement, camera, environment, world generation, UI, and performance.
Use deterministic seeds. Stream and dispose chunks without interrupting travel. Preserve working features and keep the production branch stable.
Work on feature branches for nontrivial changes. Complete coherent milestones. Run lint, logic tests, and production builds. Browser-test visuals and interactions when tools are available. Never claim unperformed verification.
Update ROADMAP.md and documentation with milestones. Report changes, checks, remaining work, and known issues.
Prioritize a relaxing seamless journey, cohesive original pastel visuals, smooth performance, procedural variety, and accessible controls.

## V0.2 world review rules

- Keep V0.2 on its feature branch and deliver a preview for review; do not merge or deploy it over the stable production release without the user's review.
- Route position, height, tangent and grade must come from the shared pure sampler. Keep tram pitch, arc-length integration, ground placement and camera offsets consistent with it.
- District density, terrain and surface transitions use continuous geographic weights. Do not introduce random values tied to render order or frame timing.
- Chunk boundaries must match in both geometry position and terrain lighting normals. Test shared edges after terrain changes.
- Return retired instance buffers to the bounded pool; dispose unique terrain/strip geometry and release all shared resources at shutdown.
- Keep frame-rate measurements based on uncapped wall time. Distinguish startup, automation suspensions, simulation tests, and actual uninterrupted browser travel.
- Preserve W/S, Space, C, B, H, seed sharing, camera selection, quality presets and responsive HUD behavior.
- Do not begin V0.3 work before the user reviews the V0.2 world, movement and visual benchmark.
