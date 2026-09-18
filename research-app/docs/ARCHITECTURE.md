# Architecture and migration

## One research model, two projections

JSON → Zod validation → reference validation → `snapshot(scenario, time, catalog)` → map, graph, narrative and relationship panel.

Entities describe what something is. Scenario actors describe its role in that scenario. Locations own longitude/latitude. Relationships reference actor instances and retain independent evidence and timing. Citations attach to claims, scenarios, locations and links; source metadata is stored once.

`src/engine/timeline.ts` is pure and independent of React and WebGL. It supports arbitrary seeking and returns a phase, actor positions and active relationships without mutating source data. `useTimeline` supplies requestAnimationFrame playback; background-tab deltas are capped to avoid jumps. Playback stops at the end. A scenario change remounts the workspace and resets playback/selection. Switching views preserves time.

MapLibre owns the geographic camera. deck.gl's MapboxOverlay synchronizes paths, point markers, text and active links with it. The map fits the scenario's referenced locations on mount. D3 only computes the schematic force layout; React owns SVG output and accessible selection. Layout uses all scenario relationships so active-link changes do not cause graph movement. Layout coordinates exist only in the renderer, never in research JSON. Native WebGL map controls and keyboard-accessible entity buttons provide selection; the SVG nodes support Enter/Space.

## Adding behavior

Add domain fields to `schema.ts`, validate references, then adapt the pure engine before extending visual layers. Add a test for meaningful behavior (for example phase boundaries or broken citations). Do not encode aircraft performance using timeline duration. If multiple evidence claims are needed for scenario phases, introduce phase-level claim objects rather than overloading descriptive prose.

## Migration from the original

The original public `index.html` and `script.js` were inspected on 2026-09-17. They load `entities.json`/`missions.json`, place an SVG over a mission-map image, and expose mission selection and a phase slider. This implementation preserves those user concepts while replacing the rendering/data coupling. No original code or asset was overwritten.

1. Convert each original entity into independently sourced claims; retain uncertain material as notes until reviewed.
2. Create source records from the original military/manufacturer links; attach locators to individual claims.
3. Replace map-image pixel coordinates with named geographic locations, or use the automatic network layout for non-geographic concepts.
4. Turn mission participants into actor instances and generic lines into labeled, evidence-qualified relationships.
5. Turn phases into continuous presentation intervals and actor keyframes. Keep assumptions explicit.

## Source baseline

- User upload: `MI-CCA-Logistics-TTX-Executive-Summary.pdf`, 17 pages; page 7 informs the sweep example, pages 11–15 inform logistics context.
- User upload: `Logistics-While-Under-Attack-Key-to-a-CCA-Force-Design-WEB.pdf`, 40 PDF pages; Mark A. Gunzinger, February 2025. Background research context; not numerically reproduced.
- USAF F-35A fact sheet and March 3, 2025 CCA designation announcement are linked in source JSON.

The original project mirror reported six missing synced sources. This starter does not claim a complete migration of unavailable records. Uploaded PDF copies remain outside the app; `localFile` is an informational filename, not a broken download link.

## Validation boundaries

Schemas validate shape and enums; the catalog checks IDs, source references, location references, actor membership, ordered keyframes, phase coverage and relationship intervals. Build type-checks application code; `npm test` additionally validates the actual catalog. These checks cannot establish the truth of a research claim. Source review remains a human task.

Production map bundles are substantial because of WebGL libraries. Both renderers are presently bundled together for simplicity. A larger deployment can lazy-load them. No claims are made about large-dataset performance. The bundled Natural Earth land polygons avoid a tile-service dependency; network view remains the fallback for devices without WebGL.
