# V0.2 audit and priorities

Audited the existing V0 implementation before feature work, October 20, 2026.

| System             | Finding                                                                                                                       | V0.2 priority                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Endless generation | Seeded descriptors extend indefinitely with bounded retention. Route uses three periodic sine waves in a narrow lateral band. | Preserve streaming; add nonperiodic smooth noise and elevation.                                    |
| Rail seams         | Chunks sample one continuous route; seam and gauge tests pass.                                                                | Retain shared sampler; add 3D seam and grade tests.                                                |
| Tram               | Fixed 60 Hz simulation advances by arc length. Render reads discrete states.                                                  | Include vertical arc length, pitch alignment and render interpolation.                             |
| Camera             | Damping/rebasing work; mode changes snap and height is globally fixed.                                                        | Smooth transitions, terrain-relative offsets, adjustable distance/height and drag free-look.       |
| Ownership          | Unique geometry and instance buffers are disposed, shared assets survive; no recycling.                                       | Bounded instance-buffer pool with explicit ownership.                                              |
| Art                | Same three-column gable and three faceted tree balls. Fixed 12 / 8 m slots.                                                   | Varied silhouettes, arches, balconies, shutters, irregular gardens, multiple tree species.         |
| Geography          | Flat ground and canal; district changes only rename the HUD.                                                                  | Sculpted terrain, continuous weights and three real environment grammars.                          |
| Atmosphere         | Bright ambient, short fog range, pale grading; distant scenery follows the camera exactly.                                    | Stronger sun/shade contrast, blue sky, layered ridgelines, organic vegetation and restrained haze. |
| Performance        | Primitive instancing is useful; hot loop allocates sets/arrays/vectors. FPS uses capped simulation delta.                     | Cache retention plans, true wall-clock FPS, draw-call/resource telemetry, measured endurance.      |
| HUD                | Large card, dock and slogans compete with scenery.                                                                            | Preserve identity/controls with compact optional panels.                                           |

Order: route/motion/camera → terrain/biomes → Marigold architecture/gardens → countryside/waterfront → performance and browser endurance. Keep production on `main`; deliver V0.2 on a feature preview for review.
