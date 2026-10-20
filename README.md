# Slowerr

**Take the scenic route.** A playable, endless procedural tram journey. Vite + React + TypeScript + Three.js. Runs entirely in the browser, with no API keys, database, backend, paid APIs, external assets, or runtime network services.

[Play Slowerr](https://slowerr.vercel.app/) · [Verification notes](VERIFICATION.md)

V0.2 is under review on `feat/v02-world-experience`; the production link above remains the stable V0 release. The overhaul adds three blended landscapes, graded track, varied town architecture, gardens, canals/bridges, free-look, compact HUD and GPU buffer recycling. See the [V0.2 audit](docs/V02_AUDIT.md) and [verification](docs/V02_VERIFICATION.md).

## Run

Requires Node.js 22.12+ (Node 24 recommended).

```sh
npm ci
npm run dev
```

Open the Local URL Vite prints. The tram starts gently accelerating immediately.

```sh
npm run lint
npm test
npm run build
npm run preview
```

## Controls

| Control              | Action                                            |
| -------------------- | ------------------------------------------------- |
| W / Up, S / Down     | Hold to adjust cruise speed                       |
| Slider / − / +       | Set target speed, 0–36 km/h                       |
| Space                | Pause / resume                                    |
| C                    | Cycle follow, cinematic, driver’s seat, free look |
| Drag scenery         | Look around / orbit                               |
| Mouse wheel          | Zoom                                              |
| Double-click scenery | Recenter camera                                   |
| B                    | Ring bell (locally synthesized audio)             |
| H                    | Hide / show interface                             |
| Settings             | Graphics, camera, world seed                      |

Settings pause the simulation while open. Hidden tabs suspend travel. Braking to zero differs from pause: the tram decelerates smoothly. Seed links reproduce scenery at the shared route position, restarting journey time. Graphics and follow-camera preferences are stored locally; there are no accounts or cookies. Settings can jump to Marigold, Willow or Azure; uninterrupted cruising passes through all three. Journey details expands the compact HUD, and H hides it.

## Project map

```text
src/
  game/
    Game.ts                  # runtime lifecycle and integration
    simulation/              # pure RNG, route and tram movement
    world/                   # seeded town descriptors and chunk planner
    rendering/               # shared assets, instanced town and tram
    camera/                  # four damped views, free-look and zoom
    environment/             # sky, fog, sunlight, hills and clouds
    performance/             # graphics presets and simulation budgets
  ui/                        # React HUD, settings, icons and styling
tests/                       # deterministic world and physics tests
```

Read [GAME_DESIGN.md](GAME_DESIGN.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [ROADMAP.md](ROADMAP.md) for the design, ownership rules, and next milestones.

## Vercel

Import `smba11/slowerr` into the existing Vercel project. Use repository root, Vite framework preset, `npm run build`, and `dist` output. `vercel.json` includes those settings. No environment variables or integrations are required. Deploy a feature branch as a preview; promote a validated milestone to `main` for production. The static build is also compatible with other static hosts.

## V0.2 limits

Desktop WebGL2 is the target. Touch-accessible controls exist, but mobile GPU performance has not been certified. Art is procedural 3D with an illustrated palette and brush-textured stucco, not a full hand-painted asset pipeline. V0.2 has three district grammars, decorative canals and stone bridges; stations, weather, pedestrians and day/night remain future milestones. Physics is deterministic at fixed steps; visual frame timing depends on the browser/GPU. Very long travel uses a floating origin; JavaScript floating-point limits still apply at astronomical distances.
