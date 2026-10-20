# V0 verification

Verified October 20, 2026 on Node 24.14 and the Codex desktop in-app Chromium browser, using the production build served by `vite preview` at 1280 × 720.

## Automated checks

- `npm run lint`: passes, no warnings.
- `npm test`: all nine tests pass.
- `npm run build`: TypeScript and Vite succeed. Three.js vendor bundle is approximately 509 kB / 130 kB gzip; Vite prints a non-blocking 500 kB chunk-size advisory.

Tests cover reproducible random streams, out-of-order chunk regeneration, seed variation, route tangent continuity, rail gauge, smooth acceleration and stopping, arc-length movement, fixed-step reproducibility, bounded chunk planning at very large distances, camera continuity under floating-origin shifts, rendered road seams, per-instance colors, and owned-versus-shared resource disposal.

The 100,000 km check exercises the mathematical route and chunk planner. It is not a claim of a 100,000 km browser endurance run.

## Browser checks performed

- 3D town, tram, curved rails, tree-lined sidewalks, shadows, roof courses, and canal render successfully.
- The tram accelerates from rest to its cruise target; setting the slider to zero produces gradual braking (18 → 13 → 0 km/h).
- Pause freezes journey time/distance; resuming continues travel. Opening Settings also pauses travel.
- Follow and driver views show the street; the final aerial cinematic framing shows the tram and surrounding town without the earlier roof obstruction.
- Graphics selections update and persist across reloads; the world retains a bounded set of nearby chunks as travel crosses boundaries.
- W and S adjust speed by keyboard; C changes camera.
- The bell action completes and shows its feedback. Audio synthesis runs without errors; audible output was not independently assessed.
- Hide/restore interface works; share action reports successful seed-link copy.
- Entering `clementine` through Settings updates `?seed=clementine`, rebuilds the world, and resets journey progress.
- Browser console check reports no warnings or errors.

## Limits and follow-up

Frame-rate observations are specific to the current browser and machine and vary during setup, capture, and shader compilation; no broad hardware benchmark is claimed. Mobile GPU support, prolonged memory endurance, and additional browsers are unverified. Art is an original procedural low-poly V0 interpretation of the references; richer district layouts and a hand-painted asset pipeline remain future work. No stations, bridges, weather, pedestrians, or day/night cycle are implemented.
