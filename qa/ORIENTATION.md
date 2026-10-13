# Icon and path orientation

Compass headings increase clockwise from north. deck.gl IconLayer angles rotate counterclockwise. The renderer now uses `noseHeading - heading - headingOffset` and `billboard: false`, so the icon and its route share the map plane when bearing or pitch changes.

The active research atlas uses fighter.svg, uncrewed.svg and support.svg (including the existing fallback). All three were inspected: 160 x 170 pixels, nose upward, fuselage pivot (80,85). Profile photos are unchanged. The root page redirects to this research atlas.

For new artwork, add `media.iconCalibration` to its entity record:

```json
{"width":240,"height":120,"anchorX":100,"anchorY":70,"noseHeading":315}
```

Dimensions and anchor are image pixels; the anchor is the aircraft center, not necessarily the rectangle center. Nose heading is clockwise from image-up: up=0, right=90, down=180, left=270; upper-left=315. Measure the tail-to-nose axis, not the image border. Existing headingOffset is an optional clockwise correction to the desired heading. Anchor bounds and dimensions are schema-validated. Original schematic defaults remain backward compatible.

Path-following actors now derive heading from their own displayed trajectory, including formation offsets. Sharp corners use the outgoing tangent; endpoints use the incoming tangent. Stationary holds retain the last travel direction, deterministically even when seeking backward. Explicit fixed/manual heading modes and all research records remain unchanged.

## Verification

- 40 unit tests, including cardinal directions, diagonal artwork, calibration bounds, turns, holds, manual/fixed headings, rotating formations, antimeridian crossing and all four scenarios.
- Edge rendered-pixel checks: 37 desktop plus 37 mobile-emulation cases. Test artwork has a red nose, blue tail and green pivot. Screenshots verify alignment against projected travel and pivot position, using the same actor layer factory as production.
- Rendered checks cover cardinal headings, rotated/tilted views, rectangular diagonal artwork with an off-center pivot, and moving actors in every scenario. Observed maximum error: 0.112 degrees and 0.894 pixels.
- The production app signals initial map readiness with aria-busy, allowing browser tests to wait for worker-backed map loading before switching views.

Run `npm test` and `npm run build -- --base=/NexGen-Air-Battlespace/research/` from research-app.
For rendered checks run the Vite development server on port 4191, then run `node qa/edge-orientation.cjs` from a scratch working directory with Playwright on NODE_PATH. NEXGEN_QA_URL can override the server URL. The orientation-qa.html fixture is for local QA; it is not included in the single-entry production build.
For full app checks, run `qa/edge-regression.cjs` with NEXGEN_TEST_URL pointing at the production preview or deployed research URL. Screenshots and JSON results are written to the working directory. Mobile coverage is Edge emulation, not a physical mobile browser.
