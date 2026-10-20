# V0.2 verification

## Automated evidence

`npm run check` runs ESLint, Node/tsx tests, TypeScript checking, and the Vite production build. The expanded suite contains 16 tests, including the existing physics/seed/streaming tests and new coverage for nonperiodic noise derivatives, 3D tangent/pitch agreement, grades under 5%, continuous district weights, terrain edge positions and normals, bridge clearances, descriptor variation, structure/vegetation exclusion, and bounded instance recycling.

Browser results and endurance measurements are recorded below after the final production build is exercised. Isolated FPS readings are not a cross-hardware performance guarantee.

## Scope and limits

Desktop WebGL2 is the target. Three.js continues to produce a non-blocking approximately 509 kB vendor-chunk advisory (about 130 kB gzip). The world uses procedural 3D artwork and a locally generated stucco brush texture, not authored film assets. Canals follow the graded stylized landscape; water is decorative, without fluid simulation. Free-look remains attached to the tram, with conservative building-footprint avoidance rather than full physical collision. No multiplayer, accounts, backend, API keys or paid services were added.
